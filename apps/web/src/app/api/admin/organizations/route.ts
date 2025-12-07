import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'
import { getCached, CacheKeys, CacheTTL, invalidateCache } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations - Get all organizations
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user (cached by middleware)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
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

    return NextResponse.json({
      organizations: orgsWithCounts
    }, { status: 200 })

  } catch (error) {
    logger.error('Admin organizations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      subdomain,
      contact_email,
      contact_phone,
      subscription_plan = 'basic',
      max_users = 100,
      max_storage_gb = 10,
      max_courses = 50,
      max_exams_per_month = 100
    } = body

    // Validate required fields
    if (!name || !slug || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, subdomain' },
        { status: 400 }
      )
    }

    // Validate subdomain format (3-63 chars, lowercase alphanumeric + hyphens)
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Invalid subdomain format. Must be 3-63 characters, lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Subdomain already exists. Please choose a different subdomain.' },
        { status: 409 }
      )
    }

    // Create organization
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        subdomain,
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
      logger.error('Error creating organization:', createError)
      return NextResponse.json(
        { error: 'Failed to create organization: ' + createError.message },
        { status: 500 }
      )
    }

    // Invalidate organizations list cache
    await invalidateCache('admin:organizations:list')

    return NextResponse.json({
      message: 'Organization created successfully',
      organization: newOrg
    }, { status: 201 })

  } catch (error) {
    logger.error('Admin create organization API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
