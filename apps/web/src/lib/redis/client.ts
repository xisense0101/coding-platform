import { Redis } from '@upstash/redis'

// Singleton pattern for Redis client
let redisClient: Redis | null = null

export function getRedisClient(): Redis | null {
  // Return null if Redis is not configured (allows graceful degradation)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis not configured. Caching will be disabled.')
    return null
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      console.log('✅ Redis client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Redis client:', error)
      return null
    }
  }

  return redisClient
}

// Cache key generators
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  course: (courseId: string) => `course:${courseId}`,
  courses: (filters: string) => `courses:list:${filters}`,
  exam: (examId: string) => `exam:${examId}`,
  examBySlug: (slug: string) => `exam:slug:${slug}`,
  exams: (filters: string) => `exams:list:${filters}`,
  teacherStats: (teacherId: string) => `teacher:stats:${teacherId}`,
  studentCourses: (studentId: string) => `student:courses:${studentId}`,
  courseEnrollments: (courseId: string) => `course:enrollments:${courseId}`,
  examSubmissions: (examId: string) => `exam:submissions:${examId}`,
  question: (questionId: string) => `question:${questionId}`,
}

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
  short: 60, // 1 minute - for rapidly changing data
  medium: 300, // 5 minutes - for moderately changing data
  long: 900, // 15 minutes - for stable data
  veryLong: 3600, // 1 hour - for rarely changing data
  day: 86400, // 24 hours - for static data
}

/**
 * Generic cache getter with fallback
 * @param key - Cache key
 * @param fetchFn - Function to fetch fresh data if cache miss
 * @param ttl - Time to live in seconds
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.medium
): Promise<T> {
  const redis = getRedisClient()

  // If Redis is not available, just fetch the data
  if (!redis) {
    return fetchFn()
  }

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key)
    
    if (cached !== null) {
      console.log(`✅ Cache HIT: ${key}`)
      return cached
    }

    console.log(`❌ Cache MISS: ${key}`)
    
    // Fetch fresh data
    const freshData = await fetchFn()
    
    // Store in cache (fire and forget)
    redis.setex(key, ttl, freshData).catch((err: unknown) => {
      console.error(`Failed to set cache for ${key}:`, err)
    })
    
    return freshData
  } catch (error) {
    console.error(`Cache error for ${key}:`, error)
    // On cache error, fall back to fetching
    return fetchFn()
  }
}

/**
 * Invalidate (delete) cache entries
 * @param keys - Array of cache keys to invalidate
 */
export async function invalidateCache(keys: string | string[]): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    const keyArray = Array.isArray(keys) ? keys : [keys]
    await redis.del(...keyArray)
    console.log(`🗑️ Invalidated cache: ${keyArray.join(', ')}`)
  } catch (error) {
    console.error('Failed to invalidate cache:', error)
  }
}

/**
 * Invalidate cache entries matching a pattern
 * @param pattern - Pattern to match (e.g., "course:*")
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    // Note: Upstash Redis doesn't support SCAN, so we'll use a simple DEL
    // For pattern-based deletion, you may need to maintain a separate index
    console.log(`⚠️ Pattern-based cache invalidation not fully supported: ${pattern}`)
    console.log('Consider maintaining explicit cache key indexes for bulk invalidation')
  } catch (error) {
    console.error('Failed to invalidate cache by pattern:', error)
  }
}

/**
 * Set a value in cache
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CacheTTL.medium
): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.setex(key, ttl, value)
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`)
  } catch (error) {
    console.error(`Failed to set cache for ${key}:`, error)
  }
}

export default getRedisClient
