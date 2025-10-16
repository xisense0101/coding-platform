
"use client"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { CodingQuestionInterface } from '@/components/coding'
import StudentAuthModal, { StudentAuthData } from '@/components/exam/StudentAuthModal'

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// UI
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Play, Send, RotateCcw, Settings, Maximize2, Menu, X, Check, Info, Timer, BookOpen, Minus, Plus, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// Supabase and Auth
import createClient from "@/lib/database/client"
import { useAuth } from "@/lib/auth/AuthContext"
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database/types"

// -----------------------------------------------------------------------------
// Local UI types built from API shape
// -----------------------------------------------------------------------------

type ApiExam = {
  id: string
  title: string
  description?: string
  slug: string
  instructions?: string
  start_time: string
  end_time: string
  duration_minutes: number
  total_marks: number
  sections: Array<{
    id: string
    title: string
    description?: string
    order_index: number
    time_limit?: number | null
    questions: Array<{
      id: string
      points: number
      order_index: number
      is_required: boolean
      question: {
        id: string
        title: string
        description?: string
        type: "mcq" | "coding" | string
        points: number
        difficulty?: string
        mcq_question?: {
          question_text: string
          options: Array<{ id: string; text: string; isCorrect: boolean }>
          correct_answers: string[]
          explanation?: string
        }
        coding_question?: {
          problem_statement: string
          boilerplate_code: Record<string, string> | null
          test_cases: any
          allowed_languages: string[]
          time_limit?: number
          memory_limit?: number
          head?: Record<string, string>
          body_template?: Record<string, string>
          tail?: Record<string, string>
        }
      }
    }>
  }>
}

type UIQuestion = {
  id: string
  sectionId: string
  sectionTitle: string
  indexInSection: number
  type: "mcq" | "coding"
  title: string
  prompt: string
  options?: { id: string; text: string; isCorrect?: boolean }[]
  codeTemplate?: string
  allowedLanguages?: string[]
  head?: Record<string, string>
  bodyTemplate?: Record<string, string>
  tail?: Record<string, string>
  testCases?: Array<{
    input: string
    expected_output: string
    is_hidden: boolean
  }>
}

type AnswerState = {
  userAnswer?: string | string[]
  userCode?: string
  status: "unanswered" | "answered" | "submitted"
}

type DialogQuestionSummary = { id: string; status: "unanswered" | "answered" | "submitted" }

// Keep panel components simple with local question models
interface LocalQuestionBase {
  id: string
  section: string
  questionNumber: number
  type: "mcq" | "coding"
  title: string
  question: string
  status: "unanswered" | "answered" | "submitted"
}
interface LocalMcqQuestion extends LocalQuestionBase {
  type: "mcq"
  options?: { id: string; text: string; isCorrect?: boolean }[]
  userAnswer?: string
}
interface LocalCodingQuestion extends LocalQuestionBase {
  type: "coding"
  codeTemplate?: string
  language?: string
  userCode?: string
  head?: string
  tail?: string
}

const FONT_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"]

export default function Component() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()

  // Layout state
  const [leftPanelWidth, setLeftPanelWidth] = useState(45)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35)
  const [isResizing, setIsResizing] = useState(false)
  const [isResizingVertical, setIsResizingVertical] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentFontSizeIndex, setCurrentFontSizeIndex] = useState(2)

  // Exam runtime state
  const [exam, setExam] = useState<ApiExam | null>(null)
  const [uiSections, setUiSections] = useState<{ id: string; title: string; questions: UIQuestion[] }[]>([])
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [sectionSubmitted, setSectionSubmitted] = useState<Record<string, boolean>>({})
  const [unlockedSections, setUnlockedSections] = useState<Record<string, boolean>>({})
  const [submitDialogType, setSubmitDialogType] = useState<"section" | "final">("section")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [isExamFinished, setIsExamFinished] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showStudentAuth, setShowStudentAuth] = useState(true)
  const [studentAuthData, setStudentAuthData] = useState<StudentAuthData | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript")

  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  const sb: any = useMemo(() => createClient() as any, [])
  const { user, isLoading: authLoading } = useAuth()

  // Fetch exam by slug
  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoadingError(null)
        const res = await fetch(`/api/exams/slug/${params.slug}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('Exam fetch error:', err)
          const errorMessage = err?.error || `Failed to load exam (${res.status})`
          const detailsMessage = err?.details ? ` - ${err.details}` : ''
          throw new Error(errorMessage + detailsMessage)
        }
        const json = await res.json()
        console.log('Exam loaded successfully:', json.exam?.title)
        const ex: ApiExam = json.exam
        if (!mounted) return
        setExam(ex)

        const built = (ex.sections || []).map((s) => ({
          id: s.id,
          title: s.title,
          questions: (s.questions || []).map((q, idx) => {
            const base = q.question
            const langKey = selectedLanguage.toLowerCase()
            return {
              id: base.id,
              sectionId: s.id,
              sectionTitle: s.title,
              indexInSection: idx + 1,
              type: (base.type === "coding" ? "coding" : "mcq") as UIQuestion["type"],
              title: base.title,
              prompt:
                base.type === "coding"
                  ? base.coding_question?.problem_statement || base.description || ""
                  : base.mcq_question?.question_text || base.description || "",
              options: base.mcq_question?.options,
              codeTemplate: (base.coding_question?.body_template || base.coding_question?.boilerplate_code || ({} as any))[langKey] || "",
              allowedLanguages: base.coding_question?.allowed_languages || ["c", "cpp", "java", "python", "javascript"],
              head: base.coding_question?.head || {},
              bodyTemplate: base.coding_question?.body_template || base.coding_question?.boilerplate_code || {},
              tail: base.coding_question?.tail || {},
              testCases: base.coding_question?.test_cases || [],
            } as UIQuestion
          }),
        }))
        setUiSections(built)
        // Unlock first section only
        const unlock: Record<string, boolean> = {}
        built.forEach((s, i) => (unlock[s.id] = i === 0))
        setUnlockedSections(unlock)
        setSectionSubmitted({})
        setCurrentSectionIdx(0)
        setCurrentQuestionIdx(0)

        setTimeLeft((ex.duration_minutes || 0) * 60)
      } catch (e: any) {
        setLoadingError(e?.message || "Failed to load exam")
      }
    }
    run()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug])

  // Timer
  useEffect(() => {
    if (!isExamStarted || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [isExamStarted, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && isExamStarted && !isExamFinished) {
      handleFinalSubmitClick()
    }
  }, [timeLeft, isExamStarted, isExamFinished])

  const currentSection = uiSections[currentSectionIdx]
  const currentQ = currentSection?.questions[currentQuestionIdx]

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle student authentication
  const handleStudentAuth = (data: StudentAuthData) => {
    setStudentAuthData(data)
    setShowStudentAuth(false)
    console.log('Student authenticated:', data)
  }

  // Start exam -> ensure submission row exists and preload answers
  const startExam = async () => {
    try {
      console.log('🚀 Start Exam clicked')
      if (!exam) {
        console.error('❌ No exam data available')
        throw new Error('Exam data not available')
      }
      console.log('✅ Exam data exists:', exam.title)
      
      if (!studentAuthData || !studentAuthData.userId) {
        console.error('❌ No authenticated student data')
        throw new Error('Student authentication data not available')
      }
      
      const userId = studentAuthData.userId
      console.log('👤 User ID from auth:', userId)

      console.log('🔍 Calling start exam API...')
      
      // Call API to create or get existing submission
      const response = await fetch(`/api/exams/${exam.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          studentName: studentAuthData.studentName,
          studentEmail: studentAuthData.studentEmail,
          rollNumber: studentAuthData.rollNumber,
          studentSection: studentAuthData.studentSection
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Start exam API error:', result)
        if (result.alreadySubmitted) {
          alert('You have already submitted this exam. You cannot take it again.')
        }
        throw new Error(result.error || 'Failed to start exam')
      }

      console.log('✅ Start exam API response:', result)

      // Set submission ID
      setSubmissionId(result.submission.id)

      // If existing submission, restore answers
      if (!result.isNew && result.submission.answers) {
        console.log('📋 Restoring previous answers...')
        const pre = result.submission.answers || {}
        const ans: Record<string, AnswerState> = {}
        Object.keys(pre).forEach((qid) => {
          ans[qid] = { ...pre[qid], status: pre[qid]?.status || "answered" }
        })
        setAnswers(ans)
        console.log('✅ Restored answers for', Object.keys(ans).length, 'questions')
      } else {
        console.log('📝 Starting fresh exam (no previous answers)')
      }

      console.log('🎯 Setting exam as started...')
      setIsExamStarted(true)
      setShowInstructions(false)
      console.log('✅ Exam started successfully!')
    } catch (error) {
      console.error('💥 Error starting exam:', error)
      throw error // Re-throw to be caught by ExamInstructions
    }
  }

  const persistAnswers = async (next: Record<string, AnswerState>) => {
    if (!submissionId) return
    const payload: Record<string, any> = {}
    Object.keys(next).forEach((qid) => {
      const a = next[qid]
      payload[qid] = { userAnswer: a.userAnswer, userCode: a.userCode, status: a.status }
    })
    const updatePayload: TablesUpdate<'exam_submissions'> = {
      answers: payload as any,
      updated_at: new Date().toISOString(),
    }
    await sb
      .from("exam_submissions")
      .update(updatePayload as any)
      .eq("id", submissionId)
  }

  const updateAnswer = (qid: string, patch: Partial<AnswerState>) => {
    setAnswers((prev) => {
      const base: AnswerState = prev[qid] || { status: 'unanswered' }
      const merged: AnswerState = { ...base, ...patch }
      const next = { ...prev, [qid]: merged }
      void persistAnswers(next)
      return next
    })
  }

  // Navigation
  const navigateToQuestion = (sectionIdx: number, questionIdx: number) => {
    const s = uiSections[sectionIdx]
    if (!s) return
    if (!unlockedSections[s.id]) return
    setCurrentSectionIdx(sectionIdx)
    setCurrentQuestionIdx(questionIdx)
  }

  // Submit single question (just marks answered and moves next)
  const handleQuestionSubmit = (question: UIQuestion) => {
    updateAnswer(question.id, { status: "answered" })
    const nextIdx = currentQuestionIdx + 1
    if (currentSection && nextIdx < currentSection.questions.length) {
      setCurrentQuestionIdx(nextIdx)
    }
  }

  const clearSelection = () => {
    if (!currentQ) return
    updateAnswer(currentQ.id, { userAnswer: undefined, status: "unanswered" })
  }

  const increaseFontSize = () => setCurrentFontSizeIndex((p) => Math.min(p + 1, FONT_SIZES.length - 1))
  const decreaseFontSize = () => setCurrentFontSizeIndex((p) => Math.max(p - 1, 0))
  const currentFontSizeClass = FONT_SIZES[currentFontSizeIndex]

  // Section and final submit dialogs
  const handleSectionSubmitClick = () => {
    setSubmitDialogType("section")
    setShowSubmitDialog(true)
  }
  const handleFinalSubmitClick = () => {
    setSubmitDialogType("final")
    setShowSubmitDialog(true)
  }

  const computeScore = () => {
    if (!exam) return { total: 0, max: 0 }
    let total = 0
    let max = 0
    uiSections.forEach((s) => {
      s.questions.forEach((q) => {
        const apiQ = exam.sections.find((ss) => ss.id === s.id)?.questions.find((qq) => qq.question.id === q.id)
        if (!apiQ) return
        const pts = apiQ.points || 1
        if (q.type === "mcq") {
          max += pts
          const ans = answers[q.id]?.userAnswer as string | undefined
          const correct = apiQ.question.mcq_question?.correct_answers || []
          if (ans != null && correct.includes(ans)) total += pts
        }
      })
    })
    return { total, max }
  }

  const confirmSubmit = async (isVerified: boolean) => {
    if (!isVerified) return
    if (!exam) return

    if (submitDialogType === "section") {
      const sec = currentSection
      if (!sec) return
      setSectionSubmitted((prev) => ({ ...prev, [sec.id]: true }))
      setAnswers((prev) => {
        const next = { ...prev }
        sec.questions.forEach((q) => {
          const prior = next[q.id] || { status: "unanswered" }
          next[q.id] = { ...prior, status: "submitted" }
        })
        void persistAnswers(next)
        return next
      })
      // Unlock next section
      if (uiSections[currentSectionIdx + 1]) {
        const nextSec = uiSections[currentSectionIdx + 1]
        setUnlockedSections((prev) => ({ ...prev, [nextSec.id]: true }))
        setCurrentSectionIdx(currentSectionIdx + 1)
        setCurrentQuestionIdx(0)
      }
      setShowSubmitDialog(false)
    } else {
      // Final submit
      const { total, max } = computeScore()
      if (submissionId) {
        const finalUpdate: TablesUpdate<'exam_submissions'> = {
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          total_score: total,
          max_score: max,
          submission_status: 'submitted',
        }
        await sb
          .from("exam_submissions")
          .update(finalUpdate as any)
          .eq("id", submissionId)
      }
      setIsExamFinished(true)
      setShowSubmitDialog(false)
    }
  }

  // Resizers
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
        const rect = containerRef.current.getBoundingClientRect()
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100
        if (newWidth >= 25 && newWidth <= 75) setLeftPanelWidth(newWidth)
      }
      if (isResizingVertical && rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect()
        const newHeight = ((rect.bottom - e.clientY) / rect.height) * 100
        if (newHeight >= 20 && newHeight <= 60) setBottomPanelHeight(newHeight)
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

  const getSectionSubmitButtonText = () => {
    const sec = currentSection
    if (!sec) return "Submit Section"
    if (sectionSubmitted[sec.id]) return "Submitted"
    return `Submit Section ${sec.title}`
  }
  const isSectionSubmitButtonDisabled = () => {
    const sec = currentSection
    if (!sec) return true
    return !!sectionSubmitted[sec.id]
  }

  if (isExamFinished) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center text-2xl font-bold text-sky-800">
        Exam Submitted Successfully!
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center text-sky-800">
        <Card className="border-sky-200"><CardContent className="p-6">{loadingError}</CardContent></Card>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center text-sky-800">
        Loading exam...
      </div>
    )
  }

  if (showStudentAuth && exam) {
    return (
      <StudentAuthModal
        examTitle={exam.title}
        examId={exam.id}
        onAuthenticate={handleStudentAuth}
      />
    )
  }

  if (showInstructions) {
    return <ExamInstructions onStart={startExam} />
  }

  const dialogQuestions: DialogQuestionSummary[] = submitDialogType === "section"
    ? (currentSection?.questions || []).map((q) => ({ id: q.id, status: answers[q.id]?.status || "unanswered" }))
    : uiSections.flatMap((s) => s.questions.map((q) => ({ id: q.id, status: answers[q.id]?.status || "unanswered" })))

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-sky-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sky-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hover:bg-sky-100" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-sky-100 text-sky-700"
              onClick={() => {
                if (!currentSection) return
                if (currentQuestionIdx > 0) setCurrentQuestionIdx(currentQuestionIdx - 1)
                else if (currentSectionIdx > 0) {
                  const prevSectionIdx = currentSectionIdx - 1
                  if (unlockedSections[uiSections[prevSectionIdx].id]) {
                    setCurrentSectionIdx(prevSectionIdx)
                    setCurrentQuestionIdx(uiSections[prevSectionIdx].questions.length - 1)
                  }
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
                if (!currentSection) return
                if (currentQuestionIdx < currentSection.questions.length - 1) setCurrentQuestionIdx(currentQuestionIdx + 1)
                else if (uiSections[currentSectionIdx + 1] && unlockedSections[uiSections[currentSectionIdx + 1].id]) {
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
        {/* Central Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSectionSubmitClick}
            disabled={isSectionSubmitButtonDisabled()}
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold px-6 py-2"
          >
            {getSectionSubmitButtonText()}
          </Button>
          <Button
            onClick={handleFinalSubmitClick}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold px-6 py-2"
          >
            Final Submit Exam
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-sky-100 px-3 py-1 rounded-lg">
            <Timer className="h-4 w-4 text-sky-600" />
            <span className={`font-mono font-semibold ${timeLeft < 600 ? "text-red-600" : "text-sky-700"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600" onClick={decreaseFontSize} disabled={currentFontSizeIndex === 0}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-sky-100 text-sky-600" onClick={increaseFontSize} disabled={currentFontSizeIndex === FONT_SIZES.length - 1}>
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
        {/* Sidebar - Sections/Questions */}
        <div className={`${isSidebarOpen ? "w-28" : "w-0"} transition-all duration-300 border-r border-sky-200 bg-white shadow-sm overflow-hidden`}>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-4">
              {uiSections.map((s, sIdx) => {
                const locked = !unlockedSections[s.id]
                const submitted = !!sectionSubmitted[s.id]
                return (
                  <div key={s.id} className="mb-2 relative">
                    <div className="text-sm font-semibold text-sky-800 mb-2 px-2 py-1 bg-blue-100 rounded-lg inline-block">
                      {s.title}
                    </div>
                    {(locked || submitted) && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="bg-sky-100 p-3 rounded-full flex items-center justify-center shadow-md">
                          <Lock className="h-6 w-6 text-sky-600" />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {s.questions.map((q, qIdx) => {
                        const st = answers[q.id]?.status || "unanswered"
                        const isActive = currentSectionIdx === sIdx && currentQuestionIdx === qIdx
                        const color = st === "submitted" ? "bg-green-600 text-white" : st === "answered" ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                        return (
                          <button
                            key={q.id}
                            onClick={() => navigateToQuestion(sIdx, qIdx)}
                            disabled={locked}
                            className={cn("w-8 h-8 rounded-full text-xs font-semibold grid place-items-center border", color, isActive && "ring-2 ring-offset-1 ring-sky-500", locked && "opacity-60 cursor-not-allowed")}
                            title={`${s.title} • Q${q.indexInSection}`}
                          >
                            {q.indexInSection}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
          {currentQ?.type === "mcq" ? (
            <>
              {/* MCQ: Left Panel - Question */}
              <div className="overflow-auto border-r border-sky-200 bg-white shadow-sm" style={{ width: `${leftPanelWidth}%` }}>
                <MCQQuestionPanel
                  question={{
                    id: currentQ.id,
                    section: currentSection?.title || "",
                    questionNumber: currentQ.indexInSection,
                    type: "mcq",
                    title: currentQ.title,
                    question: currentQ.prompt,
                    options: currentQ.options,
                    status: (answers[currentQ.id]?.status as any) || "unanswered",
                  }}
                  onReportProblem={reportProblem}
                  fontSizeClass={currentFontSizeClass}
                />
              </div>

              {/* Horizontal Resizer */}
              <div ref={resizerRef} className="w-1 bg-sky-200 hover:bg-sky-400 cursor-col-resize transition-colors relative group" onMouseDown={handleMouseDown}>
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-sky-300/30" />
              </div>

              {/* MCQ: Right Panel - Options */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white" style={{ width: `${100 - leftPanelWidth}%` }}>
                <MCQAnswerPanel
                  question={{
                    id: currentQ.id,
                    section: currentSection?.title || "",
                    questionNumber: currentQ.indexInSection,
                    type: "mcq",
                    title: currentQ.title,
                    question: currentQ.prompt,
                    options: currentQ.options,
                    status: (answers[currentQ.id]?.status as any) || "unanswered",
                    userAnswer: (answers[currentQ.id]?.userAnswer as string) || "",
                  }}
                  onAnswerChange={(answer) => updateAnswer(currentQ.id, { userAnswer: answer, status: "answered" })}
                  onClearSelection={clearSelection}
                  fontSizeClass={currentFontSizeClass}
                  isSectionSubmitted={!!sectionSubmitted[currentSection?.id || ""]}
                  onQuestionSubmit={() => handleQuestionSubmit(currentQ)}
                />
              </div>
            </>
          ) : (
            <>
              {/* Coding: Left Panel - Problem */}
              <div className="overflow-auto border-r border-sky-200 bg-white shadow-sm" style={{ width: `${leftPanelWidth}%` }}>
                {currentQ && (
                  <CodingQuestionPanel
                    question={{
                      id: currentQ.id,
                      section: currentSection?.title || "",
                      questionNumber: currentQ.indexInSection,
                      type: "coding",
                      title: currentQ.title,
                      question: currentQ.prompt,
                      status: (answers[currentQ.id]?.status as any) || "unanswered",
                    }}
                    onReportProblem={reportProblem}
                    fontSizeClass={currentFontSizeClass}
                  />
                )}
              </div>

              {/* Horizontal Resizer */}
              <div ref={resizerRef} className="w-1 bg-sky-200 hover:bg-sky-400 cursor-col-resize transition-colors relative group" onMouseDown={handleMouseDown}>
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-sky-300/30" />
              </div>

              {/* Coding: Right Panel - Code Editor */}
              <div ref={rightPanelRef} className="flex-1 flex flex-col overflow-hidden bg-white" style={{ width: `${100 - leftPanelWidth}%` }}>
                {currentQ && (
                  <CodingQuestionInterface
                    questionId={currentQ.id}
                    userId={studentAuthData?.userId || user?.id || ""}
                    coding={{
                      problem_statement: currentQ.prompt,
                      boilerplate_code: currentQ.bodyTemplate || {},
                      test_cases: currentQ.testCases || [],
                      allowed_languages: currentQ.allowedLanguages || ["c", "cpp", "java", "python", "javascript"],
                      head: currentQ.head || {},
                      body_template: currentQ.bodyTemplate || {},
                      tail: currentQ.tail || {}
                    }}
                    onRun={async (code, language, customInput) => {
                      await runCode()
                      return { output: "Test execution complete" }
                    }}
                    onSubmit={async (code, language) => {
                      updateAnswer(currentQ.id, { userCode: code, status: "answered" })
                      handleQuestionSubmit(currentQ)
                    }}
                    bottomPanelHeight={bottomPanelHeight}
                    onVerticalResize={handleVerticalMouseDown}
                    fontSizeClass={currentFontSizeClass}
                    isLocked={!!sectionSubmitted[currentSection?.id || ""]}
                    showSubmitButton={true}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showSubmitDialog && (
        <SubmitDialog
          questions={dialogQuestions}
          onConfirm={confirmSubmit}
          onCancel={() => setShowSubmitDialog(false)}
          title={submitDialogType === "section" ? `Submit Section ${currentSection?.title}?` : "Submit Exam?"}
          message={
            submitDialogType === "section"
              ? `Are you sure you want to submit Section ${currentSection?.title}? Once submitted, you cannot change your answers for this section.`
              : "Are you sure you want to submit your exam?"
          }
          requireVerification={true}
        />
      )}
    </div>
  )

  function reportProblem() {
    alert("Report problem functionality would be implemented here")
  }
  async function runCode() {
    // Placeholder for code execution - actual execution handled by CodingQuestionInterface
    await new Promise((r) => setTimeout(r, 500))
  }
}

function MCQQuestionPanel({ question, onReportProblem, fontSizeClass }: { question: LocalMcqQuestion; onReportProblem: () => void; fontSizeClass: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Removed Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">{question.title}</h1>
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-sm">
              <Check className="h-3 w-3 mr-1" />
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onReportProblem} className="hover:bg-sky-100 text-sky-600 p-2" title="Report a problem">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-sky-200 shadow-sm">
          <CardContent className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
            <RichTextPreview content={question.question} className={cn("text-lg text-black leading-relaxed", fontSizeClass)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MCQAnswerPanel({ question, onAnswerChange, onClearSelection, fontSizeClass, isSectionSubmitted, onQuestionSubmit }: { question: LocalMcqQuestion; onAnswerChange: (answer: string) => void; onClearSelection: () => void; fontSizeClass: string; isSectionSubmitted: boolean; onQuestionSubmit: (question: LocalMcqQuestion) => void }) {
  const isQuestionLocked = isSectionSubmitted
  return (
    <>
      <div className="p-6 border-b border-sky-200 bg-gradient-to-r from-sky-50 to-white" />

      <div className="flex-1 p-6 overflow-auto">
        <RadioGroup value={question.userAnswer || ""} onValueChange={onAnswerChange} className="space-y-4" disabled={isQuestionLocked}>
          {question.options?.map((option) => (
            <div key={option.id} className={`flex items-center space-x-3 p-4 rounded-lg border-2 border-sky-200 transition-all duration-200 cursor-pointer ${isQuestionLocked ? "opacity-70 cursor-not-allowed" : "hover:bg-sky-50 hover:border-sky-300"}`}>
              <RadioGroupItem value={option.id} id={option.id} className="text-sky-600" disabled={isQuestionLocked} />
              <Label htmlFor={option.id} className={cn("flex-1 cursor-pointer font-mono text-base text-black", fontSizeClass)}>
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="p-6 border-t border-sky-200 bg-gradient-to-r from-sky-50 to-white">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClearSelection} className="text-sky-600 hover:text-sky-700 hover:bg-sky-100" disabled={!question.userAnswer || isQuestionLocked}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear selection
          </Button>
          <Button onClick={() => onQuestionSubmit(question)} disabled={!question.userAnswer || isQuestionLocked} className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold">
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
        </div>
      </div>
    </>
  )
}

function CodingQuestionPanel({ question, onReportProblem, fontSizeClass }: { question: LocalCodingQuestion; onReportProblem: () => void; fontSizeClass: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Removed Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">{question.title}</h1>
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-sm">
              <Check className="h-3 w-3 mr-1" />
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onReportProblem} className="hover:bg-sky-100 text-sky-600 p-2" title="Report a problem">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-sky-200 shadow-sm">
          <CardContent className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
            <RichTextPreview content={question.question} className={cn("text-lg text-black leading-relaxed", fontSizeClass)} />
          </CardContent>
        </Card>
        {/* Stubbed meta/help sections can be enhanced with real data later */}
        <div className={cn("space-y-3 text-black", fontSizeClass)}>
          <div>
            <span className="font-semibold text-black">Expected Time Complexity:</span> —
          </div>
          <div>
            <span className="font-semibold text-black">Input Format:</span>
          </div>
        </div>

        <Card className="border-sky-200 shadow-sm">
          <CardContent className="p-4 bg-gradient-to-r from-sky-50 to-blue-50">
            <div className={cn("text-sm space-y-1 text-black", fontSizeClass)}>
              <div>Provide input as required by the problem statement.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ExamInstructions({ onStart }: { onStart: () => Promise<void> }) {
  const [isStarting, setIsStarting] = useState(false)
  
  const handleStart = async () => {
    try {
      console.log('📋 Instructions: Start button clicked')
      setIsStarting(true)
      await onStart()
      console.log('📋 Instructions: onStart completed successfully')
      // Don't reset isStarting here - the component will unmount when exam starts
    } catch (error) {
      console.error('❌ Instructions: Error during start:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to start exam: ${errorMessage}`)
      setIsStarting(false)
    }
  }
  
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white p-4">
      <Card className="max-w-2xl w-full border-sky-200 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-sky-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-sky-900 mb-2">Programming Exam</h1>
            <p className="text-sky-700">Please read the instructions carefully before starting</p>
          </div>

          <div className="space-y-6 text-black">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-sky-800">Exam Structure</h3>
              <ul className="space-y-2 text-sm">
                <li>• Use the sidebar to navigate between sections and questions</li>
                <li>• Your answers are automatically saved</li>
                <li>• For coding questions, select your preferred programming language</li>
                <li>• Submit sections when done, then final submit</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button 
              onClick={handleStart} 
              disabled={isStarting}
              size="lg" 
              className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold px-8 py-3 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" />
                  Starting...
                </>
              ) : (
                'Start Exam'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SubmitDialog({ questions, onConfirm, onCancel, title, message, requireVerification = false }: { questions: DialogQuestionSummary[]; onConfirm: (isVerified: boolean) => void; onCancel: () => void; title: string; message: string; requireVerification?: boolean }) {
  const answeredCount = questions.filter((q) => q.status === "answered" || q.status === "submitted").length
  const totalQuestions = questions.length

  const [verificationCode, setVerificationCode] = useState<string>("")
  const [enteredCode, setEnteredCode] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (requireVerification) {
      const code = Math.floor(1000 + Math.random() * 9000).toString()
      setVerificationCode(code)
      setEnteredCode("")
      setError(null)
    }
  }, [requireVerification])

  const handleConfirmClick = () => {
    if (requireVerification) {
      if (enteredCode === verificationCode) onConfirm(true)
      else setError("Incorrect code. Please try again.")
    } else {
      onConfirm(true)
    }
  }

  const isConfirmButtonDisabled = requireVerification && enteredCode !== verificationCode

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white p-4">
      <Card className="max-w-md w-full border-sky-200 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-black mb-2">{title}</h2>
            <p className="text-slate-600">{message}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span>Total Questions:</span><span className="font-semibold">{totalQuestions}</span></div>
            <div className="flex justify-between text-sm"><span>Answered:</span><span className="font-semibold text-green-600">{answeredCount}</span></div>
            <div className="flex justify-between text-sm"><span>Unanswered:</span><span className="font-semibold text-red-600">{totalQuestions - answeredCount}</span></div>
          </div>

          {requireVerification && (
            <div className="space-y-3 mb-6">
              <p className="text-center text-sm text-black">
                To confirm, please enter the following code:{" "}
                <span className="font-bold text-lg text-sky-700">{verificationCode}</span>
              </p>
              <Input
                type="text"
                placeholder="Enter code"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value)
                  setError(null)
                }}
                className={`w-full text-center text-lg font-mono ${error ? "border-red-500" : "border-sky-200"}`}
                maxLength={4}
              />
              {error && <p className="text-red-500 text-sm text-center mt-1">{error}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">Go Back</Button>
            <Button onClick={handleConfirmClick} disabled={isConfirmButtonDisabled} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
              Confirm Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
