import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getCached, invalidateCache, CacheKeys, CacheTTL } from '@/lib/redis/client'
import { logger } from '@/lib/utils/logger'

// GET /api/courses - List courses with caching and optimization
export const GET = withAuth(
  async (request: NextRequest, { user, userProfile, supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
      const search = searchParams.get('search') || ''
      const category = searchParams.get('category') || ''
      const difficulty = searchParams.get('difficulty') || ''
      const teacher_id = searchParams.get('teacher_id') || ''
      const is_published = searchParams.get('published') !== 'false'
      const my_courses = searchParams.get('my_courses') === 'true'

      // Create cache key based on filters
      const filterKey = JSON.stringify({
        page,
        limit,
        search,
        category,
        difficulty,
        teacher_id,
        is_published,
        my_courses,
        userId: user.id,
        role: userProfile.role
      })

      const result = await getCached(
        CacheKeys.courses(filterKey),
        async () => {
          logger.log('Courses API: User profile:', userProfile)

          let query = supabase
            .from('courses')
            .select('*', { count: 'exact' })
            .eq('organization_id', userProfile.organization_id)

          // Apply filters
          if (is_published) {
            query = query.eq('is_published', true)
          }

          if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
          }

          if (category) {
            query = query.eq('category', category)
          }

          if (difficulty) {
            query = query.eq('difficulty_level', difficulty)
          }

          if (teacher_id) {
            query = query.eq('teacher_id', teacher_id)
          }

          // Handle "my courses" filter
          if (my_courses && userProfile.role === 'teacher') {
            query = query.eq('teacher_id', user.id)
          } else if (my_courses && userProfile.role === 'student') {
            // For students, get enrolled courses
            const { data: enrollments } = await supabase
              .from('course_enrollments')
              .select('course_id')
              .eq('student_id', user.id)
              .eq('is_active', true)

            const courseIds = enrollments?.map((e: any) => e.course_id) || []
            if (courseIds.length > 0) {
              query = query.in('id', courseIds)
            } else {
              // No enrollments, return empty result
              return {
                courses: [],
                total: 0,
                page,
                limit,
                total_pages: 0
              }
            }
          }

          // Add pagination
          const offset = (page - 1) * limit
          query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

          logger.log('Courses API: About to execute query')

          // Fetch courses
          const { data: courses, error, count } = await query

          if (error) {
            logger.error('Error fetching courses:', error)
            throw error
          }

          const total_pages = count ? Math.ceil(count / limit) : 0

          return {
            courses: courses || [],
            total: count || 0,
            page,
            limit,
            total_pages
          }
        },
        CacheTTL.short // 1 minute cache for list views
      )

      return NextResponse.json(result)

    } catch (error) {
      logger.error('Courses API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true, cacheProfile: true }
)

// POST /api/courses - Create a new course (invalidate cache on create)
export const POST = withAuth(
  async (request: NextRequest, { user, userProfile, supabase }) => {
    try {
      const body = await request.json()

      // Create course logic here...
      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          ...body,
          teacher_id: user.id,
          organization_id: userProfile.organization_id,
        })
        .select()
        .single()

      if (error) throw error

      // Invalidate relevant caches
      await invalidateCache([
        CacheKeys.courses('*'), // Invalidate all course list caches
        CacheKeys.teacherStats(user.id),
      ])

      return NextResponse.json({ success: true, course })

    } catch (error) {
      logger.error('Create course error:', error)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }
  },
  { requireRole: 'admin-or-teacher', cacheProfile: true }
)
