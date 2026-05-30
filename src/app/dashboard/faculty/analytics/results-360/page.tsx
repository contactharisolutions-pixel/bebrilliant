'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    BarChart3, PieChart, TrendingUp, Users, BookOpen,
    ChevronRight, Search, Layout, Filter, Calendar,
    Target, Award, AlertTriangle, ArrowUpRight,
    ArrowDownRight, Loader2, Sparkles, Map, Info, Zap,
    Waves, Activity, Brain, Fingerprint, ArrowRight,
    UserCircle, BookMarked, LineChart, ShieldCheck, RefreshCcw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ── CUSTOM CHART COMPONENTS ─────────────────
const ProgressCircle = ({ percent, size = 160, stroke = 12 }: any) => {
    const radius = (size - stroke) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percent / 100) * circumference
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#004B93" />
                        <stop offset="100%" stopColor="#1FAC63" />
                    </linearGradient>
                </defs>
                <circle cx={size/2} cy={size/2} r={radius} stroke="#F1F5F9" strokeWidth={stroke} fill="transparent" />
                <circle cx={size/2} cy={size/2} r={radius} stroke="url(#scoreGradient)" strokeWidth={stroke} fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>{percent}%</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Avg Score</div>
            </div>
        </div>
    )
}
const COLORS = {
    blue: '#004B93',
    green: '#1FAC63',
    orange: '#F0A026',
    purple: '#8B5CF6',
    slate: '#64748B',
    border: '#E5E7EB',
    bg: '#F9FAFB'
}
const GLASS_CARD = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '28px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.02)'
}
// ── MAIN DASHBOARD ──────────────────
export default function Result360Analytics() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [selectedView, setSelectedView] = useState<'standard' | 'student' | 'subject'>('standard')
    const [filters, setFilters] = useState({ standard: 'Std 10', division: 'Division A', search: '' })
    const fetchAnalytics = useCallback(async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1200))
        setStats({
            overview: {
                avg_percentage: 74.2,
                pass_rate: 88,
                total_students: 42,
                improvement: +3.4,
                weak_subjects: ['Physics', 'Sanskrit'],
                top_students: [
                    { name: 'Aditya Sharma', score: 98.4, trend: 'up', id: 'STUD-001' },
                    { name: 'Anjali Verma', score: 94.2, trend: 'stable', id: 'STUD-002' },
                    { name: 'Rahul Kumar', score: 92.1, trend: 'up', id: 'STUD-003' },
                    { name: 'Priya Das', score: 89.5, trend: 'up', id: 'STUD-004' },
                    { name: 'Sohan Singh', score: 87.2, trend: 'down', id: 'STUD-005' }
                ]
            },
            subject_details: [
                { name: 'Logic (Mathematics)', score: 88, topics: ['Algebra', 'Calculus', 'Geometry'], confidence: 94 },
                { name: 'Linguistics (English)', score: 82, topics: ['Grammar', 'Literature'], confidence: 88 },
                { name: 'Physical Bio (Biology)', score: 75, topics: ['Cell Structure', 'Genetics'], confidence: 72 },
                { name: 'Chemical Synthesis', score: 68, topics: ['Organic', 'Inorganic'], confidence: 64 },
                { name: 'World History', score: 94, topics: ['Modern Era', 'Ancient'], confidence: 98 }
            ],
            weekly_growth: [45, 52, 48, 60, 58, 65, 74, 82],
            distribution: [
                { label: 'Exemplary (A+)', count: 4, color: COLORS.green },
                { label: 'Advanced (A)', count: 12, color: COLORS.blue },
                { label: 'Proficient (B)', count: 18, color: COLORS.purple },
                { label: 'Developing (C)', count: 6, color: COLORS.orange },
                { label: 'Critical (F)', count: 2, color: '#EF4444' }
            ]
        })
        setLoading(false)
    }, [])
    useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
    if (loading && !stats) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
            <Loader2 size={48} color={COLORS.blue} className="spin" style={{ margin: '0 auto 24px' }} />
            <div style={{ color: COLORS.blue, fontWeight: 900, fontSize: 18, letterSpacing: '0.1em' }}>LOADING ACADEMIC DATA...</div>
            <p style={{ marginTop: 8, fontSize: 13, color: COLORS.slate, fontWeight: 600 }}>Aggregating multi-dimensional assessment vectors.</p>
        </div>
    )
    return (
        <div style={{ padding: '40px 48px', background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* HEADER & CONTROLS */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, animation: 'fadeIn 0.5s ease-out' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: '#111827', color: '#FFF', borderRadius: 8, fontSize: 11, fontWeight: 900, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <Brain size={12} fill="#FFF" stroke="none" /> Analytics Engine
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em' }}>360° Student Performance Analytics</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 16, color: COLORS.slate, fontWeight: 500 }}>{selectedView === 'standard' ? 'Deciphering cohort mastery across multi-dimensional evaluative vectors.' : selectedView === 'student' ? 'Individual candidate performance mapping and trend analysis.' : 'Detailed subject vertical and topic mastery diagnostics.'}</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 4, background: '#FFF', padding: 6, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                        {(['Standard', 'Student', 'Subject'] as const).map((v) => (
                            <button key={v} onClick={() => setSelectedView(v.toLowerCase() as any)} style={{ padding: '8px 24px', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, background: selectedView === v.toLowerCase() ? `${COLORS.blue}10` : 'transparent', color: selectedView === v.toLowerCase() ? COLORS.blue : COLORS.slate, cursor: 'pointer', transition: '0.2s' }}>{v}</button>
                        ))}
                    </div>
                    <button onClick={fetchAnalytics} className="btn-primary">
                        <RefreshCcw size={18} className={loading ? 'spin' : ''} /> Refresh Insights
                    </button>
                </div>
            </header>
            {/* ANALYTICS FILTERS */}
            <div className="glass-card" style={{ background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '20px 32px', display: 'flex', gap: 32, alignItems: 'center', marginBottom: 40, boxShadow: '0 4px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Layout size={18} color={COLORS.slate} />
                    <select value={filters.standard} onChange={e => setFilters({...filters, standard: e.target.value})} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 800, color: '#111827', cursor: 'pointer' }}>
                        <option>Std 10</option>
                        <option>Std 11</option>
                        <option>Std 12</option>
                    </select>
                </div>
                <div style={{ width: 1, height: 24, background: COLORS.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Filter size={18} color={COLORS.slate} />
                    <select value={filters.division} onChange={e => setFilters({...filters, division: e.target.value})} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 800, color: '#111827', cursor: 'pointer' }}>
                        <option>Division A</option>
                        <option>Division B</option>
                    </select>
                </div>
                <div style={{ width: 1, height: 24, background: COLORS.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <Search size={18} color={COLORS.slate} />
                    <input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Drilldown by candidate or subject identifier..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 600, color: '#111827', width: '100%' }} />
                </div>
            </div>
            {selectedView === 'standard' && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    {/* KPI MEASURES */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                        {[
                            { label: 'Cohorts Aggregate Mean', val: stats.overview.avg_percentage + '%', icon: Target, color: COLORS.blue, trend: +2.1 },
                            { label: 'Inference Accuracy', val: '99.4%', icon: Activity, color: COLORS.green, trend: 'SECURE' },
                            { label: 'Active Candidates', val: stats.overview.total_students, icon: Users, color: '#111827', trend: 0 },
                            { label: 'Data Sync Integrity', val: 'Synchronized', icon: Zap, color: COLORS.orange, trend: 'OPTIMIZED' }
                        ].map((m, i) => (
                            <div key={i} className="glass-card hover-lift" style={{ background: '#FFF', padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${m.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><m.icon size={22} color={m.color} /></div>
                                    {m.trend !== 0 && <div style={{ fontSize: 11, fontWeight: 900, color: typeof m.trend === 'string' ? COLORS.slate : m.trend > 0 ? COLORS.green : '#EF4444', background: typeof m.trend === 'string' ? COLORS.bg : m.trend > 0 ? `${COLORS.green}10` : '#FEF2F2', padding: '4px 10px', borderRadius: 8 }}>{typeof m.trend === 'number' && (m.trend > 0 ? '+' : '')}{m.trend}{typeof m.trend === 'number' ? '%' : ''}</div>}
                                </div>
                                <div style={{ marginTop: 24 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginTop: 4 }}>{m.val}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <div className="glass-card" style={{ background: '#FFF', padding: 40, border: `1px solid ${COLORS.border}` }}>
                                <h3 style={{ margin: '0 0 40px', fontSize: 20, fontWeight: 900, color: '#111827' }}>Curriculum Mastery Radar</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    {stats.subject_details.map((s: any, i: number) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 800 }}>{s.name}</span><span style={{ fontSize: 15, fontWeight: 900 }}>{s.score}%</span></div>
                                            <div style={{ height: 10, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}><div className="bar-loading" style={{ height: '100%', background: s.score < 70 ? '#EF4444' : `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.green})`, width: `${s.score}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <div className="glass-card" style={{ background: '#FFF', padding: 40, border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                                <ProgressCircle percent={stats.overview.avg_percentage} />
                                <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {stats.distribution.map((d: any, i: number) => (
                                        <div key={i} style={{ padding: '12px', background: COLORS.bg, borderRadius: 16, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                                            <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: 10, fontWeight: 800, color: COLORS.slate }}>{d.label.split(' ')[0]}</div><div style={{ fontSize: 13, fontWeight: 900 }}>{d.count} candidates</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {selectedView === 'student' && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div className="glass-card" style={{ background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 28, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
                                <tr style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: COLORS.slate }}>
                                    <th style={{ padding: '20px 32px' }}>Candidate Profile</th>
                                    <th style={{ padding: '20px 32px' }}>Aggregate Score</th>
                                    <th style={{ padding: '20px 32px' }}>Trajectory</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.overview.top_students.map((s: any) => (
                                    <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 44, height: 44, background: `${COLORS.blue}10`, color: COLORS.blue, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCircle size={22} /></div>
                                                <div><div style={{ fontSize: 16, fontWeight: 800 }}>{s.name}</div><div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 600 }}>ID: {s.id}</div></div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.blue }}>{s.score}%<span style={{ fontSize: 12, color: COLORS.slate, marginLeft: 8, fontWeight: 600 }}>AGGREGATE</span></div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.trend === 'up' ? COLORS.green : s.trend === 'down' ? '#EF4444' : COLORS.orange }}>
                                                {s.trend === 'up' ? <TrendingUp size={16} /> : <Activity size={16} />}
                                                <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>{s.trend === 'up' ? 'Accelerating' : s.trend === 'down' ? 'Deviating' : 'Stable'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <button style={{ background: 'none', border: 'none', color: COLORS.blue, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                                                View Vector <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {selectedView === 'subject' && (
                <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {stats.subject_details.map((s: any, i: number) => (
                        <div key={i} className="glass-card hover-lift" style={{ background: '#FFF', padding: 32, border: `1px solid ${COLORS.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div style={{ width: 48, height: 48, background: `${COLORS.blue}10`, color: COLORS.blue, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookMarked size={22} /></div>
                                <div style={{ padding: '6px 12px', background: s.confidence >= 90 ? `${COLORS.green}10` : '#F9FAFB', color: s.confidence >= 90 ? COLORS.green : COLORS.slate, borderRadius: 10, fontSize: 11, fontWeight: 900 }}>{s.confidence}% CONFIDENT</div>
                            </div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{s.name}</h3>
                            <div style={{ marginTop: 24 }}>
                                <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.blue }}>{s.score}%</div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.slate, marginTop: 4, textTransform: 'uppercase' }}>Weighted Vertical Score</div>
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {s.topics.map((t: string) => (
                                    <span key={t} style={{ fontSize: 11, fontWeight: 800, color: COLORS.slate, background: COLORS.bg, padding: '4px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}` }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
