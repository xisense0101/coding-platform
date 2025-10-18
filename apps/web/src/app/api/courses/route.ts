import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  course_code: z.string().optional(),
  credit_hours: z.number().min(0).default(0),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimated_hours: z.number().min(0).default(0),
  prerequisites: z.array(z.string()).default([]),
  learning_objectives: z.array(z.string()).default([]),
  is_free: z.boolean().default(true),
  price: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  enrollment_limit: z.number().optional(),
  enrollment_start_date: z.string().optional(),
  enrollment_end_date: z.string().optional(),
  course_start_date: z.string().optional(),
  course_end_date: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  banner_image_url: z.string().url().optional()
})

// GET /api/courses - List courses with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    
    logger.log('Courses API: Starting request processing')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.log('Courses API: Auth error or no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.log('Courses API: User authenticated:', user.id)

    // Get user profile for organization context
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      logger.error('Courses API: Profile error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    logger.log('Courses API: User profile:', userProfile)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const teacher_id = searchParams.get('teacher_id') || ''
    const is_published = searchParams.get('published') !== 'false'
    const my_courses = searchParams.get('my_courses') === 'true'

    logger.log('Courses API: Query params:', { my_courses, userProfile: userProfile.role })

    let query = supabase
      .from('courses')
      .select('*')
      .eq('organization_id', userProfile.organization_id)

    logger.log('Courses API: Base query created')

    // Apply filters
    if (is_published && !['teacher', 'admin', 'super_admin'].includes(userProfile.role)) {
      query = query.eq('is_published', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    if (teacher_id) {
      query = query.eq('teacher_id', teacher_id)
    }

    if (my_courses && userProfile.role === 'teacher') {
      logger.log('Courses API: Filtering for teacher courses')
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
        return NextResponse.json({
          courses: [],
          total: 0,
          page,
          limit,
          total_pages: 0
        })
      }
    }

    logger.log('Courses API: About to execute query')

    // Fetch courses
    const { data: courses, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Courses API: Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: error.message },
        { status: 500 }
      )
    }

    logger.log('Courses API: Found courses:', courses?.length || 0)

    // Fetch teacher names for courses
    const coursesWithTeachers = await Promise.all(
      (courses || []).map(async (course: any) => {
        if (course.teacher_id) {
          const { data: teacher } = await supabase
            .from('users')
            .select('full_name, profile_image_url')
            .eq('id', course.teacher_id)
            .single()

          return {
            ...course,
            users: teacher || { full_name: 'Unknown Teacher' }
          }
        }
        return {
          ...course,
          users: { full_name: 'Unknown Teacher' }
        }
      })
    )

    // Apply pagination manually for now
    const total = coursesWithTeachers.length
    const offset = (page - 1) * limit
    const paginatedCourses = coursesWithTeachers.slice(offset, offset + limit)

    logger.log('Courses API: Returning response')

    return NextResponse.json({
      courses: paginatedCourses,
      total: total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    })

  } catch (error) {
    logger.error('Courses API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for organization context and role check
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user can create courses
    if (!['teacher', 'admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()

    const courseData = {
      ...validatedData,
      organization_id: userProfile.organization_id,
      teacher_id: user.id,
      co_teachers: [],
      is_published: false, // Default to draft
      enrollment_count: 0,
      completion_count: 0,
      rating_average: 0,
      rating_count: 0
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) {
      logger.error('Error creating course:', error)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('analytics_events')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: user.id,
        event_type: 'course_created',
        event_category: 'course_management',
        event_data: {
          course_id: course.id,
          course_title: course.title
        },
        page_url: '/teacher/courses/new'
      })

    return NextResponse.json(course)

  } catch (error) {
    logger.error('Create course API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
