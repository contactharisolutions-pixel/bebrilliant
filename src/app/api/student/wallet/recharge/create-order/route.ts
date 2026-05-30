import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { razorpay } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { package_id } = await request.json()
        if (!package_id) return NextResponse.json({ error: 'Package ID required' }, { status: 400 })

        // 1. Fetch Package
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('credit_packages')
            .select('*')
            .eq('id', package_id)
            .single()

        if (pkgError || !pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 404 })

        // 2. Get Student Profile
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        // 3. Calculate GST-Compliant Pricing
        const { calculatePricing } = await import('@/lib/finance')
        const breakdown = await calculatePricing(pkg.price, undefined, profile.tenant_id, user.id, 'WALLET', pkg.id)
        const { total_amount } = breakdown

        // 4. Create Razorpay Order
        const amountInPaise = Math.round(total_amount * 100)
        const rpOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `recharge_${Date.now()}`,
            notes: {
                student_id: user.id,
                tenant_id: profile.tenant_id,
                package_id: pkg.id,
                credits: pkg.credits + (pkg.bonus || 0)
            }
        })

        // 5. Save order in DB (Legacy and Centralized)
        const totalCredits = pkg.credits + (pkg.bonus || 0)
        
        await supabaseAdmin.from('payments').insert({
            user_id: user.id,
            tenant_id: profile.tenant_id,
            type: 'wallet',
            amount: total_amount,
            status: 'pending',
            razorpay_order_id: rpOrder.id,
            metadata: { 
                credits: totalCredits, 
                package_id: pkg.id,
                breakdown
            }
        })

        const { data: dbOrder, error: dbError } = await supabaseAdmin
            .from('wallet_recharge_orders')
            .insert({
                tenant_id: profile.tenant_id,
                student_id: user.id,
                package_id: pkg.id,
                amount: pkg.price,
                credits: totalCredits,
                razorpay_order_id: rpOrder.id,
                status: 'pending'
            })
            .select()
            .single()

        if (dbError) throw dbError

        return NextResponse.json({
            success: true,
            order_id: rpOrder.id,
            amount: amountInPaise,
            currency: 'INR',
            key_id: process.env.RAZORPAY_KEY_ID
        })

    } catch (error: any) {
        console.error('Create Order Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
