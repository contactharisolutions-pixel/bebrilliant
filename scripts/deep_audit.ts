import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function deepAudit() {
    const { pool } = await import('./src/lib/db');
    const { rows: exams } = await pool.query(`
        SELECT * FROM online_exams WHERE title ILIKE '%Gujarat%' ORDER BY created_at DESC LIMIT 1
    `);
    const exam = exams[0];
    console.log('EXAM DETAILS:');
    console.log('- ID:', exam.id);
    console.log('- Title:', exam.title);
    console.log('- Duration:', exam.duration);
    console.log('- Total Marks:', exam.total_marks);
    console.log('- Passing Marks:', exam.passing_marks);
    console.log('- Blueprint:', JSON.stringify(exam.blueprint, null, 2));

    const { rows: tmpls } = await pool.query(`
        SELECT * FROM paper_templates WHERE id = '7627fbe2-ff83-4b59-b73f-ee859c944737'
    `);
    const tmpl = tmpls[0];
    console.log('\nTEMPLATE DETAILS:');
    console.log('- ID:', tmpl.id);
    console.log('- Name:', tmpl.name);
    console.log('- Total Marks:', tmpl.total_marks);
    console.log('- Duration:', tmpl.duration_minutes);

    const { rows: tSections } = await pool.query(`
        SELECT ts.id, ts.section_name, ts.section_type, ts.order_index,
               json_agg(sqr.* ORDER BY sqr.order_index ASC) as rules
        FROM template_sections ts
        LEFT JOIN section_question_rules sqr ON sqr.section_id = ts.id
        WHERE ts.template_id = $1
        GROUP BY ts.id, ts.section_name, ts.section_type, ts.order_index
        ORDER BY ts.order_index ASC
    `, [tmpl.id]);

    console.log('\nTEMPLATE RULES BREAKDOWN:');
    let tmplTotalQuestions = 0;
    let tmplTotalMarks = 0;
    for (const s of tSections) {
        let secQ = 0;
        let secM = 0;
        console.log(`Section: ${s.section_name} (${s.section_type})`);
        for (const r of (s.rules || [])) {
            const count = Number(r.num_questions || 0);
            const m = Number(r.marks_per_question || 0);
            secQ += count;
            secM += count * m;
            console.log(`  - Rule: ${r.question_type} | Count: ${count} | Marks/Q: ${m} | Diff (E/M/H): ${r.difficulty_easy_pct} / ${r.difficulty_medium_pct} / ${r.difficulty_hard_pct}%`);
        }
        console.log(`  Section Total: ${secQ} Qs, ${secM} Marks`);
        tmplTotalQuestions += secQ;
        tmplTotalMarks += secM;
    }
    console.log(`Total Template: ${tmplTotalQuestions} Qs, ${tmplTotalMarks} Marks`);

    const { rows: questions } = await pool.query(`
        SELECT oeq.section_name, oeq.marks, oeq.negative_marks, q.*
        FROM online_exam_questions oeq
        JOIN questions q ON oeq.question_id = q.id
        WHERE oeq.exam_id = $1
        ORDER BY oeq.created_at ASC
    `, [exam.id]);

    console.log('\nACTUAL GENERATED QUESTIONS IN EXAM:');
    console.log('- Total Questions Count:', questions.length);

    // Group actual by section
    const actualSecMap: Record<string, any[]> = {};
    for (const q of questions) {
        const s = q.section_name || 'General';
        if (!actualSecMap[s]) actualSecMap[s] = [];
        actualSecMap[s].push(q);
    }

    for (const [secName, qList] of Object.entries(actualSecMap)) {
        console.log(`\nSection: ${secName} (${qList.length} Qs)`);
        const typeCount: Record<string, number> = {};
        const subTypeCount: Record<string, number> = {};
        const diffCount: Record<string, number> = {};
        let secMarks = 0;

        for (const q of qList) {
            typeCount[q.type] = (typeCount[q.type] || 0) + 1;
            const st = q.sub_type || q.type || 'none';
            subTypeCount[st] = (subTypeCount[st] || 0) + 1;
            diffCount[q.difficulty || 'none'] = (diffCount[q.difficulty || 'none'] || 0) + 1;
            secMarks += Number(q.marks || 1);
        }
        console.log('  - Total Marks:', secMarks);
        console.log('  - Types:', typeCount);
        console.log('  - SubTypes:', subTypeCount);
        console.log('  - Difficulties:', diffCount);
    }
}

deepAudit().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
