import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** PATCH /api/owner/tenants/[id] — Update tenant details, plan, capacities, features, and status */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyPlatformAccess('settings.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const { id } = await params
        const body = await request.json()

        const updatePayload: any = { ...body, updated_at: new Date().toISOString() }

        // Sync legacy 'type' if 'tenant_type' is updated
        if (body.tenant_type) {
            if (body.tenant_type === 'school') updatePayload.type = 'SCHOOL'
            else if (body.tenant_type === 'institute') updatePayload.type = 'INSTITUTE'
            else if (body.tenant_type === 'independent_teacher') updatePayload.type = 'PERSONAL_TEACHER'
        }

        // If plan is updated via current_plan_id, ensure subscription_plan and tenant_subscriptions stay in sync
        if (body.current_plan_id) {
            const { data: plan } = await supabaseAdmin
                .from('plans')
                .select('*')
                .eq('id', body.current_plan_id)
                .single()

            if (plan) {
                updatePayload.subscription_plan = plan.name

                // Upsert subscription row
                await supabaseAdmin
                    .from('tenant_subscriptions')
                    .upsert({
                        tenant_id: id,
                        plan_id: plan.id,
                        plan_name: plan.name,
                        plan_type: plan.type,
                        amount: plan.price,
                        status: 'active',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'tenant_id' })
            }
        }

        const { data, error } = await supabaseAdmin
            .from('tenants')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Tenant update error:', error)
            return NextResponse.json({ error: error.message || 'Failed to update tenant' }, { status: 500 })
        }

        return NextResponse.json({ tenant: data, success: true })
    } catch (err: any) {
        console.error('Tenant PATCH error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** DELETE /api/owner/tenants/[id] — Delete tenant account */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyPlatformAccess('settings.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const { id } = await params

        const { error } = await supabaseAdmin
            .from('tenants')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Tenant delete error:', error)
            return NextResponse.json({ error: error.message || 'Failed to delete tenant' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Tenant DELETE error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
