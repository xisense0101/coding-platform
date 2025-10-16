"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Timer, 
  Settings, 
  Maximize2, 
  Check, 
  Info, 
  RotateCcw, 
  Send,
  Minus,
  Plus
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { RichTextPreview } from "@/components/editors/RichTextEditor"
import { CodingQuestionInterface } from "@/components/coding"

interface PreviewQuestion {
  id: number
  type: "mcq" | "coding"
  title: string
  content: string
  points: number
  options?: string[]
  correctAnswer?: string | number
  code?: string
  head?: Record<string, string>
  body_template?: Record<string, string>
  tail?: Record<string, string>
  testCases?: Array<{
    id: number
    input: string
    expectedOutput: string
    isHidden: boolean
  }>
  languages?: string[]
}

interface PreviewSection {
  id: number
  title: string
  description: string
  questions: PreviewQuestion[]
}

interface ExamPreviewProps {
  examTitle: string
  examDescription: string
  durationMinutes: number
  sections: PreviewSection[]
  onClose: () => void
}

const FONT_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"]

export function ExamPreview({
  examTitle,
  examDescription,
  durationMinutes,
  sections,
  onClose
}: ExamPreviewProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(45)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentFontSizeIndex, setCurrentFontSizeIndex] = useState(2)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)

  const containerRef = useRef<HTMLDivElement>(null)

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentSection = sections[currentSectionIdx]
  const currentQ = currentSection?.questions[currentQuestionIdx]

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const navigateToQuestion = (sectionIdx: number, questionIdx: number) => {
    setCurrentSectionIdx(sectionIdx)
    setCurrentQuestionIdx(questionIdx)
  }

  const increaseFontSize = () => setCurrentFontSizeIndex((p) => Math.min(p + 1, FONT_SIZES.length - 1))
  const decreaseFontSize = () => setCurrentFontSizeIndex((p) => Math.max(p - 1, 0))
  const currentFontSizeClass = FONT_SIZES[currentFontSizeIndex]

  const handleMCQAnswer = (answer: string) => {
    if (currentQ) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: answer }))
    }
  }

  const clearSelection = () => {
    if (currentQ) {
      setAnswers((prev) => {
        const newAnswers = { ...prev }
        delete newAnswers[currentQ.id]
        return newAnswers
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Preview Banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-yellow-800" />
          <span className="text-sm font-medium text-yellow-800">
            Preview Mode - This is how students will see the exam
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="bg-white hover:bg-gray-50"
        >
          <X className="h-4 w-4 mr-2" />
          Close Preview
        </Button>
      </div>

      {/* Main Exam Interface */}
      <div className="h-[calc(100vh-56px)] flex flex-col bg-gradient-to-br from-sky-50 to-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sky-200 bg-white/80 backdrop-blur shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-sky-100"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-sky-100 text-sky-700"
                onClick={() => {
                  if (currentQuestionIdx > 0) {
                    setCurrentQuestionIdx(currentQuestionIdx - 1)
                  } else if (currentSectionIdx > 0) {
                    setCurrentSectionIdx(currentSectionIdx - 1)
                    setCurrentQuestionIdx(sections[currentSectionIdx - 1].questions.length - 1)
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-sky-100 text-sky-700"
                onClick={() => {
                  if (currentSection && currentQuestionIdx < currentSection.questions.length - 1) {
                    setCurrentQuestionIdx(currentQuestionIdx + 1)
                  } else if (sections[currentSectionIdx + 1]) {
                    setCurrentSectionIdx(currentSectionIdx + 1)
                    setCurrentQuestionIdx(0)
                  }
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-sky-100 px-3 py-1 rounded-lg">
              <Timer className="h-4 w-4 text-sky-600" />
              <span className={`font-mono font-semibold ${timeLeft < 600 ? "text-red-600" : "text-sky-700"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-sky-100 text-sky-600"
                onClick={decreaseFontSize}
                disabled={currentFontSizeIndex === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-sky-100 text-sky-600"
                onClick={increaseFontSize}
                disabled={currentFontSizeIndex === FONT_SIZES.length - 1}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div
            className={`${
              isSidebarOpen ? "w-72" : "w-0"
            } transition-all duration-300 border-r border-sky-200 bg-white shadow-sm overflow-hidden`}
          >
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {sections.map((section, sIdx) => (
                  <div key={section.id} className="space-y-2">
                    <h3 className="font-semibold text-sm text-sky-900">{section.title}</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {section.questions.map((q, qIdx) => {
                        const isActive =
                          currentSectionIdx === sIdx && currentQuestionIdx === qIdx
                        const isAnswered = answers[q.id] !== undefined
                        return (
                          <button
                            key={q.id}
                            onClick={() => navigateToQuestion(sIdx, qIdx)}
                            className={cn(
                              "w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-semibold transition-all",
                              isActive
                                ? "border-sky-500 bg-sky-500 text-white shadow-md"
                                : isAnswered
                                ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
                                : "border-gray-300 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50"
                            )}
                          >
                            {qIdx + 1}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
            {currentQ?.type === "mcq" ? (
              <>
                {/* MCQ Question Panel */}
                <div
                  className="overflow-auto border-r border-sky-200 bg-white shadow-sm"
                  style={{ width: `${leftPanelWidth}%` }}
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-black">
                          Question {currentQuestionIdx + 1}. {currentQ.title}
                        </h1>
                        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          {currentQ.points} pts
                        </Badge>
                      </div>
                    </div>

                    <Card className="border-sky-200 shadow-sm">
                      <CardContent className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
                        <RichTextPreview
                          content={currentQ.content}
                          className={cn("text-lg text-black leading-relaxed", currentFontSizeClass)}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* MCQ Answer Panel */}
                <div className="flex-1 flex flex-col bg-white" style={{ width: `${100 - leftPanelWidth}%` }}>
                  <div className="p-6 border-b border-sky-200 bg-gradient-to-r from-sky-50 to-white">
                    <h2 className="text-lg font-semibold text-sky-900">Select Your Answer</h2>
                  </div>

                  <div className="flex-1 p-6 overflow-auto">
                    <RadioGroup
                      value={answers[currentQ.id] || ""}
                      onValueChange={handleMCQAnswer}
                      className="space-y-4"
                    >
                      {(currentQ.options || []).map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-4 rounded-lg border-2 border-sky-200 hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer"
                        >
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-sky-600" />
                          <Label
                            htmlFor={`option-${index}`}
                            className={cn("flex-1 cursor-pointer", currentFontSizeClass)}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="p-6 border-t border-sky-200 bg-gradient-to-r from-sky-50 to-white">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={clearSelection}
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-100"
                        disabled={!answers[currentQ.id]}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear selection
                      </Button>
                      <Button className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md">
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Coding Question Panel */}
                <div
                  className="overflow-auto border-r border-sky-200 bg-white shadow-sm"
                  style={{ width: `${leftPanelWidth}%` }}
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-black">
                          Question {currentQuestionIdx + 1}. {currentQ.title}
                        </h1>
                        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          {currentQ.points} pts
                        </Badge>
                      </div>
                    </div>

                    <Card className="border-sky-200 shadow-sm">
                      <CardContent className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
                        <RichTextPreview
                          content={currentQ.content}
                          className={cn("text-lg text-black leading-relaxed", currentFontSizeClass)}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Coding Interface */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white" style={{ width: `${100 - leftPanelWidth}%` }}>
                  {currentQ && (
                    <CodingQuestionInterface
                      questionId={currentQ.id.toString()}
                      userId="preview-user"
                      coding={{
                        problem_statement: currentQ.content,
                        boilerplate_code: currentQ.body_template || {},
                        test_cases: (currentQ.testCases || []).map(tc => ({
                          input: tc.input,
                          expected_output: tc.expectedOutput,
                          is_hidden: tc.isHidden
                        })),
                        allowed_languages: currentQ.languages || ["javascript", "python"],
                        head: currentQ.head || {},
                        body_template: currentQ.body_template || {},
                        tail: currentQ.tail || {}
                      }}
                      onRun={async () => ({ output: "Preview mode - code execution disabled" })}
                      onSubmit={async () => {}}
                      fontSizeClass={currentFontSizeClass}
                      isLocked={false}
                      showSubmitButton={true}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
