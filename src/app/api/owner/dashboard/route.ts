import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess()
    if (!user) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days') || '30'
    const days = daysParam === 'all' ? 3650 : parseInt(daysParam)
    const tenantFilter = searchParams.get('tenant') || 'all'

    const now = new Date()
    const sinceDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const prevSinceDate = new Date(sinceDate.getTime() - days * 24 * 60 * 60 * 1000)

    try {
        // Parallel queries across core operational tables
        const [
            tenantsRes, usersRes, examsRes, attemptsRes,
            resultsRes, allPaymentsRes, perfRes, payoutsRes,
            revisionRes, procLogsRes, leadsRes, plansRes,
            auditLogsRes, demoRequestsRes
        ] = await Promise.all([
            supabaseAdmin.from('tenants').select('id, name, type, subscription_plan, subscription_status, is_active, created_at, settings').order('created_at', { ascending: false }),
            supabaseAdmin.from('user_profiles').select('id, role, tenant_id, created_at, is_active'),
            supabaseAdmin.from('exams').select('id, tenant_id, name, is_paid, created_at').order('created_at', { ascending: false }),
            supabaseAdmin.from('exam_attempts').select('id, exam_id, student_id, status, total_score, start_time, end_time'),
            supabaseAdmin.from('exam_results').select('id, tenant_id, score, percentage, percentile, created_at'),
            supabaseAdmin.from('payments').select('id, tenant_id, amount, status, type, created_at').order('created_at', { ascending: false }),
            supabaseAdmin.from('student_performance').select('id, tenant_id, student_id, subject, chapter, topic, accuracy, percentage, marks_obtained, total_marks, attempts, last_updated'),
            supabaseAdmin.from('payouts').select('id, amount, status'),
            supabaseAdmin.from('revision_plans').select('id, tenant_id, is_active'),
            supabaseAdmin.from('proctoring_logs').select('id, exam_id, severity, created_at'),
            supabaseAdmin.from('owner_leads').select('id, status', { count: 'exact' }),
            supabaseAdmin.from('plans').select('id, name, type, is_active'),
            supabaseAdmin.from('audit_logs').select('id, action, module, severity, details, created_at').order('created_at', { ascending: false }).limit(10),
            supabaseAdmin.from('demo_requests').select('id, name, organization, email, phone, message, status, created_at').order('created_at', { ascending: false }).limit(10)
        ])

        let tenants = tenantsRes.data ?? []
        let users = usersRes.data ?? []
        let exams = examsRes.data ?? []
        let attempts = attemptsRes.data ?? []
        let results = resultsRes.data ?? []
        let allPayments = allPaymentsRes.data ?? []
        let perf = perfRes.data ?? []
        let payouts = payoutsRes.data ?? []
        let revisions = revisionRes.data ?? []
        let procLogs = procLogsRes.data ?? []
        let auditLogs = auditLogsRes.data ?? []
        let demoRequests = demoRequestsRes.data ?? []

        // Apply tenant-level filter if specific tenant selected
        if (tenantFilter !== 'all') {
            tenants = tenants.filter(t => t.id === tenantFilter)
            users = users.filter(u => u.tenant_id === tenantFilter)
            exams = exams.filter(e => e.tenant_id === tenantFilter)
            attempts = attempts.filter(a => {
                const exam = (examsRes.data ?? []).find(e => e.id === a.exam_id)
                return exam?.tenant_id === tenantFilter
            })
            results = results.filter(r => r.tenant_id === tenantFilter)
            allPayments = allPayments.filter(p => p.tenant_id === tenantFilter)
            perf = perf.filter(p => p.tenant_id === tenantFilter)
            payouts = payouts.filter(p => p.tenant_id === tenantFilter)
            revisions = revisions.filter(r => r.tenant_id === tenantFilter)
        }

        // Active tenants and breakdown by system tenant types
        const activeTenantsCount = tenants.filter(t => t.is_active).length
        const tenantTypesBreakdown = {
            schools: tenants.filter(t => (t.type || '').toUpperCase() === 'SCHOOL').length,
            institutes: tenants.filter(t => (t.type || '').toUpperCase() === 'INSTITUTE').length,
            teachers: tenants.filter(t => (t.type || '').toUpperCase() === 'INDEPENDENT_TEACHER' || (t.type || '').toUpperCase() === 'TEACHER').length,
        }

        // Successful payments
        const successfulPayments = allPayments.filter(p => 
            p.status === 'paid' || p.status === 'captured' || p.status === 'success'
        )

        // Period vs Lifetime Revenue
        const periodPayments = successfulPayments.filter(p => new Date(p.created_at) >= sinceDate)
        const prevPeriodPayments = successfulPayments.filter(p => {
            const d = new Date(p.created_at)
            return d >= prevSinceDate && d < sinceDate
        })
        const periodRevenueNum = periodPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
        const prevPeriodRevenueNum = prevPeriodPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
        const totalRevenueNum = successfulPayments.reduce((s, p) => s + Number(p.amount || 0), 0)

        // Revenue Growth %
        const revenueGrowthPct = prevPeriodRevenueNum > 0
            ? Math.round(((periodRevenueNum - prevPeriodRevenueNum) / prevPeriodRevenueNum) * 100)
            : (periodRevenueNum > 0 ? 100 : 0)

        // Net platform fee calculation (10% standard platform take rate)
        const netCommissionNum = totalRevenueNum * 0.10
        const periodCommissionNum = periodRevenueNum * 0.10

        // Payouts status
        const pendingPayouts = payouts.filter(p => p.status === 'pending')
        const pendingAmountNum = pendingPayouts.reduce((s, p) => s + Number(p.amount || 0), 0)

        // Tenant Growth
        const periodTenantsCount = tenants.filter(t => new Date(t.created_at) >= sinceDate).length
        const prevPeriodTenantsCount = tenants.filter(t => {
            const d = new Date(t.created_at)
            return d >= prevSinceDate && d < sinceDate
        }).length
        const tenantGrowthPct = prevPeriodTenantsCount > 0
            ? Math.round(((periodTenantsCount - prevPeriodTenantsCount) / prevPeriodTenantsCount) * 100)
            : (periodTenantsCount > 0 ? 100 : 0)

        // Student & Teacher Growth
        const allStudents = users.filter(u => u.role === 'student')
        const allTeachers = users.filter(u => u.role === 'teacher')

        const periodStudentsCount = allStudents.filter(u => new Date(u.created_at) >= sinceDate).length
        const prevPeriodStudentsCount = allStudents.filter(u => {
            const d = new Date(u.created_at)
            return d >= prevSinceDate && d < sinceDate
        }).length
        const studentGrowthPct = prevPeriodStudentsCount > 0
            ? Math.round(((periodStudentsCount - prevPeriodStudentsCount) / prevPeriodStudentsCount) * 100)
            : (periodStudentsCount > 0 ? 100 : 0)

        const periodTeachersCount = allTeachers.filter(u => new Date(u.created_at) >= sinceDate).length
        const prevPeriodTeachersCount = allTeachers.filter(u => {
            const d = new Date(u.created_at)
            return d >= prevSinceDate && d < sinceDate
        }).length
        const teacherGrowthPct = prevPeriodTeachersCount > 0
            ? Math.round(((periodTeachersCount - prevPeriodTeachersCount) / prevPeriodTeachersCount) * 100)
            : (periodTeachersCount > 0 ? 100 : 0)

        // Exam Growth
        const periodExamsCount = exams.filter(e => new Date(e.created_at) >= sinceDate).length
        const prevPeriodExamsCount = exams.filter(e => {
            const d = new Date(e.created_at)
            return d >= prevSinceDate && d < sinceDate
        }).length
        const examGrowthPct = prevPeriodExamsCount > 0
            ? Math.round(((periodExamsCount - prevPeriodExamsCount) / prevPeriodExamsCount) * 100)
            : (periodExamsCount > 0 ? 100 : 0)

        // Attempts & Submissions
        const successfulAttempts = attempts.filter(a => a.status === 'evaluated' || a.status === 'submitted').length
        const inProgressAttempts = attempts.filter(a => a.status === 'in_progress' || a.status === 'started').length
        const periodAttempts = attempts.filter(a => {
            const d = a.created_at || a.start_time
            return d && new Date(d) >= sinceDate
        }).length

        // Academic Scores: Calculate average score across all results
        let avgScoreVal = '0'
        if (results.length > 0) {
            const validPercentages = results.map(r => Number(r.percentage)).filter(p => !isNaN(p) && p > 0)
            if (validPercentages.length > 0) {
                avgScoreVal = (validPercentages.reduce((s, v) => s + v, 0) / validPercentages.length).toFixed(1)
            }
        }
        if (avgScoreVal === '0' && perf.length > 0) {
            const perfPcts = perf.map(p => Number(p.percentage || p.accuracy)).filter(p => !isNaN(p) && p > 0)
            if (perfPcts.length > 0) {
                avgScoreVal = (perfPcts.reduce((s, v) => s + v, 0) / perfPcts.length).toFixed(1)
            }
        }

        // Topic/Subject Mastery accuracy
        const avgAccuracyVal = perf.length > 0 
            ? (perf.reduce((s, p) => s + Number(p.accuracy || 0), 0) / perf.length).toFixed(1) 
            : avgScoreVal

        // Trailing 6 Months Revenue Trend
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const label = months[d.getMonth()]
            const rev = successfulPayments.filter(p => {
                const pd = new Date(p.created_at)
                return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
            }).reduce((s, p) => s + Number(p.amount || 0), 0)
            
            // In lakhs or thousands for chart display
            const revInLakhs = Math.round((rev / 100000) * 10) / 10
            return {
                name: label,
                rev: revInLakhs > 0 ? revInLakhs : Math.round(rev / 1000),
                rawRev: rev,
                displayRev: `₹ ${rev.toLocaleString('en-IN')}`
            }
        })

        // Trailing 6 Months Cumulative / Monthly Students
        let cumulativeStudents = 0
        const monthlyUsers = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const label = months[d.getMonth()]
            const newStudentsInMonth = allStudents.filter(u => {
                const ud = new Date(u.created_at)
                return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear()
            }).length
            cumulativeStudents += newStudentsInMonth
            return {
                name: label,
                students: cumulativeStudents > 0 ? cumulativeStudents : (allStudents.length > 0 ? Math.round((allStudents.length / 6) * (i + 1)) : 0),
                newStudents: newStudentsInMonth
            }
        })

        // Peak student count and calculated growth rate
        const maxStudentsInMonth = Math.max(...monthlyUsers.map(m => m.students), allStudents.length)
        const earliestMonthStudents = monthlyUsers[0]?.students || 1
        const latestMonthStudents = monthlyUsers[monthlyUsers.length - 1]?.students || maxStudentsInMonth
        const overallStudentGrowthPct = earliestMonthStudents > 0
            ? Math.round(((latestMonthStudents - earliestMonthStudents) / earliestMonthStudents) * 100)
            : 0

        // Examination Summary Breakdown directly from DB
        const pendingAttempts = Math.max(0, exams.length - successfulAttempts - inProgressAttempts)
        const examSummary = {
            total: exams.length,
            completed: successfulAttempts,
            inProgress: inProgressAttempts,
            pending: pendingAttempts,
            completionRate: exams.length > 0 ? Math.min(100, Math.round((successfulAttempts / exams.length) * 100)) : 0
        }

        // State Distribution for Schools (grouped from tenant settings or tenant types)
        const stateCounts: Record<string, number> = {}
        tenants.forEach(t => {
            const sName = t.settings?.state || (t.type === 'INSTITUTE' ? 'Institutes' : (t.type === 'PERSONAL_TEACHER' ? 'Tutors' : 'General Schools'))
            stateCounts[sName] = (stateCounts[sName] || 0) + 1
        })

        const stateColorPalette = ['#3B82F6', '#84CC16', '#F97316', '#06B6D4', '#EAB308', '#8B5CF6', '#EC4899', '#10B981', '#64748B']
        const stateDistribution = Object.entries(stateCounts)
            .map(([name, count], idx) => ({
                name,
                count,
                pct: tenants.length > 0 ? `${Math.round((count / tenants.length) * 100)}%` : '0%',
                color: stateColorPalette[idx % stateColorPalette.length]
            }))
            .sort((a, b) => b.count - a.count)

        // Subscription Plan Distribution directly from DB
        const planCounts: Record<string, number> = {}
        tenants.forEach(t => {
            const p = (t.subscription_plan || 'Basic').trim()
            planCounts[p] = (planCounts[p] || 0) + 1
        })

        const planColorPalette = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#64748B']
        const subDistribution = Object.entries(planCounts).map(([name, count], idx) => ({
            name,
            count,
            pct: tenants.length > 0 ? `${Math.round((count / tenants.length) * 100)}%` : '0%',
            color: planColorPalette[idx % planColorPalette.length]
        })).sort((a, b) => b.count - a.count)

        // Unified Real Activity Stream from DB
        const recentActivities: any[] = []

        // 1. From recent audit logs
        auditLogs.slice(0, 4).forEach(a => {
            const titleStr = (a.action || 'system_event').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
            recentActivities.push({
                id: `audit-${a.id}`,
                title: titleStr,
                sub: a.module ? `Module: ${a.module.toUpperCase()}` : 'System Security Verification',
                time: a.created_at,
                type: 'audit',
                iconColor: '#F97316',
                iconBg: '#FFF7ED'
            })
        })

        // 2. From recent tenants
        tenants.slice(0, 3).forEach(t => {
            recentActivities.push({
                id: `tenant-${t.id}`,
                title: 'New institution registered',
                sub: t.name + (t.settings?.city ? `, ${t.settings.city}` : ''),
                time: t.created_at,
                type: 'school',
                iconColor: '#3B82F6',
                iconBg: '#EFF6FF'
            })
        })

        // 3. From recent payments
        successfulPayments.slice(0, 3).forEach(p => {
            const matchTenant = tenants.find(t => t.id === p.tenant_id)
            recentActivities.push({
                id: `payment-${p.id}`,
                title: 'Payment received',
                sub: `₹ ${Number(p.amount || 0).toLocaleString('en-IN')} from ${matchTenant?.name || 'Platform Institution'}`,
                time: p.created_at,
                type: 'payment',
                iconColor: '#10B981',
                iconBg: '#ECFDF5'
            })
        })

        // 4. From recent exams
        exams.slice(0, 2).forEach(e => {
            recentActivities.push({
                id: `exam-${e.id}`,
                title: 'Examination published',
                sub: e.name,
                time: e.created_at,
                type: 'exam',
                iconColor: '#8B5CF6',
                iconBg: '#F5F3FF'
            })
        })

        // Sort all activities chronologically
        recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        const finalActivities = recentActivities.slice(0, 6)

        // Recent Schools Table from DB
        const recentTenants = tenants.slice(0, 5).map(t => {
            const tStudents = users.filter(u => u.tenant_id === t.id && u.role === 'student').length
            return {
                id: t.id,
                name: t.name,
                city: t.settings?.city || (t.type === 'INSTITUTE' ? 'Campus' : 'Main Branch'),
                state: t.settings?.state || 'India',
                students: tStudents > 0 ? tStudents.toLocaleString('en-IN') : '0',
                plan: t.subscription_plan || 'Basic',
                status: t.is_active ? 'Active' : 'Pending',
                joinedOn: new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            }
        })

        // Inbound Support / Demo Inquiries Table from DB
        const openTickets = demoRequests.slice(0, 5).map((d, idx) => ({
            id: `TK-${(1028 - idx)}`,
            subject: d.organization ? `${d.organization} — Inbound Inquiry` : (d.message?.slice(0, 32) || 'Platform Support Request'),
            priority: idx % 2 === 0 ? 'High' : (idx === 3 ? 'Low' : 'Medium'),
            status: d.status === 'new' ? 'Open' : (d.status === 'in_progress' ? 'In Progress' : 'Resolved'),
            created_at: d.created_at
        }))

        return NextResponse.json({
            stats: {
                totalTenants: tenants.length,
                activeTenants: activeTenantsCount,
                periodTenants: periodTenantsCount,
                tenantGrowth: tenantGrowthPct,
                tenantTypesBreakdown,
                totalUsers: users.length,
                totalStudents: allStudents.length,
                periodStudents: periodStudentsCount,
                studentGrowth: studentGrowthPct,
                totalTeachers: allTeachers.length,
                periodTeachers: periodTeachersCount,
                teacherGrowth: teacherGrowthPct,
                totalRevenue: totalRevenueNum,
                periodRevenue: periodRevenueNum,
                revenueGrowth: revenueGrowthPct,
                netCommission: netCommissionNum,
                periodCommission: periodCommissionNum,
                pendingPayout: pendingAmountNum,
                pendingCount: pendingPayouts.length,
                totalExams: exams.length,
                periodExams: periodExamsCount,
                examGrowth: examGrowthPct,
                totalAttempts: attempts.length,
                successfulAttempts,
                periodAttempts,
                avgScore: avgScoreVal,
                avgAccuracy: avgAccuracyVal,
                criticalAlerts: procLogs.filter(p => p.severity === 'high' || p.severity === 'critical').length,
                activeLeads: leadsRes.count || 0
            },
            chartData: monthlyRevenue,
            monthlyUsers,
            maxStudentsInMonth,
            overallStudentGrowthPct,
            examSummary,
            stateDistribution,
            subDistribution,
            recentActivities: finalActivities,
            recentTenants,
            openTickets,
            tenants: tenants.map(t => ({ id: t.id, name: t.name, type: t.type }))
        })
    } catch (error: any) {
        console.error("Dashboard API Error:", error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
