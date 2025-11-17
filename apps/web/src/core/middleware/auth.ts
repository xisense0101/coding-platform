import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { AuthenticationError, AuthorizationError } from '@/core/errors'
import { createErrorResponse } from '@/core/utils'

/**
 * User role type
 */
export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin'

/**
 * Authenticated user information
 */
export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  organizationId: string
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Get user profile with role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: userProfile.role as UserRole,
      organizationId: userProfile.organization_id,
    }
  } catch {
    return null
  }
}

/**
 * Require authentication middleware
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return createErrorResponse(new AuthenticationError())
    }

    return await handler(request, user)
  }
}

/**
 * Require specific roles middleware
 */
export function withRoles(allowedRoles: UserRole[]) {
  return function (
    handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const user = await getAuthenticatedUser(request)

      if (!user) {
        return createErrorResponse(new AuthenticationError())
      }

      if (!allowedRoles.includes(user.role)) {
        return createErrorResponse(
          new AuthorizationError('Insufficient permissions for this action')
        )
      }

      return await handler(request, user)
    }
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(user: AuthenticatedUser, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(user.role)
}

/**
 * Check if user is admin or super admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'super_admin'
}
