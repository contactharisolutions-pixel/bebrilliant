import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // 1. Fetch all successful payments
        const { data: payments, error: pErr } = await supabaseAdmin
            .from('payments')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })

        if (pErr) throw pErr

        // 2. Fetch total active tenant count
        const { count: tenantCount, error: tErr } = await supabaseAdmin
            .from('tenants')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)

        if (tErr) throw tErr

        // 3. Compute metrics
        let totalRevenue = 0
        let subscriptionRevenue = 0
        let examRevenue = 0
        let walletRevenue = 0
        let syllabusRevenue = 0

        payments?.forEach((p: any) => {
            if (p.status === 'success') {
                const amt = parseFloat(p.amount.toString())
                totalRevenue += amt
                if (p.type === 'subscription') subscriptionRevenue += amt
                else if (p.type === 'exam') examRevenue += amt
                else if (p.type === 'wallet') walletRevenue += amt
                else if (p.type === 'syllabus') syllabusRevenue += amt
            }
        })

        const activeTenants = tenantCount || 1
        const arpu = totalRevenue / activeTenants
        const mrr = subscriptionRevenue // Simplified as subscription payments represent monthly intake
        const arr = mrr * 12

        return NextResponse.json({
            metrics: {
                totalRevenue,
                subscriptionRevenue,
                examRevenue,
                walletRevenue,
                syllabusRevenue,
                mrr,
                arr,
                arpu,
                activeTenants
            },
            payments: payments || []
        })
    } catch (e: any) {
        console.error('Payments API error:', e)
        return NextResponse.json({ error: e.message || 'Fetch failed' }, { status: 500 })
    }
}
