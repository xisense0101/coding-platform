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
  testCasesPassed?: number
  totalTestCases?: number
  testCaseResults?: Array<{
    passed: boolean
    input?: string
    expectedOutput?: string
    actualOutput?: string
    isHidden?: boolean
    error?: string
    weight?: number
    pointsEarned?: number
  }>
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
            
            // Check if we have graded answer data
            const isCorrect = studentAnswer?.is_correct !== undefined 
              ? studentAnswer.is_correct 
              : false
            
            const pointsEarned = studentAnswer?.points_earned !== undefined
              ? studentAnswer.points_earned
              : 0
            
            // Format options with letter IDs (a, b, c, d)
            const formattedOptions = (mcqData?.options || []).map((opt: any, index: number) => ({
              id: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd'
              text: typeof opt === 'string' ? opt : opt.text || opt.toString()
            }))
            
            // Convert numeric correct answers to letter IDs
            const correctAnswerLetters = (mcqData?.correct_answers || []).map((idx: number) => 
              String.fromCharCode(97 + idx)
            )
            
            // Ensure userAnswer is in letter format (handle legacy numeric answers)
            let userAnswerLetter = studentAnswer?.userAnswer
            if (userAnswerLetter !== undefined && userAnswerLetter !== null) {
              // If it's a number or numeric string, convert to letter
              const numAnswer = typeof userAnswerLetter === 'number' ? userAnswerLetter : parseInt(userAnswerLetter)
              if (!isNaN(numAnswer) && numAnswer >= 0 && numAnswer < 26) {
                userAnswerLetter = String.fromCharCode(97 + numAnswer)
                logger.log(`📊 Converted numeric answer ${numAnswer} to letter ${userAnswerLetter} for question ${questionId}`)
              }
            }
            
            logger.log(`📊 Teacher preview MCQ:`, {
              questionId,
              questionTitle: question.title,
              userAnswer: userAnswerLetter,
              correctAnswers: correctAnswerLetters,
              options: formattedOptions.map((opt: { id: string; text: string }) => opt.id)
            })
            
            allQuestions.push({
              questionId,
              questionTitle: question.title,
              questionType: 'mcq',
              questionContent: mcqData?.question_text || question.description || '',
              options: formattedOptions,
              correctAnswer: correctAnswerLetters,
              userAnswer: userAnswerLetter,
              isCorrect: isCorrect,
              pointsEarned: pointsEarned,
              maxPoints: studentAnswer?.max_points || examQuestion.points || question.points || 0
            })
          } else if (question.type === 'coding') {
            const codingData = question.coding_questions?.[0]
            
            const isCorrect = studentAnswer?.is_correct !== undefined 
              ? studentAnswer.is_correct 
              : false
            
            const pointsEarned = studentAnswer?.points_earned !== undefined
              ? studentAnswer.points_earned
              : 0
            
            const testCasesPassed = studentAnswer?.test_cases_passed || 0
            const totalTestCases = studentAnswer?.total_test_cases || 0
            const testCaseResults = studentAnswer?.test_case_results || []
            
            allQuestions.push({
              questionId,
              questionTitle: question.title,
              questionType: 'coding',
              questionContent: codingData?.problem_statement || question.description || '',
              userCode: studentAnswer?.userCode || '',
              selectedLanguage: studentAnswer?.language || 'javascript',
              isCorrect: isCorrect,
              pointsEarned: pointsEarned,
              maxPoints: studentAnswer?.max_points || examQuestion.points || question.points || 0,
              testCasesPassed: testCasesPassed,
              totalTestCases: totalTestCases,
              testCaseResults: testCaseResults
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
                          ) : q.pointsEarned && q.pointsEarned > 0 ? (
                            <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                              ~
                            </div>
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {q.pointsEarned?.toFixed(2) || 0}/{q.maxPoints} pts
                          {q.questionType === 'coding' && q.totalTestCases !== undefined && q.totalTestCases > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {q.testCasesPassed}/{q.totalTestCases} tests
                            </div>
                          )}
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
                      ) : currentQuestion.pointsEarned && currentQuestion.pointsEarned > 0 ? (
                        <Badge variant="default" className="bg-orange-500">
                          Partial Credit
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {currentQuestion.pointsEarned?.toFixed(2) || 0}/{currentQuestion.maxPoints} points
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
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-700 text-sm uppercase bg-white px-2 py-1 rounded border">
                                    {option.id})
                                  </span>
                                  <span className="text-base">{option.text}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                      Student's Answer
                                    </Badge>
                                  )}
                                  {isCorrect && (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      ✓ Correct
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {!currentQuestion.userAnswer && (
                          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                            ⚠️ No answer provided by student
                          </p>
                        )}
                      </div>
                    )}

                    {currentQuestion.questionType === 'coding' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-medium">Language:</span>
                            <Badge variant="outline">{currentQuestion.selectedLanguage}</Badge>
                          </div>
                          {currentQuestion.totalTestCases !== undefined && currentQuestion.totalTestCases > 0 && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Test Cases:</span>
                                <Badge 
                                  variant={currentQuestion.testCasesPassed === currentQuestion.totalTestCases ? "default" : "secondary"}
                                  className={currentQuestion.testCasesPassed === currentQuestion.totalTestCases ? "bg-green-600" : "bg-orange-600 text-white"}
                                >
                                  {currentQuestion.testCasesPassed}/{currentQuestion.totalTestCases} Passed
                                </Badge>
                              </div>
                              {currentQuestion.testCaseResults && currentQuestion.testCaseResults.length > 0 && (
                                (() => {
                                  const totalWeightedPoints = currentQuestion.testCaseResults.reduce(
                                    (sum, tc) => sum + (tc.pointsEarned || 0), 
                                    0
                                  )
                                  const totalPossibleWeightedPoints = currentQuestion.testCaseResults.reduce(
                                    (sum, tc) => sum + (tc.weight || 0), 
                                    0
                                  )
                                  return totalPossibleWeightedPoints > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Test Case Points:</span>
                                      <Badge variant="outline" className="text-xs">
                                        {totalWeightedPoints.toFixed(1)}/{totalPossibleWeightedPoints.toFixed(1)}
                                      </Badge>
                                    </div>
                                  ) : null
                                })()
                              )}
                            </>
                          )}
                        </div>
                        
                        {currentQuestion.userCode ? (
                          <>
                            <Card className="bg-gray-900 text-gray-100">
                              <CardContent className="p-4">
                                <pre className="text-sm font-mono overflow-x-auto">
                                  <code>{currentQuestion.userCode}</code>
                                </pre>
                              </CardContent>
                            </Card>
                            
                            {/* Test Case Results */}
                            {currentQuestion.testCaseResults && currentQuestion.testCaseResults.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-sm text-gray-700">Test Case Results:</h5>
                                {currentQuestion.testCaseResults.map((testCase, index) => (
                                  <Card 
                                    key={index}
                                    className={`border-2 ${
                                      testCase.passed 
                                        ? 'border-green-300 bg-green-50' 
                                        : 'border-red-300 bg-red-50'
                                    }`}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">
                                            Test Case #{index + 1}
                                          </span>
                                          {testCase.weight !== undefined && testCase.weight > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                              {testCase.pointsEarned || 0}/{testCase.weight} pts
                                            </Badge>
                                          )}
                                          {testCase.isHidden && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              Hidden
                                            </Badge>
                                          )}
                                        </div>
                                        {testCase.passed ? (
                                          <Badge variant="default" className="bg-green-600 text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Passed
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive" className="text-xs">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Failed
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {!testCase.isHidden && (
                                        <div className="space-y-2 text-xs">
                                          {testCase.input && (
                                            <div>
                                              <span className="font-medium text-gray-700">Input:</span>
                                              <pre className="mt-1 p-2 bg-white rounded border text-gray-800 overflow-x-auto">
                                                {testCase.input}
                                              </pre>
                                            </div>
                                          )}
                                          {testCase.expectedOutput && (
                                            <div>
                                              <span className="font-medium text-gray-700">Expected:</span>
                                              <pre className="mt-1 p-2 bg-white rounded border text-gray-800 overflow-x-auto">
                                                {testCase.expectedOutput}
                                              </pre>
                                            </div>
                                          )}
                                          {testCase.actualOutput && (
                                            <div>
                                              <span className="font-medium text-gray-700">Actual:</span>
                                              <pre className={`mt-1 p-2 rounded border overflow-x-auto ${
                                                testCase.passed ? 'bg-white text-gray-800' : 'bg-red-100 text-red-900'
                                              }`}>
                                                {testCase.actualOutput}
                                              </pre>
                                            </div>
                                          )}
                                          {testCase.error && (
                                            <div>
                                              <span className="font-medium text-red-700">Error:</span>
                                              <pre className="mt-1 p-2 bg-red-100 rounded border border-red-300 text-red-900 overflow-x-auto">
                                                {testCase.error}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                            ⚠️ No code submitted
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
