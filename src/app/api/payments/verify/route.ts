import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            tenant_id
        } = body

        // Verify the Signature using our strictly protected backend SECRET KEY
        const secret = process.env.RAZORPAY_KEY_SECRET!
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }

        // 1. Fetch the payment record to get its ID
        const { data: payment, error: fetchErr } = await supabaseAdmin
            .from('payments')
            .select('id, tenant_id')
            .eq('razorpay_order_id', razorpay_order_id)
            .single()

        if (fetchErr || !payment) {
            return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
        }

        // 2. Use PaymentsEngine for atomic processing (Splits, Wallets, Status)
        const { PaymentsEngine } = await import('@/lib/payments/engine')
        await PaymentsEngine.processPaymentSuccess(payment.id, razorpay_payment_id)

        // 3. Post-processing logic (e.g. Activate Subscription if applicable)
        // Note: engine.ts already calls activateSubscription, but we can do extra here if needed
        return NextResponse.json({ message: 'Payment verified and processed successfully' })

        return NextResponse.json({ message: 'Payment verified and tenant subscription activated successfully' })

    } catch (error: any) {
        console.error('Razorpay Verification Error:', error)
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
    }
}
