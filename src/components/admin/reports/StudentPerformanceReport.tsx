'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Award, BookOpen, Calendar, CheckCircle2, ChevronDown, ChevronRight,
    Download, Filter, GraduationCap, HelpCircle, Layers, LineChart as ChartIcon,
    Loader2, MessageSquare, Printer, RefreshCcw, Search, Sparkles,
    TrendingDown, TrendingUp, User, X, AlertCircle, ArrowUpRight, ArrowDownRight,
    SlidersHorizontal, Plus, ShieldCheck, Check, School
} from 'lucide-react'
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts'

interface FilterState {
    academic_year: string
    class_name: string
    division: string
    student_id: string
    subject_name: string
    date_range: string
    from_date: string
    to_date: string
}

interface StudentHeader {
    id: string
    name: string
    roll_no: string
    school_class: string
    division: string
    admission_no: string
    academic_year: string
    avatar: string
}

interface SummaryKPIs {
    overall_average: number
    exams_attempted: number
    highest_score: number
    lowest_score: number
    class_rank: number
    cohort_total: number
    trend_pct: string
    trend_status: 'Improving' | 'Stable' | 'Declining' | 'Fluctuating'
}

interface SubjectPerformance {
    subject: string
    average: number
    highest: number
    lowest: number
    exams_attempted: number
    total_exams: number
    class_average: number
    difference: string
    is_above_class: boolean
}

interface ExamRecord {
    id: string
    exam_name: string
    exam_type: string
    subject: string
    awarded_marks: number | string
    max_marks: number
    percentage: string
    raw_percentage: number
    grade: string
    date: string
    raw_date: string
    status: 'Attempted' | 'Absent'
    remarks: string
}

interface TeacherRemark {
    id: string
    teacher_name: string
    subject_name: string
    academic_year: string
    remark: string
    date: string
}

export default function StudentPerformanceReport() {
    // ── FILTER STATE ──────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<FilterState>({
        academic_year: 'all',
        class_name: 'all',
        division: 'all',
        student_id: 'all',
        subject_name: 'all',
        date_range: 'academic_year',
        from_date: '',
        to_date: ''
    })

    // ── DATA STATE ────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dropdowns, setDropdowns] = useState<{
        academic_years: any[]
        classes: any[]
        divisions: any[]
        subjects: any[]
        students: any[]
    }>({
        academic_years: [],
        classes: [],
        divisions: [],
        subjects: [],
        students: []
    })

    const [student, setStudent] = useState<StudentHeader | null>(null)
    const [summary, setSummary] = useState<SummaryKPIs | null>(null)
    const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
    const [examHistory, setExamHistory] = useState<ExamRecord[]>([])
    const [performanceTrend, setPerformanceTrend] = useState<any[]>([])
    const [classComparison, setClassComparison] = useState<any>(null)
    const [teacherRemarks, setTeacherRemarks] = useState<TeacherRemark[]>([])

    // ── UI INTERACTION STATES ────────────────────────────────────────────────
    const [selectedSubjectDrilldown, setSelectedSubjectDrilldown] = useState<string | null>(null)
    const [examSearch, setExamSearch] = useState('')
    const [sortColumn, setSortColumn] = useState<'date' | 'exam_name' | 'subject' | 'percentage'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
    const [newRemarkSubject, setNewRemarkSubject] = useState('General')
    const [newRemarkAuthor, setNewRemarkAuthor] = useState('Faculty Evaluator')
    const [newRemarkText, setNewRemarkText] = useState('')
    const [submittingRemark, setSubmittingRemark] = useState(false)
    const [toastMessage, setToastMessage] = useState<{ text: string; ok: boolean } | null>(null)

    const showToast = (text: string, ok: boolean = true) => {
        setToastMessage({ text, ok })
        setTimeout(() => setToastMessage(null), 3500)
    }

    // ── DATA FETCHING ────────────────────────────────────────────────────────
    const fetchReportData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setRefreshing(true)

        try {
            const params = new URLSearchParams()
            if (filters.academic_year !== 'all') params.set('academic_year', filters.academic_year)
            if (filters.class_name !== 'all') params.set('class_name', filters.class_name)
            if (filters.division !== 'all') params.set('division', filters.division)
            if (filters.student_id !== 'all') params.set('student_id', filters.student_id)
            if (filters.subject_name !== 'all') params.set('subject_name', filters.subject_name)
            if (filters.date_range !== 'academic_year') params.set('date_range', filters.date_range)
            if (filters.from_date) params.set('from_date', filters.from_date)
            if (filters.to_date) params.set('to_date', filters.to_date)

            const res = await fetch(`/api/dashboard/reports/student-performance?${params.toString()}`)
            const json = await res.json()

            if (json.success && json.data) {
                const d = json.data
                setDropdowns(d.filters || {
                    academic_years: [],
                    classes: [],
                    divisions: [],
                    subjects: [],
                    students: []
                })
                setStudent(d.student)
                setSummary(d.summary)
                setSubjectPerformance(d.subject_performance || [])
                setExamHistory(d.exam_history || [])
                setPerformanceTrend(d.performance_trend || [])
                setClassComparison(d.class_comparison || null)
                setTeacherRemarks(d.teacher_remarks || [])

                // Sync current student selection if first time
                if (filters.student_id === 'all' && d.student?.id) {
                    setFilters(prev => ({ ...prev, student_id: d.student.id }))
                }
            } else {
                showToast(json.error || 'Failed to load report data', false)
            }
        } catch (err: any) {
            console.error('Failed to fetch performance report:', err)
            showToast('Network error while loading report', false)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [filters])

    useEffect(() => {
        fetchReportData()
    }, [fetchReportData])

    // Dependent Filter: If Class changes, reset Division & Student
    const handleClassChange = (newClass: string) => {
        setFilters(prev => ({
            ...prev,
            class_name: newClass,
            division: 'all',
            student_id: 'all'
        }))
    }

    const handleDivisionChange = (newDiv: string) => {
        setFilters(prev => ({
            ...prev,
            division: newDiv,
            student_id: 'all'
        }))
    }

    // ── TEACHER REMARK SUBMISSION ───────────────────────────────────────────
    const handleAddRemark = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!student?.id || !newRemarkText.trim()) return

        setSubmittingRemark(true)
        try {
            const res = await fetch('/api/dashboard/reports/student-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: student.id,
                    teacher_name: newRemarkAuthor.trim(),
                    subject_name: newRemarkSubject,
                    academic_year: student.academic_year,
                    remark: newRemarkText.trim()
                })
            })
            const json = await res.json()
            if (json.success && json.data) {
                setTeacherRemarks(prev => [json.data, ...prev])
                setNewRemarkText('')
                setIsRemarkModalOpen(false)
                showToast('Teacher remark recorded successfully', true)
            } else {
                showToast(json.error || 'Could not record remark', false)
            }
        } catch {
            showToast('Server error while adding remark', false)
        } finally {
            setSubmittingRemark(false)
        }
    }

    // ── CSV EXPORT ──────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (!student || examHistory.length === 0) {
            showToast('No exam history available to export', false)
            return
        }

        const headers = ['Exam Name', 'Subject', 'Exam Type', 'Marks Awarded', 'Max Marks', 'Percentage', 'Grade', 'Exam Date', 'Status', 'Remarks']
        const rows = examHistory.map(e => [
            `"${e.exam_name}"`,
            `"${e.subject}"`,
            `"${e.exam_type}"`,
            `"${e.awarded_marks}"`,
            `"${e.max_marks}"`,
            `"${e.percentage}"`,
            `"${e.grade}"`,
            `"${e.date}"`,
            `"${e.status}"`,
            `"${e.remarks.replace(/"/g, '""')}"`
        ])

        const metaRows = [
            ['STUDENT ACADEMIC PERFORMANCE REPORT'],
            [`Student Name: ${student.name}`],
            [`Class: ${student.school_class} - Section ${student.division}`],
            [`Roll No: ${student.roll_no}`],
            [`Admission No: ${student.admission_no}`],
            [`Academic Year: ${student.academic_year}`],
            [`Overall Average: ${summary?.overall_average}%`],
            [`Class Rank: #${summary?.class_rank} of ${summary?.cohort_total}`],
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
        link.setAttribute('download', `Performance_Report_${student.name.replace(/\s+/g, '_')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('Performance CSV report downloaded')
    }

    // ── SORTED & FILTERED EXAMS ─────────────────────────────────────────────
    const filteredExams = useMemo(() => {
        return examHistory.filter(e => {
            if (!examSearch.trim()) return true
            const q = examSearch.toLowerCase()
            return e.exam_name.toLowerCase().includes(q) ||
                e.subject.toLowerCase().includes(q) ||
                e.grade.toLowerCase().includes(q) ||
                e.status.toLowerCase().includes(q)
        }).sort((a, b) => {
            let comp = 0
            if (sortColumn === 'date') comp = new Date(a.raw_date).getTime() - new Date(b.raw_date).getTime()
            else if (sortColumn === 'exam_name') comp = a.exam_name.localeCompare(b.exam_name)
            else if (sortColumn === 'subject') comp = a.subject.localeCompare(b.subject)
            else if (sortColumn === 'percentage') comp = a.raw_percentage - b.raw_percentage
            return sortOrder === 'asc' ? comp : -comp
        })
    }, [examHistory, examSearch, sortColumn, sortOrder])

    // Drilldown details for a selected subject
    const drilldownData = useMemo(() => {
        if (!selectedSubjectDrilldown) return null
        const subExams = examHistory.filter(e => e.subject === selectedSubjectDrilldown)
        const perf = subjectPerformance.find(s => s.subject === selectedSubjectDrilldown)
        return { perf, exams: subExams }
    }, [selectedSubjectDrilldown, examHistory, subjectPerformance])

    // ── LOADING STATE ────────────────────────────────────────────────────────
    if (loading && !student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-12 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin text-[#004B93] mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Loading Student Report...</h3>
                <p className="text-sm text-slate-400 mt-1">Please wait while we fetch the latest data.</p>
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

            {/* ── SECTION 4 & 5: ENTERPRISE FILTER CONTROLS ───────────────────── */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Filters</h2>
                            <p className="text-xs font-semibold text-slate-500">Academic Year → Class → Section → Student → Subject</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setFilters({
                                    academic_year: 'all',
                                    class_name: 'all',
                                    division: 'all',
                                    student_id: 'all',
                                    subject_name: 'all',
                                    date_range: 'academic_year',
                                    from_date: '',
                                    to_date: ''
                                })
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => fetchReportData(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-5">
                    {/* Academic Year */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Academic Year
                        </label>
                        <select
                            value={filters.academic_year}
                            onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            <option value="all">All Sessions</option>
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
                            <option value="all">All Classes</option>
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
                            onChange={e => handleDivisionChange(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            <option value="all">All Sections</option>
                            {dropdowns.divisions.map(d => (
                                <option key={d.id} value={d.name}>Section {d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Student */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Student
                        </label>
                        <select
                            value={filters.student_id}
                            onChange={e => setFilters(f => ({ ...f, student_id: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            {dropdowns.students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.school_class}-{s.division})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Filter */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Subject
                        </label>
                        <select
                            value={filters.subject_name}
                            onChange={e => setFilters(f => ({ ...f, subject_name: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            <option value="all">All Subjects</option>
                            {dropdowns.subjects.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Type */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Date Range
                        </label>
                        <select
                            value={filters.date_range}
                            onChange={e => setFilters(f => ({ ...f, date_range: e.target.value }))}
                            className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                        >
                            <option value="academic_year">Academic Session</option>
                            <option value="term_1">Term 1</option>
                            <option value="term_2">Term 2</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>
                </div>

                {/* Custom Date Pickers if selected */}
                {filters.date_range === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.from_date}
                                onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.to_date}
                                onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── SECTION 6 & 23: STUDENT HEADER (HERO CARD) ─────────────────── */}
            {student ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-[#003364] via-[#004B93] to-[#002850] rounded-3xl p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            {/* Avatar Badge */}
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-white shadow-inner">
                                {student.avatar || 'ST'}
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                                        {student.name}
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Published Results
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-blue-100/80">
                                    <span>{student.school_class} • Section {student.division}</span>
                                    <span>•</span>
                                    <span>Roll No: <strong className="text-white">{student.roll_no}</strong></span>
                                    <span>•</span>
                                    <span>Admission: <strong className="text-white">{student.admission_no}</strong></span>
                                    <span>•</span>
                                    <span>{student.academic_year}</span>
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
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={() => setIsRemarkModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#003364] text-xs font-black transition shadow-lg"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Teacher Remark</span>
                            </button>
                        </div>
                    </div>

                    {/* Subtle decorative background watermarks */}
                    <GraduationCap className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
                </div>
            ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-500">No student profile found for the selected filter.</p>
                </div>
            )}

            {/* ── SECTION 7 & 8: EXECUTIVE SUMMARY KPI CARDS ─────────────────── */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Overall Average */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Overall Average</span>
                            <div className="w-8 h-8 rounded-xl bg-[#004B93]/10 text-[#004B93] flex items-center justify-center">
                                <Award className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.overall_average}%
                        </div>
                        <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                            {summary.overall_average >= 75 ? 'Distinction Grade' : summary.overall_average >= 60 ? 'First Class' : 'Pass Grade'}
                        </div>
                    </div>

                    {/* Exams Attempted */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Exams Attempted</span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <BookOpen className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.exams_attempted}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Tests Taken
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
                            {summary.highest_score}%
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Best Score
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
                            {summary.lowest_score}%
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Lowest Score
                        </div>
                    </div>

                    {/* Class Rank */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Class Rank</span>
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            #{summary.class_rank}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                            Out of {summary.cohort_total} Students
                        </div>
                    </div>

                    {/* Performance Trend */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Performance Trend</span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                summary.trend_status === 'Improving' ? 'bg-emerald-50 text-emerald-600' :
                                summary.trend_status === 'Declining' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {summary.trend_status === 'Improving' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {summary.trend_pct}
                        </div>
                        <div className={`mt-2 text-xs font-bold ${
                            summary.trend_status === 'Improving' ? 'text-emerald-600' :
                            summary.trend_status === 'Declining' ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                            {summary.trend_status}
                        </div>
                    </div>
                </div>
            )}

            {/* ── SECTION 10 & 11: SUBJECT-WISE PERFORMANCE TABLE ─────────────── */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance by Subject</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            How this student compares to the class average in each subject.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {subjectPerformance.length} Subjects
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="pb-4 pl-4">Subject</th>
                                <th className="pb-4">Student Avg</th>
                                <th className="pb-4">Progress Meter</th>
                                <th className="pb-4">Class Avg</th>
                                <th className="pb-4">Variance</th>
                                <th className="pb-4">Highest</th>
                                <th className="pb-4">Lowest</th>
                                <th className="pb-4">Tests</th>
                                <th className="pb-4 text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                            {subjectPerformance.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                                        No subject performance records available.
                                    </td>
                                </tr>
                            ) : (
                                subjectPerformance.map((sub, idx) => (
                                    <tr 
                                        key={idx}
                                        onClick={() => setSelectedSubjectDrilldown(sub.subject)}
                                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                                    >
                                        <td className="py-4 pl-4 font-bold text-slate-900 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-[#004B93]/5 text-[#004B93] flex items-center justify-center font-bold text-xs group-hover:bg-[#004B93] group-hover:text-white transition">
                                                {sub.subject.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span>{sub.subject}</span>
                                        </td>
                                        <td className="py-4 font-black text-slate-900">
                                            {sub.average}%
                                        </td>
                                        <td className="py-4 w-44">
                                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${Math.min(sub.average, 100)}%`,
                                                        backgroundColor: sub.average >= 75 ? '#10B981' : sub.average >= 55 ? '#004B93' : '#F59E0B'
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 text-slate-600 font-bold">
                                            {sub.class_average}%
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                sub.is_above_class 
                                                    ? 'bg-emerald-50 text-emerald-700' 
                                                    : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {sub.difference}
                                            </span>
                                        </td>
                                        <td className="py-4 text-emerald-600 font-bold">{sub.highest}%</td>
                                        <td className="py-4 text-amber-600 font-bold">{sub.lowest}%</td>
                                        <td className="py-4 text-slate-500">{sub.exams_attempted} tests</td>
                                        <td className="py-4 text-right pr-4">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedSubjectDrilldown(sub.subject)
                                                }}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-[#004B93] hover:underline"
                                            >
                                                <span>View Details</span>
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

            {/* ── SECTION 13 & 14: PERFORMANCE OVER TIME (CHART) & CLASS COMPARISON ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Trend Chart (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance Over Time</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                    Score history compared to the class average.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#004B93]" />
                                    <span>Student Score</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-slate-400" />
                                    <span className="text-slate-500">Class Average</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Area Chart */}
                        <div className="h-72 w-full">
                            {performanceTrend.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                                    No completed evaluations available to render trend trajectory.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#004B93" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#004B93" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                                            dy={8}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                                            tickFormatter={(val) => `${val}%`}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload
                                                    return (
                                                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs font-semibold space-y-1">
                                                            <div className="font-black text-sm text-blue-200">{d.exam}</div>
                                                            <div className="text-slate-300">Subject: {d.subject}</div>
                                                            <div className="text-emerald-400 font-bold">Score: {d.student_pct}%</div>
                                                            <div className="text-slate-400">Class Avg: {d.class_avg}%</div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="student_pct"
                                            stroke="#004B93"
                                            strokeWidth={3}
                                            fill="url(#studentScoreGrad)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="class_avg"
                                            stroke="#94A3B8"
                                            strokeDasharray="4 4"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Class Comparison Direct Card (1 col) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Class Comparison</h3>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Average</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mb-6">
                            Side-by-side comparison with peers in {student?.school_class || 'Class 10'}.
                        </p>

                        {classComparison && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black text-slate-500 uppercase">Overall Aggregate</span>
                                        <div className="text-lg font-black text-slate-900">
                                            Student: {classComparison.overall.student}%
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-slate-400">Class Avg: {classComparison.overall.class_average}%</span>
                                        <div className={`text-xs font-black mt-1 ${
                                            classComparison.overall.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {classComparison.overall.diff >= 0 ? `+${classComparison.overall.diff}% Above` : `${classComparison.overall.diff}% Below`}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                    {classComparison.subjects.map((s: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs font-semibold">
                                            <span className="text-slate-700 font-bold">{s.subject}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-900 font-bold">{s.student_score}%</span>
                                                <span className="text-slate-400">/ {s.class_average}%</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                                    s.diff.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {s.diff}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <span className="text-xs font-semibold text-slate-400">
                            Shows how this student ranks among classmates.
                        </span>
                    </div>
                </div>
            </div>

            {/* ── SECTION 12, 16 & 17: DETAILED EXAM HISTORY LEDGER ───────────── */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Exam History</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            Complete record of all exams taken by this student.
                        </p>
                    </div>

                    {/* Search and Sort controls */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search exams or subjects..."
                                value={examSearch}
                                onChange={e => setExamSearch(e.target.value)}
                                className="h-10 pl-9 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004B93] w-56"
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
                                        setSortColumn('exam_name')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Exam Name
                                </th>
                                <th 
                                    className="pb-4 cursor-pointer hover:text-slate-700 transition"
                                    onClick={() => {
                                        setSortColumn('subject')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Subject
                                </th>
                                <th className="pb-4">Marks Obtained</th>
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
                                        setSortColumn('date')
                                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                    }}
                                >
                                    Exam Date
                                </th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4 pr-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                            {filteredExams.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                                        No exams matching filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-4 pl-4 font-bold text-slate-900">
                                            <div className="flex flex-col">
                                                <span>{exam.exam_name}</span>
                                                <span className="text-[11px] font-semibold text-slate-400">{exam.exam_type}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-slate-700 font-bold">{exam.subject}</td>
                                        <td className="py-4 font-bold text-slate-800">
                                            {exam.status === 'Absent' ? '—' : `${exam.awarded_marks} / ${exam.max_marks}`}
                                        </td>
                                        <td className="py-4 font-black text-slate-900">
                                            {exam.percentage}
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                exam.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                                exam.grade.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                                                exam.grade === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {exam.grade}
                                            </span>
                                        </td>
                                        <td className="py-4 text-slate-500 text-xs font-bold">{exam.date}</td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                exam.status === 'Attempted' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {exam.status === 'Attempted' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                <span>{exam.status}</span>
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-xs text-slate-500 max-w-xs truncate font-medium">
                                            {exam.remarks}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── SECTION 24: TEACHER REMARKS & QUALITATIVE EVALUATIONS ───────── */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Teacher Remarks</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            Notes and feedback added by teachers.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsRemarkModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004B93] hover:bg-[#003870] text-white text-xs font-bold transition shadow-sm print:hidden"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Remark</span>
                    </button>
                </div>

                {teacherRemarks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">No teacher remarks recorded for this student yet.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Click &quot;Add New Remark&quot; to log mentor guidance or academic observations.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teacherRemarks.map((remark) => (
                            <div key={remark.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-[#004B93]/10 text-[#004B93] font-black flex items-center justify-center text-xs">
                                            {remark.teacher_name[0] || 'T'}
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-900">{remark.teacher_name}</span>
                                            <span className="text-slate-400 block text-[10px]">{remark.academic_year}</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                                        {remark.subject_name}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed italic bg-white p-3.5 rounded-xl border border-slate-100">
                                    &ldquo;{remark.remark}&rdquo;
                                </p>
                                <div className="text-right text-[10px] font-semibold text-slate-400">
                                    Logged on {remark.date}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── SUBJECT DRILL-DOWN MODAL (SECTION 11) ───────────────────────── */}
            {drilldownData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">Subject Detail</span>
                                <h3 className="text-xl font-black text-white">{selectedSubjectDrilldown}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedSubjectDrilldown(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Drilldown Summary KPI */}
                            {drilldownData.perf && (
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400">Average</div>
                                        <div className="text-lg font-black text-slate-900">{drilldownData.perf.average}%</div>
                                    </div>
                                    <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <div className="text-[10px] font-black uppercase text-emerald-600">Highest</div>
                                        <div className="text-lg font-black text-emerald-800">{drilldownData.perf.highest}%</div>
                                    </div>
                                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                                        <div className="text-[10px] font-black uppercase text-amber-600">Lowest</div>
                                        <div className="text-lg font-black text-amber-800">{drilldownData.perf.lowest}%</div>
                                    </div>
                                    <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="text-[10px] font-black uppercase text-blue-600">Attempted</div>
                                        <div className="text-lg font-black text-blue-800">{drilldownData.perf.exams_attempted}</div>
                                    </div>
                                </div>
                            )}

                            {/* Exam breakdown list */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Exam Breakdown</h4>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {drilldownData.exams.map(e => (
                                        <div key={e.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs font-semibold">
                                            <div>
                                                <div className="font-bold text-slate-900">{e.exam_name}</div>
                                                <div className="text-slate-400 text-[11px]">{e.date} • {e.exam_type}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-600">{e.status === 'Absent' ? 'Absent' : `${e.awarded_marks}/${e.max_marks}`}</span>
                                                <span className="font-black text-slate-900 text-sm">{e.percentage}</span>
                                                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">{e.grade}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                            <button
                                onClick={() => setSelectedSubjectDrilldown(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TEACHER REMARK MODAL ────────────────────────────────────────── */}
            {isRemarkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-6 bg-[#004B93] text-white">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Teacher Feedback</span>
                                <h3 className="text-xl font-black text-white">Add Teacher Remark</h3>
                            </div>
                            <button
                                onClick={() => setIsRemarkModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddRemark} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                                    Teacher / Evaluator Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newRemarkAuthor}
                                    onChange={e => setNewRemarkAuthor(e.target.value)}
                                    placeholder="e.g. Divyesh Solanki (Academic Head)"
                                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                                    Subject
                                </label>
                                <select
                                    value={newRemarkSubject}
                                    onChange={e => setNewRemarkSubject(e.target.value)}
                                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="General">General / Overall Feedback</option>
                                    {dropdowns.subjects.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                                    Remark / Feedback
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newRemarkText}
                                    onChange={e => setNewRemarkText(e.target.value)}
                                    placeholder="Enter feedback, observations, strengths, or areas to improve..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRemarkModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRemark}
                                    className="px-5 py-2.5 rounded-xl bg-[#004B93] hover:bg-[#003870] text-white text-xs font-black transition shadow-sm"
                                >
                                    {submittingRemark ? 'Saving...' : 'Save Remark'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── PRINT-ONLY FOOTER WITH INSTITUTIONAL SIGNATURE LINES ────────── */}
            <div className="hidden print:block pt-12 mt-12 border-t border-slate-300">
                <div className="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-700">
                    <div className="space-y-12">
                        <div className="h-0.5 bg-slate-400 w-3/4 mx-auto" />
                        <span>Class Teacher Signature</span>
                    </div>
                    <div className="space-y-12">
                        <div className="h-0.5 bg-slate-400 w-3/4 mx-auto" />
                        <span>Academic Coordinator</span>
                    </div>
                    <div className="space-y-12">
                        <div className="h-0.5 bg-slate-400 w-3/4 mx-auto" />
                        <span>Principal / Seal of Institution</span>
                    </div>
                </div>
                <div className="mt-8 text-center text-[10px] text-slate-400">
                    Official Student Performance Report generated on {new Date().toLocaleString()} from BeBrilliant Academic ERP.
                </div>
            </div>
        </div>
    )
}
