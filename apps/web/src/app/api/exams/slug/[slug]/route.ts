import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    // First, check if exam exists with this slug
    const { data: examCheck, error: checkError } = await supabase
      .from('exams')
      .select('id, title, slug, is_published')
      .eq('slug', params.slug)

    logger.log('Exam check for slug:', params.slug, { examCheck, checkError })

    if (checkError) {
      logger.error('Error checking exam:', checkError)
      return NextResponse.json(
        { error: 'Error checking exam', details: checkError.message },
        { status: 500 }
      )
    }

    if (!examCheck || examCheck.length === 0) {
      return NextResponse.json(
        { error: 'Exam not found', details: `No exam found with slug: ${params.slug}` },
        { status: 404 }
      )
    }

    if (examCheck.length > 1) {
      logger.error('Multiple exams with same slug:', examCheck)
      return NextResponse.json(
        { error: 'Multiple exams found', details: 'Database integrity issue - duplicate slugs' },
        { status: 500 }
      )
    }

    const examInfo = examCheck[0]
    if (!examInfo.is_published) {
      return NextResponse.json(
        { error: 'Exam not published', details: 'This exam is not yet available' },
        { status: 403 }
      )
    }

    // Fetch exam by slug with all related data
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        slug,
        instructions,
        start_time,
        end_time,
        duration_minutes,
        total_marks,
        is_published,
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
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single()

    if (examError) {
      logger.error('Error fetching exam:', examError)
      return NextResponse.json(
        { error: 'Exam not found', details: examError.message },
        { status: 404 }
      )
    }

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or not published' },
        { status: 404 }
      )
    }

    // Check if exam is currently active (with some leniency for testing)
    const now = new Date()
    const startTime = new Date(exam.start_time)
    const endTime = new Date(exam.end_time)

    logger.log('Exam time check:', {
      now: now.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      examTitle: exam.title,
      slug: params.slug
    })

    // Allow access if within 5 minutes before start (for testing)
    const earlyAccessMinutes = 5
    const earlyStartTime = new Date(startTime.getTime() - earlyAccessMinutes * 60 * 1000)

    if (now < earlyStartTime) {
      return NextResponse.json(
        { 
          error: 'Exam has not started yet', 
          start_time: exam.start_time,
          current_time: now.toISOString()
        },
        { status: 403 }
      )
    }

    if (now > endTime) {
      return NextResponse.json(
        { 
          error: 'Exam has ended', 
          end_time: exam.end_time,
          current_time: now.toISOString()
        },
        { status: 403 }
      )
    }

    // Format the exam data for the frontend
    const formattedExam = {
      ...exam,
      sections: exam.exam_sections?.map(section => ({
        ...section,
        questions: section.exam_questions?.map(examQuestion => {
          const question = examQuestion.question as any
          return {
            ...examQuestion,
            question: {
              ...question,
              mcq_question: question.mcq_questions?.[0] ? {
                question_text: question.mcq_questions[0].question_text,
                options: question.mcq_questions[0].options.map((opt: any, index: number) => ({
                  id: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd' instead of "0", "1", "2", "3"
                  text: opt.text || opt,
                  isCorrect: question.mcq_questions[0].correct_answers.includes(index)
                })),
                correct_answers: question.mcq_questions[0].correct_answers,
                explanation: question.mcq_questions[0].explanation
              } : undefined,
              coding_question: question.coding_questions?.[0] ? {
                problem_statement: question.coding_questions[0].problem_statement,
                boilerplate_code: question.coding_questions[0].boilerplate_code,
                test_cases: question.coding_questions[0].test_cases,
                allowed_languages: question.coding_questions[0].allowed_languages,
                time_limit: question.coding_questions[0].time_limit,
                memory_limit: question.coding_questions[0].memory_limit,
                head: question.coding_questions[0].head,
                body_template: question.coding_questions[0].body_template,
                tail: question.coding_questions[0].tail
              } : undefined
            }
          }
        }).sort((a, b) => a.order_index - b.order_index)
      })).sort((a, b) => a.order_index - b.order_index)
    }

    return NextResponse.json({
      success: true,
      exam: formattedExam
    })

  } catch (error) {
    logger.error('Error in exam fetch by slug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
