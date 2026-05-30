import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifySuperAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    // ONLY Admin or Owner can manage permissions/staff tiers
    if (profile?.tenant_id && ['admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifySuperAdmin()
    if (!session) return NextResponse.json({ error: 'Level 1 Clearance Required' }, { status: 403 })

    const { tenant_id } = session

    try {
        const { data: staff, error } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, role, is_active, created_at')
            .eq('tenant_id', tenant_id)
            .neq('role', 'student')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(staff || [])
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifySuperAdmin()
    if (!session) return NextResponse.json({ error: 'Level 1 Clearance Required' }, { status: 403 })

    const { tenant_id } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, user: data })
        }

        if (action === 'UPDATE_ROLE') {
            const { id, role } = payload
            const { error } = await supabaseAdmin
                .from('user_profiles')
                .update({ role })
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'CREATE_STAFF') {
            const { first_name, last_name, email, role } = payload
            const rawPassword = 'SecureStaff#123!@'

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: rawPassword,
                email_confirm: true,
                user_metadata: { role, tenant_id, first_name, last_name }
            })
            if (authError) throw authError

            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    first_name,
                    last_name,
                    is_active: true,
                    role,
                    tenant_id
                })
                .eq('id', authData.user.id)

            if (profileError) throw profileError
            return NextResponse.json({ success: true, id: authData.user.id })
        }

        return NextResponse.json({ error: 'Invalid payload action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
