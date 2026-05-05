import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET — fetch current student profile with parent info resolved
export async function GET(_req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('user_profiles')
            .select('first_name, last_name, phone, email, tenant_id, metadata, parent_login_id')
            .eq('id', user.id)
            .single()

        if (profileErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        // Resolve parent details if linked
        let parentInfo = null
        if (profile.parent_login_id) {
            const { data: parent } = await supabaseAdmin
                .from('user_profiles')
                .select('id, first_name, last_name, email, phone')
                .eq('id', profile.parent_login_id)
                .single()

            if (parent) {
                parentInfo = {
                    id: parent.id,
                    full_name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
                    email: parent.email,
                    phone: parent.phone,
                }
            }
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
            tenant_id: profile.tenant_id,
            metadata: profile.metadata,
            parent_login_id: profile.parent_login_id,
            parent: parentInfo,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST — update student profile, handle parent linking by email
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { first_name, last_name, phone, guardian_name, emergency_contact, parent_email } = body

        // Get current student profile for tenant isolation
        const { data: currentProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, metadata')
            .eq('id', user.id)
            .single()

        if (!currentProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        // Resolve parent by email within same tenant
        let parent_login_id: string | null = null
        let parentLookupError: string | null = null

        if (parent_email && parent_email.trim()) {
            const { data: parentProfile } = await supabaseAdmin
                .from('user_profiles')
                .select('id, role, tenant_id')
                .eq('email', parent_email.trim().toLowerCase())
                .eq('role', 'parent')
                .eq('tenant_id', currentProfile.tenant_id)
                .single()

            if (parentProfile) {
                parent_login_id = parentProfile.id
            } else {
                parentLookupError = `No parent account found with email "${parent_email}" in your institution. Please check the email and try again.`
            }
        }

        // Build metadata update (merge with existing)
        const updatedMetadata = {
            ...(currentProfile.metadata || {}),
            guardian_name: guardian_name || currentProfile.metadata?.guardian_name,
            emergency_contact: emergency_contact || currentProfile.metadata?.emergency_contact,
        }

        // Build update payload
        const updatePayload: Record<string, any> = {
            first_name,
            last_name,
            phone,
            metadata: updatedMetadata,
        }

        // Only update parent_login_id if a valid parent was found or explicitly cleared
        if (parent_login_id) {
            updatePayload.parent_login_id = parent_login_id
        } else if (parent_email === '') {
            // Explicitly clear the mapping
            updatePayload.parent_login_id = null
        }

        const { error: updateErr } = await supabaseAdmin
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', user.id)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        return NextResponse.json({
            success: true,
            parent_linked: !!parent_login_id,
            warning: parentLookupError,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
