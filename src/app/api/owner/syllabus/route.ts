import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

// Type hierarchy rules — a node can only be moved to a valid parent type
const VALID_PARENT_TYPES: Record<string, string | null> = {
    category: null,          // category is a root node (no parent)
    board: null,             // board can sit at root or under category
    class: 'board',
    subject: 'class',
    chapter: 'subject',
    topic: 'chapter',
}

// ── Helper: recursively collect all descendant IDs ────────────────────────────
async function getAllDescendantIds(nodeId: string): Promise<string[]> {
    const { data: children } = await supabaseAdmin
        .from('syllabus_nodes')
        .select('id')
        .eq('parent_id', nodeId)

    if (!children || children.length === 0) return []

    const ids: string[] = children.map((c: any) => c.id)
    for (const child of children) {
        const descendantIds = await getAllDescendantIds(child.id)
        ids.push(...descendantIds)
    }
    return ids
}

// ── Helper: log activity ──────────────────────────────────────────────────────
async function logActivity(nodeId: string | null, action: string, actor: string, changes: any) {
    try {
        await supabaseAdmin.from('syllabus_activity_log').insert([{
            node_id: nodeId,
            action,
            actor_email: actor,
            changes,
        }])
    } catch {
        // non-critical — don't fail main operation if log fails
    }
}

// ── GET /api/owner/syllabus ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const typeFilter = searchParams.get('type') || ''
    const activeOnly = searchParams.get('is_active') === 'true'
    const nodeId = searchParams.get('node_id') || ''

    try {
        let nodesQuery = supabaseAdmin
            .from('syllabus_nodes')
            .select('*')
            .order('order_index', { ascending: true })
            .order('name', { ascending: true })

        if (search) {
            nodesQuery = nodesQuery.ilike('name', `%${search}%`)
        }
        if (typeFilter) {
            const types = typeFilter.split(',').filter(Boolean)
            nodesQuery = nodesQuery.in('type', types)
        }
        if (activeOnly) {
            nodesQuery = nodesQuery.eq('is_active', true)
        }
        // If node_id provided, return subtree (node + all descendants)
        if (nodeId) {
            const descendantIds = await getAllDescendantIds(nodeId)
            nodesQuery = nodesQuery.in('id', [nodeId, ...descendantIds])
        }

        const [nodesRes, configRes, plansRes, questionsRes, tenantsRes, tenantSyllabusRes] = await Promise.allSettled([
            nodesQuery,
            supabaseAdmin.from('ai_engine_config').select('*').order('parameter'),
            supabaseAdmin.from('syllabus_plans').select('*, syllabus_nodes(name, type)').order('created_at', { ascending: false }),
            supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('tenants').select('id, name').eq('is_active', true),
            supabaseAdmin.from('tenant_syllabus').select('*, tenants(name), syllabus_nodes(name)').order('created_at', { ascending: false }),
        ])

        const nodes = nodesRes.status === 'fulfilled' ? nodesRes.value.data ?? [] : []
        const aiConfig = configRes.status === 'fulfilled' ? configRes.value.data ?? [] : []
        const plans = plansRes.status === 'fulfilled' ? plansRes.value.data ?? [] : []
        const totalQuestions = questionsRes.status === 'fulfilled' ? questionsRes.value.count ?? 0 : 0
        const tenants = tenantsRes.status === 'fulfilled' ? tenantsRes.value.data ?? [] : []
        const distributions = tenantSyllabusRes.status === 'fulfilled' ? tenantSyllabusRes.value.data ?? [] : []

        // Compute live stats
        const nodesByType: Record<string, number> = {}
        for (const n of nodes) {
            nodesByType[(n as any).type] = (nodesByType[(n as any).type] || 0) + 1
        }

        // Live marketplace stats
        const activePlans = plans.filter((p: any) => p.is_active !== false)
        const totalRevenue = plans.reduce((sum: number, p: any) => sum + (p.total_revenue || 0), 0)
        const activeDistributions = distributions.filter((d: any) => d.is_active)
        const totalTenants = tenants.length
        const adoptionRate = totalTenants > 0
            ? Math.round((new Set(activeDistributions.map((d: any) => d.tenant_id)).size / totalTenants) * 100)
            : 0

        // Topic coverage: topics that have at least 1 linked question
        const topicCount = nodesByType['topic'] ?? 0

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
                activePlans: activePlans.length,
                nodesByType,
                activeNodes: nodes.filter((n: any) => n.is_active).length,
                totalRevenue,
                adoptionRate,
                activeDistributions: activeDistributions.length,
                totalDistributions: distributions.length,
                topicCount,
            }
        })
    } catch (e: any) {
        console.error('[Syllabus GET Error]', e.message)
        return NextResponse.json({ error: 'Failed to load syllabus data' }, { status: 500 })
    }
}

// ── POST /api/owner/syllabus ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { action, payload } = body

    try {
        // ── NODE CRUD ─────────────────────────────────────────────────────────
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
                    order_index: order_index ?? 0,
                    is_active: is_active ?? true,
                }])
                .select()
                .single()
            if (error) throw error

            await logActivity(data.id, 'CREATE_NODE', (user as any).email ?? '', { name, type, parent_id })
            return NextResponse.json({ node: data })
        }

        if (action === 'UPDATE_NODE') {
            const { id, name, type, parent_id, metadata, order_index, is_active, description, difficulty_level, exam_weightage, estimated_hours, color_tag, tags } = payload
            if (!id) throw new Error('Node ID is required')

            const { data: current } = await supabaseAdmin.from('syllabus_nodes').select('version').eq('id', id).single()
            const newVersion = (current?.version || 1) + 1

            const updatePayload: any = {
                version: newVersion,
                updated_at: new Date().toISOString(),
            }
            if (name !== undefined) updatePayload.name = name.trim()
            if (type !== undefined) updatePayload.type = type
            if (parent_id !== undefined) updatePayload.parent_id = parent_id || null
            if (metadata !== undefined) updatePayload.metadata = metadata
            if (order_index !== undefined) updatePayload.order_index = order_index
            if (is_active !== undefined) updatePayload.is_active = is_active
            if (description !== undefined) updatePayload.description = description
            if (difficulty_level !== undefined) updatePayload.difficulty_level = difficulty_level
            if (exam_weightage !== undefined) updatePayload.exam_weightage = exam_weightage
            if (estimated_hours !== undefined) updatePayload.estimated_hours = estimated_hours
            if (color_tag !== undefined) updatePayload.color_tag = color_tag
            if (tags !== undefined) updatePayload.tags = tags

            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error

            // Version log
            await supabaseAdmin.from('syllabus_versions').insert([{
                syllabus_id: id,
                version: newVersion,
                changes: { name, type, is_active, updated_by: (user as any).email }
            }])

            await logActivity(id, 'UPDATE_NODE', (user as any).email ?? '', updatePayload)
            return NextResponse.json({ node: data })
        }

        if (action === 'DELETE_NODE') {
            const { id } = payload
            if (!id) throw new Error('Node ID is required')

            // CASCADE: collect all descendants first
            const descendantIds = await getAllDescendantIds(id)
            const allIds = [id, ...descendantIds]

            // Delete all concept tags for these nodes
            if (allIds.length > 0) {
                await supabaseAdmin.from('concept_tags').delete().in('topic_id', allIds)
            }

            // Delete all nodes (children first via reverse order, but Supabase handles FK constraints)
            const { error } = await supabaseAdmin.from('syllabus_nodes').delete().in('id', allIds)
            if (error) throw error

            await logActivity(id, 'DELETE_NODE', (user as any).email ?? '', { deleted_count: allIds.length })
            return NextResponse.json({ success: true, deleted_count: allIds.length })
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
            await logActivity(id, 'TOGGLE_NODE', (user as any).email ?? '', { is_active })
            return NextResponse.json({ node: data })
        }

        // ── MOVE NODE (with type hierarchy enforcement) ────────────────────────
        if (action === 'MOVE_NODE') {
            const { id, new_parent_id } = payload
            if (!id) throw new Error('Node ID is required')

            // Fetch the node to check its type
            const { data: node } = await supabaseAdmin.from('syllabus_nodes').select('type, name').eq('id', id).single()
            if (!node) throw new Error('Node not found')

            if (new_parent_id) {
                // Fetch the new parent to validate type hierarchy
                const { data: newParent } = await supabaseAdmin.from('syllabus_nodes').select('type').eq('id', new_parent_id).single()
                if (!newParent) throw new Error('Target parent node not found')

                const expectedParentType = VALID_PARENT_TYPES[(node as any).type]
                if (expectedParentType && (newParent as any).type !== expectedParentType) {
                    throw new Error(
                        `A "${(node as any).type}" node can only be placed under a "${expectedParentType}" node. ` +
                        `The selected parent is a "${(newParent as any).type}".`
                    )
                }
            }

            // Prevent moving a node under one of its own descendants
            const descendantIds = await getAllDescendantIds(id)
            if (new_parent_id && descendantIds.includes(new_parent_id)) {
                throw new Error('Cannot move a node into one of its own descendants.')
            }

            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .update({ parent_id: new_parent_id || null, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error

            await logActivity(id, 'MOVE_NODE', (user as any).email ?? '', { new_parent_id })
            return NextResponse.json({ node: data })
        }

        // ── REORDER NODES (bulk update order_index for siblings) ──────────────
        if (action === 'REORDER_NODES') {
            // payload.items = [{ id: string, order_index: number }]
            const { items } = payload
            if (!Array.isArray(items)) throw new Error('items array is required')

            const updates = await Promise.all(
                items.map((item: { id: string; order_index: number }) =>
                    supabaseAdmin
                        .from('syllabus_nodes')
                        .update({ order_index: item.order_index, updated_at: new Date().toISOString() })
                        .eq('id', item.id)
                )
            )
            const errors = updates.filter(r => r.error)
            if (errors.length > 0) throw new Error('Some reorder operations failed')

            return NextResponse.json({ success: true, updated: items.length })
        }

        // ── BULK TOGGLE ───────────────────────────────────────────────────────
        if (action === 'BULK_TOGGLE') {
            const { ids, is_active } = payload
            if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids array is required')

            const { error } = await supabaseAdmin
                .from('syllabus_nodes')
                .update({ is_active, updated_at: new Date().toISOString() })
                .in('id', ids)
            if (error) throw error

            await logActivity(null, 'BULK_TOGGLE', (user as any).email ?? '', { ids, is_active, count: ids.length })
            return NextResponse.json({ success: true, updated: ids.length })
        }

        // ── BULK DELETE ───────────────────────────────────────────────────────
        if (action === 'BULK_DELETE') {
            const { ids } = payload
            if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids array is required')

            // Collect all descendants for each id
            const allIds = new Set<string>(ids)
            for (const id of ids) {
                const descendants = await getAllDescendantIds(id)
                descendants.forEach(d => allIds.add(d))
            }

            const allIdsArr = Array.from(allIds)
            if (allIdsArr.length > 0) {
                await supabaseAdmin.from('concept_tags').delete().in('topic_id', allIdsArr)
                const { error } = await supabaseAdmin.from('syllabus_nodes').delete().in('id', allIdsArr)
                if (error) throw error
            }

            await logActivity(null, 'BULK_DELETE', (user as any).email ?? '', { original_ids: ids, total_deleted: allIdsArr.length })
            return NextResponse.json({ success: true, deleted_count: allIdsArr.length })
        }

        // ── GET NODE DETAIL ───────────────────────────────────────────────────
        if (action === 'GET_NODE_DETAIL') {
            const { id } = payload
            if (!id) throw new Error('Node ID is required')

            const [nodeRes, childrenRes, tagsRes, versionsRes, plansRes] = await Promise.allSettled([
                supabaseAdmin.from('syllabus_nodes').select('*').eq('id', id).single(),
                supabaseAdmin.from('syllabus_nodes').select('id, name, type, is_active, order_index').eq('parent_id', id),
                supabaseAdmin.from('concept_tags').select('*').eq('topic_id', id),
                supabaseAdmin.from('syllabus_versions').select('*').eq('syllabus_id', id).order('version', { ascending: false }).limit(10),
                supabaseAdmin.from('syllabus_plans').select('id, name, price').eq('syllabus_id', id),
            ])

            const node = nodeRes.status === 'fulfilled' ? nodeRes.value.data : null
            if (!node) throw new Error('Node not found')

            const children = childrenRes.status === 'fulfilled' ? childrenRes.value.data ?? [] : []
            const conceptTags = tagsRes.status === 'fulfilled' ? tagsRes.value.data ?? [] : []
            const versions = versionsRes.status === 'fulfilled' ? versionsRes.value.data ?? [] : []
            const linkedPlans = plansRes.status === 'fulfilled' ? plansRes.value.data ?? [] : []

            // Question count for this specific node (from node_questions_map if exists, else 0)
            let questionCount = 0
            try {
                const { data: qMap } = await supabaseAdmin
                    .from('node_questions_map')
                    .select('question_count')
                    .eq('node_id', id)
                    .maybeSingle()
                questionCount = qMap?.question_count ?? 0
            } catch { /* table may not exist yet */ }

            return NextResponse.json({
                node,
                children,
                conceptTags,
                versions,
                linkedPlans,
                questionCount,
                childrenCount: children.length,
            })
        }

        // ── AI CONFIG ─────────────────────────────────────────────────────────
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

        // ── MARKETPLACE PLANS ─────────────────────────────────────────────────
        if (action === 'CREATE_PLAN') {
            const { name, syllabus_id, pricing_type, price, validity_days, features, description, trial_days } = payload
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
                    features: features || { ai_mapping: true, adaptive_learning: true, board_comparison: false },
                    description: description || '',
                    trial_days: trial_days || 0,
                    is_active: true,
                    total_revenue: 0,
                    subscribers_count: 0,
                }])
                .select('*, syllabus_nodes(name, type)')
                .single()
            if (error) throw error
            await logActivity(null, 'CREATE_PLAN', (user as any).email ?? '', { name, price, syllabus_id })
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

        if (action === 'TOGGLE_PLAN') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('syllabus_plans')
                .update({ is_active, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            await logActivity(null, 'TOGGLE_PLAN', (user as any).email ?? '', { id, is_active })
            return NextResponse.json({ plan: data })
        }

        if (action === 'DELETE_PLAN') {
            const { id } = payload
            const { error } = await supabaseAdmin.from('syllabus_plans').delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'UPDATE_PLAN_REVENUE') {
            // Option A: admin manually sets total_revenue
            const { id, total_revenue } = payload
            if (typeof total_revenue !== 'number') throw new Error('total_revenue must be a number')
            const { data, error } = await supabaseAdmin
                .from('syllabus_plans')
                .update({ total_revenue, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ plan: data })
        }

        // ── DISTRIBUTION ──────────────────────────────────────────────────────
        if (action === 'DISTRIBUTE_SYLLABUS') {
            const { syllabus_id, tenant_id, features, expires_at, access_level, notes } = payload
            if (!syllabus_id || !tenant_id) throw new Error('Syllabus and tenant are required')

            const { data: existing } = await supabaseAdmin
                .from('tenant_syllabus')
                .select('id')
                .eq('tenant_id', tenant_id)
                .eq('master_syllabus_id', syllabus_id)
                .single()

            if (existing) throw new Error('This syllabus is already distributed to this tenant')

            const { data, error } = await supabaseAdmin
                .from('tenant_syllabus')
                .insert([{
                    tenant_id,
                    master_syllabus_id: syllabus_id,
                    features: features || { adaptive: true, ai_help: true, analytics: true },
                    expires_at: expires_at || null,
                    access_level: access_level || 'full',
                    notes: notes || '',
                    distributed_by: (user as any).id ?? null,
                    is_active: true,
                }])
                .select('*, tenants(name), syllabus_nodes(name)')
                .single()
            if (error) throw error

            await logActivity(syllabus_id, 'DISTRIBUTE', (user as any).email ?? '', { tenant_id, access_level })
            return NextResponse.json({ distribution: data })
        }

        if (action === 'REVOKE_DISTRIBUTION') {
            const { id } = payload
            const { error } = await supabaseAdmin.from('tenant_syllabus').delete().eq('id', id)
            if (error) throw error
            await logActivity(null, 'REVOKE_DISTRIBUTION', (user as any).email ?? '', { distribution_id: id })
            return NextResponse.json({ success: true })
        }

        if (action === 'UPDATE_DISTRIBUTION') {
            const { id, features, expires_at, access_level, notes, is_active } = payload
            if (!id) throw new Error('Distribution ID is required')
            const updateData: any = { updated_at: new Date().toISOString() }
            if (features !== undefined) updateData.features = features
            if (expires_at !== undefined) updateData.expires_at = expires_at
            if (access_level !== undefined) updateData.access_level = access_level
            if (notes !== undefined) updateData.notes = notes
            if (is_active !== undefined) updateData.is_active = is_active

            const { data, error } = await supabaseAdmin
                .from('tenant_syllabus')
                .update(updateData)
                .eq('id', id)
                .select('*, tenants(name), syllabus_nodes(name)')
                .single()
            if (error) throw error
            return NextResponse.json({ distribution: data })
        }

        // ── CONCEPT TAGS ──────────────────────────────────────────────────────
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
        return NextResponse.json({ error: e.message || 'Syllabus operation failed' }, { status: 500 })
    }
}
