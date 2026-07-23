import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/analytics — CRM funnel + performance analytics */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const sinceDate = new Date(Date.now() - days * 86400000).toISOString()

    const [leadsRes, activitiesRes, demosRes, stagesRes] = await Promise.all([
        supabaseAdmin.from('owner_leads').select('id, status, lead_score, priority, expected_value, assigned_to, created_at, last_activity_at'),
        supabaseAdmin.from('lead_activities').select('type, lead_id, created_by, created_at').gte('created_at', sinceDate),
        supabaseAdmin.from('demos').select('id, lead_id, status, scheduled_at'),
        supabaseAdmin.from('crm_pipeline_stages').select('id, name, order_index, color, is_won, is_lost, probability').order('order_index'),
    ])

    const leads = leadsRes.data ?? []
    const activities = activitiesRes.data ?? []
    const demos = demosRes.data ?? []
    const stages = stagesRes.data ?? []

    // Funnel by status
    const statusGroups = ['new', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'lost']
    const funnel = statusGroups.map(s => ({
        status: s,
        count: leads.filter(l => l.status === s).length,
        value: leads.filter(l => l.status === s).reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0),
    }))

    // Conversion rate
    const totalLeads = leads.length
    const convertedLeads = leads.filter(l => l.status === 'converted').length
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

    // Revenue pipeline (active non-lost/converted)
    const pipelineValue = leads
        .filter(l => !['lost', 'converted'].includes(l.status))
        .reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0)

    // Staff performance
    const staffMap: Record<string, { assigned: number; activities: number; demos: number }> = {}
    leads.forEach(l => {
        if (l.assigned_to) {
            if (!staffMap[l.assigned_to]) staffMap[l.assigned_to] = { assigned: 0, activities: 0, demos: 0 }
            staffMap[l.assigned_to].assigned++
        }
    })
    activities.forEach(a => {
        if (a.created_by) {
            if (!staffMap[a.created_by]) staffMap[a.created_by] = { assigned: 0, activities: 0, demos: 0 }
            staffMap[a.created_by].activities++
        }
    })

    // Activity breakdown
    const activityBreakdown = ['call', 'email', 'note', 'meeting'].map(t => ({
        type: t,
        count: activities.filter(a => a.type === t).length,
    }))

    // Score distribution
    const scoreDistribution = [
        { label: 'Hot (70-100)', count: leads.filter(l => l.lead_score >= 70).length },
        { label: 'Warm (40-69)', count: leads.filter(l => l.lead_score >= 40 && l.lead_score < 70).length },
        { label: 'Cold (0-39)', count: leads.filter(l => l.lead_score < 40).length },
    ]

    return NextResponse.json({
        summary: { totalLeads, convertedLeads, conversionRate, pipelineValue },
        funnel,
        activityBreakdown,
        scoreDistribution,
        staffPerformance: staffMap,
        stages,
    })
}
