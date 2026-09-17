'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    Clock, Shield, AlertCircle, CheckCircle, ChevronRight, 
    Send, Loader2, GraduationCap, Users, Calendar, ArrowRight, 
    BookOpen, Sparkles, RefreshCw
} from 'lucide-react'

// —— PALETTE ————————————————————————————————————
const P = {
    bg: '#0F172A', card: '#1E293B', border: '#334155',
    brand: '#38BDF8', brandBg: '#38BDF815',
    text: '#94A3B8', light: '#F8FAFC',
    success: '#10B981', error: '#EF4444', warning: '#F59E0B'
}

const STANDARD_SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D', 'Section E']

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
    const [startingAttempt, setStartingAttempt] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Student verification fields
    const [studentName, setStudentName] = useState('')
    const [rollNo, setRollNo] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSection, setSelectedSection] = useState('Section A')

    const fetchExam = useCallback(async () => {
        setLoading(true)
        setErrorMsg(null)
        try {
            const qRes = await fetch(`/api/dashboard/exams/online?action=GET_QUESTIONS&id=${examId}`)
            const data = await qRes.json()
            if (!qRes.ok || data.error) {
                setErrorMsg(data.error || 'Failed to load exam details.')
                setLoading(false)
                return
            }
            setQuestions(data.questions || [])
            setExam(data.exam || null)

            // Auto-detect default class from exam target or slots
            const slots = data.exam?.blueprint?.schedule_slots || []
            const firstSlotClass = slots.find((s: any) => s.class_name && s.class_name !== 'All Classes')?.class_name
            const defaultCls = firstSlotClass || data.exam?.class || data.exam?.target_class || 'Class 10'
            setSelectedClass(defaultCls)

            const firstSlotSec = slots.find((s: any) => s.section_name && s.section_name !== 'All Sections')?.section_name
            if (firstSlotSec) setSelectedSection(firstSlotSec)

            setLoading(false)
        } catch (e: any) {
            setErrorMsg(e.message || 'Failed to connect to exam server.')
            setLoading(false)
        }
    }, [examId])

    useEffect(() => { fetchExam() }, [fetchExam])

    // Timer Logic
    useEffect(() => {
        if (!attemptId || timeLeft <= 0) return
        const t = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(t)
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(t)
    }, [attemptId, timeLeft])

    // Anti-Cheating (Tab Switch)
    useEffect(() => {
        if (!attemptId) return
        const handleBlur = () => setTabSwitches(prev => prev + 1)
        window.addEventListener('blur', handleBlur)
        return () => window.removeEventListener('blur', handleBlur)
    }, [attemptId])

    const handleStartAttempt = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setStartingAttempt(true)
        setErrorMsg(null)

        try {
            const res = await fetch('/api/dashboard/exams/online/runtime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'START_ATTEMPT',
                    payload: {
                        examId,
                        studentId: 'current',
                        studentName: studentName.trim() || undefined,
                        rollNo: rollNo.trim() || undefined,
                        studentClass: selectedClass,
                        studentSection: selectedSection
                    }
                })
            })
            const data = await res.json()

            if (!res.ok) {
                setErrorMsg(data.error || 'This exam is not available right now. Please check your scheduled slot.')
                setStartingAttempt(false)
                return
            }

            setAttemptId(data.id)
            setTimeLeft((exam?.duration || 60) * 60)
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to start exam. Please try again.')
        } finally {
            setStartingAttempt(false)
        }
    }

    const handleSubmit = async () => {
        if (!attemptId) return
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
            else {
                alert('Failed to submit exam. Please verify your connection.')
            }
        } finally { setSubmitting(false) }
    }

    if (loading) return (
        <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 color={P.brand} className="spin" size={48} />
            <div style={{ color: P.brand, marginTop: 20, fontWeight: 900, letterSpacing: '0.05em' }}>VERIFYING EXAM SCHEDULE...</div>
        </div>
    )

    // Schedule slots from exam blueprint
    const scheduleSlots: any[] = exam?.blueprint?.schedule_slots || []
    const now = new Date()

    const formatSlotDateTime = (dtStr: string) => {
        try {
            return new Date(dtStr).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        } catch {
            return dtStr
        }
    }

    const getSlotStatus = (s: any) => {
        if (!s.start || !s.end) return { label: 'Scheduled', color: P.text, bg: 'rgba(255,255,255,0.05)' }
        const st = new Date(s.start)
        const en = new Date(s.end)
        if (now >= st && now <= en) return { label: 'Live Now', color: P.success, bg: 'rgba(16, 185, 129, 0.15)' }
        if (now < st) return { label: 'Upcoming', color: P.brand, bg: 'rgba(56, 189, 248, 0.15)' }
        return { label: 'Closed', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' }
    }

    // Unique classes from slots
    const availableSlotClasses = Array.from(new Set([
        selectedClass,
        'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6',
        ...scheduleSlots.map(s => s.class_name).filter(Boolean)
    ])).filter(c => c !== 'All Classes')

    // ── ENTRY & VERIFICATION SCREEN (Before attempt starts) ─────────────
    if (!attemptId) {
        return (
            <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: P.light, padding: '40px 20px', alignItems: 'center' }}>
                <div style={{ maxWidth: 780, width: '100%' }}>
                    {/* Brand header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, border: '1px solid ' + P.brand + '40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GraduationCap size={24} color={P.brand} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.brand, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Online Assessment Portal</div>
                                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: P.light }}>{exam?.title || 'Online Examination'}</h1>
                            </div>
                        </div>
                        <button onClick={() => router.push('/dashboard/exams/online')} style={{ background: 'transparent', border: '1px solid ' + P.border, color: P.text, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                            Exit
                        </button>
                    </div>

                    {/* Exam Overview Strip */}
                    <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: '18px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: P.text, textTransform: 'uppercase' }}>Duration</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: P.light, marginTop: 4 }}>{exam?.duration || 60} Minutes</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: P.text, textTransform: 'uppercase' }}>Total Marks</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: P.light, marginTop: 4 }}>{exam?.total_marks || 100} Marks</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: P.text, textTransform: 'uppercase' }}>Questions</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: P.light, marginTop: 4 }}>{questions.length} Questions</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: P.text, textTransform: 'uppercase' }}>Schedule Type</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: scheduleSlots.length > 0 ? P.brand : P.success, marginTop: 4 }}>
                                {scheduleSlots.length > 0 ? `${scheduleSlots.length} Section Slots` : 'Open Window'}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Slots Timeline Notice */}
                    {scheduleSlots.length > 0 && (
                        <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid ' + P.border, borderRadius: 16, padding: 20, marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 900, color: P.light }}>
                                    <Calendar size={16} color={P.brand} />
                                    Exam Schedule by Class & Section
                                </div>
                                <span style={{ fontSize: 11, color: P.text, fontWeight: 600 }}>Strict Section Isolation</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {scheduleSlots.map((s, idx) => {
                                    const st = getSlotStatus(s)
                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.5)', border: '1px solid ' + (st.label === 'Live Now' ? P.success + '40' : P.border) }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 11, fontWeight: 900, background: P.card, padding: '3px 8px', borderRadius: 6, color: P.light }}>Slot {idx + 1}</span>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: P.brand }}>{s.class_name || 'All Classes'} · {s.section_name || 'All Sections'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 12, color: P.text, fontFamily: 'monospace' }}>
                                                    {s.start ? formatSlotDateTime(s.start) : '--'} → {s.end ? formatSlotDateTime(s.end) : '--'}
                                                </span>
                                                {s.max_attempts && (
                                                    <span style={{ fontSize: 11, color: P.text, background: P.card, padding: '2px 8px', borderRadius: 6 }}>
                                                        Max {s.max_attempts} seats
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 20 }}>
                                                    {st.label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Rejection / Schedule Error Box */}
                    {errorMsg && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid ' + P.error + '50', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <AlertCircle size={22} color={P.error} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 900, color: P.error, marginBottom: 4 }}>Access Restricted: Schedule Slot Notice</div>
                                <div style={{ fontSize: 13, color: P.light, lineHeight: 1.5 }}>{errorMsg}</div>
                            </div>
                            <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: P.text, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                        </div>
                    )}

                    {/* Student Verification Card */}
                    <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 32, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <Sparkles size={20} color={P.brand} />
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.light }}>Student Verification</h2>
                        </div>
                        <p style={{ margin: '0 0 24px', fontSize: 13, color: P.text }}>
                            Please confirm your Class and Section to enter your scheduled exam slot.
                        </p>

                        <form onSubmit={handleStartAttempt} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: P.text, marginBottom: 6 }}>
                                        Student Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rahul Sharma"
                                        value={studentName}
                                        onChange={e => setStudentName(e.target.value)}
                                        style={{ width: '100%', boxSizing: 'border-box', background: P.bg, border: '1px solid ' + P.border, color: P.light, padding: '12px 14px', borderRadius: 10, fontSize: 13 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: P.text, marginBottom: 6 }}>
                                        Roll Number (optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 104"
                                        value={rollNo}
                                        onChange={e => setRollNo(e.target.value)}
                                        style={{ width: '100%', boxSizing: 'border-box', background: P.bg, border: '1px solid ' + P.border, color: P.light, padding: '12px 14px', borderRadius: 10, fontSize: 13 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: P.text, marginBottom: 6 }}>
                                        Assigned Class *
                                    </label>
                                    <select
                                        value={selectedClass}
                                        onChange={e => setSelectedClass(e.target.value)}
                                        required
                                        style={{ width: '100%', boxSizing: 'border-box', background: P.bg, border: '1px solid ' + P.border, color: P.light, padding: '12px 14px', borderRadius: 10, fontSize: 13 }}
                                    >
                                        {availableSlotClasses.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: P.text, marginBottom: 6 }}>
                                        Assigned Section *
                                    </label>
                                    <select
                                        value={selectedSection}
                                        onChange={e => setSelectedSection(e.target.value)}
                                        required
                                        style={{ width: '100%', boxSizing: 'border-box', background: P.bg, border: '1px solid ' + P.border, color: P.light, padding: '12px 14px', borderRadius: 10, fontSize: 13 }}
                                    >
                                        {STANDARD_SECTIONS.map(sec => (
                                            <option key={sec} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Integrity Notice */}
                            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid ' + P.border, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Shield size={18} color={P.brand} style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: P.text, lineHeight: 1.4 }}>
                                    Each section is isolated to its assigned slot. Only students whose section matches an active slot will be permitted to start.
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                                <button
                                    type="button"
                                    onClick={fetchExam}
                                    style={{ background: 'transparent', border: '1px solid ' + P.border, color: P.text, padding: '12px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <RefreshCw size={14} /> Refresh Schedule
                                </button>
                                <button
                                    type="submit"
                                    disabled={startingAttempt}
                                    style={{ background: P.brand, color: P.bg, border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)' }}
                                >
                                    {startingAttempt ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
                                    {startingAttempt ? 'Verifying Slot...' : 'Start Exam Attempt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // ── LIVE EXAM PLAYER (Once attempt is started) ─────────────────────
    const q = questions[currentIdx]
    const qId = q?.question_id || q?.id
    const qText = q?.text || q?.details?.question_text?.en || (typeof q?.details?.question_text === 'string' ? q?.details?.question_text : `Question ${currentIdx + 1}`)

    // Normalize options into list
    const rawOptions = q?.options || q?.details?.options || []
    let renderedOptions: { key: string; label: string }[] = []
    if (Array.isArray(rawOptions)) {
        renderedOptions = rawOptions.map((opt, idx) => ({
            key: String.fromCharCode(65 + idx),
            label: typeof opt === 'string' ? opt : ((opt as any)?.text || (opt as any)?.label || JSON.stringify(opt))
        }))
    } else if (typeof rawOptions === 'object' && rawOptions !== null) {
        renderedOptions = Object.entries(rawOptions).map(([k, v]) => ({
            key: k,
            label: typeof v === 'string' ? v : ((v as any)?.text || String(v))
        }))
    }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: P.light, fontSmooth: 'antialiased' }}>
            {/* Header */}
            <header style={{ padding: '16px 36px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ background: P.brandBg, color: P.brand, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>LIVE EXAM</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{exam?.title || 'Online Assessment'}</h1>
                        <div style={{ fontSize: 11, color: P.text, fontWeight: 600 }}>
                            {selectedClass} · {selectedSection} {studentName ? `· ${studentName}` : ''}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {tabSwitches > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.error, fontSize: 12, fontWeight: 800 }}>
                            <Shield size={16}/> INTEGRITY WARNING: {tabSwitches}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: timeLeft < 300 ? P.error + '20' : P.card, padding: '8px 18px', borderRadius: 12, border: '1px solid ' + (timeLeft < 300 ? P.error + '40' : P.border) }}>
                        <Clock size={18} color={timeLeft < 300 ? P.error : P.brand} />
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: timeLeft < 300 ? P.error : P.light }}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    </div>
                    <button onClick={handleSubmit} disabled={submitting} style={{ background: P.brand, color: P.bg, border: 'none', padding: '10px 22px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />} Submit Exam
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 1, background: P.border }}>
                <div style={{ background: P.bg, padding: '48px 60px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ background: P.card, border: '1px solid ' + P.border, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>
                            QUESTION {currentIdx + 1} OF {questions.length}
                        </span>
                        {q?.marks && (
                            <span style={{ fontSize: 11, color: P.text, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8 }}>
                                +{q.marks} Marks {q.negative_marks ? `(${q.negative_marks} neg)` : ''}
                            </span>
                        )}
                    </div>

                    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.45, color: P.light }}>
                        {qText}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {renderedOptions.map(({ key, label }) => {
                            const isSelected = answers[qId] === key
                            return (
                                <button
                                    key={key}
                                    onClick={() => setAnswers({ ...answers, [qId]: key })}
                                    style={{
                                        textAlign: 'left', padding: '20px 24px', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s',
                                        background: isSelected ? P.brand + '20' : P.card,
                                        border: '1px solid ' + (isSelected ? P.brand : P.border),
                                        color: isSelected ? P.brand : P.light
                                    }}
                                >
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? P.brand : P.bg, color: isSelected ? P.bg : P.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
                                        {key}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
                        <button 
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} 
                            disabled={currentIdx === 0}
                            style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid ' + P.border, color: currentIdx === 0 ? '#475569' : P.text, background: 'none', fontWeight: 800, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))} 
                            disabled={currentIdx === questions.length - 1}
                            style={{ padding: '14px 32px', borderRadius: 12, background: P.card, border: '1px solid ' + P.border, color: currentIdx === questions.length - 1 ? '#475569' : P.light, fontWeight: 800, cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            Next Question <ChevronRight size={18}/>
                        </button>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <div style={{ background: P.bg, padding: 28, overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 900, color: P.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Questions Palette
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        {questions.map((ques, i) => {
                            const quesId = ques.question_id || ques.id
                            const isAnswered = Boolean(answers[quesId])
                            const isCurrent = currentIdx === i
                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIdx(i)}
                                    style={{
                                        height: 44, borderRadius: 10, border: '1px solid ' + (isCurrent ? P.brand : P.border), cursor: 'pointer', fontSize: 13, fontWeight: 900, transition: 'all 0.15s',
                                        background: isCurrent ? P.brand : (isAnswered ? P.success + '20' : 'transparent'),
                                        color: isCurrent ? P.bg : (isAnswered ? P.success : P.text)
                                    }}
                                >
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid ' + P.border, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: P.success + '30', border: '1px solid ' + P.success }}></div>
                            <span style={{ color: P.text }}>Answered ({Object.keys(answers).length})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'transparent', border: '1px solid ' + P.border }}></div>
                            <span style={{ color: P.text }}>Unanswered ({questions.length - Object.keys(answers).length})</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

