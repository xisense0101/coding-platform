# Operations Runbook

## Overview

This runbook provides operational procedures for running, monitoring, and maintaining the Coding Platform in production and development environments.

## Environment Management

### Environment Variables

#### Production Requirements

**Critical Variables** (must be set):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

**Optional Variables** (features disabled if not set):
```bash
# Caching (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Email Service (Mailjet)
MAILJET_API_KEY=your_key
MAILJET_API_SECRET=your_secret
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Coding Platform

# Code Execution (Judge0)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_key
```

### Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Verbose logging enabled
# Hot reload enabled
```

#### Staging
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
# Production optimizations
# Debug logging enabled
```

#### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# Full optimizations
# Error-only logging
```

## Application Deployment

### Vercel Deployment (Recommended)

#### Initial Setup

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import GitHub repository
   - Select `coding-platform`

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables
   - Set for Production, Preview, and Development

4. **Deploy**
   - Push to `main` branch
   - Vercel deploys automatically
   - Custom domain configuration in project settings

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Alternative: Docker Deployment

#### Build Image

```dockerfile
# Dockerfile (create in root)
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start", "-w", "@enterprise-edu/web"]
```

#### Build and Run

```bash
# Build image
docker build -t coding-platform:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY \
  coding-platform:latest

# Or use docker-compose
docker-compose up -d
```

## Rate Limiter Configuration

### Upstash Redis Setup

#### Create Redis Database

1. Go to [Upstash Console](https://console.upstash.com)
2. Create new Redis database
3. Choose region closest to your app
4. Copy REST URL and Token
5. Add to environment variables

#### Configuration

**Location**: `lib/redis/client.ts`

**Current limits**:
```typescript
// Example: 10 requests per minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
})
```

### Rate Limit Strategies by Endpoint

| Endpoint Type | Limit | Window | Identifier |
|--------------|-------|--------|------------|
| Auth (login/register) | 5 | 1 minute | IP + email |
| Password reset | 3 | 5 minutes | IP + email |
| Read operations | 60 | 1 minute | User ID |
| Write operations | 20 | 1 minute | User ID |
| File uploads | 5 | 5 minutes | User ID |
| Code execution | 10 | 1 minute | User ID |
| Admin operations | 100 | 1 minute | User ID |

### Adjust Rate Limits

**For specific endpoint**:
```typescript
// apps/web/src/app/api/endpoint/route.ts
const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // Adjust here
  analytics: true,
}) : null
```

**Common adjustments**:
```typescript
// More permissive
Ratelimit.slidingWindow(100, '1 m')  // 100/min

// More restrictive
Ratelimit.slidingWindow(5, '1 m')    // 5/min

// Longer window
Ratelimit.slidingWindow(10, '5 m')   // 10 per 5 min

// Burst handling
Ratelimit.tokenBucket(10, '1 m', 20) // 10/min, burst 20
```

## Health Checks

### Application Health Endpoint

**Create** (if not exists): `apps/web/src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { getRedisClient } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
    }
  }

  // Check Supabase
  try {
    const supabase = createSupabaseServerClient()
    await supabase.from('users').select('id').limit(1)
    checks.checks.database = 'healthy'
  } catch (error) {
    checks.checks.database = 'unhealthy'
    checks.status = 'degraded'
  }

  // Check Redis (optional)
  try {
    const redis = getRedisClient()
    if (redis) {
      await redis.ping()
      checks.checks.redis = 'healthy'
    } else {
      checks.checks.redis = 'disabled'
    }
  } catch (error) {
    checks.checks.redis = 'unhealthy'
    checks.status = 'degraded'
  }

  const status = checks.status === 'healthy' ? 200 : 503
  return NextResponse.json(checks, { status })
}
```

**Usage**:
```bash
# Check health
curl https://yourdomain.com/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-11-18T10:30:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Readiness Endpoint

**Create**: `apps/web/src/app/api/ready/route.ts`

```typescript
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Simple readiness check
  // Returns 200 if app is ready to receive traffic
  return NextResponse.json({
    ready: true,
    timestamp: new Date().toISOString(),
  })
}
```

## Logging

### Log Levels

**Current implementation**: `lib/utils/logger.ts`

```typescript
logger.log()    // Dev only - general info
logger.info()   // Dev only - informational
logger.debug()  // Dev only - detailed debug
logger.warn()   // Always - warnings
logger.error()  // Always - errors
```

### Log Format

**Structured logging**:
```typescript
logger.error('Operation failed', {
  operation: 'fetchCourses',
  userId: user.id,
  organizationId: org.id,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
})
```

### Production Logging

**What gets logged in production**:
- ✅ Errors (all)
- ✅ Warnings (all)
- ❌ Info logs (disabled)
- ❌ Debug logs (disabled)

**Recommended additions**:

1. **Sentry** for error tracking:
```bash
npm install @sentry/nextjs
```

2. **Structured logging** with Pino:
```bash
npm install pino pino-pretty
```

3. **Log aggregation** with Datadog/LogRocket

### Common Log Patterns

#### Request Logging
```typescript
logger.log('Incoming request', {
  method: request.method,
  path: request.url,
  userId: user?.id,
  timestamp: new Date().toISOString(),
})
```

#### Error Logging
```typescript
logger.error('Database query failed', {
  operation: 'fetchUsers',
  query: 'SELECT * FROM users',
  error: error.message,
  stack: error.stack,
  userId: user.id,
})
```

#### Performance Logging
```typescript
const start = performance.now()
// ... operation ...
const duration = performance.now() - start

logger.log('Operation completed', {
  operation: 'complexQuery',
  duration: duration.toFixed(2),
  resultCount: results.length,
})
```

## Monitoring

### Key Metrics to Monitor

#### Application Metrics

**Response Times**:
- P50: < 200ms
- P95: < 500ms
- P99: < 1000ms

**Error Rate**:
- Target: < 0.1%
- Alert: > 1%

**Availability**:
- Target: 99.9% (uptime)

#### Infrastructure Metrics

**CPU Usage**:
- Normal: < 60%
- Alert: > 80%

**Memory Usage**:
- Normal: < 70%
- Alert: > 85%

**Database Connections**:
- Monitor pool size
- Alert on connection exhaustion

### Monitoring Setup (Recommended)

#### Vercel Analytics

Built-in with Vercel deployment:
- Page views
- Web Vitals (CLS, FID, LCP)
- Response times

#### Upstash Redis Analytics

Built-in with Upstash:
- Cache hit rate
- Command statistics
- Memory usage

#### Custom Monitoring

**Sentry** for error tracking:
```typescript
// sentry.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

## Database Operations

### Connection Management

**Supabase handles**:
- Connection pooling
- Connection limits
- Timeouts
- Retries

**Best practices**:
- Use single client per request
- Close connections after use (automatic)
- Use connection pooling (automatic)

### Database Migrations

**Current state**: Manual SQL execution

**Recommended**: Use migration tool

```bash
# Using Supabase CLI
supabase db push

# Or use migration files
supabase db diff -f migration_name
supabase db push
```

### Database Backups

**Supabase automatic backups**:
- Daily backups (retained 7 days)
- Point-in-time recovery
- Manual backups available

**Create manual backup**:
1. Go to Supabase Dashboard
2. Database → Backups
3. Click "Create Backup"

**Restore from backup**:
1. Go to Backups
2. Select backup
3. Click "Restore"

## Cache Management

### Cache Invalidation

**Manual invalidation**:
```typescript
import { invalidateCache, CacheKeys } from '@/lib/redis/client'

// Invalidate specific key
await invalidateCache(CacheKeys.course(courseId))

// Invalidate pattern
await invalidateCache('courses:*')
```

**Auto-invalidation**:
- Happens automatically on data updates
- Defined in API route handlers

### Cache Monitoring

**Check cache status**:
```typescript
import { getRedisClient } from '@/lib/redis/client'

const redis = getRedisClient()
if (redis) {
  const info = await redis.info()
  console.log('Cache info:', info)
}
```

**Monitor hit rate**:
- Check Upstash Console
- View analytics dashboard
- Track in application metrics

### Clear All Cache (Emergency)

**Via Upstash Console**:
1. Go to Upstash Console
2. Select database
3. Click "Flush All" (danger!)

**Via code** (add endpoint):
```typescript
// apps/web/src/app/api/admin/cache/flush/route.ts
export async function POST() {
  const redis = getRedisClient()
  if (redis) {
    await redis.flushdb()
  }
  return NextResponse.json({ message: 'Cache flushed' })
}
```

## Security Operations

### Security Headers

**Configure in** `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}
```

### SSL/TLS Configuration

**Vercel**:
- Automatic HTTPS
- Auto-renewal certificates
- HTTP → HTTPS redirect

**Custom domain**:
1. Add domain in Vercel
2. Configure DNS records
3. Wait for SSL provisioning

### Secrets Rotation

**Rotate Supabase keys**:
1. Generate new keys in Supabase
2. Update environment variables
3. Deploy new version
4. Revoke old keys after verification

**Rotate API keys**:
1. Generate new keys in service provider
2. Update environment variables
3. Deploy
4. Test thoroughly
5. Revoke old keys

## Incident Response

### Incident Severity Levels

**SEV1 - Critical**:
- Application down
- Data loss
- Security breach
- Response time: Immediate

**SEV2 - High**:
- Major feature broken
- Significant performance degradation
- Response time: < 2 hours

**SEV3 - Medium**:
- Minor feature broken
- Moderate performance issues
- Response time: < 8 hours

**SEV4 - Low**:
- Minor bugs
- UI issues
- Response time: < 24 hours

### Incident Response Procedure

#### 1. Identify

**Symptoms**:
- Health check failures
- Error rate spike
- User reports
- Monitoring alerts

**Triage**:
- Assess severity
- Identify affected users
- Estimate impact

#### 2. Communicate

**Internal**:
- Notify team
- Create incident channel
- Assign incident commander

**External** (if needed):
- Status page update
- Customer notifications
- Social media updates

#### 3. Investigate

**Check**:
- Recent deployments
- Error logs
- Monitoring dashboards
- External service status

**Common issues**:
- Database connection failures
- Environment variable issues
- API rate limiting
- External service outages

#### 4. Mitigate

**Quick fixes**:
- Rollback deployment
- Scale resources
- Clear cache
- Restart services

#### 5. Resolve

**Fix root cause**:
- Code fix
- Configuration update
- Infrastructure change

**Verify**:
- Test thoroughly
- Monitor metrics
- Confirm user reports

#### 6. Document

**Post-mortem**:
- Timeline of events
- Root cause analysis
- Lessons learned
- Action items

### Common Issues & Solutions

#### Application Not Responding

**Symptoms**:
- 503 errors
- Timeout errors
- No response

**Checks**:
```bash
# Check health
curl https://yourdomain.com/api/health

# Check Vercel status
# Go to Vercel dashboard

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

**Solutions**:
1. Check Vercel deployment status
2. Verify environment variables
3. Check Supabase connectivity
4. Review recent changes
5. Rollback if needed

#### Database Connection Errors

**Symptoms**:
- "Failed to connect to database"
- Timeout errors
- High response times

**Checks**:
```bash
# Check Supabase status
# Go to Supabase dashboard

# Check connection pool
# Review Supabase logs
```

**Solutions**:
1. Verify Supabase credentials
2. Check connection limits
3. Review recent database changes
4. Check for long-running queries
5. Restart Supabase if needed

#### Redis Cache Failures

**Symptoms**:
- "Redis not configured" warnings
- Slower response times
- Working but degraded

**Checks**:
```bash
# Check Upstash status
# Go to Upstash console

# Check Redis connectivity
curl https://yourdomain.com/api/health
```

**Solutions**:
1. Verify Redis credentials
2. Check Upstash status
3. **Note**: App works without Redis
4. Update credentials if needed

#### High Memory Usage

**Symptoms**:
- Slow response times
- Out of memory errors
- Server crashes

**Checks**:
- Vercel deployment logs
- Memory usage graphs

**Solutions**:
1. Check for memory leaks
2. Review recent code changes
3. Optimize database queries
4. Clear cache if needed
5. Restart deployment

#### Rate Limit Exceeded

**Symptoms**:
- 429 errors
- Users blocked

**Checks**:
```typescript
// Check rate limit logs
logger.warn('Rate limit exceeded', {
  identifier: userId,
  endpoint: '/api/...',
})
```

**Solutions**:
1. Identify if legitimate traffic spike
2. Adjust rate limits if needed
3. Investigate potential abuse
4. Implement IP blocking if abuse

## Backup & Recovery

### Application Code

**Git repository**:
- Regular commits
- Push to GitHub
- Multiple branches

**Recovery**:
```bash
git checkout main
git pull origin main
```

### Database

**Supabase backups**:
- Automatic daily backups
- Manual backups available
- Point-in-time recovery

**Recovery**:
1. Go to Supabase Dashboard
2. Database → Backups
3. Select backup
4. Restore

### Environment Variables

**Backup**:
- Document in secure location
- Use secrets manager
- Version control (encrypted)

**Recovery**:
- Re-enter in Vercel dashboard
- Or use CLI: `vercel env pull`

## Performance Optimization

### Identify Bottlenecks

**Tools**:
- Vercel Analytics
- Chrome DevTools
- Lighthouse
- Web Vitals

**Metrics to watch**:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

### Common Optimizations

#### Database Queries

```typescript
// ❌ Bad - N+1 query
const courses = await supabase.from('courses').select('*')
for (const course of courses) {
  const instructor = await supabase
    .from('users')
    .select('*')
    .eq('id', course.instructor_id)
}

// ✅ Good - Join
const courses = await supabase
  .from('courses')
  .select('*, instructor:users(*)')
```

#### Caching

```typescript
// Add caching to expensive queries
const data = await getCached(
  CacheKeys.expensiveQuery(id),
  async () => {
    // Expensive operation
    return result
  },
  CacheTTL.long
)
```

#### Image Optimization

```typescript
// Use Next.js Image
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // Above fold
/>
```

## Scaling Considerations

### Horizontal Scaling

**Vercel**:
- Automatic scaling
- Edge network
- No configuration needed

**Benefits**:
- Handle traffic spikes
- Geographic distribution
- High availability

### Vertical Scaling

**Database**:
- Upgrade Supabase plan
- Increase connection pool
- Add read replicas

**Redis**:
- Upgrade Upstash plan
- Increase memory
- Enable persistence

### Performance Monitoring

**Track**:
- Response times
- Error rates
- Cache hit rates
- Database query times

**Alert on**:
- Slow queries (> 1s)
- High error rate (> 1%)
- Low cache hit rate (< 70%)

## Related Documentation

- [Local Development Runbook](./local-development.md)
- [CI/CD Documentation](./ci.md)
- [Architecture Overview](../architecture/overview.md)
- [Backend Architecture](../architecture/backend.md)
