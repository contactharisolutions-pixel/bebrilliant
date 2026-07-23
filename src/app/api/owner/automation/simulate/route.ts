import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { evaluateCondition } from '@/lib/crm/automation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { event, condition, action, context } = body

        if (!event) {
            return NextResponse.json({ error: 'Trigger event type is required.' }, { status: 400 })
        }

        const traces: string[] = []
        traces.push(`[SYSTEM] Starting simulation for event: "${event}"`)
        
        // 1. Evaluate condition
        const { matched, trace: conditionTrace } = evaluateCondition(condition, context || {})
        traces.push(...conditionTrace)

        let actionOutcome = 'SKIPPED'
        if (matched) {
            actionOutcome = 'EXECUTED'
            const actionType = action?.type || 'unknown'
            traces.push(`[SYSTEM] Condition matched. Simulating action type: "${actionType}"`)

            if (actionType === 'send_email') {
                const templateId = action?.template_id
                const recipientVal = context?.email || 'N/A'
                traces.push(`[ACTION: SMTP] Check template existence for ID: "${templateId || 'None'}"`)
                
                if (templateId) {
                    const { data: template } = await supabaseAdmin
                        .from('email_templates')
                        .select('name, subject')
                        .eq('name', templateId)
                        .limit(1)
                        .maybeSingle()

                    if (template) {
                        traces.push(`[ACTION: SMTP] Found dynamic email template: "${template.name}" with subject: "${template.subject}"`)
                        traces.push(`[ACTION: SMTP] Simulated welcome transmission to: "${recipientVal}" successfully`)
                    } else {
                        traces.push(`[ACTION: SMTP] WARNING: Template name "${templateId}" not found in database. Fallback to generic message wrapper.`)
                        traces.push(`[ACTION: SMTP] Simulated generic transmission to: "${recipientVal}" successfully`)
                    }
                } else {
                    traces.push(`[ACTION: SMTP] Error: No email template ID specified in action config.`)
                    actionOutcome = 'FAILED'
                }
            } else if (actionType === 'webhook') {
                const url = action?.url
                traces.push(`[ACTION: WEBHOOK] Preparing outbound POST payload to: "${url || 'None'}"`)
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                    traces.push(`[ACTION: WEBHOOK] Payload body: ${JSON.stringify(context || {})}`)
                    traces.push(`[ACTION: WEBHOOK] Connection handshake simulated successfully with 200 OK`)
                } else {
                    traces.push(`[ACTION: WEBHOOK] Error: Invalid or missing endpoint target URL address.`)
                    actionOutcome = 'FAILED'
                }
            } else if (actionType === 'push_notification') {
                const recipientId = context?.student_id || context?.id || 'N/A'
                const msg = action?.message || 'Workflow notification update.'
                traces.push(`[ACTION: NOTIFICATION] Target user ID: "${recipientId}"`)
                traces.push(`[ACTION: NOTIFICATION] Message: "${msg}"`)
                traces.push(`[ACTION: NOTIFICATION] Notification alert dispatched successfully`)
            } else {
                traces.push(`[ACTION] Simulated generic execution for action block: ${JSON.stringify(action)}`)
            }
        } else {
            traces.push(`[SYSTEM] Condition check failed. Action dispatch skipped.`)
        }

        traces.push(`[SYSTEM] Simulation complete. Outcome: ${actionOutcome}`)

        return NextResponse.json({
            success: true,
            matched,
            outcome: actionOutcome,
            traces
        })

    } catch (e: any) {
        console.error('Simulation execution failed:', e)
        return NextResponse.json({ error: e.message || 'Internal simulation error' }, { status: 500 })
    }
}
