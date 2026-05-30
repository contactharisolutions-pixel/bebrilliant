import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'
import { generateQuestions } from '@/lib/ai/gemini'

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { tenant_id } = session
        const action = request.nextUrl.searchParams.get('action')

        if (action === 'GET_TEMPLATES') {
            const { data: templates, error: tErr } = await supabaseAdmin.from('paper_templates').select('*, sections:template_sections(*, rules:section_question_rules(*))').eq('is_global', true)
            if (tErr) throw tErr
            return NextResponse.json(templates || [])
        }

        const { data: exams, error } = await supabaseAdmin
            .from('online_exams')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ exams: exams || [] })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id, user } = session
    const userId = user.id
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'CREATE_EXAM') {
            const { data: exam, error: exErr } = await supabaseAdmin
                .from('online_exams')
                .insert([{
                    tenant_id,
                    title: payload.title,
                    total_marks: payload.total_marks,
                    duration: payload.duration,
                    pricing_type: payload.pricing_type,
                    price: payload.price,
                    instructions: payload.instructions,
                    blueprint: payload.blueprint, // This is the template_id
                    status: 'publish',
                    created_by: userId
                }])
                .select()
                .single()
            if (exErr) throw exErr

            // TRIGGER COMPILE LOGIC
            const { data: template } = await supabaseAdmin
                .from('paper_templates')
                .select('*, sections:template_sections(*, rules:section_question_rules(*))')
                .eq('id', payload.blueprint)
                .single()

            if (template) {
                for (const section of template.sections) {
                    for (const rule of section.rules) {
                        const requiredSize = rule.num_questions
                        
                        // 1. SELECT FROM REPOSITORY (Objective Only for Online)
                        const { data: existingQs } = await supabaseAdmin
                            .from('questions')
                            .select('id')
                            .eq('type', 'objective')
                            .eq('difficulty', rule.question_type.toLowerCase().includes('easy') ? 'easy' : rule.question_type.toLowerCase().includes('hard') ? 'hard' : 'medium')
                            .limit(requiredSize)

                        const selectedIds = (existingQs || []).map(q => q.id)
                        
                        // 2. AI FALLBACK
                        if (selectedIds.length < requiredSize) {
                            const neededCount = requiredSize - selectedIds.length
                            const prompt = `Generate ${neededCount} objective MCQ questions of ${rule.question_type} difficulty for online academic testing. Return ONLY a JSON array of objects with question_text, options {A,B,C,D}, correct_answer, explanation.`
                            const aiResponse = await generateQuestions(prompt)
                            try {
                                const parsed = JSON.parse(aiResponse?.replace(/```json|```/g, '') || '[]')
                                for (const aiQ of parsed) {
                                    const { data: newQ } = await supabaseAdmin.from('questions').insert([{
                                        tenant_id,
                                        type: 'objective',
                                        question_text: { en: aiQ.question_text },
                                        options: aiQ.options,
                                        correct_answer: aiQ.correct_answer,
                                        explanation: { en: aiQ.explanation },
                                        difficulty: rule.question_type.toLowerCase().includes('easy') ? 'easy' : rule.question_type.toLowerCase().includes('hard') ? 'hard' : 'medium',
                                        source: 'ai',
                                        created_by: userId
                                    }]).select().single()
                                    if (newQ) selectedIds.push(newQ.id)
                                }
                            } catch (e) { console.error('AI Parse Failed', e) }
                        }

                        // 3. STORE MAPPING
                        if (selectedIds.length > 0) {
                            const mapping = selectedIds.map((qid) => ({
                                exam_id: exam.id,
                                question_id: qid,
                                section_name: section.section_name,
                                marks: rule.marks_per_question,
                                negative_marks: rule.negative_marks
                            }))
                            await supabaseAdmin.from('online_exam_questions').insert(mapping)
                        }
                    }
                }
            }

            return NextResponse.json(exam)
        }

        if (action === 'DELETE_EXAM') {
            const { error } = await supabaseAdmin.from('online_exams').delete().eq('id', payload.id).eq('tenant_id', tenant_id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
