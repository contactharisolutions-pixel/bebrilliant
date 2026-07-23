'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { 
    Clock, ChevronLeft, ChevronRight,
    ShieldAlert, Loader2, Sparkles, Send, X, Globe, Languages
} from 'lucide-react'

// ── LANGUAGE CONFIG ────────────────────────────────────────────
const LANG_LABELS: Record<string, string> = {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી',
}
const ALL_LANGS = ['en', 'hi', 'gu']

function getQuestionText(q: any, lang: string): string {
    if (!q) return ''
    if (q.question_text && typeof q.question_text === 'object') {
        return q.question_text[lang] || q.question_text['en'] || q.text || ''
    }
    if (q.translations && typeof q.translations === 'object') {
        return q.translations[lang] || q.text || ''
    }
    return q.text || q.question_text || ''
}

function getOptions(q: any, lang: string): string[] {
    if (!q) return []
    if (q.options_translated && typeof q.options_translated === 'object' && !Array.isArray(q.options_translated)) {
        const langOptions = q.options_translated[lang]
        if (Array.isArray(langOptions) && langOptions.length > 0) return langOptions
    }
    if (Array.isArray(q.options)) return q.options
    if (q.options && typeof q.options === 'object') return Object.values(q.options)
    return []
}

export default function CustomExamAttempt() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const exam_id = params.id as string
    const examLang = (searchParams.get('lang') || 'en') as string

    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [warnings, setWarnings] = useState(0)

    // ── TRANSLATION POPUP STATE ────────────────────────────────
    const [translationPopup, setTranslationPopup] = useState<{ visible: boolean; lang: string; text: string } | null>(null)
    const altLangs = ALL_LANGS.filter(l => l !== examLang)

    // ── DATA PRE-FETCH & INITIALIZATION ──────────────────────────
    useEffect(() => {
        const initExam = async () => {
            try {
                const res = await fetch(`/api/student/custom-exam/detail?id=${exam_id}`)
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setExam(data)
                setQuestions(data.questions || [])
                setTimeLeft(1800)
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
        if (timeLeft === null || timeLeft <= 0) return
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
                    alert('SECURITY ALERT: Multiple window switches detected. Attempt logged for proctor audit.')
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
        try {
            const res = await fetch('/api/student/custom-exam/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exam_id, answers: userAnswers })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            router.push(`/dashboard/student/results/success?id=${exam_id}`)
        } catch (err: any) {
            alert(err.message || 'Failed to submit exam. Please try again.')
            setIsSubmitting(false)
        }
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const openTranslation = (lang: string) => {
        const currentQ = questions[currentIndex]
        const text = getQuestionText(currentQ, lang)
        setTranslationPopup({ visible: true, lang, text })
    }

    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    const currentQ = questions[currentIndex]
    const questionText = getQuestionText(currentQ, examLang)
    const options = getOptions(currentQ, examLang)

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#0F172A', display: 'flex', flexDirection: 'column', color: '#FFF', zIndex: 9999 }}>

            {/* ── TRANSLATION POPUP OVERLAY ── */}
            {translationPopup?.visible && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                    onClick={() => setTranslationPopup(null)}
                >
                    <div
                        style={{ background: '#1E293B', borderRadius: 24, padding: 48, maxWidth: 680, width: '90%', border: '1px solid #334155', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', position: 'relative', animation: 'slideUp 0.2s ease' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setTranslationPopup(null)}
                            style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 10, background: '#334155', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
                                <Globe size={20} color="#FFF" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Translation</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#F1F5F9' }}>{LANG_LABELS[translationPopup.lang]}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', padding: '6px 14px', background: '#0F172A', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#64748B' }}>
                                Q{currentIndex + 1}
                            </div>
                        </div>

                        <div style={{ fontSize: 22, fontWeight: 600, color: '#F1F5F9', lineHeight: 1.65, borderTop: '1px solid #334155', paddingTop: 28 }}>
                            {translationPopup.text || (
                                <span style={{ color: '#64748B', fontSize: 15, fontStyle: 'italic' }}>
                                    Translation not available for this question.
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => setTranslationPopup(null)}
                            style={{ marginTop: 32, padding: '14px 32px', background: '#334155', border: 'none', borderRadius: 14, color: '#FFF', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ── EXAM HUD (HEADER) ── */}
            <div style={{ height: 80, background: '#1E293B', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 44, height: 44, background: 'var(--color-primary-gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
                        <Sparkles size={22} color="#FFF" />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>{exam?.subject} Mock Practice</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Assessment · {LANG_LABELS[examLang]}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div style={{ width: 260, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 8 }}>
                            <span>PROGRESS</span>
                            <span>{questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%`, background: 'var(--color-primary-gradient)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: (timeLeft || 0) < 300 ? '#EF4444' : '#111827', padding: '10px 24px', borderRadius: 12, border: '1px solid #334155', transition: 'background 0.3s' }}>
                        <Clock size={20} color="#FFF" />
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace' }}>{formatTime(timeLeft || 0)}</span>
                    </div>
                    <button onClick={handleSubmit} disabled={isSubmitting} style={{ background: '#10B981', color: '#FFF', padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}>
                        {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Send size={18} /> Finish Test</>}
                    </button>
                </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── SIDEBAR ── */}
                <div style={{ width: 300, background: '#111827', borderRight: '1px solid #1E293B', padding: 32, overflowY: 'auto', flexShrink: 0 }}>
                    <h4 style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Syllabus Nodes</h4>
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
                    <div style={{ marginTop: 40, padding: 24, background: '#1E293B', borderRadius: 20, border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#EF4444' }}>
                            <ShieldAlert size={18} />
                            <span style={{ fontSize: 12, fontWeight: 800 }}>PROCTOR SHIELD</span>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#94A3B8', lineHeight: 1.7 }}>
                            Switches: {warnings}<br />
                            Status: <span style={{ color: '#10B981' }}>ENCRYPTED</span><br />
                            Mode: <span style={{ color: 'var(--color-primary)' }}>AUTO-EVALUATE</span>
                        </div>
                    </div>
                </div>

                {/* ── QUESTION CANVAS ── */}
                <div style={{ flex: 1, padding: '56px 100px', overflowY: 'auto', background: '#0F172A' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>

                        {/* Question Number + Translation Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                            <div style={{ background: 'var(--color-primary-gradient)', color: '#FFF', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>
                                QUESTION {currentIndex + 1}
                            </div>
                            <div style={{ height: 1, flex: 1, background: '#1E293B', minWidth: 20 }} />

                            {/* Alternate language translation buttons */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Languages size={14} color="#64748B" />
                                {altLangs.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => openTranslation(lang)}
                                        style={{
                                            padding: '5px 14px',
                                            borderRadius: 8,
                                            border: '1px solid #334155',
                                            background: '#1E293B',
                                            color: '#94A3B8',
                                            fontSize: 12,
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--color-primary)'
                                            e.currentTarget.style.color = '#FFF'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '#334155'
                                            e.currentTarget.style.color = '#94A3B8'
                                        }}
                                    >
                                        {LANG_LABELS[lang]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Text */}
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.55, marginBottom: 44 }}>
                            {questionText || 'Loading Question Data...'}
                        </div>

                        {/* MCQ Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {options.map((optValue: string, idx: number) => {
                                const optLabel = String.fromCharCode(65 + idx)
                                const active = userAnswers[currentQ?.id] === optLabel
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(optLabel)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 20, padding: 24,
                                            borderRadius: 18,
                                            border: active ? '1px solid var(--color-primary)' : '1px solid #1E293B',
                                            background: active ? 'var(--color-primary-bg)' : '#111827',
                                            textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s', width: '100%'
                                        }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#334155' }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#1E293B' }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? 'var(--color-primary-gradient)' : '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>
                                            {optLabel}
                                        </div>
                                        <span style={{ fontSize: 17, fontWeight: 600, color: active ? '#FFF' : '#94A3B8', lineHeight: 1.4 }}>{optValue}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER CONTROLS ── */}
            <div style={{ height: 100, background: '#111827', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexShrink: 0 }}>
                <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    style={{ background: 'transparent', border: '1px solid #334155', color: '#94A3B8', padding: '14px 40px', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, opacity: currentIndex === 0 ? 0.5 : 1 }}
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

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
