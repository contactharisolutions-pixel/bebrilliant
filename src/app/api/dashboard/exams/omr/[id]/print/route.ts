import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifyTenantStaff()
    if (!session) return new NextResponse('Unauthorized', { status: 403 })

    const resolvedParams = await params
    const examId = resolvedParams.id
    const { data: exam } = await supabaseAdmin.from('omr_exams').select('*').eq('id', examId).single()
    if (!exam) return new NextResponse('Exam Not Found', { status: 404 })

    const numQuestions = exam.total_questions || 100
    const columns = 2 // 2 columns of questions
    const qPerCol = Math.ceil(numQuestions / columns)

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OMR Sheet - ${exam.title}</title>
        <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; margin: 0; background: #fff; color: #000; }
            .sheet { border: 4px solid #000; padding: 20px; position: relative; min-height: 1050px; }
            
            /* Alignment Markers */
            .marker { position: absolute; width: 40px; height: 40px; border: 10px solid #000; }
            .mtl { top: 0; left: 0; border-right: none; border-bottom: none; }
            .mtr { top: 0; right: 0; border-left: none; border-bottom: none; }
            .mbl { bottom: 0; left: 0; border-right: none; border-top: none; }
            .mbr { bottom: 0; right: 0; border-left: none; border-top: none; }

            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin: 40px 0 30px; }
            .exam-info { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
            .field { border: 1px solid #000; padding: 15px; font-weight: bold; background: #f9f9f9; }
            
            .roll-section { display: flex; gap: 10px; margin-bottom: 40px; border: 1px solid #000; padding: 20px; }
            .bubble-grid { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 40px; }
            .q-block { display: flex; flex-direction: column; gap: 12px; }
            
            .q-row { display: flex; align-items: center; gap: 12px; }
            .q-num { font-weight: bold; width: 30px; font-size: 14px; text-align: right; }
            .bubbles { display: flex; gap: 10px; }
            .bubble { width: 22px; height: 22px; border: 2px solid #000; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; fontSize: 10px; fontWeight: 900; }

            .footer { margin-top: 50px; border-top: 1px solid #000; padding-top: 20px; font-size: 12px; text-align: center; }
            
            @media print {
                @page { size: A4; margin: 0; }
                body { padding: 40px; }
            }
        </style>
    </head>
    <body onload="window.print()">
        <div class="sheet">
            <div class="marker mtl"></div>
            <div class="marker mtr"></div>
            <div class="marker mbl"></div>
            <div class="marker mbr"></div>

            <div class="header">
                <h1 style="margin: 0; text-transform: uppercase;">OMR RESPONSE SHEET</h1>
                <div style="margin-top: 10px; font-weight: bold;">(Fixed Format - AI-Ready)</div>
            </div>

            <div class="exam-info">
                <div class="field">EXAM: ${exam.title}</div>
                <div class="field">DATE: ________________</div>
            </div>

            <div class="roll-section">
                <div style="font-weight: 900; writing-mode: vertical-rl; text-orientation: mixed; border-right: 1px solid #000; padding-right: 10px;">ROLL NUMBER</div>
                ${[1, 2, 3, 4, 5, 6, 7, 8].map(() => `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="height: 30px; border: 1px solid #000; text-align: center; font-weight: 900;"></div>
                        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<div class="bubble">${n}</div>`).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="bubble-grid">
                ${[0, 1].map(colIdx => `
                    <div class="q-block">
                        ${Array.from({ length: qPerCol }).map((_, i) => {
                            const qNo = colIdx * qPerCol + i + 1;
                            if (qNo > numQuestions) return '';
                            return `
                                <div class="q-row">
                                    <div class="q-num">${String(qNo).padStart(3, '0')}</div>
                                    <div class="bubbles">
                                        <div class="bubble">A</div>
                                        <div class="bubble">B</div>
                                        <div class="bubble">C</div>
                                        <div class="bubble">D</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="footer">
                <strong>INSTRUCTIONS:</strong> Use black ball point pen only. Darken the bubble completely. Do not tick or cross.
            </div>
        </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}
