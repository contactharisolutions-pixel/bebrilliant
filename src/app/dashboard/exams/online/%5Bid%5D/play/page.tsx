'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, Shield, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'

// —— PALETTE ————————————————————————————————————
const P = {
    bg: '#0F172A', card: '#1E293B', border: '#334155',
    brand: '#38BDF8', brandBg: '#38BDF815',
    text: '#94A3B8', light: '#F8FAFC',
    success: '#10B981', error: '#EF4444', warning: '#F59E0B'
}

export default function OnlinePlayer() {
    const params = useParams()
    const router = useRouter()
    const examId = params.id as string

    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [timeLeft, setTimeLeft] = useState(0)
    const [tabSwitches, setTabSwitches] = useState(0)
    const [attemptId, setAttemptId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchExam = useCallback(async () => {
        try {
            // 1. Fetch Exam Meta
            const res = await fetch(`/api/dashboard/exams/online/${examId}`) // Mock or real
            // For now, I'll fetch questions from the runtime route
            const qRes = await fetch(`/api/dashboard/exams/online?action=GET_QUESTIONS&id=${examId}`)
            const data = await qRes.json()
            setQuestions(data.questions || [])
            
            // 2. Start Attempt
            const startRes = await fetch('/api/dashboard/exams/online/runtime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'START_ATTEMPT', payload: { examId, studentId: 'current' } })
            })
            const startData = await startRes.json()
            setAttemptId(startData.id)
            setTimeLeft((data.duration || 60) * 60)
            setLoading(false)
        } catch (e) { console.error('Failed to load', e) }
    }, [examId])

    useEffect(() => { fetchExam() }, [fetchExam])

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) return
        const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(t)
    }, [timeLeft])

    // Anti-Cheating (Tab Switch)
    useEffect(() => {
        const handleBlur = () => setTabSwitches(prev => prev + 1)
        window.addEventListener('blur', handleBlur)
        return () => window.removeEventListener('blur', handleBlur)
    }, [])

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/dashboard/exams/online/runtime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SUBMIT_EXAM',
                    payload: { attemptId, examId, answers }
                })
            })
            if (res.ok) router.push(`/dashboard/exams/online/${examId}/result`)
        } finally { setSubmitting(false) }
    }

    if (loading) return (
        <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 color={P.brand} className="spin" size={48} />
            <div style={{ color: P.brand, marginTop: 20, fontWeight: 900 }}>ENCRYPTING SESSION...</div>
        </div>
    )

    const q = questions[currentIdx]

    return (
        <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: P.light, fontSmooth: 'antialiased' }}>
            {/* Header */}
            <header style={{ padding: '20px 40px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: P.brandBg, color: P.brand, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>LIVE EXAM VECTOR</div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{exam?.title || 'Online Assessment'}</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    {tabSwitches > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.error, fontSize: 12, fontWeight: 800 }}><Shield size={16}/> INTEGRITY WARNING: {tabSwitches}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: timeLeft < 300 ? P.error + '20' : P.card, padding: '8px 20px', borderRadius: 12, border: '1px solid ' + (timeLeft < 300 ? P.error + '40' : P.border) }}>
                        <Clock size={18} color={timeLeft < 300 ? P.error : P.brand} />
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: timeLeft < 300 ? P.error : P.light }}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                    <button onClick={handleSubmit} disabled={submitting} style={{ background: P.brand, color: P.bg, border: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />} Finish Exam
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 1, background: P.border }}>
                <div style={{ background: P.bg, padding: 60, display: 'flex', flexDirection: 'column', gap: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ background: P.card, border: '1px solid ' + P.border, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>QUESTION {currentIdx + 1} OF {questions.length}</span>
                    </div>

                    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4 }}>{q?.details?.question_text.en}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Object.entries(q?.details?.options || {}).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => setAnswers({ ...answers, [q.question_id]: key })}
                                style={{
                                    textAlign: 'left', padding: '24px 32px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, transition: 'all 0.2s',
                                    background: answers[q.question_id] === key ? P.brand + '20' : P.card,
                                    border: '1px solid ' + (answers[q.question_id] === key ? P.brand : P.border),
                                    color: answers[q.question_id] === key ? P.brand : P.light
                                }}
                            >
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: answers[q.question_id] === key ? P.brand : P.bg, color: answers[q.question_id] === key ? P.bg : P.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>{key}</div>
                                <div style={{ fontSize: 18, fontWeight: 600 }}>{val as string}</div>
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} style={{ padding: '16px 32px', borderRadius: 16, border: '1px solid ' + P.border, color: P.text, background: 'none', fontWeight: 800, cursor: 'pointer' }}>Previous</button>
                        <button onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))} style={{ padding: '16px 40px', borderRadius: 16, background: P.card, border: '1px solid ' + P.border, color: P.light, fontWeight: 800, cursor: 'pointer' }}>Next Question <ChevronRight size={18}/></button>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <div style={{ background: P.bg, padding: 32, overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 900, color: P.text, textTransform: 'uppercase' }}>Navigation Matrix</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIdx(i)}
                                style={{
                                    height: 48, borderRadius: 12, border: '1px solid ' + (currentIdx === i ? P.brand : P.border), cursor: 'pointer', fontSize: 14, fontWeight: 900, transition: 'all 0.2s',
                                    background: currentIdx === i ? P.brand : (answers[questions[i].question_id] ? P.success + '20' : 'transparent'),
                                    color: currentIdx === i ? P.bg : (answers[questions[i].question_id] ? P.success : P.text)
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
