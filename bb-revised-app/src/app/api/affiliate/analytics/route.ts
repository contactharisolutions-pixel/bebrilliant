import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/affiliate/analytics
 * Returns share stats for the authenticated affiliate.
 * Query: ?ref_code=AT3F8K2X (optional, filters to one code)
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const ref_code = req.nextUrl.searchParams.get('ref_code')

        // Fetch all referrals for this affiliate
        let refQuery = supabaseAdmin
            .from('affiliate_referrals')
            .select('ref_code, type, exam_id, reward_amount, reward_type, created_at, is_active')
            .eq('affiliate_id', user.id)
            .order('created_at', { ascending: false })

        if (ref_code) refQuery = refQuery.eq('ref_code', ref_code)

        const { data: referrals } = await refQuery

        // Fetch analytics for those codes
        const codes = (referrals ?? []).map(r => r.ref_code)
        const { data: analytics } = await supabaseAdmin
            .from('share_analytics')
            .select('*')
            .eq('affiliate_id', user.id)
            .in('ref_code', codes.length > 0 ? codes : ['__none__'])

        // Merge referral + analytics
        const merged = (referrals ?? []).map(r => {
            const stats = (analytics ?? []).find(a => a.ref_code === r.ref_code)
            return {
                ...r,
                total_shares:        stats?.total_shares        ?? 0,
                total_clicks:        stats?.total_clicks        ?? 0,
                total_registrations: stats?.total_registrations ?? 0,
                total_payments:      stats?.total_payments      ?? 0,
                total_rewards:       stats?.total_rewards       ?? 0,
                last_shared_at:      stats?.last_shared_at      ?? null,
            }
        })

        // Aggregate totals
        const totals = merged.reduce((acc, r) => ({
            shares:        acc.shares        + r.total_shares,
            clicks:        acc.clicks        + r.total_clicks,
            registrations: acc.registrations + r.total_registrations,
            payments:      acc.payments      + r.total_payments,
            rewards:       acc.rewards       + Number(r.total_rewards),
        }), { shares: 0, clicks: 0, registrations: 0, payments: 0, rewards: 0 })

        return NextResponse.json({ referrals: merged, totals })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
