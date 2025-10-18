import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const updateEssaySchema = z.object({
  prompt: z.string(),
  rich_prompt: z.any().optional(),
  min_words: z.number().int().min(0).optional(),
  max_words: z.number().int().min(0).optional(),
  time_limit_minutes: z.number().int().min(0).optional(),
  rubric: z.any().optional(),
  enable_ai_feedback: z.boolean().default(false),
  ai_model_settings: z.any().optional()
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

    // Fetch essay question details
    const { data: essayData, error: essayError } = await supabase
      .from('essay_questions')
      .select('*')
      .eq('question_id', params.questionId)
      .single()

    if (essayError) {
      logger.error('Error fetching essay details:', essayError)
      
      // If no essay details exist, return default values
      const defaultEssayData = {
        question_id: params.questionId,
        prompt: "",
        rich_prompt: null,
        min_words: 0,
        max_words: null,
        time_limit_minutes: null,
        rubric: null,
        enable_ai_feedback: false,
        ai_model_settings: {}
      }
      
      return NextResponse.json(defaultEssayData)
    }

    return NextResponse.json(essayData)

  } catch (error) {
    logger.error('Error in essay question API:', error)
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
    logger.log('Received essay update data:', JSON.stringify(body, null, 2))
    
    const validatedData = updateEssaySchema.parse(body)

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

    // First, check if an essay question record already exists
    const { data: existingEssay, error: fetchError } = await supabase
      .from('essay_questions')
      .select('id')
      .eq('question_id', params.questionId)
      .single()

    let essayData
    if (existingEssay) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('essay_questions')
        .update({
          prompt: validatedData.prompt || "",
          rich_prompt: validatedData.rich_prompt ?? (validatedData.prompt ? { content: validatedData.prompt } : null),
          min_words: validatedData.min_words || 0,
          max_words: validatedData.max_words || null,
          time_limit_minutes: validatedData.time_limit_minutes || null,
          rubric: validatedData.rubric || null,
          enable_ai_feedback: validatedData.enable_ai_feedback || false,
          ai_model_settings: validatedData.ai_model_settings || {},
          updated_at: new Date().toISOString()
        })
        .eq('question_id', params.questionId)
        .select()
        .single()

      if (updateError) {
        logger.error('Database error updating essay details:', updateError)
        logger.error('Question ID:', params.questionId)
        return NextResponse.json(
          { error: 'Failed to update essay question', details: updateError.message },
          { status: 500 }
        )
      }
      essayData = data
    } else {
      // Create new record
      const { data, error: insertError } = await supabase
        .from('essay_questions')
        .insert({
          question_id: params.questionId,
          prompt: validatedData.prompt || "",
          rich_prompt: validatedData.rich_prompt ?? (validatedData.prompt ? { content: validatedData.prompt } : null),
          min_words: validatedData.min_words || 0,
          max_words: validatedData.max_words || null,
          time_limit_minutes: validatedData.time_limit_minutes || null,
          rubric: validatedData.rubric || null,
          enable_ai_feedback: validatedData.enable_ai_feedback || false,
          ai_model_settings: validatedData.ai_model_settings || {}
        })
        .select()
        .single()

      if (insertError) {
        logger.error('Database error creating essay details:', insertError)
        logger.error('Question ID:', params.questionId)
        return NextResponse.json(
          { error: 'Failed to create essay question', details: insertError.message },
          { status: 500 }
        )
      }
      essayData = data
    }

    return NextResponse.json(essayData)

  } catch (error) {
    logger.error('Error in update essay question API:', error)
    
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
