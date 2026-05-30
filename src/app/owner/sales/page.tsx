'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    TrendingUp, Users, Calendar, CheckCircle, XCircle, Loader2,
    RefreshCw, Plus, X, AlertTriangle, PieChart,
    Mail, Target, DollarSign, ArrowUpRight, ArrowDownRight, Zap,
    Pencil, Trash2, ChevronDown, ChevronUp, Globe, Download,
    ShieldCheck, Activity, Award, BarChart2
} from 'lucide-react'
import {
    BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
// ── PALETTE ────────────────────────────────────────────────
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#EFE9FF',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6310',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}
const FUNNEL_COLORS: Record<string, string> = {
    new: '#1FAC63', contacted: '#F0A026', demo_scheduled: '#004B93',
    demo_completed: '#7C3AED', converted: '#059669', lost: '#EF4444',
}
const PIE_COLORS = ['#004B93', '#F0A026', '#1FAC63', '#3B82F6', '#7C3AED', '#EF4444', '#F97316']
type Stats = {
    metrics: {
        totalLeads: number; newLeads: number; demosScheduled: number
        demosCompleted: number; converted: number; conversionRate: string
        newTenants: number; totalRevenue: number; activeSubscriptions: number
    }
    sourceBreakdown: { source: string; count: number }[]
    statusFunnel: { status: string; count: number }[]
    recentSubscriptions: any[]
    emailTemplates: any[]
    recentTenants: any[]
}
// ———— ADD TEMPLATE MODAL ————
function AddTemplateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ name: '', subject: '', body: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const submit = async () => {
        if (!form.name || !form.subject || !form.body) { setError('All fields are required.'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/owner/sales/templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || 'Failed'); return }
            onSuccess(); onClose()
        } finally { setLoading(false) }
    }
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,10,30,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div className="glass-card" style={{ background: P.card, borderRadius: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', border: `1px solid ${P.border}` }}>
                <div style={{ padding: '32px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>Initialize Blueprint</h2>
                        <p style={{ fontSize: 13, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>Global sales automation & sequence logic</p>
                    </div>
                    <button onClick={onClose} style={{ background: P.hover, border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}>
                        <X size={20} color={P.dark} strokeWidth={2.5} />
                    </button>
                </div>
                <div style={{ padding: '32px 40px 40px' }}>
                    {(['name', 'subject'] as const).map(key => (
                        <div key={key} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {key === 'name' ? 'Internal Identifier' : 'Transmission Subject'}
                            </div>
                            <input value={form[key]} onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
                                placeholder={key === 'name' ? 'e.g. Initial Outreach - Tier 1' : 'e.g. Accelerate your roadmap with BeBrilliant'}
                                style={{ width: '100%', padding: '14px 18px', border: '1px solid ' + P.border, borderRadius: 12, fontSize: 14, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box', fontWeight: 600, transition: 'border-color 0.2s' }} />
                        </div>
                    ))}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payload Body</div>
                            <div style={{ fontSize: 11, color: P.brand, fontWeight: 800, background: P.brandBg, padding: '3px 8px', borderRadius: 6 }}>Logic Injection Ready</div>
                        </div>
                        <div style={{ fontSize: 11, color: P.muted, marginBottom: 10, fontWeight: 600 }}>
                            Supported Atoms: <span style={{ color: P.dark }}>{'{{name}}'}</span>, <span style={{ color: P.dark }}>{'{{organization}}'}</span>, <span style={{ color: P.dark }}>{'{{portal_url}}'}</span>
                        </div>
                        <textarea value={form.body} onChange={e => setForm(v => ({ ...v, body: e.target.value }))} rows={10}
                            placeholder="Draft your logic-infused transmission here..."
                            style={{ width: '100%', padding: '16px 20px', border: '1px solid ' + P.border, borderRadius: 16, fontSize: 14, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.8, fontWeight: 500 }} />
                    </div>
                    {error && (
                        <div style={{ background: P.errorBg, border: '1px solid ' + P.error + '40', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                            <AlertTriangle size={18} color={P.error} />
                            <span style={{ fontSize: 13, color: P.error, fontWeight: 750 }}>{error}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid ' + P.border, background: '#fff', color: P.dark, fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Decline</button>
                        <button onClick={submit} disabled={loading} className="hover-lift" style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: P.brand, color: '#fff', fontSize: 14, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1, boxShadow: '0 8px 25px ' + P.brand + '30' }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Plus size={18} strokeWidth={3} />}
                            Establish Blueprint
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
// ── METRIC CARD ───────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color, bg, trend }: {
    icon: any; label: string; value: string | number; sub?: string
    color: string; bg: string; trend?: 'up' | 'down'
}) {
    return (
        <div className="glass-card hover-lift" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 24, padding: '24px 26px', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${color}15` }}>
                    <Icon size={22} color={color} strokeWidth={2.5} />
                </div>
                {trend && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: trend === 'up' ? P.success : P.error, background: trend === 'up' ? P.successBg : P.errorBg, padding: '5px 10px', borderRadius: 9, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {trend === 'up' ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />} vs period
                    </span>
                )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 950, color: P.dark, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
            {sub && <div style={{ fontSize: 13, color: P.muted, marginTop: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                {sub}
            </div>}
        </div>
    )
}
// ── MAIN PAGE ────────────────────────────────────────────────
export default function SalesMarketingPage() {
    const [data, setData] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [range, setRange] = useState('30')
    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'templates' | 'subscriptions'>('overview')
    const [showAddTemplate, setShowAddTemplate] = useState(false)
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }
    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const res = await fetch('/api/owner/sales/stats?range=' + range)
            const json = await res.json()
            if (res.ok) setData(json)
        } finally { setLoading(false); setRefreshing(false) }
    }, [range])
    useEffect(() => { fetchData() }, [fetchData])
    const m = data?.metrics
    const funnelChartData = (data?.statusFunnel ?? []).map(s => ({
        name: s.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: s.count,
        fill: FUNNEL_COLORS[s.status] ?? P.brand,
    }))
    const sourceChartData = (data?.sourceBreakdown ?? []).map(s => ({ name: s.source, value: s.count }))
    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px', position: 'relative' }}>
            {showAddTemplate && (
                <AddTemplateModal
                    onClose={() => setShowAddTemplate(false)}
                    onSuccess={() => { showToast('Template created!', true); fetchData(true) }}
                />
            )}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle size={16} color={P.success} /> : <XCircle size={16} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 700, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Architecture</div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.muted }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>Enterprise Sequence Engine</div>
                  </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Sales Management</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>Provisioning tracking & global acquisition sequences</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        {[{ val: '7', label: '7D' }, { val: '30', label: '30D' }, { val: '90', label: '90D' }].map(r => (
                            <button key={r.val} onClick={() => setRange(r.val)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 850, cursor: 'pointer', border: 'none', background: range === r.val ? P.brand : 'transparent', color: range === r.val ? '#fff' : P.muted, transition: 'all 0.2s' }}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchData(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: P.dark, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <RefreshCw size={15} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button onClick={() => setShowAddTemplate(true)} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 26px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 10px 25px ${P.brand}30` }}>
                        <ShieldCheck size={18} strokeWidth={2.5} /> Inject Template
                    </button>
                </div>
            </div>
            {/* TABS */}
            <div style={{ display: 'flex', gap: 6, background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 6, marginBottom: 32, width: 'fit-content', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                {([
                    { key: 'overview', label: 'Overview', icon: PieChart },
                    { key: 'funnel', label: 'Funnel Analysis', icon: Target },
                    { key: 'templates', label: 'Email Templates', icon: Mail },
                    { key: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        padding: '10px 22px', borderRadius: 12, border: 'none',
                        background: activeTab === t.key ? P.brand : 'transparent',
                        color: activeTab === t.key ? '#fff' : P.muted,
                        fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        <t.icon size={15} strokeWidth={activeTab === t.key ? 2.5 : 2} />
                        {t.label}
                    </button>
                ))}
            </div>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
                    <div style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>Loading sales data...</div>
                </div>
            ) : (
                <>
                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                                <MetricCard icon={Users} label="Total Leads" value={m?.totalLeads ?? 0} sub={'+' + (m?.newLeads ?? 0) + ' this period'} color={P.brand} bg={P.brandBg} trend="up" />
                                <MetricCard icon={Calendar} label="Demos Scheduled" value={m?.demosScheduled ?? 0} sub={(m?.demosCompleted ?? 0) + ' completed'} color={P.info} bg={P.infoBg} />
                                <MetricCard icon={Target} label="Conversion Rate" value={(m?.conversionRate ?? '0.0') + '%'} sub={(m?.converted ?? 0) + ' conversions'} color={P.success} bg={P.successBg} trend="up" />
                                <MetricCard icon={DollarSign} label="Subscription MRR" value={'\u20B9' + (((m?.totalRevenue ?? 0) / 1000).toFixed(0)) + 'K'} sub={(m?.activeSubscriptions ?? 0) + ' active plans'} color={P.cta} bg={P.ctaBg} trend="up" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
                                {/* Funnel Bar Chart */}
                                <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: '28px 28px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 17, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.01em' }}>Lead Pipeline Funnel</h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Leads per stage across the conversion funnel</p>
                                    </div>
                                    <div style={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={funnelChartData} margin={{ left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.muted, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: P.muted, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    cursor={{ fill: P.hover, radius: 8 }}
                                                    contentStyle={{ borderRadius: 12, border: 'none', fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '10px 14px' }} 
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                                    {funnelChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                {/* Source Pie */}
                                <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 17, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.01em' }}>Lead Sources</h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Acquisition channel breakdown</p>
                                    </div>
                                    <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: P.bg, borderRadius: 20, border: '1px dashed ' + P.border }}>
                                        {sourceChartData.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: 20 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 14, background: P.card, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                                                  <PieChart size={20} color={P.muted} strokeWidth={2.5} />
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Data incoming...</div>
                                                <div style={{ fontSize: 11, color: P.muted, marginTop: 4, fontWeight: 600 }}>Awaiting lead acquisition data</div>
                                            </div>
                                        ) : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RePieChart>
                                                        <Pie data={sourceChartData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                                                            {sourceChartData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 700 }} />
                                                    </RePieChart>
                                                </ResponsiveContainer>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                                                    {sourceChartData.slice(0, 4).map((s, i) => (
                                                        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: P.text }}>{s.name}</span>
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 850, color: P.dark }}>{s.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {(data?.recentTenants?.length ?? 0) > 0 && (
                                <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: 10, background: P.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingUp size={18} color={P.success} />
                                      </div>
                                      <h3 style={{ fontSize: 17, fontWeight: 900, color: P.dark, margin: 0 }}>Recent Provisioned Nodes</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                        {data!.recentTenants.map(t => (
                                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: P.bg, borderRadius: 14, border: '1px solid ' + P.border }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: P.card, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                                                        <Globe size={18} color={P.brand} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{t.name}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{t.type}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                  <div style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>{new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                                  <div style={{ fontSize: 10, color: P.success, fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>Active</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {/* ———— FUNNEL TAB ———— */}
                    {activeTab === 'funnel' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={20} color={P.brand} strokeWidth={2.5} />
                                  </div>
                                  <h3 style={{ fontSize: 18, fontWeight: 900, color: P.dark, margin: 0 }}>Advanced Conversion Funnel Analysis</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {(data?.statusFunnel ?? []).map(stage => {
                                        const maxCount = Math.max(...(data?.statusFunnel ?? []).map(s => s.count), 1)
                                        const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                                        const color = FUNNEL_COLORS[stage.status] ?? P.brand
                                        const label = stage.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                                        return (
                                            <div key={stage.status}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{label}</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                       <span style={{ fontSize: 13, fontWeight: 950, color }}>{stage.count}</span>
                                                       <span style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginLeft: 4 }}>nodes</span>
                                                    </div>
                                                </div>
                                                <div style={{ background: P.bg, borderRadius: 99, height: 12, overflow: 'hidden', border: `1px solid ${P.border}` }}>
                                                    <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>
                                                       <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                {[
                                    { label: 'Demo Conversion Rate', value: m && m.demosScheduled > 0 ? ((m.demosCompleted / m.demosScheduled) * 100).toFixed(0) + '%' : '—', icon: Calendar, color: P.brand, bg: P.brandBg, desc: 'Completed / Scheduled demos' },
                                    { label: 'Conversion Velocity', value: (m?.conversionRate ?? '0') + '%', icon: Target, color: P.success, bg: P.successBg, desc: (m?.converted ?? 0) + ' conversions from ' + (m?.totalLeads ?? 0) + ' leads' },
                                    { label: 'Lead Influx (Trend)', value: m?.newLeads ?? 0, icon: TrendingUp, color: P.info, bg: P.infoBg, desc: 'New entrants in last ' + range + ' days' },
                                ].map(card => (
                                    <div key={card.label} className="glass-card hover-lift" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 20, padding: '24px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <card.icon size={20} color={card.color} strokeWidth={2.5} />
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{card.label}</div>
                                        <div style={{ fontSize: 32, fontWeight: 950, color: P.dark, lineHeight: 1, marginBottom: 6 }}>{card.value}</div>
                                        <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{card.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* ———— TEMPLATES TAB ———— */}
                    {activeTab === 'templates' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, color: P.dark, margin: 0 }}>Provisioning Templates</h3>
                                    <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Global sales & automated outreach sequences</p>
                                </div>
                                <button onClick={() => setShowAddTemplate(true)} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 13, fontWeight: 850, cursor: 'pointer', boxShadow: '0 8px 20px ' + P.brand + '30' }}>
                                    <Plus size={16} strokeWidth={3} /> New Template
                                </button>
                            </div>
                            {(data?.emailTemplates?.length ?? 0) === 0 ? (
                                <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 80, textAlign: 'center' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 24, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                      <Mail size={32} color={P.muted} />
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: P.dark, marginBottom: 8 }}>No blueprints found</div>
                                    <div style={{ fontSize: 14, color: P.muted, marginBottom: 24, fontWeight: 500 }}>Create outreach blueprints for automated provisioning.</div>
                                    <button onClick={() => setShowAddTemplate(true)} style={{ background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                                        Establish First Template
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data!.emailTemplates.map(t => (
                                        <div key={t.id} className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 18, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedTemplate(expandedTemplate === t.id ? null : t.id)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                                        <Mail size={18} color={P.brand} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 15, fontWeight: 850, color: P.dark }}>{t.name}</div>
                                                        <div style={{ fontSize: 12, color: P.muted, marginTop: 3, fontWeight: 600 }}>Subject: {t.subject}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        {new Date(t.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                    </span>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                      {expandedTemplate === t.id ? <ChevronUp size={16} color={P.dark} strokeWidth={2.5} /> : <ChevronDown size={16} color={P.muted} strokeWidth={2} />}
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedTemplate === t.id && (
                                                <div style={{ padding: '0 24px 24px', borderTop: '1px solid ' + P.border }}>
                                                    <div style={{ marginTop: 20, background: P.bg, border: '1px solid ' + P.border, borderRadius: 14, padding: '20px' }}>
                                                        <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                          <Zap size={12} fill={P.muted} />
                                                          Content Structure
                                                        </div>
                                                        <pre style={{ fontSize: 14, color: P.dark, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontWeight: 500 }}>{t.body}</pre>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                                                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid ' + P.border, background: P.card, color: P.dark, fontSize: 13, fontWeight: 750, cursor: 'pointer' }}>
                                                            <Pencil size={14} /> Modify
                                                        </button>
                                                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid ' + P.error + '30', background: P.errorBg, color: P.error, fontSize: 13, fontWeight: 750, cursor: 'pointer' }}>
                                                            <Trash2 size={14} /> Purge
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {/* ———— SUBSCRIPTIONS TAB ———— */}
                    {activeTab === 'subscriptions' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, color: P.dark, margin: 0 }}>Network Subscriptions</h3>
                                    <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Live node status & billing management</p>
                                </div>
                                <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <Download size={15} strokeWidth={2.5} /> Export Data
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                                <MetricCard icon={DollarSign} label="Aggregate Revenue" value={'\u20B9' + (((m?.totalRevenue ?? 0) / 1000).toFixed(1)) + 'K'} color={P.success} bg={P.successBg} />
                                <MetricCard icon={Zap} label="Active Pipelines" value={m?.activeSubscriptions ?? 0} color={P.brand} bg={P.brandBg} />
                                <MetricCard icon={Target} label="Projected NRV" value={'\u20B9' + (((m?.totalRevenue ?? 0) / 12 / 1000).toFixed(1)) + 'K'} sub="Monthly recurring estimate" color={P.cta} bg={P.ctaBg} />
                            </div>
                            {(data?.recentSubscriptions?.length ?? 0) === 0 ? (
                                <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: 80, textAlign: 'center' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 24, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                      <DollarSign size={32} color={P.muted} />
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: P.dark, marginBottom: 8 }}>No financial records</div>
                                    <div style={{ fontSize: 14, color: P.muted, fontWeight: 500 }}>Aggregate data will materialize as node subscriptions activate.</div>
                                </div>
                            ) : (
                                <div className="glass-card" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                            <thead>
                                                <tr style={{ background: P.bg, borderBottom: '1px solid ' + P.border }}>
                                                    {['Subscription Plan', 'Node Type', 'Amount (INR)', 'Billing', 'Status', 'Start Date', 'Expiration'].map(h => (
                                                        <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data!.recentSubscriptions.map((s, i) => (
                                                    <tr key={s.id} className="table-row-hover" style={{ borderBottom: i < data!.recentSubscriptions.length - 1 ? '1px solid ' + P.border : 'none', transition: 'background 0.2s' }}>
                                                        <td style={{ padding: '18px 20px' }}>
                                                          <div style={{ fontSize: 14, fontWeight: 850, color: P.dark }}>{s.plan_name}</div>
                                                          <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Tier {i+1}</div>
                                                        </td>
                                                        <td style={{ padding: '18px 20px' }}>
                                                            <span style={{ background: P.brandBg, color: P.brand, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, border: '1px solid ' + P.brand + '15', textTransform: 'capitalize' }}>{s.plan_type}</span>
                                                        </td>
                                                        <td style={{ padding: '18px 20px', fontSize: 15, fontWeight: 950, color: P.dark }}>\u20B9{Number(s.amount).toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '18px 20px', fontSize: 13, fontWeight: 700, color: P.text, textTransform: 'capitalize' }}>{s.billing_cycle}</td>
                                                        <td style={{ padding: '18px 20px' }}>
                                                            <div style={{
                                                                background: s.status === 'active' ? P.successBg : s.status === 'cancelled' ? P.errorBg : P.warningBg,
                                                                color: s.status === 'active' ? P.success : s.status === 'cancelled' ? P.error : P.warning,
                                                                padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                                                                width: 'fit-content', border: `1px solid ${s.status === 'active' ? P.success : s.status === 'cancelled' ? P.error : P.warning}20`
                                                            }}>{s.status}</div>
                                                        </td>
                                                        <td style={{ padding: '18px 20px', fontSize: 12, color: P.muted, fontWeight: 750, whiteSpace: 'nowrap' }}>
                                                            {s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </td>
                                                        <td style={{ padding: '18px 20px', fontSize: 12, color: P.muted, fontWeight: 750, whiteSpace: 'nowrap' }}>
                                                            {s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
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
