import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    if (profile?.role?.toLowerCase() === 'owner' || profile?.role?.toLowerCase() === 'admin') {
        return { user }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyOwner()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const tenantFilter = searchParams.get('tenant') || 'all'

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    try {
        const [
            tenantsRes, usersRes, examsRes, attemptsRes,
            resultsRes, paymentsRes, perfRes, payoutsRes,
            revisionRes, procLogsRes, leadsRes
        ] = await Promise.all([
            supabaseAdmin.from('tenants').select('id, name, type, subscription_plan, subscription_status, is_active, created_at').order('created_at', { ascending: false }),
            supabaseAdmin.from('user_profiles').select('id, role, tenant_id, created_at, is_active'),
            supabaseAdmin.from('exams').select('id, tenant_id, name, is_paid, created_at'),
            supabaseAdmin.from('exam_attempts').select('id, exam_id, student_id, status, total_score, start_time, end_time'),
            supabaseAdmin.from('exam_results').select('id, tenant_id, score, percentage, percentile, created_at').gte('created_at', since),
            supabaseAdmin.from('payments').select('id, tenant_id, amount, status, created_at').gte('created_at', since),
            supabaseAdmin.from('student_performance').select('id, tenant_id, accuracy, attempts, avg_time'),
            supabaseAdmin.from('payouts').select('id, amount, status').eq('status', 'pending'),
            supabaseAdmin.from('revision_plans').select('id, tenant_id, is_active'),
            supabaseAdmin.from('proctoring_logs').select('id, exam_id, severity, created_at').gte('created_at', since),
            supabaseAdmin.from('owner_leads').select('id, status', { count: 'exact' })
        ])

        let tenants = tenantsRes.data ?? []
        let users = usersRes.data ?? []
        let exams = examsRes.data ?? []
        let attempts = attemptsRes.data ?? []
        let results = resultsRes.data ?? []
        let payments = paymentsRes.data ?? []
        let perf = perfRes.data ?? []
        let payouts = payoutsRes.data ?? []
        let revisions = revisionRes.data ?? []
        let procLogs = procLogsRes.data ?? []

        if (tenantFilter !== 'all') {
            tenants = tenants.filter(t => t.id === tenantFilter)
            users = users.filter(u => u.tenant_id === tenantFilter)
            exams = exams.filter(e => e.tenant_id === tenantFilter)
            payments = payments.filter(p => p.tenant_id === tenantFilter)
            results = results.filter(r => r.tenant_id === tenantFilter)
            perf = perf.filter(p => p.tenant_id === tenantFilter)
            revisions = revisions.filter(r => r.tenant_id === tenantFilter)
        }

        const activeTenantsCount = tenants.filter(t => t.is_active).length
        const totalRevenueNum = payments.filter(p => p.status === 'paid' || p.status === 'captured' || p.status === 'success').reduce((s, p) => s + Number(p.amount), 0)
        const netCommissionNum = totalRevenueNum * 0.10
        const pendingAmountNum = payouts.reduce((s, p) => s + Number(p.amount), 0)
        const successfulAttempts = attempts.filter(a => a.status === 'evaluated' || a.status === 'submitted').length
        const avgScoreVal = results.length > 0 ? (results.reduce((s, r) => s + Number(r.percentage), 0) / results.length).toFixed(1) : '0'
        const avgAccuracyVal = perf.length > 0 ? (perf.reduce((s, p) => s + Number(p.accuracy), 0) / perf.length).toFixed(1) : '0'

        // Monthly trends (6 months)
        const now = new Date()
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const label = months[d.getMonth()]
            const rev = payments.filter(p => {
                const pd = new Date(p.created_at)
                return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
            }).reduce((s, p) => s + Number(p.amount), 0)
            return { name: label, rev: Math.round(rev / 1000) }
        })

        const monthlyUsers = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const label = months[d.getMonth()]
            const count = users.filter(u => {
                const ud = new Date(u.created_at)
                return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear()
            }).length
            return { name: label, count }
        })

        const monthlyAttempts = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const label = months[d.getMonth()]
            const count = attempts.filter(a => {
                const ad = new Date(a.start_time)
                return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear()
            }).length
            return { name: label, count }
        })

        // Tenant summaries (simple, human terms)
        const tenantSummaries = tenants.map(t => ({
            id: t.id,
            name: t.name,
            type: t.type || 'School',
            subscription_plan: t.subscription_plan || 'basic',
            subscription_status: t.subscription_status || 'active',
            is_active: t.is_active,
            created_at: t.created_at,
            userCount: users.filter(u => u.tenant_id === t.id).length,
            studentCount: users.filter(u => u.tenant_id === t.id && u.role === 'student').length,
            examCount: exams.filter(e => e.tenant_id === t.id).length,
            revenueInPeriod: payments.filter(p => p.tenant_id === t.id).reduce((s, p) => s + Number(p.amount), 0),
            avgAccuracy: (() => {
                const tPerf = perf.filter(p => p.tenant_id === t.id)
                return tPerf.length > 0 ? (tPerf.reduce((s, p) => s + Number(p.accuracy), 0) / tPerf.length).toFixed(1) : null
            })(),
            activeCurricula: revisions.filter(r => r.tenant_id === t.id && r.is_active).length,
            systemAlerts: procLogs.filter(p => {
                const examTenantId = exams.find(e => e.id === p.exam_id)?.tenant_id
                return examTenantId === t.id && (p.severity === 'high' || p.severity === 'critical')
            }).length
        }))

        // Subscription distribution
        const subDistribution = ['free', 'basic', 'pro', 'enterprise'].map(plan => ({
            plan: plan === 'free' ? 'Free Plan' : plan === 'basic' ? 'Basic Plan' : plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan',
            count: tenants.filter(t => (t.subscription_plan || 'basic').toLowerCase() === plan).length
        }))

        // User role distribution (simple friendly labels)
        const roleLabels: Record<string, string> = {
            owner: 'Super Admins',
            tenant_admin: 'School Admins',
            teacher: 'Teachers',
            student: 'Students',
            parent: 'Parents'
        }

        const roleDistribution = ['tenant_admin', 'teacher', 'student', 'parent', 'owner'].map(role => ({
            role: roleLabels[role] || role,
            count: users.filter(u => u.role === role).length
        })).filter(r => r.count > 0)

        // Alert Breakdown
        const alertBreakdown = {
            total: procLogs.length,
            low: procLogs.filter(p => p.severity === 'low').length,
            medium: procLogs.filter(p => p.severity === 'medium').length,
            high: procLogs.filter(p => p.severity === 'high').length,
            critical: procLogs.filter(p => p.severity === 'critical').length
        }

        return NextResponse.json({
            stats: {
                totalTenants: tenants.length,
                activeTenants: activeTenantsCount,
                totalUsers: users.length,
                totalStudents: users.filter(u => u.role === 'student').length,
                totalRevenue: totalRevenueNum,
                netCommission: netCommissionNum,
                pendingPayout: pendingAmountNum,
                pendingCount: payouts.length,
                totalExams: exams.length,
                totalAttempts: attempts.length,
                successfulAttempts,
                avgScore: avgScoreVal,
                avgAccuracy: avgAccuracyVal,
                criticalAlerts: procLogs.filter(p => p.severity === 'high' || p.severity === 'critical').length,
                activeLeads: leadsRes.count || 0
            },
            chartData: monthlyRevenue,
            monthlyUsers,
            monthlyAttempts,
            tenantSummaries,
            subDistribution,
            roleDistribution,
            alertBreakdown,
            tenants: tenantsRes.data ? tenantsRes.data.map(t => ({ id: t.id, name: t.name, type: t.type })) : []
        })
    } catch (error: any) {
        console.error("Dashboard API Error:", error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
