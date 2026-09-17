import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifyTenantStaff()
    if (!session) return new NextResponse('Unauthorized', { status: 403 })

    const resolvedParams = await params
    const examId = resolvedParams.id
    const mode = request.nextUrl.searchParams.get('mode') || 'paper' // paper, key, solution, booklet

    const examQuery = `
        SELECT 
            oe.*,
            t.name AS tenant_name,
            t.logo AS tenant_logo,
            t.settings AS tenant_settings,
            json_build_object('id', c.id, 'name', c.name) AS classes,
            json_build_object('id', s.id, 'name', s.name, 'code', s.code) AS subjects
        FROM public.offline_exams oe
        LEFT JOIN public.tenants t ON oe.tenant_id = t.id
        LEFT JOIN public.classes c ON oe.class_id = c.id
        LEFT JOIN public.subjects s ON oe.subject_id = s.id
        WHERE oe.id = $1
        LIMIT 1;
    `
    const { rows: examRows } = await query(examQuery, [examId])
    const exam = examRows[0]

    if (!exam) return new NextResponse('Exam Not Found', { status: 404 })

    const branding = exam.tenant_settings?.branding || {}
    const contact = exam.tenant_settings?.contact || {}
    const schoolName = branding.name || exam.tenant_name || 'BeBrilliant Academy of Excellence'
    const schoolLogo = branding.logo_url || exam.tenant_logo || ''
    const schoolTagline = branding.tagline || contact.address || 'Academic Center of Excellence'

    const questionsQuery = `
        SELECT 
            oeq.*,
            row_to_json(q.*) AS details
        FROM public.offline_exam_questions oeq
        JOIN public.questions q ON oeq.question_id = q.id
        WHERE oeq.exam_id = $1
        ORDER BY oeq.question_order ASC;
    `
    let { rows: questions } = await query(questionsQuery, [examId])

    // Fallback: If no mapped questions exist for this exam, pull general questions from repository
    if (!questions || questions.length === 0) {
        const fallbackQuery = `
            SELECT 
                gen_random_uuid() AS id,
                $1::uuid AS exam_id,
                q.id AS question_id,
                ROW_NUMBER() OVER () AS question_order,
                CASE WHEN ROW_NUMBER() OVER () <= 3 THEN 'Section A: Objective Concepts' ELSE 'Section B: Analytical & Descriptive' END AS section,
                false AS is_optional,
                COALESCE(q.marks, 4) AS marks,
                row_to_json(q.*) AS details
            FROM public.questions q
            WHERE q.tenant_id = $2
            LIMIT 8;
        `
        const { rows: fallbackQs } = await query(fallbackQuery, [examId, exam.tenant_id])
        questions = fallbackQs || []
    }

    const sections: Record<string, any[]> = {}
    questions.forEach((q: any) => {
        const sec = q.section || 'Section A: General Academic Assessment'
        if (!sections[sec]) sections[sec] = []
        sections[sec].push(q)
    })

    const titleSuffix = mode === 'key' ? '— Answer Key Master' : mode === 'solution' ? '— Detailed Solution Guide' : '— Question Paper Booklet'

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${schoolName} - ${exam.title} ${titleSuffix}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;600;700;800&display=swap');
            
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', 'Noto Sans Gujarati', sans-serif;
                margin: 0;
                padding: 40px;
                color: #0F172A;
                line-height: 1.6;
                background: #fff;
                font-size: 14px;
            }

            .sheet-container {
                max-width: 900px;
                margin: 0 auto;
                border: 2px solid #0F172A;
                padding: 30px;
                position: relative;
                background: #fff;
            }

            /* INSTITUTION HEADER */
            .header {
                text-align: center;
                border-bottom: 3px double #0F172A;
                padding-bottom: 20px;
                margin-bottom: 25px;
            }
            .school-logo {
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 3px;
                color: #004B93;
                text-transform: uppercase;
                margin-bottom: 6px;
            }
            .school-name {
                font-size: 24px;
                font-weight: 900;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: #0F172A;
            }
            .exam-title {
                font-size: 17px;
                font-weight: 800;
                margin-top: 8px;
                color: #1E293B;
            }

            /* METADATA BAR */
            .meta-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                padding: 10px 14px;
                background: #F8FAFC;
                border: 1px solid #CBD5E1;
                font-size: 12px;
                font-weight: 700;
            }

            /* CANDIDATE INFO BOX */
            .candidate-box {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 15px;
                margin: 20px 0 25px;
                font-size: 12px;
                font-weight: 700;
            }
            .info-field {
                border: 1px solid #94A3B8;
                padding: 10px 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .info-line {
                flex: 1;
                border-bottom: 1px dotted #64748B;
                height: 14px;
            }

            /* GENERAL INSTRUCTIONS */
            .instructions {
                background: #F8FAFC;
                border-left: 4px solid #004B93;
                padding: 12px 18px;
                font-size: 12px;
                margin-bottom: 30px;
            }
            .instructions strong {
                color: #004B93;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 1px;
            }
            .instructions ul {
                margin: 6px 0 0 16px;
                padding: 0;
            }

            /* SECTION HEADINGS */
            .section-banner {
                background: #0F172A;
                color: #FFFFFF;
                padding: 6px 16px;
                font-weight: 900;
                font-size: 13px;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin: 30px 0 20px;
                display: inline-block;
                border-radius: 4px;
            }

            /* QUESTION BLOCK */
            .question-item {
                margin-bottom: 24px;
                padding-bottom: 18px;
                border-bottom: 1px solid #E2E8F0;
                page-break-inside: avoid;
            }
            .q-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }
            .q-num {
                font-weight: 900;
                font-size: 14px;
                min-width: 28px;
                color: #0F172A;
            }
            .q-text {
                flex: 1;
                font-weight: 600;
                color: #1E293B;
                font-size: 14px;
            }
            .q-gujarati {
                font-size: 13px;
                font-weight: 500;
                color: #475569;
                margin-top: 4px;
            }
            .marks-badge {
                font-weight: 900;
                border: 1px solid #0F172A;
                padding: 2px 8px;
                font-size: 12px;
                background: #F1F5F9;
                white-space: nowrap;
            }

            /* MULTIPLE CHOICE OPTIONS */
            .options-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px 20px;
                margin: 12px 0 0 35px;
                font-size: 13px;
            }
            .opt-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }
            .opt-letter {
                font-weight: 800;
                color: #004B93;
            }

            /* ANSWER KEY / SOLUTION BLOCKS */
            .key-card {
                margin: 10px 0 0 35px;
                padding: 10px 14px;
                background: #FEF3C7;
                border-left: 4px solid #D97706;
                font-size: 12px;
                color: #78350F;
            }
            .sol-card {
                margin: 12px 0 0 35px;
                padding: 14px 18px;
                background: #EFF6FF;
                border-left: 4px solid #0284C7;
                border-radius: 4px;
                font-size: 13px;
                color: #0C4A6E;
            }

            /* FOOTER */
            .footer-terminal {
                margin-top: 50px;
                text-align: center;
                border-top: 2px solid #0F172A;
                padding-top: 15px;
                font-weight: 900;
                letter-spacing: 2px;
                font-size: 12px;
                text-transform: uppercase;
            }

            @media print {
                body { padding: 0; }
                .sheet-container { border: none; padding: 0; max-width: 100%; }
                @page { size: A4; margin: 15mm; }
            }
        </style>
    </head>
    <body onload="window.print()">
        <div class="sheet-container">
            <!-- INSTITUTION LETTERHEAD -->
            <div class="header">
                ${schoolLogo ? `<div style="margin-bottom: 10px;"><img src="${schoolLogo}" alt="${schoolName}" style="max-height: 60px; max-width: 140px; object-fit: contain;" /></div>` : ''}
                <div class="school-logo">${schoolTagline}</div>
                <div class="school-name">${schoolName}</div>
                <div style="font-size: 13px; font-weight: 700; color: #475569; margin-top: 2px;">${exam.classes?.name || 'Class Grade'} — Academic Assessment</div>
                <div class="exam-title">${exam.title} ${mode !== 'paper' ? '(' + mode.toUpperCase() + ')' : ''}</div>
                
                <div class="meta-bar">
                    <span>SUBJECT: <strong>${exam.subjects?.name || 'Mathematics'} ${exam.subjects?.code ? '(' + exam.subjects.code + ')' : ''}</strong></span>
                    <span>MAX MARKS: <strong>${exam.total_questions ? exam.total_questions * 2 : 100} MARKS</strong></span>
                    <span>DURATION: <strong>${exam.duration || 90} MINUTES</strong></span>
                    <span>SERIES: <strong>SET-A</strong></span>
                </div>
            </div>

            <!-- CANDIDATE IDENTIFICATION -->
            <div class="candidate-box">
                <div class="info-field">
                    <span>CANDIDATE NAME:</span>
                    <div class="info-line"></div>
                </div>
                <div class="info-field">
                    <span>SEAT / ROLL NO:</span>
                    <div class="info-line"></div>
                </div>
            </div>

            <!-- GENERAL INSTRUCTIONS -->
            <div class="instructions">
                <strong>GENERAL INSTRUCTIONS:</strong>
                <ul>
                    <li>Read each question carefully before beginning your calculations or answers.</li>
                    <li>For objective items, select the single most appropriate answer option.</li>
                    <li>Write all answers clearly in the designated response booklet. Numerical answers must include units.</li>
                    <li>Calculator or smart wearable usage is strictly prohibited unless explicitly authorized.</li>
                </ul>
            </div>

            <!-- SECTIONAL QUESTIONS -->
            ${Object.entries(sections).map(([sectionTitle, qs]) => `
                <div class="section-banner">${sectionTitle}</div>
                
                ${qs.map(q => {
                    const d = q.details || {}
                    const qText = typeof d.question_text === 'object' ? d.question_text : { en: d.question_text || '' }
                    const qMarks = q.marks || d.marks || 2

                    return `
                        <div class="question-item">
                            <div class="q-header">
                                <span class="q-num">${q.question_order}.</span>
                                <div class="q-text">
                                    ${qText.en || 'Question text not available.'}
                                    ${qText.gu ? `<div class="q-gujarati">${qText.gu}</div>` : ''}
                                </div>
                                <span class="marks-badge">[${qMarks} Marks]</span>
                            </div>

                            ${mode === 'paper' && d.type === 'objective' && d.options ? `
                                <div class="options-grid">
                                    ${Object.entries(d.options).map(([optKey, optVal]) => `
                                        <div class="opt-item">
                                            <span class="opt-letter">(${optKey})</span>
                                            <span>${optVal}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            ${mode === 'key' ? `
                                <div class="key-card">
                                    <strong>CORRECT ANSWER:</strong> ${typeof d.correct_answer === 'object' ? JSON.stringify(d.correct_answer) : d.correct_answer || 'Key Pending'}
                                </div>
                            ` : ''}

                            ${mode === 'solution' ? `
                                <div class="sol-card">
                                    <strong>STEP-BY-STEP SOLUTION & MARKING SCHEME:</strong>
                                    <div style="margin-top: 6px; white-space: pre-line;">${d.explanation?.en || d.explanation || 'Standard analytical method applies.'}</div>
                                </div>
                            ` : ''}
                        </div>
                    `
                }).join('')}
            `).join('')}

            <!-- FOOTER -->
            <div class="footer-terminal">
                --- END OF EXAMINATION BOOKLET • VERIFIED BY BEBRILLIANT ACADEMIC ENGINE ---
            </div>
        </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
}
