'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
    Landmark, CheckCircle, XCircle, Loader2, ArrowLeft, Search,
    FileText, AlertCircle, Calendar, Building2, Inbox,
    Eye, ShieldCheck, DollarSign, Clock, X, RefreshCw, Filter
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { SideDrawer } from '@/components/owner/SideDrawer'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { useRouter } from 'next/navigation'

type WithdrawalRequest = {
    id: string
    tenant_id: string
    amount: number
    status: 'pending' | 'settled' | 'rejected'
    requested_at: string
    reviewed_at?: string
    reviewed_by?: string
    admin_note?: string
    tenant_note?: string
    tenants?: { name: string }
}

type SettlementDetail = {
    id: string
    gross_amount: number
    tds_amount: number
    processing_fees: number
    net_paid: number
    payment_method: string
    transaction_ref: string
    processed_at: string
    processor_name?: string
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
    pending:  { label: 'Waiting',   bg: '#FEF3C7', color: '#92400E' },
    settled:  { label: 'Paid Out',  bg: '#ECFDF5', color: '#065F46' },
    rejected: { label: 'Declined',  bg: '#FEF2F2', color: '#991B1B' },
}

function StatusChip({ status }: { status: string }) {
    const s = STATUS_LABELS[status] || { label: status, bg: P.bg, color: P.muted }
    return (
        <span style={{ padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 1000, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.label}
        </span>
    )
}

export default function WithdrawalRequestsPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<WithdrawalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled' | 'rejected'>('all')

    // Modals
    const [activeRequest, setActiveRequest] = useState<WithdrawalRequest | null>(null)
    const [showSettleModal, setShowSettleModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)

    // Audit drawer
    const [auditDrawer, setAuditDrawer] = useState(false)
    const [auditLoading, setAuditLoading] = useState(false)
    const [settlement, setSettlement] = useState<SettlementDetail | null>(null)

    const [form, setForm] = useState({ ref: '', note: '' })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/finance/withdrawals')
            const json = await res.json()
            if (res.ok) setRequests(json.requests || [])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchRequests() }, [fetchRequests])

    // Filtered list
    const filtered = useMemo(() => {
        return requests.filter(r => {
            const matchesSearch = !search || r.tenants?.name?.toLowerCase().includes(search.toLowerCase()) || r.tenant_id.toLowerCase().includes(search.toLowerCase())
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [requests, search, statusFilter])

    // KPI totals
    const totalPending = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
    const pendingCount = requests.filter(r => r.status === 'pending').length
    const totalPaidOut = requests.filter(r => r.status === 'settled').reduce((s, r) => s + r.amount, 0)

    const processAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!activeRequest) return
        if (action === 'APPROVE' && !form.ref.trim()) return alert('Enter the bank reference code before approving.')
        setSaving(true)
        try {
            const res = await fetch('/api/owner/finance/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: activeRequest.id, action, admin_note: form.note, transaction_ref: form.ref })
            })
            if (!res.ok) throw new Error('Operation failed')
            await fetchRequests()
            showToast(action === 'APPROVE' ? 'Payout approved and funds sent.' : 'Payout request declined.', true)
            setShowSettleModal(false)
            setShowRejectModal(false)
            setForm({ ref: '', note: '' })
        } catch (e: any) {
            showToast(e.message, false)
        } finally { setSaving(false) }
    }

    const handleOpenAuditTrail = async (request: WithdrawalRequest) => {
        setActiveRequest(request)
        setAuditDrawer(true)
        setAuditLoading(true)
        setSettlement(null)
        try {
            const res = await fetch(`/api/owner/finance/withdrawals?action=GET_SETTLEMENT&withdrawal_request_id=${request.id}`)
            if (res.ok) {
                const json = await res.json()
                setSettlement(json.settlement)
            }
        } catch (e) {
            console.error('Failed to load settlement:', e)
        } finally { setAuditLoading(false) }
    }

    return (
        <div style={{ padding: '48px 56px', background: P.bg, minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 90000 }}>
                    {toast.ok ? <CheckCircle size={20} color={P.success} /> : <XCircle size={20} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ marginBottom: 40 }}>
                <button onClick={() => router.push('/owner/finance')} style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, color: P.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer', marginBottom: 20 }}>
                    <ArrowLeft size={16} /> Back to Tenant Balances
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: 12, background: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)', borderRadius: 16 }}>
                            <Landmark size={28} color="#FFF" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 32, fontWeight: 1000, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Withdrawal Requests</h1>
                            <p style={{ fontSize: 15, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Approve or decline payout requests from tenants.</p>
                        </div>
                    </div>
                    <button onClick={fetchRequests} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
                <KpiCard icon={AlertCircle} title="Waiting for Approval" value={String(pendingCount)} color={P.warning} />
                <KpiCard icon={DollarSign} title="Total Pending Amount" value={`Rs. ${Number(totalPending).toLocaleString()}`} color={P.warning} />
                <KpiCard icon={CheckCircle} title="Total Paid Out (All Time)" value={`Rs. ${Number(totalPaidOut).toLocaleString()}`} color={P.success} />
            </div>

            {/* TABLE CARD */}
            <div style={{ background: '#FFF', borderRadius: 28, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                {/* SEARCH & FILTER BAR */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFBFC', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        {/* Search */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF', padding: '10px 16px', borderRadius: 12, border: `1px solid ${P.border}`, width: 300 }}>
                            <Search size={16} color={P.muted} />
                            <input
                                placeholder="Search by tenant name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: P.dark, background: 'transparent', width: '100%' }}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, display: 'flex' }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {(['all', 'pending', 'settled', 'rejected'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    style={{
                                        padding: '8px 14px', borderRadius: 10, border: `1px solid ${statusFilter === s ? P.brand : P.border}`,
                                        background: statusFilter === s ? P.brandBg : '#fff',
                                        color: statusFilter === s ? P.brand : P.muted,
                                        fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {s === 'all' ? 'All' : STATUS_LABELS[s]?.label || s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>
                        {filtered.length} of {requests.length} requests
                    </div>
                </div>

                {/* TABLE */}
                {loading ? (
                    <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
                        <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: '#F8FAFC' }}>
                                    {['Tenant Name', 'Requested Amount', 'Request Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '18px 28px', fontSize: 11, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={r.id} style={{ borderBottom: `1px solid ${P.border}`, transition: 'background 0.15s' }}>
                                        <td style={{ padding: '22px 28px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Building2 size={18} color={P.brand} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{r.tenants?.name || 'Unknown Tenant'}</div>
                                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginTop: 2 }}>ID: {r.tenant_id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '22px 28px' }}>
                                            <div style={{ fontSize: 18, fontWeight: 1000, color: P.dark }}>Rs. {Number(r.amount).toLocaleString()}</div>
                                            {r.status === 'settled' && (
                                                <div style={{ fontSize: 11, color: P.success, fontWeight: 700, marginTop: 4 }}>Paid out</div>
                                            )}
                                            {r.status === 'pending' && (
                                                <div style={{ fontSize: 11, color: P.warning, fontWeight: 700, marginTop: 4 }}>Awaiting approval</div>
                                            )}
                                            {r.status === 'rejected' && (
                                                <div style={{ fontSize: 11, color: P.error, fontWeight: 700, marginTop: 4 }}>Request declined</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '22px 28px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.text }}>
                                                <Calendar size={14} color={P.muted} />
                                                {new Date(r.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '22px 28px' }}>
                                            <StatusChip status={r.status} />
                                        </td>
                                        <td style={{ padding: '22px 28px' }}>
                                            {r.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button onClick={() => { setActiveRequest(r); setShowSettleModal(true) }} style={{ padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #1FAC63 0%, #15803d 100%)', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(31,172,99,0.2)' }}>
                                                        Approve
                                                    </button>
                                                    <button onClick={() => { setActiveRequest(r); setShowRejectModal(true) }} style={{ padding: '10px 18px', borderRadius: 12, background: '#FFF', border: `1px solid ${P.error}30`, color: P.error, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
                                                        Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleOpenAuditTrail(r)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, color: P.brand, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                                                    <Eye size={14} /> View Receipt
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filtered.length === 0 && !loading && (
                            <div style={{ padding: '100px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 72, height: 72, borderRadius: 24, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Inbox size={36} color={P.muted} />
                                </div>
                                <div style={{ maxWidth: 320 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, color: P.dark, marginBottom: 8 }}>
                                        {search || statusFilter !== 'all' ? 'No results found' : 'No requests yet'}
                                    </h3>
                                    <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6 }}>
                                        {search || statusFilter !== 'all'
                                            ? 'Try adjusting your search or filter.'
                                            : 'Payout requests from tenants will appear here once submitted.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* APPROVE MODAL */}
            {showSettleModal && activeRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#FFF', borderRadius: 28, width: 460, padding: 36, boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: 22, fontWeight: 1000, color: P.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={26} color={P.success} /> Approve Payout
                        </h2>
                        <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
                            You are about to send <b>Rs. {Number(activeRequest.amount).toLocaleString()}</b> to <b>{activeRequest.tenants?.name}</b>. Tax and processing fees will be deducted automatically.
                        </p>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8 }}>Bank Reference Code (UTR) *</label>
                            <input value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} placeholder="e.g. UTR10928301982" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, outline: 'none', fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8 }}>Admin Note (optional)</label>
                            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Internal note..." style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: `1px solid ${P.border}`, outline: 'none', fontSize: 13, fontWeight: 600, boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowSettleModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1px solid ${P.border}`, background: '#FFF', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => processAction('APPROVE')} disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: P.brand, color: '#FFF', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirm & Send Funds'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DECLINE MODAL */}
            {showRejectModal && activeRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#FFF', borderRadius: 28, width: 460, padding: 36, boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: 22, fontWeight: 1000, color: P.error, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <XCircle size={26} color={P.error} /> Decline Request
                        </h2>
                        <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
                            Decline payout request from <b>{activeRequest.tenants?.name}</b>. Their balance will remain unchanged.
                        </p>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8 }}>Reason for Declining</label>
                            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="State the reason for declining this request..." style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, outline: 'none', fontSize: 14, fontWeight: 600, minHeight: 100, resize: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1px solid ${P.border}`, background: '#FFF', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => processAction('REJECT')} disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: P.error, color: '#FFF', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Decline Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RECEIPT DRAWER */}
            <SideDrawer isOpen={auditDrawer} onClose={() => setAuditDrawer(false)} title="Payout Receipt" width={520}>
                {auditLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
                        <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>Loading receipt...</span>
                    </div>
                ) : settlement ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Tenant</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>{activeRequest?.tenants?.name}</div>
                            <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>ID: {activeRequest?.tenant_id}</div>
                        </div>

                        {/* Breakdown */}
                        <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Payout Breakdown</div>
                            {[
                                { label: 'Requested Amount', val: `Rs. ${Number(settlement.gross_amount).toLocaleString()}`, color: P.dark },
                                { label: 'Tax Deducted', val: `-Rs. ${Number(settlement.tds_amount).toLocaleString()}`, color: P.error },
                                { label: 'Processing Fee', val: `-Rs. ${Number(settlement.processing_fees).toLocaleString()}`, color: P.error },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 650, color: row.color }}>
                                    <span>{row.label}</span><span>{row.val}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${P.border}`, paddingTop: 12, fontSize: 16, fontWeight: 950, color: P.success }}>
                                <span>Net Amount Received</span>
                                <span>Rs. {Number(settlement.net_paid).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
                            {[
                                { label: 'Bank Reference (UTR)', value: <code style={{ fontSize: 13, fontWeight: 800, color: P.brand, background: P.brandBg, padding: '4px 8px', borderRadius: 6 }}>{settlement.transaction_ref}</code> },
                                { label: 'Payment Method', value: 'Bank Transfer (NEFT/RTGS)' },
                                { label: 'Processed On', value: new Date(settlement.processed_at).toLocaleString() },
                                { label: 'Approved By', value: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} color={P.success} />{settlement.processor_name || 'System'}</span> },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>{row.label}:</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        {activeRequest?.admin_note && (
                            <div style={{ padding: 14, borderRadius: 12, background: P.bg, borderLeft: `4px solid ${P.brand}`, fontSize: 12, color: P.text, fontWeight: 600 }}>
                                <strong>Note:</strong> {activeRequest.admin_note}
                            </div>
                        )}

                        <button onClick={() => setAuditDrawer(false)} style={{ width: '100%', padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, color: P.dark, fontWeight: 800, cursor: 'pointer', marginTop: 8 }}>
                            Close
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: P.muted, fontWeight: 700 }}>
                        Receipt not available for this request.
                    </div>
                )}
            </SideDrawer>
        </div>
    )
}
