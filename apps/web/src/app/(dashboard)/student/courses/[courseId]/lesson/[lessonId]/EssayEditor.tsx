"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RichTextPreview } from '@/features/coding/RichTextEditor'
import { Info } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

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
  // Debug logging for essay data (only in development)
  logger.log('EssayEditor - essay data:', essay)
  logger.log('EssayEditor - rich_prompt:', essay.rich_prompt)
  logger.log('EssayEditor - rich_prompt type:', typeof essay.rich_prompt)

  const reportProblem = () => {
    alert("Report problem functionality would be implemented here")
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-sky-50 to-white">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Full Width Reading Panel */}
        <div className="max-w-4xl mx-auto p-6">
          <QuestionPanel 
            essay={essay} 
            onReportProblem={reportProblem} 
            title={title}
          />
        </div>
      </div>
    </div>
  )
}

function QuestionPanel({ 
  essay, 
  onReportProblem, 
  title
}: { 
  essay: any, 
  onReportProblem: () => void, 
  title: string
}) {
  // Debug logging (only in development)
  logger.log('QuestionPanel - essay:', essay)
  logger.log('QuestionPanel - essay.rich_prompt:', essay.rich_prompt)
  logger.log('QuestionPanel - essay.prompt:', essay.prompt)

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-black">{title}</h1>
          <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 shadow-sm">
            📖 Reading Material
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

      {/* Reading Content */}
      <Card className="border-sky-200 shadow-sm">
        <CardContent className="p-8 bg-white">
          <div className="prose prose-lg max-w-none">
            {(() => {
              // Handle different rich_prompt formats
              if (essay.rich_prompt) {
                // If rich_prompt is a string
                if (typeof essay.rich_prompt === 'string') {
                  // Check if it's a JSON string
                  try {
                    const parsed = JSON.parse(essay.rich_prompt)
                    if (parsed && parsed.content) {
                      return <RichTextPreview content={parsed.content} />
                    }
                  } catch (e) {
                    // Not JSON, treat as HTML/text
                    return <RichTextPreview content={essay.rich_prompt} />
                  }
                }
                // If rich_prompt is an object with content property
                else if (typeof essay.rich_prompt === 'object' && essay.rich_prompt.content) {
                  return <RichTextPreview content={essay.rich_prompt.content} />
                }
                // Otherwise pass as-is
                return <RichTextPreview content={essay.rich_prompt} />
              }
              // Fallback to plain prompt
              else if (essay.prompt) {
                return <div className="text-lg text-black leading-relaxed whitespace-pre-wrap">{essay.prompt}</div>
              }
              // No content
              return <div className="text-lg text-gray-500 italic">No content available</div>
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Optional: Guidelines/Rubric Section */}
      {essay.rubric && (
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="p-6 bg-purple-50">
            <h3 className="font-semibold text-black mb-3 text-lg">📋 Additional Information:</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              {typeof essay.rubric === 'string' ? (
                <RichTextPreview content={essay.rubric} />
              ) : (
                <pre className="whitespace-pre-wrap">{JSON.stringify(essay.rubric, null, 2)}</pre>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
