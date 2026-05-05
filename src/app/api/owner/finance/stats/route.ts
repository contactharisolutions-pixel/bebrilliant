import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    
    const { data: profile } = await supabaseAdmin
        .from('user_profiles').select('role').eq('id', user.id).single()
    
    return (profile?.role === 'owner' || profile?.role === 'admin') ? user : null
}

export async function GET() {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // Fetch KPIs
        const { data: wallet, error: wError } = await supabaseAdmin
            .from('owner_wallet')
            .select('*')
            .maybeSingle()

        const walletData = wallet || { total_balance: 0, commission_earned: 0 }

        // Breakdown revenue by type
        const { data: typeStats, error: tError } = await supabaseAdmin
            .from('payments')
            .select('type, amount')
            .eq('status', 'success')

        if (tError) throw tError

        const breakdown = {
            subscription: 0,
            exam: 0,
            wallet: 0,
            syllabus: 0,
            marketplace: 0
        }
        
        typeStats.forEach((p: any) => {
            if (p.type in breakdown) {
                (breakdown as any)[p.type] += p.amount
            }
        })

        // Count active subscriptions
        const { count: activeSubs, error: sError } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        if (sError) throw sError

        // Sum of pending payouts
        const { data: pendingPayouts, error: pError } = await supabaseAdmin
            .from('payouts')
            .select('amount')
            .eq('status', 'pending')

        if (pError) throw pError

        const totalPendingPayouts = pendingPayouts.reduce((acc, current) => acc + current.amount, 0)

        // Recent Transactions (Limit 10)
        const { data: recentPayments, error: rError } = await supabaseAdmin
            .from('payments')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })
            .limit(10)

        if (rError) throw rError

        // Recent Invoices
        const { data: recentInvoices, error: iError } = await supabaseAdmin
            .from('invoices')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })
            .limit(10)

        if (iError) throw iError

        return NextResponse.json({
            stats: {
                totalRevenue: walletData.total_balance,
                commissionEarned: walletData.commission_earned,
                activeSubscriptions: activeSubs || 0,
                pendingPayouts: totalPendingPayouts,
                breakdown,
                netProfit: walletData.commission_earned // In this model, Owner's profit IS the commission + subscription full logic
            },
            recentPayments,
            recentInvoices
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
