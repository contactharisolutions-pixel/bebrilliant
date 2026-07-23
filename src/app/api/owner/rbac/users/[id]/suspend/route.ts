import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** POST /api/owner/rbac/users/[id]/suspend — Suspend a user with reason */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    try {
        const body = await request.json()
        const { reason, duration_days } = body

        if (!reason) return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 })

        const auto_lift_at = duration_days
            ? new Date(Date.now() + duration_days * 86400000).toISOString()
            : null

        // Suspend the user
        await supabaseAdmin.from('user_profiles').update({ is_active: false }).eq('id', id)

        // Log the suspension
        await supabaseAdmin.from('user_suspension_log').insert({
            user_id: id,
            reason,
            suspended_by: user.id,
            duration_days: duration_days || null,
            auto_lift_at,
        })

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            action: 'user_suspended',
            module: 'settings',
            user_id: user.id,
            details: { target_user: id, reason, duration_days },
            severity: 'warning',
        })

        return NextResponse.json({ success: true, auto_lift_at })
    } catch (err: any) {
        console.error('POST /suspend error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** DELETE /api/owner/rbac/users/[id]/suspend — Lift a suspension */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { reason } = await request.json().catch(() => ({ reason: 'Manual lift' }))

    // Reactivate user
    await supabaseAdmin.from('user_profiles').update({ is_active: true }).eq('id', id)

    // Close suspension log entry
    await supabaseAdmin
        .from('user_suspension_log')
        .update({ lifted_at: new Date().toISOString(), lifted_by: user.id, lift_reason: reason })
        .eq('user_id', id)
        .is('lifted_at', null)

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
        action: 'user_reinstated',
        module: 'settings',
        user_id: user.id,
        details: { target_user: id, reason },
        severity: 'info',
    })

    return NextResponse.json({ success: true })
}
