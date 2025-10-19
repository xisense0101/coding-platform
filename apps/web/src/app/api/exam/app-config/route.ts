import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/exam/app-config
 * 
 * Provides platform-specific configuration for Electron app
 * Optional endpoint - returns default config for different platforms
 */
export async function GET(request: NextRequest) {
  try {
    // Platform-specific configurations
    const config = {
      darwin: {
        allowWithoutMonitor: 0, // macOS: require monitoring app
        minimumVersion: '0.4.0'
      },
      linux: {
        allowWithoutMonitor: 1, // Linux: more permissive
        minimumVersion: '0.4.0'
      },
      win32: {
        allowWithoutMonitor: 0, // Windows: require monitoring
        minimumVersion: '0.4.0'
      },
      // Global settings
      global: {
        updateCheckUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/exam/version-check',
        supportUrl: process.env.NEXT_PUBLIC_APP_URL + '/support',
        maxRetries: 3,
        retryDelay: 5000 // ms
      }
    }

    return NextResponse.json(config)

  } catch (error) {
    console.error('Error getting app config:', error)
    // Return minimal config on error
    return NextResponse.json({
      darwin: { allowWithoutMonitor: 0 },
      linux: {},
      win32: {}
    })
  }
}
