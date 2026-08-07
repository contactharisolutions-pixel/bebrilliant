import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data: profile } = await supabaseAdmin.from('user_profiles')
        .select('role, tenant_id, full_name, email, class_id, division_id')
        .eq('id', user.id).single()
    if (!profile || !['student', 'parent'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let uid = user.id
    const tid = profile.tenant_id

    if (profile.role === 'parent') {
        const { data: childProfile } = await supabaseAdmin
            .from('user_profiles').select('id')
            .eq('parent_login_id', user.id).limit(1).single()
        if (childProfile) uid = childProfile.id
    }

    try {
        // ── Parallel DB queries ──────────────────────────────────────────────
        const [perfRes, examsRes, recentRaw, upcomingRaw, attendanceRes, walletRes, materialsRes] = await Promise.all([
            supabaseAdmin.from('student_performance')
                .select('marks_obtained, total_marks, percentage, subject_name, chapter, topic')
                .eq('student_id', uid),
            supabaseAdmin.from('exams')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tid).eq('status', 'active'),
            supabaseAdmin.from('exam_results')
                .select('id, exam_id, score, percentage, created_at')
                .eq('student_id', uid)
                .order('created_at', { ascending: false }).limit(6),
            supabaseAdmin.from('exams')
                .select('id, title, created_at, description, duration_minutes')
                .eq('tenant_id', tid).eq('status', 'active').limit(5),
            supabaseAdmin.from('attendance_logs')
                .select('status, date')
                .eq('student_id', uid).order('date', { ascending: false }).limit(60),
            supabaseAdmin.from('student_wallets')
                .select('total_credits, used_credits, free_credits, paid_credits')
                .eq('student_id', uid).limit(1),
            supabaseAdmin.from('study_materials')
                .select('id, title, type, created_at')
                .eq('tenant_id', tid)
                .order('created_at', { ascending: false }).limit(4),
        ])

        const performances = perfRes.data || []
        const totalPublished = examsRes.count || 0

        // ── KPI Calculations ─────────────────────────────────────────────────
        const avgScore = performances.length > 0
            ? Math.round(performances.reduce((acc, p) => acc + Number(p.percentage || 0), 0) / performances.length)
            : 0

        const completedIds = new Set((recentRaw.data || []).map((r: any) => r.exam_id))
        const completedCount = completedIds.size
        const pendingCount = Math.max(0, totalPublished - completedCount)

        // ── Attendance ───────────────────────────────────────────────────────
        const attLogs = attendanceRes.data || []
        const presentCount = attLogs.filter((a: any) => a.status === 'present').length
        const attendanceRate = attLogs.length > 0 ? Math.round((presentCount / attLogs.length) * 100) : 0
        const streakDays = (() => {
            let streak = 0
            for (const log of attLogs) {
                if (log.status === 'present') streak++
                else break
            }
            return streak
        })()

        // ── Wallet ───────────────────────────────────────────────────────────
        const walletData = walletRes.data?.[0] || null
        const totalCredits = walletData ? (walletData.total_credits || 0) : 0
        const usedCredits = walletData ? (walletData.used_credits || 0) : 0
        const creditsLeft = Math.max(0, totalCredits - usedCredits)

        // ── Subject Mastery ──────────────────────────────────────────────────
        const subjectMap: Record<string, { total: number; count: number }> = {}
        performances.forEach(p => {
            const s = (p as any).subject_name || (p as any).subject || 'General'
            if (!subjectMap[s]) subjectMap[s] = { total: 0, count: 0 }
            subjectMap[s].total += Number(p.percentage || 0)
            subjectMap[s].count++
        })
        const subjectMastery = Object.entries(subjectMap).map(([subject, stats]) => ({
            subject,
            mastery: Math.round(stats.total / stats.count),
            fullMark: 100
        })).slice(0, 5)

        // ── Performance Trend ────────────────────────────────────────────────
        const resultsSorted = [...(recentRaw.data || [])].reverse()
        const performanceTrend = resultsSorted.length > 0
            ? resultsSorted.map((r: any, i: number) => ({
                name: `Test ${i + 1}`,
                score: Math.round(Number(r.percentage || 0)),
                label: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            }))
            : [{ name: 'Session', score: avgScore || 0, label: 'Now' }]

        // ── Recent Exam Results ──────────────────────────────────────────────
        const recentResults = (recentRaw.data || []).map((r: any, i: number) => ({
            id: r.id,
            exam_name: `Assessment ${completedCount - i}`,
            score: Math.round(Number(r.percentage || 0)),
            max: 100,
            date: new Date(r.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            trend: Number(r.percentage || 0) >= 70 ? 'up' : 'down'
        }))

        // ── Upcoming Exams ───────────────────────────────────────────────────
        const upcomingExams = (upcomingRaw.data || [])
            .filter((e: any) => !completedIds.has(e.id))
            .map((e: any) => ({
                id: e.id,
                name: e.title,
                date: e.created_at,
                subject: 'General',
                duration: e.duration_minutes || 60
            }))

        // ── Weak Areas ───────────────────────────────────────────────────────
        const areaMap: Record<string, { total: number; count: number; subject: string; chapter: string; topic: string }> = {}
        performances.forEach(p => {
            const subject = (p as any).subject_name || (p as any).subject || 'General'
            const chapter = p.chapter || 'Foundations'
            const topic = p.topic || 'Core Concepts'
            const key = `${subject}|${chapter}|${topic}`
            if (!areaMap[key]) areaMap[key] = { total: 0, count: 0, subject, chapter, topic }
            areaMap[key].total += Number(p.percentage || 0)
            areaMap[key].count++
        })
        const weakAreas = Object.values(areaMap)
            .map(a => ({ subject: a.subject, chapter: a.chapter, topic: a.topic, score: Math.round(a.total / a.count) }))
            .filter(a => a.score < 60)
            .sort((a, b) => a.score - b.score)
            .slice(0, 4)

        // ── Study Materials ──────────────────────────────────────────────────
        const recentMaterials = (materialsRes.data || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            type: m.type || 'PDF',
            date: new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        }))

        // ── Achievement Badge ────────────────────────────────────────────────
        let achievementBadge = 'Learner'
        if (avgScore >= 90) achievementBadge = 'Distinction'
        else if (avgScore >= 80) achievementBadge = 'Excellence'
        else if (avgScore >= 70) achievementBadge = 'Merit'
        else if (avgScore >= 60) achievementBadge = 'Pass'

        return NextResponse.json({
            student: {
                name: profile.full_name || 'Student',
                email: profile.email || '',
                badge: achievementBadge,
            },
            kpi: {
                avg_score: avgScore,
                completed_exams: completedCount,
                pending_exams: pendingCount,
                attendance_rate: attendanceRate,
                streak_days: streakDays,
                credits_left: creditsLeft,
            },
            upcoming_exams: upcomingExams,
            recent_results: recentResults,
            performance_trend: performanceTrend,
            subject_mastery: subjectMastery,
            weak_areas: weakAreas,
            recent_materials: recentMaterials,
            announcements: [],
        })
    } catch (e: any) {
        console.error('Student Dashboard API Error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
