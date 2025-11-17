/**
 * API Response types for consistent response structure
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    statusCode: number
    errors?: Record<string, string[]>
    stack?: string
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search parameters
 */
export interface SearchParams {
  search?: string
}

/**
 * Filter parameters
 */
export type FilterParams = Record<string, string | number | boolean | undefined>

/**
 * List query parameters (combines pagination, sort, search, and filters)
 */
export interface ListQueryParams extends PaginationParams, SortParams, SearchParams {
  filters?: FilterParams
}

/**
 * Paginated response data
 */
export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
