'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    UsersRound, BookOpen, Layers, Award, BarChart3, TrendingUp, CheckCircle2,
    Clock, AlertTriangle, Search, Filter, RefreshCcw, Printer, Download,
    FileSpreadsheet, ShieldAlert, Sparkles, User, ChevronRight, School,
    Check, ArrowUpRight, Flame, Target, ListTree, PieChart as PieIcon,
    Calendar, Briefcase, Mail, Phone, ExternalLink, SlidersHorizontal, X,
    FileText, Zap, ScanLine, FileCheck, CheckCircle
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

interface FilterState {
    academic_year: string
    teacher_id: string
    class_name: string
    subject_name: string
    status: string
    search: string
}

interface TeacherRecord {
    id: string
    full_name: string
    first_name: string
    last_name: string
    email: string
    phone: string
    employee_id: string
    designation: string
    qualification: string
    status: 'Active' | 'Inactive'
    created_at: string
    assigned_subjects: string[]
    assigned_classes: string[]
    total_classes: number
    total_students: number
    exams_created: number
    online_exams: number
    omr_exams: number
    papers_generated: number
    results_completed: number
    reports_viewed: number
    questions_created: number
    average_performance: number
    pass_percentage: number
    mastery_percentage: number
    syllabus_coverage_pct: number
    chapters_covered: number
    total_chapters: number
    topics_covered: number
    total_topics: number
    activity_status: 'High' | 'Moderate' | 'Low'
}

interface ClassHandled {
    class_name: string
    section: string
    subject: string
    students_count: number
    average_percentage: number
    pass_percentage: number
    mastery_percentage: number
    exams_count: number
    syllabus_coverage_pct: number
    status: string
}

interface TeacherDetail {
    profile: TeacherRecord
    activity: {
        exams_created: number
        papers_generated: number
        online_exams: number
        omr_exams: number
        results_completed: number
        reports_viewed: number
        questions_created: number
    }
    classes_handled: ClassHandled[]
    academic_coverage: {
        chapters_covered: number
        total_chapters: number
        topics_covered: number
        total_topics: number
        coverage_pct: number
        status: string
    }
    student_outcomes: {
        class_average: number
        pass_rate: number
        mastery_rate: number
        distribution: { range: string; count: number; fill: string }[]
    }
    timeline: {
        id: string
        date: string
        time: string
        title: string
        description: string
        category: string
        icon_type: string
    }[]
}

interface WorkloadItem {
    name: string
    classes: number
    students: number
    exams: number
    papers: number
    results: number
    teaching_load: number
    assessment_load: number
    avg_performance: number
}

interface AlertItem {
    id: string
    type: 'warning' | 'info' | 'alert'
    title: string
    description: string
    teacher_name: string
    due_date: string
}

interface ApiResponse {
    success: boolean
    tenant: { name: string; logo_url: string }
    filters: {
        academic_years: { id: string; name: string; is_active: boolean }[]
        classes: { id: string; name: string }[]
        subjects: { id: string; name: string }[]
        teachers: { id: string; name: string; employee_id: string }[]
        statuses: string[]
    }
    kpis: {
        total_teachers: number
        active_teachers: number
        classes_handled: number
        students_handled: number
        exams_created: number
        papers_generated: number
        online_exams: number
        omr_exams: number
        results_completed: number
        reports_viewed: number
        average_performance: number
        average_coverage: number
    }
    teachers: TeacherRecord[]
    selected_teacher_detail: TeacherDetail | null
    workload_comparison: WorkloadItem[]
    alerts: AlertItem[]
}

export default function TeacherPerformanceReport() {
    const router = useRouter()

    // ── Filter State ──────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<FilterState>({
        academic_year: 'all',
        teacher_id: 'all',
        class_name: 'all',
        subject_name: 'all',
        status: 'all',
        search: ''
    })

    // Active Tab View
    const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'workload' | 'alerts'>('overview')
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all')

    // Data State
    const [data, setData] = useState<ApiResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch report data
    const fetchReport = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (filters.academic_year !== 'all') params.set('academic_year', filters.academic_year)
            if (selectedTeacherId !== 'all') {
                params.set('teacher_id', selectedTeacherId)
            } else if (filters.teacher_id !== 'all') {
                params.set('teacher_id', filters.teacher_id)
            }
            if (filters.class_name !== 'all') params.set('class_name', filters.class_name)
            if (filters.subject_name !== 'all') params.set('subject_name', filters.subject_name)
            if (filters.status !== 'all') params.set('status', filters.status)
            if (filters.search) params.set('search', filters.search)

            const res = await fetch(`/api/dashboard/reports/teacher-performance?${params.toString()}`)
            const json: ApiResponse = await res.json()
            if (json.success) {
                setData(json)
            } else {
                setError((json as any).message || 'Failed to load teacher analytics')
            }
        } catch (err: any) {
            setError(err?.message || 'Network connection failed')
        } finally {
            setLoading(false)
        }
    }, [filters, selectedTeacherId])

    useEffect(() => {
        fetchReport()
    }, [fetchReport])

    // Drill down to specific teacher detail tab
    const handleDrillDownTeacher = (teacherId: string) => {
        setSelectedTeacherId(teacherId)
        setActiveTab('detail')
    }

    // Reset filters
    const handleResetFilters = () => {
        setFilters({
            academic_year: 'all',
            teacher_id: 'all',
            class_name: 'all',
            subject_name: 'all',
            status: 'all',
            search: ''
        })
        setSelectedTeacherId('all')
    }

    // Print Handler
    const handlePrint = () => {
        if (typeof window !== 'undefined') window.print()
    }

    // CSV Export Handler
    const handleExportCSV = () => {
        if (!data?.teachers || data.teachers.length === 0) return
        const headers = [
            'Teacher Name', 'Employee ID', 'Email', 'Designation', 'Subjects',
            'Classes', 'Total Classes', 'Total Students', 'Exams Created',
            'Papers Generated', 'Online Exams', 'OMR Exams', 'Results Completed',
            'Class Average %', 'Pass Rate %', 'Mastery %', 'Syllabus Coverage %', 'Status'
        ]
        const rows = data.teachers.map(t => [
            `"${t.full_name}"`,
            `"${t.employee_id}"`,
            `"${t.email}"`,
            `"${t.designation}"`,
            `"${t.assigned_subjects.join(', ')}"`,
            `"${t.assigned_classes.join(', ')}"`,
            t.total_classes,
            t.total_students,
            t.exams_created,
            t.papers_generated,
            t.online_exams,
            t.omr_exams,
            t.results_completed,
            `${t.average_performance}%`,
            `${t.pass_percentage}%`,
            `${t.mastery_percentage}%`,
            `${t.syllabus_coverage_pct}%`,
            t.status
        ])
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `Teacher_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const selectedTeacherDetail = data?.selected_teacher_detail

    return (
        <div className="w-full space-y-8 font-sans pb-16">
            {/* ── HEADER BANNER ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-[#004B93] border border-blue-100">
                                <UsersRound className="w-3.5 h-3.5 text-[#004B93]" />
                                Teacher Report
                            </span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                            Teacher Performance & Workload Report
                        </h1>
                        <p className="text-sm font-medium text-slate-500 max-w-2xl">
                            View exam activity, class assignments, pass rates, and syllabus coverage for each teacher.
                        </p>
                    </div>

                    {/* Fast Actions (Print / Export) */}
                    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                            title="Refresh live data"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#004B93]' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Export CSV</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004B93] text-white text-xs font-black hover:bg-[#003870] transition shadow-md shadow-blue-900/10"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Report</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── GLOBAL FILTER BAR ────────────────────────────────────────── */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#004B93]" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700">Filters</span>
                    </div>
                    <button
                        onClick={handleResetFilters}
                        className="text-xs font-bold text-slate-500 hover:text-rose-600 transition flex items-center gap-1"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search teacher, employee ID, subject..."
                            value={filters.search}
                            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                        />
                    </div>

                    {/* Academic Year */}
                    <div>
                        <select
                            value={filters.academic_year}
                            onChange={e => setFilters(prev => ({ ...prev, academic_year: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                        >
                            <option value="all">All Academic Sessions</option>
                            {data?.filters?.academic_years?.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Teacher Selector */}
                    <div>
                        <select
                            value={selectedTeacherId}
                            onChange={e => {
                                setSelectedTeacherId(e.target.value)
                                setFilters(prev => ({ ...prev, teacher_id: e.target.value }))
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                        >
                            <option value="all">All Teachers ({data?.teachers?.length || 0})</option>
                            {data?.filters?.teachers?.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>
                            ))}
                        </select>
                    </div>

                    {/* Class Filter */}
                    <div>
                        <select
                            value={filters.class_name}
                            onChange={e => setFilters(prev => ({ ...prev, class_name: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                        >
                            <option value="all">All Classes</option>
                            {data?.filters?.classes?.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Filter */}
                    <div>
                        <select
                            value={filters.subject_name}
                            onChange={e => setFilters(prev => ({ ...prev, subject_name: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                        >
                            <option value="all">All Subjects</option>
                            {data?.filters?.subjects?.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── TOP VIEW NAVIGATION TABS ─────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit print:hidden">
                    <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'overview'
                            ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <UsersRound className="w-4 h-4" />
                    <span>All Teachers</span>
                </button>
                <button
                    onClick={() => setActiveTab('detail')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'detail'
                            ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Teacher Details</span>
                    {selectedTeacherDetail && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-[#004B93]">
                            {selectedTeacherDetail.profile.first_name}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('workload')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'workload'
                            ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span>Workload</span>
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'alerts'
                            ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Alerts</span>
                    {data?.alerts && data.alerts.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                            {data.alerts.length}
                        </span>
                    )}
                </button>
            </div>


            {/* ── VIEW 1: EXECUTIVE OVERVIEW & MASTER TABLE ─────────────────── */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* 8 Executive KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Teachers</span>
                            <div className="text-2xl font-black text-slate-900">{data?.kpis?.total_teachers || 0}</div>
                            <span className="text-[10px] font-bold text-emerald-600 mt-1 block">Staff Roster</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Active Teachers</span>
                            <div className="text-2xl font-black text-emerald-600">{data?.kpis?.active_teachers || 0}</div>
                        <span className="text-[10px] font-bold text-emerald-600 mt-1 block">Active Staff</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Classes Handled</span>
                            <div className="text-2xl font-black text-blue-900">{data?.kpis?.classes_handled || 0}</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Class Allocations</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Students Handled</span>
                            <div className="text-2xl font-black text-indigo-900">{data?.kpis?.students_handled || 0}</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Under Instruction</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Exams Created</span>
                            <div className="text-2xl font-black text-slate-900">{data?.kpis?.exams_created || 0}</div>
                            <span className="text-[10px] font-bold text-blue-600 mt-1 block">Offline + Online</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Papers Finalized</span>
                            <div className="text-2xl font-black text-slate-900">{data?.kpis?.papers_generated || 0}</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Unique Sets</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Results Evaluated</span>
                            <div className="text-2xl font-black text-emerald-700">{data?.kpis?.results_completed || 0}</div>
                            <span className="text-[10px] font-bold text-emerald-600 mt-1 block">Marks Completed</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Class Avg %</span>
                            <div className="text-2xl font-black text-[#004B93]">{data?.kpis?.average_performance || 0}%</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Cohort Outcome</span>
                        </div>
                    </div>

                    {/* Master Teacher Table */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">Teacher Performance & Workload Ledger</h2>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    Click any teacher to view individual activity timeline, syllabus coverage, and class breakdowns.
                                </p>
                            </div>
                            <div className="text-xs font-bold text-slate-400">
                                Showing {data?.teachers?.length || 0} staff members
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/50">
                                        <th className="py-3 px-4">Teacher & Employee ID</th>
                                        <th className="py-3 px-3">Subject</th>
                                        <th className="py-3 px-3">Assigned Classes</th>
                                        <th className="py-3 px-3 text-center">Exams</th>
                                        <th className="py-3 px-3 text-center">Students</th>
                                        <th className="py-3 px-3 text-center">Class Avg %</th>
                                        <th className="py-3 px-3 text-center">Pass %</th>
                                        <th className="py-3 px-3 text-center">Syllabus %</th>
                                        <th className="py-3 px-3 text-center">Activity Level</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.teachers?.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="hover:bg-blue-50/40 transition group cursor-pointer"
                                            onClick={() => handleDrillDownTeacher(t.id)}
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100/70 text-[#004B93] flex items-center justify-center font-black text-xs">
                                                        {t.first_name[0]}{t.last_name ? t.last_name[0] : ''}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 group-hover:text-[#004B93] transition flex items-center gap-1.5">
                                                            <span>{t.full_name}</span>
                                                            {t.status === 'Active' ? (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-medium">
                                                            {t.employee_id} • {t.designation}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3">
                                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                    {t.assigned_subjects.map((s, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3">
                                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                    {t.assigned_classes.map((c, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[10px]">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">
                                                    {t.exams_created}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {t.total_students}
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-black">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                                                    t.average_performance >= 75 ? 'bg-emerald-50 text-emerald-700 font-black' :
                                                    t.average_performance >= 60 ? 'bg-blue-50 text-blue-800 font-bold' :
                                                    'bg-amber-50 text-amber-800 font-bold'
                                                }`}>
                                                    {t.average_performance}%
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {t.pass_percentage}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#004B93] rounded-full"
                                                            style={{ width: `${t.syllabus_coverage_pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600">
                                                        {t.syllabus_coverage_pct}%
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    t.activity_status === 'High' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                    t.activity_status === 'Moderate' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {t.activity_status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDrillDownTeacher(t.id)
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#004B93] hover:border-[#004B93] hover:bg-white transition text-[11px] font-bold shadow-sm"
                                                >
                                                    <span>Deep Dive</span>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW 2: TEACHER DETAIL & ACTIVITY DEEP DIVE ─────────────── */}
            {activeTab === 'detail' && selectedTeacherDetail && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Teacher Profile Card */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#004B93] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-900/10">
                                    {selectedTeacherDetail.profile.first_name[0]}{selectedTeacherDetail.profile.last_name ? selectedTeacherDetail.profile.last_name[0] : ''}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                            {selectedTeacherDetail.profile.full_name}
                                        </h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            {selectedTeacherDetail.profile.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                                        <span>Emp ID: <strong className="text-slate-800">{selectedTeacherDetail.profile.employee_id}</strong></span>
                                        <span>•</span>
                                        <span>{selectedTeacherDetail.profile.designation}</span>
                                        <span>•</span>
                                        <span>{selectedTeacherDetail.profile.qualification}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                                        <span className="inline-flex items-center gap-1">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            {selectedTeacherDetail.profile.email}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            {selectedTeacherDetail.profile.phone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Teacher Switcher */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">Switch Teacher:</span>
                                <select
                                    value={selectedTeacherDetail.profile.id}
                                    onChange={e => handleDrillDownTeacher(e.target.value)}
                                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                >
                                    {data?.teachers?.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Teacher Activity Metrics Grid (Section 8 of Plan) */}
                        <div className="pt-6">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-4">
                                Section 8 — Official Academic Activity Metrics
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <FileText className="w-3.5 h-3.5 text-[#004B93]" />
                                        <span>Exams Created</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {selectedTeacherDetail.activity.exams_created}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Total Assessments</span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Papers Generated</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {selectedTeacherDetail.activity.papers_generated}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Paper Generator Sets</span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Online CBT</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {selectedTeacherDetail.activity.online_exams}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Digital Tests</span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>OMR Exams</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {selectedTeacherDetail.activity.omr_exams}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Sheets Processed</span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Results Done</span>
                                    </div>
                                    <div className="text-2xl font-black text-emerald-700">
                                        {selectedTeacherDetail.activity.results_completed}
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-semibold">Completed & Synced</span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Reports Viewed</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {selectedTeacherDetail.activity.reports_viewed}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Audit Logs</span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                                        <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                                        <span>Questions Contributed</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {selectedTeacherDetail.activity.questions_created}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Bank Contribution</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classes Handled Roster (Section 11 & 12 of Plan) */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Classes Handled & Cohort Outcomes</h3>
                                <p className="text-xs text-slate-500">
                                    Official class allocations with student enrollment, average performance, and syllabus progress.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                {selectedTeacherDetail.classes_handled.length} Active Cohorts
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/50">
                                        <th className="py-3 px-4">Class & Division</th>
                                        <th className="py-3 px-3">Subject Taught</th>
                                        <th className="py-3 px-3 text-center">Students</th>
                                        <th className="py-3 px-3 text-center">Class Average</th>
                                        <th className="py-3 px-3 text-center">Pass %</th>
                                        <th className="py-3 px-3 text-center">Mastery %</th>
                                        <th className="py-3 px-3 text-center">Exams Conducted</th>
                                        <th className="py-3 px-3 text-center">Syllabus Coverage</th>
                                        <th className="py-3 px-4 text-right">Drill-Down</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedTeacherDetail.classes_handled.map((ch, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3.5 px-4 font-black text-slate-900">
                                                {ch.class_name}-{ch.section}
                                            </td>
                                            <td className="py-3.5 px-3">
                                                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#004B93] font-bold text-[11px]">
                                                    {ch.subject}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {ch.students_count}
                                            </td>
                                            <td className="py-3.5 px-3 text-center font-black">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                                                    ch.average_percentage >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                                    ch.average_percentage >= 60 ? 'bg-blue-50 text-blue-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {ch.average_percentage}%
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {ch.pass_percentage}%
                                            </td>
                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {ch.mastery_percentage}%
                                            </td>
                                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                                {ch.exams_count}
                                            </td>
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-600 rounded-full"
                                                            style={{ width: `${ch.syllabus_coverage_pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700">
                                                        {ch.syllabus_coverage_pct}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/dashboard/reports?type=class&class_name=${encodeURIComponent(ch.class_name)}`)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004B93] hover:underline"
                                                >
                                                    <span>Class Report</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Academic Coverage & Student Outcomes 2-Column Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Syllabus Coverage Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-[#004B93]" />
                                    <h4 className="text-sm font-black text-slate-900">Academic Syllabus Coverage</h4>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    selectedTeacherDetail.academic_coverage.coverage_pct >= 75
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {selectedTeacherDetail.academic_coverage.status}
                                </span>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-slate-500">Overall Progress</span>
                                    <span className="text-xl font-black text-slate-900">
                                        {selectedTeacherDetail.academic_coverage.coverage_pct}%
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedTeacherDetail.academic_coverage.coverage_pct}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Chapters Completed</span>
                                    <div className="text-lg font-black text-slate-800">
                                        {selectedTeacherDetail.academic_coverage.chapters_covered} / {selectedTeacherDetail.academic_coverage.total_chapters}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Topics Evaluated</span>
                                    <div className="text-lg font-black text-slate-800">
                                        {selectedTeacherDetail.academic_coverage.topics_covered} / {selectedTeacherDetail.academic_coverage.total_topics}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Score Distribution */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PieIcon className="w-4 h-4 text-emerald-600" />
                                    <h4 className="text-sm font-black text-slate-900">Student Score Distribution</h4>
                                </div>
                                <span className="text-xs font-bold text-slate-400">Under Teacher's Care</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                {selectedTeacherDetail.student_outcomes.distribution.map((d, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                                            <span className="text-[10px] font-bold text-slate-600">{d.range}</span>
                                        </div>
                                        <div className="text-xl font-black text-slate-900">
                                            {d.count} <span className="text-xs font-semibold text-slate-400">students</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Activity Log (Section 27 of Plan) */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-black text-slate-900 tracking-tight">Recent Academic Operations Timeline</h4>
                                <p className="text-xs text-slate-500">Centralized chronological audit of examination and paper workflows.</p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">Audit Verified</span>
                        </div>

                        <div className="divide-y divide-slate-100 pt-2">
                            {selectedTeacherDetail.timeline.map((ev) => (
                                <div key={ev.id} className="py-3.5 flex items-start gap-3.5">
                                    <div className="mt-1 w-7 h-7 rounded-xl bg-blue-50 text-[#004B93] flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-800">{ev.title}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{ev.date} • {ev.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{ev.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW 3: WORKLOAD ANALYSIS & COMPARISON ───────────────────── */}
            {activeTab === 'workload' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Important Pedagogical Interpretation Disclaimer (Section 30 & 61 of Plan) */}
                    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-black text-amber-950 uppercase tracking-wide text-[11px]">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Administrative Notice: Interpretation Framework (Sections 30 & 61)</span>
                        </div>
                        <p className="text-amber-800/90 leading-relaxed font-medium">
                            Teacher Reports are strictly an <strong>operational activity, workload, and academic-context reporting framework</strong>.
                            Higher examination counts or class averages must never be automatically treated as superior teacher quality.
                            Activity metrics measure volume and operations, while student performance measures pedagogical outcomes.
                        </p>
                    </div>

                    {/* Workload Distribution Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Teacher Workload Distribution</h3>
                            <p className="text-xs text-slate-500">Comparative assessment and evaluation volume across faculty members.</p>
                        </div>

                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data?.workload_comparison || []}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            border: 'none',
                                            fontSize: '11px',
                                            fontWeight: 700
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} />
                                    <Bar dataKey="exams" name="Exams Created" fill="#004B93" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="papers" name="Papers Generated" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="results" name="Results Completed" fill="#10B981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparison Master Table */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Side-by-Side Faculty Comparison</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/50">
                                        <th className="py-3 px-4">Faculty Member</th>
                                        <th className="py-3 px-3 text-center">Classes</th>
                                        <th className="py-3 px-3 text-center">Students Handled</th>
                                        <th className="py-3 px-3 text-center">Exams Conducted</th>
                                        <th className="py-3 px-3 text-center">Papers Generated</th>
                                        <th className="py-3 px-3 text-center">Results Evaluated</th>
                                        <th className="py-3 px-3 text-center">Class Average</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.workload_comparison?.map((w, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3 px-4 font-black text-slate-900">
                                                {w.name}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                                                {w.classes}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                                                {w.students}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                                                {w.exams}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                                                {w.papers}
                                            </td>
                                            <td className="py-3 px-3 text-center font-bold text-emerald-700">
                                                {w.results}
                                            </td>
                                            <td className="py-3 px-3 text-center font-black text-blue-900">
                                                {w.avg_performance}%
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        const matchedT = data?.teachers?.find(t => t.full_name === w.name)
                                                        if (matchedT) handleDrillDownTeacher(matchedT.id)
                                                    }}
                                                    className="text-[#004B93] hover:underline font-bold text-[11px]"
                                                >
                                                    Inspect
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW 4: PENDING & ADMINISTRATIVE ALERTS ─────────────────── */}
            {activeTab === 'alerts' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Administrative Attention & Pending Tasks</h3>
                            <p className="text-xs text-slate-500">
                                Deterministic operational flags requiring follow-up from principals and academic coordinators.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                            {data?.alerts?.length || 0} Open Items
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data?.alerts?.map(alt => (
                            <div
                                key={alt.id}
                                className={`p-5 rounded-2xl border space-y-3 ${
                                    alt.type === 'warning'
                                        ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                                        : alt.type === 'alert'
                                        ? 'bg-rose-50/60 border-rose-200/80 text-rose-900'
                                        : 'bg-blue-50/60 border-blue-200/80 text-blue-900'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>{alt.title}</span>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-75">Due: {alt.due_date}</span>
                                </div>
                                <p className="text-xs font-medium leading-relaxed opacity-90">
                                    {alt.description}
                                </p>
                                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
                                    <span className="font-bold">Faculty: {alt.teacher_name}</span>
                                    <span className="font-black underline cursor-pointer">Resolve</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
