"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CodeEditor } from '@/components/editors/CodeEditor'
import { Badge } from "@/components/ui/badge"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import {
  Play,
  RotateCcw,
  Menu,
  X,
  Send,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lock,
  XCircle,
  CheckCircle,
} from "lucide-react"

interface CodingQuestionProps {
  questionId: string
  userId: string
  courseId: string
  coding: {
    problem_statement: string
    boilerplate_code: Record<string, string> | null
    test_cases: Array<any>
    allowed_languages: string[]
    time_limit?: number
    memory_limit?: number
    head?: Record<string, string>
    body_template?: Record<string, string>
    tail?: Record<string, string>
    [key: string]: any
  }
}

export default function CodingEditor({ questionId, userId, courseId, coding }: CodingQuestionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState((coding.allowed_languages && coding.allowed_languages[0]) || "c")
  const [leftPanelWidth, setLeftPanelWidth] = useState(45)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35)
  const [isResizing, setIsResizing] = useState(false)
  const [isResizingVertical, setIsResizingVertical] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Debug: Log the coding data to see what we're receiving
  console.log('CodingEditor - coding data:', coding)
  console.log('CodingEditor - head:', coding.head)
  console.log('CodingEditor - body_template:', coding.body_template)
  console.log('CodingEditor - tail:', coding.tail)
  console.log('CodingEditor - selectedLanguage:', selectedLanguage)
  
  // Normalize language to lowercase for key lookup
  const languageKey = selectedLanguage.toLowerCase()
  console.log('CodingEditor - languageKey (normalized):', languageKey)
  
  // Get head, body, and tail for the selected language
  const head = coding.head?.[languageKey] || ''
  const tail = coding.tail?.[languageKey] || ''
  const initialBody = coding.body_template?.[languageKey] || (coding.boilerplate_code && coding.boilerplate_code[languageKey]) || ''
  
  console.log('CodingEditor - extracted head:', head)
  console.log('CodingEditor - extracted tail:', tail)
  console.log('CodingEditor - extracted initialBody:', initialBody)
  
  // Create a unique key for localStorage based on question, user, and language
  const getStorageKey = (lang: string) => `coding-editor-${questionId}-${userId}-${lang.toLowerCase()}`
  
  // Load saved code from localStorage or use initial body
  const getSavedCode = (lang: string) => {
    if (typeof window === 'undefined') return initialBody
    const saved = localStorage.getItem(getStorageKey(lang))
    return saved !== null ? saved : initialBody
  }
  
  const [body, setBody] = useState(() => getSavedCode(selectedLanguage))
  const [fullCode, setFullCode] = useState(`${head}${getSavedCode(selectedLanguage)}${tail}`)
  
  const [customInput, setCustomInput] = useState("")
  const [consoleOutput, setConsoleOutput] = useState("")
  const [activeTab, setActiveTab] = useState("test-cases")
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHeadCollapsed, setIsHeadCollapsed] = useState(true)
  const [isTailCollapsed, setIsTailCollapsed] = useState(true)
  const [attempts, setAttempts] = useState<any[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [viewingAttempt, setViewingAttempt] = useState<any>(null)
  
  // Test case results state
  const [testCaseResults, setTestCaseResults] = useState<any[]>([])
  const [expandedTestCases, setExpandedTestCases] = useState<Set<number>>(new Set())

  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const verticalResizerRef = useRef<HTMLDivElement>(null)
  
  // Store the working code before viewing an attempt
  const workingCodeBeforeViewRef = useRef<string | null>(null)
  const workingLanguageBeforeViewRef = useRef<string | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleVerticalMouseDown = (e: React.MouseEvent) => {
    setIsResizingVertical(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

        if (newWidth >= 25 && newWidth <= 75) {
          setLeftPanelWidth(newWidth)
        }
      }

      if (isResizingVertical && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect()
        const newHeight = ((panelRect.bottom - e.clientY) / panelRect.height) * 100

        if (newHeight >= 20 && newHeight <= 60) {
          setBottomPanelHeight(newHeight)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsResizingVertical(false)
    }

    if (isResizing || isResizingVertical) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, isResizingVertical])

  useEffect(() => {
    // Update head, body, and tail when language changes
    const languageKey = selectedLanguage.toLowerCase()
    const newHead = coding.head?.[languageKey] || ''
    const newTail = coding.tail?.[languageKey] || ''
    const newBody = coding.body_template?.[languageKey] || (coding.boilerplate_code && coding.boilerplate_code[languageKey]) || ''
    
    // Check if there's saved code for this language
    const savedCode = getSavedCode(selectedLanguage)
    setBody(savedCode)
    setFullCode(`${newHead}${savedCode}${newTail}`)
  }, [selectedLanguage, coding.head, coding.tail, coding.body_template, coding.boilerplate_code])

  // Save code to localStorage whenever body changes
  useEffect(() => {
    if (typeof window !== 'undefined' && body) {
      localStorage.setItem(getStorageKey(selectedLanguage), body)
    }
  }, [body, selectedLanguage, questionId, userId])

  // Load attempts when component mounts
  useEffect(() => {
    fetchAttempts()
  }, [questionId, userId])

  const fetchAttempts = async () => {
    setLoadingAttempts(true)
    try {
      const res = await fetch(`/api/attempts/${questionId}`)
      if (res.ok) {
        const data = await res.json()
        setAttempts(data.attempts || [])
      }
    } catch (err) {
      console.error('Error fetching attempts:', err)
    } finally {
      setLoadingAttempts(false)
    }
  }

  // Handle reset - clear saved code and restore initial template
  const handleReset = () => {
    const languageKey = selectedLanguage.toLowerCase()
    const resetBody = coding.body_template?.[languageKey] || (coding.boilerplate_code && coding.boilerplate_code[languageKey]) || ''
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey(selectedLanguage))
    }
    
    // Clear viewing attempt and reset to template
    setViewingAttempt(null)
    workingCodeBeforeViewRef.current = null
    workingLanguageBeforeViewRef.current = null
    
    setBody(resetBody)
    const newHead = coding.head?.[languageKey] || ''
    const newTail = coding.tail?.[languageKey] || ''
    setFullCode(`${newHead}${resetBody}${newTail}`)
    
    // Show feedback
    setConsoleOutput("Code reset to initial template.\n")
    setActiveTab("console")
  }

  const handleViewAttempt = (attempt: any) => {
    // Save the current working code and language before viewing attempt
    workingCodeBeforeViewRef.current = body
    workingLanguageBeforeViewRef.current = selectedLanguage
    
    setViewingAttempt(attempt)
    const attemptCode = attempt.answer?.code || ''
    const attemptLanguage = attempt.language || selectedLanguage
    
    // Change language if different
    if (attemptLanguage.toLowerCase() !== selectedLanguage.toLowerCase()) {
      setSelectedLanguage(attemptLanguage)
    }
    
    // Set the body to the attempt's code
    setBody(attemptCode)
    const languageKey = attemptLanguage.toLowerCase()
    const newHead = coding.head?.[languageKey] || ''
    const newTail = coding.tail?.[languageKey] || ''
    setFullCode(`${newHead}${attemptCode}${newTail}`)
    
    // Show message in console
    setConsoleOutput(`Viewing Attempt #${attempt.attempt_number} (${attemptLanguage})\nSubmitted: ${new Date(attempt.submitted_at || attempt.created_at).toLocaleString()}\n`)
    setActiveTab("console")
  }

  const handleBackToCurrentCode = () => {
    setViewingAttempt(null)
    
    // Restore the working code from before viewing the attempt
    const restoredCode = workingCodeBeforeViewRef.current !== null 
      ? workingCodeBeforeViewRef.current 
      : getSavedCode(selectedLanguage)
    
    // Restore the original language if it was changed
    const restoredLanguage = workingLanguageBeforeViewRef.current || selectedLanguage
    if (restoredLanguage !== selectedLanguage) {
      setSelectedLanguage(restoredLanguage)
    }
    
    setBody(restoredCode)
    const languageKey = restoredLanguage.toLowerCase()
    const newHead = coding.head?.[languageKey] || ''
    const newTail = coding.tail?.[languageKey] || ''
    setFullCode(`${newHead}${restoredCode}${newTail}`)
    
    // Clear the saved working code
    workingCodeBeforeViewRef.current = null
    workingLanguageBeforeViewRef.current = null
    
    setConsoleOutput("Returned to your working code.\n")
  }

  const runWithCustomInput = async () => {
    setIsRunning(true)
    setConsoleOutput("Running with custom input...\n")
    setActiveTab("console") // Switch to console tab
    
    try {
      const res = await fetch('/api/coding/run-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fullCode,
          language: selectedLanguage,
          input: customInput
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error', details: res.statusText }))
        setConsoleOutput(`${errorData.details || errorData.error}\n`)
      } else {
        const data = await res.json()
        
        // Show output or error in console
        if (data.error) {
          setConsoleOutput(data.error)
        } else if (data.output !== undefined) {
          setConsoleOutput(data.output)
        } else {
          setConsoleOutput(JSON.stringify(data, null, 2))
        }
      }
    } catch (err: any) {
      setConsoleOutput(`${err?.message || String(err)}\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const runCode = async () => {
    // If on custom input tab, run with custom input instead
    if (activeTab === "custom-input") {
      await runWithCustomInput()
      return
    }

    setIsRunning(true)
    setConsoleOutput("Running test cases...\n")
    setTestCaseResults([]) // Clear previous results
    
    // Use the fullCode for execution
    try {
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code: fullCode,
          language: selectedLanguage,
          testCases: coding.test_cases
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error', details: res.statusText }))
        
        // Show error in console tab
        setActiveTab("console")
        setConsoleOutput(`${errorData.details || errorData.error}\n`)
      } else {
        const data = await res.json()
        
        if (data.testCaseResults) {
          setTestCaseResults(data.testCaseResults)
          const passed = data.testCasesPassed || 0
          const total = data.totalTestCases || 0
          
          // Get the first test case with error or output (for console display)
          const firstTestCase = data.testCaseResults[0]
          
          // Check if any test case has errors (compilation/runtime errors from Judge0)
          const hasErrors = data.testCaseResults.some((tc: any) => tc.error)
          
          if (hasErrors) {
            // Show only the raw Judge0 error in console tab (from first test case)
            const errorTestCase = data.testCaseResults.find((tc: any) => tc.error)
            setActiveTab("console")
            setConsoleOutput(errorTestCase.error)
          } else if (firstTestCase && firstTestCase.actualOutput) {
            // Show output from first test case in console
            setActiveTab("console")
            setConsoleOutput(firstTestCase.actualOutput)
          } else {
            // No errors or output, show test cases tab
            setActiveTab("test-cases")
            setConsoleOutput(
              `Execution completed!\n\nTest Cases: ${passed}/${total} passed\n\n` +
              data.testCaseResults.map((tc: any, idx: number) => 
                `Test Case #${idx + 1}: ${tc.passed ? '✓ PASSED' : '✗ FAILED'}${tc.isHidden ? ' (Hidden)' : ''}`
              ).join('\n')
            )
          }
        } else {
          setActiveTab("console")
          setConsoleOutput((prev) => prev + (data.output || JSON.stringify(data, null, 2)) + "\n")
        }
      }
    } catch (err: any) {
      setActiveTab("console")
      setConsoleOutput(`${err?.message || String(err)}\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const submitCode = async () => {
    setIsSubmitting(true)
    setConsoleOutput("Submitting solution...\n")
    setTestCaseResults([]) // Clear previous results
    
    // First, run the code to get test case results
    let testCasesPassed = 0
    let totalTestCases = 0
    let isCorrect = false
    
    try {
      const runRes = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code: fullCode,
          language: selectedLanguage,
          testCases: coding.test_cases
        })
      })
      
      if (runRes.ok) {
        const runData = await runRes.json()
        if (runData.testCaseResults) {
          setTestCaseResults(runData.testCaseResults)
          testCasesPassed = runData.testCasesPassed || 0
          totalTestCases = runData.totalTestCases || 0
          isCorrect = testCasesPassed === totalTestCases && totalTestCases > 0
          
          // Get the first test case with error or output (for console display)
          const firstTestCase = runData.testCaseResults[0]
          
          // Check if any test case has errors (compilation/runtime errors from Judge0)
          const hasErrors = runData.testCaseResults.some((tc: any) => tc.error)
          
          if (hasErrors) {
            // Show only the raw Judge0 error in console tab (from first test case)
            const errorTestCase = runData.testCaseResults.find((tc: any) => tc.error)
            setActiveTab("console")
            setConsoleOutput(errorTestCase.error)
          } else if (firstTestCase && firstTestCase.actualOutput) {
            // Show output from first test case in console
            setActiveTab("console")
            setConsoleOutput(firstTestCase.actualOutput)
          } else {
            // No errors, show test results in test cases tab
            setActiveTab("test-cases")
          }
        }
      } else {
        // Handle errors - show in console
        setActiveTab("console")
        const errorData = await runRes.json().catch(() => ({ error: 'Unknown error' }))
        setConsoleOutput(`${errorData.details || errorData.error}`)
      }
    } catch (err: any) {
      console.error('Error running test cases before submission:', err)
      setActiveTab("console")
      setConsoleOutput(`${err?.message || String(err)}`)
    }
    
    // Submit only the body (user's editable code), not head/tail
    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code: body, // Only submit the body, not fullCode
          language: selectedLanguage,
          testCasesPassed,
          totalTestCases,
          isCorrect
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        setConsoleOutput((prev) => prev + `Submission failed: ${res.status} ${txt}\n`)
      } else {
        const data = await res.json()
        // Don't add submission messages to console, keep it clean with just Judge0 output
        // Refresh attempts list after successful submission
        fetchAttempts()
      }
    } catch (err: any) {
      setConsoleOutput((prev) => prev + `Unexpected error: ${err?.message || String(err)}\n`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const reportProblem = () => {
    alert("Report problem functionality would be implemented here")
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-sky-50 to-white">
      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute inset-0 z-50 bg-white">
            <div className="p-4 h-full overflow-auto">
              <ProblemDescription 
                coding={coding} 
                onReportProblem={reportProblem}
                attempts={attempts}
                loadingAttempts={loadingAttempts}
                onViewAttempt={handleViewAttempt}
                viewingAttempt={viewingAttempt}
              />
            </div>
          </div>
        )}

        {/* Left Panel - Problem Description */}
        <div
          className={`hidden lg:block overflow-auto border-r border-sky-200 bg-white shadow-sm`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          <ProblemDescription 
            coding={coding} 
            onReportProblem={reportProblem}
            attempts={attempts}
            loadingAttempts={loadingAttempts}
            onViewAttempt={handleViewAttempt}
            viewingAttempt={viewingAttempt}
          />
        </div>

        {/* Horizontal Resizer */}
        <div
          ref={resizerRef}
          className="hidden lg:block w-1 bg-sky-200 hover:bg-sky-400 cursor-col-resize transition-colors relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-sky-300/30" />
        </div>

        {/* Right Panel - Code Editor */}
        <div
          ref={rightPanelRef}
          className="flex-1 lg:flex-none flex flex-col overflow-hidden bg-white"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-sky-200 bg-gradient-to-r from-sky-50 to-white">
            <div className="flex items-center gap-4">
              <Select 
                value={selectedLanguage} 
                onValueChange={setSelectedLanguage}
                disabled={viewingAttempt !== null}
              >
                <SelectTrigger className="w-32 border-sky-200 focus:ring-sky-500 focus:border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(coding.allowed_languages || []).map((lang: string) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {viewingAttempt && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50">
                    Viewing Attempt #{viewingAttempt.attempt_number}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToCurrentCode}
                    className="text-sky-700 border-sky-300 hover:bg-sky-50"
                  >
                    Back to Current Code
                  </Button>
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
                disabled={viewingAttempt !== null}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={runCode}
                size="sm"
                disabled={isRunning || isSubmitting}
                className="bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running..." : "Run"}
              </Button>
              <Button
                onClick={submitCode}
                size="sm"
                disabled={isRunning || isSubmitting || viewingAttempt !== null || activeTab === "custom-input"}
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
            </div>
          </div>

          {/* Code Editor with head (read-only collapsible), body (editable), tail (read-only collapsible) */}
          <div className="flex-1 relative" style={{ height: `${100 - bottomPanelHeight}%` }}>
            <div className="absolute inset-0 bg-white text-black font-mono text-sm flex flex-col overflow-auto">
              {head && (
                <div className="border-b border-gray-300">
                  <button
                    onClick={() => setIsHeadCollapsed(!isHeadCollapsed)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isHeadCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="text-xs font-semibold text-gray-600">HEAD (Read-only)</span>
                    </div>
                    <span className="text-xs text-gray-500">{isHeadCollapsed ? 'Click to expand' : 'Click to collapse'}</span>
                  </button>
                  {!isHeadCollapsed && (
                    <div className="border-t border-gray-200">
                      <CodeEditor
                        value={head}
                        onChange={() => {}} // Non-editable
                        language={selectedLanguage}
                        disabled={true}
                        height={150}
                        showLanguageSelector={false}
                        showActionButtons={false}
                        theme="light"
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-hidden border-b border-gray-300">
                <div className="px-4 py-2 bg-sky-50 border-b border-sky-200">
                  <span className="text-xs font-semibold text-sky-700">BODY (Your Code)</span>
                </div>
                <CodeEditor
                  value={body}
                  onChange={(val) => {
                    setBody(val)
                    setFullCode(`${head}${val}${tail}`)
                  }}
                  language={selectedLanguage}
                  disabled={isRunning || isSubmitting}
                  height={400}
                  showLanguageSelector={false}
                  showActionButtons={false}
                  theme="light"
                  className="bg-white h-full"
                />
              </div>
              {tail && (
                <div className="border-t border-gray-300">
                  <button
                    onClick={() => setIsTailCollapsed(!isTailCollapsed)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isTailCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="text-xs font-semibold text-gray-600">TAIL (Read-only)</span>
                    </div>
                    <span className="text-xs text-gray-500">{isTailCollapsed ? 'Click to expand' : 'Click to collapse'}</span>
                  </button>
                  {!isTailCollapsed && (
                    <div className="border-t border-gray-200">
                      <CodeEditor
                        value={tail}
                        onChange={() => {}} // Non-editable
                        language={selectedLanguage}
                        disabled={true}
                        height={150}
                        showLanguageSelector={false}
                        showActionButtons={false}
                        theme="light"
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vertical Resizer */}
          <div
            ref={verticalResizerRef}
            className="h-1 bg-sky-200 hover:bg-sky-400 cursor-row-resize transition-colors relative group"
            onMouseDown={handleVerticalMouseDown}
          >
            <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-sky-300/30" />
          </div>

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
                <TabsContent value="test-cases" className="p-4 space-y-4 h-full overflow-auto m-0">
                  <div className="space-y-3">
                    {Array.isArray(coding.test_cases) && coding.test_cases.length > 0 ? (
                      coding.test_cases.map((tc: any, i: number) => {
                        const result = testCaseResults.find(r => r.testCaseIndex === i)
                        const isExpanded = expandedTestCases.has(i)
                        const hasResult = result !== undefined
                        
                        return (
                          <div 
                            key={i} 
                            className={`rounded-lg border-2 transition-all ${
                              hasResult 
                                ? result.passed 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-red-500 bg-red-50'
                                : 'border-sky-200 bg-sky-50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedTestCases)
                                if (isExpanded) {
                                  newExpanded.delete(i)
                                } else {
                                  newExpanded.add(i)
                                }
                                setExpandedTestCases(newExpanded)
                              }}
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
                                <span className={`text-sm font-semibold ${
                                  hasResult
                                    ? result.passed
                                      ? 'text-green-800'
                                      : 'text-red-800'
                                    : 'text-sky-800'
                                }`}>
                                  Test Case #{i + 1}
                                </span>
                                {tc.is_hidden && (
                                  <Lock className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {hasResult && (
                                  <span className={`text-xs font-medium ${
                                    result.passed ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {result.passed ? 'Passed' : 'Failed'}
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
                                {tc.is_hidden ? (
                                  <div className="flex items-center gap-2 text-gray-600 p-3 bg-gray-100 rounded">
                                    <Lock className="h-4 w-4" />
                                    <span className="text-sm">This test case is hidden</span>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Input:</div>
                                      <div className="bg-gray-50 p-2 rounded border text-sm font-mono whitespace-pre-wrap">
                                        {tc.input || '(empty)'}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Expected Output:</div>
                                      <div className="bg-gray-50 p-2 rounded border text-sm font-mono whitespace-pre-wrap">
                                        {tc.expected_output || tc.expectedOutput || '(empty)'}
                                      </div>
                                    </div>
                                  </>
                                )}
                                
                                {hasResult && !tc.is_hidden && (
                                  <>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Your Output:</div>
                                      <div className={`p-2 rounded border text-sm font-mono whitespace-pre-wrap ${
                                        result.passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                                      }`}>
                                        {result.actualOutput || '(empty)'}
                                      </div>
                                    </div>
                                    
                                    {(result.executionTime || result.memory) && (
                                      <div className="flex gap-4 text-xs text-gray-600">
                                        {result.executionTime && (
                                          <span>Time: {result.executionTime}s</span>
                                        )}
                                        {result.memory && (
                                          <span>Memory: {result.memory} KB</span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-sm text-gray-500">No test cases provided.</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="custom-input" className="p-4 h-full overflow-auto m-0">
                  <Textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter your custom input here..."
                    className="w-full h-full font-mono text-sm border-sky-200 focus:ring-sky-500 focus:border-sky-500 resize-none"
                  />
                </TabsContent>

                <TabsContent value="console" className="p-4 h-full overflow-auto m-0">
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap border border-sky-200 h-full overflow-auto">
                    {consoleOutput || "Console output will appear here..."}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProblemDescription({ 
  coding, 
  onReportProblem,
  attempts = [],
  loadingAttempts = false,
  onViewAttempt,
  viewingAttempt = null
}: { 
  coding: any, 
  onReportProblem: () => void,
  attempts?: any[],
  loadingAttempts?: boolean,
  onViewAttempt?: (attempt: any) => void,
  viewingAttempt?: any
}) {
  const [activeTab, setActiveTab] = useState("question")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Problem Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-sky-100">
              <TabsTrigger
                value="question"
                className="data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
              >
                Question
              </TabsTrigger>
              <TabsTrigger
                value="submissions"
                className="data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
              >
                Submissions {attempts.length > 0 && `(${attempts.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="question" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-black">Coding Question</h1>
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-sm">
                      <Check className="h-3 w-3 mr-1" />
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReportProblem}
                    className="hover:bg-sky-100 text-sky-600 p-2"
                    title="Report a problem"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>

                {/* Problem Statement */}
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none text-black">
                    {coding.rich_problem_statement
                      ? <RichTextPreview content={coding.rich_problem_statement} />
                      : <div className="whitespace-pre-wrap">{coding.problem_statement}</div>
                    }
                  </div>

                  <div className="space-y-3 text-black">
                    <div>
                      <span className="font-semibold text-black">Time limit:</span> {coding.time_limit ?? 'N/A'} seconds
                    </div>
                    <div>
                      <span className="font-semibold text-black">Memory limit:</span> {coding.memory_limit ?? 'N/A'} MB
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="mt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-black">Your Submissions</h2>
                
                {loadingAttempts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No submissions yet. Click "Go" to submit your first solution!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt, index) => {
                      const isViewing = viewingAttempt?.id === attempt.id
                      const testCasesPassed = attempt.test_cases_passed || 0
                      const totalTestCases = attempt.total_test_cases || 0
                      const hasTestResults = totalTestCases > 0
                      return (
                        <Card 
                          key={attempt.id} 
                          className={`border-2 transition-all cursor-pointer ${
                            isViewing 
                              ? 'border-amber-400 bg-amber-50 shadow-lg' 
                              : hasTestResults
                                ? testCasesPassed === totalTestCases
                                  ? 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md'
                                  : testCasesPassed > 0
                                    ? 'border-orange-300 bg-orange-50 hover:border-orange-400 hover:shadow-md'
                                    : 'border-red-300 bg-red-50 hover:border-red-400 hover:shadow-md'
                                : 'border-sky-200 hover:border-sky-400 hover:shadow-md'
                          }`}
                          onClick={() => onViewAttempt?.(attempt)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="outline" className="text-sky-700 border-sky-300">
                                    Attempt #{attempt.attempt_number}
                                  </Badge>
                                  {attempt.language && (
                                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                                      {attempt.language}
                                    </Badge>
                                  )}
                                  {hasTestResults && (
                                    <Badge className={
                                      testCasesPassed === totalTestCases
                                        ? 'bg-green-600 text-white'
                                        : testCasesPassed > 0
                                          ? 'bg-orange-600 text-white'
                                          : 'bg-red-600 text-white'
                                    }>
                                      {testCasesPassed === totalTestCases && <Check className="h-3 w-3 mr-1" />}
                                      {testCasesPassed}/{totalTestCases} Test Cases Passed
                                    </Badge>
                                  )}
                                  {isViewing && (
                                    <Badge className="bg-amber-500 text-white">
                                      Currently Viewing
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Submitted:</span>
                                    <span>{formatDate(attempt.submitted_at || attempt.created_at)}</span>
                                  </div>
                                  {hasTestResults && (
                                    <div className={`mt-1 font-medium ${
                                      testCasesPassed === totalTestCases
                                        ? 'text-green-700'
                                        : testCasesPassed > 0
                                          ? 'text-orange-700'
                                          : 'text-red-700'
                                    }`}>
                                      {testCasesPassed === totalTestCases
                                        ? '✓ All test cases passed!'
                                        : `${totalTestCases - testCasesPassed} test case${totalTestCases - testCasesPassed !== 1 ? 's' : ''} failed`
                                      }
                                    </div>
                                  )}
                                  <div className="mt-2 text-sky-700 font-medium">
                                    {isViewing ? '👁️ Viewing in editor' : '👁️ Click to view in editor'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
