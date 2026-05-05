import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifyTenantStaff()
    if (!session) return new NextResponse('Unauthorized', { status: 403 })

    const resolvedParams = await params
    const examId = resolvedParams.id
    const mode = request.nextUrl.searchParams.get('mode') || 'paper' // paper, key, solution

    const { data: exam } = await supabaseAdmin.from('offline_exams').select('*').eq('id', examId).single()
    if (!exam) return new NextResponse('Exam Not Found', { status: 404 })

    const { data: questions } = await supabaseAdmin
        .from('offline_exam_questions')
        .select('*, details:questions(*)')
        .eq('exam_id', examId)
        .order('question_order', { ascending: true })

    if (!questions) return new NextResponse('Questions Not Found', { status: 404 })

    const sections: Record<string, any[]> = {}
    questions.forEach(q => {
        const sec = q.section || 'General'
        if (!sections[sec]) sections[sec] = []
        sections[sec].push(q)
    })

    const titleSuffix = mode === 'key' ? '- Answer Key' : mode === 'solution' ? '- Solution Sheet' : '- Question Paper'

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${exam.title} ${titleSuffix}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', 'Noto Sans Gujarati', sans-serif; padding: 40px; color: #000; line-height: 1.6; background: #fff; }
            .header { text-align: center; border: 2px solid #000; padding: 20px; margin-bottom: 40px; position: relative; }
            .school-name { font-size: 28px; font-weight: 900; letter-spacing: 2px; }
            .exam-title { font-size: 20px; font-weight: 800; margin-top: 10px; }
            .info-row { display: flex; justify-content: space-between; margin-top: 20px; font-weight: 900; border-top: 1px solid #000; padding-top: 10px; }
            
            .section-head { background: #000; color: #fff; padding: 6px 20px; font-weight: 950; margin: 30px 0 20px; display: inline-block; }
            .question { margin-bottom: 24px; position: relative; }
            .q-num { font-weight: 900; min-width: 30px; display: inline-block; }
            .q-text { display: inline-block; width: calc(100% - 130px); vertical-align: top; font-weight: 600; }
            .marks { float: right; font-weight: 950; border: 1px solid #000; padding: 2px 6px; }
            
            .options { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 12px 0 12px 40px; }
            .option { font-weight: 500; }
            
            .key-item { margin-bottom: 10px; padding: 10px; border-bottom: 1px dashed #ccc; }
            .ans-label { font-weight: 900; color: #004B93; margin-right: 10px; }

            .group-container { border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
            
            @media print {
                @page { size: A4; margin: 20mm; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body onload="window.print()">
        <div class="header">
            <div class="school-name">OFFLINE ASSESSMENT TERMINAL</div>
            <div class="exam-title">${exam.title} ${mode !== 'paper' ? '(' + mode.toUpperCase() + ')' : ''}</div>
            <div class="info-row">
                <span>Subject Pool: ${exam.subject_id || 'Unified'}</span>
                <span>Max Marks: ${exam.total_marks}</span>
                <span>Duration: ${exam.duration} Min</span>
            </div>
        </div>

        ${Object.entries(sections).map(([name, qs]) => {
            const groups: Record<string, any[]> = {}
            qs.forEach(q => {
                const grp = q.choice_group || `single_${q.id}`
                if (!groups[grp]) groups[grp] = []
                groups[grp].push(q)
            })

            return `
                <div class="section-head">SECTION - ${name}</div>
                ${Object.entries(groups).map(([grpId, groupQs]) => `
                    <div class="${groupQs.length > 1 ? 'group-container' : ''}">
                        ${groupQs.length > 1 ? `<div style="text-align: center; font-weight: 950; font-size: 11px; margin-bottom: 15px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px;">ATTEMPT ANY ONE FROM BELOW</div>` : ''}
                        ${groupQs.map((q, idx) => `
                            <div class="question">
                                <span class="marks">[${q.marks}]</span>
                                <div class="q-num">${q.question_order}${groupQs.length > 1 ? (idx === 0 ? ' (i)' : ' (ii)') : ''}.</div>
                                <div class="q-text">
                                    ${q.details.question_text.en}
                                    ${q.details.question_text.gu ? `<br/><span style="color: #444;">${q.details.question_text.gu}</span>` : ''}
                                </div>

                                ${mode === 'paper' ? `
                                    ${q.details.type === 'objective' ? `
                                        <div class="options">
                                            ${Object.entries(q.details.options || {}).map(([key, val]) => `
                                                <div class="option">(${key}) ${val}</div>
                                            `).join('')}
                                        </div>
                                    ` : '<div style="height: 10px;"></div>'}
                                ` : ''}

                                ${mode === 'key' ? `
                                    <div style="margin: 10px 0 0 40px; background: #f9f9f9; padding: 10px; border-left: 4px solid #000;">
                                        <span class="ans-label">CORRECT OPTION:</span> <strong>${q.details.correct_answer}</strong>
                                    </div>
                                ` : ''}

                                ${mode === 'solution' ? `
                                    <div style="margin: 10px 0 0 40px; background: #f0f7ff; padding: 20px; border-radius: 8px;">
                                        <span class="ans-label">SOLUTION:</span><br/>
                                        <div style="margin-top: 10px;">${q.details.solution?.en || 'Standard solution not available.'}</div>
                                    </div>
                                ` : ''}
                                ${idx < groupQs.length - 1 ? '<div style="text-align: center; font-weight: 900; margin: 15px 0; color: #888;">--- OR ---</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            `
        }).join('')}

        <div style="margin-top: 80px; text-align: center; font-weight: 950; border-top: 2px solid #000; padding-top: 20px; letter-spacing: 3px;">
            --- END OF EXAMINATION ---
        </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}
