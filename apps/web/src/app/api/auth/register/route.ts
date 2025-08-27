import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['student', 'teacher']).default('student'),
  organization_id: z.string().uuid().optional(),
  student_id: z.string().optional(),
  department: z.string().optional(),
  year_of_study: z.number().optional(),
  phone_number: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const supabase = createSupabaseServerClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
          role: validatedData.role
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }

    // Create user profile
    const userProfileData = {
      id: authData.user.id,
      organization_id: validatedData.organization_id || '00000000-0000-0000-0000-000000000001',
      email: validatedData.email,
      role: validatedData.role,
      full_name: validatedData.full_name,
      first_name: validatedData.full_name.split(' ')[0],
      last_name: validatedData.full_name.split(' ').slice(1).join(' ') || null,
      phone_number: validatedData.phone_number || null,
      student_id: validatedData.student_id || null,
      department: validatedData.department || null,
      year_of_study: validatedData.year_of_study || null,
      is_active: true,
      is_verified: false
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert(userProfileData)
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Create welcome notification
    await supabase
      .from('notifications')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: authData.user.id,
        title: 'Welcome to the Platform!',
        message: `Welcome ${validatedData.full_name}! Your account has been created successfully. Please verify your email address to get started.`,
        type: 'info',
        priority: 'medium'
      })

    // Log security event
    await supabase
      .from('security_events')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: authData.user.id,
        event_type: 'account_created',
        severity: 'info',
        description: 'New user account created',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      user: authData.user,
      profile: userProfile,
      message: 'Registration successful! Please check your email for verification.'
    })

  } catch (error) {
    console.error('Registration API error:', error)
    
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
