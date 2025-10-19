import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

// PATCH - Revoke an invite
export async function PATCH(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Verify teacher authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteId } = params

    // Verify invite exists and teacher owns the exam
    const { data: invite } = await supabase
      .from('exam_invites')
      .select(`
        id,
        exam:exam_id (
          teacher_id
        )
      `)
      .eq('id', inviteId)
      .single()

    if (!invite || (invite.exam as any)?.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Revoke the invite
    const { data: updatedInvite, error } = await supabase
      .from('exam_invites')
      .update({ 
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('id', inviteId)
      .select()
      .single()

    if (error) {
      console.error('Error revoking invite:', error)
      return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
    }

    return NextResponse.json({ 
      invite: updatedInvite,
      message: 'Invite revoked successfully'
    })
  } catch (error) {
    console.error('Error in PATCH /api/exam/invites/revoke/[inviteId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete an invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Verify teacher authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteId } = params

    // Verify invite exists and teacher owns the exam
    const { data: invite } = await supabase
      .from('exam_invites')
      .select(`
        id,
        exam:exam_id (
          teacher_id
        )
      `)
      .eq('id', inviteId)
      .single()

    if (!invite || (invite.exam as any)?.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the invite
    const { error } = await supabase
      .from('exam_invites')
      .delete()
      .eq('id', inviteId)

    if (error) {
      console.error('Error deleting invite:', error)
      return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Invite deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/exam/invites/revoke/[inviteId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
