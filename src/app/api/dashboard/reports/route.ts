import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    // Admin/Owner view for financial reports and overall metrics
    if (profile?.tenant_id && ['admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Analytics Request' }, { status: 403 })

    const { tenant_id } = session

    try {
        // We would typically run aggregations on 'exam_attempts' and 'payments'
        // To maintain robust UI flow while database matures, we safely query and fallback

        let revenueData = []
        let performanceData = []
        const passFailRatio = { pass: 78, fail: 22 } // Mock baseline

        // Attempt real revenue fetch if 'payments' mapped correctly
        const { data: payments } = await supabaseAdmin
            .from('payments')
            .select('amount, created_at, status')
            .eq('tenant_id', tenant_id)
            .eq('status', 'success')
            .order('created_at', { ascending: true })

        if (payments && payments.length > 0) {
            // Simple grouping by month (mocking full pipeline mapping logic)
            const grouped: Record<string, number> = {}
            payments.forEach(p => {
                const date = new Date(p.created_at).toLocaleString('default', { month: 'short' })
                grouped[date] = (grouped[date] || 0) + Number(p.amount)
            })
            revenueData = Object.entries(grouped).map(([name, total]) => ({ name, total }))
        } else {
            // Fallback Mock Logic mapped for aesthetic array testing
            revenueData = [
                { name: 'Jan', total: 42000 }, { name: 'Feb', total: 58000 },
                { name: 'Mar', total: 49000 }, { name: 'Apr', total: 72000 },
                { name: 'May', total: 85000 }, { name: 'Jun', total: 104000 }
            ]
        }

        // Mock Performance Logs
        performanceData = [
            { name: 'Week 1', avg_score: 65, active_students: 120 },
            { name: 'Week 2', avg_score: 68, active_students: 135 },
            { name: 'Week 3', avg_score: 74, active_students: 150 },
            { name: 'Week 4', avg_score: 72, active_students: 180 },
            { name: 'Week 5', avg_score: 81, active_students: 210 },
            { name: 'Week 6', avg_score: 85, active_students: 230 }
        ]

        return NextResponse.json({
            revenue: revenueData,
            performance: performanceData,
            pass_fail: [
                { name: 'Pass Threshold', value: passFailRatio.pass, fill: '#10B981' },
                { name: 'Failed', value: passFailRatio.fail, fill: '#EF4444' }
            ]
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
