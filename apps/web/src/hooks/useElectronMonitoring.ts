import { useEffect, useRef, useCallback, useState } from 'react'
import { logger } from '@/lib/utils/logger'

// Type definitions for Electron API
interface ElectronAPI {
  getAppVersion: () => string
  checkIfVM: () => Promise<{ isVM: boolean; details: string }>
  getAppPath: () => string
  getCloseInstructions: () => string
  sendToMain: (channel: string, data: any) => void
  receiveFromMain: (channel: string, callback: (data: any) => void) => void
  openUrl: (url: string) => void
  retryPageReload: () => void
  quitApp?: () => void  // Optional quit method if available
}

declare global {
  interface Window {
    api?: ElectronAPI
  }
}

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
}

export function useElectronMonitoring(options: MonitoringOptions) {
  const {
    submissionId,
    examId,
    studentId,
    onViolation,
    onMetricsUpdate,
    autoLogEvents = true
  } = options

  const [isElectronApp, setIsElectronApp] = useState(false)
  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [isVM, setIsVM] = useState(false)
  const [metrics, setMetrics] = useState<MonitoringMetrics>({
    tabSwitchesOut: 0,
    tabSwitchesIn: 0,
    screenLocks: 0,
    windowBlurs: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    zoomChanges: 0,
    riskScore: 0
  })

  const metricsRef = useRef(metrics)
  metricsRef.current = metrics

  // Check if running in Electron app
  useEffect(() => {
    const checkElectron = () => {
      const isElectron = 
        typeof window !== 'undefined' && 
        (window.api !== undefined || localStorage.getItem('electronApp') === 'true')
      
      setIsElectronApp(isElectron)

      if (isElectron && window.api) {
        // Get app version
        try {
          const version = window.api.getAppVersion()
          setAppVersion(version)
          logger.log('🖥️ Running in Electron app version:', version)
        } catch (e) {
          logger.error('Error getting app version:', e)
        }

        // Check VM
        window.api.checkIfVM().then(result => {
          setIsVM(result.isVM)
          if (result.isVM) {
            logger.warn('⚠️ VM detected:', result.details)
            logEvent('vm_detected', {
              severity: 'critical',
              details: result.details
            })
          }
        }).catch(e => {
          logger.error('Error checking VM:', e)
        })
      }
    }

    checkElectron()
  }, [])

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

      const response = await fetch('/api/exam/monitoring/log-event', {
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
          appVersion,
          osPlatform: navigator.platform,
          isVm: isVM,
          vmDetails: additionalData.details,
          durationMs: additionalData.duration
        })
      })

      if (!response.ok) {
        logger.error('Failed to log event:', eventType)
      }
    } catch (error) {
      logger.error('Error logging event:', error)
    }
  }, [submissionId, examId, studentId, appVersion, isVM, autoLogEvents])

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
        // Only trigger UI if not skipped, OR if termination is required (always show termination)
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

  // Update metrics
  const updateMetrics = useCallback((update: Partial<MonitoringMetrics>) => {
    setMetrics(prev => {
      const newMetrics = { ...prev, ...update }
      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics)
      }
      return newMetrics
    })
  }, [onMetricsUpdate])

  // Track processed violations to prevent loops
  const processedViolationsRef = useRef<Set<string>>(new Set())
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Store handler references to prevent duplicate event listener registration
  const handlersRegisteredRef = useRef(false)

  // Setup Electron event listeners
  useEffect(() => {
    if (!isElectronApp || !window.api) return
    
    // Prevent duplicate registration - handlers are stable and don't need to be re-registered
    if (handlersRegisteredRef.current) {
      return
    }

    // Helper function to check if we should log events
    const shouldLogEvents = (): boolean => {
      // Don't log if exam is not active (no submissionId)
      if (!submissionId) {
        return false
      }

      // Check if we're on feedback page or completion page
      const currentPath = window.location.pathname
      if (currentPath.includes('/feedback') || 
          currentPath.includes('/completed') || 
          currentPath.includes('/thank-you') ||
          currentPath.includes('/submission-success')) {
        logger.log('⏸️ Monitoring paused: User on feedback/completion page')
        return false
      }

      return true
    }

    // ====== DEFINE ALL HANDLERS AS NAMED FUNCTIONS FIRST ======
    
    // Tab switched out (user left exam window)
    const handleTabSwitchedOut = (message: any) => {
      if (!shouldLogEvents()) return
      
      const currentCount = metricsRef.current.tabSwitchesOut + 1
      logger.warn('🔴 Tab switched out:', message, 'Count:', currentCount)
      
      updateMetrics({ 
        tabSwitchesOut: currentCount
      })

      logEvent('tab_switched_out', {
        category: 'navigation',
        severity: 'warning',
        message: 'User switched away from exam window'
      })

      // Create unique violation key to prevent duplicates
      const violationKey = `tab_switch_${currentCount}`
      
      // Only log violation if not already processed
      if (!processedViolationsRef.current.has(violationKey)) {
        processedViolationsRef.current.add(violationKey)
        
        // Show immediate warning for tab switch
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
          { message, count: currentCount },
          true // Skip UI since we already showed it
        )

        // Clear old processed violations after 10 seconds
        if (violationTimeoutRef.current) {
          clearTimeout(violationTimeoutRef.current)
        }
        violationTimeoutRef.current = setTimeout(() => {
          processedViolationsRef.current.clear()
        }, 10000)
      }
    }

    // Tab switched in (user returned to exam)
    const handleTabSwitchedIn = (message: any) => {
      if (!shouldLogEvents()) return
      
      const currentCount = metricsRef.current.tabSwitchesIn + 1
      logger.log('🟢 Tab switched in:', message, 'Count:', currentCount)
      
      updateMetrics({ 
        tabSwitchesIn: currentCount
      })
      
      logEvent('tab_switched_in', {
        category: 'navigation',
        severity: 'info',
        message: 'User returned to exam window'
      })
    }

    // Window blur (lost focus)
    const handleWindowBlur = () => {
      if (!shouldLogEvents()) return
      
      logger.warn('⚠️ Window blur detected')
      
      updateMetrics({ 
        windowBlurs: metricsRef.current.windowBlurs + 1 
      })

      logEvent('window_blur', {
        category: 'navigation',
        severity: 'warning'
      })
    }

    // Window focus (gained focus)
    const handleWindowFocus = () => {
      if (!shouldLogEvents()) return
      
      logEvent('window_focus', {
        category: 'navigation',
        severity: 'info'
      })
    }

    // Screen locked
    const handleScreenLock = (lockedAtTimestamp: number) => {
      if (!shouldLogEvents()) return
      
      const lockDuration = Date.now() - lockedAtTimestamp
      logger.warn('🔒 Screen was locked for:', lockDuration, 'ms')
      
      updateMetrics({ 
        screenLocks: metricsRef.current.screenLocks + 1 
      })

      logEvent('screen_locked', {
        category: 'system',
        severity: lockDuration > 30000 ? 'critical' : 'warning',
        duration: lockDuration,
        message: `Screen locked for ${Math.round(lockDuration / 1000)} seconds`
      })

      if (lockDuration > 30000) { // More than 30 seconds
        logViolation(
          'prolonged_screen_lock',
          `Screen locked for ${Math.round(lockDuration / 1000)} seconds`,
          'high',
          { duration: lockDuration }
        )
      }
    }

    // Screen unlocked
    const handleScreenUnlock = () => {
      if (!shouldLogEvents()) return
      
      logger.log('🔓 Screen unlocked')
      
      logEvent('screen_unlocked', {
        category: 'system',
        severity: 'info'
      })
    }

    // Strict mode lock (multiple monitors, etc.)
    const handleStrictModeLock = (isLocked: boolean) => {
      if (!shouldLogEvents()) return
      
      if (isLocked) {
        logger.error('❌ Strict mode lock activated')
        
        logEvent('multi_monitor_detected', {
          category: 'security',
          severity: 'critical',
          message: 'Multiple monitors detected'
        })

        logViolation(
          'multi_monitor_usage',
          'Multiple monitors detected - exam cannot proceed',
          'critical',
          { isLocked }
        )
      }
    }

    // Monitor not working (macOS)
    const handleMonitorNotWorking = () => {
      if (!shouldLogEvents()) return
      
      logger.error('❌ Monitoring not working')
      
      logEvent('suspicious_activity', {
        category: 'security',
        severity: 'critical',
        message: 'Monitoring system not functioning'
      })
    }

    // Window load failed
    const handleWindowLoadFailed = () => {
      if (!shouldLogEvents()) return
      
      logger.error('❌ Window load failed')
      
      logEvent('network_disconnected', {
        category: 'network',
        severity: 'warning',
        message: 'Failed to load exam page'
      })
    }

    // ====== REGISTER ALL HANDLERS ======
    
    window.api.receiveFromMain('tab-switched-out', handleTabSwitchedOut)
    window.api.receiveFromMain('tab-switched-in', handleTabSwitchedIn)
    window.api.receiveFromMain('window-blur', handleWindowBlur)
    window.api.receiveFromMain('window-focus', handleWindowFocus)
    window.api.receiveFromMain('lock-screen-event', handleScreenLock)
    window.api.receiveFromMain('unlock-screen-event', handleScreenUnlock)
    window.api.receiveFromMain('electron-strict-mode-lock', handleStrictModeLock)
    window.api.receiveFromMain('monitor-not-working', handleMonitorNotWorking)
    window.api.receiveFromMain('window-load-failed', handleWindowLoadFailed)
    
    // Mark handlers as registered (prevents re-registration on re-renders)
    handlersRegisteredRef.current = true

    // Notify app that quiz has started
    if (submissionId) {
      window.api.sendToMain('quiz-status', 'started')
      window.api.sendToMain('quizId', examId)
      window.api.sendToMain('change-closeable-state', false)
      
      logEvent('exam_started', {
        category: 'navigation',
        severity: 'info',
        message: 'Exam started'
      })
    }

    // Cleanup function
    return () => {
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current)
      }
      // Reset flag on unmount
      handlersRegisteredRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectronApp, submissionId, examId])

  // Track copy/paste attempts
  useEffect(() => {
    if (!isElectronApp || !autoLogEvents) return

    const handleCopy = (e: ClipboardEvent) => {
      logger.warn('📋 Copy attempt detected')
      
      updateMetrics({ 
        copyAttempts: metricsRef.current.copyAttempts + 1 
      })

      logEvent('copy_attempt', {
        category: 'input',
        severity: 'warning',
        message: 'Copy attempt detected'
      })

      logViolation(
        'copy_paste_attempt',
        'Copy attempt detected',
        'medium'
      )
    }

    const handlePaste = (e: ClipboardEvent) => {
      logger.warn('📋 Paste attempt detected')
      
      updateMetrics({ 
        pasteAttempts: metricsRef.current.pasteAttempts + 1 
      })

      logEvent('paste_attempt', {
        category: 'input',
        severity: 'warning',
        message: 'Paste attempt detected'
      })

      logViolation(
        'copy_paste_attempt',
        'Paste attempt detected',
        'medium'
      )
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectronApp, autoLogEvents])

  // Notify app when exam ends
  const notifyExamComplete = useCallback(() => {
    if (!isElectronApp || !window.api) return

    logger.log('🏁 Notifying Electron app that exam is complete')
    
    window.api.sendToMain('quiz-status', 'ended')
    window.api.sendToMain('change-closeable-state', true)
    
    logEvent('exam_submitted', {
      category: 'navigation',
      severity: 'info',
      message: 'Exam submitted successfully'
    })
  }, [isElectronApp, logEvent])

  // Manual close function for button - navigates to /exam/completed
  const closeElectronApp = useCallback(() => {
    if (!isElectronApp || !window.api) return
    
    logger.log('🚪 Manual close requested - navigating to completion page')
    
    // Navigate to /exam/completed which triggers:
    // 1. did-navigate handler: sets programManger.strictMode = false
    // 2. This enables windowClosable = true
    // 3. window.close() event will then allow app.exit()
    window.location.href = '/exam/completed'
  }, [isElectronApp])

  // Handle zoom changes
  const handleZoomChange = useCallback((delta: number) => {
    if (!isElectronApp || !window.api) return

    window.api.sendToMain('zoom-event', delta)
    
    updateMetrics({ 
      zoomChanges: metricsRef.current.zoomChanges + 1 
    })

    logEvent('zoom_changed', {
      category: 'input',
      severity: 'info',
      message: `Zoom changed by ${delta}%`,
      delta
    })
  }, [isElectronApp, logEvent, updateMetrics])

  return {
    isElectronApp,
    appVersion,
    isVM,
    metrics,
    logEvent,
    logViolation,
    notifyExamComplete,
    closeElectronApp,
    handleZoomChange
  }
}
