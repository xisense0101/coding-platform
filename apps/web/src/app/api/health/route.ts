/**
 * Health check endpoint
 * Returns basic health status - always returns 200 if the service is running
 */

import { NextResponse } from 'next/server'
import { CacheControl, withCacheControl } from '@/server/utils/responses'

export const dynamic = 'force-dynamic'

export async function GET() {
  const response = NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
  })

  return withCacheControl(response, CacheControl.noCache)
}
