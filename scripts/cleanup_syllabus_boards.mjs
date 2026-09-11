/**
 * Cleanup script: Delete all syllabus board nodes except CBSE and their subtrees.
 * Uses Supabase REST API (no direct Postgres connection needed).
 *
 * Usage: node scripts/cleanup_syllabus_boards.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bfzlkdurgggzytegvvrw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Recursively collect all descendant IDs of a node
async function getAllDescendantIds(parentId) {
    const { data: children } = await supabase
        .from('syllabus_nodes')
        .select('id')
        .eq('parent_id', parentId)

    if (!children || children.length === 0) return []

    const childIds = children.map(c => c.id)
    const nestedIds = []
    for (const childId of childIds) {
        const deeper = await getAllDescendantIds(childId)
        nestedIds.push(...deeper)
    }
    return [...childIds, ...nestedIds]
}

async function cleanup() {
    console.log('🔌 Connecting to Supabase at', SUPABASE_URL, '\n')

    // ── Step 1: Show current state ───────────────────────────────────────────
    const { data: allNodes } = await supabase
        .from('syllabus_nodes')
        .select('id, name, type, parent_id')

    if (!allNodes) {
        console.error('❌ Could not fetch nodes — check Supabase URL and key')
        process.exit(1)
    }

    const countByType = {}
    allNodes.forEach(n => { countByType[n.type] = (countByType[n.type] || 0) + 1 })
    console.log('📊 Current node counts:')
    Object.entries(countByType).sort().forEach(([t, c]) =>
        console.log(`   ${t.padEnd(10)} : ${c}`)
    )
    console.log(`   ${'TOTAL'.padEnd(10)} : ${allNodes.length}\n`)

    // ── Step 2: List all boards ──────────────────────────────────────────────
    const boards = allNodes.filter(n => n.type === 'board')
    console.log(`📋 All boards (${boards.length}):`)
    boards.forEach(b => console.log(`   [${b.id.slice(0, 8)}...] "${b.name}"`))

    // ── Step 3: Find non-CBSE boards ─────────────────────────────────────────
    const nonCBSEBoards = boards.filter(b => b.name !== 'CBSE')
    if (nonCBSEBoards.length === 0) {
        console.log('\n✅ Only CBSE exists — nothing to clean up!')
        process.exit(0)
    }

    console.log(`\n🎯 Will delete ${nonCBSEBoards.length} non-CBSE board(s) and all their children:`)
    nonCBSEBoards.forEach(b => console.log(`   "${b.name}"`))

    // ── Step 4: Collect all IDs to delete (boards + all descendants) ─────────
    const idsToDelete = []
    for (const board of nonCBSEBoards) {
        const descendants = await getAllDescendantIds(board.id)
        idsToDelete.push(board.id, ...descendants)
    }
    console.log(`\n🗑️  Total nodes to delete: ${idsToDelete.length}`)

    // ── Step 5: Delete in batches of 100 (Supabase API limit) ───────────────
    let deleted = 0
    const BATCH = 100
    for (let i = 0; i < idsToDelete.length; i += BATCH) {
        const batch = idsToDelete.slice(i, i + BATCH)
        const { error } = await supabase
            .from('syllabus_nodes')
            .delete()
            .in('id', batch)
        if (error) {
            console.error(`❌ Delete error at batch ${i}: ${error.message}`)
        } else {
            deleted += batch.length
            process.stdout.write(`\r   Deleted ${deleted}/${idsToDelete.length} nodes...`)
        }
    }
    console.log('\n')

    // ── Step 6: Delete orphaned empty category nodes ─────────────────────────
    const { data: remainingNodes } = await supabase
        .from('syllabus_nodes')
        .select('id, name, type, parent_id')

    const usedParentIds = new Set((remainingNodes || []).map(n => n.parent_id).filter(Boolean))
    const emptyCategories = (remainingNodes || []).filter(
        n => n.type === 'category' && !usedParentIds.has(n.id)
    )

    if (emptyCategories.length > 0) {
        console.log(`🗑️  Removing ${emptyCategories.length} empty category node(s):`)
        for (const cat of emptyCategories) {
            await supabase.from('syllabus_nodes').delete().eq('id', cat.id)
            console.log(`   Deleted empty category: "${cat.name}"`)
        }
    }

    // ── Step 7: Final count ──────────────────────────────────────────────────
    const { data: finalNodes } = await supabase
        .from('syllabus_nodes')
        .select('type')

    const finalCount = {}
    ;(finalNodes || []).forEach(n => { finalCount[n.type] = (finalCount[n.type] || 0) + 1 })
    console.log('\n📊 Final node counts after cleanup:')
    Object.entries(finalCount).sort().forEach(([t, c]) =>
        console.log(`   ${t.padEnd(10)} : ${c}`)
    )
    const total = Object.values(finalCount).reduce((a, b) => a + b, 0)
    console.log(`   ${'TOTAL'.padEnd(10)} : ${total}`)
    console.log('\n✅ Done! Only CBSE and its subtree remain.\n')
}

cleanup().catch(err => {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
})
