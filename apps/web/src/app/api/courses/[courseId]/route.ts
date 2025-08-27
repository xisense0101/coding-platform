import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Fetch the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', params.courseId)
      .single()

    if (courseError) {
      console.error('Error fetching course:', courseError)
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this course
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || 
        (course.teacher_id !== user.id && 
         userProfile.role !== 'admin' && 
         course.organization_id !== userProfile.organization_id)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(course)

  } catch (error) {
    console.error('Error in course API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Update the course
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.courseId)
      .eq('teacher_id', user.id) // Ensure only course owner can update
      .select()
      .single()

    if (updateError) {
      console.error('Error updating course:', updateError)
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      )
    }

    return NextResponse.json(course)

  } catch (error) {
    console.error('Error in course update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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
      .select('teacher_id')
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

    // Delete the course (this will cascade delete sections, questions, etc. due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.courseId)

    if (deleteError) {
      console.error('Error deleting course:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in delete course API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
