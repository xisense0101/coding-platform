import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const updateQuestionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  points: z.number().min(1).default(1),
  is_published: z.boolean().optional(),
  order_index: z.number().min(0).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionId: string } }
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

    const body = await request.json()
    const validatedData = updateQuestionSchema.parse(body)

    // Update the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.questionId)
      .eq('created_by', user.id) // Ensure only question creator can update
      .select()
      .single()

    if (questionError) {
      logger.error('Error updating question:', questionError)
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      )
    }

    return NextResponse.json(question)

  } catch (error) {
    logger.error('Error in update question API:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } }
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

    // Get the question first to verify ownership
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('section_id')
      .eq('id', params.questionId)
      .single()

    if (questionError) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Get the section to get the course_id
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('course_id')
      .eq('id', question.section_id)
      .single()

    if (sectionError) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Check course ownership
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', section.course_id)
      .single()

    if (courseError || course.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete the question (this will cascade delete MCQ/coding details due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', params.questionId)

    if (deleteError) {
      logger.error('Error deleting question:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Error in delete question API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
