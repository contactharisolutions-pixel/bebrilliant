import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile) return null

    // Platform Owner bypass
    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Finance Settings' }, { status: 403 })

    const { tenant_id } = session as any

    try {
        // 1. Fetch Tenant Wallet
        const { data: wallet, error: wError } = await supabaseAdmin
            .from('tenant_wallet')
            .select('*')
            .eq('tenant_id', tenant_id)
            .maybeSingle()
        
        const available_balance = wallet?.available_balance || 0

        // 2. Fetch Detailed Stats (Gross from success payments)
        const { data: payments } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('status', 'success')

        const total_earnings = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0

        // 3. Fetch Withdrawal History
        const { data: withdrawals } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('requested_at', { ascending: false })

        const pending_settlement = withdrawals?.filter(w => w.status === 'pending' || w.status === 'approved').reduce((acc, w) => acc + Number(w.amount), 0) || 0
        const withdrawn_amount = withdrawals?.filter(w => w.status === 'settled').reduce((acc, w) => acc + Number(w.amount), 0) || 0

        // 4. Fetch Config
        const { data: configData } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'finance_config').single()
        const config = configData?.value || { min_withdrawal_amount: 1000 }

        return NextResponse.json({
            wallet: {
                total_earnings,
                withdrawn_amount,
                pending_settlement,
                available_balance,
                monthly_earnings: total_earnings // Simplified for now
            },
            withdrawals: withdrawals || [],
            payments: payments?.slice(0, 10) || [],
            config
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'REQUEST_PAYOUT') {
            const { amount } = payload
            const withdrawAmount = Number(amount)

            // 1. Fetch Config
            const { data: configData } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'finance_config').single()
            const config = configData?.value || { min_withdrawal_amount: 1000 }

            if (withdrawAmount < config.min_withdrawal_amount) {
                return NextResponse.json({ error: `Minimum withdrawal amount is ₹${config.min_withdrawal_amount}` }, { status: 400 })
            }

            // 2. Check Balance
            const { data: wallet } = await supabaseAdmin.from('tenant_wallet').select('available_balance').eq('tenant_id', tenant_id).single()
            if (!wallet || wallet.available_balance < withdrawAmount) {
                return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
            }

            // 3. Record Request
            const { data, error } = await supabaseAdmin
                .from('withdrawal_requests')
                .insert([{
                    tenant_id,
                    amount: withdrawAmount,
                    status: 'pending'
                }])
                .select()
                .single()

            if (error) throw error

            // 4. Deduct from Available
            await supabaseAdmin.rpc('move_to_pending_balance', { 
                p_tenant_id: tenant_id, 
                p_amount: withdrawAmount 
            })

            return NextResponse.json({ success: true, request: data })
        }

        return NextResponse.json({ error: 'Invalid routing sequence' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
