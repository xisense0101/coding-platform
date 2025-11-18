/**
 * Validation schemas for admin API endpoints
 */

import { z } from 'zod'

// Organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  contact_email: z.string().email('Invalid email address').optional(),
  contact_phone: z.string().max(20).optional(),
  subscription_plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  max_users: z.number().int().min(1).default(100),
  max_storage_gb: z.number().int().min(1).default(10),
  max_courses: z.number().int().min(1).default(50),
  max_exams_per_month: z.number().int().min(1).default(100),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export const organizationIdParamSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
})

// User management schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']),
  organization_id: z.string().uuid('Invalid organization ID').optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']).optional(),
  is_active: z.boolean().optional(),
})

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const bulkUserCreateSchema = z.object({
  users: z.array(createUserSchema).min(1, 'At least one user is required').max(100, 'Maximum 100 users per bulk operation'),
})

// Stats and filtering schemas
export const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']).optional(),
  search: z.string().max(255).optional(),
})
