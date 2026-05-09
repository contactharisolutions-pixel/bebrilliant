import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'owner' ? user : null
}

export async function GET() {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    try {
        const { data: requests, error } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*, tenants(name)')
            .order('requested_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ requests })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { requestId, action, admin_note, transaction_ref } = await request.json()

    try {
        if (action === 'APPROVE') {
            // 1. Mark request as approved/settled
            const { data: withdrawal, error: wErr } = await supabaseAdmin
                .from('withdrawal_requests')
                .update({ 
                    status: 'settled',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id,
                    admin_note
                })
                .eq('id', requestId)
                .select()
                .single()

            if (wErr || !withdrawal) throw new Error('Withdrawal request not found or update failed.')

            // 2. Fetch Finance Config for Fees/TDS calculation
            const { data: configData } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'finance_config').single()
            const config = configData?.value || { tds_percent: 10.0, processing_fee_percent: 2.0 }

            const gross = parseFloat(withdrawal.amount)
            const tds = (gross * parseFloat(config.tds_percent)) / 100
            const fees = (gross * parseFloat(config.processing_fee_percent)) / 100
            const net = gross - tds - fees

            // 3. Record in Settlements
            const { error: sErr } = await supabaseAdmin
                .from('settlements')
                .insert({
                    tenant_id: withdrawal.tenant_id,
                    withdrawal_request_id: withdrawal.id,
                    gross_amount: gross,
                    tds_amount: tds,
                    processing_fees: fees,
                    net_paid: net,
                    transaction_ref: transaction_ref,
                    payment_method: 'bank_transfer',
                    status: 'completed',
                    processed_by: user.id
                })

            if (sErr) throw sErr

            // 4. Atomic balance settlement
            await supabaseAdmin.rpc('settle_pending_balance', {
                p_tenant_id: withdrawal.tenant_id,
                p_amount: gross
            })

            return NextResponse.json({ success: true, net_paid: net })
        }

        if (action === 'REJECT') {
            const { data: withdrawal, error: fetchErr } = await supabaseAdmin
                .from('withdrawal_requests')
                .select('amount, tenant_id')
                .eq('id', requestId)
                .single()

            if (fetchErr || !withdrawal) throw new Error('Withdrawal request not found.')

            const { error: rErr } = await supabaseAdmin
                .from('withdrawal_requests')
                .update({ 
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id,
                    admin_note
                })
                .eq('id', requestId)

            if (rErr) throw rErr

            // Refund balance atomic
            await supabaseAdmin.rpc('refund_pending_balance', {
                p_tenant_id: withdrawal.tenant_id,
                p_amount: withdrawal.amount
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
