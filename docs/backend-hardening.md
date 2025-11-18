# Backend Hardening Documentation

This document describes the backend security and operational improvements implemented in the Next.js application, including validation, error handling, logging, security headers, rate limiting, and observability.

## Table of Contents

1. [Overview](#overview)
2. [Request Validation](#request-validation)
3. [Error Handling](#error-handling)
4. [Response Consistency](#response-consistency)
5. [Structured Logging](#structured-logging)
6. [Security Headers](#security-headers)
7. [Rate Limiting](#rate-limiting)
8. [Health & Readiness Endpoints](#health--readiness-endpoints)
9. [Migration Guide](#migration-guide)

## Overview

The backend hardening implementation provides:

- **Validation**: Zod-based schema validation for all API inputs
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Logging**: Structured logging with request tracing via Pino
- **Security**: Security headers, rate limiting, and input sanitization
- **Observability**: Health checks and request ID propagation

All changes are **backward compatible** - existing endpoints continue to work without modification.

## Request Validation

### Validation Utilities

Location: `apps/web/src/server/utils/validation.ts`

#### Validate Request Body

```typescript
import { validateBody } from '@/server/utils/validation'
import { createUserSchema } from '@/server/schemas/admin'

export async function POST(request: NextRequest) {
  const data = await validateBody(request, createUserSchema)
  // data is typed and validated
}
```

#### Validate Query Parameters

```typescript
import { validateQuery } from '@/server/utils/validation'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export async function GET(request: NextRequest) {
  const query = validateQuery(request, querySchema)
  // query.page and query.limit are validated numbers
}
```

#### Validate Route Parameters

```typescript
import { validateParams } from '@/server/utils/validation'
import { questionIdParamSchema } from '@/server/schemas/questions'

export async function GET(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const validated = validateParams(params, questionIdParamSchema)
  // validated.questionId is a valid UUID
}
```

#### Comprehensive Validation

```typescript
import { validateRequest } from '@/server/utils/validation'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { body, query, params: validatedParams } = await validateRequest(
    request,
    {
      body: updateUserSchema,
      query: paginationSchema,
      params: userIdParamSchema,
    },
    params
  )
}
```

### Input Sanitization

⚠️ **Important**: The built-in `sanitizeString` function is designed for **plain text only**. For rich text or HTML content, you must use a dedicated library like DOMPurify.

```typescript
import { sanitizeString, sanitizeObject } from '@/server/utils/validation'

// Sanitize individual string (plain text only)
const clean = sanitizeString(userInput)

// Sanitize all strings in an object recursively (plain text only)
const cleanData = sanitizeObject(requestData)
```

**Sanitization Best Practices:**

1. **Primary Defense**: Use Zod schemas for validation (type, format, length constraints)
2. **Plain Text**: Use `sanitizeString` for plain text fields (names, titles, descriptions)
3. **Rich Text/HTML**: Use DOMPurify or similar libraries for HTML content
4. **Output Encoding**: React automatically escapes output (don't disable)
5. **CSP Headers**: Already implemented in middleware for additional protection
6. **Database**: Use parameterized queries (Supabase does this automatically)

**Example with Zod + Sanitization:**

```typescript
import { z } from 'zod'
import { sanitizeString } from '@/server/utils/validation'

const userSchema = z.object({
  name: z.string().min(1).max(255).transform(sanitizeString),
  email: z.string().email(),
  bio: z.string().max(1000).transform(sanitizeString), // Plain text bio
})
```

### Predefined Schemas

Common schemas are available in `apps/web/src/server/schemas/`:

- **admin.ts**: Organization and user management schemas
- **coding.ts**: Code execution and submission schemas
- **questions.ts**: Question CRUD schemas

Example:

```typescript
import { createOrganizationSchema } from '@/server/schemas/admin'
import { runCodeSchema } from '@/server/schemas/coding'
import { createQuestionSchema } from '@/server/schemas/questions'
```

## Error Handling

### Error Classes

Location: `apps/web/src/server/utils/errors.ts`

```typescript
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
} from '@/server/utils/errors'

// Throw specific errors
throw new ValidationError('Invalid email format', { field: 'email' })
throw new UnauthorizedError()
throw new NotFoundError('User not found')
```

### Error Mapping

The `mapErrorToStatus` function automatically maps errors to appropriate HTTP status codes:

```typescript
import { mapErrorToStatus } from '@/server/utils/errors'

try {
  // ... operation
} catch (error) {
  const mapped = mapErrorToStatus(error)
  // { statusCode: 400, code: 'VALIDATION_ERROR', message: '...', details: {...} }
}
```

Supported error types:
- **ApiError classes**: Custom error classes with status codes
- **ZodError**: Automatically mapped to 400 with validation details
- **Database errors**: PostgreSQL errors mapped to appropriate codes
  - 23505 → 409 Conflict (unique violation)
  - 23503 → 400 Bad Request (foreign key violation)
  - 23502 → 400 Bad Request (not null violation)

## Response Consistency

### Response Utilities

Location: `apps/web/src/server/utils/responses.ts`

#### Standard Envelope (Optional)

For **new** endpoints, you can use the standard envelope:

```typescript
import { successResponse, errorResponse } from '@/server/utils/responses'

// Success response
return successResponse({ users: [...] }, 200, requestId)
// { success: true, data: { users: [...] }, requestId: "req_..." }

// Error response
return errorResponse(error, undefined, requestId)
// { success: false, error: { code: "...", message: "...", details: {...} }, requestId: "req_..." }
```

#### Legacy Format (Backward Compatible)

For **existing** endpoints, maintain the current format:

```typescript
import { legacySuccess, legacyError } from '@/server/utils/responses'

// Success (raw data)
return legacySuccess({ users: [...] }, 200, requestId)
// { users: [...] } with X-Request-ID header

// Error ({ error: string })
return legacyError('User not found', 404, requestId)
// { error: "User not found" } with X-Request-ID header
```

#### Flexible Helpers

Use `ok()` and `fail()` for routes that may migrate to envelopes later:

```typescript
import { ok, fail } from '@/server/utils/responses'

// Legacy format (default)
return ok({ users: [...] }, { requestId })
return fail(error, { requestId })

// Or envelope format
return ok({ users: [...] }, { requestId, envelope: true })
return fail(error, { requestId, envelope: true })
```

### Cache Control

```typescript
import { CacheControl, withCacheControl } from '@/server/utils/responses'

const response = NextResponse.json({ data: [...] })
return withCacheControl(response, CacheControl.short) // 1 minute
// or CacheControl.medium (5 min), CacheControl.long (1 hour), CacheControl.noCache
```

## Structured Logging

### Logger Setup

Location: `apps/web/src/server/utils/logger.ts`

The enhanced logger uses Pino for structured JSON logging in production and pretty-printed logs in development.

#### Basic Logging

```typescript
import { logger } from '@/server/utils/logger'

logger.info('User created', { userId, email })
logger.warn('Rate limit approaching', { remaining: 5 })
logger.error('Database connection failed', { error: err.message })
logger.debug('Cache miss', { key })
```

#### Request-Scoped Logging

Always use request-scoped loggers to include request IDs:

```typescript
import { createRequestLogger, getRequestId } from '@/server/utils/logger'

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId, { endpoint: '/api/users' })
  
  log.info('Request received')
  log.info('User created', { userId: user.id })
  log.error('Failed to create user', { error: err.message })
}
```

#### Performance Logging

```typescript
import { logDuration } from '@/server/utils/logger'

const startTime = Date.now()
// ... operation
logDuration(log, 'create_user_operation', startTime)
// Logs: "create_user_operation completed in 150ms"
```

### Log Levels

- **debug**: Detailed debugging information (dev only)
- **info**: General informational messages
- **warn**: Warning messages (potential issues)
- **error**: Error messages (always logged)

Set log level via `LOG_LEVEL` environment variable (default: `debug` in dev, `info` in production).

## Security Headers

### Implemented Headers

Location: `apps/web/src/middleware.ts`

Security headers are automatically applied to all non-API routes:

- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filter
- **Content-Security-Policy-Report-Only**: Scaffold CSP (adjust for your needs)
- **Permissions-Policy**: Restricts camera, microphone, geolocation

### Content Security Policy

Currently in **report-only mode**. Adjust directives based on your app's requirements:

```javascript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Monaco editor requires unsafe-eval
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
].join('; ')
```

To enforce (not just report), change:
```typescript
response.headers.set('Content-Security-Policy', cspDirectives)
```

## Rate Limiting

### Rate Limit Middleware

Location: `apps/web/src/server/middleware/rateLimit.ts`

Rate limiting uses Upstash Redis with a sliding window algorithm.

#### Presets

```typescript
import { RateLimitPresets } from '@/server/middleware/rateLimit'

RateLimitPresets.auth        // 5 req/min - for authentication
RateLimitPresets.sensitive   // 10 req/min - for sensitive operations
RateLimitPresets.standard    // 60 req/min - for general API
RateLimitPresets.relaxed     // 120 req/min - for read-heavy endpoints
```

#### Apply to Route Handler

```typescript
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'

async function handler(request: NextRequest) {
  // Your route logic
  return NextResponse.json({ success: true })
}

export const POST = withRateLimit(handler, RateLimitPresets.auth)
```

#### Custom Configuration

```typescript
import { withRateLimit } from '@/server/middleware/rateLimit'

const customConfig = {
  maxRequests: 30,
  windowSeconds: 60,
  identifier: 'custom-endpoint',
}

export const POST = withRateLimit(handler, customConfig)
```

#### Response Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2024-01-15T10:30:00Z
```

#### Error Response

When rate limit is exceeded (429 status):

```json
{
  "error": "Rate limit exceeded",
  "details": {
    "resetAt": "2024-01-15T10:30:00Z",
    "limit": 10,
    "window": 60
  }
}
```

### Graceful Degradation

If Redis is not configured, rate limiting is **disabled** and all requests are allowed. The service logs a warning but continues to operate.

## Health & Readiness Endpoints

### Health Check

**Endpoint**: `GET /api/health`

Returns basic health status. Always returns 200 if service is running.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### Readiness Check

**Endpoint**: `GET /api/ready`

Returns 200 if service is ready to accept traffic (dependencies available), 503 if not ready.

**Response (Ready)**:
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "redis": { "status": "ok" },
    "database": { "status": "ok" }
  }
}
```

**Response (Not Ready)**:
```json
{
  "status": "not_ready",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "redis": { "status": "not_configured", "message": "Redis not configured (optional)" },
    "database": { "status": "error", "message": "Database connection failed" }
  }
}
```

Both endpoints have caching disabled (`Cache-Control: no-store`).

## Migration Guide

### For New API Routes

Use the full hardening stack:

```typescript
import { NextRequest } from 'next/server'
import { createRequestLogger, getRequestId } from '@/server/utils/logger'
import { validateBody } from '@/server/utils/validation'
import { ok, fail } from '@/server/utils/responses'
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'
import { createUserSchema } from '@/server/schemas/admin'

async function handler(request: NextRequest) {
  // Get request ID
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId)
  
  try {
    log.info('Creating user')
    
    // Validate input
    const data = await validateBody(request, createUserSchema)
    
    // Business logic
    const user = await createUser(data)
    
    log.info('User created', { userId: user.id })
    
    // Return success
    return ok({ user }, { requestId })
  } catch (error) {
    log.error('Failed to create user', { error })
    return fail(error, { requestId })
  }
}

export const POST = withRateLimit(handler, RateLimitPresets.sensitive)
```

### For Existing API Routes

**Option 1**: Gradual enhancement (recommended)

1. Add request ID and logging:
   ```typescript
   const requestId = getRequestId(request.headers)
   const log = createRequestLogger(requestId)
   log.info('Request received')
   ```

2. Add input validation where missing:
   ```typescript
   const data = await validateBody(request, schema)
   ```

3. Keep existing response format:
   ```typescript
   return NextResponse.json({ users: [...] }, {
     headers: { 'X-Request-ID': requestId }
   })
   ```

**Option 2**: Full migration

Replace response handling with utilities:

```typescript
// Before
return NextResponse.json({ error: 'Not found' }, { status: 404 })

// After
return fail(new NotFoundError('Not found'), { requestId })
```

### For Frontend/Consumers

**No changes required**. All modifications are backward compatible:

- Existing endpoints return the same response format
- New `X-Request-ID` header can be used for tracing (optional)
- Rate limit headers are informational only

### Adding Schemas

Create schemas for your endpoints in `apps/web/src/server/schemas/`:

```typescript
// apps/web/src/server/schemas/courses.ts
import { z } from 'zod'

export const createCourseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  // ... more fields
})
```

Then import and use:

```typescript
import { createCourseSchema } from '@/server/schemas/courses'
```

## Best Practices

1. **Always validate inputs** - Use Zod schemas for all request data
2. **Use request-scoped loggers** - Include request IDs for tracing
3. **Apply rate limiting** - Especially for auth and sensitive endpoints
4. **Sanitize user input** - Prevent XSS with `sanitizeString`/`sanitizeObject`
5. **Use typed errors** - Throw `ApiError` subclasses for consistent handling
6. **Maintain backward compatibility** - Use legacy response helpers for existing endpoints
7. **Log errors with context** - Include relevant data for debugging
8. **Test error paths** - Ensure validation and error handling work as expected

## Environment Variables

- `LOG_LEVEL`: Set log level (debug, info, warn, error) - default: debug (dev), info (prod)
- `UPSTASH_REDIS_REST_URL`: Redis URL for rate limiting (optional)
- `UPSTASH_REDIS_REST_TOKEN`: Redis token for rate limiting (optional)
- `NEXT_PUBLIC_APP_VERSION`: App version for health check (optional)

## Security Considerations

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Protects against brute force and DoS attacks
- **Security Headers**: Mitigate XSS, clickjacking, and MIME sniffing
- **Request IDs**: Enable request tracing and audit trails
- **Error Handling**: Avoid leaking sensitive information in error messages
- **CSP**: Content Security Policy in report-only mode (customize and enforce as needed)

## Troubleshooting

**Rate limiting not working?**
- Check Redis configuration (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
- Rate limiting gracefully degrades if Redis is unavailable

**Validation errors?**
- Check Zod schema definitions
- Review error details in validation error responses

**Missing request IDs?**
- Ensure `getRequestId()` is called and passed to response helpers

**CSP blocking resources?**
- Adjust CSP directives in middleware.ts
- Use report-only mode during development

## Future Enhancements

- [ ] Enforce CSP (move from report-only to enforcement)
- [ ] Add request/response size limits
- [ ] Implement distributed tracing (OpenTelemetry)
- [ ] Add metrics collection (Prometheus)
- [ ] Create monitoring dashboard
- [ ] Add automated security scanning in CI
- [ ] Implement request signature verification for webhooks
- [ ] Add circuit breaker for external service calls
