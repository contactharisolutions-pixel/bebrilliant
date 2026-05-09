import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const SCHOOL_BOARDS = ['CBSE', 'ICSE', 'IB Board', 'NIOS Board', 'State Board', 'Olympiad'];

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile) return null

    // Fallback for platform owners operating without a strict tenant binding
    if (profile.role === 'owner' && !profile.tenant_id) {
        const { data: tenants } = await supabaseAdmin.from('tenants').select('id').limit(1)
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id }
        return null
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner', 'teacher'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, role: profile.role }
    }
    return null
}

async function enforceOneSchoolBoard(tenant_id: string, boardName: string) {
    const isSchoolBoard = SCHOOL_BOARDS.some(b => boardName.includes(b));
    if (!isSchoolBoard) return;

    // 1. Deactivate other tenant-owned boards in syllabus_nodes
    const { data: boards } = await supabaseAdmin
        .from('syllabus_nodes')
        .select('id, name')
        .eq('tenant_id', tenant_id)
        .eq('type', 'board');

    if (boards && boards.length > 0) {
        const otherSchoolBoardIds = boards
            .filter(b => b.name !== boardName && SCHOOL_BOARDS.some(sb => b.name.includes(sb)))
            .map(b => b.id);

        if (otherSchoolBoardIds.length > 0) {
            await supabaseAdmin
                .from('syllabus_nodes')
                .update({ is_active: false })
                .in('id', otherSchoolBoardIds);
        }
    }

    // 2. Deactivate other marketplace boards in tenant_syllabus
    // We need to check if the linked master syllabus corresponds to a school board
    const { data: subs } = await supabaseAdmin
        .from('tenant_syllabus')
        .select('id, master_syllabus_id, syllabus_nodes(name)')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true);

    if (subs && subs.length > 0) {
        const otherSubIds = subs
            .filter(s => {
                const name = (s.syllabus_nodes as any)?.name;
                return name !== boardName && SCHOOL_BOARDS.some(sb => name.includes(sb));
            })
            .map(s => s.id);

        if (otherSubIds.length > 0) {
            await supabaseAdmin
                .from('tenant_syllabus')
                .update({ is_active: false })
                .in('id', otherSubIds);
        }
    }
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Directory' }, { status: 403 })

    const { tenant_id } = session

    try {
        // 1. Fetch entire Marketplace (syllabus_plans)
        const { data: marketplace } = await supabaseAdmin
            .from('syllabus_plans')
            .select('*, syllabus_nodes(name)')
            .order('created_at', { ascending: false })

        // 2. Fetch ACTIVE Syllabus Access for this Tenant
        // This includes BOTH marketplace bought (master) and manually created (tenant-owned) root nodes.
        const { data: distributions } = await supabaseAdmin
            .from('tenant_syllabus')
            .select('id, master_syllabus_id, created_at, is_active, syllabus_nodes(name, tenant_id)')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })

        // Format subscriptions to match the UI expectations (SyllabusPlan-like structure)
        const active_subscriptions = distributions?.map(d => ({
            id: d.id, // tenant_syllabus id
            syllabus_id: d.master_syllabus_id,
            syllabus_nodes: d.syllabus_nodes as any,
            acquired_at: d.created_at,
            is_active: d.is_active,
            is_private: !!(d.syllabus_nodes as any)?.tenant_id
        })) || []

        const activeSyllabusIds = distributions?.map(d => d.master_syllabus_id) || []

        // Fetch all nodes owned by tenant
        const { data: tenantNodes } = await supabaseAdmin
            .from('syllabus_nodes')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('order_index')

        // Also fetch the root nodes for active subscriptions to show in the tree
        const masterRootIds = distributions?.map(d => d.master_syllabus_id) || []
        const { data: masterNodes } = await supabaseAdmin
            .from('syllabus_nodes')
            .select('*')
            .in('id', masterRootIds)

        // Merge and mark master nodes as active based on subscription status
        const mergedNodes = [...(tenantNodes || [])]
        masterNodes?.forEach(mn => {
            const sub = distributions?.find(d => d.master_syllabus_id === mn.id)
            mergedNodes.push({
                ...mn,
                is_active: sub?.is_active ?? false,
                is_master: true // Mark as master so UI knows it can't delete/edit core props
            })
        })

        return NextResponse.json({
            marketplace: marketplace || [],
            activeSyllabusIds,
            active_subscriptions,
            nodes: mergedNodes
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, user } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'PURCHASE_SYLLABUS') {
            const { plan_id, price } = payload

            // Fetch plan to get the master_syllabus_id
            const { data: plan } = await supabaseAdmin.from('syllabus_plans').select('syllabus_id').eq('id', plan_id).single()
            if (!plan) throw new Error('Marketplace Plan not found or expired')

            // Check if tenant already has it
            const { data: existing } = await supabaseAdmin.from('tenant_syllabus').select('id').eq('tenant_id', tenant_id).eq('master_syllabus_id', plan.syllabus_id).single()
            
            if (existing) {
                // Just reactivate it and deactivate others
                await supabaseAdmin.from('tenant_syllabus').update({ is_active: true }).eq('id', existing.id)
            } else {
                // Simulate Razorpay capture logic -> Direct insert to Payments
                const { data: payment, error: payError } = await supabaseAdmin
                    .from('payments')
                    .insert([{
                        user_id: user.id,
                        tenant_id,
                        type: 'syllabus',
                        amount: price,
                        status: 'success',
                        razorpay_order_id: plan_id,
                        razorpay_payment_id: 'mock_tx_' + Math.random().toString(36).substr(2, 9)
                    }])
                    .select()
                    .single()

                if (payError) throw payError

                // Provision syllabus access to the tenant
                await supabaseAdmin.from('tenant_syllabus').insert([{ tenant_id, master_syllabus_id: plan.syllabus_id, is_active: true }])
            }

            // Enforce policy (Deactivate other boards)
            const { data: mSyllabus } = await supabaseAdmin.from('syllabus_nodes').select('name').eq('id', plan.syllabus_id).single()
            if (mSyllabus) await enforceOneSchoolBoard(tenant_id, mSyllabus.name)

            return NextResponse.json({ success: true })
        }

        if (action === 'CREATE_MANUAL_SYLLABUS') {
            const { name, type = 'board' } = payload

            // Enforce policy if activating a new board
            await enforceOneSchoolBoard(tenant_id, name)

            // 1. Create root node in syllabus_nodes for this tenant
            const { data: rootNode, error: rootError } = await supabaseAdmin
                .from('syllabus_nodes')
                .insert([{
                    name,
                    type,
                    tenant_id,
                    is_active: true
                }])
                .select()
                .single()

            if (rootError) throw rootError

            // 2. Link in tenant_syllabus
            const { error: linkError } = await supabaseAdmin
                .from('tenant_syllabus')
                .insert([{
                    tenant_id,
                    master_syllabus_id: rootNode.id
                }])

            if (linkError) throw linkError

            return NextResponse.json({ success: true, syllabus_id: rootNode.id })
        }

        if (action === 'BULK_UPLOAD_SYLLABUS') {
            const { name, nodes } = payload // nodes is a flat array or tree-ready list from CSV
            
            // Enforce policy
            await enforceOneSchoolBoard(tenant_id, name)

            // 1. Create root node
            const { data: rootNode, error: rootError } = await supabaseAdmin
                .from('syllabus_nodes')
                .insert([{ name, type: 'board', tenant_id, is_active: true }])
                .select()
                .single()

            if (rootError) throw rootError

            // 2. Create nodes recursively from CSV-like data
            // Expecting payload to have hierarchy markers or some structure.
            // For now, let's assume nodes are objects with { name, type, parent_name? } or something similar.
            // Simplified: nodes = [{name, type, level}, ...]
            // Or better: nodes = map of parent to children.
            
            // TO DO: Build actual hierarchy logic
            // For the demo / initial implementation, we will just link all provided nodes to the root.
            if (nodes && Array.isArray(nodes)) {
                const inserts = nodes.map(n => ({
                    name: n.name,
                    type: n.type || 'chapter',
                    parent_id: rootNode.id,
                    tenant_id
                }))
                await supabaseAdmin.from('syllabus_nodes').insert(inserts)
            }

            // 3. Link root to tenant_syllabus
            await supabaseAdmin.from('tenant_syllabus').insert([{ tenant_id, master_syllabus_id: rootNode.id }])

            return NextResponse.json({ success: true, syllabus_id: rootNode.id })
        }

        if (action === 'CREATE_NODE') {
            const { parent_id, name, type, order_index = 0 } = payload
            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .insert([{
                    parent_id,
                    name,
                    type,
                    order_index,
                    tenant_id,
                    is_active: true
                }])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'UPDATE_NODE') {
            const { id, name, type, order_index } = payload
            // Verify ownership
            const { data: node } = await supabaseAdmin.from('syllabus_nodes').select('tenant_id').eq('id', id).single()
            if (!node || node.tenant_id !== tenant_id) throw new Error('Unauthorized or Node not found')

            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .update({ name, type, order_index, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_NODE') {
            const { id } = payload
            // Verify ownership
            const { data: node } = await supabaseAdmin.from('syllabus_nodes').select('tenant_id').eq('id', id).single()
            if (!node || node.tenant_id !== tenant_id) throw new Error('Unauthorized or Node not found')

            const { error } = await supabaseAdmin.from('syllabus_nodes').delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'TOGGLE_NODE') {
            const { id, is_active } = payload
            // 1. Check if it's a tenant-owned node
            const { data: node } = await supabaseAdmin.from('syllabus_nodes').select('name, tenant_id, type').eq('id', id).single()
            if (node) {
                if (node.tenant_id && node.tenant_id !== tenant_id) throw new Error('Unauthorized')
                
                // If it's a board, enforce policy
                if (is_active && node.type === 'board') {
                    await enforceOneSchoolBoard(tenant_id, node.name)
                }

                if (node.tenant_id) {
                    // Update tenant-owned node
                    await supabaseAdmin.from('syllabus_nodes').update({ is_active }).eq('id', id)
                } else {
                    // It's a master node, update tenant_syllabus state
                    await supabaseAdmin.from('tenant_syllabus').update({ is_active }).eq('tenant_id', tenant_id).eq('master_syllabus_id', id)
                }
            }
            
            return NextResponse.json({ success: true })
        }

        if (action === 'FETCH_TREE') {
            const { parent_id } = payload
            const { data, error } = await supabaseAdmin
                .from('syllabus_nodes')
                .select('*')
                .eq('parent_id', parent_id)
                .order('order_index')

            if (error) throw error
            return NextResponse.json(data || [])
        }

        if (action === 'GENERATE_SYLLABUS') {
            const { node_id, node_type, node_name } = payload
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) throw new Error('AI Engine Key Missing')

            const prompt = `
                You are an academic curriculum expert for Indian boards (CBSE/ICSE/State).
                Based on the parent node: "${node_name}" (${node_type.toUpperCase()}), 
                generate the appropriate next-level children nodes.
                
                Rules:
                1. If parent is BOARD: Generate CLASSES (Class 6, Class 7, ..., Class 12).
                2. If parent is CLASS: Generate primary SUBJECTS (Mathematics, Science, Social Science, English, Hindi, etc.)
                3. If parent is SUBJECT: Generate CHAPTERS (canonical names like "Force and Pressure", "Algebraic Expressions").
                4. If parent is CHAPTER: Generate TOPICS (sub-topics).

                Context: Indian School Syllabus 2.0.
                Return ONLY a JSON array of strings: ["Node 1", "Node 2", ...]
            `
            
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            })
            const aiData = await res.json()
            const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const nodeNames = JSON.parse(cleanJson)

            const childTypeMap: Record<string, string> = { board: 'class', class: 'subject', subject: 'chapter', chapter: 'topic', topic: 'topic' }
            const childType = childTypeMap[node_type] || 'topic'

            if (Array.isArray(nodeNames)) {
                const inserts = nodeNames.map((name, idx) => ({
                    parent_id: node_id,
                    name,
                    type: childType,
                    tenant_id,
                    order_index: idx,
                    is_active: true
                }))
                const { error: iErr } = await supabaseAdmin.from('syllabus_nodes').insert(inserts)
                if (iErr) throw iErr
            }

            return NextResponse.json({ success: true, count: nodeNames.length })
        }

        return NextResponse.json({ error: 'Invalid action payload logic' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}


