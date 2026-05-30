import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile) return null

    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true, role: profile.role }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'teacher'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false, role: profile.role }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized to view AI configurations' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        let ai_settings: any = null
        if (is_owner && tenant_id === 'platform') {
            const { data } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'ai').single()
            ai_settings = data?.value
        } else {
            const { data } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single()
            ai_settings = data?.settings?.ai
        }
        const fallback = {
            adaptive_learning: true,
            auto_grading: false,
            ai_question_generation: true,
            strict_syllabus_mapping: true,
            tokens_used: 1250340,
            questions_generated: 842,
            llm_model: 'gemini-2.5-flash'
        }
        return NextResponse.json(ai_settings || fallback)
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'UPDATE_SETTINGS') {
            if (session.role === 'teacher') throw new Error('Action Restricted')
            if (is_owner && tenant_id === 'platform') {
                const { error } = await supabaseAdmin.from('platform_settings').upsert({ key: 'ai', value: payload }, { onConflict: 'key' })
                if (error) throw error
            } else {
                const { data: t } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single()
                const { error } = await supabaseAdmin.from('tenants').update({ settings: { ...(t?.settings || {}), ai: payload } }).eq('id', tenant_id)
                if (error) throw error
            }
            return NextResponse.json({ success: true })
        }

        if (action === 'GENERATE_QUESTIONS') {
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) throw new Error('Gemini API Key is not configured in environment variables.')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

            const prompt = `
                You are a professional examination architect for an Indian educational institution.
                Generate ${payload.total_nodes} unique questions for the syllabus domain: ${payload.syllabus_name}.
                
                Configuration:
                - Subjects targeted: ${payload.subjects.map((s: any) => s.name).join(', ')}
                - Language: ${payload.language || 'English'}
                - Distribution: ${JSON.stringify(payload.subjects)}
                
                Return ONLY a valid JSON array of objects with this structure:
                [
                    {
                        "id": "random_number",
                        "subject": "subject_name",
                        "text": "The question text",
                        "difficulty": "Easy/Medium/Hard",
                        "type": "Objective/Subjective",
                        "options": ["Option A", "Option B", "Option C", "Option D"], // Only if Objective
                        "answer": "Correct Option or Model Answer"
                    }
                ]
                Ensure the questions are accurate, formal, and follow the NCERT/CBSE style.
            `

            const result = await model.generateContent(prompt)
            const text = result.response.text()
            
            // Clean JSON response (sometimes LLMs add markdown blocks)
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const questions = JSON.parse(cleanJson)

            return NextResponse.json({ success: true, questions })
        }

        return NextResponse.json({ error: 'Invalid logic payload' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
