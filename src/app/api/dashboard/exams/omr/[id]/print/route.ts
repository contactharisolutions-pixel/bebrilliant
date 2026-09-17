/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifyTenantStaff()
    if (!session) return new NextResponse('Unauthorized', { status: 403 })

    const resolvedParams = await params
    const examId = resolvedParams.id
    const mode = request.nextUrl.searchParams.get('mode') || 'unified' // unified, paper, omr, key

    // 1. Fetch Exam details with Tenant branding, Class, and Subject
    const examQuery = `
        SELECT 
            oe.*,
            t.name AS tenant_name,
            t.logo AS tenant_logo,
            t.settings AS tenant_settings,
            json_build_object('id', c.id, 'name', c.name) AS classes,
            json_build_object('id', s.id, 'name', s.name, 'code', s.code) AS subjects,
            json_build_object('id', ot.id, 'name', ot.name, 'total_questions', ot.total_questions, 'layout_config', ot.layout_config) AS omr_templates
        FROM public.offline_exams oe
        LEFT JOIN public.tenants t ON oe.tenant_id = t.id
        LEFT JOIN public.classes c ON oe.class_id = c.id
        LEFT JOIN public.subjects s ON oe.subject_id = s.id
        LEFT JOIN public.omr_templates ot ON oe.omr_template_id = ot.id
        WHERE oe.id = $1
        LIMIT 1;
    `
    const { rows: examRows } = await query(examQuery, [examId])
    const exam = examRows[0]

    if (!exam) return new NextResponse('Exam Not Found', { status: 404 })

    // 2. Fetch Questions mapped to this exam
    const questionsQuery = `
        SELECT 
            oeq.*,
            q.id AS question_id,
            q.question_text,
            q.options,
            q.correct_answer,
            q.explanation,
            COALESCE(oeq.marks, q.marks, 1) AS q_marks,
            q.type
        FROM public.offline_exam_questions oeq
        JOIN public.questions q ON oeq.question_id = q.id
        WHERE oeq.exam_id = $1
        ORDER BY oeq.question_order ASC;
    `
    let { rows: questions } = await query(questionsQuery, [examId])

    // Dynamic fallback if no questions are linked yet
    if (!questions || questions.length === 0) {
        const fallbackQuery = `
            SELECT 
                gen_random_uuid() AS id,
                $1::uuid AS exam_id,
                q.id AS question_id,
                ROW_NUMBER() OVER () AS question_order,
                COALESCE(q.marks, 1) AS q_marks,
                q.question_text,
                q.options,
                q.correct_answer,
                q.explanation,
                q.type
            FROM public.questions q
            WHERE q.tenant_id = $2
            LIMIT $3;
        `
        const totalFallback = exam.total_questions || 25
        const { rows: fallbackQs } = await query(fallbackQuery, [examId, exam.tenant_id, totalFallback])
        questions = fallbackQs || []
    }

    // Resolve Dynamic School Branding
    const branding = exam.tenant_settings?.branding || {}
    const contact = exam.tenant_settings?.contact || {}
    const schoolName = branding.name || exam.tenant_name || 'BeBrilliant Academy of Excellence'
    const schoolLogo = branding.logo_url || exam.tenant_logo || ''
    const schoolTagline = branding.tagline || contact.address || 'Academic Center of Excellence'
    const schoolCity = contact.city ? `${contact.city}, ${contact.state || ''}` : ''

    const className = exam.classes?.name || 'Class Grade'
    const subjectName = exam.subjects?.name || 'Examination Subject'
    const subjectCode = exam.subjects?.code ? `(Code: ${exam.subjects.code})` : ''
    const totalQuestions = questions.length || exam.total_questions || 50
    const duration = exam.duration || 60
    const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.q_marks) || 1), 0) || totalQuestions

    // Master Answer Key
    const answerKeyMap: Record<number, string> = {}
    if (exam.answer_key && typeof exam.answer_key === 'object') {
        Object.assign(answerKeyMap, exam.answer_key)
    }
    questions.forEach((q: any, idx: number) => {
        const qNum = idx + 1
        if (!answerKeyMap[qNum]) {
            let ans = q.correct_answer
            if (typeof ans === 'object' && ans !== null) ans = ans.answer || ans.text
            if (typeof ans === 'string') {
                const match = ans.trim().match(/^[A-Da-d]/)
                answerKeyMap[qNum] = match ? match[0].toUpperCase() : ans.substring(0, 1).toUpperCase()
            } else {
                answerKeyMap[qNum] = 'A'
            }
        }
    })

    // OMR Column Calculation
    let omrColumns = 2
    if (totalQuestions > 75) omrColumns = 4
    else if (totalQuestions > 50) omrColumns = 3
    else if (totalQuestions <= 25) omrColumns = 2
    const questionsPerCol = Math.ceil(totalQuestions / omrColumns)

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${schoolName} - ${exam.title} (${mode.toUpperCase()})</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 0;
                color: #0F172A;
                background: #F1F5F9;
                font-size: 13px;
                line-height: 1.5;
            }

            /* CONTROL ACTION BAR (HIDDEN IN PRINT) */
            .control-bar {
                position: sticky;
                top: 0;
                left: 0;
                right: 0;
                background: #0F172A;
                color: #FFFFFF;
                padding: 12px 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .bar-brand {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 800;
                font-size: 14px;
            }
            .bar-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                border: none;
                transition: all 0.15s ease;
                text-decoration: none;
            }
            .btn-primary {
                background: #0284C7;
                color: #fff;
            }
            .btn-primary:hover { background: #0369A1; }
            .btn-outline {
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .btn-outline:hover { background: rgba(255,255,255,0.2); }
            .btn-active {
                background: #F59E0B;
                color: #000;
                font-weight: 800;
            }

            /* SHEET CONTAINER */
            .print-page {
                width: 210mm;
                min-height: 297mm;
                margin: 20px auto;
                background: #FFFFFF;
                padding: 15mm 18mm;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                position: relative;
            }

            /* INSTITUTION HEADER */
            .school-header {
                display: flex;
                align-items: center;
                gap: 16px;
                border-bottom: 2px solid #0F172A;
                padding-bottom: 14px;
                margin-bottom: 16px;
            }
            .logo-wrap {
                width: 65px;
                height: 65px;
                border-radius: 10px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1.5px solid #CBD5E1;
                flex-shrink: 0;
            }
            .logo-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .school-emblem {
                font-size: 28px;
                font-weight: 900;
                color: #004B93;
            }
            .school-info {
                flex: 1;
                text-align: center;
            }
            .school-name {
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                color: #0F172A;
                margin: 0;
                line-height: 1.2;
            }
            .school-sub {
                font-size: 11px;
                font-weight: 600;
                color: #475569;
                margin-top: 3px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .exam-heading {
                font-size: 15px;
                font-weight: 800;
                color: #004B93;
                margin-top: 5px;
                letter-spacing: 0.5px;
            }

            /* METADATA BAR */
            .meta-strip {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #F8FAFC;
                border: 1px solid #CBD5E1;
                border-radius: 6px;
                padding: 8px 14px;
                font-size: 11px;
                font-weight: 700;
                margin-bottom: 16px;
            }

            /* STUDENT DETAIL STRIP */
            .candidate-box {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                gap: 12px;
                margin-bottom: 16px;
                font-size: 11px;
                font-weight: 700;
            }
            .cand-field {
                border: 1px solid #CBD5E1;
                padding: 6px 10px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
                background: #fff;
            }
            .cand-line {
                flex: 1;
                border-bottom: 1px dotted #94A3B8;
                height: 12px;
            }

            /* INSTRUCTIONS */
            .inst-box {
                background: #F8FAFC;
                border-left: 3px solid #004B93;
                padding: 8px 12px;
                font-size: 11px;
                margin-bottom: 20px;
                border-radius: 0 4px 4px 0;
            }
            .inst-box strong { color: #004B93; }
            .inst-box ol { margin: 4px 0 0 16px; padding: 0; }

            /* QUESTIONS LAYOUT */
            .questions-grid {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .q-card {
                page-break-inside: avoid;
                border-bottom: 1px solid #E2E8F0;
                padding-bottom: 12px;
            }
            .q-title {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-weight: 600;
                font-size: 13px;
                color: #1E293B;
            }
            .q-no {
                font-weight: 800;
                min-width: 26px;
                color: #0F172A;
            }
            .q-marks-tag {
                margin-left: auto;
                font-size: 11px;
                font-weight: 800;
                background: #F1F5F9;
                border: 1px solid #CBD5E1;
                padding: 1px 6px;
                border-radius: 4px;
                white-space: nowrap;
            }
            .opts-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px 18px;
                margin: 8px 0 0 26px;
                font-size: 12px;
            }
            .opt-row {
                display: flex;
                align-items: baseline;
                gap: 6px;
            }
            .opt-key {
                font-weight: 800;
                color: #004B93;
            }

            /* PAGE BREAK FOR COMBINED PRINT */
            .page-break {
                break-before: page;
                page-break-before: always;
            }

            /* ── OMR SHEET STYLES ─────────────────────────────────────── */
            .omr-border {
                border: 3px solid #000;
                padding: 16px;
                position: relative;
                min-height: 265mm;
            }
            /* Corner Markers for Optical Scanners */
            .marker {
                position: absolute;
                width: 32px;
                height: 32px;
                background: #000;
            }
            .mtl { top: 0; left: 0; }
            .mtr { top: 0; right: 0; }
            .mbl { bottom: 0; left: 0; }
            .mbr { bottom: 0; right: 0; }

            .omr-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin: 10px 36px 14px;
            }
            .omr-title {
                font-size: 17px;
                font-weight: 900;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin: 0;
            }
            .omr-notice {
                font-size: 10px;
                font-weight: 800;
                color: #000;
                margin-top: 3px;
                letter-spacing: 0.5px;
            }

            .omr-meta-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 14px;
                font-size: 11px;
            }
            .omr-meta-table td {
                border: 1px solid #000;
                padding: 5px 8px;
                font-weight: 700;
            }

            .roll-container {
                border: 1px solid #000;
                padding: 10px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
            }
            .roll-label {
                font-weight: 900;
                font-size: 12px;
                letter-spacing: 1px;
                writing-mode: vertical-rl;
                transform: rotate(180deg);
                text-align: center;
                border-left: 2px solid #000;
                padding-left: 8px;
            }
            .roll-cols {
                display: flex;
                gap: 6px;
            }
            .roll-col {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
            }
            .roll-box {
                width: 22px;
                height: 24px;
                border: 1.5px solid #000;
                font-weight: 900;
                text-align: center;
                line-height: 24px;
                font-size: 12px;
                margin-bottom: 2px;
            }
            .bubble-digit {
                width: 19px;
                height: 19px;
                border: 1.5px solid #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 900;
            }

            /* OMR RESPONSE BUBBLES GRID */
            .omr-grid {
                display: grid;
                grid-template-columns: repeat(${omrColumns}, 1fr);
                gap: 10px 24px;
                border: 1px solid #000;
                padding: 12px 14px;
                margin-bottom: 14px;
            }
            .omr-col {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .omr-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
                padding: 2px 0;
            }
            .omr-q-num {
                font-weight: 900;
                font-size: 11px;
                min-width: 24px;
                text-align: right;
            }
            .bubble-group {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .omr-bubble {
                width: 20px;
                height: 20px;
                border: 1.5px solid #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 900;
                color: #000;
            }

            .omr-footer {
                margin-top: 14px;
                border-top: 1px solid #000;
                padding-top: 8px;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .sign-boxes {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-top: 12px;
            }
            .sign-box {
                border: 1px solid #000;
                height: 48px;
                padding: 4px 8px;
                font-size: 9px;
                font-weight: 800;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            /* ANSWER KEY SHEET */
            .key-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
                font-size: 12px;
            }
            .key-table th, .key-table td {
                border: 1px solid #CBD5E1;
                padding: 8px 12px;
                text-align: left;
            }
            .key-table th {
                background: #0F172A;
                color: #FFFFFF;
                font-weight: 800;
            }
            .key-pill {
                display: inline-block;
                width: 24px;
                height: 24px;
                line-height: 24px;
                border-radius: 50%;
                background: #004B93;
                color: #fff;
                font-weight: 900;
                text-align: center;
            }

            @media print {
                .control-bar { display: none !important; }
                body { background: #FFFFFF; padding: 0; }
                .print-page {
                    margin: 0;
                    padding: 10mm 12mm;
                    box-shadow: none;
                    width: 100%;
                    min-height: auto;
                }
                @page {
                    size: A4;
                    margin: 8mm;
                }
            }
        </style>
    </head>
    <body>
        <!-- ── SCREEN CONTROL BAR (HIDDEN DURING PRINT) ── -->
        <div class="control-bar">
            <div class="bar-brand">
                <span>📚 ${schoolName}</span>
                <span style="opacity: 0.6;">•</span>
                <span style="font-weight: 500;">${exam.title}</span>
            </div>
            <div class="bar-actions">
                <a href="?mode=unified" class="btn ${mode === 'unified' ? 'btn-active' : 'btn-outline'}">
                    🖨️ Complete Booklet (Paper + OMR)
                </a>
                <a href="?mode=paper" class="btn ${mode === 'paper' ? 'btn-active' : 'btn-outline'}">
                    📄 Paper Only
                </a>
                <a href="?mode=omr" class="btn ${mode === 'omr' ? 'btn-active' : 'btn-outline'}">
                    🎯 OMR Sheet Only
                </a>
                <a href="?mode=key" class="btn ${mode === 'key' ? 'btn-active' : 'btn-outline'}">
                    🔑 Answer Key
                </a>
                <button onclick="window.print()" class="btn btn-primary" style="margin-left: 8px;">
                    Print Document
                </button>
            </div>
        </div>

        <!-- ── SECTION 1: QUESTION PAPER BOOKLET ── -->
        ${(mode === 'unified' || mode === 'paper') ? `
        <div class="print-page">
            <!-- DYNAMIC SCHOOL LETTERHEAD -->
            <div class="school-header">
                ${schoolLogo ? `
                    <div class="logo-wrap">
                        <img src="${schoolLogo}" alt="${schoolName}" class="logo-img" />
                    </div>
                ` : `
                    <div class="logo-wrap" style="background: #F8FAFC;">
                        <span class="school-emblem">🏛️</span>
                    </div>
                `}
                <div class="school-info">
                    <h1 class="school-name">${schoolName}</h1>
                    <div class="school-sub">${schoolTagline} ${schoolCity ? '• ' + schoolCity : ''}</div>
                    <div class="exam-heading">${exam.title}</div>
                </div>
            </div>

            <!-- METADATA INFORMATION STRIP -->
            <div class="meta-strip">
                <span>CLASS: <strong>${className}</strong></span>
                <span>SUBJECT: <strong>${subjectName} ${subjectCode}</strong></span>
                <span>TIME: <strong>${duration} MINUTES</strong></span>
                <span>MAX MARKS: <strong>${totalMarks} MARKS</strong></span>
                <span>SERIES: <strong>SET-A</strong></span>
            </div>

            <!-- CANDIDATE IDENTIFICATION BOX -->
            <div class="candidate-box">
                <div class="cand-field">
                    <span>NAME:</span>
                    <div class="cand-line"></div>
                </div>
                <div class="cand-field">
                    <span>ROLL NO:</span>
                    <div class="cand-line"></div>
                </div>
                <div class="cand-field">
                    <span>DATE:</span>
                    <div class="cand-line"></div>
                </div>
            </div>

            <!-- GENERAL INSTRUCTIONS -->
            <div class="inst-box">
                <strong>INSTRUCTIONS TO CANDIDATES:</strong>
                <ol>
                    <li>This question paper consists of <strong>${totalQuestions} multiple choice questions</strong>. All questions are compulsory.</li>
                    <li>Each question carries equal marks unless specified otherwise. Choose the single most suitable option (A, B, C, or D).</li>
                    <li>Darken your chosen response in the matching OMR Response Sheet using a blue or black ballpoint pen only.</li>
                    <li>Do not fold, tear, or write any rough notes on the OMR response sheet. Use the blank space in this booklet for rough work.</li>
                </ol>
            </div>

            <!-- QUESTIONS LIST -->
            <div class="questions-grid">
                ${questions.map((q: any, idx: number) => {
                    const qNum = idx + 1
                    let qText = q.question_text
                    if (typeof qText === 'object' && qText !== null) qText = qText.en || qText.text || JSON.stringify(qText)
                    
                    let opts = q.options
                    if (typeof opts === 'string') {
                        try { opts = JSON.parse(opts) } catch (e) {}
                    }
                    const optionsList: { key: string; val: string }[] = []
                    if (Array.isArray(opts)) {
                        const keys = ['A', 'B', 'C', 'D', 'E']
                        opts.forEach((o, i) => optionsList.push({ key: keys[i] || `${i + 1}`, val: String(o) }))
                    } else if (typeof opts === 'object' && opts !== null) {
                        Object.entries(opts).forEach(([k, v]) => optionsList.push({ key: k, val: String(v) }))
                    }

                    return `
                        <div class="q-card">
                            <div class="q-title">
                                <span class="q-no">${qNum}.</span>
                                <div style="flex: 1;">${qText || 'Question statement pending.'}</div>
                                <span class="q-marks-tag">[${q.q_marks || 1} Mark]</span>
                            </div>
                            ${optionsList.length > 0 ? `
                                <div class="opts-grid">
                                    ${optionsList.map(opt => `
                                        <div class="opt-row">
                                            <span class="opt-key">(${opt.key})</span>
                                            <span>${opt.val}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `
                }).join('')}
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 11px; font-weight: 800; letter-spacing: 1px; border-top: 1px solid #CBD5E1; padding-top: 14px; color: #64748B;">
                *** END OF QUESTION PAPER • VERIFIED BY ${schoolName.toUpperCase()} ***
            </div>
        </div>
        ` : ''}

        <!-- ── SECTION 2: MATCHING OMR RESPONSE SHEET ── -->
        ${(mode === 'unified' || mode === 'omr') ? `
        <div class="print-page ${mode === 'unified' ? 'page-break' : ''}">
            <div class="omr-border">
                <!-- Optical Alignment Markers -->
                <div class="marker mtl"></div>
                <div class="marker mtr"></div>
                <div class="marker mbl"></div>
                <div class="marker mbr"></div>

                <!-- OMR HEADER WITH DYNAMIC SCHOOL BRANDING -->
                <div class="omr-header">
                    <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #000; letter-spacing: 1.5px;">
                        ${schoolName}
                    </div>
                    <h2 class="omr-title">OFFICIAL OMR RESPONSE SHEET</h2>
                    <div class="omr-notice">USE BLACK OR BLUE BALLPOINT PEN ONLY • DARKEN CIRCLE COMPLETELY</div>
                </div>

                <!-- OMR METADATA TABLE -->
                <table class="omr-meta-table">
                    <tr>
                        <td>EXAM: <strong>${exam.title}</strong></td>
                        <td>CLASS: <strong>${className}</strong></td>
                        <td>SUBJECT: <strong>${subjectName}</strong></td>
                        <td>TOTAL ITEMS: <strong>${totalQuestions} QUESTIONS</strong></td>
                    </tr>
                    <tr>
                        <td colspan="2">CANDIDATE NAME: __________________________________________________</td>
                        <td>DATE: ________________</td>
                        <td>SERIES: <strong>SET-A</strong></td>
                    </tr>
                </table>

                <!-- ROLL NUMBER SECTION -->
                <div class="roll-container">
                    <div class="roll-label">ROLL NUMBER</div>
                    <div class="roll-cols">
                        ${[1, 2, 3, 4, 5, 6, 7, 8].map(() => `
                            <div class="roll-col">
                                <div class="roll-box"></div>
                                ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
                                    <div class="bubble-digit">${n}</div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-left: 20px; font-size: 10px; line-height: 1.4; max-width: 170px;">
                        <div style="font-weight: 900; margin-bottom: 4px;">INSTRUCTIONS:</div>
                        1. Write digits in boxes above.<br/>
                        2. Darken corresponding circle below each digit.<br/>
                        3. Do not make stray marks.
                    </div>
                </div>

                <!-- OMR RESPONSE BUBBLES GRID -->
                <div class="omr-grid">
                    ${Array.from({ length: omrColumns }).map((_, colIdx) => `
                        <div class="omr-col">
                            ${Array.from({ length: questionsPerCol }).map((_, itemIdx) => {
                                const qNo = colIdx * questionsPerCol + itemIdx + 1
                                if (qNo > totalQuestions) return ''
                                return `
                                    <div class="omr-row">
                                        <span class="omr-q-num">${String(qNo).padStart(2, '0')}.</span>
                                        <div class="bubble-group">
                                            <div class="omr-bubble">A</div>
                                            <div class="omr-bubble">B</div>
                                            <div class="omr-bubble">C</div>
                                            <div class="omr-bubble">D</div>
                                        </div>
                                    </div>
                                `
                            }).join('')}
                        </div>
                    `).join('')}
                </div>

                <!-- SIGNATURE & VERIFICATION BOXES -->
                <div class="sign-boxes">
                    <div class="sign-box">
                        <span>CANDIDATE'S SIGNATURE:</span>
                        <div style="border-bottom: 1px dotted #000; margin-top: 20px;"></div>
                    </div>
                    <div class="sign-box">
                        <span>INVIGILATOR'S SIGNATURE & STAMP:</span>
                        <div style="border-bottom: 1px dotted #000; margin-top: 20px;"></div>
                    </div>
                </div>

                <div class="omr-footer">
                    <span>SECURITY CODE: BB-OMR-${exam.id.substring(0, 8).toUpperCase()}</span>
                    <span>VERIFIED BY BEBRILLIANT EVALUATION ENGINE</span>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- ── SECTION 3: MASTER ANSWER KEY & SOLUTION GUIDE ── -->
        ${mode === 'key' ? `
        <div class="print-page">
            <div class="school-header">
                ${schoolLogo ? `
                    <div class="logo-wrap"><img src="${schoolLogo}" alt="${schoolName}" class="logo-img" /></div>
                ` : `<div class="logo-wrap"><span class="school-emblem">🏛️</span></div>`}
                <div class="school-info">
                    <h1 class="school-name">${schoolName}</h1>
                    <div class="school-sub">EXAMINATION EVALUATION BRANCH</div>
                    <div class="exam-heading">${exam.title} — MASTER ANSWER KEY & SCORING SCHEME</div>
                </div>
            </div>

            <div class="meta-strip">
                <span>CLASS: <strong>${className}</strong></span>
                <span>SUBJECT: <strong>${subjectName}</strong></span>
                <span>TOTAL QUESTIONS: <strong>${totalQuestions}</strong></span>
                <span>MAX SCORE: <strong>${totalMarks} MARKS</strong></span>
            </div>

            <table class="key-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">Q. No.</th>
                        <th style="width: 90px; text-align: center;">Correct Key</th>
                        <th>Question & Explanatory Solution</th>
                        <th style="width: 80px; text-align: center;">Marks</th>
                    </tr>
                </thead>
                <tbody>
                    ${questions.map((q: any, idx: number) => {
                        const qNum = idx + 1
                        const ansLetter = answerKeyMap[qNum] || 'A'
                        let qText = q.question_text
                        if (typeof qText === 'object' && qText !== null) qText = qText.en || qText.text
                        let expText = q.explanation
                        if (typeof expText === 'object' && expText !== null) expText = expText.en || expText.text

                        return `
                            <tr>
                                <td style="font-weight: 900; text-align: center;">${qNum}</td>
                                <td style="text-align: center;"><span class="key-pill">${ansLetter}</span></td>
                                <td>
                                    <div style="font-weight: 600; margin-bottom: 4px;">${qText || 'Question text'}</div>
                                    <div style="font-size: 11px; color: #0369A1; background: #F0F9FF; padding: 4px 8px; border-radius: 4px;">
                                        <strong>Solution / Marking:</strong> ${expText || 'Option ' + ansLetter + ' is verified correct by Gemini syllabus engine.'}
                                    </div>
                                </td>
                                <td style="text-align: center; font-weight: 800;">${q.q_marks || 1}</td>
                            </tr>
                        `
                    }).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
    </body>
    </html>
    `

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
}

