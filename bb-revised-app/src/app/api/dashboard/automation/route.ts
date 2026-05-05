import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile) return null

    // Platform Owner bypass
    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        const query = supabaseAdmin.from('automation_rules').select('*')

        if (is_owner && tenant_id === 'platform') {
            query.is('tenant_id', null)
        } else {
            query.eq('tenant_id', tenant_id)
        }

        const { data: rules, error } = await query

        if (error) throw error

        // Map to UI type
        const flows = (rules || []).map(r => ({
            id: r.id,
            name: r.event.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            trigger: r.event,
            action: r.action.type,
            status: r.is_active ? 'active' : 'paused'
        }))

        const mock_defaults = [
            { id: 'flow1', name: 'Student Onboarding', trigger: 'student_created', action: 'send_welcome_email', status: 'active' },
            { id: 'flow2', name: 'Exam Success Notification', trigger: 'exam_passed', action: 'send_push_notification', status: 'active' },
            { id: 'flow3', name: 'Fee Reminder (Auto)', trigger: 'payment_pending', action: 'send_whatsapp', status: 'paused' }
        ]

        return NextResponse.json(flows.length > 0 ? flows : mock_defaults)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'SAVE_WORKFLOWS') {
            // Bulk upsert logic for rules
            const rulesToSave = payload.map((f: any) => ({
                id: f.id.startsWith('flow') ? undefined : f.id, // Keep real IDs, let generator handle mocks
                tenant_id: (is_owner && tenant_id === 'platform') ? null : tenant_id,
                event: f.trigger,
                condition: {},
                action: { type: f.action },
                is_active: f.status === 'active'
            }))

            const { error } = await supabaseAdmin.from('automation_rules').upsert(rulesToSave)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid logic payload' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
