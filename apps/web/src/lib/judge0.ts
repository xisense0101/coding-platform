// Judge0 API Integration
// https://judge0-ce.p.rapidapi.com/

export interface Judge0SubmissionResult {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  status: {
    id: number
    description: string
  }
  time: string | null
  memory: number | null
}

export interface TestCaseResult {
  testCaseIndex: number
  passed: boolean
  isHidden: boolean
  input: string
  expectedOutput: string
  actualOutput: string
  error: string | null
  executionTime: string | null
  memory: number | null
  status: string
  weight?: number
  marksEarned?: number
}

// Judge0 Language IDs
// Reference: https://github.com/judge0/judge0/blob/master/CHANGELOG.md
const LANGUAGE_IDS: Record<string, number> = {
  'c': 50,           // C (GCC 9.2.0)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'java': 62,        // Java (OpenJDK 13.0.1)
  'python': 71,      // Python (3.8.1)
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'typescript': 74,  // TypeScript (3.7.4)
  'go': 60,          // Go (1.13.5)
  'rust': 73,        // Rust (1.40.0)
  'ruby': 72,        // Ruby (2.7.0)
  'php': 68,         // PHP (7.4.1)
  'csharp': 51,      // C# (Mono 6.6.0.161)
  'kotlin': 78,      // Kotlin (1.3.70)
  'swift': 83,       // Swift (5.2.3)
  'sql': 82,         // SQL (SQLite 3.27.2)
}

function getLanguageId(language: string): number {
  const normalizedLang = language.toLowerCase()
  const langId = LANGUAGE_IDS[normalizedLang]
  
  if (!langId) {
    throw new Error(`Unsupported language: ${language}`)
  }
  
  return langId
}

/**
 * Submit code to Judge0 for execution
 */
export async function submitToJudge0(
  code: string,
  language: string,
  stdin: string = '',
  expectedOutput?: string
): Promise<string> {
  const apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  const apiKey = process.env.JUDGE0_API_KEY
  
  if (!apiKey) {
    throw new Error('JUDGE0_API_KEY is not configured')
  }

  const languageId = getLanguageId(language)
  
  // Encode code and stdin in base64
  const base64Code = Buffer.from(code).toString('base64')
  const base64Stdin = Buffer.from(stdin).toString('base64')
  const base64ExpectedOutput = expectedOutput 
    ? Buffer.from(expectedOutput).toString('base64') 
    : undefined

  const submissionData: any = {
    source_code: base64Code,
    language_id: languageId,
    stdin: base64Stdin,
    base64_encoded: true
  }

  if (base64ExpectedOutput) {
    submissionData.expected_output = base64ExpectedOutput
  }

  const response = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    body: JSON.stringify(submissionData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Judge0 submission failed: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  return result.token
}

/**
 * Get submission result from Judge0
 */
export async function getSubmissionResult(token: string): Promise<Judge0SubmissionResult> {
  const apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  const apiKey = process.env.JUDGE0_API_KEY
  
  if (!apiKey) {
    throw new Error('JUDGE0_API_KEY is not configured')
  }

  const response = await fetch(
    `${apiUrl}/submissions/${token}?base64_encoded=true&fields=*`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get submission result: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  
  // Decode base64 fields
  if (result.stdout) {
    result.stdout = Buffer.from(result.stdout, 'base64').toString('utf-8')
  }
  if (result.stderr) {
    result.stderr = Buffer.from(result.stderr, 'base64').toString('utf-8')
  }
  if (result.compile_output) {
    result.compile_output = Buffer.from(result.compile_output, 'base64').toString('utf-8')
  }
  if (result.message) {
    result.message = Buffer.from(result.message, 'base64').toString('utf-8')
  }

  return result
}

/**
 * Poll for submission result with timeout
 */
export async function pollSubmissionResult(
  token: string,
  maxAttempts: number = 20,
  delayMs: number = 500
): Promise<Judge0SubmissionResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getSubmissionResult(token)
    
    // Status ID 1 = In Queue, 2 = Processing
    if (result.status.id > 2) {
      return result
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  
  throw new Error('Submission timed out')
}

/**
 * Clean error messages by removing file paths, code snippets, and error pointers
 */
export function cleanErrorMessage(errorMessage: string): string {
  if (!errorMessage) return errorMessage
  
  const errorLines = errorMessage.split('\n')
  const cleanError = errorLines.filter((line: string) => {
    const trimmed = line.trim()
    // Remove lines that:
    // 1. Start with /box/ (file paths like /box/script.js:1)
    // 2. Contain only whitespace and carets/tildes (error pointers: ^^^, ~~~)
    // 3. Are line numbers with pipes (1 | code here)
    // 4. Are empty or just whitespace
    return !line.match(/^\/box\//) &&           // File paths
           !trimmed.match(/^[\^~\s]+$/) &&      // Pointer lines
           !line.match(/^\s*\d+\s*\|/) &&       // Line number markers
           trimmed !== ''
  }).join('\n').trim()
  
  return cleanError || errorMessage
}

/**
 * Execute code against test cases - optimized to run once for compilation errors
 */
export async function executeTestCases(
  code: string,
  language: string,
  testCases: Array<{
    input: string
    expected_output: string
    is_hidden: boolean
    weight?: number
  }>
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = []
  
  // First, do a single test run to check for compilation errors
  try {
    const testToken = await submitToJudge0(code, language, '', '')
    const testResult = await pollSubmissionResult(testToken)
    
    // Check for compilation errors (status 6 = Compilation Error, status > 3 except 3 = Accepted)
    if (testResult.status.id === 6 || (testResult.compile_output && testResult.compile_output.trim())) {
      // Compilation error - apply to all test cases
      const compileError = testResult.compile_output || testResult.stderr || testResult.message || 'Compilation failed'
      const cleanError = cleanErrorMessage(compileError)
      
      for (let i = 0; i < testCases.length; i++) {
        const weight = testCases[i].weight || 1
        results.push({
          testCaseIndex: i,
          passed: false,
          isHidden: testCases[i].is_hidden,
          input: testCases[i].input,
          expectedOutput: testCases[i].expected_output,
          actualOutput: '',
          error: cleanError || compileError,
          executionTime: null,
          memory: null,
          status: 'Compilation Error',
          weight: weight,
          marksEarned: 0
        })
      }
      return results
    }
  } catch (error: any) {
    // If initial test fails, mark all as error
    for (let i = 0; i < testCases.length; i++) {
      const weight = testCases[i].weight || 1
      results.push({
        testCaseIndex: i,
        passed: false,
        isHidden: testCases[i].is_hidden,
        input: testCases[i].input,
        expectedOutput: testCases[i].expected_output,
        actualOutput: '',
        error: error.message,
        executionTime: null,
        memory: null,
        status: 'Submission Error',
        weight: weight,
        marksEarned: 0
      })
    }
    return results
  }
  
  // No compilation error, run each test case
  // Submit all test cases
  const tokens = await Promise.all(
    testCases.map(async (tc, index) => {
      try {
        const token = await submitToJudge0(
          code,
          language,
          tc.input,
          tc.expected_output
        )
        return { token, index, testCase: tc }
      } catch (error: any) {
        return { 
          token: null, 
          index, 
          testCase: tc, 
          error: error.message 
        }
      }
    })
  )
  
  // Poll for results
  for (const { token, index, testCase, error } of tokens) {
    if (error || !token) {
      const weight = testCase.weight || 1
      results.push({
        testCaseIndex: index,
        passed: false,
        isHidden: testCase.is_hidden,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput: '',
        error: error || 'Failed to submit',
        executionTime: null,
        memory: null,
        status: 'Submission Error',
        weight: weight,
        marksEarned: 0
      })
      continue
    }
    
    try {
      const result = await pollSubmissionResult(token)
      
      const actualOutput = (result.stdout || '').trim()
      const expectedOutput = testCase.expected_output.trim()
      
      // Status 3 = Accepted
      const passed = result.status.id === 3 && actualOutput === expectedOutput
      
      // Calculate marks based on weight
      const weight = testCase.weight || 1
      const marksEarned = passed ? weight : 0
      
      // Only include error for runtime errors, not for wrong output
      const hasRuntimeError = result.stderr || result.message
      const runtimeError = hasRuntimeError ? cleanErrorMessage(result.stderr || result.message || '') : null
      
      results.push({
        testCaseIndex: index,
        passed,
        isHidden: testCase.is_hidden,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput: actualOutput,
        error: runtimeError,
        executionTime: result.time,
        memory: result.memory,
        status: result.status.description,
        weight: weight,
        marksEarned: marksEarned
      })
    } catch (error: any) {
      const weight = testCase.weight || 1
      results.push({
        testCaseIndex: index,
        passed: false,
        isHidden: testCase.is_hidden,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput: '',
        error: error.message,
        executionTime: null,
        memory: null,
        status: 'Execution Error',
        weight: weight,
        marksEarned: 0
      })
    }
  }
  
  return results
}
