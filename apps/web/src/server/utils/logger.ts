/**
 * Enhanced structured logger using Pino
 * Supports request IDs, contextual logging, and structured data
 */

import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Configure Pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Use pretty printing in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss',
        },
      }
    : undefined,
  // In production, use structured JSON logging
  formatters: isProduction
    ? {
        level: (label) => {
          return { level: label }
        },
      }
    : undefined,
  // Base fields to include in all logs
  base: {
    env: process.env.NODE_ENV,
  },
})

/**
 * Create a child logger with request context
 * @param requestId - Unique request identifier
 * @param additionalContext - Additional context to include in logs
 */
export function createRequestLogger(
  requestId: string,
  additionalContext?: Record<string, unknown>
) {
  return logger.child({
    requestId,
    ...additionalContext,
  })
}

/**
 * Generate a unique request ID
 * Tries to use X-Request-ID header if present, otherwise generates a new one
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extract request ID from headers or generate a new one
 * @param headers - Request headers
 */
export function getRequestId(headers: Headers): string {
  return headers.get('x-request-id') || generateRequestId()
}

/**
 * Log duration of an operation
 * @param logger - Logger instance
 * @param operation - Name of the operation
 * @param startTime - Start time in milliseconds
 */
export function logDuration(
  logger: pino.Logger,
  operation: string,
  startTime: number
) {
  const duration = Date.now() - startTime
  logger.info({ operation, duration }, `${operation} completed in ${duration}ms`)
}

export default logger
