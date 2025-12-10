import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Restore the json=1 check as requested
    if (searchParams.get('json') !== '1') {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Use a direct Supabase client to avoid any server-side cookie/header issues
    // This ensures the endpoint works purely as a public API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    logger.log('Checking exam link for slug:', params.slug)

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single()

    if (examError || !exam) {
      logger.error('Error fetching exam for check:', examError)
      return NextResponse.json(
        { error: 'Exam not found or not published' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Check IP Restriction
    if (exam.allowed_ip) {
      const forwardedFor = request.headers.get('x-forwarded-for')
      const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip
      
      if (clientIp && exam.allowed_ip !== clientIp) {
        logger.warn(`IP restriction failed. Expected: ${exam.allowed_ip}, Got: ${clientIp}`)
        return NextResponse.json(
          { error: "Access Denied: You must be connected to the specific exam Wifi network." },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
      }
    }

    // Return JSON response in the format requested
    const quizData = {
      valid: true,
      quiz: {
        id: exam.slug,
        title: exam.title,
        exam_mode: exam.exam_mode || 'browser'
      }
    }

    const response = NextResponse.json(quizData)

    // Add CORS headers to allow Electron app to access this endpoint
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response

  } catch (error) {
    logger.error('Error in exam JSON check endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}
