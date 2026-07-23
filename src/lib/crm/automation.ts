import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendMail } from '../email'

export interface AutomationContext {
    student_id?: string;
    student_name?: string;
    parent_email?: string;
    score?: number;
    exam_name?: string;
    [key: string]: unknown;
}

/**
 * Evaluates rule conditions against a trigger payload context and yields detailed trace outputs
 */
export function evaluateCondition(condition: any, context: any): { matched: boolean; trace: string[] } {
    const trace: string[] = []
    if (!condition || Object.keys(condition).length === 0) {
        trace.push("No condition keys defined. Rule triggers universally.")
        return { matched: true, trace }
    }

    let allMatched = true
    for (const key of Object.keys(condition)) {
        const condVal = String(condition[key])
        const ctxVal = context[key]
        const ctxValStr = ctxVal !== undefined && ctxVal !== null ? String(ctxVal) : ''
        
        let match = false
        if (condVal.startsWith('<=')) {
            const num = parseFloat(condVal.substring(2))
            match = parseFloat(ctxValStr) <= num
            trace.push(`Evaluate: ${key} (${ctxValStr}) <= ${num} -> ${match}`)
        } else if (condVal.startsWith('>=')) {
            const num = parseFloat(condVal.substring(2))
            match = parseFloat(ctxValStr) >= num
            trace.push(`Evaluate: ${key} (${ctxValStr}) >= ${num} -> ${match}`)
        } else if (condVal.startsWith('<')) {
            const num = parseFloat(condVal.substring(1))
            match = parseFloat(ctxValStr) < num
            trace.push(`Evaluate: ${key} (${ctxValStr}) < ${num} -> ${match}`)
        } else if (condVal.startsWith('>')) {
            const num = parseFloat(condVal.substring(1))
            match = parseFloat(ctxValStr) > num
            trace.push(`Evaluate: ${key} (${ctxValStr}) > ${num} -> ${match}`)
        } else if (condVal.startsWith('!=')) {
            const val = condVal.substring(2).trim()
            match = ctxValStr !== val
            trace.push(`Evaluate: ${key} (${ctxValStr}) != ${val} -> ${match}`)
        } else if (condVal.startsWith('contains:')) {
            const val = condVal.substring(9).trim().toLowerCase()
            match = ctxValStr.toLowerCase().includes(val)
            trace.push(`Evaluate: ${key} (${ctxValStr}) contains "${val}" -> ${match}`)
        } else if (condVal.startsWith('starts_with:')) {
            const val = condVal.substring(12).trim().toLowerCase()
            match = ctxValStr.toLowerCase().startsWith(val)
            trace.push(`Evaluate: ${key} (${ctxValStr}) starts with "${val}" -> ${match}`)
        } else {
            match = ctxValStr === condVal
            trace.push(`Evaluate: ${key} (${ctxValStr}) == ${condVal} -> ${match}`)
        }

        if (!match) {
            allMatched = false
        }
    }

    return { matched: allMatched, trace }
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

    console.log(`[SMTP DISPATCH] Sent to: ${recipient}`)
    
    // Trigger real mail transport using the platform dynamic SMTP sender!
    const mailResult = await sendMail({
        to: recipient,
        subject: compiledSubject,
        html: compiledBody
    })
    
    return mailResult.success
}

/**
 * Dispatches an outbound JSON POST request to custom webhook endpoint
 */
export async function triggerWebhook(url: string, payload: any, headers?: Record<string, string>) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(headers || {})
            },
            body: JSON.stringify(payload)
        })
        return { success: res.ok, status: res.status }
    } catch (e: any) {
        console.error(`[WEBHOOK ENGINE ERROR] Failed calling ${url}:`, e)
        return { success: false, error: e.message }
    }
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
        const { matched } = evaluateCondition(rule.condition, contextData)
        if (!matched) continue

        const actionType = rule.action?.type
        if (actionType === 'send_email_parent' && contextData.parent_email) {
            await sendCompiledEmail(tenantId, 'Low_Score_Alert', contextData.parent_email, {
                student_name: String(contextData.student_name || ''),
                score: String(contextData.score || 0),
                exam_name: String(contextData.exam_name || '')
            })
        } else if (actionType === 'send_email' && rule.action?.template_id && contextData.email) {
            // General email template alert
            await sendCompiledEmail(tenantId, rule.action.template_id, String(contextData.email), {
                student_name: String(contextData.student_name || ''),
                event: eventName,
                ...Object.keys(contextData).reduce((acc: any, k) => {
                    acc[k] = String(contextData[k])
                    return acc
                }, {})
            })
        } else if (actionType === 'webhook' && rule.action?.url) {
            await triggerWebhook(rule.action.url, contextData, rule.action.headers)
        } else if (actionType === 'push_notification' && contextData.student_id) {
            await pushNotification(
                contextData.student_id,
                rule.action?.message || `System Alert: Automated workflow triggered for event ${eventName}.`,
                'warning'
            )
        }
    }
}
