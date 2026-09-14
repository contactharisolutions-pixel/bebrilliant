import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAuthenticatedTenantAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    if (profile.role === 'owner' && !profile.tenant_id) {
        const { data: tenants } = await supabaseAdmin.from('tenants').select('id').limit(1)
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id, role: 'owner' }
        return null
    }

    if (profile.tenant_id && ['tenant_admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, role: profile.role }
    }

    return null
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthenticatedTenantAdmin()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { tenant_id } = auth
        const body = await request.json()
        const { target_academic_year_id, students_to_promote } = body

        if (!target_academic_year_id) {
            return NextResponse.json({ error: 'Target academic year is required' }, { status: 400 })
        }

        if (!Array.isArray(students_to_promote) || students_to_promote.length === 0) {
            return NextResponse.json({ error: 'No student candidates selected for migration' }, { status: 400 })
        }

        // Verify target year belongs to this tenant
        const { data: targetYear } = await supabaseAdmin
            .from('academic_years')
            .select('id, name')
            .eq('id', target_academic_year_id)
            .eq('tenant_id', tenant_id)
            .single()

        if (!targetYear) {
            return NextResponse.json({ error: 'Destination academic session not found for this institution' }, { status: 404 })
        }

        let promoted = 0
        let graduated = 0
        let failed = 0

        // Process student migration batch
        for (const sp of students_to_promote) {
            try {
                const { data: stud } = await supabaseAdmin
                    .from('user_profiles')
                    .select('id, metadata, current_academic_year_id')
                    .eq('id', sp.id)
                    .eq('tenant_id', tenant_id)
                    .single()

                if (!stud) {
                    failed++
                    continue
                }

                const oldMetadata = (stud.metadata as any) || {}
                const isGraduating = (sp.new_class || '').toLowerCase().includes('graduat')
                
                const newMetadata = {
                    ...oldMetadata,
                    school_class: isGraduating ? (oldMetadata.school_class || 'Graduated') : (sp.new_class || oldMetadata.school_class),
                    division: sp.new_division || oldMetadata.division || ''
                }

                const status = isGraduating ? 'graduated' : (sp.status || 'promoted')

                // 1. Archive legacy academic record
                await supabaseAdmin
                    .from('student_academic_records')
                    .insert({
                        tenant_id,
                        student_id: sp.id,
                        academic_year_id: stud.current_academic_year_id || targetYear.id,
                        class: oldMetadata.school_class || 'Unassigned',
                        division: oldMetadata.division || '',
                        status
                    })

                // 2. Migrate profile to new academic cycle
                const { error: updateErr } = await supabaseAdmin
                    .from('user_profiles')
                    .update({
                        metadata: newMetadata,
                        current_academic_year_id: target_academic_year_id,
                        is_active: !isGraduating
                    })
                    .eq('id', sp.id)
                    .eq('tenant_id', tenant_id)

                if (updateErr) {
                    failed++
                } else {
                    if (isGraduating) graduated++
                    else promoted++
                }
            } catch (err) {
                console.error('Error migrating student ID', sp.id, err)
                failed++
            }
        }

        // 3. Log the lifecycle event
        await supabaseAdmin.from('promotion_logs').insert({
            tenant_id,
            academic_year_id: target_academic_year_id,
            promoted_count: promoted,
            graduated_count: graduated,
            failed_count: failed
        })

        return NextResponse.json({
            success: true,
            summary: {
                promoted,
                graduated,
                failed,
                total_processed: students_to_promote.length,
                target_year_name: targetYear.name
            }
        })
    } catch (error: any) {
        console.error('Promotion Execution Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
