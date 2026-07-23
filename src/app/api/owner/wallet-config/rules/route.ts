import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

// GET /api/owner/wallet-config/rules - List all custom wallet rules
export async function GET(request: NextRequest) {
    try {
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: rules, error } = await supabaseAdmin
            .from('wallet_credit_rules')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

        // Reclaim expired wallet balances before returning rules to keep stats synced
        await supabaseAdmin.rpc('reclaim_expired_wallet_credits')

        return NextResponse.json(rules || [])
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/owner/wallet-config/rules - Create a new credit rule
export async function POST(request: NextRequest) {
    try {
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { name, rule_type, match_value, credits, expiry_days, first_time_only, is_active } = await request.json()

        if (!name || !rule_type || match_value === undefined || credits === undefined) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('wallet_credit_rules')
            .insert({
                name,
                rule_type,
                match_value: String(match_value),
                credits: Number(credits),
                expiry_days: expiry_days ? Number(expiry_days) : null,
                first_time_only: first_time_only ?? true,
                is_active: is_active ?? true
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
