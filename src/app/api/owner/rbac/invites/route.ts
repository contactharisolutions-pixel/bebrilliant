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

const STAFF_ROLES = ['owner', 'admin', 'platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec', 'support']

/** POST /api/owner/rbac/invites — Create a staff account with owner-set password */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { email, role, first_name, last_name, password } = body

        if (!email || !role) return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 })
        if (!first_name || !last_name) return NextResponse.json({ error: 'First name and last name are required.' }, { status: 400 })
        if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
        if (!STAFF_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid platform staff role selected.' }, { status: 400 })

        // Check for existing pending invite or profile
        const { data: existing } = await supabaseAdmin
            .from('staff_invites')
            .select('id, status')
            .eq('email', email)
            .eq('status', 'pending')
            .maybeSingle()

        if (existing) return NextResponse.json({ error: 'A pending invite already exists for this email.' }, { status: 409 })

        // Create invite record (audit trail)
        const { data: invite, error: inviteErr } = await supabaseAdmin
            .from('staff_invites')
            .insert({ email, role, first_name, last_name, invited_by: user.id })
            .select()
            .single()

        if (inviteErr || !invite) return NextResponse.json({ error: 'Failed to create invite record.' }, { status: 500 })

        // Create auth user with the owner-specified password
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, first_name, last_name },
        })

        if (authErr || !authData?.user) {
            await supabaseAdmin.from('staff_invites').delete().eq('id', invite.id)
            return NextResponse.json({ error: authErr?.message || 'Failed to create staff login account.' }, { status: 400 })
        }

        // Create user profile (platform staff — no tenant)
        await supabaseAdmin.from('user_profiles').insert({
            id: authData.user.id,
            email,
            first_name,
            last_name,
            role,
            tenant_id: null,
            is_active: true,
        })

        // Mark invite as accepted (account was created directly by owner)
        await supabaseAdmin
            .from('staff_invites')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', invite.id)

        // Log audit event
        await supabaseAdmin.from('audit_logs').insert({
            action: 'staff_account_created',
            module: 'rbac',
            user_id: user.id,
            details: { created_email: email, role, created_by: user.id },
            severity: 'info',
        })

        return NextResponse.json({
            success: true,
            user_id: authData.user.id,
            invite_id: invite.id,
            message: `Staff account created successfully for ${email}.`,
        }, { status: 201 })

    } catch (err: any) {
        console.error('POST /rbac/invites error:', err)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
}
