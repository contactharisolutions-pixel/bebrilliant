import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/demos — List all demo requests */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 25
    const offset = (page - 1) * limit

    try {
        let query = supabaseAdmin
            .from('lead_demo_requests')
            .select(`
                *,
                lead:lead_id(id, name, organization, email, phone, priority),
                suggested_staff:suggested_staff_id(id, first_name, last_name, email, role),
                assigned_staff:assigned_staff_id(id, first_name, last_name, email, role),
                confirmed_by_user:confirmed_by(first_name, last_name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status !== 'all') query = query.eq('status', status)

        const { data, error, count } = await query
        if (error) return NextResponse.json({ error: 'Failed to load demo requests.' }, { status: 500 })

        // Count by status for tab badges
        const { data: statusCounts } = await supabaseAdmin
            .from('lead_demo_requests')
            .select('status')

        const counts: Record<string, number> = {}
        for (const row of statusCounts ?? []) {
            counts[row.status] = (counts[row.status] ?? 0) + 1
        }

        return NextResponse.json({
            demos: data ?? [],
            total: count ?? 0,
            page,
            counts,
        })
    } catch (err) {
        console.error('GET /api/owner/demos error:', err)
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }
}

/** POST /api/owner/demos — Create a demo request + auto-suggest best staff */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { lead_id, demo_type, preferred_date, preferred_time, customer_city, customer_state, customer_pincode, customer_address } = body

        if (!lead_id) return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 })

        // Auto-suggest best demo staff
        const suggestion = await suggestDemoStaff({ demo_type: demo_type || 'online', customer_city, customer_state, customer_pincode })

        const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { data: demo, error } = await supabaseAdmin
            .from('lead_demo_requests')
            .insert({
                lead_id,
                demo_type: demo_type || 'online',
                preferred_date: preferred_date || null,
                preferred_time: preferred_time || null,
                customer_city: customer_city || null,
                customer_state: customer_state || null,
                customer_pincode: customer_pincode || null,
                customer_address: customer_address || null,
                status: suggestion ? 'staff_suggested' : 'pending_assignment',
                suggested_staff_id: suggestion?.staffId ?? null,
                assignment_score: suggestion?.score ?? null,
                assignment_reason: suggestion?.reason ?? null,
                sla_deadline: slaDeadline,
            })
            .select()
            .single()

        if (error || !demo) return NextResponse.json({ error: 'Failed to create demo request.' }, { status: 500 })

        // Log timeline
        await supabaseAdmin.from('lifecycle_timeline').insert({
            lead_id,
            event_type: 'demo_requested',
            event_label: 'Demo Request Created',
            description: `${demo_type === 'on_site' ? 'On-site' : 'Online'} demo requested`,
            staff_id: user.id,
            metadata: { demo_id: demo.id, demo_type, suggested_staff: suggestion?.staffId }
        })

        return NextResponse.json({ demo, suggestion }, { status: 201 })

    } catch (err) {
        console.error('POST /api/owner/demos error:', err)
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }
}

// ── Staff Suggestion Engine ─────────────────────────────────────────────────
async function suggestDemoStaff({ demo_type, customer_city, customer_state, customer_pincode }: {
    demo_type: string; customer_city?: string; customer_state?: string; customer_pincode?: string
}) {
    try {
        // Get all active demo staff (sales_exec, demo_exec)
        const { data: staffList } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, role')
            .in('role', ['sales_exec', 'demo_exec'])
            .eq('is_active', true)

        if (!staffList || staffList.length === 0) return null

        // Get current workload (active demos) per staff
        const { data: workloads } = await supabaseAdmin
            .from('lead_demo_requests')
            .select('assigned_staff_id')
            .in('status', ['confirmed', 'scheduled'])

        const workloadMap: Record<string, number> = {}
        for (const w of workloads ?? []) {
            if (w.assigned_staff_id) {
                workloadMap[w.assigned_staff_id] = (workloadMap[w.assigned_staff_id] ?? 0) + 1
            }
        }

        // Get area assignments if on_site
        let areaMap: Record<string, any[]> = {}
        if (demo_type === 'on_site' && (customer_city || customer_state || customer_pincode)) {
            const { data: areas } = await supabaseAdmin
                .from('staff_area_assignments')
                .select('*')
                .eq('is_active', true)
                .in('demo_type', ['on_site', 'both'])
            for (const a of areas ?? []) {
                if (!areaMap[a.staff_id]) areaMap[a.staff_id] = []
                areaMap[a.staff_id].push(a)
            }
        }

        // Score each staff member
        const scored = staffList.map(staff => {
            let score = 50 // base score

            // Workload score — prefer staff with fewer active demos
            const activeWork = workloadMap[staff.id] ?? 0
            score += Math.max(0, 30 - activeWork * 10)

            // Area match score for on_site
            if (demo_type === 'on_site') {
                const areas = areaMap[staff.id] ?? []
                for (const area of areas) {
                    if (customer_pincode && area.pincode === customer_pincode) { score += 40; break }
                    if (customer_city && area.city?.toLowerCase() === customer_city?.toLowerCase()) { score += 25; break }
                    if (customer_state && area.state?.toLowerCase() === customer_state?.toLowerCase()) { score += 10; break }
                }
            } else {
                // Online demos: all staff are equally capable, minor role bonus
                if (staff.role === 'demo_exec') score += 10
            }

            return { staffId: staff.id, staff, score, activeWork }
        })

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score)
        const best = scored[0]
        if (!best) return null

        return {
            staffId: best.staffId,
            score: best.score,
            reason: `Score: ${best.score} | Active demos: ${best.activeWork} | Role: ${best.staff.role}`
        }
    } catch (err) {
        console.error('suggestDemoStaff error:', err)
        return null
    }
}
