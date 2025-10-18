import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const updateSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  order_index: z.number().min(0).optional(),
  is_published: z.boolean().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
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

    // Get the section first
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('course_id')
      .eq('id', params.sectionId)
      .single()

    if (sectionError) {
      logger.error('Section query error:', sectionError)
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Then check course ownership
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

    const body = await request.json()
    const validatedData = updateSectionSchema.parse(body)

    // Update the section
    const { data: updatedSection, error: updateError } = await supabase
      .from('sections')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.sectionId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating section:', updateError)
      return NextResponse.json(
        { error: 'Failed to update section' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedSection)

  } catch (error) {
    logger.error('Error in update section API:', error)
    
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
  { params }: { params: { sectionId: string } }
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

    // Get the section first
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('course_id')
      .eq('id', params.sectionId)
      .single()

    if (sectionError) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Then check course ownership
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

    // Delete the section (this will cascade delete questions due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('id', params.sectionId)

    if (deleteError) {
      logger.error('Error deleting section:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Error in delete section API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
