import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** POST /api/owner/rbac/users/[id]/reset-password — Direct Owner Password Reset */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    try {
        const body = await request.json()
        const { password } = body

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('email, first_name, last_name')
            .eq('id', id)
            .single()

        if (!profile?.email) {
            return NextResponse.json({ error: 'Staff user profile not found.' }, { status: 404 })
        }

        // Direct Auth Admin password update - NO email reset link!
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password,
        })

        if (updateError) {
            return NextResponse.json({ error: updateError.message || 'Failed to update staff password.' }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin.from('audit_logs').insert({
            action: 'staff_password_direct_reset',
            module: 'rbac',
            user_id: user.id,
            details: { target_user_id: id, target_email: profile.email, reset_by: user.id },
            severity: 'warning',
        })

        return NextResponse.json({
            success: true,
            email: profile.email,
            name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
        })
    } catch (err: any) {
        console.error('Direct password reset error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
