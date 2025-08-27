import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)

    const supabase = createSupabaseServerClient()

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('email', email)
      .single()

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    })

    if (error) {
      console.error('Password reset error:', error)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    // Log security event
    await supabase
      .from('security_events')
      .insert({
        organization_id: user.organization_id,
        user_id: user.id,
        event_type: 'password_reset_requested',
        severity: 'info',
        description: 'Password reset requested',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Reset password API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
