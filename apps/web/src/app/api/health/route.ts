import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { createSuccessResponse } from '@/core/utils'

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  }

  try {
    // Check database connection
    const supabase = createSupabaseServerClient()
    const { error: dbError } = await supabase.from('users').select('id').limit(1)
    checks.services.database = dbError ? 'unhealthy' : 'healthy'
  } catch {
    checks.services.database = 'unhealthy'
  }

  // Check Redis if configured
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const { default: redis } = await import('@/lib/redis/client')
      await redis.ping()
      checks.services.redis = 'healthy'
    } catch {
      checks.services.redis = 'unhealthy'
    }
  } else {
    checks.services.redis = 'not configured'
  }

  // Determine overall status
  const isHealthy =
    checks.services.database === 'healthy' &&
    (checks.services.redis === 'healthy' || checks.services.redis === 'not configured')

  checks.status = isHealthy ? 'healthy' : 'degraded'

  return createSuccessResponse(checks, undefined, isHealthy ? 200 : 503)
}
