import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    try {
        let query = supabase
            .from('syllabus_nodes')
            .select('*')
            .order('name', { ascending: true })

        if (category) {
            // Find category node first
            const { data: catNode } = await supabase
                .from('syllabus_nodes')
                .select('id')
                .eq('type', 'category')
                .eq('name', category)
                .single()
            
            if (catNode) {
                query = query.eq('parent_id', catNode.id)
            }
        } else {
            query = query.is('parent_id', null)
        }

        const { data, error } = await query

        if (error) throw error
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { category, board, levels } = await request.json()

        // check if user is super admin (skip for now)

        // Logic to trigger AI sync would go here
        // For now, return a placeholder
        return NextResponse.json({ message: 'Sync triggered successfully' })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
