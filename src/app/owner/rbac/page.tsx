'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Shield, Users, Key, Lock, RefreshCw, Search, X,
    Loader2, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
    UserCheck, UserX, Crown, GraduationCap, BookOpen, User, Activity,
    Building2, ClipboardList, ChevronDown, ChevronUp, Eye, EyeOff,
    Pencil, ToggleLeft, ToggleRight
} from 'lucide-react'

// â”€â”€ PALETTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#EFE9FF',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#22C55E', successBg: '#ECFDF5',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}

// â”€â”€ ROLE CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; badge: string }> = {
    owner: { label: 'Platform Owner', icon: Crown, color: P.brand, bg: P.brandBg, badge: 'ðŸ‘‘' },
    tenant_admin: { label: 'Admin', icon: Shield, color: P.info, bg: P.infoBg, badge: 'ðŸ›¡' },
    teacher: { label: 'Teacher', icon: GraduationCap, color: P.success, bg: P.successBg, badge: 'ðŸŽ“' },
    teacher_pending: { label: 'Pending Teacher', icon: AlertTriangle, color: P.warning, bg: P.warningBg, badge: 'â³' },
    student: { label: 'Student', icon: BookOpen, color: P.cta, bg: P.ctaBg, badge: 'ðŸ“š' },
    parent: { label: 'Parent', icon: User, color: P.muted, bg: P.hover, badge: 'ðŸ‘¤' },
}

const ALL_ROLES = Object.keys(ROLE_CONFIG)

type UserProfile = {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    role: string
    tenant_id?: string
    is_active: boolean
    created_at: string
    tenants?: { name: string; type: string } | null
}

type Permission = { id: string; module: string; action: string; key: string; description: string; assignedRoles: string[] }
type PermModule = { module: string; permissions: Permission[] }
type RoleDistRow = { role: string; count: number; active: number }
type Stats = { totalUsers: number; activeUsers: number; totalRoles: number; totalPermissions: number }

type ApiData = {
    users: UserProfile[]
    usersTotal: number
    roles: { id: string; name: string; description: string }[]
    permissions: Permission[]
    permMatrix: PermModule[]
    roleDistribution: RoleDistRow[]
    auditLogs: any[]
    tenants: { id: string; name: string; type: string }[]
    stats: Stats
}

// â”€â”€ CHANGE ROLE MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChangeRoleModal({ user, onClose, onSuccess }: { user: UserProfile; onClose: () => void; onSuccess: () => void }) {
    const [role, setRole] = useState(user.role)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const currentCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.student

    const submit = async () => {
        if (role === user.role) { setError('Select a different role.'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/owner/rbac/users/' + user.id, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            })
            if (res.ok) { onSuccess(); onClose() }
            else { const j = await res.json(); setError(j.error || 'Failed') }
        } finally { setLoading(false) }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: P.card, borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>
                <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: P.dark, margin: 0 }}>Change Role</h2>
                        <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0' }}>
                            {user.first_name || ''} {user.last_name || ''} â€” {user.email}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: P.hover, border: 'none', borderRadius: 9, padding: 8, cursor: 'pointer', display: 'flex' }}>
                        <X size={18} color={P.muted} />
                    </button>
                </div>

                <div style={{ padding: '20px 28px 28px' }}>
                    {/* Current role */}
                    <div style={{ marginBottom: 16, padding: '12px 16px', background: currentCfg.bg, borderRadius: 10, border: '1px solid ' + currentCfg.color + '30', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{currentCfg.badge}</span>
                        <div>
                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Role</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: currentCfg.color }}>{currentCfg.label}</div>
                        </div>
                    </div>

                    {/* New role selection */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assign New Role</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {ALL_ROLES.map(r => {
                                const cfg = ROLE_CONFIG[r]
                                return (
                                    <button key={r} onClick={() => setRole(r)} style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                                        border: '1.5px solid ' + (role === r ? cfg.color : P.border),
                                        background: role === r ? cfg.bg : P.bg,
                                        cursor: 'pointer', textAlign: 'left',
                                    }}>
                                        <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.badge}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: role === r ? cfg.color : P.dark }}>{cfg.label}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{r}</div>
                                        </div>
                                        {role === r && <CheckCircle size={16} color={cfg.color} />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: P.errorBg, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, marginBottom: 14 }}>
                            <AlertTriangle size={15} color={P.error} />
                            <span style={{ fontSize: 13, color: P.error, fontWeight: 600 }}>{error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid ' + P.border, background: P.card, color: P.dark, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={submit} disabled={loading || role === user.role} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: P.brand, color: '#fff', fontSize: 14, fontWeight: 800, cursor: (loading || role === user.role) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (loading || role === user.role) ? 0.6 : 1 }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={16} />}
                            Apply Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// â”€â”€ METRIC CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MetricCard({ icon: Icon, label, value, sub, color, bg }: {
    icon: any; label: string; value: string; sub?: string; color: string; bg: string
}) {
    return (
        <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: P.dark, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: P.muted, marginTop: 5, fontWeight: 500 }}>{sub}</div>}
        </div>
    )
}

// â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AccessControlPage() {
    const [data, setData] = useState<ApiData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'audit'>('users')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [tenantFilter, setTenantFilter] = useState('all')
    const [page, setPage] = useState(1)
    const pageSize = 25
    const [editUser, setEditUser] = useState<UserProfile | null>(null)
    const [expandedMod, setExpandedMod] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(t)
    }, [search])

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), role: roleFilter, tenant: tenantFilter })
            if (debouncedSearch) params.append('search', debouncedSearch)
            const res = await fetch('/api/owner/rbac?' + params)
            const json = await res.json()
            if (res.ok) setData(json)
        } finally { setLoading(false); setRefreshing(false) }
    }, [page, debouncedSearch, roleFilter, tenantFilter])

    useEffect(() => { fetchData() }, [fetchData])

    const toggleActive = async (u: UserProfile) => {
        const res = await fetch('/api/owner/rbac/users/' + u.id, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !u.is_active }),
        })
        if (res.ok) { showToast((u.is_active ? 'Suspended' : 'Activated') + ': ' + (u.email ?? u.id), true); fetchData(true) }
        else showToast('Failed to update user', false)
    }

    const s = data?.stats
    const totalPages = Math.max(1, Math.ceil((data?.usersTotal ?? 0) / pageSize))

    const tabSt = (t: string): React.CSSProperties => ({
        padding: '10px 22px', borderRadius: 10, border: 'none',
        background: activeTab === t ? P.brand : 'transparent',
        color: activeTab === t ? '#fff' : P.muted,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
    })

    const MODULE_COLORS: Record<string, string> = {
        exam: P.brand, question_bank: P.info, students: P.success,
        teachers: P.cta, crm: P.warning, payments: P.error, analytics: '#1FAC63', ai: '#14B8A6',
    }

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px', position: 'relative' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {editUser && (
                <ChangeRoleModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSuccess={() => { showToast('Role updated successfully!', true); fetchData(true); setEditUser(null) }}
                />
            )}

            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle size={16} color={P.success} /> : <XCircle size={16} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 700, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: P.dark, margin: 0 }}>Users & Permissions</h1>
                    <p style={{ fontSize: 13, color: P.muted, margin: '5px 0 0', fontWeight: 500 }}>
                        {loading ? 'Loading...' : (s?.totalUsers ?? 0) + ' users · ' + (s?.totalRoles ?? 0) + ' roles · ' + (s?.totalPermissions ?? 0) + ' permissions'}
                    </p>
                </div>
                <button onClick={() => fetchData(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: '1px solid ' + P.border, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: P.dark, cursor: 'pointer' }}>
                    <RefreshCw size={15} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                </button>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 4, background: P.card, border: '1px solid ' + P.border, borderRadius: 14, padding: 6, marginBottom: 24, width: 'fit-content' }}>
                {([
                    { key: 'users', label: '👥 Users' },
                    { key: 'roles', label: '🎭 Roles' },
                    { key: 'permissions', label: '🔑 Permissions' },
                    { key: 'audit', label: '📜 Activity Logs' },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabSt(t.key)}>{t.label}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
                    <div style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>Loading access data...</div>
                </div>
            ) : (
                <>
                    {/* â”€â”€ USERS TAB â”€â”€ */}
                    {activeTab === 'users' && (
                        <>
                            {/* KPI Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                                <MetricCard icon={Users} label="Total Users" value={String(s?.totalUsers ?? 0)} sub={(s?.activeUsers ?? 0) + ' active'} color={P.brand} bg={P.brandBg} />
                                <MetricCard icon={UserCheck} label="Active" value={String(s?.activeUsers ?? 0)} color={P.success} bg={P.successBg} />
                                <MetricCard icon={UserX} label="Suspended" value={String((s?.totalUsers ?? 0) - (s?.activeUsers ?? 0))} color={P.error} bg={P.errorBg} />
                                <MetricCard icon={Shield} label="Roles Defined" value={String(s?.totalRoles ?? 0)} color={P.info} bg={P.infoBg} />
                            </div>

                            {/* Role Distribution */}
                            {(data?.roleDistribution ?? []).some(r => r.count > 0) && (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>User Distribution by Role</div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {(data?.roleDistribution ?? []).filter(r => r.count > 0).map(row => {
                                            const cfg = ROLE_CONFIG[row.role] ?? ROLE_CONFIG.student
                                            return (
                                                <button key={row.role} onClick={() => { setRoleFilter(row.role); setPage(1) }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: '1px solid ' + (roleFilter === row.role ? cfg.color : P.border), background: roleFilter === row.role ? cfg.bg : P.bg, cursor: 'pointer' }}>
                                                    <span style={{ fontSize: 16 }}>{cfg.badge}</span>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>{row.count}</div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                        {roleFilter !== 'all' && (
                                            <button onClick={() => { setRoleFilter('all'); setPage(1) }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px dashed ' + P.border, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: P.muted }}>
                                                <X size={12} /> Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 14, padding: '13px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                                    <Search size={15} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or email..."
                                        style={{ width: '100%', paddingLeft: 36, paddingRight: search ? 32 : 14, paddingTop: 8, paddingBottom: 8, border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box' }} />
                                    {search && <button onClick={() => { setSearch(''); setPage(1) }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={13} color={P.muted} /></button>}
                                </div>

                                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                                    style={{ padding: '8px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                    <option value="all">All Roles</option>
                                    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].badge} {ROLE_CONFIG[r].label}</option>)}
                                </select>

                                <select value={tenantFilter} onChange={e => { setTenantFilter(e.target.value); setPage(1) }}
                                    style={{ padding: '8px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                    <option value="all">All Tenants</option>
                                    {(data?.tenants ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>

                                <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{data?.usersTotal ?? 0} users</span>
                            </div>

                            {/* Users Table */}
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden' }}>
                                {(data?.users?.length ?? 0) === 0 ? (
                                    <div style={{ padding: 80, textAlign: 'center' }}>
                                        <Users size={48} color={P.border} style={{ marginBottom: 16 }} />
                                        <div style={{ fontSize: 18, fontWeight: 800, color: P.dark, marginBottom: 8 }}>No users found</div>
                                        <div style={{ fontSize: 14, color: P.muted }}>Try adjusting your search or filters.</div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                                                <thead>
                                                    <tr style={{ background: P.bg, borderBottom: '1px solid ' + P.border }}>
                                                        {['User', 'Role', 'Tenant', 'Status', 'Joined', 'Actions'].map(h => (
                                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data!.users.map((u, i) => {
                                                        const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.student
                                                        return (
                                                            <tr key={u.id}
                                                                style={{ borderBottom: i < data!.users.length - 1 ? '1px solid ' + P.border : 'none', transition: 'background 0.1s' }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                            >
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                                                            {cfg.badge}
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>
                                                                                {[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                                                                            </div>
                                                                            <div style={{ fontSize: 11, color: P.muted }}>{u.email ?? u.id.slice(0, 20) + 'â€¦'}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                                                                        {cfg.badge} {cfg.label}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    {u.tenants?.name ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                            <Building2 size={12} color={P.muted} />
                                                                            <span style={{ fontSize: 12, fontWeight: 600, color: P.text }}>{u.tenants.name}</span>
                                                                        </div>
                                                                    ) : <span style={{ color: P.muted, fontSize: 12 }}>Platform</span>}
                                                                </td>
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    <span style={{ background: u.is_active ? P.successBg : P.errorBg, color: u.is_active ? P.success : P.error, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                                                                        {u.is_active ? 'â— Active' : 'â—‹ Suspended'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '14px 16px', fontSize: 12, color: P.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                    {new Date(u.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                                </td>
                                                                <td style={{ padding: '14px 16px' }}>
                                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                                        <button onClick={() => setEditUser(u)} title="Change role"
                                                                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid ' + P.border, background: P.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <Pencil size={13} color={P.brand} />
                                                                        </button>
                                                                        <button onClick={() => toggleActive(u)} title={u.is_active ? 'Suspend' : 'Activate'}
                                                                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid ' + (u.is_active ? P.warning + '40' : P.success + '40'), background: u.is_active ? P.warningBg : P.successBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            {u.is_active ? <EyeOff size={13} color={P.warning} /> : <Eye size={13} color={P.success} />}
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
                                        <div style={{ padding: '14px 20px', borderTop: '1px solid ' + P.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                            <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                                Showing {(page - 1) * pageSize + 1}â€“{Math.min(page * pageSize, data?.usersTotal ?? 0)} of {data?.usersTotal ?? 0}
                                            </span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + P.border, background: P.card, cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                                                    <ChevronLeft size={15} color={P.muted} />
                                                </button>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    const pg = i + Math.max(1, Math.min(page - 2, totalPages - 4))
                                                    if (pg > totalPages) return null
                                                    return <button key={pg} onClick={() => setPage(pg)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + (page === pg ? P.brand : P.border), background: page === pg ? P.brand : P.card, color: page === pg ? '#fff' : P.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{pg}</button>
                                                })}
                                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + P.border, background: P.card, cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.5 : 1 }}>
                                                    <ChevronRight size={15} color={P.muted} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* â”€â”€ ROLES TAB â”€â”€ */}
                    {activeTab === 'roles' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ marginBottom: 8 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: P.dark, margin: 0 }}>Roles</h3>
                                <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0' }}>All platform roles and how many users have them.</p>
                            </div>
                            {(data?.roles ?? []).map(role => {
                                const cfg = ROLE_CONFIG[role.name] ?? ROLE_CONFIG.student
                                const dist = (data?.roleDistribution ?? []).find(r => r.role === role.name)
                                return (
                                    <div key={role.id} style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 50, height: 50, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{cfg.badge}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>{cfg.label}</span>
                                                <code style={{ fontSize: 11, background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{role.name}</code>
                                            </div>
                                            <div style={{ fontSize: 13, color: P.text }}>{role.description}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{dist?.count ?? 0}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>users</div>
                                            {dist && dist.active < dist.count && (
                                                <div style={{ fontSize: 11, color: P.error, fontWeight: 700 }}>{dist.count - dist.active} suspended</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* â”€â”€ PERMISSIONS TAB â”€â”€ */}
                    {activeTab === 'permissions' && (
                        <div>
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: P.dark, margin: 0 }}>Permission Settings</h3>
                                <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0' }}>Platform rules grouped by module.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(data?.permMatrix ?? []).map(mod => {
                                    const color = MODULE_COLORS[mod.module] ?? P.brand
                                    const isExpanded = expandedMod === mod.module
                                    return (
                                        <div key={mod.module} style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 14, overflow: 'hidden' }}>
                                            <div onClick={() => setExpandedMod(isExpanded ? null : mod.module)}
                                                style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Key size={16} color={color} />
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: 15, fontWeight: 800, color: P.dark, textTransform: 'capitalize' }}>{mod.module.replace(/_/g, ' ')}</span>
                                                        <span style={{ fontSize: 12, color: P.muted, marginLeft: 10 }}>{mod.permissions.length} permissions</span>
                                                    </div>
                                                </div>
                                                {isExpanded ? <ChevronUp size={16} color={P.muted} /> : <ChevronDown size={16} color={P.muted} />}
                                            </div>

                                            {isExpanded && (
                                                <div style={{ borderTop: '1px solid ' + P.border }}>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                                                            <thead>
                                                                <tr style={{ background: P.bg }}>
                                                                    {['Rule', 'Action', 'Description', 'Assigned Roles'].map(h => (
                                                                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {mod.permissions.map((perm, i) => (
                                                                    <tr key={perm.id} style={{ borderTop: '1px solid ' + P.border }}>
                                                                        <td style={{ padding: '11px 16px' }}>
                                                                            <code style={{ fontSize: 12, background: color + '18', color, padding: '3px 9px', borderRadius: 6, fontWeight: 800 }}>{perm.key}</code>
                                                                        </td>
                                                                        <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: P.dark, textTransform: 'capitalize' }}>{perm.action}</td>
                                                                        <td style={{ padding: '11px 16px', fontSize: 12, color: P.text }}>{perm.description}</td>
                                                                        <td style={{ padding: '11px 16px' }}>
                                                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                                                {perm.assignedRoles.length > 0 ? perm.assignedRoles.map(r => {
                                                                                    const rcfg = ROLE_CONFIG[r] ?? ROLE_CONFIG.student
                                                                                    return (
                                                                                        <span key={r} style={{ background: rcfg.bg, color: rcfg.color, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                                                                                            {rcfg.badge} {r}
                                                                                        </span>
                                                                                    )
                                                                                }) : <span style={{ color: P.muted, fontSize: 12 }}>None</span>}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ AUDIT TAB â”€â”€ */}
                    {activeTab === 'audit' && (
                        <div>
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: P.dark, margin: 0 }}>Activity Logs</h3>
                                <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0' }}>Recent admin actions across the platform.</p>
                            </div>

                            {(data?.auditLogs?.length ?? 0) === 0 ? (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 80, textAlign: 'center' }}>
                                    <ClipboardList size={48} color={P.border} style={{ marginBottom: 16 }} />
                                    <div style={{ fontSize: 18, fontWeight: 800, color: P.dark, marginBottom: 8 }}>No audit logs yet</div>
                                    <div style={{ fontSize: 14, color: P.muted }}>Admin actions will appear here once recorded.</div>
                                </div>
                            ) : (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                                            <thead>
                                                <tr style={{ background: P.bg, borderBottom: '1px solid ' + P.border }}>
                                                    {['Action', 'Module', 'Details', 'User', 'Timestamp'].map(h => (
                                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data!.auditLogs.map((log: any, i: number) => (
                                                    <tr key={log.id} style={{ borderBottom: i < data!.auditLogs.length - 1 ? '1px solid ' + P.border : 'none' }}>
                                                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: P.dark }}>{log.action}</td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{ background: (MODULE_COLORS[log.module] ?? P.brand) + '18', color: MODULE_COLORS[log.module] ?? P.brand, padding: '3px 9px', borderRadius: 7, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{log.module}</span>
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: 12, color: P.muted, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {log.details ? JSON.stringify(log.details) : 'â€”'}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: 11, color: P.muted, fontFamily: 'monospace' }}>{log.user_id ? log.user_id.slice(0, 14) + '...' : 'System'}</td>
                                                        <td style={{ padding: '12px 16px', fontSize: 12, color: P.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                            {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
