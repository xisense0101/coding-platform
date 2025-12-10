"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInSeconds, format } from 'date-fns'
import { Loader2, Clock, Calendar, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface WaitingRoomProps {
  exam: {
    title: string
    start_time: string
    slug: string
  }
  onExamStart: () => void
}

export function WaitingRoom({ exam, onExamStart }: WaitingRoomProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const startTime = new Date(exam.start_time)
      const diff = differenceInSeconds(startTime, now)
      
      if (diff <= 0) {
        onExamStart()
        return 0
      }
      return diff
    }

    // Initial check
    const initialDiff = calculateTimeLeft()
    setTimeLeft(initialDiff)

    const timer = setInterval(() => {
      const diff = calculateTimeLeft()
      setTimeLeft(diff)
    }, 1000)

    return () => clearInterval(timer)
  }, [exam, onExamStart])

  if (timeLeft === null) return null

  const startTime = new Date(exam.start_time)
  const minutesUntilStart = timeLeft / 60

  // If more than 30 minutes before start
  if (minutesUntilStart > 30) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
            <CardDescription>This exam has not started yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Scheduled Start</AlertTitle>
              <AlertDescription>
                {format(startTime, "PPP 'at' p")}
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm text-muted-foreground">
              Please return to this page 30 minutes before the exam starts.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Waiting room (<= 30 mins)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          <CardDescription>Waiting Room</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">The exam will start in</p>
            <div className="text-4xl font-bold font-mono text-primary">
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">Instructions</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              Do not close this page. You will be automatically redirected to the exam when the timer reaches zero.
            </AlertDescription>
          </Alert>

          <div className="text-xs text-center text-muted-foreground">
            Scheduled: {format(startTime, "PPP 'at' p")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
