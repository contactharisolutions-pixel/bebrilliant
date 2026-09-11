import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/billing/features — List all platform module features */
export async function GET() {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data, error } = await supabaseAdmin
            .from('plan_features')
            .select('*')
            .order('sort_order', { ascending: true })

        if (!error && data && data.length > 0) {
            return NextResponse.json({ features: data })
        }

        // Default fallback if table is not yet migrated
        const defaultFeatures = [
            { id: '1', key: 'ai_mentor', label: 'AI Study Assistant', description: 'Personalised AI-powered study guidance for students', icon: 'Bot', category: 'AI & Smart', is_system: true, sort_order: 1 },
            { id: '2', key: 'adaptive_exam', label: 'Online Proctored Exams', description: 'Browser-lock + webcam proctoring for online exams', icon: 'ShieldCheck', category: 'Examinations', is_system: true, sort_order: 2 },
            { id: '3', key: 'white_label', label: 'Custom Platform Branding', description: 'Remove BeBrilliant branding and use institute logo/domain', icon: 'Palette', category: 'Customisation', is_system: true, sort_order: 3 },
            { id: '4', key: 'live_classes', label: 'Live Classes (Video)', description: 'Host live video sessions via integrated meeting rooms', icon: 'Video', category: 'Learning', is_system: false, sort_order: 4 },
            { id: '5', key: 'attendance', label: 'Attendance Tracking', description: 'QR / biometric attendance system with reports', icon: 'UserCheck', category: 'Core', is_system: false, sort_order: 5 },
            { id: '6', key: 'parent_portal', label: 'Parent Portal', description: 'Dedicated parent login to track ward progress', icon: 'Users', category: 'Core', is_system: false, sort_order: 6 },
            { id: '7', key: 'analytics_reports', label: 'Advanced Analytics', description: 'In-depth institute analytics and downloadable reports', icon: 'TrendingUp', category: 'Reporting', is_system: false, sort_order: 7 },
            { id: '8', key: 'custom_certs', label: 'Custom Certificates', description: 'Design and issue branded digital certificates', icon: 'Award', category: 'Customisation', is_system: false, sort_order: 8 },
            { id: '9', key: 'bulk_sms', label: 'Bulk SMS Notifications', description: 'Send SMS alerts to students, parents, and teachers', icon: 'MessageSquare', category: 'Communication', is_system: false, sort_order: 9 },
            { id: '10', key: 'marketplace', label: 'Course Marketplace', description: 'Publish and sell courses on the BeBrilliant marketplace', icon: 'ShoppingBag', category: 'Revenue', is_system: false, sort_order: 10 }
        ]

        return NextResponse.json({ features: defaultFeatures })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** POST /api/owner/billing/features — Create a new platform module/feature */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { key, label, description, icon, category, sort_order } = body

        if (!key?.trim() || !label?.trim()) {
            return NextResponse.json({ error: 'key and label are required' }, { status: 400 })
        }

        // Sanitise the key — lowercase, underscores only
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')

        const { data, error } = await supabaseAdmin
            .from('plan_features')
            .insert([{
                key: cleanKey,
                label: label.trim(),
                description: description?.trim() || null,
                icon: icon?.trim() || 'Star',
                category: category?.trim() || 'Core',
                sort_order: sort_order ?? 99,
                is_system: false
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ feature: data }, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** PATCH /api/owner/billing/features — Update a platform feature (label, description, icon, category) */
export async function PATCH(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

        // Never allow changing the key or is_system flag via PATCH
        const { key: _k, is_system: _s, ...safeUpdates } = updates

        const { data, error } = await supabaseAdmin
            .from('plan_features')
            .update(safeUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ feature: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** DELETE /api/owner/billing/features — Delete a non-system feature */
export async function DELETE(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 })

        // Guard: never delete system features
        const { data: feat, error: fetchErr } = await supabaseAdmin
            .from('plan_features')
            .select('is_system, key')
            .eq('id', id)
            .single()

        if (fetchErr) throw fetchErr
        if (feat?.is_system) {
            return NextResponse.json({ error: 'System features cannot be deleted.' }, { status: 403 })
        }

        const { error } = await supabaseAdmin
            .from('plan_features')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
