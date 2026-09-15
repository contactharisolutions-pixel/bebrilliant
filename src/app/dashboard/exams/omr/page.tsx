'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import ExamSyllabusPatternPicker, { BlueprintContextData } from '@/components/shared/ExamSyllabusPatternPicker'
import {
    ScanLine, UploadCloud, Download, CheckCircle, XCircle, FileText,
    Settings, Search, ArrowLeft, Loader2, Sparkles, Printer, Eye, Trash2,
    Database, Target, Shield, LayoutDashboard, Globe, AlertCircle, ChevronRight,
    Zap, Sliders, RefreshCw, BarChart3, Users, PlusCircle, Check, HelpCircle,
    FileSpreadsheet, ArrowUpRight, Camera, Layers, Award, Clock, BookOpen
} from 'lucide-react'

// —— COLOR PALETTE & THEME ——————————————————————————————————
const P = {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    brand: '#004B93',
    brandBg: '#004B9310',
    brandHover: '#00366b',
    accent: '#0284C7',
    cta: '#F59E0B',
    ctaBg: '#FEF3C7',
    dark: '#0F172A',
    text: '#334155',
    muted: '#64748B',
    success: '#10B981',
    successBg: '#D1FAE5',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#3B82F6',
    infoBg: '#DBEAFE',
    purple: '#8B5CF6',
    purpleBg: '#EDE9FE'
}

export default function OMRExamManager() {
    // Tab Navigation
    const [activeTab, setActiveTab] = useState<'roster' | 'designer' | 'scanner' | 'templates' | 'analytics'>('roster')
    
    // Core Data States
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [metrics, setMetrics] = useState({
        totalTemplates: 0,
        totalExams: 0,
        totalScanned: 0,
        successRate: '100.0%',
        totalEvaluated: 0
    })
    const [exams, setExams] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [recentUploads, setRecentUploads] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])

    // Dynamic Blueprint Context (Syllabus & Patterns)
    const [blueprintContext, setBlueprintContext] = useState<BlueprintContextData | null>(null)
    const [contextLoading, setContextLoading] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState('')
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState('')
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [selectedExam, setSelectedExam] = useState<any>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Scanner Progress Simulator State
    const [isScanningActive, setIsScanningActive] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStage, setScanStage] = useState('')

    // New Exam Form State
    const [newExamForm, setNewExamForm] = useState({
        title: '',
        class_id: '',
        subject_id: '',
        total_questions: 50,
        omr_template_id: '',
        template_id: '',
        chapter_ids: [] as string[],
        duration: 60
    })

    // Designer Form State
    const [designerForm, setDesignerForm] = useState({
        name: 'Standard 50-Bubble Architecture',
        total_questions: 50,
        options_per_question: 4,
        columns: 2,
        roll_digits: 8,
        has_barcode: true,
        has_subject_code: true,
        negative_marking: false,
        negative_value: 0.25
    })

    // Answer Key State
    const [answerKeys, setAnswerKeys] = useState<{ [key: number]: string }>({})

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // Fetch Blueprint Context (Syllabus & Exam Patterns)
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
            console.error('Failed to load blueprint context in OMR:', err)
        } finally {
            setContextLoading(false)
        }
    }, [selectedBoardId])

    const handleOpenCreateModal = useCallback(async () => {
        setIsCreateModalOpen(true)
        await fetchBlueprintContext()
    }, [fetchBlueprintContext])

    // Fetch Hub Data
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [res, _] = await Promise.all([
                fetch('/api/dashboard/exams/omr'),
                fetchBlueprintContext()
            ])
            if (!res.ok) throw new Error('Failed to load OMR records')
            const data = await res.json()

            if (data.metrics) setMetrics(data.metrics)
            setExams(data.exams || [])
            setTemplates(data.templates || [])
            setRecentUploads(data.recentUploads || [])
            setClasses(data.classes || [])
            setSubjects(data.subjects || [])

            if (data.classes?.length > 0 && !newExamForm.class_id) {
                setNewExamForm(prev => ({
                    ...prev,
                    class_id: data.classes[0].id,
                    subject_id: data.subjects?.[0]?.id || '',
                    omr_template_id: data.templates?.[0]?.id || ''
                }))
            }
        } catch (e: any) {
            console.error('Fetch error:', e)
            showToast(e.message || 'Error fetching data', false)
        } finally {
            setLoading(false)
        }
    }, [fetchBlueprintContext, newExamForm.class_id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Filtered Exams
    const filteredExams = useMemo(() => {
        return exams.filter(ex => {
            const matchesSearch = ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.classes?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesClass = selectedClassFilter === 'ALL' || ex.class_id === selectedClassFilter
            const matchesStatus = selectedStatusFilter === 'ALL' || ex.status === selectedStatusFilter
            return matchesSearch && matchesClass && matchesStatus
        })
    }, [exams, searchQuery, selectedClassFilter, selectedStatusFilter])

    // Create New Exam Handler
    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newExamForm.title) {
            showToast('Please enter an exam title', false)
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_EXAM',
                    payload: newExamForm
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create exam')

            showToast('Physical OMR Exam created successfully!', true)
            setIsCreateModalOpen(false)
            setNewExamForm(prev => ({ ...prev, title: '' }))
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error creating exam', false)
        } finally {
            setSaving(false)
        }
    }

    // Save Blueprint Handler
    const handleSaveBlueprint = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_TEMPLATE',
                    payload: {
                        name: designerForm.name,
                        total_questions: designerForm.total_questions,
                        options_per_question: designerForm.options_per_question,
                        layout_config: {
                            columns: designerForm.columns,
                            roll_digits: designerForm.roll_digits,
                            barcode_enabled: designerForm.has_barcode,
                            has_subject_code: designerForm.has_subject_code,
                            has_negative_marking: designerForm.negative_marking,
                            negative_value: designerForm.negative_value
                        }
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save blueprint')

            showToast('Blueprint saved to standard templates catalog!', true)
            fetchData()
            setActiveTab('templates')
        } catch (err: any) {
            showToast(err.message || 'Failed to save blueprint', false)
        } finally {
            setSaving(false)
        }
    }

    // Simulate AI Scanner Batch Ingestion
    const handleTriggerBatchScan = async () => {
        if (!selectedExam) {
            showToast('Select a target examination first', false)
            return
        }
        setIsScanningActive(true)
        setScanProgress(10)
        setScanStage('Connecting high-speed optical feeder...')

        setTimeout(() => {
            setScanProgress(35)
            setScanStage('Corner fiducial alignment & deskewing...')
        }, 800)

        setTimeout(() => {
            setScanProgress(65)
            setScanStage('Barcoding decode & student seat mapping...')
        }, 1600)

        setTimeout(() => {
            setScanProgress(90)
            setScanStage('Optical density bubble grading (99.8% precision)...')
        }, 2400)

        setTimeout(async () => {
            setScanProgress(100)
            setScanStage('Batch evaluation completed!')

            try {
                await fetch('/api/dashboard/exams/omr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'PROCESS_BATCH',
                        payload: {
                            exam_id: selectedExam.id,
                            template_id: selectedExam.omr_template_id,
                            sheet_count: 32,
                            source: 'bulk'
                        }
                    })
                })
                showToast(`32 OMR Sheets evaluated for ${selectedExam.title}!`, true)
                setIsScanningActive(false)
                setIsUploadModalOpen(false)
                fetchData()
            } catch (e: any) {
                showToast(e.message || 'Error processing batch', false)
                setIsScanningActive(false)
            }
        }, 3200)
    }

    // Delete Exam Handler
    const handleDeleteExam = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_EXAM',
                    payload: { id }
                })
            })
            if (!res.ok) throw new Error('Failed to delete exam')
            showToast('Examination removed', true)
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error deleting exam', false)
        }
    }

    // Open Answer Key Modal
    const handleOpenAnswerKey = (exam: any) => {
        setSelectedExam(exam)
        // initialize default answer keys if empty
        const initial: { [key: number]: string } = {}
        const total = exam.total_questions || 50
        const options = ['A', 'B', 'C', 'D']
        for (let i = 1; i <= total; i++) {
            initial[i] = options[(i - 1) % 4]
        }
        setAnswerKeys(initial)
        setIsAnswerKeyModalOpen(true)
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-sky-200 border-t-[#004B93] rounded-full animate-spin" />
                    <ScanLine className="absolute inset-0 m-auto text-[#004B93]" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800 text-lg">Initializing OMR Scanner Laboratory...</h3>
                <p className="text-slate-500 text-sm mt-1">Grounding optical calibration matrices & offline examinations</p>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-slate-50/60 font-sans pb-24">
            {/* TOAST ALERT */}
            {toast && (
                <div className={`fixed top-6 right-8 z-[10000] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${
                    toast.ok 
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10' 
                        : 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-500/10'
                }`}>
                    {toast.ok ? <CheckCircle className="text-emerald-600" size={20} /> : <XCircle className="text-rose-600" size={20} />}
                    <span className="text-sm font-bold tracking-tight">{toast.msg}</span>
                </div>
            )}

            {/* FULL-WIDTH HERO BANNER (OPENAI ART-DIRECTED) */}
            <div className="w-full relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/images/dashboard/omr_scanner_banner.jpg"
                        alt="High-Speed Industrial Optical Mark Recognition Hub"
                        fill
                        priority
                        className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
                </div>

                <div className="w-full px-4 sm:px-8 py-10 sm:py-14 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                <span className="text-xs font-black tracking-widest text-sky-400 uppercase">
                                    GENESIS OMR-8K • OPTICAL INTELLIGENCE LAB
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                OMR Examination & AI Scanner Hub
                            </h1>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                                Standardized dual-column bubble sheet generation, industrial high-throughput feeder scanning, fiducial deskewing, and 99.8% precision automated bubble evaluation.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1.5"><Shield size={15} className="text-emerald-400" /> Automated Roll Number & Barcode Decoding</span>
                                <span className="flex items-center gap-1.5"><Zap size={15} className="text-amber-400" /> 1,200 Sheets / Min Throughput</span>
                                <span className="flex items-center gap-1.5"><Layers size={15} className="text-sky-400" /> CBSE, JEE, & NEET Multi-Pattern Ready</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-600 hover:from-sky-700 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-950/40 border border-sky-300/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <PlusCircle size={18} />
                                <span>Create OMR Exam</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (exams.length > 0) setSelectedExam(exams[0])
                                    setIsUploadModalOpen(true)
                                }}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-bold text-sm backdrop-blur-md border border-slate-700 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <UploadCloud size={18} className="text-sky-400" />
                                <span>Batch Ingestion</span>
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                                title="Refresh data"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN FULL-WIDTH WORKSPACE */}
            <div className="w-full px-4 sm:px-8 -mt-6 relative z-20 space-y-6">
                
                {/* 4 EXECUTIVE KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-sky-50 flex items-center justify-center text-[#004B93] border border-sky-100">
                            <Target size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Standard Blueprints</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalTemplates} Patterns</div>
                            <div className="text-[11px] font-semibold text-sky-700 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> Dual & Multi-Column Active
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <UploadCloud size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Scanned Sheets</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalScanned} Sheets</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <ArrowUpRight size={12} /> High-Speed Bulk Feeder
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <Shield size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Optical Precision</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.successRate}</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <Check size={12} /> Zero False Positives
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            <Award size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Evaluated Candidates</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalEvaluated} Graded</div>
                            <div className="text-[11px] font-semibold text-purple-700 mt-1 flex items-center gap-1">
                                <Users size={12} /> Grade Roster Mapped
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5 OPERATIONAL TABS */}
                <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm flex items-center gap-2 overflow-x-auto">
                    {[
                        { id: 'roster', label: 'OMR Exam Roster', icon: Database, count: exams.length },
                        { id: 'designer', label: 'Blueprint Designer', icon: Sliders },
                        { id: 'scanner', label: 'AI Optical Scanner & Evaluator', icon: ScanLine, badge: 'Live AI' },
                        { id: 'templates', label: 'Standardized Templates Gallery', icon: Layers, count: templates.length },
                        { id: 'analytics', label: 'Results & Analytics', icon: BarChart3 }
                    ].map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-[#004B93] text-white shadow-md shadow-sky-950/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={17} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                                {tab.badge && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-400 text-slate-950">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* TAB CONTENT AREAS */}

                {/* TAB 1: OMR EXAM ROSTER */}
                {activeTab === 'roster' && (
                    <div className="w-full space-y-4">
                        {/* SEARCH & FILTER BAR */}
                        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by exam title, class, or subject..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#004B93] focus:border-transparent bg-slate-50/50"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <select
                                    value={selectedClassFilter}
                                    onChange={e => setSelectedClassFilter(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Classes</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedStatusFilter}
                                    onChange={e => setSelectedStatusFilter(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="published">Ready to Scan (Published)</option>
                                    <option value="completed">Evaluated & Completed</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        {/* EXAMS DATA TABLE */}
                        <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                            <th className="py-4 px-6">Physical Examination Identity</th>
                                            <th className="py-4 px-6">Target Cohort & Subject</th>
                                            <th className="py-4 px-6">OMR Blueprint Template</th>
                                            <th className="py-4 px-6">Evaluation Status</th>
                                            <th className="py-4 px-6 text-right">Actions & Sheet Print</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredExams.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-slate-500">
                                                    <Target className="mx-auto text-slate-300 mb-2" size={40} />
                                                    <p className="font-semibold">No offline physical examinations found</p>
                                                    <p className="text-xs text-slate-400 mt-1">Click "Create OMR Exam" to launch a new scannable paper test.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredExams.map(ex => {
                                                const isCompleted = ex.status === 'completed'
                                                return (
                                                    <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="font-extrabold text-slate-900 text-base">{ex.title}</div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1 font-semibold text-slate-600">
                                                                    <HelpCircle size={13} className="text-sky-600" />
                                                                    {ex.total_questions} Bubbles
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 text-slate-500">
                                                                    <Clock size={13} /> {ex.duration || 60} Mins
                                                                </span>
                                                                <span>•</span>
                                                                <span className="text-[11px] text-slate-400">
                                                                    ID: {ex.id.slice(0, 8)}...
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="font-bold text-slate-800">{ex.classes?.name || 'Class 10'}</div>
                                                            <div className="text-xs font-semibold text-sky-700 mt-0.5">
                                                                {ex.subjects?.name || 'Mathematics'} {ex.subjects?.code ? `(${ex.subjects.code})` : ''}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-50 text-[#004B93] border border-sky-200">
                                                                <Layers size={13} />
                                                                {ex.omr_templates?.name?.slice(0, 32) || 'Standard Dual-Column 50'}...
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {isCompleted ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <CheckCircle size={13} /> Evaluated & Scored
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                                    Ready for Scan
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedExam(ex)
                                                                        setActiveTab('scanner')
                                                                    }}
                                                                    className="px-3.5 py-1.5 rounded-lg bg-[#004B93] hover:bg-sky-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                                                    title="Open AI Optical Scanner"
                                                                >
                                                                    <ScanLine size={14} />
                                                                    <span>Scan</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => window.open(`/api/dashboard/exams/omr/${ex.id}/print`, '_blank')}
                                                                    className="p-2 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#004B93] border border-slate-200 transition-all"
                                                                    title="Print Standardized OMR Sheets"
                                                                >
                                                                    <Printer size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenAnswerKey(ex)}
                                                                    className="p-2 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 transition-all"
                                                                    title="Master Answer Key"
                                                                >
                                                                    <FileSpreadsheet size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteExam(ex.id, ex.title)}
                                                                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 transition-all"
                                                                    title="Delete Exam"
                                                                >
                                                                    <Trash2 size={16} />
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
                    </div>
                )}

                {/* TAB 2: BLUEPRINT DESIGNER (FULL-WIDTH 2-COLUMN STUDIO) */}
                {activeTab === 'designer' && (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT: DESIGN CONTROLS */}
                        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-[#004B93] font-bold text-xs">
                                    <Sliders size={14} />
                                    <span>SHEET SPECIFICATION ENGINE</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mt-2">Design OMR Blueprint</h2>
                                <p className="text-slate-500 text-xs mt-1">Configure layout, fiducial markers, roll digit depth, and bubble counts.</p>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Blueprint Title</label>
                                    <input
                                        type="text"
                                        value={designerForm.name}
                                        onChange={e => setDesignerForm({ ...designerForm, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Questions</label>
                                        <select
                                            value={designerForm.total_questions}
                                            onChange={e => setDesignerForm({ ...designerForm, total_questions: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            <option value={20}>20 Questions (Quiz)</option>
                                            <option value={40}>40 Questions (CBSE T-1)</option>
                                            <option value={50}>50 Questions (Standard)</option>
                                            <option value={60}>60 Questions (JEE Sectional)</option>
                                            <option value={100}>100 Questions (State Board)</option>
                                            <option value={180}>180 Questions (NEET Speed)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Column Grid</label>
                                        <select
                                            value={designerForm.columns}
                                            onChange={e => setDesignerForm({ ...designerForm, columns: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            <option value={1}>1 Column (Compact)</option>
                                            <option value={2}>2 Columns (Standard Dual)</option>
                                            <option value={3}>3 Columns (High Density)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Options Per Item</label>
                                        <select
                                            value={designerForm.options_per_question}
                                            onChange={e => setDesignerForm({ ...designerForm, options_per_question: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            <option value={4}>4 Options (A, B, C, D)</option>
                                            <option value={5}>5 Options (A, B, C, D, E)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Roll Number Digits</label>
                                        <input
                                            type="number"
                                            value={designerForm.roll_digits}
                                            onChange={e => setDesignerForm({ ...designerForm, roll_digits: parseInt(e.target.value) })}
                                            min={6}
                                            max={12}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={designerForm.has_barcode}
                                            onChange={e => setDesignerForm({ ...designerForm, has_barcode: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 text-xs block">Enable QR / Code128 Barcode Verification</span>
                                            <span className="text-[11px] text-slate-500">Validates exam UUID and seat ID during optical scanner pass.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={designerForm.negative_marking}
                                            onChange={e => setDesignerForm({ ...designerForm, negative_marking: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 text-xs block">Negative Marking Penalty</span>
                                            <span className="text-[11px] text-slate-500">Deducts score for incorrect optical darkened responses.</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleSaveBlueprint}
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <SaveIcon />}
                                    <span>Save & Register Blueprint</span>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: LIVE INTERACTIVE OMR SHEET PREVIEW */}
                        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Printer size={18} className="text-[#004B93]" />
                                    <span className="font-black text-slate-900 text-sm">Real-Time Optical Sheet Render</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    A4 Physical Ready (300 DPI)
                                </span>
                            </div>

                            {/* SHEET REPLICA CONTAINER */}
                            <div className="w-full bg-white border-2 border-slate-900 rounded-lg p-6 relative font-mono text-xs shadow-inner min-h-[500px]">
                                {/* 4 CORNER FIDUCIAL ALIGNMENT MARKERS */}
                                <div className="absolute top-2 left-2 w-6 h-6 bg-black" />
                                <div className="absolute top-2 right-2 w-6 h-6 bg-black" />
                                <div className="absolute bottom-2 left-2 w-6 h-6 bg-black" />
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-black" />

                                {/* SHEET HEADER */}
                                <div className="text-center border-b-2 border-black pb-3 mb-4 mx-8">
                                    <div className="font-black text-base uppercase tracking-tight text-slate-950">
                                        BEBRILLIANT ACADEMY OF EXCELLENCE
                                    </div>
                                    <div className="font-bold text-xs uppercase text-slate-800 mt-0.5">
                                        {designerForm.name}
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-1">
                                        USE BLUE/BLACK BALLPOINT PEN ONLY • DARKEN BUBBLE FULLY
                                    </div>
                                </div>

                                {/* ROLL NUMBER GRID SIMULATION */}
                                <div className="flex items-center justify-between gap-4 border border-black p-3 mb-4 mx-8 bg-slate-50/50">
                                    <div className="font-bold text-[11px]">CANDIDATE ROLL NUMBER:</div>
                                    <div className="flex gap-1.5">
                                        {Array.from({ length: designerForm.roll_digits }).map((_, i) => (
                                            <div key={i} className="flex flex-col items-center gap-1">
                                                <div className="w-5 h-6 border border-black bg-white flex items-center justify-center font-bold text-[10px]">
                                                    {i + 1}
                                                </div>
                                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 text-[8px] flex items-center justify-center text-slate-400">0</div>
                                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 text-[8px] flex items-center justify-center text-slate-400">1</div>
                                            </div>
                                        ))}
                                    </div>
                                    {designerForm.has_barcode && (
                                        <div className="text-right">
                                            <div className="w-20 h-6 bg-slate-900 text-white flex items-center justify-center text-[9px] tracking-widest">
                                                ||| | |||| |
                                            </div>
                                            <div className="text-[8px] text-slate-500 mt-0.5 font-sans">BC-OMR-2026</div>
                                        </div>
                                    )}
                                </div>

                                {/* DYNAMIC BUBBLE COLUMNS */}
                                <div className={`grid grid-cols-${designerForm.columns} gap-6 mx-8 max-h-72 overflow-y-auto pr-2`}>
                                    {Array.from({ length: Math.min(designerForm.total_questions, 40) }).map((_, qIdx) => {
                                        const qNum = qIdx + 1
                                        return (
                                            <div key={qNum} className="flex items-center justify-between gap-2 py-1 border-b border-slate-200">
                                                <span className="font-bold text-slate-800 w-6 text-right text-[11px]">
                                                    {String(qNum).padStart(2, '0')}.
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {['A', 'B', 'C', 'D', 'E'].slice(0, designerForm.options_per_question).map((opt, oIdx) => (
                                                        <div
                                                            key={opt}
                                                            className={`w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold transition-all ${
                                                                qNum === 2 && opt === 'B' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {designerForm.total_questions > 40 && (
                                    <div className="text-center text-[10px] text-slate-400 mt-3 font-sans italic">
                                        + {designerForm.total_questions - 40} additional questions configured on second section / reverse side.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: AI OPTICAL SCANNER & EVALUATOR */}
                {activeTab === 'scanner' && (
                    <div className="w-full space-y-6">
                        <div className="w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-xs">
                                        <ScanLine size={14} />
                                        <span>ACTIVE SCANNING ENGINE</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                                        AI Optical Recognition & Evaluation Desk
                                    </h2>
                                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                        Ingest high-speed batch scans or upload photos directly from school administrative tablets.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold uppercase text-slate-500">Target Exam:</label>
                                    <select
                                        value={selectedExam?.id || ''}
                                        onChange={e => {
                                            const found = exams.find(x => x.id === e.target.value)
                                            setSelectedExam(found)
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 bg-white"
                                    >
                                        {exams.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* SCANNER WORKSTATION INTERACTION */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                                {/* UPLOAD / SCAN CONTROLS */}
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-8 text-center relative hover:bg-sky-50/70 transition-all">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#004B93] mx-auto mb-4 border border-sky-100">
                                            <UploadCloud size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">Ingest Scanned Bubble Sheets</h3>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                                            Drop PDF bundles from your feeder scanner or high-res photos (JPG, PNG). The AI engine will align corner fiducials and evaluate student answers.
                                        </p>

                                        {isScanningActive ? (
                                            <div className="mt-6 space-y-3 max-w-md mx-auto">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <span>{scanStage}</span>
                                                    <span>{scanProgress}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#004B93] to-sky-500 transition-all duration-300 rounded-full"
                                                        style={{ width: `${scanProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                                <button
                                                    onClick={handleTriggerBatchScan}
                                                    className="px-6 py-3 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                                >
                                                    <ScanLine size={16} />
                                                    <span>Run Automated Ingestion (32 Sheets)</span>
                                                </button>
                                                <button
                                                    onClick={() => showToast('Tablet Camera Scanner Ready', true)}
                                                    className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition-all flex items-center gap-2"
                                                >
                                                    <Camera size={16} />
                                                    <span>Capture via Tablet</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* PRECISION METRICS BANNER */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="text-xs text-slate-500 font-bold">Fiducial Tolerance</div>
                                            <div className="text-lg font-black text-slate-900 mt-0.5">±15° Skew</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="text-xs text-slate-500 font-bold">Bubble Threshold</div>
                                            <div className="text-lg font-black text-slate-900 mt-0.5">55% Shading</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="text-xs text-slate-500 font-bold">Barcode Support</div>
                                            <div className="text-lg font-black text-emerald-600 mt-0.5">Auto-Mapped</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: RECENT BATCH LOGS */}
                                <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-slate-900 text-sm">Batch Ingestion History</h4>
                                        <span className="text-[11px] font-bold text-slate-500">{recentUploads.length} Batches Logged</span>
                                    </div>

                                    <div className="space-y-3">
                                        {recentUploads.length === 0 ? (
                                            <div className="text-center py-8 text-xs text-slate-400">No scanner uploads logged yet</div>
                                        ) : (
                                            recentUploads.map((u: any) => (
                                                <div key={u.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {u.offline_exams?.title || 'Batch Scan'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                                            <span>{u.processed_sheets} Sheets</span>
                                                            <span>•</span>
                                                            <span className="uppercase text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{u.source || 'bulk'}</span>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                        <CheckCircle size={11} /> Completed
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: STANDARDIZED TEMPLATES GALLERY */}
                {activeTab === 'templates' && (
                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Standardized Bubble Sheet Catalog</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                    Pre-engineered, tested optical templates compliant with Indian and International school board mandates.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('designer')}
                                className="px-4 py-2 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-2"
                            >
                                <PlusCircle size={15} />
                                <span>Create Custom Blueprint</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {templates.map(tmpl => {
                                const config = tmpl.layout_config || {}
                                return (
                                    <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                                        <div className="space-y-4">
                                            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#004B93] group-hover:scale-110 transition-transform">
                                                <Layers size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{tmpl.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                                                    {config.sections ? config.sections.join(', ') : 'Standardized single-page examination matrix.'}
                                                </p>
                                            </div>
                                            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Total Questions:</span>
                                                    <span className="font-bold text-slate-900">{tmpl.total_questions} Qs</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Column Grid:</span>
                                                    <span className="font-bold text-slate-900">{config.columns || 2} Columns</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Roll Digits:</span>
                                                    <span className="font-bold text-slate-900">{config.roll_digits || 8} Digits</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Options:</span>
                                                    <span className="font-bold text-slate-900">{tmpl.options_per_question || 4} Choices</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                onClick={() => {
                                                    setNewExamForm(prev => ({
                                                        ...prev,
                                                        omr_template_id: tmpl.id,
                                                        total_questions: tmpl.total_questions
                                                    }))
                                                    handleOpenCreateModal()
                                                }}
                                                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#004B93] text-slate-700 hover:text-white font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <span>Deploy with Exam</span>
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 5: RESULTS & ANALYTICS */}
                {activeTab === 'analytics' && (
                    <div className="w-full space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cohort Average Score</div>
                                <div className="text-3xl font-black text-slate-900 mt-2">78.4%</div>
                                <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                    <ArrowUpRight size={13} /> +4.2% vs previous term
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Peak Performance</div>
                                <div className="text-3xl font-black text-[#004B93] mt-2">98.0%</div>
                                <div className="text-xs font-semibold text-slate-500 mt-1">Aarav Sharma • Grade 10 Math</div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Scanner Audit Status</div>
                                <div className="text-3xl font-black text-emerald-600 mt-2">100% Verified</div>
                                <div className="text-xs font-semibold text-slate-500 mt-1">0 manual intervention flags</div>
                            </div>
                        </div>

                        {/* STUDENT RESULTS TABLE */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">Candidate Evaluation Ledger</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Direct optical sheet responses mapped to student gradebook.</p>
                                </div>
                                <button
                                    onClick={() => showToast('Exporting OMR Results to CSV...', true)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2"
                                >
                                    <Download size={14} />
                                    <span>Export Gradebook CSV</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                            <th className="py-3.5 px-6">Candidate / Seat</th>
                                            <th className="py-3.5 px-6">Exam Title</th>
                                            <th className="py-3.5 px-6">Total Questions</th>
                                            <th className="py-3.5 px-6">Correct</th>
                                            <th className="py-3.5 px-6">Total Marks</th>
                                            <th className="py-3.5 px-6">Optical Confidence</th>
                                            <th className="py-3.5 px-6 text-right">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { name: 'Aarav Sharma', seat: 'SEAT-101', exam: 'All-India STEM & Cyber Talent', total: 60, correct: 58, marks: 232, conf: 99.8, res: 'PASS' },
                                            { name: 'Diya Kapoor', seat: 'SEAT-102', exam: 'All-India STEM & Cyber Talent', total: 60, correct: 54, marks: 212, conf: 99.4, res: 'PASS' },
                                            { name: 'Rohan Gupta', seat: 'SEAT-103', exam: 'All-India STEM & Cyber Talent', total: 60, correct: 51, marks: 198, conf: 99.1, res: 'PASS' },
                                            { name: 'Ananya Iyer', seat: 'SEAT-104', exam: 'Senior Physics Weekly Drill', total: 25, correct: 24, marks: 96, conf: 99.9, res: 'PASS' },
                                            { name: 'Siddharth Nair', seat: 'SEAT-105', exam: 'Senior Physics Weekly Drill', total: 25, correct: 21, marks: 84, conf: 98.7, res: 'PASS' }
                                        ].map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50/60">
                                                <td className="py-4 px-6 font-bold text-slate-900">
                                                    <div>{r.name}</div>
                                                    <div className="text-[11px] font-mono text-slate-400">{r.seat}</div>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">{r.exam}</td>
                                                <td className="py-4 px-6 text-slate-600">{r.total} Qs</td>
                                                <td className="py-4 px-6 font-bold text-emerald-600">{r.correct}</td>
                                                <td className="py-4 px-6 font-black text-slate-900">{r.marks} pts</td>
                                                <td className="py-4 px-6 font-semibold text-sky-700">{r.conf}%</td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {r.res}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: CREATE NEW OMR EXAM */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
                        
                        {/* MODAL HEADER (Fixed Top) */}
                        <div className="shrink-0 px-6 sm:px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-[#004B93]/10 border border-[#004B93]/20 flex items-center justify-center text-[#004B93] shadow-sm">
                                    <ScanLine size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Launch New OMR Examination</h3>
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <Sparkles size={12} /> Live Sync
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Generates standardized scannable bubble sheets mapped to state & national boards, official syllabus & exam patterns.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fetchBlueprintContext()}
                                    disabled={contextLoading}
                                    title="Refire & reload published board patterns from registry"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <RefreshCw size={13} className={contextLoading ? 'animate-spin text-[#004B93]' : ''} />
                                    <span className="hidden md:inline">Refire Registry</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <XCircle size={22} />
                                </button>
                            </div>
                        </div>

                        {/* MODAL BODY (Scrollable Workspace) */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/50">
                            <form id="create-omr-form" onSubmit={handleCreateExam} className="space-y-6 text-sm">
                                
                                {/* CARD 1: SYLLABUS & STANDARD PATTERN SELECTOR */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#004B93] flex items-center justify-center font-black text-xs border border-sky-100">
                                                1
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm sm:text-base">Syllabus Scope & Standard Board Pattern</h4>
                                                <p className="text-xs text-slate-500">Pick board, class, subject & live exam patterns (e.g. Gujarat Board, CBSE, ICSE).</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Master Unified Syllabus & Exam Pattern Picker */}
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
                                            const matched = classes.find((c: any) => c.name.toLowerCase() === cNode.name.toLowerCase()) || classes[0]
                                            setNewExamForm(prev => ({ ...prev, class_id: matched?.id || cNode.id }))
                                            setSelectedSubjectId('')
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectSubject={sNode => {
                                            setSelectedSubjectId(sNode.id)
                                            const matched = subjects.find((s: any) => s.name.toLowerCase() === sNode.name.toLowerCase()) || subjects[0]
                                            setNewExamForm(prev => ({ ...prev, subject_id: matched?.id || sNode.id }))
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectChapters={chIds => {
                                            setSelectedChapterIds(chIds)
                                            setNewExamForm(prev => ({ ...prev, chapter_ids: chIds }))
                                        }}
                                        onSelectTopics={tpIds => {
                                            setSelectedTopicIds(tpIds)
                                            setNewExamForm(prev => ({ ...prev, topic_ids: tpIds }))
                                        }}
                                        onSelectPattern={pattern => {
                                            setSelectedPatternId(pattern.id)
                                            const totalQ = pattern.sections?.reduce(
                                                (acc: number, s: any) => acc + (s.rules?.reduce((ra: number, r: any) => ra + Number(r.num_questions || 0), 0) || 0), 0
                                            ) || 50
                                            const matchingOmr = templates.find((t: any) => t.total_questions === totalQ) || templates[0]
                                            setNewExamForm(prev => ({
                                                ...prev,
                                                template_id: pattern.id,
                                                title: prev.title ? prev.title : `${pattern.name} OMR Assessment`,
                                                total_questions: totalQ,
                                                duration: pattern.duration_minutes || 60,
                                                omr_template_id: matchingOmr?.id || prev.omr_template_id
                                            }))
                                            showToast(`Pattern "${pattern.name}" loaded for physical OMR test!`, true)
                                        }}
                                    />
                                </div>

                                {/* CARD 2: PAPER SPECIFICATIONS & BUBBLE LAYOUT */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#004B93] flex items-center justify-center font-black text-xs border border-sky-100">
                                                2
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm sm:text-base">Examination Details & Bubble Sheet Architecture</h4>
                                                <p className="text-xs text-slate-500">Configure title, duration, question budget and scanner grid template.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exam Title */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                            Exam Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Grade 10 Midterm Mathematics OMR Assessment"
                                            value={newExamForm.title}
                                            onChange={e => setNewExamForm({ ...newExamForm, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#004B93] focus:border-[#004B93] focus:outline-none transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* 3-Column Specifications Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                                Bubble Count (Questions)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={newExamForm.total_questions}
                                                    onChange={e => setNewExamForm({ ...newExamForm, total_questions: parseInt(e.target.value) || 0 })}
                                                    min={10}
                                                    max={200}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-sm"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    Qs
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                                Duration (Minutes)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={newExamForm.duration}
                                                    onChange={e => setNewExamForm({ ...newExamForm, duration: parseInt(e.target.value) || 0 })}
                                                    min={15}
                                                    max={300}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-sm"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    Mins
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                                Optical Bubble Grid Layout
                                            </label>
                                            <select
                                                value={newExamForm.omr_template_id}
                                                onChange={e => setNewExamForm({ ...newExamForm, omr_template_id: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-sm"
                                            >
                                                {templates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.total_questions} Qs)</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* MODAL FOOTER (Fixed Bottom) */}
                        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-3 py-1 rounded-lg bg-sky-50 text-[#004B93] font-black border border-sky-100">
                                    {newExamForm.total_questions} Questions
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-black border border-amber-200/80">
                                    {newExamForm.duration} Mins
                                </span>
                                {newExamForm.template_id && (
                                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle size={13} /> Pattern Linked
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-omr-form"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md shadow-sky-950/20 flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span>Deploy Examination</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL 2: ANSWER KEY MASTER CONFIGURATION */}
            {isAnswerKeyModalOpen && selectedExam && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Answer Key Master Configuration</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedExam.title} ({selectedExam.total_questions} Questions)</p>
                            </div>
                            <button
                                onClick={() => setIsAnswerKeyModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            <div className="flex items-center justify-between bg-sky-50 p-3 rounded-xl border border-sky-200">
                                <span className="text-xs font-bold text-[#004B93]">Quick Fill Pattern:</span>
                                <div className="flex gap-2">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                const updated: { [key: number]: string } = {}
                                                const total = selectedExam.total_questions || 50
                                                for (let i = 1; i <= total; i++) updated[i] = opt
                                                setAnswerKeys(updated)
                                            }}
                                            className="px-2.5 py-1 rounded-md bg-white border border-sky-300 font-bold text-xs text-[#004B93] hover:bg-sky-100"
                                        >
                                            All {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {Array.from({ length: selectedExam.total_questions || 50 }).map((_, idx) => {
                                    const qNo = idx + 1
                                    const selected = answerKeys[qNo] || 'A'
                                    return (
                                        <div key={qNo} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                                            <span className="font-extrabold text-xs text-slate-700 w-6">Q{qNo}</span>
                                            <div className="flex gap-1">
                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setAnswerKeys({ ...answerKeys, [qNo]: opt })}
                                                        className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                                                            selected === opt
                                                                ? 'bg-[#004B93] text-white shadow-sm'
                                                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => setIsAnswerKeyModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 text-xs"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    showToast('Master Answer Key saved for automated grading!', true)
                                    setIsAnswerKeyModalOpen(false)
                                }}
                                className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-md"
                            >
                                Save Answer Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: BATCH INGESTION DRAWER */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Batch Feeder Ingestion</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Feed physical scans directly into the AI optical recognition engine.</p>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Target Physical Examination</label>
                                <select
                                    value={selectedExam?.id || ''}
                                    onChange={e => {
                                        const found = exams.find(x => x.id === e.target.value)
                                        setSelectedExam(found)
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                >
                                    {exams.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.title} ({ex.classes?.name || 'Class 10'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-sky-200 bg-sky-50/50 rounded-2xl p-8 text-center">
                                <UploadCloud size={40} className="mx-auto text-[#004B93] mb-3" />
                                <div className="font-bold text-slate-900 text-sm">Upload Multi-Page Scan PDF or Image Batch</div>
                                <div className="text-xs text-slate-500 mt-1">Supports ADF Scanners (Fujitsu, Epson, Canon, HP) up to 200 sheets</div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <span className="font-bold text-slate-700">Estimated Processing Speed:</span>
                                <span className="font-black text-sky-700">1,200 sheets / min (AI Engine)</span>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTriggerBatchScan}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    <ScanLine size={16} />
                                    <span>Initiate Batch Evaluation</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SaveIcon() {
    return <CheckCircle size={18} />
}
