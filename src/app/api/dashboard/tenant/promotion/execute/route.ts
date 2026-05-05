import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { target_academic_year_id, students_to_promote } = body 
        // students_to_promote: array of { id, new_class, new_division, status }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { data: targetYear } = await supabaseAdmin
            .from('academic_years')
            .select('*')
            .eq('id', target_academic_year_id)
            .single()

        if (!targetYear) return NextResponse.json({ error: 'Target academic year not found' }, { status: 404 })

        let promoted = 0, graduated = 0, failed = 0

        // Process Students in parallel
        const promises = students_to_promote.map(async (sp: any) => {
            const { data: stud } = await supabaseAdmin
                .from('user_profiles')
                .select('metadata, current_academic_year_id')
                .eq('id', sp.id)
                .single()

            if (!stud) return

            const oldMetadata = stud.metadata as any
            
            // Apply new class and division
            const newMetadata = { 
                ...oldMetadata, 
                school_class: sp.new_class,
                division: sp.new_division || oldMetadata.division || '' // Preserve or update division
            }
            
            const status = sp.status || (sp.new_class === 'Graduated' ? 'graduated' : 'promoted')

            // a. Archive History (Preserve legacy state)
            await supabaseAdmin.from('student_academic_records').insert({
                tenant_id: profile.tenant_id,
                student_id: sp.id,
                academic_year_id: stud.current_academic_year_id || targetYear.id,
                class: oldMetadata.school_class || 'Unknown',
                division: oldMetadata.division || '',
                status: status
            })

            // b. Migrate to New Cycle
            const { error: updateErr } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    metadata: newMetadata,
                    current_academic_year_id: target_academic_year_id,
                    is_active: sp.new_class !== 'Graduated'
                })
                .eq('id', sp.id)

            if (!updateErr) {
                if (sp.new_class === 'Graduated') graduated++
                else if (status === 'failed') failed++
                else promoted++
            }
        })

        await Promise.all(promises)

        // Log the Lifecycle Event
        await supabaseAdmin.from('promotion_logs').insert({
            tenant_id: profile.tenant_id,
            academic_year_id: target_academic_year_id,
            promoted_count: promoted,
            failed_count: failed,
            graduated_count: graduated
        })

        return NextResponse.json({
            success: true,
            summary: { promoted, graduated, failed }
        })

    } catch (error: any) {
        console.error('Promotion Execution Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
