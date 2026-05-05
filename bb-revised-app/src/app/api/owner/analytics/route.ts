import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return (p?.role === 'owner' || p?.role === 'admin') ? user : null
}

/** GET /api/owner/analytics - Enterprise Deep Analytics */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const tenantFilter = searchParams.get('tenant') || 'all'
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [
        tenantsRes, usersRes, examsRes, attemptsRes,
        resultsRes, paymentsRes, perfRes, aiLogsRes,
        revisionRes, procLogsRes
    ] = await Promise.all([
        supabaseAdmin.from('tenants').select('id, name, type, subscription_plan, subscription_status, is_active, created_at').order('created_at', { ascending: false }),
        supabaseAdmin.from('user_profiles').select('id, role, tenant_id, created_at, is_active'),
        supabaseAdmin.from('exams').select('id, tenant_id, name, is_paid, created_at'),
        supabaseAdmin.from('exam_attempts').select('id, exam_id, student_id, status, total_score, start_time, end_time'),
        supabaseAdmin.from('exam_results').select('id, tenant_id, score, percentage, percentile, created_at').gte('created_at', since),
        supabaseAdmin.from('payments').select('id, tenant_id, amount, status, created_at').gte('created_at', since),
        supabaseAdmin.from('student_performance').select('id, tenant_id, accuracy, attempts, avg_time'),
        supabaseAdmin.from('ai_mentor_logs').select('id, created_at').gte('created_at', since),
        supabaseAdmin.from('revision_plans').select('id, tenant_id, is_active'),
        supabaseAdmin.from('proctoring_logs').select('id, exam_id, severity, created_at').gte('created_at', since),
    ])

    const tenants = tenantsRes.data ?? []
    const users = usersRes.data ?? []
    const exams = examsRes.data ?? []
    const attempts = attemptsRes.data ?? []
    const results = resultsRes.data ?? []
    const payments = paymentsRes.data ?? []
    const perf = perfRes.data ?? []
    const aiLogs = aiLogsRes.data ?? []
    const revisions = revisionRes.data ?? []
    const procLogs = procLogsRes.data ?? []

    // ── Platform-level KPIs ──
    const activeTenantsCount = tenants.filter(t => t.is_active).length
    const totalRevenue = payments.filter(p => p.status === 'captured' || p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
    const successfulAttempts = attempts.filter(a => a.status === 'evaluated' || a.status === 'submitted').length
    const avgScore = results.length > 0 ? (results.reduce((s, r) => s + Number(r.percentage), 0) / results.length).toFixed(1) : '0'
    const avgAccuracy = perf.length > 0 ? (perf.reduce((s, p) => s + Number(p.accuracy), 0) / perf.length).toFixed(1) : '0'

    // ── Monthly revenue trend (6 months) ──
    const now = new Date()
    const allPayments = (await supabaseAdmin.from('payments').select('amount, status, created_at')).data ?? []
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const rev = allPayments.filter(p => {
            const pd = new Date(p.created_at)
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && (p.status === 'paid' || p.status === 'captured')
        }).reduce((s, p) => s + Number(p.amount), 0)
        return { label, revenue: Math.round(rev) }
    })

    // ── Monthly user growth (6 months) ──
    const monthlyUsers = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const count = users.filter(u => {
            const ud = new Date(u.created_at)
            return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear()
        }).length
        return { label, count }
    })

    // ── Monthly exam attempts trend ──
    const allAttempts = (await supabaseAdmin.from('exam_attempts').select('start_time, status')).data ?? []
    const monthlyAttempts = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const count = allAttempts.filter(a => {
            const ad = new Date(a.start_time)
            return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear()
        }).length
        return { label, count }
    })

    // ── Per-tenant summary ──
    const tenantSummaries = tenants.map(t => ({
        ...t,
        userCount: users.filter(u => u.tenant_id === t.id).length,
        studentCount: users.filter(u => u.tenant_id === t.id && u.role === 'student').length,
        examCount: exams.filter(e => e.tenant_id === t.id).length,
        revenueInPeriod: payments.filter(p => p.tenant_id === t.id && (p.status === 'paid' || p.status === 'captured')).reduce((s, p) => s + Number(p.amount), 0),
        avgAccuracy: (() => {
            const tPerf = perf.filter(p => p.tenant_id === t.id)
            return tPerf.length > 0 ? (tPerf.reduce((s, p) => s + Number(p.accuracy), 0) / tPerf.length).toFixed(1) : null
        })(),
        activeRevisionPlans: revisions.filter(r => r.tenant_id === t.id && r.is_active).length,
        procFlags: procLogs.filter(p => {
            const examTenantId = exams.find(e => e.id === p.exam_id)?.tenant_id
            return examTenantId === t.id && (p.severity === 'high' || p.severity === 'critical')
        }).length,
    }))

    // ── Subscription distribution ──
    const subDistribution = ['free', 'basic', 'pro', 'enterprise'].map(plan => ({
        plan,
        count: tenants.filter(t => t.subscription_plan === plan).length,
    })).filter(s => s.count > 0)

    // ── User role distribution ──
    const roleDistribution = ['owner', 'tenant_admin', 'teacher', 'teacher_pending', 'student', 'parent'].map(role => ({
        role,
        count: users.filter(u => u.role === role).length,
    })).filter(r => r.count > 0)

    // ── Proctoring breakdown ──
    const procBreakdown = {
        total: procLogs.length,
        low: procLogs.filter(p => p.severity === 'low').length,
        medium: procLogs.filter(p => p.severity === 'medium').length,
        high: procLogs.filter(p => p.severity === 'high').length,
        critical: procLogs.filter(p => p.severity === 'critical').length,
    }

    return NextResponse.json({
        kpis: {
            totalTenants: tenants.length,
            activeTenants: activeTenantsCount,
            totalUsers: users.length,
            totalStudents: users.filter(u => u.role === 'student').length,
            totalRevenue,
            totalExams: exams.length,
            totalAttempts: allAttempts.length,
            successfulAttempts,
            avgScore,
            avgAccuracy,
            aiMentorSessions: aiLogs.length,
            procFlags: procLogs.length,
        },
        monthlyRevenue,
        monthlyUsers,
        monthlyAttempts,
        tenantSummaries,
        subDistribution,
        roleDistribution,
        procBreakdown,
        tenants: tenants.map(t => ({ id: t.id, name: t.name, type: t.type })),
    })
}
