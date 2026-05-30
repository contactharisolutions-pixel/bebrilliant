import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { question_count, question_type, difficulty } = body

        if (!question_count || isNaN(question_count)) {
            return NextResponse.json({ error: 'Invalid question count' }, { status: 400 })
        }

        // Action Credits
        // MCQ 1
        // Subjective 2
        // Hard Difficulty +1
        
        const baseCost = question_type === 'subjective' ? 2 : 1
        const difficultyCost = difficulty === 'Hard' ? 1 : 0

        const totalCredits = (question_count * baseCost) + (question_count * difficultyCost)

        return NextResponse.json({ total_credits: totalCredits })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
