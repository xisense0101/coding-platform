import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations - Get all organizations
export async function GET(request: NextRequest) {
  try {
    logger.log('🔍 Admin organizations API - Starting request')
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.log('User authenticated:', user.id)

    // Get user profile and check super_admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (!userProfile) {
      logger.error('No user profile found for:', user.id)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    logger.log('User profile role:', userProfile.role)

    if (userProfile.role !== 'super_admin') {
      logger.warn('Non-super_admin attempted access:', userProfile.role)
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
    }

    // Get all organizations
    logger.log('Fetching organizations from database...')
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgsError) {
      logger.error('Error fetching organizations:', orgsError)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    logger.log('Organizations fetched:', organizations?.length || 0)

    // Get user counts for each organization
    const orgsWithCounts = await Promise.all(
      (organizations || []).map(async (org) => {
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        const { count: courseCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        return {
          ...org,
          userCount: userCount || 0,
          courseCount: courseCount || 0
        }
      })
    )

    logger.log('✅ Returning organizations with counts')

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

    // Get user profile and check super_admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
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
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

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
      logger.error('Error creating organization:', createError)
      return NextResponse.json(
        { error: 'Failed to create organization: ' + createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Organization created successfully',
      organization: newOrg
    }, { status: 201 })

  } catch (error) {
    logger.error('Admin create organization API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
