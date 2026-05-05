import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/affiliate/referral/track
 * Body: { ref_code, event_type: 'registration'|'payment', payment_id? }
 *
 * Called:
 *  - On user registration when ref code was in localStorage
 *  - On payment confirmation to trigger reward
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { ref_code, event_type, payment_id, exam_id } = await req.json()

        if (!ref_code || !event_type) {
            return NextResponse.json({ error: 'ref_code and event_type are required' }, { status: 400 })
        }

        // Validate referral exists and is active
        const { data: referral } = await supabaseAdmin
            .from('affiliate_referrals')
            .select('affiliate_id, is_active, expires_at, exam_id')
            .eq('ref_code', ref_code)
            .single()

        if (!referral) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
        }

        if (!referral.is_active || (referral.expires_at && new Date(referral.expires_at) < new Date())) {
            return NextResponse.json({ error: 'Referral link has expired' }, { status: 410 })
        }

        // Anti-fraud: no self-referral
        if (referral.affiliate_id === user.id) {
            await supabaseAdmin.from('referral_tracking').insert({
                ref_code,
                event_type:       'registration',
                registered_user:  user.id,
                reward_status:    'fraud',
                fraud_reason:     'self_referral',
            })
            return NextResponse.json({ tracked: false, reason: 'self_referral_blocked' })
        }

        if (event_type === 'registration') {
            // Check: has this user already been tracked for this ref_code?
            const { count } = await supabaseAdmin
                .from('referral_tracking')
                .select('*', { count: 'exact', head: true })
                .eq('ref_code', ref_code)
                .eq('registered_user', user.id)
                .eq('event_type', 'registration')

            if ((count ?? 0) > 0) {
                return NextResponse.json({ tracked: false, reason: 'already_tracked' })
            }

            await supabaseAdmin.from('referral_tracking').insert({
                ref_code,
                event_type:      'registration',
                registered_user: user.id,
                reward_status:   'pending',
            })

            return NextResponse.json({ tracked: true })
        }

        if (event_type === 'payment') {
            // Trigger reward processor
            const { data: rewardResult } = await supabaseAdmin.rpc('process_affiliate_reward', {
                p_registered_user: user.id,
                p_payment_id:      payment_id || null,
                p_exam_id:         exam_id    || null,
            })

            return NextResponse.json({ tracked: true, reward: rewardResult })
        }

        return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
