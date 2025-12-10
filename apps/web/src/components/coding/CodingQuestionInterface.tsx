"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Play, Send, RotateCcw, Check } from "lucide-react"
import { CodingEditor } from "./CodingEditor"
import { CodingTestCasePanel, type TestCase, type TestCaseResult } from "./CodingTestCasePanel"
import { LanguageSelector } from "./LanguageSelector"
import { cn } from "@/lib/utils"

interface CodingQuestionInterfaceProps {
  questionId: string
  userId: string
  courseId?: string
  coding: {
    problem_statement?: string
    boilerplate_code: Record<string, string> | null
    test_cases: TestCase[]
    allowed_languages: string[]
    time_limit?: number
    memory_limit?: number
    head?: Record<string, string>
    body_template?: Record<string, string>
    tail?: Record<string, string>
    [key: string]: any
  }
  onRun?: (code: string, language: string, customInput?: string) => Promise<any>
  onSubmit?: (code: string, language: string) => Promise<any>
  bottomPanelHeight?: number
  onVerticalResize?: (e: React.MouseEvent) => void
  fontSizeClass?: string
  isLocked?: boolean
  viewingAttempt?: any
  onBackToCurrentCode?: () => void
  showSubmitButton?: boolean
  showAttempts?: boolean
  disableCopyPaste?: boolean
}

export function CodingQuestionInterface({
  questionId,
  userId,
  courseId,
  coding,
  onRun,
  onSubmit,
  bottomPanelHeight = 35,
  onVerticalResize,
  fontSizeClass = "text-sm",
  isLocked = false,
  viewingAttempt = null,
  onBackToCurrentCode,
  showSubmitButton = true,
  showAttempts = false,
  disableCopyPaste = false
}: CodingQuestionInterfaceProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(
    (coding.allowed_languages && coding.allowed_languages[0]) || "c"
  )
  const [customInput, setCustomInput] = useState("")
  const [consoleOutput, setConsoleOutput] = useState("")
  const [activeTab, setActiveTab] = useState("test-cases")
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([])

  // Normalize language to lowercase for key lookup
  const languageKey = selectedLanguage.toLowerCase()

  // Get head, body, and tail for the selected language
  const head = coding.head?.[languageKey] || ""
  const tail = coding.tail?.[languageKey] || ""
  const initialBody =
    coding.body_template?.[languageKey] ||
    (coding.boilerplate_code && coding.boilerplate_code[languageKey]) ||
    ""

  // Create a unique key for localStorage based on question, user, and language
  const getStorageKey = (lang: string) =>
    `coding-editor-${questionId}-${userId}-${lang.toLowerCase()}`

  // Load saved code from localStorage or use initial body
  const getSavedCode = (lang: string) => {
    if (typeof window === "undefined") return initialBody
    const saved = localStorage.getItem(getStorageKey(lang))
    return saved !== null ? saved : initialBody
  }

  const [body, setBody] = useState(() => getSavedCode(selectedLanguage))
  const [fullCode, setFullCode] = useState(`${head}${getSavedCode(selectedLanguage)}${tail}`)

  const verticalResizerRef = useRef<HTMLDivElement>(null)

  // Update head, body, and tail when language changes
  useEffect(() => {
    const languageKey = selectedLanguage.toLowerCase()
    const newHead = coding.head?.[languageKey] || ""
    const newTail = coding.tail?.[languageKey] || ""

    // Check if there's saved code for this language
    const savedCode = getSavedCode(selectedLanguage)
    setBody(savedCode)
    setFullCode(`${newHead}${savedCode}${newTail}`)
  }, [selectedLanguage, coding.head, coding.tail, coding.body_template, coding.boilerplate_code])

  // Save code to localStorage whenever body changes
  useEffect(() => {
    if (typeof window !== "undefined" && body) {
      localStorage.setItem(getStorageKey(selectedLanguage), body)
    }
  }, [body, selectedLanguage, questionId, userId])

  const handleBodyChange = (newBody: string) => {
    setBody(newBody)
    setFullCode(`${head}${newBody}${tail}`)
  }

  const handleReset = () => {
    const languageKey = selectedLanguage.toLowerCase()
    const resetBody =
      coding.body_template?.[languageKey] ||
      (coding.boilerplate_code && coding.boilerplate_code[languageKey]) ||
      ""

    // Clear from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey(selectedLanguage))
    }

    setBody(resetBody)
    const newHead = coding.head?.[languageKey] || ""
    const newTail = coding.tail?.[languageKey] || ""
    setFullCode(`${newHead}${resetBody}${newTail}`)

    // Show feedback
    setConsoleOutput("Code reset to initial template.\n")
    setActiveTab("console")
  }

  const handleRunCode = async () => {
    if (activeTab === "custom-input") {
      await runWithCustomInput()
      return
    }

    setIsRunning(true)
    setConsoleOutput("Running test cases...\n")
    setTestCaseResults([])

    try {
      if (onRun) {
        const result = await onRun(fullCode, selectedLanguage)
        
        if (result.testCaseResults) {
          setTestCaseResults(result.testCaseResults)
          const passed = result.testCasesPassed || 0
          const total = result.totalTestCases || 0

          const firstTestCase = result.testCaseResults[0]
          const hasErrors = result.testCaseResults.some((tc: any) => tc.error)

          if (hasErrors) {
            const errorTestCase = result.testCaseResults.find((tc: any) => tc.error)
            setActiveTab("console")
            setConsoleOutput(errorTestCase.error)
          } else if (firstTestCase && firstTestCase.actualOutput) {
            setActiveTab("console")
            setConsoleOutput(firstTestCase.actualOutput)
          } else {
            setActiveTab("test-cases")
            setConsoleOutput(
              `Execution completed!\n\nTest Cases: ${passed}/${total} passed\n\n` +
                result.testCaseResults
                  .map(
                    (tc: any, idx: number) =>
                      `Test Case #${idx + 1}: ${tc.passed ? "✓ PASSED" : "✗ FAILED"}${
                        tc.isHidden ? " (Hidden)" : ""
                      }`
                  )
                  .join("\n")
            )
          }
        } else {
          setActiveTab("console")
          setConsoleOutput(result.output || JSON.stringify(result, null, 2))
        }
      }
    } catch (err: any) {
      setActiveTab("console")
      setConsoleOutput(`${err?.message || String(err)}\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const runWithCustomInput = async () => {
    setIsRunning(true)
    setConsoleOutput("Running with custom input...\n")
    setActiveTab("console")

    try {
      if (onRun) {
        const result = await onRun(fullCode, selectedLanguage, customInput)
        
        if (result.error) {
          setConsoleOutput(result.error)
        } else if (result.output !== undefined) {
          setConsoleOutput(result.output)
        } else {
          setConsoleOutput(JSON.stringify(result, null, 2))
        }
      }
    } catch (err: any) {
      setConsoleOutput(`${err?.message || String(err)}\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setConsoleOutput("Submitting solution...\n")
    setTestCaseResults([])

    try {
      if (onSubmit) {
        // First run the code to get results
        if (onRun) {
          const result = await onRun(fullCode, selectedLanguage)
          
          if (result.testCaseResults) {
            setTestCaseResults(result.testCaseResults)
            const passed = result.testCasesPassed || 0
            const total = result.totalTestCases || 0

            const firstTestCase = result.testCaseResults[0]
            const hasErrors = result.testCaseResults.some((tc: any) => tc.error)

            if (hasErrors) {
              const errorTestCase = result.testCaseResults.find((tc: any) => tc.error)
              setActiveTab("console")
              setConsoleOutput(errorTestCase.error)
            } else if (firstTestCase && firstTestCase.actualOutput) {
              setActiveTab("console")
              setConsoleOutput(firstTestCase.actualOutput)
            } else {
              setActiveTab("test-cases")
            }
          }
        }

        // Then submit
        await onSubmit(body, selectedLanguage)
      }
    } catch (err: any) {
      setActiveTab("console")
      setConsoleOutput(`${err?.message || String(err)}\n`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-sky-200 bg-gradient-to-r from-sky-50 to-white">
        <div className="flex items-center gap-4">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            allowedLanguages={coding.allowed_languages || ["c", "cpp", "java", "python", "javascript"]}
            onLanguageChange={setSelectedLanguage}
            disabled={viewingAttempt !== null || isLocked}
          />
          {viewingAttempt && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50">
                Viewing Attempt #{viewingAttempt.attempt_number}
              </Badge>
              {onBackToCurrentCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToCurrentCode}
                  className="text-sky-700 border-sky-300 hover:bg-sky-50"
                >
                  Back to Current Code
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="hover:bg-sky-100 text-sky-600"
            title="Reset to initial template"
            disabled={viewingAttempt !== null || isLocked}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleRunCode}
            size="sm"
            disabled={isRunning || isSubmitting || isLocked}
            className="bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Run"}
          </Button>
          {showSubmitButton && (
            <Button
              onClick={handleSubmit}
              size="sm"
              disabled={
                isRunning ||
                isSubmitting ||
                viewingAttempt !== null ||
                activeTab === "custom-input" ||
                isLocked
              }
              className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                viewingAttempt
                  ? "Cannot submit while viewing an attempt"
                  : activeTab === "custom-input"
                  ? "Cannot submit with custom input. Use Run button instead."
                  : "Submit your solution"
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Go"}
            </Button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative" style={{ height: `${100 - bottomPanelHeight}%` }}>
        <div className="absolute inset-0">
          <CodingEditor
            head={head}
            body={body}
            tail={tail}
            language={selectedLanguage}
            onBodyChange={handleBodyChange}
            disabled={isRunning || isSubmitting || isLocked}
            readOnly={viewingAttempt !== null}
            fontSizeClass={fontSizeClass}
            disableCopyPaste={disableCopyPaste}
          />
        </div>
      </div>

      {/* Vertical Resizer */}
      {onVerticalResize && (
        <div
          ref={verticalResizerRef}
          className="h-1 bg-sky-200 hover:bg-sky-400 cursor-row-resize transition-colors relative group"
          onMouseDown={onVerticalResize}
        >
          <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-sky-300/30" />
        </div>
      )}

      {/* Bottom Panel */}
      <div className="border-t border-sky-200 bg-white" style={{ height: `${bottomPanelHeight}%` }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-sky-100 bg-sky-50 flex-shrink-0">
            <TabsTrigger
              value="test-cases"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:border-b-2 data-[state=active]:border-sky-500"
            >
              Test cases
            </TabsTrigger>
            <TabsTrigger
              value="custom-input"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:border-b-2 data-[state=active]:border-sky-500"
            >
              Custom input
            </TabsTrigger>
            <TabsTrigger
              value="console"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:border-b-2 data-[state=active]:border-sky-500"
            >
              Console
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="test-cases" className="h-full overflow-auto m-0">
              <CodingTestCasePanel
                testCases={coding.test_cases}
                testCaseResults={testCaseResults}
                fontSizeClass={fontSizeClass}
              />
            </TabsContent>

            <TabsContent value="custom-input" className="p-4 h-full overflow-auto m-0 space-y-4">
              <Textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your custom input here..."
                className={cn(
                  "w-full flex-1 font-mono border-sky-200 focus:ring-sky-500 focus:border-sky-500 resize-none",
                  fontSizeClass
                )}
                readOnly={isLocked}
                onCopy={(e) => disableCopyPaste && e.preventDefault()}
                onPaste={(e) => disableCopyPaste && e.preventDefault()}
                onCut={(e) => disableCopyPaste && e.preventDefault()}
                onContextMenu={(e) => disableCopyPaste && e.preventDefault()}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={runWithCustomInput}
                  className="bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                  disabled={isLocked || isRunning}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Run with Custom Input
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="console" className="p-4 h-full overflow-auto m-0">
              <div
                className={cn(
                  "bg-slate-900 text-slate-100 p-4 rounded-lg font-mono whitespace-pre-wrap border border-sky-200 h-full overflow-auto",
                  fontSizeClass
                )}
              >
                {consoleOutput || "Console output will appear here..."}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
