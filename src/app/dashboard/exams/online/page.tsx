'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ExamSyllabusPatternPicker, { BlueprintContextData } from '@/components/shared/ExamSyllabusPatternPicker'
import {
    Shield, DollarSign, CheckCircle2, Clock, Users, Search,
    Play, Share2, Copy, Check, Trash2, Edit3, Plus, ArrowRight,
    Sparkles, RefreshCw, AlertTriangle, Eye, ExternalLink,
    ChevronRight, ArrowLeft, Loader2, CheckSquare, Layers, Target,
    Sliders, Lock, FileText, HelpCircle, X, Download, BarChart2,
    TrendingUp, Monitor, AlertCircle, Calendar, BookOpen, Zap,
    Globe, Filter, ChevronDown, Award, GraduationCap
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────────────────
interface ExamItem {
    id: string
    title: string
    name: string
    total_marks: number
    duration: number
    pricing_type: 'free' | 'paid'
    price: number
    status: 'published' | 'draft' | 'closed'
    schedule_status: 'draft' | 'upcoming' | 'open' | 'closed' | 'published'
    scheduled_start?: string | null
    scheduled_end?: string | null
    passing_marks: number
    class_name: string
    subject_name: string
    is_active: boolean
    created_at: string
    instructions: string[]
    blueprint: any
    question_count: number
    total_questions: number
    attempt_count: number
    live_sessions: number
    avg_score: string
    pass_rate: string
}

interface PatternTemplate {
    id: string
    name: string
    category: string
    exam_type: string
    duration_minutes: number
    total_marks: number
    is_active: boolean
    sections?: any[]
}

interface CandidateAttempt {
    id: string
    exam_id: string
    student_id: string
    start_time: string
    end_time?: string
    score: number
    marks_obtained: number
    status: string
    ip_address: string
    device_info: string
    tab_switches: number
    rank_position?: number
    percentile_rank?: number
    exam?: { title: string }
}

interface Metrics {
    total_questions: number
    live_sessions: number
    exam_revenue: number
    integrity_score: number
    total_exams: number
    total_attempts: number
}

interface AnalyticsData {
    perExam: Array<{
        id: string
        title: string
        attempts: number
        avg_score: string
        pass_rate: string
        total_marks: number
    }>
    topPerformers: Array<{
        student_id: string
        exam_title: string
        score: number
        total_marks: number
        rank: number
        percentile: number
        status: string
    }>
    summary: {
        avgScore: string | number
        passRate: number
        totalAttempts: number
        totalPassed: number
    }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(dt: string | null | undefined) {
    if (!dt) return null
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SchedulePill({ start, end, schedStatus }: { start?: string | null; end?: string | null; schedStatus: string }) {
    const color =
        schedStatus === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        schedStatus === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
        schedStatus === 'closed' ? 'bg-slate-100 text-slate-500 border-slate-200' :
        schedStatus === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-emerald-50 text-emerald-700 border-emerald-200'

    const label =
        schedStatus === 'open' ? '🟢 Open Now' :
        schedStatus === 'upcoming' ? '🔵 Upcoming' :
        schedStatus === 'closed' ? '⚫ Closed' :
        schedStatus === 'draft' ? '🟡 Draft' :
        '🟢 Published'

    return (
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1.5 ${color}`}>
            {label}
            {start && <span className="opacity-70">· {fmtDate(start)?.split(',')[0]}</span>}
        </div>
    )
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{
            position: 'fixed', top: 24, right: 28,
            background: ok ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${ok ? '#10B98140' : '#EF444440'}`,
            borderRadius: 16, padding: '14px 22px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.12)', zIndex: 10000
        }}>
            {ok ? <CheckCircle2 size={20} color="#10B981" /> : <AlertTriangle size={20} color="#EF4444" />}
            <span style={{ fontSize: 13, fontWeight: 700, color: ok ? '#10B981' : '#EF4444' }}>{msg}</span>
            <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
                <X size={16} color={ok ? '#10B981' : '#EF4444'} />
            </button>
        </div>
    )
}

// ── SECURITY SETTINGS ────────────────────────────────────────────────────────
const DEFAULT_SECURITY = {
    strictFullscreen: true,
    maxTabSwitches: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowScientificCalc: false,
    instantResultDisclosure: true
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function OnlineExamsPage() {
    const [activeTab, setActiveTab] = useState<'roster' | 'studio' | 'patterns' | 'monitor' | 'results'>('roster')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Core data
    const [metrics, setMetrics] = useState<Metrics>({ total_questions: 0, live_sessions: 0, exam_revenue: 0, integrity_score: 100, total_exams: 0, total_attempts: 0 })
    const [exams, setExams] = useState<ExamItem[]>([])
    const [patterns, setPatterns] = useState<PatternTemplate[]>([])
    const [recentAttempts, setRecentAttempts] = useState<CandidateAttempt[]>([])
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(false)

    // Blueprint context
    const [blueprintContext, setBlueprintContext] = useState<BlueprintContextData | null>(null)
    const [contextLoading, setContextLoading] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState('')
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState('')

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'upcoming' | 'draft' | 'closed'>('all')

    // Modals
    const [showShareModal, setShowShareModal] = useState<ExamItem | null>(null)
    const [showSecurityDrawer, setShowSecurityDrawer] = useState(false)
    const [showScheduleModal, setShowScheduleModal] = useState<ExamItem | null>(null)
    const [showQBankModal, setShowQBankModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<ExamItem | null>(null)

    // Security settings (global default; stored in state, applied to blueprint)
    const [security, setSecurity] = useState(DEFAULT_SECURITY)

    // Studio wizard state
    const [studioStep, setStudioStep] = useState(1)
    const [editExamId, setEditExamId] = useState<string | null>(null)
    const [aiGenModalOpen, setAiGenModalOpen] = useState(false)
    const [aiGenProgress, setAiGenProgress] = useState(0)
    const [aiGenStatus, setAiGenStatus] = useState('')
    const [aiGenDetail, setAiGenDetail] = useState('')
    const [aiGenError, setAiGenError] = useState<string | null>(null)
    const [aiSectionStats, setAiSectionStats] = useState<Array<{
        name: string
        target: number
        completed: number
        status: 'pending' | 'generating' | 'completed' | 'error'
    }>>([])
    const [studioFilterSection, setStudioFilterSection] = useState<string>('all')
    const [s1, setS1] = useState({
        name: '',
        targetClass: '',
        subject: '',
        pricing_type: 'free' as 'free' | 'paid',
        price: 0,
        duration: 60,
        total_marks: 100,
        passing_marks: 40,
        instructions: '1. All questions are compulsory.\n2. Do not close or refresh the browser during the exam.\n3. The exam will auto-submit when time runs out.'
    })

    // ── Multi-slot schedule state ─────────────────────────────────────────────
    interface ScheduleSlot {
        id: string
        start: string
        end: string
        max_attempts: number
        class_name?: string
        section_name?: string
    }
    const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])

    const STANDARD_SECTIONS = ['All Sections', 'Section A', 'Section B', 'Section C', 'Section D', 'Section E']

    const availableClasses = useMemo(() => {
        const set = new Set<string>()
        if (s1.targetClass) set.add(s1.targetClass)
        if (blueprintContext?.syllabusTree?.classes) {
            blueprintContext.syllabusTree.classes.forEach((c: any) => { if (c.name) set.add(c.name) })
        }
        const bpAny = blueprintContext as any
        if (bpAny?.institutional?.classes) {
            bpAny.institutional.classes.forEach((c: any) => { if (c.name) set.add(c.name) })
        }
        if (bpAny?.classes) {
            bpAny.classes.forEach((c: any) => { if (c.name) set.add(c.name) })
        }
        if (set.size === 0) {
            for (let i = 1; i <= 12; i++) set.add(`Class ${i}`)
        }
        return Array.from(set)
    }, [s1.targetClass, blueprintContext])

    const makeSlotEnd = (start: string, durationMins: number): string => {
        if (!start) return ''
        const d = new Date(start)
        if (isNaN(d.getTime())) return ''
        d.setMinutes(d.getMinutes() + Number(durationMins || 0))
        // datetime-local format: YYYY-MM-DDTHH:mm
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const addSlot = () => {
        setScheduleSlots(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                start: '',
                end: '',
                max_attempts: 60,
                class_name: s1.targetClass || 'All Classes',
                section_name: 'All Sections'
            }
        ])
    }

    const removeSlot = (id: string) => setScheduleSlots(prev => prev.filter(s => s.id !== id))

    const updateSlot = (id: string, field: keyof ScheduleSlot, value: string | number) => {
        setScheduleSlots(prev => prev.map(slot => {
            if (slot.id !== id) return slot
            const updated = { ...slot, [field]: value }
            if (field === 'start') {
                updated.end = makeSlotEnd(value as string, s1.duration)
            }
            return updated
        }))
    }
    const [s2, setS2] = useState<{
        sections: Array<{ name: string; qCount: number; mark: number; negMark: number; rules?: any[] }>
    }>({ sections: [] })
    const [studioQuestions, setStudioQuestions] = useState<any[]>([])
    const [approvedQs, setApprovedQs] = useState<Set<number>>(new Set())

    // Question Bank picker state
    const [qbankExamId, setQbankExamId] = useState<string | null>(null)
    const [qbankQuestions, setQbankQuestions] = useState<any[]>([])
    const [qbankLoading, setQbankLoading] = useState(false)
    const [selectedQBankIds, setSelectedQBankIds] = useState<Set<string>>(new Set())
    const [qbankSection, setQbankSection] = useState('Section A')

    // Schedule modal state (multi-slot)
    const [modalScheduleSlots, setModalScheduleSlots] = useState<ScheduleSlot[]>([])

    const addModalSlot = () => {
        const dur = showScheduleModal?.duration || 60
        const defaultClass = showScheduleModal?.class_name || showScheduleModal?.blueprint?.target_class || 'All Classes'
        setModalScheduleSlots(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                start: '',
                end: '',
                max_attempts: 60,
                class_name: defaultClass,
                section_name: 'All Sections'
            }
        ])
    }

    const removeModalSlot = (id: string) => {
        setModalScheduleSlots(prev => prev.filter(s => s.id !== id))
    }

    const updateModalSlot = (id: string, field: keyof ScheduleSlot, value: string | number) => {
        const dur = showScheduleModal?.duration || 60
        setModalScheduleSlots(prev => prev.map(slot => {
            if (slot.id !== id) return slot
            const updated = { ...slot, [field]: value }
            if (field === 'start') {
                updated.end = makeSlotEnd(value as string, dur)
            }
            return updated
        }))
    }

    const showToast = (msg: string, ok = true) => setToast({ msg, ok })

    // ── Fetch blueprint context ───────────────────────────────────────────────
    const fetchBlueprintContext = useCallback(async () => {
        setContextLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/blueprint-context')
            if (res.ok) {
                const data: BlueprintContextData = await res.json()
                setBlueprintContext(data)
                if (data.activeBoards?.length > 0 && !selectedBoardId) {
                    setSelectedBoardId(data.activeBoards[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to load blueprint context:', err)
        } finally {
            setContextLoading(false)
        }
    }, [selectedBoardId])

    // ── Fetch main data ───────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [mainRes] = await Promise.all([
                fetch('/api/dashboard/exams/online').then(r => r.json()),
                fetchBlueprintContext()
            ])
            if (mainRes?.metrics) setMetrics(mainRes.metrics)
            if (Array.isArray(mainRes?.exams)) setExams(mainRes.exams)
            if (Array.isArray(mainRes?.recentAttempts)) setRecentAttempts(mainRes.recentAttempts)
            if (Array.isArray(mainRes?.templates)) setPatterns(mainRes.templates)
        } catch (e: any) {
            showToast('Could not load exam data. Please refresh.', false)
        } finally {
            setLoading(false)
        }
    }, [fetchBlueprintContext])

    // ── Fetch real analytics ──────────────────────────────────────────────────
    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/online?action=GET_ANALYTICS')
            if (res.ok) {
                const data = await res.json()
                setAnalytics(data)
            }
        } catch {
            showToast('Could not load results data.', false)
        } finally {
            setAnalyticsLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => {
        if (activeTab === 'results' && !analytics) fetchAnalytics()
    }, [activeTab, analytics, fetchAnalytics])

    // ── Pattern selected → populate studio ───────────────────────────────────
    const handlePatternSelected = (tmpl: any) => {
        if (!tmpl) return
        setSelectedPatternId(tmpl.id)
        let instrText = ''
        if (typeof tmpl.instructions === 'string') instrText = tmpl.instructions
        else if (Array.isArray(tmpl.instructions)) instrText = tmpl.instructions.filter(Boolean).join('\n')
        else instrText = tmpl.description || ''
        setS1(prev => ({
            ...prev,
            name: prev.name ? prev.name : `${tmpl.name}`,
            duration: tmpl.duration_minutes || 60,
            total_marks: tmpl.total_marks || 100,
            instructions: instrText || prev.instructions
        }))
        if (Array.isArray(tmpl.sections) && tmpl.sections.length > 0) {
            const compiled = tmpl.sections.map((sec: any) => {
                const totalQ = sec.rules?.reduce((acc: number, r: any) => acc + Number(r.num_questions || 0), 0) || 10
                const rule = sec.rules?.[0] || {}
                return {
                    name: sec.section_name || 'Section A',
                    qCount: totalQ,
                    mark: Number(rule.marks_per_question || 1),
                    negMark: Number(rule.negative_marks || 0),
                    rules: sec.rules || []
                }
            })
            setS2({ sections: compiled })
        }
        setActiveTab('studio')
        showToast(`Pattern "${tmpl.name}" applied to exam studio.`, true)
    }

    // ── Edit existing exam ────────────────────────────────────────────────────
    const handleEditExam = (exam: ExamItem) => {
        setEditExamId(exam.id)
        setS1({
            name: exam.title,
            targetClass: exam.class_name || exam.blueprint?.target_class || '',
            subject: exam.subject_name || exam.blueprint?.subject || '',
            pricing_type: exam.pricing_type,
            price: exam.price,
            duration: exam.duration,
            total_marks: exam.total_marks,
            passing_marks: exam.passing_marks || 40,
            instructions: Array.isArray(exam.instructions) ? exam.instructions.join('\n') : (exam.instructions || '')
        })
        // Restore schedule slots from blueprint (or build one from legacy dates)
        const defaultClass = exam.class_name || exam.blueprint?.target_class || 'All Classes'
        const savedSlots: ScheduleSlot[] = Array.isArray(exam.blueprint?.schedule_slots)
            ? exam.blueprint.schedule_slots.map((s: any) => ({
                id: s.id || crypto.randomUUID(),
                start: s.start || '',
                end: s.end || '',
                max_attempts: s.max_attempts || 60,
                class_name: s.class_name || defaultClass,
                section_name: s.section_name || 'All Sections'
            }))
            : exam.scheduled_start
                ? [{
                    id: crypto.randomUUID(),
                    start: exam.scheduled_start.slice(0, 16),
                    end: exam.scheduled_end?.slice(0, 16) || '',
                    max_attempts: exam.blueprint?.slot_max_attempts || 60,
                    class_name: defaultClass,
                    section_name: 'All Sections'
                }]
                : []
        setScheduleSlots(savedSlots)
        if (Array.isArray(exam.blueprint?.sections)) {
            setS2({ sections: exam.blueprint.sections.map((sec: any) => ({
                name: sec.name || 'Section A',
                qCount: sec.qCount || 10,
                mark: sec.mark || 1,
                negMark: sec.negMark || 0,
                rules: sec.rules || []
            })) })
        } else {
            setS2({ sections: [] })
        }
        setStudioStep(1)
        setStudioQuestions([])
        setApprovedQs(new Set())
        setActiveTab('studio')
    }

    // ── Generate AI questions with Progress Modal & Section Batching ──────────
    const handleGenerateAI = async () => {
        const subjectName = (s1.subject || blueprintContext?.syllabusTree?.subjects?.find(s => s.id === selectedSubjectId)?.name || '').trim()
        if (!subjectName) return showToast('Please select a subject first.', false)
        if (s2.sections.length === 0) return showToast('Please add at least one section in Step 2.', false)

        const totalRequired = s2.sections.reduce((acc, s) => acc + Number(s.qCount || 0), 0)
        if (totalRequired <= 0) return showToast('Please specify a positive question count for sections.', false)

        // Resolve names from IDs and Blueprint Context
        const boardObj = blueprintContext?.activeBoards?.find(b => b.id === selectedBoardId)
        const boardName = boardObj?.name || 'Gujarat Board (English Medium)'

        const classObj = blueprintContext?.syllabusTree?.classes?.find(c => c.id === selectedClassId)
        const className = s1.targetClass || classObj?.name || 'Class 10'

        const chapterNames = selectedChapterIds
            .map(id => blueprintContext?.syllabusTree?.chapters?.find(c => c.id === id)?.name)
            .filter(Boolean) as string[]

        const topicNames = (selectedTopicIds || [])
            .map(id => blueprintContext?.syllabusTree?.topics?.find(t => t.id === id)?.name)
            .filter(Boolean) as string[]

        const patternObj = blueprintContext?.examPatterns?.find(p => p.id === selectedPatternId)
        const patternName = patternObj?.name || ''

        // Open progress modal
        setAiGenError(null)
        setAiGenProgress(5)
        setAiGenStatus(`Preparing curriculum blueprint for ${subjectName}...`)
        setAiGenDetail(`${boardName} • ${className} • ${totalRequired} total questions`)

        const initialStats = s2.sections.map(sec => ({
            name: sec.name || 'Section A',
            target: Number(sec.qCount || 10),
            completed: 0,
            status: 'pending' as const
        }))
        setAiSectionStats(initialStats)
        setAiGenModalOpen(true)
        setSaving(true)

        const allGeneratedQuestions: any[] = []
        let totalGeneratedSoFar = 0

        try {
            // Process section by section
            for (let sIdx = 0; sIdx < s2.sections.length; sIdx++) {
                const sec = s2.sections[sIdx]
                const secName = sec.name || `Section ${String.fromCharCode(65 + sIdx)}`
                const secTarget = Number(sec.qCount || 10)
                const secMark = Number(sec.mark || 1)
                const secNegMark = Number(sec.negMark || 0)

                // Mark section as generating
                setAiSectionStats(prev => prev.map((item, idx) => idx === sIdx ? { ...item, status: 'generating' } : item))

                // Determine batches for this section based on template rules if present
                interface BatchPlanItem {
                    count: number
                    sub_type: string
                    difficulty: string
                    marks: number
                    negMark: number
                    label: string
                }

                const batches: BatchPlanItem[] = []
                const rules = Array.isArray(sec.rules) && sec.rules.length > 0 ? sec.rules : null

                if (rules) {
                    for (const r of rules) {
                        const rCount = Number(r.num_questions || 0)
                        if (rCount <= 0) continue
                        const rType = r.question_type || 'MCQ'
                        const rMarks = Number(r.marks_per_question || secMark)
                        const rNeg = Number(r.negative_marks || secNegMark)

                        const easyPct = Number(r.difficulty_easy_pct ?? 30)
                        const hardPct = Number(r.difficulty_hard_pct ?? 20)
                        const easyN = Math.round((rCount * easyPct) / 100)
                        const hardN = Math.round((rCount * hardPct) / 100)
                        const medN = Math.max(0, rCount - easyN - hardN)

                        if (easyN > 0) batches.push({ count: easyN, sub_type: rType, difficulty: 'easy', marks: rMarks, negMark: rNeg, label: `${rType} (Easy)` })
                        if (medN > 0) batches.push({ count: medN, sub_type: rType, difficulty: 'medium', marks: rMarks, negMark: rNeg, label: `${rType} (Medium)` })
                        if (hardN > 0) batches.push({ count: hardN, sub_type: rType, difficulty: 'hard', marks: rMarks, negMark: rNeg, label: `${rType} (Hard)` })
                    }
                } else {
                    let remaining = secTarget
                    while (remaining > 0) {
                        const chunkSize = Math.min(remaining, 25)
                        batches.push({
                            count: chunkSize,
                            sub_type: 'MCQ',
                            difficulty: 'medium',
                            marks: secMark,
                            negMark: secNegMark,
                            label: 'Standard MCQ'
                        })
                        remaining -= chunkSize
                    }
                }

                let secCompletedCount = 0

                for (let bIdx = 0; bIdx < batches.length; bIdx++) {
                    const batch = batches[bIdx]
                    const batchStartNum = totalGeneratedSoFar + 1
                    const batchEndNum = totalGeneratedSoFar + batch.count

                    setAiGenStatus(`Drafting ${secName}: ${batch.label} (${batchStartNum} to ${batchEndNum} of ${totalRequired})...`)

                    const isSubjective = ['short_answer', 'long_answer', 'descriptive'].includes(batch.sub_type.toLowerCase().replace(/[^a-z0-9]/g, '_'))

                    const res = await fetch('/api/dashboard/ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'GENERATE_QUESTIONS',
                            payload: {
                                board_name: boardName,
                                class_name: className,
                                subject_name: subjectName,
                                chapters: chapterNames,
                                topics: topicNames,
                                pattern_name: patternName,
                                section_name: secName,
                                count: batch.count,
                                marks: batch.marks,
                                negative_marks: batch.negMark,
                                question_type: isSubjective ? 'subjective' : 'objective',
                                sub_type: batch.sub_type,
                                difficulty: batch.difficulty,
                                language: 'English'
                            }
                        })
                    })

                    const data = await res.json()
                    if (!res.ok || !data.questions) {
                        throw new Error(data.error || `Failed to generate questions for ${secName}`)
                    }

                    const returnedQs = Array.isArray(data.questions) ? data.questions : []
                    if (returnedQs.length === 0) {
                        throw new Error(`AI generated 0 questions for ${secName}. Please verify syllabus settings.`)
                    }

                    // Normalize and tag questions with section metadata and unique IDs
                    const taggedQs = returnedQs.map((q: any, qIdx: number) => {
                        const randomSalt = Math.random().toString(36).substring(2, 7)
                        const secSlug = secName.toLowerCase().replace(/[^a-z0-9]/g, '_')
                        const safeId = (q.id && !q.id.endsWith('_1') && q.id !== 'gen_section_a_1')
                            ? `${q.id}_${totalGeneratedSoFar + qIdx + 1}_${randomSalt}`
                            : `gen_${secSlug}_${Date.now()}_${totalGeneratedSoFar + qIdx + 1}_${randomSalt}`

                        return {
                            id: safeId,
                            section: secName,
                            subject: subjectName,
                            chapter: q.topic || chapterNames[0] || 'Curriculum',
                            topic: q.topic || topicNames[0] || chapterNames[0] || 'Core Subject',
                            type: q.type || (isSubjective ? 'subjective' : 'objective'),
                            sub_type: q.sub_type || batch.sub_type.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            difficulty: q.difficulty || batch.difficulty,
                            marks: batch.marks,
                            negative_marks: batch.negMark,
                            text: q.text || q.question_text || '',
                            options: Array.isArray(q.options) ? q.options : (isSubjective ? null : ['Option A', 'Option B', 'Option C', 'Option D']),
                            correct_answer: q.correct_answer || '',
                            explanation: q.explanation || ''
                        }
                    })

                    allGeneratedQuestions.push(...taggedQs)
                    totalGeneratedSoFar += taggedQs.length
                    secCompletedCount += taggedQs.length

                    const currentProgress = Math.min(Math.round((totalGeneratedSoFar / totalRequired) * 95), 98)
                    setAiGenProgress(currentProgress)

                    // Update section stats
                    setAiSectionStats(prev => prev.map((item, idx) => idx === sIdx ? { ...item, completed: secCompletedCount } : item))
                }

                // Section finished
                setAiSectionStats(prev => prev.map((item, idx) => idx === sIdx ? { ...item, status: 'completed', completed: secCompletedCount } : item))
            }

            setAiGenProgress(100)
            setAiGenStatus(`All ${allGeneratedQuestions.length} questions validated and ready!`)

            setTimeout(() => {
                setStudioQuestions(allGeneratedQuestions)
                setApprovedQs(new Set(allGeneratedQuestions.map((_, i) => i)))
                setStudioFilterSection('all')
                setAiGenModalOpen(false)
                setStudioStep(3)
                showToast(`Generated ${allGeneratedQuestions.length} questions for ${subjectName}!`, true)
            }, 700)

        } catch (e: any) {
            console.error('AI Generation caught error:', e)
            setAiGenError(e.message || 'Could not generate questions. Please try again.')
            setAiGenStatus('AI Generation encountered an issue.')
        } finally {
            setSaving(false)
        }
    }

    // ── Save / Publish exam ───────────────────────────────────────────────────
    const handleSaveExam = async () => {
        setSaving(true)
        try {
            const selectedQuestions = studioQuestions.filter((_, i) => approvedQs.has(i))
            const totalMarks = s2.sections.reduce((acc, s) => acc + (Number(s.qCount) * Number(s.mark)), 0) || s1.total_marks
            // Derive first-slot and last-slot dates for the DB columns
            const validSlots = scheduleSlots.filter(sl => sl.start)
            const firstSlotStart = validSlots[0]?.start ? new Date(validSlots[0].start).toISOString() : null
            const lastSlotEnd   = validSlots[validSlots.length - 1]?.end ? new Date(validSlots[validSlots.length - 1].end).toISOString() : null
            const payload = {
                id: editExamId,
                title: s1.name || 'Online Exam',
                name: s1.name || 'Online Exam',
                duration: Number(s1.duration),
                total_marks: totalMarks,
                pricing_type: s1.pricing_type,
                price: Number(s1.price),
                passing_marks: Number(s1.passing_marks),
                scheduled_start: firstSlotStart,
                scheduled_end: lastSlotEnd,
                class_name: s1.targetClass,
                subject_name: s1.subject,
                status: 'published',
                instructions: s1.instructions.split('\n').filter(Boolean),
                blueprint: {
                    target_class: s1.targetClass,
                    subject: s1.subject,
                    sections: s2.sections,
                    board_id: selectedBoardId,
                    class_id: selectedClassId,
                    subject_id: selectedSubjectId,
                    chapter_ids: selectedChapterIds,
                    pattern_id: selectedPatternId,
                    total_questions: selectedQuestions.length,
                    schedule_slots: validSlots,
                    security
                },
                questions: selectedQuestions
            }
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: editExamId ? 'UPDATE_EXAM' : 'CREATE_EXAM', payload })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.details || err.error || 'Failed to save exam')
            }
            showToast(editExamId ? 'Exam updated successfully!' : 'Exam created and published!', true)
            setActiveTab('roster')
            setStudioStep(1)
            setEditExamId(null)
            setStudioQuestions([])
            setScheduleSlots([])
            setS1({ name: '', targetClass: '', subject: '', pricing_type: 'free', price: 0, duration: 60, total_marks: 100, passing_marks: 40, instructions: '1. All questions are compulsory.\n2. Do not close or refresh the browser during the exam.\n3. The exam will auto-submit when time runs out.' })
            setS2({ sections: [] })
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Could not save exam.', false)
        } finally {
            setSaving(false)
        }
    }

    // ── Toggle status ─────────────────────────────────────────────────────────
    const handleToggleStatus = async (exam: ExamItem) => {
        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOGGLE_STATUS', payload: { id: exam.id, status: exam.status } })
            })
            if (res.ok) { showToast('Exam status updated.', true); fetchData() }
        } catch { showToast('Could not update status.', false) }
    }

    // ── Duplicate exam ────────────────────────────────────────────────────────
    const handleDuplicate = async (id: string) => {
        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DUPLICATE_EXAM', payload: { id } })
            })
            if (res.ok) { showToast('Exam copied as Draft.', true); fetchData() }
        } catch { showToast('Could not copy exam.', false) }
    }

    // ── Delete exam ───────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_EXAM', payload: { id } })
            })
            if (res.ok) { showToast('Exam deleted.', true); setShowDeleteConfirm(null); fetchData() }
        } catch { showToast('Could not delete exam.', false) }
    }

    // ── Schedule exam ─────────────────────────────────────────────────────────
    const handleSchedule = async () => {
        if (!showScheduleModal) return
        const validSlots = modalScheduleSlots.filter(s => s.start)
        const firstSlotStart = validSlots[0]?.start ? new Date(validSlots[0].start).toISOString() : null
        const lastSlotEnd = validSlots[validSlots.length - 1]?.end ? new Date(validSlots[validSlots.length - 1].end).toISOString() : null

        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SCHEDULE_EXAM',
                    payload: {
                        id: showScheduleModal.id,
                        scheduled_start: firstSlotStart,
                        scheduled_end: lastSlotEnd,
                        schedule_slots: validSlots
                    }
                })
            })
            if (res.ok) {
                showToast(validSlots.length > 0 ? `${validSlots.length} schedule slot(s) saved!` : 'Exam schedule updated!', true)
                setShowScheduleModal(null)
                fetchData()
            } else {
                const err = await res.json()
                showToast(err.error || 'Could not save schedule.', false)
            }
        } catch {
            showToast('Could not save schedule.', false)
        }
    }

    // ── Open Question Bank Picker ─────────────────────────────────────────────
    const openQBankPicker = async (examId: string) => {
        setQbankExamId(examId)
        setShowQBankModal(true)
        setQbankLoading(true)
        setSelectedQBankIds(new Set())
        try {
            // Fetch questions from tenant's question bank
            const res = await fetch(`/api/dashboard/exams/question-bank?action=GET_QUESTIONS&subject_id=${selectedSubjectId || ''}&limit=100`)
            if (res.ok) {
                const data = await res.json()
                setQbankQuestions(Array.isArray(data.questions) ? data.questions : (Array.isArray(data) ? data : []))
            }
        } catch { showToast('Could not load Question Bank.', false) }
        setQbankLoading(false)
    }

    // ── Add selected questions from bank ──────────────────────────────────────
    const handleAddFromBank = async () => {
        if (!qbankExamId || selectedQBankIds.size === 0) return showToast('Please select at least one question.', false)
        try {
            const questions = Array.from(selectedQBankIds).map(qid => ({
                question_id: qid,
                section_name: qbankSection,
                marks: 1,
                negative_marks: 0
            }))
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ADD_QUESTIONS_FROM_BANK', payload: { exam_id: qbankExamId, questions } })
            })
            const data = await res.json()
            if (res.ok) {
                showToast(`${data.added} question(s) added to exam!`, true)
                setShowQBankModal(false)
                fetchData()
            } else {
                showToast(data.error || 'Could not add questions.', false)
            }
        } catch { showToast('Could not add questions.', false) }
    }

    // ── Copy test link ────────────────────────────────────────────────────────
    const copyLink = (url: string, id: string) => {
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        showToast('Test link copied!', true)
        setTimeout(() => setCopiedId(null), 2500)
    }

    // ── Export analytics CSV ──────────────────────────────────────────────────
    const exportCSV = () => {
        if (!analytics) return
        const header = 'Rank,Exam Title,Score,Total Marks,Percentile,Status'
        const rows = analytics.topPerformers.map((p, i) =>
            `${p.rank || i + 1},"${p.exam_title}",${p.score},${p.total_marks},${p.percentile ? p.percentile + '%' : '—'},${p.status}`
        ).join('\n')
        const csv = `data:text/csv;charset=utf-8,${header}\n${rows}`
        const link = document.createElement('a')
        link.setAttribute('href', encodeURI(csv))
        link.setAttribute('download', 'Exam_Results.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('Results exported as CSV.', true)
    }

    // ── Filtered exams ────────────────────────────────────────────────────────
    const filteredExams = useMemo(() => {
        return exams.filter(ex => {
            const matchSearch = ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchStatus = statusFilter === 'all' || ex.schedule_status === statusFilter
            return matchSearch && matchStatus
        })
    }, [exams, searchQuery, statusFilter])

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-[#004B93] animate-spin" />
                <div className="text-sm font-bold tracking-widest text-[#004B93] uppercase">Loading Online Exams...</div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-[#F7F8FA] text-[#0F172A] px-4 sm:px-8 py-6 space-y-6 font-sans">
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* ── HERO BANNER ─────────────────────────────────────────────── */}
            <div className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-[#0A101D] text-white">
                <div className="relative h-56 sm:h-64 w-full">
                    <Image
                        src="/assets/images/dashboard/online_exam_banner.jpg"
                        alt="Online Exam Portal"
                        fill
                        priority
                        className="object-cover object-center opacity-35"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#070D18] via-[#0B1528]/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A101D] via-transparent to-transparent" />
                    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between z-10">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                                <Monitor size={13} /> ONLINE EXAM PORTAL
                            </span>
                            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                LIVE MONITORING ON
                            </span>
                            <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
                                Auto Grading Active
                            </span>
                        </div>
                        <div className="space-y-2 max-w-2xl">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Online Exam Portal</h1>
                            <p className="text-sm text-slate-300 font-medium">Create and publish online tests for students with scheduling, anti-cheat controls, and live monitoring.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => { setActiveTab('studio'); setStudioStep(1); setEditExamId(null) }}
                                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#004B93] hover:bg-blue-700 text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Plus size={16} /> Create New Exam
                            </button>
                            <button
                                onClick={() => setActiveTab('patterns')}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Globe size={16} /> Exam Patterns
                            </button>
                            <button
                                onClick={() => setShowSecurityDrawer(true)}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all flex items-center gap-2 cursor-pointer ml-auto"
                            >
                                <Shield size={16} className="text-emerald-400" /> Security Rules
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI CARDS ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Exams', value: metrics.total_exams, sub: `${metrics.total_questions} questions total`, icon: FileText, iconBg: 'bg-blue-50 text-[#004B93]' },
                    { label: 'Students Taking Exam Now', value: metrics.live_sessions, sub: 'Live active sessions', icon: Users, iconBg: 'bg-emerald-50 text-emerald-600', pulse: true },
                    { label: 'Exam Fee Income', value: `₹${metrics.exam_revenue.toLocaleString('en-IN')}`, sub: 'From paid exams', icon: DollarSign, iconBg: 'bg-amber-50 text-amber-600' },
                    { label: 'Security Score', value: `${metrics.integrity_score}%`, sub: 'Anti-cheat rating', icon: Shield, iconBg: 'bg-purple-50 text-purple-600' }
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-slate-100 ${card.iconBg}`}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900">{card.value}</div>
                            <div className={`flex items-center gap-1.5 mt-1 text-xs font-semibold ${card.pulse ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {card.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                                {card.sub}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── TABS ─────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex flex-wrap gap-1.5">
                {[
                    { id: 'roster', label: 'All Exams', count: exams.length, icon: Layers },
                    { id: 'studio', label: editExamId ? 'Edit Exam' : 'Create Exam', icon: Sparkles },
                    { id: 'patterns', label: 'Exam Patterns', count: patterns.length, icon: Globe },
                    { id: 'monitor', label: 'Live Monitor', count: metrics.live_sessions, icon: Monitor },
                    { id: 'results', label: 'Results & Scores', icon: BarChart2 }
                ].map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id as any
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${isActive ? 'bg-[#004B93] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            <Icon size={15} />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TAB 1 — ALL EXAMS                                             */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'roster' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Filter bar */}
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by exam name, class, or subject..."
                                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                            {(['all', 'open', 'upcoming', 'draft', 'closed'] as const).map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-all whitespace-nowrap ${statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {st === 'all' ? 'All' : st === 'open' ? '🟢 Open' : st === 'upcoming' ? '🔵 Upcoming' : st === 'draft' ? '🟡 Draft' : '⚫ Closed'}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchData} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all cursor-pointer ml-auto" title="Refresh">
                            <RefreshCw size={15} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Exam Name & Details</th>
                                    <th className="py-3 px-4">Schedule</th>
                                    <th className="py-3 px-4">Structure</th>
                                    <th className="py-3 px-4">Exam Fee</th>
                                    <th className="py-3 px-4">Student Activity</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredExams.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <FileText size={36} className="opacity-30" />
                                                <div className="font-bold text-sm">No exams found</div>
                                                <div className="text-xs">Create your first exam using the "Create New Exam" button above.</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExams.map(ex => {
                                        const testUrl = typeof window !== 'undefined'
                                            ? `${window.location.origin}/dashboard/exams/online/${ex.id}/play`
                                            : `/dashboard/exams/online/${ex.id}/play`
                                        return (
                                            <tr key={ex.id} className="hover:bg-slate-50/70 transition-all">
                                                <td className="py-4 px-4">
                                                    <div className="font-extrabold text-slate-900 text-sm leading-tight">{ex.title}</div>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        {ex.class_name && (
                                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">{ex.class_name}</span>
                                                        )}
                                                        {ex.subject_name && (
                                                            <span className="text-[10px] font-semibold text-slate-500">{ex.subject_name}</span>
                                                        )}
                                                        <span className="text-[10px] text-slate-400">Created {new Date(ex.created_at).toLocaleDateString('en-IN')}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <SchedulePill start={ex.scheduled_start} end={ex.scheduled_end} schedStatus={ex.schedule_status} />
                                                    {Array.isArray(ex.blueprint?.schedule_slots) && ex.blueprint.schedule_slots.length > 1 ? (
                                                        <div className="mt-1 space-y-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#004B93]">
                                                                    {ex.blueprint.schedule_slots.length} Slots
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                                    {ex.blueprint.schedule_slots.reduce((sum: number, sl: any) => sum + (Number(sl.max_attempts) || 0), 0)} seats
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                                                                {Array.from(new Set(ex.blueprint.schedule_slots.map((s: any) => s.section_name || 'All Sec'))).join(', ')}
                                                            </div>
                                                        </div>
                                                    ) : ex.scheduled_start ? (
                                                        <div className="text-[10px] text-slate-400 mt-1">
                                                            {fmtDate(ex.scheduled_start)} → {fmtDate(ex.scheduled_end)}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                                                            <Clock size={11} /> {ex.duration} mins
                                                        </span>
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-[#004B93] border border-blue-100">
                                                            {ex.question_count} Qs
                                                        </span>
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                                            {ex.total_marks} marks
                                                        </span>
                                                    </div>
                                                    {ex.passing_marks > 0 && (
                                                        <div className="text-[10px] text-slate-400 mt-1">Pass: {ex.passing_marks} marks</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {ex.pricing_type === 'paid' && ex.price > 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                                            <DollarSign size={11} /> ₹{Number(ex.price).toFixed(0)}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Free
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-xs font-bold text-slate-800">{ex.attempt_count} attempts</div>
                                                    <div className="text-[10px] text-slate-500">Avg: {ex.avg_score} / {ex.total_marks}</div>
                                                    <div className="text-[10px] text-slate-500">Pass rate: {ex.pass_rate}</div>
                                                    {ex.live_sessions > 0 && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 animate-pulse mt-1 inline-block">
                                                            {ex.live_sessions} live
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(ex)}
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-black capitalize transition-all cursor-pointer inline-flex items-center gap-1.5 border ${ex.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
                                                        title="Click to toggle"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${ex.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        {ex.status}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link href={`/dashboard/exams/online/${ex.id}/play`} target="_blank"
                                                            className="p-2 rounded-xl bg-blue-50 text-[#004B93] hover:bg-blue-100 transition-all text-xs flex items-center gap-1 font-bold"
                                                            title="Preview exam">
                                                            <Play size={13} /> Test
                                                        </Link>
                                                        <button onClick={() => handleEditExam(ex)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer" title="Edit exam">
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowScheduleModal(ex)
                                                                const dur = ex.duration || 60
                                                                const defaultClass = ex.class_name || ex.blueprint?.target_class || 'All Classes'
                                                                const existingSlots: ScheduleSlot[] = Array.isArray(ex.blueprint?.schedule_slots) && ex.blueprint.schedule_slots.length > 0
                                                                    ? ex.blueprint.schedule_slots.map((s: any) => ({
                                                                        id: s.id || crypto.randomUUID(),
                                                                        start: s.start || '',
                                                                        end: s.end || '',
                                                                        max_attempts: s.max_attempts || 60,
                                                                        class_name: s.class_name || defaultClass,
                                                                        section_name: s.section_name || 'All Sections'
                                                                    }))
                                                                    : ex.scheduled_start
                                                                        ? [{
                                                                            id: crypto.randomUUID(),
                                                                            start: ex.scheduled_start.slice(0, 16),
                                                                            end: ex.scheduled_end ? ex.scheduled_end.slice(0, 16) : makeSlotEnd(ex.scheduled_start.slice(0, 16), dur),
                                                                            max_attempts: ex.blueprint?.slot_max_attempts || 60,
                                                                            class_name: defaultClass,
                                                                            section_name: 'All Sections'
                                                                        }]
                                                                        : [{
                                                                            id: crypto.randomUUID(),
                                                                            start: '',
                                                                            end: '',
                                                                            max_attempts: 60,
                                                                            class_name: defaultClass,
                                                                            section_name: 'All Sections'
                                                                        }]
                                                                setModalScheduleSlots(existingSlots)
                                                            }}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                                            title="Set Exam Schedule Slots"
                                                        >
                                                            <Calendar size={13} />
                                                        </button>
                                                        <button onClick={() => openQBankPicker(ex.id)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer" title="Add questions from Question Bank">
                                                            <BookOpen size={13} />
                                                        </button>
                                                        <button onClick={() => setShowShareModal(ex)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer" title="Share link">
                                                            <Share2 size={13} />
                                                        </button>
                                                        <button onClick={() => copyLink(testUrl, ex.id)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer" title="Copy link">
                                                            {copiedId === ex.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                                        </button>
                                                        <button onClick={() => handleDuplicate(ex.id)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer" title="Copy exam">
                                                            <Layers size={13} />
                                                        </button>
                                                        <button onClick={() => setShowDeleteConfirm(ex)}
                                                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer" title="Delete">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TAB 2 — CREATE / EDIT EXAM                                    */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'studio' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">{editExamId ? 'Edit Exam' : 'Create New Exam'}</h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Step {studioStep} of 3 — {studioStep === 1 ? 'Exam Details & Schedule' : studioStep === 2 ? 'Exam Sections & Questions' : 'Review Questions & Publish'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map(st => (
                                <div key={st} className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all ${studioStep === st ? 'bg-[#004B93] text-white shadow-md' : studioStep > st ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {studioStep > st ? <Check size={15} /> : st}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── STEP 1: Exam Details ──────────────────────────────────── */}
                    {studioStep === 1 && (
                        <div className="space-y-6">
                            <ExamSyllabusPatternPicker
                                context={blueprintContext}
                                loadingContext={contextLoading}
                                onRefreshContext={fetchBlueprintContext}
                                selectedBoardId={selectedBoardId}
                                selectedClassId={selectedClassId}
                                selectedSubjectId={selectedSubjectId}
                                selectedChapterIds={selectedChapterIds}
                                selectedTopicIds={selectedTopicIds}
                                selectedPatternId={selectedPatternId}
                                onSelectBoard={bId => { setSelectedBoardId(bId); setSelectedClassId(''); setSelectedSubjectId(''); setSelectedChapterIds([]); setSelectedTopicIds([]) }}
                                onSelectClass={cNode => { setSelectedClassId(cNode.id); setS1(prev => ({ ...prev, targetClass: cNode.name })); setSelectedSubjectId(''); setSelectedChapterIds([]); setSelectedTopicIds([]) }}
                                onSelectSubject={sNode => { setSelectedSubjectId(sNode.id); setS1(prev => ({ ...prev, subject: sNode.name })); setSelectedChapterIds([]); setSelectedTopicIds([]) }}
                                onSelectChapters={chIds => setSelectedChapterIds(chIds)}
                                onSelectTopics={tpIds => setSelectedTopicIds(tpIds)}
                                onSelectPattern={handlePatternSelected}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-5">
                                    {/* Exam name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Exam Name *</label>
                                        <input type="text" value={s1.name} onChange={e => setS1({ ...s1, name: e.target.value })}
                                            placeholder="e.g. Class 10 Maths — Term 1 Exam"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-[#004B93]/20" />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Class</label>
                                            <input type="text" readOnly value={s1.targetClass || 'Pick above'}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Subject</label>
                                            <input type="text" readOnly value={s1.subject || 'Pick above'}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Time (mins)</label>
                                            <input type="number" min={1} value={s1.duration} onChange={e => {
                                                const dur = parseInt(e.target.value) || 60
                                                setS1(prev => ({ ...prev, duration: dur }))
                                                setScheduleSlots(prev => prev.map(sl => ({
                                                    ...sl,
                                                    end: sl.start ? makeSlotEnd(sl.start, dur) : ''
                                                })))
                                            }}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Total Marks</label>
                                            <input type="number" value={s1.total_marks} onChange={e => setS1({ ...s1, total_marks: parseInt(e.target.value) || 100 })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" />
                                        </div>
                                    </div>

                                    {/* Passing marks */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Passing Marks</label>
                                            <input type="number" value={s1.passing_marks} onChange={e => setS1({ ...s1, passing_marks: parseInt(e.target.value) || 0 })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" />
                                        </div>
                                    </div>

                                    {/* Free / Paid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Is this exam free or paid?</label>
                                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                                <button type="button" onClick={() => setS1({ ...s1, pricing_type: 'free', price: 0 })}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${s1.pricing_type === 'free' ? 'bg-[#004B93] text-white shadow-sm' : 'text-slate-600'}`}>
                                                    Free
                                                </button>
                                                <button type="button" onClick={() => setS1({ ...s1, pricing_type: 'paid', price: 199 })}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${s1.pricing_type === 'paid' ? 'bg-[#004B93] text-white shadow-sm' : 'text-slate-600'}`}>
                                                    Paid
                                                </button>
                                            </div>
                                        </div>
                                        {s1.pricing_type === 'paid' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Exam Fee (₹)</label>
                                                <input type="number" value={s1.price} onChange={e => setS1({ ...s1, price: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-sm font-black text-amber-900 outline-none" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Multi-Slot Schedule */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                <Calendar size={13} />Exam Schedule Slots <span className="text-slate-400 font-medium normal-case">(Optional)</span>
                                            </label>
                                            <button type="button" onClick={addSlot}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#004B93] text-[#004B93] text-[10px] font-black hover:bg-blue-50 transition-all cursor-pointer">
                                                <Plus size={12} /> Add Slot
                                            </button>
                                        </div>

                                        {scheduleSlots.length === 0 && (
                                            <div className="py-5 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs">
                                                No slots yet. Click <span className="font-black text-slate-500">"+ Add Slot"</span> to set when this exam is available.
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {scheduleSlots.map((slot, idx) => (
                                                <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                                    {/* Slot header */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-[#004B93] uppercase tracking-wide">Slot {idx + 1}</span>
                                                        <button type="button" onClick={() => removeSlot(slot.id)}
                                                            className="p-1 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer">
                                                            <X size={13} />
                                                        </button>
                                                    </div>

                                                    {/* Row 1: Target Class and Section */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
                                                        <div>
                                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1 flex items-center gap-1">
                                                                <GraduationCap size={12} className="text-[#004B93]" /> Assigned Class
                                                            </label>
                                                            <select
                                                                value={slot.class_name || s1.targetClass || 'All Classes'}
                                                                onChange={e => updateSlot(slot.id, 'class_name', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                                            >
                                                                <option value="All Classes">All Classes</option>
                                                                {availableClasses.map(cls => (
                                                                    <option key={cls} value={cls}>{cls}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1 flex items-center gap-1">
                                                                <Users size={12} className="text-[#004B93]" /> Assigned Section
                                                            </label>
                                                            <select
                                                                value={slot.section_name || 'All Sections'}
                                                                onChange={e => updateSlot(slot.id, 'section_name', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                                            >
                                                                {STANDARD_SECTIONS.map(sec => (
                                                                    <option key={sec} value={sec}>{sec}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        {/* Start */}
                                                        <div>
                                                            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Start Date & Time</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={slot.start}
                                                                onChange={e => updateSlot(slot.id, 'start', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-[#004B93]/20" />
                                                        </div>

                                                        {/* End — read-only, auto-calculated */}
                                                        <div>
                                                            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                                                                End Date & Time <span className="normal-case text-emerald-600 font-black">(auto)</span>
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={slot.end}
                                                                readOnly
                                                                title="Auto-calculated from Start + Exam Duration"
                                                                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 outline-none cursor-not-allowed" />
                                                        </div>

                                                        {/* Max attempts */}
                                                        <div>
                                                            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Max Students Allowed</label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={slot.max_attempts}
                                                                onChange={e => updateSlot(slot.id, 'max_attempts', parseInt(e.target.value) || 1)}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none" />
                                                        </div>
                                                    </div>

                                                    {/* Slot summary */}
                                                    {slot.start && slot.end && (
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-semibold bg-white rounded-lg px-3 py-2 border border-slate-100 flex-wrap">
                                                            <Clock size={11} className="text-[#004B93]" />
                                                            <span>{new Date(slot.start).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                                                            <span className="text-slate-400">→</span>
                                                            <span>{new Date(slot.end).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-[#004B93] border border-blue-100">
                                                                {slot.class_name || 'All Classes'} · {slot.section_name || 'All Sections'}
                                                            </span>
                                                            <span className="ml-auto flex items-center gap-1 text-slate-500"><Users size={11} /> {slot.max_attempts} seats</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {scheduleSlots.length > 0 && (
                                            <p className="text-[10px] text-slate-400 mt-2">
                                                End time is auto-calculated as <span className="font-bold text-slate-600">Start + {s1.duration} mins</span>. Change exam duration above to update all slots.
                                            </p>
                                        )}
                                        {scheduleSlots.length === 0 && (
                                            <p className="text-[10px] text-slate-400 mt-1.5">Leave empty to publish without a fixed time window.</p>
                                        )}
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Instructions for Students</label>
                                        <textarea rows={3} value={s1.instructions} onChange={e => setS1({ ...s1, instructions: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium outline-none leading-relaxed" />
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button onClick={() => { if (!s1.name) return showToast('Please enter an exam name.', false); setStudioStep(2) }}
                                            className="px-6 py-3 rounded-xl bg-[#004B93] text-white font-bold text-sm shadow-md hover:bg-blue-800 transition-all flex items-center gap-2 cursor-pointer">
                                            Next: Add Sections <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sidebar info */}
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 h-fit">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004B93] flex items-center justify-center">
                                        <Shield size={20} />
                                    </div>
                                    <h3 className="font-black text-sm text-slate-900">Exam Security</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Online exams run in a secure browser mode. Tab switches, copy-pasting, and multiple windows are detected and logged.
                                    </p>
                                    <div className="space-y-2 pt-2 border-t border-slate-200">
                                        {['Full-screen mode enforced', 'Auto-submit on time up', 'Instant result after submission'].map(item => (
                                            <div key={item} className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                                <CheckCircle2 size={13} /> {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Sections ───────────────────────────────────────── */}
                    {studioStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Exam Sections</h3>
                                    <p className="text-xs text-slate-500">Add one or more sections. Set how many questions and marks for each.</p>
                                </div>
                                <button
                                    onClick={() => setS2({ ...s2, sections: [...s2.sections, { name: `Section ${String.fromCharCode(65 + s2.sections.length)}`, qCount: 10, mark: 1, negMark: 0 }] })}
                                    className="px-3.5 py-2 rounded-xl border border-[#004B93] text-[#004B93] font-bold text-xs hover:bg-blue-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus size={14} /> Add Section
                                </button>
                            </div>

                            {s2.sections.length === 0 && (
                                <div className="py-8 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400">
                                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                                    <div className="text-sm font-bold">No sections yet</div>
                                    <div className="text-xs">Click "Add Section" to get started, or use an Exam Pattern from Tab 3.</div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {s2.sections.map((sec, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-4 items-center">
                                        <div className="col-span-2 sm:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Section Name</label>
                                            <input type="text" value={sec.name} onChange={e => { const ns = [...s2.sections]; ns[idx].name = e.target.value; setS2({ ...s2, sections: ns }) }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">No. of Questions</label>
                                            <input type="number" value={sec.qCount} onChange={e => { const ns = [...s2.sections]; ns[idx].qCount = parseInt(e.target.value) || 0; setS2({ ...s2, sections: ns }) }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Marks per Question</label>
                                            <input type="number" value={sec.mark} onChange={e => { const ns = [...s2.sections]; ns[idx].mark = parseFloat(e.target.value) || 1; setS2({ ...s2, sections: ns }) }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none" />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Negative Marks</label>
                                                <input type="number" value={sec.negMark} onChange={e => { const ns = [...s2.sections]; ns[idx].negMark = parseFloat(e.target.value) || 0; setS2({ ...s2, sections: ns }) }}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none" />
                                            </div>
                                            <button onClick={() => setS2({ ...s2, sections: s2.sections.filter((_, i) => i !== idx) })}
                                                className="mb-0.5 p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {s2.sections.length > 0 && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-800 flex items-center gap-3">
                                    <Target size={16} />
                                    Total: {s2.sections.reduce((a, s) => a + s.qCount, 0)} questions ·{' '}
                                    {s2.sections.reduce((a, s) => a + (s.qCount * s.mark), 0)} marks
                                </div>
                            )}

                            <div className="pt-4 flex justify-between border-t border-slate-100">
                                <button onClick={() => setStudioStep(1)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                                    ← Back
                                </button>
                                <button onClick={handleGenerateAI} disabled={saving}
                                    className="px-6 py-3 rounded-xl bg-[#004B93] text-white font-bold text-sm shadow-md hover:bg-blue-800 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                                    Generate Questions with AI →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Review & Publish ────────────────────────────────── */}
                    {studioStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                                    <div>
                                        <div className="text-sm font-extrabold text-emerald-900">
                                            {studioQuestions.length} questions generated and ready for review
                                        </div>
                                        <div className="text-xs text-emerald-700">
                                            {approvedQs.size} of {studioQuestions.length} questions selected for this exam.
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setApprovedQs(new Set(studioQuestions.map((_, i) => i)))}
                                        className="text-xs font-black text-emerald-800 hover:text-emerald-900 underline cursor-pointer"
                                    >
                                        Select All ({studioQuestions.length})
                                    </button>
                                    <span className="text-emerald-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setApprovedQs(new Set())}
                                        className="text-xs font-black text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            {/* Section Filter Tabs */}
                            {(() => {
                                const distinctSections = Array.from(new Set(studioQuestions.map(q => q.section || 'General')))
                                if (distinctSections.length <= 1) return null

                                return (
                                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase mr-1">Filter Section:</span>
                                        <button
                                            type="button"
                                            onClick={() => setStudioFilterSection('all')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                studioFilterSection === 'all'
                                                    ? 'bg-[#004B93] text-white shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            All ({studioQuestions.length})
                                        </button>
                                        {distinctSections.map(secName => {
                                            const secCount = studioQuestions.filter(q => (q.section || 'General') === secName).length
                                            return (
                                                <button
                                                    key={secName}
                                                    type="button"
                                                    onClick={() => setStudioFilterSection(secName)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        studioFilterSection === secName
                                                            ? 'bg-[#004B93] text-white shadow-sm'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {secName} ({secCount})
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })()}

                            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-2">
                                {studioQuestions
                                    .map((q, idx) => ({ q, originalIndex: idx }))
                                    .filter(({ q }) => studioFilterSection === 'all' || (q.section || 'General') === studioFilterSection)
                                    .map(({ q, originalIndex: idx }) => (
                                        <div
                                            key={`studio_q_${idx}_${q.id || 'item'}`}
                                            className={`p-4 rounded-2xl border transition-all ${
                                                approvedQs.has(idx)
                                                    ? 'bg-white border-blue-200 shadow-sm'
                                                    : 'bg-slate-50 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={approvedQs.has(idx)}
                                                    onChange={() => {
                                                        const n = new Set(approvedQs)
                                                        n.has(idx) ? n.delete(idx) : n.add(idx)
                                                        setApprovedQs(n)
                                                    }}
                                                    className="mt-1 w-4 h-4 text-[#004B93] rounded cursor-pointer"
                                                />
                                                <div className="space-y-2.5 flex-1">
                                                    {/* Badges row */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#004B93] border border-blue-200">
                                                            {q.section || 'Section A'}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                                            {q.marks || 1} Mark{q.marks > 1 ? 's' : ''}
                                                        </span>
                                                        {q.topic && (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                {q.topic}
                                                            </span>
                                                        )}
                                                        <span className="ml-auto text-[11px] font-mono text-slate-400">
                                                            #{idx + 1}
                                                        </span>
                                                    </div>

                                                    <div className="font-bold text-slate-900 text-sm leading-relaxed">
                                                        Q{idx + 1}. {q.text || q.question_text}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {(q.options || []).map((opt: string, oi: number) => {
                                                            const isCorrect = opt === q.correct_answer || (typeof opt === 'string' && q.correct_answer && opt.trim() === String(q.correct_answer).trim())
                                                            return (
                                                                <div
                                                                    key={oi}
                                                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                                                                        isCorrect
                                                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                                                    }`}
                                                                >
                                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                                                    }`}>
                                                                        {String.fromCharCode(65 + oi)}
                                                                    </span>
                                                                    <span className="flex-1">{opt}</span>
                                                                    {isCorrect && (
                                                                        <Check size={14} className="text-emerald-600 shrink-0" />
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                    {q.explanation && (
                                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                                                            <span className="font-bold text-slate-800">Explanation: </span>
                                                            {q.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            <div className="pt-4 flex justify-between border-t border-slate-100">
                                <button onClick={() => setStudioStep(2)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                                    ← Back
                                </button>
                                <button onClick={handleSaveExam} disabled={saving}
                                    className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    {editExamId ? 'Save Changes' : 'Save & Publish Exam'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TAB 3 — EXAM PATTERNS                                         */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'patterns' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Ready-Made Exam Patterns</h2>
                        <p className="text-xs text-slate-500 mt-1">Pick a standard pattern to quickly set up an exam. You can customise it further in the studio.</p>
                    </div>
                    {patterns.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Globe size={36} className="mx-auto mb-2 opacity-30" />
                            <div className="font-bold text-sm">No patterns available</div>
                            <div className="text-xs">Ask your admin to add exam patterns.</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {patterns.map(tmpl => (
                                <div key={tmpl.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#004B93] hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-blue-50 text-[#004B93] border border-blue-100">
                                            {tmpl.category || 'Standard Pattern'}
                                        </span>
                                        <h3 className="font-extrabold text-sm text-slate-900">{tmpl.name}</h3>
                                    </div>
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                                            <span className="flex items-center gap-1.5"><Clock size={13} /> {tmpl.duration_minutes} mins</span>
                                            <span className="flex items-center gap-1.5"><Target size={13} /> {tmpl.total_marks} marks</span>
                                        </div>
                                        <button onClick={() => handlePatternSelected(tmpl)}
                                            className="w-full py-2.5 rounded-xl bg-[#004B93] hover:bg-blue-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                                            Use This Pattern →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TAB 4 — LIVE MONITOR                                          */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'monitor' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Monitor size={20} className="text-[#004B93]" /> Live Student Monitor
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Students currently taking exams, tab violations, and security events.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-2 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Monitoring On
                            </span>
                            <button onClick={fetchData} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer" title="Refresh">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Student</th>
                                    <th className="py-3 px-4">Exam</th>
                                    <th className="py-3 px-4">Device / IP</th>
                                    <th className="py-3 px-4">Tab Violations</th>
                                    <th className="py-3 px-4">Status / Score</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {recentAttempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Monitor size={32} className="opacity-30" />
                                                <div className="font-bold text-sm">No active exam sessions</div>
                                                <div className="text-xs">When students start an exam, they will appear here.</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentAttempts.map((att, idx) => (
                                        <tr key={att.id || idx} className="hover:bg-slate-50/70">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">Student #{att.student_id?.slice(0, 8) || '—'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">Attempt: {att.id?.slice(0, 8)}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-slate-800">{att.exam?.title || 'Unknown Exam'}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    Started {new Date(att.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                <div>{att.device_info || 'Browser'}</div>
                                                <div className="text-[10px] font-mono text-slate-400">{att.ip_address || '—'}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {att.tab_switches > 0 ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                                                        ⚠ {att.tab_switches} violation{att.tab_switches > 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">
                                                        ✓ Clean
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${att.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {att.status === 'in_progress' ? 'In Progress' : att.status} ({att.score || att.marks_obtained || 0} pts)
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => showToast(`Warning sent to Student #${att.student_id?.slice(0, 8)}`, true)}
                                                    className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-[10px] cursor-pointer">
                                                    Warn Student
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TAB 5 — RESULTS & SCORES                                      */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'results' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Results & Scores</h2>
                            <p className="text-xs text-slate-500 mt-1">Real exam results from the database. Pass rates, averages, and top students.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={fetchAnalytics} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer" title="Refresh">
                                <RefreshCw size={14} />
                            </button>
                            {analytics && analytics.topPerformers.length > 0 && (
                                <button onClick={exportCSV}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer">
                                    <Download size={13} /> Export CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {analyticsLoading ? (
                        <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
                            <Loader2 size={28} className="animate-spin" />
                            <div className="text-sm font-semibold">Loading results...</div>
                        </div>
                    ) : !analytics || analytics.summary.totalAttempts === 0 ? (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <BarChart2 size={40} className="opacity-30" />
                                <div className="font-bold text-sm">No exam results yet</div>
                                <div className="text-xs max-w-sm">Results will appear here once students start taking and completing exams.</div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                                    <div className="text-xs font-bold text-blue-700 uppercase">Average Score</div>
                                    <div className="text-3xl font-black text-[#004B93] mt-2">{analytics.summary.avgScore}</div>
                                    <div className="text-xs text-blue-600 mt-1 font-semibold">Across all exams</div>
                                </div>
                                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                                    <div className="text-xs font-bold text-emerald-700 uppercase">Pass Rate</div>
                                    <div className="text-3xl font-black text-emerald-700 mt-2">{analytics.summary.passRate}%</div>
                                    <div className="text-xs text-emerald-600 mt-1 font-semibold">{analytics.summary.totalPassed} of {analytics.summary.totalAttempts} students passed</div>
                                </div>
                                <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
                                    <div className="text-xs font-bold text-purple-700 uppercase">Total Attempts</div>
                                    <div className="text-3xl font-black text-purple-700 mt-2">{analytics.summary.totalAttempts}</div>
                                    <div className="text-xs text-purple-600 mt-1 font-semibold">Total exam attempts recorded</div>
                                </div>
                            </div>

                            {/* Per-exam breakdown */}
                            {analytics.perExam.length > 0 && (
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900 mb-3">Results by Exam</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                                                    <th className="py-3 px-4">Exam Name</th>
                                                    <th className="py-3 px-4">Attempts</th>
                                                    <th className="py-3 px-4">Average Score</th>
                                                    <th className="py-3 px-4">Pass Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                                {analytics.perExam.map(ex => (
                                                    <tr key={ex.id} className="hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-bold text-slate-900">{ex.title}</td>
                                                        <td className="py-3 px-4 text-slate-700">{ex.attempts}</td>
                                                        <td className="py-3 px-4 text-slate-700">{ex.avg_score} / {ex.total_marks}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">{ex.pass_rate}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Top performers */}
                            {analytics.topPerformers.length > 0 && (
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900 mb-3">Top Students</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                                                    <th className="py-3 px-4">Rank</th>
                                                    <th className="py-3 px-4">Student</th>
                                                    <th className="py-3 px-4">Exam</th>
                                                    <th className="py-3 px-4">Score</th>
                                                    <th className="py-3 px-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                                {analytics.topPerformers.map((p, i) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-black text-amber-500">
                                                            {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-900">Student #{p.student_id?.slice(0, 8)}</td>
                                                        <td className="py-3 px-4 text-slate-700">{p.exam_title}</td>
                                                        <td className="py-3 px-4 text-emerald-700 font-black">{p.score} / {p.total_marks}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] capitalize">{p.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: Share Exam Link                                        */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004B93] flex items-center justify-center"><Share2 size={18} /></div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900">Share Exam Link</h3>
                                    <p className="text-xs text-slate-500">{showShareModal.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowShareModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Student Test Link</label>
                            <div className="flex gap-2">
                                <input type="text" readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/exams/online/${showShareModal.id}/play`}
                                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200 select-all" />
                                <button
                                    onClick={() => copyLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/exams/online/${showShareModal.id}/play`, showShareModal.id)}
                                    className="px-4 py-2 rounded-xl bg-[#004B93] text-white font-bold text-xs flex items-center gap-1 cursor-pointer">
                                    <Copy size={13} /> Copy
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-700 uppercase">Exam Access Code</div>
                                <div className="text-2xl font-black font-mono text-[#004B93] tracking-widest mt-1">{showShareModal.id.slice(0, 6).toUpperCase()}</div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Active</span>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button onClick={() => setShowShareModal(null)} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: Schedule Exam Slots                                     */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004B93] flex items-center justify-center">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900">Set Exam Schedule Slots</h3>
                                    <p className="text-xs text-slate-500">
                                        {showScheduleModal.title} · <span className="font-bold text-[#004B93]">{showScheduleModal.duration} mins</span> per attempt
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={addModalSlot}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#004B93] text-[#004B93] text-xs font-bold hover:bg-blue-50 transition-all cursor-pointer"
                                >
                                    <Plus size={13} /> Add Slot
                                </button>
                                <button
                                    onClick={() => setShowScheduleModal(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Slots List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                                <Clock size={14} className="text-[#004B93] shrink-0" />
                                <span>
                                    End Date & Time is <span className="font-bold text-slate-700">automatically calculated</span> as Start Date & Time + {showScheduleModal.duration} mins.
                                </span>
                            </div>

                            {modalScheduleSlots.length === 0 && (
                                <div className="py-8 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs">
                                    No slots added yet. Click <span className="font-bold text-slate-600">"+ Add Slot"</span> above to set exam availability.
                                </div>
                            )}

                            {modalScheduleSlots.map((slot, idx) => (
                                <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#004B93] text-white text-[10px] font-black flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                                Slot {idx + 1}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeModalSlot(slot.id)}
                                            className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                            title="Remove Slot"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Row 1: Target Class and Section */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
                                        <div>
                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1 flex items-center gap-1">
                                                <GraduationCap size={12} className="text-[#004B93]" /> Assigned Class
                                            </label>
                                            <select
                                                value={slot.class_name || showScheduleModal?.class_name || 'All Classes'}
                                                onChange={e => updateModalSlot(slot.id, 'class_name', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                            >
                                                <option value="All Classes">All Classes</option>
                                                {availableClasses.map(cls => (
                                                    <option key={cls} value={cls}>{cls}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1 flex items-center gap-1">
                                                <Users size={12} className="text-[#004B93]" /> Assigned Section
                                            </label>
                                            <select
                                                value={slot.section_name || 'All Sections'}
                                                onChange={e => updateModalSlot(slot.id, 'section_name', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                            >
                                                {STANDARD_SECTIONS.map(sec => (
                                                    <option key={sec} value={sec}>{sec}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Start */}
                                        <div>
                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1">
                                                Start Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={slot.start}
                                                onChange={e => updateModalSlot(slot.id, 'start', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                            />
                                        </div>

                                        {/* End (auto-calculated) */}
                                        <div>
                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1">
                                                End Date & Time <span className="normal-case text-emerald-600 font-black">(auto)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={slot.end}
                                                readOnly
                                                title={`Auto-calculated: Start + ${showScheduleModal.duration} mins`}
                                                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 outline-none cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Allowed students */}
                                        <div>
                                            <label className="block text-[10px] text-slate-600 font-bold uppercase mb-1">
                                                Allowed Students
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={slot.max_attempts}
                                                onChange={e => updateModalSlot(slot.id, 'max_attempts', parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview chip */}
                                    {slot.start && slot.end && (
                                        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold bg-white rounded-xl px-3 py-2 border border-slate-100 flex-wrap">
                                            <Clock size={12} className="text-[#004B93]" />
                                            <span>
                                                {new Date(slot.start).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-slate-400 font-normal">→</span>
                                            <span>
                                                {new Date(slot.end).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#004B93] border border-blue-100">
                                                {slot.class_name || 'All Classes'} · {slot.section_name || 'All Sections'}
                                            </span>
                                            <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                <Users size={11} /> {slot.max_attempts} seats
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSchedule}
                                className="flex-1 py-2.5 rounded-xl bg-[#004B93] text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-blue-800 transition-all"
                            >
                                Save Schedule Slots
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: Question Bank Picker                                   */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {showQBankModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004B93] flex items-center justify-center"><BookOpen size={18} /></div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900">Add Questions from Question Bank</h3>
                                    <p className="text-xs text-slate-500">{selectedQBankIds.size} selected</p>
                                </div>
                            </div>
                            <button onClick={() => setShowQBankModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Add to Section</label>
                                <input type="text" value={qbankSection} onChange={e => setQbankSection(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" />
                            </div>
                            <div className="ml-auto text-xs text-slate-500">
                                {qbankQuestions.length} questions available
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {qbankLoading ? (
                                <div className="py-8 text-center text-slate-400">
                                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                    <div className="text-sm">Loading questions...</div>
                                </div>
                            ) : qbankQuestions.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                                    <div className="text-sm font-bold">No questions found</div>
                                    <div className="text-xs">Add questions to your Question Bank first, or select a subject above.</div>
                                </div>
                            ) : (
                                qbankQuestions.map((q: any) => {
                                    const qText = q.question_text?.en || (typeof q.question_text === 'string' ? q.question_text : 'Question')
                                    const isSelected = selectedQBankIds.has(q.id)
                                    return (
                                        <div key={q.id}
                                            onClick={() => { const s = new Set(selectedQBankIds); s.has(q.id) ? s.delete(q.id) : s.add(q.id); setSelectedQBankIds(s) }}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                            <div className="flex items-start gap-3">
                                                <input type="checkbox" checked={isSelected} onChange={() => {}} className="mt-0.5 w-4 h-4 text-[#004B93] rounded" />
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-slate-900 leading-snug">{qText}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' : q.difficulty === 'hard' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {q.difficulty || 'medium'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{q.type || 'objective'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100">
                            <button onClick={() => setShowQBankModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer">Cancel</button>
                            <button onClick={handleAddFromBank} disabled={selectedQBankIds.size === 0}
                                className="flex-1 py-2.5 rounded-xl bg-[#004B93] text-white font-bold text-xs cursor-pointer disabled:opacity-40 shadow-sm">
                                Add {selectedQBankIds.size > 0 ? `${selectedQBankIds.size} ` : ''}Questions to Exam
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* DRAWER: Security Rules                                        */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {showSecurityDrawer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white max-w-md w-full h-full p-8 shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <Shield size={20} className="text-[#004B93]" />
                                    <div>
                                        <h3 className="font-extrabold text-sm text-slate-900">Exam Security Rules</h3>
                                        <p className="text-xs text-slate-500">Default settings applied to new exams</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSecurityDrawer(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
                            </div>

                            <div className="space-y-4 text-xs">
                                {[
                                    { key: 'strictFullscreen', label: 'Full-Screen Mode', desc: 'Forces student browser into full-screen during the exam' },
                                    { key: 'shuffleQuestions', label: 'Shuffle Question Order', desc: 'Questions appear in a different order for each student' },
                                    { key: 'shuffleOptions', label: 'Shuffle Answer Options', desc: 'Options (A/B/C/D) appear in random order' },
                                    { key: 'allowScientificCalc', label: 'On-Screen Calculator', desc: 'Show a calculator tool for math exams' },
                                    { key: 'instantResultDisclosure', label: 'Show Result Instantly', desc: 'Student sees their score immediately after submission' }
                                ].map(setting => (
                                    <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{setting.label}</div>
                                            <div className="text-slate-500 text-[11px] mt-0.5">{setting.desc}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(security as any)[setting.key]}
                                            onChange={e => setSecurity({ ...security, [setting.key]: e.target.checked })}
                                            className="w-5 h-5 text-[#004B93] rounded" />
                                    </div>
                                ))}

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="font-bold text-slate-900 text-sm">Max Tab Switches Allowed</div>
                                    <div className="text-slate-500 text-[11px]">Exam auto-submits after this many tab switches</div>
                                    <select value={security.maxTabSwitches}
                                        onChange={e => setSecurity({ ...security, maxTabSwitches: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold text-xs cursor-pointer outline-none">
                                        <option value={1}>1 (Very Strict)</option>
                                        <option value={3}>3 (Standard)</option>
                                        <option value={5}>5 (Relaxed)</option>
                                        <option value={999}>No Limit (Practice Mode)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <button onClick={() => { setShowSecurityDrawer(false); showToast('Security rules saved!', true) }}
                                className="w-full py-3 rounded-xl bg-[#004B93] text-white font-bold text-xs cursor-pointer shadow-md">
                                Save Security Rules
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: Delete Confirmation                                    */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={18} /></div>
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900">Delete Exam?</h3>
                                <p className="text-xs text-slate-500 mt-0.5">This cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 bg-red-50 p-3 rounded-xl border border-red-100">
                            You are about to permanently delete <span className="font-bold text-slate-900">"{showDeleteConfirm.title}"</span>. All student attempts and questions linked to this exam will also be removed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer">Cancel</button>
                            <button onClick={() => handleDelete(showDeleteConfirm.id)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs cursor-pointer hover:bg-red-700">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: AI Question Generation Progress                         */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {aiGenModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-7 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#004B93]">
                                    <Sparkles size={24} className={aiGenError ? '' : 'animate-pulse text-[#004B93]'} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">AI Question Preparation Engine</h3>
                                    <p className="text-xs text-slate-500">{aiGenDetail || 'Indian Curriculum Standard Agent'}</p>
                                </div>
                            </div>
                            {aiGenError && (
                                <button onClick={() => setAiGenModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Progress Bar & Percentage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-black">
                                <span className={aiGenError ? 'text-red-600 font-bold' : 'text-[#004B93]'}>{aiGenStatus}</span>
                                <span className="text-slate-700 font-extrabold text-sm">{aiGenProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${aiGenError ? 'bg-red-500' : 'bg-gradient-to-r from-[#004B93] via-blue-600 to-emerald-500'}`}
                                    style={{ width: `${aiGenProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Section Checklist */}
                        <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sections Progress</div>
                            <div className="space-y-2">
                                {aiSectionStats.map((sec, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            {sec.status === 'completed' ? (
                                                <CheckCircle2 size={16} className="text-emerald-600" />
                                            ) : sec.status === 'generating' ? (
                                                <Loader2 size={16} className="text-[#004B93] animate-spin" />
                                            ) : sec.status === 'error' ? (
                                                <AlertCircle size={16} className="text-red-500" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-100" />
                                            )}
                                            <span className="font-bold text-slate-800">{sec.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 font-mono text-[11px]">
                                                {sec.completed} / {sec.target} Qs
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                                sec.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                sec.status === 'generating' ? 'bg-blue-50 text-[#004B93] border border-blue-200' :
                                                sec.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {sec.status === 'generating' ? 'Drafting' : sec.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Alert if any */}
                        {aiGenError && (
                            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                                <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="font-black text-red-900">Generation Failed</div>
                                    <div>{aiGenError}</div>
                                </div>
                            </div>
                        )}

                        {/* Footer Controls */}
                        {aiGenError ? (
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setAiGenModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50">
                                    Close
                                </button>
                                <button onClick={handleGenerateAI} className="flex-1 py-3 rounded-xl bg-[#004B93] text-white font-bold text-xs cursor-pointer hover:bg-blue-800 flex items-center justify-center gap-2 shadow-md">
                                    <RefreshCw size={14} /> Retry Generation
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium pt-1">
                                <Loader2 size={13} className="animate-spin text-[#004B93]" />
                                <span>Generating syllabus-aligned questions in simple, clean English...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
