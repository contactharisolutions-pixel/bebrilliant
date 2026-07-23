import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** DELETE /api/owner/rbac/invites/[id] — Revoke a pending invite */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { error } = await supabaseAdmin
        .from('staff_invites')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending')

    if (error) return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })

    return NextResponse.json({ success: true })
}
