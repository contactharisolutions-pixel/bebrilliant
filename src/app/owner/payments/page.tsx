'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    CreditCard, FileText, CheckCircle, XCircle,
    Search, RefreshCw, Loader2, ArrowUpRight,
    ExternalLink, DollarSign, TrendingUp,
    PieChart, Users, Layers, Clock
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

type Subscription = {
    id: string
    tenant_id: string
    plan_id: string
    status: string
    billing_cycle?: string
    start_date: string
    end_date: string
    auto_renew: boolean
    amount: number
    tenants: { name: string; email: string }
}

type Invoice = {
    id: string
    tenant_id: string
    amount: number
    status: string
    created_at: string
    invoice_url: string
    base_amount: number
    gst_amount: number
    gst_percent: number
    tenants: { name: string }
}

type PaymentRecord = {
    id: string
    tenant_id: string
    amount: number
    type: string
    status: string
    created_at: string
    tenants?: { name: string }
}

type Metrics = {
    totalRevenue: number
    subscriptionRevenue: number
    examRevenue: number
    walletRevenue: number
    syllabusRevenue: number
    mrr: number
    arr: number
    arpu: number
    activeTenants: number
}

function EmptyTableRow({ cols, message }: { cols: number; message: string }) {
    return (
        <tr>
            <td colSpan={cols} style={{ padding: '80px 32px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: P.bg, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={24} color={P.muted} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: P.muted }}>{message}</span>
                </div>
            </td>
        </tr>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        success:   { bg: '#ECFDF5', color: '#065F46', label: 'Settled' },
        paid:      { bg: '#ECFDF5', color: '#065F46', label: 'Paid' },
        active:    { bg: '#ECFDF5', color: '#065F46', label: 'Active' },
        pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
        failed:    { bg: '#FEF2F2', color: '#991B1B', label: 'Failed' },
        cancelled: { bg: '#FEF2F2', color: '#991B1B', label: 'Cancelled' },
        unpaid:    { bg: '#FEF3C7', color: '#92400E', label: 'Unpaid' },
    }
    const s = map[status?.toLowerCase()] || { bg: P.bg, color: P.muted, label: status }
    return (
        <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.label}
        </span>
    )
}

export default function TenantPaymentsPage() {
    const [activeTab, setActiveTab] = useState<'analytics' | 'subscriptions' | 'ledger' | 'invoices'>('analytics')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const [metrics, setMetrics] = useState<Metrics>({
        totalRevenue: 0, subscriptionRevenue: 0, examRevenue: 0,
        walletRevenue: 0, syllabusRevenue: 0, mrr: 0, arr: 0, arpu: 0, activeTenants: 0
    })
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [billingRes, paymentsRes] = await Promise.all([
                fetch('/api/owner/billing'),
                fetch('/api/owner/payments')
            ])
            if (billingRes.ok) {
                const bData = await billingRes.json()
                setSubscriptions(bData.subscriptions || [])
                setInvoices(bData.invoices || [])
            }
            if (paymentsRes.ok) {
                const pData = await paymentsRes.json()
                setMetrics(pData.metrics)
                setPayments(pData.payments || [])
            }
        } catch {
            showToast('Error loading payment data', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleToggleSub = async (sub: Subscription) => {
        const nextStatus = sub.status === 'active' ? 'cancelled' : 'active'
        if (!confirm(`Change this subscription to "${nextStatus}"?`)) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: sub.status === 'active' ? 'REVOKE_SUBSCRIPTION' : 'CONFIRM_PAYMENT',
                    payload: sub.status === 'active'
                        ? { id: sub.id }
                        : { invoice_id: invoices.find(i => i.tenant_id === sub.tenant_id)?.id }
                })
            })
            if (res.ok) { showToast('Subscription updated.', true); fetchData() }
            else throw new Error('Update failed')
        } catch (e: any) {
            showToast(e.message, false)
        } finally { setSaving(false) }
    }

    const TABS = [
        { id: 'analytics',     icon: TrendingUp, label: 'Income Overview' },
        { id: 'subscriptions', icon: Layers,     label: 'Tenant Subscriptions' },
        { id: 'ledger',        icon: CreditCard, label: 'Payment Ledger' },
        { id: 'invoices',      icon: FileText,   label: 'Invoice Records' },
    ] as const

    const filteredSubs = subscriptions.filter(s =>
        s.tenants?.name?.toLowerCase().includes(search.toLowerCase())
    )
    const filteredPayments = payments.filter(p =>
        (p.tenants?.name || 'Root Portal').toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase())
    )
    const filteredInvoices = invoices.filter(i =>
        i.tenants?.name?.toLowerCase().includes(search.toLowerCase())
    )

    const thStyle: React.CSSProperties = {
        padding: '16px 28px', textAlign: 'left', fontSize: 11,
        fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em'
    }
    const tdStyle: React.CSSProperties = { padding: '20px 28px' }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '40px 48px', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 9000, backdropFilter: 'blur(8px)' }}>
                    {toast.ok ? <CheckCircle size={18} color={P.success} /> : <XCircle size={18} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 800, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Income & Subscriptions</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>System Management</div>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Tenant Payments</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>
                        View tenant subscriptions, all payment transactions, and download invoices.
                    </p>
                </div>
                <button
                    onClick={() => fetchData()}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}
                >
                    <RefreshCw size={16} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    {loading ? 'Loading...' : 'Refresh Data'}
                </button>
            </header>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 16, width: 'fit-content', marginBottom: 32 }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                            borderRadius: 12, border: 'none',
                            background: activeTab === t.id ? '#fff' : 'transparent',
                            color: activeTab === t.id ? P.brand : P.muted,
                            fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: activeTab === t.id ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
                        }}
                    >
                        <t.icon size={16} strokeWidth={2.5} /> {t.label}
                    </button>
                ))}
            </div>

            {/* CONTENT CARD */}
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.02)', minHeight: 480 }}>

                {/* Search bar for non-analytics tabs */}
                {activeTab !== 'analytics' && (
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${P.border}`, background: P.bg }}>
                        <div style={{ position: 'relative', width: 320 }}>
                            <Search size={16} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by tenant name..."
                                style={{ width: '100%', padding: '12px 16px', paddingLeft: 44, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: P.dark, background: '#fff', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <div>

                        {/* ── Tab 1: Income Overview ── */}
                        {activeTab === 'analytics' && (
                            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
                                {/* Top KPIs */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                    <KpiCard icon={DollarSign} title="Total Income" value={`Rs. ${Number(metrics.totalRevenue || 0).toLocaleString()}`} color={P.brand} />
                                    <KpiCard icon={TrendingUp} title="Monthly Income (Est.)" value={`Rs. ${Number(metrics.mrr || 0).toLocaleString()}`} color={P.success} />
                                    <KpiCard icon={PieChart} title="Yearly Income (Est.)" value={`Rs. ${Number(metrics.arr || 0).toLocaleString()}`} color={P.info} />
                                    <KpiCard icon={Users} title="Avg. Income per Tenant" value={`Rs. ${Number(metrics.arpu || 0).toFixed(0)}`} color="#EA580C" />
                                </div>

                                {/* Income by category */}
                                <div>
                                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: P.dark }}>Income by Category</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                        {[
                                            { title: 'Subscription Income', val: metrics.subscriptionRevenue, color: P.info, label: 'Service licences' },
                                            { title: 'Exam Income', val: metrics.examRevenue, color: P.warning, label: 'Mock exam sales' },
                                            { title: 'Study Material Income', val: metrics.syllabusRevenue, color: P.brand, label: 'Course content sales' },
                                            { title: 'Student Wallet Income', val: metrics.walletRevenue, color: P.success, label: 'Wallet top-ups' },
                                        ].map(stream => (
                                            <div key={stream.title} style={{ padding: 24, borderRadius: 20, border: `1px solid ${P.border}`, background: P.bg }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stream.title}</div>
                                                <div style={{ fontSize: 26, fontWeight: 950, color: stream.color, marginTop: 8 }}>Rs. {Number(stream.val || 0).toLocaleString()}</div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4 }}>{stream.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Tab 2: Tenant Subscriptions ── */}
                        {activeTab === 'subscriptions' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                            {['Tenant Name', 'Billing Cycle', 'Amount', 'Renewal Date', 'Status', 'Actions'].map(h => (
                                                <th key={h} style={thStyle}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSubs.length === 0
                                            ? <EmptyTableRow cols={6} message="No subscriptions found." />
                                            : filteredSubs.map(s => (
                                                <tr key={s.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{s.tenants?.name}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2 }}>{s.tenants?.email}</div>
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 13, fontWeight: 800, color: P.dark, textTransform: 'capitalize' }}>
                                                        {s.billing_cycle || 'Monthly'}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 15, fontWeight: 950, color: P.brand }}>
                                                        Rs. {Number(s.amount).toLocaleString()}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: P.dark, fontWeight: 800 }}>
                                                            <Clock size={13} color={P.muted} />
                                                            {new Date(s.end_date).toLocaleDateString()}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2 }}>
                                                            Auto-renew: {s.auto_renew ? 'On' : 'Off'}
                                                        </div>
                                                    </td>
                                                    <td style={tdStyle}><StatusBadge status={s.status} /></td>
                                                    <td style={tdStyle}>
                                                        <button
                                                            onClick={() => handleToggleSub(s)}
                                                            disabled={saving}
                                                            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: s.status === 'active' ? '#FEF2F2' : P.successBg, color: s.status === 'active' ? P.error : P.success, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                                                        >
                                                            {s.status === 'active' ? 'Suspend' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Tab 3: Payment Ledger ── */}
                        {activeTab === 'ledger' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                            {['Transaction ID', 'Tenant Name', 'Payment Type', 'Status', 'Date', 'Amount'].map(h => (
                                                <th key={h} style={thStyle}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.length === 0
                                            ? <EmptyTableRow cols={6} message="No payment records found." />
                                            : filteredPayments.map(p => (
                                                <tr key={p.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: P.muted }}>
                                                        #{p.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 14, fontWeight: 800, color: P.dark }}>
                                                        {p.tenants?.name || 'Root Portal'}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, background: P.brandBg, color: P.brand, textTransform: 'uppercase' }}>
                                                            {p.type}
                                                        </span>
                                                    </td>
                                                    <td style={tdStyle}><StatusBadge status={p.status} /></td>
                                                    <td style={{ ...tdStyle, fontSize: 13, color: P.muted, fontWeight: 650 }}>
                                                        {new Date(p.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 15, fontWeight: 950, color: P.dark }}>
                                                        Rs. {Number(p.amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Tab 4: Invoice Records ── */}
                        {activeTab === 'invoices' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                            {['Invoice ID', 'Tenant Name', 'Base Amount', 'Tax (GST)', 'Total Paid', 'Status', 'Receipt'].map(h => (
                                                <th key={h} style={thStyle}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.length === 0
                                            ? <EmptyTableRow cols={7} message="No invoices found." />
                                            : filteredInvoices.map(inv => (
                                                <tr key={inv.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: P.muted }}>
                                                        INV-{inv.id.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 14, fontWeight: 800, color: P.dark }}>
                                                        {inv.tenants?.name}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 14, fontWeight: 700, color: P.text }}>
                                                        Rs. {Number(inv.base_amount || 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 14, fontWeight: 700, color: P.muted }}>
                                                        Rs. {Number(inv.gst_amount || 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 15, fontWeight: 950, color: P.brand }}>
                                                        Rs. {Number(inv.amount).toLocaleString()}
                                                    </td>
                                                    <td style={tdStyle}><StatusBadge status={inv.status} /></td>
                                                    <td style={tdStyle}>
                                                        {inv.invoice_url ? (
                                                            <a href={inv.invoice_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 850, color: P.brand, textDecoration: 'none', background: P.brandBg, padding: '6px 12px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                Download <ExternalLink size={13} />
                                                            </a>
                                                        ) : (
                                                            <span style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>Not available</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    )
}
