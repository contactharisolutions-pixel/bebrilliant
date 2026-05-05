import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin
        .from('user_profiles').select('role').eq('id', user.id).single()
    return p?.role === 'owner' ? user : null
}

/** GET /api/owner/payments - Full ledger with filters/pagination */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    // Payments query
    let payQ = supabaseAdmin
        .from('payments')
        .select(`
      id, amount, status, razorpay_payment_id, razorpay_order_id, created_at,
      tenant_id,
      tenants!payments_tenant_id_fkey(name, type)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status !== 'all') payQ = payQ.eq('status', status)
    if (search) payQ = payQ.ilike('razorpay_payment_id', '%' + search + '%')

    const { data: payments, error: payError, count } = await payQ

    if (payError) return NextResponse.json({ error: payError.message }, { status: 500 })

    // Revenue stats in parallel
    const [allPayRes, subsRes] = await Promise.all([
        supabaseAdmin.from('payments').select('amount, status, created_at'),
        supabaseAdmin.from('tenant_subscriptions').select('amount, status, plan_name, billing_cycle, created_at').order('created_at', { ascending: false }).limit(100),
    ])

    const allPay = allPayRes.data ?? []
    const successfulPay = allPay.filter(p => p.status === 'paid' || p.status === 'captured' || p.status === 'success')
    const totalRevenue = successfulPay.reduce((s, p) => s + Number(p.amount), 0)

    // Monthly breakdown (last 6 months)
    const now = new Date()
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const total = successfulPay.filter(p => {
            const pd = new Date(p.created_at)
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
        }).reduce((s, p) => s + Number(p.amount), 0)
        return { label, total }
    })

    return NextResponse.json({
        payments: payments ?? [],
        total: count ?? 0,
        page,
        pageSize: limit,
        stats: {
            totalRevenue,
            totalTransactions: allPay.length,
            successfulTransactions: successfulPay.length,
            pendingTransactions: allPay.filter(p => p.status === 'pending' || p.status === 'created').length,
            failedTransactions: allPay.filter(p => p.status === 'failed').length,
        },
        monthlyRevenue,
        recentSubscriptions: subsRes.data ?? [],
    })
}
