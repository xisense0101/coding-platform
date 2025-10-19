import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/exam/isDOUp
 * 
 * Health check endpoint for Electron app updates and server status
 * Optional endpoint - used by app to verify server availability
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  })
}
