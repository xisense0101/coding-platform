import { NextRequest, NextResponse } from 'next/server'
import { executeTestCases } from '@/lib/judge0'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, language, testCases, questionId, userId, courseId } = body

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: code, language' },
        { status: 400 }
      )
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: 'Test cases are required' },
        { status: 400 }
      )
    }

    // Execute code against all test cases
    const testCaseResults = await executeTestCases(code, language, testCases)
    
    // Calculate results
    const testCasesPassed = testCaseResults.filter(tc => tc.passed).length
    const totalTestCases = testCaseResults.length
    const allPassed = testCasesPassed === totalTestCases

    return NextResponse.json({
      success: true,
      testCaseResults,
      testCasesPassed,
      totalTestCases,
      allPassed
    })

  } catch (error: any) {
    logger.error('Error running test cases:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute test cases',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
