import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile || profile.role !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const uid = user.id
    const tid = profile.tenant_id

    try {
        // 1. KPI Aggregation
        const [perfRes, examsRes] = await Promise.all([
            // Select all necessary dimensions for deep analytics
            supabaseAdmin.from('student_performance').select('marks_obtained, total_marks, percentage, exam_id, exam_date, subject, chapter, topic, exams(name)').eq('student_id', uid).order('exam_date', { ascending: true }),
            supabaseAdmin.from('exams').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('is_active', true)
        ])

        const performances = perfRes.data || []
        const totalPublished = examsRes.count || 0

        const avgScore = performances.length > 0 
            ? Math.round(performances.reduce((acc, p) => acc + Number(p.percentage), 0) / performances.length) 
            : 0
        
        const completedCount = new Set(performances.map(p => p.exam_id)).size
        const pendingCount = Math.max(0, totalPublished - completedCount)

        // 2. Recent Results
        const { data: recentRaw } = await supabaseAdmin
            .from('student_performance')
            .select('id, exam_id, marks_obtained, total_marks, exam_date, exams(name)')
            .eq('student_id', uid)
            .order('exam_date', { ascending: false })
            .limit(5)

        const recentResults = (recentRaw || []).map((r: any) => ({
            id: r.id,
            exam_name: r.exams?.name || 'Institutional Exam',
            score: r.marks_obtained,
            max: r.total_marks,
            date: new Date(r.exam_date).toLocaleDateString(),
            trend: r.marks_obtained / r.total_marks >= 0.7 ? 'up' : 'down'
        }))

        // 3. Subject Mastery
        const subjectMap: Record<string, { total: number, count: number }> = {}
        performances.forEach(p => {
            const s = (p as any).subject || 'General'
            if (!subjectMap[s]) subjectMap[s] = { total: 0, count: 0 }
            subjectMap[s].total += Number(p.percentage)
            subjectMap[s].count++
        })
        const subjectMastery = Object.entries(subjectMap).map(([subject, stats]) => ({
            subject,
            mastery: Math.round(stats.total / stats.count)
        })).slice(0, 4)

        // 4. Performance Trend (Dynamically built from chronological exam history)
        const perfByMonth: Record<string, { total: number, count: number }> = {}
        performances.forEach(p => {
            const dateStr = p.exam_date || new Date().toISOString()
            const month = new Date(dateStr).toLocaleString('default', { month: 'short' })
            if (!perfByMonth[month]) perfByMonth[month] = { total: 0, count: 0 }
            perfByMonth[month].total += Number(p.percentage || 0)
            perfByMonth[month].count++
        })
        
        let performanceTrend = Object.entries(perfByMonth).map(([name, stats]) => ({
            name,
            score: Math.round(stats.total / stats.count)
        }))

        if (performanceTrend.length === 0) {
            performanceTrend = [ { name: 'Active Session', score: avgScore || 0 } ]
        }

        // 5. Upcoming Exams
        const { data: upcomingRaw } = await supabaseAdmin
            .from('exams')
            .select('id, name, created_at, description')
            .eq('tenant_id', tid)
            .eq('is_active', true)
            .limit(3)
        
        // Filter out those already completed
        const completedIds = new Set(performances.map(p => p.exam_id))
        const upcomingExams = (upcomingRaw || [])
            .filter(e => !completedIds.has(e.id))
            .map(e => ({
                id: e.id,
                name: e.name,
                date: e.created_at, // Placeholder for actual schedule
                subject: 'General',
                duration: 60
            }))

        // 6. Weak Areas & Improvement Analytics (Subject -> Chapter -> Topic)
        const areaMap: Record<string, { total: number, count: number, subject: string, chapter: string, topic: string }> = {}
        performances.forEach(p => {
            const subject = p.subject || 'General'
            const chapter = p.chapter || 'Foundations'
            const topic = p.topic || 'Core Concepts'
            const key = `${subject}|${chapter}|${topic}`
            
            if (!areaMap[key]) areaMap[key] = { total: 0, count: 0, subject, chapter, topic }
            areaMap[key].total += Number(p.percentage || 0)
            areaMap[key].count++
        })

        // Filter for weak areas (average score below 60%)
        const weakAreas = Object.values(areaMap)
            .map(area => ({
                subject: area.subject,
                chapter: area.chapter,
                topic: area.topic,
                score: Math.round(area.total / area.count)
            }))
            .filter(area => area.score < 60)
            .sort((a, b) => a.score - b.score) // Lowest scores first
            .slice(0, 5) // Top 5 critical areas

        return NextResponse.json({
            kpi: {
                avg_score: avgScore,
                completed_exams: completedCount,
                pending_exams: pendingCount
            },
            upcoming_exams: upcomingExams,
            recent_results: recentResults,
            performance_trend: performanceTrend,
            subject_mastery: subjectMastery,
            weak_areas: weakAreas,
            announcements: []
        })
    } catch (e: any) {
        console.error('Student Dashboard API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
