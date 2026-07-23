import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** POST /api/owner/rbac/users/[id]/reset-password — Trigger password reset email */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('email')
        .eq('id', id)
        .single()

    if (!profile?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: profile.email,
    })

    if (error) return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })

    await supabaseAdmin.from('audit_logs').insert({
        action: 'password_reset_initiated',
        module: 'settings',
        user_id: user.id,
        details: { target_user: id, email: profile.email },
        severity: 'info',
    })

    return NextResponse.json({ success: true, email: profile.email })
}
