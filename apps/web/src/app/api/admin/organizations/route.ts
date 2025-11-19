import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { createRequestLogger, getRequestId } from '@/server/utils/logger'
import { getCached, CacheKeys, CacheTTL, invalidateCache } from '@/lib/redis/client'
import { validateBody } from '@/server/utils/validation'
import { createOrganizationSchema } from '@/server/schemas/admin'
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/server/utils/errors'
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations - Get all organizations
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId, { endpoint: 'GET /api/admin/organizations' })
  
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user (cached by middleware)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      log.warn('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: { 'X-Request-ID': requestId }
      })
    }

    log.info({ userId: user.id }, 'Fetching organizations')

    // Get user profile with caching
    const userProfile = await getCached(
      CacheKeys.userProfile(user.id),
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('organization_id, role')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        return data
      },
      CacheTTL.medium
    )

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { 
        status: 404,
        headers: { 'X-Request-ID': requestId }
      })
    }

    if (userProfile.role !== 'super_admin') {
      log.warn({ role: userProfile.role }, 'Forbidden access attempt')
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { 
        status: 403,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Cache organizations list for super admins
    const orgsWithCounts = await getCached(
      'admin:organizations:list',
      async () => {
        // Get all organizations
        const { data: organizations, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false })

        if (orgsError) throw orgsError

        // Get user counts for each organization in parallel
        const orgsWithCounts = await Promise.all(
          (organizations || []).map(async (org) => {
            const [userCountResult, courseCountResult] = await Promise.all([
              supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', org.id),
              supabase
                .from('courses')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', org.id)
            ])

            return {
              ...org,
              userCount: userCountResult.count || 0,
              courseCount: courseCountResult.count || 0
            }
          })
        )

        return orgsWithCounts
      },
      CacheTTL.short // 1 minute cache for organizations list
    )

    log.info({ count: orgsWithCounts.length }, 'Organizations fetched successfully')

    return NextResponse.json({
      organizations: orgsWithCounts
    }, { 
      status: 200,
      headers: { 'X-Request-ID': requestId }
    })

  } catch (error) {
    log.error({ error }, 'Failed to fetch organizations')
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'X-Request-ID': requestId }
    })
  }
}

// POST /api/admin/organizations - Create new organization
async function postHandler(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId, { endpoint: 'POST /api/admin/organizations' })
  
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      log.warn('Unauthorized access attempt')
      throw new UnauthorizedError()
    }

    log.info({ userId: user.id }, 'Creating organization')

    // Get user profile with caching
    const userProfile = await getCached(
      CacheKeys.userProfile(user.id),
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('organization_id, role')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        return data
      },
      CacheTTL.medium
    )

    if (!userProfile || userProfile.role !== 'super_admin') {
      log.warn({ role: userProfile?.role }, 'Forbidden access attempt')
      throw new ForbiddenError('Super Admin access required')
    }

    // Validate and sanitize input
    const validated = await validateBody(request, createOrganizationSchema)
    const {
      name,
      slug,
      contact_email,
      contact_phone,
      subscription_plan = 'basic',
      max_users = 100,
      max_storage_gb = 10,
      max_courses = 50,
      max_exams_per_month = 100
    } = validated

    log.info({ name, slug }, 'Creating organization with validated data')

    // Create organization
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        contact_email,
        contact_phone,
        subscription_plan,
        max_users,
        max_storage_gb,
        max_courses,
        max_exams_per_month,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      log.error({ error: createError.message }, 'Failed to create organization')
      return NextResponse.json(
        { error: 'Failed to create organization: ' + createError.message },
        { 
          status: 500,
          headers: { 'X-Request-ID': requestId }
        }
      )
    }

    // Invalidate organizations list cache
    await invalidateCache('admin:organizations:list')

    log.info({ orgId: newOrg.id }, 'Organization created successfully')

    return NextResponse.json({
      message: 'Organization created successfully',
      organization: newOrg
    }, { 
      status: 201,
      headers: { 'X-Request-ID': requestId }
    })

  } catch (error: any) {
    log.error({ error: error.message }, 'Failed to create organization')
    
    // Return appropriate error response
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { 
        status: 401,
        headers: { 'X-Request-ID': requestId }
      })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { 
        status: 403,
        headers: { 'X-Request-ID': requestId }
      })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { 
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'X-Request-ID': requestId }
    })
  }
}

// Apply sensitive rate limiting to organization creation
export const POST = withRateLimit(postHandler, RateLimitPresets.sensitive)
