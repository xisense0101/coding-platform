/**
 * API Client - Unified HTTP client with error handling and cancellation support
 * Wraps fetch with common configuration for the app
 */

import { logger } from '@/lib/utils/logger'

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class ApiClientError extends Error {
  status?: number
  code?: string
  details?: any

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
    this.status = error.status
    this.code = error.code
    this.details = error.details
  }
}

export interface FetchOptions extends RequestInit {
  timeout?: number
  params?: Record<string, any>
}

/**
 * Build URL with query parameters
 */
function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params) return url

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * Transform error response to ApiError
 */
async function handleErrorResponse(response: Response): Promise<ApiError> {
  let errorData: any
  
  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      errorData = await response.json()
    } else {
      errorData = await response.text()
    }
  } catch {
    errorData = null
  }

  return {
    message: errorData?.error || errorData?.message || errorData || 'Request failed',
    status: response.status,
    code: errorData?.code,
    details: errorData
  }
}

/**
 * Main fetcher function with timeout and cancellation support
 */
export async function fetcher<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, params, signal: externalSignal, ...fetchOptions } = options

  // Build full URL with params
  const fullUrl = buildUrl(url, params)

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null

  // Combine signals if external signal is provided
  const signal = externalSignal
    ? createCombinedSignal(controller.signal, externalSignal)
    : controller.signal

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    if (timeoutId) clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await handleErrorResponse(response)
      throw new ApiClientError(error)
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }

    // Return text for non-JSON responses
    return (await response.text()) as any
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId)

    // Handle abort
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError({
        message: 'Request was cancelled',
        code: 'CANCELLED',
      })
    }

    // Handle timeout
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new ApiClientError({
        message: 'Request timeout',
        code: 'TIMEOUT',
      })
    }

    // Re-throw ApiClientError
    if (error instanceof ApiClientError) {
      throw error
    }

    // Handle network errors
    if (error instanceof Error) {
      logger.error('API request failed:', error)
      throw new ApiClientError({
        message: error.message || 'Network error',
        code: 'NETWORK_ERROR',
      })
    }

    throw new ApiClientError({
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    })
  }
}

/**
 * Helper to combine abort signals
 */
function createCombinedSignal(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  const controller = new AbortController()

  const abort = () => controller.abort()
  signal1.addEventListener('abort', abort)
  signal2.addEventListener('abort', abort)

  return controller.signal
}

/**
 * Convenience methods for different HTTP verbs
 */
export const apiClient = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    fetcher<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    fetcher<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    fetcher<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    fetcher<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: FetchOptions) =>
    fetcher<T>(url, { ...options, method: 'DELETE' }),
}
