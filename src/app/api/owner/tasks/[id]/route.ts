import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** PATCH /api/owner/tasks/[id] — Update task status or details */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const taskId = params.id
    try {
        const body = await request.json()
        const { status, completion_notes, assigned_to, due_at, priority } = body

        const updateData: Record<string, any> = {}

        if (status) {
            updateData.status = status
            if (status === 'completed') {
                updateData.completed_at = new Date().toISOString()
            }
        }
        if (completion_notes !== undefined) updateData.completion_notes = completion_notes
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to
        if (due_at !== undefined) updateData.due_at = due_at ? new Date(due_at).toISOString() : null
        if (priority !== undefined) updateData.priority = priority

        const { data: task, error } = await supabaseAdmin
            .from('platform_tasks')
            .update(updateData)
            .eq('id', taskId)
            .select()
            .single()

        if (error || !task) return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 })

        return NextResponse.json({ task })
    } catch (err: any) {
        console.error('PATCH /api/owner/tasks/[id] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
