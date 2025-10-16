import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

const createSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  order_index: z.number().min(0).default(0),
  questions: z.array(z.object({
    type: z.enum(['mcq', 'coding', 'essay', 'reading']),
    title: z.string().min(1, 'Question title is required'),
    description: z.string().optional(),
    points: z.number().min(1).default(1),
    isVisible: z.boolean().default(true),
    // MCQ specific fields
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.number(), z.string()]).optional(),
    // Coding specific fields  
    code: z.string().optional(),
    languages: z.array(z.string()).optional(),
    testCases: z.array(z.object({
      input: z.string().default(""),
      expectedOutput: z.string().optional(),
      expected_output: z.string().optional(),
      isHidden: z.boolean().optional(),
      is_hidden: z.boolean().default(false),
      weight: z.number().default(1)
    })).optional()
  })).default([])
})

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    console.log('Sections API: Starting request for course:', params.courseId)
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Sections API: Auth error')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Sections API: User authenticated:', user.id)

    // First verify the user has access to this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id, organization_id')
      .eq('id', params.courseId)
      .single()

    if (courseError) {
      console.error('Sections API: Course error:', courseError)
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    console.log('Sections API: Course found:', course)

    // Check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Sections API: Profile error:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('Sections API: User profile:', userProfile)

    if (course.teacher_id !== user.id && 
        userProfile.role !== 'admin' && 
        course.organization_id !== userProfile.organization_id) {
      console.log('Sections API: Permission denied')
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log('Sections API: Fetching sections for course:', params.courseId)

    // Fetch sections first
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', params.courseId)
      .order('order_index', { ascending: true })

    if (sectionsError) {
      console.error('Sections API: Sections query error:', sectionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sections', details: sectionsError.message },
        { status: 500 }
      )
    }

    console.log('Sections API: Found sections:', sections?.length || 0)

    // If no sections found, return empty array
    if (!sections || sections.length === 0) {
      return NextResponse.json([])
    }

    // Fetch questions for each section
    const sectionsWithQuestions = await Promise.all(
      sections.map(async (section) => {
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, type, title, description, points, is_published, order_index')
          .eq('section_id', section.id)
          .order('order_index', { ascending: true })

        if (questionsError) {
          console.error(`Questions query error for section ${section.id}:`, questionsError)
          return {
            ...section,
            questions: []
          }
        }

        return {
          ...section,
          questions: questions || []
        }
      })
    )

    console.log('Sections API: Returning sections with questions')

    return NextResponse.json(sectionsWithQuestions)

  } catch (error) {
    console.error('Sections API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const validatedData = createSectionSchema.parse(body)

    // Create the section
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        course_id: params.courseId,
        title: validatedData.title,
        description: validatedData.description,
        order_index: validatedData.order_index,
        is_published: false
      })
      .select()
      .single()

    if (sectionError) {
      console.error('Error creating section:', sectionError)
      return NextResponse.json(
        { error: 'Failed to create section' },
        { status: 500 }
      )
    }

    // Create questions for this section
    const createdQuestions = []
    for (const questionData of validatedData.questions) {
      const { data: question, error: questionError }: { data: any, error: any } = await supabase
        .from('questions')
        .insert({
          organization_id: course.organization_id,
          section_id: section.id,
          type: questionData.type,
          title: questionData.title,
          description: questionData.description,
          points: questionData.points,
          order_index: createdQuestions.length,
          is_published: questionData.isVisible || false,
          created_by: user.id
        })
        .select()
        .single()

      if (questionError) {
        console.error('Error creating question:', questionError)
      } else {
        // Create type-specific question data
        if (questionData.type === 'mcq') {
          const mcqOptions = questionData.options || ["", "", "", ""]
          const correctAnswer = typeof questionData.correctAnswer === 'string' 
            ? parseInt(questionData.correctAnswer) 
            : (questionData.correctAnswer || 0)
          
          const { error: mcqError } = await supabase
            .from('mcq_questions')
            .insert({
              question_id: question.id,
              question_text: questionData.description || questionData.title,
              options: mcqOptions,
              correct_answers: [correctAnswer],
              is_multiple_choice: false,
              randomize_options: true
            })

          if (mcqError) {
            console.error('Error creating MCQ details:', mcqError)
          }
        } else if (questionData.type === 'coding') {
          const allowedLanguages = questionData.languages || ["javascript", "python"]
          const boilerplateCode = questionData.code || "// Write your code here"
          
          // Convert test cases from frontend format to API format
          const testCases = (questionData.testCases || []).map((tc: any) => ({
            input: tc.input || "",
            expected_output: tc.expectedOutput || tc.expected_output || "",
            is_hidden: tc.isHidden || tc.is_hidden || false,
            weight: tc.weight || 1
          }))
          
          // If no test cases provided, create a default one
          if (testCases.length === 0) {
            testCases.push({
              input: "",
              expected_output: "",
              is_hidden: false,
              weight: 1
            })
          }
          
          const { error: codingError } = await supabase
            .from('coding_questions')
            .insert({
              question_id: question.id,
              problem_statement: questionData.description || questionData.title,
              boilerplate_code: {
                javascript: boilerplateCode,
                python: boilerplateCode.replace(/\/\//g, '#').replace(/function|{|}/g, '').trim() || "# Write your code here"
              },
              test_cases: testCases,
              allowed_languages: allowedLanguages,
              time_limit: 30,
              memory_limit: 128
            })

          if (codingError) {
            console.error('Error creating coding details:', codingError)
          }
        } else if (questionData.type === 'essay') {
          const { error: essayError } = await supabase
            .from('essay_questions')
            .insert({
              question_id: question.id,
              prompt: questionData.description || questionData.title || "",
              rich_prompt: questionData.description ? { content: questionData.description } : null,
              min_words: 0,
              max_words: null,
              time_limit_minutes: null,
              rubric: null,
              enable_ai_feedback: false,
              ai_model_settings: {}
            })

          if (essayError) {
            console.error('Error creating essay details:', essayError)
          }
        }

        createdQuestions.push(question)
      }
    }

    // Return section with questions
    const sectionWithQuestions = {
      ...section,
      questions: createdQuestions
    }

    return NextResponse.json(sectionWithQuestions)

  } catch (error) {
    console.error('Error in create section API:', error)
    
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
