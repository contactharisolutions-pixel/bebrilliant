import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

async function realignExam() {
    const { pool } = await import('../src/lib/db');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not found in environment');

    const EXAM_ID = 'b80b602a-db7c-4c76-85bf-dbd980cb5dc4';
    const TEMPLATE_ID = '7627fbe2-ff83-4b59-b73f-ee859c944737';

    console.log('Fetching Exam and Template...');
    const { rows: exams } = await pool.query('SELECT * FROM online_exams WHERE id = $1', [EXAM_ID]);
    const exam = exams[0];
    if (!exam) throw new Error('Exam not found');

    const { rows: tmpls } = await pool.query('SELECT * FROM paper_templates WHERE id = $1', [TEMPLATE_ID]);
    const tmpl = tmpls[0];
    if (!tmpl) throw new Error('Template not found');

    const { rows: tSections } = await pool.query(`
        SELECT ts.id, ts.section_name, ts.section_type, ts.order_index,
               json_agg(sqr.* ORDER BY sqr.order_index ASC) as rules
        FROM template_sections ts
        LEFT JOIN section_question_rules sqr ON sqr.section_id = ts.id
        WHERE ts.template_id = $1
        GROUP BY ts.id, ts.section_name, ts.section_type, ts.order_index
        ORDER BY ts.order_index ASC
    `, [TEMPLATE_ID]);

    console.log(`Loaded ${tSections.length} sections from template.`);

    const className = exam.class_name || 'Class 8';
    const subjectName = exam.subject_name || 'English';
    const syllabusName = 'Gujarat Board';
    const tenantId = exam.tenant_id;
    const userId = exam.created_by;

    // Build the exact generation batches per section rule
    interface PlanBatch {
        section_name: string;
        sub_type: string;
        type: string;
        difficulty: 'easy' | 'medium' | 'hard';
        count: number;
        marks: number;
        negative_marks: number;
    }

    const plan: PlanBatch[] = [];

    for (const sec of tSections) {
        for (const r of (sec.rules || [])) {
            const count = Number(r.num_questions || 0);
            if (count <= 0) continue;
            const rType = r.question_type || 'MCQ';
            const marks = Number(r.marks_per_question || 1);
            const neg = Number(r.negative_marks || 0);
            const isSubj = ['short_answer', 'long_answer', 'descriptive'].includes(rType.toLowerCase().replace(/[^a-z0-9]/g, '_'));
            const qType = isSubj ? 'subjective' : 'objective';

            const easyPct = Number(r.difficulty_easy_pct ?? 30);
            const hardPct = Number(r.difficulty_hard_pct ?? 20);
            const easyN = Math.round((count * easyPct) / 100);
            const hardN = Math.round((count * hardPct) / 100);
            const medN = Math.max(0, count - easyN - hardN);

            if (easyN > 0) plan.push({ section_name: sec.section_name, sub_type: rType, type: qType, difficulty: 'easy', count: easyN, marks, negative_marks: neg });
            if (medN > 0) plan.push({ section_name: sec.section_name, sub_type: rType, type: qType, difficulty: 'medium', count: medN, marks, negative_marks: neg });
            if (hardN > 0) plan.push({ section_name: sec.section_name, sub_type: rType, type: qType, difficulty: 'hard', count: hardN, marks, negative_marks: neg });
        }
    }

    const totalPlanned = plan.reduce((acc, p) => acc + p.count, 0);
    console.log(`Plan constructed: ${plan.length} batches, total ${totalPlanned} questions.`);

    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-2.5-pro'];
    const genAI = new GoogleGenerativeAI(apiKey);

    function normalizeSubType(input?: string): string {
        if (!input) return 'mcq';
        const s = input.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (s.includes('true') || s.includes('false')) return 'true_false';
        if (s.includes('assertion') || s.includes('reason')) return 'assertion_reason';
        if (s.includes('fill') || s.includes('blank')) return 'fill_blank';
        if (s.includes('numeric') || s.includes('integer') || s.includes('calc')) return 'numerical';
        if (s.includes('diagram') || s.includes('graph') || s.includes('visual')) return 'diagram_based';
        if (s.includes('case')) return 'case_based';
        if (s.includes('short')) return 'short_answer';
        if (s.includes('long') || s.includes('essay')) return 'long_answer';
        if (s.includes('descript')) return 'descriptive';
        return 'mcq';
    }

    function getFormatInstructions(st: string, marks: number) {
        switch (st) {
            case 'true_false':
                return `FORMAT: True/False Question.
- The question text must be a clear, unambiguous factual or conceptual statement suitable for ${className}.
- "options" MUST be exactly ["True", "False"].
- "correct_answer" MUST be either "True" or "False".`;

            case 'assertion_reason':
                return `FORMAT: Assertion & Reason Question (Board Standard for ${className}).
- The question text MUST follow this exact structure:
Assertion (A): [Clear, concise statement A]
Reason (R): [Clear, concise explanation or reasoning statement R]
- "options" MUST be exactly:
[
  "Both Assertion (A) and Reason (R) are true, and Reason (R) is the correct explanation of Assertion (A)",
  "Both Assertion (A) and Reason (R) are true, but Reason (R) is NOT the correct explanation of Assertion (A)",
  "Assertion (A) is true, but Reason (R) is false",
  "Assertion (A) is false, but Reason (R) is true"
]
- "correct_answer" MUST be the exact matching string from one of the options above.`;

            case 'fill_blank':
                return `FORMAT: Fill in the Blanks Question.
- The question text MUST contain exactly one blank indicated by "______" (e.g. "The teacher asked the students to ______ their homework before Monday.").
- "options" MUST contain exactly 4 distinct plausible fill-in words/phrases so students can answer online.
- "correct_answer" MUST be the exact word from options that correctly completes the sentence.`;

            case 'numerical':
                return `FORMAT: Numerical / Problem-Solving Question.
- The question must present a clear problem requiring calculation or numerical understanding suitable for ${className} English/Grammar (e.g. counting syllables, identifying correct word sequence/count, or comprehension numbers).
- "options" MUST be 4 distinct numerical or quantitative values.
- "correct_answer" MUST be the exact correct value from the options.`;

            case 'diagram_based':
                return `FORMAT: Diagram-based / Visual Context Question.
- The question text MUST include a visual context / diagram description inside brackets, e.g.:
[Diagram Context: A flowchart showing the stages of story writing: Idea → Outline → First Draft → Proofreading]
Followed by a direct question asking the student to interpret or apply the concept shown in the diagram.
- "options" MUST contain 4 distinct options.
- "correct_answer" MUST be the exact correct option text.`;

            case 'short_answer':
                return `FORMAT: Short Answer Question (${marks} Marks).
- A focused conceptual question in English grammar/literature requiring a concise answer (1-3 sentences).
- "options" can provide 4 distinct concise answer interpretations for automated online testing.
- "correct_answer" MUST be the accurate model answer.`;

            case 'long_answer':
                return `FORMAT: Long Answer / Descriptive Question (${marks} Marks).
- An analytical question in English requiring structured explanation.
- Provide 4 comprehensive answer choices for online interactive evaluation.
- "correct_answer" MUST be the accurate model answer.`;

            case 'mcq':
            default:
                return `FORMAT: Multiple Choice Question (MCQ).
- The question must ask a clear, direct question in simple English.
- "options" MUST contain exactly 4 distinct, plausible options.
- "correct_answer" MUST be the exact text of the single unambiguously correct option.`;
        }
    }

    async function generateBatch(b: PlanBatch): Promise<any[]> {
        const normSub = normalizeSubType(b.sub_type);
        const prompt = `
You are the Gemini AI Question Preparation Agent for the BeBrilliant Examination Platform, adhering strictly to Indian curriculum standards (CBSE / Gujarat State Board).

Generate exactly ${b.count} distinct, high-quality, syllabus-aligned examination questions strictly adhering to the parameters below:

ACADEMIC CONTEXT:
- Board: ${syllabusName}
- Class: ${className}
- Subject: ${subjectName}
- Section: ${b.section_name} (${b.marks} Marks per question, ${b.negative_marks} Negative Marks)
- Question Subtype: ${normSub.toUpperCase()}
- Difficulty Level: ${b.difficulty} (easy = foundational recall, medium = standard school board level, hard = higher-order thinking skill / HOTS)
- Medium / Language: English

FORMAT INSTRUCTIONS:
${getFormatInstructions(normSub, b.marks)}

MANDATORY RULES:
1. EASY, SIMPLE, AND CLEAN ENGLISH (RULE 24):
   - All questions and options MUST use short, direct, clear, and natural English suitable for Indian school students of ${className}.
   - Familiar school-level vocabulary. Ask one clear thing at a time with unambiguous wording.
   - Difficulty must come from the concept, NEVER from difficult English.
2. STRICTLY FOR "${subjectName}" for ${className}.
3. FRESHNESS & NON-REPETITION (RULE 2).
4. Exactly ONE option must be unambiguously correct.

OUTPUT FORMAT:
Respond ONLY with a valid JSON array of objects without markdown wrappers (no \`\`\`json, no backticks):
[
  {
    "section": "${b.section_name}",
    "subject": "${subjectName}",
    "topic": "English Grammar / Literature Topic",
    "type": "${b.type}",
    "sub_type": "${normSub}",
    "difficulty": "${b.difficulty}",
    "marks": ${b.marks},
    "negative_marks": ${b.negative_marks},
    "text": "Clearly written question text adhering to the format",
    "options": ${normSub === 'true_false' ? '["True", "False"]' : '["Option A", "Option B", "Option C", "Option D"]'},
    "correct_answer": "Exact text of the correct option",
    "explanation": "Concise step-by-step rationale in simple English"
  }
]
`;

        let lastErr: any = null;
        for (const model of GEMINI_MODELS) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const modelInstance = genAI.getGenerativeModel({ model });
                    const result = await modelInstance.generateContent(prompt);
                    const text = result.response.text() || '';
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const match = cleanJson.match(/\[[\s\S]*\]/);
                    const jsonStr = match ? match[0] : cleanJson;
                    const qs = JSON.parse(jsonStr);
                    if (Array.isArray(qs) && qs.length > 0) {
                        return qs.map((q: any) => ({
                            ...q,
                            section_name: b.section_name,
                            type: b.type,
                            sub_type: normSub,
                            difficulty: b.difficulty,
                            marks: b.marks,
                            negative_marks: b.negative_marks,
                            options: normSub === 'true_false' ? ['True', 'False'] : (Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'])
                        }));
                    }
                } catch (err: any) {
                    lastErr = err;
                    console.warn(`    Model ${model} attempt ${attempt} warning:`, err?.message?.split('\n')[0]);
                    await new Promise(r => setTimeout(r, 1200));
                }
            }
        }
        throw new Error(`Failed to generate batch ${b.section_name} - ${b.sub_type} (${b.difficulty}): ${lastErr?.message}`);
    }

    const cacheFile = './scratch/generated_questions.json';

    console.log('\n--- Generating Questions Following Template Rules ---');
    let allQuestions: any[] = [];

    if (fs.existsSync(cacheFile)) {
        try {
            const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            if (Array.isArray(cached) && cached.length === 100) {
                console.log('Found complete cached set of 100 questions in scratch/generated_questions.json. Using cached questions.');
                allQuestions = cached;
            }
        } catch {}
    }

    if (allQuestions.length !== 100) {
        allQuestions = [];
        for (let i = 0; i < plan.length; i++) {
            const b = plan[i];
            console.log(`[Batch ${i + 1}/${plan.length}] Generating ${b.count} ${b.sub_type} (${b.difficulty}) for ${b.section_name}...`);
            const qs = await generateBatch(b);
            allQuestions.push(...qs);
            // Save incremental progress
            fs.writeFileSync(cacheFile, JSON.stringify(allQuestions, null, 2));
            // Small rate limit pause between batches
            await new Promise(r => setTimeout(r, 600));
        }
    }

    console.log(`\nSuccessfully prepared all ${allQuestions.length} questions!`);

    // Delete old questions linked to this exam
    console.log('\nCleaning up old misaligned exam questions from DB...');
    const { rows: oldMappings } = await pool.query(
        'SELECT question_id FROM online_exam_questions WHERE exam_id = $1',
        [EXAM_ID]
    );
    const oldQuestionIds = oldMappings.map(m => m.question_id);

    await pool.query('DELETE FROM online_exam_questions WHERE exam_id = $1', [EXAM_ID]);
    if (oldQuestionIds.length > 0) {
        await pool.query('DELETE FROM questions WHERE id = ANY($1)', [oldQuestionIds]);
    }
    console.log(`Removed ${oldQuestionIds.length} old questions.`);

    // Insert new questions into public.questions
    console.log('Inserting 100 new aligned questions into public.questions...');
    const insertedIds: string[] = [];

    for (const q of allQuestions) {
        const qText = q.text || q.question_text || '';
        const optionsJson = JSON.stringify(q.options || ['Option A', 'Option B', 'Option C', 'Option D']);
        const correctAns = typeof q.correct_answer === 'string' ? q.correct_answer : (q.options?.[0] || 'Option A');
        const correctAnsJson = JSON.stringify(correctAns);
        const explJson = JSON.stringify({ en: q.explanation || '' });

        const { rows } = await pool.query(`
            INSERT INTO public.questions (
                tenant_id, type, sub_type, question_text, options, correct_answer, explanation,
                difficulty, marks, negative_marks, source, created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ai', $11
            ) RETURNING id
        `, [
            tenantId,
            q.type,
            q.sub_type,
            JSON.stringify({ en: qText }),
            optionsJson,
            correctAnsJson,
            explJson,
            q.difficulty,
            q.marks,
            q.negative_marks,
            userId
        ]);

        insertedIds.push(rows[0].id);
    }

    console.log(`Inserted ${insertedIds.length} questions into questions table.`);

    // Link into online_exam_questions
    console.log('Linking questions in online_exam_questions table...');
    for (let i = 0; i < insertedIds.length; i++) {
        const qId = insertedIds[i];
        const q = allQuestions[i];
        await pool.query(`
            INSERT INTO public.online_exam_questions (
                exam_id, question_id, section_name, marks, negative_marks
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            EXAM_ID,
            qId,
            q.section_name,
            q.marks,
            q.negative_marks
        ]);
    }

    // Update online_exams blueprint
    console.log('Updating exam blueprint in online_exams table...');
    const updatedSections = tSections.map(s => ({
        name: s.section_name,
        qCount: (s.rules || []).reduce((acc: number, r: any) => acc + Number(r.num_questions || 0), 0),
        mark: Number(s.rules?.[0]?.marks_per_question || 1),
        negMark: Number(s.rules?.[0]?.negative_marks || 0),
        rules: s.rules || []
    }));

    const updatedBlueprint = {
        ...(exam.blueprint || {}),
        sections: updatedSections,
        total_questions: allQuestions.length,
        questions: allQuestions.map((q, idx) => ({
            id: insertedIds[idx],
            question_id: insertedIds[idx],
            section: q.section_name,
            type: q.type,
            sub_type: q.sub_type,
            difficulty: q.difficulty,
            marks: q.marks,
            negative_marks: q.negative_marks,
            text: q.text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation
        }))
    };

    await pool.query(`
        UPDATE public.online_exams 
        SET blueprint = $1, total_marks = 100, updated_at = NOW() 
        WHERE id = $2
    `, [JSON.stringify(updatedBlueprint), EXAM_ID]);

    console.log('\n🎉 Exam realigned and updated successfully!');
}

realignExam().then(() => process.exit(0)).catch(err => {
    console.error('Realign error:', err);
    process.exit(1);
});
