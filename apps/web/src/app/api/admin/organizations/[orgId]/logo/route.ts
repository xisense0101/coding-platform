import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

// Upload organization logo
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    // Create Supabase client (uses cookies automatically)
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    // Check if user is super_admin or admin of this organization
    if (
      userProfile?.role !== 'super_admin' && 
      !(userProfile?.role === 'admin' && userProfile?.organization_id === params.orgId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    const orgId = params.orgId
    const fileExt = file.name.split('.').pop()
    const fileName = `${orgId}/${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(fileName)

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        logo_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logo_url: publicUrl
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete organization logo
// Delete organization logo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    // Create Supabase client (uses cookies automatically)
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    // Check permissions
    if (
      userProfile?.role !== 'super_admin' && 
      !(userProfile?.role === 'admin' && userProfile?.organization_id === params.orgId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = params.orgId

    // Get current logo URL
    const { data: org } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', orgId)
      .single()

    if (org?.logo_url) {
      // Extract file path from URL
      const url = new URL(org.logo_url)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'organization-logos')
      
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')

        // Delete from storage
        await supabase.storage
          .from('organization-logos')
          .remove([filePath])
      }
    }

    // Update organization to remove logo_url
    await supabase
      .from('organizations')
      .update({ 
        logo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logo deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
