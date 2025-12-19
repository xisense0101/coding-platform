import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { getRedisClient } from '@/lib/redis/client'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/exams/[examId]/start
 * Starts or resumes an exam submission
 * Returns existing submission if found, creates new one if not
 * Includes session locking to prevent concurrent access
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const body = await request.json()
    const {
      userId,
      studentName,
      studentEmail,
      rollNumber,
      studentSection,
      sessionId // Unique browser tab session ID
    }: {
      userId: string
      studentName?: string
      studentEmail: string
      rollNumber?: string
      studentSection?: string
      sessionId?: string
    } = body

    if (!userId || !studentEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // 1. Check Session Lock in Redis
    const redis = getRedisClient()
    const lockKey = `exam:session:lock:${params.examId}:${userId}`

    if (redis && sessionId) {
      const activeSessionId = await redis.get(lockKey)

      if (activeSessionId && activeSessionId !== sessionId) {
        logger.warn('🚫 Concurrent session blocked:', {
          examId: params.examId,
          userId,
          activeSessionId,
          newSessionId: sessionId
        })
        return NextResponse.json(
          {
            error: 'Exam is already active on another device or browser tab',
            code: 'CONCURRENT_SESSION'
          },
          { status: 403 }
        )
      }

      // Set or refresh the lock (60 seconds TTL)
      await redis.set(lockKey, sessionId, { ex: 60 })
    }

    const supabase = createSupabaseServerClient()

    logger.log('🔍 Checking for existing submission...', {
      examId: params.examId,
      userId,
      studentEmail
    })

    // Check for existing submission
    const { data: existingSubmission, error: fetchError } = await (supabase
      .from('exam_submissions')
      .select('id, answers, is_submitted, submitted_at, started_at, submission_status')
      .eq('exam_id', params.examId)
      .eq('student_id', userId)
      .eq('attempt_number', 1)
      .maybeSingle() as any)

    if (fetchError) {
      logger.error('❌ Error fetching submission:', fetchError)
      return NextResponse.json(
        {
          error: 'Failed to check existing submission',
          details: fetchError.message
        },
        { status: 500 }
      )
    }

    // Log submission details for debugging
    if (existingSubmission) {
      logger.log('📋 Existing submission found:', {
        id: (existingSubmission as any).id,
        is_submitted: (existingSubmission as any).is_submitted,
        submission_status: (existingSubmission as any).submission_status,
        submitted_at: (existingSubmission as any).submitted_at,
        started_at: (existingSubmission as any).started_at,
        answers_count: Object.keys((existingSubmission as any).answers || {}).length
      })
    }

    // If submission exists and is already submitted, reject
    if (existingSubmission && (existingSubmission as any).is_submitted) {
      logger.log('❌ Submission already submitted:', {
        submittedAt: (existingSubmission as any).submitted_at,
        status: (existingSubmission as any).submission_status
      })
      return NextResponse.json(
        {
          error: 'This exam has already been submitted',
          alreadySubmitted: true,
          submittedAt: (existingSubmission as any).submitted_at,
          submissionId: (existingSubmission as any).id
        },
        { status: 400 }
      )
    }

    // If submission exists and is in progress, return it with time remaining
    if (existingSubmission) {
      logger.log('✅ Found existing submission:', (existingSubmission as any).id)

      // Fetch exam details to get duration
      const { data: examData, error: examError } = await (supabase
        .from('exams')
        .select('duration_minutes, end_time')
        .eq('id', params.examId)
        .single() as any)

      if (examError) {
        logger.error('❌ Error fetching exam:', examError)
        return NextResponse.json(
          { error: 'Failed to fetch exam details', details: examError.message },
          { status: 500 }
        )
      }

      // Calculate time remaining
      const startedAt = new Date((existingSubmission as any).started_at)
      const now = new Date()
      const elapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60)
      const timeRemainingSeconds = Math.max(0, ((examData as any).duration_minutes - elapsedMinutes) * 60)

      logger.log('⏱️ Time calculation:', {
        startedAt: (existingSubmission as any).started_at,
        elapsedMinutes: Math.floor(elapsedMinutes),
        durationMinutes: (examData as any).duration_minutes,
        timeRemainingSeconds: Math.floor(timeRemainingSeconds)
      })

      return NextResponse.json({
        success: true,
        submission: {
          id: (existingSubmission as any).id,
          answers: (existingSubmission as any).answers || {},
          startedAt: (existingSubmission as any).started_at,
          timeRemainingSeconds: Math.floor(timeRemainingSeconds),
          is_submitted: (existingSubmission as any).is_submitted
        },
        isNew: false
      })
    }

    // No existing submission, create a new one
    logger.log('📝 Creating new submission...')

    // Get client IP address
    let ipAddress = null
    try {
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
      const socketIp = (request as any).ip // Next.js direct IP

      ipAddress = forwarded?.split(',')[0]?.trim() ||
        cfConnectingIp ||
        realIp ||
        socketIp ||
        'unknown'

      // Convert IPv6 localhost to IPv4
      if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
        ipAddress = '127.0.0.1'
      }

      logger.log('📍 Client IP detected:', ipAddress)
    } catch (error) {
      logger.warn('⚠️ Could not determine IP address:', error)
      ipAddress = 'unknown'
    }

    const submissionData = {
      exam_id: params.examId,
      student_id: userId,
      attempt_number: 1,
      student_name: studentName || '',
      student_email: studentEmail,
      roll_number: rollNumber || null,
      student_section: studentSection || null,
      started_at: new Date().toISOString(),
      answers: {},
      is_submitted: false,
      submission_status: 'in_progress',
      ip_address: ipAddress === 'unknown' ? null : ipAddress,
    }

    const { data: newSubmission, error: insertError } = await (supabase
      .from('exam_submissions')
      .insert(submissionData as any)
      .select('id, started_at')
      .single() as any)

    if (insertError) {
      logger.error('❌ Error creating submission:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create exam submission',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    logger.log('✅ Created new submission:', (newSubmission as any).id)

    // Fetch exam details to get duration for new submission
    const { data: examData, error: examError } = await (supabase
      .from('exams')
      .select('duration_minutes')
      .eq('id', params.examId)
      .single() as any)

    const timeRemainingSeconds = examError ? 0 : (examData as any).duration_minutes * 60

    return NextResponse.json({
      success: true,
      submission: {
        id: (newSubmission as any).id,
        answers: {},
        startedAt: (newSubmission as any).started_at,
        timeRemainingSeconds: timeRemainingSeconds,
        is_submitted: false
      },
      isNew: true
    })

  } catch (error) {
    logger.error('💥 Error in exam start:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
