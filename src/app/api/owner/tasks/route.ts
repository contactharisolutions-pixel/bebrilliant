import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/tasks — List tasks */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const assignedTo = searchParams.get('assigned_to')
    const status = searchParams.get('status') || 'all'
    const taskType = searchParams.get('type') || 'all'

    try {
        let query = supabaseAdmin
            .from('platform_tasks')
            .select(`
                *,
                lead:lead_id(id, name, organization, email, phone),
                assigned_user:assigned_to(id, first_name, last_name, email, role),
                created_user:created_by(id, first_name, last_name)
            `)
            .order('due_at', { ascending: true, nullsFirst: false })

        if (assignedTo) {
            query = query.eq('assigned_to', assignedTo === 'me' ? user.id : assignedTo)
        }
        if (status !== 'all') query = query.eq('status', status)
        if (taskType !== 'all') query = query.eq('task_type', taskType)

        const { data, error } = await query
        if (error) return NextResponse.json({ error: 'Failed to fetch tasks.' }, { status: 500 })

        return NextResponse.json({ tasks: data ?? [] })
    } catch (err: any) {
        console.error('GET /api/owner/tasks error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** POST /api/owner/tasks — Create a task */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { task_type, title, description, lead_id, demo_request_id, assigned_to, due_at, priority, sla_minutes } = body

        if (!title || !task_type) {
            return NextResponse.json({ error: 'title and task_type are required.' }, { status: 400 })
        }

        const { data: task, error } = await supabaseAdmin
            .from('platform_tasks')
            .insert({
                task_type,
                title,
                description: description || null,
                lead_id: lead_id || null,
                demo_request_id: demo_request_id || null,
                assigned_to: assigned_to || null,
                created_by: user.id,
                due_at: due_at ? new Date(due_at).toISOString() : null,
                priority: priority || 'medium',
                sla_minutes: sla_minutes || null,
                status: 'pending'
            })
            .select()
            .single()

        if (error || !task) return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 })

        return NextResponse.json({ task }, { status: 201 })
    } catch (err: any) {
        console.error('POST /api/owner/tasks error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
