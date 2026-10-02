'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    Award, BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
    Download, Filter, HelpCircle, Layers, LineChart as ChartIcon,
    Loader2, Printer, RefreshCcw, Search, Sparkles, TrendingDown,
    TrendingUp, User, X, AlertCircle, ArrowUpRight, ArrowDownRight,
    SlidersHorizontal, Check, Users, Trophy, School, FileSpreadsheet,
    AlertTriangle, Target, Compass, Flame, ShieldAlert, BrainCircuit,
    ListTree, BookCheck
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

interface TopicMetric {
    id: string
    topic_name: string
    chapter_name: string
    average_percentage: number
    mastery_percentage: number
    question_count: number
    students_below_threshold: number
    students_mastered: number
    status: string
    risk: 'High' | 'Low'
}

interface ChapterMetric {
    id: string
    chapter_name: string
    subject: string
    average_percentage: number
    mastery_percentage: number
    status: string
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
    topics_count: number
    students_below_threshold: number
    students_mastered: number
    topics: TopicMetric[]
    students_requiring_intervention: Array<{
        student_id: string
        name: string
        score: string
        gap: string
        recommended_action: string
    }>
}

interface MergedReportProps {
    initialSubView?: 'class' | 'subject' | 'chapter'
}

export default function MergedAcademicReport({ initialSubView = 'class' }: MergedReportProps) {
    const router = useRouter()

    // ── SUB-VIEW TAB SWITCHER ('class' | 'subject' | 'chapter') ───────────────
    const [activeTab, setActiveTab] = useState<'class' | 'subject' | 'chapter'>(initialSubView)

    useEffect(() => {
        if (initialSubView) setActiveTab(initialSubView)
    }, [initialSubView])

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
    const [classData, setClassData] = useState<any>(null)
    const [subjectData, setSubjectData] = useState<any>(null)
    const [chapterTopicData, setChapterTopicData] = useState<any>(null)

    // ── UI CONTROLS ───────────────────────────────────────────────────────────
    const [studentSearch, setStudentSearch] = useState('')
    const [selectedChapterForModal, setSelectedChapterForModal] = useState<ChapterMetric | null>(null)
    const [toastMessage, setToastMessage] = useState<{ text: string; ok: boolean } | null>(null)

    const showToast = (text: string, ok: boolean = true) => {
        setToastMessage({ text, ok })
        setTimeout(() => setToastMessage(null), 3500)
    }

    // ── FETCH MERGED REPORT DATA ──────────────────────────────────────────────
    const fetchReport = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setRefreshing(true)

        try {
            const params = new URLSearchParams()
            if (filters.academic_year !== 'all') params.set('academic_year', filters.academic_year)
            if (filters.class_name !== 'all') params.set('class_name', filters.class_name)
            if (filters.division !== 'all') params.set('division', filters.division)
            if (filters.subject_name !== 'all') params.set('subject_name', filters.subject_name)
            if (filters.exam_id !== 'all') params.set('exam_id', filters.exam_id)

            const res = await fetch(`/api/dashboard/reports/academic-analytics?${params.toString()}`)
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
                setClassData(d.class_view)
                setSubjectData(d.subject_view)
                setChapterTopicData(d.chapter_topic_view)

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
                showToast(json.error || 'Failed to load report data', false)
            }
        } catch (err: any) {
            console.error('Error fetching merged report:', err)
            showToast('Network error while loading merged report', false)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [filters])

    useEffect(() => {
        fetchReport()
    }, [fetchReport])

    // Filter Handlers
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

    // ── CSV EXPORT ────────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (!header) return

        let csvContent = 'data:text/csv;charset=utf-8,'
        if (activeTab === 'class') {
            const students = classData?.students || []
            const headers = ['Rank', 'Student Name', 'Admission No', 'Roll No', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade', 'Status']
            const rows = students.map((s: any) => [
                `"${s.rank}"`, `"${s.student_name}"`, `"${s.admission_no}"`, `"${s.roll_no}"`,
                `"${s.marks_obtained}"`, `"${s.max_marks}"`, `"${s.percentage}"`, `"${s.grade}"`, `"${s.status}"`
            ])
            csvContent += `CLASS REPORT - ${header.class_name} ${header.division} ${header.subject}\n` +
                headers.join(',') + '\n' + rows.map((r: any) => r.join(',')).join('\n')
        } else if (activeTab === 'subject') {
            const subjects = subjectData?.subjects || []
            const headers = ['Subject', 'Students Appeared', 'Average %', 'Highest %', 'Lowest %', 'Pass %', 'Weak Students', 'Strong Students', 'Mastery']
            const rows = subjects.map((s: any) => [
                `"${s.subject}"`, `"${s.students_appeared}"`, `"${s.average_percentage}%"`, `"${s.highest_percentage}%"`,
                `"${s.lowest_percentage}%"`, `"${s.pass_percentage}%"`, `"${s.weak_students}"`, `"${s.strong_students}"`, `"${s.mastery_level}"`
            ])
            csvContent += `SUBJECT PERFORMANCE REPORT - ${header.class_name} ${header.division}\n` +
                headers.join(',') + '\n' + rows.map((r: any) => r.join(',')).join('\n')
        } else {
            const chapters = chapterTopicData?.chapters || []
            const headers = ['Chapter Name', 'Subject', 'Average %', 'Mastery %', 'Status', 'Risk Level', 'Topics Count', 'Students Below Threshold']
            const rows = chapters.map((c: any) => [
                `"${c.chapter_name}"`, `"${c.subject}"`, `"${c.average_percentage}%"`, `"${c.mastery_percentage}%"`,
                `"${c.status}"`, `"${c.risk_level}"`, `"${c.topics_count}"`, `"${c.students_below_threshold}"`
            ])
            csvContent += `CHAPTER & TOPIC ANALYTICS - ${header.class_name} ${header.division} ${header.subject}\n` +
                headers.join(',') + '\n' + rows.map((r: any) => r.join(',')).join('\n')
        }

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `Academic_Analytics_${activeTab}_${header.class_name}_${header.subject}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast(`Exported ${activeTab.toUpperCase()} report as CSV`)
    }

    // Filtered Student Roster in Class View
    const filteredStudents = useMemo(() => {
        const list = classData?.students || []
        if (!studentSearch.trim()) return list
        const q = studentSearch.toLowerCase()
        return list.filter((s: any) => 
            s.student_name.toLowerCase().includes(q) ||
            s.roll_no.toLowerCase().includes(q) ||
            s.admission_no.toLowerCase().includes(q) ||
            s.status.toLowerCase().includes(q)
        )
    }, [classData, studentSearch])

    // Loading State
    if (loading && !header) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-12 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin text-[#004B93] mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Loading Report...</h3>
                <p className="text-sm text-slate-400 mt-1">Please wait while we load the data.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 print:p-0 print:space-y-4 font-sans text-slate-800">
            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                    toastMessage.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                    {toastMessage.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* ── UNIFIED FILTER CONTROLS ─────────────────────────────────────── */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Filters</h2>
                            <p className="text-xs font-semibold text-slate-500">Use filters to narrow down the report.</p>
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
                            onClick={() => fetchReport(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
                    {/* Academic Year */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Academic Session
                        </label>
                        <select
                            value={filters.academic_year}
                            onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            <option value="all">Active Session 2026-27</option>
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
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
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
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            {dropdowns.divisions.map(d => (
                                <option key={d.id} value={d.name}>Section {d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Subject Focus
                        </label>
                        <select
                            value={filters.subject_name}
                            onChange={e => handleSubjectChange(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            {dropdowns.subjects.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Examination */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Assessment
                        </label>
                        <select
                            value={filters.exam_id}
                            onChange={e => setFilters(f => ({ ...f, exam_id: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            {dropdowns.exams.length === 0 ? (
                                <option value="all">Standard Evaluation</option>
                            ) : (
                                dropdowns.exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── REPORT CONTEXT HERO BANNER ─────────────────────────────────── */}
            {header && (
                <div className="relative overflow-hidden bg-gradient-to-br from-[#003364] via-[#004B93] to-[#002850] rounded-3xl p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                                <BrainCircuit className="w-10 h-10 text-white" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                                        {header.class_name} - {header.division} • {header.subject}
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Combined Report
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-blue-100/80">
                                    <span>Exam: <strong className="text-white">{header.exam_name}</strong></span>
                                    <span>•</span>
                                    <span>Date: <strong className="text-white">{header.exam_date}</strong></span>
                                    <span>•</span>
                                    <span>Max Marks: <strong className="text-white">{header.maximum_marks}</strong></span>
                                    <span>•</span>
                                    <span>Passing: <strong className="text-white">{header.passing_marks} (35%)</strong></span>
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
                                <span>Print / PDF</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#003364] text-xs font-black transition shadow-lg"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>

                    <Compass className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
                </div>
            )}

            {/* ── MERGED VIEW SWITCHER TABS ───────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-100 rounded-3xl border border-slate-200/80 print:hidden shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                    {/* Tab 1: Class Report */}
                    <button
                        onClick={() => {
                            setActiveTab('class')
                            router.push('/dashboard/reports?type=class')
                        }}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black transition-all ${
                            activeTab === 'class'
                                ? 'bg-white text-[#004B93] shadow-md shadow-slate-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>1. Class Performance</span>
                    </button>

                    {/* Tab 2: Subject Report */}
                    <button
                        onClick={() => {
                            setActiveTab('subject')
                            router.push('/dashboard/reports?type=subject')
                        }}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black transition-all ${
                            activeTab === 'subject'
                                ? 'bg-white text-[#004B93] shadow-md shadow-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>2. Subject Performance</span>
                    </button>

                    {/* Tab 3: Chapter & Topic Analytics */}
                    <button
                        onClick={() => {
                            setActiveTab('chapter')
                            router.push('/dashboard/reports?type=chapter')
                        }}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black transition-all ${
                            activeTab === 'chapter'
                                ? 'bg-white text-[#004B93] shadow-md shadow-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ListTree className="w-4 h-4" />
                        <span>3. Chapter & Topic Analytics</span>
                        {chapterTopicData?.critical_learning_gaps_count > 0 && (
                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                                {chapterTopicData.critical_learning_gaps_count}
                            </span>
                        )}
                    </button>
                </div>


            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* ── VIEW 1: CLASS PERFORMANCE ──────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'class' && classData && (
                <div className="space-y-8 animate-in fade-in">
                    {/* Class Summary 6 KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Students Appeared</span>
                            <div className="text-3xl font-black text-slate-900">{classData.summary.students_appeared}</div>
                            <div className="mt-2 text-xs font-semibold text-slate-400">
                                Enrolled: {classData.summary.students_enrolled} • Absent: {classData.summary.absent_count}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Class Average</span>
                            <div className="text-3xl font-black text-slate-900">{classData.summary.average_percentage}%</div>
                            <div className="mt-2 text-xs font-bold text-emerald-600">
                                {classData.summary.average_percentage >= 75 ? 'First Class Dist.' : classData.summary.average_percentage >= 60 ? 'First Class' : 'Pass Class'}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Highest Score</span>
                            <div className="text-3xl font-black text-slate-900">{classData.summary.highest_percentage}%</div>
                            <div className="mt-2 text-xs font-semibold text-slate-400">Best Score</div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Lowest Score</span>
                            <div className="text-3xl font-black text-slate-900">{classData.summary.lowest_percentage}%</div>
                            <div className="mt-2 text-xs font-semibold text-slate-400">Lowest Score</div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Pass Count</span>
                            <div className="text-3xl font-black text-slate-900">{classData.summary.pass_count}</div>
                            <div className="mt-2 text-xs font-semibold text-slate-400">Failed: {classData.summary.fail_count} Students</div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Pass Percentage</span>
                            <div className="text-3xl font-black text-slate-900">{classData.summary.pass_percentage}%</div>
                            <div className="mt-2 text-xs font-bold text-purple-600">Pass Rate</div>
                        </div>
                    </div>

                    {/* Score Distribution & Pass Donut */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Score Distribution</h3>
                                    <p className="text-xs font-semibold text-slate-400 mt-1">Number of students in each score range.</p>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                                    {classData.summary.students_appeared} Evaluations
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classData.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="mergedScoreBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#004B93" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#004B93" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} dy={8} />
                                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} />
                                        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 800 }} />
                                        <Bar dataKey="count" fill="url(#mergedScoreBarGrad)" radius={[8, 8, 0, 0]} barSize={44} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Pass / Fail Ratio</h3>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clearance</span>
                                </div>

                                <div className="relative flex items-center justify-center my-4">
                                    <div className="absolute text-center">
                                        <div className="text-3xl font-black text-slate-900">{classData.summary.pass_percentage}%</div>
                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Pass Rate</div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={classData.pass_fail_distribution} innerRadius={65} outerRadius={90} paddingAngle={6} dataKey="value" stroke="none" cornerRadius={8}>
                                                {classData.pass_fail_distribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 800 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {classData.pass_fail_distribution.map((item: any, idx: number) => (
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

                    {/* Official Student Ranking Table */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Student Academic Ranking</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                    Official ranked cohort based on normalized examination percentages
                                </p>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search student or roll..."
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                    className="h-10 pl-9 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004B93] w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                        <th className="pb-4 pl-4">Rank</th>
                                        <th className="pb-4">Student Name</th>
                                        <th className="pb-4">Roll / Admission</th>
                                        <th className="pb-4">Marks</th>
                                        <th className="pb-4">Percentage</th>
                                        <th className="pb-4">Grade</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-right pr-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                                    {filteredStudents.map((st: any) => {
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
                                                    <div className="w-8 h-8 rounded-xl bg-[#004B93]/10 text-[#004B93] flex items-center justify-center font-bold text-xs group-hover:bg-[#004B93] group-hover:text-white transition">
                                                        {st.avatar}
                                                    </div>
                                                    <span className="group-hover:text-[#004B93] transition">{st.student_name}</span>
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
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-[#004B93] hover:underline"
                                                    >
                                                        <span>Student Report</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* ── VIEW 2: SUBJECT PERFORMANCE ────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'subject' && subjectData && (
                <div className="space-y-8 animate-in fade-in">
                    {/* Subject Summary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Class Aggregate</span>
                            <div className="text-3xl font-black text-slate-900">{subjectData.overall_class_subject_avg}%</div>
                            <div className="mt-2 text-xs font-bold text-emerald-600">Across All Subjects</div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Total Subjects</span>
                            <div className="text-3xl font-black text-slate-900">{subjectData.subjects.length}</div>
                            <div className="mt-2 text-xs font-semibold text-slate-400">Curriculum Breadth</div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Strongest Subject</span>
                            <div className="text-2xl font-black text-emerald-700 truncate">{subjectData.strongest_subject?.subject || '—'}</div>
                            <div className="mt-2 text-xs font-bold text-emerald-600">Avg: {subjectData.strongest_subject?.average_percentage}%</div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Subject Needing Focus</span>
                            <div className="text-2xl font-black text-rose-700 truncate">{subjectData.weakest_subject?.subject || '—'}</div>
                            <div className="mt-2 text-xs font-bold text-rose-600">Avg: {subjectData.weakest_subject?.average_percentage}%</div>
                        </div>
                    </div>

                    {/* Subject Comparative Bar Chart */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Cross-Subject Performance Benchmark</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">Comparative scoring across all academic disciplines</p>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectData.subjects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="subjectBarGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} dy={8} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} tickFormatter={v => `${v}%`} />
                                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 800 }} />
                                    <Bar dataKey="average_percentage" name="Class Average %" fill="url(#subjectBarGrad)" radius={[8, 8, 0, 0]} barSize={44} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Subject Detail Ledger Table */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Subject Mastery Breakdown</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">Detailed evaluation metrics with direct Chapter & Topic drill-down</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                        <th className="pb-4 pl-4">Subject</th>
                                        <th className="pb-4">Evaluated</th>
                                        <th className="pb-4">Average %</th>
                                        <th className="pb-4">Highest %</th>
                                        <th className="pb-4">Lowest %</th>
                                        <th className="pb-4">Pass Rate</th>
                                        <th className="pb-4">Mastery Level</th>
                                        <th className="pb-4 text-right pr-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                                    {subjectData.subjects.map((sub: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                                            <td className="py-4 pl-4 font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#004B93]/10 text-[#004B93] flex items-center justify-center font-bold text-xs">
                                                    {sub.subject.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span>{sub.subject}</span>
                                            </td>
                                            <td className="py-4 text-slate-500">{sub.students_appeared} students</td>
                                            <td className="py-4 font-black text-slate-900">{sub.average_percentage}%</td>
                                            <td className="py-4 text-emerald-600 font-bold">{sub.highest_percentage}%</td>
                                            <td className="py-4 text-amber-600 font-bold">{sub.lowest_percentage}%</td>
                                            <td className="py-4 font-bold text-slate-800">{sub.pass_percentage}%</td>
                                            <td className="py-4">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    sub.mastery_level === 'Mastered' ? 'bg-emerald-50 text-emerald-700' :
                                                    sub.mastery_level === 'Proficient' ? 'bg-blue-50 text-blue-700' :
                                                    sub.mastery_level === 'Developing' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {sub.mastery_level}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <button
                                                    onClick={() => {
                                                        setFilters(f => ({ ...f, subject_name: sub.subject }))
                                                        setActiveTab('chapter')
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004B93]/10 hover:bg-[#004B93] text-[#004B93] hover:text-white text-xs font-bold transition"
                                                >
                                                    <span>Analyze Chapters</span>
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

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* ── VIEW 3: CHAPTER & TOPIC ANALYTICS & WEAK AREAS ─────────────── */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'chapter' && chapterTopicData && (
                <div className="space-y-8 animate-in fade-in">
                    {/* Weak Area Intelligence Alert Banner */}
                    <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Pedagogical Weak Area Intelligence</h3>
                                <p className="text-xs font-medium text-rose-100 mt-0.5">
                                    Identified {chapterTopicData.priority_weak_chapters.length} critical chapters and {chapterTopicData.priority_weak_topics.length} topics requiring immediate class reinforcement.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-xl bg-white/20 text-xs font-black">
                                Subject: {header?.subject}
                            </div>
                        </div>
                    </div>

                    {/* Chapter Performance Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {chapterTopicData.chapters.map((ch: ChapterMetric) => {
                            const isCritical = ch.risk_level === 'Critical'
                            const isHigh = ch.risk_level === 'High'

                            return (
                                <div
                                    key={ch.id}
                                    onClick={() => setSelectedChapterForModal(ch)}
                                    className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer hover:shadow-lg group ${
                                        isCritical ? 'border-rose-200 hover:border-rose-400 bg-rose-50/20' :
                                        isHigh ? 'border-amber-200 hover:border-amber-400' :
                                        'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chapter</span>
                                            <h4 className="text-base font-black text-slate-900 group-hover:text-[#004B93] transition line-clamp-1">
                                                {ch.chapter_name}
                                            </h4>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                            isCritical ? 'bg-rose-100 text-rose-800' :
                                            isHigh ? 'bg-amber-100 text-amber-800' :
                                            ch.status === 'Moderate' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {ch.status}
                                        </span>
                                    </div>

                                    {/* Score Progress Bar */}
                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-500">Mastery Level</span>
                                            <span className="text-slate-900 font-black">{ch.mastery_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(ch.mastery_percentage, 100)}%`,
                                                    backgroundColor: isCritical ? '#EF4444' : isHigh ? '#F59E0B' : '#10B981'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Chapter Metrics footer */}
                                    <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center text-xs">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Topics</span>
                                            <span className="font-black text-slate-800">{ch.topics_count}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">At Risk</span>
                                            <span className={`font-black ${ch.students_below_threshold > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {ch.students_below_threshold} Students
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Mastered</span>
                                            <span className="font-black text-emerald-600">{ch.students_mastered}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between text-xs font-bold text-[#004B93]">
                                        <span>Inspect Topics & Questions</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Academic Interventions & Remedial Action Roster */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Student Academic Intervention Recommendations</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                    Targeted pedagogical interventions generated from chapter performance deficits
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                        <th className="pb-4 pl-4">Student</th>
                                        <th className="pb-4">Weak Chapter</th>
                                        <th className="pb-4">Current Score</th>
                                        <th className="pb-4">Performance Gap</th>
                                        <th className="pb-4">Recommended Pedagogical Action</th>
                                        <th className="pb-4 text-right pr-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                                    {chapterTopicData.chapters.flatMap((c: ChapterMetric) => 
                                        c.students_requiring_intervention.map((intv, idx) => (
                                            <tr key={`${c.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                                                <td className="py-4 pl-4 font-bold text-slate-900 flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-[#004B93]/10 text-[#004B93] flex items-center justify-center font-bold text-xs">
                                                        {intv.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span>{intv.name}</span>
                                                </td>
                                                <td className="py-4 font-bold text-slate-700">{c.chapter_name}</td>
                                                <td className="py-4 font-black text-rose-600">{intv.score}</td>
                                                <td className="py-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-black">
                                                        -{intv.gap} Gap
                                                    </span>
                                                </td>
                                                <td className="py-4 text-xs font-bold text-slate-700 max-w-sm">
                                                    {intv.recommended_action}
                                                </td>
                                                <td className="py-4 text-right pr-4">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/reports?type=students&student_id=${intv.student_id}`)}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-[#004B93] hover:underline"
                                                    >
                                                        <span>View Student</span>
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
                </div>
            )}

            {/* ── CHAPTER TOPIC DETAIL MODAL ──────────────────────────────────── */}
            {selectedChapterForModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-6 bg-[#004B93] text-white">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                                    Chapter Topic Mastery
                                </span>
                                <h3 className="text-xl font-black text-white">{selectedChapterForModal.chapter_name}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedChapterForModal(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Chapter Summary Metrics */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black uppercase text-slate-400">Average %</div>
                                    <div className="text-xl font-black text-slate-900">{selectedChapterForModal.average_percentage}%</div>
                                </div>
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black uppercase text-slate-400">Mastery %</div>
                                    <div className="text-xl font-black text-emerald-600">{selectedChapterForModal.mastery_percentage}%</div>
                                </div>
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black uppercase text-slate-400">Status</div>
                                    <div className="text-base font-black text-[#004B93] mt-1">{selectedChapterForModal.status}</div>
                                </div>
                            </div>

                            {/* Topics List */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Topic Performance & Mastery</h4>
                                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                    {selectedChapterForModal.topics.map((t: TopicMetric) => (
                                        <div key={t.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="font-bold text-slate-900 text-xs">{t.topic_name}</div>
                                                <div className="text-slate-400 text-[11px]">
                                                    {t.question_count} Questions • Below Threshold: <strong className="text-rose-600">{t.students_below_threshold}</strong>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-slate-900 text-sm">{t.average_percentage}%</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                                    t.risk === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                            <button
                                onClick={() => setSelectedChapterForModal(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                            >
                                Close Breakdown
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PRINT FOOTER ────────────────────────────────────────────────── */}
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
                        <span>Principal / Academic Seal</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
