/**
 * Logger utility that respects NODE_ENV
 * Disables console logging in production for better performance
 */

const isProduction = process.env.NODE_ENV === 'production'

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args)
    }
  },
  
  warn: (...args: any[]) => {
    // Always show warnings, even in production
    console.warn(...args)
  },
  
  error: (...args: any[]) => {
    // Always show errors, even in production
    console.error(...args)
  },
  
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args)
    }
  },
  
  table: (...args: any[]) => {
    if (!isProduction) {
      console.table(...args)
    }
  },
  
  group: (label: string) => {
    if (!isProduction) {
      console.group(label)
    }
  },
  
  groupEnd: () => {
    if (!isProduction) {
      console.groupEnd()
    }
  }
}

// Helper to measure performance
export const measurePerformance = (label: string, fn: () => void) => {
  if (!isProduction) {
    const start = performance.now()
    fn()
    const end = performance.now()
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`)
  } else {
    fn()
  }
}

// Helper for conditional logging
export const conditionalLog = (condition: boolean, ...args: any[]) => {
  if (!isProduction && condition) {
    console.log(...args)
  }
}
