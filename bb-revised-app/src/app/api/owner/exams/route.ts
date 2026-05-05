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

/** GET /api/owner/exams - Global exam oversight dashboard */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tenantId = searchParams.get('tenant') || 'all'
    const paidFilter = searchParams.get('paid') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // ── Exams with config + attempt counts ──
    let examQ = supabaseAdmin
        .from('exams')
        .select(`
      id, name, description, is_paid, price, duration, allow_anytime,
      start_time, end_time, created_at, tenant_id,
      tenants!exams_tenant_id_fkey(name, type),
      exam_config(total_questions, total_marks, negative_marking, randomization_mode)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) examQ = examQ.ilike('name', '%' + search + '%')
    if (tenantId !== 'all') examQ = examQ.eq('tenant_id', tenantId)
    if (paidFilter === 'paid') examQ = examQ.eq('is_paid', true)
    if (paidFilter === 'free') examQ = examQ.eq('is_paid', false)

    const { data: exams, error: examErr, count } = await examQ
    if (examErr) return NextResponse.json({ error: examErr.message }, { status: 500 })

    // Attempt counts per exam (parallel query per exam ID batch)
    const examIds = (exams ?? []).map(e => e.id)
    let attemptMap: Record<string, number> = {}
    if (examIds.length > 0) {
        const { data: attempts } = await supabaseAdmin
            .from('exam_attempts')
            .select('exam_id')
            .in('exam_id', examIds)
            ; (attempts ?? []).forEach(a => { attemptMap[a.exam_id] = (attemptMap[a.exam_id] || 0) + 1 })
    }

    // Proctoring flags count
    let procMap: Record<string, number> = {}
    if (examIds.length > 0) {
        const { data: procLogs } = await supabaseAdmin
            .from('proctoring_logs')
            .select('exam_id, severity')
            .in('exam_id', examIds)
            .in('severity', ['high', 'critical'])
            ; (procLogs ?? []).forEach(p => { procMap[p.exam_id] = (procMap[p.exam_id] || 0) + 1 })
    }

    // ── Global stats ──
    const [allExamsRes, allAttemptsRes, procRes, tenantsRes] = await Promise.all([
        supabaseAdmin.from('exams').select('id, is_paid, created_at'),
        supabaseAdmin.from('exam_attempts').select('status, total_score'),
        supabaseAdmin.from('proctoring_logs').select('severity, exam_id'),
        supabaseAdmin.from('tenants').select('id, name, type').order('name'),
    ])

    const allE = allExamsRes.data ?? []
    const allA = allAttemptsRes.data ?? []
    const procAll = procRes.data ?? []

    const stats = {
        totalExams: allE.length,
        paidExams: allE.filter(e => e.is_paid).length,
        freeExams: allE.filter(e => !e.is_paid).length,
        totalAttempts: allA.length,
        evaluatedAttempts: allA.filter(a => a.status === 'evaluated').length,
        avgScore: allA.filter(a => a.total_score !== null).length > 0
            ? (allA.filter(a => a.total_score !== null).reduce((s, a) => s + Number(a.total_score), 0) / allA.filter(a => a.total_score !== null).length).toFixed(1)
            : '0',
        highSeverityFlags: procAll.filter(p => p.severity === 'high' || p.severity === 'critical').length,
    }

    // Monthly exam creation trend (last 6 months)
    const now = new Date()
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const count = allE.filter(e => {
            const ed = new Date(e.created_at)
            return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
        }).length
        return { label, count }
    })

    return NextResponse.json({
        exams: (exams ?? []).map(e => ({
            ...e,
            attemptCount: attemptMap[e.id] || 0,
            procFlagCount: procMap[e.id] || 0,
        })),
        total: count ?? 0,
        page,
        pageSize: limit,
        stats,
        monthlyTrend,
        tenants: tenantsRes.data ?? [],
    })
}
