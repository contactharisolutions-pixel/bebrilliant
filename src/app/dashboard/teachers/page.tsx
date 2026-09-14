'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Users, Search, UserPlus, CheckCircle2, XCircle, MoreVertical,
    ShieldCheck, ShieldAlert, BookOpen, Loader2, Trash2, Edit3,
    Filter, Activity, GraduationCap, Clock, Mail, Phone,
    KeyRound, Download, RefreshCw, X, ChevronRight, Check,
    AlertCircle, Sparkles, Layers, SlidersHorizontal, UserCheck,
    UserX, Building2, Eye, Copy, ExternalLink, ArrowUpDown
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────
type Division = { id: string; name: string; capacity?: number }
type ClassItem = { id: string; name: string; code?: string; sort_order?: number; is_active?: boolean; divisions?: Division[] }
type Subject = { id: string; name: string; code?: string; is_optional?: boolean }

type Teacher = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    is_active: boolean
    created_at: string
    updated_at?: string
    metadata?: {
        designation?: string
        qualification?: string
        employee_id?: string
        assigned_subjects?: string[]
        assigned_classes?: string[]
        assigned_divisions?: string[]
        joining_date?: string
    }
}

type TeacherStats = {
    total_teachers: number
    active_teachers: number
    pending_teachers: number
    total_subjects_assigned: number
    total_classes_covered: number
    total_tenant_subjects: number
    total_tenant_classes: number
}

// ── TOAST NOTIFICATION ──────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: ok ? '#064E3B' : '#7F1D1D',
            color: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: 14,
            fontWeight: 600,
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {ok ? <CheckCircle2 size={18} color="#34D399" /> : <AlertCircle size={18} color="#F87171" />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 2, display: 'flex' }}>
                <X size={16} />
            </button>
        </div>
    )
}

// ── REUSABLE ENTERPRISE MODAL ────────────────────────────────────
function Modal({
    title,
    subtitle,
    onClose,
    children,
    onSubmit,
    saving,
    submitText = 'Save Changes',
    maxWidth = 580
}: {
    title: string
    subtitle?: string
    onClose: () => void
    children: React.ReactNode
    onSubmit?: () => void
    saving?: boolean
    submitText?: string
    maxWidth?: number
}) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            padding: 20
        }}>
            <div style={{
                background: '#FFFFFF',
                borderRadius: 20,
                width: '100%',
                maxWidth,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '22px 28px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: '#FFFFFF'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</h2>
                        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748B',
                            transition: '0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '18px 28px',
                    background: '#F8FAFC',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            padding: '10px 18px',
                            borderRadius: 10,
                            background: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            color: '#374151',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: '0.15s'
                        }}
                    >
                        Cancel
                    </button>
                    {onSubmit && (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={saving}
                            style={{
                                padding: '10px 22px',
                                borderRadius: 10,
                                background: '#004B93',
                                border: '1px solid #003B73',
                                color: '#FFFFFF',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: saving ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 2px 4px rgba(0, 75, 147, 0.2)',
                                transition: '0.15s'
                            }}
                            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#003B73' }}
                            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#004B93' }}
                        >
                            {saving && <Loader2 size={15} className="spin" />}
                            {submitText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── MAIN FACULTY MANAGEMENT COMPONENT ────────────────────────────
export default function FacultyManagement() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [stats, setStats] = useState<TeacherStats>({
        total_teachers: 0,
        active_teachers: 0,
        pending_teachers: 0,
        total_subjects_assigned: 0,
        total_classes_covered: 0,
        total_tenant_subjects: 0,
        total_tenant_classes: 0
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Search & Filters
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all')
    const [subjectFilter, setSubjectFilter] = useState('all')
    const [classFilter, setClassFilter] = useState('all')
    const [sortBy, setSortBy] = useState<'name' | 'recent' | 'status'>('name')
    const [sortAsc, setSortAsc] = useState(true)

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Active Row Menu
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
    const [scopingTeacher, setScopingTeacher] = useState<Teacher | null>(null)
    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null)
    const [credentialModal, setCredentialModal] = useState<{ email: string; pass: string; name: string } | null>(null)

    // Forms
    const [teacherForm, setTeacherForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        designation: 'Teacher',
        qualification: '',
        employee_id: '',
        is_active: true,
        password: '',
        subjects: [] as string[],
        classes: [] as string[]
    })

    const [editForm, setEditForm] = useState({
        id: '',
        first_name: '',
        last_name: '',
        phone: '',
        designation: '',
        qualification: '',
        employee_id: ''
    })

    // Scope Assignment state
    const [scopeSubjects, setScopeSubjects] = useState<string[]>([])
    const [scopeClasses, setScopeClasses] = useState<string[]>([])
    const [scopeDivisions, setScopeDivisions] = useState<string[]>([])
    const [newSubjectInput, setNewSubjectInput] = useState('')
    const [addingSubject, setAddingSubject] = useState(false)

    // ── DATA FETCHING ────────────────────────────────────────────
    const fetchFacultyData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/teachers')
            const data = await res.json()
            if (res.ok) {
                setTeachers(data.teachers || [])
                setClasses(data.classes || [])
                setSubjects(data.subjects || [])
                if (data.stats) setStats(data.stats)
            } else {
                setToast({ msg: data.error || 'Failed to load faculty list', ok: false })
            }
        } catch (err: any) {
            setToast({ msg: err.message || 'Network error fetching faculty data', ok: false })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchFacultyData()
    }, [fetchFacultyData])

    // Close action menu on click outside
    useEffect(() => {
        const handleDocClick = () => setActiveMenuId(null)
        window.addEventListener('click', handleDocClick)
        return () => window.removeEventListener('click', handleDocClick)
    }, [])

    // ── API ACTION HELPER ────────────────────────────────────────
    const executeApi = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Operation failed')
            await fetchFacultyData()
            return { success: true, data }
        } catch (err: any) {
            setToast({ msg: err.message || 'Operation failed', ok: false })
            return { success: false }
        } finally {
            setSaving(false)
        }
    }

    // ── ACTION HANDLERS ──────────────────────────────────────────
    const handleCreateTeacher = async () => {
        if (!teacherForm.first_name.trim()) {
            setToast({ msg: 'Please provide teacher first name', ok: false })
            return
        }
        if (!teacherForm.email.trim() || !teacherForm.email.includes('@')) {
            setToast({ msg: 'Valid email address is required', ok: false })
            return
        }

        const res = await executeApi('CREATE_TEACHER', teacherForm)
        if (res.success) {
            setShowAddModal(false)
            setToast({ msg: 'Teacher registered successfully', ok: true })
            if (res.data?.temporary_password) {
                setCredentialModal({
                    email: teacherForm.email,
                    pass: res.data.temporary_password,
                    name: `${teacherForm.first_name} ${teacherForm.last_name}`
                })
            }
            setTeacherForm({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                designation: 'Teacher',
                qualification: '',
                employee_id: '',
                is_active: true,
                password: '',
                subjects: [],
                classes: []
            })
        }
    }

    const handleUpdateTeacher = async () => {
        if (!editForm.first_name.trim()) {
            setToast({ msg: 'First name is required', ok: false })
            return
        }
        const res = await executeApi('UPDATE_TEACHER', editForm)
        if (res.success) {
            setEditingTeacher(null)
            setToast({ msg: 'Faculty profile updated successfully', ok: true })
        }
    }

    const handleToggleStatus = async (id: string, current: boolean) => {
        const res = await executeApi('TOGGLE_STATUS', { id, is_active: !current })
        if (res.success) {
            setToast({ msg: !current ? 'Faculty access authorized' : 'Faculty access suspended', ok: true })
        }
    }

    const handleOpenScopeModal = (t: Teacher) => {
        setScopeSubjects(t.metadata?.assigned_subjects || [])
        setScopeClasses(t.metadata?.assigned_classes || [])
        setScopeDivisions(t.metadata?.assigned_divisions || [])
        setScopingTeacher(t)
    }

    const handleSaveScope = async () => {
        if (!scopingTeacher) return
        const res = await executeApi('ASSIGN_SCOPE', {
            id: scopingTeacher.id,
            subjects: scopeSubjects,
            classes: scopeClasses,
            divisions: scopeDivisions
        })
        if (res.success) {
            setScopingTeacher(null)
            setToast({ msg: 'Class & subject allocations updated', ok: true })
        }
    }

    const handleQuickAddSubject = async () => {
        if (!newSubjectInput.trim()) return
        setAddingSubject(true)
        try {
            const res = await fetch('/api/dashboard/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_SUBJECT', payload: { name: newSubjectInput.trim() } })
            })
            const data = await res.json()
            if (res.ok && data.subject) {
                setSubjects(prev => [...prev, data.subject])
                setScopeSubjects(prev => [...prev, data.subject.id])
                setNewSubjectInput('')
                setToast({ msg: `Subject "${data.subject.name}" created`, ok: true })
            } else {
                setToast({ msg: data.error || 'Failed to add subject', ok: false })
            }
        } finally {
            setAddingSubject(false)
        }
    }

    const handleResetPassword = async (teacher: Teacher) => {
        const res = await executeApi('RESET_PASSWORD', { id: teacher.id })
        if (res.success && res.data?.temporary_password) {
            setCredentialModal({
                email: teacher.email,
                pass: res.data.temporary_password,
                name: `${teacher.first_name} ${teacher.last_name}`
            })
        }
    }

    const handleDeleteTeacher = async () => {
        if (!deletingTeacher) return
        const res = await executeApi('DELETE_TEACHER', { id: deletingTeacher.id })
        if (res.success) {
            setDeletingTeacher(null)
            setToast({ msg: 'Teacher removed from system', ok: true })
        }
    }

    const handleBulkStatus = async (is_active: boolean) => {
        if (selectedIds.length === 0) return
        const res = await executeApi('BULK_STATUS', { ids: selectedIds, is_active })
        if (res.success) {
            setSelectedIds([])
            setToast({ msg: `Updated ${res.data?.updated_count || selectedIds.length} teachers`, ok: true })
        }
    }

    // ── CSV EXPORT ───────────────────────────────────────────────
    const handleExportCSV = () => {
        if (teachers.length === 0) return
        const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Designation', 'Status', 'Assigned Subjects', 'Assigned Classes', 'Joined Date']
        const rows = teachers.map(t => {
            const subNames = (t.metadata?.assigned_subjects || [])
                .map(sid => subjects.find(s => s.id === sid)?.name || sid)
                .join('; ')
            const clsNames = (t.metadata?.assigned_classes || []).join('; ')
            return [
                `"${t.metadata?.employee_id || ''}"`,
                `"${t.first_name || ''}"`,
                `"${t.last_name || ''}"`,
                `"${t.email || ''}"`,
                `"${t.phone || ''}"`,
                `"${t.metadata?.designation || 'Teacher'}"`,
                `"${t.is_active ? 'Active' : 'Pending'}"`,
                `"${subNames}"`,
                `"${clsNames}"`,
                `"${new Date(t.created_at).toLocaleDateString()}"`
            ]
        })

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `faculty_roster_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setToast({ msg: 'Faculty roster downloaded as CSV', ok: true })
    }

    // ── FILTERING & SORTING ──────────────────────────────────────
    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => {
            const fullName = `${t.first_name} ${t.last_name}`.toLowerCase()
            const email = (t.email || '').toLowerCase()
            const phone = (t.phone || '').toLowerCase()
            const empId = (t.metadata?.employee_id || '').toLowerCase()
            const q = search.toLowerCase().trim()

            const matchesSearch = !q || fullName.includes(q) || email.includes(q) || phone.includes(q) || empId.includes(q)
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? t.is_active : !t.is_active)
            const matchesSubject = subjectFilter === 'all' || (t.metadata?.assigned_subjects || []).includes(subjectFilter)
            const matchesClass = classFilter === 'all' || (t.metadata?.assigned_classes || []).includes(classFilter)

            return matchesSearch && matchesStatus && matchesSubject && matchesClass
        }).sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
                return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
            }
            if (sortBy === 'recent') {
                const dateA = new Date(a.created_at).getTime()
                const dateB = new Date(b.created_at).getTime()
                return sortAsc ? dateA - dateB : dateB - dateA
            }
            if (sortBy === 'status') {
                return sortAsc ? (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1) : (a.is_active === b.is_active ? 0 : a.is_active ? 1 : -1)
            }
            return 0
        })
    }, [teachers, search, statusFilter, subjectFilter, classFilter, sortBy, sortAsc])

    const isAllSelected = filteredTeachers.length > 0 && selectedIds.length === filteredTeachers.length

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredTeachers.map(t => t.id))
        }
    }

    const toggleSelectRow = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    // ── RENDER ───────────────────────────────────────────────────
    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* BREADCRUMB & HEADER */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>
                    <span>Dashboard</span>
                    <ChevronRight size={12} />
                    <span>Academy Management</span>
                    <ChevronRight size={12} />
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Faculty Directory</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.025em' }}>
                            Faculty Management
                        </h1>
                        <p style={{ fontSize: 14, color: '#64748B', margin: '6px 0 0', lineHeight: 1.5 }}>
                            Organize teaching staff, assign subject curriculums, and manage classroom authorizations.
                        </p>
                    </div>

                    {/* Header Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={handleExportCSV}
                            disabled={teachers.length === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 10,
                                padding: '10px 16px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#475569',
                                cursor: teachers.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: teachers.length === 0 ? 0.6 : 1,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                transition: '0.15s'
                            }}
                            onMouseEnter={e => { if (teachers.length > 0) e.currentTarget.style.background = '#F8FAFC' }}
                            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                        >
                            <Download size={15} /> Export Roster (CSV)
                        </button>

                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#004B93',
                                border: '1px solid #003B73',
                                borderRadius: 10,
                                padding: '10px 20px',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0, 75, 147, 0.25)',
                                transition: '0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#003B73'}
                            onMouseLeave={e => e.currentTarget.style.background = '#004B93'}
                        >
                            <UserPlus size={16} /> Add Faculty Member
                        </button>
                    </div>
                </div>
            </div>

            {/* EXECUTIVE METRIC CARDS (OPENAI STYLE) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                {/* Total Teachers */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Total Faculty</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004B93' }}>
                            <Users size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {loading ? '—' : stats.total_teachers}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>
                        {stats.active_teachers} Active • {stats.pending_teachers} Pending
                    </div>
                </div>

                {/* Active Faculty */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Active Teaching Staff</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 26, fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
                            {loading ? '—' : stats.active_teachers}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                            {stats.total_teachers > 0 ? Math.round((stats.active_teachers / stats.total_teachers) * 100) : 100}% of roster
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Live Authorized
                    </div>
                </div>

                {/* Pending Confirmation */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Pending Invites</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                            <Clock size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: stats.pending_teachers > 0 ? '#D97706' : '#0F172A', letterSpacing: '-0.02em' }}>
                        {loading ? '—' : stats.pending_teachers}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>
                        {stats.pending_teachers > 0 ? 'Awaiting activation' : 'All accounts verified'}
                    </div>
                </div>

                {/* Curriculum Coverage */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Subject Coverage</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                            <BookOpen size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {loading ? '—' : stats.total_subjects_assigned}
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', marginLeft: 4 }}>
                            / {stats.total_tenant_subjects > 0 ? stats.total_tenant_subjects : subjects.length}
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
                        Active curriculum subjects assigned
                    </div>
                </div>
            </div>

            {/* CONTROLS & FILTER BAR */}
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 20,
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                flexWrap: 'wrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
                {/* Search Field */}
                <div style={{ flex: '1 1 260px', position: 'relative' }}>
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by faculty name, email, phone, or ID..."
                        style={{
                            width: '100%',
                            padding: '9px 36px 9px 38px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#0F172A',
                            fontWeight: 500,
                            outline: 'none',
                            transition: '0.15s'
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2px' }}>
                        {(['all', 'active', 'pending'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: statusFilter === s ? '#FFFFFF' : 'transparent',
                                    color: statusFilter === s ? '#0F172A' : '#64748B',
                                    fontSize: 12,
                                    fontWeight: statusFilter === s ? 700 : 500,
                                    cursor: 'pointer',
                                    boxShadow: statusFilter === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                    transition: '0.15s',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {s === 'all' ? 'All Status' : s}
                            </button>
                        ))}
                    </div>

                    {/* Subject Filter */}
                    <select
                        value={subjectFilter}
                        onChange={e => setSubjectFilter(e.target.value)}
                        style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#475569',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>

                    {/* Class Filter */}
                    <select
                        value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}
                        style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#475569',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Classes</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.name}>{cls.name}</option>
                        ))}
                    </select>

                    {/* Reset Filters */}
                    {(search || statusFilter !== 'all' || subjectFilter !== 'all' || classFilter !== 'all') && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setSubjectFilter('all'); setClassFilter('all') }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '6px 8px'
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* BATCH ACTION BAR (WHEN ITEMS SELECTED) */}
            {selectedIds.length > 0 && (
                <div style={{
                    background: '#0F172A',
                    borderRadius: 12,
                    padding: '12px 20px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#FFFFFF',
                    animation: 'slideUp 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600 }}>
                        <span style={{ background: '#334155', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                            {selectedIds.length} Selected
                        </span>
                        <span>Bulk management actions:</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={() => handleBulkStatus(true)}
                            disabled={saving}
                            style={{
                                background: '#10B981',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#FFFFFF',
                                cursor: 'pointer'
                            }}
                        >
                            Authorize Selected
                        </button>
                        <button
                            onClick={() => handleBulkStatus(false)}
                            disabled={saving}
                            style={{
                                background: '#334155',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#FFFFFF',
                                cursor: 'pointer'
                            }}
                        >
                            Suspend Selected
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            style={{
                                background: 'transparent',
                                border: '1px solid #475569',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 12,
                                color: '#94A3B8',
                                cursor: 'pointer'
                            }}
                        >
                            Deselect
                        </button>
                    </div>
                </div>
            )}

            {/* HIGH DENSITY DATA TABLE */}
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                {loading ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <Loader2 size={36} color="#004B93" className="spin" style={{ margin: '0 auto 16px' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B', margin: 0 }}>
                            Loading faculty roster...
                        </p>
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    /* EMPTY STATE (OPENAI EDITORIAL) */
                    <div style={{ padding: '64px 32px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 440, margin: '0 auto' }}>
                            <div style={{
                                width: 72,
                                height: 72,
                                borderRadius: 20,
                                background: '#EFF6FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                border: '1px solid #DBEAFE',
                                color: '#004B93'
                            }}>
                                <GraduationCap size={36} />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                                {search || statusFilter !== 'all' || subjectFilter !== 'all' || classFilter !== 'all'
                                    ? 'No matching faculty members found'
                                    : 'No faculty members registered yet'}
                            </h3>
                            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
                                {search || statusFilter !== 'all'
                                    ? 'Try adjusting your search criteria or resetting your status filters.'
                                    : 'Build your academic department by onboarding your teachers, assigning course subjects, and granting classroom access.'}
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#004B93',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '11px 22px',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0, 75, 147, 0.2)'
                                }}
                            >
                                <UserPlus size={16} /> Register First Teacher
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* TABLE HEADER ROW */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '44px 2.2fr 1.1fr 1.6fr 1.4fr 120px 140px',
                            alignItems: 'center',
                            padding: '14px 24px',
                            background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <div>
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer', accentColor: '#004B93' }}
                                />
                            </div>
                            <div
                                onClick={() => { setSortBy('name'); setSortAsc(!sortAsc) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <span>Faculty Member</span>
                                <ArrowUpDown size={12} />
                            </div>
                            <div
                                onClick={() => { setSortBy('status'); setSortAsc(!sortAsc) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <span>Status</span>
                                <ArrowUpDown size={12} />
                            </div>
                            <div>Assigned Subjects</div>
                            <div>Classes / Sections</div>
                            <div
                                onClick={() => { setSortBy('recent'); setSortAsc(!sortAsc) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <span>Joined</span>
                                <ArrowUpDown size={12} />
                            </div>
                            <div style={{ textAlign: 'right' }}>Actions</div>
                        </div>

                        {/* TABLE BODY ROWS */}
                        {filteredTeachers.map((teacher, idx) => {
                            const isSelected = selectedIds.includes(teacher.id)
                            const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase() || 'FC'
                            const assignedSubs = (teacher.metadata?.assigned_subjects || [])
                                .map(sid => subjects.find(s => s.id === sid))
                                .filter(Boolean) as Subject[]
                            const assignedClassesList = teacher.metadata?.assigned_classes || []

                            return (
                                <div
                                    key={teacher.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '44px 2.2fr 1.1fr 1.6fr 1.4fr 120px 140px',
                                        alignItems: 'center',
                                        padding: '16px 24px',
                                        borderBottom: idx === filteredTeachers.length - 1 ? 'none' : '1px solid #F1F5F9',
                                        background: isSelected ? '#F0F9FF' : '#FFFFFF',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC' }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#FFFFFF' }}
                                >
                                    {/* Selection Checkbox */}
                                    <div>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectRow(teacher.id)}
                                            style={{ cursor: 'pointer', accentColor: '#004B93' }}
                                        />
                                    </div>

                                    {/* Faculty Profile */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                                        <div style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 12,
                                            background: teacher.is_active ? 'linear-gradient(135deg, #004B93 0%, #002D58 100%)' : '#E2E8F0',
                                            color: teacher.is_active ? '#FFFFFF' : '#64748B',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: 14,
                                            flexShrink: 0
                                        }}>
                                            {initials}
                                        </div>
                                        <div style={{ minWidth: 0, paddingRight: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {teacher.first_name} {teacher.last_name}
                                                </span>
                                                {teacher.metadata?.employee_id && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
                                                        {teacher.metadata.employee_id}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                                                <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Mail size={12} color="#94A3B8" /> {teacher.email}
                                                </span>
                                                {teacher.phone && (
                                                    <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                                        <Phone size={12} color="#94A3B8" /> {teacher.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        <button
                                            onClick={() => handleToggleStatus(teacher.id, teacher.is_active)}
                                            title="Click to toggle status"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                border: 'none',
                                                background: teacher.is_active ? '#DCFCE7' : '#FEF3C7',
                                                color: teacher.is_active ? '#15803D' : '#B45309',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: teacher.is_active ? '#16A34A' : '#F59E0B' }} />
                                            {teacher.is_active ? 'Active' : 'Pending'}
                                        </button>
                                    </div>

                                    {/* Assigned Subjects */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                        {assignedSubs.length > 0 ? (
                                            <>
                                                {assignedSubs.slice(0, 2).map(sub => (
                                                    <span
                                                        key={sub.id}
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            background: '#EFF6FF',
                                                            color: '#1D4ED8',
                                                            border: '1px solid #DBEAFE',
                                                            borderRadius: 6,
                                                            padding: '2px 8px'
                                                        }}
                                                    >
                                                        {sub.name}
                                                    </span>
                                                ))}
                                                {assignedSubs.length > 2 && (
                                                    <span
                                                        title={assignedSubs.slice(2).map(s => s.name).join(', ')}
                                                        style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', borderRadius: 6, padding: '2px 6px', cursor: 'help' }}
                                                    >
                                                        +{assignedSubs.length - 2}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                                                Unassigned
                                            </span>
                                        )}
                                    </div>

                                    {/* Assigned Classes */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                        {assignedClassesList.length > 0 ? (
                                            <>
                                                {assignedClassesList.slice(0, 2).map((clsName, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            background: '#F8FAFC',
                                                            color: '#475569',
                                                            border: '1px solid #E2E8F0',
                                                            borderRadius: 6,
                                                            padding: '2px 8px'
                                                        }}
                                                    >
                                                        {clsName}
                                                    </span>
                                                ))}
                                                {assignedClassesList.length > 2 && (
                                                    <span
                                                        title={assignedClassesList.slice(2).join(', ')}
                                                        style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', borderRadius: 6, padding: '2px 6px', cursor: 'help' }}
                                                    >
                                                        +{assignedClassesList.length - 2}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                                                No classes
                                            </span>
                                        )}
                                    </div>

                                    {/* Joined Date */}
                                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                                        {new Date(teacher.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, position: 'relative' }}>
                                        <button
                                            onClick={() => handleOpenScopeModal(teacher)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                background: '#F8FAFC',
                                                border: '1px solid #E2E8F0',
                                                color: '#004B93',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                transition: '0.15s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0' }}
                                        >
                                            <BookOpen size={13} /> Assign
                                        </button>

                                        <button
                                            onClick={e => {
                                                e.stopPropagation()
                                                setActiveMenuId(activeMenuId === teacher.id ? null : teacher.id)
                                            }}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                background: activeMenuId === teacher.id ? '#F1F5F9' : 'transparent',
                                                border: '1px solid ' + (activeMenuId === teacher.id ? '#CBD5E1' : 'transparent'),
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#64748B'
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* DROPDOWN MENU */}
                                        {activeMenuId === teacher.id && (
                                            <div
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 40,
                                                    width: 200,
                                                    background: '#FFFFFF',
                                                    borderRadius: 12,
                                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                                    border: '1px solid #E2E8F0',
                                                    padding: '6px',
                                                    zIndex: 100,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null)
                                                        setEditForm({
                                                            id: teacher.id,
                                                            first_name: teacher.first_name,
                                                            last_name: teacher.last_name,
                                                            phone: teacher.phone || '',
                                                            designation: teacher.metadata?.designation || 'Teacher',
                                                            qualification: teacher.metadata?.qualification || '',
                                                            employee_id: teacher.metadata?.employee_id || ''
                                                        })
                                                        setEditingTeacher(teacher)
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: '#334155',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Edit3 size={14} color="#64748B" /> Edit Profile
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null)
                                                        handleResetPassword(teacher)
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: '#334155',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <KeyRound size={14} color="#64748B" /> Reset Credentials
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null)
                                                        handleToggleStatus(teacher.id, teacher.is_active)
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: teacher.is_active ? '#B45309' : '#15803D',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {teacher.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                                    {teacher.is_active ? 'Suspend Account' : 'Authorize Account'}
                                                </button>

                                                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null)
                                                        setDeletingTeacher(teacher)
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: '#EF4444',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Trash2 size={14} color="#EF4444" /> Delete Faculty
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL: ADD FACULTY MEMBER ─────────────────────────── */}
            {showAddModal && (
                <Modal
                    title="Register Faculty Member"
                    subtitle="Create an authorized educator profile with institutional access credentials."
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleCreateTeacher}
                    saving={saving}
                    submitText="Complete Registration"
                    maxWidth={640}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Status Notice */}
                        <div style={{
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: 12,
                            padding: '12px 16px',
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start'
                        }}>
                            <ShieldCheck size={18} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.4 }}>
                                The teacher account will be created instantly and provisioned for online testing, offline grading, and curriculum management.
                            </p>
                        </div>

                        {/* Name Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    First Name <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={teacherForm.first_name}
                                    onChange={e => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                                    placeholder="e.g. Marie"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={teacherForm.last_name}
                                    onChange={e => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
                                    placeholder="e.g. Curie"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Contact Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={teacherForm.email}
                                    onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                                    placeholder="marie.curie@institute.org"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    value={teacherForm.phone}
                                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Designation / Role
                                </label>
                                <input
                                    type="text"
                                    value={teacherForm.designation}
                                    onChange={e => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                                    placeholder="e.g. Senior Physics Teacher"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Employee ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={teacherForm.employee_id}
                                    onChange={e => setTeacherForm({ ...teacherForm, employee_id: e.target.value })}
                                    placeholder="e.g. EMP-1042"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Initial Subject Selection */}
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                Initial Subject Specialization
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto', padding: 4 }}>
                                {subjects.map(s => {
                                    const active = teacherForm.subjects.includes(s.id)
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setTeacherForm(prev => ({
                                                    ...prev,
                                                    subjects: active ? prev.subjects.filter(id => id !== s.id) : [...prev.subjects, s.id]
                                                }))
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                border: '1px solid ' + (active ? '#004B93' : '#E2E8F0'),
                                                background: active ? '#004B93' : '#FFFFFF',
                                                color: active ? '#FFFFFF' : '#475569',
                                                cursor: 'pointer',
                                                transition: '0.15s'
                                            }}
                                        >
                                            {s.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── MODAL: EDIT FACULTY MEMBER ────────────────────────── */}
            {editingTeacher && (
                <Modal
                    title="Edit Faculty Profile"
                    subtitle="Update personal and professional details for this educator."
                    onClose={() => setEditingTeacher(null)}
                    onSubmit={handleUpdateTeacher}
                    saving={saving}
                    submitText="Save Profile"
                    maxWidth={540}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>First Name</label>
                                <input
                                    type="text"
                                    value={editForm.first_name}
                                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Last Name</label>
                                <input
                                    type="text"
                                    value={editForm.last_name}
                                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Phone Number</label>
                            <input
                                type="tel"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Designation</label>
                                <input
                                    type="text"
                                    value={editForm.designation}
                                    onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Employee ID</label>
                                <input
                                    type="text"
                                    value={editForm.employee_id}
                                    onChange={e => setEditForm({ ...editForm, employee_id: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── MODAL: ASSIGN CLASSES & SUBJECTS (100% DYNAMIC) ───── */}
            {scopingTeacher && (
                <Modal
                    title={`Classroom & Subject Allocations`}
                    subtitle={`Assign academic subjects and grade sections for ${scopingTeacher.first_name} ${scopingTeacher.last_name}.`}
                    onClose={() => setScopingTeacher(null)}
                    onSubmit={handleSaveScope}
                    saving={saving}
                    submitText="Save Allocations"
                    maxWidth={720}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28 }}>
                        {/* COLUMN 1: SUBJECTS */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Subjects Taught
                                </span>
                                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                                    {scopeSubjects.length} Selected
                                </span>
                            </div>

                            <div style={{
                                maxHeight: 320,
                                overflowY: 'auto',
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                padding: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                background: '#F8FAFC'
                            }}>
                                {subjects.map(s => {
                                    const active = scopeSubjects.includes(s.id)
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                setScopeSubjects(prev =>
                                                    active ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                )
                                            }}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: 8,
                                                background: active ? '#EFF6FF' : '#FFFFFF',
                                                border: '1px solid ' + (active ? '#3B82F6' : '#E2E8F0'),
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: '0.15s'
                                            }}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#1D4ED8' : '#334155' }}>
                                                {s.name}
                                            </span>
                                            {active && <Check size={16} color="#2563EB" />}
                                        </div>
                                    )
                                })}

                                {subjects.length === 0 && (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                                        No subjects found in curriculum.
                                    </div>
                                )}
                            </div>

                            {/* Quick Add Subject */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <input
                                    type="text"
                                    value={newSubjectInput}
                                    onChange={e => setNewSubjectInput(e.target.value)}
                                    placeholder="Add new subject name..."
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #E2E8F0',
                                        fontSize: 12,
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleQuickAddSubject}
                                    disabled={addingSubject || !newSubjectInput.trim()}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        background: '#004B93',
                                        border: 'none',
                                        color: '#FFFFFF',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {addingSubject ? <Loader2 size={12} className="spin" /> : 'Add'}
                                </button>
                            </div>
                        </div>

                        {/* COLUMN 2: DYNAMIC CLASSES & DIVISIONS */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Assigned Classes & Sections
                                </span>
                                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                                    {scopeClasses.length} Classes
                                </span>
                            </div>

                            <div style={{
                                maxHeight: 370,
                                overflowY: 'auto',
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                padding: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                background: '#F8FAFC'
                            }}>
                                {classes.length > 0 ? (
                                    classes.map(cls => {
                                        const isClassActive = scopeClasses.includes(cls.name)
                                        const divisions = cls.divisions || []

                                        return (
                                            <div
                                                key={cls.id}
                                                style={{
                                                    background: '#FFFFFF',
                                                    border: '1px solid ' + (isClassActive ? '#93C5FD' : '#E2E8F0'),
                                                    borderRadius: 10,
                                                    padding: '12px 14px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: divisions.length > 0 ? 8 : 0 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                                                        {cls.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setScopeClasses(prev =>
                                                                isClassActive ? prev.filter(x => x !== cls.name) : [...prev, cls.name]
                                                            )
                                                        }}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: 6,
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            border: '1px solid ' + (isClassActive ? '#2563EB' : '#D1D5DB'),
                                                            background: isClassActive ? '#EFF6FF' : '#FFFFFF',
                                                            color: isClassActive ? '#1D4ED8' : '#64748B',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {isClassActive ? 'Assigned' : '+ Assign Class'}
                                                    </button>
                                                </div>

                                                {/* Divisions list if configured */}
                                                {divisions.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                                        {divisions.map(div => {
                                                            const divLabel = `${cls.name} - ${div.name}`
                                                            const isDivActive = scopeDivisions.includes(divLabel)

                                                            return (
                                                                <button
                                                                    key={div.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setScopeDivisions(prev =>
                                                                            isDivActive ? prev.filter(x => x !== divLabel) : [...prev, divLabel]
                                                                        )
                                                                        // Automatically ensure class is also marked
                                                                        if (!isDivActive && !scopeClasses.includes(cls.name)) {
                                                                            setScopeClasses(prev => [...prev, cls.name])
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '3px 8px',
                                                                        borderRadius: 6,
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                        border: '1px solid ' + (isDivActive ? '#004B93' : '#E2E8F0'),
                                                                        background: isDivActive ? '#004B93' : '#F8FAFC',
                                                                        color: isDivActive ? '#FFFFFF' : '#475569',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    Div {div.name}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    /* Fallback if tenant hasn't configured classes yet */
                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px' }}>
                                            No classes configured yet in Academic Structure.
                                        </p>
                                        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                                            Configure classes in Dashboard &gt; Academic Setup to assign them to teachers.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── MODAL: CREDENTIALS / TEMPORARY PASSWORD ───────────── */}
            {credentialModal && (
                <Modal
                    title="Faculty Access Credentials"
                    subtitle="Share these credentials with the educator to enable portal login."
                    onClose={() => setCredentialModal(null)}
                    maxWidth={480}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Educator</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>{credentialModal.name}</div>

                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Login Email</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#004B93', marginBottom: 12, fontFamily: 'monospace' }}>
                                {credentialModal.email}
                            </div>

                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Temporary Password</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                                    {credentialModal.pass}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`BeBrilliant Portal Login:\nEmail: ${credentialModal.email}\nPassword: ${credentialModal.pass}\nURL: ${window.location.origin}/login`)
                                        setToast({ msg: 'Credentials copied to clipboard!', ok: true })
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#004B93', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                                >
                                    <Copy size={14} /> Copy
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                            The teacher can use these credentials to log in and will be encouraged to update their password upon first access.
                        </p>
                    </div>
                </Modal>
            )}

            {/* ── MODAL: DELETE CONFIRMATION ────────────────────────── */}
            {deletingTeacher && (
                <Modal
                    title="Confirm Faculty Removal"
                    subtitle="Are you sure you want to remove this faculty member?"
                    onClose={() => setDeletingTeacher(null)}
                    onSubmit={handleDeleteTeacher}
                    saving={saving}
                    submitText="Yes, Remove Faculty"
                    maxWidth={460}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <AlertCircle size={20} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: 13, color: '#991B1B', lineHeight: 1.4 }}>
                                This will remove <strong>{deletingTeacher.first_name} {deletingTeacher.last_name}</strong> from the faculty directory, unassign them from all classes, and revoke their access.
                            </p>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                            To temporarily pause access instead without deleting records, you can click <strong>Cancel</strong> and toggle their status to <em>Pending / Suspended</em>.
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    )
}
