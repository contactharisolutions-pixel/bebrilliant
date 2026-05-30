import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return p?.role === 'owner' ? user : null
}

/** GET /api/owner/automation - List all automation rules (owner-level + all tenant) */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event') || 'all'
    const active = searchParams.get('active') || 'all'
    const tenant = searchParams.get('tenant') || 'all'
    const search = searchParams.get('search') || ''

    let rulesQ = supabaseAdmin
        .from('automation_rules')
        .select('*, tenants!automation_rules_tenant_id_fkey(name, type)', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (event !== 'all') rulesQ = rulesQ.eq('event', event)
    if (active === 'active') rulesQ = rulesQ.eq('is_active', true)
    if (active === 'inactive') rulesQ = rulesQ.eq('is_active', false)
    if (tenant === 'global') rulesQ = rulesQ.is('tenant_id', null)
    else if (tenant !== 'all') rulesQ = rulesQ.eq('tenant_id', tenant)

    const { data: rules, error: rulesErr, count } = await rulesQ
    if (rulesErr) return NextResponse.json({ error: rulesErr.message }, { status: 500 })

    // Filter search on JS side (event + JSON)
    let filteredRules = rules ?? []
    if (search) filteredRules = filteredRules.filter(r =>
        r.event.includes(search.toLowerCase()) ||
        JSON.stringify(r.action).toLowerCase().includes(search.toLowerCase())
    )

    // Stats
    const [notifRes, auditRes, tenantsRes, templatesRes] = await Promise.all([
        supabaseAdmin.from('notifications').select('id, type, is_read, created_at').order('created_at', { ascending: false }).limit(100),
        supabaseAdmin.from('audit_logs').select('id, action, module, created_at, user_id').order('created_at', { ascending: false }).limit(50),
        supabaseAdmin.from('tenants').select('id, name, type').order('name'),
        supabaseAdmin.from('email_templates').select('id, name, subject, created_at').is('tenant_id', null).order('created_at', { ascending: false }),
    ])

    const allRules = rules ?? []
    const notifs = notifRes.data ?? []

    return NextResponse.json({
        rules: filteredRules,
        total: count ?? 0,
        stats: {
            totalRules: allRules.length,
            activeRules: allRules.filter(r => r.is_active).length,
            globalRules: allRules.filter(r => r.tenant_id === null).length,
            tenantRules: allRules.filter(r => r.tenant_id !== null).length,
            totalNotifications: notifs.length,
            unreadNotifications: notifs.filter(n => !n.is_read).length,
        },
        recentAuditLogs: auditRes.data ?? [],
        tenants: tenantsRes.data ?? [],
        globalTemplates: templatesRes.data ?? [],
    })
}

/** POST /api/owner/automation - Create a new automation rule */
export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { event, condition, action, is_active, tenant_id } = await request.json()
    if (!event || !condition || !action) {
        return NextResponse.json({ error: 'event, condition, and action are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('automation_rules')
        .insert({ event, condition, action, is_active: is_active ?? true, tenant_id: tenant_id || null })
        .select().single()
    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ rule: data }, { status: 201 })
}
