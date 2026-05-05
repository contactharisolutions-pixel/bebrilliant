'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Share2, Users, Receipt, TrendingUp, Handshake, Link,
    CheckCircle2, XCircle, PlusCircle, Loader2, Save, Trash2
} from 'lucide-react'

// ── MAIN PAGE ────────────────────────────────────────────
export default function AffiliatesHub() {
    const [affiliates, setAffiliates] = useState<any[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    const fetchAffiliates = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/affiliates')
            const json = await res.json()
            if (res.ok) setAffiliates(json)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchAffiliates() }, [fetchAffiliates])

    if (loading || !affiliates) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: '#F8FAFC' }}>
                <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>Synchronizing Partner Network...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100%', position: 'relative' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? '#10B981' : '#EF4444') + '40', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle2 size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                        Institutional Partner Network <Share2 size={24} color="var(--color-primary)" />
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0', fontWeight: 600 }}>Provision unique referral links to partners and track inbound registrations generating commissions.</p>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary-gradient)', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, color: '#FFF', cursor: 'pointer', boxShadow: 'var(--shadow-primary)' }}>
                    <PlusCircle size={18} /> INITIALIZE REFERRAL SETTINGS
                </button>
            </div>

            {/* PERFORMANCE KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                <div style={{ background: '#FFF', padding: 24, borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, background: 'var(--color-primary-bg)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Handshake size={20} color="var(--color-primary)" /></div>
                    <div>
                        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Active Partners</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{affiliates.length} Units</div>
                    </div>
                </div>
                <div style={{ background: '#FFF', padding: 24, borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, background: '#ECFDF5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={20} color="#10B981" /></div>
                    <div>
                        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Total Sales (Referral)</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{affiliates.reduce((acc, a) => acc + (a.sales || 0), 0)} Units</div>
                    </div>
                </div>
                <div style={{ background: '#FFF', padding: 24, borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, background: '#FEF2F2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={20} color="#EF4444" /></div>
                    <div>
                        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Accrued Commissions</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#EF4444' }}>₹{affiliates.reduce((acc, a) => acc + (a.earnings || 0), 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* AFFILIATES TABLE */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: '24px 0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '0 32px 20px', borderBottom: '1px solid #F1F5F9', fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Partner Asset Directory</div>
                <div style={{ padding: '0 32px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                                 <th style={{ padding: '20px 0', fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Identity</th>
                                <th style={{ padding: '20px 0', fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '20px 0', fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Enrollment Conversions</th>
                                <th style={{ padding: '20px 0', fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Earnings (INR)</th>
                                <th style={{ padding: '20px 0', fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliates.map((aff) => (
                                <tr key={aff.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                    <td style={{ padding: '20px 0' }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{aff.name || aff.email}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>{aff.email}</div>
                                    </td>
                                    <td style={{ padding: '20px 0' }}>
                                        <span style={{ fontSize: 11, background: aff.status === 'active' ? '#D1FAE5' : '#F1F5F9', color: aff.status === 'active' ? '#065F46' : '#64748B', padding: '4px 10px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase' }}>{aff.status}</span>
                                    </td>
                                     <td style={{ padding: '20px 0', fontSize: 14, fontWeight: 700, color: '#334155' }}>{aff.sales || 0} Units</td>
                                    <td style={{ padding: '20px 0', fontSize: 14, fontWeight: 900, color: '#1B1D21' }}>₹{aff.earnings?.toLocaleString() || 0}</td>
                                    <td style={{ padding: '20px 0' }}>
                                         <div style={{ display: 'flex', gap: 10 }}>
                                            <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Copy Tracked Link"><Link size={14} /></button>
                                            <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: 'transparent', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Deauthorize Link"><XCircle size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
