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

export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'LIST'

    try {
        if (action === 'GET_SETTLEMENT') {
            const reqId = searchParams.get('withdrawal_request_id')
            if (!reqId) return NextResponse.json({ error: 'Withdrawal Request ID required' }, { status: 400 })

            const { data: settlement, error } = await supabaseAdmin
                .from('settlements')
                .select('*')
                .eq('withdrawal_request_id', reqId)
                .maybeSingle()

            if (error) throw error

            if (settlement && settlement.processed_by) {
                const { data: profile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('first_name, last_name')
                    .eq('id', settlement.processed_by)
                    .maybeSingle()

                if (profile) {
                    settlement.processor_name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                }
            }

            return NextResponse.json({ settlement })
        }

        if (action === 'GET_TREASURY_CONFIG') {
            const { data: config } = await supabaseAdmin
                .from('platform_settings')
                .select('value')
                .eq('key', 'finance_config')
                .maybeSingle()

            return NextResponse.json({ config: config?.value || { tds_percent: 10.0, processing_fee_percent: 2.0 } })
        }

        // Default LIST
        const { data: requests, error } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*, tenants(name)')
            .order('requested_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ requests: requests || [] })
    } catch (error: any) {
        console.error('Withdrawals GET error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    try {
        const body = await request.json()
        const { action, requestId, admin_note, transaction_ref } = body

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
                    transaction_ref: transaction_ref || `TRX-${Date.now()}`,
                    payment_method: 'bank_transfer',
                    status: 'completed',
                    processed_at: new Date().toISOString(),
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

        if (action === 'MANUAL_ADJUST') {
            const { tenantId, amount, notes } = body // positive to credit, negative to debit
            if (!tenantId || amount === undefined) {
                return NextResponse.json({ error: 'Tenant ID and amount are required' }, { status: 400 })
            }

            const { data: wallet } = await supabaseAdmin
                .from('tenant_wallet')
                .select('*')
                .eq('tenant_id', tenantId)
                .single()

            if (!wallet) return NextResponse.json({ error: 'Tenant wallet not found' }, { status: 404 })

            const { data: updated, error: wErr } = await supabaseAdmin
                .from('tenant_wallet')
                .update({
                    available_balance: Math.max(0, Number(wallet.available_balance) + Number(amount)),
                    last_updated: new Date().toISOString()
                })
                .eq('tenant_id', tenantId)
                .select()
                .single()

            if (wErr) throw wErr

            // Log adjustment notes in settlements or wallet transactions (optional, simple log returned here)
            return NextResponse.json({ success: true, wallet: updated })
        }

        if (action === 'UPDATE_TREASURY_CONFIG') {
            const { tds_percent, processing_fee_percent } = body
            if (tds_percent === undefined || processing_fee_percent === undefined) {
                return NextResponse.json({ error: 'Rates are required' }, { status: 400 })
            }

            const { error } = await supabaseAdmin
                .from('platform_settings')
                .upsert({
                    key: 'finance_config',
                    value: {
                        tds_percent: parseFloat(tds_percent),
                        processing_fee_percent: parseFloat(processing_fee_percent)
                    },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' })

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        console.error('Withdrawals POST error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
