import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Get student profile and class
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role, metadata')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const studentClass = (profile.metadata as any)?.school_class || (profile.metadata as any)?.class || ''
        if (!studentClass) {
            return NextResponse.json({ subjects: [], message: 'No class assigned to student profile' })
        }

        // 2. Resolve Class Node
        // Search for a 'class' node that matches the student's class name.
        // It must belong to the tenant OR be a master node (tenant_id IS NULL) that the tenant has access to.
        // For simplicity, we search for nodes the user's RLS policy allows them to see.
        const { data: classNodes, error: classError } = await supabaseAdmin
            .from('syllabus_nodes')
            .select('id, name')
            .eq('type', 'class')
            .ilike('name', `%${studentClass}%`) // Partial match to handle "Class 10" vs "10th"
            .limit(5)

        if (classError || !classNodes || classNodes.length === 0) {
            return NextResponse.json({ subjects: [], message: `Could not resolve syllabus node for class: ${studentClass}` })
        }

        // 3. Fetch Subjects for these classes
        const classIds = classNodes.map(n => n.id)
        const { data: subjects, error: subError } = await supabaseAdmin
            .from('syllabus_nodes')
            .select('id, name')
            .eq('type', 'subject')
            .in('parent_id', classIds)

        if (subError) throw subError

        return NextResponse.json({ subjects: subjects || [] })
    } catch (error: any) {
        console.error('Student Syllabus API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
