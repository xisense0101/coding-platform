import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'
import { invalidateCache, CacheKeys } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations/[orgId] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    const orgId = params.orgId

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    logger.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/organizations/[orgId] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: any = {}

    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.subdomain !== undefined) {
      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
      if (!subdomainRegex.test(body.subdomain)) {
        return NextResponse.json(
          { error: 'Invalid subdomain format' },
          { status: 400 }
        )
      }

      // Check if subdomain already exists (excluding current org)
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('subdomain', body.subdomain)
        .neq('id', params.orgId)
        .single()

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Subdomain already exists' },
          { status: 409 }
        )
      }

      updateData.subdomain = body.subdomain
    }
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone
    if (body.subscription_plan !== undefined) updateData.subscription_plan = body.subscription_plan
    if (body.max_users !== undefined) updateData.max_users = body.max_users
    if (body.max_storage_gb !== undefined) updateData.max_storage_gb = body.max_storage_gb
    if (body.max_courses !== undefined) updateData.max_courses = body.max_courses
    if (body.max_exams_per_month !== undefined) updateData.max_exams_per_month = body.max_exams_per_month
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', params.orgId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to update organization: ' + updateError.message },
        { status: 500 }
      )
    }

    // Invalidate caches
    const cacheInvalidations = [invalidateCache('admin:organizations:list')]
    
    // Only invalidate subdomain cache if subdomain exists
    if (updatedOrg.subdomain) {
      cacheInvalidations.push(
        invalidateCache(CacheKeys.organizationBySubdomain(updatedOrg.subdomain))
      )
    }
    
    await Promise.all(cacheInvalidations)

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: updatedOrg
    }, { status: 200 })

  } catch (error) {
    logger.error('Update organization API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/organizations/[orgId] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    // Get organization first to get subdomain for cache invalidation
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subdomain')
      .eq('id', params.orgId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Delete organization (cascade will handle related records via database constraints)
    // Note: Ensure your database has ON DELETE CASCADE set up for foreign keys
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', params.orgId)

    if (deleteError) {
      logger.error('Error deleting organization:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete organization: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Invalidate caches
    const cacheInvalidations = [invalidateCache('admin:organizations:list')]
    
    // Only invalidate subdomain cache if subdomain exists
    if (organization.subdomain) {
      cacheInvalidations.push(
        invalidateCache(CacheKeys.organizationBySubdomain(organization.subdomain))
      )
    }
    
    await Promise.all(cacheInvalidations)

    logger.info(`Organization ${params.orgId} deleted by super admin ${user.id}`)

    return NextResponse.json({
      message: 'Organization deleted successfully'
    }, { status: 200 })

  } catch (error) {
    logger.error('Delete organization API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
