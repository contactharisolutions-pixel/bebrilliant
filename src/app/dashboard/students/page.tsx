'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Users, Search, PlusCircle, UploadCloud, UserCheck, UserX,
    Activity, Lock, Unlock, CheckCircle2, XCircle, Loader2,
    Download, Filter, ArrowRight, ShieldCheck, FileSpreadsheet,
    RefreshCcw, UserPlus, BarChart3, Trash2, Eye, School,
    GraduationCap, Phone, Mail, ChevronRight, X, Printer,
    FileText, Check, AlertCircle, Sparkles
} from 'lucide-react'

interface Student {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    is_active: boolean
    created_at: string
    role: string
    metadata?: {
        school_class?: string
        class?: string
        division?: string
        section?: string
        roll_no?: string
        roll_number?: string
        parent_name?: string
        parent_phone?: string
        marks_percentage?: number
    }
    avg_marks?: number | string
    top_score?: number | string
    total_exams?: number
    standing_grade?: string
}

interface StatsSummary {
    total_students: number
    active_students: number
    cohort_average_marks: number
    top_class: string
}

interface TeacherScope {
    is_scoped: boolean
    assigned_classes: string[]
    assigned_divisions: string[]
}

export default function StudentDirectoryPage() {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'directory' | 'add' | 'bulk'>('directory')

    // Data states
    const [students, setStudents] = useState<Student[]>([])
    const [stats, setStats] = useState<StatsSummary>({
        total_students: 0,
        active_students: 0,
        cohort_average_marks: 0,
        top_class: 'Grade 10'
    })
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
    const [divisions, setDivisions] = useState<{ id: string; name: string; class_id: string }[]>([])
    const [teacherScope, setTeacherScope] = useState<TeacherScope | null>(null)

    // Search & Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedDivision, setSelectedDivision] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')

    // Form state for adding individual student
    const [studentForm, setStudentForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        roll_no: '',
        school_class: '',
        division: '',
        parent_name: '',
        parent_phone: ''
    })
    const [isSavingStudent, setIsSavingStudent] = useState(false)

    // Bulk upload states
    const [bulkRawData, setBulkRawData] = useState('')
    const [parsedBulkStudents, setParsedBulkStudents] = useState<any[]>([])
    const [isImportingBulk, setIsImportingBulk] = useState(false)

    // Modal & Toast states
    const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

    // ── FETCH STUDENTS & STATS ──────────────────────────────────
    const fetchStudentsData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        else setRefreshing(true)

        try {
            const params = new URLSearchParams()
            if (searchQuery.trim()) params.append('search', searchQuery.trim())
            if (selectedClass !== 'all') params.append('school_class', selectedClass)
            if (selectedDivision !== 'all') params.append('division', selectedDivision)
            if (selectedStatus !== 'all') params.append('status', selectedStatus)

            const res = await fetch(`/api/dashboard/students?${params.toString()}`)
            const json = await res.json()

            if (json.success && json.data) {
                setStudents(json.data.students || [])
                setStats(json.data.stats || stats)
                setClasses(json.data.classes || [])
                setDivisions(json.data.divisions || [])
                setTeacherScope(json.data.teacherScope || null)

                // Set default class if empty
                if (json.data.classes?.length > 0 && !studentForm.school_class) {
                    setStudentForm(prev => ({ ...prev, school_class: json.data.classes[0].name }))
                }
            }
        } catch (error) {
            console.error('Error fetching students data:', error)
            showToast('Unable to load student roster from server.', 'error')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [searchQuery, selectedClass, selectedDivision, selectedStatus, studentForm.school_class])

    useEffect(() => {
        fetchStudentsData()
    }, [fetchStudentsData])

    // Filter available divisions based on selected class in Add form
    const availableDivisionsForForm = useMemo(() => {
        if (!studentForm.school_class) return divisions
        const matchedClass = classes.find(c => c.name === studentForm.school_class)
        if (!matchedClass) return divisions
        return divisions.filter(d => d.class_id === matchedClass.id)
    }, [classes, divisions, studentForm.school_class])

    // ── SUBMIT INDIVIDUAL STUDENT ADMISSION ────────────────────
    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!studentForm.first_name || !studentForm.email) {
            showToast('First Name and Email are mandatory fields.', 'error')
            return
        }

        setIsSavingStudent(true)
        try {
            const res = await fetch('/api/dashboard/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_STUDENT',
                    payload: studentForm
                })
            })
            const json = await res.json()

            if (json.success) {
                showToast(json.message || 'Student enrolled successfully!', 'success')
                setStudentForm({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    roll_no: '',
                    school_class: classes[0]?.name || '',
                    division: '',
                    parent_name: '',
                    parent_phone: ''
                })
                fetchStudentsData(true)
                setActiveTab('directory')
            } else {
                showToast(json.error || 'Failed to admit student.', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error admitting student profile.', 'error')
        } finally {
            setIsSavingStudent(false)
        }
    }

    // ── TOGGLE ACTIVE / SUSPEND STATUS ────────────────────────
    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/dashboard/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'TOGGLE_STATUS',
                    payload: { id, is_active: !currentStatus }
                })
            })
            const json = await res.json()
            if (json.success) {
                showToast(`Student status updated to ${!currentStatus ? 'Active' : 'Suspended'}.`, 'success')
                fetchStudentsData(true)
            } else {
                showToast(json.error || 'Failed to update student status.', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error updating status.', 'error')
        }
    }

    // ── DELETE STUDENT ─────────────────────────────────────────
    const handleDeleteStudent = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete the profile for ${name}? This action cannot be undone.`)) {
            return
        }

        try {
            const res = await fetch('/api/dashboard/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_STUDENT',
                    payload: { id }
                })
            })
            const json = await res.json()
            if (json.success) {
                showToast('Student profile deleted from school roster.', 'success')
                setStudents(prev => prev.filter(s => s.id !== id))
                fetchStudentsData(true)
            } else {
                showToast(json.error || 'Failed to delete student.', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error deleting student.', 'error')
        }
    }

    // ── PARSE RAW CSV FOR BULK UPLOAD ─────────────────────────
    const handleParseBulkData = () => {
        if (!bulkRawData.trim()) return

        const lines = bulkRawData.trim().split('\n')
        const parsed: any[] = []

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Skip header row if present
            if (i === 0 && line.toLowerCase().includes('email')) continue

            const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
            if (parts.length >= 3) {
                parsed.push({
                    first_name: parts[0] || 'Student',
                    last_name: parts[1] || '',
                    email: parts[2] || '',
                    phone: parts[3] || '',
                    roll_no: parts[4] || '',
                    school_class: parts[5] || classes[0]?.name || 'Grade 10',
                    division: parts[6] || 'Section Alpha',
                    parent_name: parts[7] || '',
                    parent_phone: parts[8] || ''
                })
            }
        }

        setParsedBulkStudents(parsed)
        if (parsed.length > 0) {
            showToast(`Parsed ${parsed.length} student records from CSV. Ready to import!`, 'success')
        } else {
            showToast('No valid student rows recognized. Check format.', 'error')
        }
    }

    // ── COMMIT BULK IMPORT TO DATABASE ────────────────────────
    const handleCommitBulkImport = async () => {
        if (!parsedBulkStudents.length) return
        setIsImportingBulk(true)

        try {
            const res = await fetch('/api/dashboard/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'BULK_CREATE_STUDENTS',
                    payload: parsedBulkStudents
                })
            })
            const json = await res.json()
            if (json.success) {
                showToast(json.message || 'Students imported successfully!', 'success')
                setBulkRawData('')
                setParsedBulkStudents([])
                fetchStudentsData(true)
                setActiveTab('directory')
            } else {
                showToast(json.error || 'Failed to import students.', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error importing students. Please try again.', 'error')
        } finally {
            setIsImportingBulk(false)
        }
    }

    // ── EXPORT ROSTER TO CSV ──────────────────────────────────
    const exportRosterCSV = () => {
        if (!students.length) return

        const headers = ['Roll Number', 'First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Section', 'Average Marks', 'Status', 'Admission Date']
        const csvRows = students.map(s => [
            `"${s.metadata?.roll_no || s.metadata?.roll_number || 'N/A'}"`,
            `"${s.first_name.replace(/"/g, '""')}"`,
            `"${s.last_name.replace(/"/g, '""')}"`,
            `"${s.email}"`,
            `"${s.phone || ''}"`,
            `"${(s.metadata?.school_class || s.metadata?.class || 'General').replace(/"/g, '""')}"`,
            `"${(s.metadata?.division || s.metadata?.section || 'A').replace(/"/g, '""')}"`,
            `"${s.avg_marks || 0}%"`,
            `"${s.is_active ? 'Active' : 'Suspended'}"`,
            `"${new Date(s.created_at).toLocaleDateString()}"`
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `Student_Roster_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // ── DOWNLOAD SAMPLE CSV TEMPLATE ──────────────────────────
    const downloadSampleTemplate = () => {
        const sampleContent = 'first_name,last_name,email,phone,roll_no,school_class,division,parent_name,parent_phone\n' +
            'Aarav,Sharma,aarav.sharma@example.com,9876543210,101,Grade 9 - Foundation Science & Humanities,Section Newton,Rajesh Sharma,9876543200\n' +
            'Diya,Kapoor,diya.kapoor@example.com,9876543211,102,Grade 9 - Foundation Science & Humanities,Section Newton,Anita Kapoor,9876543201\n' +
            'Rohan,Gupta,rohan.gupta@example.com,9876543212,201,Grade 10 - Matriculation Board,Section Alpha,Suresh Gupta,9876543202'

        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + sampleContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', 'Sample_Student_Roster_Template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading && !students.length) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Loading Student Directory</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Fetching student profiles, classes, and academic records...</p>
            </div>
        )
    }

    return (
        <div className="w-full px-4 sm:px-8 py-6 pb-24 bg-slate-50/60 min-h-screen text-slate-800 antialiased">
            {/* ── TOAST NOTIFICATION ────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold transition-all animate-slideDown ${
                    toast.type === 'success'
                        ? 'bg-emerald-900 text-white border-emerald-700'
                        : 'bg-rose-900 text-white border-rose-700'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* ── CINEMATIC ENTERPRISE HERO BANNER ────────────────────── */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm mb-8">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/images/dashboard/student_directory_banner.jpg"
                        alt="School Admissions and Student Records Registry"
                        fill
                        priority
                        className="object-cover object-center opacity-35 filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
                </div>

                <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10 max-w-4xl text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Student Directory & Academic Admissions Hub
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
                        Student Directory & Admissions
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                        Manage student admissions, profiles, and attendance. View report cards and track academic progress across all classes and sections.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setActiveTab('add')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                        >
                            <UserPlus className="w-4 h-4 text-blue-600" />
                            Add New Student
                        </button>
                        <button
                            onClick={() => setActiveTab('bulk')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold transition-all active:scale-95"
                        >
                            <UploadCloud className="w-4 h-4 text-blue-400" />
                            Bulk Roster Import
                        </button>
                        <button
                            onClick={exportRosterCSV}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4 text-emerald-400" />
                            Export Roster (CSV)
                        </button>
                        <button
                            onClick={() => fetchStudentsData(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs sm:text-sm font-medium transition-all"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Sync'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── TOP KPI METRIC CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
                {/* 1. Total Enrolled Students */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.total_students || students.length}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Students registered in your school
                        </div>
                    </div>
                </div>

                {/* 2. Cohort Average Marks */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Marks</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-emerald-700 tracking-tight">
                            {stats.cohort_average_marks > 0 ? `${stats.cohort_average_marks}%` : '88.1%'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Evaluated score average across all exams
                        </div>
                    </div>
                </div>

                {/* 3. Active Status */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Students</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.active_students || students.filter(s => s.is_active).length}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Active accounts with portal access
                        </div>
                    </div>
                </div>

                {/* 4. Top Performing Grade */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Performing Class</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <School className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-xl font-black text-slate-900 tracking-tight truncate">
                            {stats.top_class || 'Grade 10'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 font-medium">
                            Best performing class in test scores
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TAB NAVIGATION ────────────────────────────────────────── */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('directory')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'directory'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Student Roster ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'add'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <UserPlus className="w-4 h-4" />
                    Enroll Individual Student
                </button>
                <button
                    onClick={() => setActiveTab('bulk')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'bulk'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                >
                    <UploadCloud className="w-4 h-4" />
                    Bulk Roster Import & Export
                </button>
            </div>

            {/* ── TAB 1: STUDENT ROSTER DIRECTORY ───────────────────────── */}
            {activeTab === 'directory' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Teacher Scope Active Banner */}
                    {teacherScope?.is_scoped && (
                        teacherScope.assigned_classes.length > 0 ? (
                            <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                                            <span>Teacher Class Scope Active</span>
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                        <div className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                                            Restricted to your assigned classes:{' '}
                                            <span className="text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-lg">
                                                {teacherScope.assigned_classes.join(', ')}
                                            </span>
                                            {teacherScope.assigned_divisions.length > 0 && (
                                                <span className="text-slate-600 font-medium ml-1">
                                                    (Sections: {teacherScope.assigned_divisions.join(', ')})
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
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-bold text-amber-900">No Classes Assigned to Your Teacher Account</div>
                                    <div className="text-xs text-amber-700 font-medium mt-1">
                                        Your teacher profile does not currently have any classes assigned. Please contact your school administrator to configure your assigned classes in the Staff Directory.
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* Search & Dynamic Filter Controls */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Class Filter */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                                    <School className="w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedClass}
                                        onChange={e => setSelectedClass(e.target.value)}
                                        className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="all">All School Grades</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Section Filter */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                                    <Filter className="w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedDivision}
                                        onChange={e => setSelectedDivision(e.target.value)}
                                        className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="all">All Sections</option>
                                        {divisions.map(d => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedStatus}
                                        onChange={e => setSelectedStatus(e.target.value)}
                                        className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="active">Active Only</option>
                                        <option value="suspended">Suspended Only</option>
                                    </select>
                                </div>

                                {(selectedClass !== 'all' || selectedDivision !== 'all' || selectedStatus !== 'all' || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setSelectedClass('all')
                                            setSelectedDivision('all')
                                            setSelectedStatus('all')
                                            setSearchQuery('')
                                        }}
                                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full md:w-80">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by student name, roll no, email..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Full-Width Student Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3.5 px-5">Student Information</th>
                                        <th className="py-3.5 px-5">Class & Section</th>
                                        <th className="py-3.5 px-5">Status</th>
                                        <th className="py-3.5 px-5">Average Marks</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                                                No student records found matching the filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((st) => {
                                            const rollNo = st.metadata?.roll_no || st.metadata?.roll_number || 'N/A'
                                            const className = st.metadata?.school_class || st.metadata?.class || 'General Class'
                                            const sectionName = st.metadata?.division || st.metadata?.section || 'Section Newton'
                                            const avgMarksNum = Number(st.avg_marks || 0)

                                            return (
                                                <tr
                                                    key={st.id}
                                                    onClick={() => setSelectedStudentForModal(st)}
                                                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                                >
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                                                st.is_active
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {st.first_name[0] || 'S'}{(st.last_name && st.last_name[0]) || ''}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                                    {st.first_name} {st.last_name}
                                                                </div>
                                                                <div className="text-xs text-slate-400 font-medium">
                                                                    Roll No: <span className="font-bold text-slate-600">{rollNo}</span> • {st.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <div className="font-bold text-slate-800 text-xs sm:text-sm">
                                                            {className}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {sectionName}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                                                            st.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${st.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                            {st.is_active ? 'Active' : 'Suspended'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${
                                                                        avgMarksNum >= 75
                                                                            ? 'bg-emerald-500'
                                                                            : avgMarksNum >= 40
                                                                                ? 'bg-blue-600'
                                                                                : 'bg-rose-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(avgMarksNum, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-black text-slate-900 text-sm">
                                                                {avgMarksNum > 0 ? `${avgMarksNum}%` : 'Pending'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Link
                                                                href={`/dashboard/faculty/analytics/results-360?student_id=${st.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                                                title="View 360° Performance Analytics"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                            </Link>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedStudentForModal(st)
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleToggleStatus(st.id, st.is_active)
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-colors ${
                                                                    st.is_active
                                                                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                                title={st.is_active ? 'Suspend Account' : 'Activate Account'}
                                                            >
                                                                {st.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteStudent(st.id, `${st.first_name} ${st.last_name}`)
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                title="Delete Student Profile"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: ENROLL NEW STUDENT FORM ───────────────────────── */}
            {activeTab === 'add' && (
                <div className="max-w-3xl bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-fadeIn">
                    <div className="pb-4 border-b border-slate-100 mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Student Admission & Enrollment Form</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Admit a student into Silver Bells School and assign them to their designated academic class and section.
                        </p>
                    </div>

                    {/* Teacher Scope Notice in Add Form */}
                    {teacherScope?.is_scoped && (
                        teacherScope.assigned_classes.length === 0 ? (
                            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-xs font-semibold">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>Enrollment Disabled: Your teacher account does not currently have any assigned classes. Please contact your school administrator.</span>
                            </div>
                        ) : (
                            <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-blue-800 text-xs font-semibold">
                                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span>Teacher Scope Active: You can enroll students into your assigned classes: {teacherScope.assigned_classes.join(', ')}.</span>
                            </div>
                        )
                    )}

                    <form onSubmit={handleCreateStudent} className="space-y-5">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    First Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={studentForm.first_name}
                                    onChange={e => setStudentForm({ ...studentForm, first_name: e.target.value })}
                                    placeholder="e.g. Aarav"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={studentForm.last_name}
                                    onChange={e => setStudentForm({ ...studentForm, last_name: e.target.value })}
                                    placeholder="e.g. Sharma"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Contact Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Email Address <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={studentForm.email}
                                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                                    placeholder="student@silverbells.in"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Mobile Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={studentForm.phone}
                                    onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
                                    placeholder="e.g. +91 9876543210"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Class & Section Assignment */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Roll Number / ID
                                </label>
                                <input
                                    type="text"
                                    value={studentForm.roll_no}
                                    onChange={e => setStudentForm({ ...studentForm, roll_no: e.target.value })}
                                    placeholder="e.g. Roll 103"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Assigned Class
                                </label>
                                <select
                                    value={studentForm.school_class}
                                    onChange={e => setStudentForm({ ...studentForm, school_class: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {classes.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Section / Division
                                </label>
                                <select
                                    value={studentForm.division}
                                    onChange={e => setStudentForm({ ...studentForm, division: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Select Section</option>
                                    {availableDivisionsForForm.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Parent / Guardian Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Parent / Guardian Name
                                </label>
                                <input
                                    type="text"
                                    value={studentForm.parent_name}
                                    onChange={e => setStudentForm({ ...studentForm, parent_name: e.target.value })}
                                    placeholder="e.g. Ramesh Sharma"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Parent Contact Number
                                </label>
                                <input
                                    type="tel"
                                    value={studentForm.parent_phone}
                                    onChange={e => setStudentForm({ ...studentForm, parent_phone: e.target.value })}
                                    placeholder="e.g. +91 9876543200"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab('directory')}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingStudent || (Boolean(teacherScope?.is_scoped) && (teacherScope?.assigned_classes.length ?? 0) === 0)}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSavingStudent ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enrolling...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Complete Admission
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── TAB 3: BULK ROSTER IMPORT & EXPORT ────────────────────── */}
            {activeTab === 'bulk' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Bulk Student Roster Import</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Import multiple students simultaneously via CSV format or paste directly from Excel spreadsheets.
                                </p>
                            </div>
                            <button
                                onClick={downloadSampleTemplate}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all"
                            >
                                <Download className="w-3.5 h-3.5 text-blue-600" /> Download Sample CSV
                            </button>
                        </div>

                        {/* Teacher Scope Notice in Bulk Import */}
                        {teacherScope?.is_scoped && (
                            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-xs font-semibold ${
                                teacherScope.assigned_classes.length > 0
                                    ? 'bg-blue-50 border border-blue-200 text-blue-800'
                                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                            }`}>
                                {teacherScope.assigned_classes.length > 0 ? (
                                    <>
                                        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                        <span>Teacher Scope Active: You can only import students for your assigned classes ({teacherScope.assigned_classes.join(', ')}). Any student records for unassigned classes will be rejected by the server.</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <span>Import Disabled: Your teacher profile has no assigned classes. Contact your school administrator to configure your classes.</span>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Paste CSV / Spreadsheet Content
                                </label>
                                <p className="text-xs text-slate-400 mb-2">
                                    Headers: <code>first_name, last_name, email, phone, roll_no, school_class, division, parent_name, parent_phone</code>
                                </p>
                                <textarea
                                    rows={8}
                                    value={bulkRawData}
                                    onChange={e => setBulkRawData(e.target.value)}
                                    placeholder="first_name,last_name,email,phone,roll_no,school_class,division&#10;Aarav,Sharma,aarav.sharma@example.com,9876543210,101,Grade 9 - Foundation Science & Humanities,Section Newton&#10;Diya,Kapoor,diya.kapoor@example.com,9876543211,102,Grade 9 - Foundation Science & Humanities,Section Newton"
                                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleParseBulkData}
                                    disabled={!bulkRawData.trim() || (Boolean(teacherScope?.is_scoped) && (teacherScope?.assigned_classes.length ?? 0) === 0)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Validate & Preview Roster
                                </button>
                                {parsedBulkStudents.length > 0 && (
                                    <button
                                        onClick={handleCommitBulkImport}
                                        disabled={isImportingBulk}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center gap-2 disabled:opacity-60"
                                    >
                                        {isImportingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        Confirm & Enroll {parsedBulkStudents.length} Students
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Preview Table if records parsed */}
                        {parsedBulkStudents.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 mb-3">
                                    Roster Preview ({parsedBulkStudents.length} Students Detected)
                                </h4>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                                            <tr>
                                                <th className="p-3">Name</th>
                                                <th className="p-3">Email</th>
                                                <th className="p-3">Roll No</th>
                                                <th className="p-3">Class</th>
                                                <th className="p-3">Section</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedBulkStudents.map((st, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="p-3 font-semibold text-slate-900">{st.first_name} {st.last_name}</td>
                                                    <td className="p-3 text-slate-600">{st.email}</td>
                                                    <td className="p-3 font-mono">{st.roll_no}</td>
                                                    <td className="p-3">{st.school_class}</td>
                                                    <td className="p-3">{st.division}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL: STUDENT PROFILE & REPORT CARD SUMMARY ──────────── */}
            {selectedStudentForModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl animate-scaleUp">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-slate-900">Student Profile & Academic Card</h3>
                            </div>
                            <button
                                onClick={() => setSelectedStudentForModal(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            {/* Student header card */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                                        {selectedStudentForModal.first_name[0]}{(selectedStudentForModal.last_name && selectedStudentForModal.last_name[0]) || ''}
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-slate-900">
                                            {selectedStudentForModal.first_name} {selectedStudentForModal.last_name}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium">
                                            Roll No: {selectedStudentForModal.metadata?.roll_no || selectedStudentForModal.metadata?.roll_number || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                    selectedStudentForModal.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    {selectedStudentForModal.is_active ? 'Active' : 'Suspended'}
                                </span>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Class & Grade</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                                        {selectedStudentForModal.metadata?.school_class || selectedStudentForModal.metadata?.class || 'Grade 10'}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Section / Division</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                                        {selectedStudentForModal.metadata?.division || selectedStudentForModal.metadata?.section || 'Section Newton'}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Calculated Average Marks</div>
                                    <div className="text-lg font-black text-emerald-700 mt-0.5">
                                        {Number(selectedStudentForModal.avg_marks || 0) > 0 ? `${selectedStudentForModal.avg_marks}%` : 'Pending'}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Evaluated Exams</div>
                                    <div className="text-lg font-black text-blue-600 mt-0.5">
                                        {selectedStudentForModal.total_exams || 1}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{selectedStudentForModal.email}</span>
                                </div>
                                {selectedStudentForModal.phone && (
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{selectedStudentForModal.phone}</span>
                                    </div>
                                )}
                                {selectedStudentForModal.metadata?.parent_name && (
                                    <div className="pt-1 text-slate-500 border-t border-slate-200/60">
                                        Parent: <strong className="text-slate-700">{selectedStudentForModal.metadata.parent_name}</strong>
                                        {selectedStudentForModal.metadata.parent_phone && ` (${selectedStudentForModal.metadata.parent_phone})`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <Link
                                href={`/dashboard/faculty/analytics/results-360?student_id=${selectedStudentForModal.id}`}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span>Open 360° Academic Dossier</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                                onClick={() => setSelectedStudentForModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
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
