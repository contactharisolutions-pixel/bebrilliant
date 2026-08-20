import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** POST /api/owner/rbac/users/[id]/reset-password — Direct Owner Password Reset */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    try {
        const body = await request.json()
        const { password } = body

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
        }

        // 1. Fetch user profile
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, role')
            .eq('id', id)
            .single()

        if (!profile?.email) {
            return NextResponse.json({ error: 'Staff user profile not found.' }, { status: 404 })
        }

        let targetAuthId = id

        // 2. Try direct update by profile ID
        let { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetAuthId, {
            password,
            email_confirm: true
        })

        // 3. If update by ID fails (e.g. user not found in auth.users), search by email
        if (updateError) {
            console.warn(`Direct update by ID ${id} failed: ${updateError.message}. Searching auth.users by email...`)
            
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            const foundAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === profile.email.toLowerCase())

            if (foundAuthUser) {
                targetAuthId = foundAuthUser.id
                const { error: retryError } = await supabaseAdmin.auth.admin.updateUserById(foundAuthUser.id, {
                    password,
                    email_confirm: true
                })
                updateError = retryError
            } else {
                // 4. Auth user does not exist at all -> Create auth user with this password
                console.log(`Creating missing auth user for ${profile.email}...`)
                const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: profile.email,
                    password,
                    email_confirm: true,
                    user_metadata: { role: profile.role, first_name: profile.first_name, last_name: profile.last_name }
                })

                if (createError || !newAuthData?.user) {
                    return NextResponse.json({ error: createError?.message || 'Failed to create auth user.' }, { status: 500 })
                }
                
                targetAuthId = newAuthData.user.id
                updateError = null
            }

            // Sync user_profiles ID if it differed from targetAuthId
            if (targetAuthId !== id) {
                await supabaseAdmin
                    .from('user_profiles')
                    .update({ id: targetAuthId })
                    .eq('email', profile.email)
            }
        }

        if (updateError) {
            return NextResponse.json({ error: updateError.message || 'Failed to update staff password.' }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin.from('audit_logs').insert({
            action: 'staff_password_direct_reset',
            module: 'rbac',
            user_id: user.id,
            details: { target_user_id: targetAuthId, target_email: profile.email, reset_by: user.id },
            severity: 'warning',
        })

        return NextResponse.json({
            success: true,
            email: profile.email,
            name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
        })
    } catch (err: any) {
        console.error('Direct password reset error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
