import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createAdminClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// Generate a secure random password
function generateRandomPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// GET /api/admin/users - Get all users with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and check admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') // 'student', 'teacher', or null for all
    const search = searchParams.get('search') // Search by name or email
    const status = searchParams.get('status') // 'active', 'inactive'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('organization_id', userProfile.organization_id)

    if (role && ['student', 'teacher'].includes(role)) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      logger.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { status: 200 })

  } catch (error) {
    logger.error('Admin users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user (student or teacher)
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and check admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      email,
      full_name,
      role,
      student_id,
      employee_id,
      department,
      specialization,
      password: providedPassword,
      organization_id: providedOrgId
    } = body

    // Generate random password if not provided
    const password = providedPassword || generateRandomPassword()

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, role' },
        { status: 400 }
      )
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be student, teacher, or admin' },
        { status: 400 }
      )
    }

    // Determine organization_id: use provided one if super_admin, otherwise use current user's org
    let targetOrgId = userProfile.organization_id
    if (userProfile.role === 'super_admin' && providedOrgId) {
      // Super admin can create users in any organization
      targetOrgId = providedOrgId
    } else if (userProfile.role !== 'super_admin' && providedOrgId && providedOrgId !== userProfile.organization_id) {
      // Regular admin can only create users in their own organization
      return NextResponse.json(
        { error: 'You can only create users in your own organization' },
        { status: 403 }
      )
    }

    // Create auth user first using admin client
    const adminClient = createAdminClient()
    const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role
      }
    })

    if (authCreateError) {
      logger.error('Error creating auth user:', authCreateError)
      return NextResponse.json(
        { error: 'Failed to create user account: ' + authCreateError.message },
        { status: 500 }
      )
    }

    // Create user profile
    const userData: any = {
      id: authData.user.id,
      organization_id: targetOrgId,
      email,
      full_name,
      role,
      is_active: true,
      is_verified: true
    }

    if (role === 'student' && student_id) {
      userData.student_id = student_id
      userData.department = department
    }

    if (role === 'teacher') {
      userData.employee_id = employee_id
      userData.specialization = specialization ? [specialization] : []
      userData.department = department
    }

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (userError) {
      logger.error('Error creating user profile:', userError)
      // Try to delete the auth user if profile creation fails
      try {
        await adminClient.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        logger.warn('Failed to cleanup auth user after profile creation failure:', deleteError)
      }
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
      generatedPassword: password // Return the password (only shown once)
    }, { status: 201 })

  } catch (error) {
    logger.error('Admin create user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
