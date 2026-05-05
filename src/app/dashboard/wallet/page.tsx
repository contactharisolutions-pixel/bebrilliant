'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    WalletCards, ArrowRightLeft, Landmark, Receipt, CheckCircle, XCircle, Loader2, ArrowUpRight, ArrowDownRight, Building2
} from 'lucide-react'

// ── TYPES ──────────────────────────────────────────────────
type WalletStats = { total_earnings: number, withdrawn_amount: number, pending_settlement: number, available_balance: number, monthly_earnings: number }

// ── MODALS & COMPONENTS ────────────────────────────────────
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Submit', maxWidth = 500 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 20, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}><Landmark size={20} color="#004B93" /> {title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={16} color="#64748B" /></button>
                </div>
                <div style={{ padding: '28px', overflowY: 'auto' }}>{children}</div>
                <div style={{ padding: '20px 28px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
                     <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, background: 'transparent', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Input({ label, value, onChange, placeholder = '', type = 'text', prefix = '' }: any) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.2s' }}>
                {prefix && <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: 14 }}>{prefix}</div>}
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: '12px 14px', border: 'none', fontSize: 14, color: '#0F172A', outline: 'none', fontWeight: 600 }} />
            </div>
        </div>
    )
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function WalletPayouts() {
    const [wallet, setWallet] = useState<WalletStats>({ total_earnings: 0, withdrawn_amount: 0, pending_settlement: 0, available_balance: 0, monthly_earnings: 0 })
    const [ledger, setLedger] = useState<any[]>([])
    const [payouts, setPayouts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Modals
    const [showPayoutModal, setShowPayoutModal] = useState(false)

    // Form State
    const [form, setForm] = useState({ amount: '', bank_details: '' })

     const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    const fetchWallet = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/wallet')
            const json = await res.json()
            if (res.ok) {
                setWallet(json.wallet)
                setLedger(json.payments || [])
                setPayouts(json.withdrawals || [])
            }
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchWallet() }, [fetchWallet])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/wallet', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
             if (!res.ok) throw new Error(json.error || 'Payout Error')
            await fetchWallet()
            showToast('Payout Requested Successfully', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Transmission Exception', false)
            return { success: false }
        } finally { setSaving(false) }
    }

    const handleWithdrawal = async () => {
         const withdrawalAmount = Number(form.amount)
        if (withdrawalAmount <= 0) return showToast('Invalid amount.', false)
        if (withdrawalAmount > wallet.available_balance) return showToast('Insufficient balance.', false)

        const { success } = await apiAction('REQUEST_PAYOUT', { amount: withdrawalAmount })
        if (success) {
            setShowPayoutModal(false)
            setForm({ amount: '', bank_details: '' })
        }
    }

    return (
        <div style={{ padding: '48px 56px', background: '#F8FAFC', minHeight: '100%', position: 'relative' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? '#10B981' : '#EF4444') + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 90000 }}>
                    {toast.ok ? <CheckCircle size={20} color="#10B981" /> : <XCircle size={20} color="#EF4444" />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                 <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)', borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <WalletCards size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Institutional Earnings Hub</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650 }}>
                        Monitor your wallet earnings from exams and wallet purchases. Manage liquidity distribution with auto-TDS and settlement tracking.
                    </p>
                </div>
                <div>
                     <button onClick={() => setShowPayoutModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)', border: 'none', borderRadius: 16, padding: '14px 28px', fontSize: 14, fontWeight: 1000, color: '#FFF', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)' }}>
                        <Landmark size={20} color="#FFF" /> Request Withdrawal
                    </button>
                </div>
            </div>

            {/* MASTER KPI LAYER */}
            {loading ? (
                <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={48} color="#004B93" style={{ animation: 'spin 1s linear infinite', marginBottom: 24 }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                    {[
                        { label: 'Total Net Earnings', val: wallet.total_earnings, icon: ArrowUpRight, color: '#10B981' },
                        { label: 'Settled to Bank', val: wallet.withdrawn_amount, icon: Landmark, color: '#3B82F6' },
                        { label: 'Pending Settlement', val: wallet.pending_settlement, icon: Receipt, color: '#F59E0B' },
                        { label: 'Available Liquidity', val: wallet.available_balance, icon: WalletCards, color: '#004B93', primary: true }
                    ].map((kpi, i) => (
                        <div key={i} style={{ 
                            background: kpi.primary ? 'linear-gradient(135deg, #004B93 0%, #002D58 100%)' : '#FFF', 
                            padding: 28, 
                            borderRadius: 28, 
                            border: kpi.primary ? 'none' : '1px solid #F1F5F9', 
                            boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                            color: kpi.primary ? '#FFF' : '#0F172A'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ padding: 8, background: kpi.primary ? 'rgba(255,255,255,0.1)' : `${kpi.color}10`, borderRadius: 10 }}>
                                    <kpi.icon size={18} color={kpi.primary ? '#FFF' : kpi.color} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 1000, color: kpi.primary ? 'rgba(255,255,255,0.7)' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{kpi.label}</span>
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 1000, letterSpacing: '-0.02em' }}>₹{kpi.val?.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            ) }

            {/* LEDGER & TRANSACTIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                {/* INCOMING PAYMENTS */}
                <div style={{ background: '#FFF', border: '1px solid #F1F5F9', borderRadius: 28, padding: '28px 0', overflow: 'hidden' }}>
                    <div style={{ padding: '0 28px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Receipt size={22} color="#004B93" />
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>Activity Logs</h3>
                    </div>
                    <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 28px' }}>
                         {ledger.length === 0 ? (
                            <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '60px 0' }}>No inbound activity detected.</div>
                        ) : (
                            ledger.map((l: any, idx: number) => (
                                <div key={idx} style={{ padding: '20px 0', borderBottom: '1px dashed #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 1000, color: '#0F172A', marginBottom: 4 }}>TXN: #{l.id.substring(0, 8).toUpperCase()}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>{new Date(l.created_at).toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 1000, color: '#10B981' }}>+₹{Number(l.amount).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PAYOUT REQUESTS */}
                <div style={{ background: '#FFF', border: '1px solid #F1F5F9', borderRadius: 28, padding: '28px 0', overflow: 'hidden' }}>
                    <div style={{ padding: '0 28px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Landmark size={22} color="#10B981" />
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>Disbursement Status</h3>
                    </div>
                    <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 28px' }}>
                         {payouts.length === 0 ? (
                            <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '60px 0' }}>No withdrawal requests found.</div>
                        ) : (
                            payouts.map((p: any, idx: number) => (
                                <div key={idx} style={{ padding: '20px 0', borderBottom: '1px dashed #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <div>
                                        <div style={{ fontSize: 15, fontWeight: 1000, color: '#0F172A', marginBottom: 4 }}>Fund Distribution</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>{new Date(p.requested_at || p.created_at).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <div style={{ fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>-₹{Number(p.amount).toLocaleString()}</div>
                                        <span style={{ fontSize: 10, background: p.status === 'settled' ? '#D1FAE5' : '#FEF3C7', color: p.status === 'settled' ? '#065F46' : '#92400E', padding: '4px 10px', borderRadius: 8, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* PAYOUT MODAL */}
            {showPayoutModal && (
                <Modal title="Initialize Asset Distribution" onClose={() => setShowPayoutModal(false)} onSubmit={handleWithdrawal} saving={saving} saveText="Confirm Withdrawal" maxWidth={500}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                        <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: 24, borderRadius: 20, marginBottom: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.1em' }}>Redeemable Balance</div>
                            <div style={{ fontSize: 40, fontWeight: 1000, color: '#004B93' }}>₹{wallet.available_balance.toLocaleString()}</div>
                        </div>

                        <Input label="Withdrawal Amount (INR)" type="number" value={form.amount} onChange={(v: string) => setForm({ ...form, amount: v })} prefix="₹" placeholder="0.00" />
                        
                         <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '20px', borderRadius: 20, fontSize: 13, color: '#004B93', fontWeight: 600, lineHeight: 1.6, marginTop: 4 }}>
                            <div style={{ fontWeight: 1000, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> Settlement Policy</div>
                            • Redemptions are processed every Friday.<br/>
                            • Minimum withdrawal threshold: ₹1,000.<br/>
                            • 10% TDS applicable on net earnings as per statutory norms.
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    )
}
