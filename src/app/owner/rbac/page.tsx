'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Shield, Users, Key, Lock, RefreshCw, Search, X, Loader2,
    CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
    UserCheck, UserX, Crown, User, Activity, Building2, ClipboardList,
    Eye, EyeOff, Pencil, ToggleLeft, ToggleRight, Download, Mail, Plus,
    MoreHorizontal, Clock, Ban, Unlock, RotateCcw, Filter,
    ChevronDown, Send, Trash2, Monitor, Laptop, Smartphone, Copy, Check
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

// ── OWNER PLATFORM STAFF ROLE STYLING ─────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; badge: string }> = {
    owner:            { label: 'Platform Owner',        color: '#004B93', bg: '#EEF4FF', badge: '👑' },
    admin:            { label: 'Administrator',         color: '#1D4ED8', bg: '#EFF6FF', badge: '⚙️' },
    platform_staff:   { label: 'Platform Staff',        color: '#6D28D9', bg: '#F5F3FF', badge: '🛡️' },
    sales_exec:       { label: 'Sales Executive',       color: '#7C3AED', bg: '#F5F3FF', badge: '💼' },
    demo_exec:        { label: 'Demo Executive',        color: '#2563EB', bg: '#EFF6FF', badge: '📺' },
    onboarding_spec:  { label: 'Onboarding Specialist', color: '#059669', bg: '#ECFDF5', badge: '🚀' },
    support:          { label: 'Support Staff',         color: '#D97706', bg: '#FFFBEB', badge: '🎧' },
}

// All valid owner platform staff roles — matches backend OWNER_STAFF_ROLES
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
            border: `1px solid ${isOk ? P.success : P.error}40`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: isOk ? '#065F46' : '#991B1B', fontSize: 13, fontWeight: 800,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
            {isOk ? <CheckCircle size={20} color={P.success} /> : <AlertTriangle size={20} color={P.error} />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}><X size={14} /></button>
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

    // Invites state
    const [invites, setInvites] = useState<any[]>([])
    const [invitesLoading, setInvitesLoading] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)

    // Invite Form state
    const [inviteForm, setInviteForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'platform_staff',
    })
    const [inviteSaving, setInviteSaving] = useState(false)

    // Reset Password Modal State (Direct Owner Password Reset)
    const [resetTarget, setResetTarget] = useState<any>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswordText, setShowPasswordText] = useState(false)
    const [resetSaving, setResetSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    // Audit log state
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [auditFilter, setAuditFilter] = useState('all')
    const [auditSeverity, setAuditSeverity] = useState('all')

    // Modals
    const [suspendTarget, setSuspendTarget] = useState<any>(null)
    const [suspendReason, setSuspendReason] = useState('')
    const [suspendSaving, setSuspendSaving] = useState(false)

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

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

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
        let pwd = ''
        for (let i = 0; i < 12; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setNewPassword(pwd)
        setConfirmPassword(pwd)
    }

    const [resetModalError, setResetModalError] = useState<string | null>(null)

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

    const handleSendInvite = async () => {
        if (!inviteForm.email.trim()) return showToast('Please enter an email address.', 'error')
        setInviteSaving(true)
        try {
            const res = await fetch('/api/owner/rbac/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm)
            })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Failed sending invitation')
            showToast(`Staff invitation sent to ${inviteForm.email}!`, 'success')
            setShowInviteModal(false)
            setInviteForm({ first_name: '', last_name: '', email: '', role: 'platform_staff', tenant_id: '' })
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

    const exportUsers = () => {
        const params = new URLSearchParams({ search, role: roleFilter, tenant: tenantFilter })
        window.open(`/api/owner/rbac/users/export?${params}`, '_blank')
    }

    const users = data?.users ?? []
    const stats = data?.stats ?? {}
    const filteredLogs = auditLogs
        .filter(l => auditSeverity === 'all' || l.severity === auditSeverity)
        .filter(l => auditFilter === 'all' || l.module === auditFilter)

    const totalPages = Math.ceil((data?.usersTotal ?? 0) / 25)

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
                <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand, boxShadow: `0 0 8px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Settings & Controls</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Staff Permissions</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>Control and manage platform staff team members, access roles, invitations, and passwords.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => fetchData(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync Data
                    </button>
                    <button onClick={exportUsers} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <Download size={16} color={P.brand} /> Export CSV
                    </button>
                    <button onClick={() => setShowInviteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                        <Plus size={18} strokeWidth={3} /> Invite Staff
                    </button>
                </div>
            </div>

            {/* KPI OVERVIEW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={Users} title="Total Platform Staff" value={String(stats.totalUsers ?? 0)} color={P.brand} />
                <KpiCard icon={UserCheck} title="Active Staff" value={String(stats.activeUsers ?? 0)} color="#059669" />
                <KpiCard icon={UserX} title="Suspended Staff" value={String((stats.totalUsers ?? 0) - (stats.activeUsers ?? 0))} color="#DC2626" />
                <KpiCard icon={Shield} title="Roles Defined" value={String(stats.totalRoles ?? 0)} color="#7C3AED" />
            </div>

            {/* NAVIGATION TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 4, marginBottom: 28, width: 'fit-content' }}>
                {[
                    { key: 'users', label: 'User Directory', count: data?.usersTotal },
                    { key: 'roles', label: 'Role Management' },
                    { key: 'invites', label: 'Staff Invitations', count: invites.filter(i => i.status === 'pending').length || undefined },
                    { key: 'audit', label: 'Activity History', count: filteredLogs.length || undefined },
                    { key: 'sessions', label: 'Active Sessions' }
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key as any); setSearch(''); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            background: tab === t.key ? P.brand : 'transparent',
                            color: tab === t.key ? '#fff' : P.muted, transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                        {t.count !== undefined && t.count > 0 && (
                            <span style={{ background: tab === t.key ? '#ffffff30' : P.bg, color: tab === t.key ? '#fff' : P.dark, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 900 }}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: USER DIRECTORY ── */}
            {tab === 'users' && (
                <div>
                    {/* Role Filter Pills */}
                    {(data?.roleDistribution ?? []).some((r: any) => r.count > 0) && (
                        <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter By Role:</span>
                            {(data?.roleDistribution ?? []).filter((r: any) => r.count > 0).map((row: any) => {
                                const cfg = ROLE_CONFIG[row.role] ?? ROLE_CONFIG.student
                                const isSelected = roleFilter === row.role
                                return (
                                    <button 
                                        key={row.role} 
                                        onClick={() => { setRoleFilter(isSelected ? 'all' : row.role); setPage(1); }} 
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, 
                                            border: `1px solid ${isSelected ? cfg.color : P.border}`, 
                                            background: isSelected ? cfg.bg : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: cfg.color 
                                        }}
                                    >
                                        <span>{cfg.badge}</span>
                                        <span>{cfg.label}</span>
                                        <span style={{ background: cfg.color, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 900 }}>{row.count}</span>
                                    </button>
                                )
                            })}
                            {roleFilter !== 'all' && (
                                <button onClick={() => { setRoleFilter('all'); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 10, border: `1px dashed ${P.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: P.muted }}>
                                    <X size={13} /> Clear
                                </button>
                            )}
                        </div>
                    )}

                    {/* Search & Filter Controls */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                            <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                value={search} 
                                onChange={e => { setSearch(e.target.value); setPage(1); }} 
                                placeholder="Search staff by name or email address..." 
                                style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: P.dark, outline: 'none', fontWeight: 600, boxSizing: 'border-box' }} 
                            />
                            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={P.muted} /></button>}
                        </div>

                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, background: '#fff', outline: 'none', fontWeight: 700, color: P.dark }}>
                            <option value="all">All Status</option>
                            <option value="active">Active Staff</option>
                            <option value="suspended">Suspended Staff</option>
                        </select>



                        <span style={{ fontSize: 12, color: P.muted, fontWeight: 800 }}>{data?.usersTotal ?? 0} Total Staff</span>
                    </div>

                    {/* Users Directory Table */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                    {['Staff Member', 'Role', 'Status', 'Date Joined', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter((u: any) => statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active)).map((u: any) => {
                                    const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.student
                                    return (
                                        <tr key={u.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 38, height: 38, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.badge}</div>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unnamed Staff'}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                    {cfg.badge} {cfg.label}
                                                </span>
                                            </td>

                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ background: u.is_active ? '#ECFDF5' : '#FEF2F2', color: u.is_active ? '#059669' : '#DC2626', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                    {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                                {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => u.is_active ? setSuspendTarget(u) : handleToggleActive(u)} style={{ padding: '8px 12px', background: u.is_active ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${u.is_active ? '#FECACA' : '#A7F3D0'}`, borderRadius: 10, color: u.is_active ? '#DC2626' : '#059669', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {u.is_active ? <Ban size={13} /> : <Unlock size={13} />}
                                                        {u.is_active ? 'Suspend' : 'Activate'}
                                                    </button>
                                                    <button onClick={() => { setResetTarget(u); setNewPassword(''); setConfirmPassword(''); }} style={{ padding: '8px 12px', background: P.brandBg, border: `1px solid ${P.brand}30`, borderRadius: 10, color: P.brand, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Key size={13} /> Reset Password
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13, color: P.dark }}>
                                Previous
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 800, color: P.muted }}>Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13, color: P.dark }}>
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: ROLE MANAGEMENT ── */}
            {tab === 'roles' && (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                    <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Role Permission Matrix</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Toggle checkboxes to grant or revoke specific feature permissions for each staff role.</p>
                        </div>
                        {permLoading && <Loader2 size={20} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />}
                    </div>

                    {permData && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                                <thead>
                                    <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 240 }}>Permission Module & Action</th>
                                        {(permData.roles ?? []).map((r: any) => (
                                            <th key={r.id} style={{ padding: '16px 16px', textAlign: 'center', fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {ROLE_CONFIG[r.name]?.badge} {ROLE_CONFIG[r.name]?.label ?? r.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(permData.matrix ?? []).map((group: any) => (
                                        <React.Fragment key={group.module}>
                                            <tr>
                                                <td colSpan={(permData.roles?.length ?? 0) + 1} style={{ padding: '10px 24px', background: P.brandBg, fontSize: 11, fontWeight: 950, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                    {group.module} Module
                                                </td>
                                            </tr>
                                            {group.permissions.map((perm: any) => (
                                                <tr key={perm.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                    <td style={{ padding: '14px 24px' }}>
                                                        <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{perm.action}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{perm.description || perm.key}</div>
                                                    </td>
                                                    {(permData.roles ?? []).map((role: any) => {
                                                        const granted = perm.assignedRoles.includes(role.name)
                                                        const key = `${role.id}-${perm.id}`
                                                        const saving = permSaving[key]
                                                        return (
                                                            <td key={role.id} style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                                {saving ? (
                                                                    <Loader2 size={16} color={P.brand} style={{ animation: 'spin 1s linear infinite', margin: 'auto' }} />
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => handlePermissionToggle(role.id, perm.id, granted)}
                                                                        style={{ 
                                                                            width: 24, height: 24, borderRadius: 6, border: `2px solid ${granted ? '#059669' : P.border}`, 
                                                                            background: granted ? '#059669' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                                                            justifyContent: 'center', margin: 'auto', transition: 'all 0.15s' 
                                                                        }}
                                                                    >
                                                                        {granted && <Check size={14} color="#fff" strokeWidth={3} />}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 3: STAFF INVITATIONS ── */}
            {tab === 'invites' && (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                    <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Staff Invitations Directory</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Active invitation links sent to new staff team members.</p>
                        </div>
                        <button onClick={() => setShowInviteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
                            <Plus size={16} /> New Staff Invite
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                {['Invited Staff Member', 'Assigned Role', 'Invitation Status', 'Date Invited', 'Expiry Date', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invites.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: P.muted, fontWeight: 700 }}>No pending staff invitations. Click "New Staff Invite" to send an invitation link.</td>
                                </tr>
                            )}
                            {invites.map((inv: any) => {
                                const cfg = ROLE_CONFIG[inv.role] ?? ROLE_CONFIG.student
                                return (
                                    <tr key={inv.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{[inv.first_name, inv.last_name].filter(Boolean).join(' ') || 'Staff Invite'}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{inv.email}</div>
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                {cfg.badge} {cfg.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <span style={{ background: inv.status === 'pending' ? '#FFFBEB' : '#ECFDF5', color: inv.status === 'pending' ? '#D97706' : '#059669', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                {inv.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 700 }}>{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                                        <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 700 }}>{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-IN') : '—'}</td>
                                        <td style={{ padding: '18px 24px' }}>
                                            {inv.status === 'pending' && (
                                                <button onClick={() => handleRevokeInvite(inv.id)} style={{ padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Trash2 size={13} /> Revoke Invite
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── TAB 4: ACTIVITY HISTORY ── */}
            {tab === 'audit' && (
                <div>
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <select value={auditSeverity} onChange={e => setAuditSeverity(e.target.value)} style={{ padding: '8px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, background: '#fff', outline: 'none', fontWeight: 700, color: P.dark }}>
                            <option value="all">All Severity Levels</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>

                        <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={{ padding: '8px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, background: '#fff', outline: 'none', fontWeight: 700, color: P.dark }}>
                            <option value="all">All Modules</option>
                            {[...new Set(auditLogs.map(l => l.module))].filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>

                        <span style={{ fontSize: 12, color: P.muted, fontWeight: 800, marginLeft: 'auto' }}>{filteredLogs.length} Logged Events</span>
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                        {filteredLogs.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center', color: P.muted, fontWeight: 700 }}>No activity audit logs found matching your filters.</div>
                        ) : (
                            <div>
                                {filteredLogs.map((log: any, i: number) => (
                                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 24px', borderBottom: i < filteredLogs.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: log.severity === 'critical' ? '#DC2626' : log.severity === 'warning' ? '#D97706' : '#2563EB', marginTop: 6, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{log.action.replace(/_/g, ' ')}</span>
                                                <span style={{ background: P.brandBg, color: P.brand, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{log.module}</span>
                                            </div>
                                            {log.details && (
                                                <div style={{ fontSize: 12, color: P.muted, fontFamily: 'monospace', background: P.bg, borderRadius: 8, padding: '6px 12px', display: 'inline-block' }}>
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 5: ACTIVE SESSIONS ── */}
            {tab === 'sessions' && (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: '48px 32px', textAlign: 'center' }}>
                    <Monitor size={48} color={P.brand} style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 20, fontWeight: 950, color: P.dark, margin: 0 }}>Active Session Security Manager</h3>
                    <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, marginTop: 6 }}>All active staff login sessions are secured with JWT session tokens.</p>
                    <div style={{ marginTop: 24, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: 20, maxWidth: 540, margin: '24px auto 0', textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: P.dark, marginBottom: 4 }}>Current Logged-in Staff Session</div>
                        <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>IP: 127.0.0.1 (Local Environment) • Browser: Chrome / Edge • Token Status: Active</div>
                    </div>
                </div>
            )}

            {/* ── INVITE STAFF MODAL ── */}
            {showInviteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>Invite New Staff Member</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Send an invitation link to grant platform administrative access.</p>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: '#fff', border: `1px solid ${P.border}`, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ padding: '28px 32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>First Name</label>
                                    <input value={inviteForm.first_name} onChange={e => setInviteForm({ ...inviteForm, first_name: e.target.value })} placeholder="John" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Name</label>
                                    <input value={inviteForm.last_name} onChange={e => setInviteForm({ ...inviteForm, last_name: e.target.value })} placeholder="Doe" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address *</label>
                                <input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="staff.member@company.com" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assign Staff Role *</label>
                                <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                                    {PLATFORM_STAFF_ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_CONFIG[r]?.badge} {ROLE_CONFIG[r]?.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleSendInvite} disabled={inviteSaving} style={{ flex: 2, padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${P.brand}30` }}>
                                    {inviteSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} Send Staff Invitation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RESET STAFF PASSWORD MODAL (DIRECT OWNER RESET — NO EMAIL LINK) ── */}
            {resetTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.brandBg }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Key size={18} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.brand }}>Reset Staff Password</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: P.dark, fontWeight: 600 }}>{[resetTarget.first_name, resetTarget.last_name].filter(Boolean).join(' ') || resetTarget.email}</p>
                                </div>
                            </div>
                            <button onClick={() => { setResetTarget(null); setResetModalError(null); }} style={{ background: '#fff', border: `1px solid ${P.border}`, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color={P.muted} /></button>
                        </div>

                        <div style={{ padding: '24px 32px' }}>
                            {resetModalError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#991B1B', fontSize: 12, fontWeight: 800 }}>
                                    <AlertTriangle size={16} color="#DC2626" />
                                    <span>{resetModalError}</span>
                                </div>
                            )}

                            <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Lock size={16} color={P.brand} />
                                <div style={{ fontSize: 12, color: P.dark, fontWeight: 700 }}>
                                    Staff Email: <span style={{ color: P.brand }}>{resetTarget.email}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Password *</label>
                                    <button onClick={generateRandomPassword} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: P.brand }}>
                                        ⚡ Auto-Generate
                                    </button>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPasswordText ? 'text' : 'password'} 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                        placeholder="Enter new password..." 
                                        style={{ width: '100%', padding: '12px 16px', paddingRight: 40, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} 
                                    />
                                    <button onClick={() => setShowPasswordText(!showPasswordText)} type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: P.muted }}>
                                        {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confirm Password *</label>
                                <input 
                                    type={showPasswordText ? 'text' : 'password'} 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    placeholder="Re-enter password to confirm..." 
                                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setResetTarget(null)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleDirectPasswordReset} disabled={resetSaving} style={{ flex: 2, padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${P.brand}30` }}>
                                    {resetSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={16} />} Set New Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SUSPEND CONFIRMATION MODAL ── */}
            {suspendTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF2F2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ban size={18} color="#DC2626" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#991B1B' }}>Suspend Staff Member</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7F1D1D', fontWeight: 600 }}>{suspendTarget.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSuspendTarget(null)} style={{ background: '#fff', border: `1px solid ${P.border}`, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color={P.muted} /></button>
                        </div>

                        <div style={{ padding: '24px 32px' }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reason for Suspension *</label>
                                <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} placeholder="State reason for suspending access..." style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: P.dark, outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setSuspendTarget(null)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleSuspendSubmit} disabled={suspendSaving} style={{ flex: 2, padding: 14, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {suspendSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Ban size={16} />} Confirm Suspend
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
