import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return p?.role === 'owner' ? user : null
}

export async function GET() {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [nodesRes, configRes, plansRes, questionsRes, tenantsRes, tenantSyllabusRes] = await Promise.allSettled([
        supabaseAdmin.from('syllabus_nodes').select('*').order('type').order('name'),
        supabaseAdmin.from('ai_engine_config').select('*').order('parameter'),
        supabaseAdmin.from('syllabus_plans').select('*, syllabus_nodes(name, type)').order('created_at', { ascending: false }),
        supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('tenants').select('id, name'),
        supabaseAdmin.from('tenant_syllabus').select('*, tenants(name), syllabus_nodes(name)').order('created_at', { ascending: false }),
    ])

    const nodes = nodesRes.status === 'fulfilled' ? nodesRes.value.data ?? [] : []
    const aiConfig = configRes.status === 'fulfilled' ? configRes.value.data ?? [] : []
    const plans = plansRes.status === 'fulfilled' ? plansRes.value.data ?? [] : []
    const totalQuestions = questionsRes.status === 'fulfilled' ? questionsRes.value.count ?? 0 : 0
    const tenants = tenantsRes.status === 'fulfilled' ? tenantsRes.value.data ?? [] : []
    const distributions = tenantSyllabusRes.status === 'fulfilled' ? tenantSyllabusRes.value.data ?? [] : []

    // Count by type
    const nodesByType: Record<string, number> = {}
    for (const n of nodes) {
        nodesByType[n.type] = (nodesByType[n.type] || 0) + 1
    }

    return NextResponse.json({
        nodes,
        aiConfig,
        plans,
        tenants,
        distributions,
        stats: {
            totalNodes: nodes.length,
            totalQuestions,
            totalPlans: plans.length,
            nodesByType,
            activeNodes: nodes.filter((n: any) => n.is_active).length,
        }
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { action, payload } = body

    try {
        // ── NODE CRUD ────────────────────────────────────────────────────
        if (action === 'CREATE_NODE') {
            const { name, type, parent_id, metadata, order_index, is_active } = payload
            if (!name?.trim()) throw new Error('Node name is required')
            if (!type) throw new Error('Node type is required')

            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .insert([{
                    name: name.trim(),
                    type,
                    parent_id: parent_id || null,
                    metadata: metadata || {},
                    order_index: order_index || 0,
                    is_active: is_active ?? true,
                }])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ node: data })
        }

        if (action === 'UPDATE_NODE') {
            const { id, name, type, parent_id, metadata, order_index, is_active } = payload
            if (!id) throw new Error('Node ID is required')

            // Fetch current version
            const { data: current } = await supabaseAdmin.from('syllabus_nodes').select('version').eq('id', id).single()
            const newVersion = (current?.version || 1) + 1

            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .update({
                    name: name?.trim(),
                    type,
                    parent_id: parent_id || null,
                    metadata: metadata || {},
                    order_index,
                    is_active,
                    version: newVersion,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error

            // Create version log
            await supabaseAdmin.from('syllabus_versions').insert([{
                syllabus_id: id,
                version: newVersion,
                changes: { name, type, is_active, updated_by: user.email }
            }])

            return NextResponse.json({ node: data })
        }

        if (action === 'DELETE_NODE') {
            const { id } = payload
            if (!id) throw new Error('Node ID is required')
            const { error } = await supabaseAdmin.from('syllabus_nodes').delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'TOGGLE_NODE') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .update({ is_active, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ node: data })
        }

        // ── AI CONFIG ──────────────────────────────────────────────────────
        if (action === 'UPDATE_AI_CONFIG') {
            const { parameter, value } = payload
            const { data, error } = await supabaseAdmin
                .from('ai_engine_config')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('parameter', parameter)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ config: data })
        }

        // ── MARKETPLACE PLANS ─────────────────────────────────────────────
        if (action === 'CREATE_PLAN') {
            const { name, syllabus_id, pricing_type, price, validity_days, features } = payload
            if (!name?.trim()) throw new Error('Plan name is required')
            if (!syllabus_id) throw new Error('A syllabus root node must be selected')

            const { data, error } = await supabaseAdmin
                .from('syllabus_plans')
                .insert([{
                    name: name.trim(),
                    syllabus_id,
                    pricing_type: pricing_type || 'one-time',
                    price: price || 0,
                    validity_days: validity_days || 365,
                    features: features || { ai_mapping: true, adaptive_learning: true, board_comparison: false }
                }])
                .select('*, syllabus_nodes(name, type)')
                .single()
            if (error) throw error
            return NextResponse.json({ plan: data })
        }

        if (action === 'UPDATE_PLAN') {
            const { id, ...updates } = payload
            const { data, error } = await supabaseAdmin
                .from('syllabus_plans')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('*, syllabus_nodes(name, type)')
                .single()
            if (error) throw error
            return NextResponse.json({ plan: data })
        }

        if (action === 'DELETE_PLAN') {
            const { id } = payload
            const { error } = await supabaseAdmin.from('syllabus_plans').delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        // ── DISTRIBUTION ──────────────────────────────────────────────────
        if (action === 'DISTRIBUTE_SYLLABUS') {
            const { syllabus_id, tenant_id } = payload
            if (!syllabus_id || !tenant_id) throw new Error('Syllabus and tenant are required')

            // Check if already distributed
            const { data: existing } = await supabaseAdmin
                .from('tenant_syllabus')
                .select('id')
                .eq('tenant_id', tenant_id)
                .eq('master_syllabus_id', syllabus_id)
                .single()

            if (existing) throw new Error('This syllabus is already distributed to this tenant')

            const { data, error } = await supabaseAdmin
                .from('tenant_syllabus')
                .insert([{ tenant_id, master_syllabus_id: syllabus_id }])
                .select('*, tenants(name), syllabus_nodes(name)')
                .single()
            if (error) throw error
            return NextResponse.json({ distribution: data })
        }

        if (action === 'REVOKE_DISTRIBUTION') {
            const { id } = payload
            const { error } = await supabaseAdmin.from('tenant_syllabus').delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        // ── CONCEPT TAGS ──────────────────────────────────────────────────
        if (action === 'ADD_TAG') {
            const { topic_id, tag, weightage } = payload
            const { data, error } = await supabaseAdmin
                .from('concept_tags')
                .insert([{ topic_id, tag: tag.trim(), weightage: weightage || 1.0 }])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ tag: data })
        }

        if (action === 'DELETE_TAG') {
            const { id } = payload
            const { error } = await supabaseAdmin.from('concept_tags').delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Unknown action: ' + action }, { status: 400 })
    } catch (e: any) {
        console.error('[Syllabus API Error]', action, e.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
