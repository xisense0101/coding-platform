# Database Optimization Guide

This guide provides best practices for optimizing database queries and performance in the Coding Platform.

## Connection Pooling

Supabase automatically handles connection pooling, but you can optimize by:

### 1. Reuse Client Instances

```typescript
// Bad - Creates new client for each request
export async function handler() {
  const supabase = createSupabaseServerClient()
  // ...
}

// Good - Reuse client
const supabase = createSupabaseServerClient()

export async function handler() {
  // Use the same client
}
```

### 2. Use Singleton Pattern for Services

```typescript
class UserService {
  private static instance: UserService
  private supabase = createClient()

  static getInstance() {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }
}
```

## Query Optimization

### 1. Select Only Needed Columns

```typescript
// Bad - Fetches all columns
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// Good - Selects specific columns
const { data } = await supabase
  .from('users')
  .select('id, email, full_name')
  .eq('id', userId)
```

### 2. Use Proper Indexing

Ensure your database has indexes on frequently queried columns:

```sql
-- Index on foreign keys
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_question_id ON attempts(question_id);

-- Index on commonly filtered columns
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_courses_is_published ON courses(is_published);

-- Composite indexes for common query patterns
CREATE INDEX idx_attempts_user_question ON attempts(user_id, question_id);
CREATE INDEX idx_users_org_role ON users(organization_id, role);
```

### 3. Use `.single()` for Single Row Queries

```typescript
// Bad - Returns array
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .limit(1)

// Good - Returns single object
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### 4. Limit Results and Use Pagination

```typescript
// Always set a limit
const { data } = await supabase
  .from('users')
  .select('*')
  .range(offset, offset + limit - 1)
  .limit(100)
```

### 5. Use Count Efficiently

```typescript
// For pagination, use count: 'exact' only when needed
const { data, count } = await supabase
  .from('users')
  .select('*', { count: 'exact' })
  .range(0, 9)

// For simple existence checks, use limit(1)
const { data } = await supabase
  .from('users')
  .select('id')
  .eq('email', email)
  .limit(1)

if (data && data.length > 0) {
  // User exists
}
```

### 6. Batch Operations

```typescript
// Bad - Multiple individual inserts
for (const user of users) {
  await supabase.from('users').insert(user)
}

// Good - Single batch insert
await supabase.from('users').insert(users)
```

## Caching Strategies

### 1. Cache Frequently Accessed Data

```typescript
import { cache, CACHE_TTL } from '@/core/utils'

export async function getCourse(courseId: string) {
  return cache.getOrSet(
    `course:${courseId}`,
    async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      return data
    },
    CACHE_TTL.LONG
  )
}
```

### 2. Invalidate Cache on Updates

```typescript
export async function updateCourse(courseId: string, updates: any) {
  // Update database
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .single()

  if (!error) {
    // Invalidate cache
    await cache.del(`course:${courseId}`)
  }

  return { data, error }
}
```

### 3. Use Cache for List Queries

```typescript
export async function listCourses(filters: any) {
  const cacheKey = `courses:${JSON.stringify(filters)}`
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .match(filters)
      return data
    },
    CACHE_TTL.MEDIUM
  )
}
```

## N+1 Query Prevention

### 1. Use Joins Instead of Multiple Queries

```typescript
// Bad - N+1 queries
const { data: courses } = await supabase.from('courses').select('*')
for (const course of courses) {
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('course_id', course.id)
  // ...
}

// Good - Single query with join
const { data: courses } = await supabase
  .from('courses')
  .select(`
    *,
    sections (*)
  `)
```

### 2. Batch Load Related Data

```typescript
// Get course IDs
const courseIds = courses.map(c => c.id)

// Batch load all sections
const { data: sections } = await supabase
  .from('sections')
  .select('*')
  .in('course_id', courseIds)

// Group sections by course_id
const sectionsByCourse = sections.reduce((acc, section) => {
  if (!acc[section.course_id]) acc[section.course_id] = []
  acc[section.course_id].push(section)
  return acc
}, {})
```

## Query Planning

### 1. Analyze Query Performance

Use `EXPLAIN ANALYZE` in Supabase SQL Editor:

```sql
EXPLAIN ANALYZE
SELECT * FROM users
WHERE organization_id = 'xxx'
AND role = 'student';
```

### 2. Monitor Slow Queries

Enable slow query logging in Supabase dashboard and review regularly.

## Transaction Handling

### 1. Use Transactions for Related Operations

```typescript
// Use RPC for transactions
const { data, error } = await supabase.rpc('create_user_with_profile', {
  user_data: { ... },
  profile_data: { ... }
})
```

### 2. Handle Failures Properly

```typescript
export async function createUserWithProfile(userData: any, profileData: any) {
  try {
    // Start transaction implicitly
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .single()

    if (userError) throw userError

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({ ...profileData, user_id: user.id })
      .single()

    if (profileError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id)
      throw profileError
    }

    return { user, profile }
  } catch (error) {
    logger.error('Failed to create user with profile', error)
    throw error
  }
}
```

## Best Practices Summary

1. ✅ Always use `.select()` with specific columns
2. ✅ Add indexes on frequently queried columns
3. ✅ Use `.single()` for single-row queries
4. ✅ Implement pagination with `range()`
5. ✅ Cache frequently accessed data
6. ✅ Invalidate cache on updates
7. ✅ Prevent N+1 queries with joins
8. ✅ Use batch operations for multiple records
9. ✅ Monitor and optimize slow queries
10. ✅ Handle transactions properly

## Monitoring

### 1. Log Slow Queries

```typescript
const start = Date.now()
const { data, error } = await supabase.from('users').select('*')
const duration = Date.now() - start

if (duration > 1000) {
  logger.warn('Slow query detected', { duration, query: 'users' })
}
```

### 2. Track Cache Hit Rate

```typescript
let cacheHits = 0
let cacheMisses = 0

export async function getCached(key: string) {
  const cached = await cache.get(key)
  if (cached) {
    cacheHits++
  } else {
    cacheMisses++
  }
  
  // Log metrics periodically
  if ((cacheHits + cacheMisses) % 100 === 0) {
    const hitRate = cacheHits / (cacheHits + cacheMisses)
    logger.info('Cache metrics', { hitRate, hits: cacheHits, misses: cacheMisses })
  }
  
  return cached
}
```

## Further Reading

- [Supabase Performance Guide](https://supabase.com/docs/guides/performance)
- [PostgreSQL Query Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)
