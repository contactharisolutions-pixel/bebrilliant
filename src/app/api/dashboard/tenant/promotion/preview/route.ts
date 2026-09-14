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

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthenticatedTenantAdmin()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { tenant_id } = auth
        const targetYearId = request.nextUrl.searchParams.get('target_id')

        const { data: students, error: studError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, email, metadata, current_academic_year_id, is_active')
            .eq('tenant_id', tenant_id)
            .eq('role', 'student')
            .eq('is_active', true)

        if (studError) throw studError

        const { data: rules } = await supabaseAdmin
            .from('class_promotion_rules')
            .select('*')
            .eq('tenant_id', tenant_id)

        // Build normalized rule map
        const ruleMap = new Map<string, { toClass: string, toDivision: string, autoPromote: boolean }>()
        ;(rules || []).forEach(r => {
            const parts = (r.to_class || '').split('|')
            ruleMap.set(r.from_class.trim().toLowerCase(), {
                toClass: parts[0] || '',
                toDivision: parts[1] || '',
                autoPromote: r.auto_promote ?? true
            })
        })

        let eligibleCount = 0
        let graduatingCount = 0
        let missingRulesCount = 0
        let alreadyMigratedCount = 0

        const preview = (students || []).map(s => {
            const currentMetadata = (s.metadata as any) || {}
            const currentClass = currentMetadata.school_class || 'Unassigned'
            const currentDivision = currentMetadata.division || ''
            
            // Check normalized match
            const matchedRule = ruleMap.get(currentClass.trim().toLowerCase())
            
            const isAlreadyMigrated = targetYearId ? s.current_academic_year_id === targetYearId : false
            if (isAlreadyMigrated) alreadyMigratedCount++

            let nextClass = 'Rule Missing'
            let nextDivision = currentDivision
            let canPromote = false
            let isGraduating = false

            if (matchedRule) {
                nextClass = matchedRule.toClass
                if (matchedRule.toDivision) nextDivision = matchedRule.toDivision
                isGraduating = nextClass.toLowerCase().includes('graduat')
                canPromote = !isAlreadyMigrated && (isGraduating || nextClass !== currentClass)

                if (canPromote) {
                    if (isGraduating) graduatingCount++
                    else eligibleCount++
                }
            } else {
                missingRulesCount++
            }

            return {
                id: s.id,
                name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
                email: s.email,
                old_class: currentClass,
                old_division: currentDivision,
                new_class: nextClass,
                new_division: nextDivision,
                can_promote: canPromote,
                is_graduating: isGraduating,
                already_migrated: isAlreadyMigrated,
                audit_status: isAlreadyMigrated 
                    ? 'ALREADY_MIGRATED' 
                    : matchedRule 
                        ? (isGraduating ? 'GRADUATING' : 'AUDIT_PASSED') 
                        : 'RULE_MISSING'
            }
        })

        const summary = {
            total_candidates: preview.length,
            eligible_count: eligibleCount,
            graduating_count: graduatingCount,
            missing_rules_count: missingRulesCount,
            already_migrated_count: alreadyMigratedCount
        }

        return NextResponse.json({ preview, summary })
    } catch (error: any) {
        console.error('Promotion Preview error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
