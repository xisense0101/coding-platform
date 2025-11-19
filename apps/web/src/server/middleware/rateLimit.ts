/**
 * Rate limiting middleware using Upstash Redis
 * Implements token bucket algorithm for rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis/client'
import { RateLimitError } from '../utils/errors'
import { fail } from '../utils/responses'
import { getRequestId } from '../utils/logger'

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number
  /**
   * Time window in seconds
   */
  windowSeconds: number
  /**
   * Identifier for the rate limit (e.g., 'auth:login', 'api:general')
   */
  identifier: string
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RateLimitPresets = {
  // Very strict - for authentication endpoints
  auth: {
    maxRequests: 5,
    windowSeconds: 60, // 5 requests per minute
    identifier: 'auth',
  },
  // Strict - for sensitive operations
  sensitive: {
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
    identifier: 'sensitive',
  },
  // Standard - for general API endpoints
  standard: {
    maxRequests: 60,
    windowSeconds: 60, // 60 requests per minute
    identifier: 'standard',
  },
  // Relaxed - for read-heavy endpoints
  relaxed: {
    maxRequests: 120,
    windowSeconds: 60, // 120 requests per minute
    identifier: 'relaxed',
  },
}

/**
 * Get a unique identifier for the client making the request
 * Uses IP address or authentication token
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for when behind proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  // Could also use authenticated user ID for user-specific rate limiting
  // const userId = request.headers.get('x-user-id')
  // return userId || ip
  
  return ip
}

/**
 * Sliding window rate limiter using Redis
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const redis = getRedisClient()
  
  // If Redis is not configured, allow all requests (graceful degradation)
  if (!redis) {
    console.warn('Redis not configured, rate limiting disabled')
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    }
  }

  const clientId = getClientIdentifier(request)
  const key = `ratelimit:${config.identifier}:${clientId}`
  
  try {
    // Use Redis sorted set for sliding window
    const now = Date.now()
    const windowStart = now - config.windowSeconds * 1000

    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart)

    // Count requests in current window
    const requestCount = await redis.zcard(key)

    if (requestCount >= config.maxRequests) {
      // Get the oldest request timestamp to calculate reset time
      const oldestRequests = await redis.zrange(key, 0, 0, { withScores: true })
      const oldestTimestamp = oldestRequests.length > 0 
        ? (oldestRequests[0] as { score: number }).score 
        : now
      const resetAt = new Date(oldestTimestamp + config.windowSeconds * 1000)

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }

    // Add current request to the window
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    
    // Set expiry on the key to clean up automatically
    await redis.expire(key, config.windowSeconds + 60) // Add buffer

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetAt: new Date(now + config.windowSeconds * 1000),
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // On error, allow the request (fail open for availability)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    }
  }
}

/**
 * Rate limiting middleware factory
 * Returns a middleware function that applies rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const requestId = getRequestId(request.headers)
    const result = await checkRateLimit(request, config)

    // Add rate limit headers to response
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
    }

    if (!result.allowed) {
      const response = fail(
        new RateLimitError('Rate limit exceeded', {
          resetAt: result.resetAt.toISOString(),
          limit: config.maxRequests,
          window: config.windowSeconds,
        }),
        { requestId }
      )
      
      // Add rate limit headers
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }

    // Call the actual handler
    const response = await handler()
    
    // Add rate limit headers to successful response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Simple helper to apply rate limiting to a route handler
 * Usage: export const POST = withRateLimit(handler, RateLimitPresets.auth)
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, context?: any) => {
    return rateLimit(config)(request, () => handler(request, context))
  }
}
