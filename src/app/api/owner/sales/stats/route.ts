import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: profile } = await supabaseAdmin
        .from('user_profiles').select('role').eq('id', user.id).single()
    return (profile?.role === 'owner' || profile?.role === 'admin') ? user : null
}

/** GET /api/owner/sales/stats - Full Sales & Marketing dashboard metrics */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30' // days

    const since = new Date()
    since.setDate(since.getDate() - parseInt(range))
    const sinceISO = since.toISOString()

    // Run queries in parallel
    const [
        leadsRes,
        demosRes,
        convertedRes,
        subscriptionsRes,
        templatesRes,
        tenantGrowthRes,
    ] = await Promise.all([
        // Total + new leads
        supabaseAdmin.from('owner_leads')
            .select('id, status, source, created_at', { count: 'exact' }),

        // All demos
        supabaseAdmin.from('demos')
            .select('id, status, scheduled_at, created_at'),

        // Converted this period
        supabaseAdmin.from('owner_leads')
            .select('id, created_at')
            .eq('status', 'converted')
            .gte('updated_at', sinceISO),

        // Active subscriptions across tenants
        supabaseAdmin.from('tenant_subscriptions')
            .select('id, plan_name, amount, billing_cycle, status, tenant_id, created_at')
            .order('created_at', { ascending: false })
            .limit(50),

        // Email templates count
        supabaseAdmin.from('email_templates')
            .select('id, name, subject, created_at')
            .is('tenant_id', null)
            .order('created_at', { ascending: false }),

        // New tenants this period
        supabaseAdmin.from('tenants')
            .select('id, name, type, created_at')
            .gte('created_at', sinceISO)
            .order('created_at', { ascending: false }),
    ])

    const allLeads = leadsRes.data ?? []
    const allDemos = demosRes.data ?? []

    // Compute funnel metrics
    const totalLeads = leadsRes.count ?? 0
    const newLeads = allLeads.filter(l => new Date(l.created_at) >= since).length
    const demosScheduled = allDemos.filter(d => d.status === 'scheduled').length
    const demosCompleted = allDemos.filter(d => d.status === 'completed').length
    const converted = convertedRes.data?.length ?? 0
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0'

    // Source breakdown
    const sourceMap: Record<string, number> = {}
    allLeads.forEach(l => {
        const s = l.source || 'Manual'
        sourceMap[s] = (sourceMap[s] || 0) + 1
    })
    const sourceBreakdown = Object.entries(sourceMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count)

    // Lead status funnel
    const statusFunnel = [
        'new', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'lost'
    ].map(s => ({ status: s, count: allLeads.filter(l => l.status === s).length }))

    // Revenue from subscriptions
    const totalRevenue = (subscriptionsRes.data ?? [])
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0)

    return NextResponse.json({
        metrics: {
            totalLeads,
            newLeads,
            demosScheduled,
            demosCompleted,
            converted,
            conversionRate,
            newTenants: tenantGrowthRes.data?.length ?? 0,
            totalRevenue,
            activeSubscriptions: (subscriptionsRes.data ?? []).filter(s => s.status === 'active').length,
        },
        sourceBreakdown,
        statusFunnel,
        recentSubscriptions: subscriptionsRes.data ?? [],
        emailTemplates: templatesRes.data ?? [],
        recentTenants: tenantGrowthRes.data ?? [],
    })
}
