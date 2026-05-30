import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const { name, organization, email, phone, message } = await req.json()

        if (!name || !organization || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Insert into demo_requests
        const { data: lead, error } = await supabaseAdmin
            .from('demo_requests')
            .insert([
                { name, organization, email, phone, message, status: 'new' }
            ])
            .select()
            .single()

        if (error) {
            console.error("Demo Request Error:", error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        // AUTOMATION HOOK (Simulating email & sales notification via DB triggers or external calls)
        // Normally we might insert to a notifications table or call SendGrid here
        // For now, logging the successful funnel capture.

        return NextResponse.json({ success: true, lead })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
