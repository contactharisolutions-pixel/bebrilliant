'use client'

import React, { useState, useEffect } from 'react'
import { 
    BarChart3, Award, TrendingUp, Target, 
    BookOpen, BookMarked, AlertCircle, ChevronRight, 
    Calendar, CheckCircle, Search, Filter, Loader2, Sparkles, Map, Info
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import Link from 'next/link'

export default function Student360Analytics() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        // Fetch personalized analytics
        fetch('/api/student/dashboard') // Reusing the high-fidelity mock for now
            .then(r => r.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
    }, [])

    if (loading) return (
        <div style={{ padding: 100, textAlign: 'center' }}>
            <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    const COLORS = ['var(--color-primary)', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4']

    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                   <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Subject Wise Analytics</h1>
                   <p style={{ margin: '8px 0 0', fontSize: 15, color: '#64748B', fontWeight: 600 }}>Track your performance and identify areas for improvement.</p>
                </div>
                 <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '12px 24px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 14, fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Calendar size={18} color="var(--color-primary)" /> Session: 2025-26
                    </button>
                </div>
            </div>

            {/* KPI METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                  {[
                    { label: 'Aggregate Mean Index', val: data.kpi.avg_score + '%', icon: Award, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
                    { label: 'Growth Velocity', val: '+5.2%', icon: TrendingUp, color: '#10B981', bg: '#ECFDF5' },
                    { label: 'Curriculum Coverage', val: '8.4 Units', icon: BookMarked, color: '#3B82F6', bg: '#EFF6FF' },
                    { label: 'Asymptotic Peak', val: '92%', icon: Target, color: '#EF4444', bg: '#FEF2F2' }
                ].map((k, i) => (
                    <div key={i} style={{ background: '#FFF', padding: 24, borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <k.icon size={26} color={k.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{k.val}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MAIN CHART LAYER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, marginBottom: 32 }}>
                
                {/* TEMPORAL PERFORMANCE (LINE) */}
                  <div style={{ background: '#FFF', borderRadius: 32, padding: 32, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Temporal Evaluation Growth</h3>
                        <div style={{ padding: '6px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#64748B' }}>LAST 6 MONTHS</div>
                    </div>
                    <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.performance_trend}>
                                 <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 700, fill: '#94A3B8' }} />
                                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 700, fill: '#94A3B8' }} width={30} />
                                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SUBJECT MASTERY (RADAR) */}
                  <div style={{ background: '#FFF', borderRadius: 32, padding: 32, border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 32px', fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Multidimensional Proficiency Radar</h3>
                    <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius="80%" data={data.subject_mastery}>
                                <PolarGrid stroke="#F1F5F9" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 800, fill: '#64748B' }} />
                                <Radar name="Mastery" dataKey="mastery" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.6} />
                                <Tooltip contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECONDARY LAYER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32 }}>
                
                {/* WEAK AREA ADVISOR */}
                 <div style={{ background: '#0F172A', borderRadius: 32, padding: 32, color: '#FFF', display: 'flex', flexDirection: 'column', gap: 24 }}>
                     <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.1)', border: '1px solid var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={22} color="var(--color-primary)" />
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>AI Academic Guide</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>We detected a potential knowledge gap in <strong style={{ color: '#FFF' }}>Advanced Mathematics (Trigonometry)</strong>. Your score is 15% below peers.</p>
                    
                    <div style={{ background: '#1E293B', padding: 20, borderRadius: 18, border: '1px solid #334155' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 12, textTransform: 'uppercase' }}>Recommended Resource</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Module: Complex Variables & Identitiy</div>
                        <Link href="/dashboard/student/materials" style={{ display: 'inline-flex', marginTop: 14, color: 'var(--color-primary)', fontSize: 13, fontWeight: 800, textDecoration: 'none', alignItems: 'center', gap: 6 }}>
                            Access Study Material <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div style={{ flex: 1 }} />
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#475569', fontWeight: 700 }}>
                        <Info size={14} /> AI insights updated 2m ago.
                    </div>
                </div>

                {/* RESULTS HISTORY FEED */}
                  <div style={{ background: '#FFF', borderRadius: 32, padding: 32, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Recent Results</h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                           <button style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#64748B' }}>Export PDF</button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: 2 }}>
                        {data.recent_results.map((res: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: idx % 2 === 0 ? '#F8FAFC' : '#FFF', borderRadius: 16 }}>
                                <div style={{ width: 44, height: 44, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookOpen size={20} color="#64748B" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{res.exam_name}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>{res.date} • Final Evaluation</div>
                                </div>
                                 <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{res.score}%</div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: res.trend === 'up' ? '#10B981' : '#F59E0B' }}>
                                        {res.trend === 'up' ? 'EXCELLENT PROGRESS' : 'CONSISTENT PERFORMANCE'}
                                    </div>
                                </div>
                                <Link href={`/dashboard/student/results/${res.id}`} style={{ padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 10, marginLeft: 12 }}>
                                    <ChevronRight size={18} color="#64748B" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    )
}
