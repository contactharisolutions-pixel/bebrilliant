'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    School, Users, DollarSign, GraduationCap, Bell, Search, LayoutGrid,
    TrendingUp, CreditCard, Clock, Activity, ChevronRight, BarChart4,
    UserPlus, ShieldAlert, Receipt, RefreshCw, ChevronDown, ChevronUp,
    CheckCircle2, ArrowUpRight, Calendar, Building2, SearchX, Award,
    SlidersHorizontal, HelpCircle, Shield, AlertTriangle
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

const CHART_COLORS = ['#004B93', '#F0A026', '#1FAC63', '#3B82F6', '#9333EA', '#E11D48']

const DAYS_OPTIONS = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
]

function KpiCard({ icon: Icon, label, value, sub, trend, color, bg }: {
    icon: any; label: string; value: string; sub?: string; trend?: string; color: string; bg: string
}) {
    return (
        <div 
            className="hover-lift"
            style={{
                background: P.card,
                border: `1px solid ${P.border}`,
                borderRadius: 20,
                padding: '22px 24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <div style={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.05, filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 14px ${color}15` }}>
                    <Icon size={22} color={color} strokeWidth={2.5} />
                </div>
                {trend && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: P.success, background: P.successBg, padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <TrendingUp size={12} /> {trend}
                    </span>
                )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 950, color: P.dark, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</div>
            {sub && (
                <div style={{ fontSize: 12, color: P.muted, marginTop: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={12} color={P.brand} /> {sub}
                </div>
            )}
        </div>
    )
}

function SchoolRow({ school }: { school: any }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} className="hover-lift">
            <div onClick={() => setOpen(!open)} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <School size={20} color={P.brand} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{school.name}</div>
                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 2 }}>{school.type || 'Institute'} • Joined {new Date(school.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', gap: 28, flexShrink: 0, marginRight: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: P.brand }}>{school.userCount}</div>
                        <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, textTransform: 'uppercase' }}>Users</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: P.success }}>₹{Number(school.revenueInPeriod || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, textTransform: 'uppercase' }}>Earnings</div>
                    </div>
                </div>
                <span style={{ background: school.is_active ? P.successBg : P.errorBg, color: school.is_active ? P.success : P.error, padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                    {school.is_active ? 'Active' : 'Inactive'}
                </span>
                {open ? <ChevronUp size={18} color={P.muted} /> : <ChevronDown size={18} color={P.muted} />}
            </div>
            {open && (
                <div style={{ padding: '0 24px 20px', borderTop: `1px solid ${P.border}`, background: P.bg }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                        {[
                            { label: 'Students', val: school.studentCount, icon: GraduationCap, color: P.brand, bg: P.brandBg },
                            { label: 'Exams Created', val: school.examCount, icon: BarChart4, color: P.info, bg: P.infoBg },
                            { label: 'Average Accuracy', val: school.avgAccuracy ? `${school.avgAccuracy}%` : 'N/A', icon: Award, color: P.success, bg: P.successBg },
                            { label: 'System Alerts', val: school.systemAlerts, icon: ShieldAlert, color: school.systemAlerts > 0 ? P.error : P.muted, bg: school.systemAlerts > 0 ? P.errorBg : P.hover },
                        ].map(c => (
                            <div key={c.label} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${P.border}`, padding: '14px 16px' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                    <c.icon size={15} color={c.color} />
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: c.color }}>{c.val}</div>
                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2 }}>{c.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function DashboardPage() {
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [days, setDays] = useState(30)
    const [tenantFilter, setTenantFilter] = useState('all')
    const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'students' | 'schools' | 'safety'>('overview')
    const [searchQuery, setSearchQuery] = useState('')

    const loadData = useCallback(async (isSync = false) => {
        if (isSync) setRefreshing(true)
        else setLoading(true)

        try {
            const params = new URLSearchParams({ days: String(days), tenant: tenantFilter })
            const res = await fetch('/api/owner/dashboard?' + params)
            const json = await res.json()
            if (res.ok) {
                setData(json)
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [days, tenantFilter])

    useEffect(() => {
        loadData()
    }, [loadData])

    const stats = data?.stats || {}
    const filteredSchools = (data?.tenantSummaries || []).filter((s: any) =>
        !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: P.bg }}>
                <div style={{ width: 56, height: 56, background: P.brand, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 16px 32px ${P.brand}30` }}>
                    <RefreshCw size={28} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: P.dark, marginTop: 20, letterSpacing: '0.05em' }}>LOADING DASHBOARD...</div>
                <div style={{ fontSize: 12, color: P.muted, marginTop: 6 }}>Fetching latest statistics</div>
            </div>
        )
    }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px 40px' }}>
            <style>{GLASS_STYLES + `
                .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>

            {/* TOP CONTROLS & HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Super Admin Panel
                        </span>
                    </div>
                    <h1 style={{ fontSize: 30, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>
                        Platform Dashboard & Analytics
                    </h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>
                        Complete operational and earnings overview across all registered schools.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Time Range Switcher */}
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 4 }}>
                        {DAYS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDays(opt.value)}
                                style={{
                                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                                    background: days === opt.value ? '#fff' : 'transparent',
                                    color: days === opt.value ? P.brand : P.muted,
                                    boxShadow: days === opt.value ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* School Filter Dropdown */}
                    <select
                        value={tenantFilter}
                        onChange={e => setTenantFilter(e.target.value)}
                        style={{
                            padding: '10px 16px', borderRadius: 12, border: `1px solid ${P.border}`, background: '#fff',
                            fontSize: 13, fontWeight: 700, color: P.dark, outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Schools</option>
                        {(data?.tenants || []).map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    {/* Sync / Refresh Button */}
                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`,
                            padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={15} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>

                    {/* Add School Button */}
                    <button
                        onClick={() => router.push('/owner/tenants?provision=true')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none',
                            padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 850, cursor: 'pointer',
                            boxShadow: `0 6px 16px ${P.brand}30`
                        }}
                    >
                        <LayoutGrid size={16} />
                        Add School
                    </button>
                </div>
            </div>

            {/* KPI METRIC CARDS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <KpiCard icon={School} label="Registered Schools" value={String(stats.totalTenants || 0)} sub={`${stats.activeTenants || 0} active now`} color={P.brand} bg={P.brandBg} trend="Growing" />
                <KpiCard icon={Users} label="Total Registered Users" value={Number(stats.totalUsers || 0).toLocaleString()} sub={`${Number(stats.totalStudents || 0).toLocaleString()} students`} color={P.info} bg={P.infoBg} trend="+12.4%" />
                <KpiCard icon={Receipt} label="Platform Revenue" value={`₹${Number(stats.totalRevenue || 0).toLocaleString()}`} sub="Total earnings" color={P.success} bg={P.successBg} trend="+8.2%" />
                <KpiCard icon={DollarSign} label="Platform Fees (10%)" value={`₹${Number(stats.netCommission || 0).toLocaleString()}`} sub="Earned commission" color={P.cta} bg={P.ctaBg} trend="+5.2%" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <KpiCard icon={CreditCard} label="Pending Payouts" value={`₹${Number(stats.pendingPayout || 0).toLocaleString()}`} sub={`${stats.pendingCount || 0} withdrawal requests`} color={P.cta} bg={P.ctaBg} />
                <KpiCard icon={BarChart4} label="Exams Conducted" value={Number(stats.totalExams || 0).toLocaleString()} sub={`${Number(stats.totalAttempts || 0).toLocaleString()} test submissions`} color={P.brand} bg={P.brandBg} />
                <KpiCard icon={Award} label="Average Test Score" value={`${stats.avgScore || 0}%`} sub={`Accuracy: ${stats.avgAccuracy || 0}%`} color={P.success} bg={P.successBg} />
                <KpiCard icon={UserPlus} label="New Inquiries" value={String(stats.activeLeads || 0)} sub="Pending follow-ups" color={P.info} bg={P.infoBg} />
            </div>

            {/* TABS NAVIGATION */}
            <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.03)', padding: 5, borderRadius: 14, width: 'fit-content', marginBottom: 24 }}>
                {[
                    { key: 'overview', label: 'Overview', icon: LayoutGrid },
                    { key: 'income', label: 'Income & Fees', icon: Receipt },
                    { key: 'students', label: 'Students & Exams', icon: GraduationCap },
                    { key: 'schools', label: 'School List', icon: School },
                    { key: 'safety', label: 'System Alerts & Safety', icon: ShieldAlert },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as any)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                            background: activeTab === t.key ? '#fff' : 'transparent',
                            color: activeTab === t.key ? P.brand : P.muted,
                            boxShadow: activeTab === t.key ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
                        {/* Monthly Revenue Velocity Chart */}
                        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: P.dark }}>Revenue Over Time</div>
                                    <div style={{ fontSize: 13, color: P.muted, marginTop: 2, fontWeight: 600 }}>Monthly platform income trend</div>
                                </div>
                                <button
                                    onClick={() => router.push('/owner/payments')}
                                    style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer' }}
                                >
                                    View Payments
                                </button>
                            </div>
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={P.brand} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={P.brand} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} dy={8} />
                                        <YAxis tick={{ fontSize: 12, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}k`} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${P.border}`, fontWeight: 800, fontSize: 12 }} />
                                        <Area type="monotone" dataKey="rev" stroke={P.brand} strokeWidth={3} fill="url(#gradRev)" dot={{ r: 4, fill: P.brand }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Escrow & Quick Actions Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Payout Card */}
                            <div style={{ background: `linear-gradient(135deg, ${P.card} 0%, ${P.bg} 100%)`, border: `1px solid ${P.border}`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
                                <div style={{ width: 50, height: 50, borderRadius: 14, background: P.ctaBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <CreditCard size={24} color={P.cta} strokeWidth={2.5} />
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 6 }}>Pending Payout Request</div>
                                <div style={{ fontSize: 32, fontWeight: 950, color: P.dark, marginBottom: 6 }}>₹{Number(stats.pendingPayout || 0).toLocaleString()}</div>
                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginBottom: 20 }}>{stats.pendingCount || 0} payout requests pending</div>
                                <button
                                    onClick={() => router.push('/owner/finance/payouts')}
                                    style={{ width: '100%', background: P.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                                >
                                    Process Payouts
                                </button>
                            </div>

                            {/* Quick Actions List */}
                            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 20, flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 900, color: P.dark, marginBottom: 16 }}>Quick Shortcuts</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { title: 'Admission Enquiries', sub: `${stats.activeLeads || 0} leads pending`, icon: UserPlus, color: P.info, bg: P.infoBg, action: () => router.push('/owner/crm') },
                                        { title: 'School Onboarding', sub: `${stats.totalTenants || 0} schools registered`, icon: School, color: P.brand, bg: P.brandBg, action: () => router.push('/owner/tenants') },
                                        { title: 'System Alerts', sub: stats.criticalAlerts > 0 ? `${stats.criticalAlerts} warnings` : 'System Normal', icon: ShieldAlert, color: stats.criticalAlerts > 0 ? P.error : P.success, bg: stats.criticalAlerts > 0 ? P.errorBg : P.successBg, action: () => setActiveTab('safety') }
                                    ].map(item => (
                                        <button key={item.title} onClick={item.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <item.icon size={16} color={item.color} />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{item.title}</div>
                                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{item.sub}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} color={P.muted} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Row: User Growth & User Roles */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: P.dark, marginBottom: 20 }}>New User Registrations</div>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.monthlyUsers || []} margin={{ left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${P.border}`, fontWeight: 800, fontSize: 12 }} />
                                        <Bar dataKey="count" fill={P.brand} radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 24 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: P.dark, marginBottom: 20 }}>User Roles Breakdown</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {(data?.roleDistribution || []).map((r: any, idx: number) => {
                                    const total = stats.totalUsers || 1
                                    const pct = Math.round((r.count / total) * 100)
                                    const col = CHART_COLORS[idx % CHART_COLORS.length]
                                    return (
                                        <div key={r.role}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: P.dark, marginBottom: 6 }}>
                                                <span>{r.role}</span>
                                                <span style={{ fontWeight: 900 }}>{r.count.toLocaleString()} ({pct}%)</span>
                                            </div>
                                            <div style={{ background: P.bg, height: 8, borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 99 }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. INCOME & FEES TAB */}
            {activeTab === 'income' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <KpiCard icon={DollarSign} label="Total Platform Income" value={`₹${Number(stats.totalRevenue || 0).toLocaleString()}`} color={P.success} bg={P.successBg} trend="+8.4%" />
                        <KpiCard icon={Receipt} label="Platform Fees (10%)" value={`₹${Number(stats.netCommission || 0).toLocaleString()}`} color={P.brand} bg={P.brandBg} sub="Platform revenue share" />
                        <KpiCard icon={CreditCard} label="Pending Payouts" value={`₹${Number(stats.pendingPayout || 0).toLocaleString()}`} color={P.cta} bg={P.ctaBg} sub={`${stats.pendingCount || 0} requests pending`} />
                    </div>

                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: P.dark, marginBottom: 20 }}>School Earnings & Subscription Plans</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: P.bg, textAlign: 'left' }}>
                                        {['School Name', 'Subscription Plan', 'Students', 'Total Income'].map(h => (
                                            <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...(data?.tenantSummaries || [])].sort((a, b) => b.revenueInPeriod - a.revenueInPeriod).map((s: any) => (
                                        <tr key={s.id} style={{ borderTop: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 800, color: P.dark }}>{s.name}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{ background: P.brandBg, color: P.brand, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                                                    {s.subscription_plan || 'Basic Plan'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: P.dark }}>{s.studentCount.toLocaleString()}</td>
                                            <td style={{ padding: '16px 20px', fontSize: 16, fontWeight: 900, color: P.success }}>₹{Number(s.revenueInPeriod || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STUDENTS & EXAMS TAB */}
            {activeTab === 'students' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <KpiCard icon={GraduationCap} label="Total Students" value={Number(stats.totalStudents || 0).toLocaleString()} color={P.brand} bg={P.brandBg} />
                        <KpiCard icon={BarChart4} label="Exams Conducted" value={Number(stats.totalExams || 0).toLocaleString()} color={P.info} bg={P.infoBg} />
                        <KpiCard icon={Award} label="Average Test Score" value={`${stats.avgScore || 0}%`} color={P.success} bg={P.successBg} />
                        <KpiCard icon={CheckCircle2} label="Average Accuracy" value={`${stats.avgAccuracy || 0}%`} color={P.cta} bg={P.ctaBg} />
                    </div>

                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: P.dark, marginBottom: 20 }}>Monthly Exam Submissions</div>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.monthlyAttempts || []} margin={{ left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${P.border}`, fontWeight: 800, fontSize: 12 }} />
                                    <Bar dataKey="count" fill={P.info} radius={[6, 6, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SCHOOLS LIST TAB */}
            {activeTab === 'schools' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: P.dark }}>Registered Schools</div>
                            <div style={{ fontSize: 13, color: P.muted, marginTop: 2, fontWeight: 600 }}>List of all registered schools and institutes</div>
                        </div>
                        <div style={{ position: 'relative', width: 320 }}>
                            <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search school by name..."
                                style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 13, outline: 'none', fontWeight: 600 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filteredSchools.map((s: any) => (
                            <SchoolRow key={s.id} school={s} />
                        ))}
                        {filteredSchools.length === 0 && (
                            <div style={{ background: P.card, padding: 60, textAlign: 'center', borderRadius: 20, border: `1px solid ${P.border}` }}>
                                <SearchX size={36} color={P.muted} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No schools found matching your search.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 5. SYSTEM ALERTS & SAFETY TAB */}
            {activeTab === 'safety' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <KpiCard icon={Shield} label="Total Safety Warnings" value={String(data?.alertBreakdown?.total || 0)} color={P.dark} bg={P.hover} sub="System Integrity Monitored" />
                        <KpiCard icon={AlertTriangle} label="Moderate Risk Alerts" value={String(data?.alertBreakdown?.medium || 0)} color={P.cta} bg={P.ctaBg} />
                        <KpiCard icon={ShieldAlert} label="High Risk Warnings" value={String(data?.alertBreakdown?.high || 0)} color={P.error} bg={P.errorBg} />
                        <KpiCard icon={CheckCircle2} label="Critical Breaches" value={String(data?.alertBreakdown?.critical || 0)} color={data?.alertBreakdown?.critical > 0 ? P.error : P.success} bg={data?.alertBreakdown?.critical > 0 ? P.errorBg : P.successBg} />
                    </div>

                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 28 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: P.dark, marginBottom: 20 }}>System Warning Summary per School</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: P.bg, textAlign: 'left' }}>
                                        {['School Name', 'Warnings Count', 'Status Level'].map(h => (
                                            <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...(data?.tenantSummaries || [])].sort((a, b) => b.systemAlerts - a.systemAlerts).map((s: any) => {
                                        const level = s.systemAlerts >= 5 ? 'High Risk' : s.systemAlerts >= 1 ? 'Moderate Risk' : 'Normal'
                                        const col = level === 'High Risk' ? P.error : level === 'Moderate Risk' ? P.cta : P.success
                                        return (
                                            <tr key={s.id} style={{ borderTop: `1px solid ${P.border}` }}>
                                                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 800, color: P.dark }}>{s.name}</td>
                                                <td style={{ padding: '16px 20px', fontSize: 15, fontWeight: 900, color: s.systemAlerts > 0 ? P.error : P.muted }}>{s.systemAlerts}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{ background: `${col}15`, color: col, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                                                        {level}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER HEARTBEAT */}
            <div style={{ marginTop: 32, background: P.dark, borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success, boxShadow: `0 0 12px ${P.success}` }} className="pulse" />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Platform System Status: <span style={{ color: P.success }}>ONLINE</span></span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>All services operating normally</div>
            </div>
        </div>
    )
}
