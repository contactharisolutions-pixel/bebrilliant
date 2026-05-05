import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendTeacherApprovedEmail } from '@/lib/email'

/**
 * Approve a pending teacher — Tenant Admin Only
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify caller is tenant_admin or owner
        const { data: callerProfile } = await supabase
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!callerProfile || !['tenant_admin', 'owner'].includes(callerProfile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const { userId } = await params

        // Fetch the teacher's current profile
        const { data: teacherProfile, error: fetchError } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id, email')
            .eq('id', userId)
            .single()

        if (fetchError || !teacherProfile) {
            return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
        }

        if (teacherProfile.role !== 'teacher_pending') {
            return NextResponse.json({ error: 'User is not a pending teacher' }, { status: 400 })
        }

        // Tenant isolation check — admins can only approve teachers in their own tenant
        if (
            callerProfile.role === 'tenant_admin' &&
            teacherProfile.tenant_id !== callerProfile.tenant_id
        ) {
            return NextResponse.json({ error: 'Access denied to this teacher' }, { status: 403 })
        }

        // Approve: update role → teacher, activate account
        const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({ role: 'teacher', is_active: true })
            .eq('id', userId)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to approve teacher' }, { status: 500 })
        }

        if (teacherProfile.email) {
            sendTeacherApprovedEmail({
                email: teacherProfile.email,
            }).catch(err => console.error('Failed to send teacher approval email:', err))
        }

        return NextResponse.json({ message: 'Teacher approved successfully' })
    } catch (error) {
        console.error('Approve teacher error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
