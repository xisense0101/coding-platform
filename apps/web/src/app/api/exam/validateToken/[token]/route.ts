import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/validateToken/:token
 * 
 * Validates invite tokens for secure exam access
 * Required by Electron app for invite-based exams
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    // Fetch invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('exam_invites')
      .select(`
        id,
        exam_id,
        token,
        token_type,
        use_limit,
        use_count,
        valid_from,
        valid_until,
        is_active,
        is_expired,
        student_id,
        student_email,
        exam:exams(
          id,
          title,
          slug,
          start_time,
          end_time
        )
      `)
      .eq('token', params.token)
      .single()

    if (inviteError || !invite) {
      logger.error('Invite not found:', inviteError)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      )
    }

    // Check if token is active
    if (!invite.is_active || invite.is_expired) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 }
      )
    }

    // Check validity period
    const now = new Date()
    const validFrom = new Date(invite.valid_from)
    const validUntil = new Date(invite.valid_until)

    if (now < validFrom || now > validUntil) {
      // Mark as expired
      await supabase
        .from('exam_invites')
        .update({ is_expired: true, updated_at: new Date().toISOString() })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 }
      )
    }

    // Check use limit
    if (invite.token_type !== 'reusable' && invite.use_count >= invite.use_limit) {
      return NextResponse.json(
        { error: 'Token usage limit exceeded' },
        { status: 403 }
      )
    }

    // Return valid token info
    return NextResponse.json({
      valid: true,
      testId: invite.exam_id,
      examSlug: (invite.exam as any)?.slug,
      examTitle: (invite.exam as any)?.title,
      studentEmail: invite.student_email,
      validFrom: invite.valid_from,
      expiresAt: invite.valid_until,
      usesRemaining: invite.token_type === 'reusable' ? null : invite.use_limit - invite.use_count
    })

  } catch (error) {
    logger.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exam/validateToken/:token
 * 
 * Records token usage when student starts exam
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()
    const { userId, ipAddress, userAgent } = body

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from('exam_invites')
      .select('*')
      .eq('token', params.token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    // Update usage count and tracking
    const { error: updateError } = await supabase
      .from('exam_invites')
      .update({
        use_count: invite.use_count + 1,
        first_used_at: invite.first_used_at || new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        used_by_ip: [...(invite.used_by_ip || []), ipAddress],
        used_by_user_agent: [...(invite.used_by_user_agent || []), userAgent],
        updated_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    if (updateError) {
      logger.error('Error updating invite usage:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Token usage recorded'
    })

  } catch (error) {
    logger.error('Error recording token usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
