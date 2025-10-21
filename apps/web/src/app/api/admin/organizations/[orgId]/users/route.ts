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
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// GET /api/admin/organizations/[orgId]/users - Get users for specific organization
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
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Build query
    let query = supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at', { count: 'exact' })
      .eq('organization_id', orgId)

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      users: users || [],
      total: count || 0,
      page,
      pageSize
    })
  } catch (error) {
    logger.error('Error fetching organization users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/organizations/[orgId]/users - Create user in specific organization
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const adminClient = createAdminClient()
    
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
    const body = await request.json()
    const { full_name, email, role, student_id, employee_id, department, specialization } = body

    // Process specialization: convert comma-separated string to array
    let specializationArray = null
    if (specialization) {
      if (Array.isArray(specialization)) {
        specializationArray = specialization
      } else if (typeof specialization === 'string') {
        // Split by comma, trim whitespace, filter empty strings
        specializationArray = specialization
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      }
    }

    // Validate required fields
    if (!full_name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be student, teacher, or admin' },
        { status: 400 }
      )
    }

    // Generate random password
    const password = generateRandomPassword()

    // Create auth user using admin client
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
      
      // Handle duplicate email error
      if (authCreateError.message.includes('already been registered') || authCreateError.status === 422) {
        return NextResponse.json(
          { error: 'A user with this email address already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to create auth user: ${authCreateError.message}` },
        { status: 500 }
      )
    }

    // Create user profile
    const { data: newUser, error: profileCreateError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        role,
        organization_id: orgId,
        is_active: true,
        student_id: student_id || null,
        employee_id: employee_id || null,
        department: department || null,
        specialization: specializationArray
      })
      .select()
      .single()

    if (profileCreateError) {
      logger.error('Error creating user profile:', profileCreateError)
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileCreateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: newUser,
      password,
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    logger.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
