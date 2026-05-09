'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
    FileText, DownloadCloud, Activity, TrendingUp,
    PieChart as PieIcon, LineChart as LineIcon, CheckCircle, XCircle, Loader2,
    Briefcase, Globe, Target, Shield, Zap, ArrowUpRight, ArrowDownRight,
    Search, Filter, CalendarDays, RefreshCcw, Layout, Database, Sparkles,
    CheckCircle2, FileJson
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

// ── UI COMPONENTS ──────────────────────────────────
function ToastNotification({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 32, right: 32, background: ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${ok ? COLORS.success : COLORS.danger}40`, borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 30000, animation: 'float 0.3s ease-out' }}>
            {ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
            <span style={{ fontSize: 14, fontWeight: 900, color: ok ? '#065F46' : '#991B1B' }}>{msg}</span>
        </div>
    )
}

function AnalyticsCard({ label, value, trend, icon: Icon, color, bg }: any) {
    const isUp = trend?.startsWith('+')
    return (
        <div className="analytics-card" style={{ background: '#FFF', padding: 28, borderRadius: 28, border: '1px solid #F1F5F9', boxShadow: '0 10px 30px rgba(0,75,147,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 10, background: bg, borderRadius: 14 }}>
                    <Icon size={20} color={color} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</div>
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 900, color: isUp ? COLORS.success : COLORS.danger }}>
                        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                    </div>
                )}
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
                <Icon size={120} color={color} />
            </div>
        </div>
    )
}

// ── MAIN APPLICATION ─────────────────────────────
export default function AnalyticsReports() {
    const [data, setData] = useState<{ revenue: any[], performance: any[], pass_fail: any[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

    const fetchTopology = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/reports')
            const json = await res.json()
            if (res.ok) setData(json)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchTopology() }, [fetchTopology])

    if (loading || !data) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING DATA...</div>
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
                .tab-btn:hover { background: #F1F5F9; }
                .active-report { background: #111827 !important; color: #FFF !important; }
            `}</style>

            {toast && <ToastNotification msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* INTEL HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Briefcase size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Institutional Analytics</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        Mapping institutional growth metrics and academic success distributions. Extracting reports and insights from student performance metrics.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ background: '#FFF', border: '2px solid #F1F5F9', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CalendarDays size={18} color={COLORS.slate} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Fiscal Q3 Overview</span>
                    </div>
                    <button onClick={fetchTopology} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <RefreshCcw size={16} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* BUSINESS KPI STRIP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                <AnalyticsCard label="Gross Revenue" value="₹1.48M" trend="+24.8%" icon={TrendingUp} color={COLORS.success} bg={`${COLORS.success}10`} />
                <AnalyticsCard label="Success Ratio" value="78.2%" trend="+4.1%" icon={Target} color={COLORS.primary} bg={`${COLORS.primary}10`} />
                <AnalyticsCard label="Active Licenses" value="1,240" trend="+12.5%" icon={Database} color={COLORS.warning} bg={`${COLORS.warning}10`} />
                <AnalyticsCard label="System Integrity" value="99.98%" trend="OPTIMAL" icon={Shield} color="#8B5CF6" bg="#8B5CF610" />
            </div>

            {/* PRIMARY ANALYSIS LAYER */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginBottom: 32 }}>

                {/* ENROLLMENT REPORT */}
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Enrollment Revenue Report</h3>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}>Monthly Revenue (INR)</div>
                        </div>
                        <button style={{ padding: '10px 16px', borderRadius: 12, background: '#111827', color: '#FFF', border: 'none', fontSize: 11, fontWeight: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileJson size={14} color={COLORS.success} /> Download JSON
                        </button>
                    </div>

                    <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.revenue}>
                                <defs>
                                    <linearGradient id="barChart" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={COLORS.success} stopOpacity={1}/>
                                        <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.4}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} tickFormatter={(v) => `₹${v/1000}k`} />
                                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 1000 }} />
                                <Bar dataKey="total" fill="url(#barChart)" radius={[10, 10, 0, 0]} barSize={48} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ACADEMIC SUCCESS DISTRIBUTION */}
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                     <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Success Distribution</h3>
                     <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div style={{ position: 'absolute', textAlign: 'center' }}>
                             <div style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A' }}>{data.pass_fail[0].value}%</div>
                             <div style={{ fontSize: 10, fontWeight: 900, color: COLORS.success, textTransform: 'uppercase', letterSpacing: '0.1em' }}>PASS RATE</div>
                         </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={data.pass_fail} innerRadius={85} outerRadius={115} paddingAngle={10} dataKey="value" stroke="none" cornerRadius={12}>
                                    {data.pass_fail.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 1000 }} />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                         {data.pass_fail.map((item, i) => (
                             <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#F8FAFC', borderRadius: 16 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.fill }} />
                                     <span style={{ fontSize: 13, fontWeight: 800, color: '#444' }}>{item.name}</span>
                                 </div>
                                 <span style={{ fontSize: 13, fontWeight: 1000, color: '#0F172A' }}>{item.value}%</span>
                             </div>
                         ))}
                     </div>
                </div>
            </div>

            {/* COGNITIVE PERFORMANCE TRAJECTORY */}
            <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)', marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Academic Growth Trajectory</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Tracking scoring metrics vs. student volume cycles.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                        {['PDF Archive', 'Full Excel Logic', 'PowerBI Sync'].map(b => (
                            <button key={b} className="tab-btn" style={{ padding: '10px 18px', borderRadius: 12, background: '#FFF', border: '1px solid #F1F5F9', color: '#1E293B', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>{b}</button>
                        ))}
                    </div>
                </div>

                <div style={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.performance}>
                            <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} dy={15} />
                            <YAxis yAxisId="avg" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} />
                            <YAxis yAxisId="vol" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} />
                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 1000 }} />
                            <Area yAxisId="avg" type="monotone" dataKey="avg_score" stroke={COLORS.primary} strokeWidth={4} fill="url(#scoreGrad)" />
                            <Area yAxisId="vol" type="monotone" dataKey="active_students" stroke="#8B5CF6" strokeWidth={4} fill="url(#volGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div style={{ background: COLORS.primaryGradient, padding: 32, borderRadius: 28, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0,75,147,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={28} color="#FFF" />
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 1000 }}>Intelligent Analysis</div>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Generate a comprehensive performance report for institutional stakeholders.</p>
                    </div>
                </div>
                <button onClick={() => showToast('Full Report Generated', true)} style={{ padding: '16px 32px', borderRadius: 18, background: '#FFF', color: COLORS.primary, border: 'none', fontSize: 14, fontWeight: 1100, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>Generate Full Report</button>
            </div>
        </div>
    )
}
