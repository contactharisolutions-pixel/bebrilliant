import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

import { verifyPlatformAccess } from '@/lib/platform-auth'

/** PATCH /api/owner/rbac/users/[id] - Update user role, name, email, or active status */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const authUser = await verifyPlatformAccess('settings.manage')
    if (!authUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { first_name, last_name, role, is_active, email } = body

        const updateData: Record<string, any> = {}
        if (first_name !== undefined) updateData.first_name = first_name
        if (last_name !== undefined) updateData.last_name = last_name
        if (role !== undefined) updateData.role = role
        if (is_active !== undefined) updateData.is_active = is_active
        if (email !== undefined) updateData.email = email

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('[RBAC_PATCH_USER] Error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If email was updated, update auth user as well
        if (email && email.trim()) {
            await supabaseAdmin.auth.admin.updateUserById(id, { email: email.trim() })
        }

        return NextResponse.json({ user: data })
    } catch (e: any) {
        console.error('[RBAC_PATCH_USER] Exception:', e.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** DELETE /api/owner/rbac/users/[id] - Permanently delete staff user */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const authUser = await verifyPlatformAccess('settings.manage')
    if (!authUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Prevent self-deletion
    if (authUser.id === id) {
        return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    }

    try {
        // Delete profile
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('id', id)

        if (profileError) {
            console.error('[RBAC_DELETE_USER] Profile Delete Error:', profileError.message)
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        // Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (authError) {
            console.error('[RBAC_DELETE_USER] Auth Delete Error:', authError.message)
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('[RBAC_DELETE_USER] Exception:', e.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

