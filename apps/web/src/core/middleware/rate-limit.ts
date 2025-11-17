import { NextRequest, NextResponse } from 'next/server'
import { RateLimitError } from '@/core/errors'
import { createErrorResponse } from '@/core/utils'

/**
 * In-memory rate limiter using a Map
 * In production, use Redis for distributed rate limiting
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  /**
   * Check if request is rate limited
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Maximum number of requests
   * @param windowMs - Time window in milliseconds
   */
  check(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })
      return true
    }

    if (record.count >= limit) {
      // Rate limit exceeded
      return false
    }

    // Increment count
    record.count++
    return true
  }

  /**
   * Get time until rate limit reset
   */
  getResetTime(identifier: string): number | undefined {
    const record = this.requests.get(identifier)
    if (!record) return undefined
    return Math.max(0, record.resetTime - Date.now())
  }

  /**
   * Clear expired entries periodically
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

// Cleanup every minute
setInterval(() => rateLimiter.cleanup(), 60000)

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  limit: number // Max requests
  windowMs: number // Time window in milliseconds
  message?: string
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  strict: { limit: 10, windowMs: 60 * 1000, message: 'Too many requests' }, // 10 per minute
  standard: { limit: 60, windowMs: 60 * 1000, message: 'Too many requests' }, // 60 per minute
  lenient: { limit: 100, windowMs: 60 * 1000, message: 'Too many requests' }, // 100 per minute
  api: { limit: 100, windowMs: 15 * 60 * 1000, message: 'API rate limit exceeded' }, // 100 per 15 minutes
} as const

/**
 * Get client identifier from request (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to connection IP (may not be accurate behind proxies)
  return request.ip || 'unknown'
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig = RATE_LIMITS.standard) {
  return function (
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const identifier = getClientIdentifier(request)
      const isAllowed = rateLimiter.check(identifier, config.limit, config.windowMs)

      if (!isAllowed) {
        const retryAfter = Math.ceil((rateLimiter.getResetTime(identifier) || 0) / 1000)
        const error = new RateLimitError(
          config.message || 'Too many requests',
          retryAfter
        )
        return createErrorResponse(error)
      }

      return await handler(request)
    }
  }
}

/**
 * Apply rate limit to a route handler
 * Usage: export const POST = withRateLimit(RATE_LIMITS.strict)(handler)
 */
export function rateLimit(config: RateLimitConfig = RATE_LIMITS.standard) {
  return withRateLimit(config)
}
