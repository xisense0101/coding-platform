import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

const updateCodingSchema = z.object({
  problem_statement: z.string().optional(),
  rich_problem_statement: z.any().optional(),
  boilerplate_code: z.record(z.string()).optional(),
  allowed_languages: z.array(z.string()).optional(),
  test_cases: z.array(z.object({
    input: z.string().default(""),
    expected_output: z.string().default(""),
    is_hidden: z.boolean().default(false),
    weight: z.number().default(1)
  })).default([]),
  time_limit: z.number().optional(),
  memory_limit: z.number().optional()
})

export async function GET(
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

    // Fetch coding question details
    const { data: codingData, error: codingError } = await supabase
      .from('coding_questions')
      .select('*')
      .eq('question_id', params.questionId)
      .single()

    if (codingError) {
      console.error('Error fetching coding details:', codingError)
      
      // If no coding details exist, return default values
      const defaultCodingData = {
        question_id: params.questionId,
        problem_statement: "",
        boilerplate_code: {
          javascript: "// Write your code here\nfunction solution() {\n    \n}",
          python: "# Write your code here\ndef solution():\n    pass"
        },
        test_cases: [
          {
            input: "",
            expected_output: "",
            is_hidden: false,
            weight: 1
          }
        ],
        allowed_languages: ["javascript", "python"],
        time_limit: 30,
        memory_limit: 128
      }
      
      return NextResponse.json(defaultCodingData)
    }

    return NextResponse.json(codingData)

  } catch (error) {
    console.error('Error in coding question API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    console.log('Received coding update data:', JSON.stringify(body, null, 2))
    
    const validatedData = updateCodingSchema.parse(body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))

    // First, verify the question exists
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', params.questionId)
      .single()

    if (questionError || !questionData) {
      console.error('Question not found:', questionError)
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // First, check if a coding question record already exists
    const { data: existingCoding, error: fetchError } = await supabase
      .from('coding_questions')
      .select('id')
      .eq('question_id', params.questionId)
      .single()

    let codingData
    if (existingCoding) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('coding_questions')
        .update({
          problem_statement: validatedData.problem_statement || "",
          rich_problem_statement: validatedData.rich_problem_statement ?? (validatedData.problem_statement ? { content: validatedData.problem_statement } : null),
          boilerplate_code: validatedData.boilerplate_code || {},
          allowed_languages: validatedData.allowed_languages || ['javascript', 'python'],
          test_cases: validatedData.test_cases || [],
          time_limit: validatedData.time_limit || 30,
          memory_limit: validatedData.memory_limit || 128,
          updated_at: new Date().toISOString()
        })
        .eq('question_id', params.questionId)
        .select()
        .single()

      if (updateError) {
        console.error('Database error updating coding details:', updateError)
        console.error('Question ID:', params.questionId)
        return NextResponse.json(
          { error: 'Failed to update coding question', details: updateError.message },
          { status: 500 }
        )
      }
      codingData = data
    } else {
      // Create new record
      const { data, error: insertError } = await supabase
        .from('coding_questions')
        .insert({
          question_id: params.questionId,
          problem_statement: validatedData.problem_statement || "",
          rich_problem_statement: validatedData.rich_problem_statement ?? (validatedData.problem_statement ? { content: validatedData.problem_statement } : null),
          boilerplate_code: validatedData.boilerplate_code || {},
          allowed_languages: validatedData.allowed_languages || ['javascript', 'python'],
          test_cases: validatedData.test_cases || [],
          time_limit: validatedData.time_limit || 30,
          memory_limit: validatedData.memory_limit || 128
        })
        .select()
        .single()

      if (insertError) {
        console.error('Database error creating coding details:', insertError)
        console.error('Question ID:', params.questionId)
        console.error('Data being inserted:', JSON.stringify({
          question_id: params.questionId,
          problem_statement: validatedData.problem_statement || "",
          boilerplate_code: validatedData.boilerplate_code || {},
          allowed_languages: validatedData.allowed_languages || ['javascript', 'python'],
          test_cases: validatedData.test_cases || [],
          time_limit: validatedData.time_limit || 30,
          memory_limit: validatedData.memory_limit || 128
        }, null, 2))
        return NextResponse.json(
          { error: 'Failed to create coding question', details: insertError.message },
          { status: 500 }
        )
      }
      codingData = data
    }

    return NextResponse.json(codingData)

  } catch (error) {
    console.error('Error in update coding question API:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
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
