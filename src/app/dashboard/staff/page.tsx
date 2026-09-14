'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Users, Search, UserPlus, CheckCircle2, XCircle, MoreVertical,
    Shield, ShieldCheck, ShieldAlert, KeyRound, Download, RefreshCw,
    X, ChevronRight, Check, AlertCircle, Sparkles, Building2,
    Mail, Phone, Edit3, Trash2, UserCheck, UserX, Copy, Loader2,
    Lock, ArrowUpDown, Briefcase, FileText, Settings, Award, Layers
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────
type StaffMember = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    role: 'platform_staff' | 'tenant_admin'
    is_active: boolean
    created_at: string
    updated_at?: string
    is_self?: boolean
    metadata?: {
        designation?: string
        department?: string
        employee_id?: string
        permissions?: string[]
        joining_date?: string
    }
}

type StaffStats = {
    total_staff: number
    active_staff: number
    suspended_staff: number
    departments_count: number
    admin_count: number
}

const PERMISSION_OPTIONS = [
    { key: 'view_records', label: 'View Academic Records', desc: 'Can browse students, syllabi, and schedules' },
    { key: 'manage_students', label: 'Student Admissions & Records', desc: 'Can admit new students and update profiles' },
    { key: 'manage_exams', label: 'Exams & OMR Scanning', desc: 'Can manage test schedules and scan answer sheets' },
    { key: 'manage_finance', label: 'Fees & Accounting', desc: 'Can record student fee payments and view transactions' },
    { key: 'admin_access', label: 'Full Operational Administration', desc: 'Elevated institute operational controls' }
]

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Administration': { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
    'Finance & Accounts': { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
    'Student Admissions': { bg: '#FDF4FF', text: '#9333EA', border: '#F0ABFC' },
    'Library & Resources': { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    'IT & Technical Support': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    'Academic Operations': { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
    'Laboratory & Science': { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
    'Campus Management': { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' }
}

// ── TOAST COMPONENT ──────────────────────────────────────────────
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

// ── REUSABLE MODAL ───────────────────────────────────────────────
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
                            cursor: 'pointer'
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
                                boxShadow: '0 2px 4px rgba(0, 75, 147, 0.2)'
                            }}
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

// ── MAIN STAFF DIRECTORY COMPONENT ───────────────────────────────
export default function StaffDirectoryPage() {
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [departments, setDepartments] = useState<string[]>([])
    const [stats, setStats] = useState<StaffStats>({
        total_staff: 0,
        active_staff: 0,
        suspended_staff: 0,
        departments_count: 0,
        admin_count: 0
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Filters & Sorting
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
    const [deptFilter, setDeptFilter] = useState('all')
    const [roleFilter, setRoleFilter] = useState('all')
    const [sortBy, setSortBy] = useState<'name' | 'recent' | 'dept'>('name')
    const [sortAsc, setSortAsc] = useState(true)

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
    const [permissionStaff, setPermissionStaff] = useState<StaffMember | null>(null)
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)
    const [credentialModal, setCredentialModal] = useState<{ email: string; pass: string; name: string } | null>(null)

    // Forms
    const [staffForm, setStaffForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        designation: 'Administrative Officer',
        department: 'Administration',
        employee_id: '',
        role: 'platform_staff' as 'platform_staff' | 'tenant_admin',
        permissions: ['view_records'] as string[],
        password: '',
        is_active: true
    })

    const [editForm, setEditForm] = useState({
        id: '',
        first_name: '',
        last_name: '',
        phone: '',
        designation: '',
        department: '',
        employee_id: '',
        role: 'platform_staff' as 'platform_staff' | 'tenant_admin',
        permissions: [] as string[]
    })

    const [modalPermissions, setModalPermissions] = useState<string[]>([])

    // ── DATA FETCHING ────────────────────────────────────────────
    const fetchStaffData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/staff')
            const data = await res.json()
            if (res.ok) {
                setStaffList(data.staff || [])
                setDepartments(data.departments || [])
                if (data.stats) setStats(data.stats)
            } else {
                setToast({ msg: data.error || 'Failed to load staff roster', ok: false })
            }
        } catch (err: any) {
            setToast({ msg: err.message || 'Network error fetching staff data', ok: false })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStaffData()
    }, [fetchStaffData])

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
            const res = await fetch('/api/dashboard/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Operation failed')
            await fetchStaffData()
            return { success: true, data }
        } catch (err: any) {
            setToast({ msg: err.message || 'Operation failed', ok: false })
            return { success: false }
        } finally {
            setSaving(false)
        }
    }

    // ── HANDLERS ─────────────────────────────────────────────────
    const handleCreateStaff = async () => {
        if (!staffForm.first_name.trim()) {
            setToast({ msg: 'Please provide first name', ok: false })
            return
        }
        if (!staffForm.email.trim() || !staffForm.email.includes('@')) {
            setToast({ msg: 'Valid email address is required', ok: false })
            return
        }

        const res = await executeApi('CREATE_STAFF', staffForm)
        if (res.success) {
            setShowAddModal(false)
            setToast({ msg: 'Staff member registered successfully', ok: true })
            if (res.data?.temporary_password) {
                setCredentialModal({
                    email: staffForm.email,
                    pass: res.data.temporary_password,
                    name: `${staffForm.first_name} ${staffForm.last_name}`
                })
            }
            setStaffForm({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                designation: 'Administrative Officer',
                department: 'Administration',
                employee_id: '',
                role: 'platform_staff',
                permissions: ['view_records'],
                password: '',
                is_active: true
            })
        }
    }

    const handleUpdateStaff = async () => {
        if (!editForm.first_name.trim()) {
            setToast({ msg: 'First name is required', ok: false })
            return
        }
        const res = await executeApi('UPDATE_STAFF', editForm)
        if (res.success) {
            setEditingStaff(null)
            setToast({ msg: 'Staff profile updated successfully', ok: true })
        }
    }

    const handleSavePermissions = async () => {
        if (!permissionStaff) return
        const res = await executeApi('UPDATE_STAFF', {
            id: permissionStaff.id,
            first_name: permissionStaff.first_name,
            permissions: modalPermissions
        })
        if (res.success) {
            setPermissionStaff(null)
            setToast({ msg: 'Staff permissions updated', ok: true })
        }
    }

    const handleToggleStatus = async (id: string, current: boolean) => {
        const res = await executeApi('TOGGLE_STATUS', { id, is_active: !current })
        if (res.success) {
            setToast({ msg: !current ? 'Staff access authorized' : 'Staff access suspended', ok: true })
        }
    }

    const handleResetPassword = async (staff: StaffMember) => {
        const res = await executeApi('RESET_PASSWORD', { id: staff.id })
        if (res.success && res.data?.temporary_password) {
            setCredentialModal({
                email: staff.email,
                pass: res.data.temporary_password,
                name: `${staff.first_name} ${staff.last_name}`
            })
        }
    }

    const handleDeleteStaff = async () => {
        if (!deletingStaff) return
        const res = await executeApi('DELETE_STAFF', { id: deletingStaff.id })
        if (res.success) {
            setDeletingStaff(null)
            setToast({ msg: 'Staff member removed from institute roster', ok: true })
        }
    }

    const handleBulkStatus = async (is_active: boolean) => {
        if (selectedIds.length === 0) return
        const res = await executeApi('BULK_STATUS', { ids: selectedIds, is_active })
        if (res.success) {
            setSelectedIds([])
            setToast({ msg: `Updated ${res.data?.updated_count || selectedIds.length} staff members`, ok: true })
        }
    }

    // ── CSV EXPORT ───────────────────────────────────────────────
    const handleExportCSV = () => {
        if (staffList.length === 0) return
        const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Designation', 'Department', 'Role', 'Status', 'Joined Date']
        const rows = staffList.map(s => [
            `"${s.metadata?.employee_id || ''}"`,
            `"${s.first_name || ''}"`,
            `"${s.last_name || ''}"`,
            `"${s.email || ''}"`,
            `"${s.phone || ''}"`,
            `"${s.metadata?.designation || 'Staff'}"`,
            `"${s.metadata?.department || 'General'}"`,
            `"${s.role === 'tenant_admin' ? 'Administrator' : 'Staff Officer'}"`,
            `"${s.is_active ? 'Active' : 'Suspended'}"`,
            `"${new Date(s.created_at).toLocaleDateString()}"`
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `staff_directory_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setToast({ msg: 'Staff directory exported to CSV', ok: true })
    }

    // ── FILTERING & SORTING ──────────────────────────────────────
    const filteredStaff = useMemo(() => {
        return staffList.filter(s => {
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
            const email = (s.email || '').toLowerCase()
            const phone = (s.phone || '').toLowerCase()
            const empId = (s.metadata?.employee_id || '').toLowerCase()
            const desig = (s.metadata?.designation || '').toLowerCase()
            const q = search.toLowerCase().trim()

            const matchesSearch = !q || fullName.includes(q) || email.includes(q) || phone.includes(q) || empId.includes(q) || desig.includes(q)
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? s.is_active : !s.is_active)
            const matchesDept = deptFilter === 'all' || s.metadata?.department === deptFilter
            const matchesRole = roleFilter === 'all' || s.role === roleFilter

            return matchesSearch && matchesStatus && matchesDept && matchesRole
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
            if (sortBy === 'dept') {
                const deptA = a.metadata?.department || ''
                const deptB = b.metadata?.department || ''
                return sortAsc ? deptA.localeCompare(deptB) : deptB.localeCompare(deptA)
            }
            return 0
        })
    }, [staffList, search, statusFilter, deptFilter, roleFilter, sortBy, sortAsc])

    const isAllSelected = filteredStaff.length > 0 && selectedIds.length === filteredStaff.length

    const toggleSelectAll = () => {
        if (isAllSelected) setSelectedIds([])
        else setSelectedIds(filteredStaff.map(s => s.id))
    }

    const toggleSelectRow = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

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
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Staff Directory</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.025em' }}>
                            Staff Directory & Operational Personnel
                        </h1>
                        <p style={{ fontSize: 14, color: '#64748B', margin: '6px 0 0', lineHeight: 1.5 }}>
                            Manage administrative personnel, configure operational roles, assign department permissions, and issue portal credentials.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={handleExportCSV}
                            disabled={staffList.length === 0}
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
                                cursor: staffList.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: staffList.length === 0 ? 0.6 : 1,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                transition: '0.15s'
                            }}
                        >
                            <Download size={15} /> Export Directory (CSV)
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
                        >
                            <UserPlus size={16} /> Add Staff Member
                        </button>
                    </div>
                </div>
            </div>

            {/* EXECUTIVE METRIC CARDS (OPENAI STYLE) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                {/* Total Staff */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Total Staff</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004B93' }}>
                            <Users size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {loading ? '—' : stats.total_staff}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>
                        {stats.active_staff} Active • {stats.suspended_staff} Suspended
                    </div>
                </div>

                {/* Active Personnel */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Active Personnel</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 26, fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
                            {loading ? '—' : stats.active_staff}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                            {stats.total_staff > 0 ? Math.round((stats.active_staff / stats.total_staff) * 100) : 100}% operational
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Live Access Granted
                    </div>
                </div>

                {/* Operational Departments */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Departments</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                            <Building2 size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {loading ? '—' : stats.departments_count}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
                        Administrative & academic units
                    </div>
                </div>

                {/* Administrator Access */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Admin Access</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                            <Shield size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {loading ? '—' : stats.admin_count}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
                        Elevated institute coordinators
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
                {/* Search */}
                <div style={{ flex: '1 1 260px', position: 'relative' }}>
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by staff name, email, phone, role, or ID..."
                        style={{
                            width: '100%',
                            padding: '9px 36px 9px 38px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#0F172A',
                            fontWeight: 500,
                            outline: 'none'
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
                    {/* Status Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2px' }}>
                        {(['all', 'active', 'suspended'] as const).map(s => (
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
                                    textTransform: 'capitalize'
                                }}
                            >
                                {s === 'all' ? 'All Status' : s}
                            </button>
                        ))}
                    </div>

                    {/* Department Dropdown */}
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
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
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>

                    {/* Role Dropdown */}
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
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
                        <option value="all">All Roles</option>
                        <option value="tenant_admin">Administrator</option>
                        <option value="platform_staff">Staff Officer</option>
                    </select>

                    {/* Reset Button */}
                    {(search || statusFilter !== 'all' || deptFilter !== 'all' || roleFilter !== 'all') && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setDeptFilter('all'); setRoleFilter('all') }}
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

            {/* BATCH ACTION BAR (WHEN SELECTED) */}
            {selectedIds.length > 0 && (
                <div style={{
                    background: '#0F172A',
                    borderRadius: 12,
                    padding: '12px 20px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#FFFFFF'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600 }}>
                        <span style={{ background: '#334155', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                            {selectedIds.length} Selected
                        </span>
                        <span>Bulk staff management:</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={() => handleBulkStatus(true)}
                            disabled={saving}
                            style={{ background: '#10B981', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
                        >
                            Authorize Access
                        </button>
                        <button
                            onClick={() => handleBulkStatus(false)}
                            disabled={saving}
                            style={{ background: '#334155', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}
                        >
                            Suspend Access
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            style={{ background: 'transparent', border: '1px solid #475569', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#94A3B8', cursor: 'pointer' }}
                        >
                            Deselect
                        </button>
                    </div>
                </div>
            )}

            {/* HIGH-DENSITY DATA TABLE */}
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
                            Loading staff roster...
                        </p>
                    </div>
                ) : filteredStaff.length === 0 ? (
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
                                <Building2 size={36} />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                                {search || statusFilter !== 'all' || deptFilter !== 'all' || roleFilter !== 'all'
                                    ? 'No matching staff members found'
                                    : 'No administrative staff added yet'}
                            </h3>
                            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
                                {search || statusFilter !== 'all'
                                    ? 'Try adjusting your search criteria or resetting your status filters.'
                                    : 'Onboard your administrative officers, accountants, admissions counselors, and IT coordinators to manage institute operations.'}
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
                                <UserPlus size={16} /> Register First Staff Member
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* HEADER ROW */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '44px 2.2fr 1.3fr 1.1fr 1fr 120px 140px',
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
                                <span>Staff Member</span>
                                <ArrowUpDown size={12} />
                            </div>
                            <div
                                onClick={() => { setSortBy('dept'); setSortAsc(!sortAsc) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <span>Department</span>
                                <ArrowUpDown size={12} />
                            </div>
                            <div>Role / Privilege</div>
                            <div>Status</div>
                            <div
                                onClick={() => { setSortBy('recent'); setSortAsc(!sortAsc) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <span>Joined</span>
                                <ArrowUpDown size={12} />
                            </div>
                            <div style={{ textAlign: 'right' }}>Actions</div>
                        </div>

                        {/* ROWS */}
                        {filteredStaff.map((staff, idx) => {
                            const isSelected = selectedIds.includes(staff.id)
                            const initials = `${staff.first_name?.[0] || ''}${staff.last_name?.[0] || ''}`.toUpperCase() || 'ST'
                            const deptName = staff.metadata?.department || 'Administration'
                            const deptStyle = DEPARTMENT_COLORS[deptName] || { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }

                            return (
                                <div
                                    key={staff.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '44px 2.2fr 1.3fr 1.1fr 1fr 120px 140px',
                                        alignItems: 'center',
                                        padding: '16px 24px',
                                        borderBottom: idx === filteredStaff.length - 1 ? 'none' : '1px solid #F1F5F9',
                                        background: isSelected ? '#F0F9FF' : '#FFFFFF',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC' }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#FFFFFF' }}
                                >
                                    {/* Selection */}
                                    <div>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectRow(staff.id)}
                                            style={{ cursor: 'pointer', accentColor: '#004B93' }}
                                        />
                                    </div>

                                    {/* Profile */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                                        <div style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 12,
                                            background: staff.role === 'tenant_admin'
                                                ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)'
                                                : 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
                                            color: '#FFFFFF',
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
                                                    {staff.first_name} {staff.last_name}
                                                </span>
                                                {staff.is_self && (
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#004B93', background: '#EFF6FF', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
                                                        You
                                                    </span>
                                                )}
                                                {staff.metadata?.employee_id && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
                                                        {staff.metadata.employee_id}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                                                <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Mail size={12} color="#94A3B8" /> {staff.email}
                                                </span>
                                                {staff.phone && (
                                                    <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                                        <Phone size={12} color="#94A3B8" /> {staff.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            background: deptStyle.bg,
                                            color: deptStyle.text,
                                            border: `1px solid ${deptStyle.border}`,
                                            borderRadius: 6,
                                            padding: '4px 8px',
                                            display: 'inline-block'
                                        }}>
                                            {deptName}
                                        </span>
                                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: 500 }}>
                                            {staff.metadata?.designation || 'Staff'}
                                        </div>
                                    </div>

                                    {/* Role / Privilege */}
                                    <div>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            background: staff.role === 'tenant_admin' ? '#F5F3FF' : '#F1F5F9',
                                            color: staff.role === 'tenant_admin' ? '#7C3AED' : '#475569',
                                            border: `1px solid ${staff.role === 'tenant_admin' ? '#DDD6FE' : '#E2E8F0'}`,
                                            borderRadius: 6,
                                            padding: '3px 8px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            {staff.role === 'tenant_admin' ? <Shield size={11} /> : <Briefcase size={11} />}
                                            {staff.role === 'tenant_admin' ? 'Administrator' : 'Staff Officer'}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <button
                                            onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                                            disabled={staff.is_self}
                                            title={staff.is_self ? 'Cannot suspend self' : 'Click to toggle status'}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                border: 'none',
                                                background: staff.is_active ? '#DCFCE7' : '#FEE2E2',
                                                color: staff.is_active ? '#15803D' : '#B91C1C',
                                                cursor: staff.is_self ? 'default' : 'pointer',
                                                opacity: staff.is_self ? 0.8 : 1
                                            }}
                                        >
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: staff.is_active ? '#16A34A' : '#EF4444' }} />
                                            {staff.is_active ? 'Active' : 'Suspended'}
                                        </button>
                                    </div>

                                    {/* Joined Date */}
                                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                                        {new Date(staff.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, position: 'relative' }}>
                                        <button
                                            onClick={() => {
                                                setModalPermissions(staff.metadata?.permissions || ['view_records'])
                                                setPermissionStaff(staff)
                                            }}
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
                                                gap: 4
                                            }}
                                        >
                                            <Lock size={12} /> Access
                                        </button>

                                        <button
                                            onClick={e => {
                                                e.stopPropagation()
                                                setActiveMenuId(activeMenuId === staff.id ? null : staff.id)
                                            }}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                background: activeMenuId === staff.id ? '#F1F5F9' : 'transparent',
                                                border: '1px solid ' + (activeMenuId === staff.id ? '#CBD5E1' : 'transparent'),
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#64748B'
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Action Dropdown */}
                                        {activeMenuId === staff.id && (
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
                                                            id: staff.id,
                                                            first_name: staff.first_name,
                                                            last_name: staff.last_name,
                                                            phone: staff.phone || '',
                                                            designation: staff.metadata?.designation || '',
                                                            department: staff.metadata?.department || 'Administration',
                                                            employee_id: staff.metadata?.employee_id || '',
                                                            role: staff.role,
                                                            permissions: staff.metadata?.permissions || []
                                                        })
                                                        setEditingStaff(staff)
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
                                                >
                                                    <Edit3 size={14} color="#64748B" /> Edit Profile
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null)
                                                        handleResetPassword(staff)
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
                                                >
                                                    <KeyRound size={14} color="#64748B" /> Reset Credentials
                                                </button>

                                                {!staff.is_self && (
                                                    <button
                                                        onClick={() => {
                                                            setActiveMenuId(null)
                                                            handleToggleStatus(staff.id, staff.is_active)
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
                                                            color: staff.is_active ? '#B91C1C' : '#15803D',
                                                            cursor: 'pointer',
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        {staff.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                                        {staff.is_active ? 'Suspend Account' : 'Authorize Account'}
                                                    </button>
                                                )}

                                                {!staff.is_self && (
                                                    <>
                                                        <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                                                        <button
                                                            onClick={() => {
                                                                setActiveMenuId(null)
                                                                setDeletingStaff(staff)
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
                                                        >
                                                            <Trash2 size={14} color="#EF4444" /> Delete Staff
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL: ADD STAFF MEMBER ───────────────────────────── */}
            {showAddModal && (
                <Modal
                    title="Register Staff Member"
                    subtitle="Create an administrative or operational personnel account with portal access."
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleCreateStaff}
                    saving={saving}
                    submitText="Complete Registration"
                    maxWidth={620}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    First Name <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={staffForm.first_name}
                                    onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })}
                                    placeholder="e.g. Rachel"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={staffForm.last_name}
                                    onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })}
                                    placeholder="e.g. Zane"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={staffForm.email}
                                    onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                                    placeholder="rachel.zane@institute.org"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={staffForm.phone}
                                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Department
                                </label>
                                <select
                                    value={staffForm.department}
                                    onChange={e => setStaffForm({ ...staffForm, department: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                                >
                                    {departments.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Operational Role
                                </label>
                                <select
                                    value={staffForm.role}
                                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value as any })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                                >
                                    <option value="platform_staff">Staff Officer</option>
                                    <option value="tenant_admin">Administrator</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Designation / Job Title
                                </label>
                                <input
                                    type="text"
                                    value={staffForm.designation}
                                    onChange={e => setStaffForm({ ...staffForm, designation: e.target.value })}
                                    placeholder="e.g. Senior Accountant, Admissions In-Charge"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Employee ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={staffForm.employee_id}
                                    onChange={e => setStaffForm({ ...staffForm, employee_id: e.target.value })}
                                    placeholder="e.g. STF-2010"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── MODAL: EDIT STAFF ─────────────────────────────────── */}
            {editingStaff && (
                <Modal
                    title="Edit Staff Member"
                    subtitle="Update personal, departmental, or role details."
                    onClose={() => setEditingStaff(null)}
                    onSubmit={handleUpdateStaff}
                    saving={saving}
                    submitText="Save Profile"
                    maxWidth={540}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Department</label>
                                <select
                                    value={editForm.department}
                                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, background: '#FFFFFF' }}
                                >
                                    {departments.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Operational Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                                    disabled={editingStaff.is_self}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, background: '#FFFFFF' }}
                                >
                                    <option value="platform_staff">Staff Officer</option>
                                    <option value="tenant_admin">Administrator</option>
                                </select>
                            </div>
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

            {/* ── MODAL: PERMISSIONS MATRIX ─────────────────────────── */}
            {permissionStaff && (
                <Modal
                    title={`Permissions: ${permissionStaff.first_name} ${permissionStaff.last_name}`}
                    subtitle="Configure operational capabilities and access rights across institute modules."
                    onClose={() => setPermissionStaff(null)}
                    onSubmit={handleSavePermissions}
                    saving={saving}
                    submitText="Save Permissions"
                    maxWidth={540}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {PERMISSION_OPTIONS.map(p => {
                            const active = modalPermissions.includes(p.key)
                            return (
                                <div
                                    key={p.key}
                                    onClick={() => {
                                        setModalPermissions(prev =>
                                            active ? prev.filter(x => x !== p.key) : [...prev, p.key]
                                        )
                                    }}
                                    style={{
                                        padding: '14px 18px',
                                        borderRadius: 12,
                                        border: '1px solid ' + (active ? '#2563EB' : '#E2E8F0'),
                                        background: active ? '#EFF6FF' : '#FFFFFF',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: '0.15s'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#1D4ED8' : '#0F172A' }}>
                                            {p.label}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                            {p.desc}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 6,
                                        border: '2px solid ' + (active ? '#2563EB' : '#CBD5E1'),
                                        background: active ? '#2563EB' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {active && <Check size={14} color="#FFFFFF" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Modal>
            )}

            {/* ── MODAL: CREDENTIALS ────────────────────────────────── */}
            {credentialModal && (
                <Modal
                    title="Staff Portal Credentials"
                    subtitle="Share these credentials with the employee to enable portal login."
                    onClose={() => setCredentialModal(null)}
                    maxWidth={480}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Staff Member</div>
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
                                        navigator.clipboard.writeText(`BeBrilliant Staff Portal Login:\nEmail: ${credentialModal.email}\nPassword: ${credentialModal.pass}\nURL: ${window.location.origin}/login`)
                                        setToast({ msg: 'Credentials copied to clipboard!', ok: true })
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#004B93', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                                >
                                    <Copy size={14} /> Copy
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                            The staff member will use these credentials to access the administrative portal according to their granted module permissions.
                        </p>
                    </div>
                </Modal>
            )}

            {/* ── MODAL: DELETE CONFIRMATION ────────────────────────── */}
            {deletingStaff && (
                <Modal
                    title="Confirm Staff Removal"
                    subtitle="Are you sure you want to remove this staff member?"
                    onClose={() => setDeletingStaff(null)}
                    onSubmit={handleDeleteStaff}
                    saving={saving}
                    submitText="Yes, Remove Staff"
                    maxWidth={460}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <AlertCircle size={20} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: 13, color: '#991B1B', lineHeight: 1.4 }}>
                                This will remove <strong>{deletingStaff.first_name} {deletingStaff.last_name}</strong> from the staff directory and revoke all portal permissions.
                            </p>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                            To temporarily pause access instead without deleting records, you can click <strong>Cancel</strong> and toggle their status to <em>Suspended</em>.
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    )
}