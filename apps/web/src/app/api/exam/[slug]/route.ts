import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/:slug?json=1
 * 
 * This endpoint serves dual purpose:
 * 1. With ?json=1 query param: Returns JSON for Electron app validation
 * 2. Without it: Could redirect to exam page (or return full HTML)
 * 
 * Required by Electron app for test validation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const jsonMode = searchParams.get('json') === '1'

    const supabase = createSupabaseServerClient()

    // Fetch exam by slug
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        slug,
        description,
        duration_minutes,
        start_time,
        end_time,
        total_marks,
        is_published,
        strict_level,
        require_invite_token,
        allowed_ip,
        exam_sections(
          id,
          exam_questions(id)
        )
      `)
      .eq('slug', params.slug)
      .single()

    if (examError || !exam) {
      logger.error('Exam not found:', examError)
      
      if (jsonMode) {
        return NextResponse.json(
          { error: 'Test not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Check if exam is published
    if (!exam.is_published) {
      if (jsonMode) {
        return NextResponse.json(
          { error: 'Test not available' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Exam not published' },
        { status: 403 }
      )
    }

    // Check IP Restriction
    if (exam.allowed_ip) {
      const headersList = request.headers
      const forwardedFor = headersList.get('x-forwarded-for')
      const realIp = headersList.get('x-real-ip')
      const cfConnectingIp = headersList.get('cf-connecting-ip')
      const middlewareIp = headersList.get('x-client-ip')
      
      let clientIp = middlewareIp || 
                     forwardedFor?.split(',')[0]?.trim() || 
                     cfConnectingIp || 
                     realIp || 
                     request.ip || 
                     'unknown'
      
      // Normalize IPv6 localhost
      if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        clientIp = '127.0.0.1'
      }

      // Fallback for local development if IP is unknown
      if (clientIp === 'unknown' && process.env.NODE_ENV === 'development') {
        clientIp = '127.0.0.1'
      }

      // Split allowed IPs by comma and trim whitespace
      const allowedIps = exam.allowed_ip.split(',').map((ip: string) => ip.trim())
      
      // DEBUG LOGS
      console.log('--- EXAM IP VALIDATION ---')
      console.log(`Exam Slug: ${params.slug}`)
      console.log(`Detected Client IP: ${clientIp}`)
      console.log(`Allowed IPs: ${JSON.stringify(allowedIps)}`)
      console.log(`Match Found: ${allowedIps.includes(clientIp)}`)
      console.log('--------------------------')

      if (clientIp && !allowedIps.includes(clientIp)) {
        logger.warn(`IP restriction failed. Allowed: ${allowedIps.join(', ')}, Got: ${clientIp}`)
        return NextResponse.json(
          { error: `Access Denied: Your IP (${clientIp}) is not authorized. You must be connected to the specific exam Wifi network.` },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // Count total questions
    const questionCount = exam.exam_sections.reduce(
      (total: number, section: any) => total + (section.exam_questions?.length || 0),
      0
    )

    if (jsonMode) {
      // Return JSON format for Electron app validation
      return NextResponse.json({
        quiz: {
          id: exam.id,
          title: exam.title,
          slug: exam.slug,
          duration: exam.duration_minutes * 60, // Convert to seconds
          questions: questionCount,
          totalMarks: exam.total_marks,
          startTime: exam.start_time,
          endTime: exam.end_time,
          requiresInvite: exam.require_invite_token,
          strictLevel: exam.strict_level || 1
        }
      })
    }

    // Regular mode - return full exam data or redirect
    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        slug: exam.slug,
        description: exam.description,
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        question_count: questionCount
      }
    })

  } catch (error) {
    logger.error('Error in exam validation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
