import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

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

    // Update last login and activity
    const { error: updateError } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('Error updating user login time:', updateError)
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    // Log security event
    await supabase
      .from('security_events')
      .insert({
        organization_id: userProfile?.organization_id,
        user_id: data.user.id,
        event_type: 'login_success',
        severity: 'info',
        description: 'User logged in successfully',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      user: data.user,
      session: data.session,
      profile: userProfile
    })

  } catch (error) {
    console.error('Login API error:', error)
    
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
