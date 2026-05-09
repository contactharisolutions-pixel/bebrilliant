'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import {
    Activity, TrendingUp, Users, Target, Loader2,
    ArrowUpRight, ArrowDownRight, Search, Filter,
    Cpu, Zap, Shield, Globe, Award, BrainCircuit,
    BarChart3, PieChart as PieIcon, LineChart as LineIcon,
    RefreshCcw, Download, CalendarDays, MousePointer2,
    ArrowRight
} from 'lucide-react'

const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.7)'
}

// ── MOCK DATA ENGINE ─────────────────────────────────────
const MOCK_DATA = {
    growth: [
        { name: 'Jan', velocity: 65, surface: 40, signal: 28 },
        { name: 'Feb', velocity: 72, surface: 48, signal: 35 },
        { name: 'Mar', velocity: 68, surface: 52, signal: 42 },
        { name: 'Apr', velocity: 85, surface: 60, signal: 55 },
        { name: 'May', velocity: 92, surface: 75, signal: 68 },
        { name: 'Jun', velocity: 98, surface: 82, signal: 75 },
    ],
    distribution: [
        { name: 'Mathematics & Science', value: 35, fill: COLORS.primary },
        { name: 'Languages & Arts', value: 40, fill: COLORS.success },
        { name: 'General Studies', value: 25, fill: COLORS.warning },
    ],
    subject_radar: [
        { subject: 'Math', performance: 88, target: 92 },
        { subject: 'Physics', performance: 75, target: 85 },
        { subject: 'Chemistry', performance: 82, target: 80 },
        { subject: 'Biology', performance: 90, target: 88 },
        { subject: 'English', performance: 65, target: 80 },
    ]
}

// ── UI COMPONENTS ──────────────────────────────────
function AnalyticsKpi({ label, value, trend, icon: Icon, color }: any) {
    const isUp = trend.startsWith('+')
    return (
        <div className="analytics-card" style={{ background: '#FFF', padding: 28, borderRadius: 28, border: '1px solid #F1F5F9', boxShadow: '0 10px 30px rgba(0,75,147,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 10, background: `${color}10`, borderRadius: 14 }}>
                    <Icon size={20} color={color} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 900, color: isUp ? COLORS.success : COLORS.danger }}>
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                </div>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
                <Icon size={120} color={color} />
            </div>
        </div>
    )
}

// ── MAIN ENGINE ──────────────────────────────────────────
export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState('')

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const json = await res.json()
                    setRole(json.role)
                }
            } finally { setLoading(false) }
        }
        init()
    }, [])

    if (loading) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING ANALYTICS MODULE...</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes float { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .analytics-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,75,147,0.06) !important; border-color: ${COLORS.primary}20 !important; }
            `}</style>

            {/* ANALYTICS HUD HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <BarChart3 size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Institutional Analytics</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        View overall performance, learning trends, and general academic metrics across your institution.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ background: '#FFF', border: '2px solid #F1F5F9', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CalendarDays size={18} color={COLORS.slate} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Last 30 Days</span>
                    </div>
                    <button style={{ padding: '14px 24px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.1)' }}>
                        <Download size={18} /> Export Report
                    </button>
                </div>
            </div>

            {/* PERFORMANCE OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                <AnalyticsKpi label="Active Students" value="4,820" trend="+14.2%" icon={Users} color={COLORS.primary} />
                <AnalyticsKpi label="Average Score" value="84.6" trend="+6.8%" icon={TrendingUp} color={COLORS.success} />
                <AnalyticsKpi label="Total Exams Taken" value="12,042" trend="+28%" icon={Target} color={COLORS.warning} />
                <AnalyticsKpi label="Passing Rate" value="99.9%" trend="+0.1%" icon={Award} color="#8B5CF6" />
            </div>

            {/* MAIN DATA LAYER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 32, marginBottom: 32 }}>

                {/* SUCCESS SIGNAL GROWTH */}
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Overall Performance Growth</h3>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}>Average Score vs Participation</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: COLORS.primary }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.primary }} /> AVG SCORE</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: COLORS.success }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.success }} /> PARTICIPATION</div>
                        </div>
                    </div>

                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_DATA.growth}>
                                <defs>
                                    <linearGradient id="primeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="succGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 1000, padding: '12px 20px' }}
                                    cursor={{ stroke: COLORS.primary, strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area type="monotone" dataKey="velocity" stroke={COLORS.primary} strokeWidth={4} fill="url(#primeGrad)" />
                                <Area type="monotone" dataKey="surface" stroke={COLORS.success} strokeWidth={4} fill="url(#succGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* COMPETENCY DISTRIBUTION */}
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ margin: '0 0 32px', fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Topic Categories</h3>
                    <div style={{ height: 300, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 1000, color: '#0F172A' }}>92.4</div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>AVG GRADE</div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={MOCK_DATA.distribution}
                                    innerRadius={90}
                                    outerRadius={120}
                                    paddingAngle={12}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={10}
                                >
                                    {MOCK_DATA.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 1000 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {MOCK_DATA.distribution.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.fill }} />
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>{item.name}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 1000, color: '#1E293B' }}>{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PERFORMANCE DRILL-DOWN RADAR MOCK */}
            <div style={{ background: '#0F172A', borderRadius: 36, padding: 48, color: '#FFF', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'center' }}>
                <div>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 24 }}>
                        <Activity size={18} color={COLORS.success} />
                        <span style={{ fontSize: 12, fontWeight: 1000, letterSpacing: '0.1em' }}>PERFORMANCE BY SUBJECT</span>
                    </div>
                    <h2 style={{ fontSize: 32, fontWeight: 1000, margin: '0 0 16px', letterSpacing: '-0.03em' }}>Subject-wise Performance</h2>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontWeight: 600, margin: 0 }}>
                        Breakdown of average performance across all subjects compared to targets.
                    </p>
                    <button style={{ marginTop: 32, padding: '16px 32px', borderRadius: 18, background: '#FFF', color: '#0F172A', border: 'none', fontSize: 14, fontWeight: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                        Download Performance Report <ArrowRight size={18} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
                     {MOCK_DATA.subject_radar.map((subj, i) => (
                        <div key={i} style={{ padding: '24px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', marginBottom: 12, textTransform: 'uppercase' }}>{subj.subject}</div>
                            <div style={{ fontSize: 24, fontWeight: 1000, color: COLORS.success }}>{subj.performance}%</div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 10, margin: '16px 0', overflow: 'hidden' }}>
                                <div style={{ width: `${subj.performance}%`, height: '100%', background: COLORS.success }} />
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 1000, color: 'rgba(255,255,255,0.3)' }}>TARGET: {subj.target}%</div>
                        </div>
                     ))}
                </div>
            </div>
        </div>
    )
}
