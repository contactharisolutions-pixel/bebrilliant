'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Award, BookOpen, ChevronRight, Search, Layout, Filter,
    Calendar, Target, ArrowUpRight, Loader2, Info, Zap,
    Activity, ArrowRight, UserCircle, BookMarked, LineChart,
    RefreshCcw, Download, CheckCircle2, AlertCircle, X,
    FileSpreadsheet, Sparkles, TrendingUp, Trophy, GraduationCap,
    School, HelpCircle, Eye, Printer, ShieldCheck, AlertTriangle,
    Flame, CheckCircle, BarChart2, Layers, Compass, UserCheck
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
    at_risk_count?: number
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

interface WeakerSubject {
    subject_name: string
    average_score: number
    passing_rate: number
    at_risk_count: number
    severity: 'Critical' | 'Moderate'
    recommended_action: string
}

interface WeakerChapter {
    chapter_id: string
    chapter_name: string
    subject_name: string
    class_name: string
    average_accuracy: number
    risk_severity: 'Critical' | 'Moderate' | 'Proficient'
    remedial_priority: 'High' | 'Medium' | 'Low'
    at_risk_students: number
}

interface WeakerTopic {
    topic_id: string
    topic_name: string
    chapter_name: string
    subject_name: string
    accuracy_rate: number
    risk_level: 'Critical' | 'Moderate' | 'Proficient'
    remedial_action: string
}

interface WeakerAnalytics {
    weaker_subjects: WeakerSubject[]
    weaker_chapters: WeakerChapter[]
    weaker_topics: WeakerTopic[]
}

interface Student360Profile {
    student_id: string
    student_name: string
    roll_number: string
    class_name: string
    rank: number
    total_exams: number
    overall_average: number
    overall_grade: string
    attendance_rate: number | null
    subject_mastery: {
        subject_name: string
        score: number
        grade: string
        status: 'Mastered' | 'On Track' | 'Needs Support'
    }[]
    exam_history: {
        exam_title: string
        subject_name: string
        date: string
        awarded_marks: number
        max_marks: number
        percentage: number
        grade_badge: string
        remarks?: string
    }[]
    strengths: string[]
    weaker_areas: string[]
    teacher_recommendation: string
}

interface TeacherScope {
    is_scoped: boolean
    assigned_classes: string[]
    assigned_divisions: string[]
    assigned_subjects?: string[]
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
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects' | 'weaker_areas' | 'exams'>('overview')

    // Filter states
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [selectedSubject, setSelectedSubject] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [weakerFilterSeverity, setWeakerFilterSeverity] = useState<'all' | 'critical' | 'moderate'>('all')
    const [ledgerView, setLedgerView] = useState<'students' | 'submissions'>('students')

    // Data states
    const [teacherScope, setTeacherScope] = useState<TeacherScope | null>(null)
    const [overview, setOverview] = useState<OverviewMetrics | null>(null)
    const [students, setStudents] = useState<StudentRecord[]>([])
    const [subjects, setSubjects] = useState<SubjectPerformance[]>([])
    const [exams, setExams] = useState<ExamPerformance[]>([])
    const [weakerAnalytics, setWeakerAnalytics] = useState<WeakerAnalytics>({
        weaker_subjects: [],
        weaker_chapters: [],
        weaker_topics: []
    })
    const [student360Map, setStudent360Map] = useState<Record<string, Student360Profile>>({})
    const [filterOptions, setFilterOptions] = useState<{ classes: any[]; subjects: any[]; exams: any[] }>({
        classes: [],
        subjects: [],
        exams: []
    })

    // Modal state for Student 360 Comprehensive Profile
    const [selectedStudentFor360, setSelectedStudentFor360] = useState<Student360Profile | null>(null)
    // Modal state for individual single-exam report card
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
                setTeacherScope(json.data.teacherScope || null)
                setOverview(json.data.overview)
                setStudents(json.data.students || [])
                setSubjects(json.data.subjects || [])
                setExams(json.data.exams || [])
                if (json.data.weaker_analytics) {
                    setWeakerAnalytics(json.data.weaker_analytics)
                }
                if (json.data.student_360_map) {
                    setStudent360Map(json.data.student_360_map)
                }
                if (json.data.filters) {
                    setFilterOptions(json.data.filters)
                }

                // Check URL for student_id parameter to open 360 modal automatically
                if (typeof window !== 'undefined') {
                    const urlParams = new URLSearchParams(window.location.search)
                    const targetStudentId = urlParams.get('student_id')
                    if (targetStudentId && json.data.student_360_map?.[targetStudentId]) {
                        setSelectedStudentFor360(json.data.student_360_map[targetStudentId])
                    }
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

    // Unique students ranked by overall average — one entry per student
    const uniqueStudentRanks = useMemo(() => {
        const entries = Object.values(student360Map) as Student360Profile[]
        // Sort by overall_average descending, then student name
        const sorted = [...entries].sort((a, b) => {
            if (b.overall_average !== a.overall_average) return b.overall_average - a.overall_average
            return a.student_name.localeCompare(b.student_name)
        })
        // Assign a clean sequential rank
        return sorted.map((st, idx) => ({ ...st, rank: idx + 1 }))
    }, [student360Map])

    // Top 3 ranked students for podium (from unique student list)
    const topAchievers = useMemo(() => {
        return uniqueStudentRanks.slice(0, 3)
    }, [uniqueStudentRanks])

    // Filtered weaker topics
    const filteredTopics = useMemo(() => {
        if (!weakerAnalytics.weaker_topics) return []
        if (weakerFilterSeverity === 'all') return weakerAnalytics.weaker_topics
        return weakerAnalytics.weaker_topics.filter(t => t.risk_level.toLowerCase() === weakerFilterSeverity)
    }, [weakerAnalytics.weaker_topics, weakerFilterSeverity])

    // Export student records to CSV (supports both unique students and paper submissions)
    const exportToCSV = () => {
        if (ledgerView === 'students') {
            if (!uniqueStudentRanks.length) return
            const headers = ['Rank', 'Student Name', 'Roll Number', 'Class', 'Overall Average', 'Overall Grade', 'Total Exams Evaluated']
            const csvRows = uniqueStudentRanks.map(s => [
                s.rank,
                `"${s.student_name.replace(/"/g, '""')}"`,
                `"${s.roll_number}"`,
                `"${s.class_name.replace(/"/g, '""')}"`,
                `${s.overall_average}%`,
                s.overall_grade,
                s.total_exams
            ])
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement('a')
            link.setAttribute('href', encodedUri)
            link.setAttribute('download', `Student_Rank_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
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
            link.setAttribute('download', `Student_Paper_Submissions_${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const open360ModalForStudent = (studentId: string, fallbackRecord?: StudentRecord) => {
        if (student360Map[studentId]) {
            setSelectedStudentFor360(student360Map[studentId])
        } else if (fallbackRecord) {
            // Build fallback 360 profile from available record data only — no fabricated text
            setSelectedStudentFor360({
                student_id: fallbackRecord.student_id,
                student_name: fallbackRecord.student_name,
                roll_number: fallbackRecord.roll_number,
                class_name: fallbackRecord.class_name,
                rank: fallbackRecord.rank,
                total_exams: 1,
                overall_average: Number(fallbackRecord.percentage),
                overall_grade: fallbackRecord.grade_badge,
                attendance_rate: null,
                subject_mastery: [
                    {
                        subject_name: fallbackRecord.subject_name,
                        score: Number(fallbackRecord.percentage),
                        grade: fallbackRecord.grade_badge,
                        status: Number(fallbackRecord.percentage) >= 75 ? 'Mastered' : Number(fallbackRecord.percentage) >= 55 ? 'On Track' : 'Needs Support'
                    }
                ],
                exam_history: [
                    {
                        exam_title: fallbackRecord.exam_title,
                        subject_name: fallbackRecord.subject_name,
                        date: '',
                        awarded_marks: Number(fallbackRecord.awarded_marks),
                        max_marks: Number(fallbackRecord.max_marks),
                        percentage: Number(fallbackRecord.percentage),
                        grade_badge: fallbackRecord.grade_badge,
                        remarks: fallbackRecord.teacher_remarks
                    }
                ],
                // Derive strengths/weaknesses from subject score only — no generic text
                strengths: Number(fallbackRecord.percentage) >= 75
                    ? [`${fallbackRecord.subject_name}: ${fallbackRecord.percentage}% (Grade ${fallbackRecord.grade_badge})`]
                    : [],
                weaker_areas: Number(fallbackRecord.percentage) < 60
                    ? [`${fallbackRecord.subject_name}: ${fallbackRecord.percentage}% — targeted revision required`]
                    : [],
                teacher_recommendation: fallbackRecord.teacher_remarks || ''
            })
        }
    }

    if (loading && !overview) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Loading Academic Performance Analytics</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Reading verified exam records and curriculum evaluations...</p>
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
                        Academic Performance & Examination Intelligence Suite
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
                        Student Performance & Result Analytics
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                        Track class-wide passing rates, diagnose weaker subjects and syllabus chapters, evaluate 360° student mastery, and monitor academic progress across school terms.
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
                            onClick={() => setActiveTab('weaker_areas')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                        >
                            <Flame className="w-4 h-4 text-rose-200" />
                            Weaker Areas Diagnostic
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

            {/* ── TEACHER SCOPE BANNER (IF ACTIVE) ────────────────────── */}
            {teacherScope?.is_scoped && (
                teacherScope.assigned_classes.length > 0 || (teacherScope.assigned_subjects && teacherScope.assigned_subjects.length > 0) ? (
                    <div className="mb-6 bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                                    <span>Teacher Analytics Scope Active</span>
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    {teacherScope.assigned_classes.length > 0 && (
                                        <span>
                                            Assigned Classes:{' '}
                                            <span className="text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-lg">
                                                {teacherScope.assigned_classes.join(', ')}
                                            </span>
                                        </span>
                                    )}
                                    {teacherScope.assigned_divisions.length > 0 && (
                                        <span className="text-slate-600 font-medium">
                                            (Sections: {teacherScope.assigned_divisions.join(', ')})
                                        </span>
                                    )}
                                    {teacherScope.assigned_subjects && teacherScope.assigned_subjects.length > 0 && (
                                        <span>
                                            • Assigned Subjects:{' '}
                                            <span className="text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                                                {teacherScope.assigned_subjects.join(', ')}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-[11px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-3 py-1.5 rounded-xl self-start sm:self-center shadow-xs">
                            Teacher Access Mode
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-bold text-amber-900">No Classes or Subjects Assigned to Your Teacher Account</div>
                            <div className="text-xs text-amber-700 font-medium mt-1">
                                Your teacher profile does not currently have any classes or subjects assigned. Please contact your school administrator to configure your assigned classes and subjects in the Staff Directory.
                            </div>
                        </div>
                    </div>
                )
            )}

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

                {/* 3. Students Assessed */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Students Evaluated</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <UserCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {overview?.total_students_assessed || 0}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            {overview?.total_submissions || 0} total examination papers graded
                        </div>
                    </div>
                </div>

                {/* 4. Weaker Topics At Risk */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Syllabus Topics At Risk</span>
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-rose-700 tracking-tight">
                            {weakerAnalytics.weaker_topics.filter(t => t.risk_level === 'Critical').length}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Micro-topics requiring immediate remedial review
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FILTER CONTROLS ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Class filter */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
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

                        {/* Subject filter */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
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

            {/* ── TAB NAVIGATION (5 COMPREHENSIVE TABS) ─────────────────── */}
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
                    Student Rank Ledger & 360° ({uniqueStudentRanks.length})
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
                    onClick={() => setActiveTab('weaker_areas')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'weaker_areas'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                >
                    <Flame className="w-4 h-4 text-rose-500" />
                    Weaker Areas Diagnostic Engine
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
                                                : 'Requires Targeted Intervention'}
                                    </div>
                                    <p className="text-xs text-slate-500 max-w-sm">
                                        {overview?.passing_rate || 0}% of evaluated students meet or surpass the standard passing criteria for their enrolled grades.
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
                                Highest scoring candidates across verified evaluations:
                            </p>

                            {topAchievers.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400">
                                    No completed evaluations found yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topAchievers.map((student, idx) => (
                                        <div
                                            key={student.student_id}
                                            onClick={() => setSelectedStudentFor360(student)}
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
                                                        Roll: {student.roll_number} • {student.class_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-emerald-600">
                                                    {student.overall_average}%
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Grade {student.overall_grade}
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

            {/* ── TAB 2: STUDENT MARKS LEDGER & 360° DIRECTORY ─────────── */}
            {activeTab === 'students' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fadeIn">
                    <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Student Academic Rank Ledger</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Showing teacher assigned scope: <strong className="text-slate-800">{uniqueStudentRanks.length} unique students</strong> ({students.length} evaluated subject papers). Click <strong className="text-blue-600">"360° Profile"</strong> for academic dossier.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                                <button
                                    onClick={() => setLedgerView('students')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        ledgerView === 'students'
                                            ? 'bg-white text-blue-700 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Unique Students ({uniqueStudentRanks.length})
                                </button>
                                <button
                                    onClick={() => setLedgerView('submissions')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        ledgerView === 'submissions'
                                            ? 'bg-white text-blue-700 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Exam Papers ({students.length})
                                </button>
                            </div>
                            <button
                                onClick={exportToCSV}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5 text-blue-600" /> Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {ledgerView === 'students' ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3.5 px-5">Rank</th>
                                        <th className="py-3.5 px-5">Student Information</th>
                                        <th className="py-3.5 px-5">Class</th>
                                        <th className="py-3.5 px-5">Assigned Subjects Evaluated</th>
                                        <th className="py-3.5 px-5">Overall Avg</th>
                                        <th className="py-3.5 px-5">Grade</th>
                                        <th className="py-3.5 px-5">Exams</th>
                                        <th className="py-3.5 px-5 text-right">360° Analytics</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {uniqueStudentRanks.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                                                No student records found matching the current filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        uniqueStudentRanks.map((st) => (
                                            <tr
                                                key={st.student_id}
                                                onClick={() => setSelectedStudentFor360(st)}
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
                                                <td className="py-4 px-5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {st.subject_mastery.map((sub, si) => (
                                                            <span
                                                                key={si}
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                    sub.score >= 75
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : sub.score >= 40
                                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                }`}
                                                                title={`${sub.subject_name}: ${sub.score}%`}
                                                            >
                                                                {sub.subject_name} {sub.score}%
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="font-black text-slate-900">{st.overall_average}%</div>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                st.overall_average >= 75
                                                                    ? 'bg-emerald-500'
                                                                    : st.overall_average >= 40
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-rose-500'
                                                            }`}
                                                            style={{ width: `${Math.min(st.overall_average, 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                                                        st.overall_grade === 'A+' || st.overall_grade === 'A'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : st.overall_grade === 'B' || st.overall_grade === 'C'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        Grade {st.overall_grade}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 text-xs font-bold text-slate-600">
                                                    {st.total_exams} paper{st.total_exams !== 1 ? 's' : ''}
                                                </td>
                                                <td className="py-4 px-5 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedStudentFor360(st)
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 360° Profile
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3.5 px-5">Rank</th>
                                        <th className="py-3.5 px-5">Student Information</th>
                                        <th className="py-3.5 px-5">Class</th>
                                        <th className="py-3.5 px-5">Subject Evaluated</th>
                                        <th className="py-3.5 px-5">Marks Awarded</th>
                                        <th className="py-3.5 px-5">Score %</th>
                                        <th className="py-3.5 px-5">Grade</th>
                                        <th className="py-3.5 px-5 text-right">360° Analytics</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                                                No submission records found matching the current filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((st) => (
                                            <tr
                                                key={st.id}
                                                onClick={() => open360ModalForStudent(st.student_id, st)}
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
                                                            open360ModalForStudent(st.student_id, st)
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 360° Profile
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
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
                                <span>Curriculum Target:</span>
                                <strong className="text-slate-800">
                                    {sub.average_score >= 70 ? 'Meets School Targets' : 'Recommended for Targeted Coaching'}
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB 4: WEAKER AREAS DIAGNOSTIC ENGINE (BRAND NEW) ──────── */}
            {activeTab === 'weaker_areas' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Header Strip */}
                    <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-rose-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                                <Flame className="w-3.5 h-3.5 text-rose-400" /> Syllabus Vulnerability & Remedial Engine
                            </div>
                            <h2 className="text-xl font-black text-white">Weaker Subjects, Chapters & Micro-Topics Diagnostic</h2>
                            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                                Real-time diagnostic heatmaps isolating curriculum bottlenecks where students struggle with accuracy below 60%.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300">Severity Filter:</span>
                            <div className="flex bg-slate-800/90 rounded-xl p-1 border border-slate-700">
                                <button
                                    onClick={() => setWeakerFilterSeverity('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        weakerFilterSeverity === 'all' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setWeakerFilterSeverity('critical')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        weakerFilterSeverity === 'critical' ? 'bg-rose-600 text-white shadow' : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Critical (&lt;45%)
                                </button>
                                <button
                                    onClick={() => setWeakerFilterSeverity('moderate')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        weakerFilterSeverity === 'moderate' ? 'bg-amber-600 text-white shadow' : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Moderate (45-65%)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Weaker Subjects Alert Cards */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-rose-600" />
                                <h3 className="text-base font-bold text-slate-900">Vulnerable Subjects Requiring Academic Attention</h3>
                            </div>
                            <span className="text-xs text-slate-500 font-semibold">Ordered by lowest cohort average</span>
                        </div>

                        {weakerAnalytics.weaker_subjects.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                                All evaluated subjects currently exceed standard benchmarks (&gt;75% mastery).
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {weakerAnalytics.weaker_subjects.map((sub, i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-slate-900">{sub.subject_name}</span>
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                                    sub.severity === 'Critical'
                                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                }`}>
                                                    {sub.severity} Risk
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cohort Average</div>
                                                    <div className="text-xl font-black text-rose-600 mt-0.5">{sub.average_score}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">At Risk (&lt;50%)</div>
                                                    <div className="text-xl font-black text-slate-800 mt-0.5">{sub.at_risk_count} Students</div>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900">
                                                <strong className="block mb-1 text-[11px] uppercase tracking-wider text-rose-800">Faculty Remedial Action:</strong>
                                                <p className="leading-relaxed text-[11px] text-rose-800">{sub.recommended_action}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Weaker Chapters Heatmap Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Curriculum Chapter Vulnerability Heatmap</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Chapters ranked by lowest student accuracy rate across assessed classes
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{weakerAnalytics.weaker_chapters.length} Chapters Assessed</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-5">Chapter Name</th>
                                        <th className="py-3 px-5">Subject</th>
                                        <th className="py-3 px-5">Class Grade</th>
                                        <th className="py-3 px-5">Comprehension Accuracy</th>
                                        <th className="py-3 px-5">Students At Risk</th>
                                        <th className="py-3 px-5 text-right">Remedial Priority</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {weakerAnalytics.weaker_chapters.slice(0, 12).map((ch, i) => (
                                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                                                {ch.chapter_name}
                                            </td>
                                            <td className="py-3.5 px-5 text-xs font-semibold text-slate-600">
                                                {ch.subject_name}
                                            </td>
                                            <td className="py-3.5 px-5 text-xs font-semibold text-slate-600">
                                                {ch.class_name}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                ch.average_accuracy < 50
                                                                    ? 'bg-rose-500'
                                                                    : ch.average_accuracy < 70
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${ch.average_accuracy}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-black text-slate-900 text-xs">{ch.average_accuracy}%</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-xs font-bold text-slate-700">
                                                {ch.at_risk_students > 0 ? (
                                                    <span className="text-rose-600 font-extrabold">{ch.at_risk_students} Students</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-semibold">0 (On Target)</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    ch.remedial_priority === 'High'
                                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                        : ch.remedial_priority === 'Medium'
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}>
                                                    {ch.remedial_priority} Priority
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 3: Micro-Topics Vulnerability Cards */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Specific Micro-Topics Vulnerabilities</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Granular syllabus concepts where student diagnostic error rates are elevated
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-500">Showing {filteredTopics.length} topics</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTopics.map((tp, idx) => (
                                <div
                                    key={idx}
                                    className={`p-5 rounded-2xl border bg-white shadow-xs transition-all hover:border-slate-300 ${
                                        tp.risk_level === 'Critical' ? 'border-rose-200' : 'border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                                tp.risk_level === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                                            }`} />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {tp.subject_name} • {tp.chapter_name}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                            tp.risk_level === 'Critical'
                                                ? 'bg-rose-100 text-rose-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {tp.accuracy_rate}% Accuracy
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-900 mb-3 leading-snug">
                                        {tp.topic_name}
                                    </h4>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                        <strong className="text-slate-700 font-bold block mb-1">Recommended Remedial Action:</strong>
                                        <p className="text-slate-600 font-normal leading-relaxed">{tp.remedial_action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 5: EXAM PROGRESS & TERMS ─────────────────────────── */}
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
                                <p className="text-xs text-slate-500 font-medium mb-4">Subject: {ex.subject_name || '—'}</p>

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

            {/* ── MODAL: COMPREHENSIVE STUDENT 360° PROFILE ─────────────── */}
            {selectedStudentFor360 && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl animate-scaleUp my-8 max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-0">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-5 border-b border-slate-100 print:border-none">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                                    {selectedStudentFor360.student_name[0]}
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider mb-1">
                                        <Sparkles className="w-3 h-3 text-blue-600" /> Student 360° Academic Intelligence
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900">{selectedStudentFor360.student_name}</h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Roll No: <strong className="text-slate-700">{selectedStudentFor360.roll_number}</strong> • Class: <strong className="text-slate-700">{selectedStudentFor360.class_name}</strong>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                                    title="Print Academic Dossier"
                                >
                                    <Printer className="w-4 h-4 text-slate-600" /> Print Dossier
                                </button>
                                <button
                                    onClick={() => setSelectedStudentFor360(null)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Top KPI Metrics Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Overall Average</div>
                                <div className="text-2xl font-black text-blue-900 mt-0.5">{selectedStudentFor360.overall_average}%</div>
                                <div className="text-[10px] font-bold text-blue-700 mt-0.5">Grade {selectedStudentFor360.overall_grade}</div>
                            </div>
                            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Cohort Rank</div>
                                <div className="text-2xl font-black text-amber-900 mt-0.5">#{selectedStudentFor360.rank}</div>
                                <div className="text-[10px] font-semibold text-amber-700 mt-0.5">In Current Class</div>
                            </div>
                                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Attendance Rate</div>
                                <div className="text-2xl font-black text-emerald-900 mt-0.5">
                                    {selectedStudentFor360.attendance_rate !== null && selectedStudentFor360.attendance_rate !== undefined
                                        ? `${selectedStudentFor360.attendance_rate}%`
                                        : <span className="text-sm font-semibold text-slate-400">No Record</span>
                                    }
                                </div>
                                <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">School Attendance</div>
                            </div>
                            <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Evaluations</div>
                                <div className="text-2xl font-black text-purple-900 mt-0.5">{selectedStudentFor360.total_exams}</div>
                                <div className="text-[10px] font-semibold text-purple-700 mt-0.5">Completed Papers</div>
                            </div>
                        </div>

                        {/* Section 1: Multi-Subject Competency Matrix */}
                        <div className="mb-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600" /> Multi-Subject Competency Mastery Matrix
                            </h3>
                            <div className="space-y-3.5">
                                {selectedStudentFor360.subject_mastery.map((sub, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-800">{sub.subject_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                    sub.status === 'Mastered'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : sub.status === 'On Track'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {sub.status}
                                                </span>
                                                <span className="font-black text-slate-900">{sub.score}% (Grade {sub.grade})</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    sub.score >= 75 ? 'bg-emerald-500' : sub.score >= 50 ? 'bg-blue-600' : 'bg-rose-500'
                                                }`}
                                                style={{ width: `${sub.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Strengths vs. Weaker Focus Areas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {/* Strengths */}
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Primary Core Strengths
                                </div>
                                <ul className="space-y-1.5 text-xs text-emerald-800">
                                    {selectedStudentFor360.strengths.map((str, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5">
                                            <span className="text-emerald-500 font-bold">•</span>
                                            <span>{str}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weak Areas */}
                            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                                <div className="flex items-center gap-2 mb-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Critical Areas for Improvement
                                </div>
                                <ul className="space-y-1.5 text-xs text-rose-800">
                                    {selectedStudentFor360.weaker_areas.map((w, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5">
                                            <span className="text-rose-500 font-bold">•</span>
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Section 3: Historical Examination Trajectory */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" /> Historical Exam Performance Progression
                            </h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-3">Exam Paper</th>
                                            <th className="p-3">Subject</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Marks</th>
                                            <th className="p-3">Score %</th>
                                            <th className="p-3">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedStudentFor360.exam_history.map((h, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-900">{h.exam_title}</td>
                                                <td className="p-3 text-slate-600">{h.subject_name}</td>
                                                <td className="p-3 text-slate-500">{h.date || '—'}</td>
                                                <td className="p-3 font-semibold text-slate-800">{h.awarded_marks} / {h.max_marks}</td>
                                                <td className="p-3 font-black text-slate-900">{h.percentage}%</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                                                        Grade {h.grade_badge}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Faculty Diagnostic Remark */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6">
                            <span className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                                Faculty Diagnostic Notes & Academic Prescription:
                            </span>
                            <p className="text-xs text-slate-700 italic leading-relaxed">
                                "{selectedStudentFor360.teacher_recommendation}"
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 print:hidden">
                            <button
                                onClick={() => setSelectedStudentFor360(null)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                            >
                                Close View
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Complete Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
