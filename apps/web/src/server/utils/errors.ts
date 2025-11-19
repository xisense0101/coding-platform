/**
 * Standardized error types and utilities for API routes
 * Maps common error types to appropriate HTTP status codes
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Predefined error classes
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', details?: unknown) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details)
    this.name = 'RateLimitError'
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details)
    this.name = 'InternalServerError'
  }
}

/**
 * Map known error types to appropriate HTTP status codes and error responses
 */
export function mapErrorToStatus(error: unknown): {
  statusCode: number
  code: string
  message: string
  details?: unknown
} {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      code: error.code || 'API_ERROR',
      message: error.message,
      details: error.details,
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    const zodError = error as { issues?: Array<{ path: string[]; message: string }> }
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: zodError.issues,
    }
  }

  // Handle database errors (Supabase/PostgreSQL)
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message: string; details?: string }
    
    // Common PostgreSQL error codes
    switch (dbError.code) {
      case '23505': // unique_violation
        return {
          statusCode: 409,
          code: 'CONFLICT',
          message: 'Resource already exists',
          details: dbError.details,
        }
      case '23503': // foreign_key_violation
        return {
          statusCode: 400,
          code: 'INVALID_REFERENCE',
          message: 'Referenced resource does not exist',
          details: dbError.details,
        }
      case '23502': // not_null_violation
        return {
          statusCode: 400,
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Required field is missing',
          details: dbError.details,
        }
      default:
        // Other database errors
        return {
          statusCode: 500,
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        }
    }
  }

  // Default to internal server error
  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : undefined,
  }
}
