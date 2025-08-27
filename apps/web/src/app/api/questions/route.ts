import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

const createQuestionSchema = z.object({
  section_id: z.string().uuid(),
  type: z.enum(['mcq', 'coding', 'essay']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  points: z.number().min(1).default(1),
  order_index: z.number().min(0).default(0)
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

    // Get user profile for organization context
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createQuestionSchema.parse(body)

    // Create the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        organization_id: userProfile.organization_id,
        section_id: validatedData.section_id,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        points: validatedData.points,
        order_index: validatedData.order_index,
        is_published: false,
        created_by: user.id
      })
      .select()
      .single()

    if (questionError) {
      console.error('Error creating question:', questionError)
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      )
    }

    return NextResponse.json(question)

  } catch (error) {
    console.error('Error in create question API:', error)
    
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
