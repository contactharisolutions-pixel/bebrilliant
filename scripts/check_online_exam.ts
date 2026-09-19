import { pool } from './src/lib/db';

async function audit() {
    console.log('=== AUDITING ONLINE EXAMS ===');
    const { rows: exams } = await pool.query(`
        SELECT *
        FROM online_exams
        ORDER BY created_at DESC
        LIMIT 5
    `);
    console.log('Exams found:', JSON.stringify(exams, null, 2));

    if (exams.length === 0) {
        console.log('No online exams found in online_exams');
        return;
    }

    const exam = exams[0];
    console.log('\n=== AUDITING EXAM:', exam.title, `(${exam.id}) ===`);
    console.log('Blueprint:', JSON.stringify(exam.blueprint, null, 2));

    // Get mapping & questions
    const { rows: questions } = await pool.query(`
        SELECT 
            oeq.id as mapping_id,
            oeq.exam_id,
            oeq.question_id,
            oeq.section_name,
            oeq.marks,
            oeq.negative_marks,
            q.type,
            q.sub_type,
            q.question_text,
            q.options,
            q.correct_answer,
            q.difficulty,
            q.source
        FROM online_exam_questions oeq
        LEFT JOIN questions q ON oeq.question_id = q.id
        WHERE oeq.exam_id = $1
        ORDER BY oeq.created_at ASC
    `, [exam.id]);

    console.log(`Total questions linked: ${questions.length}`);
    
    // Group by section
    const sections: Record<string, any[]> = {};
    const difficulties: Record<string, number> = {};
    const types: Record<string, number> = {};
    let totalMarks = 0;

    for (const q of questions) {
        const sec = q.section_name || 'Unassigned';
        if (!sections[sec]) sections[sec] = [];
        sections[sec].push(q);

        const diff = q.difficulty || 'unknown';
        difficulties[diff] = (difficulties[diff] || 0) + 1;

        const t = q.type || 'unknown';
        types[t] = (types[t] || 0) + 1;

        totalMarks += Number(q.marks || 0);
    }

    console.log('\nSection breakdown:');
    for (const [sName, list] of Object.entries(sections)) {
        const sMarks = list.reduce((sum, q) => sum + Number(q.marks || 0), 0);
        console.log(`- ${sName}: ${list.length} questions, ${sMarks} marks`);
    }

    console.log('\nDifficulty breakdown:', difficulties);
    console.log('Question Types breakdown:', types);
    console.log(`Total Marks sum of questions: ${totalMarks} (Exam total_marks: ${exam.total_marks})`);

    // Also check the template "Gujarat Board" from paper_templates
    const { rows: tmpls } = await pool.query(`
        SELECT * FROM paper_templates WHERE name ILIKE '%Gujarat%' OR id = $1
    `, [exam.blueprint?.template_id || exam.blueprint?.pattern_id || '00000000-0000-0000-0000-000000000000']);

    if (tmpls.length > 0) {
        const t = tmpls[0];
        console.log('\n=== MATCHING TEMPLATE IN paper_templates ===');
        console.log('Template:', t.name, t.category, t.exam_type, t.total_marks, 'marks, duration:', t.duration_minutes);

        const { rows: tSections } = await pool.query(`
            SELECT ts.*, 
                   json_agg(sqr.*) as rules
            FROM template_sections ts
            LEFT JOIN section_question_rules sqr ON sqr.section_id = ts.id
            WHERE ts.template_id = $1
            GROUP BY ts.id
            ORDER BY ts.order_index ASC
        `, [t.id]);

        console.log('Template Sections & Rules:');
        console.log(JSON.stringify(tSections, null, 2));
    } else {
        console.log('\nNo matching template found for Gujarat Board');
    }

    // Sample question inspection
    if (questions.length > 0) {
        console.log('\nSample question 1:', JSON.stringify(questions[0], null, 2));
        console.log('Sample question 2:', JSON.stringify(questions[1], null, 2));
    }
}

audit().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
