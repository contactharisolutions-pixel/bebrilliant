import { supabaseAdmin } from '@/lib/supabase/admin'
import { razorpay } from '@/lib/razorpay'
import { PricingBreakdown } from '@/lib/finance'

export type PaymentType = 'subscription' | 'syllabus' | 'exam' | 'marketplace' | 'wallet'

export interface PaymentMetadata {
    breakdown?: {
        gst_amount: number;
        taxable_amount: number;
        gst_percent: number;
    };
    referral_source_id?: string;
    referral_source_type?: 'teacher' | 'student';
    exam_id?: string;
    credits?: number;
    [key: string]: unknown;
}

export interface PaymentRecord {
    id: string;
    user_id: string;
    tenant_id: string;
    amount: number;
    type: PaymentType | string;
    status: string;
    metadata?: PaymentMetadata;
}

export interface PaymentSplit {
    ownerAmount: number;
    tenantAmount: number;
    commissionPercentage: number;
    baseAmount: number;
    gstAmount: number;
    gstPercent: number;
}

export class PaymentsEngine {
    /**
     * Calculates the commission split based on dynamic rules.
     */
    static async calculateSplit(amount: number, type: PaymentType, tenantId: string | null, metadata?: PaymentMetadata): Promise<PaymentSplit> {
        // 0. Priority: Use Pre-calculated Breakdown if exists
        if (metadata?.breakdown) {
            const b = metadata.breakdown
            return {
                ownerAmount: b.gst_amount + (b.taxable_amount * (type === 'subscription' ? 1.0 : 0.15)), // simplified for now
                tenantAmount: (b.taxable_amount * (type === 'subscription' ? 0 : 0.85)),
                commissionPercentage: type === 'subscription' ? 100 : 15,
                baseAmount: b.taxable_amount,
                gstAmount: b.gst_amount,
                gstPercent: b.gst_percent
            }
        }

        // Fetch finance config
        const { data: configData } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'finance_config').single()
        const config = configData?.value || { gst_percent: 18.0 }
        const gstPercent = parseFloat(config.gst_percent.toString())
        
        const baseAmount = amount / (1 + (gstPercent / 100))
        const gstAmount = amount - baseAmount

        // Fetch rules
        const { data: rules } = await supabaseAdmin.from('commission_rules').select('*').or(`tenant_id.eq.${tenantId},tenant_id.is.null`)

        if (!rules) throw new Error('Failed to fetch commission rules')

        let rule = rules.find(r => r.tenant_id === tenantId && r.type === type)
        if (!rule) rule = rules.find(r => r.tenant_id === null && r.type === type)
        if (!rule) rule = rules.find(r => r.tenant_id === null && r.type === 'global')

        let percentage = rule ? parseFloat(rule.percentage.toString()) : 15.0
        if (type === 'subscription') percentage = 100.0 // Fully owned by Platform

        const commission = (baseAmount * percentage) / 100
        const tenantAmount = baseAmount - commission

        return {
            ownerAmount: commission + gstAmount,
            tenantAmount: tenantAmount,
            commissionPercentage: percentage,
            baseAmount,
            gstAmount,
            gstPercent
        }
    }

    /**
     * Processes a successful payment and handles side effects (Subscriptions, Wallet, Exams)
     */
    static async processPaymentSuccess(paymentId: string, razorpayPaymentId: string) {
        const { data: payment, error: pError } = await supabaseAdmin.from('payments').select('*').eq('id', paymentId).single()
        if (pError || !payment) throw new Error('Payment record not found')
        if (payment.status === 'success') return

        const split = await this.calculateSplit(payment.amount, payment.type as PaymentType, payment.tenant_id, payment.metadata)

        // 1. Atomic Wallet & Ledger Update
        const { error: rpcError } = await supabaseAdmin.rpc('process_payment_atomic', {
            p_payment_id: paymentId,
            p_razorpay_id: razorpayPaymentId,
            p_owner_amount: split.ownerAmount,
            p_tenant_amount: split.tenantAmount,
            p_commission_pct: split.commissionPercentage,
            p_tenant_id: payment.tenant_id
        })

        if (rpcError) throw new Error('Atomic processing failed: ' + rpcError.message)

        // 2. Generate Invoice Record
        try {
            await supabaseAdmin.from('invoices').insert([{
                tenant_id: payment.tenant_id,
                user_id: payment.user_id,
                amount: payment.amount,
                status: 'paid',
                type: payment.type,
                base_amount: split.baseAmount,
                gst_amount: split.gstAmount,
                gst_percent: split.gstPercent,
                total_amount: payment.amount,
                invoice_no: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            }])
        } catch (e) { console.error('Invoice error ignored:', e) }

        // 3. Side Effects based on Payment Type
        if (payment.type === 'subscription') {
            await this.activateSubscription(payment.tenant_id, payment.id)
        } 
        else if (payment.type === 'wallet') {
            await this.creditStudentWallet(payment)
        }

        // 4. Affiliate Reward Distribution (New)
        try {
            await this.processAffiliateRewards(payment, split)
        } catch (e) {
            console.error('Affiliate Reward Distribution failed:', e)
        }

        return { success: true, split }
    }

    private static async processAffiliateRewards(payment: PaymentRecord, split: PaymentSplit) {
        if (!payment.tenant_id) return
        
        // 1. Check if referring partner or student exists in metadata
        const refId = payment.metadata?.referral_source_id 
        const refType = payment.metadata?.referral_source_type // 'teacher' | 'student'
        if (!refId || !refType) return

        // 2. Fetch Affiliate Settings for this tenant
        const { data: settings } = await supabaseAdmin
            .from('affiliate_settings')
            .select('*')
            .eq('tenant_id', payment.tenant_id)
            .single()

        if (!settings) return

        let reward = 0
        
        if (refType === 'teacher' && settings.enable_affiliate_teacher) {
            if (settings.teacher_reward_type === 'percentage') {
                reward = (split.baseAmount * (settings.teacher_reward_value || 0)) / 100
            } else {
                reward = settings.teacher_reward_value || 0
            }
        } 
        else if (refType === 'student' && settings.enable_affiliate_student) {
            // Students earn fixed credits
            reward = settings.student_reward_credits || 0
        }

        if (reward <= 0) return

        // 3. Record Transaction
        const { data: tx, error: txError } = await supabaseAdmin
            .from('affiliate_transactions')
            .insert({
                affiliate_id: refId,
                affiliate_type: refType,
                exam_id: payment.metadata?.exam_id || null,
                amount: payment.amount,
                reward: reward,
                status: 'credited'
            })
            .select()
            .single()

        if (txError) throw txError

        // 4. Update Wallet Balance
        const { data: wallet } = await supabaseAdmin
            .from('affiliate_wallets')
            .select('*')
            .eq('affiliate_id', refId)
            .eq('affiliate_type', refType)
            .single()

        if (wallet) {
            const newBalance = (wallet.balance || 0) + reward
            const newWithdrawable = refType === 'teacher' 
                ? (wallet.withdrawable || 0) + reward 
                : 0 // Students cannot withdraw

            await supabaseAdmin
                .from('affiliate_wallets')
                .update({ 
                    balance: newBalance, 
                    withdrawable: newWithdrawable,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', wallet.id)
        }
    }

    private static async creditStudentWallet(payment: PaymentRecord) {
        const credits = payment.metadata?.credits || 0
        if (credits <= 0) return

        // Update Student Wallet Balance
        const { data: wallet } = await supabaseAdmin.from('student_wallets').select('balance').eq('student_id', payment.user_id).single()
        const newBalance = (wallet?.balance || 0) + credits
        
        await supabaseAdmin.from('student_wallets').update({ balance: newBalance }).eq('student_id', payment.user_id)

        // Log transaction
        await supabaseAdmin.from('student_wallet_transactions').insert({
            tenant_id: payment.tenant_id,
            student_id: payment.user_id,
            type: 'credit',
            credits: credits,
            reference_id: payment.id,
            description: `Wallet Recharge: ${credits} CR`
        })
    }

    private static async activateSubscription(tenantId: string, paymentId: string) {
        // Activate the tenant master record
        await supabaseAdmin.from('tenants').update({
            is_active: true,
            subscription_plan: 'premium',
            subscription_expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        }).eq('id', tenantId)

        // Upsert subscription log
        await supabaseAdmin.from('tenant_subscriptions').insert({
            tenant_id: tenantId,
            plan_name: 'Premium Institutional License',
            plan_type: 'yearly',
            amount: 2999,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        })
    }
}
