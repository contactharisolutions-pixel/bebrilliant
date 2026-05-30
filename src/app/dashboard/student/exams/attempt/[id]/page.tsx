'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    Clock, ChevronLeft, ChevronRight, AlertCircle, 
    CheckCircle, ShieldAlert, Loader2, Sparkles, Send
} from 'lucide-react'
export default function StudentExamAttempt() {
    const params = useParams()
    const router = useRouter()
    const exam_id = params.id as string
    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [attempt, setAttempt] = useState<any>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [warnings, setWarnings] = useState(0)
    // ── DATA PRE-FETCH & INITIALIZATION ──────────────────────────
    useEffect(() => {
        const initExam = async () => {
            try {
                // 1. Fetch Exam Detail
                const exRes = await fetch(`/api/dashboard/exams/detail?id=${exam_id}`)
                const exData = await exRes.json()
                setExam(exData)
                // 2. Start/Fetch Attempt (Server-side)
                const startRes = await fetch('/api/student/exam/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exam_id })
                })
                const startData = await startRes.json()
                if (startData.error) throw new Error(startData.error)
                setAttempt(startData.attempt)
                // 3. Setup Questions (Mocked sequence for high-fidelity UI)
                // In production, we fetch from /api/student/exam/questions
                // I'll simulate a 10-question sequence
                setQuestions(exData.questions || [])
                // 4. Timer Setup
                const startT = new Date(startData.attempt.start_time).getTime()
                const durationMs = exData.duration * 60 * 1000
                const endT = startT + durationMs
                const now = Date.now()
                setTimeLeft(Math.max(0, Math.floor((endT - now) / 1000)))
            } catch (err: any) {
                alert(err.message)
                router.back()
            } finally {
                setLoading(false)
            }
        }
        initExam()
    }, [exam_id, router])
    // ── TIMER LOGIC ──────────────────────────────────────────────
    useEffect(() => {
        if (!timeLeft || timeLeft <= 0) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(timer)
                    handleAutoSubmit()
                    return 0
                }
                return prev !== null ? prev - 1 : null
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [timeLeft])
    // ── ANTI-CHEAT SENSOR ─────────────────────────────────────────
    useEffect(() => {
        const handleBlur = () => {
            setWarnings(prev => {
                const next = prev + 1
                if (next >= 3) {
                    alert('SECURITY ALERT: Multiple security violations detected. Your attempt has been logged for review.')
                }
                return next
            })
        }
        window.addEventListener('blur', handleBlur)
        return () => window.removeEventListener('blur', handleBlur)
    }, [])
    const handleAnswer = (choice: any) => {
        const q_id = questions[currentIndex].id
        setUserAnswers(prev => ({ ...prev, [q_id]: choice }))
    }
    const handleAutoSubmit = () => {
        if (isSubmitting) return
        handleSubmit()
    }
    const handleSubmit = async () => {
        setIsSubmitting(true)
        // Simulate submit API latency
        setTimeout(() => {
            router.push(`/dashboard/student/results/success?id=${exam_id}`)
        }, 2000)
    }
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    if (loading) return <div style={{ padding: 100, textAlign: 'center' }}><Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} /></div>
    const currentQ = questions[currentIndex]
    return (
        <div style={{ position: 'fixed', inset: 0, background: '#0F172A', display: 'flex', flexDirection: 'column', color: '#FFF' }}>
            {/* ── EXAM HUD (HEADER) ── */}
            <div style={{ height: 80, background: '#1E293B', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 44, height: 44, background: 'var(--color-primary-gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
                        <Sparkles size={22} color="#FFF" />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>{exam?.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Examination</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                    {/* PROGRESS BAR */}
                     <div style={{ width: 300, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 8 }}>
                             <span>TEST PROGRESS</span>
                            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                        </div>
                        <div style={{ height: 6, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${((currentIndex + 1) / questions.length) * 100}%`, background: 'var(--color-primary-gradient)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                    </div>
                    {/* TIMER CLOCK */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: (timeLeft || 0) < 300 ? '#EF4444' : '#111827', padding: '10px 24px', borderRadius: 12, border: '1px solid #334155' }}>
                        <Clock size={20} color="#FFF" />
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace' }}>{formatTime(timeLeft || 0)}</span>
                    </div>
                     <button onClick={handleSubmit} disabled={isSubmitting} style={{ background: '#10B981', color: '#FFF', padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}>
                        {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Send size={18} /> Finish Exam</>}
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* ── QUESTION SELECTOR (SIDEBAR) ── */}
                 <div style={{ width: 320, background: '#111827', borderRight: '1px solid #1E293B', padding: 32, overflowY: 'auto' }}>
                     <h4 style={{ margin: '0 0 24px', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Question Palette</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                        {questions.map((q, i) => {
                            const answered = !!userAnswers[q.id]
                            const active = i === currentIndex
                            return (
                                 <button key={q.id} onClick={() => setCurrentIndex(i)} style={{
                                    width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
                                    background: active ? 'var(--color-primary-gradient)' : answered ? '#1E293B' : '#0F172A',
                                    border: answered ? '1px solid #10B981' : '1px solid #334155',
                                    color: active ? '#FFF' : answered ? '#10B981' : '#64748B',
                                    fontSize: 14, fontWeight: 900, transition: 'all 0.1s'
                                }}>
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>
                     <div style={{ marginTop: 60, padding: 24, background: '#1E293B', borderRadius: 20, border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#EF4444' }}>
                           <ShieldAlert size={18} />
                            <span style={{ fontSize: 12, fontWeight: 800 }}>SECURITY MONITOR</span>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#94A3B8', lineHeight: 1.6 }}>
                             Security Warnings: {warnings}<br/>
                            Status: <span style={{ color: '#10B981' }}>SECURE</span><br/>
                            Auth: <span style={{ color: 'var(--color-primary)' }}>AUTHENTICATED</span>
                        </div>
                    </div>
                </div>
                {/* ── QUESTION CANVAS (MAIN) ── */}
                <div style={{ flex: 1, padding: '60px 100px', overflowY: 'auto', background: '#0F172A' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                            <div style={{ background: 'var(--color-primary-gradient)', color: '#FFF', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>QUESTION {currentIndex + 1}</div>
                            <div style={{ height: 1, flex: 1, background: '#1E293B' }} />
                        </div>
                         <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.5, marginBottom: 44 }}>
                            {currentQ?.text || 'Loading Question Data...'}
                        </div>
                        {/* MCQ OPTIONS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {(currentQ?.options || []).map((optValue: string, idx: number) => {
                                const optLabel = String.fromCharCode(65 + idx) // A, B, C, D...
                                const active = userAnswers[currentQ?.id] === optLabel
                                return (
                                     <button 
                                        key={idx}
                                        onClick={() => handleAnswer(optLabel)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 20, padding: 24, borderRadius: 18, border: active ? '1px solid var(--color-primary)' : '1px solid #1E293B',
                                            background: active ? 'var(--color-primary-bg)' : '#111827',
                                            textAlign: 'left', cursor: 'pointer', transition: 'all 0.1s'
                                        }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#334155'; }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#1E293B'; }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? 'var(--color-primary-gradient)' : '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 900 }}>
                                            {optLabel}
                                        </div>
                                        <span style={{ fontSize: 17, fontWeight: 600, color: active ? '#FFF' : '#94A3B8' }}>{optValue}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {/* ── FOOTER CONTROLS ── */}
            <div style={{ height: 100, background: '#111827', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                 <button 
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    style={{ background: 'transparent', border: '1px solid #334155', color: '#94A3B8', padding: '14px 40px', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                     <ChevronLeft size={20} /> PREVIOUS
                </button>
                     <button 
                        onClick={() => {
                            if (currentIndex === questions.length - 1) handleSubmit()
                            else setCurrentIndex(prev => prev + 1)
                        }}
                        style={{ background: '#FFF', border: 'none', color: '#0F172A', padding: '14px 40px', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                         {currentIndex === questions.length - 1 ? 'FINISH & SUBMIT' : 'NEXT QUESTION'} <ChevronRight size={20} />
                    </button>
            </div>
        </div>
    )
}
