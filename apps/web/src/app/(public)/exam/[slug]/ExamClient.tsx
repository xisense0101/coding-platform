
"use client"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { CodingQuestionInterface } from '@/components/coding'
import StudentAuthModal, { StudentAuthData } from '@/components/exam/StudentAuthModal'
import { MonitoringStatus } from '@/components/exam/MonitoringStatus'
import { ViolationAlert, ViolationAlertData } from '@/components/exam/ViolationAlert'

import type React from "react"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
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
import { ChevronLeft, ChevronRight, Flag, Play, Send, RotateCcw, Settings, Maximize2, Menu, X, Check, Info, Timer, BookOpen, Minus, Plus, Lock, ChevronDown, ChevronUp, AlertTriangle, Star, Shield, RefreshCw, WifiOff, Wifi, Clock } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { v4 as uuidv4 } from 'uuid'

// Supabase and Auth
import createClient from "@/lib/database/client"
import { useAuth } from "@/lib/auth/AuthContext"
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database/types"

import { logger } from '@/lib/utils/logger'
import { useElectronMonitoring } from '@/hooks/useElectronMonitoring'
import { useBrowserMonitoring } from '@/hooks/useBrowserMonitoring'

import { WaitingRoom } from '@/components/exam/WaitingRoom'
import { ExamInstructions } from '@/components/exam/ExamInstructions'
import { SubmitDialog } from '@/components/exam/SubmitDialog'
import { MCQQuestionPanel } from '@/components/exam/MCQQuestionPanel'
import { MCQAnswerPanel } from '@/components/exam/MCQAnswerPanel'
import { CodingQuestionPanel } from '@/components/exam/CodingQuestionPanel'
import { LocalMcqQuestion, LocalCodingQuestion, DialogQuestionSummary, LocalQuestionBase } from '@/components/exam/types'

import { SectionReview } from '@/components/exam/SectionReview'
import { ExamReview } from '@/components/exam/ExamReview'

// -----------------------------------------------------------------------------
// Local UI types built from API shape
// -----------------------------------------------------------------------------

type ApiExam = {
  id: string
  title: string
  description?: string
  slug: string
  exam_mode?: "browser" | "app"
  instructions?: string
  start_time: string
  end_time: string
  duration_minutes: number
  total_marks: number
  strict_level?: number
  max_tab_switches?: number
  max_screen_lock_duration?: number
  auto_terminate_on_violations?: boolean
  track_tab_switches?: boolean
  track_screen_locks?: boolean
  detect_vm?: boolean
  require_single_monitor?: boolean
  allow_zoom_changes?: boolean
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
    weight?: number
  }>
}

type AnswerState = {
  userAnswer?: string | string[]
  userCode?: string
  language?: string
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
  testCasesPassed?: number
  totalTestCases?: number
  totalPointsEarned?: number
  totalPossiblePoints?: number
  isMarkedForReview?: boolean
  status: "unanswered" | "answered" | "submitted"
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
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
  const [currentViolation, setCurrentViolation] = useState<ViolationAlertData | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [feedbackText, setFeedbackText] = useState<string>("")
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const lastViolationIdRef = useRef<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [networkStrength, setNetworkStrength] = useState<number>(4) // 0-4 scale
  const [networkSpeed, setNetworkSpeed] = useState<number | null>(null)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // New Flow States
  const [isReviewingSection, setIsReviewingSection] = useState(false)
  const [isExamReview, setIsExamReview] = useState(false)

  // Waiting Room State
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [showAppRequired, setShowAppRequired] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  const sb: any = useMemo(() => createClient() as any, [])
  const { user, isLoading: authLoading } = useAuth()

  // Electron monitoring integration - Memoized callbacks to prevent re-initialization
  const handleViolationCallback = useCallback((violation: any) => {
    logger.warn('Violation detected:', violation)

    // Prevent duplicate violation alerts
    const violationId = `${violation.type}-${violation.violationCount}`
    if (lastViolationIdRef.current === violationId) {
      logger.log('Skipping duplicate violation alert:', violationId)
      return
    }
    lastViolationIdRef.current = violationId

    // Show in-app violation alert instead of system alert
    const alertData: ViolationAlertData = {
      id: `violation-${Date.now()}`,
      message: violation.message,
      violationCount: violation.violationCount,
      shouldTerminate: violation.shouldTerminate,
      timestamp: Date.now()
    }

    setCurrentViolation(alertData)
  }, [])

  const handleMetricsUpdateCallback = useCallback((metrics: any) => {
    // Metrics updated - can trigger UI updates if needed
    logger.log('Monitoring metrics updated:', metrics)
  }, [])

  // Disable copy/paste/selection globally
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault()
    }

    // Prevent default behavior for copy, paste, cut, contextmenu
    document.addEventListener('copy', preventDefault)
    document.addEventListener('paste', preventDefault)
    document.addEventListener('cut', preventDefault)
    document.addEventListener('contextmenu', preventDefault)

    // Prevent text selection
    const preventSelection = (e: Event) => {
      // Allow selection in inputs and textareas and monaco editor for editing
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.monaco-editor')) {
        return
      }
      e.preventDefault()
    }

    document.addEventListener('selectstart', preventSelection)
    document.addEventListener('dragstart', preventDefault)

    // Add user-select: none to body via style
    const originalUserSelect = document.body.style.userSelect
    const originalWebkitUserSelect = document.body.style.webkitUserSelect

    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    // Inject a style tag to force user-select: none globally with !important
    const style = document.createElement('style')
    style.id = 'disable-selection-style'
    style.innerHTML = `
      *, *::before, *::after {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      /* Allow selection in editor and inputs to enable coding/typing, but copy/paste is blocked via events */
      .monaco-editor, .monaco-editor *, input, textarea {
        user-select: text !important;
        -webkit-user-select: text !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.removeEventListener('copy', preventDefault)
      document.removeEventListener('paste', preventDefault)
      document.removeEventListener('cut', preventDefault)
      document.removeEventListener('contextmenu', preventDefault)
      document.removeEventListener('selectstart', preventSelection)
      document.removeEventListener('dragstart', preventDefault)

      document.body.style.userSelect = originalUserSelect
      document.body.style.webkitUserSelect = originalWebkitUserSelect

      const styleEl = document.getElementById('disable-selection-style')
      if (styleEl) {
        styleEl.remove()
      }
    }
  }, [])

  // Network status monitoring
  useEffect(() => {
    let isMounted = true

    const updateNetworkStatus = () => {
      if (!isMounted) return
      const online = navigator.onLine

      if (!online) {
        setIsOnline(false)
        setNetworkStrength(0)
        setNetworkSpeed(0)
        logger.warn('❌ Network disconnected (navigator)')

        // Start connection loss timer (2 minutes = 120 seconds)
        if (!connectionLossTimerRef.current) {
          logger.warn('⏱️ Starting 2-minute connection loss timer')
          connectionLossTimerRef.current = setTimeout(() => {
            logger.error('💥 Connection lost for more than 2 minutes. Invalidating session.')
            setLoadingError('Connection lost for more than 2 minutes. Please log in again.')
            setIsExamStarted(false)
            clearLocalSession()
          }, 120000)
        }
      } else {
        setIsOnline(true)

        // Clear connection loss timer if back online
        if (connectionLossTimerRef.current) {
          logger.log('✅ Connection restored. Clearing timer.')
          clearTimeout(connectionLossTimerRef.current)
          connectionLossTimerRef.current = null
        }

        const connection = (navigator as any).connection
        if (connection) {
          const downlink = connection.downlink
          setNetworkSpeed(downlink)
          if (downlink < 1) setNetworkStrength(1)
          else if (downlink < 3) setNetworkStrength(2)
          else if (downlink < 5) setNetworkStrength(3)
          else setNetworkStrength(4)
        } else {
          setNetworkStrength(4)
          setNetworkSpeed(null)
        }
      }
    }

    const checkConnection = async () => {
      if (!isMounted) return
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1500)

        const res = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (res.ok) {
          setIsOnline(true)
          const connection = (navigator as any).connection
          if (connection) {
            const downlink = connection.downlink
            setNetworkSpeed(downlink)
            if (downlink < 1) setNetworkStrength(1)
            else if (downlink < 3) setNetworkStrength(2)
            else if (downlink < 5) setNetworkStrength(3)
            else setNetworkStrength(4)
          }
        } else {
          throw new Error('Health check failed')
        }
      } catch (e) {
        if (isMounted) {
          setIsOnline(false)
          setNetworkStrength(0)
          setNetworkSpeed(0)
        }
      }
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus)
    }

    // Initial check
    updateNetworkStatus()
    checkConnection()

    // Poll every 10 seconds
    const intervalId = setInterval(checkConnection, 5000)

    return () => {
      isMounted = false
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus)
      }
      clearInterval(intervalId)
    }
  }, [])

  const connectionLossTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Session ID
  useEffect(() => {
    if (typeof window === 'undefined') return

    let sid = sessionStorage.getItem('exam_session_id')
    if (!sid) {
      sid = uuidv4()
      sessionStorage.setItem('exam_session_id', sid)
    }
    setSessionId(sid)
  }, [])

  // Session Heartbeat
  useEffect(() => {
    if (!isExamStarted || isExamFinished || !sessionId || !studentAuthData || !exam) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      return
    }

    const sendHeartbeat = async () => {
      try {
        const res = await fetch(`/api/exams/${exam.id}/session/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: studentAuthData.userId,
            sessionId: sessionId
          })
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          if (data.code === 'CONCURRENT_SESSION') {
            logger.error('🚫 Session conflict detected in heartbeat')
            setLoadingError('Exam is already active on another device or browser tab')
            setIsExamStarted(false)
          }
        }
      } catch (error) {
        logger.warn('⚠️ Heartbeat failed:', error)
      }
    }

    // Initial heartbeat
    sendHeartbeat()

    // Interval every 20 seconds
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 20000)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    }
  }, [isExamStarted, isExamFinished, sessionId, studentAuthData, exam])

  // Release session on close
  const releaseSession = useCallback(async () => {
    if (!exam || !studentAuthData || !sessionId) return

    try {
      // Use navigator.sendBeacon for more reliable release on tab close
      const blob = new Blob([JSON.stringify({
        userId: studentAuthData.userId,
        sessionId: sessionId
      })], { type: 'application/json' })

      navigator.sendBeacon(`/api/exams/${exam.id}/session/release`, blob)
    } catch (error) {
      logger.error('Error releasing session:', error)
    }
  }, [exam, studentAuthData, sessionId])

  useEffect(() => {
    const handleBeforeUnload = () => {
      releaseSession()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      releaseSession() // Also release on unmount
    }
  }, [releaseSession])

  // Persist/Restore session
  useEffect(() => {
    if (!exam) return

    const sessionKey = `exam_session_${exam.id}`

    // If we have auth data, save it
    if (studentAuthData && submissionId) {
      const sessionData = {
        studentAuthData,
        submissionId,
        timestamp: Date.now()
      }
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionData))
    }
    // If we don't have auth data but it exists in storage, restore it
    else if (!studentAuthData && !submissionId) {
      try {
        const stored = sessionStorage.getItem(sessionKey)
        if (stored) {
          const { studentAuthData: savedAuth, submissionId: savedSubId } = JSON.parse(stored)
          if (savedAuth && savedSubId) {
            logger.log('🔄 Restoring session from sessionStorage')
            setStudentAuthData(savedAuth)
            setSubmissionId(savedSubId)
            setShowStudentAuth(false)
            setShowInstructions(false)
            setIsExamStarted(true)
          }
        }
      } catch (e) {
        logger.error('Error restoring session:', e)
      }
    }
  }, [exam, studentAuthData, submissionId])

  // Effect to trigger data fetch after restoration
  useEffect(() => {
    if (isExamStarted && submissionId && exam && !answers['restored']) {
      // The startExam function handles fetching existing submission state
      startExam()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamStarted, submissionId])

  const electronMonitoring = useElectronMonitoring({
    submissionId,
    examId: exam?.id || null,
    studentId: studentAuthData?.userId || user?.id || null,
    onViolation: handleViolationCallback,
    onMetricsUpdate: handleMetricsUpdateCallback
  })

  const browserMonitoring = useBrowserMonitoring({
    submissionId,
    examId: exam?.id || null,
    studentId: studentAuthData?.userId || user?.id || null,
    onViolation: handleViolationCallback,
    onMetricsUpdate: handleMetricsUpdateCallback,
    isEnabled: isExamStarted && !isExamFinished,
    autoLogEvents: !electronMonitoring?.isElectronApp
  })

  const {
    isElectronApp,
    appVersion,
    isVM,
    metrics: electronMetrics,
    notifyExamComplete,
    closeElectronApp,
    handleZoomChange
  } = electronMonitoring || {
    isElectronApp: false,
    appVersion: null,
    isVM: false,
    metrics: null,
    notifyExamComplete: () => { },
    closeElectronApp: () => { },
    handleZoomChange: () => { }
  }

  // Use browser metrics for UI display to ensure consistency between browser and app
  // Electron metrics are still logged in the background
  const monitoringMetrics = browserMonitoring.metrics

  // Fetch exam by slug
  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoadingError(null)
        const res = await fetch(`/api/exams/slug/${params.slug}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          logger.error('Exam fetch error:', err)
          const errorMessage = err?.error || `Failed to load exam (${res.status})`
          const detailsMessage = err?.details ? ` - ${err.details}` : ''
          throw new Error(errorMessage + detailsMessage)
        }
        const json = await res.json()
        logger.log('Exam loaded successfully:', json.exam?.title)
        const ex: ApiExam = json.exam
        if (!mounted) return
        setExam(ex)

        // Check if exam has started
        const now = new Date()
        const startTime = new Date(ex.start_time)
        if (now < startTime) {
          setShowWaitingRoom(true)
        }

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

  // Check exam mode whenever exam or isElectronApp changes
  useEffect(() => {
    if (!exam) return

    if (exam.exam_mode === 'app') {
      if (isElectronApp) {
        setShowAppRequired(false)
      } else {
        setShowAppRequired(true)
      }
    } else {
      setShowAppRequired(false)
    }
  }, [exam, isElectronApp])

  // Timer
  useEffect(() => {
    if (!isExamStarted || isExamFinished) return

    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t)
          setIsTimeUp(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(t)
  }, [isExamStarted, isExamFinished])

  useEffect(() => {
    if (isTimeUp && !isExamFinished && !isSubmitting) {
      logger.log('⏱️ Time expired - auto-submitting exam')
      autoSubmitExam()
    }
  }, [isTimeUp, isExamFinished, isSubmitting])

  async function autoSubmitExam() {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      if (!exam || !submissionId) {
        setIsSubmitting(false)
        return
      }

      const { total, max, gradedAnswers } = computeScore()

      // Notify Electron app that exam is complete
      notifyExamComplete()

      // Check if any questions require manual grading
      const requiresManualGrading = Object.values(gradedAnswers).some((ans: any) => ans.requires_manual_grading)

      const percentage = max > 0 ? (total / max) * 100 : 0
      const isPassed = percentage >= 50

      const finalUpdate: TablesUpdate<'exam_submissions'> = {
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        total_score: total,
        max_score: max,
        percentage: percentage,
        is_passed: isPassed,
        submission_status: requiresManualGrading ? 'submitted' : 'graded',
        requires_manual_grading: requiresManualGrading,
        auto_submitted: true,
        time_taken_minutes: exam.duration_minutes,
        answers: gradedAnswers as any,
      }

      await sb
        .from("exam_submissions")
        .update(finalUpdate as any)
        .eq("id", submissionId)

      clearLocalSession()
      setIsExamFinished(true)
      logger.log('✅ Exam auto-submitted due to time expiry')
    } catch (error) {
      logger.error('❌ Error auto-submitting exam:', error)
      setIsSubmitting(false)
    }
  }

  function clearLocalSession(subId?: string) {
    if (!exam) return
    const targetSubId = subId || submissionId
    if (!targetSubId) return

    const sessionKey = `exam_session_${exam.id}`
    const monitoringKey = `browser_monitoring_metrics_${targetSubId}`

    sessionStorage.removeItem(sessionKey)
    sessionStorage.removeItem(monitoringKey)
    logger.log('Sweep: Cleared session data')
  }

  const autoSubmitExpiredExam = async (subId: string, answersOverride?: Record<string, AnswerState>) => {
    try {
      if (!exam) return

      const { total, max, gradedAnswers } = computeScore(answersOverride)

      // Check if any questions require manual grading
      const requiresManualGrading = Object.values(gradedAnswers).some((ans: any) => ans.requires_manual_grading)

      const percentage = max > 0 ? (total / max) * 100 : 0
      const isPassed = percentage >= 50

      const finalUpdate: TablesUpdate<'exam_submissions'> = {
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        total_score: total,
        max_score: max,
        percentage: percentage,
        is_passed: isPassed,
        submission_status: requiresManualGrading ? 'submitted' : 'graded',
        requires_manual_grading: requiresManualGrading,
        auto_submitted: true,
        time_taken_minutes: exam.duration_minutes,
        answers: gradedAnswers as any,
      }

      await sb
        .from("exam_submissions")
        .update(finalUpdate as any)
        .eq("id", subId)

      clearLocalSession(subId)
      logger.log('✅ Expired exam auto-submitted on re-login')
    } catch (error) {
      logger.error('❌ Error auto-submitting expired exam:', error)
    }
  }

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
    logger.log('Student authenticated:', data)
  }

  // Start exam -> ensure submission row exists and preload answers
  async function startExam() {
    try {
      logger.log('🚀 Start Exam clicked')
      if (!exam) {
        logger.error('❌ No exam data available')
        throw new Error('Exam data not available')
      }
      logger.log('✅ Exam data exists:', exam.title)

      if (!studentAuthData || !studentAuthData.userId) {
        logger.error('❌ No authenticated student data')
        throw new Error('Student authentication data not available')
      }

      const userId = studentAuthData.userId
      logger.log('👤 User ID from auth:', userId)

      logger.log('🔍 Calling start exam API...')

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
          studentSection: studentAuthData.studentSection,
          sessionId: sessionId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        logger.error('❌ Start exam API error:', result)
        if (result.code === 'CONCURRENT_SESSION') {
          setLoadingError('Exam is already active on another device or browser tab')
          return
        }
        if (result.alreadySubmitted) {
          setIsExamFinished(true)
          setShowInstructions(false)
          clearLocalSession()
          return
        }
        throw new Error(result.error || 'Failed to start exam')
      }

      logger.log('✅ Start exam API response:', result)

      // Set submission ID
      setSubmissionId(result.submission.id)

      // Check if exam was already submitted
      if (result.submission.is_submitted) {
        logger.log('📝 Exam was already submitted')
        setIsExamFinished(true)
        setShowInstructions(false)
        clearLocalSession(result.submission.id)
        return
      }

      // Prepare restored answers if any
      let restoredAnswers: Record<string, AnswerState> = {}
      if (!result.isNew && result.submission.answers) {
        const pre = result.submission.answers || {}
        Object.keys(pre).forEach((qid) => {
          const savedAnswer = pre[qid]
          restoredAnswers[qid] = {
            ...savedAnswer,
            status: savedAnswer.status || "unanswered"
          }
        })
      }

      // Set time remaining from API (handles both new and resumed exams)
      if (result.submission.timeRemainingSeconds !== undefined) {
        const timeRemaining = Math.max(0, Math.floor(result.submission.timeRemainingSeconds))
        setTimeLeft(timeRemaining)
        logger.log('⏱️ Time set to:', timeRemaining, 'seconds')

        // If time has expired, auto-submit if not already submitted and show finished message
        if (timeRemaining === 0) {
          logger.log('⏱️ Time expired - marking exam as finished')

          // If not yet submitted, auto-submit now
          if (!result.submission.is_submitted) {
            logger.log('⏱️ Auto-submitting expired exam')
            await autoSubmitExpiredExam(result.submission.id, restoredAnswers)
          } else {
            clearLocalSession(result.submission.id)
          }

          setIsExamFinished(true)
          setShowInstructions(false)
          return
        }
      }

      // If existing submission, restore answers and section progress
      if (!result.isNew && result.submission.answers) {
        logger.log('📋 Restoring previous answers...')
        const ans = restoredAnswers
        const submittedSections: Record<string, boolean> = {}
        const unlockedSectionsMap: Record<string, boolean> = {}

        // Determine which sections have been submitted and should be unlocked
        uiSections.forEach((section, idx) => {
          const allQuestionsSubmitted = section.questions.every((q) => {
            const questionStatus = ans[q.id]?.status
            return questionStatus === "submitted"
          })

          if (allQuestionsSubmitted && section.questions.length > 0) {
            submittedSections[section.id] = true
          }
        })

        // Second pass: Unlock sections if previous is submitted
        uiSections.forEach((section, idx) => {
          if (idx === 0) {
            unlockedSectionsMap[section.id] = true
          } else {
            const prevSec = uiSections[idx - 1]
            if (submittedSections[prevSec.id]) {
              unlockedSectionsMap[section.id] = true
            }
          }

          // Also unlock if it has any progress
          const hasProgress = section.questions.some((q) => {
            const st = ans[q.id]?.status
            return st !== "unanswered" && st !== undefined
          })
          if (hasProgress) {
            unlockedSectionsMap[section.id] = true
          }
        })

        // Find the current section (first non-submitted or last)
        let currentSecIdx = 0
        for (let i = 0; i < uiSections.length; i++) {
          if (!submittedSections[uiSections[i].id]) {
            currentSecIdx = i
            break
          }
          currentSecIdx = i // If all submitted, stay on last
        }

        const allSectionsSubmitted = uiSections.length > 0 && uiSections.every(s => submittedSections[s.id])

        setAnswers(ans)
        setSectionSubmitted(submittedSections)
        setUnlockedSections(unlockedSectionsMap)
        setCurrentSectionIdx(currentSecIdx)
        if (allSectionsSubmitted) {
          setIsExamReview(true)
        }

        logger.log('✅ Restored state:', {
          answersCount: Object.keys(ans).length,
          submittedSections: Object.keys(submittedSections),
          unlockedSections: Object.keys(unlockedSectionsMap),
          currentSectionIdx: currentSecIdx,
          isExamReview: allSectionsSubmitted
        })
      } else {
        logger.log('📝 Starting fresh exam (no previous answers)')
      }

      logger.log('🎯 Setting exam as started...')
      setIsExamStarted(true)
      setShowInstructions(false)
      logger.log('✅ Exam started successfully!')
    } catch (error) {
      logger.error('💥 Error starting exam:', error)
      throw error // Re-throw to be caught by ExamInstructions
    }
  }

  const persistAnswers = async (next: Record<string, AnswerState>) => {
    if (!submissionId) return
    const payload: Record<string, any> = {}
    Object.keys(next).forEach((qid) => {
      const a = next[qid]
      payload[qid] = { userAnswer: a.userAnswer, userCode: a.userCode, status: a.status, isMarkedForReview: a.isMarkedForReview }
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
    logger.log('🔵 updateAnswer called:', { qid, patch })
    setAnswers((prev) => {
      const base: AnswerState = prev[qid] || { status: 'unanswered' }
      const merged: AnswerState = { ...base, ...patch }
      const next = { ...prev, [qid]: merged }
      logger.log('🔵 Answer updated:', { qid, before: base, after: merged })
      void persistAnswers(next)
      return next
    })
  }


  // Navigation
  const navigateToQuestion = (sectionIdx: number, questionIdx: number) => {
    const s = uiSections[sectionIdx]
    if (!s) return
    // Block navigation to locked sections OR submitted sections
    if (!unlockedSections[s.id]) return
    if (sectionSubmitted[s.id]) return

    setIsReviewingSection(false)
    setIsExamReview(false)
    setCurrentSectionIdx(sectionIdx)
    setCurrentQuestionIdx(questionIdx)
  }

  // Submit single question (just marks answered and moves next)
  const handleQuestionSubmit = (question: UIQuestion) => {
    logger.log('✅ handleQuestionSubmit called for question:', question.id)
    logger.log('✅ Current answer state:', answers[question.id])
    updateAnswer(question.id, { status: "answered" })
    const nextIdx = currentQuestionIdx + 1

    // Check if this is the last question in the section
    if (currentSection && nextIdx >= currentSection.questions.length) {
      // Last question - show section review instead of dialog directly
      logger.log('📋 Last question in section - moving to section review')
      setIsReviewingSection(true)
    } else if (currentSection && nextIdx < currentSection.questions.length) {
      // Not the last question - navigate to next question
      setCurrentQuestionIdx(nextIdx)
    }
  }

  const clearSelection = () => {
    if (!currentQ) return
    updateAnswer(currentQ.id, { userAnswer: undefined, status: "unanswered" })
  }

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!exam || !submissionId || !studentAuthData) return

    // Skip if no rating and no feedback text
    if (!feedbackRating && !feedbackText.trim()) {
      setFeedbackSubmitted(true)
      return
    }

    setIsFeedbackSubmitting(true)

    try {
      const response = await fetch('/api/exam/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          submissionId: submissionId,
          studentId: studentAuthData.userId || user?.id,
          studentEmail: studentAuthData.studentEmail,
          studentName: studentAuthData.studentName,
          rollNumber: studentAuthData.rollNumber,
          rating: feedbackRating || null,
          feedbackText: feedbackText.trim() || null
        })
      })

      const result = await response.json()

      if (result.success) {
        logger.log('✅ Feedback submitted successfully')
        setFeedbackSubmitted(true)
      } else {
        logger.error('Failed to submit feedback:', result.error)
        alert('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      logger.error('Error submitting feedback:', error)
      alert('Error submitting feedback. Please try again.')
    } finally {
      setIsFeedbackSubmitting(false)
    }
  }

  const increaseFontSize = () => setCurrentFontSizeIndex((p) => Math.min(p + 1, FONT_SIZES.length - 1))
  const decreaseFontSize = () => setCurrentFontSizeIndex((p) => Math.max(p - 1, 0))
  const currentFontSizeClass = FONT_SIZES[currentFontSizeIndex]

  // Section and final submit dialogs
  const handleSectionSubmitClick = () => {
    setIsReviewingSection(true)
  }
  const handleFinalSubmitClick = () => {
    setSubmitDialogType("final")
    setShowSubmitDialog(true)
  }

  function computeScore(answersOverride?: Record<string, AnswerState>) {
    if (!exam) return { total: 0, max: 0, gradedAnswers: {} }
    let total = 0
    let max = 0
    const gradedAnswers: Record<string, any> = {}
    const currentAnswers = answersOverride || answers

    logger.log('🔍 computeScore - All answers:', currentAnswers)

    uiSections.forEach((s) => {
      s.questions.forEach((q) => {
        const apiQ = exam.sections.find((ss) => ss.id === s.id)?.questions.find((qq) => qq.question.id === q.id)
        if (!apiQ) return
        const pts = apiQ.points || 1
        const answer = currentAnswers[q.id]

        if (q.type === "mcq") {
          max += pts
          const userAns = answer?.userAnswer as string | undefined
          const correctAnswers = apiQ.question.mcq_question?.correct_answers || []

          logger.log('🔍 MCQ grading:', {
            questionId: q.id,
            questionTitle: q.title,
            userAnswer: userAns,
            correctAnswers: correctAnswers,
            answerObject: answer
          })

          // correctAnswers should now be letter IDs like ['a', 'b', 'c']
          // userAns should also be a letter ID like 'a'
          const isCorrect = userAns && correctAnswers.includes(userAns)
          const pointsEarned = isCorrect ? pts : 0
          total += pointsEarned

          // Store graded answer
          gradedAnswers[q.id] = {
            userAnswer: userAns,
            status: answer?.status || "unanswered",
            is_correct: isCorrect,
            points_earned: pointsEarned,
            max_points: pts
          }
        } else if (q.type === "coding") {
          max += pts

          // Calculate marks based on weighted test cases
          // Each test case has a weight (marks), student gets those marks if they pass it
          const testCasesPassed = answer?.testCasesPassed || 0
          const totalTestCases = answer?.totalTestCases || 0
          const testCaseResults = answer?.testCaseResults || []
          const totalPointsEarned = answer?.totalPointsEarned || 0
          const totalPossiblePoints = answer?.totalPossiblePoints || 0

          let pointsEarned = 0
          let isCorrect = false

          // Direct weight-based scoring: sum of marks from passed test cases
          if (totalPossiblePoints > 0) {
            // Directly use the sum of weights (marks) from passed test cases
            pointsEarned = totalPointsEarned
            isCorrect = testCasesPassed === totalTestCases && totalPointsEarned === totalPossiblePoints
          } else if (totalTestCases > 0 && testCasesPassed > 0) {
            // Fallback: If no weights defined, divide marks equally among test cases
            const marksPerTestCase = pts / totalTestCases
            pointsEarned = Math.round(testCasesPassed * marksPerTestCase * 100) / 100
            isCorrect = testCasesPassed === totalTestCases
          }

          total += pointsEarned

          // Store graded answer with test case information
          gradedAnswers[q.id] = {
            userCode: answer?.userCode,
            language: answer?.language,
            status: answer?.status || "unanswered",
            is_correct: isCorrect,
            points_earned: pointsEarned,
            max_points: pts,
            test_cases_passed: testCasesPassed,
            total_test_cases: totalTestCases,
            test_case_results: testCaseResults,
            total_points_earned: totalPointsEarned,
            total_possible_points: totalPossiblePoints,
            requires_manual_grading: false // Auto-graded based on test cases
          }
        }
      })
    })

    return { total, max, gradedAnswers }
  }

  const confirmSubmit = async (isVerified: boolean) => {
    if (!isVerified) return
    if (!exam) return

    if (submitDialogType === "final") {
      handleFinalSubmit()
      setShowSubmitDialog(false)
      return
    }

    const sec = currentSection
    if (!sec) return

    // Mark section as submitted and lock its questions
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

    // Reset review state
    setIsReviewingSection(false)

    // Unlock next section or move to final exam review
    if (uiSections[currentSectionIdx + 1]) {
      const nextSec = uiSections[currentSectionIdx + 1]
      setUnlockedSections((prev) => ({ ...prev, [nextSec.id]: true }))
      setCurrentSectionIdx(currentSectionIdx + 1)
      setCurrentQuestionIdx(0)
    } else {
      // Last section submitted - show final exam review
      setIsExamReview(true)
    }

    setShowSubmitDialog(false)
  }

  const handleFinalSubmit = async () => {
    if (!exam) return
    setIsSubmitting(true)

    const { total, max, gradedAnswers } = computeScore()

    // Notify Electron app that exam is complete
    notifyExamComplete()

    if (submissionId && exam) {
      const timeTakenMinutes = Math.ceil((exam.duration_minutes * 60 - timeLeft) / 60)
      const requiresManualGrading = Object.values(gradedAnswers).some((ans: any) => ans.requires_manual_grading)
      const percentage = max > 0 ? (total / max) * 100 : 0
      const isPassed = percentage >= 50

      const finalUpdate: TablesUpdate<'exam_submissions'> = {
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        total_score: total,
        max_score: max,
        percentage: percentage,
        is_passed: isPassed,
        submission_status: requiresManualGrading ? 'submitted' : 'graded',
        requires_manual_grading: requiresManualGrading,
        time_taken_minutes: timeTakenMinutes,
        answers: gradedAnswers as any,
      }

      await sb
        .from("exam_submissions")
        .update(finalUpdate as any)
        .eq("id", submissionId)

      clearLocalSession()
    }

    setIsExamFinished(true)
    setIsSubmitting(false)
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

  const handleViolationDismiss = useCallback(() => {
    setCurrentViolation(null)
  }, [])

  const handleViolationTerminate = useCallback(() => {
    setCurrentViolation(null)
    autoSubmitExam()
  }, [autoSubmitExam])

  if (isTimeUp && !isExamFinished) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-sky-200 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-sky-900">Time's Up!</h1>
            <p className="text-sky-700">
              Your exam time has expired. Submitting your answers now...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
              <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isExamFinished) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-sky-200 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-sky-900">Exam Submitted Successfully!</h1>
            <p className="text-sky-700">
              Your responses have been recorded. {isElectronApp ? 'Please share your experience before closing.' : 'Thank you for participating!'}
            </p>
            {exam && (
              <div className="mt-4 p-4 bg-sky-50 rounded-lg text-sm text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam:</span>
                  <span className="font-medium">{exam.title}</span>
                </div>
                {studentAuthData && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student:</span>
                      <span className="font-medium">{studentAuthData.studentName}</span>
                    </div>
                    {studentAuthData.rollNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Roll Number:</span>
                        <span className="font-medium">{studentAuthData.rollNumber}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted At:</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {!feedbackSubmitted ? (
              <div className="mt-6 p-4 bg-white border border-sky-200 rounded-lg text-left space-y-4">
                <h3 className="text-lg font-semibold text-sky-900 text-center">How was your experience?</h3>

                {/* Star Rating */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                        type="button"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            star <= feedbackRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {feedbackRating > 0 && (
                    <span className="text-sm text-gray-600">
                      {feedbackRating === 5 ? "Excellent!" : feedbackRating === 4 ? "Good!" : feedbackRating === 3 ? "Fair" : feedbackRating === 2 ? "Poor" : "Very Poor"}
                    </span>
                  )}
                </div>

                {/* Feedback Text */}
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-sm text-gray-700">
                    Share your feedback (optional)
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Tell us about your exam experience..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={3}
                    className="resize-none"
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500">
                    {feedbackText.length}/500
                  </div>
                </div>

                {/* Submit Feedback Button */}
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={isFeedbackSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  {isFeedbackSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>

                {/* Skip Button */}
                <button
                  onClick={() => setFeedbackSubmitted(true)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-center">
                  ✓ Thank you for your feedback!
                </p>
              </div>
            )}

            {/* Close Application Button - Only show after feedback is submitted or skipped */}
            {isElectronApp && feedbackSubmitted && (
              <Button
                onClick={() => {
                  setIsClosing(true)
                  closeElectronApp()
                }}
                disabled={isClosing}
                className="mt-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold w-full disabled:opacity-50"
              >
                {isClosing ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" />
                    Closing Application...
                  </>
                ) : (
                  'Close Application'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
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

  if (showAppRequired) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-sky-200 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-sky-600" />
            </div>
            <h1 className="text-2xl font-bold text-sky-900">Secure Exam App Required</h1>
            <p className="text-sky-700">
              This exam requires the secure exam application to ensure integrity. Please open the exam in the app.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md"
                onClick={() => {
                  window.location.href = `coding-exam://open?slug=${params.slug}`
                }}
              >
                Open Exam in App
              </Button>

              <div className="text-sm text-gray-500">
                Don't have the app? <a href="https://github.com/Sumanydv/electron-app-download/releases/download/v0.0.1/blockscode-Setup-0.0.1.exe" className="text-sky-600 hover:underline">Download here</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showWaitingRoom) {
    return (
      <WaitingRoom
        exam={exam}
        onExamStart={() => setShowWaitingRoom(false)}
      />
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
              disabled={isExamReview || isReviewingSection}
              onClick={() => {
                if (!currentSection) return
                if (currentQuestionIdx > 0) setCurrentQuestionIdx(currentQuestionIdx - 1)
                else if (currentSectionIdx > 0) {
                  const prevSectionIdx = currentSectionIdx - 1
                  const prevSection = uiSections[prevSectionIdx]
                  if (prevSection && unlockedSections[prevSection.id] && !sectionSubmitted[prevSection.id]) {
                    setCurrentSectionIdx(prevSectionIdx)
                    setCurrentQuestionIdx(prevSection.questions.length - 1)
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
              disabled={isExamReview || isReviewingSection}
              onClick={() => {
                if (!currentSection) return
                if (currentQuestionIdx < currentSection.questions.length - 1) setCurrentQuestionIdx(currentQuestionIdx + 1)
                else {
                  setIsReviewingSection(true)
                }
              }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Monitoring Status - Tab Switches Only */}
          {(isElectronApp || exam?.exam_mode === 'browser') && (
            <MonitoringStatus
              metrics={monitoringMetrics}
              isElectronApp={isElectronApp}
              isVM={isVM}
              appVersion={appVersion}
              maxTabSwitches={exam?.max_tab_switches || 3}
              mode={exam?.exam_mode === 'browser' ? 'browser' : 'electron'}
            />
          )}
        </div>
        {/* Central Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsReviewingSection(true)}
            disabled={isSectionSubmitButtonDisabled() || !isOnline || isExamReview}
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Section
          </Button>
          <Button
            onClick={() => setIsExamReview(true)}
            disabled={!isOnline}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Final Submit Exam
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {studentAuthData?.rollNumber && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-medium uppercase">Roll:</span>
              <span className="text-sm font-bold text-slate-700">{studentAuthData.rollNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 text-slate-400 hover:text-slate-600"
                onClick={() => window.location.reload()}
                title="Refresh Page"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          )}
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
              onClick={() => {
                decreaseFontSize()
              }}
              disabled={currentFontSizeIndex === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-sky-100 text-sky-600"
              onClick={() => {
                increaseFontSize()
              }}
              disabled={currentFontSizeIndex === FONT_SIZES.length - 1}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center w-10 h-8 rounded-lg bg-slate-50 border border-slate-200" title={!isOnline ? "Offline" : `Network Strength: ${networkStrength}/4${networkSpeed ? ` (${networkSpeed} Mbps)` : ''}`}>
            {!isOnline ? (
              <WifiOff className="h-5 w-5 text-red-500 animate-pulse" />
            ) : (
              <div className="relative w-5 h-4 flex items-end gap-0.5">
                <div className={`w-1 rounded-sm ${networkStrength >= 1 ? 'h-1 bg-green-500' : 'h-1 bg-gray-300'}`}></div>
                <div className={`w-1 rounded-sm ${networkStrength >= 2 ? 'h-2 bg-green-500' : 'h-2 bg-gray-300'}`}></div>
                <div className={`w-1 rounded-sm ${networkStrength >= 3 ? 'h-3 bg-green-500' : 'h-3 bg-gray-300'}`}></div>
                <div className={`w-1 rounded-sm ${networkStrength >= 4 ? 'h-4 bg-green-500' : 'h-4 bg-gray-300'}`}></div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-sky-100 text-sky-600"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => { })
              } else {
                if (document.exitFullscreen) document.exitFullscreen()
              }
            }}
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Sections/Questions */}
        <div className={`${isSidebarOpen && !isExamReview && !isReviewingSection ? "w-16" : "w-0"} transition-all duration-300 border-r border-sky-200 bg-white shadow-sm overflow-hidden`}>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-3">
              {uiSections.map((s, sIdx) => {
                const locked = !unlockedSections[s.id]
                const submitted = !!sectionSubmitted[s.id]
                const isCollapsed = collapsedSections[s.id]
                return (
                  <div key={s.id} className="relative pb-2">
                    <div
                      className="text-xs font-semibold text-sky-800 mb-2 px-1 py-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 select-none flex items-center justify-between gap-1"
                      onClick={() => setCollapsedSections(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                    >
                      <span className="truncate flex-1 text-center">{s.title}</span>
                      {isCollapsed ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronUp className="h-3 w-3 shrink-0" />}
                    </div>

                    {!isCollapsed && (
                      <>
                        {(locked || submitted) && (
                          <div className="absolute inset-0 top-8 flex items-center justify-center z-10 pointer-events-none">
                            <div className="bg-sky-100 p-2 rounded-full flex items-center justify-center shadow-md">
                              <Lock className="h-4 w-4 text-sky-600" />
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5 items-center">
                          {s.questions.map((q, qIdx) => {
                            const st = answers[q.id]?.status || "unanswered"
                            const isActive = currentSectionIdx === sIdx && currentQuestionIdx === qIdx
                            const color = st === "submitted" ? "bg-green-600 text-white" : st === "answered" ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                            const isDisabled = locked || submitted
                            return (
                              <button
                                key={q.id}
                                onClick={() => navigateToQuestion(sIdx, qIdx)}
                                disabled={isDisabled}
                                className={cn("w-10 h-7 rounded text-xs font-semibold grid place-items-center border", color, isActive && "ring-2 ring-offset-1 ring-sky-500", isDisabled && "opacity-60 cursor-not-allowed")}
                                title={`${s.title} • Q${q.indexInSection}`}
                              >
                                {q.indexInSection}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
          {!isOnline && (
            <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10 duration-300">
              <div className="bg-white p-4 rounded-lg shadow-xl border border-red-200 max-w-sm flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-full shrink-0 animate-pulse">
                  <WifiOff className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">Connection Lost</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You are currently offline. Your progress is saved locally but cannot be submitted until connection is restored.
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 font-medium">
                    Reconnecting...
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Optional: Allow dismissing the popup temporarily? 
                    // Or just keep it there as a persistent warning.
                    // For now, let's not add a close button to ensure they see it.
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {/* <X className="h-4 w-4" /> */}
                </button>
              </div>
            </div>
          )}
          {isExamReview ? (
            <ExamReview
              sections={uiSections.map(s => ({
                id: s.id,
                title: s.title,
                questions: s.questions.map(q => ({
                  id: q.id,
                  status: (answers[q.id]?.status as any) || "unanswered"
                }))
              }))}
              onFinalSubmit={handleFinalSubmitClick}
              onGoToSection={(idx) => {
                setIsExamReview(false)
                setIsReviewingSection(false)
                setCurrentSectionIdx(idx)
                setCurrentQuestionIdx(0)
              }}
            />
          ) : isReviewingSection && currentSection ? (
            <SectionReview
              sectionTitle={currentSection.title}
              questions={currentSection.questions.map(q => ({
                id: q.id,
                title: q.title,
                status: (answers[q.id]?.status as any) || "unanswered",
                isMarkedForReview: !!answers[q.id]?.isMarkedForReview,
                questionNumber: q.indexInSection
              }))}
              onBackToQuestion={(idx) => {
                setIsReviewingSection(false)
                setCurrentQuestionIdx(idx)
              }}
              onSubmitSection={() => {
                setSubmitDialogType("section")
                setShowSubmitDialog(true)
              }}
            />
          ) : currentSection && sectionSubmitted[currentSection.id] ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50 to-white p-8">
              <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Lock className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-sky-900">Section Locked</h2>
                <p className="text-sky-700">
                  This section has been submitted and is now locked. You can no longer view or change its questions.
                </p>
                {uiSections[currentSectionIdx + 1] && unlockedSections[uiSections[currentSectionIdx + 1].id] && (
                  <Button
                    onClick={() => {
                      setCurrentSectionIdx(currentSectionIdx + 1)
                      setCurrentQuestionIdx(0)
                    }}
                    className="mt-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800"
                  >
                    Go to Next Section
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          ) : currentQ?.type === "mcq" ? (
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
                  onAnswerChange={(answer) => {
                    logger.log('📝 MCQ answer changed:', { questionId: currentQ.id, answer })
                    updateAnswer(currentQ.id, { userAnswer: answer, status: "answered" })
                  }}
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
                      // If custom input is provided, use run-custom endpoint
                      if (customInput !== undefined && customInput !== null) {
                        try {
                          const res = await fetch('/api/coding/run-custom', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              code,
                              language,
                              input: customInput
                            })
                          })

                          if (!res.ok) {
                            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                            return { error: errorData.error || 'Failed to run code' }
                          }

                          const data = await res.json()
                          return data
                        } catch (err: any) {
                          return { error: err?.message || 'Failed to run code' }
                        }
                      }

                      // Otherwise, run test cases
                      try {
                        const res = await fetch('/api/coding/run', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            code,
                            language,
                            testCases: currentQ.testCases || []
                          })
                        })

                        if (!res.ok) {
                          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                          return { error: errorData.error || 'Failed to run test cases' }
                        }

                        const data = await res.json()

                        // Store test case results in answer state for later grading
                        if (data.testCaseResults) {
                          // Attach weights and calculate points earned for each test case
                          const testCasesWithWeights = data.testCaseResults.map((result: any, index: number) => {
                            const testCase = (currentQ.testCases || [])[index]
                            const weight = testCase?.weight || 0
                            const pointsEarned = result.passed ? weight : 0

                            return {
                              ...result,
                              weight: weight,
                              pointsEarned: pointsEarned
                            }
                          })

                          // Calculate total points
                          const totalPointsEarned = testCasesWithWeights.reduce(
                            (sum: number, tc: any) => sum + (tc.pointsEarned || 0),
                            0
                          )
                          const totalPossiblePoints = (currentQ.testCases || []).reduce(
                            (sum, tc) => sum + (tc.weight || 0),
                            0
                          )

                          updateAnswer(currentQ.id, {
                            testCaseResults: testCasesWithWeights,
                            testCasesPassed: data.testCasesPassed,
                            totalTestCases: data.totalTestCases,
                            totalPointsEarned: totalPointsEarned,
                            totalPossiblePoints: totalPossiblePoints,
                            language: language
                          })
                        }

                        return data
                      } catch (err: any) {
                        return { error: err?.message || 'Failed to run test cases' }
                      }
                    }}
                    onSubmit={async (code, language) => {
                      // First run test cases to get results
                      try {
                        const res = await fetch('/api/coding/run', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            code,
                            language,
                            testCases: currentQ.testCases || []
                          })
                        })

                        if (res.ok) {
                          const data = await res.json()

                          // Attach weights and calculate points earned for each test case
                          const testCasesWithWeights = (data.testCaseResults || []).map((result: any, index: number) => {
                            const testCase = (currentQ.testCases || [])[index]
                            const weight = testCase?.weight || 0
                            const pointsEarned = result.passed ? weight : 0

                            return {
                              ...result,
                              weight: weight,
                              pointsEarned: pointsEarned
                            }
                          })

                          // Calculate total points
                          const totalPointsEarned = testCasesWithWeights.reduce(
                            (sum: number, tc: any) => sum + (tc.pointsEarned || 0),
                            0
                          )
                          const totalPossiblePoints = (currentQ.testCases || []).reduce(
                            (sum, tc) => sum + (tc.weight || 0),
                            0
                          )

                          // Store code, language, and test case results
                          updateAnswer(currentQ.id, {
                            userCode: code,
                            language: language,
                            testCaseResults: testCasesWithWeights,
                            testCasesPassed: data.testCasesPassed || 0,
                            totalTestCases: data.totalTestCases || 0,
                            totalPointsEarned: totalPointsEarned,
                            totalPossiblePoints: totalPossiblePoints,
                            status: "answered"
                          })
                        } else {
                          // If execution fails, still store the code
                          updateAnswer(currentQ.id, {
                            userCode: code,
                            language: language,
                            status: "answered"
                          })
                        }
                      } catch (err) {
                        // If API call fails, still store the code
                        updateAnswer(currentQ.id, {
                          userCode: code,
                          language: language,
                          status: "answered"
                        })
                      }

                      handleQuestionSubmit(currentQ)
                    }}
                    bottomPanelHeight={bottomPanelHeight}
                    onVerticalResize={handleVerticalMouseDown}
                    fontSizeClass={currentFontSizeClass}
                    isLocked={!!sectionSubmitted[currentSection?.id || ""]}
                    showSubmitButton={true}
                    disableCopyPaste={true}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {
        showSubmitDialog && (
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
        )
      }

      {/* Violation Alert - In-app popup instead of system alert */}
      <ViolationAlert
        violation={currentViolation}
        onDismiss={handleViolationDismiss}
        onTerminate={handleViolationTerminate}
      />
    </div >
  )

  function reportProblem() {
    // TODO: Implement proper report problem dialog
    // For now, use a non-blocking notification
    const problemAlert: ViolationAlertData = {
      id: `report-${Date.now()}`,
      message: "Report problem functionality would be implemented here. Your concern will be noted.",
      violationCount: 0,
      shouldTerminate: false,
      timestamp: Date.now()
    }
    setCurrentViolation(problemAlert)
  }
}


