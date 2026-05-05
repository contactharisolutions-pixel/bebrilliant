'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Building2, Search, Plus, Activity, Users, Settings, Filter,
    Ban, ShieldCheck, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, EyeOff, CheckCircle, XCircle, Loader2, AlertTriangle,
    Globe, Crown, UserCheck, Download, BarChart2,
    ArrowUpRight, Mail, Pencil, Trash2, ShieldAlert, Zap, Award,
    School, GraduationCap
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'

type Tenant = {
    id: string
    name: string
    type: string
    tenant_type?: string
    email: string
    is_active: boolean
    subscription_status: string
    max_students: number
    max_teachers: number
    is_white_label: boolean
    created_at: string
    logo?: string
    total_users?: number
    examCount?: number
    avgAccuracy?: string | null
    revenueInPeriod?: number
    subscription_plan?: string
}

// MODAL: PROVISION NEW TENANT
function ProvisionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({
        name: '', type: 'INSTITUTE', tenant_type: 'institute', email: '',
        admin_first_name: '', admin_last_name: '', admin_password: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPass, setShowPass] = useState(false)

    const TENANT_TYPES = [
        { value: 'school',               label: 'School',               icon: School,      legacyType: 'INSTITUTE',         credits: 0,   desc: 'School with internal teachers' },
        { value: 'institute',            label: 'Institute',            icon: Building2,   legacyType: 'INSTITUTE',         credits: 500, desc: 'Coaching class / tuition centre' },
        { value: 'independent_teacher',  label: 'Independent Teacher',  icon: UserCheck,   legacyType: 'PERSONAL_TEACHER',  credits: 200, desc: 'Solo educator or tutor' },
    ]

    const submit = async () => {
        setError('')
        if (!form.name || !form.email || !form.admin_first_name || !form.admin_last_name || !form.admin_password) {
            setError('All fields are required.')
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form), // includes tenant_type
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || 'Failed to provision'); return }
            onSuccess()
            onClose()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const inp = (label: string, key: keyof typeof form, type = 'text', extra?: React.ReactNode) => (
        <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            <div style={{ position: 'relative' }}>
                <input
                    type={type === 'password' && showPass ? 'text' : type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{
                        width: '100%', padding: '12px 14px', border: `1px solid ${P.border}`,
                        borderRadius: 12, fontSize: 14, color: P.dark, background: P.bg,
                        outline: 'none', boxSizing: 'border-box', fontWeight: 600,
                        paddingRight: type === 'password' ? 44 : 14,
                    }}
                />
                {extra}
            </div>
        </label>
    )

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 10, 20, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div className="glass-card" style={{ background: P.card, borderRadius: 32, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 120px rgba(0,0,0,0.5)', border: `1px solid rgba(255,255,255,0.1)` }}>
                <div style={{ padding: '32px 40px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg, ${P.card}, ${P.bg})` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 24px ${P.brand}30` }}>
                            <Plus size={32} color="#fff" strokeWidth={3} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>New Tenant</h2>
                            <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Create a new institute or teacher account.</p>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tenant Type</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {TENANT_TYPES.map(t => (
                                <button key={t.value} onClick={() => setForm(f => ({ ...f, tenant_type: t.value, type: t.legacyType }))} style={{
                                    padding: '14px 18px', borderRadius: 16, border: `2px solid`,
                                    borderColor: form.tenant_type === t.value ? P.brand : P.border,
                                    background: form.tenant_type === t.value ? P.brandBg : P.card,
                                    color: form.tenant_type === t.value ? P.brand : P.muted,
                                    fontSize: 14, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                                }}>
                                    <t.icon size={20} style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 900, fontSize: 14 }}>{t.label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>{t.desc}</div>
                                    </div>
                                    <div style={{ padding: '4px 10px', borderRadius: 8, background: form.tenant_type === t.value ? P.brand : P.bg, color: form.tenant_type === t.value ? '#fff' : P.muted, fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                                        {t.credits > 0 ? `${t.credits} free credits` : '0 credits'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {inp('Tenant Name', 'name')}
                      {inp('Admin Email', 'email', 'email')}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {inp('Admin First Name', 'admin_first_name')}
                          {inp('Admin Last Name', 'admin_last_name')}
                      </div>

                      {inp('Admin Password', 'admin_password', 'password',
                          <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                              {showPass ? <EyeOff size={18} color={P.muted} /> : <Eye size={18} color={P.muted} />}
                          </button>
                      )}
                    </div>

                    {error && (
                        <div style={{ background: P.errorBg, border: `1px solid ${P.error}30`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
                            <AlertTriangle size={20} color={P.error} />
                            <span style={{ fontSize: 13, color: P.error, fontWeight: 800 }}>{error}</span>
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px 40px', borderTop: `1px solid ${P.border}`, background: P.bg, display: 'flex', gap: 14 }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: '16px 0', borderRadius: 16, border: `1px solid ${P.border}`,
                        background: P.card, color: P.dark, fontSize: 14, fontWeight: 900, cursor: 'pointer'
                    }}>Cancel</button>
                    <button onClick={submit} disabled={loading} style={{
                        flex: 2, padding: '16px 0', borderRadius: 16, border: 'none',
                        background: P.brand, color: '#fff',
                        fontSize: 15, fontWeight: 950, cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: `0 12px 24px ${P.brand}40`,
                    }}>
                        {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={20} strokeWidth={3} />}
                        Create Tenant
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function TenantManagementPage() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const pageSize = 20

    const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all')
    const [classification, setClassification] = useState<'all' | 'school' | 'institute' | 'independent_teacher'>('all')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [showProvision, setShowProvision] = useState(false)
    const [kpis, setKpis] = useState<any>(null)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(t)
    }, [search])

    const fetchTenants = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
                ...(status !== 'all' && { status }),
                ...(classification !== 'all' && { tenant_type: classification, type: classification }),
                ...(debouncedSearch && { search: debouncedSearch }),
            })
            const res = await fetch(`/api/owner/tenants?${params}`)
            const json = await res.json()
            if (res.ok) {
                setTenants(json.tenants ?? [])
                setTotal(json.total ?? 0)
            }

            const aRes = await fetch('/api/owner/analytics?range=30')
            const aJson = await aRes.json()
            if (aRes.ok) {
                setKpis(aJson.kpis)
                if (aJson.tenantSummaries) {
                    setTenants(prev => prev.map(t => {
                        const summary = aJson.tenantSummaries.find((s: any) => s.id === t.id)
                        return summary ? { ...t, ...summary } : t
                    }))
                }
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [page, status, debouncedSearch, classification])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('provision')) setShowProvision(true)
        fetchTenants()
    }, [fetchTenants, classification])

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px' }}>
            <style>{GLASS_STYLES + `
                @keyframes spin { to { transform: rotate(360deg); } }
                .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>

            {showProvision && (
                <ProvisionModal
                    onClose={() => setShowProvision(false)}
                    onSuccess={() => fetchTenants(true)}
                />
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24 }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                     <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tenants</div>
                   </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Tenant Management</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>
                        Manage {total} tenants across the platform.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => fetchTenants(true)}
                        disabled={refreshing}
                        className="glass-card hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}
                    >
                        <RefreshCw size={16} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowProvision(true)}
                        className="hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}30` }}
                    >
                        <Plus size={20} strokeWidth={3} /> New Tenant
                    </button>
                </div>
            </div>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
              <KpiCard icon={Building2} title="Total Tenants" value={String(total)} color={P.brand} trend="+2.4%" trendIsUp={true} />
              <KpiCard icon={Users} title="Total Students" value={String(kpis?.totalUsers ?? '...')} color={P.info} />
              <KpiCard icon={Activity} title="Avg. Score" value={(kpis?.avgAccuracy ?? '0') + '%'} color={P.success} trend="Optimal" trendIsUp={true} />
              <KpiCard icon={ShieldAlert} title="Suspended" value={String(tenants.filter(t => !t.is_active).length)} color={P.error} />
            </div>

            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 24, padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search tenants..."
                        style={{ width: '100%', padding: '14px 16px 14px 48px', border: `1px solid ${P.border}`, borderRadius: 14, fontSize: 14, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: 6 }}>
                        {(['all', 'school', 'institute', 'independent_teacher'] as const).map(f => (
                            <button key={f} onClick={() => { setClassification(f); setPage(1) }} style={{
                                padding: '8px 12px', borderRadius: 10, fontSize: 11, fontWeight: 900, cursor: 'pointer',
                                background: classification === f ? P.card : 'transparent',
                                color: classification === f ? P.brand : P.muted,
                                border: 'none', transition: 'all 0.2s',
                                boxShadow: classification === f ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                            }}>{f.replace('_', ' ').toUpperCase()}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: 6 }}>
                        {(['all', 'active', 'suspended'] as const).map(f => (
                            <button key={f} onClick={() => { setStatus(f); setPage(1) }} style={{
                                padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 900, cursor: 'pointer',
                                background: status === f ? P.card : 'transparent',
                                color: status === f ? P.brand : P.muted,
                                border: 'none', transition: 'all 0.2s',
                                boxShadow: status === f ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                            }}>{f.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 100, textAlign: 'center' }}>
                        <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                        <div style={{ fontSize: 14, color: P.muted, fontWeight: 800, marginTop: 20 }}>Loading tenants...</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                    {['Tenant', 'Type', 'Status', 'Students', 'Activity', 'Revenue', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '20px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((t: any) => (
                                    <tr key={t.id} style={{ borderBottom: `1px solid ${P.border}`, transition: 'all 0.2s' }}>
                                        <td style={{ padding: '24px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 14, background: t.is_active ? P.brandBg : P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: t.is_active ? `0 4px 12px ${P.brand}15` : 'none' }}>
                                                    <Building2 size={24} color={t.is_active ? P.brand : P.muted} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 900, color: P.dark }}>{t.name}</div>
                                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>{t.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: P.bg, border: `1px solid ${P.border}`, padding: '4px 10px', borderRadius: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{(t.tenant_type || t.type || 'UNKNOWN').replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <StatusBadge status={t.is_active ? 'Active' : 'Inactive'} type={t.is_active ? 'success' : 'error'} />
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                              <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{t.total_users ?? 0} <span style={{ color: P.muted, fontSize: 11 }}>STUDENTS</span></div>
                                              <div style={{ background: P.bg, height: 6, borderRadius: 99, width: 120 }}>
                                                <div style={{ width: Math.min(100, ((t.total_users ?? 0) / (t.max_students || 100)) * 100) + '%', height: '100%', background: P.brand, borderRadius: 99 }} />
                                              </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                              <div style={{ border: `1px solid ${P.border}`, padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 900 }}>{t.examCount ?? 0} <span style={{ fontSize: 10, color: P.muted }}>EXAMS</span></div>
                                              <div style={{ border: `1px solid ${P.border}`, padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: P.success }}>{t.avgAccuracy ?? 0}%</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                           <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>₹{(t.revenueInPeriod || 0).toLocaleString()}</div>
                                           <div style={{ fontSize: 11, color: P.muted, fontWeight: 800 }}>{t.subscription_plan || 'TRIAL'}</div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <button style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>MANAGE</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
