import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // First, try to get organization data from middleware headers
    let orgId = request.headers.get('x-organization-id')
    let orgName = request.headers.get('x-organization-name')
    let orgLogo = request.headers.get('x-organization-logo')
    let orgSubdomain = request.headers.get('x-organization-subdomain')
    let orgPrimaryColor = request.headers.get('x-organization-primary-color')
    let orgSecondaryColor = request.headers.get('x-organization-secondary-color')
    
    // If no headers (API routes skip middleware), check query parameter for local dev
    if (!orgId) {
      const { searchParams } = new URL(request.url)
      const orgParam = searchParams.get('org')
      
      if (orgParam) {
        // Fetch organization by subdomain
        const supabase = createSupabaseServerClient()
        const { data: organization, error } = await supabase
          .from('organizations')
          .select('id, name, subdomain, logo_url, primary_color, secondary_color')
          .eq('subdomain', orgParam)
          .eq('is_active', true)
          .single()
        
        if (organization && !error) {
          orgId = organization.id
          orgName = organization.name
          orgLogo = organization.logo_url
          orgSubdomain = organization.subdomain
          orgPrimaryColor = organization.primary_color
          orgSecondaryColor = organization.secondary_color
        }
      }
    }
    
    if (!orgId) {
      return NextResponse.json({ organization: null })
    }
    
    return NextResponse.json({
      organization: {
        id: orgId,
        name: orgName,
        logo_url: orgLogo || null,
        subdomain: orgSubdomain,
        primary_color: orgPrimaryColor || '#3B82F6',
        secondary_color: orgSecondaryColor || '#1E40AF'
      }
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}
