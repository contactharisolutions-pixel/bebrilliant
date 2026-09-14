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

    // Platform owner fallback
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

        // 1. Fetch Academic Years
        const { data: years, error: yearError } = await supabaseAdmin
            .from('academic_years')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('start_date', { ascending: false })

        if (yearError) throw yearError

        // 2. Fetch Classes with Divisions for attached counts & rule builder
        const { data: rawClasses, error: classError } = await supabaseAdmin
            .from('classes')
            .select('id, name, code, sort_order, academic_year_id, is_active')
            .eq('tenant_id', tenant_id)
            .order('sort_order', { ascending: true })

        if (classError) throw classError

        const { data: rawDivisions } = await supabaseAdmin
            .from('divisions')
            .select('id, class_id, name, capacity')
            .eq('tenant_id', tenant_id)

        const classesWithDivisions = (rawClasses || []).map(cls => ({
            ...cls,
            divisions: (rawDivisions || []).filter(d => d.class_id === cls.id)
        }))

        // 3. Fetch Promotion Rules
        const { data: rules } = await supabaseAdmin
            .from('class_promotion_rules')
            .select('*')
            .eq('tenant_id', tenant_id)

        // 4. Fetch Active Students (Candidates)
        const { data: students } = await supabaseAdmin
            .from('user_profiles')
            .select('id, metadata, current_academic_year_id, is_active')
            .eq('tenant_id', tenant_id)
            .eq('role', 'student')
            .eq('is_active', true)

        // 5. Fetch Migration Audit Logs
        const { data: migrationLogs } = await supabaseAdmin
            .from('promotion_logs')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })
            .limit(20)

        // Count classes per year
        const classCountByYear = new Map<string, number>()
        ;(rawClasses || []).forEach(c => {
            if (c.academic_year_id) {
                classCountByYear.set(c.academic_year_id, (classCountByYear.get(c.academic_year_id) || 0) + 1)
            }
        })

        const enrichedYears = (years || []).map(y => ({
            ...y,
            classes_count: classCountByYear.get(y.id) || 0
        }))

        // Compute Readiness
        const ruleFromClasses = new Set((rules || []).map(r => r.from_class))
        const candidates = students || []
        const eligibleCount = candidates.filter(s => {
            const currentClass = (s.metadata as any)?.school_class || ''
            return ruleFromClasses.has(currentClass)
        }).length
        const readinessPct = candidates.length > 0 ? Math.round((eligibleCount / candidates.length) * 100) : 100

        const activeYear = enrichedYears.find(y => y.is_active) || null

        const stats = {
            total_sessions: enrichedYears.length,
            active_session_name: activeYear ? activeYear.name : 'No Active Session',
            active_session_dates: activeYear ? `${activeYear.start_date} → ${activeYear.end_date}` : 'Unconfigured',
            total_rules: (rules || []).length,
            total_candidates: candidates.length,
            eligible_candidates: eligibleCount,
            migration_readiness_pct: readinessPct,
            total_migrations_run: (migrationLogs || []).length
        }

        return NextResponse.json({
            years: enrichedYears,
            active_year: activeYear,
            classes: classesWithDivisions,
            rules: rules || [],
            promotion_logs: migrationLogs || [],
            stats
        })
    } catch (error: any) {
        console.error('Academic Year GET error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthenticatedTenantAdmin()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { tenant_id } = auth
        const body = await request.json()

        // Handle Action Dispatches
        const action = body.action
        const payload = body.payload || body

        // ── A. SET ACTIVE YEAR ───────────────────────────────────────
        if (action === 'SET_ACTIVE_YEAR') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })

            await supabaseAdmin
                .from('academic_years')
                .update({ is_active: false })
                .eq('tenant_id', tenant_id)

            const { data: updated, error } = await supabaseAdmin
                .from('academic_years')
                .update({ is_active: true, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, year: updated })
        }

        // ── B. DELETE YEAR ───────────────────────────────────────────
        if (action === 'DELETE_YEAR') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })

            // Safeguard: Check if classes are attached
            const { count: classCount } = await supabaseAdmin
                .from('classes')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenant_id)
                .eq('academic_year_id', id)

            if (classCount && classCount > 0) {
                return NextResponse.json({
                    error: `Cannot delete session: ${classCount} class(es) are linked to this academic cycle. Please reassign or remove them first.`
                }, { status: 400 })
            }

            // Safeguard: Check if historical student records are attached
            const { count: recordCount } = await supabaseAdmin
                .from('student_academic_records')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenant_id)
                .eq('academic_year_id', id)

            if (recordCount && recordCount > 0) {
                return NextResponse.json({
                    error: `Cannot delete session: ${recordCount} student archive records are bound to this cycle.`
                }, { status: 400 })
            }

            const { error: delError } = await supabaseAdmin
                .from('academic_years')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delError) throw delError
            return NextResponse.json({ success: true })
        }

        // ── C. CREATE YEAR ───────────────────────────────────────────
        const { name, start_date, end_date, make_active } = payload

        if (!name?.trim()) return NextResponse.json({ error: 'Cycle designation name is required' }, { status: 400 })
        if (!start_date || !end_date) return NextResponse.json({ error: 'Activation and Termination dates are required' }, { status: 400 })

        const startDateObj = new Date(start_date)
        const endDateObj = new Date(end_date)

        if (endDateObj <= startDateObj) {
            return NextResponse.json({ error: 'Termination date must occur after the Activation date' }, { status: 400 })
        }

        // Deactivate other sessions if make_active requested
        if (make_active) {
            await supabaseAdmin
                .from('academic_years')
                .update({ is_active: false })
                .eq('tenant_id', tenant_id)
        }

        const { data: year, error } = await supabaseAdmin
            .from('academic_years')
            .insert({
                tenant_id,
                name: name.trim(),
                start_date,
                end_date,
                is_active: !!make_active
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'An academic session with this designation already exists' }, { status: 400 })
            }
            throw error
        }

        return NextResponse.json({ success: true, year })
    } catch (error: any) {
        console.error('Academic Year POST error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await getAuthenticatedTenantAdmin()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { tenant_id } = auth
        const body = await request.json()
        const { id, name, start_date, end_date, is_active } = body

        if (!id) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        if (!name?.trim()) return NextResponse.json({ error: 'Session name required' }, { status: 400 })

        if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
            return NextResponse.json({ error: 'Termination date must occur after the Activation date' }, { status: 400 })
        }

        if (is_active) {
            await supabaseAdmin
                .from('academic_years')
                .update({ is_active: false })
                .eq('tenant_id', tenant_id)
        }

        const updateData: any = {
            name: name.trim(),
            updated_at: new Date().toISOString()
        }
        if (start_date) updateData.start_date = start_date
        if (end_date) updateData.end_date = end_date
        if (typeof is_active === 'boolean') updateData.is_active = is_active

        const { data: updated, error } = await supabaseAdmin
            .from('academic_years')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', tenant_id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, year: updated })
    } catch (error: any) {
        console.error('Academic Year PATCH error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
