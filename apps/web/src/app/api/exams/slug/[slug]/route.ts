import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getCached, invalidateCache, CacheKeys, CacheTTL } from '@/lib/redis/client'
import { logger } from '@/lib/utils/logger'

// GET /api/exams/slug/[slug] - Get exam by slug with caching
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = require('@/lib/database/supabase-server').createSupabaseServerClient()

    // Use cached exam data
    const examData = await getCached(
      CacheKeys.examBySlug(params.slug),
      async () => {
        // First, check if exam exists with this slug
        const { data: examCheck, error: checkError } = await supabase
          .from('exams')
          .select('id, title, slug, is_published')
          .eq('slug', params.slug)

        logger.log('Exam check for slug:', params.slug, { examCheck, checkError })

        if (checkError) {
          logger.error('Error checking exam:', checkError)
          throw new Error('Error checking exam')
        }

        if (!examCheck || examCheck.length === 0) {
          throw new Error('Exam not found')
        }

        const exam = examCheck[0]

        // Fetch full exam with all related data in a single query
        const { data: fullExam, error: examError } = await supabase
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
            pass_percentage,
            is_published,
            require_invite_token,
            teacher_id,
            organization_id,
            proctoring_enabled,
            exam_mode,
            strict_level,
            max_tab_switches,
            max_screen_lock_duration,
            auto_terminate_on_violations,
            track_tab_switches,
            track_screen_locks,
            detect_vm,
            require_single_monitor,
            allow_zoom_changes,
            teacher:users!exams_teacher_id_fkey(full_name),
            exam_sections(
              id,
              title,
              description,
              order_index,
              time_limit,
              exam_questions(
                id,
                points,
                order_index,
                is_required,
                question:questions(
                  id,
                  title,
                  description,
                  type,
                  points,
                  difficulty,
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
          .eq('id', exam.id)
          .single()

        if (examError || !fullExam) {
          logger.error('Error fetching full exam:', examError)
          throw new Error('Failed to fetch exam details')
        }

        return fullExam
      },
      CacheTTL.medium // 5 minutes cache for exams
    )

    // Check if exam is published
    if (!examData.is_published) {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Only allow teacher/creator to view unpublished exams
      if (!user || user.id !== examData.teacher_id) {
        return NextResponse.json(
          { error: 'Exam not found', details: `No exam found with slug: ${params.slug}` },
          { status: 404 }
        )
      }
    }

    // Format the exam data for the frontend
    const formattedExam = {
      ...examData,
      sections: (examData.exam_sections || []).map((section: any) => ({
        ...section,
        questions: (section.exam_questions || []).map((examQuestion: any) => {
          const question = examQuestion.question as any
          
          // Safely format MCQ options
          let mcqQuestion = undefined
          if (question?.mcq_questions?.[0]) {
            const mcq = question.mcq_questions[0]
            const options = Array.isArray(mcq.options) ? mcq.options : []
            
            mcqQuestion = {
              question_text: mcq.question_text || '',
              options: options.map((opt: any, index: number) => {
                // Handle both string and object option formats
                const optionText = typeof opt === 'string' ? opt : (opt?.text || opt?.value || '')
                return {
                  id: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd'
                  text: optionText,
                  isCorrect: Array.isArray(mcq.correct_answers) && mcq.correct_answers.includes(index)
                }
              }),
              // Convert correct_answers from numeric indices to letter IDs
              correct_answers: Array.isArray(mcq.correct_answers) 
                ? mcq.correct_answers.map((idx: number) => String.fromCharCode(97 + idx))
                : [],
              is_multiple_choice: mcq.is_multiple_choice || false,
              explanation: mcq.explanation || ''
            }
          }
          
          return {
            ...examQuestion,
            question: {
              ...question,
              mcq_question: mcqQuestion,
              coding_question: question?.coding_questions?.[0]
            }
          }
        }).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      })).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }

    return NextResponse.json({
      success: true,
      exam: formattedExam
    })

  } catch (error: any) {
    logger.error('Error in exam fetch by slug:', error)
    logger.error('Error stack:', error?.stack)
    logger.error('Error message:', error?.message)
    
    if (error.message === 'Exam not found') {
      return NextResponse.json(
        { error: 'Exam not found', details: `No exam found with slug: ${params.slug}` },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
