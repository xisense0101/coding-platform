import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { getCached, CacheKeys, CacheTTL } from '@/lib/redis/client'

/**
 * Authentication middleware for API routes
 * Reduces duplicate auth checks across all API endpoints
 */
export interface AuthContext {
  user: any
  userProfile: any
  supabase: ReturnType<typeof createSupabaseServerClient>
}

export interface AuthOptions {
  requireAuth?: boolean
  requireRole?: 'admin' | 'teacher' | 'student' | 'admin-or-teacher'
  cacheProfile?: boolean
}

/**
 * Wrapper for API routes that handles authentication and caching
 * @param handler - The actual API route handler
 * @param options - Authentication options
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext, params?: any) => Promise<NextResponse>,
  options: AuthOptions = { requireAuth: true, cacheProfile: true }
) {
  return async (request: NextRequest, routeParams?: any) => {
    try {
      const supabase = createSupabaseServerClient()
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (options.requireAuth && (authError || !user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      let userProfile = null
      
      if (user) {
        // Fetch user profile with caching enabled by default
        userProfile = await getCached(
          CacheKeys.userProfile(user.id),
          async () => {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (error) throw error
            return data
          },
          CacheTTL.medium // 5 minutes cache
        )

        if (!userProfile && options.requireAuth) {
          return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        // Check role requirements
        if (options.requireRole && userProfile) {
          if (options.requireRole === 'admin-or-teacher') {
            if (userProfile.role !== 'admin' && userProfile.role !== 'teacher' && userProfile.role !== 'super_admin') {
              return NextResponse.json(
                { error: 'Forbidden - Admin or Teacher access required' },
                { status: 403 }
              )
            }
          } else if (userProfile.role !== options.requireRole && userProfile.role !== 'super_admin') {
            return NextResponse.json(
              { error: `Forbidden - ${options.requireRole} access required` },
              { status: 403 }
            )
          }
        }
      }

      const context: AuthContext = {
        user,
        userProfile,
        supabase
      }

      // Call the actual handler with auth context
      return await handler(request, context, routeParams)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Quick helper for unauthenticated routes that still want to check if user is logged in
 */
export async function getOptionalAuth(): Promise<AuthContext | null> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      user,
      userProfile,
      supabase
    }
  } catch {
    return null
  }
}
