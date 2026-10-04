'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    Award, BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
    Download, Filter, HelpCircle, Layers, LineChart as ChartIcon,
    Loader2, Printer, RefreshCcw, Search, Sparkles, TrendingDown,
    TrendingUp, User, X, AlertCircle, ArrowUpRight, ArrowDownRight,
    SlidersHorizontal, Check, Users, Trophy, School, FileSpreadsheet
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

interface FilterState {
    academic_year: string
    class_name: string
    division: string
    subject_name: string
    exam_id: string
}

interface ReportHeader {
    class_name: string
    division: string
    subject: string
    exam_id: string
    exam_name: string
    academic_year: string
    maximum_marks: number
    passing_marks: number
    exam_date: string
}

interface ClassSummary {
    students_enrolled: number
    students_appeared: number
    average_percentage: number
    highest_percentage: number
    lowest_percentage: number
    pass_count: number
    fail_count: number
    pass_percentage: number
    absent_count: number
    pending_count: number
}

interface StudentRankRecord {
    id: string
    student_id: string
    rank: string
    numeric_rank: number
    student_name: string
    roll_no: string
    admission_no: string
    marks_obtained: number | string
    max_marks: number
    percentage: string
    raw_percentage: number
    grade: string
    status: 'Pass' | 'Fail' | 'Absent' | 'Result Pending'
    avatar: string
}

export default function ClassPerformanceReport() {
    const router = useRouter()

    // ── FILTER STATE ──────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<FilterState>({
        academic_year: 'all',
        class_name: 'all',
        division: 'all',
        subject_name: 'all',
        exam_id: 'all'
    })

    // ── DATA STATE ────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dropdowns, setDropdowns] = useState<{
        academic_years: any[]
        classes: any[]
        divisions: any[]
        subjects: any[]
        exams: any[]
    }>({
        academic_years: [],
        classes: [],
        divisions: [],
        subjects: [],
        exams: []
    })

    const [header, setHeader] = useState<ReportHeader | null>(null)
    const [summary, setSummary] = useState<ClassSummary | null>(null)
    const [students, setStudents] = useState<StudentRankRecord[]>([])
    const [scoreDistribution, setScoreDistribution] = useState<any[]>([])
    const [passFailDistribution, setPassFailDistribution] = useState<any[]>([])

    // ── UI CONTROLS ───────────────────────────────────────────────────────────
    const [studentSearch, setStudentSearch] = useState('')
    const [sortColumn, setSortColumn] = useState<'rank' | 'student_name' | 'marks' | 'percentage' | 'status'>('rank')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [toastMessage, setToastMessage] = useState<{ text: string; ok: boolean } | null>(null)

    const showToast = (text: string, ok: boolean = true) => {
        setToastMessage({ text, ok })
        setTimeout(() => setToastMessage(null), 3500)
    }

    // ── DATA FETCHING ────────────────────────────────────────────────────────
    const fetchClassReport = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setRefreshing(true)

        try {
            const params = new URLSearchParams()
            if (filters.academic_year !== 'all') params.set('academic_year', filters.academic_year)
            if (filters.class_name !== 'all') params.set('class_name', filters.class_name)
            if (filters.division !== 'all') params.set('division', filters.division)
            if (filters.subject_name !== 'all') params.set('subject_name', filters.subject_name)
            if (filters.exam_id !== 'all') params.set('exam_id', filters.exam_id)

            const res = await fetch(`/api/dashboard/reports/class-performance?${params.toString()}`)
            const json = await res.json()

            if (json.success && json.data) {
                const d = json.data
                setDropdowns(d.filters || {
                    academic_years: [],
                    classes: [],
                    divisions: [],
                    subjects: [],
                    exams: []
                })
                setHeader(d.header)
                setSummary(d.summary)
                setStudents(d.students || [])
                setScoreDistribution(d.score_distribution || [])
                setPassFailDistribution(d.pass_fail_distribution || [])

                // Sync current exam selection if 'all'
                if (filters.exam_id === 'all' && d.header?.exam_id) {
                    setFilters(prev => ({
                        ...prev,
                        class_name: d.header.class_name || prev.class_name,
                        division: d.header.division || prev.division,
                        subject_name: d.header.subject || prev.subject_name,
                        exam_id: d.header.exam_id
                    }))
                }
            } else {
                showToast(json.error || 'Failed to load class report', false)
            }
        } catch (err: any) {
            console.error('Failed to fetch class report:', err)
            showToast('Network error while loading class report', false)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [filters])

    useEffect(() => {
        fetchClassReport()
    }, [fetchClassReport])

    // Dependent Filter Cascades:
    const handleClassChange = (newClass: string) => {
        setFilters(prev => ({
            ...prev,
            class_name: newClass,
            division: 'all',
            subject_name: 'all',
            exam_id: 'all'
        }))
    }

    const handleSubjectChange = (newSubject: string) => {
        setFilters(prev => ({
            ...prev,
            subject_name: newSubject,
            exam_id: 'all'
        }))
    }

    // ── CSV EXPORT (SECTION 27) ──────────────────────────────────────────────
    const handleExportCSV = () => {
        if (!header || students.length === 0) {
            showToast('No class results to export', false)
            return
        }

        const headers = ['Rank', 'Student Name', 'Admission No', 'Roll No', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade', 'Status']
        const rows = students.map(s => [
            `"${s.rank}"`,
            `"${s.student_name}"`,
            `"${s.admission_no}"`,
            `"${s.roll_no}"`,
            `"${s.marks_obtained}"`,
            `"${s.max_marks}"`,
            `"${s.percentage}"`,
            `"${s.grade}"`,
            `"${s.status}"`
        ])

        const metaRows = [
            ['CLASS ACADEMIC EXAMINATION REPORT'],
            [`Class: ${header.class_name} - Section ${header.division}`],
            [`Subject: ${header.subject}`],
            [`Examination: ${header.exam_name}`],
            [`Exam Date: ${header.exam_date}`],
            [`Academic Year: ${header.academic_year}`],
            [`Maximum Marks: ${header.maximum_marks}`],
            [`Passing Marks: ${header.passing_marks}`],
            [`Students Appeared: ${summary?.students_appeared} / ${summary?.students_enrolled}`],
            [`Class Average: ${summary?.average_percentage}%`],
            [`Pass Percentage: ${summary?.pass_percentage}%`],
            [`Export Generated: ${new Date().toLocaleString()}`],
            []
        ]

        const csvContent = 'data:text/csv;charset=utf-8,' +
            metaRows.map(r => r.join(',')).join('\n') + '\n' +
            headers.join(',') + '\n' +
            rows.map(r => r.join(',')).join('\n')

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `Class_Report_${header.class_name}_${header.division}_${header.subject}_${header.exam_name.replace(/\s+/g, '_')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('Class performance CSV exported successfully')
    }

    // ── SORTED & SEARCHED STUDENTS ───────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (!studentSearch.trim()) return true
            const q = studentSearch.toLowerCase()
            return s.student_name.toLowerCase().includes(q) ||
                s.roll_no.toLowerCase().includes(q) ||
                s.admission_no.toLowerCase().includes(q) ||
                s.status.toLowerCase().includes(q)
        }).sort((a, b) => {
            let comp = 0
            if (sortColumn === 'rank') comp = a.numeric_rank - b.numeric_rank
            else if (sortColumn === 'student_name') comp = a.student_name.localeCompare(b.student_name)
            else if (sortColumn === 'marks') comp = (Number(a.marks_obtained) || 0) - (Number(b.marks_obtained) || 0)
            else if (sortColumn === 'percentage') comp = a.raw_percentage - b.raw_percentage
            else if (sortColumn === 'status') comp = a.status.localeCompare(b.status)
            return sortOrder === 'asc' ? comp : -comp
        })
    }, [students, studentSearch, sortColumn, sortOrder])

    // ── LOADING STATE ────────────────────────────────────────────────────────
    if (loading && !header) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-12 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin text-[#0868B2] mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Generating Class Performance Ledger...</h3>
                <p className="text-sm text-slate-400 mt-1">Aggregating cohort statistics, grade distributions, and student rankings</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 print:p-0 print:space-y-4 font-sans text-slate-800">
            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                    toastMessage.ok 
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                    {toastMessage.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* ── SECTION 3 & 4: COMPACT STICKY FILTER CONTROLS ───────────────── */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0868B2]/10 flex items-center justify-center text-[#0868B2]">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Class Report Filters</h2>
                            <p className="text-xs font-semibold text-slate-500">Academic Year → Class → Section → Subject → Exam</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setFilters({
                                    academic_year: 'all',
                                    class_name: 'all',
                                    division: 'all',
                                    subject_name: 'all',
                                    exam_id: 'all'
                                })
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => fetchClassReport(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Refreshing...' : 'Apply Filters'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
                    {/* Academic Year */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Academic Year
                        </label>
                        <select
                            value={filters.academic_year}
                            onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]"
                        >
                            <option value="all">Current Academic Session</option>
                            {dropdowns.academic_years.map(y => (
                                <option key={y.id} value={y.name}>{y.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Class */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Class
                        </label>
                        <select
                            value={filters.class_name}
                            onChange={e => handleClassChange(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]"
                        >
                            {dropdowns.classes.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Section */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Section
                        </label>
                        <select
                            value={filters.division}
                            onChange={e => setFilters(f => ({ ...f, division: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]"
                        >
                            {dropdowns.divisions.map(d => (
                                <option key={d.id} value={d.name}>Section {d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Subject
                        </label>
                        <select
                            value={filters.subject_name}
                            onChange={e => handleSubjectChange(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]"
                        >
                            {dropdowns.subjects.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Examination */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Examination
                        </label>
                        <select
                            value={filters.exam_id}
                            onChange={e => setFilters(f => ({ ...f, exam_id: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0868B2]"
                        >
                            {dropdowns.exams.length === 0 ? (
                                <option value="all">No Exams Scheduled</option>
                            ) : (
                                dropdowns.exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── SECTION 6 & 36: REPORT CONTEXT HERO BANNER ─────────────────── */}
            {header && (
                <div className="relative overflow-hidden bg-gradient-to-br from-[#003364] via-[#0868B2] to-[#002850] rounded-3xl p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            {/* Class Badge Icon */}
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                                <Users className="w-10 h-10 text-white" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                                        {header.class_name} - {header.division} — {header.subject}
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Published Class Ledger
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-blue-100/80">
                                    <span>Exam: <strong className="text-white">{header.exam_name}</strong></span>
                                    <span>•</span>
                                    <span>Date: <strong className="text-white">{header.exam_date}</strong></span>
                                    <span>•</span>
                                    <span>Max Marks: <strong className="text-white">{header.maximum_marks}</strong></span>
                                    <span>•</span>
                                    <span>Passing Marks: <strong className="text-white">{header.passing_marks} (35%)</strong></span>
                                    <span>•</span>
                                    <span>{header.academic_year}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 print:hidden">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print / Export PDF</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#003364] text-xs font-black transition shadow-lg"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Export Excel / CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Subtle decorative background watermarks */}
                    <School className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
                </div>
            )}

            {/* ── SECTION 7 & 8: CLASS PERFORMANCE SUMMARY STRIP (6 CARDS) ───── */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Students Appeared */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Students Appeared</span>
                            <div className="w-8 h-8 rounded-xl bg-[#0868B2]/10 text-[#0868B2] flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.students_appeared}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Enrolled: {summary.students_enrolled} • Absent: {summary.absent_count}
                        </div>
                    </div>

                    {/* Class Average */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Class Average</span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Award className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.average_percentage}%
                        </div>
                        <div className="mt-2 text-xs font-bold text-emerald-600">
                            {summary.average_percentage >= 75 ? 'First Class Dist.' : summary.average_percentage >= 60 ? 'First Class' : 'Pass Class'}
                        </div>
                    </div>

                    {/* Highest Score */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Highest Score</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.highest_percentage}%
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Cohort Benchmark
                        </div>
                    </div>

                    {/* Lowest Score */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Lowest Score</span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.lowest_percentage}%
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Minimum Appeared
                        </div>
                    </div>

                    {/* Pass Count */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pass Count</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Check className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.pass_count}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Failed: {summary.fail_count} Students
                        </div>
                    </div>

                    {/* Pass Percentage */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pass Percentage</span>
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.pass_percentage}%
                        </div>
                        <div className="mt-2 text-xs font-bold text-purple-600">
                            Success Clearance Rate
                        </div>
                    </div>
                </div>
            )}

            {/* ── SECTION 21 & 22: SCORE & PASS/FAIL DISTRIBUTION ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Distribution Histogram (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Score Range Distribution</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                    Number of students achieving each percentage tier in {header?.subject}
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                                {summary?.students_appeared} Evaluations
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="scoreBarGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0868B2" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#0868B2" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="range"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                    />
                                    <Bar dataKey="count" fill="url(#scoreBarGrad)" radius={[8, 8, 0, 0]} barSize={44} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pass / Fail / Absent Distribution Donut (1 col) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Pass / Fail Ratio</h3>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Result Clearance</span>
                        </div>

                        <div className="relative flex items-center justify-center my-4">
                            <div className="absolute text-center">
                                <div className="text-3xl font-black text-slate-900">{summary?.pass_percentage}%</div>
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Pass Rate</div>
                            </div>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={passFailDistribution}
                                        innerRadius={65}
                                        outerRadius={90}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={8}
                                    >
                                        {passFailDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 800 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-4">
                            {passFailDistribution.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-slate-700">{item.name}</span>
                                    </div>
                                    <span className="text-slate-900">{item.value} Students</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 9, 10, 11 & 20: STUDENT PERFORMANCE RANKING TABLE ──── */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Student Academic Ranking</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            Official ranked ledger based on normalized examination percentages
                        </p>
                    </div>

                    {/* Search filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search student name or roll..."
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                className="h-10 pl-9 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0868B2] w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                <th 
                                    className="pb-4 pl-4 cursor-pointer hover:text-slate-700 transition"
                                    onClick={() => {
                                        setSortColumn('rank')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Rank
                                </th>
                                <th 
                                    className="pb-4 cursor-pointer hover:text-slate-700 transition"
                                    onClick={() => {
                                        setSortColumn('student_name')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Student Name
                                </th>
                                <th className="pb-4">Roll / Admission</th>
                                <th 
                                    className="pb-4 cursor-pointer hover:text-slate-700 transition"
                                    onClick={() => {
                                        setSortColumn('marks')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Marks
                                </th>
                                <th 
                                    className="pb-4 cursor-pointer hover:text-slate-700 transition"
                                    onClick={() => {
                                        setSortColumn('percentage')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Percentage
                                </th>
                                <th className="pb-4">Grade</th>
                                <th 
                                    className="pb-4 cursor-pointer hover:text-slate-700 transition"
                                    onClick={() => {
                                        setSortColumn('status')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Status
                                </th>
                                <th className="pb-4 text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                                        No student results found for the selected examination.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((st) => {
                                    const isTop1 = st.rank === '1'
                                    const isTop2 = st.rank === '2'
                                    const isTop3 = st.rank === '3'

                                    return (
                                        <tr 
                                            key={st.id} 
                                            onClick={() => router.push(`/dashboard/reports?type=students&student_id=${st.student_id}`)}
                                            className="hover:bg-slate-50/80 transition cursor-pointer group"
                                        >
                                            <td className="py-4 pl-4 font-black">
                                                {st.rank === '—' ? (
                                                    <span className="text-slate-400">—</span>
                                                ) : (
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                                                        isTop1 ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm' :
                                                        isTop2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                                                        isTop3 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {isTop1 ? '🥇 1' : isTop2 ? '🥈 2' : isTop3 ? '🥉 3' : st.rank}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#0868B2]/10 text-[#0868B2] flex items-center justify-center font-bold text-xs group-hover:bg-[#0868B2] group-hover:text-white transition">
                                                    {st.avatar}
                                                </div>
                                                <span className="group-hover:text-[#0868B2] transition">{st.student_name}</span>
                                            </td>
                                            <td className="py-4 text-xs font-semibold text-slate-500">
                                                Roll #{st.roll_no} • {st.admission_no}
                                            </td>
                                            <td className="py-4 font-bold text-slate-800">
                                                {st.status === 'Absent' ? '—' : `${st.marks_obtained} / ${st.max_marks}`}
                                            </td>
                                            <td className="py-4 font-black text-slate-900">
                                                {st.percentage}
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    st.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                                    st.grade.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                                                    st.grade === 'Absent' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {st.grade}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    st.status === 'Pass' ? 'bg-emerald-50 text-emerald-700' :
                                                    st.status === 'Fail' ? 'bg-rose-50 text-rose-700' :
                                                    st.status === 'Absent' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {st.status === 'Pass' ? <Check className="w-3 h-3" /> :
                                                     st.status === 'Fail' ? <X className="w-3 h-3" /> : null}
                                                    <span>{st.status}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/dashboard/reports?type=students&student_id=${st.student_id}`)
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0868B2] hover:underline"
                                                >
                                                    <span>View Student Report</span>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── SECTION 26 & 28: PRINT FOOTER WITH SIGNATURE SEALS ──────────── */}
            <div className="hidden print:block pt-12 mt-12 border-t border-slate-300">
                <div className="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-700">
                    <div className="space-y-12">
                        <div className="h-0.5 bg-slate-400 w-3/4 mx-auto" />
                        <span>Subject Teacher Signature</span>
                    </div>
                    <div className="space-y-12">
                        <div className="h-0.5 bg-slate-400 w-3/4 mx-auto" />
                        <span>Class Teacher Signature</span>
                    </div>
                    <div className="space-y-12">
                        <div className="h-0.5 bg-slate-400 w-3/4 mx-auto" />
                        <span>Principal / Seal of Institution</span>
                    </div>
                </div>
                <div className="mt-8 text-center text-[10px] text-slate-400">
                    Official Class Performance Report generated on {new Date().toLocaleString()} from BeBrilliant Academic ERP.
                </div>
            </div>
        </div>
    )
}
