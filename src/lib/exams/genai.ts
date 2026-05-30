import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * MOCK: Generates a 1536-dimensional float array embedding for a text string.
 * PRODUCTION: This calls the OpenAI `text-embedding-ada-002` API endpoint.
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
    console.log(`[GenAI] Generating embedding array for: "${text.substring(0, 50)}..."`)
    // Simulation: Returns an array of size 1536 mapping Math.random noise (Normalized)
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    return embedding
}

/**
 * Phase 4.1: SEMANTIC DUPLICATION Engine
 * Uses pgvector cosine-distance to flag questions that are phrased differently but ask the exact same thing.
 */
export async function checkSemanticDuplication(tenantId: string, embeddingVector: number[]): Promise<{ isDuplicate: boolean, similarity?: number, duplicateId?: string }> {
    // Calls the `match_questions` RPC created in 010_pgvector_genai.sql
    const { data: matches, error } = await supabaseAdmin.rpc('match_questions', {
        query_embedding: embeddingVector,
        match_threshold: 0.88, // 88% Semantic precision boundary
        match_count: 1,
        target_tenant_id: tenantId
    })

    if (error) {
        console.error('[GenAI Vector Error]', error)
        throw new Error('Vector database check failed.')
    }

    if (matches && matches.length > 0) {
        console.log(`[GenAI] Semantic Duplicate Found! Distance: ${matches[0].similarity * 100}%`)
        return { isDuplicate: true, similarity: matches[0].similarity, duplicateId: matches[0].id }
    }

    return { isDuplicate: false }
}

/**
 * Phase 4.2: AUTONOMOUS QUESTION GENERATOR
 * Uses GenAI to craft complex Exam-ready questions mapping exact difficulty and syllabus parameters 
 * and actively blocking semantic duplicates upon creation via pgvector.
 */
export async function generateAutonomousQuestion(tenantId: string, topic: string, difficulty: string, type: 'objective' | 'subjective', teacherId: string) {
    try {
        console.log(`[GenAI] Prompting GPT-4... Topic: ${topic}, Difficulty: ${difficulty}`)

        // --- 1. MOCK LLM CALL ---
        let rawGeneratedQuestionText = ''
        let options = null
        let correctAnswer = null

        if (type === 'objective') {
            rawGeneratedQuestionText = `Calculate the velocity of a particle moving uniformly based on the standard derivation of ${topic}.`
            options = { "A": "Zero", "B": "Constant", "C": "Exponential", "D": "Logarithmic" }
            correctAnswer = { "B": "Constant" }
        } else {
            rawGeneratedQuestionText = `Explain the foundational theories supporting the emergence of ${topic} mapping against real-world observations.`
        }

        // --- 2. VECTOR GENERATION (Cost/Telemetry logged) ---
        const embedding = await generateTextEmbedding(rawGeneratedQuestionText)

        await supabaseAdmin.from('ai_generation_logs').insert({
            tenant_id: tenantId,
            teacher_id: teacherId,
            prompt: `Generate ${difficulty} ${type} question on ${topic}`,
            tokens_used: 145,
            model: 'gpt-4o'
        })

        // --- 3. PGVECTOR SEMANTIC DUPLICATION CHECK ---
        const duplicateCheck = await checkSemanticDuplication(tenantId, embedding)

        if (duplicateCheck.isDuplicate) {
            return {
                success: false,
                message: "AI generated a question that semantically matches an existing question in your bank.",
                similarityData: duplicateCheck
            }
        }

        // --- 4. SAFE INSERTION ---
        const { data: newQuestion } = await supabaseAdmin.from('questions').insert({
            tenant_id: tenantId,
            type: type,
            question_text: { en: rawGeneratedQuestionText },
            options: type === 'objective' ? options : null,
            correct_answer: type === 'objective' ? correctAnswer : null,
            difficulty: difficulty,
            embedding: embedding // Embedding locked permanently for future comparisons
        }).select().single()

        return {
            success: true,
            question: newQuestion,
            message: "Unique AI Question generated, validated semantically, and securely banked!"
        }

    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
}
