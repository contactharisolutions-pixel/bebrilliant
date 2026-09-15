'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
    Calendar, TrendingUp, Users, ShieldCheck,
    ArrowRight, CheckCircle2, AlertCircle, Save,
    Plus, Settings2, History, Rocket, BookOpen,
    GraduationCap, RefreshCcw, Filter, Edit, X, Search,
    ChevronRight, Info, Trash2, Clock, Sparkles, AlertTriangle,
    Layers, Check, Award
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AcademicYear {
    id: string
    name: string
    start_date: string
    end_date: string
    is_active: boolean
    classes_count?: number
    created_at?: string
    updated_at?: string
}

interface PromotionRule {
    id?: string
    from_class: string
    to_class: string
    to_division?: string
    auto_promote?: boolean
}

interface CandidatePreview {
    id: string
    name: string
    email?: string
    old_class: string
    old_division: string
    new_class: string
    new_division: string
    can_promote: boolean
    is_graduating: boolean
    already_migrated: boolean
    audit_status: 'AUDIT_PASSED' | 'RULE_MISSING' | 'GRADUATING' | 'ALREADY_MIGRATED'
}

interface MigrationLog {
    id: string
    academic_year_id: string
    promoted_count: number
    graduated_count: number
    failed_count: number
    created_at: string
}

interface Toast {
    id: string
    type: 'success' | 'error' | 'info'
    message: string
}

export default function AcademicYearPortal() {
    const [loading, setLoading] = useState(true)
    const [years, setYears] = useState<AcademicYear[]>([])
    const [activeYear, setActiveYear] = useState<AcademicYear | null>(null)
    const [classes, setClasses] = useState<any[]>([])
    const [rules, setRules] = useState<PromotionRule[]>([])
    const [preview, setPreview] = useState<CandidatePreview[]>([])
    const [previewSummary, setPreviewSummary] = useState<any>(null)
    const [migrationLogs, setMigrationLogs] = useState<MigrationLog[]>([])
    const [stats, setStats] = useState<any>(null)

    // Navigation & Filtering
    const [activeTab, setActiveTab] = useState<'years' | 'rules' | 'promote' | 'logs'>('years')
    const [candidateFilter, setCandidateFilter] = useState<'ALL' | 'ELIGIBLE' | 'MISSING' | 'GRADUATING'>('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

    // Forms & Action Modals
    const [newYear, setNewYear] = useState({ name: '', start_date: '', end_date: '', make_active: false })
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
    const [targetYearId, setTargetYearId] = useState('')
    const [confirmMigrationOpen, setConfirmMigrationOpen] = useState(false)
    const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null)

    // Async states
    const [executing, setExecuting] = useState(false)
    const [savingRules, setSavingRules] = useState(false)
    const [submittingYear, setSubmittingYear] = useState(false)
    const [generatingRules, setGeneratingRules] = useState(false)

    // Toasts
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [yRes, rRes] = await Promise.all([
                fetch('/api/dashboard/tenant/academic-year'),
                fetch('/api/dashboard/tenant/promotion/rules')
            ])

            const yData = await yRes.json()
            const rData = await rRes.json()

            if (yRes.ok) {
                setYears(yData.years || [])
                setActiveYear(yData.active_year || null)
                setClasses(yData.classes || [])
                setMigrationLogs(yData.promotion_logs || [])
                setStats(yData.stats || null)
            } else {
                addToast(yData.error || 'Failed to load academic sessions', 'error')
            }

            if (rRes.ok) {
                setRules(rData.rules || [])
            }
        } catch (err: any) {
            console.error('Fetch error:', err)
            addToast('Network communication error while synchronizing data', 'error')
        } finally {
            setLoading(false)
        }
    }

    // ── QUICK PRESET BUILDER ─────────────────────────────────────────
    const applyYearPreset = (yearStart: number) => {
        const yearEnd = yearStart + 1
        setNewYear({
            name: `Academic Session ${yearStart}-${yearEnd.toString().slice(-2)}`,
            start_date: `${yearStart}-04-01`,
            end_date: `${yearEnd}-03-31`,
            make_active: false
        })
    }

    // ── YEAR MANAGEMENT ACTIONS ──────────────────────────────────────
    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newYear.name.trim()) return addToast('Please enter a valid cycle designation', 'error')
        if (!newYear.start_date || !newYear.end_date) return addToast('Please select operational dates', 'error')
        if (new Date(newYear.end_date) <= new Date(newYear.start_date)) {
            return addToast('Termination date must be after Activation date', 'error')
        }

        setSubmittingYear(true)
        try {
            const res = await fetch('/api/dashboard/tenant/academic-year', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newYear)
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast('Academic cycle initialized successfully', 'success')
                setNewYear({ name: '', start_date: '', end_date: '', make_active: false })
                await fetchInitialData()
            } else {
                addToast(data.error || 'Failed to initialize session', 'error')
            }
        } catch (err) {
            addToast('Failed to communicate with session service', 'error')
        } finally {
            setSubmittingYear(false)
        }
    }

    const handleUpdateYear = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingYear) return

        setSubmittingYear(true)
        try {
            const res = await fetch('/api/dashboard/tenant/academic-year', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingYear)
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast('Academic cycle updated successfully', 'success')
                setEditingYear(null)
                await fetchInitialData()
            } else {
                addToast(data.error || 'Failed to update session', 'error')
            }
        } catch (err) {
            addToast('Error propagating cycle changes', 'error')
        } finally {
            setSubmittingYear(false)
        }
    }

    const handleSetActiveYear = async (year: AcademicYear) => {
        try {
            const res = await fetch('/api/dashboard/tenant/academic-year', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SET_ACTIVE_YEAR',
                    payload: { id: year.id }
                })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast(`${year.name} is now the primary operational session`, 'success')
                await fetchInitialData()
            } else {
                addToast(data.error || 'Failed to activate session', 'error')
            }
        } catch (err) {
            addToast('Error setting operational session', 'error')
        }
    }

    const handleDeleteYear = async () => {
        if (!yearToDelete) return
        try {
            const res = await fetch('/api/dashboard/tenant/academic-year', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_YEAR',
                    payload: { id: yearToDelete.id }
                })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast('Academic cycle deleted cleanly', 'success')
                setYearToDelete(null)
                await fetchInitialData()
            } else {
                addToast(data.error || 'Failed to delete cycle', 'error')
            }
        } catch (err) {
            addToast('Error removing academic cycle', 'error')
        }
    }

    // ── PROMOTION RULES ACTIONS ──────────────────────────────────────
    const handleSaveRules = async () => {
        setSavingRules(true)
        try {
            const res = await fetch('/api/dashboard/tenant/promotion/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast('Class promotion rules saved successfully', 'success')
                await fetchInitialData()
            } else {
                addToast(data.error || 'Failed to save rules', 'error')
            }
        } catch (err) {
            addToast('Failed to save class promotion rules', 'error')
        } finally {
            setSavingRules(false)
        }
    }

    const handleAutoGenerateRules = async () => {
        setGeneratingRules(true)
        try {
            const res = await fetch('/api/dashboard/tenant/promotion/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'AUTO_GENERATE' })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast(`Created ${data.count} sequential class promotion rules`, 'success')
                await fetchInitialData()
            } else {
                addToast(data.error || 'Failed to auto-generate rules', 'error')
            }
        } catch (err) {
            addToast('Failed to generate promotion rules', 'error')
        } finally {
            setGeneratingRules(false)
        }
    }

    // ── MASS MIGRATION AUDIT & PREVIEW ──────────────────────────────
    const fetchPreview = async (yearId: string) => {
        setTargetYearId(yearId)
        if (!yearId) {
            setPreview([])
            setPreviewSummary(null)
            setSelectedStudents(new Set())
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/dashboard/tenant/promotion/preview?target_id=${yearId}`)
            const data = await res.json()
            const candidates: CandidatePreview[] = data.preview || []
            setPreview(candidates)
            setPreviewSummary(data.summary || null)

            // Auto-select all eligible candidates
            const eligible = candidates.filter(p => p.can_promote).map(p => p.id)
            setSelectedStudents(new Set(eligible))
            setActiveTab('promote')
        } catch (err) {
            addToast('Audit synchronization failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    const executePromotion = async () => {
        if (!targetYearId) return addToast('Please select a destination academic session', 'error')
        if (selectedStudents.size === 0) return addToast('No student candidates selected for migration', 'error')

        setExecuting(true)
        try {
            const payload = {
                target_academic_year_id: targetYearId,
                students_to_promote: preview
                    .filter(p => selectedStudents.has(p.id))
                    .map(p => ({
                        id: p.id,
                        new_class: p.new_class,
                        new_division: p.new_division,
                        status: p.is_graduating ? 'graduated' : 'promoted'
                    }))
            }

            const res = await fetch('/api/dashboard/tenant/promotion/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (res.ok && data.success) {
                addToast(`Migration Complete! Promoted: ${data.summary.promoted}, Graduated: ${data.summary.graduated}`, 'success')
                setConfirmMigrationOpen(false)
                setPreview([])
                setSelectedStudents(new Set())
                await fetchInitialData()
                setActiveTab('logs')
            } else {
                addToast(data.error || 'Execution pipeline failed', 'error')
            }
        } catch (err) {
            addToast('Execution communication error', 'error')
        } finally {
            setExecuting(false)
        }
    }

    // ── CANDIDATE FILTERING ──────────────────────────────────────────
    const filteredPreview = useMemo(() => {
        return preview.filter(p => {
            const matchesQuery = 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.old_class.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.new_class.toLowerCase().includes(searchQuery.toLowerCase())

            if (!matchesQuery) return false

            if (candidateFilter === 'ELIGIBLE') return p.can_promote && !p.is_graduating
            if (candidateFilter === 'GRADUATING') return p.is_graduating
            if (candidateFilter === 'MISSING') return !p.can_promote && !p.already_migrated
            return true
        })
    }, [preview, searchQuery, candidateFilter])

    const toggleStudent = (id: string) => {
        const next = new Set(selectedStudents)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedStudents(next)
    }

    const toggleSelectAllEligible = () => {
        const eligibleInFilter = filteredPreview.filter(p => p.can_promote).map(p => p.id)
        const allSelected = eligibleInFilter.every(id => selectedStudents.has(id))
        const next = new Set(selectedStudents)

        if (allSelected) {
            eligibleInFilter.forEach(id => next.delete(id))
        } else {
            eligibleInFilter.forEach(id => next.add(id))
        }
        setSelectedStudents(next)
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased">
            {/* ── TOAST NOTIFICATIONS ── */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 backdrop-blur-md ${
                            toast.type === 'success'
                                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30'
                                : toast.type === 'error'
                                ? 'bg-rose-950/90 text-rose-100 border-rose-500/30'
                                : 'bg-slate-900/90 text-slate-100 border-slate-700/50'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* ── HERO BANNER ── */}
            <div className="relative mx-6 sm:mx-10 mt-6 rounded-[28px] overflow-hidden border border-slate-200/80 shadow-sm bg-slate-900">
                <div className="relative h-64 sm:h-72 w-full">
                    <Image
                        src="/assets/images/dashboard/academic_lifecycle_banner.jpg"
                        alt="Academic Lifecycle Chronometer"
                        fill
                        priority
                        className="object-cover object-center opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/40" />
                </div>

                <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-200 border border-sky-400/30 backdrop-blur-md">
                            <Clock className="w-3.5 h-3.5" /> Institutional Chronometer
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                            <ShieldCheck className="w-3.5 h-3.5" /> Audit Verified
                        </span>
                        {activeYear && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
                                <Sparkles className="w-3.5 h-3.5" /> {activeYear.name}
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            Academic Years & Student Promotions
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-3xl">
                            Manage annual school sessions, set up automatic class promotion rules, and promote students to their next class with complete record history.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── SUMMARY STATUS CARDS ── */}
            <div className="w-full px-6 sm:px-10 mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* KPI 1 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Academic Year</p>
                        <h3 className="text-xl font-black text-slate-900 mt-2 truncate">
                            {activeYear ? activeYear.name : 'Not Configured'}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            {activeYear ? `${formatDate(activeYear.start_date)} → ${formatDate(activeYear.end_date)}` : 'Add an academic session'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">All Academic Years</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-2">
                            {years.length} <span className="text-sm font-semibold text-slate-400">Total</span>
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                            {years.filter(y => !y.is_active).length} Past Completed Years
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center shrink-0">
                        <History className="w-6 h-6 text-sky-600" />
                    </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Class Promotion Rules</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-2">
                            {rules.length} <span className="text-sm font-semibold text-slate-400">Rules</span>
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                            {classes.length > 0 ? `${Math.min(100, Math.round((rules.length / classes.length) * 100))}% Classes Mapped` : 'No classes set'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center shrink-0">
                        <Settings2 className="w-6 h-6 text-indigo-600" />
                    </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Students to Promote</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-2">
                            {stats?.total_candidates ?? 0} <span className="text-sm font-semibold text-slate-400">Students</span>
                        </h3>
                        <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {stats?.migration_readiness_pct ?? 100}% Ready to Promote
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-amber-600" />
                    </div>
                </div>
            </div>

            {/* ── TAB NAVIGATION ── */}
            <div className="w-full px-6 sm:px-10 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
                    <button
                        onClick={() => setActiveTab('years')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'years'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Calendar className="w-4 h-4 text-emerald-600" /> Academic Years
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-extrabold">
                            {years.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'rules'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Settings2 className="w-4 h-4 text-indigo-600" /> Class Promotion Rules
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-extrabold">
                            {rules.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('promote')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'promote'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4 text-sky-600" /> Promote Students
                        {preview.length > 0 && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-800 font-extrabold">
                                {preview.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'logs'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <History className="w-4 h-4 text-amber-600" /> Promotion History & Records
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-extrabold">
                            {migrationLogs.length}
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchInitialData}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* ── TAB 1: ACADEMIC SESSIONS (YEARS) ── */}
            {activeTab === 'years' && (
                <div className="w-full px-6 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT: Add Academic Year Form */}
                    <div className="lg:col-span-5 bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm sticky top-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mb-5">
                            <Plus className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Add New Academic Year</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1 mb-6">
                            Set up start and end dates for your school&apos;s new academic year.
                        </p>

                        {/* Quick Presets */}
                        <div className="mb-6">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                Quick Year Presets
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[2026, 2027, 2028, 2029].map(yr => (
                                    <button
                                        key={yr}
                                        type="button"
                                        onClick={() => applyYearPreset(yr)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                                    >
                                        {yr}-{String(yr + 1).slice(-2)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleCreateYear} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                    Academic Year Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Academic Session 2027-28"
                                    value={newYear.name}
                                    onChange={e => setNewYear({ ...newYear, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                        Activation Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={newYear.start_date}
                                        onChange={e => setNewYear({ ...newYear, start_date: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                        Termination Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={newYear.end_date}
                                        onChange={e => setNewYear({ ...newYear, end_date: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newYear.make_active}
                                    onChange={e => setNewYear({ ...newYear, make_active: e.target.checked })}
                                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Set as Primary Operational Session</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Automatically switches the current active session flag. Previous operational sessions remain accessible as archives.
                                    </p>
                                </div>
                            </label>

                            <button
                                type="submit"
                                disabled={submittingYear}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submittingYear ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Commit Academic Session
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: List of Sessions */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                Institutional Cycle Inventory ({years.length})
                            </h4>
                        </div>

                        {years.length === 0 && (
                            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h4 className="text-base font-bold text-slate-700">No Academic Sessions Registered</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    Use the initialization panel on the left to designate your institution&apos;s active operational timeline.
                                </p>
                            </div>
                        )}

                        {years.map(yr => (
                            <div
                                key={yr.id}
                                className={`bg-white p-6 rounded-3xl border transition-all duration-200 ${
                                    yr.is_active
                                        ? 'border-emerald-500 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500'
                                        : 'border-slate-200/80 shadow-sm hover:border-slate-300'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                            yr.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            <Calendar className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h4 className="text-lg font-black text-slate-900">{yr.name}</h4>
                                                {yr.is_active ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        Active Session
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                        Archived Cycle
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-3">
                                                <span>Starts: <strong>{formatDate(yr.start_date)}</strong></span>
                                                <span>•</span>
                                                <span>Ends: <strong>{formatDate(yr.end_date)}</strong></span>
                                            </p>
                                            <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                                                    {yr.classes_count ?? 0} Classes Bound
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        {!yr.is_active && (
                                            <button
                                                onClick={() => handleSetActiveYear(yr)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                                                title="Make this the current active session"
                                            >
                                                Set Active
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setEditingYear(yr)}
                                            className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
                                            title="Edit session details"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => fetchPreview(yr.id)}
                                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            Audit <ChevronRight className="w-3.5 h-3.5" />
                                        </button>

                                        {!yr.is_active && (
                                            <button
                                                onClick={() => setYearToDelete(yr)}
                                                className="w-9 h-9 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 flex items-center justify-center transition"
                                                title="Delete this session"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TAB 2: CLASS PROMOTION RULES ── */}
            {activeTab === 'rules' && (
                <div className="w-full px-6 sm:px-10 mt-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-100">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Settings2 className="w-7 h-7 text-indigo-600" /> Class Promotion Rules
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                Set up how students automatically move from one class to the next at the end of the year.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleAutoGenerateRules}
                                disabled={generatingRules || classes.length === 0}
                                className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 disabled:opacity-50"
                                title="Inspects class sort order and automatically builds standard sequence"
                            >
                                <Sparkles className={`w-4 h-4 ${generatingRules ? 'animate-spin' : ''}`} />
                                Auto-Create Class Ladder
                            </button>

                            <button
                                onClick={handleSaveRules}
                                disabled={savingRules}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {savingRules ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Promotion Rules
                            </button>
                        </div>
                    </div>

                    {/* Classes Warning if empty */}
                    {classes.length === 0 && (
                        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 text-xs font-semibold">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <span>No classes found. Please add your school classes in Academy Setup before setting promotion rules.</span>
                        </div>
                    )}

                    {/* Rules Grid */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {rules.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                <Settings2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-base font-bold text-slate-700">No Promotion Rules Defined Yet</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                    Click &quot;Auto-Create Class Ladder&quot; to build standard Grade 1 → Grade 2 promotion rules, or click &quot;Add Promotion Rule&quot; below.
                                </p>
                            </div>
                        )}

                        {rules.map((rule, idx) => (
                            <div
                                key={idx}
                                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all duration-200"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                                    {/* Source Class */}
                                    <div className="sm:col-span-5">
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                            Current Class
                                        </label>
                                        <select
                                            value={rule.from_class}
                                            onChange={e => {
                                                const next = [...rules]
                                                next[idx].from_class = e.target.value
                                                setRules(next)
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">Select Current Class</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                            {/* Retain arbitrary value if set outside classes */}
                                            {rule.from_class && !classes.some(c => c.name === rule.from_class) && (
                                                <option value={rule.from_class}>{rule.from_class} (Custom)</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Arrow */}
                                    <div className="sm:col-span-1 flex justify-center py-2 sm:py-0">
                                        <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Destination Class */}
                                    <div className="sm:col-span-5">
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">
                                            Promote To Class
                                        </label>
                                        <select
                                            value={rule.to_class}
                                            onChange={e => {
                                                const next = [...rules]
                                                next[idx].to_class = e.target.value
                                                setRules(next)
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">Select Target Class</option>
                                            <option value="Graduated">🎓 Graduated / Passed Out</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                            {rule.to_class && rule.to_class !== 'Graduated' && !classes.some(c => c.name === rule.to_class) && (
                                                <option value={rule.to_class}>{rule.to_class} (Custom)</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200/70 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rule.auto_promote ?? true}
                                            onChange={e => {
                                                const next = [...rules]
                                                next[idx].auto_promote = e.target.checked
                                                setRules(next)
                                            }}
                                            className="w-3.5 h-3.5 rounded text-indigo-600"
                                        />
                                        <span>Automatic Promotion</span>
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                                        className="text-[11px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-wider flex items-center gap-1 transition"
                                    >
                                        <X className="w-3.5 h-3.5" /> Remove Rule
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Rule Button */}
                        <button
                            type="button"
                            onClick={() => setRules([...rules, { from_class: '', to_class: '', to_division: '', auto_promote: true }])}
                            className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-transparent hover:bg-indigo-50/30 transition text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 min-h-[140px]"
                        >
                            <Plus className="w-5 h-5" /> Add Promotion Rule
                        </button>
                    </div>
                </div>
            )}

            {/* ── TAB 3: MASS MIGRATION ENGINE (PROMOTE) ── */}
            {activeTab === 'promote' && (
                <div className="w-full px-6 sm:px-10 mt-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
                    {/* Header Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-100">
                        <div className="max-w-xl">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <TrendingUp className="w-7 h-7 text-sky-600" /> Promote Students to Next Class
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                Review student eligibility and promote them into their new classes for the next academic year.
                            </p>

                            {/* Destination Session Selector */}
                            <div className="mt-5 flex items-center gap-3">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0">
                                    Next Academic Year:
                                </label>
                                <select
                                    value={targetYearId}
                                    onChange={e => fetchPreview(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                >
                                    <option value="">Select Next Academic Year</option>
                                    {years.map(y => (
                                        <option key={y.id} value={y.id}>
                                            {y.name} {y.is_active ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Summary Pill & Action Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {previewSummary && (
                                <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-4">
                                    <span>Ready to Promote: <strong className="text-emerald-700">{previewSummary.eligible_count}</strong></span>
                                    <span>Graduating: <strong className="text-indigo-700">{previewSummary.graduating_count}</strong></span>
                                    <span>Missing Rules: <strong className="text-rose-700">{previewSummary.missing_rules_count}</strong></span>
                                </div>
                            )}

                            <button
                                onClick={() => setConfirmMigrationOpen(true)}
                                disabled={selectedStudents.size === 0 || !targetYearId}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Promote Selected Students ({selectedStudents.size})
                            </button>
                        </div>
                    </div>

                    {/* Candidate Filters & Search */}
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                            {[
                                { key: 'ALL', label: 'All Students' },
                                { key: 'ELIGIBLE', label: 'Ready to Promote' },
                                { key: 'GRADUATING', label: 'Graduating' },
                                { key: 'MISSING', label: 'Rule Missing' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setCandidateFilter(tab.key as any)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                        candidateFilter === tab.key
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search candidate or class..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                        </div>
                    </div>

                    {/* Candidate Table */}
                    <div className="mt-5 border border-slate-200/80 rounded-2xl overflow-hidden">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="py-3.5 px-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredPreview.length > 0 && filteredPreview.filter(p => p.can_promote).every(p => selectedStudents.has(p.id))}
                                            onChange={toggleSelectAllEligible}
                                            className="w-4 h-4 rounded text-sky-600"
                                        />
                                    </th>
                                    <th className="py-3.5 px-4">Student Candidate</th>
                                    <th className="py-3.5 px-4">Current Stage</th>
                                    <th className="py-3.5 px-4">Calculated Target Stage</th>
                                    <th className="py-3.5 px-4 text-right">Audit Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                                {filteredPreview.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-slate-400">
                                            {targetYearId ? (
                                                <div className="max-w-xs mx-auto">
                                                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                    <p className="font-bold text-slate-700">No student candidates found</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">Adjust filter criteria or verify enrolled students in your directory.</p>
                                                </div>
                                            ) : (
                                                <p className="font-bold text-slate-500">Please select a destination academic session above to begin audit.</p>
                                            )}
                                        </td>
                                    </tr>
                                )}

                                {filteredPreview.map(p => (
                                    <tr
                                        key={p.id}
                                        className={`hover:bg-slate-50/80 transition ${
                                            selectedStudents.has(p.id) ? 'bg-sky-50/40' : ''
                                        }`}
                                    >
                                        <td className="py-3 px-4 text-center">
                                            <input
                                                type="checkbox"
                                                disabled={!p.can_promote}
                                                checked={selectedStudents.has(p.id)}
                                                onChange={() => toggleStudent(p.id)}
                                                className="w-4 h-4 rounded text-sky-600 disabled:opacity-30"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-slate-900">{p.name}</p>
                                            {p.email && <p className="text-[11px] text-slate-400">{p.email}</p>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                                                {p.old_class} {p.old_division && `• Div ${p.old_division}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {p.is_graduating ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold">
                                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Alumni / Graduated
                                                </span>
                                            ) : p.can_promote ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-extrabold">
                                                    <ArrowRight className="w-3 h-3 text-indigo-500" /> {p.new_class} {p.new_division && `(${p.new_division})`}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                                                    {p.new_class}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {p.audit_status === 'AUDIT_PASSED' && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PASSED
                                                </span>
                                            )}
                                            {p.audit_status === 'GRADUATING' && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                                                    <Award className="w-3.5 h-3.5 text-indigo-500" /> GRADUATING
                                                </span>
                                            )}
                                            {p.audit_status === 'RULE_MISSING' && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> RULE MISSING
                                                </span>
                                            )}
                                            {p.audit_status === 'ALREADY_MIGRATED' && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                                    ALREADY IN TARGET
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB 4: PROMOTION RECORDS (HISTORY) ── */}
            {activeTab === 'logs' && (
                <div className="w-full px-6 sm:px-10 mt-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="pb-6 border-b border-slate-100">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <History className="w-7 h-7 text-amber-600" /> Promotion History & Records
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                            Complete record of previous student promotions and graduation batches.
                        </p>
                    </div>

                    <div className="mt-6 border border-slate-200/80 rounded-2xl overflow-hidden">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="py-3.5 px-4">Date & Time</th>
                                    <th className="py-3.5 px-4">Academic Year</th>
                                    <th className="py-3.5 px-4 text-center">Promoted</th>
                                    <th className="py-3.5 px-4 text-center">Graduated</th>
                                    <th className="py-3.5 px-4 text-center">Failed</th>
                                    <th className="py-3.5 px-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                                {migrationLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="font-bold text-slate-700">No promotion records found</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Records will appear here once students are promoted to their new academic year.</p>
                                        </td>
                                    </tr>
                                )}

                                {migrationLogs.map(log => {
                                    const matchedYear = years.find(y => y.id === log.academic_year_id)
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-indigo-700">
                                                {matchedYear ? matchedYear.name : log.academic_year_id}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                                                {log.promoted_count}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-sky-600">
                                                {log.graduated_count}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-rose-500">
                                                {log.failed_count}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> COMMITTED
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── MODAL: EDIT ACADEMIC SESSION ── */}
            {editingYear && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Edit className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Recalibrate Session</h3>
                                    <p className="text-xs text-slate-500 font-medium">Update academic cycle parameters</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingYear(null)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateYear} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                    Cycle Designation
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingYear.name}
                                    onChange={e => setEditingYear({ ...editingYear, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                        Activation Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={editingYear.start_date}
                                        onChange={e => setEditingYear({ ...editingYear, start_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                        Termination Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={editingYear.end_date}
                                        onChange={e => setEditingYear({ ...editingYear, end_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingYear.is_active}
                                    onChange={e => setEditingYear({ ...editingYear, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-bold text-slate-700">Primary Active Operational Session</span>
                            </label>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingYear(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingYear}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
                                >
                                    {submittingYear ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: CONFIRM MASS MIGRATION ── */}
            {confirmMigrationOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center mb-4">
                            <Rocket className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Confirm Student Promotion</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            You are about to promote the selected students to the{' '}
                            <strong className="text-slate-800 font-bold">
                                {years.find(y => y.id === targetYearId)?.name}
                            </strong>{' '}academic year.
                        </p>

                        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <div className="flex justify-between font-semibold">
                                <span className="text-slate-500">Total Students Selected:</span>
                                <span className="font-bold text-slate-900">{selectedStudents.size}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span className="text-slate-500">Target Academic Year:</span>
                                <span className="font-bold text-indigo-700">{years.find(y => y.id === targetYearId)?.name}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span className="text-slate-500">Historical Records:</span>
                                <span className="text-emerald-700 font-bold">Auto-Archived with Snapshot</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                Once confirmed, selected students will be moved to the new academic year. Their previous academic records will be saved automatically.
                            </span>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setConfirmMigrationOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={executing}
                                onClick={executePromotion}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {executing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Confirm & Execute
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: DELETE SESSION CONFIRMATION ── */}
            {yearToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Delete Academic Cycle?</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Are you sure you want to permanently remove <strong className="text-slate-800">{yearToDelete.name}</strong>?
                        </p>

                        <p className="text-xs text-slate-500 mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            Sessions with active classes or archived student records cannot be deleted.
                        </p>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setYearToDelete(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteYear}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-600/20"
                            >
                                Delete Cycle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
