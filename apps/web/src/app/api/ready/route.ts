/**
 * Readiness check endpoint
 * Returns 200 if service is ready to accept traffic (dependencies are available)
 * Returns 503 if service is not ready
 */

import { NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis/client'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { CacheControl, withCacheControl } from '@/server/utils/responses'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {}
  let isReady = true

  // Check Redis connectivity
  try {
    const redis = getRedisClient()
    if (redis) {
      await redis.ping()
      checks.redis = { status: 'ok' }
    } else {
      // Redis is optional, not required for readiness
      checks.redis = { status: 'not_configured', message: 'Redis not configured (optional)' }
    }
  } catch (error) {
    checks.redis = { status: 'error', message: 'Redis connection failed' }
    isReady = false
  }

  // Check Supabase connectivity
  try {
    const supabase = createSupabaseServerClient()
    // Simple query to check database connectivity
    const { error } = await supabase.from('organizations').select('id').limit(1)
    if (error) {
      checks.database = { status: 'error', message: error.message }
      isReady = false
    } else {
      checks.database = { status: 'ok' }
    }
  } catch (error) {
    checks.database = { status: 'error', message: 'Database connection failed' }
    isReady = false
  }

  const response = NextResponse.json(
    {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: isReady ? 200 : 503 }
  )

  return withCacheControl(response, CacheControl.noCache)
}
