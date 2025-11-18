"use client"

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ViolationAlertData {
  id: string
  message: string
  violationCount: number
  shouldTerminate: boolean
  timestamp: number
}

interface ViolationAlertProps {
  violation: ViolationAlertData | null
  onDismiss: () => void
  onTerminate?: () => void
}

export function ViolationAlert({ violation, onDismiss, onTerminate }: ViolationAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progressWidth, setProgressWidth] = useState(100)

  useEffect(() => {
    if (violation) {
      setIsVisible(true)
      setIsExiting(false)
      setProgressWidth(100)
      
      // Start progress bar animation
      requestAnimationFrame(() => {
        setProgressWidth(0)
      })
      
      // Auto-dismiss after 5 seconds if not a termination
      if (!violation.shouldTerminate) {
        const timer = setTimeout(() => {
          handleDismiss()
        }, 5000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [violation])

  if (!violation || !isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 300)
  }

  const handleTerminate = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onTerminate?.()
    }, 300)
  }

  // For termination violations, show blocking modal
  if (violation.shouldTerminate) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-red-500">
          <div className="flex items-start gap-4">
            <div className="rounded-full p-3 bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-red-900">
                Exam Terminated
              </h3>
              
              <p className="text-slate-700 mb-4">
                {violation.message}
              </p>

              <button
                onClick={handleTerminate}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Non-intrusive top dropdown for warnings
  return (
    <div 
      className={cn(
        "fixed top-4 right-4 z-[9999] pointer-events-auto transition-all duration-300 ease-out",
        isExiting ? "opacity-0 translate-y-[-20px]" : "opacity-100 translate-y-0"
      )}
      style={{ maxWidth: '420px' }}
    >
      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-lg shadow-xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-orange-900">
                  Warning #{violation.violationCount}
                </h4>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-orange-600 hover:text-orange-800 transition-colors ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-sm text-orange-800">
                {violation.message}
              </p>
              
              {/* Progress bar showing auto-dismiss */}
              <div className="mt-2 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-[5000ms] ease-linear"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
