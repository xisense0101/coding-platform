import winston from 'winston'
import { isDevelopment, isProduction } from '@/core/config'

/**
 * Custom log levels
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
}

// Add colors to winston
winston.addColors(customLevels.colors)

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
)

/**
 * Custom format for file output (JSON)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

/**
 * Create transports based on environment
 */
const transports: winston.transport[] = []

// Always add console transport
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
)

// Add file transports in production
if (isProduction()) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    })
  )
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    })
  )
}

/**
 * Create winston logger instance
 */
const winstonLogger = winston.createLogger({
  level: isDevelopment() ? 'debug' : 'info',
  levels: customLevels.levels,
  transports,
  exitOnError: false,
})

/**
 * Logger interface matching the old logger
 */
export interface Logger {
  log(message: string, ...meta: unknown[]): void
  info(message: string, ...meta: unknown[]): void
  warn(message: string, ...meta: unknown[]): void
  error(message: string, error?: unknown): void
  debug(message: string, ...meta: unknown[]): void
  http(message: string, ...meta: unknown[]): void
}

/**
 * Structured logger with correlation ID support
 */
class StructuredLogger implements Logger {
  private correlationId?: string

  constructor(correlationId?: string) {
    this.correlationId = correlationId
  }

  private formatMessage(message: string, meta?: unknown[]): string {
    const parts = [message]
    if (this.correlationId) {
      parts.unshift(`[${this.correlationId}]`)
    }
    if (meta && meta.length > 0) {
      parts.push(JSON.stringify(meta))
    }
    return parts.join(' ')
  }

  log(message: string, ...meta: unknown[]): void {
    winstonLogger.info(this.formatMessage(message, meta))
  }

  info(message: string, ...meta: unknown[]): void {
    winstonLogger.info(this.formatMessage(message, meta))
  }

  warn(message: string, ...meta: unknown[]): void {
    winstonLogger.warn(this.formatMessage(message, meta))
  }

  error(message: string, error?: unknown): void {
    const errorInfo = error instanceof Error ? { message: error.message, stack: error.stack } : error
    winstonLogger.error(this.formatMessage(message, errorInfo ? [errorInfo] : []))
  }

  debug(message: string, ...meta: unknown[]): void {
    winstonLogger.debug(this.formatMessage(message, meta))
  }

  http(message: string, ...meta: unknown[]): void {
    winstonLogger.http(this.formatMessage(message, meta))
  }

  /**
   * Create a child logger with correlation ID
   */
  child(correlationId: string): StructuredLogger {
    return new StructuredLogger(correlationId)
  }
}

/**
 * Default logger instance
 */
export const logger = new StructuredLogger()

/**
 * Create a logger with correlation ID
 */
export function createLogger(correlationId: string): StructuredLogger {
  return new StructuredLogger(correlationId)
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}
