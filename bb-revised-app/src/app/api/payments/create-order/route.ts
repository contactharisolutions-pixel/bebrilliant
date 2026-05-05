import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculatePricing } from '@/lib/finance'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { plan_id, exam_id, coupon_code } = await request.json()

        if (!plan_id && !exam_id) {
            return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
        }

        // 1. Fetch Real Price from Database (Anti-Fraud)
        let baseAmount = 0
        let itemName = 'Unknown Item'
        let itemType: 'PLAN' | 'EXAM' = 'PLAN'
        let itemId = ''

        if (plan_id) {
            const { data: plan } = await supabaseAdmin.from('plans').select('price, name').eq('id', plan_id).single()
            if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
            baseAmount = Number(plan.price)
            itemName = plan.name
            itemType = 'PLAN'
            itemId = plan_id
        } else if (exam_id) {
            const { data: exam } = await supabaseAdmin.from('exams').select('price, name').eq('id', exam_id).single()
            if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
            baseAmount = Number(exam.price)
            itemName = exam.name
            itemType = 'EXAM'
            itemId = exam_id
        }

        // 2. Fetch User Tenant Context
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        const tenantId = profile?.tenant_id

        // 3. Calculate GST-Compliant Breakdown
        const breakdown = await calculatePricing(baseAmount, coupon_code, tenantId, user.id, itemType, itemId)

        // 4. Create Razorpay Order
        const rpOrder = await razorpay.orders.create({
            amount: Math.round(breakdown.total_amount * 100), // convert to paise
            currency: 'INR',
            receipt: `rcpt_${tenantId || 'global'}_${Date.now()}`,
            notes: {
                item_name: itemName,
                coupon: coupon_code || 'none',
                discount: breakdown.discount_amount
            }
        })

        // 5. Audit Log / Pending Payment
        await supabaseAdmin.from('payments').insert({
            tenant_id: tenantId,
            user_id: user.id,
            amount: breakdown.total_amount,
            status: 'created',
            razorpay_order_id: rpOrder.id,
            metadata: {
                breakdown,
                item_name: itemName,
                item_type: itemType
            }
        })

        return NextResponse.json({
            id: rpOrder.id,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            breakdown
        })

    } catch (error: any) {
        console.error('Razorpay Create Order Error:', error)
        return NextResponse.json({ error: 'Server error generating checkout session' }, { status: 500 })
    }
}
