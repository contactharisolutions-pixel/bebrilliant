import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const searchParams = request.nextUrl.searchParams
        const parentId = searchParams.get('parentId')

        if (!parentId) {
            return NextResponse.json({ error: 'parentId is required' }, { status: 400 })
        }

        const { data: nodes, error } = await supabaseAdmin
            .from('syllabus_nodes')
            .select('id, name, type')
            .eq('parent_id', parentId)
            .eq('is_active', true)
            .order('order_index')

        if (error) throw error

        return NextResponse.json({ nodes: nodes || [] })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
