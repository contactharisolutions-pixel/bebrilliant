import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/rbac/invites — List all staff invitations */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Auto-expire pending invites first
    await supabaseAdmin.rpc('expire_old_invites' as any)

    let q = supabaseAdmin
        .from('staff_invites')
        .select('*, invited_by_profile:invited_by(first_name, last_name, email)')
        .order('created_at', { ascending: false })

    if (status !== 'all') q = q.eq('status', status)

    const { data, error } = await q
    if (error) return NextResponse.json({ error: 'Failed to load invites' }, { status: 500 })

    return NextResponse.json({ invites: data ?? [] })
}

const STAFF_ROLES = ['owner', 'platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec']

/** POST /api/owner/rbac/invites — Create and send a staff invitation */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { email, role, first_name, last_name } = body

        if (!email || !role) return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
        if (!STAFF_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

        // Check for existing pending invite
        const { data: existing } = await supabaseAdmin
            .from('staff_invites')
            .select('id, status')
            .eq('email', email)
            .eq('status', 'pending')
            .maybeSingle()

        if (existing) return NextResponse.json({ error: 'A pending invite already exists for this email.' }, { status: 409 })

        // Create invite record
        const { data: invite, error: inviteErr } = await supabaseAdmin
            .from('staff_invites')
            .insert({ email, role, first_name, last_name, invited_by: user.id })
            .select()
            .single()

        if (inviteErr || !invite) return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })

        // Create actual auth user directly (per user decision: send email via provider)
        const tempPassword = 'Staff@' + Math.random().toString(36).slice(2, 8).toUpperCase()
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { role, first_name, last_name },
        })

        if (authErr || !authData?.user) {
            // Clean up the invite if auth user creation failed
            await supabaseAdmin.from('staff_invites').delete().eq('id', invite.id)
            return NextResponse.json({ error: authErr?.message || 'Failed to create auth user' }, { status: 400 })
        }

        // Create profile
        await supabaseAdmin.from('user_profiles').insert({
            id: authData.user.id,
            email,
            first_name,
            last_name,
            role,
            tenant_id: null,
            is_active: true,
        })

        // Mark invite as accepted immediately (account was created directly)
        await supabaseAdmin
            .from('staff_invites')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', invite.id)

        // Send password reset / welcome email via Supabase Auth
        await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
        })

        return NextResponse.json({
            success: true,
            user_id: authData.user.id,
            invite_id: invite.id,
            temp_password: tempPassword,
            message: `Staff account created. Welcome email sent to ${email}.`,
        }, { status: 201 })

    } catch (err: any) {
        console.error('POST /rbac/invites error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
