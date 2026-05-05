'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    BarChart4, TrendingUp, Users, DollarSign, BookOpen, Brain,
    Shield, RefreshCw, Loader2, Building2, Activity, Target,
    CheckCircle, XCircle, Cpu, Search, X, ChevronDown, ChevronUp,
    ArrowUpRight, Calendar, Award, Zap, Globe, GraduationCap,
    School, Receipt, ShieldAlert, BookOpenCheck, Layers, PieChart as PieIcon,
    ArrowRight, Info, Filter, ShieldCheck
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

// â”€â”€ PALETTE â”” MATCHING INSTITUTIONAL SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9315',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6310',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}

const CHART_COLORS = [P.brand, P.cta, P.success, P.info, '#1FAC63', '#F97316', '#14B8A6', P.error]

type KPIs = {
    totalTenants: number; activeTenants: number; totalUsers: number; totalStudents: number
    totalRevenue: number; totalExams: number; totalAttempts: number; successfulAttempts: number
    avgScore: string; avgAccuracy: string; aiMentorSessions: number; procFlags: number
}
type TenantRow = {
    id: string; name: string; type: string; subscription_plan?: string; subscription_status?: string
    is_active: boolean; created_at: string; userCount: number; studentCount: number
    examCount: number; revenueInPeriod: number; avgAccuracy: string | null
    activeRevisionPlans: number; procFlags: number
}
type ApiData = {
    kpis: KPIs
    monthlyRevenue: { label: string; revenue: number }[]
    monthlyUsers: { label: string; count: number }[]
    monthlyAttempts: { label: string; count: number }[]
    tenantSummaries: TenantRow[]
    subDistribution: { plan: string; count: number }[]
    roleDistribution: { role: string; count: number }[]
    procBreakdown: { total: number; low: number; medium: number; high: number; critical: number }
    tenants: { id: string; name: string; type: string }[]
}

const DAYS_OPTIONS = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
]

const SUB_COLORS: Record<string, string> = {
    free: P.muted, basic: P.info, pro: P.brand, enterprise: P.cta
}

// â”€â”€ BIG KPI CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KpiCard({ icon: Icon, label, value, sub, trend, color, bg }: {
    icon: any; label: string; value: string; sub?: string; trend?: string; color: string; bg: string; badge?: string
}) {
    return (
        <div className="glass-card hover-lift" style={{ 
            background: P.card, 
            border: '1px solid ' + P.border, 
            borderRadius: 24, 
            padding: '24px 26px', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
        }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.05, filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${color}15` }}>
                    <Icon size={22} color={color} strokeWidth={2.5} />
                </div>
                {trend && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 900, color: P.success, background: P.successBg, padding: '6px 12px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <TrendingUp size={12} /> {trend}
                    </span>
                )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 13, color: P.muted, marginTop: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={12} color={P.brand} /> {sub}
            </div>}
        </div>
    )
}

// â”€â”€ TENANT SUMMARY ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TenantRow({ t }: { t: TenantRow }) {
    const [open, setOpen] = useState(false)
    const planColor = SUB_COLORS[t.subscription_plan ?? 'free'] ?? P.muted

    return (
        <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', transition: 'all 0.3s' }} className="hover-lift">
            <div onClick={() => setOpen(!open)} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 8px 20px ${P.brand}10` }}>
                    <Building2 size={20} color={P.brand} strokeWidth={2.5} />
                </div>

                {/* Name + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: P.dark, letterSpacing: '-0.01em' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.type} Node</div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: 32, flexShrink: 0, marginRight: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 950, color: P.brand }}>{t.userCount}</div>
                        <div style={{ fontSize: 10, color: P.muted, fontWeight: 850, textTransform: 'uppercase' }}>Users</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 950, color: P.success }}>\u20B9{(t.revenueInPeriod / 1000).toFixed(1)}K</div>
                        <div style={{ fontSize: 10, color: P.muted, fontWeight: 850, textTransform: 'uppercase' }}>Revenue</div>
                    </div>
                </div>

                {/* Plan badge */}
                <span style={{ background: planColor + '15', color: planColor, padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    {t.subscription_plan ?? 'free'}
                </span>

                {open ? <ChevronUp size={18} color={P.muted} strokeWidth={3} /> : <ChevronDown size={18} color={P.muted} strokeWidth={3} />}
            </div>

            {open && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid ' + P.border, background: P.bg }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 20 }}>
                        {[
                            { label: 'Learners', val: t.studentCount, icon: GraduationCap, color: P.brand, bg: P.brandBg },
                            { label: 'Precision', val: t.avgAccuracy != null ? t.avgAccuracy + '%' : 'N/A', icon: Target, color: P.success, bg: P.successBg },
                            { label: 'Active Curricula', val: t.activeRevisionPlans, icon: BookOpenCheck, color: P.info, bg: P.infoBg },
                            { label: 'Risk Flags', val: t.procFlags, icon: ShieldAlert, color: t.procFlags > 0 ? P.error : P.muted, bg: t.procFlags > 0 ? P.errorBg : P.hover },
                        ].map(c => (
                            <div key={c.label} style={{ background: '#fff', borderRadius: 16, border: '1px solid ' + P.border, padding: '16px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <c.icon size={16} color={c.color} strokeWidth={2.5} />
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 950, color: c.color, letterSpacing: '-0.02em' }}>{c.val}</div>
                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{c.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Calendar size={14} color={P.muted} />
                            <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                Integrated {new Date(t.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <button className="hover-lift" style={{ background: P.brand, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            Tenant Details <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AnalyticsPage() {
    const [data, setData] = useState<ApiData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'students' | 'tenants' | 'proctoring'>('overview')
    const [days, setDays] = useState(30)
    const [tenantFilter, setTenantFilter] = useState('all')
    const [search, setSearch] = useState('')

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ days: String(days), tenant: tenantFilter })
            const res = await fetch('/api/owner/analytics?' + params)
            const json = await res.json()
            if (res.ok) setData(json)
        } finally { setLoading(false); setRefreshing(false) }
    }, [days, tenantFilter])

    useEffect(() => { fetchData() }, [fetchData])

    const k = data?.kpis

    const filteredTenants = (data?.tenantSummaries ?? []).filter(t =>
        !search || t.name.toLowerCase().includes(search.toLowerCase())
    )

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null
        return (
            <div className="glass-card" style={{ border: '1px solid ' + P.border, borderRadius: 12, padding: '14px 18px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 12, fontWeight: 850, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 15, fontWeight: 950, color: p.color ?? P.dark, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color ?? P.dark }} />
                        {p.name === 'revenue' ? '\u20B9' + Number(p.value).toLocaleString('en-IN') : p.value.toLocaleString()}
                        <span style={{ fontSize: 12, color: P.muted, fontWeight: 700, textTransform: 'capitalize' }}>{p.name}</span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '40px 48px', position: 'relative' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .glass-card { backdrop-filter: blur(10px); background: rgba(254, 254, 254, 0.8) !important; }
                .hover-lift { transition: transform 0.2s cubic-bezier(0.3, 0, 0.2, 1), box-shadow 0.2s !important; }
                .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; }
                .focus-ring:focus-within { box-shadow: 0 0 0 3px ${P.brand}20; border-color: ${P.brand} !important; }
                .tab-active { background: ${P.card} !important; color: ${P.brand} !important; border-color: ${P.border} !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
            `}</style>

            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Analytics</div>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Enterprise Deep Analytics</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>
                        {loading ? 'Aggregating telemetry...' : `${k?.totalTenants} nodes • ${k?.totalUsers.toLocaleString()} users • ₹${((k?.totalRevenue ?? 0) / 100000).toFixed(2)}L platform revenue`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 4 }}>
                        {DAYS_OPTIONS.map(o => (
                            <button key={o.value} onClick={() => setDays(o.value)} style={{ padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 850, cursor: 'pointer', border: 'none', background: days === o.value ? '#fff' : 'transparent', color: days === o.value ? P.brand : P.muted, boxShadow: days === o.value ? '0 4px 10px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchData(true)} disabled={refreshing} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync Ops
                    </button>
                </div>
            </header>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 18, width: 'fit-content', marginBottom: 32 }}>
                {[
                    { key: 'overview', label: 'Overview', icon: BarChart4 },
                    { key: 'revenue', label: 'Revenue', icon: Receipt },
                    { key: 'students', label: 'Learners', icon: GraduationCap },
                    { key: 'tenants', label: 'Leaderboard', icon: Award },
                    { key: 'proctoring', label: 'Security & Integrity', icon: ShieldAlert },
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={activeTab === t.key ? 'tab-active' : ''} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 14, border: '1px solid transparent', background: 'transparent', color: P.muted, fontSize: 13, fontWeight: 850, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <t.icon size={18} strokeWidth={2.5} /> {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480 }}>
                    <Loader2 size={48} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
                    <div style={{ fontSize: 16, color: P.muted, fontWeight: 750, letterSpacing: '0.05em' }}>COMPILING ECOSYSTEM DATA...</div>
                </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    
                    {/* ———————————————————————————————————————————————— OVERVIEW ———————————————————————————————————————————————— */}
                    {activeTab === 'overview' && (
                        <>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                                <KpiCard icon={School} label="Total Tenants" value={String(k?.totalTenants ?? 0)} sub={(k?.activeTenants ?? 0) + ' Logic Active'} color={P.brand} bg={P.brandBg} trend="Growing" />
                                <KpiCard icon={Users} label="Total Users" value={k?.totalUsers.toLocaleString() ?? '0'} sub={(k?.totalStudents ?? 0).toLocaleString() + ' Learners'} color={P.info} bg={P.infoBg} trend="+12.4%" />
                                <KpiCard icon={Receipt} label="Period Revenue" value={'₹' + ((k?.totalRevenue ?? 0) / 1000).toFixed(1) + 'K'} sub="Direct Platform Revenue" color={P.success} bg={P.successBg} trend="+8.2%" />
                                <KpiCard icon={BookOpenCheck} label="Exam Architecture" value={String(k?.totalExams ?? 0)} sub={(k?.totalAttempts ?? 0).toLocaleString() + ' Intake Cycles'} color={P.cta} bg={P.ctaBg} trend="Heavy" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                <div className="glass-card" style={{ border: '1px solid ' + P.border, borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>Revenue Velocity</h3>
                                        <div style={{ background: P.successBg, color: P.success, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>6 Month Path</div>
                                    </div>
                                    <div style={{ height: 280 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data?.monthlyRevenue ?? []} margin={{ left: -15 }}>
                                                <defs>
                                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={P.success} stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor={P.success} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                                <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: P.muted }} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: P.muted }} tickLine={false} axisLine={false} tickFormatter={v => '\u20B9' + (v / 1000).toFixed(0) + 'K'} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: P.success, strokeWidth: 2, strokeDasharray: '5 5' }} />
                                                <Area type="monotone" dataKey="revenue" stroke={P.success} strokeWidth={4} fill="url(#revGrad)" name="revenue" dot={{ r: 4, fill: P.success, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: P.success }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass-card" style={{ border: '1px solid ' + P.border, borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>User Intake Dynamics</h3>
                                        <div style={{ background: P.brandBg, color: P.brand, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Growth Nodes</div>
                                    </div>
                                    <div style={{ height: 280 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data?.monthlyUsers ?? []} margin={{ left: -20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                                <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: P.muted }} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: P.muted }} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: P.hover, opacity: 0.5 }} />
                                                <Bar dataKey="count" radius={[8, 8, 2, 2]} barSize={36} name="users">
                                                    {(data?.monthlyUsers ?? []).map((_, i) => <Cell key={i} fill={i === 5 ? P.brand : P.brandBg} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.4fr)', gap: 24 }}>
                                <div className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid ' + P.border }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: '0 0 24px', letterSpacing: '-0.01em' }}>Role Distribution</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {(data?.roleDistribution ?? []).map((row, i) => {
                                            const total = data?.kpis.totalUsers || 1
                                            const perc = (row.count / total) * 100
                                            return (
                                                <div key={row.role}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' }}>
                                                        <div>
                                                            <div style={{ fontSize: 13, fontWeight: 900, color: P.dark, textTransform: 'capitalize' }}>{row.role.replace(/_/g, ' ')} Entity</div>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color: P.muted }}>{perc.toFixed(1)}% of total userbase</div>
                                                        </div>
                                                        <span style={{ fontSize: 16, fontWeight: 950, color: CHART_COLORS[i % CHART_COLORS.length] }}>{row.count.toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ background: P.bg, borderRadius: 99, height: 10, overflow: 'hidden' }}>
                                                        <div style={{ width: perc + '%', height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 99, transition: 'width 1s cubic-bezier(0.2, 0, 0, 1)' }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid ' + P.border }}>
                                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.01em' }}>Subscription Revenue</h3>
                                        <p style={{ fontSize: 12, color: P.muted, fontWeight: 650, marginTop: 4 }}>Tier Distribution across ecosystem</p>
                                    </div>
                                    <div style={{ height: 220 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={data?.subDistribution ?? []} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="count" paddingAngle={5} nameKey="plan">
                                                    {(data?.subDistribution ?? []).map((d, i) => <Cell key={i} fill={SUB_COLORS[d.plan] ?? CHART_COLORS[i]} stroke="none" />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid ' + P.border, fontWeight: 900, fontSize: 12, padding: '8px 12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                                        {(data?.subDistribution ?? []).map(d => (
                                            <div key={d.plan} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: P.bg, borderRadius: 12, border: `1px solid ${P.border}` }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: SUB_COLORS[d.plan] ?? P.brand }} />
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 950, color: P.dark, textTransform: 'uppercase' }}>{d.plan}</div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: P.muted }}>{d.count} nodes</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* â”€â”€ REVENUE TAB â”€â”€ */}
                    {activeTab === 'revenue' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                                <KpiCard icon={DollarSign} label="Period Revenue" value={'\u20B9' + ((k?.totalRevenue ?? 0) / 1000).toFixed(2) + 'K'} color={P.success} bg={P.successBg} trend="+8.4%" />
                                <KpiCard icon={TrendingUp} label="Platform Revenue" value="Enterprise Subscription" color={P.brand} bg={P.brandBg} sub="Subscription Account: Active" />
                                <KpiCard icon={ArrowUpRight} label="Intake Nodes" value={String(k?.activeTenants ?? 0)} sub="Billing cycle: Stable" color={P.cta} bg={P.ctaBg} trend="Healthy" />
                            </div>

                            <div className="glass-card" style={{ padding: 40, borderRadius: 24, border: '1px solid ' + P.border }}>
                                <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: '0 0 32px', letterSpacing: '-0.02em' }}>Financial Leaderboard</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg }}>
                                            {['Entity Performance Rank', 'Subscription Details', 'Learner Node Count', 'Net Period Revenue'].map(h => (
                                                <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...(data?.tenantSummaries ?? [])].sort((a, b) => b.revenueInPeriod - a.revenueInPeriod).map((t, i) => (
                                            <tr key={t.id} style={{ borderTop: '1px solid ' + P.border, background: i === 0 ? P.successBg + '20' : 'transparent' }}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: i < 3 ? P.ctaBg : P.bg, color: i < 3 ? P.cta : P.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 950 }}>{i + 1}</div>
                                                        <div style={{ fontSize: 15, fontWeight: 850, color: P.dark }}>{t.name}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span style={{ background: (SUB_COLORS[t.subscription_plan ?? 'free'] ?? P.muted) + '15', color: SUB_COLORS[t.subscription_plan ?? 'free'] ?? P.muted, padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.subscription_plan ?? 'free'} Architecture</span>
                                                </td>
                                                <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 750, color: P.text }}>{t.studentCount.toLocaleString()}</td>
                                                <td style={{ padding: '20px 24px', fontSize: 18, fontWeight: 950, color: t.revenueInPeriod > 0 ? P.success : P.muted }}>
                                                    \u20B9{t.revenueInPeriod.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ STUDENTS TAB â”€â”€ */}
                    {activeTab === 'students' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                <KpiCard icon={GraduationCap} label="Total Learners" value={(k?.totalStudents ?? 0).toLocaleString()} color={P.brand} bg={P.brandBg} trend="Steady" />
                                <KpiCard icon={Target} label="Platform Precision" value={(k?.avgScore ?? '0') + '%'} color={P.success} bg={P.successBg} sub="Aggregate Score" />
                                <KpiCard icon={Activity} label="Cognitive Accuracy" value={(k?.avgAccuracy ?? '0') + '%'} color={P.info} bg={P.infoBg} sub="Decision Pathing" />
                                <KpiCard icon={Cpu} label="AI Insights Cycle" value={(k?.aiMentorSessions ?? 0).toLocaleString()} color={P.cta} bg={P.ctaBg} trend="Intense" />
                            </div>

                            <div className="glass-card" style={{ padding: 40, borderRadius: 24, border: '1px solid ' + P.border }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>Intake Cycle Analytics</h3>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: 3, background: P.info }} />
                                            <span style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>Attempts</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data?.monthlyAttempts ?? []} margin={{ left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 750, fill: P.muted }} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis tick={{ fontSize: 11, fontWeight: 750, fill: P.muted }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: P.hover, opacity: 0.5 }} />
                                            <Bar dataKey="count" radius={[8, 8, 2, 2]} barSize={40} name="Attempts">
                                                {(data?.monthlyAttempts ?? []).map((_, i) => <Cell key={i} fill={i === 5 ? P.info : P.infoBg} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ TENANTS LEADERBOARD â”€â”€ */}
                    {activeTab === 'tenants' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>Entity Ecosystem Leaderboard</h3>
                                    <p style={{ margin: '6px 0 0', fontSize: 14, color: P.muted, fontWeight: 650 }}>Ranked platform usage metrics.</p>
                                </div>
                                <div style={{ position: 'relative', width: 340 }}>
                                    <Search size={18} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter entities by name or logic ID..." className="focus-ring" style={{ width: '100%', padding: '12px 16px', paddingLeft: 46, border: `1px solid ${P.border}`, borderRadius: 14, fontSize: 14, color: P.dark, background: P.card, outline: 'none', fontWeight: 650 }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[...filteredTenants].sort((a, b) => b.revenueInPeriod - a.revenueInPeriod).map(t => (
                                    <TenantRow key={t.id} t={t} />
                                ))}
                                {filteredTenants.length === 0 && (
                                    <div className="glass-card" style={{ padding: 80, textAlign: 'center', borderRadius: 24, border: '1px solid ' + P.border }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 20, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid ${P.border}` }}>
                                            <Search size={32} color={P.muted} />
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 950, color: P.dark }}>No entities matched your filter.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ PROCTORING â”€â”€ */}
                    {activeTab === 'proctoring' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                <KpiCard icon={Shield} label="Integrity Flags" value={String(data?.procBreakdown.total ?? 0)} color={P.dark} bg={P.hover} sub="Platform Integrity: Monitored" />
                                <KpiCard icon={Activity} label="High Severity" value={String(data?.procBreakdown.high ?? 0)} color={P.warning} bg={P.warningBg} trend="Action Required" />
                                <KpiCard icon={ShieldAlert} label="System Breaches" value={String(data?.procBreakdown.critical ?? 0)} color={P.error} bg={P.errorBg} badge="LOCKDOWN" />
                                <KpiCard icon={Zap} label="Edge Response" value="1.2ms" color={P.info} bg={P.infoBg} sub="Intake Latency: Optimal" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.4fr)', gap: 24 }}>
                                <div className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid ' + P.border }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: '0 0 24px', letterSpacing: '-0.01em' }}>Policy Violation Logs</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: P.bg }}>
                                                    {['Entity Node', 'Violation Volume', 'Root Severity'].map(h => (
                                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...(data?.tenantSummaries ?? [])].sort((a, b) => b.procFlags - a.procFlags).map(t => {
                                                    const sev = t.procFlags >= 10 ? 'Critical' : t.procFlags >= 5 ? 'High' : t.procFlags >= 1 ? 'Elevated' : 'Pristine'
                                                    const sevColor = sev === 'Critical' ? P.error : sev === 'High' ? '#F97316' : sev === 'Elevated' ? P.warning : P.success
                                                    return (
                                                        <tr key={t.id} style={{ borderTop: '1px solid ' + P.border }}>
                                                            <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 850, color: P.dark }}>{t.name}</td>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                <span style={{ fontSize: 16, fontWeight: 950, color: t.procFlags > 0 ? P.error : P.muted }}>{t.procFlags}</span>
                                                            </td>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                <span style={{ background: sevColor + '15', color: sevColor, padding: '5px 12px', borderRadius: 8, fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>{sev}</span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid ' + P.border }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: '0 0 24px', letterSpacing: '-0.01em' }}>Severity Breakdown</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {[
                                            { label: 'Low Intensity', count: data?.procBreakdown.low ?? 0, color: P.info },
                                            { label: 'Moderate Risk', count: data?.procBreakdown.medium ?? 0, color: P.warning },
                                            { label: 'High Severity', count: data?.procBreakdown.high ?? 0, color: '#F97316' },
                                            { label: 'Critical Breach', count: data?.procBreakdown.critical ?? 0, color: P.error },
                                        ].map(row => {
                                            const total = Math.max(data?.procBreakdown.total ?? 1, 1)
                                            return (
                                                <div key={row.label}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 850, color: P.dark, textTransform: 'uppercase' }}>{row.label}</span>
                                                        <span style={{ fontSize: 14, fontWeight: 950, color: row.color }}>{row.count}</span>
                                                    </div>
                                                    <div style={{ background: P.bg, borderRadius: 99, height: 8, overflow: 'hidden' }}>
                                                        <div style={{ width: ((row.count / total) * 100) + '%', height: '100%', background: row.color, borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.19, 1, 0.22, 1)' }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div style={{ marginTop: 32, padding: 20, background: P.infoBg, borderRadius: 16, border: `1px solid ${P.info}20` }}>
                                        <div style={{ display: 'flex', gap: 12, color: P.info }}>
                                            <ShieldCheck size={20} strokeWidth={2.5} />
                                            <div style={{ fontSize: 12, fontWeight: 750, color: P.info, lineHeight: 1.5 }}>Our AI Proctoring engine is scanning all active intake nodes for behavioral anomalies.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    )
}
