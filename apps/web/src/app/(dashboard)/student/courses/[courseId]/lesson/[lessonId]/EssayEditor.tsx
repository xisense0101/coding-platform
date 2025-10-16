"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { ChevronLeft, Menu, X, Info } from 'lucide-react'

interface EssayQuestionProps {
  questionId: string
  userId: string
  courseId: string
  title: string
  essay: {
    prompt: string
    rich_prompt?: any
    min_words?: number
    max_words?: number
    time_limit_minutes?: number
    rubric?: any
  }
}

export default function EssayEditor({ questionId, userId, courseId, title, essay }: EssayQuestionProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(100) // Full width for reading
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const resizerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
              <QuestionPanel essay={essay} onReportProblem={reportProblem} title={title} />
            </div>
          </div>
        )}

        {/* Question Panel - Full Width */}
        <div className="hidden lg:block overflow-auto bg-white w-full">
          <QuestionPanel essay={essay} onReportProblem={reportProblem} title={title} />
        </div>
      </div>
    </div>
  )
}

function QuestionPanel({ essay, onReportProblem, title }: { essay: any, onReportProblem: () => void, title: string }) {
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
                value="guidelines"
                className="data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
              >
                Guidelines
              </TabsTrigger>
            </TabsList>

            <TabsContent value="question" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-black">{title}</h1>
                  <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 shadow-sm">
                    Essay Question
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
                    <div className="prose prose-lg max-w-none">
                      {essay.rich_prompt ? (
                        <RichTextPreview content={essay.rich_prompt} />
                      ) : (
                        <div className="text-lg text-black leading-relaxed whitespace-pre-wrap">{essay.prompt}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Constraints Info */}
                {(essay.min_words || essay.max_words || essay.time_limit_minutes) && (
                  <Card className="border-blue-200 shadow-sm">
                    <CardContent className="p-4 bg-blue-50">
                      <h3 className="font-semibold text-black mb-2">Constraints:</h3>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {essay.min_words && (
                          <li>• Minimum words: {essay.min_words}</li>
                        )}
                        {essay.max_words && (
                          <li>• Maximum words: {essay.max_words}</li>
                        )}
                        {essay.time_limit_minutes && (
                          <li>• Time limit: {essay.time_limit_minutes} minutes</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="guidelines" className="space-y-4 mt-4">
              {essay.rubric ? (
                <Card className="border-purple-200 shadow-sm">
                  <CardContent className="p-6 bg-purple-50">
                    <h3 className="font-semibold text-black mb-3">Evaluation Rubric:</h3>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {typeof essay.rubric === 'string' ? (
                        <RichTextPreview content={essay.rubric} />
                      ) : (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(essay.rubric, null, 2)}</pre>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-6 bg-gray-50">
                    <p className="text-gray-600 text-center">No evaluation guidelines provided for this question.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
