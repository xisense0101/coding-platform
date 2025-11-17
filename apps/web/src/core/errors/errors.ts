/**
 * Custom error classes for better error handling and type safety
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    }
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR')
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

/**
 * Conflict error for duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests',
    public retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    }
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', originalError?: unknown) {
    super(message, 500, 'DATABASE_ERROR')
    if (originalError && process.env.NODE_ENV === 'development') {
      this.stack = originalError instanceof Error ? originalError.stack : undefined
    }
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    public originalError?: unknown
  ) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard to check if error is operational (safe to show to user)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}
