/**
 * Cache utilities for Redis
 * Provides a simple interface for caching with TTL support
 */

import redis from '@/lib/redis/client'
import { logger } from '@/core/utils/logger'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string // Key prefix for namespacing
}

/**
 * Default cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const

/**
 * Cache manager class
 */
export class CacheManager {
  private prefix: string

  constructor(prefix: string = 'app') {
    this.prefix = prefix
  }

  /**
   * Generate cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(this.getKey(key))
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      logger.error('Cache get error', error)
      return null
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      await redis.set(this.getKey(key), serialized, {
        ex: ttl,
      })
      return true
    } catch (error) {
      logger.error('Cache set error', error)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(this.getKey(key))
      return true
    } catch (error) {
      logger.error('Cache delete error', error)
      return false
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(this.getKey(pattern))
      if (keys.length === 0) return 0

      await redis.del(...keys)
      return keys.length
    } catch (error) {
      logger.error('Cache delete pattern error', error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(this.getKey(key))
      return result === 1
    } catch (error) {
      logger.error('Cache exists error', error)
      return false
    }
  }

  /**
   * Get or set pattern (cache-aside)
   * If value exists in cache, return it. Otherwise, compute it, cache it, and return it.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const fresh = await fetchFn()

    // Cache it for next time (fire and forget)
    this.set(key, fresh, ttl).catch((error) => {
      logger.warn('Failed to cache value', { key, error })
    })

    return fresh
  }

  /**
   * Invalidate all cache keys with this prefix
   */
  async flush(): Promise<number> {
    return this.delPattern('*')
  }
}

/**
 * Create a cache manager instance
 */
export function createCacheManager(prefix: string): CacheManager {
  return new CacheManager(prefix)
}

/**
 * Default cache manager
 */
export const cache = new CacheManager()

/**
 * Cache decorator for functions
 * Usage:
 * const cachedFn = withCache('my-key', myFunction, CACHE_TTL.LONG)
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  keyFn: (...args: Parameters<T>) => string,
  fn: T,
  ttl: number = CACHE_TTL.MEDIUM
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args)
    return cache.getOrSet(key, () => fn(...args), ttl)
  }) as T
}
