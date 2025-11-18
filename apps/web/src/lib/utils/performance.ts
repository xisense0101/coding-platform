/**
 * Performance monitoring utilities
 * Lightweight helpers for measuring and logging performance metrics in development
 */

/**
 * Measure the execution time of a function
 * Only logs in development mode
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  threshold: number = 5
): T {
  if (process.env.NODE_ENV !== 'development') {
    return fn()
  }

  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const duration = end - start

  if (duration > threshold) {
    console.warn(
      `⚠️ Performance: "${name}" took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
    )
  } else {
    console.log(`✓ Performance: "${name}" completed in ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Measure the execution time of an async function
 * Only logs in development mode
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  threshold: number = 100
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return fn()
  }

  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start

  if (duration > threshold) {
    console.warn(
      `⚠️ Performance: "${name}" took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
    )
  } else {
    console.log(`✓ Performance: "${name}" completed in ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Create a performance mark for measuring between points
 */
export function markPerformance(name: string) {
  if (process.env.NODE_ENV !== 'development') return

  performance.mark(name)
}

/**
 * Measure the time between two performance marks
 */
export function measureBetweenMarks(
  measureName: string,
  startMark: string,
  endMark: string,
  threshold: number = 100
) {
  if (process.env.NODE_ENV !== 'development') return

  try {
    performance.measure(measureName, startMark, endMark)
    const measure = performance.getEntriesByName(measureName)[0]
    
    if (measure.duration > threshold) {
      console.warn(
        `⚠️ Performance: "${measureName}" took ${measure.duration.toFixed(2)}ms (threshold: ${threshold}ms)`
      )
    } else {
      console.log(`✓ Performance: "${measureName}" completed in ${measure.duration.toFixed(2)}ms`)
    }

    // Clean up marks and measures
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
  } catch (error) {
    console.error(`Failed to measure performance between ${startMark} and ${endMark}:`, error)
  }
}

/**
 * Log component render time (use with React Profiler)
 */
export function logRenderTime(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (process.env.NODE_ENV !== 'development') return

  const threshold = phase === 'mount' ? 16 : 8 // 16ms for mount, 8ms for updates

  if (actualDuration > threshold) {
    console.warn(
      `⚠️ Render: "${id}" (${phase}) took ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`
    )
  }
}

/**
 * Measure bundle size impact of imports
 * This is a placeholder that helps document expensive imports
 */
export function logImportSize(componentName: string, estimatedSize: string) {
  if (process.env.NODE_ENV !== 'development') return
  
  console.log(`📦 Import: "${componentName}" (~${estimatedSize})`)
}
