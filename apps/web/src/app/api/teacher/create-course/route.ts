import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

// Define the schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional(),
  sections: z.array(z.object({
    title: z.string().min(1, 'Section title is required'),
    description: z.string().optional(),
    isVisible: z.boolean().default(true),
    questions: z.array(z.object({
      type: z.enum(['mcq', 'coding', 'essay', 'reading']),
      title: z.string().min(1, 'Question title is required'),
      content: z.string().default(''), // Allow empty content
      points: z.number().positive().default(1),
      isVisible: z.boolean().default(true),
      // MCQ specific fields
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.number()]).optional(),
      // Coding specific fields
      code: z.string().optional(),
      languages: z.array(z.string()).optional(),
      testCases: z.array(z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().default(true)
      })).optional()
    }))
  }))
})

export async function POST(request: NextRequest) {
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

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (userProfile.role !== 'teacher' && userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Create the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        organization_id: userProfile.organization_id,
        title: validatedData.title,
        description: validatedData.description || '',
        teacher_id: user.id,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (courseError) {
      console.error('Error creating course:', courseError)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    // Create sections and questions
    for (const [sectionIndex, sectionData] of validatedData.sections.entries()) {
      // Create section
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .insert({
          course_id: course.id,
          title: sectionData.title,
          description: sectionData.description || '',
          order_index: sectionIndex,
          is_published: sectionData.isVisible,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sectionError) {
        console.error('Error creating section:', sectionError)
        continue // Continue with other sections
      }

      // Create questions for this section
      for (const [questionIndex, questionData] of sectionData.questions.entries()) {
        // Create base question
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            organization_id: userProfile.organization_id,
            section_id: section.id,
            type: questionData.type,
            title: questionData.title,
            description: questionData.content,
            content_type: 'rich',
            rich_content: { content: questionData.content },
            points: questionData.points,
            order_index: questionIndex,
            is_published: questionData.isVisible,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (questionError) {
          console.error('Error creating question:', questionError)
          continue // Continue with other questions
        }

        // Create type-specific question data
        if (questionData.type === 'mcq' && questionData.options && questionData.correctAnswer !== undefined) {
          await supabase
            .from('mcq_questions')
            .insert({
              question_id: question.id,
              question_text: questionData.content,
              rich_question_text: { content: questionData.content },
              options: questionData.options,
              correct_answers: [questionData.correctAnswer],
              is_multiple_choice: false,
              randomize_options: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        } else if (questionData.type === 'coding') {
          // Convert test cases format from frontend to database format
          const testCases = (questionData.testCases || []).map((tc: any) => ({
            input: tc.input || "",
            expected_output: tc.expectedOutput || "",
            is_hidden: tc.isHidden || false
          }))
          
          await supabase
            .from('coding_questions')
            .insert({
              question_id: question.id,
              problem_statement: questionData.content,
              rich_problem_statement: { content: questionData.content },
              boilerplate_code: { [questionData.languages?.[0] || 'javascript']: questionData.code || '' },
              solution_code: {},
              test_cases: testCases,
              allowed_languages: questionData.languages || ['javascript', 'python'],
              time_limit: 30,
              memory_limit: 128,
              is_solution_provided: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        } else if (questionData.type === 'essay') {
          // Create essay question data
          await supabase
            .from('essay_questions')
            .insert({
              question_id: question.id,
              prompt: questionData.content || "",
              rich_prompt: { content: questionData.content || "" },
              min_words: 0,
              max_words: null,
              time_limit_minutes: null,
              rubric: null,
              enable_ai_feedback: false,
              ai_model_settings: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      courseId: course.id,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        sectionsCount: validatedData.sections.length
      }
    })

  } catch (error) {
    console.error('Error in create-course API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
