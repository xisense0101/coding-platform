import { useEffect, useRef, useCallback, useState } from 'react'
import { logger } from '@/lib/utils/logger'

interface MonitoringMetrics {
  tabSwitchesOut: number
  tabSwitchesIn: number
  screenLocks: number
  windowBlurs: number
  copyAttempts: number
  pasteAttempts: number
  zoomChanges: number
  riskScore: number
}

interface MonitoringOptions {
  submissionId: string | null
  examId: string | null
  studentId: string | null
  onViolation?: (violation: any) => void
  onMetricsUpdate?: (metrics: MonitoringMetrics) => void
  autoLogEvents?: boolean
  isEnabled?: boolean
}

export function useBrowserMonitoring(options: MonitoringOptions) {
  const {
    submissionId,
    examId,
    studentId,
    onViolation,
    onMetricsUpdate,
    autoLogEvents = true,
    isEnabled = true
  } = options

  const storageKey = submissionId ? `browser_monitoring_metrics_${submissionId}` : null

  const [metrics, setMetrics] = useState<MonitoringMetrics>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (e) {
        console.error('Error parsing saved metrics', e)
      }
    }
    return {
      tabSwitchesOut: 0,
      tabSwitchesIn: 0,
      screenLocks: 0,
      windowBlurs: 0,
      copyAttempts: 0,
      pasteAttempts: 0,
      zoomChanges: 0,
      riskScore: 0
    }
  })

  // Update storage key when submissionId changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                setMetrics(JSON.parse(saved))
            } catch (e) {
                // ignore
            }
        }
    }
  }, [storageKey])

  const metricsRef = useRef(metrics)
  metricsRef.current = metrics
  
  // Track processed violations to prevent loops
  const processedViolationsRef = useRef<Set<string>>(new Set())
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Log event to backend
  const logEvent = useCallback(async (
    eventType: string,
    additionalData: any = {}
  ) => {
    if (!submissionId || !examId || !autoLogEvents) return

    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      }

      await fetch('/api/exam/monitoring/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          examId,
          studentId,
          eventType,
          eventMessage: additionalData.message || `Event: ${eventType}`,
          eventCategory: additionalData.category || 'security',
          severity: additionalData.severity || 'info',
          eventData: additionalData,
          browserInfo,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          osPlatform: navigator.platform,
          isVm: false,
          durationMs: additionalData.duration
        })
      })
    } catch (error) {
      logger.error('Error logging event:', error)
    }
  }, [submissionId, examId, studentId, autoLogEvents])

  // Log violation to backend
  const logViolation = useCallback(async (
    violationType: string,
    violationMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    additionalData: any = {},
    skipUi: boolean = false
  ) => {
    if (!submissionId || !examId) return

    try {
      const response = await fetch('/api/exam/monitoring/log-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          examId,
          studentId,
          violationType,
          violationMessage,
          violationSeverity: severity,
          violationDetails: additionalData,
          actionTaken: additionalData.actionTaken || 'logged_only',
          autoDetected: true
        })
      })

      const result = await response.json()
      
      if (result.success) {
        if (onViolation && (!skipUi || result.shouldTerminate)) {
          onViolation({
            type: violationType,
            message: violationMessage,
            severity,
            shouldTerminate: result.shouldTerminate,
            violationCount: result.violationCount
          })
        }
        return result
      }
    } catch (error) {
      logger.error('Error logging violation:', error)
    }
  }, [submissionId, examId, studentId, onViolation])

  // Update metrics helper
  const updateMetrics = useCallback((update: Partial<MonitoringMetrics>) => {
    setMetrics(prev => {
      const newMetrics = { ...prev, ...update }
      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics)
      }
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(newMetrics))
      }
      return newMetrics
    })
  }, [onMetricsUpdate, storageKey])

  useEffect(() => {
    if (!isEnabled) return

    const handleBlur = () => {
        const currentCount = metricsRef.current.tabSwitchesOut + 1
        updateMetrics({ 
            tabSwitchesOut: currentCount,
            windowBlurs: metricsRef.current.windowBlurs + 1
        })
        
        logEvent('tab_switched_out', {
          category: 'navigation',
          severity: 'warning',
          message: 'User switched away from exam window (blur)'
        })

        // Violation logic
        const violationKey = `tab_switch_${currentCount}`
        if (!processedViolationsRef.current.has(violationKey)) {
            processedViolationsRef.current.add(violationKey)
            
            if (onViolation) {
                onViolation({
                    type: 'excessive_tab_switching',
                    message: 'Warning: Tab Switch Detected!',
                    severity: 'medium',
                    shouldTerminate: false,
                    violationCount: currentCount
                })
            }
            
            logViolation(
                'excessive_tab_switching',
                'User switched away from exam window',
                'medium',
                { count: currentCount },
                true
            )

             if (violationTimeoutRef.current) {
                clearTimeout(violationTimeoutRef.current)
            }
            violationTimeoutRef.current = setTimeout(() => {
                processedViolationsRef.current.clear()
            }, 10000)
        }
    }

    const handleFocus = () => {
        const currentCount = metricsRef.current.tabSwitchesIn + 1
        updateMetrics({ tabSwitchesIn: currentCount })
        
        logEvent('tab_switched_in', {
            category: 'navigation',
            severity: 'info',
            message: 'User returned to exam window'
        })
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      if (violationTimeoutRef.current) clearTimeout(violationTimeoutRef.current)
    }
  }, [isEnabled, logEvent, logViolation, onViolation, updateMetrics])

  // Copy/Paste
  useEffect(() => {
      if (!isEnabled) return
      
      const handleCopy = () => {
          updateMetrics({ copyAttempts: metricsRef.current.copyAttempts + 1 })
          logEvent('copy_attempt', { category: 'input', severity: 'warning' })
          logViolation('copy_paste_attempt', 'Copy attempt detected', 'medium')
      }
      
      const handlePaste = () => {
          updateMetrics({ pasteAttempts: metricsRef.current.pasteAttempts + 1 })
          logEvent('paste_attempt', { category: 'input', severity: 'warning' })
          logViolation('copy_paste_attempt', 'Paste attempt detected', 'medium')
      }
      
      document.addEventListener('copy', handleCopy)
      document.addEventListener('paste', handlePaste)
      
      return () => {
          document.removeEventListener('copy', handleCopy)
          document.removeEventListener('paste', handlePaste)
      }
  }, [isEnabled, logEvent, logViolation, updateMetrics])

  return {
    metrics,
    logEvent,
    logViolation
  }
}
