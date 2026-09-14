'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Sparkles, BookOpen, Layers, CheckCircle2, AlertCircle, Loader2,
    RefreshCcw, Download, Printer, Plus, Trash2, Edit3, Eye, Search,
    Filter, FileText, Settings, ShieldCheck, GraduationCap, School,
    Check, X, ChevronRight, HelpCircle, ArrowRight, Sliders, Zap
} from 'lucide-react'

interface QuestionItem {
    id: string
    subject?: string
    topic?: string
    type: 'objective' | 'subjective'
    sub_type?: string
    difficulty: 'easy' | 'medium' | 'hard'
    marks: number
    negative_marks?: number
    text?: string
    question_text?: string
    options?: string[] | null
    correct_answer?: string
    explanation?: string
    created_at?: string
    subject_name?: string
}

interface AISettings {
    adaptive_learning: boolean
    auto_grading: boolean
    ai_question_generation: boolean
    strict_syllabus_mapping: boolean
    include_marking_scheme: boolean
    llm_model: string
}

interface StatsSummary {
    total_questions: number
    objective_count: number
    subjective_count: number
    easy_count: number
    medium_count: number
    hard_count: number
    ai_generated_count: number
    subjects_covered: number
}

export default function AIQuestionGeneratorPage() {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'generate' | 'bank' | 'settings'>('generate')

    // Data states
    const [stats, setStats] = useState<StatsSummary>({
        total_questions: 0,
        objective_count: 0,
        subjective_count: 0,
        easy_count: 0,
        medium_count: 0,
        hard_count: 0,
        ai_generated_count: 0,
        subjects_covered: 0
    })
    const [savedQuestions, setSavedQuestions] = useState<QuestionItem[]>([])
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
    const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
    const [settings, setSettings] = useState<AISettings>({
        adaptive_learning: true,
        auto_grading: true,
        ai_question_generation: true,
        strict_syllabus_mapping: true,
        include_marking_scheme: true,
        llm_model: 'gemini-2.5-flash'
    })

    // Question generation form states
    const [genClass, setGenClass] = useState('')
    const [genSubject, setGenSubject] = useState('')
    const [genTopic, setGenTopic] = useState('')
    const [genType, setGenType] = useState<'objective' | 'subjective'>('objective')
    const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [genCount, setGenCount] = useState<number>(5)
    const [includeAnswers, setIncludeAnswers] = useState<boolean>(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedPool, setGeneratedPool] = useState<QuestionItem[]>([])
    const [isSavingPool, setIsSavingPool] = useState(false)

    // Bank search & filters
    const [bankSearch, setBankSearch] = useState('')
    const [bankSubjectFilter, setBankSubjectFilter] = useState('all')
    const [bankDifficultyFilter, setBankDifficultyFilter] = useState('all')
    const [bankTypeFilter, setBankTypeFilter] = useState('all')

    // Modal & Toast states
    const [selectedQuestionForModal, setSelectedQuestionForModal] = useState<QuestionItem | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

    // ── FETCH INITIAL DATA ────────────────────────────────────
    const loadModuleData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setRefreshing(true)

        try {
            const res = await fetch('/api/dashboard/ai')
            const json = await res.json()

            if (json.success && json.data) {
                setStats(json.data.stats)
                setSavedQuestions(json.data.questions || [])
                setClasses(json.data.classes || [])
                setSubjects(json.data.subjects || [])
                if (json.data.settings) setSettings(json.data.settings)

                // Initialize form defaults if empty
                if (json.data.classes?.length > 0 && !genClass) {
                    setGenClass(json.data.classes[0].name)
                }
                if (json.data.subjects?.length > 0 && !genSubject) {
                    setGenSubject(json.data.subjects[0].name)
                }
            }
        } catch (error) {
            console.error('Failed to load AI question generator data:', error)
            showToast('Unable to connect to school question service', 'error')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [genClass, genSubject])

    useEffect(() => {
        loadModuleData()
    }, [loadModuleData])

    // ── GENERATE QUESTIONS ACTION ─────────────────────────────
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!genSubject) {
            showToast('Please select a subject to continue', 'error')
            return
        }

        setIsGenerating(true)
        try {
            const matchedSubject = subjects.find(s => s.name === genSubject)
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_QUESTIONS',
                    payload: {
                        class_name: genClass,
                        subject_name: genSubject,
                        subject_id: matchedSubject?.id,
                        topic: genTopic || 'Core Syllabus Curriculum',
                        question_type: genType,
                        difficulty: genDifficulty,
                        count: genCount,
                        include_answers: includeAnswers
                    }
                })
            })

            const json = await res.json()
            if (json.success && Array.isArray(json.questions)) {
                setGeneratedPool(json.questions)
                showToast(`Generated ${json.questions.length} examination questions successfully!`, 'success')
            } else {
                showToast(json.error || 'Failed to generate questions. Please try again.', 'error')
            }
        } catch (err: any) {
            console.error(err)
            showToast('Error generating questions', 'error')
        } finally {
            setIsGenerating(false)
        }
    }

    // ── SAVE GENERATED QUESTIONS TO QUESTION BANK ────────────
    const handleSaveGeneratedToBank = async () => {
        if (!generatedPool.length) return
        setIsSavingPool(true)

        try {
            const matchedSubject = subjects.find(s => s.name === genSubject)
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SAVE_QUESTIONS',
                    payload: {
                        questions: generatedPool,
                        subject_id: matchedSubject?.id
                    }
                })
            })

            const json = await res.json()
            if (json.success) {
                showToast(json.message || 'Questions saved to bank!', 'success')
                setGeneratedPool([])
                loadModuleData(true)
                setActiveTab('bank')
            } else {
                showToast(json.error || 'Failed to save questions to bank', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error saving questions to bank', 'error')
        } finally {
            setIsSavingPool(false)
        }
    }

    // ── DELETE QUESTION FROM BANK ─────────────────────────────
    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Are you sure you want to remove this question from the school bank?')) return

        try {
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_QUESTION',
                    payload: { question_id: id }
                })
            })

            const json = await res.json()
            if (json.success) {
                showToast('Question removed from school bank', 'success')
                setSavedQuestions(prev => prev.filter(q => q.id !== id))
                loadModuleData(true)
            } else {
                showToast(json.error || 'Failed to remove question', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error removing question', 'error')
        }
    }

    // ── UPDATE INSTITUTIONAL SETTINGS ─────────────────────────
    const handleUpdateSettings = async (override: Partial<AISettings>) => {
        const updated = { ...settings, ...override }
        setSettings(updated)

        try {
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_SETTINGS',
                    payload: updated
                })
            })

            const json = await res.json()
            if (json.success) {
                showToast('School AI Settings Saved Successfully', 'success')
            } else {
                showToast(json.error || 'Failed to save settings', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Failed to save settings', 'error')
        }
    }

    // ── FILTERED QUESTIONS IN BANK ────────────────────────────
    const filteredBankQuestions = useMemo(() => {
        return savedQuestions.filter(q => {
            const textMatch = !bankSearch ||
                (q.question_text || q.text || '').toLowerCase().includes(bankSearch.toLowerCase()) ||
                (q.subject_name || '').toLowerCase().includes(bankSearch.toLowerCase())

            const subjectMatch = bankSubjectFilter === 'all' || q.subject_name === bankSubjectFilter
            const difficultyMatch = bankDifficultyFilter === 'all' || q.difficulty === bankDifficultyFilter
            const typeMatch = bankTypeFilter === 'all' || q.type === bankTypeFilter

            return textMatch && subjectMatch && difficultyMatch && typeMatch
        })
    }, [savedQuestions, bankSearch, bankSubjectFilter, bankDifficultyFilter, bankTypeFilter])

    if (loading && !stats.total_questions && !subjects.length) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Loading Question Generator & Bank</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Connecting to school syllabus and question repository...</p>
            </div>
        )
    }

    return (
        <div className="w-full px-4 sm:px-8 py-6 pb-24 bg-slate-50/60 min-h-screen text-slate-800 antialiased">
            {/* ── TOAST NOTIFICATIONS ───────────────────────────────── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold transition-all animate-slideDown ${
                    toast.type === 'success'
                        ? 'bg-emerald-900 text-white border-emerald-700'
                        : 'bg-rose-900 text-white border-rose-700'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* ── CINEMATIC ENTERPRISE HERO BANNER ────────────────────── */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm mb-8">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/images/dashboard/ai_question_gen_banner.jpg"
                        alt="Academic Faculty Reviewing Examination Question Papers"
                        fill
                        priority
                        className="object-cover object-center opacity-35 filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
                </div>

                <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10 max-w-4xl text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Evaluation & Question Authoring Hub
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
                        AI Question Generator & Paper Creator
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                        Create curriculum-aligned test questions, build comprehensive school question banks, and customize institutional AI grading features with simple controls.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setActiveTab('generate')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                        >
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            Create New Questions
                        </button>
                        <button
                            onClick={() => setActiveTab('bank')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold transition-all active:scale-95"
                        >
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            School Question Bank ({stats.total_questions})
                        </button>
                        <button
                            onClick={() => loadModuleData(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs sm:text-sm font-medium transition-all"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Sync'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── TOP KPI METRIC SUMMARY CARDS ─────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
                {/* 1. Questions in Bank */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">School Question Bank</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.total_questions || savedQuestions.length}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>MCQs: <strong className="text-blue-600">{stats.objective_count}</strong></span>
                            <span>•</span>
                            <span>Descriptive: <strong className="text-purple-600">{stats.subjective_count}</strong></span>
                        </div>
                    </div>
                </div>

                {/* 2. Subjects Covered */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Subjects</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {subjects.length}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Curriculum verticals mapped to question creator
                        </div>
                    </div>
                </div>

                {/* 3. AI Generated Questions */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Created Questions</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.ai_generated_count}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Syllabus-aligned questions created this term
                        </div>
                    </div>
                </div>

                {/* 4. Institutional Compliance */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Syllabus Compliance</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-xl font-black text-emerald-700 tracking-tight">
                            {settings.strict_syllabus_mapping ? 'Strictly Enforced' : 'Open Curriculum'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Locked to school prescribed textbook topics
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TAB NAVIGATION ────────────────────────────────────────── */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'generate'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Create Exam Questions
                </button>
                <button
                    onClick={() => setActiveTab('bank')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'bank'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    School Question Bank ({savedQuestions.length})
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'settings'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <Sliders className="w-4 h-4" />
                    School AI Controls
                </button>
            </div>

            {/* ── TAB 1: CREATE EXAM QUESTIONS ─────────────────────────── */}
            {activeTab === 'generate' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left 1 Col: Question Generator Form */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Question Parameters</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Define subject, topic, and difficulty</p>
                                </div>
                                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                                    CBSE / NCERT Style
                                </span>
                            </div>

                            <form onSubmit={handleGenerate} className="space-y-4">
                                {/* Class Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Target Class / Grade
                                    </label>
                                    <select
                                        value={genClass}
                                        onChange={e => setGenClass(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        {classes.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Subject
                                    </label>
                                    <select
                                        value={genSubject}
                                        onChange={e => setGenSubject(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Chapter / Topic */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Chapter or Topic Name
                                    </label>
                                    <input
                                        type="text"
                                        value={genTopic}
                                        onChange={e => setGenTopic(e.target.value)}
                                        placeholder="e.g. Quadratic Equations, Newton's Laws"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                {/* Question Type Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Question Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setGenType('objective')}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                genType === 'objective'
                                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Multiple Choice (MCQ)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGenType('subjective')}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                genType === 'subjective'
                                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Short / Essay Answer
                                        </button>
                                    </div>
                                </div>

                                {/* Difficulty Level */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Difficulty Level
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['easy', 'medium', 'hard'] as const).map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setGenDifficulty(d)}
                                                className={`py-2 px-2.5 rounded-xl text-xs font-bold border capitalize transition-all ${
                                                    genDifficulty === d
                                                        ? d === 'easy'
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                            : d === 'medium'
                                                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                                                : 'bg-rose-50 border-rose-300 text-rose-800'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {d === 'hard' ? 'Challenging' : d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Number of Questions */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Quantity ({genCount} Questions)
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[5, 10, 15, 20].map(cnt => (
                                            <button
                                                key={cnt}
                                                type="button"
                                                onClick={() => setGenCount(cnt)}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                                    genCount === cnt
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {cnt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Include Solutions Toggle */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeAnswers}
                                            onChange={e => setIncludeAnswers(e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">
                                            Include step-by-step model solution & marking scheme
                                        </span>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Authoring Questions...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate Test Questions
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Right 2 Cols: Generated Questions Output & Batch Actions */}
                        <div className="lg:col-span-2 space-y-4">
                            {generatedPool.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-sm text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Ready to Author Examination Questions</h3>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                                        Select your subject, chapter, and question format in the left panel. Questions generated will be mapped to the school syllabus and can be reviewed, edited, or saved into the question bank.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Action Bar */}
                                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Generated {generatedPool.length} Questions for {genSubject}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Review before saving to the school bank or printing.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => window.print()}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                                            >
                                                <Printer className="w-3.5 h-3.5" /> Print Paper
                                            </button>
                                            <button
                                                onClick={handleSaveGeneratedToBank}
                                                disabled={isSavingPool}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all disabled:opacity-60"
                                            >
                                                {isSavingPool ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        Save All to Bank
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Questions Review Cards */}
                                    <div className="space-y-3">
                                        {generatedPool.map((q, idx) => (
                                            <div
                                                key={q.id || idx}
                                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                                                        Question {idx + 1} • {q.marks} Mark{q.marks > 1 ? 's' : ''}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                            q.difficulty === 'easy'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : q.difficulty === 'medium'
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {q.difficulty}
                                                        </span>
                                                        <button
                                                            onClick={() => setGeneratedPool(prev => prev.filter((_, i) => i !== idx))}
                                                            className="text-slate-400 hover:text-rose-600 p-1"
                                                            title="Remove question"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                                                    {q.text || q.question_text}
                                                </div>

                                                {/* Options if Objective */}
                                                {Array.isArray(q.options) && q.options.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                        {q.options.map((opt: string, optIdx: number) => {
                                                            const isCorrect = q.correct_answer?.includes(opt) || q.correct_answer === opt
                                                            return (
                                                                <div
                                                                    key={optIdx}
                                                                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                                                        isCorrect
                                                                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                                                                            : 'bg-slate-50 border-slate-100 text-slate-700'
                                                                    }`}
                                                                >
                                                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                                        {String.fromCharCode(65 + optIdx)}
                                                                    </span>
                                                                    <span>{opt}</span>
                                                                    {isCorrect && (
                                                                        <span className="ml-auto text-[10px] font-bold text-emerald-600 uppercase">Correct</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                {/* Model Answer & Explanation */}
                                                {(q.correct_answer || q.explanation) && (
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                                                        {q.correct_answer && (
                                                            <div>
                                                                <strong className="text-slate-700">Model Answer: </strong>
                                                                <span className="text-emerald-700 font-bold">{q.correct_answer}</span>
                                                            </div>
                                                        )}
                                                        {q.explanation && (
                                                            <div>
                                                                <strong className="text-slate-700">Marking Rubric: </strong>
                                                                <span className="text-slate-600">{q.explanation}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: SCHOOL QUESTION BANK LEDGER ────────────────────── */}
            {activeTab === 'bank' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Filter & Search Bar */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Subject filter */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                                <BookOpen className="w-4 h-4 text-slate-400" />
                                <select
                                    value={bankSubjectFilter}
                                    onChange={e => setBankSubjectFilter(e.target.value)}
                                    className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="all">All Subjects</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Difficulty filter */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={bankDifficultyFilter}
                                    onChange={e => setBankDifficultyFilter(e.target.value)}
                                    className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="all">All Difficulties</option>
                                    <option value="easy">Easy (Foundational)</option>
                                    <option value="medium">Medium (Standard)</option>
                                    <option value="hard">Challenging (Advanced)</option>
                                </select>
                            </div>

                            {/* Format filter */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <select
                                    value={bankTypeFilter}
                                    onChange={e => setBankTypeFilter(e.target.value)}
                                    className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="all">All Question Types</option>
                                    <option value="objective">Multiple Choice (MCQ)</option>
                                    <option value="subjective">Subjective (Descriptive)</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={bankSearch}
                                onChange={e => setBankSearch(e.target.value)}
                                placeholder="Search questions in bank..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Question Bank Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3.5 px-5">Question Description</th>
                                        <th className="py-3.5 px-5">Subject</th>
                                        <th className="py-3.5 px-5">Format</th>
                                        <th className="py-3.5 px-5">Difficulty</th>
                                        <th className="py-3.5 px-5">Marks</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredBankQuestions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                No questions found matching your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBankQuestions.map((q) => (
                                            <tr
                                                key={q.id}
                                                onClick={() => setSelectedQuestionForModal(q)}
                                                className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                            >
                                                <td className="py-4 px-5 max-w-md">
                                                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                        {q.question_text || q.text}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                                                        Source: <span className="capitalize">{q.source || 'Manual'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 text-xs font-semibold text-slate-700">
                                                    {q.subject_name}
                                                </td>
                                                <td className="py-4 px-5 text-xs font-semibold text-slate-700 capitalize">
                                                    {q.type === 'objective' ? 'Multiple Choice' : 'Subjective'}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                                        q.difficulty === 'easy'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : q.difficulty === 'medium'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {q.difficulty}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 font-bold text-slate-900">
                                                    {q.marks} Mark{q.marks > 1 ? 's' : ''}
                                                </td>
                                                <td className="py-4 px-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedQuestionForModal(q)
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteQuestion(q.id)
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                            title="Delete Question"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 3: INSTITUTIONAL AI FEATURE CONTROLS ───────────────── */}
            {activeTab === 'settings' && (
                <div className="max-w-4xl space-y-6 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Sliders className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Institutional AI Capabilities</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Configure curriculum compliance and teacher grading assistance for Silver Bells School.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Toggle 1: Strict Syllabus Compliance */}
                            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                    <div className="text-sm font-bold text-slate-900">Strict Syllabus Compliance</div>
                                    <div className="text-xs text-slate-500">
                                        Locks questions strictly to topics, chapters, and competencies from the school prescribed textbooks.
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ strict_syllabus_mapping: !settings.strict_syllabus_mapping })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.strict_syllabus_mapping ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.strict_syllabus_mapping ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Toggle 2: Teacher Grading Assistance */}
                            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                    <div className="text-sm font-bold text-slate-900">Teacher Grading Assistance</div>
                                    <div className="text-xs text-slate-500">
                                        Provides automated scoring hints and step-by-step model answer comparisons during answer sheet evaluation.
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ auto_grading: !settings.auto_grading })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.auto_grading ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.auto_grading ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Toggle 3: Include Step-by-Step Marking Rubric */}
                            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                    <div className="text-sm font-bold text-slate-900">Generate Step-by-Step Solutions</div>
                                    <div className="text-xs text-slate-500">
                                        Automatically includes complete working proofs, diagrams, and marking schemes for every question.
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ include_marking_scheme: !settings.include_marking_scheme })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.include_marking_scheme ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.include_marking_scheme ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Toggle 4: Adaptive Learning Logic */}
                            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                    <div className="text-sm font-bold text-slate-900">Adaptive Difficulty Balance</div>
                                    <div className="text-xs text-slate-500">
                                        Balances foundational recall questions with higher-order thinking skills (HOTS) based on standard board patterns.
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ adaptive_learning: !settings.adaptive_learning })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.adaptive_learning ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.adaptive_learning ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        {/* Model Engine Selection */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                School AI Engine
                            </label>
                            <select
                                value={settings.llm_model}
                                onChange={e => handleUpdateSettings({ llm_model: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash — Fast & Reliable (Recommended)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro — Deep Academic Reasoning</option>
                            </select>
                            <p className="text-xs text-slate-400 font-medium mt-2">
                                Encrypted and dedicated to Silver Bells School. Your academic syllabus and questions remain confidential.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: QUESTION DETAIL & MODEL SOLUTION ───────────────── */}
            {selectedQuestionForModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl animate-scaleUp">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-slate-900">Question Details</h3>
                            </div>
                            <button
                                onClick={() => setSelectedQuestionForModal(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            {/* Metadata Pills */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                                    {selectedQuestionForModal.subject_name || 'General'}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 capitalize">
                                    {selectedQuestionForModal.type}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 capitalize">
                                    {selectedQuestionForModal.difficulty}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700">
                                    {selectedQuestionForModal.marks} Mark{selectedQuestionForModal.marks > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Question text */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-900 leading-relaxed">
                                {selectedQuestionForModal.question_text || selectedQuestionForModal.text}
                            </div>

                            {/* Options if objective */}
                            {Array.isArray(selectedQuestionForModal.options) && selectedQuestionForModal.options.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Answer Choices:</div>
                                    <div className="space-y-1.5">
                                        {selectedQuestionForModal.options.map((opt: string, i: number) => {
                                            const isCorrect = selectedQuestionForModal.correct_answer?.includes(opt) || selectedQuestionForModal.correct_answer === opt
                                            return (
                                                <div
                                                    key={i}
                                                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                                        isCorrect
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                                            : 'bg-slate-50 border-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                    <span>{opt}</span>
                                                    {isCorrect && (
                                                        <span className="ml-auto text-[10px] font-bold text-emerald-600 uppercase">Correct</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Model Answer & Rubric */}
                            {(selectedQuestionForModal.correct_answer || selectedQuestionForModal.explanation) && (
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                                    {selectedQuestionForModal.correct_answer && (
                                        <div>
                                            <strong className="text-slate-700">Model Answer: </strong>
                                            <span className="text-emerald-700 font-bold">{selectedQuestionForModal.correct_answer}</span>
                                        </div>
                                    )}
                                    {selectedQuestionForModal.explanation && (
                                        <div>
                                            <strong className="text-slate-700">Evaluation Rubric: </strong>
                                            <span className="text-slate-600">{selectedQuestionForModal.explanation}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Question
                            </button>
                            <button
                                onClick={() => setSelectedQuestionForModal(null)}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
