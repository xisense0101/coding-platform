'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Hash,
  Calendar,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { logger } from '@/lib/utils/logger'

interface QuestionAnswer {
  questionId: string
  questionTitle: string
  questionType: 'mcq' | 'coding'
  questionContent: string
  userAnswer?: string
  userCode?: string
  selectedLanguage?: string
  options?: Array<{ id: string; text: string }>
  correctAnswer?: string[]
  isCorrect?: boolean
  pointsEarned?: number
  maxPoints?: number
}

export default function SubmissionPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params?.examId as string
  const submissionId = params?.submissionId as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    loadSubmissionPreview()
  }, [examId, submissionId])

  const loadSubmissionPreview = async () => {
    try {
      setLoading(true)

      // Fetch exam details with questions
      const examResponse = await fetch(`/api/exams/${examId}`)
      if (!examResponse.ok) throw new Error('Failed to fetch exam')
      const { exam: examData } = await examResponse.json()

      // Fetch submission details
      const submissionResponse = await fetch(`/api/exams/${examId}/submissions/${submissionId}`)
      if (!submissionResponse.ok) throw new Error('Failed to fetch submission')
      const { submission: submissionData } = await submissionResponse.json()

      setExam(examData)
      setSubmission(submissionData)

      // Map questions with student answers
      const allQuestions: QuestionAnswer[] = []

      examData.exam_sections?.forEach((section: any) => {
        section.exam_questions?.forEach((examQuestion: any) => {
          const question = examQuestion.question
          const questionId = question.id
          const studentAnswer = submissionData.answers?.[questionId]

          if (question.type === 'mcq') {
            const mcqData = question.mcq_questions?.[0]
            allQuestions.push({
              questionId,
              questionTitle: question.title,
              questionType: 'mcq',
              questionContent: mcqData?.question_text || question.description || '',
              options: mcqData?.options || [],
              correctAnswer: mcqData?.correct_answers || [],
              userAnswer: studentAnswer?.userAnswer,
              isCorrect: studentAnswer?.is_correct || false,
              pointsEarned: studentAnswer?.points_earned || 0,
              maxPoints: examQuestion.points || question.points || 0
            })
          } else if (question.type === 'coding') {
            const codingData = question.coding_questions?.[0]
            allQuestions.push({
              questionId,
              questionTitle: question.title,
              questionType: 'coding',
              questionContent: codingData?.problem_statement || question.description || '',
              userCode: studentAnswer?.userCode || '',
              selectedLanguage: studentAnswer?.language || 'javascript',
              isCorrect: studentAnswer?.is_correct || false,
              pointsEarned: studentAnswer?.points_earned || 0,
              maxPoints: examQuestion.points || question.points || 0
            })
          }
        })
      })

      setQuestionsWithAnswers(allQuestions)
    } catch (error) {
      logger.error('Error loading submission preview:', error)
      alert('Failed to load submission preview')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questionsWithAnswers[currentQuestionIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submission preview...</p>
        </div>
      </div>
    )
  }

  if (!exam || !submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-red-600">Failed to load submission data</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/teacher/exams/${examId}/results`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">Submission Preview - Read Only</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Score: {submission.total_score}/{submission.max_score}
            </Badge>
          </div>
        </div>
      </div>

      {/* Student Info Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{submission.student_name}</span>
            </div>
            {submission.roll_number && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span>{submission.roll_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{submission.student_email}</span>
            </div>
            {submission.submitted_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{new Date(submission.submitted_at).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{submission.time_taken_minutes || 0} minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Question Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Questions ({questionsWithAnswers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    {questionsWithAnswers.map((q, index) => (
                      <button
                        key={q.questionId}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all",
                          currentQuestionIndex === index
                            ? "bg-purple-50 border-purple-500"
                            : "bg-white border-gray-200 hover:border-purple-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Q{index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {q.questionType.toUpperCase()}
                            </Badge>
                          </div>
                          {q.isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {q.pointsEarned}/{q.maxPoints} pts
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Question and Answer */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                      <Badge variant="outline">{currentQuestion.questionType.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentQuestion.isCorrect ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {currentQuestion.pointsEarned}/{currentQuestion.maxPoints} points
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Content */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{currentQuestion.questionTitle}</h3>
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <RichTextPreview 
                          content={currentQuestion.questionContent} 
                          className="text-base leading-relaxed"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Student's Answer */}
                  <div>
                    <h4 className="font-semibold text-md mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Student's Answer
                    </h4>

                    {currentQuestion.questionType === 'mcq' && (
                      <div className="space-y-3">
                        {currentQuestion.options?.map((option) => {
                          const isSelected = currentQuestion.userAnswer === option.id
                          const isCorrect = currentQuestion.correctAnswer?.includes(option.id)
                          
                          return (
                            <div
                              key={option.id}
                              className={cn(
                                "p-4 rounded-lg border-2",
                                isSelected && isCorrect && "bg-green-50 border-green-500",
                                isSelected && !isCorrect && "bg-red-50 border-red-500",
                                !isSelected && isCorrect && "bg-green-50 border-green-300",
                                !isSelected && !isCorrect && "bg-gray-50 border-gray-200"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-base">{option.text}</span>
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <Badge variant="outline" className="text-xs">
                                      Selected
                                    </Badge>
                                  )}
                                  {isCorrect && (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      Correct Answer
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {!currentQuestion.userAnswer && (
                          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                            No answer provided
                          </p>
                        )}
                      </div>
                    )}

                    {currentQuestion.questionType === 'coding' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Language:</span>
                          <Badge variant="outline">{currentQuestion.selectedLanguage}</Badge>
                        </div>
                        {currentQuestion.userCode ? (
                          <Card className="bg-gray-900 text-gray-100">
                            <CardContent className="p-4">
                              <pre className="text-sm font-mono overflow-x-auto">
                                <code>{currentQuestion.userCode}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        ) : (
                          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                            No code submitted
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous Question
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentQuestionIndex + 1} / {questionsWithAnswers.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.min(questionsWithAnswers.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === questionsWithAnswers.length - 1}
                    >
                      Next Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
