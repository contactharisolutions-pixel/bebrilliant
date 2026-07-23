import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'GET_SETTINGS'

    try {
        if (action === 'GET_TEACHERS') {
            const { data: teachers, error: err1 } = await supabaseAdmin
                .from('affiliate_teachers')
                .select('*, tenants(name)')
                .order('created_at', { ascending: false })

            if (err1) throw err1

            // Fetch wallets to map balances
            const { data: wallets } = await supabaseAdmin
                .from('affiliate_wallets')
                .select('*')
                .eq('affiliate_type', 'teacher')

            const mapped = (teachers || []).map((t: any) => {
                const w = wallets?.find((w: any) => w.affiliate_id === t.id)
                return {
                    ...t,
                    wallet_balance: w?.balance || 0,
                    wallet_withdrawable: w?.withdrawable || 0
                }
            })

            return NextResponse.json({ teachers: mapped })
        }

        if (action === 'GET_WITHDRAWALS') {
            const { data: withdrawals, error: err2 } = await supabaseAdmin
                .from('affiliate_withdrawals')
                .select('*, affiliate_teachers(*, tenants(name))')
                .order('requested_at', { ascending: false })

            if (err2) throw err2
            return NextResponse.json({ withdrawals: withdrawals || [] })
        }

        // Default GET_SETTINGS
        const tenant_id = searchParams.get('tenant_id')
        if (!tenant_id) return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })

        const { data: settings } = await supabaseAdmin
            .from('affiliate_settings')
            .select('*')
            .eq('tenant_id', tenant_id)
            .maybeSingle()

        return NextResponse.json({ settings: settings || null })
    } catch (e: any) {
        console.error('Affiliate owner GET error:', e)
        return NextResponse.json({ error: e.message || 'GET failed' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'SAVE_SETTINGS'

    try {
        const body = await request.json()

        if (action === 'UPDATE_KYC_STATUS') {
            const { id, kyc_status, status } = body
            const { data, error } = await supabaseAdmin
                .from('affiliate_teachers')
                .update({ kyc_status, status, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ teacher: data })
        }

        if (action === 'PROCESS_WITHDRAWAL') {
            const { id, status, bank_reference } = body // 'paid' or 'rejected'

            const { data: wreq, error: errFetch } = await supabaseAdmin
                .from('affiliate_withdrawals')
                .select('*')
                .eq('id', id)
                .single()

            if (errFetch || !wreq) return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })

            const { data: wallet } = await supabaseAdmin
                .from('affiliate_wallets')
                .select('*')
                .eq('affiliate_id', wreq.teacher_id)
                .eq('affiliate_type', 'teacher')
                .single()

            if (!wallet) return NextResponse.json({ error: 'Affiliate wallet not found' }, { status: 404 })

            // Process status change
            if (status === 'paid') {
                // Deduct from actual balance (locked withdrawable was already deducted at creation)
                await supabaseAdmin
                    .from('affiliate_wallets')
                    .update({
                        balance: wallet.balance - wreq.amount_requested,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', wallet.id)
            } else if (status === 'rejected') {
                // Refund withdrawable balance
                await supabaseAdmin
                    .from('affiliate_wallets')
                    .update({
                        withdrawable: wallet.withdrawable + wreq.amount_requested,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', wallet.id)
            }

            const { data: updatedWreq, error: errUpdate } = await supabaseAdmin
                .from('affiliate_withdrawals')
                .update({
                    status,
                    bank_reference: status === 'paid' ? bank_reference : null,
                    processed_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            if (errUpdate) throw errUpdate
            return NextResponse.json({ withdrawal: updatedWreq })
        }

        // Default SAVE_SETTINGS
        const tenant_id = searchParams.get('tenant_id')
        if (!tenant_id) return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from('affiliate_settings')
            .upsert({
                tenant_id,
                ...body,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ settings: data })
    } catch (e: any) {
        console.error('Affiliate owner POST error:', e)
        return NextResponse.json({ error: e.message || 'POST failed' }, { status: 500 })
    }
}
