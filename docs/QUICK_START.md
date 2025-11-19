# Backend Hardening - Quick Start Guide

This guide helps developers quickly integrate the new backend hardening features into their API routes.

## 5-Minute Integration

### For New API Routes

```typescript
import { NextRequest } from 'next/server'
import { createRequestLogger, getRequestId } from '@/server/utils/logger'
import { validateBody } from '@/server/utils/validation'
import { ok, fail } from '@/server/utils/responses'
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'
import { mySchema } from '@/server/schemas/my-feature'

async function handler(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId)
  
  try {
    log.info('Processing request')
    
    // Validate input
    const data = await validateBody(request, mySchema)
    
    // Your business logic here
    const result = await processData(data)
    
    log.info({ result }, 'Request completed')
    return ok(result, { requestId })
  } catch (error) {
    log.error({ error }, 'Request failed')
    return fail(error, { requestId })
  }
}

export const POST = withRateLimit(handler, RateLimitPresets.standard)
```

### For Existing API Routes (Minimal Changes)

```typescript
import { createRequestLogger, getRequestId } from '@/server/utils/logger'

export async function POST(request: NextRequest) {
  // Add these two lines at the start
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId)
  
  try {
    log.info('Request received') // Replace console.log
    
    // Your existing logic stays the same
    const body = await request.json()
    // ... rest of your code
    
    // Add requestId to response
    return NextResponse.json(result, {
      headers: { 'X-Request-ID': requestId }
    })
  } catch (error) {
    log.error({ error }, 'Request failed') // Replace console.error
    return NextResponse.json({ error: 'Error message' }, {
      status: 500,
      headers: { 'X-Request-ID': requestId }
    })
  }
}
```

## Common Patterns

### Authentication Check

```typescript
import { UnauthorizedError } from '@/server/utils/errors'

const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  log.warn('Unauthorized access attempt')
  throw new UnauthorizedError()
}
```

### Role-Based Access

```typescript
import { ForbiddenError } from '@/server/utils/errors'

if (userProfile.role !== 'admin') {
  log.warn({ role: userProfile.role }, 'Forbidden access')
  throw new ForbiddenError('Admin access required')
}
```

### Input Validation

```typescript
import { validateBody, validateQuery, validateParams } from '@/server/utils/validation'
import { z } from 'zod'

// Body validation
const bodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
})
const data = await validateBody(request, bodySchema)

// Query validation
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})
const query = validateQuery(request, querySchema)

// Param validation
const paramSchema = z.object({
  id: z.string().uuid(),
})
const params = validateParams(routeParams, paramSchema)
```

### Rate Limiting Presets

```typescript
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'

// Very strict - for login, password reset
export const POST = withRateLimit(handler, RateLimitPresets.auth)

// Strict - for admin operations, sensitive data
export const POST = withRateLimit(handler, RateLimitPresets.sensitive)

// Standard - for most API endpoints
export const POST = withRateLimit(handler, RateLimitPresets.standard)

// Relaxed - for read-heavy public endpoints
export const GET = withRateLimit(handler, RateLimitPresets.relaxed)
```

### Error Handling

```typescript
import { ValidationError, NotFoundError, InternalServerError } from '@/server/utils/errors'

// Throw specific errors
throw new ValidationError('Invalid email format')
throw new NotFoundError('User not found')
throw new InternalServerError('Database connection failed')

// Errors are automatically mapped to correct HTTP status codes
```

## Schema Creation

Create schemas in `apps/web/src/server/schemas/`:

```typescript
// apps/web/src/server/schemas/my-feature.ts
import { z } from 'zod'

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  category: z.enum(['electronics', 'books', 'clothing']),
  tags: z.array(z.string()).max(10),
})

export const updateItemSchema = createItemSchema.partial()

export const itemIdSchema = z.object({
  id: z.string().uuid(),
})
```

## Cheat Sheet

### Validation
```typescript
// Body
const data = await validateBody(request, schema)

// Query params
const query = validateQuery(request, schema)

// Route params
const params = validateParams(routeParams, schema)
```

### Logging
```typescript
// Get logger
const log = createRequestLogger(requestId)

// Log levels
log.info({ data }, 'Message')
log.warn({ data }, 'Message')
log.error({ error }, 'Message')
log.debug({ data }, 'Message')
```

### Responses
```typescript
// Success (legacy format)
return ok(data, { requestId })

// Error (legacy format)
return fail(error, { requestId })

// With envelope (new format)
return ok(data, { requestId, envelope: true })
```

### Rate Limiting
```typescript
// Apply to handler
export const POST = withRateLimit(handler, RateLimitPresets.standard)

// Custom config
const custom = {
  maxRequests: 30,
  windowSeconds: 60,
  identifier: 'my-endpoint',
}
export const POST = withRateLimit(handler, custom)
```

### Errors
```typescript
throw new ValidationError('Message')
throw new UnauthorizedError()
throw new ForbiddenError('Message')
throw new NotFoundError('Message')
throw new ConflictError('Message')
throw new RateLimitError()
throw new InternalServerError('Message')
```

## Don't Forget

✅ Add request ID to all responses
✅ Use structured logging with context
✅ Validate all inputs with Zod
✅ Apply appropriate rate limiting
✅ Handle errors with specific error classes
✅ Log errors with error context
✅ Keep response formats backward compatible

## Common Mistakes to Avoid

❌ Don't use `console.log` - use structured logger
❌ Don't skip input validation
❌ Don't return sensitive data in error messages
❌ Don't forget to add request ID to responses
❌ Don't apply rate limiting too strictly (test first)
❌ Don't use manual HTML sanitization for rich text (use DOMPurify)

## Testing Your Changes

```bash
# Type check
npm run type-check

# Build check (may fail due to network restrictions in CI)
npm run build

# Test your endpoint
curl -H "Content-Type: application/json" \
     -d '{"key":"value"}' \
     http://localhost:3000/api/your-endpoint

# Check response headers
curl -I http://localhost:3000/api/your-endpoint
# Look for: X-Request-ID, X-RateLimit-*
```

## Need Help?

1. **Full Documentation**: `docs/backend-hardening.md`
2. **Security Summary**: `docs/SECURITY_SUMMARY.md`
3. **Sample Implementations**: 
   - `apps/web/src/app/api/coding/run/route.ts`
   - `apps/web/src/app/api/coding/submit/route.ts`
   - `apps/web/src/app/api/admin/organizations/route.ts`
4. **Utility Functions**: `apps/web/src/server/utils/`
5. **Schemas**: `apps/web/src/server/schemas/`

## Example: Complete New Endpoint

```typescript
// apps/web/src/app/api/items/route.ts
import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { createRequestLogger, getRequestId } from '@/server/utils/logger'
import { validateBody } from '@/server/utils/validation'
import { ok, fail } from '@/server/utils/responses'
import { UnauthorizedError, NotFoundError } from '@/server/utils/errors'
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'
import { createItemSchema } from '@/server/schemas/items'

async function handler(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId, { endpoint: '/api/items' })
  
  try {
    const supabase = createSupabaseServerClient()
    
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      log.warn('Unauthorized access')
      throw new UnauthorizedError()
    }
    
    log.info({ userId: user.id }, 'Creating item')
    
    // Validate input
    const validated = await validateBody(request, createItemSchema)
    
    // Create item
    const { data: item, error } = await supabase
      .from('items')
      .insert({
        ...validated,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      log.error({ error: error.message }, 'Failed to create item')
      throw error
    }
    
    log.info({ itemId: item.id }, 'Item created successfully')
    
    return ok({ item }, { requestId, statusCode: 201 })
  } catch (error) {
    log.error({ error }, 'Request failed')
    return fail(error, { requestId })
  }
}

export const POST = withRateLimit(handler, RateLimitPresets.standard)
```

That's it! Your endpoint now has:
✅ Request tracing
✅ Structured logging
✅ Input validation
✅ Rate limiting
✅ Proper error handling
✅ Backward compatible responses
