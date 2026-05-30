import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()
    if (!profile) return null

    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }
    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner', 'teacher'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false, role: profile.role }
    }
    return null
}

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantAdmin()
        if (!session) return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 403 })

        const { tenant_id, is_owner } = session as any

        let sCount = 0, aCount = 0, tCount = 0, eCount = 0, revenue = 0

        if (is_owner && tenant_id === 'platform') {
            // Platform owner: global stats across all tenants
            const [sRes, aRes, tRes, eRes, pRes] = await Promise.all([
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).in('role', ['teacher', 'tenant_admin']),
                supabaseAdmin.from('exams').select('id', { count: 'exact', head: true }),
                supabaseAdmin.rpc('get_platform_revenue')
            ])
            sCount = sRes.count || 0
            aCount = aRes.count || 0
            tCount = tRes.count || 0
            eCount = eRes.count || 0
            revenue = Number(pRes.data) || 0
        } else {
            // Tenant admin: scoped to their tenant only
            const [sRes, aRes, tRes, eRes, pRes] = await Promise.all([
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('role', 'student'),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('role', 'student').eq('is_active', true),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).in('role', ['teacher', 'tenant_admin']),
                supabaseAdmin.from('exams').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
                supabaseAdmin.rpc('get_tenant_revenue', { p_tenant_id: tenant_id })
            ])
            sCount = sRes.count || 0
            aCount = aRes.count || 0
            tCount = tRes.count || 0
            eCount = eRes.count || 0
            revenue = Number(pRes.data) || 0
        }

        const body = {
            kpi: {
                total_students: sCount,
                active_students: aCount,
                teachers_count: tCount,
                exams_created: eCount,
                revenue_earned: revenue,
                wallet_balance: Math.floor(revenue * 0.8),
                conversion_rate: sCount > 0 ? Math.round((aCount / sCount) * 100) : 0
            },
            charts: {
                student_growth: [
                    { name: 'Month 1', students: Math.floor(sCount * 0.2) },
                    { name: 'Month 2', students: Math.floor(sCount * 0.5) },
                    { name: 'Month 3', students: Math.floor(sCount * 0.8) },
                    { name: 'Current', students: sCount }
                ],
                revenue_trends: [
                    { name: 'Q1', revenue: Math.floor(revenue * 0.2) },
                    { name: 'Q2', revenue: Math.floor(revenue * 0.4) },
                    { name: 'Current', revenue: revenue }
                ]
            }
        }

        return NextResponse.json(body)
    } catch (e: any) {
        console.error('[admin/dashboard] Error:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}
