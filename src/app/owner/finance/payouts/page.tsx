'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
    Landmark, CheckCircle, XCircle, Loader2, ArrowLeft, Search, Filter,
    FileText, HelpCircle, AlertCircle, Calendar, Building2, Receipt, Inbox,
    Eye, ShieldCheck, DollarSign, Clock, X
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { SideDrawer } from '@/components/owner/SideDrawer'

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

export default function OwnerPayouts() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    
    // Modals & Drawers
    const [activeRequest, setActiveRequest] = useState<WithdrawalRequest | null>(null)
    const [showSettleModal, setShowSettleModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)

    // Remittance Audit drawer
    const [auditDrawer, setAuditDrawer] = useState(false)
    const [auditLoading, setAuditLoading] = useState(false)
    const [settlement, setSettlement] = useState<SettlementDetail | null>(null)

    // Form inputs
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

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const processAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!activeRequest) return
        if (action === 'APPROVE' && !form.ref.trim()) {
            return alert('Enter a valid bank reference code before disbursal.')
        }

        setSaving(true)
        try {
            const res = await fetch('/api/owner/finance/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    requestId: activeRequest.id, 
                    action, 
                    admin_note: form.note,
                    transaction_ref: form.ref 
                })
            })
            if (!res.ok) throw new Error('Operation Failed')
            await fetchRequests()
            showToast(action === 'APPROVE' ? 'Funds Disbursed Successfully' : 'Payout Request Declined', true)
            setShowSettleModal(false)
            setShowRejectModal(false)
            setForm({ ref: '', note: '' })
        } catch (e: any) {
            showToast(e.message, false)
        } finally {
            setSaving(false)
        }
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
            console.error('Failed retrieving settlement audit trail:', e)
        } finally {
            setAuditLoading(false)
        }
    }

    return (
        <div style={{ padding: '48px 64px', background: P.bg, minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            
            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 90000 }}>
                    {toast.ok ? <CheckCircle size={20} color={P.success} /> : <XCircle size={20} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                <div>
                    <button onClick={() => window.location.href = '/owner/finance'} style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, color: P.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }}>
                        <ArrowLeft size={16} /> Return to Financial Overview
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: 12, background: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)', borderRadius: 16 }}>
                             <Landmark size={28} color="#FFF" />
                        </div>
                        <div>
                             <h1 style={{ fontSize: 36, fontWeight: 1000, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Institute Payouts Manager</h1>
                             <p style={{ fontSize: 15, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Approve payout requests from institutes and view past transfers.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DATA VIEW */}
            <div style={{ background: '#FFF', borderRadius: 32, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '28px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFBFC' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFF', padding: '10px 16px', borderRadius: 14, border: `1px solid ${P.border}`, width: 320 }}>
                            <Search size={18} color={P.muted} />
                            <input placeholder="Search Institute ID or Name..." style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.muted, fontSize: 14, fontWeight: 700 }}>
                            <Filter size={18} /> Filters
                        </div>
                     </div>
                     <button onClick={fetchRequests} style={{ padding: '10px', borderRadius: 12, border: `1px solid ${P.border}`, background: '#FFF', cursor: 'pointer' }}>
                        <Loader2 size={18} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                     </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#F8FAFC' }}>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Institute Name</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Requested Amount</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Request Date</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payout Status</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((r) => (
                                <tr key={r.id} style={{ borderBottom: `1px solid ${P.border}`, transition: 'all 0.2s' }}>
                                    <td style={{ padding: '24px 32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 14, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Building2 size={20} color={P.brand} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 1000, color: P.dark }}>{r.tenants?.name}</div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 2 }}>Institute ID: {r.tenant_id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px 32px' }}>
                                        <div style={{ fontSize: 18, fontWeight: 1000, color: P.dark }}>₹{Number(r.amount).toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: P.success, fontWeight: 700, marginTop: 4 }}>Available Balance</div>
                                    </td>
                                    <td style={{ padding: '24px 32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 650, color: P.text }}>
                                            <Calendar size={14} /> {new Date(r.requested_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px 32px' }}>
                                        <span style={{ 
                                            padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 1000, 
                                            background: r.status === 'pending' ? '#FEF3C7' : r.status === 'settled' ? P.successBg : P.errorBg,
                                            color: r.status === 'pending' ? '#92400E' : r.status === 'settled' ? P.success : P.error,
                                            textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>{r.status}</span>
                                    </td>
                                    <td style={{ padding: '24px 32px' }}>
                                        {r.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button onClick={() => { setActiveRequest(r); setShowSettleModal(true) }} style={{ padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #1FAC63 0%, #15803d 100%)', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(31,172,99,0.2)' }}>Approve</button>
                                                <button onClick={() => { setActiveRequest(r); setShowRejectModal(true) }} style={{ padding: '10px 18px', borderRadius: 12, background: '#FFF', border: `1px solid ${P.error}30`, color: P.error, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Decline</button>
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
                    {requests.length === 0 && !loading && (
                        <div style={{ padding: '120px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                            <div style={{ width: 80, height: 80, borderRadius: 28, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Inbox size={40} color={P.muted} />
                            </div>
                             <div style={{ maxWidth: 360 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 1000, color: P.dark, marginBottom: 8, letterSpacing: '-0.02em' }}>Queue Empty</h3>
                                <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6 }}>There are no payout requests currently awaiting authorization in the queue.</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AUTHORIZE SETTLE MODAL */}
            {showSettleModal && activeRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#FFF', borderRadius: 32, width: 440, padding: 32, boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 1000, color: P.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={28} color={P.success} /> Finalize Payout
                        </h2>
                        <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
                            Authorize payout distribution of <b>₹{Number(activeRequest.amount).toLocaleString()}</b> to {activeRequest.tenants?.name}. System will auto-record tax and processing fees.
                        </p>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', marginBottom: 8 }}>Bank Reference Code (UTR)</label>
                            <input value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} placeholder="e.g. UTR10928301982" style={{ width: '100%', padding: '16px', borderRadius: 16, border: `1px solid ${P.border}`, outline: 'none', fontSize: 15, fontWeight: 700, boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 14 }}>
                             <button onClick={() => setShowSettleModal(false)} style={{ flex: 1, padding: '16px', borderRadius: 16, border: `1px solid ${P.border}`, background: '#FFF', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                             <button onClick={() => processAction('APPROVE')} disabled={saving} style={{ flex: 2, padding: '16px', borderRadius: 16, border: 'none', background: P.brand, color: '#FFF', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirm Payout'}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {showRejectModal && activeRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#FFF', borderRadius: 32, width: 440, padding: 32, boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 1000, color: P.error, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <XCircle size={28} color={P.error} /> Decline Payout Request
                        </h2>
                        <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
                            Decline payout request from <b>{activeRequest.tenants?.name}</b>. Funds will remain in institute available balance.
                        </p>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 1000, color: P.muted, textTransform: 'uppercase', marginBottom: 8 }}>Internal Reason / Admin Note</label>
                            <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Provide reasoning for decline..." style={{ width: '100%', padding: '16px', borderRadius: 16, border: `1px solid ${P.border}`, outline: 'none', fontSize: 15, fontWeight: 600, minHeight: 100, resize: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 14 }}>
                             <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, padding: '16px', borderRadius: 16, border: `1px solid ${P.border}`, background: '#FFF', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                             <button onClick={() => processAction('REJECT')} disabled={saving} style={{ flex: 2, padding: '16px', borderRadius: 16, border: 'none', background: P.error, color: '#FFF', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Decline Request'}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REMITTANCE AUDIT DRAWER ── */}
            <SideDrawer isOpen={auditDrawer} onClose={() => setAuditDrawer(false)} title="Payout Receipt Details" width={520}>
                {auditLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
                        <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>Retrieving payout logs...</span>
                    </div>
                ) : settlement ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Paid Institute</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>{activeRequest?.tenants?.name}</div>
                            <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>Institute ID: {activeRequest?.tenant_id}</div>
                        </div>

                        {/* Calculations Breakdown */}
                        <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Payout Calculation Split</div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 650, color: P.dark }}>
                                <span>Requested Amount:</span>
                                <span>₹{Number(settlement.gross_amount).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 650, color: P.error }}>
                                <span>Tax Deducted:</span>
                                <span>-₹{Number(settlement.tds_amount).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, fontWeight: 650, color: P.error }}>
                                <span>Processing fees:</span>
                                <span>-₹{Number(settlement.processing_fees).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${P.border}`, paddingTop: 12, fontSize: 16, fontWeight: 950, color: P.success }}>
                                <span>Net Paid Amount:</span>
                                <span>₹{Number(settlement.net_paid).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Remittance metadata */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>Bank Reference Code (UTR):</span>
                                <code style={{ fontSize: 13, fontWeight: 800, color: P.brand, background: P.brandBg, padding: '4px 8px', borderRadius: 6, fontFamily: 'monospace' }}>{settlement.transaction_ref}</code>
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>Payment Method:</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Bank Transfer (NEFT/RTGS)</span>
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>Payout Timestamp:</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{new Date(settlement.processed_at).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>Authorized By Admin:</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: P.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <ShieldCheck size={14} color={P.success} /> {settlement.processor_name || 'System Auditor'}
                                </span>
                            </div>
                        </div>

                        {activeRequest?.admin_note && (
                            <div style={{ padding: 14, borderRadius: 12, background: P.bg, borderLeft: `4px solid ${P.brand}`, fontSize: 12, color: P.text, fontWeight: 600 }}>
                                <strong>Admin Note:</strong> {activeRequest.admin_note}
                            </div>
                        )}

                        <button onClick={() => setAuditDrawer(false)} style={{ width: '100%', padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, color: P.dark, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>
                            Close Receipt Details
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: P.muted, fontWeight: 700 }}>Payout details unavailable.</div>
                )}
            </SideDrawer>
        </div>
    )
}
