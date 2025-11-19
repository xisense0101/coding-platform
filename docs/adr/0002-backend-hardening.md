# ADR 0002: Backend Hardening and Standardization

**Status**: Accepted

**Date**: 2024-11-18

**Context**: Standardizing backend API patterns, validation, error handling, logging, and security

## Decision

We have standardized our backend architecture with consistent patterns for validation, error handling, logging, caching, rate limiting, and security headers across all API route handlers.

## Context and Problem Statement

As the application grows, we need consistent patterns for:
1. **Input Validation**: Prevent invalid data from reaching business logic
2. **Error Handling**: Provide consistent error responses
3. **Logging**: Track operations and debug issues
4. **Security**: Protect against common vulnerabilities
5. **Performance**: Cache expensive operations
6. **Rate Limiting**: Prevent abuse

Without standardization:
- Inconsistent error messages confuse clients
- Security vulnerabilities may be introduced
- Debugging becomes difficult
- Performance degrades without caching
- APIs are vulnerable to abuse

## Architecture Layers

### 1. Route Handler (Controller)

**Responsibilities:**
- Request validation
- Authentication/authorization
- Response formatting
- Error handling

### 2. Business Logic (Services)

**Responsibilities:**
- Business rules enforcement
- Data transformation
- External service calls
- Transaction coordination

**Current State**: Inline in route handlers (simplified approach)

### 3. Data Access (Repository)

**Responsibilities:**
- Database queries
- Cache management
- Data mapping

**Current State**: Direct Supabase client calls with Redis caching

## Validation Strategy

### Technology: Zod

**Why Zod?**
- ✅ Runtime validation + TypeScript types
- ✅ Composable schemas
- ✅ Detailed error messages
- ✅ Schema inference
- ✅ Transform capabilities
- ✅ Async validation support

**Alternatives Considered:**
- **Joi**: More verbose, no TypeScript inference
- **Yup**: Less TypeScript-friendly
- **class-validator**: Requires decorators, class-based

### Validation Pattern

```typescript
import { z } from 'zod'

// 1. Define schema
const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  organization_id: z.string().uuid("Invalid organization ID"),
  instructor_id: z.string().uuid("Invalid instructor ID"),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
  max_students: z.number().int().positive().optional(),
})

// 2. Infer TypeScript type
type CreateCourseInput = z.infer<typeof createCourseSchema>

// 3. Validate in route handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    const validation = createCourseSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }
    
    // Use validated data
    const validData = validation.data
    
    // Process request...
  } catch (error) {
    // Error handling...
  }
}
```

### Common Validation Patterns

#### Email Validation
```typescript
email: z.string().email("Invalid email address")
```

#### UUID Validation
```typescript
id: z.string().uuid("Invalid ID format")
```

#### Date Validation
```typescript
date: z.string().datetime("Invalid date format")
// Or with coercion
date: z.coerce.date()
```

#### Enum Validation
```typescript
role: z.enum(['admin', 'teacher', 'student'])
```

#### Nested Object Validation
```typescript
user: z.object({
  name: z.string(),
  email: z.string().email(),
  profile: z.object({
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
  })
})
```

#### Array Validation
```typescript
tags: z.array(z.string()).min(1).max(10)
```

#### Custom Validation
```typescript
password: z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[0-9]/, "Password must contain number")
```

## Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
  error: string           // Human-readable message
  code?: string          // Error code for client handling
  details?: any          // Additional context (dev mode)
  timestamp?: string     // ISO 8601 timestamp
}
```

### HTTP Status Code Standards

| Code | Use Case | Example |
|------|----------|---------|
| 200 | Successful GET | Resource retrieved |
| 201 | Successful POST | Resource created |
| 204 | Successful DELETE | Resource deleted |
| 400 | Validation error | Invalid input |
| 401 | Not authenticated | Missing/invalid token |
| 403 | Not authorized | Insufficient permissions |
| 404 | Resource not found | ID doesn't exist |
| 409 | Conflict | Duplicate resource |
| 429 | Rate limit | Too many requests |
| 500 | Server error | Unexpected error |

### Error Handling Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Business logic
    const result = await performOperation()
    return NextResponse.json(result, { status: 201 })
    
  } catch (error) {
    // Log error with context
    logger.error('Operation failed', {
      endpoint: '/api/resource',
      method: 'POST',
      userId: user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // PostgreSQL error codes
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          error: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE'
        },
        { status: 409 }
      )
    }
    
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          error: 'Referenced resource not found',
          code: 'FOREIGN_KEY_VIOLATION'
        },
        { status: 400 }
      )
    }
    
    // Generic error (don't leak details in production)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { 
          details: error.message 
        })
      },
      { status: 500 }
    )
  }
}
```

### Common PostgreSQL Error Codes

- `23505`: Unique violation (duplicate)
- `23503`: Foreign key violation
- `23502`: Not null violation
- `42P01`: Undefined table
- `42703`: Undefined column

## Logging Strategy

### Logger Utility

**Location**: `lib/utils/logger.ts`

**Design Principles:**
1. **Environment-aware**: Different logs for dev/prod
2. **Structured**: Consistent format for parsing
3. **Contextual**: Include relevant metadata
4. **Performance-conscious**: Minimal overhead

### Log Levels

```typescript
logger.log()    // Development only - debug info
logger.info()   // Development only - informational
logger.debug()  // Development only - detailed debug
logger.warn()   // Always logged - warnings
logger.error()  // Always logged - errors
```

### Logging Best Practices

#### 1. Log Request Context
```typescript
logger.info('Processing request', {
  method: request.method,
  path: request.url,
  userId: user.id,
  userRole: userProfile.role,
  organizationId: userProfile.organization_id,
})
```

#### 2. Log Errors with Context
```typescript
logger.error('Database query failed', {
  operation: 'fetchCourses',
  userId: user.id,
  organizationId: orgId,
  error: error.message,
  stack: error.stack,
})
```

#### 3. Log Performance Metrics
```typescript
const startTime = performance.now()
// ... operation ...
const duration = performance.now() - startTime

logger.log(`Operation completed in ${duration.toFixed(2)}ms`, {
  operation: 'fetchCourses',
  duration,
  resultCount: courses.length,
})
```

#### 4. Don't Log Sensitive Data
```typescript
// ❌ Bad
logger.log('User login', { email, password })

// ✅ Good
logger.log('User login', { email })
```

#### 5. Use Appropriate Levels
```typescript
logger.error()  // Requires immediate attention
logger.warn()   // Potential issues
logger.info()   // Important events
logger.log()    // General information
logger.debug()  // Detailed debugging
```

### Structured Logging Format

```typescript
{
  timestamp: '2024-11-18T10:30:00.000Z',
  level: 'error',
  message: 'Database query failed',
  context: {
    operation: 'fetchCourses',
    userId: 'user-123',
    organizationId: 'org-456',
  },
  error: {
    message: 'Connection timeout',
    code: 'ETIMEDOUT',
    stack: '...'
  }
}
```

## Security Implementation

### 1. Authentication Pattern

```typescript
export async function GET(request: NextRequest) {
  // Create Supabase client
  const supabase = createSupabaseServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Check authentication
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Continue with authorized request...
}
```

### 2. Authorization Pattern

```typescript
// Get user profile with role
const { data: userProfile } = await supabase
  .from('users')
  .select('role, organization_id')
  .eq('id', user.id)
  .single()

// Check permissions
if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
  return NextResponse.json(
    { error: 'Forbidden - Admin access required' },
    { status: 403 }
  )
}

// Check organization access
if (
  userProfile.role !== 'super_admin' && 
  userProfile.organization_id !== requestedOrgId
) {
  return NextResponse.json(
    { error: 'Forbidden - Organization access denied' },
    { status: 403 }
  )
}
```

### 3. Security Headers

**Implementation**: Configure in `next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

### 4. Rate Limiting

**Implementation**: Using Upstash Redis

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { getRedisClient } from '@/lib/redis/client'

const redis = getRedisClient()

// Create rate limiter
const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit',
}) : null

export async function POST(request: NextRequest) {
  // Check rate limit
  if (ratelimit) {
    const identifier = user?.id ?? request.ip ?? 'anonymous'
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          limit,
          remaining,
          reset: new Date(reset).toISOString(),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }
  }
  
  // Continue processing...
}
```

**Rate Limit Recommendations:**

| Endpoint Type | Rate Limit | Window |
|--------------|------------|--------|
| Authentication | 5 requests | 1 minute |
| Read operations | 60 requests | 1 minute |
| Write operations | 20 requests | 1 minute |
| Expensive queries | 10 requests | 1 minute |
| File uploads | 5 requests | 5 minutes |

### 5. Input Sanitization

```typescript
import { z } from 'zod'

// Sanitize string inputs
const sanitizedString = z.string()
  .trim()
  .max(1000, "Input too long")
  .transform(s => s.replace(/[<>]/g, '')) // Remove HTML tags

// Validate file uploads
const fileSchema = z.object({
  name: z.string().regex(/^[\w\-. ]+$/, "Invalid filename"),
  size: z.number().max(10 * 1024 * 1024, "File too large"), // 10MB
  type: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
})
```

## Caching Strategy

### Cache-Aside Pattern

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

### Cache Invalidation

```typescript
import { invalidateCache, CacheKeys } from '@/lib/redis/client'

// After update
await supabase
  .from('courses')
  .update(updates)
  .eq('id', courseId)

// Invalidate related caches
await Promise.all([
  invalidateCache(CacheKeys.course(courseId)),
  invalidateCache(CacheKeys.courses(`org:${orgId}`)),
  invalidateCache(CacheKeys.courseEnrollments(courseId)),
])
```

### Cache TTL Guidelines

```typescript
export const CacheTTL = {
  short: 60,        // 1 min - Real-time data
  medium: 300,      // 5 min - Frequently updated
  long: 900,        // 15 min - Stable data
  veryLong: 3600,   // 1 hour - Rarely changes
}
```

**Mapping:**
- **User profiles**: medium (5 min)
- **Course listings**: long (15 min)
- **Statistics**: medium (5 min)
- **Configuration**: veryLong (1 hour)
- **Active exams**: short (1 min)

## Complete Route Handler Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'
import { getCached, invalidateCache, CacheKeys, CacheTTL } from '@/lib/redis/client'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedisClient } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

// Rate limiter
const redis = getRedisClient()
const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
}) : null

// Validation schema
const requestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // 1. Rate limiting
    if (ratelimit) {
      const { success } = await ratelimit.limit(
        request.ip ?? 'anonymous'
      )
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
    }

    // 2. Parse request
    const body = await request.json()
    
    // 3. Validate input
    const validation = requestSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Validation failed', {
        endpoint: '/api/resource',
        errors: validation.error.issues,
      })
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // 4. Authentication
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 5. Authorization
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 6. Business logic
    const validData = validation.data
    const { data, error } = await supabase
      .from('resources')
      .insert({
        ...validData,
        created_by: user.id,
        organization_id: userProfile.organization_id,
      })
      .select()
      .single()

    if (error) throw error

    // 7. Cache invalidation
    await invalidateCache(CacheKeys.resources(userProfile.organization_id))

    // 8. Log success
    const duration = performance.now() - startTime
    logger.log('Resource created successfully', {
      endpoint: '/api/resource',
      userId: user.id,
      resourceId: data.id,
      duration: duration.toFixed(2),
    })

    // 9. Return response
    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    const duration = performance.now() - startTime
    
    logger.error('Error creating resource', {
      endpoint: '/api/resource',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: duration.toFixed(2),
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Consequences

### Positive
- ✅ Consistent API patterns
- ✅ Better error handling
- ✅ Improved security
- ✅ Better debugging with logs
- ✅ Performance gains from caching
- ✅ Protection against abuse

### Negative
- ❌ More boilerplate per endpoint
- ❌ Requires Redis for full benefits
- ❌ Learning curve for patterns

### Neutral
- Documentation requirement for patterns
- Need to enforce through code review

## Related ADRs

- [ADR 0001: State Management](./0001-state-management.md)
- [ADR 0003: UI System](./0003-ui-system.md)

## References

- [Zod Documentation](https://zod.dev)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HTTP Status Codes](https://httpstatuses.com/)
