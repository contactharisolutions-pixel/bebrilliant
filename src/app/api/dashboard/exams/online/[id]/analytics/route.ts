import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id: examId } = await params
    const studentId = request.nextUrl.searchParams.get('studentId')

    try {
        if (studentId) {
            // 1. STUDENT SPECIFIC ANALYTICS
            const { data: attempts } = await supabaseAdmin
                .from('online_exam_attempts')
                .select('*')
                .eq('exam_id', examId)
                .order('score', { ascending: false })

            const studentAttempt = attempts?.find(a => a.student_id === studentId)
            if (!studentAttempt) return NextResponse.json({ error: 'No attempt found' })

            const rank = (attempts?.findIndex(a => a.id === studentAttempt.id) || 0) + 1
            const total = attempts?.length || 0
            const percentile = total > 1 ? ((total - rank) / (total - 1)) * 100 : 100

            // 2. Fetch Topic-wise Breakdown
            const { data: answers } = await supabaseAdmin
                .from('online_exam_answers')
                .select('*, q:questions(topic_id, chapters(name))')
                .eq('attempt_id', studentAttempt.id)

            const topics: Record<string, any> = {}
            answers?.forEach(a => {
                const topic = a.q?.chapters?.name || 'General'
                if (!topics[topic]) topics[topic] = { correct: 0, total: 0 }
                topics[topic].total++
                if (a.is_correct) topics[topic].correct++
            })

            return NextResponse.json({
                metrics: { rank, total, percentile: percentile.toFixed(2), score: studentAttempt.score },
                topicBreakdown: topics
            })
        } else {
            // 3. TEACHER/ADMIN ANALYTICS (Aggregated)
            const { data: allAttempts } = await supabaseAdmin
                .from('online_exam_attempts')
                .select('score, status')
                .eq('exam_id', examId)

            const scores = allAttempts?.map(a => a.score) || []
            const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
            
            return NextResponse.json({
                overview: {
                    totalAttempts: allAttempts?.length || 0,
                    averageScore: avgScore.toFixed(2),
                    highestScore: Math.max(...scores, 0),
                    lowestScore: Math.min(...scores, 0)
                }
            })
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
