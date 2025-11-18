"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RichTextPreview } from '@/features/coding/RichTextEditor'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Menu, X, Check, Info, Send, RotateCcw } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { formatDateTime } from '@/lib/utils'

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
  const [attempts, setAttempts] = useState<any[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [viewingAttempt, setViewingAttempt] = useState<any>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  
  // Store the working answer before viewing an attempt
  const workingAnswerBeforeViewRef = useRef<string | null>(null)

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
      logger.error('Error fetching attempts:', err)
    } finally {
      setLoadingAttempts(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedAnswer) return

    setIsLoading(true)
    try {
      // Convert letter ID back to index for database
      const selectedIndex = selectedAnswer.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.

      // Submit answer to database
      const res = await fetch('/api/mcq/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          userId,
          selectedOption: selectedIndex,
          correctAnswers: mcq.correct_answers
        })
      })

      if (res.ok) {
        const data = await res.json()
        setIsSubmitted(true)
        setShowResult(true)
        // Refresh attempts list after successful submission
        fetchAttempts()
      } else {
        alert('Failed to submit answer. Please try again.')
      }
    } catch (error) {
      logger.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedAnswer("")
    setIsSubmitted(false)
    setShowResult(false)
    setViewingAttempt(null)
    workingAnswerBeforeViewRef.current = null
  }

  const handleViewAttempt = (attempt: any) => {
    // Save the current working answer before viewing attempt
    workingAnswerBeforeViewRef.current = selectedAnswer
    
    setViewingAttempt(attempt)
    const selectedOption = attempt.answer?.selectedOption
    if (selectedOption !== undefined) {
      const optionLetter = String.fromCharCode(97 + selectedOption) // 0='a', 1='b', etc.
      setSelectedAnswer(optionLetter)
      setIsSubmitted(true)
      setShowResult(true)
    }
  }

  const handleBackToNew = () => {
    setViewingAttempt(null)
    
    // Restore the working answer from before viewing the attempt
    const restoredAnswer = workingAnswerBeforeViewRef.current !== null 
      ? workingAnswerBeforeViewRef.current 
      : ""
    
    setSelectedAnswer(restoredAnswer)
    setIsSubmitted(false)
    setShowResult(false)
    
    // Clear the saved working answer
    workingAnswerBeforeViewRef.current = null
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
      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute inset-0 z-50 bg-white">
            <div className="p-4 h-full overflow-auto">
              <QuestionPanel 
                mcq={mcq} 
                onReportProblem={reportProblem} 
                title={title}
                attempts={attempts}
                loadingAttempts={loadingAttempts}
                onViewAttempt={handleViewAttempt}
                viewingAttempt={viewingAttempt}
              />
            </div>
          </div>
        )}

        {/* Left Panel - Question */}
        <div
          className={`hidden lg:block overflow-auto border-r border-sky-200 bg-white shadow-sm`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          <QuestionPanel 
            mcq={mcq} 
            onReportProblem={reportProblem} 
            title={title}
            attempts={attempts}
            loadingAttempts={loadingAttempts}
            onViewAttempt={handleViewAttempt}
            viewingAttempt={viewingAttempt}
          />
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
            <div className="flex items-center justify-between mb-2">
              {viewingAttempt && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700">
                    Viewing Attempt #{viewingAttempt.attempt_number}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToNew}
                    className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Back to New Attempt
                  </Button>
                </div>
              )}
            </div>
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
                disabled={!selectedAnswer || viewingAttempt !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear selection
              </Button>
              <div className="relative group">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer || isSubmitted || isLoading || viewingAttempt !== null}
                  className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {viewingAttempt !== null && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Cannot submit while viewing an attempt
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionPanel({ 
  mcq, 
  onReportProblem, 
  title,
  attempts = [],
  loadingAttempts = false,
  onViewAttempt,
  viewingAttempt
}: { 
  mcq: any, 
  onReportProblem: () => void, 
  title: string,
  attempts?: any[],
  loadingAttempts?: boolean,
  onViewAttempt?: (attempt: any) => void,
  viewingAttempt?: any
}) {
  const [activeTab, setActiveTab] = useState("question")

  const getOptionLetter = (index: number) => String.fromCharCode(97 + index) // 0='a', 1='b', etc.

  return (
    <div className="p-6 space-y-6">
      {/* Question Header */}
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
                value="attempts"
                className="data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
              >
                Submissions {attempts.length > 0 && `(${attempts.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="question" className="mt-6">
              <div className="space-y-4">
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
            </TabsContent>

            <TabsContent value="attempts" className="mt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-black">Your Submissions</h2>
                
                {loadingAttempts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No submissions yet. Submit your answer to see your attempts here!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt, index) => {
                      const selectedOption = attempt.answer?.selectedOption
                      const isViewing = viewingAttempt?.id === attempt.id
                      return (
                        <Card 
                          key={attempt.id} 
                          className={`border-2 transition-all cursor-pointer ${
                            isViewing 
                              ? 'border-amber-500 bg-amber-50 shadow-lg ring-2 ring-amber-300' 
                              : attempt.is_correct 
                                ? 'border-green-300 bg-green-50 hover:shadow-md hover:border-green-400' 
                                : 'border-red-300 bg-red-50 hover:shadow-md hover:border-red-400'
                          }`}
                          onClick={() => onViewAttempt?.(attempt)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={isViewing ? "text-amber-700 border-amber-400 bg-amber-100" : "text-sky-700 border-sky-300"}>
                                    Attempt #{attempt.attempt_number}
                                  </Badge>
                                  {attempt.is_correct ? (
                                    <Badge className="bg-green-600 text-white">
                                      <Check className="h-3 w-3 mr-1" />
                                      Correct
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-600 text-white">
                                      Incorrect
                                    </Badge>
                                  )}
                                  {isViewing && (
                                    <Badge className="bg-amber-600 text-white">
                                      Currently Viewing
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Submitted:</span>
                                    <span>{formatDateTime(attempt.submitted_at || attempt.created_at)}</span>
                                  </div>
                                  {selectedOption !== undefined && mcq.options && (
                                    <div className="mt-2">
                                      <span className="font-medium">Your Answer: </span>
                                      <span className="font-mono">
                                        {getOptionLetter(selectedOption).toUpperCase()}) {mcq.options[selectedOption]}
                                      </span>
                                    </div>
                                  )}
                                  {!attempt.is_correct && mcq.correct_answers && mcq.options && (
                                    <div className="mt-2 text-green-700">
                                      <span className="font-medium">Correct Answer: </span>
                                      <span className="font-mono">
                                        {getOptionLetter(mcq.correct_answers[0]).toUpperCase()}) {mcq.options[mcq.correct_answers[0]]}
                                      </span>
                                    </div>
                                  )}
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
