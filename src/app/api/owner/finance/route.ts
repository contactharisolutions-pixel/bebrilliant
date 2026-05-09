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

export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 1. Owner Wallet
    const { data: wallet } = await supabaseAdmin.from('owner_wallet').select('*').limit(1).single()

    // 2. Commission Rules
    const { data: rules } = await supabaseAdmin
        .from('commission_rules')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false })

    // 3. Pending & Processed Payouts
    const { data: payouts } = await supabaseAdmin
        .from('payouts')
        .select('*, tenants(name)')
        .order('requested_at', { ascending: false })

    // 4. Ledger Transactions
    const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false })
        .limit(100)

    // 5. Compute mock total revenue if wallet is missing/empty
    const activePayments = payments?.filter(p => p.status === 'success') || []
    const totalRevenue = activePayments.reduce((s, p) => s + Number(p.amount || 0), 0)

    return NextResponse.json({
        wallet: wallet || { total_balance: totalRevenue, commission_earned: 0 },
        rules: rules || [],
        payouts: payouts || [],
        payments: payments || []
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'CREATE_RULE') {
            const { data, error } = await supabaseAdmin.from('commission_rules').insert([payload]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'UPDATE_RULE') {
            const { id, ...updates } = payload
            const { data, error } = await supabaseAdmin.from('commission_rules').update(updates).eq('id', id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'PROCESS_PAYOUT') {
            const { id, status, transaction_ref } = payload
            const { data, error } = await supabaseAdmin.from('payouts').update({
                status,
                transaction_ref,
                processed_at: status === 'processed' ? new Date().toISOString() : null
            }).eq('id', id).select().single()

            if (error) throw error

            // Release pending balance in tenant wallet if successful
            if (status === 'processed' && data) {
                // get tenant wallet
                const { data: tWallet } = await supabaseAdmin.from('tenant_wallet').select('*').eq('tenant_id', data.tenant_id).single()
                if (tWallet) {
                    await supabaseAdmin.from('tenant_wallet').update({
                        available_balance: Math.max(0, tWallet.available_balance - data.amount)
                    }).eq('tenant_id', data.tenant_id)
                }
            }

            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
