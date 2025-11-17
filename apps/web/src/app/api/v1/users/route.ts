import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createAdminClient } from '@/lib/database/supabase-server'
import { logger } from '@/core/utils/logger'
import { withAuth, withRoles } from '@/core/middleware/auth'
import { rateLimit, RATE_LIMITS } from '@/core/middleware/rate-limit'
import { validateBody, validateQueryParams } from '@/core/validators'
import {
  createUserSchema,
  listUsersQuerySchema,
  type CreateUserInput,
  type ListUsersQuery,
} from '@/core/validators/user.schema'
import {
  createSuccessResponse,
  createPaginatedResponse,
  createErrorResponse,
  createPaginationMeta,
  calculateOffset,
} from '@/core/utils'
import { NotFoundError, ConflictError, AuthorizationError } from '@/core/errors'
import type { AuthenticatedUser } from '@/core/middleware/auth'

export const dynamic = 'force-dynamic'

/**
 * Generate a secure random password
 */
function generateRandomPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols

  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * GET /api/v1/users - List users with pagination and filtering
 */
async function handleGetUsers(request: NextRequest, user: AuthenticatedUser) {
  const searchParams = request.nextUrl.searchParams
  const query = validateQueryParams(searchParams, listUsersQuerySchema) as ListUsersQuery

  const supabase = createSupabaseServerClient()

  // Build database query
  let dbQuery = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('organization_id', user.organizationId)

  if (query.role) {
    dbQuery = dbQuery.eq('role', query.role)
  }

  if (query.search) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`)
  }

  if (query.status === 'active') {
    dbQuery = dbQuery.eq('is_active', true)
  } else if (query.status === 'inactive') {
    dbQuery = dbQuery.eq('is_active', false)
  }

  const offset = calculateOffset(query.page, query.limit)
  dbQuery = dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + query.limit - 1)

  const { data: users, error: usersError, count } = await dbQuery

  if (usersError) {
    logger.error('Error fetching users', usersError)
    throw new Error('Failed to fetch users')
  }

  const pagination = createPaginationMeta(query.page, query.limit, count || 0)

  return createPaginatedResponse({ items: users || [], pagination })
}

/**
 * POST /api/v1/users - Create a new user
 */
async function handleCreateUser(request: NextRequest, user: AuthenticatedUser) {
  const input = await validateBody(request, createUserSchema)

  const supabase = createSupabaseServerClient()

  // Generate random password if not provided
  const password = input.password || generateRandomPassword()

  // Determine organization_id
  let targetOrgId = user.organizationId
  if (user.role === 'super_admin' && input.organization_id) {
    targetOrgId = input.organization_id
  } else if (user.role !== 'super_admin' && input.organization_id && input.organization_id !== user.organizationId) {
    throw new AuthorizationError('You can only create users in your own organization')
  }

  // Create auth user
  const adminClient = createAdminClient()
  const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      role: input.role,
    },
  })

  if (authCreateError) {
    logger.error('Error creating auth user', authCreateError)
    if (authCreateError.message.includes('already registered')) {
      throw new ConflictError('User with this email already exists')
    }
    throw new Error('Failed to create user account')
  }

  // Create user profile
  const userData: Record<string, unknown> = {
    id: authData.user.id,
    organization_id: targetOrgId,
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    is_active: true,
    is_verified: true,
  }

  if (input.role === 'student' && input.student_id) {
    userData.student_id = input.student_id
    userData.department = input.department
  }

  if (input.role === 'teacher') {
    userData.employee_id = input.employee_id
    userData.specialization = input.specialization ? [input.specialization] : []
    userData.department = input.department
  }

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()

  if (userError) {
    logger.error('Error creating user profile', userError)
    // Cleanup auth user on failure
    try {
      await adminClient.auth.admin.deleteUser(authData.user.id)
    } catch (deleteError) {
      logger.warn('Failed to cleanup auth user', deleteError)
    }
    throw new Error('Failed to create user profile')
  }

  logger.info('User created successfully', { userId: newUser.id, email: newUser.email })

  return createSuccessResponse(
    {
      user: newUser,
      generatedPassword: password,
    },
    'User created successfully',
    201
  )
}

// Apply middleware and export handlers
export const GET = rateLimit(RATE_LIMITS.standard)(
  withRoles(['admin', 'super_admin'])(async (request: NextRequest, user: AuthenticatedUser) => {
    try {
      return await handleGetUsers(request, user)
    } catch (error) {
      return createErrorResponse(error)
    }
  })
)

export const POST = rateLimit(RATE_LIMITS.strict)(
  withRoles(['admin', 'super_admin'])(async (request: NextRequest, user: AuthenticatedUser) => {
    try {
      return await handleCreateUser(request, user)
    } catch (error) {
      return createErrorResponse(error)
    }
  })
)
