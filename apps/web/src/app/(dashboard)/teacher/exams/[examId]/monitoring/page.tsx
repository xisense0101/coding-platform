"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertTriangle, 
  Eye, 
  Activity, 
  Users, 
  Flag, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Lock,
  Copy,
  ZoomIn,
  Monitor,
  ArrowLeft,
  MessageSquare,
  Star
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

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch(`/api/exam/monitoring/live/${params.examId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data')
      }

      const data = await response.json()
      setMonitoringData(data)
      setError(null)
    } catch (err: any) {
      logger.error('Error fetching monitoring data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
  }, [params.examId])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMonitoringData()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'text-blue-600' : 'text-green-600'
  }

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
      'multi_monitor_detected': 'Multiple Monitors Detected',
      'vm_detected': 'Virtual Machine Detected',
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

  const getViolationIcon = (violationType: string) => {
    switch (violationType) {
      case 'forbidden_process_detected':
      case 'unauthorized_application':
        return '🚫'
      case 'multi_monitor_usage':
        return '🖥️'
      case 'prolonged_screen_lock':
        return '🔒'
      case 'excessive_tab_switching':
      case 'window_blur':
        return '↔️'
      case 'vm_usage_detected':
        return '💻'
      case 'recording_failure':
      case 'monitoring_app_failure':
        return '⚠️'
      case 'copy_paste_detected':
        return '📋'
      default:
        return '⚠️'
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={fetchMonitoringData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!monitoringData) return null

  const { students, summary } = monitoringData

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Live Exam Monitoring</h1>
              <p className="text-slate-600">Real-time student activity and violations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/teacher/exams/${params.examId}/feedback`)}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View Feedback
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMonitoringData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Total Students</p>
                  <p className="text-2xl font-bold text-slate-900">{summary.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{summary.activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.completedStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-slate-600">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">{summary.flaggedStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">High Risk</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.highRiskStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Violations</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.totalViolations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Last Update</p>
                  <p className="text-xs font-semibold text-slate-900">
                    {new Date(monitoringData.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Activity Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No students have started the exam yet</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <Card
                      key={student.submission.id}
                      className={cn(
                        "border-2 cursor-pointer transition-all hover:shadow-md",
                        selectedStudent?.submission.id === student.submission.id && "border-sky-500",
                        student.metrics.is_flagged_for_review && "border-red-200 bg-red-50"
                      )}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {student.submission.student_name}
                              </h3>
                              {student.submission.roll_number && (
                                <Badge variant="outline">
                                  {student.submission.roll_number}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline"
                                className={getStatusColor(student.status)}
                              >
                                {student.status === 'completed' ? 'Completed' : 'In Progress'}
                              </Badge>
                              {student.metrics.is_flagged_for_review && (
                                <Badge variant="destructive">
                                  <Flag className="h-3 w-3 mr-1" />
                                  Flagged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{student.submission.student_email}</p>
                            <div className="flex gap-3 mt-1 text-xs text-slate-500">
                              {student.submission.ip_address && (
                                <span>IP: {student.submission.ip_address}</span>
                              )}
                              {student.systemInfo.appVersion && (
                                <span>App: v{student.systemInfo.appVersion}</span>
                              )}
                              {student.systemInfo.osPlatform && (
                                <span className="capitalize">
                                  Device: {student.systemInfo.osPlatform === 'win32' ? 'Windows' : 
                                          student.systemInfo.osPlatform === 'darwin' ? 'macOS' : 
                                          student.systemInfo.osPlatform === 'linux' ? 'Linux' : 
                                          student.systemInfo.osPlatform}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Risk Score */}
                            <div className="text-center">
                              <p className="text-xs text-slate-600 mb-1">Risk Score</p>
                              <Badge className={cn("text-lg font-bold", getRiskColor(student.riskLevel))}>
                                {student.metrics.risk_score.toFixed(0)}
                              </Badge>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Tab Out</p>
                                <p className={cn(
                                  "text-lg font-bold",
                                  student.metrics.total_tab_switches >= 3 ? "text-red-600" : "text-orange-600"
                                )}>
                                  {student.metrics.total_tab_switches}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Tab In</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {student.metrics.total_tab_switches_in || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Violations</p>
                                <p className="text-lg font-bold text-orange-600">
                                  {student.violationCount}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Flags</p>
                                <p className="text-lg font-bold text-red-600">
                                  {student.flagCount}
                                </p>
                              </div>
                            </div>

                            {/* Warnings */}
                            <div className="flex gap-2">
                              {student.metrics.is_vm_detected && (
                                <Badge variant="destructive" className="text-xs">
                                  <Monitor className="h-3 w-3 mr-1" />
                                  VM
                                </Badge>
                              )}
                              {student.metrics.multi_monitor_detected && (
                                <Badge variant="destructive" className="text-xs">
                                  <Monitor className="h-3 w-3 mr-1" />
                                  Multi
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Metrics Row */}
                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-6 gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">Screen Locks:</span>
                            <span className="font-semibold">{student.metrics.total_screen_locks}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">Focus Lost:</span>
                            <span className="font-semibold">{student.metrics.total_window_blur_events}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Copy className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">Copy:</span>
                            <span className="font-semibold">{student.metrics.copy_attempts}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Copy className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">Paste:</span>
                            <span className="font-semibold">{student.metrics.paste_attempts}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ZoomIn className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">Zoom:</span>
                            <span className="font-semibold">{student.metrics.zoom_changes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">Events:</span>
                            <span className="font-semibold">{student.recentEvents.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Student Detail Panel */}
        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Student Details: {selectedStudent.submission.student_name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* System Information */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Email</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedStudent.submission.student_email}
                      </p>
                    </div>
                    {selectedStudent.submission.roll_number && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Roll Number</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedStudent.submission.roll_number}
                        </p>
                      </div>
                    )}
                    {selectedStudent.submission.student_section && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Section</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedStudent.submission.student_section}
                        </p>
                      </div>
                    )}
                    {selectedStudent.submission.ip_address && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">IP Address</p>
                        <p className="text-sm font-medium text-slate-900 font-mono">
                          {selectedStudent.submission.ip_address}
                        </p>
                      </div>
                    )}
                    {selectedStudent.systemInfo.appVersion && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">App Version</p>
                        <p className="text-sm font-medium text-slate-900">
                          v{selectedStudent.systemInfo.appVersion}
                        </p>
                      </div>
                    )}
                    {selectedStudent.systemInfo.osPlatform && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Operating System</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedStudent.systemInfo.osPlatform === 'win32' ? 'Windows' : 
                           selectedStudent.systemInfo.osPlatform === 'darwin' ? 'macOS' : 
                           selectedStudent.systemInfo.osPlatform === 'linux' ? 'Linux' : 
                           selectedStudent.systemInfo.osPlatform}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Monitor Count</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedStudent.systemInfo.monitorCount} {selectedStudent.systemInfo.monitorCount === 1 ? 'Display' : 'Displays'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Virtual Machine</p>
                      <p className={cn("text-sm font-medium", selectedStudent.systemInfo.isVm ? "text-red-600" : "text-green-600")}>
                        {selectedStudent.systemInfo.isVm ? 'Detected' : 'Not Detected'}
                      </p>
                    </div>
                    {selectedStudent.systemInfo.isVm && selectedStudent.systemInfo.vmDetails && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs text-slate-600 mb-1">VM Details</p>
                        <p className="text-sm font-medium text-red-600">
                          {selectedStudent.systemInfo.vmDetails}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Exam Started</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedStudent.submission.started_at 
                          ? new Date(selectedStudent.submission.started_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedStudent.submission.submitted_at && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Exam Submitted</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(selectedStudent.submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Violation Summary */}
                {selectedStudent.violations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Violation Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(
                        selectedStudent.violations.reduce((acc: any, violation: any) => {
                          const type = violation.violation_type
                          acc[type] = (acc[type] || 0) + 1
                          return acc
                        }, {})
                      ).map(([type, count]) => (
                        <div key={type} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{getViolationIcon(type)}</span>
                            <p className="text-xs font-semibold text-red-800">
                              {getViolationTypeLabel(type)}
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-red-600">{count as number}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Recent Events</h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {selectedStudent.recentEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="p-3 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant={
                                event.severity === 'critical' ? 'destructive' :
                                event.severity === 'warning' ? 'default' : 'secondary'
                              }
                            >
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            <span className="text-xs text-slate-600">
                              {new Date(event.event_timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{event.event_message}</p>
                        </div>
                      ))}
                      {selectedStudent.recentEvents.length === 0 && (
                        <p className="text-center text-slate-600 py-8">No events recorded</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {selectedStudent.violations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Violations ({selectedStudent.violations.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedStudent.violations.map((violation: any) => (
                        <div
                          key={violation.id}
                          className="p-4 border-2 border-red-200 bg-red-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getViolationIcon(violation.violation_type)}</span>
                              <Badge variant="destructive" className="text-sm">
                                {getViolationTypeLabel(violation.violation_type)}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  violation.violation_severity === 'critical' ? "border-red-600 text-red-600" :
                                  violation.violation_severity === 'warning' ? "border-orange-600 text-orange-600" :
                                  "border-yellow-600 text-yellow-600"
                                )}
                              >
                                {violation.violation_severity.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-xs text-red-600 font-medium">
                              {new Date(violation.violation_timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-red-800 font-semibold">{violation.violation_message}</p>
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
