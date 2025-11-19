# Backend Architecture

## Overview

The backend is built using Next.js 14 API Route Handlers with a layered architecture approach. The system uses Supabase (PostgreSQL) as the primary database, Redis (Upstash) for caching, and integrates with external services like Judge0 for code execution.

## Architecture Pattern

### Three-Layer Architecture

```
┌──────────────────────────────────────┐
│         API Route Handlers           │
│         (Controllers)                │
│  - Request validation               │
│  - Authentication checks            │
│  - Response formatting              │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│        Business Logic Layer          │
│        (Inline Services)             │
│  - Business rules                   │
│  - Data transformation              │
│  - External service calls           │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│        Data Access Layer             │
│        (Repositories)                │
│  - Supabase client queries          │
│  - Redis caching                    │
│  - Data mapping                     │
└──────────────────────────────────────┘
```

### Current Implementation

The backend currently uses a **simplified layered approach** where:
- **Controllers**: API route handlers (`app/api/**/*.ts`)
- **Services**: Business logic inline in route handlers
- **Repositories**: Direct Supabase client calls with caching

## API Route Structure

### Organization

```
app/api/
├── admin/                      # Super admin endpoints
│   ├── organizations/
│   │   ├── route.ts           # GET, POST
│   │   └── [orgId]/
│   │       ├── route.ts       # GET, PUT, DELETE
│   │       ├── users/         # Org user management
│   │       ├── courses/       # Org course management
│   │       ├── exams/         # Org exam management
│   │       └── stats/         # Org statistics
│   ├── exams/
│   │   └── ongoing/           # Active exams monitoring
│   └── stats/                 # Global statistics
├── teacher/                    # Teacher endpoints
│   ├── courses/
│   ├── exams/
│   ├── submissions/
│   └── stats/
├── student/                    # Student endpoints
│   ├── courses/
│   ├── exams/
│   ├── submissions/
│   └── progress/
└── auth/                      # Authentication endpoints
    ├── login/
    ├── register/
    └── reset-password/
```

### Route Handler Pattern

**Standard Structure:**

```typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'
import { getCached, invalidateCache } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

// GET /api/resource
export async function GET(request: NextRequest) {
  try {
    // 1. Initialize Supabase client
    const supabase = createSupabaseServerClient()
    
    // 2. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Get user profile with authorization
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    // 4. Check permissions
    if (userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Fetch data (with caching)
    const data = await getCached(
      `cache-key:${user.id}`,
      async () => {
        const { data } = await supabase
          .from('table')
          .select('*')
        return data
      },
      300 // 5 minutes
    )

    // 6. Return response
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error in GET /api/resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resource
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validationResult = schema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error },
        { status: 400 }
      )
    }

    // 2-4. Auth and authorization (same as GET)
    
    // 5. Process request
    const { data, error } = await supabase
      .from('table')
      .insert(validationResult.data)
      .select()
      .single()

    if (error) throw error

    // 6. Invalidate related caches
    await invalidateCache('related-cache-key')

    // 7. Return response
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    logger.error('Error in POST /api/resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Validation Layer

### Zod Schemas

**Purpose**: Runtime type validation and type inference

**Pattern:**
```typescript
import { z } from 'zod'

// Define schema
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  organization_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
})

// Infer TypeScript type
type CreateCourseInput = z.infer<typeof createCourseSchema>

// Validate
const result = createCourseSchema.safeParse(data)
if (!result.success) {
  // Handle validation errors
  return NextResponse.json(
    { error: 'Validation failed', details: result.error.issues },
    { status: 400 }
  )
}

// Use validated data
const validData = result.data
```

### Validation Best Practices

1. **Always validate user input**: Never trust client data
2. **Use safeParse**: Graceful error handling
3. **Return detailed errors in dev**: Help debugging
4. **Generic errors in prod**: Don't leak implementation details
5. **Validate early**: Before business logic

## Error Handling

### Error Response Format

**Standard Error Response:**
```typescript
{
  error: string,           // Human-readable message
  code?: string,           // Error code (optional)
  details?: any,          // Additional details (dev only)
  timestamp?: string      // ISO timestamp (optional)
}
```

### HTTP Status Codes

- **200 OK**: Successful GET request
- **201 Created**: Successful POST with resource creation
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid auth, insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server errors

### Error Handling Pattern

```typescript
try {
  // Business logic
} catch (error) {
  // Log error with context
  logger.error('Operation failed:', {
    operation: 'createCourse',
    userId: user.id,
    error: error.message,
  })

  // Return appropriate error
  if (error.code === '23505') { // PostgreSQL unique violation
    return NextResponse.json(
      { error: 'Resource already exists' },
      { status: 409 }
    )
  }

  // Generic error
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

## Logging

### Logger Utility

**Location**: `lib/utils/logger.ts`

**Features:**
- Environment-aware (dev vs. prod)
- Multiple log levels
- Structured logging support
- Performance measurement

**Usage:**
```typescript
import { logger } from '@/lib/utils/logger'

// Development only
logger.log('Debug info:', data)
logger.info('Info message')
logger.debug('Debug details')

// Always logged (dev + prod)
logger.warn('Warning message')
logger.error('Error occurred:', error)

// Performance tracking
logger.log('⏱️ Query took:', performance.now() - start, 'ms')
```

### Logging Best Practices

1. **Log errors**: Always log errors with context
2. **Log important operations**: User actions, data changes
3. **Include user/request context**: Help debugging
4. **Don't log sensitive data**: Passwords, tokens, PII
5. **Use appropriate levels**: error, warn, info, debug
6. **Add performance markers**: For slow operations

## Caching Strategy

### Redis Caching (Upstash)

**Location**: `lib/redis/client.ts`

**Cache Patterns:**

#### 1. Cache-Aside (Lazy Loading)

```typescript
import { getCached, CacheKeys, CacheTTL } from '@/lib/redis/client'

const data = await getCached(
  CacheKeys.course(courseId),
  async () => {
    // Fetch from database
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    return data
  },
  CacheTTL.medium // 5 minutes
)
```

#### 2. Cache Invalidation

```typescript
import { invalidateCache } from '@/lib/redis/client'

// After update
await supabase
  .from('courses')
  .update(updates)
  .eq('id', courseId)

// Invalidate cache
await invalidateCache(CacheKeys.course(courseId))
```

#### 3. Bulk Invalidation

```typescript
// Invalidate multiple related keys
await Promise.all([
  invalidateCache(CacheKeys.course(courseId)),
  invalidateCache(CacheKeys.courseEnrollments(courseId)),
  invalidateCache(CacheKeys.courses(`org:${orgId}`)),
])
```

### Cache Key Naming

**Convention**: `entity:identifier:detail`

**Examples:**
```typescript
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  course: (courseId: string) => `course:${courseId}`,
  courses: (filters: string) => `courses:list:${filters}`,
  exam: (examId: string) => `exam:${examId}`,
  examBySlug: (slug: string) => `exam:slug:${slug}`,
}
```

### Cache TTL Strategy

```typescript
export const CacheTTL = {
  short: 60,        // 1 min - Rapidly changing data
  medium: 300,      // 5 min - Moderately changing data
  long: 900,        // 15 min - Stable data
  veryLong: 3600,   // 1 hour - Rarely changing data
}
```

**Guidelines:**
- **User profiles**: medium (5 min)
- **Course listings**: long (15 min)
- **Static content**: veryLong (1 hour)
- **Real-time data**: Don't cache or short (1 min)
- **Statistics**: medium to long (5-15 min)

### Graceful Degradation

```typescript
export function getRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('Redis not configured. Caching will be disabled.')
    return null
  }
  // Initialize client
}
```

**Behavior**: If Redis is unavailable:
1. Log warning
2. Continue without caching
3. Fetch directly from database
4. No application errors

## Rate Limiting

### Implementation

**Current State**: Basic rate limiting via Upstash Redis

**Pattern:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { getRedisClient } from '@/lib/redis/client'

const redis = getRedisClient()

const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
}) : null

export async function POST(request: NextRequest) {
  if (ratelimit) {
    const identifier = request.ip ?? 'anonymous'
    const { success } = await ratelimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
  }
  
  // Continue with request handling
}
```

### Rate Limit Strategies

**By Endpoint Type:**
- **Authentication**: 5 requests per minute
- **Read Operations**: 60 requests per minute
- **Write Operations**: 20 requests per minute
- **Expensive Queries**: 10 requests per minute

**Identifier Options:**
1. IP Address: For public endpoints
2. User ID: For authenticated endpoints
3. API Key: For API access

## Security

### Security Headers

**Recommended Headers:**
```typescript
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data)
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}
```

**Better Approach**: Configure in `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}
```

### Input Sanitization

1. **SQL Injection**: Prevented by Supabase prepared statements
2. **XSS**: Sanitize user input before storage
3. **Path Traversal**: Validate file paths
4. **Command Injection**: Never execute user input

### Authentication Flow

```typescript
// 1. Get user from Supabase auth
const { data: { user }, error } = await supabase.auth.getUser()

// 2. Verify user exists
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// 3. Get user profile and permissions
const { data: profile } = await supabase
  .from('users')
  .select('role, organization_id')
  .eq('id', user.id)
  .single()

// 4. Check authorization
if (!hasPermission(profile.role, requiredRole)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Authorization Levels

**Role Hierarchy:**
1. **super_admin**: Full system access
2. **admin**: Organization-level access
3. **teacher**: Course/exam management
4. **student**: Read-only + own submissions

**Permission Check:**
```typescript
function canAccessResource(
  userRole: string,
  userOrgId: string,
  resourceOrgId: string
): boolean {
  // Super admin can access everything
  if (userRole === 'super_admin') return true
  
  // Admin can access own organization
  if (userRole === 'admin' && userOrgId === resourceOrgId) return true
  
  // Teacher can access own courses
  if (userRole === 'teacher' && userOrgId === resourceOrgId) return true
  
  return false
}
```

## Database Access

### Supabase Client

**Server-side Client:**
```typescript
// lib/database/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### Query Patterns

#### 1. Simple Query
```typescript
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .eq('id', courseId)
  .single()
```

#### 2. Join Query
```typescript
const { data, error } = await supabase
  .from('courses')
  .select(`
    *,
    instructor:users!instructor_id(full_name, email),
    organization:organizations(name)
  `)
  .eq('id', courseId)
  .single()
```

#### 3. Filtered Query
```typescript
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .eq('organization_id', orgId)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(10)
```

#### 4. Count Query
```typescript
const { count, error } = await supabase
  .from('courses')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)
```

### Transaction Handling

**Note**: Supabase doesn't directly support transactions in the client. Use PostgreSQL functions for complex operations.

**Alternative**: RPC calls
```typescript
const { data, error } = await supabase
  .rpc('create_course_with_enrollment', {
    course_data: courseData,
    student_ids: studentIds,
  })
```

## External Service Integration

### Judge0 API (Code Execution)

**Location**: `lib/judge0.ts`

**Pattern:**
```typescript
async function submitCode(
  code: string,
  languageId: number,
  stdin?: string
) {
  const response = await fetch(
    `${process.env.JUDGE0_API_URL}/submissions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin,
      }),
    }
  )
  
  const { token } = await response.json()
  return token
}
```

### Email Service (Mailjet)

**Location**: `lib/email/*.ts`

**Pattern:**
```typescript
import Mailjet from 'node-mailjet'

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
)

async function sendEmail(to: string, subject: string, html: string) {
  await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [{
      From: {
        Email: process.env.FROM_EMAIL,
        Name: process.env.FROM_NAME,
      },
      To: [{ Email: to }],
      Subject: subject,
      HTMLPart: html,
    }],
  })
}
```

## Performance Considerations

### Database Query Optimization

1. **Select only needed fields**: Don't use `select('*')`
2. **Use indexes**: Ensure indexed columns in WHERE clauses
3. **Limit results**: Always paginate large datasets
4. **Batch operations**: Use bulk inserts/updates
5. **Avoid N+1 queries**: Use joins or batch fetching

### Caching Strategy

1. **Cache expensive queries**: Complex joins, aggregations
2. **Invalidate on updates**: Keep cache consistent
3. **Use appropriate TTL**: Based on data volatility
4. **Monitor hit rate**: Adjust strategy as needed

### Async Operations

```typescript
// Parallel execution
const [courses, exams, stats] = await Promise.all([
  fetchCourses(),
  fetchExams(),
  fetchStats(),
])

// Sequential when dependent
const user = await fetchUser()
const profile = await fetchProfile(user.id)
```

## Testing Strategy

### Current State
- Manual API testing
- No automated backend tests
- TypeScript for type safety

### Recommended Additions

1. **Unit Tests**: Test business logic
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test full workflows
4. **Load Tests**: Test performance under load

## Related Documentation

- [Architecture Overview](./overview.md)
- [Frontend Architecture](./frontend.md)
- [Backend Hardening ADR](../adr/0002-backend-hardening.md)
- [Operations Runbook](../runbooks/operations.md)
