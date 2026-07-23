'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
    TrendingUp, CreditCard, Zap, History, FileText, ArrowUpRight,
    ArrowDownRight, Wallet, DollarSign, Loader2, Activity, ArrowRight,
    Search, Filter, Layers, ShieldCheck, RefreshCw, Settings, Building,
    Edit3, Save, X, Info
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

type WalletLedger = {
    tenant_id: string
    available_balance: number
    pending_balance: number
    last_updated: string
    tenants?: { name: string }
}

export default function FinanceDashboard() {
    const [data, setData] = useState<any>(null)
    const [wallets, setWallets] = useState<WalletLedger[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Treasury configurations
    const [config, setConfig] = useState({ tds_percent: 10.0, processing_fee_percent: 2.0 })
    const [showConfigDrawer, setShowConfigDrawer] = useState(false)

    // Manual balance adjustments
    const [showAdjustDrawer, setShowAdjustDrawer] = useState(false)
    const [selectedWallet, setSelectedWallet] = useState<WalletLedger | null>(null)
    const [adjustForm, setAdjustForm] = useState({ amount: '', notes: '', type: 'credit' }) // 'credit' = add, 'debit' = subtract

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [statsRes, walletsRes, configRes] = await Promise.all([
                fetch('/api/owner/finance/stats'),
                fetch('/api/owner/finance/wallets'),
                fetch('/api/owner/finance/withdrawals?action=GET_TREASURY_CONFIG')
            ])

            if (statsRes.ok) setData(await statsRes.json())
            if (walletsRes.ok) setWallets((await walletsRes.json()).wallets || [])
            if (configRes.ok) setConfig((await configRes.json()).config || { tds_percent: 10.0, processing_fee_percent: 2.0 })
        } catch (e) {
            console.error('Failed retrieving treasury data:', e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const runSeed = async () => {
        setSeeding(true)
        try {
            const res = await fetch('/api/owner/finance/seed', { method: 'POST' })
            const d = await res.json()
            if (d.success) {
                showToast(`Seeded ${d.seeded.wallet} wallets and mock payout transactions.`, true)
                fetchData()
            } else {
                showToast(d.error || 'Seed failed', false)
            }
        } finally {
            setSeeding(false)
        }
    }

    const handleSaveConfig = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/finance/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_TREASURY_CONFIG',
                    tds_percent: config.tds_percent,
                    processing_fee_percent: config.processing_fee_percent
                })
            })
            if (res.ok) {
                showToast('Tax & payout fee settings updated successfully.', true)
                setShowConfigDrawer(false)
            } else throw new Error('Save failed')
        } catch (e: any) {
            showToast(e.message, false)
        } finally {
            setSaving(false)
        }
    }

    const handleManualAdjustment = async () => {
        if (!selectedWallet) return
        const val = parseFloat(adjustForm.amount)
        if (isNaN(val) || val <= 0) return alert('Enter a valid amount greater than 0.')

        setSaving(true)
        const amountAdjust = adjustForm.type === 'credit' ? val : -val

        try {
            const res = await fetch('/api/owner/finance/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'MANUAL_ADJUST',
                    tenantId: selectedWallet.tenant_id,
                    amount: amountAdjust,
                    notes: adjustForm.notes
                })
            })
            const result = await res.json()
            if (res.ok) {
                showToast('Institute wallet balance adjusted successfully.', true)
                setShowAdjustDrawer(false)
                setAdjustForm({ amount: '', notes: '', type: 'credit' })
                fetchData()
            } else throw new Error(result.error || 'Adjustment failed')
        } catch (e: any) {
            showToast(e.message, false)
        } finally {
            setSaving(false)
        }
    }

    const stats = data?.stats || { totalRevenue: 0, commissionEarned: 0, activeSubscriptions: 0, pendingPayouts: 0, breakdown: { subscription: 0, exam: 0, wallet: 0, syllabus: 0 } }

    return (
        <div style={{ padding: '40px 48px', minHeight: '100vh', background: P.bg, position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            
            {/* TOAST PANEL */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 90000 }}>
                    {toast.ok ? <ShieldCheck size={20} color={P.success} /> : <Info size={20} color={P.error} />}
                    <span style={{ fontSize: 13, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: P.brandBg, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Financial Overview</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Master Financial Flow Control</div>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Financial Overview</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>High-fidelity control for platform revenue, commissions, and payout distributions.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={runSeed} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.brand, cursor: 'pointer' }}>
                        {seeding ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />} Seed mock Balances
                    </button>
                    <button onClick={() => setShowConfigDrawer(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <Settings size={16} color={P.muted} /> Payout Settings
                    </button>
                    <button onClick={() => window.location.href = '/owner/finance/payouts'} style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}30` }}>
                        <Wallet size={18} strokeWidth={2.5} /> Authorize Payouts
                    </button>
                </div>
            </header>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                <KpiCard icon={DollarSign} title="Total Platform Revenue" value={`₹${Number(stats.totalRevenue || 0).toLocaleString()}`} color={P.brand} />
                <KpiCard icon={Layers} title="Subscription Revenue" value={`₹${Number(stats.breakdown?.subscription || 0).toLocaleString()}`} color={P.info} />
                <KpiCard icon={Zap} title="Exam Fee Revenue" value={`₹${Number(stats.breakdown?.exam || 0).toLocaleString()}`} color={P.warning} />
                <KpiCard icon={Wallet} title="Wallet Purchases Income" value={`₹${Number(stats.breakdown?.wallet || 0).toLocaleString()}`} color={P.success} />
            </div>

            {/* BALANCE ENTITIES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 48 }}>
                <div style={{ padding: 32, borderRadius: 24, border: `1px solid ${P.border}`, background: 'linear-gradient(135deg, #1FAC63 0%, #15803d 100%)', color: '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Total Net Profit (Owner)</div>
                    <div style={{ fontSize: 44, fontWeight: 1000, marginTop: 8 }}>₹{Number(stats.netProfit || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 12, marginTop: 16, fontWeight: 600, opacity: 0.7 }}>Derived from 100% Subscription + Commissions on Exam/Wallet</div>
                </div>
                <div style={{ padding: 32, borderRadius: 24, border: `1px solid ${P.border}`, background: '#FFF' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: P.muted }}>Total Paid to Institutes</div>
                    <div style={{ fontSize: 44, fontWeight: 1000, marginTop: 8, color: P.dark }}>₹{Number((stats.totalRevenue || 0) - (stats.netProfit || 0)).toLocaleString()}</div>
                    <div style={{ fontSize: 12, marginTop: 16, fontWeight: 700, color: P.brand }}>{stats.pendingPayouts > 0 ? `₹${Number(stats.pendingPayouts).toLocaleString()} Currently Pending Payout` : 'All payouts settled'}</div>
                </div>
            </div>

            {/* INTERACTIVE TABLE & LEDGER DIVISION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                    {/* ECOSYSTEM WALLETS LEDGER */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand }} />
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Institute Balances Ledger</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                                <thead>
                                    <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                        {['Institute Name', 'Available Balance', 'Pending Balance', 'Last Updated', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {wallets.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 60, textAlign: 'center', color: P.muted, fontWeight: 700 }}>No institute wallets found. Seed mock data to verify.</td>
                                        </tr>
                                    )}
                                    {wallets.map(w => (
                                        <tr key={w.tenant_id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Building size={16} color={P.brand} />
                                                    </div>
                                                    <span style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{w.tenants?.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 14, fontWeight: 850, color: P.success }}>
                                                ₹{Number(w.available_balance).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 14, fontWeight: 800, color: P.warning }}>
                                                ₹{Number(w.pending_balance).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 650 }}>
                                                {new Date(w.last_updated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <button onClick={() => { setSelectedWallet(w); setShowAdjustDrawer(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 8, color: P.brand, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                    <Edit3 size={13} /> Adjust Balance
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RECENT TRANSACTION LOG */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Activity size={18} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>All Transactions Log</h3>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: P.bg }}>
                                        {['Institute Name', 'Payment Type', 'Gross Flow', 'Status', 'Timestamp'].map(h => (
                                            <th key={h} style={{ padding: '16px 24px', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.recentPayments?.map((p: any) => (
                                        <tr key={p.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{p.tenants?.name || 'Platform Owner'}</div>
                                                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>ID: {p.id.slice(0, 8)}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, background: P.brandBg, color: P.brand, textTransform: 'uppercase' }}>{p.type}</span>
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 14, fontWeight: 850, color: P.dark }}>
                                                ₹{p.amount?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'success' ? P.success : P.warning }} />
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: p.status === 'success' ? P.success : P.warning }}>{p.status === 'success' ? 'Completed' : 'Pending'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* SIDE COLUMN: RECENT ARTIFACTS INVOICES */}
                <div>
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <FileText size={18} color={P.cta} />
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: P.dark }}>Recent Invoices</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data?.recentInvoices?.map((inv: any) => (
                                <div key={inv.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, background: P.bg, border: `1px solid ${P.border}` }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}>
                                        <FileText size={16} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 850, color: P.dark }}>#{inv.id.slice(-6).toUpperCase()}</div>
                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{inv.tenants?.name}</div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 950, color: P.brand }}>₹{inv.amount}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TREASURY CONFIG DRAWERS ── */}
            <SideDrawer isOpen={showConfigDrawer} onClose={() => setShowConfigDrawer(false)} title="Tax & Payout Fee Settings" width={480}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.5, fontWeight: 600 }}>
                        Configure the default split values deducted during checkout cycles and settlements payout distributions.
                    </p>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Tax Deductions (%)</label>
                        <input className="input-modern" type="number" step="0.5" value={config.tds_percent} onChange={e => setConfig({ ...config, tds_percent: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Processing Fee (%)</label>
                        <input className="input-modern" type="number" step="0.1" value={config.processing_fee_percent} onChange={e => setConfig({ ...config, processing_fee_percent: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                        <button onClick={() => setShowConfigDrawer(false)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, color: P.dark, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSaveConfig} disabled={saving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Config
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── MANUAL ADJUSTMENT DRAWERS ── */}
            <SideDrawer isOpen={showAdjustDrawer} onClose={() => setShowAdjustDrawer(false)} title="Adjust Institute Balance" width={480}>
                {selectedWallet && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: P.dark }}>{selectedWallet.tenants?.name}</div>
                            <div style={{ fontSize: 13, color: P.success, fontWeight: 800, marginTop: 4 }}>Current Available Balance: ₹{Number(selectedWallet.available_balance).toLocaleString()}</div>
                        </div>

                        {/* Adjust Type */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Adjustment Type</label>
                            <select className="input-modern" value={adjustForm.type} onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value })}>
                                <option value="credit">➕ CREDIT (Add Funds)</option>
                                <option value="debit">➖ DEBIT (Subtract Funds)</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Adjustment Amount (₹)</label>
                            <input className="input-modern" type="number" min={1} value={adjustForm.amount} onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })} placeholder="e.g. 5000" />
                        </div>

                        {/* Note */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Reason / Notes</label>
                            <textarea className="input-modern" rows={3} style={{ resize: 'none' }} value={adjustForm.notes} onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })} placeholder="State the manual debit/credit justification..." />
                        </div>

                        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowAdjustDrawer(false)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, color: P.dark, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleManualAdjustment} disabled={saving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Adjust Balance
                            </button>
                        </div>
                    </div>
                )}
            </SideDrawer>
        </div>
    )
}
