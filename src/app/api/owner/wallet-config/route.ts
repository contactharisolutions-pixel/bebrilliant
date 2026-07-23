import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

// GET — fetch all tenant type wallet configs
export async function GET() {
    try {
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


        const { data, error } = await supabaseAdmin
            .from('tenant_type_config')
            .select('*')
            .order('tenant_type')

        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT — update one or all tenant type wallet configs
export async function PUT(req: NextRequest) {
    try {
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const updates: Array<{
            tenant_type: string
            free_wallet_credits: number
            credit_expiry_days: number | null
            first_time_only: boolean
            is_active: boolean
        }> = await req.json()

        const results = []
        for (const update of updates) {
            const { data, error } = await supabaseAdmin
                .from('tenant_type_config')
                .upsert({
                    tenant_type: update.tenant_type,
                    free_wallet_credits: update.free_wallet_credits,
                    credit_expiry_days: update.credit_expiry_days ?? null,
                    first_time_only: update.first_time_only,
                    is_active: update.is_active,
                    updated_by: user.id,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'tenant_type' })
                .select()
                .single()


            if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
            results.push(data)
        }

        return NextResponse.json({ success: true, updated: results })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
