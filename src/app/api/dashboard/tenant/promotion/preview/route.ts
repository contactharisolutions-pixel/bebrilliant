import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const { data: students, error: studError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, metadata, current_academic_year_id')
            .eq('tenant_id', profile.tenant_id)
            .eq('role', 'student')
            .eq('is_active', true)

        if (studError) throw studError

        const { data: rules } = await supabaseAdmin.from('class_promotion_rules').select('*').eq('tenant_id', profile.tenant_id)

        const ruleMap = new Map(rules?.map(r => [r.from_class, r.to_class]) || [])

        const preview = (students || [])
            .filter(s => s.current_academic_year_id !== (request.nextUrl.searchParams.get('target_id') || '')) // Skip if already there
            .map(s => {
                const currentMetadata = (s.metadata as any)
                const currentClass = currentMetadata?.school_class || 'Unknown'
                const currentDivision = currentMetadata?.division || ''
                
                const rawTarget = ruleMap.get(currentClass)
                let nextClass = 'No Rule Found'
                let nextDivision = currentDivision 

                if (rawTarget) {
                    const [cls, div] = rawTarget.split('|')
                    nextClass = cls
                    if (div) nextDivision = div
                }
                
                return {
                    id: s.id,
                    name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                    old_class: currentClass,
                    old_division: currentDivision,
                    new_class: nextClass,
                    new_division: nextDivision,
                    can_promote: !!rawTarget && nextClass !== currentClass,
                    already_mirgrated: s.current_academic_year_id === (request.nextUrl.searchParams.get('target_id') || '')
                }
            })

        return NextResponse.json({ preview })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
