import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { ValidationError } from '@/core/errors'
import { createErrorResponse } from '@/core/utils'

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().uuid(),
  email: z.string().email(),
  url: z.string().url(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
  }),
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path]?.push(err.message)
      })
      throw new ValidationError('Validation failed', errors)
    }
    throw error
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  try {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path]?.push(err.message)
      })
      throw new ValidationError('Invalid query parameters', errors)
    }
    throw error
  }
}

/**
 * Higher-order function to wrap API handlers with validation
 */
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (request: NextRequest, validatedData: z.infer<T>) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const validatedData = await validateBody(request, schema)
      return await handler(request, validatedData)
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}
