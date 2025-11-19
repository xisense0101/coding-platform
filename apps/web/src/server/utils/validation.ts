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
 * Basic sanitization helper for plain text input
 * 
 * ⚠️ WARNING: This is a basic sanitization function suitable only for plain text.
 * For rich text or HTML content, you MUST use a dedicated library like DOMPurify.
 * 
 * This function performs basic cleanup for plain text inputs to remove common
 * XSS vectors, but should NOT be relied upon as the sole defense against XSS.
 * 
 * Best practices:
 * 1. Validate input with Zod schemas (type, format, length)
 * 2. Use this sanitization for plain text only
 * 3. For HTML/rich text, use DOMPurify or similar
 * 4. Always escape output in templates (React does this by default)
 * 5. Use Content Security Policy headers (already implemented in middleware)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  let sanitized = input
  
  // For plain text, simply encode/remove HTML entities and dangerous patterns
  // This is NOT sufficient for rich text/HTML content
  
  // Remove dangerous URL schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:']
  for (const scheme of dangerousSchemes) {
    const regex = new RegExp(scheme, 'gi')
    // Apply multiple times to prevent bypasses like "javajavascript:script:"
    let prevLength = 0
    while (sanitized.length !== prevLength && regex.test(sanitized)) {
      prevLength = sanitized.length
      sanitized = sanitized.replace(regex, '')
    }
  }
  
  // Remove HTML tags and scripts (basic approach - use DOMPurify for production rich text)
  // Remove angle brackets entirely for plain text
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
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
