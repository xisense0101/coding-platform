/**
 * Standardized response utilities for API routes
 * Provides backward-compatible response helpers
 */

import { NextResponse } from 'next/server'
import { mapErrorToStatus } from './errors'

// Standard response envelope (optional, for new endpoints)
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  requestId?: string
  timestamp?: string
}

/**
 * Create a successful response with standard envelope
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param requestId - Optional request ID for tracing
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }

  if (requestId) {
    response.requestId = requestId
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: requestId ? { 'X-Request-ID': requestId } : undefined,
  })
}

/**
 * Create an error response with standard envelope
 * @param error - Error object or message
 * @param statusCode - HTTP status code (optional, will be inferred from error)
 * @param requestId - Optional request ID for tracing
 */
export function errorResponse(
  error: unknown,
  statusCode?: number,
  requestId?: string
): NextResponse<ApiResponse<never>> {
  const mappedError = mapErrorToStatus(error)
  const finalStatusCode = statusCode || mappedError.statusCode

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: mappedError.code,
      message: mappedError.message,
      details: mappedError.details,
    },
  }

  if (requestId) {
    response.requestId = requestId
  }

  return NextResponse.json(response, {
    status: finalStatusCode,
    headers: requestId ? { 'X-Request-ID': requestId } : undefined,
  })
}

/**
 * Legacy response helpers for backward compatibility
 * These maintain the existing response format used by current consumers
 */

/**
 * Return a success response in legacy format (raw data)
 * Use this for existing endpoints that consumers expect in raw format
 */
export function legacySuccess<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): NextResponse<T> {
  return NextResponse.json(data, {
    status: statusCode,
    headers: requestId ? { 'X-Request-ID': requestId } : undefined,
  })
}

/**
 * Return an error response in legacy format { error: string }
 * Use this for existing endpoints to maintain backward compatibility
 */
export function legacyError(
  message: string,
  statusCode: number = 500,
  requestId?: string
): NextResponse<{ error: string; details?: unknown }> {
  return NextResponse.json(
    { error: message },
    {
      status: statusCode,
      headers: requestId ? { 'X-Request-ID': requestId } : undefined,
    }
  )
}

/**
 * Flexible response helper that can return either envelope or legacy format
 * @param data - Response data
 * @param options - Response options
 */
export function ok<T>(
  data: T,
  options: {
    statusCode?: number
    requestId?: string
    envelope?: boolean // If true, use standard envelope; if false, use legacy format
  } = {}
): NextResponse<T | ApiResponse<T>> {
  const { statusCode = 200, requestId, envelope = false } = options

  if (envelope) {
    return successResponse(data, statusCode, requestId)
  }

  return legacySuccess(data, statusCode, requestId)
}

/**
 * Flexible error helper that can return either envelope or legacy format
 * @param error - Error object or message
 * @param options - Error options
 */
export function fail(
  error: unknown,
  options: {
    statusCode?: number
    requestId?: string
    envelope?: boolean // If true, use standard envelope; if false, use legacy format
  } = {}
): NextResponse<{ error: string } | ApiResponse<never>> {
  const { statusCode, requestId, envelope = false } = options

  if (envelope) {
    return errorResponse(error, statusCode, requestId)
  }

  // For legacy format, extract just the message
  const mappedError = mapErrorToStatus(error)
  return legacyError(
    mappedError.message,
    statusCode || mappedError.statusCode,
    requestId
  )
}

/**
 * Set cache control headers for responses
 */
export function withCacheControl(
  response: NextResponse,
  cacheControl: string
): NextResponse {
  response.headers.set('Cache-Control', cacheControl)
  return response
}

/**
 * Common cache control values
 */
export const CacheControl = {
  noCache: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  short: 'public, max-age=60, s-maxage=60', // 1 minute
  medium: 'public, max-age=300, s-maxage=300', // 5 minutes
  long: 'public, max-age=3600, s-maxage=3600', // 1 hour
}
