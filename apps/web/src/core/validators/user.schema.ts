import { z } from 'zod'

/**
 * User-related validation schemas
 */

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['student', 'teacher', 'admin'], {
    errorMap: () => ({ message: 'Role must be student, teacher, or admin' }),
  }),
  student_id: z.string().optional(),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  organization_id: z.string().uuid().optional(),
})

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  is_active: z.boolean().optional(),
})

export const listUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, parseInt(val, 10)) : 50)),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
