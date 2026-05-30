import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    if (profile?.role?.toLowerCase() === 'owner') {
        return { user }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyOwner()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    try {
        // 1. Core KPIs
        const [
            { count: tenantCount },
            { data: payments },
            { count: studentCount },
            { data: payouts },
            { data: exams },
            { data: procLogs },
            { count: leadCount }
        ] = await Promise.all([
            supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('payments').select('amount, created_at').eq('status', 'success'),
            supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabaseAdmin.from('payouts').select('amount').eq('status', 'pending'),
            supabaseAdmin.from('exams').select('id', { count: 'exact' }),
            supabaseAdmin.from('proctoring_logs').select('severity').in('severity', ['high', 'critical']),
            supabaseAdmin.from('owner_leads').select('*', { count: 'exact', head: true })
        ])

        const totalRevenue = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0
        const netCommission = totalRevenue * 0.10 // 10% platform fee logic
        const pendingAmount = payouts?.reduce((acc, p) => acc + Number(p.amount), 0) || 0

        // 2. Ecosystem Health Metrics
        const avgUsers = tenantCount && tenantCount > 0 ? (studentCount || 0) / tenantCount : 0
        const avgExams = tenantCount && tenantCount > 0 ? (exams?.length || 0) / tenantCount : 0
        const alertCount = procLogs?.length || 0

        // 3. Real Chart Data (Monthly Aggregation)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const currentMonth = new Date().getMonth()

        // Initialize last 6 months
        const chartData = Array.from({ length: 6 }, (_, i) => {
            const mIdx = (currentMonth - (5 - i) + 12) % 12
            return { name: months[mIdx], rev: 0 }
        })

        payments?.forEach(p => {
            const d = new Date(p.created_at)
            const mName = months[d.getMonth()]
            const target = chartData.find(c => c.name === mName)
            if (target) target.rev += Number(p.amount) / 1000 // Convert to K for chart scale
        })

        return NextResponse.json({
            stats: {
                totalTenants: tenantCount || 0,
                totalRevenue: `₹${totalRevenue.toLocaleString()}`,
                netCommission: `₹${netCommission.toLocaleString()}`,
                ecosystemBase: studentCount || 0,
                pendingPayout: `₹${pendingAmount.toLocaleString()}`,
                pendingCount: payouts?.length || 0,
                avgUsersPerNode: avgUsers.toFixed(1),
                avgExamsPerNode: avgExams.toFixed(1),
                criticalAlerts: alertCount,
                activeLeads: leadCount || 0
            },
            chartData
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
