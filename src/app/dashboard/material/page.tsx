'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    BookOpen,
    FileText,
    Video,
    Calendar,
    Clock,
    Download,
    ExternalLink,
    Search,
    Filter,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    GraduationCap,
    BookMarked,
    UploadCloud,
    FolderCheck,
    PlayCircle,
    X,
    FileCode2,
    Eye,
    ChevronRight,
    Layers,
    Sparkles
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────
interface Material {
    id: string
    tenant_id: string
    title: string
    type: 'pdf' | 'video' | 'notes' | 'assignment'
    subject: string
    class_name: string
    topic?: string | null
    description?: string | null
    due_date?: string | null
    external_url?: string | null
    file_url?: string | null
    file_size?: string | null
    download_count: number
    created_at: string
    author_name?: string | null
}

interface Stats {
    total_materials: number
    active_homework: number
    video_lessons: number
    notes_and_guides: number
    classes_covered: number
}

interface ClassItem {
    id: string
    name: string
}

interface SubjectItem {
    id: string
    name: string
}

export default function StudyMaterialsDashboard() {
    // ── STATE ────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'all' | 'assignment' | 'notes' | 'video'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState('all')

    const [materials, setMaterials] = useState<Material[]>([])
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [subjects, setSubjects] = useState<SubjectItem[]>([])
    const [stats, setStats] = useState<Stats>({
        total_materials: 0,
        active_homework: 0,
        video_lessons: 0,
        notes_and_guides: 0,
        classes_covered: 0
    })

    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null)

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)

    // Form state for publishing new material/homework
    const [formData, setFormData] = useState({
        title: '',
        type: 'notes' as 'pdf' | 'video' | 'notes' | 'assignment',
        class_name: '',
        subject: '',
        topic: '',
        description: '',
        due_date: '',
        external_url: '',
        file_name: '',
        file_size: '2.4 MB'
    })

    const showToast = (msg: string, isError = false) => {
        setToast({ msg, isError })
        setTimeout(() => setToast(null), 4000)
    }

    // ── DATA FETCHING ────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (activeTab !== 'all') params.append('type', activeTab)
            if (selectedClass !== 'all') params.append('class_name', selectedClass)
            if (selectedSubject !== 'all') params.append('subject', selectedSubject)
            if (searchQuery.trim()) params.append('search', searchQuery.trim())

            const res = await fetch(`/api/dashboard/material?${params.toString()}`)
            const json = await res.json()

            if (json.success && json.data) {
                setMaterials(json.data.materials || [])
                setStats(json.data.stats || {
                    total_materials: 0,
                    active_homework: 0,
                    video_lessons: 0,
                    notes_and_guides: 0,
                    classes_covered: 0
                })
                setClasses(json.data.classes || [])
                setSubjects(json.data.subjects || [])

                // Set default dropdown values in upload form if empty
                if (json.data.classes?.length > 0 && !formData.class_name) {
                    setFormData(prev => ({
                        ...prev,
                        class_name: json.data.classes[0].name,
                        subject: json.data.subjects?.[0]?.name || 'General'
                    }))
                }
            } else {
                throw new Error(json.error || 'Failed to load study materials')
            }
        } catch (err: any) {
            console.error('Fetch error:', err)
            showToast(err.message || 'Error connecting to database', true)
        } finally {
            setLoading(false)
        }
    }, [activeTab, selectedClass, selectedSubject, searchQuery])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ── CREATE MATERIAL HANDLER ──────────────────────────────────
    const handleCreateMaterial = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title.trim()) {
            return showToast('Please enter a title for the material or homework.', true)
        }
        if (formData.type === 'assignment' && !formData.due_date) {
            return showToast('Please set a submission due date for this homework assignment.', true)
        }

        setActionLoading(true)
        try {
            const payload = {
                title: formData.title.trim(),
                type: formData.type,
                class_name: formData.class_name || (classes[0]?.name ?? 'Grade 10'),
                subject: formData.subject || (subjects[0]?.name ?? 'General'),
                topic: formData.topic.trim() || null,
                description: formData.description.trim() || null,
                due_date: formData.type === 'assignment' ? formData.due_date : null,
                external_url: formData.external_url.trim() || null,
                file_url: formData.file_name ? formData.file_name.toLowerCase().replace(/\s+/g, '_') : 'academic_document.pdf',
                file_size: formData.file_size
            }

            const res = await fetch('/api/dashboard/material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_MATERIAL', payload })
            })
            const json = await res.json()

            if (json.success) {
                showToast(json.message || 'Resource published successfully!')
                setShowUploadModal(false)
                setFormData({
                    title: '',
                    type: 'notes',
                    class_name: classes[0]?.name || '',
                    subject: subjects[0]?.name || '',
                    topic: '',
                    description: '',
                    due_date: '',
                    external_url: '',
                    file_name: '',
                    file_size: '2.4 MB'
                })
                fetchData()
            } else {
                throw new Error(json.error || 'Failed to publish resource')
            }
        } catch (err: any) {
            showToast(err.message || 'An error occurred while publishing', true)
        } finally {
            setActionLoading(false)
        }
    }

    // ── DELETE MATERIAL HANDLER ──────────────────────────────────
    const handleDeleteMaterial = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to remove "${title}" from the school library?`)) return

        setActionLoading(true)
        try {
            const res = await fetch('/api/dashboard/material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_MATERIAL', payload: { id } })
            })
            const json = await res.json()

            if (json.success) {
                showToast('Resource removed from curriculum repository.')
                if (previewMaterial?.id === id) setPreviewMaterial(null)
                fetchData()
            } else {
                throw new Error(json.error || 'Failed to delete resource')
            }
        } catch (err: any) {
            showToast(err.message || 'Error deleting resource', true)
        } finally {
            setActionLoading(false)
        }
    }

    // ── TRACK DOWNLOAD HANDLER ───────────────────────────────────
    const handleDownload = async (material: Material) => {
        try {
            await fetch('/api/dashboard/material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'INCREMENT_DOWNLOAD', payload: { id: material.id } })
            })
            // Open external or simulated download
            if (material.external_url) {
                window.open(material.external_url, '_blank')
            } else {
                showToast(`Downloading ${material.title}...`)
            }
        } catch (err) {
            console.error('Download counter error:', err)
        }
    }

    // Filtered materials by quick counts
    const filteredMaterials = useMemo(() => {
        return materials
    }, [materials])

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pb-24 text-slate-900">
            {/* ── FLOATING TOAST NOTIFICATION ── */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
                        toast.isError
                            ? 'bg-rose-900/90 text-white border-rose-700'
                            : 'bg-emerald-900/90 text-white border-emerald-700'
                    }`}
                >
                    {toast.isError ? <AlertCircle className="w-5 h-5 text-rose-300" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                    <span className="text-sm font-semibold">{toast.msg}</span>
                </div>
            )}

            {/* ── WORKSPACE CONTAINER (100% FULL WIDTH) ── */}
            <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-8">
                {/* ── 16:9 PHOTOGRAPHIC HERO BANNER ── */}
                <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-64 sm:h-80 w-full">
                        <Image
                            src="/assets/images/dashboard/study_materials_banner.jpg"
                            alt="Teachers and students reviewing class study materials, notes, and homework assignments"
                            fill
                            className="object-cover object-center"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                            <div className="max-w-2xl text-white">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Academic Resources & Curriculum Hub
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                                    Class Notes, Study Materials & Homework
                                </h1>
                                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                                    Publish revision notes, distribute daily homework assignments with deadlines, and organize video lecture recordings across all registered grades.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4" />
                                    Publish Material / Homework
                                </button>
                                <button
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-medium text-sm transition-all"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TOP 4 DYNAMIC KPI CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Total Materials */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Materials</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FolderCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.total_materials}</span>
                            <span className="text-xs text-slate-500 font-medium">published items</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">PDFs, notes, assignments & videos</p>
                    </div>

                    {/* Active Homework */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Homework</span>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.active_homework}</span>
                            <span className="text-xs text-purple-600 font-medium">with due dates</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Student worksheets & problem sets</p>
                    </div>

                    {/* Video Lessons */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Video Masterclasses</span>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <PlayCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.video_lessons}</span>
                            <span className="text-xs text-slate-500 font-medium">recordings</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Lab demonstrations & lectures</p>
                    </div>

                    {/* Classes Covered */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Grades Covered</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.classes_covered || classes.length}</span>
                            <span className="text-xs text-emerald-600 font-medium">active grades</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Active curriculum cohorts</p>
                    </div>
                </div>

                {/* ── TAB NAVIGATION & FILTERS BAR ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Tab buttons */}
                        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 gap-1 overflow-x-auto max-w-full">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === 'all'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                📚 All Materials ({stats.total_materials})
                            </button>
                            <button
                                onClick={() => setActiveTab('assignment')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === 'assignment'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                📝 Homework & Tasks ({stats.active_homework})
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === 'notes'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                📑 Notes & Guides ({stats.notes_and_guides})
                            </button>
                            <button
                                onClick={() => setActiveTab('video')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === 'video'
                                        ? 'bg-white text-rose-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                🎥 Video Lessons ({stats.video_lessons})
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 max-w-lg lg:max-w-xl">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by title, chapter, subject, or keywords..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Secondary Filters: Grade and Subject */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <Filter className="w-3.5 h-3.5" />
                            Filters:
                        </div>

                        {/* Class selector */}
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All Grades ({classes.length})</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Subject selector */}
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All Subjects ({subjects.length})</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.name}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        {(selectedClass !== 'all' || selectedSubject !== 'all' || searchQuery) && (
                            <button
                                onClick={() => {
                                    setSelectedClass('all')
                                    setSelectedSubject('all')
                                    setSearchQuery('')
                                }}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline ml-auto"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {/* ── MATERIALS GRID ── */}
                {loading ? (
                    <div className="w-full bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto" />
                        <h3 className="text-base font-semibold text-slate-800">Loading Academic Materials...</h3>
                        <p className="text-xs text-slate-500">Connecting to PostgreSQL database and verifying curriculum items</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                            <BookMarked className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Curriculum Materials Found</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            No study materials, homework, or video lessons match your current filters. Try changing your search or publish a new curriculum item.
                        </p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Publish Material / Homework
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMaterials.map(m => {
                            const isAssignment = m.type === 'assignment'
                            const isVideo = m.type === 'video'
                            const isPdf = m.type === 'pdf' || m.type === 'notes'

                            return (
                                <div
                                    key={m.id}
                                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        {/* Top Card Row: Badge + Delete */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            {isAssignment ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Homework Task
                                                </span>
                                            ) : isVideo ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                    <PlayCircle className="w-3.5 h-3.5" />
                                                    Video Lesson
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {m.type === 'pdf' ? 'Study Guide' : 'Class Notes'}
                                                </span>
                                            )}

                                            <button
                                                onClick={() => handleDeleteMaterial(m.id, m.title)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all"
                                                title="Delete material"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Title and Topic */}
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                                            {m.title}
                                        </h3>

                                        {m.topic && (
                                            <p className="text-xs font-medium text-slate-500 mb-3 line-clamp-1">
                                                {m.topic}
                                            </p>
                                        )}

                                        {/* Description */}
                                        {m.description && (
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                                                {m.description}
                                            </p>
                                        )}

                                        {/* Grade & Subject Pills */}
                                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                                {m.class_name}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                                                {m.subject}
                                            </span>
                                        </div>

                                        {/* Homework Due Date Banner */}
                                        {isAssignment && m.due_date && (
                                            <div className="mb-4 p-3 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 text-purple-800 font-semibold">
                                                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                                                    Submission Due Date:
                                                </div>
                                                <span className="font-bold text-purple-900">
                                                    {new Date(m.due_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Metadata & Actions */}
                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <div className="space-y-0.5">
                                            <div>{m.file_size || '2.0 MB'} • {new Date(m.created_at).toLocaleDateString()}</div>
                                            {m.download_count > 0 && (
                                                <div className="text-[11px] text-slate-400 font-medium">
                                                    {m.download_count} student views
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPreviewMaterial(m)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all flex items-center gap-1"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Details
                                            </button>

                                            {isVideo && m.external_url ? (
                                                <a
                                                    href={m.external_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-all flex items-center gap-1 shadow-sm"
                                                >
                                                    <PlayCircle className="w-3.5 h-3.5" />
                                                    Watch
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => handleDownload(m)}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all flex items-center gap-1 shadow-sm"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Download
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL 1: PUBLISH NEW MATERIAL / HOMEWORK ── */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Publish Academic Content
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    Publish Notes, Homework or Video
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Fill in the details below to publish curriculum resources directly to your student directory.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMaterial} className="space-y-4">
                            {/* Material Type Selector */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Resource Category <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'notes', label: 'Class Notes', icon: FileText },
                                        { id: 'assignment', label: 'Homework Task', icon: Calendar },
                                        { id: 'pdf', label: 'Study Guide', icon: BookOpen },
                                        { id: 'video', label: 'Video Lesson', icon: Video }
                                    ].map(item => {
                                        const Icon = item.icon
                                        const isSelected = formData.type === item.id
                                        return (
                                            <button
                                                type="button"
                                                key={item.id}
                                                onClick={() => setFormData({ ...formData, type: item.id as any })}
                                                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-xs font-bold">{item.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Document / Assignment Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Chapter 4: Calculus Derivatives & Formulas Handbook"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Class and Subject Selectors */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Target Grade / Class <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.class_name}
                                        onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    >
                                        {classes.map(c => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Subject <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    >
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Topic / Chapter */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Topic / Chapter Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Unit 3: Magnetism & AC Circuits"
                                    value={formData.topic}
                                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* If Homework: Due Date */}
                            {formData.type === 'assignment' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-purple-700 mb-1.5">
                                        Submission Due Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-purple-50/50 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                    />
                                </div>
                            )}

                            {/* If Video: External URL */}
                            {formData.type === 'video' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-1.5">
                                        Video Lesson URL (YouTube / Vimeo / Google Drive)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={formData.external_url}
                                        onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                    />
                                </div>
                            )}

                            {/* Instructions / Description */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Teacher Instructions / Summary
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter instructions for students or a brief overview of what this material covers..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                />
                            </div>

                            {/* File Upload Selector */}
                            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 text-center space-y-2">
                                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                                <div>
                                    <span className="text-xs font-semibold text-slate-700">Attach Document or Worksheet</span>
                                    <p className="text-[11px] text-slate-400">PDF, Word, or PowerPoint presentations up to 50MB</p>
                                </div>
                                <input
                                    type="text"
                                    placeholder="File name (e.g., calculus_unit4_handout.pdf)"
                                    value={formData.file_name}
                                    onChange={e => setFormData({ ...formData, file_name: e.target.value })}
                                    className="w-full max-w-sm mx-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2"
                                >
                                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Publish to School Directory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: MATERIAL DETAILS PREVIEW MODAL ── */}
            {previewMaterial && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                    {previewMaterial.class_name} • {previewMaterial.subject}
                                </span>
                                <h2 className="text-xl font-bold text-slate-900 mt-2">
                                    {previewMaterial.title}
                                </h2>
                                {previewMaterial.topic && (
                                    <p className="text-xs font-medium text-blue-600 mt-1">
                                        {previewMaterial.topic}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setPreviewMaterial(null)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Description */}
                        {previewMaterial.description && (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Teacher Instructions & Notes:
                                </div>
                                {previewMaterial.description}
                            </div>
                        )}

                        {/* Due date if assignment */}
                        {previewMaterial.type === 'assignment' && previewMaterial.due_date && (
                            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-purple-800 font-semibold">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                    Submission Deadline:
                                </div>
                                <span className="font-bold text-purple-900">
                                    {new Date(previewMaterial.due_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Meta details */}
                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <span className="text-slate-400 block">Uploaded On:</span>
                                <span className="font-semibold text-slate-800">
                                    {new Date(previewMaterial.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">File Size:</span>
                                <span className="font-semibold text-slate-800">
                                    {previewMaterial.file_size || '2.0 MB'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Faculty Publisher:</span>
                                <span className="font-semibold text-slate-800">
                                    {previewMaterial.author_name || 'Academic Faculty'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Resource Type:</span>
                                <span className="font-semibold text-slate-800 uppercase">
                                    {previewMaterial.type}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setPreviewMaterial(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-all"
                            >
                                Close
                            </button>
                            {previewMaterial.external_url ? (
                                <a
                                    href={previewMaterial.external_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Video Masterclass
                                </a>
                            ) : (
                                <button
                                    onClick={() => {
                                        handleDownload(previewMaterial)
                                        setPreviewMaterial(null)
                                    }}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Attachment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
