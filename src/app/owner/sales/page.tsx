'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    TrendingUp, Users, Calendar, CheckCircle, XCircle, Loader2,
    RefreshCw, Plus, X, AlertTriangle, PieChart,
    Mail, Target, DollarSign, ArrowUpRight, ArrowDownRight, Zap,
    Pencil, Trash2, ChevronDown, ChevronUp, Globe, Download,
    ShieldCheck, Activity, Award, BarChart2, Building2
} from 'lucide-react'
import {
    BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── PALETTE ────────────────────────────────────────────────
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#EEF4FF',
    cta: '#F0A026', ctaBg: '#FFF7E6',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#8E8E93', hover: '#F1F2F4',
    success: '#059669', successBg: '#ECFDF5',
    warning: '#D97706', warningBg: '#FFFBEB',
    error: '#DC2626', errorBg: '#FEF2F2',
    info: '#2563EB', infoBg: '#EFF6FF',
    purple: '#7C3AED', purpleBg: '#F5F3FF',
}

const STAGE_LABELS: Record<string, string> = {
    new: 'New Inquiry',
    contacted: 'Contacted',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
    converted: 'Enrolled',
    lost: 'Closed',
}

const FUNNEL_COLORS: Record<string, string> = {
    new: '#059669',
    contacted: '#D97706',
    demo_scheduled: '#2563EB',
    demo_completed: '#7C3AED',
    converted: '#059669',
    lost: '#DC2626',
}

const PIE_COLORS = ['#004B93', '#F0A026', '#059669', '#2563EB', '#7C3AED', '#DC2626', '#D97706']

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

// ———— ADD / EDIT TEMPLATE MODAL ————
function TemplateModal({
    template,
    onClose,
    onSuccess
}: {
    template?: any
    onClose: () => void
    onSuccess: (msg: string) => void
}) {
    const [form, setForm] = useState({
        name: template?.name || '',
        subject: template?.subject || '',
        body: template?.body || ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isEdit = !!template?.id

    const submit = async () => {
        if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
            setError('Please fill out Template Name, Subject, and Email Body.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const url = '/api/owner/sales/templates'
            const method = isEdit ? 'PUT' : 'POST'
            const payload = isEdit ? { id: template.id, ...form } : form

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to save template')
                return
            }
            onSuccess(isEdit ? 'Template updated successfully!' : 'New template created successfully!')
            onClose()
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: P.card, borderRadius: 24, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)', border: `1px solid ${P.border}`, fontFamily: 'var(--font-worksans, sans-serif)' }}>
                <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: P.brandBg, color: P.brand, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                            <Mail size={12} /> {isEdit ? 'Edit Template' : 'New Template'}
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>
                            {isEdit ? 'Edit Email Template' : 'Create Email Template'}
                        </h2>
                        <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 500 }}>
                            Configure automated outreach and update emails.
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted, transition: 'all 0.15s' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '28px 32px 32px' }}>
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.dark, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Template Name *
                        </label>
                        <input
                            value={form.name}
                            onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                            placeholder="e.g. Welcome Email to Registered Tenant"
                            style={{ width: '100%', padding: '12px 16px', border: '1px solid ' + P.border, borderRadius: 10, fontSize: 13.5, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box', fontWeight: 600 }}
                        />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.dark, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Email Subject *
                        </label>
                        <input
                            value={form.subject}
                            onChange={e => setForm(v => ({ ...v, subject: e.target.value }))}
                            placeholder="e.g. Welcome to BeBrilliant - Your Account Details"
                            style={{ width: '100%', padding: '12px 16px', border: '1px solid ' + P.border, borderRadius: 10, fontSize: 13.5, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box', fontWeight: 600 }}
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Email Content *
                            </label>
                            <span style={{ fontSize: 11, color: P.brand, fontWeight: 700, background: P.brandBg, padding: '2px 8px', borderRadius: 6 }}>
                                Placeholders Available
                            </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: P.muted, marginBottom: 8, fontWeight: 500 }}>
                            Use placeholders: <strong style={{ color: P.dark }}>{'{{name}}'}</strong>, <strong style={{ color: P.dark }}>{'{{organization}}'}</strong>, <strong style={{ color: P.dark }}>{'{{portal_url}}'}</strong>
                        </div>
                        <textarea
                            value={form.body}
                            onChange={e => setForm(v => ({ ...v, body: e.target.value }))}
                            rows={8}
                            placeholder="Dear {{name}}, thank you for registering {{organization}}..."
                            style={{ width: '100%', padding: '14px 16px', border: '1px solid ' + P.border, borderRadius: 12, fontSize: 13.5, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.7, fontWeight: 500 }}
                        />
                    </div>

                    {error && (
                        <div style={{ background: P.errorBg, border: '1px solid ' + P.error + '40', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                            <AlertTriangle size={16} color={P.error} />
                            <span style={{ fontSize: 13, color: P.error, fontWeight: 700 }}>{error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid ' + P.border, background: P.bg, color: P.dark, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={loading}
                            style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: P.brand, color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, boxShadow: '0 6px 18px rgba(0,75,147,0.25)' }}
                        >
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                            {isEdit ? 'Save Changes' : 'Save Template'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── METRIC CARD ───────────────────────────────────────────
function MetricCard({
    icon: Icon, label, value, sub, color, bg, trend
}: {
    icon: any; label: string; value: string | number; sub?: string
    color: string; bg: string; trend?: 'up' | 'down'
}) {
    return (
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '20px 22px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={color} strokeWidth={2.5} />
                </div>
                {trend && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 800, color: trend === 'up' ? P.success : P.error, background: trend === 'up' ? P.successBg : P.errorBg, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {trend === 'up' ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />} vs period
                    </span>
                )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
            {sub && (
                <div style={{ fontSize: 12, color: P.muted, marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                    {sub}
                </div>
            )}
        </div>
    )
}

// ── MAIN PAGE ────────────────────────────────────────────────
export default function SalesMarketingPage() {
    const [data, setData] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [range, setRange] = useState('30')
    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'subscriptions'>('overview')
    
    // Template Modal state
    const [showAddTemplate, setShowAddTemplate] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
    
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
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

    const handleDeleteTemplate = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete template "${name}"?`)) return
        try {
            const res = await fetch(`/api/owner/sales/templates?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                showToast('Template deleted successfully')
                fetchData(true)
            } else {
                showToast('Failed to delete template', false)
            }
        } catch {
            showToast('Error deleting template', false)
        }
    }

    const handleExportSubscriptions = () => {
        if (!data?.recentSubscriptions || data.recentSubscriptions.length === 0) {
            showToast('No subscription data to export', false)
            return
        }
        const headers = ['Tenant Name', 'Plan Name', 'Billing Cycle', 'Amount (INR)', 'Status', 'Start Date', 'End Date']
        const rows = data.recentSubscriptions.map(s => [
            `"${s.tenants?.name || s.plan_name || 'Tenant'}"`,
            `"${s.plan_name || 'Basic'}"`,
            `"${s.billing_cycle || 'monthly'}"`,
            s.amount || 0,
            `"${s.status || 'active'}"`,
            `"${s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN') : ''}"`,
            `"${s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN') : ''}"`
        ])
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `tenant_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast('Subscriptions exported to CSV')
    }

    const m = data?.metrics

    const funnelChartData = (data?.statusFunnel ?? []).map(s => ({
        name: STAGE_LABELS[s.status] ?? s.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: s.count,
        fill: FUNNEL_COLORS[s.status] ?? P.brand,
    }))

    const sourceChartData = (data?.sourceBreakdown ?? []).map(s => ({ name: s.source, value: s.count }))

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                * { box-sizing: border-box; }
            `}</style>

            {/* MODAL */}
            {(showAddTemplate || editingTemplate) && (
                <TemplateModal
                    template={editingTemplate}
                    onClose={() => { setShowAddTemplate(false); setEditingTemplate(null) }}
                    onSuccess={(msg) => { showToast(msg); fetchData(true) }}
                />
            )}

            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', bottom: 28, right: 28, background: toast.ok ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999, animation: 'slideUp 0.3s ease' }}>
                    {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ background: P.brandBg, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Sales & Growth
                        </span>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.muted }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>Growth Overview</span>
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.5px' }}>Sales & Growth</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '4px 0 0', fontWeight: 500 }}>
                        Track tenant growth, demo performance, and subscription plans.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 2, background: P.card, border: '1px solid ' + P.border, borderRadius: 10, padding: 3 }}>
                        {[{ val: '7', label: '7 Days' }, { val: '30', label: '30 Days' }, { val: '90', label: '90 Days' }].map(r => (
                            <button
                                key={r.val}
                                onClick={() => setRange(r.val)}
                                style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                                    background: range === r.val ? P.brand : 'transparent',
                                    color: range === r.val ? '#fff' : P.muted, transition: 'all 0.15s'
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.dark }}
                    >
                        <RefreshCw size={14} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 4, background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
                {([
                    { key: 'overview', label: 'Overview', icon: PieChart },
                    { key: 'funnel', label: 'Funnel Analysis', icon: Target },
                    { key: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
                ] as const).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        style={{
                            padding: '9px 20px', borderRadius: 9, border: 'none',
                            background: activeTab === t.key ? P.brand : 'transparent',
                            color: activeTab === t.key ? '#fff' : P.muted,
                            fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}
                    >
                        <t.icon size={14} strokeWidth={activeTab === t.key ? 2.5 : 2} />
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
                    <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Loading sales metrics...</div>
                </div>
            ) : (
                <>
                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                                <MetricCard
                                    icon={Users}
                                    label="Total Inquiries"
                                    value={m?.totalLeads ?? 0}
                                    sub={`+${m?.newLeads ?? 0} this period`}
                                    color={P.brand}
                                    bg={P.brandBg}
                                    trend="up"
                                />
                                <MetricCard
                                    icon={Calendar}
                                    label="Demos Scheduled"
                                    value={m?.demosScheduled ?? 0}
                                    sub={`${m?.demosCompleted ?? 0} completed`}
                                    color={P.info}
                                    bg={P.infoBg}
                                />
                                <MetricCard
                                    icon={Target}
                                    label="Conversion Rate"
                                    value={`${m?.conversionRate ?? '0.0'}%`}
                                    sub={`${m?.converted ?? 0} enrolled tenants`}
                                    color={P.success}
                                    bg={P.successBg}
                                    trend="up"
                                />
                                <MetricCard
                                    icon={DollarSign}
                                    label="Monthly Revenue"
                                    value={`Rs. ${(((m?.totalRevenue ?? 0) / 1000).toFixed(0))}K`}
                                    sub={`${m?.activeSubscriptions ?? 0} active subscriptions`}
                                    color={P.cta}
                                    bg={P.ctaBg}
                                    trend="up"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>
                                {/* Funnel Bar Chart */}
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 24 }}>
                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: P.dark, margin: 0 }}>Inquiry Conversion Funnel</h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '3px 0 0', fontWeight: 500 }}>Number of inquiries at each stage of the sales pipeline</p>
                                    </div>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={funnelChartData} margin={{ left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.muted, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: P.muted, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: P.hover, radius: 6 }}
                                                    contentStyle={{ borderRadius: 10, border: '1px solid ' + P.border, fontWeight: 700, padding: '8px 12px', fontSize: 12 }}
                                                />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                                                    {funnelChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Source Pie */}
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 24 }}>
                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: P.dark, margin: 0 }}>Inquiry Sources</h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '3px 0 0', fontWeight: 500 }}>Where your inquiries are coming from</p>
                                    </div>
                                    <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        {sourceChartData.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: 20 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                                    <PieChart size={20} color={P.muted} />
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>No Inquiry Data</div>
                                                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>Sources will appear as inquiries are added</div>
                                            </div>
                                        ) : (
                                            <>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <RePieChart>
                                                        <Pie data={sourceChartData} innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                                                            {sourceChartData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 700 }} />
                                                    </RePieChart>
                                                </ResponsiveContainer>
                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                                                    {sourceChartData.slice(0, 4).map((s, i) => (
                                                        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                                <span style={{ fontWeight: 600, color: P.text }}>{s.name}</span>
                                                            </div>
                                                            <span style={{ fontWeight: 800, color: P.dark }}>{s.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Tenants */}
                            {(data?.recentTenants?.length ?? 0) > 0 && (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 10, background: P.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Building2 size={18} color={P.success} />
                                        </div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: P.dark, margin: 0 }}>Recently Registered Tenants</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                        {data!.recentTenants.map(t => (
                                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: P.bg, borderRadius: 12, border: '1px solid ' + P.border }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Globe size={16} color={P.brand} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: P.dark }}>{t.name}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, textTransform: 'capitalize', marginTop: 1 }}>{(t.tenant_type || t.type || 'Institute').replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 11.5, color: P.muted, fontWeight: 600 }}>{new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                                    <span style={{ fontSize: 9.5, color: P.success, background: P.successBg, padding: '2px 6px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── FUNNEL TAB ── */}
                    {activeTab === 'funnel' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target size={18} color={P.brand} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: P.dark, margin: 0 }}>Inquiry Stage Breakdown</h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '2px 0 0', fontWeight: 500 }}>Detailed breakdown of inquiries across every pipeline step</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {(data?.statusFunnel ?? []).map(stage => {
                                        const maxCount = Math.max(...(data?.statusFunnel ?? []).map(s => s.count), 1)
                                        const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                                        const color = FUNNEL_COLORS[stage.status] ?? P.brand
                                        const label = STAGE_LABELS[stage.status] ?? stage.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                                        return (
                                            <div key={stage.status}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{label}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{stage.count} <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>inquiries</span></span>
                                                </div>
                                                <div style={{ background: P.bg, borderRadius: 8, height: 10, overflow: 'hidden', border: `1px solid ${P.border}` }}>
                                                    <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 8, transition: 'width 0.6s ease' }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                <MetricCard
                                    icon={Calendar}
                                    label="Demo Completion Rate"
                                    value={m && m.demosScheduled > 0 ? ((m.demosCompleted / m.demosScheduled) * 100).toFixed(0) + '%' : '0%'}
                                    sub={`${m?.demosCompleted ?? 0} of ${m?.demosScheduled ?? 0} demos completed`}
                                    color={P.brand}
                                    bg={P.brandBg}
                                />
                                <MetricCard
                                    icon={Target}
                                    label="Overall Conversion Rate"
                                    value={`${m?.conversionRate ?? '0.0'}%`}
                                    sub={`${m?.converted ?? 0} enrolled from ${m?.totalLeads ?? 0} inquiries`}
                                    color={P.success}
                                    bg={P.successBg}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── FUNNEL TAB ── */}
                    {activeTab === 'funnel' && (
                        <div>
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: '24px', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: P.dark, margin: '0 0 16px' }}>Detailed Stage Analysis</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                                    {(data?.statusFunnel ?? []).map((s) => (
                                        <div key={s.status} style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 6 }}>
                                                {STAGE_LABELS[s.status] ?? s.status}
                                            </div>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: FUNNEL_COLORS[s.status] ?? P.dark }}>{s.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SUBSCRIPTIONS TAB ── */}
                    {activeTab === 'subscriptions' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: P.dark, margin: 0 }}>Tenant Subscriptions</h3>
                                    <p style={{ fontSize: 13, color: P.muted, margin: '3px 0 0', fontWeight: 500 }}>Active subscription plans and billing overview</p>
                                </div>
                                <button
                                    onClick={handleExportSubscriptions}
                                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: P.card, border: '1px solid ' + P.border, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: P.dark, cursor: 'pointer' }}
                                >
                                    <Download size={14} /> Export Data
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                                <MetricCard
                                    icon={DollarSign}
                                    label="Total Subscription Revenue"
                                    value={`Rs. ${(((m?.totalRevenue ?? 0) / 1000).toFixed(1))}K`}
                                    color={P.success}
                                    bg={P.successBg}
                                />
                                <MetricCard
                                    icon={Zap}
                                    label="Active Subscriptions"
                                    value={m?.activeSubscriptions ?? 0}
                                    color={P.brand}
                                    bg={P.brandBg}
                                />
                                <MetricCard
                                    icon={Target}
                                    label="Monthly Recurring Estimate"
                                    value={`Rs. ${(((m?.totalRevenue ?? 0) / 12 / 1000).toFixed(1))}K`}
                                    sub="Estimated monthly subscription income"
                                    color={P.cta}
                                    bg={P.ctaBg}
                                />
                            </div>

                            {(data?.recentSubscriptions?.length ?? 0) === 0 ? (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 60, textAlign: 'center' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <DollarSign size={28} color={P.muted} />
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: P.dark, marginBottom: 6 }}>No Active Subscriptions Found</div>
                                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 500 }}>Subscription records will appear here as tenants subscribe to plans.</div>
                                </div>
                            ) : (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                            <thead>
                                                <tr style={{ background: P.bg, borderBottom: '1px solid ' + P.border }}>
                                                    {['School / Institute Name', 'Subscription Plan', 'Tenant Type', 'Amount (Rs.)', 'Billing', 'Status', 'Start Date', 'Expiry Date'].map(h => (
                                                        <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data!.recentSubscriptions.map((s, i) => {
                                                    const tenantName = s.tenants?.name || 'Registered Tenant'
                                                    const tenantType = (s.tenants?.tenant_type || s.tenants?.type || s.plan_type || 'institute').replace('_', ' ')
                                                    return (
                                                        <tr key={s.id} style={{ borderBottom: i < data!.recentSubscriptions.length - 1 ? '1px solid ' + P.border : 'none', transition: 'background 0.15s' }}>
                                                            <td style={{ padding: '14px 18px' }}>
                                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: P.dark }}>{tenantName}</div>
                                                                <div style={{ fontSize: 11, color: P.muted }}>{s.tenants?.email || ''}</div>
                                                            </td>
                                                            <td style={{ padding: '14px 18px' }}>
                                                                <span style={{ background: P.brandBg, color: P.brand, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                                                                    {s.plan_name || 'STARTER'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontSize: 12, color: P.text, fontWeight: 600, textTransform: 'capitalize' }}>
                                                                {tenantType}
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 800, color: P.dark }}>
                                                                Rs. {Number(s.amount || 0).toLocaleString('en-IN')}
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontSize: 12.5, fontWeight: 600, color: P.text, textTransform: 'capitalize' }}>
                                                                {s.billing_cycle || 'Monthly'}
                                                            </td>
                                                            <td style={{ padding: '14px 18px' }}>
                                                                <span style={{
                                                                    background: s.status === 'active' ? P.successBg : s.status === 'cancelled' ? P.errorBg : P.warningBg,
                                                                    color: s.status === 'active' ? P.success : s.status === 'cancelled' ? P.error : P.warning,
                                                                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
                                                                }}>
                                                                    {s.status || 'ACTIVE'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontSize: 12, color: P.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                {s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                            </td>
                                                            <td style={{ padding: '14px 18px', fontSize: 12, color: P.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                {s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
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
