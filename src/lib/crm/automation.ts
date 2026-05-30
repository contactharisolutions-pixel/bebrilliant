import { supabaseAdmin } from '@/lib/supabase/admin'

export interface AutomationContext {
    student_id?: string;
    student_name?: string;
    parent_email?: string;
    score?: number;
    exam_name?: string;
    [key: string]: unknown;
}

/**
 * Executes standard notification pipeline immediately throwing to WebSocket layer
 * or saving structurally into DB for client pulling.
 */
export async function pushNotification(userId: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', actionUrl?: string) {
    await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        message,
        type,
        action_url: actionUrl
    })
    // In production: trigger realtime Supabase channel hook or mobile Push API
}

/**
 * Fetches an email template, compiles dynamic JSON variables, and initiates SMTP queueing
 */
export async function sendCompiledEmail(tenantId: string | null, templateName: string, recipient: string, variables: Record<string, string>) {
    let query = supabaseAdmin.from('email_templates').select('subject, body, name').eq('name', templateName)

    if (tenantId) query = query.eq('tenant_id', tenantId)
    else query = query.is('tenant_id', null)

    const { data: template } = await query.single()

    if (!template) {
        console.warn(`Automation Abort: Template '${templateName}' missing.`)
        return false
    }

    let compiledBody = template.body
    let compiledSubject = template.subject

    // Replace variable strings {{student_name}}, {{exam_name}}, {{score}}
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        compiledBody = compiledBody.replace(regex, variables[key])
        compiledSubject = compiledSubject.replace(regex, variables[key])
    })

    console.log(`[SMTP SIMULATION] Sent to: ${recipient}`)
    console.log(`[SMTP SIMULATION] Subject: ${compiledSubject}`)
    console.log(`[SMTP SIMULATION] Body: ${compiledBody}`)

    // Production -> NodeMailer/AWS SES triggers here (e.g. from src/lib/email.ts)
    return true
}

/**
 * 6. AUTOMATION ENGINE (CORE)
 * Takes an origin Event and Context, checking active rules and executing parallel logic operations.
 */
export async function processAutomationTrigger(tenantId: string, eventName: string, contextData: AutomationContext) {
    const { data: rules } = await supabaseAdmin
        .from('automation_rules')
        .select('condition, action')
        .eq('tenant_id', tenantId)
        .eq('event', eventName)
        .eq('is_active', true)

    if (!rules || rules.length === 0) return

    for (const rule of rules) {
        let conditionMet = false

        // Example: logic evaluating  {"score": "<40"}  against contextData.score
        if (rule.condition && Object.keys(rule.condition).length > 0) {
            const conditionKey = Object.keys(rule.condition)[0]
            const conditionValueString = rule.condition[conditionKey] as string
            const contextValue = contextData[conditionKey] as number | string;

            if (conditionValueString.startsWith('<')) {
                const threshold = parseFloat(conditionValueString.substring(1))
                conditionMet = (contextValue as number) < threshold
            } else if (conditionValueString.startsWith('>')) {
                const threshold = parseFloat(conditionValueString.substring(1))
                conditionMet = (contextValue as number) > threshold
            } else if (conditionValueString === String(contextValue)) {
                conditionMet = true
            }
        } else {
            // Null condition implies universally run for this event
            conditionMet = true
        }

        if (conditionMet) {
            // 10. AUTOMATION FLOW (Check Rules -> Trigger Action)
            const actionType = rule.action?.type

            if (actionType === 'send_email_parent' && contextData.parent_email) {
                await sendCompiledEmail(tenantId, 'Low_Score_Alert', contextData.parent_email, {
                    student_name: String(contextData.student_name || ''),
                    score: String(contextData.score || 0),
                    exam_name: String(contextData.exam_name || '')
                })
            }

            if (actionType === 'push_notification' && contextData.student_id) {
                await pushNotification(contextData.student_id, `System Alert: Automated message triggered for event ${eventName}.`, 'warning')
            }
        }
    }
}
