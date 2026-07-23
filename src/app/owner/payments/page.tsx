'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    CreditCard, LayoutTemplate, Briefcase, FileText, CheckCircle, XCircle,
    Plus, Upload, Shield, Zap, Search, Activity, MoreVertical, RefreshCw, Loader2, ArrowUpRight,
    X, Check, Filter, ArrowRight, ExternalLink, ShieldCheck, Info, Layers, DollarSign, TrendingUp,
    PieChart, Users, Eye
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

type Subscription = {
    id: string
    tenant_id: string
    plan_id: string
    status: string
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

export default function RevenueLedgerPage() {
    const [activeTab, setActiveTab] = useState<'analytics' | 'subscriptions' | 'ledger' | 'invoices'>('analytics')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Data states
    const [metrics, setMetrics] = useState<Metrics>({
        totalRevenue: 0,
        subscriptionRevenue: 0,
        examRevenue: 0,
        walletRevenue: 0,
        syllabusRevenue: 0,
        mrr: 0,
        arr: 0,
        arpu: 0,
        activeTenants: 0
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
        } catch (e) {
            showToast('Error loading ledger metadata', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleToggleSub = async (sub: Subscription) => {
        const nextStatus = sub.status === 'active' ? 'cancelled' : 'active'
        if (!confirm(`Transition subscription state to ${nextStatus}?`)) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: sub.status === 'active' ? 'REVOKE_SUBSCRIPTION' : 'CONFIRM_PAYMENT',
                    payload: sub.status === 'active' ? { id: sub.id } : { invoice_id: invoices.find(i => i.tenant_id === sub.tenant_id)?.id }
                })
            })
            if (res.ok) {
                showToast('Subscription state adjusted.', true)
                fetchData()
            } else throw new Error('Adjust failed')
        } catch (e: any) {
            showToast(e.message, false)
        } finally {
            setSaving(false)
        }
    }

    const TABS = [
        { id: 'analytics', icon: TrendingUp, label: 'Revenue Overview' },
        { id: 'subscriptions', icon: Layers, label: 'Institute Subscriptions' },
        { id: 'ledger', icon: CreditCard, label: 'Payment Ledger' },
        { id: 'invoices', icon: FileText, label: 'Invoices History' },
    ] as const

    const getFilteredSubscriptions = () => {
        return subscriptions.filter(s => 
            s.tenants?.name.toLowerCase().includes(search.toLowerCase())
        )
    }

    const getFilteredPayments = () => {
        return payments.filter(p => 
            (p.tenants?.name || 'Root Portal').toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase())
        )
    }

    const getFilteredInvoices = () => {
        return invoices.filter(i => 
            i.tenants?.name.toLowerCase().includes(search.toLowerCase())
        )
    }

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
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue & Subscriptions</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>System Management</div>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Revenue Ledger & Analytics</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>Audit transactions, subscription cycles, payment distributions, and download invoices.</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> 
                        {loading ? 'Synchronizing...' : 'Sync Payments Data'}
                    </button>
                </div>
            </header>

            {/* TABS NAVIGATION */}
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 16, width: 'fit-content', marginBottom: 32 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? P.brand : P.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === t.id ? '0 4px 12px rgba(0,0,0,0.03)' : 'none' }}>
                        <t.icon size={16} strokeWidth={2.5} /> {t.label}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT CARD */}
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.02)', minHeight: 480 }}>
                {activeTab !== 'analytics' && (
                    <div style={{ padding: '20px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                        <div style={{ position: 'relative', width: 320 }}>
                            <Search size={16} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." style={{ width: '100%', padding: '12px 16px', paddingLeft: 44, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: P.dark, background: '#fff', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }} />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <div>
                        {/* ── Tab 1: Revenue Overview ── */}
                        {activeTab === 'analytics' && (
                            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
                                {/* Advanced Financial Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                    <KpiCard icon={DollarSign} title="Total Income" value={`₹${Number(metrics.totalRevenue || 0).toLocaleString()}`} color={P.brand} />
                                    <KpiCard icon={TrendingUp} title="Estimated Monthly Income" value={`₹${Number(metrics.mrr || 0).toLocaleString()}`} color={P.success} />
                                    <KpiCard icon={PieChart} title="Estimated Yearly Income" value={`₹${Number(metrics.arr || 0).toLocaleString()}`} color={P.info} />
                                    <KpiCard icon={Users} title="Average Income per Institute" value={`₹${Number(metrics.arpu || 0).toFixed(0)}`} color="#EA580C" />
                                </div>

                                {/* Financial Stream breakdowns */}
                                <div>
                                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: P.dark }}>Payment Category Breakdown</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                        {[
                                            { title: 'Subscriptions Income', val: metrics.subscriptionRevenue, color: P.info, label: 'Service Licenses' },
                                            { title: 'Mock Exams Income', val: metrics.examRevenue, color: P.warning, label: 'Direct sales split' },
                                            { title: 'Study Materials Income', val: metrics.syllabusRevenue, color: P.brand, label: 'Educational contents' },
                                            { title: 'Student Wallet Income', val: metrics.walletRevenue, color: P.success, label: 'Deposit purchases' }
                                        ].map(stream => (
                                            <div key={stream.title} style={{ padding: 24, borderRadius: 20, border: `1px solid ${P.border}`, background: P.bg }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stream.title}</div>
                                                <div style={{ fontSize: 26, fontWeight: 950, color: stream.color, marginTop: 8 }}>₹{Number(stream.val || 0).toLocaleString()}</div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4 }}>{stream.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Tab 2: Institute Subscriptions ── */}
                        {activeTab === 'subscriptions' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                            {['Institute Name', 'Billing Cycle', 'Price Tier', 'Renewal due date', 'Status', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredSubscriptions().map(s => (
                                            <tr key={s.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{s.tenants?.name}</div>
                                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2 }}>{s.tenants?.email}</div>
                                                </td>
                                                <td style={{ padding: '20px 32px', fontSize: 13, fontWeight: 800, color: P.dark, textTransform: 'capitalize' }}>
                                                    {s.billing_cycle || 'Monthly'}
                                                </td>
                                                <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 900, color: P.brand }}>
                                                    ₹{Number(s.amount).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <div style={{ fontSize: 13, color: P.dark, fontWeight: 800 }}>Expires: {new Date(s.end_date).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2 }}>Automatic Renewal: {s.auto_renew ? 'Active' : 'Disabled'}</div>
                                                </td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: s.status === 'active' ? P.successBg : P.errorBg, color: s.status === 'active' ? P.success : P.error, textTransform: 'uppercase' }}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <button onClick={() => handleToggleSub(s)} disabled={saving} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: P.brandBg, color: P.brand, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                        {s.status === 'active' ? 'Suspend Institute' : 'Activate Institute'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
                                            {['Transaction ID', 'Institute Name', 'Payment Type', 'Status', 'Payment Date', 'Total Paid'].map(h => (
                                                <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredPayments().map(p => (
                                            <tr key={p.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                <td style={{ padding: '18px 32px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: P.muted }}>
                                                    #{p.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 14, fontWeight: 800, color: P.dark }}>
                                                    {p.tenants?.name || 'Root Portal'}
                                                </td>
                                                <td style={{ padding: '18px 32px' }}>
                                                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, background: P.brandBg, color: P.brand, textTransform: 'uppercase' }}>{p.type}</span>
                                                </td>
                                                <td style={{ padding: '18px 32px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'success' ? P.success : P.warning }} />
                                                        <span style={{ fontSize: 12, fontWeight: 800, color: p.status === 'success' ? P.success : P.warning }}>{p.status === 'success' ? 'Settled' : 'Pending'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 13, color: P.muted, fontWeight: 650 }}>
                                                    {new Date(p.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 15, fontWeight: 950, color: P.dark }}>
                                                    ₹{Number(p.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Tab 4: Invoices History ── */}
                        {activeTab === 'invoices' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                            {['Invoice ID', 'Institute Name', 'Base Cost', 'Tax GST (18%)', 'Total Paid', 'Status', 'Receipts'].map(h => (
                                                <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredInvoices().map(inv => (
                                            <tr key={inv.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                <td style={{ padding: '18px 32px', fontSize: 13, fontWeight: 800, color: P.dark }}>
                                                    {inv.invoice_url ? inv.invoice_url.slice(-14).replace('.pdf', '') : `INV-${inv.id.slice(-6).toUpperCase()}`}
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 14, fontWeight: 800, color: P.dark }}>
                                                    {inv.tenants?.name}
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 14, fontWeight: 700, color: P.text }}>
                                                    ₹{Number(inv.base_amount || inv.amount / 1.18).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 14, fontWeight: 700, color: P.muted }}>
                                                    ₹{Number(inv.gst_amount || (inv.amount - inv.amount / 1.18)).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '18px 32px', fontSize: 15, fontWeight: 950, color: P.brand }}>
                                                    ₹{Number(inv.amount).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '18px 32px' }}>
                                                    <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, background: inv.status === 'paid' ? P.successBg : P.errorBg, color: inv.status === 'paid' ? P.success : P.error, textTransform: 'uppercase' }}>{inv.status}</span>
                                                </td>
                                                <td style={{ padding: '18px 32px' }}>
                                                    {inv.invoice_url ? (
                                                        <a href={inv.invoice_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 850, color: P.brand, textDecoration: 'none', background: P.brandBg, padding: '6px 12px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            Receipt PDF <ExternalLink size={13} />
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>Legacy record</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
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
