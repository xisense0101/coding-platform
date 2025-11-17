import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse, PaginatedData } from '@/core/types'
import { AppError, isAppError } from '@/core/errors'

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Create a paginated success response
 */
export function createPaginatedResponse<T>(
  paginatedData: PaginatedData<T>,
  status: number = 200
): NextResponse<ApiSuccessResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data: paginatedData.items,
      meta: paginatedData.pagination,
    },
    { status }
  )
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): NextResponse<ApiErrorResponse> {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: error.toJSON(),
      },
      { status: error.statusCode }
    )
  }

  // Handle unexpected errors
  const message = error instanceof Error ? error.message : defaultMessage
  const statusCode = 500

  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'INTERNAL_SERVER_ERROR',
        statusCode,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
    },
    { status: statusCode }
  )
}

/**
 * Helper to create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  return { page, limit }
}

/**
 * Calculate offset for database queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}
