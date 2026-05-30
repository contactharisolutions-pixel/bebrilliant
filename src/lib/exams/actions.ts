import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

/**
 * 4.3 UNIQUENESS ENGINE
 * Phase 4 duplicate prevention system parsing hash comparisons for identical texts.
 */
export function generateQuestionHash(questionTextEn: string, optionsJson: unknown): string {
    const seed = `${questionTextEn}-${JSON.stringify(optionsJson)}`
    return crypto.createHash('sha256').update(seed).digest('hex')
}

/**
 * Evaluates duplicate questions globally/locally before inserting an AI-generated question
 */
export async function validateQuestionUniqueness(tenantId: string, textEn: string, options: unknown): Promise<boolean> {
    const targetHash = generateQuestionHash(textEn, options)

    // Simplistic hash lookup for Phase 4 exact uniqueness (Embedding similarity is handled by Vector DB in phase 5)
    // Here we query looking for an exact text match mapping to the hash in metadata (if added) or just search text
    // Assuming we added a 'hash' column or we do deep JSON checking
    const { data: existing } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('tenant_id', tenantId)
        .contains('question_text', { en: textEn })
        .limit(1)

    // Returns true if UNIQUE, false if DUPLICATE found
    return !existing || existing.length === 0
}

/**
 * 5.2 SEED LOGIC
 * Secure exam randomization generator fixing uniform randomness per student attempt
 */
export function getStudentExamSeed(studentId: string, examId: string): number {
    const hashHex = crypto.createHash('sha256').update(`${studentId}-${examId}`).digest('hex')
    return parseInt(hashHex.substring(0, 8), 16)
}

/**
 * Parses an exam structure template (e.g. JEE pattern) and distributes blank questions
 */
export async function applyExamTemplate(examId: string, templateId: string) {
    const { data: template } = await supabaseAdmin.from('exam_templates').select('structure').eq('id', templateId).single()
    if (!template) throw new Error('Template not found')

    // Example JSON: { "sections": [{ "name": "Physics", "mcq": 20, "numerical": 5 }] }
    // Loop through structure and compile exam_questions bridging logic...
    // (Implementation omitted for brevity, logic goes here)
    return template.structure
}

/**
 * 7.1 Auto Evaluation for Objective Exams
 */
export async function processObjectiveEvaluation(attemptId: string) {
    // 1. Fetch submitted answers that aren't evaluated yet
    const { data: submittedAnswers } = await supabaseAdmin
        .from('answers')
        .select('id, question_id, answer')
        .eq('attempt_id', attemptId)
        .is('is_correct', null) // Not yet marked

    if (!submittedAnswers) return

    for (const ans of submittedAnswers) {
        // Fetch original question with correct answer and marks 
        const { data: question } = await supabaseAdmin
            .from('questions')
            .select('correct_answer, marks, negative_marks')
            .eq('id', ans.question_id)
            .single()

        if (question) {
            const isMatch = JSON.stringify(ans.answer) === JSON.stringify(question.correct_answer)
            const marksAwarded = isMatch ? question.marks : -(question.negative_marks || 0)

            // Update evaluation immediately
            await supabaseAdmin.from('answers').update({
                is_correct: isMatch,
                marks_awarded: marksAwarded
            }).eq('id', ans.id)
        }
    }

    // Sum final score & close exam
    const { data: allMarks } = await supabaseAdmin.from('answers').select('marks_awarded').eq('attempt_id', attemptId)
    const totalScore = allMarks?.reduce((acc, curr) => acc + (curr.marks_awarded || 0), 0)

    await supabaseAdmin.from('exam_attempts').update({
        status: 'evaluated',
        total_score: totalScore || 0
    }).eq('id', attemptId)

    return totalScore
}
