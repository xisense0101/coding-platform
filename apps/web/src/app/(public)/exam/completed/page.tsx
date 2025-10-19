"use client"

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

export default function ExamCompletedPage() {
  useEffect(() => {
    logger.log('📝 Exam completed page loaded - Electron will disable strict mode')
    
    // For Electron apps, the did-navigate handler will:
    // 1. Detect /exam/completed URL
    // 2. Set programManger.strictMode = false
    // 3. Enable windowClosable = true
    // 4. Allow the app to close
    
    // After a brief moment, try to close the window
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.api) {
        logger.log('🚪 Attempting to close Electron window')
        // The window should now be closeable since strictMode is disabled
        if (typeof window.close === 'function') {
          window.close()
        }
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-sky-200 shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-sky-900">Exam Completed!</h1>
          <p className="text-sky-700">
            Your exam has been submitted successfully.
          </p>
          <p className="text-sm text-slate-600">
            This window will close automatically...
          </p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-sky-600 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-sky-600 rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-sky-600 rounded-full animate-pulse delay-150" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
