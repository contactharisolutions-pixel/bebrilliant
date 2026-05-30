import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

/**
 * GET /api/affiliate/referral/[ref_code]
 * Called when a user visits a referral link.
 * Logs click, validates expiry, returns referral info.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ ref_code: string }> }
) {
    try {
        const { ref_code } = await params
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

        // Validate referral exists and is active
        const { data: referral, error } = await supabaseAdmin
            .from('affiliate_referrals')
            .select('*, tenants:tenant_id(name)')
            .eq('ref_code', ref_code)
            .eq('is_active', true)
            .single()

        if (error || !referral) {
            return NextResponse.json({ error: 'Invalid or expired referral link' }, { status: 404 })
        }

        // Check expiry
        if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
            return NextResponse.json({ error: 'This referral link has expired' }, { status: 410 })
        }

        // Anti-fraud: max 5 clicks per IP per day per ref_code
        const since = new Date(Date.now() - 86400000).toISOString()
        const { count: clickCount } = await supabaseAdmin
            .from('referral_tracking')
            .select('*', { count: 'exact', head: true })
            .eq('ref_code', ref_code)
            .eq('ip_address', ip)
            .eq('event_type', 'click')
            .gte('created_at', since)

        if ((clickCount ?? 0) >= 5) {
            return NextResponse.json({ error: 'Too many requests from this device' }, { status: 429 })
        }

        // Log click event (fire-and-forget, don't block response)
        supabaseAdmin.from('referral_tracking').insert({
            ref_code,
            event_type: 'click',
            ip_address: ip,
            reward_status: 'pending',
        }).then(() => {
            // Increment clicks in analytics
            supabaseAdmin.rpc('update_share_analytics') // trigger handles this
        })

        return NextResponse.json({
            ref_code,
            exam_id:        referral.exam_id,
            affiliate_type: referral.type,
            tenant_name:    (referral.tenants as any)?.name || '',
            valid:          true,
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
