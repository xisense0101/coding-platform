import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const updateMcqSchema = z.object({
  options: z.array(z.string()),
  correct_answers: z.array(z.number().int().min(0)),
  is_multiple_choice: z.boolean().default(false),
  question_text: z.string().optional(),
  rich_question_text: z.any().optional(),
  explanation: z.string().optional(),
  randomize_options: z.boolean().default(true)
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

    // Fetch MCQ question details
    const { data: mcqData, error: mcqError } = await supabase
      .from('mcq_questions')
      .select('*')
      .eq('question_id', params.questionId)
      .single()

    if (mcqError) {
      logger.error('Error fetching MCQ details:', mcqError)
      
      // If no MCQ details exist, return default values
      const defaultMcqData = {
        question_id: params.questionId,
        question_text: "",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct_answers: [0],
        is_multiple_choice: false,
        randomize_options: true,
        explanation: ""
      }
      
      return NextResponse.json(defaultMcqData)
    }

    return NextResponse.json(mcqData)

  } catch (error) {
    logger.error('Error in MCQ question API:', error)
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
    logger.log('Received MCQ update data:', JSON.stringify(body, null, 2))
    
    const validatedData = updateMcqSchema.parse(body)

    // First, verify the question exists
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', params.questionId)
      .single()

    if (questionError || !questionData) {
      logger.error('Question not found:', questionError)
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // First, check if an MCQ question record already exists
    const { data: existingMcq, error: fetchError } = await supabase
      .from('mcq_questions')
      .select('id')
      .eq('question_id', params.questionId)
      .single()

    let mcqData
    if (existingMcq) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('mcq_questions')
        .update({
          question_text: validatedData.question_text || "",
          rich_question_text: validatedData.rich_question_text ?? (validatedData.question_text ? { content: validatedData.question_text } : null),
          options: validatedData.options || ["", "", "", ""],
          correct_answers: validatedData.correct_answers || [0],
          is_multiple_choice: validatedData.is_multiple_choice || false,
          explanation: validatedData.explanation || "",
          updated_at: new Date().toISOString()
        })
        .eq('question_id', params.questionId)
        .select()
        .single()

      if (updateError) {
        logger.error('Database error updating MCQ details:', updateError)
        logger.error('Question ID:', params.questionId)
        return NextResponse.json(
          { error: 'Failed to update MCQ question', details: updateError.message },
          { status: 500 }
        )
      }
      mcqData = data
    } else {
      // Create new record
      const { data, error: insertError } = await supabase
        .from('mcq_questions')
        .insert({
          question_id: params.questionId,
          question_text: validatedData.question_text || "",
          rich_question_text: validatedData.rich_question_text ?? (validatedData.question_text ? { content: validatedData.question_text } : null),
          options: validatedData.options || ["", "", "", ""],
          correct_answers: validatedData.correct_answers || [0],
          is_multiple_choice: validatedData.is_multiple_choice || false,
          explanation: validatedData.explanation || ""
        })
        .select()
        .single()

      if (insertError) {
        logger.error('Database error creating MCQ details:', insertError)
        logger.error('Question ID:', params.questionId)
        logger.error('Data being inserted:', JSON.stringify({
          question_id: params.questionId,
          question_text: validatedData.question_text || "",
          options: validatedData.options || ["", "", "", ""],
          correct_answers: validatedData.correct_answers || [0],
          is_multiple_choice: validatedData.is_multiple_choice || false,
          explanation: validatedData.explanation || ""
        }, null, 2))
        return NextResponse.json(
          { error: 'Failed to create MCQ question', details: insertError.message },
          { status: 500 }
        )
      }
      mcqData = data
    }

    return NextResponse.json(mcqData)

  } catch (error) {
    logger.error('Error in update MCQ question API:', error)
    
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
