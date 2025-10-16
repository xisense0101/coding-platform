import { NextRequest, NextResponse } from 'next/server'
import { submitToJudge0, pollSubmissionResult, cleanErrorMessage } from '@/lib/judge0'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, language, input } = body

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: code, language' },
        { status: 400 }
      )
    }

    // Submit to Judge0 with custom input (no expected output)
    const token = await submitToJudge0(code, language, input || '', '')
    const result = await pollSubmissionResult(token)

    // Check for compilation errors
    if (result.status.id === 6 || result.compile_output) {
      const compileError = result.compile_output || 'Compilation failed'
      const cleanError = cleanErrorMessage(compileError)
      
      return NextResponse.json({
        error: cleanError,
        status: result.status.description
      })
    }

    // Check for runtime errors
    if (result.stderr) {
      const runtimeError = cleanErrorMessage(result.stderr)
      
      return NextResponse.json({
        output: result.stdout || '',
        error: runtimeError,
        status: result.status.description,
        executionTime: result.time,
        memory: result.memory
      })
    }

    // Success - return output
    return NextResponse.json({
      output: result.stdout || '',
      status: result.status.description,
      executionTime: result.time,
      memory: result.memory
    })

  } catch (error: any) {
    console.error('Error running custom input:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute code',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
