import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles')
        .select(`
            role, 
            tenant_id,
            tenants:tenant_id(tenant_type)
        `)
        .eq('id', user.id).single()
    if (!profile) return null

    const rawTenant = (profile as any).tenants
    const tenantData = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant
    const tenant_type = tenantData?.tenant_type || 'institute'

    // RESTRICTION: Independent teachers cannot manage/create other teachers
    if (tenant_type === 'independent_teacher') return null

    // Fallback for platform owners operating without a strict tenant binding
    if (profile.role === 'owner' && !profile.tenant_id) {
        const { data: tenants } = await supabaseAdmin.from('tenants').select('id').limit(1)
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id }
        return null // No tenants available to operation within
    }

    // Only 'admin' or 'owner' can manage teachers
    if (profile.tenant_id && ['tenant_admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id }
    }

    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Administrator' }, { status: 403 })

    const { tenant_id } = session

    try {
        const { data: teachers, error } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, phone, is_active, created_at, metadata')
            .eq('tenant_id', tenant_id)
            .eq('role', 'teacher')
            .order('created_at', { ascending: false })

        if (error) throw error

        // 2. Fetch Subjects: (Global subjects AND nodes specifically owned by this tenant)
        // We'll fetch all root-level or mapped subjects for now.
        const { data: subjects } = await supabaseAdmin
            .from('syllabus_nodes')
            .select('id, name, type, tenant_id')
            .eq('type', 'subject')
            .or(`tenant_id.is.null,tenant_id.eq.${tenant_id}`)
            .order('name', { ascending: true })

        return NextResponse.json({
            teachers: teachers || [],
            subjects: subjects || []
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, user: data })
        }

        if (action === 'CREATE_TEACHER') {
            const { first_name, last_name, email, phone, subjects } = payload
            const rawPassword = phone || 'TeacherGate#123'

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: rawPassword,
                email_confirm: true,
                user_metadata: { role: 'teacher', tenant_id, first_name, last_name }
            })
            if (authError) {
                return NextResponse.json({ error: 'Auth failed: ' + authError.message }, { status: 500 })
            }

            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                    id: authData.user.id,
                    email,
                    role: 'teacher',
                    first_name,
                    last_name,
                    phone,
                    is_active: false, // Start as pending per spec
                    tenant_id,
                    metadata: { assigned_subjects: subjects || [] }
                })

            if (profileError) {
                return NextResponse.json({ error: 'Profile creation failed: ' + profileError.message }, { status: 500 })
            }
            return NextResponse.json({ success: true, id: authData.user.id })
        }

        if (action === 'ASSIGN_SCOPE') {
            const { id, subjects, classes, divisions } = payload

            // fetch existing metadata
            const { data: profile } = await supabaseAdmin.from('user_profiles').select('metadata').eq('id', id).single()
            const meta = profile?.metadata || {}

            const { error } = await supabaseAdmin
                .from('user_profiles')
                .update({ 
                    metadata: { 
                        ...meta, 
                        assigned_subjects: subjects,
                        assigned_classes: classes,
                        assigned_divisions: divisions 
                    } 
                })
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'CREATE_SUBJECT') {
            const { name } = payload
            if (!name || name.length < 2) throw new Error('Subject name too short')

            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .insert([{
                    name,
                    type: 'subject',
                    tenant_id,
                    is_active: true
                }])
                .select()
                .single()

            if (error) throw error

            // Also map it to tenant access table so it stays in their list even if we change filters
            await supabaseAdmin.from('tenant_syllabus').insert([{
                tenant_id,
                master_syllabus_id: data.id
            }])

            return NextResponse.json({ success: true, node: data })
        }

        if (action === 'EDIT_SUBJECT') {
            const { id, name } = payload
            if (!name || name.length < 2) throw new Error('Subject name too short')
            
            const { error: updateError } = await supabaseAdmin
                .from('syllabus_nodes')
                .update({ name })
                .eq('id', id)
                .eq('tenant_id', tenant_id) // Security: Can only rename subjects owned by tenant

            if (updateError) throw updateError
            return NextResponse.json({ success: true })
        }

        if (action === 'DELETE_SUBJECT') {
            const { id } = payload
            // Security: We only allow deleting tenant-owned custom subjects
            const { data: subjectToCheck } = await supabaseAdmin
                .from('syllabus_nodes')
                .select('tenant_id')
                .eq('id', id)
                .single()

            if (!subjectToCheck || subjectToCheck.tenant_id !== tenant_id) {
                throw new Error('Cannot delete systemic global subject blocks.')
            }

            const { error: delError } = await supabaseAdmin
                .from('syllabus_nodes')
                .delete()
                .eq('id', id)

            if (delError) throw delError
            
            // Clean up mapping
            await supabaseAdmin.from('tenant_syllabus').delete().eq('master_syllabus_id', id)

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action payload logic' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
