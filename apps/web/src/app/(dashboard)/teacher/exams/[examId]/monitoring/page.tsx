"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ChevronLeft,
  Users,
  Activity,
  CheckCircle2,
  Flag,
  AlertTriangle,
  Eye,
  Clock,
  RefreshCw,
  Monitor,
  Lock,
  Copy,
  ZoomIn,
  MessageSquare,
  Shield,
  TrendingUp,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

interface StudentMonitoringData {
  submission: any
  metrics: {
    total_tab_switches: number
    total_tab_switches_in: number
    total_screen_locks: number
    total_window_blur_events: number
    copy_attempts: number
    paste_attempts: number
    zoom_changes: number
    risk_score: number
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    is_flagged_for_review: boolean
    is_vm_detected?: boolean
    multi_monitor_detected?: boolean
  }
  violations: any[]
  flags: any[]
  recentEvents: any[]
  status: 'in_progress' | 'completed'
  riskLevel: string
  violationCount: number
  flagCount: number
  systemInfo: {
    appVersion: string | null
    osPlatform: string | null
    isVm: boolean
    vmDetails: string | null
    monitorCount: number
  }
}

interface LiveMonitoringData {
  students: StudentMonitoringData[]
  summary: {
    totalStudents: number
    activeStudents: number
    completedStudents: number
    flaggedStudents: number
    highRiskStudents: number
    totalViolations: number
    totalFlags: number
  }
  lastUpdated: string
}

export default function ExamMonitoringPage() {
  const params = useParams<{ examId: string }>()
  const router = useRouter()
  
  const [monitoringData, setMonitoringData] = useState<LiveMonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentMonitoringData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchMonitoringData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) setIsRefreshing(true)
      
      const response = await fetch(`/api/exam/monitoring/live/${params.examId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data')
      }

      const data = await response.json()
      setMonitoringData(data)
      setLastUpdated(new Date())
      setError(null)

      // Update selected student if one is selected to keep their view live
      if (selectedStudent) {
        const updatedSelected = data.students.find((s: any) => s.submission.id === selectedStudent.submission.id)
        if (updatedSelected) {
          setSelectedStudent(updatedSelected)
        }
      }
    } catch (err: any) {
      logger.error('Error fetching monitoring data:', err)
      if (!monitoringData) setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
  }, [params.examId])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMonitoringData(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedStudent]) // Add selectedStudent dependency to ensure closure captures current selection

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getViolationTypeLabel = (violationType: string) => {
    const labels: Record<string, string> = {
      'forbidden_process_detected': 'Forbidden Process',
      'multi_monitor_usage': 'Multiple Displays',
      'prolonged_screen_lock': 'Screen Lock',
      'excessive_tab_switching': 'Tab Switch / Window Blur',
      'vm_usage_detected': 'Virtual Machine',
      'recording_failure': 'Recording Failure',
      'monitoring_app_failure': 'Monitoring App Failure',
      'suspicious_behavior': 'Suspicious Behavior',
      'copy_paste_detected': 'Copy/Paste Detected',
      'unauthorized_application': 'Unauthorized App'
    }
    return labels[violationType] || violationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'exam_started': 'Exam Started',
      'exam_submitted': 'Exam Submitted',
      'exam_terminated': 'Exam Terminated',
      'tab_switched_out': 'Tab Switched Out',
      'tab_switched_in': 'Tab Switched In',
      'screen_locked': 'Screen Locked',
      'screen_unlocked': 'Screen Unlocked',
      'window_minimized': 'Window Minimized',
      'window_restored': 'Window Restored',
      'window_blur': 'Window Lost Focus',
      'window_focus': 'Window Focused',
      'multi_monitor_detected': 'Multiple Monitors',
      'vm_detected': 'Virtual Machine',
      'copy_attempt': 'Copy Attempt',
      'paste_attempt': 'Paste Attempt',
      'right_click': 'Right Click',
      'keyboard_shortcut': 'Keyboard Shortcut',
      'zoom_changed': 'Zoom Changed',
      'network_disconnected': 'Network Disconnected',
      'network_reconnected': 'Network Reconnected',
      'page_reload': 'Page Reload',
      'browser_devtools_opened': 'DevTools Opened',
      'suspicious_activity': 'Suspicious Activity',
      'violation_threshold_reached': 'Violation Threshold Reached',
      'custom_event': 'Custom Event'
    }
    return labels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchMonitoringData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!monitoringData) return null

  const { students, summary } = monitoringData

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Live Exam Monitoring</h1>
                <p className="text-xs text-gray-500">Real-time student activity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/teacher/exams/${params.examId}/feedback`)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700"
              >
                <MessageSquare className="w-4 h-4" />
                Feedback
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm",
                  autoRefresh
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                {autoRefresh ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
              </button>
              <button
                onClick={() => fetchMonitoringData()}
                disabled={isRefreshing}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 text-gray-700"
              >
                <RefreshCw
                  className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.activeStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">Done</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.completedStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary.flaggedStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">High Risk</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary.highRiskStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">Violations</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {summary.totalViolations}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">Updated</p>
                  <p className="text-xs font-bold text-gray-900">
                    {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Student Activity Monitor
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Real-time tracking of all students
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No students have started the exam yet
                    </p>
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.submission.id}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        "border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md",
                        selectedStudent?.submission.id === student.submission.id
                          ? 'border-blue-500 bg-blue-50'
                          : student.metrics.is_flagged_for_review
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        {/* Student Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-gray-900 font-semibold">
                              {student.submission.student_name}
                            </h3>
                            {student.submission.roll_number && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300 font-medium">
                                {student.submission.roll_number}
                              </span>
                            )}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs border font-medium",
                                student.status === 'completed'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-green-100 text-green-700 border-green-300'
                              )}
                            >
                              {student.status === 'completed'
                                ? 'Completed'
                                : 'In Progress'}
                            </span>
                            {student.metrics.is_flagged_for_review && (
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs flex items-center gap-1 font-medium">
                                <Flag className="w-3 h-3" />
                                Flagged
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {student.submission.student_email}
                          </p>
                          <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            {student.submission.ip_address && (
                              <span>IP: {student.submission.ip_address}</span>
                            )}
                            {student.systemInfo.appVersion && (
                              <span>App: v{student.systemInfo.appVersion}</span>
                            )}
                            {student.systemInfo.osPlatform && (
                              <span className="capitalize">
                                {student.systemInfo.osPlatform === 'win32'
                                  ? 'Windows'
                                  : student.systemInfo.osPlatform === 'darwin'
                                  ? 'macOS'
                                  : student.systemInfo.osPlatform}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-6">
                          {/* Risk Score */}
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Risk Score
                            </p>
                            <div
                              className={cn(
                                "px-3 py-1 rounded-lg border text-lg font-bold",
                                getRiskColor(student.riskLevel)
                              )}
                            >
                              {student.metrics.risk_score.toFixed(0)}
                            </div>
                          </div>

                          {/* Activity Metrics */}
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-xs text-gray-600 mb-1 font-medium">
                                Tab Out
                              </p>
                              <p
                                className={cn(
                                  "text-lg font-bold",
                                  student.metrics.total_tab_switches >= 3
                                    ? 'text-red-600'
                                    : 'text-orange-600'
                                )}
                              >
                                {student.metrics.total_tab_switches}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1 font-medium">
                                Tab In
                              </p>
                              <p className="text-lg font-bold text-blue-600">
                                {student.metrics.total_tab_switches_in || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1 font-medium">
                                Violations
                              </p>
                              <p className="text-lg font-bold text-orange-600">
                                {student.violationCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1 font-medium">
                                Flags
                              </p>
                              <p className="text-lg font-bold text-red-600">
                                {student.flagCount}
                              </p>
                            </div>
                          </div>

                          {/* Warning Badges */}
                          <div className="flex gap-2">
                            {student.metrics.is_vm_detected && (
                              <span className="px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1 font-medium">
                                <Monitor className="w-3 h-3" />
                                VM
                              </span>
                            )}
                            {student.metrics.multi_monitor_detected && (
                              <span className="px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1 font-medium">
                                <Monitor className="w-3 h-3" />
                                Multi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Metrics */}
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-6 gap-4 text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Lock className="w-3 h-3" />
                          <span>Locks:</span>
                          <span className="text-gray-900 font-semibold">
                            {student.metrics.total_screen_locks}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="w-3 h-3" />
                          <span>Blur:</span>
                          <span className="text-gray-900 font-semibold">
                            {student.metrics.total_window_blur_events}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Copy className="w-3 h-3" />
                          <span>Copy:</span>
                          <span className="text-gray-900 font-semibold">
                            {student.metrics.copy_attempts}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Copy className="w-3 h-3" />
                          <span>Paste:</span>
                          <span className="text-gray-900 font-semibold">
                            {student.metrics.paste_attempts}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <ZoomIn className="w-3 h-3" />
                          <span>Zoom:</span>
                          <span className="text-gray-900 font-semibold">
                            {student.metrics.zoom_changes}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Activity className="w-3 h-3" />
                          <span>Events:</span>
                          <span className="text-gray-900 font-semibold">
                            {student.recentEvents.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Student Details Panel */}
          {selectedStudent && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Student Details: {selectedStudent.submission.student_name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Comprehensive activity report and violations
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* System Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-600" />
                    System Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Email</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedStudent.submission.student_email}
                      </p>
                    </div>
                    {selectedStudent.submission.roll_number && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">Roll Number</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedStudent.submission.roll_number}
                        </p>
                      </div>
                    )}
                    {selectedStudent.submission.ip_address && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">IP Address</p>
                        <p className="text-sm text-gray-900 font-mono font-medium">
                          {selectedStudent.submission.ip_address}
                        </p>
                      </div>
                    )}
                    {selectedStudent.systemInfo.appVersion && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">App Version</p>
                        <p className="text-sm text-gray-900 font-medium">
                          v{selectedStudent.systemInfo.appVersion}
                        </p>
                      </div>
                    )}
                    {selectedStudent.systemInfo.osPlatform && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">OS Platform</p>
                        <p className="text-sm text-gray-900 font-medium capitalize">
                          {selectedStudent.systemInfo.osPlatform === 'win32'
                            ? 'Windows'
                            : selectedStudent.systemInfo.osPlatform === 'darwin'
                            ? 'macOS'
                            : selectedStudent.systemInfo.osPlatform}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Monitors</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedStudent.systemInfo.monitorCount} Display
                        {selectedStudent.systemInfo.monitorCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Virtual Machine</p>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          selectedStudent.systemInfo.isVm
                            ? 'text-red-600'
                            : 'text-green-600'
                        )}
                      >
                        {selectedStudent.systemInfo.isVm
                          ? 'Detected'
                          : 'Not Detected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Started At</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedStudent.submission.started_at 
                          ? new Date(selectedStudent.submission.started_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedStudent.systemInfo.isVm && selectedStudent.systemInfo.vmDetails && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-xs text-gray-600 mb-1 font-medium">VM Details</p>
                        <p className="text-sm font-medium text-red-600">
                          {selectedStudent.systemInfo.vmDetails}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Violations */}
                {selectedStudent.violations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Violations ({selectedStudent.violations.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedStudent.violations.map((violation) => (
                        <div
                          key={violation.id}
                          className="p-4 border-2 border-red-200 bg-red-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded text-xs border font-medium",
                                  violation.violation_severity === 'critical'
                                    ? 'bg-red-600 text-white border-red-700'
                                    : 'bg-orange-100 text-orange-700 border-orange-300'
                                )}
                              >
                                {getViolationTypeLabel(violation.violation_type)}
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs border border-red-300 font-medium">
                                {violation.violation_severity.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-red-600 font-medium">
                              {new Date(
                                violation.violation_timestamp
                              ).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-red-800 font-semibold">
                            {violation.violation_message}
                          </p>
                          {violation.violation_details && (
                            <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                              <strong>Details:</strong> {JSON.stringify(violation.violation_details, null, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Events */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Recent Events
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {selectedStudent.recentEvents.length === 0 ? (
                      <p className="text-center text-gray-600 py-8 text-sm">
                        No events recorded
                      </p>
                    ) : (
                      selectedStudent.recentEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                event.severity === 'critical'
                                  ? 'bg-red-600 text-white'
                                  : event.severity === 'warning'
                                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                              )}
                            >
                              {getEventTypeLabel(event.event_type)}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(event.event_timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {event.event_message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
