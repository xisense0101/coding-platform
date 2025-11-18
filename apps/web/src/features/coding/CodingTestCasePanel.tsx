"use client"

import { useState, memo } from "react"
import { Card } from "@/components/ui/card"
import { Lock, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TestCase {
  input: string
  expected_output?: string
  expectedOutput?: string
  is_hidden?: boolean
  isHidden?: boolean
  weight?: number // Marks/points for this specific test case
}

export interface TestCaseResult {
  testCaseIndex: number
  passed: boolean
  actualOutput: string
  error?: string
  executionTime?: string
  memory?: string
}

interface CodingTestCasePanelProps {
  testCases: TestCase[]
  testCaseResults?: TestCaseResult[]
  fontSizeClass?: string
}

export const CodingTestCasePanel = memo(function CodingTestCasePanel({
  testCases,
  testCaseResults = [],
  fontSizeClass = "text-sm"
}: CodingTestCasePanelProps) {
  const [expandedTestCases, setExpandedTestCases] = useState<Set<number>>(new Set())

  const toggleTestCase = (index: number) => {
    const newExpanded = new Set(expandedTestCases)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTestCases(newExpanded)
  }

  if (!testCases || testCases.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No test cases provided.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {testCases.map((tc, i) => {
        const result = testCaseResults.find(r => r.testCaseIndex === i)
        const isExpanded = expandedTestCases.has(i)
        const hasResult = result !== undefined
        const isHidden = tc.is_hidden ?? tc.isHidden ?? false
        const expectedOutput = tc.expected_output ?? tc.expectedOutput ?? ""

        return (
          <div
            key={i}
            className={cn(
              "rounded-lg border-2 transition-all",
              hasResult
                ? result.passed
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : "border-sky-200 bg-sky-50"
            )}
          >
            <button
              onClick={() => toggleTestCase(i)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {hasResult ? (
                  result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-sky-400" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    hasResult
                      ? result.passed
                        ? "text-green-800"
                        : "text-red-800"
                      : "text-sky-800"
                  )}
                >
                  Test Case #{i + 1}
                </span>
                {/* Weight/marks hidden from students during exam */}
                {isHidden && <Lock className="h-4 w-4 text-gray-500" />}
              </div>
              <div className="flex items-center gap-2">
                {hasResult && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      result.passed ? "text-green-700" : "text-red-700"
                    )}
                  >
                    {result.passed ? "Passed" : "Failed"}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-300 p-4 bg-white space-y-3">
                {isHidden ? (
                  <div className="flex items-center gap-2 text-gray-600 p-3 bg-gray-100 rounded">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">This test case is hidden</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Input:</div>
                      <div className={cn("bg-gray-50 p-2 rounded border font-mono whitespace-pre-wrap", fontSizeClass)}>
                        {tc.input || "(empty)"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Expected Output:</div>
                      <div className={cn("bg-gray-50 p-2 rounded border font-mono whitespace-pre-wrap", fontSizeClass)}>
                        {expectedOutput || "(empty)"}
                      </div>
                    </div>
                  </>
                )}

                {hasResult && !isHidden && (
                  <>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Your Output:</div>
                      <div
                        className={cn(
                          "p-2 rounded border font-mono whitespace-pre-wrap",
                          fontSizeClass,
                          result.passed ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                        )}
                      >
                        {result.actualOutput || "(empty)"}
                      </div>
                    </div>

                    {(result.executionTime || result.memory) && (
                      <div className="flex gap-4 text-xs text-gray-600">
                        {result.executionTime && <span>Time: {result.executionTime}s</span>}
                        {result.memory && <span>Memory: {result.memory} KB</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
