'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    Clock, Shield, AlertCircle, CheckCircle, ChevronRight, 
    Send, Loader2, GraduationCap, Users, Calendar, ArrowRight, 
    BookOpen, Sparkles, RefreshCw
} from 'lucide-react'

// —— CLEAN ENTERPRISE LIGHT PALETTE ————————————————————————————
const P = {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    brand: '#0284C7',
    brandHover: '#0369A1',
    brandBg: '#F0F9FF',
    brandBorder: '#BAE6FD',
    text: '#64748B',
    textDark: '#0F172A',
    textMuted: '#94A3B8',
    success: '#10B981',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    successText: '#047857',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    errorText: '#B91C1C',
    warning: '#F59E0B',
    warningBg: '#FFFBEB'
}

const STANDARD_SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D', 'Section E']

export default function OnlinePlayer() {
    const params = useParams()
    const router = useRouter()
    const examId = (params?.id || '') as string

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
        if (!examId) return
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
            <div style={{ color: P.brand, marginTop: 20, fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>VERIFYING EXAM SCHEDULE...</div>
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
        if (!s.start || !s.end) return { label: 'Scheduled', color: P.text, bg: P.borderLight, border: P.border }
        const st = new Date(s.start)
        const en = new Date(s.end)
        if (now >= st && now <= en) return { label: 'Live Now', color: P.successText, bg: P.successBg, border: P.successBorder }
        if (now < st) return { label: 'Upcoming', color: P.brand, bg: P.brandBg, border: P.brandBorder }
        return { label: 'Closed', color: P.textMuted, bg: P.borderLight, border: P.border }
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
            <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: P.textDark, padding: '40px 20px', alignItems: 'center' }}>
                <div style={{ maxWidth: 780, width: '100%' }}>
                    {/* Brand header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: P.brandBg, border: '1px solid ' + P.brandBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GraduationCap size={26} color={P.brand} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: P.brand, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Online Assessment Portal</div>
                                <h1 style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 900, color: P.textDark }}>{exam?.title || 'Online Examination'}</h1>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.push('/dashboard/exams/online')} 
                            style={{ background: P.card, border: '1px solid ' + P.border, color: P.text, padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}
                        >
                            Exit
                        </button>
                    </div>

                    {/* Exam Overview Strip */}
                    <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 18, padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.textDark, marginTop: 4 }}>{exam?.duration || 60} Minutes</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Marks</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.textDark, marginTop: 4 }}>{exam?.total_marks || 100} Marks</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.textDark, marginTop: 4 }}>{questions.length} Questions</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule Type</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: scheduleSlots.length > 0 ? P.brand : P.success, marginTop: 4 }}>
                                {scheduleSlots.length > 0 ? `${scheduleSlots.length} Section Slots` : 'Open Window'}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Slots Timeline Notice */}
                    {scheduleSlots.length > 0 && (
                        <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 18, padding: 22, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: P.textDark }}>
                                    <Calendar size={16} color={P.brand} />
                                    Exam Schedule by Class & Section
                                </div>
                                <span style={{ fontSize: 11, color: P.text, fontWeight: 600 }}>Strict Section Isolation</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {scheduleSlots.map((s, idx) => {
                                    const st = getSlotStatus(s)
                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: P.bg, border: '1px solid ' + st.border }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, background: P.card, border: '1px solid ' + P.border, padding: '3px 8px', borderRadius: 6, color: P.textDark }}>Slot {idx + 1}</span>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: P.brand }}>{s.class_name || 'All Classes'} · {s.section_name || 'All Sections'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 12, color: P.text, fontFamily: 'monospace' }}>
                                                    {s.start ? formatSlotDateTime(s.start) : '--'} → {s.end ? formatSlotDateTime(s.end) : '--'}
                                                </span>
                                                {s.max_attempts && (
                                                    <span style={{ fontSize: 11, color: P.text, background: P.card, border: '1px solid ' + P.border, padding: '2px 8px', borderRadius: 6 }}>
                                                        Max {s.max_attempts} seats
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, border: '1px solid ' + st.border, padding: '3px 10px', borderRadius: 20 }}>
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
                        <div style={{ background: P.errorBg, border: '1px solid ' + P.errorBorder, borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <AlertCircle size={22} color={P.error} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: P.errorText, marginBottom: 4 }}>Access Restricted: Schedule Slot Notice</div>
                                <div style={{ fontSize: 13, color: P.errorText, lineHeight: 1.5 }}>{errorMsg}</div>
                            </div>
                            <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: P.text, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                        </div>
                    )}

                    {/* Student Verification Card */}
                    <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 36, boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <Sparkles size={20} color={P.brand} />
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.textDark }}>Student Verification</h2>
                        </div>
                        <p style={{ margin: '0 0 24px', fontSize: 13, color: P.text }}>
                            Please confirm your Class and Section to enter your scheduled exam slot.
                        </p>

                        <form onSubmit={handleStartAttempt} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                                        style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '1px solid ' + P.border, color: P.textDark, padding: '12px 14px', borderRadius: 10, fontSize: 13, outline: 'none' }}
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
                                        style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '1px solid ' + P.border, color: P.textDark, padding: '12px 14px', borderRadius: 10, fontSize: 13, outline: 'none' }}
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
                                        style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '1px solid ' + P.border, color: P.textDark, padding: '12px 14px', borderRadius: 10, fontSize: 13, outline: 'none' }}
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
                                        style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '1px solid ' + P.border, color: P.textDark, padding: '12px 14px', borderRadius: 10, fontSize: 13, outline: 'none' }}
                                    >
                                        {STANDARD_SECTIONS.map(sec => (
                                            <option key={sec} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Integrity Notice */}
                            <div style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Shield size={18} color={P.brand} style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: P.text, lineHeight: 1.45 }}>
                                    Each section is isolated to its assigned slot. Only students whose section matches an active slot will be permitted to start.
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                                <button
                                    type="button"
                                    onClick={fetchExam}
                                    style={{ background: P.card, border: '1px solid ' + P.border, color: P.text, padding: '12px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <RefreshCw size={14} /> Refresh Schedule
                                </button>
                                <button
                                    type="submit"
                                    disabled={startingAttempt}
                                    style={{ background: P.brand, color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)' }}
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
        <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: P.textDark, fontSmooth: 'antialiased' }}>
            {/* Sticky Header */}
            <header style={{ padding: '14px 36px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ background: P.brandBg, color: P.brand, border: '1px solid ' + P.brandBorder, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>LIVE EXAM</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: P.textDark }}>{exam?.title || 'Online Assessment'}</h1>
                        <div style={{ fontSize: 11, color: P.text, fontWeight: 600 }}>
                            {selectedClass} · {selectedSection} {studentName ? `· ${studentName}` : ''}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    {tabSwitches > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.errorText, background: P.errorBg, border: '1px solid ' + P.errorBorder, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                            <Shield size={16}/> INTEGRITY WARNING: {tabSwitches}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: timeLeft < 300 ? P.errorBg : '#FFFFFF', padding: '8px 18px', borderRadius: 12, border: '1px solid ' + (timeLeft < 300 ? P.errorBorder : P.border), boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Clock size={18} color={timeLeft < 300 ? P.error : P.brand} />
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: timeLeft < 300 ? P.error : P.textDark }}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting} 
                        style={{ background: P.brand, color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)' }}
                    >
                        {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />} Submit Exam
                    </button>
                </div>
            </header>

            {/* Main Content Pane */}
            <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0 }}>
                {/* Question Area */}
                <div style={{ background: '#FFFFFF', padding: '44px 56px', display: 'flex', flexDirection: 'column', gap: 28, borderRight: '1px solid ' + P.border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ background: P.borderLight, border: '1px solid ' + P.border, color: P.textDark, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                            QUESTION {currentIdx + 1} OF {questions.length}
                        </span>
                        {(q?.sub_type || q?.details?.sub_type) && (
                            <span style={{ fontSize: 11, fontWeight: 800, color: P.brand, background: P.brandBg, border: '1px solid ' + P.brandBorder, padding: '5px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {(q?.sub_type || q?.details?.sub_type).replace(/_/g, ' ')}
                            </span>
                        )}
                        {q?.marks && (
                            <span style={{ fontSize: 11, color: P.text, background: P.bg, border: '1px solid ' + P.border, padding: '5px 10px', borderRadius: 8, fontWeight: 700 }}>
                                +{q.marks} Marks {q.negative_marks ? `(${q.negative_marks} neg)` : ''}
                            </span>
                        )}
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.55, color: P.textDark, whiteSpace: 'pre-line' }}>
                        {qText}
                    </div>

                    {renderedOptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {renderedOptions.map(({ key, label }) => {
                                const isSelected = answers[qId] === key || answers[qId] === label
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setAnswers({ ...answers, [qId]: key })}
                                        style={{
                                            textAlign: 'left', padding: '18px 22px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s',
                                            background: isSelected ? P.brandBg : '#FFFFFF',
                                            border: isSelected ? '2px solid ' + P.brand : '1px solid ' + P.border,
                                            color: isSelected ? P.brandHover : P.textDark,
                                            boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div style={{ 
                                            width: 34, height: 34, borderRadius: 10, 
                                            background: isSelected ? P.brand : P.borderLight, 
                                            color: isSelected ? '#FFFFFF' : P.textDark, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            fontSize: 14, fontWeight: 900, flexShrink: 0 
                                        }}>
                                            {key}
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, lineHeight: 1.4 }}>{label}</div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.text }}>Type your answer / response:</label>
                            <textarea
                                value={answers[qId] || ''}
                                onChange={(e) => setAnswers({ ...answers, [qId]: e.target.value })}
                                placeholder="Type your answer here..."
                                rows={6}
                                style={{
                                    width: '100%',
                                    background: '#FFFFFF',
                                    border: '1px solid ' + P.border,
                                    borderRadius: 14,
                                    padding: '16px 20px',
                                    color: P.textDark,
                                    fontSize: 15,
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28 }}>
                        <button 
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} 
                            disabled={currentIdx === 0}
                            style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid ' + P.border, color: currentIdx === 0 ? P.textMuted : P.textDark, background: P.card, fontWeight: 800, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))} 
                            disabled={currentIdx === questions.length - 1}
                            style={{ padding: '12px 28px', borderRadius: 12, background: P.brand, border: 'none', color: '#FFFFFF', fontWeight: 800, cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)' }}
                        >
                            Next Question <ChevronRight size={18}/>
                        </button>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <div style={{ background: P.bg, padding: 26, overflowY: 'auto' }}>
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
                                        height: 42, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 900, transition: 'all 0.15s',
                                        background: isCurrent ? P.brand : (isAnswered ? P.successBg : '#FFFFFF'),
                                        color: isCurrent ? '#FFFFFF' : (isAnswered ? P.successText : P.textDark),
                                        border: isCurrent ? '1px solid ' + P.brand : (isAnswered ? '1px solid ' + P.successBorder : '1px solid ' + P.border),
                                        boxShadow: isCurrent ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid ' + P.border, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: P.successBg, border: '1px solid ' + P.successBorder }}></div>
                            <span style={{ color: P.text, fontWeight: 600 }}>Answered ({Object.keys(answers).length})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: '#FFFFFF', border: '1px solid ' + P.border }}></div>
                            <span style={{ color: P.text, fontWeight: 600 }}>Unanswered ({questions.length - Object.keys(answers).length})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: P.brand, border: '1px solid ' + P.brand }}></div>
                            <span style={{ color: P.text, fontWeight: 600 }}>Current Question</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
