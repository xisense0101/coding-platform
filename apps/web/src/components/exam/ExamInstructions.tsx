"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

export function ExamInstructions({ onStart }: { onStart: () => Promise<void> }) {
  const [isStarting, setIsStarting] = useState(false)
  
  const handleStart = async () => {
    try {
      logger.log('📋 Instructions: Start button clicked')
      setIsStarting(true)
      await onStart()
      logger.log('📋 Instructions: onStart completed successfully')
      // Don't reset isStarting here - the component will unmount when exam starts
    } catch (error) {
      logger.error('❌ Instructions: Error during start:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to start exam: ${errorMessage}`)
      setIsStarting(false)
    }
  }
  
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full border-gray-200 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-sky-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Programming Exam</h1>
            <p className="text-gray-600">Please read the instructions carefully before starting</p>
          </div>

          <div className="space-y-6 text-gray-800">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900">Exam Structure</h3>
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
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3 disabled:opacity-50 shadow-md"
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
