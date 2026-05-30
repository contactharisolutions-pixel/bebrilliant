import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', user.id).single()

        const { data: rawRules } = await supabaseAdmin
            .from('class_promotion_rules')
            .select('*')
            .eq('tenant_id', profile?.tenant_id)
            .order('from_class')

        // De-serialize to_class into class and division for the UI
        const rules = (rawRules || []).map(r => {
            const [cls, div] = r.to_class.split('|')
            return {
                ...r,
                to_class: cls,
                to_division: div || ''
            }
        })

        return NextResponse.json({ rules })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { rules } = body // Array of { from_class, to_class, to_division, auto_promote }

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id, role').eq('id', user.id).single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Serialize class and division into the to_class column
        const upsertData = rules.map((r: any) => ({
            tenant_id: profile.tenant_id,
            from_class: r.from_class,
            to_class: r.to_division ? `${r.to_class}|${r.to_division}` : r.to_class,
            auto_promote: r.auto_promote ?? true
        }))

        const { error } = await supabaseAdmin
            .from('class_promotion_rules')
            .upsert(upsertData, { onConflict: 'tenant_id,from_class' })

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
