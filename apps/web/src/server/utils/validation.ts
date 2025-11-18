/**
 * Request validation and sanitization utilities using Zod
 */

import { NextRequest } from 'next/server'
import { z, ZodError, ZodSchema } from 'zod'
import { ValidationError } from './errors'

/**
 * Validate and parse request body
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data
 * @throws ValidationError if validation fails
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid request body', error.errors)
    }
    throw new ValidationError('Failed to parse request body')
  }
}

/**
 * Validate URL search parameters
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data
 * @throws ValidationError if validation fails
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return schema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors)
    }
    throw new ValidationError('Failed to parse query parameters')
  }
}

/**
 * Validate route parameters
 * @param params - Route parameters object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data
 * @throws ValidationError if validation fails
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid route parameters', error.errors)
    }
    throw new ValidationError('Failed to parse route parameters')
  }
}

/**
 * Sanitize string to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
  
  return sanitized.trim()
}

/**
 * Sanitize all string values in an object recursively
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeString(obj) as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as T
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized as T
  }
  
  return obj
}

/**
 * Common validation schemas
 */

// UUID validation
export const uuidSchema = z.string().uuid()

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// Sort schema
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * Comprehensive validation helper for requests
 * Validates body, query, and params in one call
 */
export async function validateRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
>(
  request: NextRequest,
  schemas: {
    body?: ZodSchema<TBody>
    query?: ZodSchema<TQuery>
    params?: ZodSchema<TParams>
  },
  routeParams?: Record<string, string | string[]>
): Promise<{
  body?: TBody
  query?: TQuery
  params?: TParams
}> {
  const result: {
    body?: TBody
    query?: TQuery
    params?: TParams
  } = {}

  if (schemas.body) {
    result.body = await validateBody(request, schemas.body)
  }

  if (schemas.query) {
    result.query = validateQuery(request, schemas.query)
  }

  if (schemas.params && routeParams) {
    result.params = validateParams(routeParams, schemas.params)
  }

  return result
}
