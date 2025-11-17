# Migration Guide

This guide helps you migrate from the MVP version to the production-ready version of the Coding Platform.

## Overview

The production-ready version introduces several architectural improvements while maintaining 100% backward compatibility with existing functionality. All existing API endpoints continue to work as before.

## Breaking Changes

**None.** All changes are additive and non-breaking.

## New Features

### 1. Enhanced Error Handling

The platform now uses custom error classes for better error handling:

```typescript
// Old way (still works)
return NextResponse.json({ error: 'Not found' }, { status: 404 })

// New way (recommended)
import { NotFoundError, createErrorResponse } from '@/core'

throw new NotFoundError('User')
// Automatically returns proper JSON response
```

### 2. Structured API Responses

All API responses now follow a consistent format:

```typescript
// Old way (still works)
return NextResponse.json({ users: data }, { status: 200 })

// New way (recommended)
import { createSuccessResponse } from '@/core/utils'

return createSuccessResponse(data, 'Users fetched successfully')
```

### 3. Rate Limiting

Protect your API endpoints with rate limiting:

```typescript
import { rateLimit, RATE_LIMITS } from '@/core/middleware'

export const POST = rateLimit(RATE_LIMITS.strict)(async (request) => {
  // Your handler code
})
```

### 4. Enhanced Logging

Use the new structured logger instead of console.log:

```typescript
// Old way (deprecated)
console.log('User created:', userId)

// New way
import { logger } from '@/core/utils'

logger.info('User created', { userId, email })
```

### 5. Input Validation

Validate inputs with Zod schemas:

```typescript
import { z } from 'zod'
import { validateBody } from '@/core/validators'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

const data = await validateBody(request, schema)
```

### 6. Authentication Middleware

Use middleware for auth checks:

```typescript
import { withAuth, withRoles } from '@/core/middleware'

// Require authentication
export const GET = withAuth(async (request, user) => {
  // user is guaranteed to be authenticated
})

// Require specific roles
export const POST = withRoles(['admin', 'super_admin'])(
  async (request, user) => {
    // user has required role
  }
)
```

## Migration Steps

### Step 1: Update Dependencies

No action needed. All dependencies are already installed.

### Step 2: Update Imports (Optional)

You can gradually update your code to use the new utilities:

```typescript
// Update error responses
import { createErrorResponse, NotFoundError } from '@/core/errors'
import { createSuccessResponse } from '@/core/utils'

// Update logging
import { logger } from '@/core/utils'

// Add validation
import { validateBody } from '@/core/validators'
```

### Step 3: Add Rate Limiting (Recommended)

Add rate limiting to sensitive endpoints:

```typescript
import { rateLimit, RATE_LIMITS } from '@/core/middleware'

// For write operations
export const POST = rateLimit(RATE_LIMITS.strict)(handler)

// For read operations
export const GET = rateLimit(RATE_LIMITS.standard)(handler)
```

### Step 4: Replace Console Logs

Replace `console.log` with the structured logger:

```bash
# Find all console.log usage
grep -r "console.log" apps/web/src/app/api
```

Replace with:

```typescript
import { logger } from '@/core/utils'

logger.info('Message', { data })
logger.error('Error occurred', error)
logger.debug('Debug info', { details })
```

### Step 5: Add Input Validation

Create Zod schemas for your endpoints:

```typescript
import { z } from 'zod'
import { validateBody } from '@/core/validators'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['student', 'teacher']),
})

// In your handler
const data = await validateBody(request, createUserSchema)
```

## New API Endpoints

### Health Check

```
GET /api/health
GET /api/v1/health
```

Check application health status.

### Versioned API

New endpoints are available under `/api/v1/`:

```
GET /api/v1/users
POST /api/v1/users
```

Legacy endpoints (`/api/`) continue to work and redirect to v1.

## Configuration Changes

### TypeScript

The TypeScript configuration is now stricter:

- `noImplicitAny`: enabled
- `strictNullChecks`: enabled
- `noUnusedLocals`: enabled
- `noUnusedParameters`: enabled
- `noImplicitReturns`: enabled

Fix any new type errors that appear.

### ESLint

ESLint is now configured. Run:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Prettier

Code formatting is automated. Run:

```bash
npm run format
npm run format:check
```

## Testing

Tests are now available. Run:

```bash
npm test
npm run test:coverage
```

Add tests for your features:

```typescript
// src/__tests__/api/users.test.ts
describe('Users API', () => {
  it('should create user', async () => {
    // Your test
  })
})
```

## Environment Variables

Validate environment variables:

```typescript
import { validateEnv } from '@/core/config'

// At app startup
validateEnv()
```

This ensures all required environment variables are set.

## Rollback

If you need to rollback:

1. All new features are optional
2. Old code continues to work
3. Simply don't use the new utilities

## Support

For migration help:

1. Check the [README.md](../README.md)
2. See [API.md](./API.md) for API documentation
3. Review example code in `/api/v1/users/route.ts`
4. Open an issue for assistance

## Gradual Migration

You can migrate gradually:

1. Start with new endpoints (use v1 routes)
2. Add rate limiting to critical endpoints
3. Update logging to structured logger
4. Add input validation to forms
5. Refactor old endpoints when time permits

No rush - the old code still works!
