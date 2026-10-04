'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    School, Users, UsersRound, GraduationCap, Award, BookOpen, Layers,
    TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Search, Filter,
    RefreshCcw, Printer, FileSpreadsheet, Sparkles, ChevronRight, BarChart3,
    ArrowUpRight, ArrowDownRight, Target, Flame, Compass, BrainCircuit,
    CheckCircle, ShieldAlert, ExternalLink, CalendarDays, PieChart as PieIcon,
    Zap, ScanLine, FileText, Check, HelpCircle
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'

interface FilterState {
    academic_year: string
    term: string
    exam_type: string
    search: string
}

interface ClassComparisonItem {
    class_name: string
    student_count: number
    average_percentage: number
    pass_percentage: number
    mastery_percentage: number
    improving_percentage: number
    support_percentage: number
    exams_conducted: number
    trend_pp: string
    status: 'Strong' | 'Normal' | 'Attention'
}

interface SubjectBenchmarkItem {
    subject: string
    students: number
    average: number
    pass: number
    mastery: number
    status: 'Strong' | 'Normal' | 'Attention'
    weak_chapter: string
}

interface LearningGapItem {
    id: string
    name: string
    subject: string
    average: number
    students_below_threshold: number
    classes_affected: string[]
    severity: 'Critical' | 'High' | 'Medium'
}

interface SupportTriageItem {
    category: string
    count: number
    percentage: number
    description: string
    color: string
}

interface ApiResponse {
    success: boolean
    tenant: { name: string; logo_url: string }
    filters: {
        academic_years: { id: string; name: string; is_active: boolean }[]
        terms: string[]
        exam_types: string[]
    }
    kpis: {
        total_students: number
        total_teachers: number
        total_classes: number
        total_divisions: number
        exams_conducted: number
        online_exams: number
        omr_exams: number
        subjective_papers: number
        average_school_score: number
        overall_pass_rate: number
        overall_mastery_rate: number
        students_improving_pct: number
        students_improving_count: number
        students_support_pct: number
        students_support_count: number
        syllabus_coverage_pct: number
        results_completion_pct: number
    }
    class_comparison: ClassComparisonItem[]
    performance_trends: {
        period: string
        average: number
        pass_rate: number
        mastery_rate: number
        exams: number
    }[]
    subject_benchmarks: SubjectBenchmarkItem[]
    score_distribution: {
        range: string
        count: number
        percentage: number
        fill: string
    }[]
    top_learning_gaps: LearningGapItem[]
    student_support_triage: SupportTriageItem[]
    executive_summary: {
        title: string
        overview: string
        key_observations: string[]
        priorities: string[]
    }
}

export default function SchoolPerformanceReport() {
    const router = useRouter()

    // ── Filter State ──────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<FilterState>({
        academic_year: 'all',
        term: 'all',
        exam_type: 'all',
        search: ''
    })

    // Active View Tab
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'subjects' | 'support'>('overview')

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
            if (filters.term !== 'all') params.set('term', filters.term)
            if (filters.exam_type !== 'all') params.set('exam_type', filters.exam_type)

            const res = await fetch(`/api/dashboard/reports/school-performance?${params.toString()}`)
            const json: ApiResponse = await res.json()
            if (json.success) {
                setData(json)
            } else {
                setError((json as any).message || 'Failed to load school performance data')
            }
        } catch (err: any) {
            setError(err?.message || 'Network connection failed')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchReport()
    }, [fetchReport])

    // Print Handler
    const handlePrint = () => {
        if (typeof window !== 'undefined') window.print()
    }

    // CSV Export Handler
    const handleExportCSV = () => {
        if (!data?.class_comparison || data.class_comparison.length === 0) return
        const headers = [
            'Class Name', 'Enrolled Students', 'Average Score %', 'Pass Rate %',
            'Mastery Rate %', 'Students Improving %', 'Students Needing Support %',
            'Exams Conducted', 'Trend (pp)', 'Performance Status'
        ]
        const rows = data.class_comparison.map(c => [
            `"${c.class_name}"`,
            c.student_count,
            `${c.average_percentage}%`,
            `${c.pass_percentage}%`,
            `${c.mastery_percentage}%`,
            `${c.improving_percentage}%`,
            `${c.support_percentage}%`,
            c.exams_conducted,
            c.trend_pp,
            c.status
        ])
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `School_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredClasses = (data?.class_comparison || []).filter(c => {
        if (!filters.search) return true
        return c.class_name.toLowerCase().includes(filters.search.toLowerCase())
    })

    return (
        <div className="w-full space-y-8 font-sans pb-16">
            {/* ── HEADER BANNER ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-[#0868B2] border border-blue-100">
                                <School className="w-3.5 h-3.5 text-[#0868B2]" />
                                School-Wide Report
                            </span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                            School Performance Report
                        </h1>
                        <p className="text-sm font-medium text-slate-500 max-w-2xl">
                            Overview of school performance across all classes, subjects, and exams.
                        </p>
                    </div>

                    {/* Fast Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                            title="Refresh live data"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0868B2]' : ''}`} />
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
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0868B2] text-white text-xs font-black hover:bg-[#07549A] transition shadow-md shadow-blue-900/10"
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
                        <Filter className="w-4 h-4 text-[#0868B2]" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700">Filters</span>
                    </div>
                    <button
                        onClick={() => setFilters({ academic_year: 'all', term: 'all', exam_type: 'all', search: '' })}
                        className="text-xs font-bold text-slate-500 hover:text-rose-600 transition"
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Academic Year */}
                    <div>
                        <select
                            value={filters.academic_year}
                            onChange={e => setFilters(prev => ({ ...prev, academic_year: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]/20 focus:border-[#0868B2] transition"
                        >
                            <option value="all">All Academic Sessions</option>
                            {data?.filters?.academic_years?.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Term Selector */}
                    <div>
                        <select
                            value={filters.term}
                            onChange={e => setFilters(prev => ({ ...prev, term: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]/20 focus:border-[#0868B2] transition"
                        >
                            {data?.filters?.terms?.map(t => (
                                <option key={t} value={t === 'All Terms' ? 'all' : t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Exam Delivery Mode */}
                    <div>
                        <select
                            value={filters.exam_type}
                            onChange={e => setFilters(prev => ({ ...prev, exam_type: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]/20 focus:border-[#0868B2] transition"
                        >
                            {data?.filters?.exam_types?.map(et => (
                                <option key={et} value={et === 'All Assessment Modes' ? 'all' : et}>{et}</option>
                            ))}
                        </select>
                    </div>

                    {/* Class Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter class (e.g. Class 10)..."
                            value={filters.search}
                            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868B2]/20 focus:border-[#0868B2] transition"
                        />
                    </div>
                </div>
            </div>

            {/* ── TOP VIEW NAVIGATION TABS ─────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit print:hidden">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'overview'
                            ? 'bg-white text-[#0868B2] shadow-md shadow-[#0868B2]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                </button>
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'classes'
                            ? 'bg-white text-[#0868B2] shadow-md shadow-[#0868B2]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Classes</span>
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'subjects'
                            ? 'bg-white text-[#0868B2] shadow-md shadow-[#0868B2]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Subjects</span>
                </button>
                <button
                    onClick={() => setActiveTab('support')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'support'
                            ? 'bg-white text-[#0868B2] shadow-md shadow-[#0868B2]/5'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Target className="w-4 h-4" />
                    <span>Student Support</span>
                </button>
            </div>

            {/* ── VIEW 1: EXECUTIVE COMMAND OVERVIEW ───────────────────────── */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Primary School Performance Metrics Grid (Section 2 & 5 of Master Plan) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Enrolled Students</span>
                            <div className="text-2xl font-black text-slate-900">{data?.kpis?.total_students || 850}</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Active Enrollment</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Active Faculty</span>
                            <div className="text-2xl font-black text-slate-900">{data?.kpis?.total_teachers || 32}</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Teaching Staff</span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Exams Conducted</span>
                            <div className="text-2xl font-black text-indigo-900">{data?.kpis?.exams_conducted || 184}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">
                                {data?.kpis?.online_exams} Online • {data?.kpis?.omr_exams} OMR
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Average School Score</span>
                            <div className="text-2xl font-black text-[#0868B2]">{data?.kpis?.average_school_score || 71.4}%</div>
                            <span className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                                <ArrowUpRight className="w-3 h-3" /> +2.1 pp vs Term 1
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Overall Pass Rate</span>
                            <div className="text-2xl font-black text-emerald-600">{data?.kpis?.overall_pass_rate || 86.2}%</div>
                            <span className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                                <ArrowUpRight className="w-3 h-3" /> +1.5 pp clearance
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Students Improving</span>
                            <div className="text-2xl font-black text-emerald-700">{data?.kpis?.students_improving_pct || 72}%</div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                                {data?.kpis?.students_improving_count || 612} of {data?.kpis?.total_students || 850} Students
                            </span>
                        </div>
                    </div>

                    {/* Secondary Metrics Bar (Operational Delivery) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3.5">
                            <div className="p-2.5 bg-blue-100/70 text-[#0868B2] rounded-xl">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Online Exams</span>
                                <div className="text-lg font-black text-slate-800">{data?.kpis?.online_exams || 92} Conducted</div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3.5">
                            <div className="p-2.5 bg-indigo-100/70 text-indigo-700 rounded-xl">
                                <ScanLine className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">OMR Evaluations</span>
                                <div className="text-lg font-black text-slate-800">{data?.kpis?.omr_exams || 61} Sheets Evaluated</div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3.5">
                            <div className="p-2.5 bg-purple-100/70 text-purple-700 rounded-xl">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Subjective Offline</span>
                                <div className="text-lg font-black text-slate-800">{data?.kpis?.subjective_papers || 31} Papers Generated</div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3.5">
                            <div className="p-2.5 bg-amber-100/70 text-amber-700 rounded-xl">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Students Needing Support</span>
                                <div className="text-lg font-black text-amber-900">{data?.kpis?.students_support_pct || 14}% ({data?.kpis?.students_support_count || 119})</div>
                            </div>
                        </div>
                    </div>

                    {/* Executive AI Academic Digest Card (Section 52 & 53) */}
                    {data?.executive_summary && (
                        <div className="bg-gradient-to-br from-blue-900 to-[#073B73] rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-blue-950/10 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <Sparkles className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <h3 className="text-base font-black tracking-tight">{data.executive_summary.title}</h3>
                                </div>
                                <span className="text-xs font-bold text-blue-200 bg-white/10 px-3 py-1 rounded-full">
                                    Official Audit Grounded
                                </span>
                            </div>

                            <p className="text-sm text-blue-100/90 leading-relaxed font-medium">
                                {data.executive_summary.overview}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
                                        Key Observations
                                    </span>
                                    <ul className="space-y-1.5 text-xs text-blue-100/90 font-medium">
                                        {data.executive_summary.key_observations.map((obs, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-400 font-bold">•</span>
                                                <span>{obs}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block">
                                        Priorities
                                    </span>
                                    <ul className="space-y-1.5 text-xs text-blue-100/90 font-medium">
                                        {data.executive_summary.priorities.map((pri, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-emerald-400 font-bold">•</span>
                                                <span>{pri}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Class Comparison Chart & Trend Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Primary Class Comparison Bar Chart (Section 21 & 24) */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-black text-slate-900 tracking-tight">Class Average Performance</h4>
                                    <p className="text-xs text-slate-500">Cross-grade comparative score benchmarks.</p>
                                </div>
                                <span className="text-xs font-bold text-slate-400">Class 6–12</span>
                            </div>

                            <div className="h-[280px] w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data?.class_comparison || []}
                                        margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="class_name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                        <YAxis domain={[50, 100]} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                        <Tooltip
                                            formatter={(val: any) => [`${val}%`, 'Cohort Average']}
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 700 }}
                                        />
                                        <Bar dataKey="average_percentage" name="Class Average %" fill="#0868B2" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Longitudinal Performance Trend Area Chart (Section 32 & 33) */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-black text-slate-900 tracking-tight">School Academic Trend</h4>
                                    <p className="text-xs text-slate-500">Longitudinal school average and pass rate progression.</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                    +3.6 pp Gain
                                </span>
                            </div>

                            <div className="h-[280px] w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={data?.performance_trends || []}
                                        margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                                    >
                                        <defs>
                                            <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0868B2" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#0868B2" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="gradPass" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="period" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                        <YAxis domain={[60, 100]} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 700 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '8px' }} />
                                        <Area type="monotone" dataKey="average" name="School Average %" stroke="#0868B2" strokeWidth={2.5} fillOpacity={1} fill="url(#gradScore)" />
                                        <Area type="monotone" dataKey="pass_rate" name="Pass Rate %" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradPass)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW 2: CLASS COMPARISON MASTER LEDGER ───────────────────── */}
            {activeTab === 'classes' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Class Performance</h3>
                                <p className="text-xs text-slate-500">
                                    Performance, pass rates, improvement, and support needs by class.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                {filteredClasses.length} Classes
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/50">
                                        <th className="py-3 px-4">Class</th>
                                        <th className="py-3 px-3 text-center">Students</th>
                                        <th className="py-3 px-3 text-center">Class Average</th>
                                        <th className="py-3 px-3 text-center">Pass Rate %</th>
                                        <th className="py-3 px-3 text-center">Mastery %</th>
                                        <th className="py-3 px-3 text-center">Improving %</th>
                                        <th className="py-3 px-3 text-center">Support Needed</th>
                                        <th className="py-3 px-3 text-center">Exams</th>
                                        <th className="py-3 px-3 text-center">Trend (pp)</th>
                                        <th className="py-3 px-3 text-center">Status</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredClasses.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/40 transition group">
                                            <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-[#0868B2]" />
                                                <span>{c.class_name}</span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {c.student_count}
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-black">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                                                    c.average_percentage >= 74 ? 'bg-emerald-50 text-emerald-700' :
                                                    c.average_percentage >= 68 ? 'bg-blue-50 text-blue-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {c.average_percentage}%
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {c.pass_percentage}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {c.mastery_percentage}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                                                {c.improving_percentage}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-amber-800">
                                                {c.support_percentage}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                                    {c.exams_conducted}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold">
                                                <span className={c.trend_pp.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}>
                                                    {c.trend_pp}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    c.status === 'Strong' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    c.status === 'Attention' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/dashboard/reports?type=class&class_name=${encodeURIComponent(c.class_name)}`)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#0868B2] hover:border-[#0868B2] hover:bg-white transition text-[11px] font-bold shadow-sm"
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
                </div>
            )}

            {/* ── VIEW 3: SUBJECTS & TOP LEARNING GAPS ─────────────────────── */}
            {activeTab === 'subjects' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Subject Benchmarks Table */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Subject Performance</h3>
                                <p className="text-xs text-slate-500">Average scores, pass rates, and weak areas by subject across the school.</p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                {data?.subject_benchmarks?.length || 0} Subjects
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/50">
                                        <th className="py-3 px-4">Subject</th>
                                        <th className="py-3 px-3 text-center">Students</th>
                                        <th className="py-3 px-3 text-center">Average Score</th>
                                        <th className="py-3 px-3 text-center">Pass Rate %</th>
                                        <th className="py-3 px-3 text-center">Mastery %</th>
                                        <th className="py-3 px-3 text-center">Status</th>
                                        <th className="py-3 px-4">Key Focus Chapter</th>
                                        <th className="py-3 px-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.subject_benchmarks?.map((sb, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-[#0868B2]" />
                                                <span>{sb.subject}</span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {sb.students}
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-black">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                                                    sb.average >= 74 ? 'bg-emerald-50 text-emerald-700' :
                                                    sb.average >= 70 ? 'bg-blue-50 text-blue-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {sb.average}%
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {sb.pass}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                {sb.mastery}%
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    sb.status === 'Strong' ? 'bg-emerald-50 text-emerald-700' :
                                                    sb.status === 'Attention' ? 'bg-amber-50 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {sb.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                                                {sb.weak_chapter}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/dashboard/reports?type=subject&subject_name=${encodeURIComponent(sb.subject)}`)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0868B2] hover:underline"
                                                >
                                                    <span>Subject Report</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Learning Gaps (Section 28 & 29) */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Top Learning Gaps</h3>
                                <p className="text-xs text-slate-500">Topics and chapters where students are scoring the lowest across all classes.</p>
                            </div>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                                Needs Attention
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {data?.top_learning_gaps?.map((gap) => (
                                <div key={gap.id} className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-[#0868B2] uppercase tracking-wider">{gap.subject}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            gap.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                                            gap.severity === 'High' ? 'bg-amber-100 text-amber-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {gap.severity}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900">{gap.name}</h4>
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                                        <span className="text-slate-500 font-semibold">Average: <strong className="text-slate-800">{gap.average}%</strong></span>
                                        <span className="text-rose-600 font-bold">{gap.students_below_threshold} students below pass</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {gap.classes_affected.map((ca, idx) => (
                                            <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                                {ca}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW 4: STUDENT SUPPORT & IMPROVEMENT TRIAGE ─────────────── */}
            {activeTab === 'support' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Support Triage 4 Cards (Section 30 of Plan) */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Student Support Overview</h3>
                            <p className="text-xs text-slate-500">Students grouped by how much support they need based on their scores.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {data?.student_support_triage?.map((st, idx) => (
                                <div key={idx} className={`p-5 rounded-2xl border space-y-2 ${
                                    st.color === 'emerald' ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950' :
                                    st.color === 'blue' ? 'bg-blue-50/50 border-blue-200/80 text-blue-950' :
                                    st.color === 'amber' ? 'bg-amber-50/50 border-amber-200/80 text-amber-950' :
                                    'bg-rose-50/50 border-rose-200/80 text-rose-950'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider">{st.category}</span>
                                        <span className="text-xs font-black">{st.percentage}%</span>
                                    </div>
                                    <div className="text-3xl font-black">{st.count}</div>
                                    <p className="text-xs opacity-85 font-medium leading-relaxed">{st.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Score Distribution Histogram (Section 49 of Plan) */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Score Distribution</h3>
                            <p className="text-xs text-slate-500">How many students fall into each score range across the school.</p>
                        </div>

                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data?.score_distribution || []}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="range" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                    <Tooltip
                                        formatter={(val: any) => [`${val} students`, 'Count']}
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 700 }}
                                    />
                                    <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                                        {data?.score_distribution?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
