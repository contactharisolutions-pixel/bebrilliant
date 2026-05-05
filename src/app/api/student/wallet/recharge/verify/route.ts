import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
        }

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex')

        const isAuthentic = expectedSignature === razorpay_signature

        if (!isAuthentic) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }

        // 2. Fetch Order and check for idempotency
        const { data: dbOrder, error: orderErr } = await supabaseAdmin
            .from('wallet_recharge_orders')
            .select('*')
            .eq('razorpay_order_id', razorpay_order_id)
            .single()

        if (orderErr || !dbOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        if (dbOrder.status === 'captured') return NextResponse.json({ success: true, message: 'Already processed' })

        // 3. Update Order and Wallet in a transaction-safe manner (Sequential for now)
        // Note: Real world should use an RPC in Supabase for atomicity
        
        // Update order status
        const { error: updateOrderErr } = await supabaseAdmin
            .from('wallet_recharge_orders')
            .update({ 
                status: 'captured', 
                payment_id: razorpay_payment_id, 
                signature: razorpay_signature,
                updated_at: new Date().toISOString()
            })
            .eq('id', dbOrder.id)

        if (updateOrderErr) throw updateOrderErr

        // Update Wallet Balance
        const { data: wallet, error: walletFetchErr } = await supabaseAdmin
            .from('student_wallets')
            .select('balance')
            .eq('student_id', user.id)
            .single()

        if (walletFetchErr) throw walletFetchErr

        const newBalance = (wallet?.balance || 0) + dbOrder.credits
        const { error: updateWalletErr } = await supabaseAdmin
            .from('student_wallets')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', user.id)

        if (updateWalletErr) throw updateWalletErr

        // 4. Log Transaction
        const { error: transErr } = await supabaseAdmin
            .from('student_wallet_transactions')
            .insert({
                tenant_id: dbOrder.tenant_id,
                student_id: user.id,
                type: 'credit',
                credits: dbOrder.credits,
                reference_id: dbOrder.id,
                description: `Wallet Recharge: ${dbOrder.credits} CR`
            })

        if (transErr) throw transErr

        return NextResponse.json({
            success: true,
            message: 'Wallet recharged successfully',
            new_balance: newBalance
        })

    } catch (error: any) {
        console.error('Verify Payment Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
