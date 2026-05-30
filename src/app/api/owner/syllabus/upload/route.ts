import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return p?.role === 'owner' ? user : null
}

type RowData = {
    board?: string; class?: string | number; subject?: string; chapter?: string; topic?: string;
    Board?: string; Class?: string | number; Subject?: string; Chapter?: string; Topic?: string;
}

// Insert or find a node — returns the UUID
async function upsertNode(
    name: string,
    type: string,
    parentId: string | null,
    orderMap: Map<string, number>
): Promise<string> {
    const key = `${type}::${parentId ?? 'root'}::${name}`

    // Check if already exists
    let query = supabaseAdmin.from('syllabus_nodes').select('id').eq('name', name).eq('type', type)
    if (parentId) query = query.eq('parent_id', parentId)
    else query = query.is('parent_id', null)

    const { data: existing } = await query.single()
    if (existing) return existing.id

    const orderIndex = (orderMap.get(key) ?? 0)
    orderMap.set(key, orderIndex + 1)

    const { data, error } = await supabaseAdmin
        .from('syllabus_nodes')
        .insert([{ name: name.trim(), type, parent_id: parentId, order_index: orderIndex, is_active: true }])
        .select('id')
        .single()

    if (error) throw new Error(`Failed to insert ${type} "${name}": ${error.message}`)
    return data.id
}

// ── POST /api/owner/syllabus/upload ───────────────────────────────────────────
export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
            return NextResponse.json({ error: 'Only CSV, XLSX, and XLS files are accepted' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Parse workbook
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows: RowData[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (rawRows.length === 0) {
            return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 })
        }

        // Normalise headers (case-insensitive)
        const rows = rawRows.map(r => ({
            board: String(r.board || r.Board || '').trim(),
            class: String(r.class || r.Class || '').trim(),
            subject: String(r.subject || r.Subject || '').trim(),
            chapter: String(r.chapter || r.Chapter || '').trim(),
            topic: String(r.topic || r.Topic || '').trim(),
        }))

        // Validate: must have at least board column
        if (!rows[0].board) {
            return NextResponse.json({
                error: 'First column must be "Board". Check the sample file for correct format.',
                expectedColumns: ['Board', 'Class', 'Subject', 'Chapter', 'Topic']
            }, { status: 422 })
        }

        // Initialize cache maps
        const boardIds = new Map<string, string>()
        const classIds = new Map<string, string>()
        const subjectIds = new Map<string, string>()
        const chapterIds = new Map<string, string>()
        const orderMap = new Map<string, number>()

        const stats = { boards: 0, classes: 0, subjects: 0, chapters: 0, topics: 0, skipped: 0, errors: [] as string[] }
        let rowNum = 1

        for (const row of rows) {
            rowNum++
            if (!row.board) { stats.skipped++; continue }

            try {
                // Board
                if (!boardIds.has(row.board)) {
                    const id = await upsertNode(row.board, 'board', null, orderMap)
                    boardIds.set(row.board, id)
                    stats.boards++
                }
                const boardId = boardIds.get(row.board)!

                if (!row.class) continue

                // Class
                const classKey = `${row.board}::${row.class}`
                if (!classIds.has(classKey)) {
                    const id = await upsertNode(row.class, 'class', boardId, orderMap)
                    classIds.set(classKey, id)
                    stats.classes++
                }
                const classId = classIds.get(classKey)!

                if (!row.subject) continue

                // Subject
                const subjectKey = `${classKey}::${row.subject}`
                if (!subjectIds.has(subjectKey)) {
                    const id = await upsertNode(row.subject, 'subject', classId, orderMap)
                    subjectIds.set(subjectKey, id)
                    stats.subjects++
                }
                const subjectId = subjectIds.get(subjectKey)!

                if (!row.chapter) continue

                // Chapter
                const chapterKey = `${subjectKey}::${row.chapter}`
                if (!chapterIds.has(chapterKey)) {
                    const id = await upsertNode(row.chapter, 'chapter', subjectId, orderMap)
                    chapterIds.set(chapterKey, id)
                    stats.chapters++
                }
                const chapterId = chapterIds.get(chapterKey)!

                if (!row.topic) continue

                // Topic
                await upsertNode(row.topic, 'topic', chapterId, orderMap)
                stats.topics++

            } catch (e: any) {
                stats.errors.push(`Row ${rowNum}: ${e.message}`)
                if (stats.errors.length >= 10) break // stop after 10 errors
            }
        }

        const total = stats.boards + stats.classes + stats.subjects + stats.chapters + stats.topics

        return NextResponse.json({
            success: true,
            rowsProcessed: rows.length,
            totalNodesCreated: total,
            stats,
            warnings: stats.errors.length > 0 ? stats.errors : undefined,
        })

    } catch (e: any) {
        console.error('[CSV Upload Error]', e.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ── GET: Download sample CSV ──────────────────────────────────────────────────
export async function GET() {
    const sampleData = [
        ['Board', 'Class', 'Subject', 'Chapter', 'Topic'],
        ['CBSE', 'Class 9', 'Mathematics', 'Number Systems', 'Rational Numbers'],
        ['CBSE', 'Class 9', 'Mathematics', 'Number Systems', 'Irrational Numbers'],
        ['CBSE', 'Class 9', 'Mathematics', 'Algebra', 'Polynomials'],
        ['CBSE', 'Class 9', 'Mathematics', 'Algebra', 'Linear Equations'],
        ['CBSE', 'Class 9', 'Science', 'Motion', 'Distance & Displacement'],
        ['CBSE', 'Class 9', 'Science', 'Motion', 'Speed & Velocity'],
        ['CBSE', 'Class 10', 'Mathematics', 'Real Numbers', 'Euclid\'s Division Lemma'],
        ['CBSE', 'Class 10', 'Mathematics', 'Trigonometry', 'Trigonometric Ratios'],
        ['JEE Main', 'JEE Preparation', 'Physics', 'Kinematics', '1D Motion'],
        ['JEE Main', 'JEE Preparation', 'Physics', 'Kinematics', 'Projectile Motion'],
        ['JEE Main', 'JEE Preparation', 'Chemistry', 'Mole Concept', 'Atomic Mass'],
        ['NEET', 'NEET Preparation', 'Biology', 'Cell Biology', 'Cell Structure'],
        ['NEET', 'NEET Preparation', 'Biology', 'Human Physiology', 'Digestion & Absorption'],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(sampleData)

    // Column widths
    ws['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 30 }]

    XLSX.utils.book_append_sheet(wb, ws, 'Syllabus Template')

    // Add instructions sheet
    const instructionsData = [
        ['INSTRUCTIONS FOR BULK UPLOAD'],
        [''],
        ['Column', 'Required', 'Description', 'Example'],
        ['Board', 'YES', 'The board or exam name', 'CBSE, JEE Main, NEET, UPSC'],
        ['Class', 'NO', 'Class or level', 'Class 9, Class 10, JEE Preparation'],
        ['Subject', 'NO', 'Subject name', 'Mathematics, Physics, Biology'],
        ['Chapter', 'NO', 'Chapter name', 'Algebra, Kinematics, Cell Biology'],
        ['Topic', 'NO', 'Specific topic', 'Polynomials, 1D Motion, Cell Structure'],
        [''],
        ['NOTES:'],
        ['1. Duplicate entries are automatically skipped (safe to re-upload)'],
        ['2. You can upload only Board+Class without Chapter/Topic — hierarchy is partial'],
        ['3. Columns must be exactly: Board, Class, Subject, Chapter, Topic'],
        ['4. Maximum recommended: 5000 rows per upload'],
        ['5. Supports .csv, .xlsx, and .xls formats'],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(instructionsData)
    ws2['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions')

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="syllabus-template.xlsx"',
        }
    })
}
