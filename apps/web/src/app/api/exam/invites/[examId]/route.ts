import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { nanoid } from 'nanoid'

// GET - Fetch all invites for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Verify teacher authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = params

    // Verify teacher owns this exam
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id')
      .eq('id', examId)
      .single()

    if (!exam || exam.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all invites for this exam with student info
    const { data: invites, error } = await supabase
      .from('exam_invites')
      .select(`
        *,
        student:student_id (
          id,
          email,
          profiles (
            first_name,
            last_name
          )
        )
      `)
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error in GET /api/exam/invites/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new invite(s)
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Verify teacher authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = params
    const body = await request.json()
    const { 
      studentIds, // array of student IDs or null for general tokens
      inviteType = 'single-use', // 'single-use' or 'reusable'
      expiresAt = null,
      maxUses = 1,
      count = 1 // for generating multiple general tokens
    } = body

    // Verify teacher owns this exam
    const { data: exam } = await supabase
      .from('exams')
      .select('id, title')
      .eq('id', examId)
      .single()

    if (!exam || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const invitesToCreate = []

    if (studentIds && Array.isArray(studentIds)) {
      // Create specific invites for students
      for (const studentId of studentIds) {
        invitesToCreate.push({
          exam_id: examId,
          student_id: studentId,
          token: nanoid(32),
          invite_type: inviteType,
          expires_at: expiresAt,
          max_uses: maxUses,
          uses_count: 0,
          is_active: true
        })
      }
    } else {
      // Create general tokens (not tied to specific students)
      for (let i = 0; i < count; i++) {
        invitesToCreate.push({
          exam_id: examId,
          student_id: null,
          token: nanoid(32),
          invite_type: inviteType,
          expires_at: expiresAt,
          max_uses: maxUses,
          uses_count: 0,
          is_active: true
        })
      }
    }

    const { data: createdInvites, error } = await supabase
      .from('exam_invites')
      .insert(invitesToCreate)
      .select()

    if (error) {
      console.error('Error creating invites:', error)
      return NextResponse.json({ error: 'Failed to create invites' }, { status: 500 })
    }

    return NextResponse.json({ 
      invites: createdInvites,
      message: `Successfully created ${createdInvites.length} invite(s)`
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/exam/invites/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
