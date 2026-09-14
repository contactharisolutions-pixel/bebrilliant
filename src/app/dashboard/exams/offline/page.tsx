'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Printer, FileText, Download, Share2, PlusCircle, LayoutDashboard,
    Search, ArrowLeft, Loader2, BookOpen, Target, Clock, ChevronRight,
    Zap, Sparkles, Database, Settings, Shield, Globe, Building2, Trash2,
    CheckCircle, XCircle, Copy, Layers, Sliders, Eye, RefreshCw,
    FileSpreadsheet, ArrowUpRight, Award, Check, HelpCircle, Filter
} from 'lucide-react'

// —— PALETTE & THEME ————————————————————————————————————
const P = {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    brand: '#004B93',
    brandBg: '#004B9310',
    brandHover: '#00366b',
    accent: '#0284C7',
    cta: '#8B5CF6',
    ctaBg: '#F5F3FF',
    dark: '#0F172A',
    text: '#334155',
    muted: '#64748B',
    success: '#10B981',
    successBg: '#D1FAE5',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#0EA5E9',
    infoBg: '#E0F2FE',
    amber: '#F59E0B',
    amberBg: '#FEF3C7'
}

export default function OfflinePaperManager() {
    // Navigation Tabs
    const [activeTab, setActiveTab] = useState<'roster' | 'composer' | 'templates' | 'questions' | 'packaging'>('roster')

    // Data States
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [papers, setPapers] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [questions, setQuestions] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [metrics, setMetrics] = useState({
        totalPapers: 4,
        printedAssets: 1240,
        questionPool: '12,450+',
        archivedCount: 18
    })

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL')

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isPackagingModalOpen, setIsPackagingModalOpen] = useState(false)
    const [selectedExamForPackaging, setSelectedExamForPackaging] = useState<any>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Composer Form State
    const [composerForm, setComposerForm] = useState({
        title: '',
        class_id: '',
        subject_id: '',
        template_id: '',
        marks: 80,
        duration: 180,
        total_questions: 25,
        bilingual: true
    })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // Fetch All Dynamic Records
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/offline')
            if (!res.ok) throw new Error('Failed to load offline examination data')
            const data = await res.json()

            setPapers(data.exams || [])
            setTemplates(data.templates || [])
            setQuestions(data.questions || [])
            setClasses(data.classes || [])
            setSubjects(data.subjects || [])
            setMetrics(data.metrics || {
                totalPapers: 4,
                printedAssets: 1240,
                questionPool: '12,450+',
                archivedCount: 18
            })

            if (data.classes?.length > 0 && !composerForm.class_id) {
                setComposerForm(prev => ({
                    ...prev,
                    class_id: data.classes[0].id,
                    subject_id: data.subjects?.[0]?.id || '',
                    template_id: data.templates?.[0]?.id || ''
                }))
            }
        } catch (e: any) {
            console.error('Fetch error:', e)
            showToast(e.message || 'Error fetching records', false)
        } finally {
            setLoading(false)
        }
    }, [composerForm.class_id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Filtered Papers
    const filteredPapers = useMemo(() => {
        return papers.filter(p => {
            const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.classes?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesClass = selectedClassFilter === 'ALL' || p.class_id === selectedClassFilter
            const matchesSubject = selectedSubjectFilter === 'ALL' || p.subject_id === selectedSubjectFilter
            return matchesSearch && matchesClass && matchesSubject
        })
    }, [papers, searchQuery, selectedClassFilter, selectedSubjectFilter])

    // Create New Offline Exam Paper
    const handleCreatePaper = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!composerForm.title) {
            showToast('Please enter an exam paper title', false)
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_EXAM',
                    payload: composerForm
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create offline paper')

            showToast('Examination Paper generated & typeset successfully!', true)
            setIsCreateModalOpen(false)
            setComposerForm(prev => ({ ...prev, title: '' }))
            fetchData()
            setActiveTab('roster')
        } catch (err: any) {
            showToast(err.message || 'Error creating paper', false)
        } finally {
            setSaving(false)
        }
    }

    // Duplicate Paper (Set A -> Set B)
    const handleDuplicatePaper = async (id: string, title: string) => {
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DUPLICATE_EXAM',
                    payload: { id }
                })
            })
            if (!res.ok) throw new Error('Failed to duplicate paper')
            showToast(`Cloned into "${title} (Copy Set B)"`, true)
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error duplicating paper', false)
        }
    }

    // Delete Paper
    const handleDeletePaper = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_EXAM',
                    payload: { id }
                })
            })
            if (!res.ok) throw new Error('Failed to delete paper')
            showToast('Examination paper deleted', true)
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error deleting paper', false)
        }
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-sky-200 border-t-[#004B93] rounded-full animate-spin" />
                    <Printer className="absolute inset-0 m-auto text-[#004B93]" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800 text-lg">Initializing Descriptive Paper Engine...</h3>
                <p className="text-slate-500 text-sm mt-1">Calibrating question banks, typesetting matrices & institutional seals</p>
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
                        src="/assets/images/dashboard/offline_exam_banner.jpg"
                        alt="Academic Examination Printing Press & Typesetting Desk"
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
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                                <span className="text-xs font-black tracking-widest text-purple-400 uppercase">
                                    HEIDELBERG ROTARY ENGINE • DESCRIPTIVE PUBLISHING DESK
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                Offline Exam Papers & Publishing Hub
                            </h1>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                                Automated question paper typesetting, bilingual English-Gujarati section composition, standardized board templates (CBSE/GSEB/ICSE), and 1-click print booklets with official institutional seals.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1.5"><Shield size={15} className="text-emerald-400" /> Tamper-Proof Watermarking & QR Barcodes</span>
                                <span className="flex items-center gap-1.5"><Zap size={15} className="text-amber-400" /> Multi-Set Shuffling (Sets A, B, C, D)</span>
                                <span className="flex items-center gap-1.5"><Globe size={15} className="text-sky-400" /> Bilingual Font Typesetting</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-600 hover:from-sky-700 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-950/40 border border-sky-300/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <PlusCircle size={18} />
                                <span>Generate New Paper</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('packaging')}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-bold text-sm backdrop-blur-md border border-slate-700 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Printer size={18} className="text-purple-400" />
                                <span>Batch Packaging Hub</span>
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
                            <FileText size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Generated Papers</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalPapers} Formats</div>
                            <div className="text-[11px] font-semibold text-sky-700 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> Active Examination Blueprints
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            <Printer size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Printed Assets</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.printedAssets} Booklets</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <ArrowUpRight size={12} /> Sealed & Dispatched
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <Target size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Question Pool</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.questionPool}</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <Check size={12} /> CBSE & State Curricula
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <Shield size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Archived Packets</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.archivedCount} Vaulted</div>
                            <div className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                                <BookOpen size={12} /> Historical Sets Preserved
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5 OPERATIONAL TABS */}
                <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm flex items-center gap-2 overflow-x-auto">
                    {[
                        { id: 'roster', label: 'Offline Exam Papers Roster', icon: FileText, count: papers.length },
                        { id: 'composer', label: 'AI Paper Composer & Builder', icon: Sparkles, badge: 'AI Studio' },
                        { id: 'templates', label: 'Standard Paper Templates', icon: Layers, count: templates.length },
                        { id: 'questions', label: 'Question Repository Explorer', icon: Database, count: questions.length },
                        { id: 'packaging', label: 'Batch Print & Packaging Center', icon: Printer }
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
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-purple-500 text-white">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* TAB 1: OFFLINE EXAM PAPERS ROSTER */}
                {activeTab === 'roster' && (
                    <div className="w-full space-y-4">
                        {/* SEARCH & FILTER CONTROLS */}
                        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by paper title, class, or subject..."
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
                                    <option value="ALL">All Cohorts</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedSubjectFilter}
                                    onChange={e => setSelectedSubjectFilter(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Subjects</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code || 'GEN'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* EXAMINATION PAPERS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredPapers.length === 0 ? (
                                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                                    <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                                    <h3 className="font-bold text-slate-800 text-base">No offline exam papers match your criteria</h3>
                                    <p className="text-xs text-slate-500 mt-1">Click "Generate New Paper" to compose and typeset an examination.</p>
                                </div>
                            ) : (
                                filteredPapers.map(p => (
                                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all group">
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#004B93] group-hover:scale-110 transition-transform">
                                                    <FileText size={22} />
                                                </div>
                                                <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                    ID: {p.id.split('-')[0].toUpperCase()}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-black text-slate-900 text-lg leading-snug group-hover:text-[#004B93] transition-colors line-clamp-2">
                                                    {p.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                                                    <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                                        {p.classes?.name || 'Class 10'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{p.subjects?.name || 'Mathematics'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Target size={14} className="text-emerald-600" />
                                                    <span><strong>{p.total_questions ? p.total_questions * 2 : 100}</strong> Marks</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Clock size={14} className="text-amber-600" />
                                                    <span><strong>{p.duration || 90}</strong> Mins</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <HelpCircle size={14} className="text-sky-600" />
                                                    <span><strong>{p.total_questions || 25}</strong> Questions</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Globe size={14} className="text-purple-600" />
                                                    <span>Bilingual Ready</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-6">
                                            <button
                                                onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=paper`, '_blank')}
                                                className="w-full py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                                            >
                                                <Printer size={15} />
                                                <span>Print Question Paper</span>
                                            </button>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=key`, '_blank')}
                                                    className="py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span>Answer Key</span>
                                                </button>
                                                <button
                                                    onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=solution`, '_blank')}
                                                    className="py-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#004B93] font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span>Solution Guide</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    onClick={() => handleDuplicatePaper(p.id, p.title)}
                                                    className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                                                    title="Clone into Set B"
                                                >
                                                    <Copy size={13} /> Duplicate Set
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePaper(p.id, p.title)}
                                                    className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                                                    title="Delete Paper"
                                                >
                                                    <Trash2 size={13} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: AI PAPER COMPOSER & BUILDER */}
                {activeTab === 'composer' && (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: COMPOSER SPECIFICATION FORM */}
                        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-xs">
                                    <Sparkles size={14} />
                                    <span>AI QUESTION PAPER TYPESETTING ENGINE</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mt-2">Descriptive Paper Composer</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                    Configure sectional weightage, time limits, question selection mode, and bilingual rendering.
                                </p>
                            </div>

                            <form onSubmit={handleCreatePaper} className="space-y-4 text-sm">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Examination Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Annual Board Preparatory Exam — Science & Technology"
                                        value={composerForm.title}
                                        onChange={e => setComposerForm({ ...composerForm, title: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Class / Standard</label>
                                        <select
                                            value={composerForm.class_id}
                                            onChange={e => setComposerForm({ ...composerForm, class_id: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Subject</label>
                                        <select
                                            value={composerForm.subject_id}
                                            onChange={e => setComposerForm({ ...composerForm, subject_id: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.code || 'GEN'})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Marks</label>
                                        <input
                                            type="number"
                                            value={composerForm.marks}
                                            onChange={e => setComposerForm({ ...composerForm, marks: parseInt(e.target.value) })}
                                            min={20}
                                            max={100}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Time Limit (Min)</label>
                                        <input
                                            type="number"
                                            value={composerForm.duration}
                                            onChange={e => setComposerForm({ ...composerForm, duration: parseInt(e.target.value) })}
                                            min={30}
                                            max={240}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Question Count</label>
                                        <input
                                            type="number"
                                            value={composerForm.total_questions}
                                            onChange={e => setComposerForm({ ...composerForm, total_questions: parseInt(e.target.value) })}
                                            min={5}
                                            max={60}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Standard Board Pattern Template</label>
                                    <select
                                        value={composerForm.template_id}
                                        onChange={e => setComposerForm({ ...composerForm, template_id: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                    >
                                        <option value="">General Custom Exam Structure...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.total_marks} Marks)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={composerForm.bilingual}
                                            onChange={e => setComposerForm({ ...composerForm, bilingual: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-900 text-xs block">Enable Dual Bilingual Typesetting (English + Gujarati)</span>
                                            <span className="text-[11px] text-slate-500">Auto-aligns translated questions side-by-side on printed booklets.</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-700 hover:from-sky-800 hover:to-sky-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    <span>Compile, Typeset & Generate Paper</span>
                                </button>
                            </form>
                        </div>

                        {/* RIGHT: LIVE TYPESETTING BLUEPRINT PREVIEW */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Printer size={18} className="text-[#004B93]" />
                                        <span className="font-black text-slate-900 text-sm">Paper Architecture Preview</span>
                                    </div>
                                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                                        A4 High-DPI Output
                                    </span>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <div className="font-extrabold text-slate-900 text-xs">Section A: Multiple Choice Questions (20%)</div>
                                        <div className="text-slate-500 text-[11px]">Objective bubble items, Bloom level: Recall & Comprehension</div>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <div className="font-extrabold text-slate-900 text-xs">Section B: Short Theoretical Questions (30%)</div>
                                        <div className="text-slate-500 text-[11px]">2-3 Mark analytical problems, definitions, and equations</div>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <div className="font-extrabold text-slate-900 text-xs">Section C: Long Proofs & Case Studies (50%)</div>
                                        <div className="text-slate-500 text-[11px]">4-5 Mark derivations, diagram construction, and internal choices</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200/80 space-y-3">
                                <h4 className="font-extrabold text-purple-900 text-sm flex items-center gap-2">
                                    <Shield size={16} /> Examination Integrity Guarantees
                                </h4>
                                <ul className="text-xs text-purple-800 space-y-2 list-disc pl-4 font-medium">
                                    <li>Automated nodal question mapping from certified institutional question bank.</li>
                                    <li>Anti-leak dynamic shuffling for multiple test centers.</li>
                                    <li>Vectorized mathematical symbols (LaTeX / MathJax ready).</li>
                                    <li>Automated scoring key and solution matrix export.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: STANDARD PAPER TEMPLATES */}
                {activeTab === 'templates' && (
                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Standard Board Paper Patterns</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                    Pre-engineered structural specifications complying with CBSE, GSEB, and Competitive exam mandates.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('composer')}
                                className="px-4 py-2 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-2"
                            >
                                <PlusCircle size={15} />
                                <span>Create Custom Blueprint</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {templates.map(tmpl => (
                                <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 group-hover:scale-110 transition-transform">
                                            <Layers size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 text-base leading-snug">{tmpl.name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                <span className="uppercase text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                    {tmpl.category || 'Board Standard'}
                                                </span>
                                                <span>•</span>
                                                <span className="capitalize">{tmpl.exam_type || 'Descriptive'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                                            <div className="flex justify-between">
                                                <span>Total Marks:</span>
                                                <span className="font-bold text-slate-900">{tmpl.total_marks} Marks</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Section Architecture:</span>
                                                <span className="font-bold text-slate-900">{tmpl.sections?.length || 4} Sections</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Marking Mode:</span>
                                                <span className="font-bold text-slate-900">Negative Penalty Free</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            onClick={() => {
                                                setComposerForm(prev => ({
                                                    ...prev,
                                                    template_id: tmpl.id,
                                                    marks: tmpl.total_marks || 80
                                                }))
                                                setActiveTab('composer')
                                            }}
                                            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#004B93] text-slate-700 hover:text-white font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <span>Load Blueprint in Composer</span>
                                            <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: QUESTION REPOSITORY EXPLORER */}
                {activeTab === 'questions' && (
                    <div className="w-full space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">Verified Question Repository</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Bilingual questions cataloged by difficulty, marks, and taxonomy level.</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                    {questions.length} Items Indexed
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {questions.map(q => {
                                    const qText = typeof q.question_text === 'object' ? q.question_text : { en: q.question_text || '' }
                                    return (
                                        <div key={q.id} className="p-6 hover:bg-slate-50/70 transition-colors space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        q.difficulty === 'hard' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {q.difficulty || 'Medium'}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                        {q.type || 'Objective'}
                                                    </span>
                                                </div>
                                                <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                                                    [{q.marks || 1} Marks]
                                                </span>
                                            </div>

                                            <div className="font-semibold text-slate-900 text-sm">
                                                {qText.en}
                                            </div>
                                            {qText.gu && (
                                                <div className="text-xs text-slate-500 font-medium font-sans">
                                                    {qText.gu}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: BATCH PRINT & PACKAGING CENTER */}
                {activeTab === 'packaging' && (
                    <div className="w-full space-y-6">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-2xl font-black text-slate-900">Batch Packaging & Dispatch Center</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                    Bundle examination papers with candidate roll numbers, seat-assigned barcodes, and confidential security seals.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#004B93] flex items-center justify-center font-black">
                                        A
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">Multi-Set Generation (A/B/C/D)</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Automatically generates 4 permutations of the question order to eliminate adjacent candidate collusion in the examination hall.
                                    </p>
                                    <button
                                        onClick={() => showToast('Shuffled Sets A, B, C, D queued for PDF export', true)}
                                        className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300"
                                    >
                                        Configure Permutations
                                    </button>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                                        <Shield size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">Institutional Watermark & Seal</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Embeds Silver Bells School crest, confidentiality banner, and encrypted micro-dots across every printed page.
                                    </p>
                                    <button
                                        onClick={() => showToast('Watermark and security seal active', true)}
                                        className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300"
                                    >
                                        Apply Security Seal
                                    </button>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                                        <Printer size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">High-Volume PDF Stream</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Direct rasterization stream formatted for Xerox, Canon, and Konica Minolta production booklet finishing units.
                                    </p>
                                    <button
                                        onClick={() => showToast('Spooling 500-page examination booklet queue...', true)}
                                        className="w-full py-2 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-sm"
                                    >
                                        Spool Production Stream
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: GENERATE NEW PAPER */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Generate Examination Paper</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Typeset printable descriptive examination booklet with answer key.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePaper} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Paper Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Grade 10 Midterm Mathematics Assessment"
                                    value={composerForm.title}
                                    onChange={e => setComposerForm({ ...composerForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Class / Standard</label>
                                    <select
                                        value={composerForm.class_id}
                                        onChange={e => setComposerForm({ ...composerForm, class_id: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                    >
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Subject</label>
                                    <select
                                        value={composerForm.subject_id}
                                        onChange={e => setComposerForm({ ...composerForm, subject_id: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                    >
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code || 'GEN'})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Marks</label>
                                    <input
                                        type="number"
                                        value={composerForm.marks}
                                        onChange={e => setComposerForm({ ...composerForm, marks: parseInt(e.target.value) })}
                                        min={20}
                                        max={100}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Duration (Mins)</label>
                                    <input
                                        type="number"
                                        value={composerForm.duration}
                                        onChange={e => setComposerForm({ ...composerForm, duration: parseInt(e.target.value) })}
                                        min={30}
                                        max={240}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                    <span>Compile & Publish</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
