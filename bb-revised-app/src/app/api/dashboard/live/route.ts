import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantStaff() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id, metadata').eq('id', user.id).single()
    if (profile?.tenant_id && ['admin', 'tenant_admin', 'teacher', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, role: profile.role, metadata: profile.metadata }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized Directory Access' }, { status: 403 })

    const { tenant_id } = session

    try {
        const { data: classes, error } = await supabaseAdmin
            .from('live_classes')
            .select('*, teacher:teacher_id(first_name, last_name)')
            .eq('tenant_id', tenant_id)
            .order('scheduled_at', { ascending: false })

        if (error) {
            console.log('Live Classes table missing, yielding payload stub')
            return NextResponse.json([])
        }

        // also fetch active teachers to populate the dropdown
        const { data: teachers } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name')
            .eq('tenant_id', tenant_id)
            .eq('role', 'teacher')
            .eq('is_active', true)

        return NextResponse.json({
            classes: classes || [],
            teachers: teachers || []
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action Payload' }, { status: 403 })

    const { tenant_id, user, role } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'SCHEDULE_CLASS') {
            const { title, teacher_id, date, duration, auto_record } = payload

            // Validation: Teachers can only schedule for themselves
            const assigned_teacher = role === 'teacher' ? user.id : teacher_id

            // Generating Mock Zoom Link
            const join_url = `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}?pwd=mock`

            const { data, error } = await supabaseAdmin
                .from('live_classes')
                .insert([{
                    tenant_id,
                    title,
                    teacher_id: assigned_teacher,
                    scheduled_at: new Date(date).toISOString(),
                    duration_minutes: duration,
                    join_url,
                    auto_record,
                    status: 'scheduled'
                }])
                .select('*, teacher:teacher_id(first_name, last_name)')
                .single()

            if (error) {
                // If table migrating, throw schema failure gracefully
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, class: data })
        }

        if (action === 'TOGGLE_STATUS') {
            const { id, status } = payload
            const { error } = await supabaseAdmin
                .from('live_classes')
                .update({ status })
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid logic payload router' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
