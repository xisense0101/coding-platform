"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Settings, Maximize2, Menu, X, Check, Info, Send, RotateCcw } from 'lucide-react'

interface McqQuestionProps {
  questionId: string
  userId: string
  courseId: string
  title: string
  mcq: {
    question_text: string
    options: string[]
    correct_answers: number[]
    explanation?: string
  }
}

export default function McqEditor({ questionId, userId, courseId, title, mcq }: McqQuestionProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newWidth >= 30 && newWidth <= 70) {
        setLeftPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const handleSubmit = async () => {
    if (!selectedAnswer) return

    setIsLoading(true)
    try {
      // Convert letter ID back to index for database
      const selectedIndex = selectedAnswer.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
      const answer = { selectedOption: selectedIndex }

      // Submit answer to database
      await fetch('/api/student/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          userId,
          answer,
          attemptType: 'mcq'
        })
      })

      setIsSubmitted(true)
      setShowResult(true)
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedAnswer("")
    setIsSubmitted(false)
    setShowResult(false)
  }

  const reportProblem = () => {
    alert("Report problem functionality would be implemented here")
  }

  const mcqOptions = mcq.options.map((option, index) => ({
    id: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd'
    text: option,
    isCorrect: mcq.correct_answers.includes(index)
  }))

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
              <QuestionPanel mcq={mcq} onReportProblem={reportProblem} title={title} />
            </div>
          </div>
        )}

        {/* Left Panel - Question */}
        <div
          className={`hidden lg:block overflow-auto border-r border-sky-200 bg-white shadow-sm`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          <QuestionPanel mcq={mcq} onReportProblem={reportProblem} title={title} />
        </div>

        {/* Resizer */}
        <div
          ref={resizerRef}
          className="hidden lg:block w-1 bg-sky-200 hover:bg-sky-400 cursor-col-resize transition-colors relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-sky-300/30" />
        </div>

        {/* Right Panel - Answer Options */}
        <div
          className="flex-1 lg:flex-none flex flex-col overflow-hidden bg-white"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Answer Header */}
          <div className="p-6 border-b border-sky-200 bg-gradient-to-r from-sky-50 to-white">
            {showResult && (
              <div className="text-sm text-sky-700">
                {mcqOptions.find(opt => opt.id === selectedAnswer)?.isCorrect ? (
                  <span className="text-green-600 font-medium">✓ Correct Answer!</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Incorrect. The correct answer is {mcqOptions.find(opt => opt.isCorrect)?.text}</span>
                )}
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="flex-1 p-6 overflow-auto">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-4">
              {mcqOptions.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:bg-sky-50 ${
                    selectedAnswer === option.id
                      ? showResult
                        ? option.isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : "border-sky-500 bg-sky-50"
                      : showResult && option.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-sky-200"
                  }`}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    disabled={isSubmitted}
                    className="text-sky-600"
                  />
                  <Label
                    htmlFor={option.id}
                    className={`flex-1 cursor-pointer font-mono text-base ${
                      showResult && option.isCorrect ? "font-semibold text-green-800" : "text-black"
                    }`}
                  >
                    {option.text}
                  </Label>
                  {showResult && option.isCorrect && <Check className="h-5 w-5 text-green-600" />}
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-sky-200 bg-gradient-to-r from-sky-50 to-white">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={clearSelection}
                className="text-sky-600 hover:text-sky-700 hover:bg-sky-100"
                disabled={!selectedAnswer}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear selection
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitted || isLoading}
                className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold px-8"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionPanel({ mcq, onReportProblem, title }: { mcq: any, onReportProblem: () => void, title: string }) {
  return (
    <div className="p-6 space-y-6">
      {/* Question Header */}
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
                value="attempts"
                className="data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
              >
                Attempts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">{title}</h1>
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

      {/* Question Content */}
      <div className="space-y-6">
        <Card className="border-sky-200 shadow-sm">
          <CardContent className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
            {mcq.rich_question_text ? (
              <RichTextPreview content={mcq.rich_question_text} />
            ) : (
              <p className="text-lg text-black leading-relaxed">{mcq.question_text}</p>
            )}
          </CardContent>
        </Card>
        {mcq.explanation && (
          <Card className="border-green-200 shadow-sm">
            <CardContent className="p-4 bg-green-50">
              <p className="text-sm text-gray-700">
                <strong>Explanation:</strong> {mcq.explanation}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
