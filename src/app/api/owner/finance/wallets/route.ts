import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET() {
    const user = await verifyPlatformAccess('payouts.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data: wallets, error } = await supabaseAdmin
            .from('tenant_wallet')
            .select('*, tenants(name)')
            .order('available_balance', { ascending: false })

        if (error) throw error
        return NextResponse.json({ wallets: wallets || [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
