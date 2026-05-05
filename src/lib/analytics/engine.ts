import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * 4. PREDICTIVE RANK SYSTEM (AI Model Precursor)
 * Calculates an immediate proxy rank relative to total simulated or actual students
 * rank = (student_score / max_score) * total_students
 */
export async function calculatePredictiveRank(studentScore: number, maxScore: number, tenantId: string, examId: string): Promise<number> {
    // Phase 6 Basic Algorithm
    // Count actual attempts
    const { count: actualStudents } = await supabaseAdmin
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId)

    // Baseline minimum participants for standard normal distribution estimation (JEE/NEET scale proxy if new)
    const basePopulation = Math.max(actualStudents || 0, 500)

    let percentile = (studentScore / maxScore)
    // Add statistical noise proxy (Curve standardization for hard exams)
    if (percentile > 0.85) percentile = Math.min(0.99, percentile + 0.05)
    else if (percentile < 0.4) percentile = Math.max(0.1, percentile - 0.1)

    // Calculate Predict Rank (Invert percentile)
    const rank = Math.round((1 - percentile) * basePopulation) || 1
    return Math.max(1, rank)
}

/**
 * 6. PERSONALIZED REVISION PLANNER
 * Autogenerates a Daily syllabus schedule targeting the student's mathematically weakest topics
 */
export async function generateRevisionPlan(studentId: string, targetExamDate: string): Promise<any> {
    // Fetch lowest accuracy topics < 60%
    const { data: weakTopics } = await supabaseAdmin
        .from('student_performance')
        .select('topic_id, accuracy')
        .eq('student_id', studentId)
        .lt('accuracy', 60)
        .order('accuracy', { ascending: true })
        .limit(10)

    if (!weakTopics || weakTopics.length === 0) {
        return { message: "No weak topics logged yet. Keep practicing!" }
    }

    const daysUntilExam = Math.max(1, Math.floor((new Date(targetExamDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))

    // Distribute weak topics iteratively over available days
    const dailyPlan: Record<string, any[]> = {}
    for (let i = 1; i <= Math.min(daysUntilExam, 14); i++) {
        dailyPlan[`Day ${i}`] = []
    }

    let dayCounter = 1
    weakTopics.forEach(topic => {
        dailyPlan[`Day ${dayCounter}`].push({
            topicId: topic.topic_id,
            objective: `Raise accuracy from ${topic.accuracy}%`,
            action: 'Attempt 2 Adaptive Tests'
        })
        dayCounter = dayCounter > 13 ? 1 : dayCounter + 1
    })

    return dailyPlan
}

/**
 * 7. ADAPTIVE EXAM ENGINE
 * Hook triggering after evaluation to dictate the NEXT generated question's difficulty
 */
export function processAdaptiveDifficulty(currentDifficulty: 'easy' | 'medium' | 'hard', isCorrect: boolean): 'easy' | 'medium' | 'hard' {
    if (isCorrect) {
        if (currentDifficulty === 'easy') return 'medium'
        if (currentDifficulty === 'medium') return 'hard'
        return 'hard'
    } else {
        if (currentDifficulty === 'hard') return 'medium'
        if (currentDifficulty === 'medium') return 'easy'
        return 'easy'
    }
}

/**
 * 9. SMART RECOMMENDATION ENGINE
 */
export async function getStudentRecommendations(studentId: string) {
    const { data: lowestPerformance } = await supabaseAdmin
        .from('student_performance')
        .select('topic_id, accuracy')
        .eq('student_id', studentId)
        .order('accuracy', { ascending: true })
        .limit(3)

    return (lowestPerformance || []).map(p => ({
        type: 'weakness_alert',
        message: `Your accuracy in Topic ID ${p.topic_id} is ${p.accuracy}%. Attempt 2 targeted tests to improve.`,
        actionHook: 'generate_practice_test',
        topic_id: p.topic_id
    }))
}
