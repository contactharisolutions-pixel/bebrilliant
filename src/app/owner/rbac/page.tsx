'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Shield, Users, Key, Lock, RefreshCw, Search, X, Loader2,
    CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
    UserCheck, UserX, Crown, User, Activity, Building2, ClipboardList,
    Eye, EyeOff, Pencil, ToggleLeft, ToggleRight, Download, Mail, Plus,
    MoreHorizontal, Clock, Ban, Unlock, RotateCcw, Filter,
    ChevronDown, Send, Trash2, Monitor, Laptop, Smartphone, Copy, Check,
    Sparkles, ArrowUpRight, ShieldAlert, Sliders, Globe, Terminal, FileText
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

// ── OWNER PLATFORM STAFF ROLE STYLING ─────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; badge: string; desc: string }> = {
    owner: {
        label: 'Platform Owner',
        color: '#004B93',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        badge: '👑',
        desc: 'Unrestricted super-admin authority across all schools, billing, settings & permissions.'
    },
    admin: {
        label: 'Administrator',
        color: '#1D4ED8',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        badge: '⚙️',
        desc: 'Administrative access for system configurations, school oversight, and staff management.'
    },
    platform_staff: {
        label: 'Platform Staff',
        color: '#6D28D9',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        badge: '🛡️',
        desc: 'Operational management across syllabus, exam monitoring, and customer escalations.'
    },
    sales_exec: {
        label: 'Sales Executive',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        badge: '💼',
        desc: 'Institutional leads, school onboarding pipeline, subscriptions, and commission tracking.'
    },
    demo_exec: {
        label: 'Demo Executive',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        badge: '📺',
        desc: 'Live demonstration schedules, feature presentations, and sandbox walkthroughs.'
    },
    onboarding_spec: {
        label: 'Onboarding Specialist',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        badge: '🚀',
        desc: 'Curriculum mapping, institutional data migration, teacher training, and setup assistance.'
    },
    support: {
        label: 'Support Staff',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        badge: '🎧',
        desc: 'Frontline ticketing, exam grievance handling, and user support resolution.'
    },
}

const PLATFORM_STAFF_ROLES = ['owner', 'admin', 'platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec', 'support']

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000)
        return () => clearTimeout(t)
    }, [onClose])
    const isOk = type === 'success'
    return (
        <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 10000,
            background: isOk ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isOk ? '#10B981' : '#EF4444'}50`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: isOk ? '#065F46' : '#991B1B', fontSize: 13, fontWeight: 800,
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)', backdropFilter: 'blur(8px)'
        }}>
            {isOk ? <CheckCircle size={20} color="#059669" /> : <AlertTriangle size={20} color="#DC2626" />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}>
                <X size={14} />
            </button>
        </div>
    )
}

export default function StaffPermissionsPage() {
    const [tab, setTab] = useState<'users' | 'roles' | 'invites' | 'audit' | 'sessions'>('users')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    // User Directory state
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)

    // Permissions state
    const [permData, setPermData] = useState<any>(null)
    const [permLoading, setPermLoading] = useState(false)
    const [permSaving, setPermSaving] = useState<Record<string, boolean>>({})
    const [permSearch, setPermSearch] = useState('')
    const [permModuleFilter, setPermModuleFilter] = useState('all')

    // Invites state
    const [invites, setInvites] = useState<any[]>([])
    const [invitesLoading, setInvitesLoading] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteForm, setInviteForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'platform_staff',
        password: '',
    })
    const [inviteShowPassword, setInviteShowPassword] = useState(false)
    const [inviteSaving, setInviteSaving] = useState(false)

    // Edit Staff Modal State
    const [editTarget, setEditTarget] = useState<any>(null)
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'platform_staff',
        is_active: true
    })
    const [editSaving, setEditSaving] = useState(false)

    // Delete Staff Modal State
    const [deleteTarget, setDeleteTarget] = useState<any>(null)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deleteSaving, setDeleteSaving] = useState(false)

    // Reset Password Modal State
    const [resetTarget, setResetTarget] = useState<any>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswordText, setShowPasswordText] = useState(false)
    const [resetSaving, setResetSaving] = useState(false)
    const [resetModalError, setResetModalError] = useState<string | null>(null)

    // Suspend Modal State
    const [suspendTarget, setSuspendTarget] = useState<any>(null)
    const [suspendReason, setSuspendReason] = useState('')
    const [suspendSaving, setSuspendSaving] = useState(false)

    // Audit log state
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [auditFilter, setAuditFilter] = useState('all')
    const [auditSeverity, setAuditSeverity] = useState('all')
    const [auditSearch, setAuditSearch] = useState('')

    // Active Sessions state
    const [activeSessions, setActiveSessions] = useState([
        {
            id: 'sess-1',
            user: 'Divyesh Solanki (You)',
            role: 'Platform Owner',
            device: 'Windows Desktop (Workstation-HQ)',
            browser: 'Chrome 128.0 (Windows 11)',
            ip: '103.21.144.62 (Bangalore, IN)',
            current: true,
            started: 'Today at 09:15 AM',
            lastActive: 'Just now'
        },
        {
            id: 'sess-2',
            user: 'Oliver Onboarding',
            role: 'Onboarding Specialist',
            device: 'MacBook Pro 16"',
            browser: 'Safari 17.4 (macOS Sonoma)',
            ip: '49.37.12.18 (Mumbai, IN)',
            current: false,
            started: 'Today at 10:45 AM',
            lastActive: '12 mins ago'
        },
        {
            id: 'sess-3',
            user: 'David Demo',
            role: 'Demo Executive',
            device: 'Dell Latitude 7420',
            browser: 'Chrome 127.0 (Windows 10)',
            ip: '122.161.45.90 (Delhi, IN)',
            current: false,
            started: 'Yesterday at 04:30 PM',
            lastActive: '45 mins ago'
        },
        {
            id: 'sess-4',
            user: 'Sarah Sales',
            role: 'Sales Executive',
            device: 'iPad Pro 12.9" M2',
            browser: 'Mobile Safari 17.5 (iOS)',
            ip: '117.200.32.14 (Hyderabad, IN)',
            current: false,
            started: 'Today at 01:20 PM',
            lastActive: '3 mins ago'
        }
    ])
    const [sessionTimeout, setSessionTimeout] = useState('8h')
    const [require2FA, setRequire2FA] = useState(true)

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    // Fetch initial directory data
    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({
                search, role: roleFilter, page: String(page)
            })
            const res = await fetch(`/api/owner/rbac?${params}`)
            if (res.ok) setData(await res.json())
        } catch (e) {
            showToast('Failed loading staff permissions data.', 'error')
        } finally {
            setLoading(false); setRefreshing(false)
        }
    }, [search, roleFilter, page])

    // Fetch permissions matrix
    const fetchPermissions = useCallback(async () => {
        setPermLoading(true)
        try {
            const res = await fetch('/api/owner/rbac/permissions')
            if (res.ok) setPermData(await res.json())
        } catch (e) {
            console.error(e)
        } finally {
            setPermLoading(false)
        }
    }, [])

    // Fetch invites
    const fetchInvites = useCallback(async () => {
        setInvitesLoading(true)
        try {
            const res = await fetch('/api/owner/rbac/invites')
            if (res.ok) {
                const d = await res.json()
                setInvites(d.invites ?? [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setInvitesLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { if (tab === 'roles') fetchPermissions() }, [tab, fetchPermissions])
    useEffect(() => { if (tab === 'invites') fetchInvites() }, [tab, fetchInvites])
    useEffect(() => {
        if (data?.auditLogs) setAuditLogs(data.auditLogs)
    }, [data])

    // Toggle Active/Suspend
    const handleToggleActive = async (user: any) => {
        try {
            const res = await fetch(`/api/owner/rbac/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !user.is_active })
            })
            if (!res.ok) throw new Error('Toggle active failed')
            showToast(user.is_active ? `Staff user ${user.first_name || ''} suspended.` : `Staff user ${user.first_name || ''} activated.`, 'success')
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        }
    }

    // Submit Suspension
    const handleSuspendSubmit = async () => {
        if (!suspendTarget) return
        if (!suspendReason.trim()) return showToast('Please state a reason for suspension.', 'error')
        setSuspendSaving(true)
        try {
            const res = await fetch(`/api/owner/rbac/users/${suspendTarget.id}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: suspendReason })
            })
            if (!res.ok) throw new Error((await res.json()).error || 'Suspend failed')
            showToast(`User ${suspendTarget.email} has been suspended.`, 'success')
            setSuspendTarget(null)
            setSuspendReason('')
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSuspendSaving(false)
        }
    }

    // Open Edit Modal
    const openEditModal = (user: any) => {
        setEditTarget(user)
        setEditForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || 'platform_staff',
            is_active: user.is_active ?? true
        })
    }

    // Handle Edit Submit
    const handleEditSubmit = async () => {
        if (!editTarget) return
        if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
            return showToast('First and last name are required.', 'error')
        }
        setEditSaving(true)
        try {
            const res = await fetch(`/api/owner/rbac/users/${editTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Failed to update staff member')
            showToast(`Staff member ${editForm.first_name} ${editForm.last_name} updated successfully!`, 'success')
            setEditTarget(null)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setEditSaving(false)
        }
    }

    // Open Delete Modal
    const openDeleteModal = (user: any) => {
        setDeleteTarget(user)
        setDeleteConfirmText('')
    }

    // Handle Delete Submit
    const handleDeleteSubmit = async () => {
        if (!deleteTarget) return
        setDeleteSaving(true)
        try {
            const res = await fetch(`/api/owner/rbac/users/${deleteTarget.id}`, {
                method: 'DELETE'
            })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Failed to delete staff member')
            showToast(`Staff account for ${deleteTarget.email} has been permanently deleted.`, 'success')
            setDeleteTarget(null)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setDeleteSaving(false)
        }
    }

    // Generate random password
    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
        let pwd = ''
        for (let i = 0; i < 12; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setNewPassword(pwd)
        setConfirmPassword(pwd)
    }

    // Password Reset
    const handleDirectPasswordReset = async () => {
        if (!resetTarget) return
        setResetModalError(null)
        if (!newPassword || newPassword.length < 6) {
            setResetModalError('Password must be at least 6 characters long.')
            return showToast('Password must be at least 6 characters long.', 'error')
        }
        if (newPassword !== confirmPassword) {
            setResetModalError('Password confirmation does not match.')
            return showToast('Password confirmation does not match.', 'error')
        }

        setResetSaving(true)
        try {
            const res = await fetch(`/api/owner/rbac/users/${resetTarget.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Password update failed')

            showToast(`Password successfully reset for ${resetTarget.email}!`, 'success')
            setResetTarget(null)
            setNewPassword('')
            setConfirmPassword('')
            setResetModalError(null)
            fetchData(true)
        } catch (e: any) {
            setResetModalError(e.message)
            showToast(e.message, 'error')
        } finally {
            setResetSaving(false)
        }
    }

    // Permissions matrix toggle
    const handlePermissionToggle = async (roleId: string, permId: string, currentlyGranted: boolean) => {
        const key = `${roleId}-${permId}`
        setPermSaving(s => ({ ...s, [key]: true }))
        try {
            const res = await fetch('/api/owner/rbac/permissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role_id: roleId, permission_id: permId, grant: !currentlyGranted })
            })
            if (res.ok) {
                fetchPermissions()
                showToast(!currentlyGranted ? 'Permission granted to role.' : 'Permission revoked from role.', 'success')
            }
        } catch {
            showToast('Failed to update permission.', 'error')
        } finally {
            setPermSaving(s => ({ ...s, [key]: false }))
        }
    }

    const generateInvitePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
        let pwd = ''
        for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
        setInviteForm(f => ({ ...f, password: pwd }))
    }

    const handleSendInvite = async () => {
        if (!inviteForm.first_name.trim() || !inviteForm.last_name.trim()) return showToast('Please enter the staff member\'s first and last name.', 'error')
        if (!inviteForm.email.trim()) return showToast('Please enter a valid email address.', 'error')
        if (!inviteForm.password || inviteForm.password.length < 6) return showToast('Password must be at least 6 characters long.', 'error')
        setInviteSaving(true)
        try {
            const res = await fetch('/api/owner/rbac/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm)
            })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Failed to create staff account')
            showToast(`Staff account created for ${inviteForm.email}!`, 'success')
            setShowInviteModal(false)
            setInviteForm({ first_name: '', last_name: '', email: '', role: 'platform_staff', password: '' })
            setInviteShowPassword(false)
            fetchInvites()
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setInviteSaving(false)
        }
    }

    const handleRevokeInvite = async (id: string) => {
        if (!confirm('Revoke this staff invitation link?')) return
        try {
            const res = await fetch(`/api/owner/rbac/invites/${id}`, { method: 'DELETE' })
            if (res.ok) {
                showToast('Staff invitation revoked.', 'success')
                fetchInvites()
            }
        } catch (e: any) {
            showToast(e.message, 'error')
        }
    }

    const terminateSession = (id: string) => {
        setActiveSessions(s => s.filter(x => x.id !== id))
        showToast('Session terminated successfully.', 'success')
    }

    const exportUsers = () => {
        const params = new URLSearchParams({ search, role: roleFilter })
        window.open(`/api/owner/rbac/users/export?${params}`, '_blank')
    }

    const users = data?.users ?? []
    const stats = data?.stats ?? {}
    const filteredLogs = auditLogs
        .filter(l => auditSeverity === 'all' || l.severity === auditSeverity)
        .filter(l => auditFilter === 'all' || l.module === auditFilter)
        .filter(l => !auditSearch || l.action.toLowerCase().includes(auditSearch.toLowerCase()) || JSON.stringify(l.details || {}).toLowerCase().includes(auditSearch.toLowerCase()))

    const totalPages = Math.ceil((data?.usersTotal ?? 0) / 25)

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Shield size={24} color={P.brand} />
                </div>
                <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: P.muted }}>Loading Enterprise Staff Security & RBAC...</p>
            </div>
        )
    }

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '32px 36px', fontFamily: 'var(--font-sans)', color: '#0F172A' }}>
            <style>{GLASS_STYLES + `
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulseGlow { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6)); } }
                .hover-scale { transition: transform 0.15s ease, box-shadow 0.15s ease; }
                .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); }
                .action-btn { transition: all 0.15s ease; }
                .action-btn:hover { filter: brightness(0.95); transform: translateY(-1px); }
            `}</style>
            
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── HEADER ──────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 9999, marginBottom: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 6px #2563EB' }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SETTINGS & CONTROLS</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>
                        Staff Permissions
                    </h1>
                    <p style={{ color: '#64748B', margin: '6px 0 0', fontWeight: 600, fontSize: 14 }}>
                        Control and manage platform staff team members, access roles, invitations, and passwords.
                    </p>
                </div>
                
                {/* Header Action Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="action-btn"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF',
                            border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 18px',
                            fontSize: 13, fontWeight: 800, color: '#1E293B', cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <RefreshCw size={15} color="#004B93" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        Sync Data
                    </button>
                    
                    <button
                        onClick={exportUsers}
                        className="action-btn"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF',
                            border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 18px',
                            fontSize: 13, fontWeight: 800, color: '#1E293B', cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Download size={15} color="#004B93" />
                        Export CSV
                    </button>
                    
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="action-btn"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: '#004B93',
                            color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '10px 22px',
                            fontSize: 13, fontWeight: 900, cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0, 75, 147, 0.28)'
                        }}
                    >
                        <Plus size={16} strokeWidth={3} />
                        Invite Staff
                    </button>
                </div>
            </div>

            {/* ── 4 KPI OVERVIEW CARDS ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 26 }}>
                {[
                    {
                        title: 'TOTAL PLATFORM STAFF',
                        value: String(stats.totalUsers ?? 0),
                        icon: Users,
                        color: '#004B93',
                        bg: '#EFF6FF',
                        badge: 'All Active & Pending'
                    },
                    {
                        title: 'ACTIVE STAFF',
                        value: String(stats.activeUsers ?? 0),
                        icon: UserCheck,
                        color: '#059669',
                        bg: '#ECFDF5',
                        badge: '100% Operational'
                    },
                    {
                        title: 'SUSPENDED STAFF',
                        value: String((stats.totalUsers ?? 0) - (stats.activeUsers ?? 0)),
                        icon: UserX,
                        color: '#DC2626',
                        bg: '#FEF2F2',
                        badge: 'Zero Breaches'
                    },
                    {
                        title: 'ROLES DEFINED',
                        value: String(stats.totalRoles ?? 9),
                        icon: Shield,
                        color: '#7C3AED',
                        bg: '#F5F3FF',
                        badge: 'Enterprise Matrix'
                    }
                ].map((k, i) => {
                    const Icon = k.icon
                    return (
                        <div
                            key={i}
                            className="hover-scale"
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 20,
                                padding: '20px 22px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={22} color={k.color} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: k.color, background: k.bg, padding: '4px 10px', borderRadius: 8 }}>
                                    {k.badge}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                    {k.title}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.02em' }}>
                                    {k.value}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── NAVIGATION TABS ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 5, marginBottom: 24, width: 'fit-content', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                {[
                    { key: 'users', label: 'User Directory', count: data?.usersTotal },
                    { key: 'roles', label: 'Role Management' },
                    { key: 'invites', label: 'Staff Invitations', count: invites.filter(i => i.status === 'pending').length || undefined },
                    { key: 'audit', label: 'Activity History', count: filteredLogs.length || undefined },
                    { key: 'sessions', label: 'Active Sessions', count: activeSessions.length }
                ].map(t => {
                    const isActive = tab === t.key
                    return (
                        <button
                            key={t.key}
                            onClick={() => { setTab(t.key as any); setSearch(''); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, border: 'none',
                                cursor: 'pointer', fontSize: 13, fontWeight: 800,
                                background: isActive ? '#004B93' : 'transparent',
                                color: isActive ? '#FFFFFF' : '#64748B',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>{t.label}</span>
                            {t.count !== undefined && t.count > 0 && (
                                <span style={{
                                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                                    color: isActive ? '#FFFFFF' : '#475569',
                                    borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 900
                                }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 1: USER DIRECTORY ───────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'users' && (
                <div>
                    {/* Role Filter Badges */}
                    {(data?.roleDistribution ?? []).some((r: any) => r.count > 0) && (
                        <div style={{
                            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
                            padding: '12px 18px', marginBottom: 18, display: 'flex', gap: 8,
                            flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
                                Filter By Role:
                            </span>
                            {(data?.roleDistribution ?? []).filter((r: any) => r.count > 0).map((row: any) => {
                                const cfg = ROLE_CONFIG[row.role] ?? ROLE_CONFIG.platform_staff
                                const isSelected = roleFilter === row.role
                                return (
                                    <button
                                        key={row.role}
                                        onClick={() => { setRoleFilter(isSelected ? 'all' : row.role); setPage(1); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10,
                                            border: `1px solid ${isSelected ? cfg.color : '#E2E8F0'}`,
                                            background: isSelected ? cfg.bg : '#F8FAFC',
                                            cursor: 'pointer', fontSize: 12, fontWeight: 800, color: cfg.color,
                                            boxShadow: isSelected ? `0 2px 8px ${cfg.color}25` : 'none',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <span>{cfg.badge}</span>
                                        <span>{cfg.label}</span>
                                        <span style={{
                                            background: isSelected ? cfg.color : '#E2E8F0',
                                            color: isSelected ? '#FFFFFF' : '#475569',
                                            borderRadius: 9999, padding: '1px 7px', fontSize: 10, fontWeight: 900
                                        }}>
                                            {row.count}
                                        </span>
                                    </button>
                                )
                            })}
                            {roleFilter !== 'all' && (
                                <button
                                    onClick={() => { setRoleFilter('all'); setPage(1); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                                        borderRadius: 10, border: '1px dashed #CBD5E1', background: 'transparent',
                                        cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#64748B'
                                    }}
                                >
                                    <X size={13} /> Clear
                                </button>
                            )}
                        </div>
                    )}

                    {/* Search & Filter Bar */}
                    <div style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
                        padding: '12px 18px', marginBottom: 18, display: 'flex', gap: 12,
                        alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search staff by name or email address..."
                                style={{
                                    width: '100%', paddingLeft: 42, paddingRight: 36, paddingTop: 10, paddingBottom: 10,
                                    border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, color: '#0F172A',
                                    outline: 'none', fontWeight: 600, boxSizing: 'border-box', background: '#F8FAFC'
                                }}
                            />
                            {search && (
                                <button
                                    onClick={() => { setSearch(''); setPage(1); }}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <X size={14} color="#94A3B8" />
                                </button>
                            )}
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{
                                padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 12,
                                fontSize: 13, background: '#F8FAFC', outline: 'none', fontWeight: 700, color: '#1E293B', cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Staff</option>
                            <option value="suspended">Suspended Staff</option>
                        </select>

                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 800, marginLeft: 'auto' }}>
                            {data?.usersTotal ?? 0} Total Staff
                        </span>
                    </div>

                    {/* Staff Users Table */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    {['Staff Member', 'Role', 'Status', 'Date Joined', 'Actions'].map(h => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '16px 22px', textAlign: 'left', fontSize: 11,
                                                fontWeight: 900, color: '#64748B', textTransform: 'uppercase',
                                                letterSpacing: '0.08em'
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users
                                    .filter((u: any) => statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active))
                                    .map((u: any) => {
                                        const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.platform_staff
                                        const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unnamed Staff'
                                        return (
                                            <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                {/* Staff Member */}
                                                <td style={{ padding: '16px 22px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: 12, background: cfg.bg,
                                                            border: `1px solid ${cfg.border}`, display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
                                                        }}>
                                                            {cfg.badge}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                                                                {fullName}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td style={{ padding: '16px 22px' }}>
                                                    <span style={{
                                                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                                                        display: 'inline-flex', alignItems: 'center', gap: 6
                                                    }}>
                                                        <span>{cfg.badge}</span>
                                                        <span>{cfg.label}</span>
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td style={{ padding: '16px 22px' }}>
                                                    <span style={{
                                                        background: u.is_active ? '#ECFDF5' : '#FEF2F2',
                                                        color: u.is_active ? '#059669' : '#DC2626',
                                                        border: `1px solid ${u.is_active ? '#A7F3D0' : '#FECACA'}`,
                                                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900,
                                                        display: 'inline-flex', alignItems: 'center', gap: 6
                                                    }}>
                                                        <span style={{
                                                            width: 6, height: 6, borderRadius: '50%',
                                                            background: u.is_active ? '#059669' : '#DC2626'
                                                        }} />
                                                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                                                    </span>
                                                </td>

                                                {/* Date Joined */}
                                                <td style={{ padding: '16px 22px', fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                                                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>

                                                {/* Actions (Edit, Suspend/Activate, Reset Password, Delete) */}
                                                <td style={{ padding: '16px 22px' }}>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        {/* EDIT BUTTON */}
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            title="Edit staff profile and role"
                                                            className="action-btn"
                                                            style={{
                                                                padding: '7px 12px', background: '#F8FAFC',
                                                                border: '1px solid #CBD5E1', borderRadius: 9,
                                                                color: '#0F172A', fontWeight: 800, fontSize: 12,
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                                                            }}
                                                        >
                                                            <Pencil size={13} color="#004B93" />
                                                            Edit
                                                        </button>

                                                        {/* SUSPEND / ACTIVATE BUTTON */}
                                                        <button
                                                            onClick={() => u.is_active ? setSuspendTarget(u) : handleToggleActive(u)}
                                                            className="action-btn"
                                                            style={{
                                                                padding: '7px 12px',
                                                                background: u.is_active ? '#FEF2F2' : '#ECFDF5',
                                                                border: `1px solid ${u.is_active ? '#FECACA' : '#A7F3D0'}`,
                                                                borderRadius: 9,
                                                                color: u.is_active ? '#DC2626' : '#059669',
                                                                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: 5
                                                            }}
                                                        >
                                                            {u.is_active ? <Ban size={13} /> : <Unlock size={13} />}
                                                            {u.is_active ? 'Suspend' : 'Activate'}
                                                        </button>

                                                        {/* RESET PASSWORD BUTTON */}
                                                        <button
                                                            onClick={() => { setResetTarget(u); setNewPassword(''); setConfirmPassword(''); }}
                                                            className="action-btn"
                                                            style={{
                                                                padding: '7px 12px', background: '#EFF6FF',
                                                                border: '1px solid #BFDBFE', borderRadius: 9,
                                                                color: '#1E40AF', fontWeight: 800, fontSize: 12,
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                                                            }}
                                                        >
                                                            <Key size={13} />
                                                            Reset Password
                                                        </button>

                                                        {/* DELETE BUTTON */}
                                                        <button
                                                            onClick={() => openDeleteModal(u)}
                                                            title="Permanently remove staff member"
                                                            className="action-btn"
                                                            style={{
                                                                padding: '7px 10px', background: '#FEF2F2',
                                                                border: '1px solid #FCA5A5', borderRadius: 9,
                                                                color: '#DC2626', fontWeight: 800, fontSize: 12,
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                                            }}
                                                        >
                                                            <Trash2 size={13} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, border: '1px solid #E2E8F0',
                                    background: '#FFFFFF', cursor: page === 1 ? 'not-allowed' : 'pointer',
                                    fontWeight: 800, fontSize: 13, color: '#0F172A'
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#64748B' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, border: '1px solid #E2E8F0',
                                    background: '#FFFFFF', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                    fontWeight: 800, fontSize: 13, color: '#0F172A'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 2: ROLE MANAGEMENT (PERMISSION MATRIX) ──────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'roles' && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    {/* Header */}
                    <div style={{ padding: '22px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#0F172A' }}>Enterprise Role Permission Matrix</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                Interactive matrix to grant or revoke granular feature permissions across all platform staff roles.
                            </p>
                        </div>

                        {/* Search & Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    value={permSearch}
                                    onChange={e => setPermSearch(e.target.value)}
                                    placeholder="Search permissions..."
                                    style={{
                                        paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                                        border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, color: '#0F172A',
                                        outline: 'none', fontWeight: 600, background: '#F8FAFC'
                                    }}
                                />
                            </div>

                            {permLoading && <Loader2 size={18} color="#004B93" style={{ animation: 'spin 1s linear infinite' }} />}
                        </div>
                    </div>

                    {/* Matrix Table */}
                    {permData && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 260 }}>
                                            Permission Module & Action
                                        </th>
                                        {(permData.roles ?? []).map((r: any) => (
                                            <th key={r.id} style={{ padding: '16px 14px', textAlign: 'center', fontSize: 11, fontWeight: 900, color: '#004B93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <div>{ROLE_CONFIG[r.name]?.badge}</div>
                                                <div style={{ marginTop: 4 }}>{ROLE_CONFIG[r.name]?.label ?? r.name}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(permData.matrix ?? [])
                                        .filter((group: any) => !permSearch || group.permissions.some((p: any) => p.action.toLowerCase().includes(permSearch.toLowerCase()) || p.key.toLowerCase().includes(permSearch.toLowerCase())))
                                        .map((group: any) => {
                                            const filteredPermissions = group.permissions.filter((p: any) => !permSearch || p.action.toLowerCase().includes(permSearch.toLowerCase()) || p.key.toLowerCase().includes(permSearch.toLowerCase()))
                                            if (filteredPermissions.length === 0) return null

                                            return (
                                                <React.Fragment key={group.module}>
                                                    <tr>
                                                        <td colSpan={(permData.roles?.length ?? 0) + 1} style={{ padding: '12px 24px', background: '#EFF6FF', fontSize: 11, fontWeight: 950, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                            {group.module.toUpperCase()} MODULE • {filteredPermissions.length} CONTROLS
                                                        </td>
                                                    </tr>
                                                    {filteredPermissions.map((perm: any) => (
                                                        <tr key={perm.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                            <td style={{ padding: '14px 24px' }}>
                                                                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                                                                    {perm.action}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                                                                    {perm.description || perm.key}
                                                                </div>
                                                            </td>
                                                            {(permData.roles ?? []).map((role: any) => {
                                                                const granted = perm.assignedRoles.includes(role.name)
                                                                const key = `${role.id}-${perm.id}`
                                                                const saving = permSaving[key]
                                                                return (
                                                                    <td key={role.id} style={{ padding: '14px 14px', textAlign: 'center' }}>
                                                                        {saving ? (
                                                                            <Loader2 size={16} color="#004B93" style={{ animation: 'spin 1s linear infinite', margin: 'auto' }} />
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handlePermissionToggle(role.id, perm.id, granted)}
                                                                                title={granted ? `Revoke ${perm.action} from ${role.name}` : `Grant ${perm.action} to ${role.name}`}
                                                                                style={{
                                                                                    width: 28, height: 28, borderRadius: 8,
                                                                                    border: `1.5px solid ${granted ? '#059669' : '#CBD5E1'}`,
                                                                                    background: granted ? '#059669' : '#FFFFFF',
                                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                                                    justifyContent: 'center', margin: 'auto',
                                                                                    boxShadow: granted ? '0 2px 6px rgba(5, 150, 105, 0.3)' : 'none',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                            >
                                                                                {granted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            )
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 3: STAFF INVITATIONS ────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'invites' && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ padding: '22px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#0F172A' }}>Staff Invitations Directory</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                Active invitation links sent to new staff team members.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="action-btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, background: '#004B93',
                                color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '10px 20px',
                                fontSize: 13, fontWeight: 900, cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(0, 75, 147, 0.25)'
                            }}
                        >
                            <Plus size={16} strokeWidth={3} /> New Staff Invite
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                {['Invited Staff Member', 'Assigned Role', 'Invitation Status', 'Date Invited', 'Expiry Date', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invites.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                                        <Mail size={32} color="#94A3B8" style={{ marginBottom: 12 }} />
                                        <div>No pending staff invitations. Click "New Staff Invite" to send an invitation link.</div>
                                    </td>
                                </tr>
                            ) : (
                                invites.map((inv: any) => {
                                    const cfg = ROLE_CONFIG[inv.role] ?? ROLE_CONFIG.platform_staff
                                    return (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                                                    {[inv.first_name, inv.last_name].filter(Boolean).join(' ') || 'Staff Invite'}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{inv.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>
                                                    {cfg.badge} {cfg.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    background: inv.status === 'pending' ? '#FFFBEB' : '#ECFDF5',
                                                    color: inv.status === 'pending' ? '#D97706' : '#059669',
                                                    border: `1px solid ${inv.status === 'pending' ? '#FDE68A' : '#A7F3D0'}`,
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900
                                                }}>
                                                    {inv.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                                                {new Date(inv.created_at).toLocaleDateString('en-IN')}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                                                {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-IN') : '—'}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {inv.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleRevokeInvite(inv.id)}
                                                        className="action-btn"
                                                        style={{
                                                            padding: '7px 12px', background: '#FEF2F2',
                                                            border: '1px solid #FECACA', borderRadius: 9,
                                                            color: '#DC2626', fontWeight: 800, fontSize: 12,
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                                        }}
                                                    >
                                                        <Trash2 size={13} /> Revoke Invite
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 4: ACTIVITY HISTORY (AUDIT LOGS) ────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'audit' && (
                <div>
                    <div style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
                        padding: '12px 18px', marginBottom: 18, display: 'flex', gap: 12,
                        alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={auditSearch}
                                onChange={e => setAuditSearch(e.target.value)}
                                placeholder="Search audit actions or payload..."
                                style={{
                                    width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                                    border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, color: '#0F172A',
                                    outline: 'none', fontWeight: 600, background: '#F8FAFC', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <select
                            value={auditSeverity}
                            onChange={e => setAuditSeverity(e.target.value)}
                            style={{
                                padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 10,
                                fontSize: 12, background: '#F8FAFC', outline: 'none', fontWeight: 700, color: '#0F172A'
                            }}
                        >
                            <option value="all">All Severity Levels</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>

                        <select
                            value={auditFilter}
                            onChange={e => setAuditFilter(e.target.value)}
                            style={{
                                padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 10,
                                fontSize: 12, background: '#F8FAFC', outline: 'none', fontWeight: 700, color: '#0F172A'
                            }}
                        >
                            <option value="all">All Modules</option>
                            {[...new Set(auditLogs.map(l => l.module))].filter(Boolean).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 800, marginLeft: 'auto' }}>
                            {filteredLogs.length} Logged Events
                        </span>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        {filteredLogs.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                                <ClipboardList size={32} color="#94A3B8" style={{ marginBottom: 12 }} />
                                <div>No activity audit logs found matching your filters.</div>
                            </div>
                        ) : (
                            <div>
                                {filteredLogs.map((log: any, i: number) => {
                                    const isCrit = log.severity === 'critical'
                                    const isWarn = log.severity === 'warning'
                                    const dotColor = isCrit ? '#DC2626' : isWarn ? '#D97706' : '#2563EB'
                                    return (
                                        <div
                                            key={log.id}
                                            style={{
                                                display: 'flex', alignItems: 'flex-start', gap: 16,
                                                padding: '16px 24px', borderBottom: i < filteredLogs.length - 1 ? '1px solid #F1F5F9' : 'none'
                                            }}
                                        >
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, marginTop: 6, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}60` }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                    <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                                                        {log.module}
                                                    </span>
                                                    {log.severity && (
                                                        <span style={{
                                                            background: isCrit ? '#FEF2F2' : isWarn ? '#FFFBEB' : '#F1F5F9',
                                                            color: dotColor, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase'
                                                        }}>
                                                            {log.severity}
                                                        </span>
                                                    )}
                                                </div>
                                                {log.details && (
                                                    <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', display: 'inline-block', marginTop: 4 }}>
                                                        {JSON.stringify(log.details)}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 5: ACTIVE SESSIONS ──────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {tab === 'sessions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Security Policy Summary Bar */}
                    <div style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20,
                        padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={22} color="#004B93" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 950, color: '#0F172A' }}>Enterprise Session Guard</h3>
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Active JWT authentication tracking and device identity validation.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B' }}>Session Timeout:</span>
                                <select
                                    value={sessionTimeout}
                                    onChange={e => { setSessionTimeout(e.target.value); showToast(`Session timeout updated to ${e.target.value}`, 'success'); }}
                                    style={{ padding: '6px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#0F172A', background: '#F8FAFC' }}
                                >
                                    <option value="15m">15 Minutes (High Security)</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="8h">8 Hours (Default)</option>
                                    <option value="24h">24 Hours</option>
                                </select>
                            </div>

                            <button
                                onClick={() => { setRequire2FA(!require2FA); showToast(`2FA enforcement ${!require2FA ? 'enabled' : 'disabled'} for staff`, 'success'); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                                    border: `1px solid ${require2FA ? '#A7F3D0' : '#CBD5E1'}`,
                                    background: require2FA ? '#ECFDF5' : '#F8FAFC',
                                    color: require2FA ? '#059669' : '#64748B',
                                    fontSize: 12, fontWeight: 800, cursor: 'pointer'
                                }}
                            >
                                <Lock size={13} />
                                {require2FA ? '2FA Enforced' : '2FA Optional'}
                            </button>
                        </div>
                    </div>

                    {/* Sessions Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                        {activeSessions.map(sess => (
                            <div
                                key={sess.id}
                                className="hover-scale"
                                style={{
                                    background: '#FFFFFF', border: sess.current ? '1.5px solid #004B93' : '1px solid #E2E8F0',
                                    borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column',
                                    gap: 12, position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                                }}
                            >
                                {sess.current && (
                                    <div style={{
                                        position: 'absolute', top: 16, right: 16,
                                        background: '#EFF6FF', color: '#004B93', border: '1px solid #BFDBFE',
                                        borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 900
                                    }}>
                                        CURRENT SESSION
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: sess.current ? '#EFF6FF' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {sess.device.toLowerCase().includes('mac') || sess.device.toLowerCase().includes('dell') ? (
                                            <Laptop size={20} color={sess.current ? '#004B93' : '#64748B'} />
                                        ) : sess.device.toLowerCase().includes('ipad') ? (
                                            <Smartphone size={20} color={sess.current ? '#004B93' : '#64748B'} />
                                        ) : (
                                            <Monitor size={20} color={sess.current ? '#004B93' : '#64748B'} />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{sess.user}</div>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{sess.role}</div>
                                    </div>
                                </div>

                                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569', fontWeight: 600 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94A3B8' }}>Device / OS:</span>
                                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{sess.device}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94A3B8' }}>Browser:</span>
                                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{sess.browser}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94A3B8' }}>IP & Location:</span>
                                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{sess.ip}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94A3B8' }}>Last Active:</span>
                                        <span style={{ fontWeight: 800, color: sess.current ? '#059669' : '#0F172A' }}>{sess.lastActive}</span>
                                    </div>
                                </div>

                                {!sess.current && (
                                    <button
                                        onClick={() => terminateSession(sess.id)}
                                        className="action-btn"
                                        style={{
                                            marginTop: 4, width: '100%', padding: '8px 12px', background: '#FEF2F2',
                                            border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626',
                                            fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: 6
                                        }}
                                    >
                                        <Ban size={13} /> Terminate Remote Session
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL: EDIT STAFF MEMBER (DYNAMIC & CUSTOMIZABLE) ───────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {editTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                    zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)', padding: 20
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 540,
                        overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '22px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#004B93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Pencil size={18} color="#FFFFFF" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#004B93' }}>Edit Staff Member</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Update staff profile details and assigned platform role.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditTarget(null)}
                                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={16} color="#64748B" />
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>First Name *</label>
                                    <input
                                        value={editForm.first_name}
                                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Name *</label>
                                    <input
                                        value={editForm.last_name}
                                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Platform Role *</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                                >
                                    {PLATFORM_STAFF_ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_CONFIG[r]?.badge} {ROLE_CONFIG[r]?.label}</option>
                                    ))}
                                </select>
                                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                                    {ROLE_CONFIG[editForm.role]?.desc}
                                </p>
                            </div>

                            {/* Active status toggle */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Account Access Status</div>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Enable or temporarily suspend staff login access</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                                    style={{
                                        padding: '6px 14px', borderRadius: 8,
                                        background: editForm.is_active ? '#ECFDF5' : '#FEF2F2',
                                        border: `1px solid ${editForm.is_active ? '#A7F3D0' : '#FECACA'}`,
                                        color: editForm.is_active ? '#059669' : '#DC2626',
                                        fontWeight: 900, fontSize: 12, cursor: 'pointer'
                                    }}
                                >
                                    {editForm.is_active ? 'ACTIVE' : 'SUSPENDED'}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '18px 28px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, background: '#FAFBFD' }}>
                            <button
                                onClick={() => setEditTarget(null)}
                                style={{ flex: 1, padding: 12, background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={editSaving}
                                style={{
                                    flex: 2, padding: 12, background: '#004B93', color: '#FFFFFF', border: 'none',
                                    borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: editSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 4px 14px rgba(0, 75, 147, 0.25)'
                                }}
                            >
                                {editSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                                {editSaving ? 'Saving Changes...' : 'Save Staff Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL: DELETE STAFF CONFIRMATION ────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)', padding: 20
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 480,
                        overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.3)', border: '1px solid #FECACA'
                    }}>
                        <div style={{ padding: '22px 28px', borderBottom: '1px solid #FEE2E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF2F2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={20} color="#DC2626" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#991B1B' }}>Delete Staff Account</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>Irreversible platform operation</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{ background: '#FFFFFF', border: '1px solid #FECACA', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={16} color="#DC2626" />
                            </button>
                        </div>

                        <div style={{ padding: '24px 28px' }}>
                            <p style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.5, margin: '0 0 16px', fontWeight: 600 }}>
                                Are you sure you want to permanently delete the staff account for:
                            </p>
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                                    {[deleteTarget.first_name, deleteTarget.last_name].filter(Boolean).join(' ') || 'Staff Member'}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{deleteTarget.email}</div>
                                <div style={{ fontSize: 11, color: '#004B93', fontWeight: 800, marginTop: 4 }}>Role: {deleteTarget.role}</div>
                            </div>

                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <AlertTriangle size={16} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: 12, color: '#991B1B', fontWeight: 700, lineHeight: 1.5 }}>
                                    This will permanently remove their access profile and credentials from the system. This action cannot be undone.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    style={{ flex: 1, padding: 12, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteSubmit}
                                    disabled={deleteSaving}
                                    style={{
                                        flex: 2, padding: 12, background: '#DC2626', color: '#FFFFFF', border: 'none',
                                        borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: deleteSaving ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
                                    }}
                                >
                                    {deleteSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                                    {deleteSaving ? 'Deleting Account...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL: INVITE STAFF MEMBER ──────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {showInviteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 540, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 90px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }}>
                        {/* Header */}
                        <div style={{ padding: '22px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#004B93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={18} color="#FFFFFF" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#004B93' }}>Invite New Staff Member</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Create an authenticated login account for your platform staff.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowInviteModal(false); setInviteShowPassword(false); }}
                                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={16} color="#64748B" />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>First Name *</label>
                                    <input
                                        value={inviteForm.first_name}
                                        onChange={e => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                                        placeholder="e.g. Rahul"
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Name *</label>
                                    <input
                                        value={inviteForm.last_name}
                                        onChange={e => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                                        placeholder="e.g. Sharma"
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Work Email Address *</label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    placeholder="rahul.sharma@yourcompany.com"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assign Platform Role *</label>
                                <select
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                                >
                                    {PLATFORM_STAFF_ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_CONFIG[r]?.badge} {ROLE_CONFIG[r]?.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Login Password *</label>
                                    <button
                                        onClick={generateInvitePassword}
                                        type="button"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 900, color: '#004B93', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        ⚡ Auto-Generate
                                    </button>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={inviteShowPassword ? 'text' : 'password'}
                                        value={inviteForm.password}
                                        onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                                        placeholder="Set a strong login password (min. 6 characters)"
                                        style={{
                                            width: '100%', padding: '10px 42px 10px 14px',
                                            border: `1px solid ${inviteForm.password && inviteForm.password.length < 6 ? '#FCA5A5' : '#CBD5E1'}`,
                                            borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box',
                                            fontFamily: inviteShowPassword ? 'inherit' : 'monospace'
                                        }}
                                    />
                                    <button
                                        onClick={() => setInviteShowPassword(!inviteShowPassword)}
                                        type="button"
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                                    >
                                        {inviteShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '18px 28px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, background: '#FAFBFD', flexShrink: 0 }}>
                            <button
                                onClick={() => { setShowInviteModal(false); setInviteShowPassword(false); }}
                                style={{ flex: 1, padding: 12, background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendInvite}
                                disabled={inviteSaving}
                                style={{
                                    flex: 2, padding: 12, background: '#004B93', color: '#FFFFFF', border: 'none',
                                    borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: inviteSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 4px 14px rgba(0, 75, 147, 0.25)'
                                }}
                            >
                                {inviteSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserCheck size={16} />}
                                {inviteSaving ? 'Creating Account...' : 'Create Staff Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL: RESET PASSWORD (DIRECT OWNER RESET) ──────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {resetTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                    zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)', padding: 20
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 480,
                        overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0'
                    }}>
                        <div style={{ padding: '22px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#004B93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Key size={18} color="#FFFFFF" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#004B93' }}>Reset Staff Password</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{[resetTarget.first_name, resetTarget.last_name].filter(Boolean).join(' ') || resetTarget.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setResetTarget(null); setResetModalError(null); }}
                                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={16} color="#64748B" />
                            </button>
                        </div>

                        <div style={{ padding: '24px 28px' }}>
                            {resetModalError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontSize: 12, fontWeight: 800 }}>
                                    <AlertTriangle size={15} color="#DC2626" />
                                    <span>{resetModalError}</span>
                                </div>
                            )}

                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Lock size={15} color="#004B93" />
                                <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 700 }}>
                                    Staff Email: <span style={{ color: '#004B93' }}>{resetTarget.email}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Password *</label>
                                    <button
                                        onClick={generateRandomPassword}
                                        type="button"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: '#004B93' }}
                                    >
                                        ⚡ Auto-Generate
                                    </button>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswordText ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Enter new password..."
                                        style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        onClick={() => setShowPasswordText(!showPasswordText)}
                                        type="button"
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                                    >
                                        {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confirm Password *</label>
                                <input
                                    type={showPasswordText ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password to confirm..."
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setResetTarget(null)}
                                    style={{ flex: 1, padding: 12, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDirectPasswordReset}
                                    disabled={resetSaving}
                                    style={{
                                        flex: 2, padding: 12, background: '#004B93', color: '#FFFFFF', border: 'none',
                                        borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(0, 75, 147, 0.25)'
                                    }}
                                >
                                    {resetSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={16} />}
                                    Set New Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL: SUSPEND STAFF MEMBER ─────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {suspendTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)', padding: 20
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 460,
                        overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.25)', border: '1px solid #FECACA'
                    }}>
                        <div style={{ padding: '22px 28px', borderBottom: '1px solid #FEE2E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF2F2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ban size={18} color="#DC2626" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#991B1B' }}>Suspend Staff Member</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7F1D1D', fontWeight: 600 }}>{suspendTarget.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSuspendTarget(null)}
                                style={{ background: '#FFFFFF', border: '1px solid #FECACA', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={16} color="#991B1B" />
                            </button>
                        </div>

                        <div style={{ padding: '24px 28px' }}>
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reason for Suspension *</label>
                                <textarea
                                    value={suspendReason}
                                    onChange={e => setSuspendReason(e.target.value)}
                                    rows={3}
                                    placeholder="State clear operational reason for suspending staff member access..."
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setSuspendTarget(null)}
                                    style={{ flex: 1, padding: 12, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspendSubmit}
                                    disabled={suspendSaving}
                                    style={{
                                        flex: 2, padding: 12, background: '#DC2626', color: '#FFFFFF', border: 'none',
                                        borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)'
                                    }}
                                >
                                    {suspendSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Ban size={16} />}
                                    Confirm Suspend
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
