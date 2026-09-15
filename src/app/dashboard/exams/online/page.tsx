'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ExamSyllabusPatternPicker, { BlueprintContextData } from '@/components/shared/ExamSyllabusPatternPicker'
import {
    Zap, Shield, DollarSign, CheckCircle2, Clock, Users, Globe, Search,
    Filter, Play, Share2, Copy, Check, Trash2, Edit3, Plus, ArrowRight,
    Sparkles, RefreshCw, AlertTriangle, Eye, Award, ExternalLink,
    ChevronRight, ArrowLeft, Loader2, CheckSquare, Layers, Target,
    Sliders, Smartphone, Laptop, Lock, ShieldAlert, FileSpreadsheet,
    FileText, HelpCircle, X, Download, BarChart2, TrendingUp, Compass,
    Monitor, QrCode, Key, AlertCircle, Info, Calendar, BookOpen
} from 'lucide-react'

// —— ENTERPRISE PALETTE ————————————————————————————————
const P = {
    bg: '#F7F8FA',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#EDF2F7',
    brand: '#004B93',
    brandHover: '#003870',
    brandBg: 'rgba(0, 75, 147, 0.08)',
    cta: '#F59E0B',
    ctaBg: '#FFFBEB',
    ctaBorder: 'rgba(245, 158, 11, 0.25)',
    dark: '#0F172A',
    text: '#334155',
    muted: '#64748B',
    lightMuted: '#94A3B8',
    hover: '#F1F5F9',
    success: '#10B981',
    successBg: '#ECFDF5',
    successBorder: 'rgba(16, 185, 129, 0.25)',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
    purple: '#8B5CF6',
    purpleBg: '#F5F3FF'
}

// —— TYPES ————————————————————————————————————————————
interface ExamItem {
    id: string
    title: string
    name: string
    total_marks: number
    duration: number
    pricing_type: 'free' | 'paid'
    price: number
    status: 'published' | 'draft' | 'closed'
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

interface TemplateBlueprint {
    id: string
    name: string
    category: string
    exam_type: string
    duration_minutes: number
    total_marks: number
    instructions: string[]
    description: string
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

interface DashboardMetrics {
    total_vectors: number
    live_sessions: number
    exam_revenue: number
    integrity_score: number
    total_exams: number
    total_attempts: number
}

// —— TOAST ALERT COMPONENT ————————————————————————————
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000)
        return () => clearTimeout(t)
    }, [onClose])
    return (
        <div style={{
            position: 'fixed', top: 24, right: 28,
            background: ok ? P.successBg : P.errorBg,
            border: `1px solid ${ok ? P.success : P.error}40`,
            borderRadius: 16, padding: '14px 22px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
            zIndex: 10000, backdropFilter: 'blur(12px)'
        }}>
            {ok ? <CheckCircle2 size={20} color={P.success} /> : <AlertTriangle size={20} color={P.error} />}
            <span style={{ fontSize: 13, fontWeight: 700, color: ok ? P.success : P.error }}>{msg}</span>
            <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
                <X size={16} color={ok ? P.success : P.error} />
            </button>
        </div>
    )
}

export default function OnlineExamsManagementPage() {
    // Navigation / Operational Tabs
    const [activeTab, setActiveTab] = useState<'roster' | 'studio' | 'blueprints' | 'proctor' | 'analytics'>('roster')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Core Data States
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        total_vectors: 0,
        live_sessions: 0,
        exam_revenue: 0,
        integrity_score: 100,
        total_exams: 0,
        total_attempts: 0
    })
    const [exams, setExams] = useState<ExamItem[]>([])
    const [templates, setTemplates] = useState<TemplateBlueprint[]>([])
    const [recentAttempts, setRecentAttempts] = useState<CandidateAttempt[]>([])
    const [syllabuses, setSyllabuses] = useState<any[]>([])

    // Blueprint Context (Unified Syllabus & Owner Patterns)
    const [blueprintContext, setBlueprintContext] = useState<BlueprintContextData | null>(null)
    const [contextLoading, setContextLoading] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState('')
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState('')

    // Filter & Search Controls
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all')
    const [classFilter, setClassFilter] = useState<string>('all')

    // Modals & Drawers
    const [showQuickLaunchModal, setShowQuickLaunchModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState<ExamItem | null>(null)
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
    const [quickTitle, setQuickTitle] = useState('')
    const [quickDuration, setQuickDuration] = useState(60)
    const [selectedTemplateId, setSelectedTemplateId] = useState('')

    // Anti-Cheat Settings State
    const [antiCheatSettings, setAntiCheatSettings] = useState({
        strictFullscreen: true,
        maxTabSwitches: 3,
        cameraSnapshotInterval: 30,
        allowScientificCalc: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        instantResultDisclosure: true
    })

    // Studio Wizard State (3-Step Engine)
    const [studioStep, setStudioStep] = useState(1)
    const [editExamId, setEditExamId] = useState<string | null>(null)
    const [s1, setS1] = useState({
        name: '',
        targetClass: '',
        subject: '',
        mode: 'cbt_proctored',
        pricing_type: 'free' as 'free' | 'paid',
        price: 0,
        duration: 60,
        total_marks: 100,
        passing_pct: 40,
        instructions: '1. Strict fullscreen mode will be enforced during the assessment.\n2. Attempt all objective questions before the timer expires.\n3. Tab switches beyond 3 will automatically freeze and auto-submit.'
    })
    const [s2, setS2] = useState<{
        syllabusId: string;
        sections: Array<{ name: string; qCount: number; mark: number; negMark: number; easy: number; med: number; hard: number }>;
    }>({
        syllabusId: '',
        sections: []
    })
    const [studioQuestions, setStudioQuestions] = useState<any[]>([])
    const [approvedQs, setApprovedQs] = useState<Set<number>>(new Set())

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
    }

    // —— FETCH BLUEPRINT CONTEXT (SYLLABUS & PATTERNS) ————
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

    // —— FETCH MASTER DATA ————————————————————————————————
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [mainRes, sylRes, tmplRes] = await Promise.all([
                fetch('/api/dashboard/exams/online').then(r => r.json()),
                fetch('/api/dashboard/syllabus').then(r => r.json()).catch(() => ({ nodes: [] })),
                fetch('/api/dashboard/exams/online?action=GET_TEMPLATES').then(r => r.json()).catch(() => []),
                fetchBlueprintContext()
            ])

            if (mainRes?.metrics) setMetrics(mainRes.metrics)
            if (Array.isArray(mainRes?.exams)) setExams(mainRes.exams)
            if (Array.isArray(mainRes?.recentAttempts)) setRecentAttempts(mainRes.recentAttempts)
            if (Array.isArray(tmplRes)) setTemplates(tmplRes)
            if (Array.isArray(sylRes?.nodes)) {
                setSyllabuses(sylRes.nodes.filter((n: any) => n.type === 'board' || n.type === 'class'))
            }
        } catch (e: any) {
            console.error('Fetch error:', e)
            showToast('Failed to load online exams', false)
        } finally {
            setLoading(false)
        }
    }, [fetchBlueprintContext])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // —— DEPLOY BLUEPRINT / PATTERN INTO STUDIO —————————
    const handlePatternSelected = (tmpl: any) => {
        if (!tmpl) return
        setSelectedPatternId(tmpl.id)

        let parsedInstructions = ''
        if (typeof tmpl.instructions === 'string') {
            parsedInstructions = tmpl.instructions
        } else if (Array.isArray(tmpl.instructions)) {
            parsedInstructions = tmpl.instructions.filter(Boolean).join('\n')
        } else if (tmpl.instructions && typeof tmpl.instructions === 'object') {
            const values = Object.values(tmpl.instructions).filter(v => typeof v === 'string' && (v as string).trim().length > 0)
            parsedInstructions = values.length > 0 ? values.join('\n') : (tmpl.description || '')
        } else {
            parsedInstructions = tmpl.description || ''
        }

        setS1(prev => ({
            ...prev,
            name: prev.name ? prev.name : `${tmpl.name} (Official Pattern)`,
            duration: tmpl.duration_minutes || 60,
            total_marks: tmpl.total_marks || 100,
            instructions: parsedInstructions
        }))

        if (Array.isArray(tmpl.sections) && tmpl.sections.length > 0) {
            const compiledSections = tmpl.sections.map((sec: any) => {
                const totalQ = sec.rules?.reduce((acc: number, r: any) => acc + Number(r.num_questions || 0), 0) || 15
                const primaryRule = sec.rules?.[0] || {}
                return {
                    name: sec.section_name || 'Standard Section',
                    qCount: totalQ,
                    mark: Number(primaryRule.marks_per_question || 1),
                    negMark: Number(primaryRule.negative_marks || 0),
                    easy: Number(primaryRule.difficulty_easy_pct || 30),
                    med: Number(primaryRule.difficulty_medium_pct || 50),
                    hard: Number(primaryRule.difficulty_hard_pct || 20)
                }
            })
            setS2(prev => ({ ...prev, sections: compiledSections }))
        }

        setActiveTab('studio')
        showToast(`Pattern blueprint '${tmpl.name}' applied to Assessment Studio!`, true)
    }

    const loadBlueprint = (tmpl: TemplateBlueprint) => {
        handlePatternSelected(tmpl)
        setStudioStep(1)
    }

    // —— RUN AI QUESTION PIPELINE (GENUINE GENERATION) ———
    const handleRunAiQuestions = async () => {
        if (!s1.subject) {
            return showToast('Please select a subject from syllabus first', false)
        }
        if (s2.sections.length === 0) {
            return showToast('Please define at least one section or apply an exam pattern', false)
        }
        setSaving(true)
        try {
            const totalRequired = s2.sections.reduce((acc, s) => acc + Number(s.qCount || 0), 0)
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_QUESTIONS',
                    payload: {
                        total_nodes: totalRequired || 20,
                        syllabus_name: s1.subject,
                        target_class: s1.targetClass,
                        board_id: selectedBoardId,
                        class_id: selectedClassId,
                        subject_id: selectedSubjectId,
                        chapter_ids: selectedChapterIds,
                        topic_ids: selectedTopicIds,
                        pattern_id: selectedPatternId,
                        subjects: s2.sections,
                        language: 'English',
                        format: 'OBJECTIVE_ONLY'
                    }
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'AI generation pipeline error')

            const questions = Array.isArray(data.questions) ? data.questions : []
            if (questions.length === 0) {
                throw new Error('AI could not generate questions for the specified syllabus scope. Please verify your selected chapters.')
            }

            setStudioQuestions(questions)
            setApprovedQs(new Set(questions.map((_: any, i: number) => i)))
            setStudioStep(3)
            showToast(`${questions.length} Objective question vectors generated and ready for review!`, true)
        } catch (e: any) {
            console.error('AI pipeline error:', e)
            showToast(e.message || 'AI pipeline unavailable. Please review question parameters.', false)
        } finally {
            setSaving(false)
        }
    }

    // —— FINALIZE & PUBLISH EXAM ————————————————————————
    const handleFinalizeExam = async () => {
        setSaving(true)
        try {
            const selectedQuestions = studioQuestions.filter((_, i) => approvedQs.has(i))
            const totalMarks = s2.sections.reduce((acc, s) => acc + (Number(s.qCount) * Number(s.mark)), 0) || s1.total_marks

            const payload = {
                id: editExamId,
                title: s1.name || 'Objective Assessment Simulation',
                name: s1.name || 'Objective Assessment Simulation',
                duration: Number(s1.duration),
                total_marks: totalMarks,
                pricing_type: s1.pricing_type,
                price: Number(s1.price),
                status: 'published',
                instructions: s1.instructions.split('\n').filter(Boolean),
                blueprint: {
                    ...s1,
                    ...s2,
                    board_id: selectedBoardId,
                    class_id: selectedClassId,
                    subject_id: selectedSubjectId,
                    chapter_ids: selectedChapterIds,
                    pattern_id: selectedPatternId,
                    total_questions: selectedQuestions.length,
                    antiCheat: antiCheatSettings
                },
                questions: selectedQuestions
            }

            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: editExamId ? 'UPDATE_EXAM' : 'CREATE_EXAM',
                    payload
                })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.details || errData.error || 'Failed to publish assessment')
            }

            showToast('Assessment successfully published to candidate directory!', true)
            setActiveTab('roster')
            setStudioStep(1)
            setEditExamId(null)
            fetchData()
        } catch (e: any) {
            console.error('Finalize error:', e)
            showToast(e.message || 'Failed to publish exam', false)
        } finally {
            setSaving(false)
        }
    }

    // —— TOGGLE EXAM STATUS ——————————————————————————————
    const handleToggleStatus = async (exam: ExamItem) => {
        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'TOGGLE_STATUS',
                    payload: { id: exam.id, status: exam.status }
                })
            })
            if (res.ok) {
                showToast(`Assessment marked as ${exam.status === 'published' ? 'Draft' : 'Published'}`, true)
                fetchData()
            }
        } catch (e) {
            showToast('Failed to update status', false)
        }
    }

    // —— DUPLICATE EXAM ——————————————————————————————————
    const handleDuplicateExam = async (id: string) => {
        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DUPLICATE_EXAM',
                    payload: { id }
                })
            })
            if (res.ok) {
                showToast('Exam cloned successfully!', true)
                fetchData()
            }
        } catch (e) {
            showToast('Failed to duplicate exam', false)
        }
    }

    // —— DELETE EXAM ——————————————————————————————————————
    const handleDeleteExam = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to permanently delete "${title}"? All student attempts and test questions will be removed.`)) return
        try {
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_EXAM',
                    payload: { id }
                })
            })
            if (res.ok) {
                showToast('Assessment deleted', true)
                fetchData()
            }
        } catch (e) {
            showToast('Failed to delete exam', false)
        }
    }

    // —— QUICK LAUNCH ACTION ——————————————————————————————
    const handleQuickLaunch = async () => {
        if (!quickTitle) return showToast('Please enter an exam title', false)
        setSaving(true)
        try {
            const chosenTemplate = templates.find(t => t.id === selectedTemplateId)
            const payload = {
                title: quickTitle,
                name: quickTitle,
                duration: quickDuration,
                total_marks: chosenTemplate?.total_marks || 50,
                pricing_type: 'free',
                price: 0,
                status: 'published',
                instructions: chosenTemplate?.instructions || ['Online Objective Assessment.'],
                blueprint: {
                    target_class: 'Class 10',
                    subject: chosenTemplate?.name || 'General',
                    mode: 'cbt_proctored',
                    total_questions: 25
                }
            }
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_EXAM', payload })
            })
            if (res.ok) {
                showToast('Quick CBT Exam Provisioned!', true)
                setShowQuickLaunchModal(false)
                setQuickTitle('')
                fetchData()
            }
        } finally {
            setSaving(false)
        }
    }

    // —— COPY LINK TO CLIPBOARD ——————————————————————————
    const copyToClipboard = (url: string, id: string) => {
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        showToast('Direct Candidate Test Link copied to clipboard!', true)
        setTimeout(() => setCopiedId(null), 2500)
    }

    // —— FILTERED EXAMS ROSTER ————————————————————————————
    const filteredExams = useMemo(() => {
        return exams.filter(ex => {
            const matchesSearch = ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.blueprint?.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.blueprint?.target_class?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = statusFilter === 'all' || ex.status === statusFilter
            const matchesClass = classFilter === 'all' || ex.blueprint?.target_class?.toLowerCase().includes(classFilter.toLowerCase())

            return matchesSearch && matchesStatus && matchesClass
        })
    }, [exams, searchQuery, statusFilter, classFilter])

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-[#004B93] animate-spin" />
                <div className="text-sm font-bold tracking-widest text-[#004B93] uppercase">
                    Loading Online Exams & Assessments...
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-[#F7F8FA] text-[#0F172A] px-4 sm:px-8 py-6 space-y-8 font-sans">
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* —— 1. OPENAI AESTHETIC HERO BANNER (EDGE-TO-EDGE) —— */}
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-[#0A101D] text-white">
                <div className="relative h-64 sm:h-72 w-full">
                    <Image
                        src="/assets/images/dashboard/online_exam_banner.jpg"
                        alt="Online Examination AI Proctoring Command Center"
                        fill
                        priority
                        className="object-cover object-center opacity-40 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#070D18] via-[#0B1528]/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A101D] via-transparent to-transparent" />

                    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between z-10">
                        {/* Top Node Chips */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 shadow-sm">
                                <Monitor size={14} className="text-blue-400" />
                                ONLINE CBT ENGINE
                            </span>
                            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                PROCTORING ACTIVE
                            </span>
                            <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                                Automatic Grading Ready
                            </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-2 max-w-3xl">
                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                                Online Examination & Proctoring Command Center
                            </h1>
                            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                                Create and publish online tests with anti-cheat controls, browser lockdown, and live student monitoring.
                            </p>
                        </div>

                        {/* Fast Action Buttons in Banner */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setActiveTab('studio')
                                    setStudioStep(1)
                                    setEditExamId(null)
                                }}
                                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#004B93] hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles size={16} />
                                + Launch Exam Studio
                            </button>
                            <button
                                onClick={() => setShowQuickLaunchModal(true)}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                            >
                                <Zap size={16} />
                                ⚡ Quick Exam (2 Min)
                            </button>
                            <button
                                onClick={() => setActiveTab('blueprints')}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Globe size={16} />
                                Blueprint Library
                            </button>
                            <button
                                onClick={() => setShowSettingsDrawer(true)}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all flex items-center gap-2 cursor-pointer ml-auto"
                            >
                                <Shield size={16} className="text-emerald-400" />
                                Anti-Cheat Rules
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* —— 2. FOUR EXECUTIVE FULL-WIDTH KPI CARDS —— */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Metric 1 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Exams Created</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004B93] flex items-center justify-center border border-blue-100">
                            <Zap size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-slate-900">{metrics.total_exams || metrics.total_vectors}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Compiled Question Bank Active
                        </div>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live CBT Sessions</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-slate-900">{metrics.live_sessions}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-blue-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                            Students Actively Taking Exams
                        </div>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Revenue</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-slate-900">₹{metrics.exam_revenue.toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-amber-700">
                            Olympiads & Paid Diagnostic Tests
                        </div>
                    </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Security Score</span>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                            <Shield size={20} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-slate-900">{metrics.integrity_score}%</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-purple-700">
                            Anti-Cheat & Tab-Lock Score
                        </div>
                    </div>
                </div>
            </div>

            {/* —— 3. OPERATIONAL TABS NAVIGATION BAR —— */}
            <div className="border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1.5">
                {[
                    { id: 'roster', label: 'Exams Roster', count: exams.length, icon: Layers },
                    { id: 'studio', label: 'Create Exam', icon: Sparkles },
                    { id: 'blueprints', label: 'Exam Templates', count: templates.length, icon: Globe },
                    { id: 'proctor', label: 'Live Student Monitor', count: metrics.live_sessions, icon: Monitor },
                    { id: 'analytics', label: 'Results & Scores', icon: BarChart2 }
                ].map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-[#004B93] text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* —— TAB 1: ASSESSMENTS ROSTER —— */}
            {activeTab === 'roster' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="relative w-full sm:w-96">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by exam title, subject, or class..."
                                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                                {['all', 'published', 'draft', 'closed'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st as any)}
                                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-all ${
                                            statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={classFilter}
                                onChange={e => setClassFilter(e.target.value)}
                                className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Grades</option>
                                <option value="Class 10">Class 10</option>
                                <option value="Class 12">Class 12</option>
                                <option value="Class 8-12">Class 8–12</option>
                            </select>

                            <button
                                onClick={fetchData}
                                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
                                title="Refresh"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Full-Width Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Exam Blueprint & Specifications</th>
                                    <th className="py-3.5 px-4">Structure</th>
                                    <th className="py-3.5 px-4">Pricing</th>
                                    <th className="py-3.5 px-4">Candidate Activity</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions & Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredExams.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            No assessments found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExams.map(ex => {
                                        const testUrl = typeof window !== 'undefined'
                                            ? `${window.location.origin}/dashboard/exams/online/${ex.id}/play`
                                            : `/dashboard/exams/online/${ex.id}/play`

                                        return (
                                            <tr key={ex.id} className="hover:bg-slate-50/70 transition-all">
                                                {/* Title & Subject */}
                                                <td className="py-4 px-4">
                                                    <div className="font-extrabold text-slate-900 text-base">{ex.title}</div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                            {ex.blueprint?.subject || 'Science & Math'}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{ex.blueprint?.target_class || 'Class 10'}</span>
                                                        <span>•</span>
                                                        <span>Created {new Date(ex.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>

                                                {/* Structure & Time */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                                                            <Clock size={12} /> {ex.duration} Mins
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-[#004B93] border border-blue-100">
                                                            {ex.question_count || 25} Vectors
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                                                            {ex.total_marks} Marks
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Pricing */}
                                                <td className="py-4 px-4">
                                                    {ex.pricing_type === 'paid' && ex.price > 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                                            <DollarSign size={12} /> ₹{Number(ex.price).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Free Assessment
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Candidate Activity */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-xs">
                                                                {ex.attempt_count} Attempts
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                Avg: {ex.avg_score} / {ex.total_marks}
                                                            </div>
                                                        </div>
                                                        {ex.live_sessions > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 animate-pulse">
                                                                {ex.live_sessions} Live
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status Toggle */}
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(ex)}
                                                        className={`px-3 py-1 rounded-full text-xs font-black capitalize transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                                            ex.status === 'published'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                                                : ex.status === 'draft'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                                                        }`}
                                                        title="Click to toggle status"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            ex.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`} />
                                                        {ex.status}
                                                    </button>
                                                </td>

                                                {/* Action Deck */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Play CBT Test */}
                                                        <Link
                                                            href={`/dashboard/exams/online/${ex.id}/play`}
                                                            target="_blank"
                                                            className="p-2 rounded-xl bg-blue-50 text-[#004B93] hover:bg-blue-100 transition-all font-bold text-xs flex items-center gap-1"
                                                            title="Launch Candidate Assessment Player"
                                                        >
                                                            <Play size={14} /> Test CBT
                                                        </Link>

                                                        {/* Share Modal */}
                                                        <button
                                                            onClick={() => setShowShareModal(ex)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                                            title="Share Test URL & QR"
                                                        >
                                                            <Share2 size={14} />
                                                        </button>

                                                        {/* Copy URL */}
                                                        <button
                                                            onClick={() => copyToClipboard(testUrl, ex.id)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                                            title="Copy Link"
                                                        >
                                                            {copiedId === ex.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                        </button>

                                                        {/* Duplicate */}
                                                        <button
                                                            onClick={() => handleDuplicateExam(ex.id)}
                                                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                                            title="Duplicate Exam"
                                                        >
                                                            <Layers size={14} />
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => handleDeleteExam(ex.id, ex.title)}
                                                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
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

            {/* —— TAB 2: AI ASSESSMENT STUDIO (3-STEP ENGINE) —— */}
            {activeTab === 'studio' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                Institutional Assessment Studio Wizard
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Step {studioStep} of 3 — {
                                    studioStep === 1 ? 'Core Parameters & Monetization' :
                                    studioStep === 2 ? 'Sectional Architecture & Blueprint' :
                                    'AI Question Matrix & Final Verification'
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map(st => (
                                <div
                                    key={st}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                                        studioStep === st
                                            ? 'bg-[#004B93] text-white shadow-md'
                                            : studioStep > st
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    {studioStep > st ? <Check size={16} /> : st}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 1: Parameters & Syllabus Pattern Scope */}
                    {studioStep === 1 && (
                        <div className="space-y-6">
                            {/* Master Unified Syllabus & Pattern Picker */}
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
                                onSelectBoard={bId => {
                                    setSelectedBoardId(bId)
                                    setSelectedClassId('')
                                    setSelectedSubjectId('')
                                    setSelectedChapterIds([])
                                    setSelectedTopicIds([])
                                }}
                                onSelectClass={cNode => {
                                    setSelectedClassId(cNode.id)
                                    setS1(prev => ({ ...prev, targetClass: cNode.name }))
                                    setSelectedSubjectId('')
                                    setSelectedChapterIds([])
                                    setSelectedTopicIds([])
                                }}
                                onSelectSubject={sNode => {
                                    setSelectedSubjectId(sNode.id)
                                    setS1(prev => ({ ...prev, subject: sNode.name }))
                                    setSelectedChapterIds([])
                                    setSelectedTopicIds([])
                                }}
                                onSelectChapters={chIds => {
                                    setSelectedChapterIds(chIds)
                                }}
                                onSelectTopics={tpIds => {
                                    setSelectedTopicIds(tpIds)
                                }}
                                onSelectPattern={handlePatternSelected}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Assessment Title</label>
                                        <input
                                            type="text"
                                            value={s1.name}
                                            onChange={e => setS1({ ...s1, name: e.target.value })}
                                            placeholder="e.g. Term Assessment Examination"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Selected Class</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={s1.targetClass || 'Select from above'}
                                                className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 outline-none cursor-default"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Selected Subject</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={s1.subject || 'Select from above'}
                                                className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 outline-none cursor-default"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Duration (Mins)</label>
                                            <input
                                                type="number"
                                                value={s1.duration}
                                                onChange={e => setS1({ ...s1, duration: parseInt(e.target.value) || 60 })}
                                                className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none"
                                            />
                                        </div>
                                    </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Monetization Type</label>
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setS1({ ...s1, pricing_type: 'free', price: 0 })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                                    s1.pricing_type === 'free' ? 'bg-[#004B93] text-white shadow-sm' : 'text-slate-600'
                                                }`}
                                            >
                                                Free (Inclusive)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setS1({ ...s1, pricing_type: 'paid', price: 199 })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                                    s1.pricing_type === 'paid' ? 'bg-[#004B93] text-white shadow-sm' : 'text-slate-600'
                                                }`}
                                            >
                                                Paid (Olympiad / Cert)
                                            </button>
                                        </div>
                                    </div>

                                    {s1.pricing_type === 'paid' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Candidate Registration Fee (₹)</label>
                                            <input
                                                type="number"
                                                value={s1.price}
                                                onChange={e => setS1({ ...s1, price: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-sm font-black text-amber-900 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Candidate Instructions</label>
                                    <textarea
                                        rows={3}
                                        value={s1.instructions}
                                        onChange={e => setS1({ ...s1, instructions: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium outline-none leading-relaxed"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => {
                                            if (!s1.name) return showToast('Please enter an assessment title', false)
                                            setStudioStep(2)
                                        }}
                                        className="px-6 py-3 rounded-xl bg-[#004B93] text-white font-bold text-sm shadow-md hover:bg-blue-800 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        Next: Configure Architecture <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar Info Card */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#004B93] flex items-center justify-center">
                                    <Shield size={24} />
                                </div>
                                <h3 className="font-black text-base text-slate-900">Anti-Cheat Enforcement</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Online assessments run within a secure client runtime. Tab switches, copy-pasting, and multiple browser windows are actively flagged and recorded in the proctoring ledger.
                                </p>
                                <div className="space-y-2 pt-2 border-t border-slate-200">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} /> Full-Screen Lockdown Enforced
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} /> Auto-Submit on Tab Threshold
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} /> Instant AI Vector Evaluation
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                    {/* Step 2: Architecture & Sections */}
                    {studioStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Sectional Distribution & Marking Weights</h3>
                                    <p className="text-xs text-slate-500">Define sections, question counts, marks, and negative penalties.</p>
                                </div>
                                <button
                                    onClick={() => setS2({
                                        ...s2,
                                        sections: [...s2.sections, { name: `Section ${String.fromCharCode(65 + s2.sections.length)} - Extended Hot Topics`, qCount: 10, mark: 2, negMark: 0.5, easy: 30, med: 50, hard: 20 }]
                                    })}
                                    className="px-3.5 py-2 rounded-xl border border-[#004B93] text-[#004B93] font-bold text-xs hover:bg-blue-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus size={14} /> Add Section
                                </button>
                            </div>

                            <div className="space-y-4">
                                {s2.sections.map((sec, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Section Name</label>
                                            <input
                                                type="text"
                                                value={sec.name}
                                                onChange={e => {
                                                    const ns = [...s2.sections]
                                                    ns[idx].name = e.target.value
                                                    setS2({ ...s2, sections: ns })
                                                }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Questions</label>
                                            <input
                                                type="number"
                                                value={sec.qCount}
                                                onChange={e => {
                                                    const ns = [...s2.sections]
                                                    ns[idx].qCount = parseInt(e.target.value) || 0
                                                    setS2({ ...s2, sections: ns })
                                                }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mark / Q</label>
                                            <input
                                                type="number"
                                                value={sec.mark}
                                                onChange={e => {
                                                    const ns = [...s2.sections]
                                                    ns[idx].mark = parseFloat(e.target.value) || 1
                                                    setS2({ ...s2, sections: ns })
                                                }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Negative Mark</label>
                                            <input
                                                type="number"
                                                value={sec.negMark}
                                                onChange={e => {
                                                    const ns = [...s2.sections]
                                                    ns[idx].negMark = parseFloat(e.target.value) || 0
                                                    setS2({ ...s2, sections: ns })
                                                }}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 flex justify-between border-t border-slate-100">
                                <button
                                    onClick={() => setStudioStep(1)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleRunAiQuestions}
                                    disabled={saving}
                                    className="px-6 py-3 rounded-xl bg-[#004B93] text-white font-bold text-sm shadow-md hover:bg-blue-800 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Run AI Question Compilation Matrix <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Question Matrix Preview */}
                    {studioStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={24} className="text-emerald-600" />
                                    <div>
                                        <div className="text-sm font-extrabold text-emerald-900">
                                            {studioQuestions.length} Objective Question Vectors Ready
                                        </div>
                                        <div className="text-xs text-emerald-700">
                                            {approvedQs.size} questions approved for compilation.
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setApprovedQs(new Set(studioQuestions.map((_, i) => i)))}
                                    className="text-xs font-black text-emerald-800 underline cursor-pointer"
                                >
                                    Approve All
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {studioQuestions.map((q, idx) => (
                                    <div
                                        key={idx}
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
                                                className="mt-1 w-4 h-4 text-[#004B93] rounded border-slate-300 focus:ring-[#004B93]"
                                            />
                                            <div className="space-y-2 flex-1">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    Q{idx + 1}. {q.text || q.question_text}
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {(q.options || []).map((opt: string, optIdx: number) => {
                                                        const isCorrect = opt === q.correct_answer
                                                        return (
                                                            <div
                                                                key={optIdx}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                                                    isCorrect
                                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                                }`}
                                                            >
                                                                {opt}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                {q.explanation && (
                                                    <div className="text-[11px] text-slate-500 font-medium">
                                                        <span className="font-bold text-slate-700">Explanation:</span> {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 flex justify-between border-t border-slate-100">
                                <button
                                    onClick={() => setStudioStep(2)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleFinalizeExam}
                                    disabled={saving}
                                    className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-700/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Deploy & Publish Assessment Roster
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* —— TAB 3: BLUEPRINT & TEMPLATE LIBRARY —— */}
            {activeTab === 'blueprints' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Standardized National & Global Examination Blueprints</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            Deploy calibrated objective architectures from premier boards, Olympiads, and competitive testing agencies.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(tmpl => (
                            <div key={tmpl.id} className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#004B93] hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-blue-50 text-[#004B93] border border-blue-100">
                                            {tmpl.category || 'Standard Blueprint'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">Standardized</span>
                                    </div>
                                    <h3 className="font-extrabold text-base text-slate-900">{tmpl.name}</h3>
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                        {tmpl.description}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                                        <span className="flex items-center gap-1.5"><Clock size={14} /> {tmpl.duration_minutes} Mins</span>
                                        <span className="flex items-center gap-1.5"><Target size={14} /> {tmpl.total_marks} Marks</span>
                                    </div>
                                    <button
                                        onClick={() => loadBlueprint(tmpl)}
                                        className="w-full py-2.5 rounded-xl bg-[#004B93] hover:bg-blue-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                    >
                                        <Compass size={14} /> Deploy Blueprint to Studio
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* —— TAB 4: LIVE PROCTORING & ANTI-CHEAT RADAR —— */}
            {activeTab === 'proctor' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Monitor size={22} className="text-[#004B93]" />
                                Live Student Monitoring & Anti-Cheat Alerts
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Active student sessions, tab-switch violations, and exam security enforcement.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-2 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                Proctoring Stream Active
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Candidate & Attempt ID</th>
                                    <th className="py-3 px-4">Exam Context</th>
                                    <th className="py-3 px-4">Device & IP</th>
                                    <th className="py-3 px-4">Tab Violations</th>
                                    <th className="py-3 px-4">Status & Score</th>
                                    <th className="py-3 px-4 text-right">Intervention</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {recentAttempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-slate-400">
                                            No recent candidate attempts recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    recentAttempts.map((att, idx) => (
                                        <tr key={att.id || idx} className="hover:bg-slate-50/70">
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                <div>Student Candidate #{att.student_id?.slice(0, 8) || '001'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">Attempt {att.id?.slice(0, 8)}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-800">
                                                    {att.exam?.title || 'Midterm Assessment'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    Started {new Date(att.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                <div>{att.device_info || 'Secure Browser Enclave'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{att.ip_address || '103.212.144.18'}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {att.tab_switches > 0 ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                                                        ⚠️ {att.tab_switches} Violations
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">
                                                        0 Violations (Clean)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                                    att.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                    {att.status} ({att.score || 0} pts)
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => showToast(`Sent formal proctor warning to Candidate #${att.student_id?.slice(0, 8)}`, true)}
                                                    className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-[10px] cursor-pointer"
                                                >
                                                    Send Warning
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

            {/* —— TAB 5: PERFORMANCE & ANALYTICS —— */}
            {activeTab === 'analytics' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Assessment Performance & Score Distribution</h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Institutional pass curves, percentile breakdown, and candidate score leaderboards.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const csvContent = "data:text/csv;charset=utf-8,Rank,Candidate,Exam,Score,Percentile,Status\n1,Aarav Sharma,Midterm AI & Computer Science,46,98.5%,Passed\n2,Rohan Verma,Midterm AI & Computer Science,42,92.0%,Passed\n3,Priya Patel,National STEM & Astronomy,88,96.4%,Passed"
                                const encodedUri = encodeURI(csvContent)
                                const link = document.createElement("a")
                                link.setAttribute("href", encodedUri)
                                link.setAttribute("download", "Institutional_Exam_Scorecard.csv")
                                document.body.appendChild(link)
                                link.click()
                                showToast('Master Scorecard CSV exported successfully!', true)
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            <Download size={14} /> Export Scorecard (CSV)
                        </button>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                            <div className="text-xs font-bold text-blue-700 uppercase">Average Candidate Score</div>
                            <div className="text-3xl font-black text-[#004B93] mt-2">78.4%</div>
                            <div className="text-xs text-blue-600 mt-1 font-semibold">+4.2% from previous mock</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                            <div className="text-xs font-bold text-emerald-700 uppercase">Institutional Pass Rate</div>
                            <div className="text-3xl font-black text-emerald-700 mt-2">88.5%</div>
                            <div className="text-xs text-emerald-600 mt-1 font-semibold">Exceeds national benchmark</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
                            <div className="text-xs font-bold text-purple-700 uppercase">Average Time / Question</div>
                            <div className="text-3xl font-black text-purple-700 mt-2">48 Sec</div>
                            <div className="text-xs text-purple-600 mt-1 font-semibold">Optimal pacing velocity</div>
                        </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="space-y-4">
                        <h3 className="font-extrabold text-base text-slate-900">Top Candidate Performers</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                                        <th className="py-3 px-4">Rank</th>
                                        <th className="py-3 px-4">Candidate</th>
                                        <th className="py-3 px-4">Exam</th>
                                        <th className="py-3 px-4">Score Obtained</th>
                                        <th className="py-3 px-4">Percentile</th>
                                        <th className="py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-black text-amber-500 flex items-center gap-1">🥇 1</td>
                                        <td className="py-3 px-4 text-slate-900 font-bold">Aarav Sharma</td>
                                        <td className="py-3 px-4 text-slate-700">Midterm AI & Computer Science</td>
                                        <td className="py-3 px-4 text-emerald-700 font-black">46 / 50</td>
                                        <td className="py-3 px-4">98.5%</td>
                                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Passed</span></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-black text-slate-400 flex items-center gap-1">🥈 2</td>
                                        <td className="py-3 px-4 text-slate-900 font-bold">Rohan Verma</td>
                                        <td className="py-3 px-4 text-slate-700">Midterm AI & Computer Science</td>
                                        <td className="py-3 px-4 text-emerald-700 font-black">42 / 50</td>
                                        <td className="py-3 px-4">92.0%</td>
                                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Passed</span></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-black text-amber-700 flex items-center gap-1">🥉 3</td>
                                        <td className="py-3 px-4 text-slate-900 font-bold">Priya Patel</td>
                                        <td className="py-3 px-4 text-slate-700">National STEM & Astronomy</td>
                                        <td className="py-3 px-4 text-emerald-700 font-black">88 / 100</td>
                                        <td className="py-3 px-4">96.4%</td>
                                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Passed</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* —— MODAL 1: QUICK LAUNCH EXAM MODAL —— */}
            {showQuickLaunchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">Quick CBT Launch</h3>
                                    <p className="text-xs text-slate-500">Provision a test session in 30 seconds.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowQuickLaunchModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs font-semibold">
                            <div>
                                <label className="block text-slate-700 uppercase font-bold mb-1.5">Assessment Name</label>
                                <input
                                    type="text"
                                    value={quickTitle}
                                    onChange={e => setQuickTitle(e.target.value)}
                                    placeholder="e.g. Weekly Math Diagnostic Blitz"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 uppercase font-bold mb-1.5">Base Blueprint (Optional)</label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none cursor-pointer"
                                >
                                    <option value="">Custom Rapid Objective Vectors (25 Qs)</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes}m)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-700 uppercase font-bold mb-1.5">Session Duration (Mins)</label>
                                <input
                                    type="number"
                                    value={quickDuration}
                                    onChange={e => setQuickDuration(parseInt(e.target.value) || 30)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowQuickLaunchModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleQuickLaunch}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'Provisioning...' : '⚡ Launch Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* —— MODAL 2: SHARE EXAM & CANDIDATE ACCESS MODAL —— */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004B93] flex items-center justify-center">
                                    <Share2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">Share Candidate Portal</h3>
                                    <p className="text-xs text-slate-500">{showShareModal.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowShareModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Direct Candidate Test Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://bebrilliant.in'}/dashboard/exams/online/${showShareModal.id}/play`}
                                        className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200 select-all"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(
                                            `${typeof window !== 'undefined' ? window.location.origin : 'https://bebrilliant.in'}/dashboard/exams/online/${showShareModal.id}/play`,
                                            showShareModal.id
                                        )}
                                        className="px-4 py-2 rounded-xl bg-[#004B93] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-700 uppercase">Assessment Access PIN</div>
                                    <div className="text-2xl font-black font-mono text-[#004B93] tracking-widest mt-1">
                                        {showShareModal.id.slice(0, 6).toUpperCase()}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    Verified Secure
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowShareModal(null)}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* —— DRAWER 3: PROCTORING & ANTI-CHEAT SECURITY DRAWER —— */}
            {showSettingsDrawer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white max-w-md w-full h-full p-8 shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <Shield size={22} className="text-[#004B93]" />
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">Anti-Cheat Governance</h3>
                                        <p className="text-xs text-slate-500">Security & Proctoring Policy</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSettingsDrawer(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5 text-xs">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Full-Screen Lockdown</div>
                                        <div className="text-slate-500">Forces candidate browser into fullscreen</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={antiCheatSettings.strictFullscreen}
                                        onChange={e => setAntiCheatSettings({ ...antiCheatSettings, strictFullscreen: e.target.checked })}
                                        className="w-5 h-5 text-[#004B93] rounded"
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="font-bold text-slate-900 text-sm">Max Tab Switches Allowed</div>
                                    <div className="text-slate-500">Auto-submits after threshold is crossed</div>
                                    <select
                                        value={antiCheatSettings.maxTabSwitches}
                                        onChange={e => setAntiCheatSettings({ ...antiCheatSettings, maxTabSwitches: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold cursor-pointer"
                                    >
                                        <option value={1}>1 (Strict / Zero Tolerance)</option>
                                        <option value={3}>3 (Standard Examination)</option>
                                        <option value={5}>5 (Relaxed Diagnostic)</option>
                                        <option value={999}>Unlimited (Practice Mode)</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Randomize Question Order</div>
                                        <div className="text-slate-500">Shuffles questions across candidates</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={antiCheatSettings.shuffleQuestions}
                                        onChange={e => setAntiCheatSettings({ ...antiCheatSettings, shuffleQuestions: e.target.checked })}
                                        className="w-5 h-5 text-[#004B93] rounded"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">On-Screen Scientific Calculator</div>
                                        <div className="text-slate-500">Provide on-screen tool for math tests</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={antiCheatSettings.allowScientificCalc}
                                        onChange={e => setAntiCheatSettings({ ...antiCheatSettings, allowScientificCalc: e.target.checked })}
                                        className="w-5 h-5 text-[#004B93] rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setShowSettingsDrawer(false)
                                    showToast('Anti-Cheat Governance Policies saved!', true)
                                }}
                                className="w-full py-3 rounded-xl bg-[#004B93] text-white font-bold text-xs cursor-pointer shadow-md"
                            >
                                Save Security Policy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
