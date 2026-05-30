import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/affiliate/referral/generate
 * Body: { exam_id?, type: 'teacher'|'student', reward_amount?, expires_days? }
 * Returns: { ref_code, referral_url }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { exam_id, type = 'teacher', reward_amount = 0, expires_days, affiliate_id: target_affiliate_id } = await req.json()

        // Verify role for override
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant found' }, { status: 404 })

        // Check if we are generating for someone else
        let affiliate_to_link = user.id
        if (target_affiliate_id && target_affiliate_id !== user.id) {
            if (!['tenant_admin', 'owner'].includes(profile.role)) {
                return NextResponse.json({ error: 'Forbidden: Admin only can generate for others' }, { status: 403 })
            }
            affiliate_to_link = target_affiliate_id
        }

        // Check if referral already exists for this affiliate+exam combo
        if (exam_id) {
            const { data: existing } = await supabaseAdmin
                .from('affiliate_referrals')
                .select('ref_code')
                .eq('affiliate_id', user.id)
                .eq('exam_id', exam_id)
                .eq('type', type)
                .eq('is_active', true)
                .single()

            if (existing) {
                const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const referral_url = exam_id
                    ? `${base}/exam/${exam_id}?ref=${existing.ref_code}`
                    : `${base}/join/affiliate?ref=${existing.ref_code}`
                return NextResponse.json({ ref_code: existing.ref_code, referral_url, reused: true })
            }
        }

        // Generate a unique ref_code using the DB function
        const { data: codeData } = await supabaseAdmin
            .rpc('generate_ref_code', { p_type: type })

        const ref_code = codeData as string

        // Set expiry if provided
        const expires_at = expires_days
            ? new Date(Date.now() + expires_days * 86400000).toISOString()
            : null

        // Insert referral
        const { data: referral, error: insertErr } = await supabaseAdmin
            .from('affiliate_referrals')
            .insert({
                affiliate_id:  affiliate_to_link,
                tenant_id:     profile.tenant_id,
                type,
                exam_id:       exam_id || null,
                ref_code,
                reward_amount,
                expires_at,
            })
            .select('ref_code')
            .single()

        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

        // Initialise analytics row
        await supabaseAdmin.from('share_analytics').upsert({
            affiliate_id: affiliate_to_link,
            tenant_id:    profile.tenant_id,
            ref_code:     referral.ref_code,
            total_shares: 0,
        }, { onConflict: 'affiliate_id,ref_code' })

        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const referral_url = exam_id
            ? `${base}/exam/${exam_id}?ref=${referral.ref_code}`
            : `${base}/join/affiliate?ref=${referral.ref_code}`

        return NextResponse.json({ ref_code: referral.ref_code, referral_url })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
