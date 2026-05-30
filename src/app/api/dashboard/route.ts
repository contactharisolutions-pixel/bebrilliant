import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkTenantSubscription } from '@/lib/security'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch user's profile to get context
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const isOwner = profile.role === 'owner'
        const tenantId = profile.tenant_id

        // Advanced Access Control Subscription Block (Phase 3 Rule 2.5)
        if (!isOwner) {
            const access = await checkTenantSubscription(tenantId!)
            if (!access.allowed) {
                return NextResponse.json({ error: access.reason, requires_billing: true }, { status: 403 })
            }
        }

        // --- Fetch KPI Metrics ---

        let studentsCount = 0
        let teachersCount = 0
        let activeExams = 0
        let revenue = 0
        const charts = [] // Mocked chart data for MVP

        if (isOwner) {
            // Owner sees global data
            const [sRes, tRes, eRes, rRes] = await Promise.all([
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).in('role', ['teacher', 'tenant_admin']),
                supabaseAdmin.from('exams').select('id', { count: 'exact', head: true }), // Ignoring failure if table doesn't exist yet
                supabaseAdmin.from('payments').select('amount').eq('status', 'success')
            ])

            studentsCount = sRes.count || 0
            teachersCount = tRes.count || 0
            activeExams = eRes.count || 0 // Table 'exams' might not exist until Phase 4, handle gracefully

            revenue = rRes.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

            charts.push(
                { name: 'Jan', students: Math.floor(studentsCount * 0.2), revenue: revenue * 0.1 },
                { name: 'Feb', students: Math.floor(studentsCount * 0.5), revenue: revenue * 0.4 },
                { name: 'Mar', students: studentsCount, revenue: revenue }
            )

        } else if (tenantId) {
            // Tenant Admin sees localized data
            const [sRes, tRes, eRes, rRes] = await Promise.all([
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('role', 'student'),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('role', 'teacher'),
                supabaseAdmin.from('exams').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
                supabaseAdmin.from('payments').select('amount').eq('tenant_id', tenantId).eq('status', 'success')
            ])

            studentsCount = sRes.count || 0
            teachersCount = tRes.count || 0
            activeExams = eRes.count || 0
            revenue = rRes.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

            charts.push(
                { name: 'Jan', students: Math.floor(studentsCount * 0.5), exams: 1 },
                { name: 'Feb', students: Math.floor(studentsCount * 0.8), exams: 2 },
                { name: 'Mar', students: studentsCount, exams: activeExams }
            )
        }

        return NextResponse.json({
            metrics: {
                students: studentsCount,
                teachers: teachersCount,
                exams: activeExams,
                revenue: revenue
            },
            charts
        })
    } catch (error: any) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
