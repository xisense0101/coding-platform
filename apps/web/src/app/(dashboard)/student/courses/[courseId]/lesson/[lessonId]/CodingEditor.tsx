"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Settings,
  Maximize2,
  Menu,
  X,
  Send,
  Check,
  Info,
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
  const [code, setCode] = useState((coding.boilerplate_code && coding.boilerplate_code[selectedLanguage]) || "")
  const [customInput, setCustomInput] = useState("")
  const [consoleOutput, setConsoleOutput] = useState("")
  const [activeTab, setActiveTab] = useState("test-cases")
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const verticalResizerRef = useRef<HTMLDivElement>(null)

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
    if (coding.boilerplate_code && coding.boilerplate_code[selectedLanguage]) {
      setCode(coding.boilerplate_code[selectedLanguage])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  const runCode = async () => {
    setIsRunning(true)
    setActiveTab("console")
    setConsoleOutput("Running test cases...\n")

    try {
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code,
          language: selectedLanguage,
          testCases: coding.test_cases
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        setConsoleOutput((prev) => prev + `Error running code: ${res.status} ${txt}\n`)
      } else {
        const data = await res.json()
        setConsoleOutput((prev) => prev + (data.output || JSON.stringify(data, null, 2)) + "\n")
      }
    } catch (err: any) {
      setConsoleOutput((prev) => prev + `Unexpected error: ${err?.message || String(err)}\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const submitCode = async () => {
    setIsSubmitting(true)
    setActiveTab("console")
    setConsoleOutput("Submitting solution...\n")

    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code,
          language: selectedLanguage
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        setConsoleOutput((prev) => prev + `Submission failed: ${res.status} ${txt}\n`)
      } else {
        const data = await res.json()
        setConsoleOutput((prev) => prev + (data.result || JSON.stringify(data, null, 2)) + "\n")
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sky-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-sky-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-700">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-700">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute inset-0 z-50 bg-white">
            <div className="p-4 h-full overflow-auto">
              <ProblemDescription coding={coding} onReportProblem={reportProblem} />
            </div>
          </div>
        )}

        {/* Left Panel - Problem Description */}
        <div
          className={`hidden lg:block overflow-auto border-r border-sky-200 bg-white shadow-sm`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          <ProblemDescription coding={coding} onReportProblem={reportProblem} />
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
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32 border-sky-200 focus:ring-sky-500 focus:border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(coding.allowed_languages || []).map((lang: string) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600">
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
                disabled={isRunning || isSubmitting}
                className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Go"}
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 relative" style={{ height: `${100 - bottomPanelHeight}%` }}>
            <div className="absolute inset-0 bg-slate-900 text-slate-100 font-mono text-sm">
              <div className="flex">
                <div className="w-12 bg-slate-800 text-slate-400 text-right pr-2 py-4 select-none border-r border-slate-700">
                  {code.split("\n").map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <div className="text-sky-400 mb-2">#include</div>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full bg-transparent border-none text-slate-100 font-mono resize-none focus:ring-0 focus:outline-none"
                    style={{ minHeight: "300px" }}
                  />
                </div>
              </div>
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
                      coding.test_cases.map((tc: any, i: number) => (
                        <div key={i} className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                          <div className="text-sm font-semibold text-sky-800 mb-2">Test Case {i + 1}</div>
                          <div className="bg-white p-3 rounded border text-sm font-mono">
                            <div className="text-sky-700">Input: {tc.input ?? JSON.stringify(tc.input)}</div>
                            <div className="text-sky-700">Expected: {tc.expected_output ?? tc.expectedOutput ?? ''}</div>
                          </div>
                        </div>
                      ))
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

function ProblemDescription({ coding, onReportProblem }: { coding: any, onReportProblem: () => void }) {
  return (
    <div className="p-6 space-y-6">
      {/* Problem Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tabs defaultValue="question" className="w-full">
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
                Submissions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
  )
}
