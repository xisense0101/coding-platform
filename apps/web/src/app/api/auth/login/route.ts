import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, remember } = loginSchema.parse(body)

    const supabase = createSupabaseServerClient()

    // Get organization context from middleware headers or query parameter
    let orgId = request.headers.get('x-organization-id')
    let orgSubdomain = request.headers.get('x-organization-subdomain')
    
    // If no headers (API routes skip middleware), check query parameter for local dev
    if (!orgId) {
      const { searchParams } = new URL(request.url)
      const orgParam = searchParams.get('org')
      
      if (orgParam) {
        // Fetch organization by subdomain
        const { data: organization, error } = await supabase
          .from('organizations')
          .select('id, subdomain')
          .eq('subdomain', orgParam)
          .eq('is_active', true)
          .single()
        
        if (organization && !error) {
          orgId = organization.id
          orgSubdomain = organization.subdomain
        }
      }
    }

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // CRITICAL: Validate user belongs to this organization's subdomain
    if (orgId && userProfile.organization_id !== orgId) {
      // User exists but doesn't belong to this organization
      // Sign them out to prevent unauthorized access
      await supabase.auth.signOut()
      
      // Log security event for attempted cross-org access
      await supabase
        .from('security_events')
        .insert({
          organization_id: userProfile?.organization_id,
          user_id: data.user.id,
          event_type: 'login_failed',
          severity: 'warning',
          description: `User attempted to login to wrong organization subdomain: ${orgSubdomain}`,
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            attempted_org_id: orgId,
            user_org_id: userProfile.organization_id,
            subdomain: orgSubdomain
          }
        })
      
      return NextResponse.json(
        { error: 'Invalid credentials for this organization' },
        { status: 403 }
      )
    }

    // Update last login and activity
    const { error: updateError } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('id', data.user.id)

    if (updateError) {
      logger.error('Error updating user login time:', updateError)
    }

    // Log security event for successful login
    await supabase
      .from('security_events')
      .insert({
        organization_id: userProfile?.organization_id,
        user_id: data.user.id,
        event_type: 'login_success',
        severity: 'info',
        description: orgSubdomain 
          ? `User logged in successfully via subdomain: ${orgSubdomain}`
          : 'User logged in successfully',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          subdomain: orgSubdomain,
          remember_me: remember
        }
      })

    return NextResponse.json({
      user: data.user,
      session: data.session,
      profile: userProfile,
      organization: userProfile.organization
    })

  } catch (error) {
    logger.error('Login API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
