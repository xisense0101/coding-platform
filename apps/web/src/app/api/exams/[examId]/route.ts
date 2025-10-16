import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Fetch exam with all related data
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        slug,
        start_time,
        end_time,
        duration_minutes,
        total_marks,
        is_published,
        submission_count,
        average_score,
        teacher_id,
        created_at,
        updated_at,
        teacher:users!exams_teacher_id_fkey(full_name),
        exam_sections(
          id,
          title,
          description,
          order_index,
          exam_questions(
            id,
            points,
            order_index,
            question:questions(
              id,
              title,
              description,
              type,
              points,
              mcq_questions(
                id,
                question_text,
                options,
                correct_answers,
                is_multiple_choice,
                explanation
              ),
              coding_questions(
                id,
                problem_statement,
                boilerplate_code,
                test_cases,
                allowed_languages,
                time_limit,
                memory_limit,
                head,
                body_template,
                tail
              )
            )
          )
        )
      `)
      .eq('id', params.examId)
      .eq('organization_id', userProfile.organization_id)
      .single()

    if (examError) {
      console.error('Error fetching exam:', examError)
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this exam
    if (exam.teacher_id !== session.user.id && userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Sort sections and questions by order_index
    exam.exam_sections = exam.exam_sections
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((section: any) => ({
        ...section,
        exam_questions: section.exam_questions.sort((a: any, b: any) => a.order_index - b.order_index)
      }))

    return NextResponse.json({
      success: true,
      exam
    })

  } catch (error) {
    console.error('Error in exam fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Update exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.examId)
      .eq('organization_id', userProfile.organization_id)
      .eq('teacher_id', session.user.id)
      .select()
      .single()

    if (examError) {
      console.error('Error updating exam:', examError)
      return NextResponse.json(
        { error: 'Failed to update exam' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exam
    })

  } catch (error) {
    console.error('Error in exam update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Delete exam (cascade deletes will handle related records)
    const { error: examError } = await supabase
      .from('exams')
      .delete()
      .eq('id', params.examId)
      .eq('organization_id', userProfile.organization_id)
      .eq('teacher_id', session.user.id)

    if (examError) {
      console.error('Error deleting exam:', examError)
      return NextResponse.json(
        { error: 'Failed to delete exam' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully'
    })

  } catch (error) {
    console.error('Error in exam deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
