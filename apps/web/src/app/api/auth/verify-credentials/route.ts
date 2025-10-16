import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

/**
 * POST /api/auth/verify-credentials
 * Verifies user email and password WITHOUT creating a session
 * This is used for exam authentication where we don't want to create a full auth session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Attempt to sign in with email and password
    // This verifies the credentials but we'll immediately sign out
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }

    // Get the user from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', authData.user.id)
      .single()

    // Sign out immediately - we don't want to maintain a session
    await supabase.auth.signOut()

    if (userError || !userData) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'User not found in database' 
        },
        { status: 404 }
      )
    }

    // Check if user is active
    if (!userData.is_active) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Your account has been deactivated. Please contact support.' 
        },
        { status: 403 }
      )
    }

    // Check if user is a student
    if (userData.role !== 'student') {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Only students can take exams. Please use a student account.' 
        },
        { status: 403 }
      )
    }

    // Return user information without creating a session
    return NextResponse.json({
      valid: true,
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role
      }
    })

  } catch (error) {
    console.error('Error verifying credentials:', error)
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Internal server error while verifying credentials' 
      },
      { status: 500 }
    )
  }
}
