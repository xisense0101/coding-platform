import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const createQuestionSchema = z.object({
  type: z.enum(['mcq', 'coding', 'essay']),
  title: z.string().min(1, 'Question title is required'),
  description: z.string().optional(),
  points: z.number().min(1).default(1),
  order_index: z.number().min(0).default(0)
})

const updateQuestionSchema = z.object({
  title: z.string().min(1, 'Question title is required').optional(),
  description: z.string().optional(),
  points: z.number().min(1).optional(),
  order_index: z.number().min(0).optional(),
  is_published: z.boolean().optional()
})

// Create a new question in a section
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; sectionId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id, organization_id')
      .eq('id', params.courseId)
      .single()

    if (courseError) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Verify section exists and belongs to course
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id')
      .eq('id', params.sectionId)
      .eq('course_id', params.courseId)
      .single()

    if (sectionError) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createQuestionSchema.parse(body)

    // Create the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        organization_id: course.organization_id,
        section_id: params.sectionId,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        points: validatedData.points,
        order_index: validatedData.order_index,
        is_published: false,
        created_by: user.id
      })
      .select()
      .single()

    if (questionError) {
      logger.error('Error creating question:', questionError)
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      )
    }

    return NextResponse.json(question)

  } catch (error) {
    logger.error('Error in create question API:', error)
    
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
