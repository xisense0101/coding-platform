import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

// Validation schemas
const testCaseSchema = z.object({
  id: z.number(),
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean(),
  weight: z.number().optional()
})

const mcqQuestionSchema = z.object({
  type: z.literal('mcq'),
  title: z.string(),
  content: z.string(),
  points: z.number(),
  options: z.array(z.string()),
  correctAnswer: z.union([z.string(), z.number()])
})

const codingQuestionSchema = z.object({
  type: z.literal('coding'),
  title: z.string(),
  content: z.string(),
  points: z.number(),
  code: z.string().optional(),
  head: z.union([z.string(), z.record(z.string())]).optional(),
  body_template: z.union([z.string(), z.record(z.string())]).optional(),
  tail: z.union([z.string(), z.record(z.string())]).optional(),
  languages: z.array(z.string()).optional(),
  testCases: z.array(testCaseSchema).optional()
})

const questionSchema = z.union([mcqQuestionSchema, codingQuestionSchema])

const sectionSchema = z.object({
  name: z.string(),
  questions: z.array(questionSchema)
})

const examSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
  start_time: z.string(),
  end_time: z.string(),
  is_published: z.boolean().optional(),
  examUrl: z.string().optional(),
  test_code: z.string().optional().nullable(),
  test_code_type: z.enum(['permanent', 'rotating']).optional(),
  test_code_rotation_minutes: z.number().optional().nullable(),
  test_code_last_rotated: z.string().optional().nullable(),
  
  // Monitoring settings
  strict_level: z.number().optional(),
  max_tab_switches: z.number().optional(),
  max_screen_lock_duration: z.number().optional(),
  auto_terminate_on_violations: z.boolean().optional(),
  track_tab_switches: z.boolean().optional(),
  track_screen_locks: z.boolean().optional(),
  detect_vm: z.boolean().optional(),
  require_single_monitor: z.boolean().optional(),
  allow_zoom_changes: z.boolean().optional(),

  sections: z.array(sectionSchema)
})

export async function POST(request: NextRequest) {
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

    // Get user profile to check if they're a teacher
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

    if (userProfile.role !== 'teacher' && userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only teachers can create exams.' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    logger.log('Received exam data:', JSON.stringify(body, null, 2))
    
    let validatedData
    try {
      validatedData = examSchema.parse(body)
    } catch (validationError) {
      logger.error('Validation error details:', validationError)
      if (validationError instanceof z.ZodError) {
        logger.error('Specific validation errors:', validationError.errors)
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors,
            receivedData: body 
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Generate slug if not provided
    const slug = validatedData.examUrl || 
      `exam-${validatedData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`

    // Parse the datetime strings
    const startDateTime = new Date(validatedData.start_time)
    const endDateTime = new Date(validatedData.end_time)

    logger.log('Date processing:')
    logger.log('start_time:', validatedData.start_time)
    logger.log('end_time:', validatedData.end_time)
    logger.log('startDateTime:', startDateTime.toISOString())
    logger.log('endDateTime:', endDateTime.toISOString())

    // Validate the datetime objects
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date or time format' },
        { status: 400 }
      )
    }

    // Validate dates
    if (startDateTime >= endDateTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Create exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .insert({
        organization_id: userProfile.organization_id,
        title: validatedData.title,
        slug: slug,
        description: validatedData.description || '',
        teacher_id: session.user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: validatedData.duration_minutes,
        is_published: validatedData.is_published || false,
        test_code: validatedData.test_code || null,
        test_code_type: validatedData.test_code_type || 'permanent',
        test_code_rotation_minutes: validatedData.test_code_rotation_minutes || null,
        test_code_last_rotated: validatedData.test_code_last_rotated || null,
        
        // Monitoring settings
        strict_level: validatedData.strict_level ?? 1,
        max_tab_switches: validatedData.max_tab_switches ?? 3,
        max_screen_lock_duration: validatedData.max_screen_lock_duration ?? 30,
        auto_terminate_on_violations: validatedData.auto_terminate_on_violations ?? false,
        track_tab_switches: validatedData.track_tab_switches ?? true,
        track_screen_locks: validatedData.track_screen_locks ?? true,
        detect_vm: validatedData.detect_vm ?? true,
        require_single_monitor: validatedData.require_single_monitor ?? false,
        allow_zoom_changes: validatedData.allow_zoom_changes ?? true,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (examError) {
      logger.error('Error creating exam:', examError)
      return NextResponse.json(
        { error: 'Failed to create exam', details: examError.message },
        { status: 500 }
      )
    }

    // Create exam sections and questions
    let totalMarks = 0

    for (const [sectionIndex, section] of validatedData.sections.entries()) {
      // Create exam section
      const { data: sectionData, error: sectionError } = await supabase
        .from('exam_sections')
        .insert({
          exam_id: examData.id,
          title: section.name,
          description: '',
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
              options: question.options.map((opt, idx) => ({
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
          const formattedTestCases = (question.testCases || []).map(tc => ({
            input: tc.input,
            expected_output: tc.expectedOutput,
            is_hidden: tc.isHidden,
            weight: tc.weight || 1
          }))

          // Format boilerplate code
          const boilerplateCode = question.languages?.reduce((acc, lang) => {
            acc[lang.toLowerCase()] = question.code || ''
            return acc
          }, {} as Record<string, string>) || { javascript: question.code || '' }

          // Format head, body_template, tail per language
          // Handle both string and object formats
          const head = typeof question.head === 'object' 
            ? question.head 
            : (question.languages?.reduce((acc, lang) => {
                acc[lang.toLowerCase()] = (typeof question.head === 'string' ? question.head : '') || ''
                return acc
              }, {} as Record<string, string>) || {})

          const bodyTemplate = typeof question.body_template === 'object'
            ? question.body_template
            : (question.languages?.reduce((acc, lang) => {
                const template = typeof question.body_template === 'string' ? question.body_template : ''
                const code = question.code || ''
                acc[lang.toLowerCase()] = template || code || ''
                return acc
              }, {} as Record<string, string>) || { javascript: (typeof question.body_template === 'string' ? question.body_template : '') || question.code || '' })

          const tail = typeof question.tail === 'object'
            ? question.tail
            : (question.languages?.reduce((acc, lang) => {
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
      .eq('id', examData.id)

    if (updateError) {
      logger.error('Error updating exam total marks:', updateError)
    }

    return NextResponse.json({
      success: true,
      examId: examData.id,
      slug: examData.slug,
      message: 'Exam created successfully'
    })

  } catch (error) {
    logger.error('Error in exam creation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const url = new URL(request.url)
    const myExams = url.searchParams.get('my_exams') === 'true'

    let query = supabase
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
          order_index,
          exam_questions(
            id,
            points,
            question:questions(
              id,
              title,
              type
            )
          )
        )
      `)
      .eq('organization_id', userProfile.organization_id)
      .order('created_at', { ascending: false })

    // Filter by teacher if requested
    if (myExams && (userProfile.role === 'teacher' || userProfile.role === 'admin')) {
      query = query.eq('teacher_id', session.user.id)
    }

    const { data: exams, error: examsError } = await query

    if (examsError) {
      logger.error('Error fetching exams:', examsError)
      return NextResponse.json(
        { error: 'Failed to fetch exams', details: examsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exams: exams || []
    })

  } catch (error) {
    logger.error('Error in exam fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
