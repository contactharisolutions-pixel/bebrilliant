import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** POST /api/owner/rbac/users/[id]/reset-password
 *  Owner directly resets a staff member's password. No email link sent.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const caller = await verifyPlatformAccess('settings.manage')
    if (!caller) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

    const { id } = await params

    try {
        const body = await request.json()
        const { password } = body

        if (!password || typeof password !== 'string' || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
        }

        // 1. Fetch staff profile — must be owner platform staff (no tenant)
        const { rows: profileRows } = await pool.query(
            `SELECT id, email, first_name, last_name, role, tenant_id
             FROM public.user_profiles
             WHERE id = $1`,
            [id]
        )

        if (profileRows.length === 0) {
            return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 })
        }

        const profile = profileRows[0]

        // Only allow resetting platform staff passwords (not tenant users)
        const OWNER_STAFF_ROLES = ['owner', 'platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec', 'support', 'admin']
        if (profile.tenant_id !== null || !OWNER_STAFF_ROLES.includes(profile.role)) {
            return NextResponse.json({ error: 'You can only reset passwords for your own platform staff members.' }, { status: 403 })
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(password, 12)

        // 3. Try updating auth.users by profile id directly
        const { rows: updateRows } = await pool.query(
            `UPDATE auth.users
             SET encrypted_password = $1, updated_at = NOW(), email_confirmed_at = COALESCE(email_confirmed_at, NOW())
             WHERE id = $2
             RETURNING id`,
            [hashedPassword, id]
        )

        // 4. If no auth row found by that id, look it up by email
        if (updateRows.length === 0) {
            const { rows: authByEmail } = await pool.query(
                `SELECT id FROM auth.users WHERE email = $1`,
                [profile.email]
            )

            if (authByEmail.length > 0) {
                // Update by email-matched auth id
                await pool.query(
                    `UPDATE auth.users
                     SET encrypted_password = $1, updated_at = NOW(), email_confirmed_at = COALESCE(email_confirmed_at, NOW())
                     WHERE id = $2`,
                    [hashedPassword, authByEmail[0].id]
                )
            } else {
                // No auth user at all — create one so the staff member can log in
                const newId = profile.id
                await pool.query(
                    `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
                     VALUES ($1, $2, $3, NOW(), 'authenticated', 'authenticated',
                             '{"provider":"email","providers":["email"]}'::jsonb,
                             $4::jsonb)`,
                    [newId, profile.email, hashedPassword,
                     JSON.stringify({ role: profile.role, first_name: profile.first_name, last_name: profile.last_name })]
                )
            }
        }

        // 5. Log the action in audit_logs
        await supabaseAdmin.from('audit_logs').insert({
            action: 'staff_password_reset',
            module: 'rbac',
            user_id: caller.id,
            details: {
                target_user_id: id,
                target_email: profile.email,
                reset_by: caller.id,
            },
            severity: 'warning',
        })

        return NextResponse.json({
            success: true,
            email: profile.email,
            name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email,
        })
    } catch (err: any) {
        console.error('[Reset Password Error]:', err)
        return NextResponse.json({ error: err.message || 'Something went wrong. Please try again.' }, { status: 500 })
    }
}
