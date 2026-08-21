import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Model fallback chain (same pattern as syllabus engine) ────────────────────
const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

async function getApiKey(): Promise<string> {
    try {
        const { data } = await supabaseAdmin
            .from('ai_engine_config')
            .select('value')
            .eq('parameter', 'gemini_api_key')
            .maybeSingle();
        if (data?.value && typeof data.value === 'string' && data.value.trim()) return data.value.trim();
    } catch { /* fallback to env */ }
    return process.env.GEMINI_API_KEY || '';
}

async function generateWithGemini(prompt: string): Promise<string> {
    const apiKey = await getApiKey();
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing or not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastErr: any = null;

    for (const modelName of MODELS_TO_TRY) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) return text;
        } catch (err: any) {
            lastErr = err;
            console.warn(`[TemplateEngine] Model ${modelName} failed:`, err.message?.split('\n')[0]);
        }
    }

    let msg = lastErr?.message || "Gemini AI failed to respond";
    if (msg.includes("403") || msg.includes("leaked")) msg = "Gemini API key is blocked. Please update it in AI Engine settings.";
    else if (msg.includes("404") || msg.includes("not found") || msg.includes("no longer available")) msg = "Gemini model unavailable. Please check AI Engine configuration.";
    throw new Error(msg);
}

// ── Question presets for fallback when AI unavailable ─────────────────────────
function buildFallbackQuestions(sectionName: string, rule: any): any[] {
    const count = Math.min(rule.num_questions ?? 5, 5);
    return Array.from({ length: count }, (_, i) => ({
        type: 'objective',
        sub_type: 'mcq',
        question_text: { en: `[Template] ${sectionName} — Question ${i + 1} (${rule.question_type})` },
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
        correct_answer: { en: 'A' },
        explanation: { en: 'Generated as placeholder. Please review and edit.' },
        difficulty: i < Math.ceil(count * 0.3) ? 'easy' : i < Math.ceil(count * 0.8) ? 'medium' : 'hard',
        marks: rule.marks_per_question ?? 1,
    }));
}

export class MasterTemplateEngine {

    /** Generate questions for one rule using Gemini with fallback */
    static async generateQuestionsForRule(
        templateName: string,
        sectionName: string,
        rule: any,
        context?: string
    ): Promise<any[]> {
        const isMCQ = ['MCQ', 'MSQ', 'True/False', 'Assertion Reason', 'Fill in the blanks', 'Numerical'].includes(rule.question_type);
        const qType = isMCQ ? 'objective' : 'subjective';
        const subType = rule.question_type === 'Numerical' ? 'numerical' : isMCQ ? 'mcq' : 'descriptive';

        const easyCount   = Math.round(rule.num_questions * (rule.difficulty_easy_pct   / 100));
        const mediumCount = Math.round(rule.num_questions * (rule.difficulty_medium_pct / 100));
        const hardCount   = rule.num_questions - easyCount - mediumCount;

        const prompt = `You are an expert Indian exam question designer for "${templateName}".

Generate exactly ${rule.num_questions} questions for the section "${sectionName}" of type "${rule.question_type}".

DIFFICULTY MIX (must be exact):
- Easy: ${easyCount} questions
- Medium: ${mediumCount} questions  
- Hard: ${hardCount} questions

MARKS & MARKING: Each question = ${rule.marks_per_question} marks, negative marks = ${rule.negative_marks ?? 0}
${context ? `SYLLABUS CONTEXT: ${context}` : 'CONTEXT: Standard CBSE/NCERT curriculum for school and entrance exams in India.'}

OUTPUT: Return ONLY a valid JSON array, no markdown, no explanation. Each element:
{
  "type": "${qType}",
  "sub_type": "${subType}",
  "question_text": { "en": "..." },
  ${isMCQ && rule.question_type !== 'True/False' && rule.question_type !== 'Numerical' ? '"options": { "A": "...", "B": "...", "C": "...", "D": "..." },' : ''}
  ${rule.question_type === 'True/False' ? '"options": { "A": "True", "B": "False" },' : ''}
  "correct_answer": { "en": "..." },
  "explanation": { "en": "Step-by-step solution in 2-3 lines." },
  "difficulty": "easy" | "medium" | "hard",
  "marks": ${rule.marks_per_question}
}

Generate ${easyCount} easy, then ${mediumCount} medium, then ${hardCount} hard questions. Ensure academic accuracy.`;

        try {
            const text = await generateWithGemini(prompt);
            const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || '[]';
            const questions = JSON.parse(jsonStr);
            if (!Array.isArray(questions) || questions.length === 0) throw new Error('Empty or invalid response');
            return questions;
        } catch (error: any) {
            console.error(`[TemplateEngine] Question generation failed for rule (${rule.question_type}):`, error.message);
            return buildFallbackQuestions(sectionName, rule);
        }
    }

    /** Populate a template with AI-generated questions for a specific tenant */
    static async populateTemplateWithAI(
        templateId: string,
        tenantId: string,
        options?: { syllabusNodeId?: string; createdBy?: string }
    ) {
        if (!tenantId) throw new Error("tenantId is required to generate questions for a tenant's question bank");

        // 1. Fetch Template with sections + rules (ordered)
        const { data: template, error: tError } = await supabaseAdmin
            .from('paper_templates')
            .select(`
                *,
                sections:template_sections(
                    *,
                    rules:section_question_rules(* ORDER BY order_index ASC)
                    ORDER BY order_index ASC
                )
            `)
            .eq('id', templateId)
            .single();

        if (tError || !template) throw new Error(`Template not found: ${tError?.message}`);

        // 2. Build syllabus context if provided
        let context = '';
        if (options?.syllabusNodeId) {
            const { data: node } = await supabaseAdmin
                .from('syllabus_nodes')
                .select('name, type')
                .eq('id', options.syllabusNodeId)
                .single();
            const { data: children } = await supabaseAdmin
                .from('syllabus_nodes')
                .select('name')
                .eq('parent_id', options.syllabusNodeId)
                .limit(20);
            if (node) {
                context = `${node.type}: "${node.name}". Sub-topics: ${children?.map(c => c.name).join(', ') || 'General'}.`;
            }
        }

        const results: { sectionName: string; questionCount: number; questionIds: string[] }[] = [];
        let totalGenerated = 0;

        // 3. Generate per section per rule
        for (const section of (template.sections ?? [])) {
            const sectionIds: string[] = [];
            for (const rule of (section.rules ?? [])) {
                const questions = await this.generateQuestionsForRule(
                    template.name,
                    section.section_name,
                    rule,
                    context
                );

                const prepared = questions.map((q: any) => ({
                    tenant_id: tenantId,
                    type: q.type ?? 'objective',
                    sub_type: q.sub_type ?? 'mcq',
                    question_text: q.question_text ?? { en: 'Question' },
                    options: q.options ?? null,
                    correct_answer: q.correct_answer ?? null,
                    explanation: q.explanation ?? null,
                    difficulty: q.difficulty ?? 'medium',
                    marks: q.marks ?? rule.marks_per_question ?? 1,
                    negative_marks: q.negative_marks ?? rule.negative_marks ?? 0,
                    source: 'ai_template',
                    created_by: options?.createdBy ?? null,
                }));

                const { data: saved, error: iError } = await supabaseAdmin
                    .from('questions')
                    .insert(prepared)
                    .select('id');

                if (iError) {
                    console.error(`[TemplateEngine] Insert failed for section "${section.section_name}":`, iError.message);
                    continue;
                }

                const ids = (saved ?? []).map((s: any) => s.id);
                sectionIds.push(...ids);
                totalGenerated += ids.length;
            }

            results.push({
                sectionName: section.section_name,
                questionCount: sectionIds.length,
                questionIds: sectionIds,
            });
        }

        // 4. Update usage stats on the template
        await supabaseAdmin
            .from('paper_templates')
            .update({ usage_count: (template.usage_count ?? 0) + 1, last_used_at: new Date().toISOString() })
            .eq('id', templateId);

        return {
            totalGenerated,
            sections: results,
            message: `Successfully generated ${totalGenerated} questions for tenant question bank from "${template.name}".`,
        };
    }
}
