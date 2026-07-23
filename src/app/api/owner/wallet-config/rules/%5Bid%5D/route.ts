import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

// PATCH /api/owner/wallet-config/rules/[id] - Update a custom rule
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, credits, expiry_days, first_time_only, is_active } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (credits !== undefined) updateData.credits = Number(credits)
        if (expiry_days !== undefined) updateData.expiry_days = expiry_days ? Number(expiry_days) : null
        if (first_time_only !== undefined) updateData.first_time_only = first_time_only
        if (is_active !== undefined) updateData.is_active = is_active

        const { data, error } = await supabaseAdmin
            .from('wallet_credit_rules')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/owner/wallet-config/rules/[id] - Delete a custom rule
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { error } = await supabaseAdmin
            .from('wallet_credit_rules')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
