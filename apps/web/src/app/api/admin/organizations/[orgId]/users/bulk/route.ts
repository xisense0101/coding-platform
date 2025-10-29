import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createAdminClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'
import { sendBulkCredentialsEmails } from '@/lib/email/mailjet'

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

interface CSVRow {
  full_name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  student_id?: string
  employee_id?: string
  department?: string
  specialization?: string
}

interface ProcessResult {
  success: boolean
  total: number
  created: number
  failed: number
  errors: Array<{
    row: number
    email: string
    error: string
  }>
  emailsSent: number
  emailsFailed: number
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function parseCSV(csvContent: string): { rows: CSVRow[]; errors: string[] } {
  const errors: string[] = []
  const rows: CSVRow[] = []

  // Remove BOM if present and normalize line endings
  let content = csvContent.replace(/^\uFEFF/, '').trim()
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  const lines = content.split('\n').filter(line => line.trim().length > 0)

  if (lines.length < 2) {
    errors.push('CSV file must contain a header row and at least one data row')
    logger.error('CSV parsing failed: Not enough lines', { lineCount: lines.length })
    return { rows, errors }
  }

  // Parse header - handle both quoted and unquoted values
  const headerLine = lines[0]
  const header = parseCSVLine(headerLine).map(h => h.toLowerCase())
  const requiredFields = ['full_name', 'email', 'role']
  
  // Log header for debugging
  logger.info('CSV Header:', { header, headerLine })
  
  // Validate header
  const missingFields = requiredFields.filter(field => !header.includes(field))
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`)
    errors.push(`Found columns: ${header.join(', ')}`)
    errors.push(`Expected columns: full_name, email, role, student_id, employee_id, department, specialization`)
    logger.error('CSV header validation failed', { header, missingFields })
    return { rows, errors }
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    // Parse CSV line properly handling quoted values
    const values = parseCSVLine(line)
    
    logger.info(`Parsing row ${i + 1}:`, { values, expectedColumns: header.length })
    
    if (values.length !== header.length) {
      errors.push(`Row ${i + 1}: Expected ${header.length} columns but found ${values.length}. Line: "${line.substring(0, 100)}"`)
      logger.error(`Row ${i + 1} column mismatch`, { expected: header.length, found: values.length, line })
      continue
    }

    const row: any = {}
    header.forEach((field, index) => {
      row[field] = values[index]
    })

    // Validate required fields
    if (!row.full_name || !row.email || !row.role) {
      errors.push(`Row ${i + 1}: Missing required fields (full_name, email, role). Found: ${JSON.stringify(row)}`)
      logger.error(`Row ${i + 1} missing required fields`, { row })
      continue
    }

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(row.role.toLowerCase())) {
      errors.push(`Row ${i + 1}: Invalid role "${row.role}". Must be student, teacher, or admin`)
      logger.error(`Row ${i + 1} invalid role`, { role: row.role })
      continue
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(row.email)) {
      errors.push(`Row ${i + 1}: Invalid email format "${row.email}"`)
      logger.error(`Row ${i + 1} invalid email`, { email: row.email })
      continue
    }

    rows.push({
      full_name: row.full_name,
      email: row.email.toLowerCase(),
      role: row.role.toLowerCase(),
      student_id: row.student_id || undefined,
      employee_id: row.employee_id || undefined,
      department: row.department || undefined,
      specialization: row.specialization || undefined
    })
  }

  logger.info('CSV parsing complete', { totalRows: lines.length - 1, validRows: rows.length, errors: errors.length })

  return { rows, errors }
}

// POST /api/admin/organizations/[orgId]/users/bulk - Bulk create users from CSV
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

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse form data to get CSV file
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sendEmails = formData.get('sendEmails') === 'true'

    logger.info('Bulk upload request received', { orgId, fileName: file?.name, sendEmails })

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read file content
    const csvContent = await file.text()
    
    // Parse CSV
    const { rows, errors: parseErrors } = parseCSV(csvContent)

    if (parseErrors.length > 0) {
      return NextResponse.json({
        error: 'CSV validation failed',
        validationErrors: parseErrors
      }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({
        error: 'No valid data rows found in CSV'
      }, { status: 400 })
    }

    // Process each user
    const result: ProcessResult = {
      success: true,
      total: rows.length,
      created: 0,
      failed: 0,
      errors: [],
      emailsSent: 0,
      emailsFailed: 0
    }

    const createdUsers: Array<{
      to: string
      fullName: string
      email: string
      password: string
      role: string
      organizationName: string
    }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because of header and 0-based index

      try {
        // Generate random password
        const password = generateRandomPassword()

        // Process specialization: convert comma-separated string to array
        let specializationArray = null
        if (row.specialization) {
          specializationArray = row.specialization
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        }

        // Create auth user
        const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
          email: row.email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: row.full_name,
            role: row.role
          }
        })

        if (authCreateError) {
          logger.error(`Row ${rowNumber} - Error creating auth user:`, authCreateError)
          
          // Handle duplicate email error
          if (authCreateError.message.includes('already been registered') || authCreateError.status === 422) {
            result.errors.push({
              row: rowNumber,
              email: row.email,
              error: 'Email already exists'
            })
          } else {
            result.errors.push({
              row: rowNumber,
              email: row.email,
              error: authCreateError.message
            })
          }
          result.failed++
          continue
        }

        // Create user profile
        const { data: newUser, error: profileCreateError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: row.full_name,
            email: row.email,
            role: row.role,
            organization_id: orgId,
            is_active: true,
            student_id: row.student_id || null,
            employee_id: row.employee_id || null,
            department: row.department || null,
            specialization: specializationArray
          })
          .select()
          .single()

        if (profileCreateError) {
          logger.error(`Row ${rowNumber} - Error creating user profile:`, profileCreateError)
          // Rollback: delete auth user
          await adminClient.auth.admin.deleteUser(authData.user.id)
          result.errors.push({
            row: rowNumber,
            email: row.email,
            error: profileCreateError.message
          })
          result.failed++
          continue
        }

        result.created++
        logger.info(`Row ${rowNumber} - User created successfully: ${row.email}`)

        // Collect user info for email sending
        if (sendEmails) {
          createdUsers.push({
            to: row.email,
            fullName: row.full_name,
            email: row.email,
            password: password,
            role: row.role,
            organizationName: organization.name
          })
        }
      } catch (error: any) {
        logger.error(`Row ${rowNumber} - Unexpected error:`, error)
        result.errors.push({
          row: rowNumber,
          email: row.email,
          error: error.message || 'Unexpected error'
        })
        result.failed++
      }
    }

    // Send emails if requested
    if (sendEmails && createdUsers.length > 0) {
      logger.info(`Attempting to send credentials emails to ${createdUsers.length} users...`)
      try {
        const emailResults = await sendBulkCredentialsEmails(createdUsers)
        result.emailsSent = emailResults.success
        result.emailsFailed = emailResults.failed
        
        logger.info(`Email sending complete: ${emailResults.success} sent, ${emailResults.failed} failed`)
        
        if (emailResults.failed > 0) {
          logger.warn(`Failed to send ${emailResults.failed} emails:`, emailResults.errors)
        }
      } catch (emailError) {
        logger.error('Error during bulk email sending:', emailError)
        result.emailsFailed = createdUsers.length
      }
    } else {
      logger.info('Email sending skipped', { sendEmails, createdUsersCount: createdUsers.length })
    }

    result.success = result.created > 0

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    logger.error('Error in bulk user creation:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk user creation' },
      { status: 500 }
    )
  }
}
