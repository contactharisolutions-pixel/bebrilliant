'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, UserCheck, GraduationCap, ClipboardList, Wallet, DollarSign, Target,
    PlusCircle, UserPlus, UploadCloud, Eye, RefreshCw, Loader2, ArrowUpRight,
    TrendingUp, Activity, Layers, ShieldCheck
} from 'lucide-react'
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Link from 'next/link'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

export default function TenantDashboard() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const res = await fetch('/api/admin/dashboard')
            const d = await res.json()
            setData(d)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => { 
        setMounted(true)
        fetchData() 
    }, [])

    if (loading) return (
        <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: P.bg }}>
            <Loader2 size={44} color={P.brand} className="animate-spin" />
            <p style={{ marginTop: 24, fontSize: 14, fontWeight: 900, color: P.brand, letterSpacing: '0.1em' }}>SYNCHRONIZING COMMAND CENTER...</p>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    )

    const { kpi, charts } = data || {}

    return (
        <div style={{ padding: '40px 48px', background: P.bg, minHeight: '100%' }}>
            <style>{GLASS_STYLES}</style>

            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }} className="fade-in">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tenant Architecture</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Institute Portal v4.2</div>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>Institute Command Center</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 15, color: P.muted, fontWeight: 600, maxWidth: 600 }}>
                        Manage academic sequences, monitor student conversions, and audit institutional revenue across the system.
                    </p>
                </div>

                {/* QUICK ACTIONS */}
                <div style={{ display: 'flex', gap: 14 }}>
                    <button onClick={() => fetchData(true)} disabled={refreshing} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={18} color={P.brand} className={refreshing ? 'animate-spin' : ''} /> 
                        {refreshing ? 'Syncing...' : 'Sync Analytics'}
                    </button>
                    <Link href="/admin/exams/new" className="hover-lift" style={{ textDecoration: 'none', background: P.brand, color: '#fff', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30` }}>
                        <PlusCircle size={18} strokeWidth={3} /> Create Assessment
                    </Link>
                </div>
            </header>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }} className="fade-in">
                <KpiCard title="Active Service Nodes" value={kpi?.total_students} icon={Users} color={P.brand} trend="Learners" trendIsUp={true} />
                <KpiCard title="Lead Conversion" value={`${kpi?.conversion_rate}%`} icon={Target} color={P.cta} trend="CRM Conversions" trendIsUp={true} />
                <KpiCard title="Faculty Presence" value={kpi?.teachers_count} icon={GraduationCap} color="#7C3AED" trend="Staff Units" trendIsUp={true} />
                <KpiCard title="Gross Revenue" value={`₹${(kpi?.revenue_earned || 0).toLocaleString('en-IN')}`} icon={Wallet} color={P.success} trend="Revenue" trendIsUp={true} />
            </div>

            {/* CHARTS LAYER */}
            {mounted && charts && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginBottom: 32 }} className="fade-in">
                    {/* STUDENT GROWTH CHART */}
                    <div className="glass-card" style={{ border: `1px solid ${P.border}`, padding: 32, borderRadius: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Metrics Trajectory</h3>
                                <div style={{ fontSize: 13, color: P.muted, marginTop: 4, fontWeight: 600 }}>Temporal analysis of student base expansion</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.success, fontSize: 13, fontWeight: 900, background: P.successBg, padding: '6px 14px', borderRadius: 99 }}>
                                <TrendingUp size={16} /> +12.5% vs Last Orbit
                            </div>
                        </div>
                        <div style={{ height: 340 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts?.student_growth}>
                                    <defs>
                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={P.brand} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={P.brand} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: P.muted, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: P.muted, fontWeight: 700 }} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.1)', background: P.card }}
                                        itemStyle={{ fontSize: 13, fontWeight: 900, color: P.brand }}
                                    />
                                    <Area type="monotone" dataKey="students" stroke={P.brand} strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* REVENUE TRENDS */}
                    <div className="glass-card" style={{ border: `1px solid ${P.border}`, padding: 32, borderRadius: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Growth Cycle Analytics</h3>
                        <div style={{ fontSize: 13, color: P.muted, marginTop: 4, marginBottom: 28, fontWeight: 600 }}>7-Day Institutional Revenue</div>
                        <div style={{ height: 340 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts?.revenue_trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: P.muted, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: P.muted, fontWeight: 700 }} dx={-10} width={40} />
                                    <Tooltip cursor={{ fill: P.bg }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.1)', background: P.card }} />
                                    <Bar dataKey="revenue" fill={P.success} radius={[8, 8, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* SECONDARY ACTION NODES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="fade-in">
                {[
                    { label: 'Curriculum Updates', desc: 'Provision new course logic and blueprints', icon: Layers, href: '/admin/syllabus', color: P.brand },
                    { label: 'Edge Pro Onboarding', desc: 'Initialize new faculty service units', icon: UserPlus, href: '/admin/students/new', color: P.cta },
                    { label: 'CRM Analytics', desc: 'Full-spectrum CRM analytics', icon: Activity, href: '/admin/crm', color: P.success },
                ].map((node, i) => (
                    <Link key={i} href={node.href} className="glass-card hover-lift" style={{ padding: 24, borderRadius: 24, border: `1px solid ${P.border}`, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <node.icon size={22} color={node.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{node.label}</div>
                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 2 }}>{node.desc}</div>
                        </div>
                        <ArrowUpRight size={18} color={P.muted} style={{ marginLeft: 'auto' }} />
                    </Link>
                ))}
            </div>

        </div>
    )
}
