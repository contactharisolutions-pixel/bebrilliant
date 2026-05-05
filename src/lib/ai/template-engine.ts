import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase/admin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export class MasterTemplateEngine {
    /**
     * Generate a batch of questions based on a template section rule.
     */
    static async generateQuestionsForRule(
        templateName: string,
        sectionName: string,
        rule: any,
        syllabusContext?: string
    ) {
        const prompt = `
        You are an expert Question Designer for ${templateName}.
        Task: Generate ${rule.num_questions} high-quality questions for "${sectionName}".
        
        REQUIREMENTS:
        - Question Type: ${rule.question_type}
        - Difficulty Distribution: 
            * Easy: ${rule.difficulty_easy_pct}%
            * Medium: ${rule.difficulty_medium_pct}%
            * Hard: ${rule.difficulty_hard_pct}%
        - Marks per Question: ${rule.marks_per_question}
        - Negative Marking: ${rule.negative_marks}
        
        ACADEMIC CONTEXT:
        ${syllabusContext || 'General academic standards for high school and entrance exams.'}
        
        OUTPUT FORMAT:
        Return a JSON array of objects. Each object must strictly follow this structure:
        {
            "type": "objective" | "subjective",
            "sub_type": "mcq" | "numerical" | "descriptive",
            "question_text": { "en": "..." },
            "options": { "A": "...", "B": "...", "C": "...", "D": "..." } (only if objective),
            "correct_answer": { "en": "..." },
            "explanation": { "en": "..." },
            "difficulty": "easy" | "medium" | "hard",
            "marks": ${rule.marks_per_question}
        }
        
        Ensure questions are academically accurate and appropriately challenging.
        No conversational text, only the JSON array.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Extract JSON
            const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || '[]';
            const questions = JSON.parse(jsonStr);
            
            return questions;
        } catch (error) {
            console.error("AI Question Generation Error:", error);
            throw error;
        }
    }

    /**
     * Fully populate a template with AI-generated questions.
     */
    static async populateTemplateWithAI(templateId: string, tenantId: string, syllabusNodeId?: string) {
        // 1. Fetch Template Structure
        const { data: template, error: tError } = await supabaseAdmin
            .from('paper_templates')
            .select(`
                *,
                sections:template_sections(
                    *,
                    rules:section_question_rules(*)
                )
            `)
            .eq('id', templateId)
            .single();

        if (tError) throw tError;

        // 2. Fetch Syllabus Context if nodeId provided
        let context = "";
        if (syllabusNodeId) {
            const { data: node } = await supabaseAdmin.from('syllabus_nodes').select('name').eq('id', syllabusNodeId).single();
            const { data: children } = await supabaseAdmin.from('syllabus_nodes').select('name').eq('parent_id', syllabusNodeId);
            context = `Targeting Syllabus: ${node?.name}. Topics involved: ${children?.map(c => c.name).join(', ')}.`;
        }

        const allGenerated: any[] = [];

        // 3. Generate for each section rule
        for (const section of template.sections) {
            for (const rule of section.rules) {
                const questions = await this.generateQuestionsForRule(template.name, section.section_name, rule, context);
                
                // Add metadata & Save to DB
                const prepared = questions.map((q: any) => ({
                    ...q,
                    tenant_id: tenantId,
                    source: 'ai',
                    created_by: null // System generated
                }));

                const { data: savedIds, error: iError } = await supabaseAdmin
                    .from('questions')
                    .insert(prepared)
                    .select('id');

                if (iError) throw iError;

                // Link to Exam Questions table if needed (for a preview paper instance)
                allGenerated.push(...savedIds.map(s => s.id));
            }
        }

        return { count: allGenerated.length, message: "Successfully generated question bank for template." };
    }
}
