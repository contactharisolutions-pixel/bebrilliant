import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { subject, chapter, topic, difficulty, question_count, question_type } = body

        // 1. Get profile & tenant
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'student') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Calculate Credits
        let baseCost = question_type === 'subjective' ? 2 : 1
        let difficultyCost = difficulty === 'Hard' ? 1 : 0
        const totalCredits = (question_count * baseCost) + (question_count * difficultyCost)

        // 3. Check Wallet Balance (Transaction Safe-ish in Supabase without full RPC for now)
        const { data: wallet, error: walletErr } = await supabaseAdmin
            .from('student_wallets')
            .select('balance')
            .eq('student_id', user.id)
            .single()

        if (walletErr || (wallet?.balance || 0) < totalCredits) {
            return NextResponse.json({ 
                error: 'Insufficient Credits', 
                balance: wallet?.balance || 0,
                required: totalCredits 
            }, { status: 400 })
        }

        // 4. Deduct Credits
        const { error: deductError } = await supabaseAdmin
            .from('student_wallets')
            .update({ balance: (wallet.balance - totalCredits) })
            .eq('student_id', user.id)

        if (deductError) throw deductError

        // 5. Create Transaction Record
        const { data: transaction, error: transError } = await supabaseAdmin
            .from('student_wallet_transactions')
            .insert({
                tenant_id: profile.tenant_id,
                student_id: user.id,
                type: 'debit',
                credits: totalCredits,
                reference_type: 'custom_exam',
                description: `Custom Exam: ${subject} - ${question_count} Qs`
            })
            .select()
            .single()

        if (transError) throw transError

        // 6. Create Custom Exam Record
        const { data: exam, error: examError } = await supabaseAdmin
            .from('student_custom_exams')
            .insert({
                tenant_id: profile.tenant_id,
                student_id: user.id,
                subject,
                chapter,
                topic,
                difficulty,
                question_count,
                credits_used: totalCredits,
                status: 'generating'
            })
            .select()
            .single()

        if (examError) throw examError

        // 7. Update transaction with exam_id
        await supabaseAdmin
            .from('student_wallet_transactions')
            .update({ reference_id: exam.id })
            .eq('id', transaction.id)

        // 8. Generate Questions (Mock generation for now)
        // In a real scenario, this would call an AI service
        const mockQuestions = Array.from({ length: question_count }).map((_, i) => ({
            exam_id: exam.id,
            question: `Sample ${difficulty} ${question_type} question #${i + 1} about ${topic || chapter || subject}`,
            type: question_type || 'MCQ',
            options: question_type === 'MCQ' ? JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']) : null,
            answer: 'Option A',
            marks: baseCost
        }))

        const { error: qError } = await supabaseAdmin
            .from('student_custom_exam_questions')
            .insert(mockQuestions)

        if (qError) {
            // Refund logic if questions fail
            await supabaseAdmin
                .from('student_wallets')
                .update({ balance: wallet.balance })
                .eq('student_id', user.id)
            
            await supabaseAdmin
                .from('student_custom_exams')
                .update({ status: 'failed' })
                .eq('id', exam.id)
                
            throw qError
        }

        // 9. Mark Exam Ready
        await supabaseAdmin
            .from('student_custom_exams')
            .update({ status: 'ready' })
            .eq('id', exam.id)

        return NextResponse.json({
            success: true,
            exam_id: exam.id,
            message: 'Exam generated successfully'
        })

    } catch (error: any) {
        console.error('Custom Exam Create Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
