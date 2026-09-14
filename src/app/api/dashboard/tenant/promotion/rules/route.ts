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

        const { data: rawRules, error } = await supabaseAdmin
            .from('class_promotion_rules')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('from_class')

        if (error) throw error

        // De-serialize to_class into class and division for the UI
        const rules = (rawRules || []).map(r => {
            const parts = (r.to_class || '').split('|')
            const cls = parts[0] || ''
            const div = parts[1] || ''
            return {
                id: r.id,
                from_class: r.from_class,
                to_class: cls,
                to_division: div,
                auto_promote: r.auto_promote ?? true
            }
        })

        return NextResponse.json({ rules })
    } catch (error: any) {
        console.error('Promotion Rules GET error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthenticatedTenantAdmin()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { tenant_id } = auth
        const body = await request.json()
        const { action, rules } = body

        // Action: Auto-generate sequential rules from classes
        if (action === 'AUTO_GENERATE') {
            const { data: classes } = await supabaseAdmin
                .from('classes')
                .select('name, code, sort_order')
                .eq('tenant_id', tenant_id)
                .order('sort_order', { ascending: true })

            if (!classes || classes.length === 0) {
                return NextResponse.json({ error: 'No classes configured to generate rules from' }, { status: 400 })
            }

            const generatedRules: any[] = []
            for (let i = 0; i < classes.length; i++) {
                const current = classes[i]
                const next = classes[i + 1]
                generatedRules.push({
                    tenant_id,
                    from_class: current.name,
                    to_class: next ? next.name : 'Graduated',
                    auto_promote: true
                })
            }

            // Sync: clear previous rules and insert generated rules
            await supabaseAdmin.from('class_promotion_rules').delete().eq('tenant_id', tenant_id)
            const { error: insertErr } = await supabaseAdmin.from('class_promotion_rules').insert(generatedRules)
            if (insertErr) throw insertErr

            return NextResponse.json({ success: true, count: generatedRules.length })
        }

        // Standard Sync: replace all rules with provided list
        if (Array.isArray(rules)) {
            // Delete existing rules for tenant
            await supabaseAdmin
                .from('class_promotion_rules')
                .delete()
                .eq('tenant_id', tenant_id)

            if (rules.length > 0) {
                const validRules = rules.filter((r: any) => r.from_class?.trim() && r.to_class?.trim())
                const insertData = validRules.map((r: any) => ({
                    tenant_id,
                    from_class: r.from_class.trim(),
                    to_class: r.to_division?.trim() ? `${r.to_class.trim()}|${r.to_division.trim()}` : r.to_class.trim(),
                    auto_promote: r.auto_promote ?? true
                }))

                if (insertData.length > 0) {
                    const { error } = await supabaseAdmin
                        .from('class_promotion_rules')
                        .insert(insertData)

                    if (error) throw error
                }
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    } catch (error: any) {
        console.error('Promotion Rules POST error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
