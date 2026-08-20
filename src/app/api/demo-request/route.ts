import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const { name, organization, email, phone, message, designation, type } = await req.json()

        if (!name || !organization || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Map public form type to internal CRM type
        const typeMap: Record<string, string> = {
            school: 'INSTITUTE',
            institute: 'INSTITUTE',
            teacher: 'PERSONAL_TEACHER',
            enterprise: 'INSTITUTE',
        }
        const crmType = typeMap[type] ?? 'INSTITUTE'

        // Build message with designation context
        const fullMessage = [
            designation ? `Designation: ${designation}` : '',
            type ? `Category: ${type}` : '',
            message || '',
        ].filter(Boolean).join(' | ')

        // Insert into demo_requests
        const { data: lead, error } = await supabaseAdmin
            .from('demo_requests')
            .insert([
                { name, organization, email, phone, message: fullMessage, status: 'new' }
            ])
            .select()
            .single()

        if (error) {
            console.error("Demo Request Error:", error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        // Duplicate into owner_leads so it is visible in the CRM pipeline
        const { error: leadError } = await supabaseAdmin
            .from('owner_leads')
            .insert([
                { 
                    name, 
                    organization, 
                    email, 
                    phone, 
                    source: 'Website', 
                    status: 'new',
                    type: crmType,
                    priority: 'medium',
                }
            ])

        if (leadError) {
            console.error("Failed to copy lead to owner_leads:", leadError)
        }

        // AUTOMATION HOOK (Simulating email & sales notification via DB triggers or external calls)
        // Normally we might insert to a notifications table or call SendGrid here
        // For now, logging the successful funnel capture.

        return NextResponse.json({ success: true, lead })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
