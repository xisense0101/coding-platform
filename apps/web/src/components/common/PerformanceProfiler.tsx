'use client'

import { Profiler, ProfilerOnRenderCallback, ReactNode } from 'react'
import { logRenderTime } from '@/lib/utils/performance'

interface PerformanceProfilerProps {
  id: string
  children: ReactNode
}

/**
 * Wrapper component for React Profiler that logs render performance in development
 * 
 * Usage:
 * <PerformanceProfiler id="MyComponent">
 *   <MyComponent />
 * </PerformanceProfiler>
 */
export function PerformanceProfiler({ id, children }: PerformanceProfilerProps) {
  // Only profile in development
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    logRenderTime(id, phase, actualDuration, baseDuration, startTime, commitTime)
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}
