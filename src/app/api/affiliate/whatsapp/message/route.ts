import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/affiliate/whatsapp/message
 * Query: ref_code, exam_name?, exam_fee?, mode?
 * Returns: { message, whatsapp_url, referral_url }
 *
 * mode: 'teacher_exam_share' | 'student_exam_share' | 'teacher_invite' | 'institute_exam_promo'
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = req.nextUrl
        const ref_code   = searchParams.get('ref_code')  || ''
        const exam_name  = searchParams.get('exam_name') || 'Online Exam'
        const exam_fee   = searchParams.get('exam_fee')  || '0'
        const mode       = searchParams.get('mode')      || 'teacher_exam_share'

        // Get affiliate's tenant
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        // Fetch template: tenant override first, then platform default
        let template: string | null = null

        if (profile?.tenant_id) {
            const { data: tenantTpl } = await supabaseAdmin
                .from('whatsapp_templates')
                .select('template_text')
                .eq('tenant_id', profile.tenant_id)
                .eq('template_key', mode)
                .eq('is_active', true)
                .single()
            template = tenantTpl?.template_text ?? null
        }

        if (!template) {
            const { data: globalTpl } = await supabaseAdmin
                .from('whatsapp_templates')
                .select('template_text')
                .is('tenant_id', null)
                .eq('template_key', mode)
                .eq('is_active', true)
                .single()
            template = globalTpl?.template_text ?? ''
        }

        // Get tenant name
        let institute_name = 'Our Institute'
        if (profile?.tenant_id) {
            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('name')
                .eq('id', profile.tenant_id)
                .single()
            institute_name = tenant?.name ?? institute_name
        }

        // Build referral URL
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const referral = await supabaseAdmin
            .from('affiliate_referrals')
            .select('exam_id')
            .eq('ref_code', ref_code)
            .single()

        const exam_id = referral.data?.exam_id
        const referral_url = exam_id
            ? `${base}/exam/${exam_id}?ref=${ref_code}`
            : `${base}/join/affiliate?ref=${ref_code}`

        const affiliate_signup_link = `${base}/auth/signup/affiliate?ref=${ref_code}`

        // Interpolate template variables
        const message = (template || '')
            .replace(/{exam_name}/g,          exam_name)
            .replace(/{institute_name}/g,     institute_name)
            .replace(/{exam_fee}/g,           exam_fee)
            .replace(/{referral_link}/g,      referral_url)
            .replace(/{affiliate_signup_link}/g, affiliate_signup_link)

        // Increment share analytics
        if (ref_code) {
            try {
                await supabaseAdmin.rpc('increment_shares', { p_ref_code: ref_code })
            } catch {
                // Graceful fallback — non-critical
                await supabaseAdmin.from('share_analytics')
                    .update({ last_shared_at: new Date().toISOString() })
                    .eq('ref_code', ref_code)
            }
        }

        const whatsapp_url = `https://wa.me/?text=${encodeURIComponent(message)}`

        return NextResponse.json({ message, whatsapp_url, referral_url, institute_name })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
