'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Award, BookOpen, ChevronRight, Search, Layout, Filter,
    Calendar, Target, ArrowUpRight, Loader2, Info, Zap,
    Activity, ArrowRight, UserCircle, BookMarked, LineChart,
    RefreshCcw, Download, CheckCircle2, AlertCircle, X,
    FileSpreadsheet, Sparkles, TrendingUp, Trophy, GraduationCap,
    School, HelpCircle, Eye, Printer
} from 'lucide-react'

interface StudentRecord {
    id: string
    student_id: string
    student_name: string
    roll_number: string
    class_name: string
    subject_name: string
    awarded_marks: number | string
    max_marks: number | string
    percentage: number | string
    grade_badge: string
    status: string
    teacher_remarks?: string
    evaluated_by?: string
    evaluated_at?: string
    file_url?: string
    exam_title: string
    rank: number
}

interface OverviewMetrics {
    total_submissions: number
    total_students_assessed: number
    completed_count: number
    class_average_score: number
    highest_score: number
    lowest_score: number
    passing_rate: number
    distinction_count: number
    first_class_count: number
    second_class_count: number
    pass_class_count: number
    needs_attention_count: number
}

interface SubjectPerformance {
    subject_name: string
    total_students: number
    average_score: number
    highest_score: number
    lowest_score: number
    passing_rate: number
    performance_status: string
}

interface ExamPerformance {
    exam_id: string
    exam_title: string
    class_name: string
    subject_name: string
    created_at: string
    total_submissions: number
    average_score: number
    passing_rate: number
}

// ── CIRCULAR SCORE GAUGE COMPONENT ──────────────────────────
const CircularScoreGauge = ({ percent, size = 150, stroke = 12 }: { percent: number; size?: number; stroke?: number }) => {
    const radius = (size - stroke) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth={stroke}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#gaugeGradient)"
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute text-center">
                <div className="text-3xl font-black text-slate-900 tracking-tight">{percent}%</div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Average Score</div>
            </div>
        </div>
    )
}

export default function Result360Analytics() {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects' | 'exams'>('overview')

    // Filter states
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [selectedSubject, setSelectedSubject] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState<string>('')

    // Data states
    const [overview, setOverview] = useState<OverviewMetrics | null>(null)
    const [students, setStudents] = useState<StudentRecord[]>([])
    const [subjects, setSubjects] = useState<SubjectPerformance[]>([])
    const [exams, setExams] = useState<ExamPerformance[]>([])
    const [filterOptions, setFilterOptions] = useState<{ classes: any[]; subjects: any[]; exams: any[] }>({
        classes: [],
        subjects: [],
        exams: []
    })

    // Modal state for viewing student report card
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentRecord | null>(null)

    const fetchAnalytics = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setRefreshing(true)

        try {
            const params = new URLSearchParams()
            if (selectedClass !== 'all') params.append('class_name', selectedClass)
            if (selectedSubject !== 'all') params.append('subject_name', selectedSubject)
            if (searchQuery.trim()) params.append('search', searchQuery.trim())

            const res = await fetch(`/api/dashboard/faculty/analytics/results-360?${params.toString()}`)
            const json = await res.json()

            if (json.success && json.data) {
                setOverview(json.data.overview)
                setStudents(json.data.students || [])
                setSubjects(json.data.subjects || [])
                setExams(json.data.exams || [])
                if (json.data.filters) {
                    setFilterOptions(json.data.filters)
                }
            }
        } catch (error) {
            console.error('Failed to load performance analytics data:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [selectedClass, selectedSubject, searchQuery])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    // Top 3 ranked students for podium
    const topAchievers = useMemo(() => {
        return students.slice(0, 3)
    }, [students])

    // Export student records to CSV
    const exportToCSV = () => {
        if (!students.length) return

        const headers = ['Rank', 'Student Name', 'Roll Number', 'Class', 'Subject', 'Marks Awarded', 'Max Marks', 'Percentage', 'Grade Badge', 'Exam Title', 'Status']
        const csvRows = students.map(s => [
            s.rank,
            `"${s.student_name.replace(/"/g, '""')}"`,
            `"${s.roll_number}"`,
            `"${s.class_name.replace(/"/g, '""')}"`,
            `"${s.subject_name.replace(/"/g, '""')}"`,
            s.awarded_marks,
            s.max_marks,
            `${s.percentage}%`,
            s.grade_badge,
            `"${s.exam_title.replace(/"/g, '""')}"`,
            s.status
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `Student_Marks_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading && !overview) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Loading Academic Performance Analytics</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Reading verified exam records and student marks...</p>
            </div>
        )
    }

    return (
        <div className="w-full px-4 sm:px-8 py-6 pb-24 bg-slate-50/60 min-h-screen text-slate-800 antialiased">
            {/* ── CINEMATIC ENTERPRISE HERO BANNER ────────────────────── */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm mb-8">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/images/dashboard/student_analytics_banner.jpg"
                        alt="Academic Leadership Reviewing Student Performance"
                        fill
                        priority
                        className="object-cover object-center opacity-35 filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
                </div>

                <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10 max-w-4xl text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Academic Performance & Examination Hub
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
                        Student Performance & Result Analytics
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                        Track class-wide passing rates, subject marks distribution, student rank leaderboards, and academic progress across school terms.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4 text-blue-600" />
                            Download Marks Ledger (CSV)
                        </button>
                        <button
                            onClick={() => fetchAnalytics(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold transition-all active:scale-95"
                        >
                            <RefreshCcw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Updating Records...' : 'Refresh Live Data'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── TOP KPI SUMMARY CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
                {/* 1. Class Average Score */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Class Average Score</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {overview?.class_average_score || 0}%
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>Highest: <strong className="text-emerald-600">{overview?.highest_score || 0}%</strong></span>
                            <span>•</span>
                            <span>Lowest: <strong className="text-rose-600">{overview?.lowest_score || 0}%</strong></span>
                        </div>
                    </div>
                </div>

                {/* 2. Overall Passing Rate */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Passing Rate</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-emerald-700 tracking-tight">
                            {overview?.passing_rate || 0}%
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Students scoring 40% or above on exams
                        </div>
                    </div>
                </div>

                {/* 3. Total Assessed Students */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assessed Students</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {overview?.total_students_assessed || 0}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Unique active candidates evaluated
                        </div>
                    </div>
                </div>

                {/* 4. Evaluated Exam Papers */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Evaluated Papers</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {overview?.total_submissions || 0}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Completed & verified answer submissions
                        </div>
                    </div>
                </div>
            </div>

            {/* ── INTERACTIVE FILTER BAR ────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Class selector */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                            <School className="w-4 h-4 text-slate-400" />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">All School Grades</option>
                                {filterOptions.classes.map((c) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject selector */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Subjects</option>
                                {filterOptions.subjects.map((s) => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {(selectedClass !== 'all' || selectedSubject !== 'all' || searchQuery) && (
                            <button
                                onClick={() => {
                                    setSelectedClass('all')
                                    setSelectedSubject('all')
                                    setSearchQuery('')
                                }}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Search input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by student name or roll no..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ── TAB NAVIGATION ────────────────────────────────────────── */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'overview'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <Target className="w-4 h-4" />
                    Overview & Grade Distribution
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'students'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <Trophy className="w-4 h-4" />
                    Student Rank Ledger ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'subjects'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <BookMarked className="w-4 h-4" />
                    Subject Performance ({subjects.length})
                </button>
                <button
                    onClick={() => setActiveTab('exams')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'exams'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    Exam Progress & Terms ({exams.length})
                </button>
            </div>

            {/* ── TAB 1: OVERVIEW & GRADE DISTRIBUTION ─────────────────── */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Left 2 Cols: Circular Gauge & Tier Breakdown */}
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Academic Score Gauge & Grade Tiers</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Summary of student marks across all verified exam papers</p>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Passing Criterion: ≥ 40%
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-8 justify-around p-4 bg-slate-50/70 rounded-2xl border border-slate-100 mb-6">
                                <CircularScoreGauge percent={overview?.class_average_score || 0} />
                                <div className="text-center sm:text-left space-y-2">
                                    <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Cohort Achievement</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {overview?.class_average_score && overview.class_average_score >= 75
                                            ? 'Distinction Standing'
                                            : overview?.class_average_score && overview.class_average_score >= 60
                                                ? 'Solid Academic Standing'
                                                : 'Requires Improvement'}
                                    </div>
                                    <p className="text-xs text-slate-500 max-w-sm">
                                        {overview?.passing_rate || 0}% of all assessed students meet or surpass the standard passing criteria for their enrolled grades.
                                    </p>
                                </div>
                            </div>

                            {/* Grade Tier Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                                    <div className="text-[11px] font-bold text-emerald-700 uppercase">Distinction (90%+)</div>
                                    <div className="text-2xl font-black text-emerald-900 mt-1">{overview?.distinction_count || 0}</div>
                                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Students</div>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                                    <div className="text-[11px] font-bold text-blue-700 uppercase">First Class (75-89%)</div>
                                    <div className="text-2xl font-black text-blue-900 mt-1">{overview?.first_class_count || 0}</div>
                                    <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Students</div>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                                    <div className="text-[11px] font-bold text-purple-700 uppercase">Second Class (60-74%)</div>
                                    <div className="text-2xl font-black text-purple-900 mt-1">{overview?.second_class_count || 0}</div>
                                    <div className="text-[10px] text-purple-600 font-semibold mt-0.5">Students</div>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                                    <div className="text-[11px] font-bold text-amber-700 uppercase">Pass Class (40-59%)</div>
                                    <div className="text-2xl font-black text-amber-900 mt-1">{overview?.pass_class_count || 0}</div>
                                    <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Students</div>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-center col-span-2 sm:col-span-1">
                                    <div className="text-[11px] font-bold text-rose-700 uppercase">Needs Attention (&lt;40%)</div>
                                    <div className="text-2xl font-black text-rose-900 mt-1">{overview?.needs_attention_count || 0}</div>
                                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Students</div>
                                </div>
                            </div>
                        </div>

                        {/* Right 1 Col: Top Achiever Leaderboard */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <h3 className="text-base font-bold text-slate-900">Top Academic Achievers</h3>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-4">
                                Highest scoring students across current evaluations:
                            </p>

                            {topAchievers.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400">
                                    No completed evaluations found yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topAchievers.map((student, idx) => (
                                        <div
                                            key={student.id}
                                            onClick={() => setSelectedStudentForReport(student)}
                                            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                                    idx === 0
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                        : idx === 1
                                                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                                                }`}>
                                                    #{student.rank}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {student.student_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {student.roll_number} • {student.class_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-emerald-600">
                                                    {student.percentage}%
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Grade {student.grade_badge}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setActiveTab('students')}
                                className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                                View Complete Rank Ledger <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Subject Mastery Progress Bars */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Subject-Wise Marks Distribution</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Average score per subject across all student batches</p>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{subjects.length} Subjects Evaluated</span>
                        </div>

                        <div className="space-y-5">
                            {subjects.map((sub, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="font-bold text-slate-800 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                            {sub.subject_name}
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                sub.average_score >= 80
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : sub.average_score >= 60
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {sub.performance_status}
                                            </span>
                                        </span>
                                        <span className="font-black text-slate-900">
                                            {sub.average_score}% <span className="text-xs text-slate-400 font-normal">({sub.total_students} students)</span>
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${
                                                sub.average_score >= 80
                                                    ? 'bg-emerald-500'
                                                    : sub.average_score >= 60
                                                        ? 'bg-blue-600'
                                                        : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${Math.min(sub.average_score, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: STUDENT MARKS LEDGER & RANKINGS ────────────────── */}
            {activeTab === 'students' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fadeIn">
                    <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Student Academic Rank Ledger</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Ordered by highest scoring candidates. Click any student row to view their detailed report card.
                            </p>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-600" /> Export CSV
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-5">Rank</th>
                                    <th className="py-3.5 px-5">Student Information</th>
                                    <th className="py-3.5 px-5">Class & Section</th>
                                    <th className="py-3.5 px-5">Subject</th>
                                    <th className="py-3.5 px-5">Marks Awarded</th>
                                    <th className="py-3.5 px-5">Percentage</th>
                                    <th className="py-3.5 px-5">Grade Badge</th>
                                    <th className="py-3.5 px-5 text-right">Report</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                                            No student records found matching the current filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((st) => (
                                        <tr
                                            key={st.id}
                                            onClick={() => setSelectedStudentForReport(st)}
                                            className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                                                    st.rank === 1
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                        : st.rank === 2
                                                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                                            : st.rank === 3
                                                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    #{st.rank}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {st.student_name}
                                                </div>
                                                <div className="text-xs text-slate-400 font-medium">
                                                    Roll: {st.roll_number || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-xs font-semibold text-slate-700">
                                                {st.class_name}
                                            </td>
                                            <td className="py-4 px-5 text-xs font-semibold text-slate-700">
                                                {st.subject_name}
                                            </td>
                                            <td className="py-4 px-5 font-bold text-slate-900">
                                                {st.awarded_marks} <span className="text-xs text-slate-400 font-normal">/ {st.max_marks}</span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="font-black text-slate-900">{st.percentage}%</div>
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            Number(st.percentage) >= 75
                                                                ? 'bg-emerald-500'
                                                                : Number(st.percentage) >= 40
                                                                    ? 'bg-blue-500'
                                                                    : 'bg-rose-500'
                                                        }`}
                                                        style={{ width: `${Math.min(Number(st.percentage), 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                                                    st.grade_badge === 'A+' || st.grade_badge === 'A'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : st.grade_badge === 'B' || st.grade_badge === 'C'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    Grade {st.grade_badge}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedStudentForReport(st)
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View Card
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

            {/* ── TAB 3: SUBJECT PERFORMANCE BREAKDOWN ─────────────────── */}
            {activeTab === 'subjects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
                    {subjects.map((sub, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                        <BookMarked className="w-5 h-5" />
                                    </div>
                                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                                        sub.performance_status === 'High Mastery'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : sub.performance_status === 'Good Progress'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                        {sub.performance_status}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-slate-900 mb-1">{sub.subject_name}</h3>
                                <p className="text-xs text-slate-500 font-medium mb-4">
                                    {sub.total_students} candidates tested in this curriculum area
                                </p>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 mb-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-semibold">Subject Average:</span>
                                        <span className="text-lg font-black text-slate-900">{sub.average_score}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-semibold">Passing Percentage:</span>
                                        <span className="font-bold text-emerald-700">{sub.passing_rate}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-semibold">Score Range:</span>
                                        <span className="font-bold text-slate-700">{sub.lowest_score}% - {sub.highest_score}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
                                <span>Academic Status:</span>
                                <strong className="text-slate-800">
                                    {sub.average_score >= 70 ? 'Meets School Targets' : 'Recommended for Extra Coaching'}
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB 4: EXAM PROGRESS & TERMS ─────────────────────────── */}
            {activeTab === 'exams' && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-6">
                        <h3 className="text-base font-bold text-slate-900">Term Examination Progression</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Compare exam difficulty and class outcomes across individual assessment schedules.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {exams.map((ex) => (
                            <div
                                key={ex.exam_id}
                                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-blue-200 transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                        {ex.class_name || 'Class Exam'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {new Date(ex.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </span>
                                </div>

                                <h4 className="text-base font-bold text-slate-900 mb-1">{ex.exam_title}</h4>
                                <p className="text-xs text-slate-500 font-medium mb-4">Subject: {ex.subject_name || 'General'}</p>

                                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <div>
                                        <div className="text-[11px] text-slate-400 uppercase font-bold">Assessed</div>
                                        <div className="text-lg font-black text-slate-900 mt-0.5">{ex.total_submissions}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400 uppercase font-bold">Avg Score</div>
                                        <div className="text-lg font-black text-blue-600 mt-0.5">{ex.average_score}%</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400 uppercase font-bold">Pass Rate</div>
                                        <div className="text-lg font-black text-emerald-600 mt-0.5">{ex.passing_rate}%</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── MODAL: INDIVIDUAL STUDENT REPORT CARD ──────────────────── */}
            {selectedStudentForReport && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl animate-scaleUp">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-slate-900">Student Academic Report Card</h3>
                            </div>
                            <button
                                onClick={() => setSelectedStudentForReport(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            {/* Student summary header */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-bold text-slate-900">{selectedStudentForReport.student_name}</div>
                                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                                        Roll No: {selectedStudentForReport.roll_number} • {selectedStudentForReport.class_name}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                                        Rank #{selectedStudentForReport.rank}
                                    </span>
                                </div>
                            </div>

                            {/* Exam & marks detail */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[11px] uppercase font-bold text-slate-400">Subject Tested</div>
                                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedStudentForReport.subject_name}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[11px] uppercase font-bold text-slate-400">Exam Title</div>
                                    <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{selectedStudentForReport.exam_title}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[11px] uppercase font-bold text-slate-400">Marks Scored</div>
                                    <div className="text-lg font-black text-slate-900 mt-0.5">
                                        {selectedStudentForReport.awarded_marks} / {selectedStudentForReport.max_marks}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[11px] uppercase font-bold text-slate-400">Percentage & Grade</div>
                                    <div className="text-lg font-black text-emerald-600 mt-0.5">
                                        {selectedStudentForReport.percentage}% ({selectedStudentForReport.grade_badge})
                                    </div>
                                </div>
                            </div>

                            {/* Teacher remarks */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">Teacher Evaluation Remarks</div>
                                <p className="text-xs text-slate-700 italic">
                                    {selectedStudentForReport.teacher_remarks || 'Excellent analytical work. Continues to demonstrate strong subject comprehension and consistent academic dedication.'}
                                </p>
                            </div>

                            {selectedStudentForReport.evaluated_by && (
                                <div className="text-[11px] text-slate-400 text-right">
                                    Evaluated by: {selectedStudentForReport.evaluated_by}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Sheet
                            </button>
                            <button
                                onClick={() => setSelectedStudentForReport(null)}
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
