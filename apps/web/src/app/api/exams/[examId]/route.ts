import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

import { logger } from '@/lib/utils/logger'

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
        test_code,
        test_code_type,
        test_code_rotation_minutes,
        test_code_last_rotated,
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
      logger.error('Error fetching exam:', examError)
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
    logger.error('Error in exam fetch:', error)
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
    logger.log('PATCH exam received data:', JSON.stringify(body, null, 2))

    // Update exam basic info
    const examUpdateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Only update fields that are provided
    if (body.title !== undefined) examUpdateData.title = body.title
    if (body.description !== undefined) examUpdateData.description = body.description
    if (body.slug !== undefined) examUpdateData.slug = body.slug
    if (body.start_time !== undefined) examUpdateData.start_time = body.start_time
    if (body.end_time !== undefined) examUpdateData.end_time = body.end_time
    if (body.duration_minutes !== undefined) examUpdateData.duration_minutes = body.duration_minutes
    if (body.is_published !== undefined) examUpdateData.is_published = body.is_published
    if (body.test_code !== undefined) examUpdateData.test_code = body.test_code
    if (body.test_code_type !== undefined) examUpdateData.test_code_type = body.test_code_type
    if (body.test_code_rotation_minutes !== undefined) examUpdateData.test_code_rotation_minutes = body.test_code_rotation_minutes
    if (body.test_code_last_rotated !== undefined) examUpdateData.test_code_last_rotated = body.test_code_last_rotated

    // Monitoring settings
    if (body.strict_level !== undefined) examUpdateData.strict_level = body.strict_level
    if (body.max_tab_switches !== undefined) examUpdateData.max_tab_switches = body.max_tab_switches
    if (body.max_screen_lock_duration !== undefined) examUpdateData.max_screen_lock_duration = body.max_screen_lock_duration
    if (body.auto_terminate_on_violations !== undefined) examUpdateData.auto_terminate_on_violations = body.auto_terminate_on_violations
    if (body.track_tab_switches !== undefined) examUpdateData.track_tab_switches = body.track_tab_switches
    if (body.track_screen_locks !== undefined) examUpdateData.track_screen_locks = body.track_screen_locks
    if (body.detect_vm !== undefined) examUpdateData.detect_vm = body.detect_vm
    if (body.require_single_monitor !== undefined) examUpdateData.require_single_monitor = body.require_single_monitor
    if (body.allow_zoom_changes !== undefined) examUpdateData.allow_zoom_changes = body.allow_zoom_changes

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .update(examUpdateData)
      .eq('id', params.examId)
      .eq('organization_id', userProfile.organization_id)
      .eq('teacher_id', session.user.id)
      .select()
      .single()

    if (examError) {
      logger.error('Error updating exam:', examError)
      return NextResponse.json(
        { error: 'Failed to update exam' },
        { status: 500 }
      )
    }

    // If sections are provided, update them (delete old ones and create new ones)
    if (body.sections && Array.isArray(body.sections)) {
      logger.log('Updating exam sections and questions...')
      
      // Delete existing sections (cascade will delete questions)
      const { error: deleteSectionsError } = await supabase
        .from('exam_sections')
        .delete()
        .eq('exam_id', params.examId)

      if (deleteSectionsError) {
        logger.error('Error deleting old sections:', deleteSectionsError)
      }

      // Create new sections and questions
      let totalMarks = 0

      for (const [sectionIndex, section] of body.sections.entries()) {
        // Create exam section
        const { data: sectionData, error: sectionError } = await supabase
          .from('exam_sections')
          .insert({
            exam_id: params.examId,
            title: section.name,
            description: section.description || '',
            order_index: sectionIndex,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (sectionError) {
          logger.error('Error creating exam section:', sectionError)
          continue
        }

        // Create questions for this section
        for (const [questionIndex, question] of section.questions.entries()) {
          // Create base question
          const { data: baseQuestion, error: baseQuestionError } = await supabase
            .from('questions')
            .insert({
              organization_id: userProfile.organization_id,
              type: question.type,
              title: question.title,
              description: question.content,
              points: question.points,
              order_index: questionIndex,
              is_published: true,
              created_by: session.user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (baseQuestionError) {
            logger.error('Error creating base question:', baseQuestionError)
            continue
          }

          // Create question type-specific data
          if (question.type === 'mcq') {
            const { error: mcqError } = await supabase
              .from('mcq_questions')
              .insert({
                question_id: baseQuestion.id,
                question_text: question.content,
                options: question.options.map((opt: any, idx: number) => ({
                  id: idx,
                  text: opt,
                  rich_text: null,
                  image_url: null
                })),
                correct_answers: [question.correctAnswer],
                is_multiple_choice: false,
                randomize_options: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (mcqError) {
              logger.error('Error creating MCQ question:', mcqError)
            }
          } else if (question.type === 'coding') {
            // Format test cases for database
            const formattedTestCases = (question.testCases || []).map((tc: any) => ({
              input: tc.input,
              expected_output: tc.expectedOutput,
              is_hidden: tc.isHidden,
              weight: 1
            }))

            // Format boilerplate code
            const boilerplateCode = question.languages?.reduce((acc: any, lang: string) => {
              acc[lang.toLowerCase()] = question.code || ''
              return acc
            }, {} as Record<string, string>) || { javascript: question.code || '' }

            // Format head, body_template, tail per language
            const head = typeof question.head === 'object' 
              ? question.head 
              : (question.languages?.reduce((acc: any, lang: string) => {
                  acc[lang.toLowerCase()] = (typeof question.head === 'string' ? question.head : '') || ''
                  return acc
                }, {} as Record<string, string>) || {})

            const bodyTemplate = typeof question.body_template === 'object'
              ? question.body_template
              : (question.languages?.reduce((acc: any, lang: string) => {
                  const template = typeof question.body_template === 'string' ? question.body_template : ''
                  const code = question.code || ''
                  acc[lang.toLowerCase()] = template || code || ''
                  return acc
                }, {} as Record<string, string>) || { javascript: (typeof question.body_template === 'string' ? question.body_template : '') || question.code || '' })

            const tail = typeof question.tail === 'object'
              ? question.tail
              : (question.languages?.reduce((acc: any, lang: string) => {
                  acc[lang.toLowerCase()] = (typeof question.tail === 'string' ? question.tail : '') || ''
                  return acc
                }, {} as Record<string, string>) || {})

            const { error: codingError } = await supabase
              .from('coding_questions')
              .insert({
                question_id: baseQuestion.id,
                problem_statement: question.content,
                boilerplate_code: boilerplateCode,
                head: head,
                body_template: bodyTemplate,
                tail: tail,
                test_cases: formattedTestCases,
                allowed_languages: question.languages || ['javascript'],
                time_limit: 30,
                memory_limit: 128,
                is_solution_provided: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (codingError) {
              logger.error('Error creating coding question:', codingError)
            }
          }

          // Link question to exam section
          const { error: examQuestionError } = await supabase
            .from('exam_questions')
            .insert({
              exam_section_id: sectionData.id,
              question_id: baseQuestion.id,
              order_index: questionIndex,
              points: question.points,
              is_required: true,
              created_at: new Date().toISOString()
            })

          if (examQuestionError) {
            logger.error('Error linking question to exam:', examQuestionError)
          }

          totalMarks += question.points
        }
      }

      // Update exam with total marks
      const { error: updateError } = await supabase
        .from('exams')
        .update({ 
          total_marks: totalMarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.examId)

      if (updateError) {
        logger.error('Error updating exam total marks:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      exam
    })

  } catch (error) {
    logger.error('Error in exam update:', error)
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
      logger.error('Error deleting exam:', examError)
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
    logger.error('Error in exam deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
