"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import dynamic from 'next/dynamic'
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { ChevronLeft, ChevronRight, Code, FileText, CheckCircle2, PenTool, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  type: 'mcq' | 'coding' | 'reading' | 'essay'
  title: string
  description?: string
  rich_content?: any
  mcq_question?: {
    question_text: string
    options: string[]
    correct_answers: number[]
    explanation?: string
  }
  coding_question?: {
    problem_statement: string
    boilerplate_code: any
    test_cases: any
    allowed_languages: string[]
    time_limit?: number
    memory_limit?: number
    head?: Record<string, string>
    body_template?: Record<string, string>
    tail?: Record<string, string>
  }
  essay_question?: {
    prompt: string
    rich_prompt?: any
    min_words?: number
    max_words?: number
    time_limit_minutes?: number
    rubric?: any
  }
}

interface LessonViewProps {
  question: Question
  courseId: string
  courseTitle: string
  userId: string
  navigation?: {
    prev: string | null
    next: string | null
  }
}

const CodingEditor = dynamic(() => import('./CodingEditor'), { ssr: false })
const McqEditor = dynamic(() => import('./McqEditor'), { ssr: false })
const EssayEditor = dynamic(() => import('./EssayEditor'), { ssr: false })

export default function LessonView({ question, courseId, courseTitle, userId, navigation }: LessonViewProps) {
  const [essayAnswer, setEssayAnswer] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Supabase can return related records either as a singular aliased object
  // (e.g. `coding_question`) or as an array (e.g. `coding_questions`).
  // Normalize both shapes so the UI always receives a single object.
  const resolvedMcq: any = (question as any).mcq_question ?? (
    Array.isArray((question as any).mcq_questions) ? (question as any).mcq_questions[0] : (question as any).mcq_questions
  )

  const resolvedCoding: any = (question as any).coding_question ?? (
    Array.isArray((question as any).coding_questions) ? (question as any).coding_questions[0] : (question as any).coding_questions
  )

  // Debug logging
  console.log('LessonView - question:', question)
  console.log('LessonView - resolvedCoding:', resolvedCoding)
  console.log('LessonView - resolvedCoding.head:', resolvedCoding?.head)
  console.log('LessonView - resolvedCoding.body_template:', resolvedCoding?.body_template)
  console.log('LessonView - resolvedCoding.tail:', resolvedCoding?.tail)

  const resolvedEssay: any = (question as any).essay_question ?? (
    Array.isArray((question as any).essay_questions) ? (question as any).essay_questions[0] : (question as any).essay_questions
  )

  const handleBackClick = () => {
    router.push(`/student/courses/${courseId}`)
  }

  const handlePrevious = () => {
    if (navigation?.prev) {
      router.push(`/student/courses/${courseId}/lesson/${navigation.prev}`)
    }
  }

  const handleNext = () => {
    if (navigation?.next) {
      router.push(`/student/courses/${courseId}/lesson/${navigation.next}`)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      let answer: any = {}
      
      switch (question.type) {
        case 'essay':
          answer = { essayText: essayAnswer }
          break
        default:
          answer = {}
      }

      // Submit answer to database
      await fetch('/api/student/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: question.id,
          userId,
          answer,
          attemptType: question.type
        })
      })

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <FileText className="h-5 w-5" />
      case 'mcq': return <CheckCircle2 className="h-5 w-5" />
      case 'coding': return <Code className="h-5 w-5" />
      case 'essay': return <PenTool className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reading': return 'bg-blue-500'
      case 'mcq': return 'bg-green-500'
      case 'coding': return 'bg-purple-500'
      case 'essay': return 'bg-orange-500'
      default: return 'bg-sky-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      {/* Header */}
      <div className="border-b border-sky-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <div>
              <h1 className="text-xl font-bold text-sky-900">{courseTitle}</h1>
              <p className="text-sky-600 text-sm">{question.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!navigation?.prev}
                className="border-sky-300 text-sky-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={navigation?.prev ? "Previous question" : "No previous question"}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!navigation?.next}
                className="border-sky-300 text-sky-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={navigation?.next ? "Next question" : "No next question"}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Badge className={`${getTypeColor(question.type)} text-white`}>
              {getTypeIcon(question.type)}
              <span className="ml-2 capitalize">{question.type}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {question.type === 'coding' && (resolvedCoding || question.coding_question) ? (
        <CodingEditor
          questionId={question.id}
          userId={userId}
          courseId={courseId}
          coding={resolvedCoding || {
            problem_statement: question.coding_question?.problem_statement || question.description || '',
            boilerplate_code: question.coding_question?.boilerplate_code || {},
            test_cases: question.coding_question?.test_cases || [],
            allowed_languages: question.coding_question?.allowed_languages || ['javascript', 'python'],
            time_limit: question.coding_question?.time_limit,
            memory_limit: question.coding_question?.memory_limit,
            head: question.coding_question?.head || {},
            body_template: question.coding_question?.body_template || {},
            tail: question.coding_question?.tail || {},
            rich_problem_statement: question.rich_content || ''
          }}
        />
      ) : question.type === 'mcq' && (resolvedMcq || question.mcq_question) ? (
        <McqEditor
          questionId={question.id}
          userId={userId}
          courseId={courseId}
          title={question.title}
          mcq={resolvedMcq || {
            question_text: question.mcq_question?.question_text || question.description || '',
            options: question.mcq_question?.options || ["", "", "", ""],
            correct_answers: question.mcq_question?.correct_answers || [0],
            explanation: question.mcq_question?.explanation || ''
          }}
        />
      ) : question.type === 'essay' && (resolvedEssay || question.essay_question) ? (
        <EssayEditor
          questionId={question.id}
          userId={userId}
          courseId={courseId}
          title={question.title}
          essay={resolvedEssay || {
            prompt: question.essay_question?.prompt || question.description || '',
            rich_prompt: question.rich_content || question.essay_question?.rich_prompt || '',
            min_words: question.essay_question?.min_words,
            max_words: question.essay_question?.max_words,
            time_limit_minutes: question.essay_question?.time_limit_minutes,
            rubric: question.essay_question?.rubric
          }}
        />
      ) : (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{question.title}</CardTitle>
              {question.description && (
                <p className="text-sky-600">{question.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Content */}
              {question.type === 'essay' && (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    {question.rich_content ? (
                      <RichTextPreview content={question.rich_content} />
                    ) : (
                      <p className="text-gray-700 text-lg">{question.description || "Please provide your answer below:"}</p>
                    )}
                  </div>

                  <Textarea
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    disabled={isSubmitted}
                    placeholder="Write your detailed answer here..."
                    className="min-h-48"
                  />
                </div>
              )}

              {question.type === 'reading' && (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    {question.rich_content ? (
                      <RichTextPreview content={question.rich_content} />
                    ) : (
                      <div className="text-gray-700 text-lg whitespace-pre-wrap">
                        {question.description || "Reading material will be displayed here."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {!isSubmitted && question.type !== 'reading' && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || (question.type === 'essay' && !essayAnswer.trim())}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Success Message */}
              {isSubmitted && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Answer submitted successfully!</span>
                    </div>
                    <Button
                      onClick={handleBackClick}
                      variant="outline"
                      className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Return to Course
                    </Button>
                  </CardContent>
                </Card>
              )}

              {question.type === 'reading' && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleBackClick}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    Mark as Complete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
