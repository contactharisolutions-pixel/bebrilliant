'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    FileText, CheckCircle2, AlertCircle, Edit3, Search, Filter,
    RefreshCw, Layers, GraduationCap, Check, Plus, Upload, Eye,
    Printer, ArrowRight, XCircle, Award, BookOpen, Clock, Calendar,
    UserCheck, ChevronRight, BarChart3, HelpCircle, Save, Sparkles, Building2
} from 'lucide-react'

// ── TYPES ─────────────────────────────────────────────────────────────
interface AnswerSheetSubmission {
    id: string
    tenant_id: string
    exam_id: string | null
    student_id: string | null
    file_url: string
    total_pages: number
    status: 'pending' | 'review' | 'completed'
    processed: boolean
    awarded_marks: number
    max_marks: number
    percentage: number
    grade_badge: string
    teacher_remarks: string
    evaluated_by?: string
    evaluated_at?: string
    student_name: string
    roll_number: string
    class_name: string
    subject_name: string
    created_at: string
    exam_title: string
    exam_duration: number
}

interface FilterOptions {
    exams: { id: string; title: string; total_marks: number }[]
    classes: { id: string; name: string }[]
    subjects: { id: string; name: string }[]
    students: { id: string; name: string; roll_number: string; class_name: string }[]
}

export default function AnswerGradingHub() {
    // ── STATE ─────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'upload' | 'analytics'>('pending')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Data
    const [submissions, setSubmissions] = useState<AnswerSheetSubmission[]>([])
    const [metrics, setMetrics] = useState({
        totalSubmissions: 5,
        pendingCount: 2,
        inReviewCount: 1,
        completedCount: 2,
        checkedTodayCount: 2,
        avgPercentage: 90.6,
        distinctionCount: 2,
        firstClassCount: 0,
        secondClassCount: 0,
        needsAttentionCount: 0
    })
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        exams: [],
        classes: [],
        subjects: [],
        students: []
    })

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('all')
    const [selectedExamFilter, setSelectedExamFilter] = useState('all')

    // Modals
    const [gradingModal, setGradingModal] = useState<{
        open: boolean
        submission: AnswerSheetSubmission | null
    }>({ open: false, submission: null })

    const [gradingForm, setGradingForm] = useState({
        awarded_marks: 0,
        max_marks: 50,
        teacher_remarks: '',
        evaluated_by: 'Senior Faculty Examiner',
        qMarks: [
            { qNo: 1, question: 'Section A: Fundamental Definitions & Core Concepts', marks: 10, max: 10, note: 'Accurate terminology' },
            { qNo: 2, question: 'Section B: Short Analytical Explanations', marks: 12, max: 15, note: 'Good derivation steps' },
            { qNo: 3, question: 'Section C: Extended Numerical / Case Study Problem', marks: 14, max: 15, note: 'Clear working steps' },
            { qNo: 4, question: 'Section D: Diagrammatic Illustration & Labelling', marks: 8, max: 10, note: 'Labels could be sharper' }
        ]
    })

    // Manual Upload Form
    const [uploadForm, setUploadForm] = useState({
        exam_id: '',
        student_id: '',
        student_name: '',
        roll_number: '',
        class_name: '',
        subject_name: '',
        total_pages: 4,
        max_marks: 50,
        file_name: ''
    })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // ── FETCH DATA ────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchQuery) params.set('search', searchQuery)
            if (selectedClassFilter !== 'all') params.set('class_name', selectedClassFilter)
            if (selectedExamFilter !== 'all') params.set('exam_id', selectedExamFilter)

            const res = await fetch(`/api/dashboard/faculty/answer-grading?${params.toString()}`)
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || 'Unable to connect to answer sheet grading service')
            }
            const data = await res.json()

            setSubmissions(data.submissions || [])
            if (data.metrics) setMetrics(data.metrics)
            if (data.filterOptions) setFilterOptions(data.filterOptions)
        } catch (err: any) {
            showToast(err.message || 'Failed to load grading queue', false)
        } finally {
            setLoading(false)
        }
    }, [searchQuery, selectedClassFilter, selectedExamFilter])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ── OPEN GRADING MODAL ────────────────────────────────────────────
    const handleOpenGrading = (sub: AnswerSheetSubmission) => {
        const defaultTotal = sub.awarded_marks || Math.round(sub.max_marks * 0.8)
        setGradingForm({
            awarded_marks: defaultTotal,
            max_marks: sub.max_marks || 50,
            teacher_remarks: sub.teacher_remarks || 'Good attempt. Check working steps in Section C.',
            evaluated_by: sub.evaluated_by || 'Senior Faculty Examiner',
            qMarks: [
                { qNo: 1, question: 'Section A: Core Concepts & Principles', marks: Math.round(defaultTotal * 0.25), max: Math.round(sub.max_marks * 0.25), note: 'Thorough answers' },
                { qNo: 2, question: 'Section B: Short Analytical Questions', marks: Math.round(defaultTotal * 0.3), max: Math.round(sub.max_marks * 0.3), note: 'Good explanation' },
                { qNo: 3, question: 'Section C: Numerical & Application Problem', marks: Math.round(defaultTotal * 0.3), max: Math.round(sub.max_marks * 0.3), note: 'Clear derivation' },
                { qNo: 4, question: 'Section D: Diagrams & Presentation', marks: Math.round(defaultTotal * 0.15), max: Math.round(sub.max_marks * 0.15), note: 'Clean presentation' }
            ]
        })
        setGradingModal({ open: true, submission: sub })
    }

    // ── SAVE EVALUATION (DRAFT OR FINAL) ──────────────────────────────
    const handleSaveEvaluation = async (status: 'review' | 'completed') => {
        if (!gradingModal.submission) return
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/faculty/answer-grading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SAVE_EVALUATION',
                    payload: {
                        id: gradingModal.submission.id,
                        awarded_marks: gradingForm.awarded_marks,
                        max_marks: gradingForm.max_marks,
                        teacher_remarks: gradingForm.teacher_remarks,
                        status: status,
                        evaluated_by: gradingForm.evaluated_by
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save evaluation')

            showToast(data.message || 'Evaluation saved successfully', true)
            setGradingModal({ open: false, submission: null })
            fetchData()
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setSaving(false)
        }
    }

    // ── UPLOAD ANSWER SHEET ───────────────────────────────────────────
    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!uploadForm.student_name.trim()) {
            showToast('Please select or specify a student name', false)
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/faculty/answer-grading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPLOAD_ANSWER_SHEET',
                    payload: uploadForm
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            showToast(data.message || 'Answer sheet uploaded successfully', true)
            setUploadForm({
                exam_id: '',
                student_id: '',
                student_name: '',
                roll_number: '',
                class_name: '',
                subject_name: '',
                total_pages: 4,
                max_marks: 50,
                file_name: ''
            })
            fetchData()
            setActiveTab('pending')
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setSaving(false)
        }
    }

    // ── BATCH PUBLISH MARKS ───────────────────────────────────────────
    const handleBatchPublish = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/faculty/answer-grading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'PUBLISH_ALL_RESULTS', payload: {} })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to publish marks')

            showToast(data.message || 'Checked answer sheets published to Student Portal', true)
            fetchData()
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setSaving(false)
        }
    }

    // Filtered Submissions
    const pendingSubmissions = useMemo(() => {
        return submissions.filter((s) => s.status === 'pending' || s.status === 'review')
    }, [submissions])

    const completedSubmissions = useMemo(() => {
        return submissions.filter((s) => s.status === 'completed')
    }, [submissions])

    // Calculation helper
    const currentPercentage = useMemo(() => {
        if (!gradingForm.max_marks || gradingForm.max_marks === 0) return 0
        return Number(((gradingForm.awarded_marks / gradingForm.max_marks) * 100).toFixed(1))
    }, [gradingForm.awarded_marks, gradingForm.max_marks])

    const currentGrade = useMemo(() => {
        if (currentPercentage >= 90) return { label: 'A+ (Distinction)', bg: 'bg-emerald-100 text-emerald-800' }
        if (currentPercentage >= 80) return { label: 'A (First Class)', bg: 'bg-emerald-50 text-emerald-700' }
        if (currentPercentage >= 70) return { label: 'B+ (Merit)', bg: 'bg-blue-50 text-blue-700' }
        if (currentPercentage >= 60) return { label: 'B (Second Class)', bg: 'bg-sky-50 text-sky-700' }
        if (currentPercentage >= 40) return { label: 'C (Passing)', bg: 'bg-amber-50 text-amber-700' }
        return { label: 'Needs Improvement', bg: 'bg-rose-50 text-rose-700' }
    }, [currentPercentage])

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/50 to-white text-slate-900 pb-24">
            {/* ── TOAST NOTIFICATION ───────────────────────────────────── */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 ${
                        toast.ok
                            ? 'bg-emerald-900 text-emerald-50 border-emerald-700/80 shadow-emerald-950/20'
                            : 'bg-rose-900 text-rose-50 border-rose-700/80 shadow-rose-950/20'
                    }`}
                >
                    {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            <div className="w-full px-4 sm:px-8 py-6 space-y-6">
                {/* ── 1. ART-DIRECTED EDITORIAL HEADER BANNER ──────────── */}
                <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-900">
                    <div className="relative h-56 sm:h-64 w-full">
                        <Image
                            src="/assets/images/dashboard/answer_grading_banner.jpg"
                            alt="Faculty Evaluation Hall - Answer Sheet Checking"
                            fill
                            priority
                            className="object-cover object-center opacity-40 mix-blend-luminosity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-indigo-950/70" />

                        {/* Banner Overlay Content */}
                        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold tracking-wide flex items-center gap-2 backdrop-blur-sm">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                        Faculty Evaluation Hall • Academic Desk
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
                                        Session 2026-27 Active
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <button
                                        onClick={fetchData}
                                        disabled={loading}
                                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 backdrop-blur-sm transition-colors"
                                        title="Refresh Queue"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>

                                    <button
                                        onClick={handleBatchPublish}
                                        disabled={saving}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-700/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                    >
                                        <Award className="w-4 h-4" />
                                        <span>Publish All Checked Marks</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="max-w-2xl">
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                        Student Answer Sheet Checking & Grading
                                    </h1>
                                    <p className="mt-2 text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                                        Review handwritten examination booklets, award question-by-question marks, write personalized teacher feedback, and publish report cards directly to student accounts.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>+ Upload Answer Sheet</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. EXECUTIVE LIVE KPIS ───────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Papers to Check */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Papers to Check
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.pendingCount + metrics.inReviewCount} <span className="text-base font-semibold text-amber-600">Pending</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {metrics.inReviewCount > 0 ? `${metrics.inReviewCount} in review draft` : 'Awaiting teacher evaluation'}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>

                    {/* KPI 2: Checked Today */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Checked Today
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.checkedTodayCount} <span className="text-base font-semibold text-emerald-600">Papers</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Evaluated by faculty today</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* KPI 3: Class Average Score */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Class Average Score
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.avgPercentage}%
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Overall marks across completed exams</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                    </div>

                    {/* KPI 4: Total Submissions */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Submissions
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.totalSubmissions} <span className="text-base font-semibold text-slate-500">Booklets</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Physical and digital answer sheets</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* ── 3. FOUR OPERATIONAL TABS ──────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-3">
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <FileText className="w-4 h-4 text-amber-600" />
                            <span>Papers Awaiting Checking</span>
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                {pendingSubmissions.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                activeTab === 'completed'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Checked & Graded Papers</span>
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                {completedSubmissions.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                activeTab === 'upload'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Upload className="w-4 h-4 text-indigo-600" />
                            <span>Upload Student Answer Sheets</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                activeTab === 'analytics'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <span>Class Grading Summary</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium">
                            {submissions.length} Total Registered Student Answer Sheets
                        </span>
                    </div>
                </div>

                {/* ── 4. TAB CONTENTS ──────────────────────────────────── */}

                {/* ─── TAB 1: PAPERS AWAITING CHECKING ─────────────────── */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {/* Filter & Search Bar */}
                        <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search by student name, roll number, or examination..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="w-48 shrink-0">
                                    <select
                                        value={selectedClassFilter}
                                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                    >
                                        <option value="all">All Grades / Classes</option>
                                        {filterOptions.classes.map((c) => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={fetchData}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Refresh</span>
                            </button>
                        </div>

                        {/* Pending Table */}
                        <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6">Student & Roll No.</th>
                                        <th className="py-4 px-6">Class / Grade</th>
                                        <th className="py-4 px-6">Examination & Subject</th>
                                        <th className="py-4 px-4 text-center">Pages</th>
                                        <th className="py-4 px-6">Submission Time</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {pendingSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                    <p className="text-base font-bold text-slate-700">All Papers Checked!</p>
                                                    <p className="text-xs text-slate-400">There are no pending student answer sheets waiting for evaluation.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingSubmissions.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100">
                                                            {sub.student_name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{sub.student_name}</div>
                                                            <div className="text-xs text-slate-400">{sub.roll_number}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6 text-slate-600 text-xs">
                                                    <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-semibold">
                                                        {sub.class_name}
                                                    </span>
                                                </td>

                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-slate-800 text-xs sm:text-sm">{sub.exam_title}</div>
                                                    <div className="text-xs text-slate-400">{sub.subject_name}</div>
                                                </td>

                                                <td className="py-4 px-4 text-center">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                                        {sub.total_pages} pgs
                                                    </span>
                                                </td>

                                                <td className="py-4 px-6 text-xs text-slate-500">
                                                    {new Date(sub.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>

                                                <td className="py-4 px-6 text-center">
                                                    {sub.status === 'review' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            <Clock className="w-3 h-3" />
                                                            Draft in Progress
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock className="w-3 h-3" />
                                                            Awaiting Checking
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => handleOpenGrading(sub)}
                                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 ml-auto transition-all transform hover:-translate-y-0.5"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        <span>Check Paper</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
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

                {/* ─── TAB 2: CHECKED & GRADED PAPERS ──────────────────── */}
                {activeTab === 'completed' && (
                    <div className="space-y-4">
                        <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6">Student & Roll No.</th>
                                        <th className="py-4 px-6">Examination & Subject</th>
                                        <th className="py-4 px-6 text-center">Marks Awarded</th>
                                        <th className="py-4 px-6 text-center">Grade</th>
                                        <th className="py-4 px-6">Teacher Evaluator</th>
                                        <th className="py-4 px-6">Teacher Remarks</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {completedSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-slate-400">
                                                <p className="text-base font-bold text-slate-700">No Checked Papers Yet</p>
                                                <p className="text-xs text-slate-400 mt-1">When papers are evaluated in the Awaiting Checking tab, they appear here.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        completedSubmissions.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-900">{sub.student_name}</div>
                                                    <div className="text-xs text-slate-400">{sub.roll_number} • {sub.class_name}</div>
                                                </td>

                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-slate-800 text-xs sm:text-sm">{sub.exam_title}</div>
                                                    <div className="text-xs text-slate-400">{sub.subject_name}</div>
                                                </td>

                                                <td className="py-4 px-6 text-center">
                                                    <div className="font-black text-slate-900 text-base">
                                                        {sub.awarded_marks} <span className="text-xs text-slate-400 font-normal">/ {sub.max_marks}</span>
                                                    </div>
                                                    <div className="text-xs text-emerald-600 font-semibold">
                                                        {sub.percentage}%
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6 text-center">
                                                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        {sub.grade_badge}
                                                    </span>
                                                </td>

                                                <td className="py-4 px-6 text-xs text-slate-600">
                                                    {sub.evaluated_by || 'Senior Faculty'}
                                                </td>

                                                <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate" title={sub.teacher_remarks}>
                                                    {sub.teacher_remarks || 'No remarks added'}
                                                </td>

                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenGrading(sub)}
                                                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => window.print()}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                                                            title="Print Marksheet"
                                                        >
                                                            <Printer className="w-4 h-4" />
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
                )}

                {/* ─── TAB 3: UPLOAD STUDENT ANSWER SHEETS ──────────────── */}
                {activeTab === 'upload' && (
                    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Upload Student Examination Answer Sheet
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Attach physical scanned paper booklets or student PDF submissions to queue them for teacher checking.
                            </p>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Exam Selector */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Select Examination <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={uploadForm.exam_id}
                                        onChange={(e) => {
                                            const exam = filterOptions.exams.find((x) => x.id === e.target.value)
                                            setUploadForm({
                                                ...uploadForm,
                                                exam_id: e.target.value,
                                                max_marks: exam ? exam.total_marks : 50
                                            })
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                        required
                                    >
                                        <option value="">-- Choose Examination --</option>
                                        {filterOptions.exams.map((ex) => (
                                            <option key={ex.id} value={ex.id}>{ex.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Class Selector */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Class / Grade <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={uploadForm.class_name}
                                        onChange={(e) => setUploadForm({ ...uploadForm, class_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                        required
                                    >
                                        <option value="">-- Choose Grade --</option>
                                        {filterOptions.classes.map((c) => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Student Selector */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Student Candidate <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={uploadForm.student_id}
                                        onChange={(e) => {
                                            const st = filterOptions.students.find((s) => s.id === e.target.value)
                                            if (st) {
                                                setUploadForm({
                                                    ...uploadForm,
                                                    student_id: st.id,
                                                    student_name: st.name,
                                                    roll_number: st.roll_number,
                                                    class_name: st.class_name || uploadForm.class_name
                                                })
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                        required
                                    >
                                        <option value="">-- Choose Student from Directory --</option>
                                        {filterOptions.students.map((st) => (
                                            <option key={st.id} value={st.id}>
                                                {st.name} ({st.roll_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Subject Name <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={uploadForm.subject_name}
                                        onChange={(e) => setUploadForm({ ...uploadForm, subject_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                        required
                                    >
                                        <option value="">-- Choose Subject --</option>
                                        {filterOptions.subjects.map((sub) => (
                                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Total Booklet Pages
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={uploadForm.total_pages}
                                        onChange={(e) => setUploadForm({ ...uploadForm, total_pages: Number(e.target.value) || 4 })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Maximum Examination Marks
                                    </label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="200"
                                        value={uploadForm.max_marks}
                                        onChange={(e) => setUploadForm({ ...uploadForm, max_marks: Number(e.target.value) || 50 })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Dropzone */}
                            <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/50">
                                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                    {uploadForm.file_name ? `Attached: ${uploadForm.file_name}` : 'Attach Scanned Answer Booklet (.pdf, .jpg, .png)'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Simulated file attachment for school paper checking queue
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setUploadForm({ ...uploadForm, file_name: 'student_answer_sheet_scan.pdf' })}
                                    className="mt-3 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Select Sample Booklet
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2"
                                >
                                    {saving ? 'Uploading...' : 'Upload & Add to Checking Queue'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ─── TAB 4: CLASS GRADING SUMMARY ────────────────────── */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase">Distinction (75%+)</span>
                                <h3 className="text-2xl font-black text-emerald-600 mt-1">{metrics.distinctionCount} Students</h3>
                                <p className="text-xs text-slate-500 mt-1">Outstanding mastery</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase">First Class (60-74%)</span>
                                <h3 className="text-2xl font-black text-blue-600 mt-1">{metrics.firstClassCount} Students</h3>
                                <p className="text-xs text-slate-500 mt-1">Solid academic performance</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase">Second Class (40-59%)</span>
                                <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.secondClassCount} Students</h3>
                                <p className="text-xs text-slate-500 mt-1">Satisfactory passing grade</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase">Needs Focus (&lt;40%)</span>
                                <h3 className="text-2xl font-black text-rose-600 mt-1">{metrics.needsAttentionCount} Students</h3>
                                <p className="text-xs text-slate-500 mt-1">Remedial support recommended</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Official Class Marksheet Ledger</h3>
                                    <p className="text-xs text-slate-500">Summary of all evaluated examination scores for current term</p>
                                </div>
                                <button
                                    onClick={handleBatchPublish}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                                >
                                    <Award className="w-4 h-4" />
                                    <span>Publish Marks to Student Accounts</span>
                                </button>
                            </div>

                            <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Rank</th>
                                            <th className="p-3">Student Candidate</th>
                                            <th className="p-3">Class & Section</th>
                                            <th className="p-3">Subject</th>
                                            <th className="p-3 text-center">Marks Awarded</th>
                                            <th className="p-3 text-center">Percentage</th>
                                            <th className="p-3 text-center">Grade</th>
                                            <th className="p-3">Teacher Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {completedSubmissions.map((sub, idx) => (
                                            <tr key={sub.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                                                <td className="p-3 font-bold text-slate-900">{sub.student_name}</td>
                                                <td className="p-3 text-slate-600">{sub.class_name}</td>
                                                <td className="p-3 text-slate-600">{sub.subject_name}</td>
                                                <td className="p-3 text-center font-bold text-slate-900">{sub.awarded_marks} / {sub.max_marks}</td>
                                                <td className="p-3 text-center font-bold text-emerald-600">{sub.percentage}%</td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                                        {sub.grade_badge}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-500 max-w-xs truncate">{sub.teacher_remarks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 5. INTERACTIVE PAPER EVALUATION & MARKS MODAL ─────────── */}
            {gradingModal.open && gradingModal.submission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                    <Edit3 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-white">
                                        Answer Sheet Checking Console • {gradingModal.submission.student_name}
                                    </h3>
                                    <p className="text-xs text-slate-300">
                                        {gradingModal.submission.roll_number} • {gradingModal.submission.class_name} • {gradingModal.submission.exam_title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setGradingModal({ open: false, submission: null })}
                                className="p-1 rounded-lg text-slate-400 hover:text-white"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body: Split 2-Column Console */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                            {/* Left Col: Scanned Answer Booklet Preview (5 cols) */}
                            <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Student Answer Booklet Scan
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                            {gradingModal.submission.total_pages} Pages
                                        </span>
                                    </div>

                                    <div className="relative w-full h-80 sm:h-96 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-inner flex flex-col p-4">
                                        <div className="border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-700">Page 1 of {gradingModal.submission.total_pages}</span>
                                            <span className="text-[11px] text-slate-400">Official Candidate Script</span>
                                        </div>

                                        {/* Realistic Handwriting Simulation / Preview */}
                                        <div className="flex-1 space-y-3 text-xs text-slate-700 font-mono overflow-y-auto p-2 bg-amber-50/20 rounded border border-dashed border-amber-200">
                                            <div className="text-[11px] text-indigo-900 font-bold">Candidate Roll No: {gradingModal.submission.roll_number}</div>
                                            <div className="text-[11px] text-slate-500">Subject: {gradingModal.submission.subject_name}</div>
                                            <hr className="border-slate-200" />
                                            <div className="p-2 bg-white rounded border border-slate-200 text-[11px] leading-relaxed">
                                                <strong className="text-slate-900 block mb-1">Q1. State the fundamental theorem and define boundary conditions:</strong>
                                                <span className="text-slate-600">
                                                    "The rate of change of momentum is proportional to the applied force and takes place in the direction in which the force acts. Hence F = ma..."
                                                </span>
                                            </div>
                                            <div className="p-2 bg-white rounded border border-slate-200 text-[11px] leading-relaxed">
                                                <strong className="text-slate-900 block mb-1">Q2. Calculate the derivative and solve step-by-step:</strong>
                                                <span className="text-slate-600">
                                                    "Step 1: d/dx [x^2 + 4x + 4] = 2x + 4. Setting 2x + 4 = 0 gives critical root at x = -2. Therefore the stationary point is confirmed."
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                                    <div className="font-bold flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>Candidate Verification</span>
                                    </div>
                                    <p className="text-[11px] text-indigo-700">
                                        Verified matching student identity: {gradingModal.submission.student_name} ({gradingModal.submission.roll_number}).
                                    </p>
                                </div>
                            </div>

                            {/* Right Col: Teacher Scoring & Remarks (7 cols) */}
                            <div className="lg:col-span-7 p-6 space-y-6">
                                {/* Total Marks & Grade Banner */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase">Calculated Percentage</span>
                                        <div className="text-2xl font-black text-slate-900 mt-0.5">
                                            {currentPercentage}%
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Assigned Grade</span>
                                        <div className="mt-0.5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${currentGrade.bg}`}>
                                                {currentGrade.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Marks Input */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                            Total Marks Awarded <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max={gradingForm.max_marks}
                                            value={gradingForm.awarded_marks}
                                            onChange={(e) => setGradingForm({ ...gradingForm, awarded_marks: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                            Maximum Marks
                                        </label>
                                        <input
                                            type="number"
                                            value={gradingForm.max_marks}
                                            onChange={(e) => setGradingForm({ ...gradingForm, max_marks: Number(e.target.value) || 50 })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>

                                {/* Question-Level Breakdown */}
                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                                        Question Section Scores & Rubric Notes
                                    </span>
                                    <div className="space-y-2">
                                        {gradingForm.qMarks.map((q, idx) => (
                                            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-800 truncate">{q.question}</div>
                                                    <div className="text-[11px] text-slate-400">{q.note}</div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-700">
                                                    <input
                                                        type="number"
                                                        value={q.marks}
                                                        onChange={(e) => {
                                                            const nextQ = [...gradingForm.qMarks]
                                                            nextQ[idx].marks = Number(e.target.value) || 0
                                                            const newTotal = nextQ.reduce((acc, curr) => acc + curr.marks, 0)
                                                            setGradingForm({ ...gradingForm, qMarks: nextQ, awarded_marks: newTotal })
                                                        }}
                                                        className="w-14 px-2 py-1 rounded border border-slate-200 text-center text-xs font-bold"
                                                    />
                                                    <span>/ {q.max}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Teacher Remarks Textarea */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Teacher Remarks & Pedagogical Feedback
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={gradingForm.teacher_remarks}
                                        onChange={(e) => setGradingForm({ ...gradingForm, teacher_remarks: e.target.value })}
                                        placeholder="Enter constructive advice for the student (e.g. Excellent conceptual clarity. Practice diagram labelling and trigonometric identities)."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                {/* Evaluator Signature Name */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                        Faculty Examiner Name
                                    </label>
                                    <input
                                        type="text"
                                        value={gradingForm.evaluated_by}
                                        onChange={(e) => setGradingForm({ ...gradingForm, evaluated_by: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <button
                                onClick={() => setGradingModal({ open: false, submission: null })}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>

                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => handleSaveEvaluation('review')}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSaveEvaluation('completed')}
                                    disabled={saving}
                                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{saving ? 'Saving...' : 'Finalize & Mark as Checked'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
