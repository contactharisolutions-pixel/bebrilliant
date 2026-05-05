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
        const { data, error } = await supabaseAdmin
            .from('payouts')
            .select('*, tenants(name, bank_accounts(account_number, ifsc, bank_name))')
            .order('requested_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ payouts: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

/**
 * Handle approving or processing a payout.
 * Updating status to 'processed' or 'failed'.
 */
export async function PATCH(request: Request) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { id, status, transaction_ref } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
        }

        const { data: payout, error: pError } = await supabaseAdmin
            .from('payouts')
            .select('*')
            .eq('id', id)
            .single()

        if (pError || !payout) throw new Error('Payout record not found')

        // Fetch current wallet of the tenant
        const { data: wallet, error: wError } = await supabaseAdmin
            .from('tenant_wallet')
            .select('*')
            .eq('tenant_id', payout.tenant_id)
            .single()

        if (wError || !wallet) throw new Error('Tenant wallet not found')

        if (status === 'processed') {
            // Check if funds are available (redundant but safe)
            if (wallet.available_balance < payout.amount) {
                throw new Error('Insufficient funds in tenant wallet for this payout')
            }

            // Update wallet: Deduct from available balance
            const { error: walletUpdateError } = await supabaseAdmin
                .from('tenant_wallet')
                .update({ available_balance: wallet.available_balance - payout.amount })
                .eq('tenant_id', payout.tenant_id)

            if (walletUpdateError) throw walletUpdateError
        }

        // Update payout status
        const { data: updatedPayout, error: updateError } = await supabaseAdmin
            .from('payouts')
            .update({
                status: status,
                processed_at: new Date().toISOString(),
                transaction_ref: transaction_ref || null
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) throw updateError

        return NextResponse.json({ payout: updatedPayout })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
