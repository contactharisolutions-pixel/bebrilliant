import { NextRequest, NextResponse } from 'next/server'
import { calculatePricing } from '@/lib/finance'

export async function POST(request: NextRequest) {
    try {
        const { baseAmount, couponCode, tenantId, userId, itemType, itemId } = await request.json()

        if (!baseAmount) {
            return NextResponse.json({ error: 'Base amount is required' }, { status: 400 })
        }

        const breakdown = await calculatePricing(
            baseAmount,
            couponCode,
            tenantId,
            userId,
            itemType,
            itemId
        )

        return NextResponse.json(breakdown)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
