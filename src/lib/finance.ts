import { supabaseAdmin } from './supabase/admin'

export interface PricingBreakdown {
    base_amount: number;
    discount_amount: number;
    taxable_amount: number;
    gst_percent: number;
    gst_amount: number;
    total_amount: number;
    coupon_applied?: string;
    offer_applied?: string;
}

/**
 * Calculates a GST-compliant pricing breakdown including discounts and taxes.
 * Pricing Logic: Base -> Coupon/Offer Discount -> Taxable Value -> GST (18%) -> Total
 */
export async function calculatePricing(
    baseAmount: number,
    couponCode?: string,
    tenantId?: string,
    userId?: string,
    itemType?: 'EXAM' | 'PLAN' | 'WALLET',
    itemId?: string
): Promise<PricingBreakdown> {
    let discount = 0
    let couponId: string | undefined
    let offerName: string | undefined
    const GST_PERCENT = 18

    // 1. Validate Coupon if provided
    if (couponCode) {
        const { data: validation, error } = await (supabaseAdmin as any).rpc('validate_coupon', {
            p_code: couponCode,
            p_tenant_id: tenantId,
            p_user_id: userId,
            p_amount: baseAmount,
            p_item_type: itemType || 'ALL',
            p_item_id: itemId
        })

        if (!error && validation && validation.valid) {
            discount = validation.discount_amount
            offerName = validation.offer_name
            couponId = validation.coupon_id
        }
    }

    // 2. Calculate Breakdowns
    const taxableAmount = Math.max(0, baseAmount - discount)
    const gstAmount = (taxableAmount * GST_PERCENT) / 100
    const totalAmount = taxableAmount + gstAmount

    return {
        base_amount: baseAmount,
        discount_amount: discount,
        taxable_amount: taxableAmount,
        gst_percent: GST_PERCENT,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        coupon_applied: couponCode,
        offer_applied: offerName
    }
}
