import { NextRequest, NextResponse } from 'next/server'
import { executeTestCases } from '@/lib/judge0'
import { createRequestLogger, getRequestId } from '@/server/utils/logger'
import { validateBody } from '@/server/utils/validation'
import { ValidationError, InternalServerError } from '@/server/utils/errors'
import { runCodeSchema } from '@/server/schemas/coding'
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'

async function handler(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId, { endpoint: '/api/coding/run' })
  
  try {
    log.info('Code execution request received')
    
    // Validate and sanitize input
    const validated = await validateBody(request, runCodeSchema)
    const { code, language, testCases, questionId, userId, courseId } = validated

    log.info({ language, testCaseCount: testCases.length }, 'Executing code')

    // Execute code against all test cases
    const startTime = Date.now()
    const testCaseResults = await executeTestCases(code, language, testCases as any)
    const duration = Date.now() - startTime
    
    // Calculate results
    const testCasesPassed = testCaseResults.filter(tc => tc.passed).length
    const totalTestCases = testCaseResults.length
    const allPassed = testCasesPassed === totalTestCases

    log.info({ 
      duration,
      testCasesPassed,
      totalTestCases,
      allPassed
    }, 'Code execution completed')

    // Return legacy format for backward compatibility
    return NextResponse.json({
      success: true,
      testCaseResults,
      testCasesPassed,
      totalTestCases,
      allPassed
    }, {
      headers: { 'X-Request-ID': requestId }
    })

  } catch (error: any) {
    log.error({ error: error.message }, 'Code execution failed')
    
    // Return legacy error format
    return NextResponse.json(
      { 
        error: error instanceof ValidationError 
          ? error.message 
          : 'Failed to execute test cases',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: error instanceof ValidationError ? 400 : 500,
        headers: { 'X-Request-ID': requestId }
      }
    )
  }
}

// Apply rate limiting - standard preset for code execution
export const POST = withRateLimit(handler, RateLimitPresets.standard)
