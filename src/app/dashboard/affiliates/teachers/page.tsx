'use client'
import React, { useState, useEffect } from 'react'
import {
    Users, PlusCircle, Search, Filter, ShieldCheck,
    CheckCircle2, XCircle, FileText, Banknote, HelpCircle,
    Eye, BuildingIcon, UploadCloud, Loader2, MessageCircle
} from 'lucide-react'
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton'
// Institutional Palette
const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
}
export default function AffiliateTeachersManagement() {
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    // Modal states
    const [showOnboard, setShowOnboard] = useState(false)
    const [saving, setSaving] = useState(false)
    // New Affiliate Form
    const [form, setForm] = useState({
        name: '', mobile: '', email: '',
        pan_number: '', aadhar_number: '',
        bank_account: '', ifsc_code: ''
    })
    useEffect(() => {
        fetchTeachers()
    }, [])
    const fetchTeachers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/affiliates/teachers')
            const data = await res.json()
            if (data.teachers) setTeachers(data.teachers)
        } catch (e) {
            console.error('Fetch failed', e)
        } finally {
            setLoading(false)
        }
    }
    const handleOnboard = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/affiliates/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    mobile: form.mobile,
                    email: form.email,
                    pan_details: { number: form.pan_number },
                    aadhar_details: { number: form.aadhar_number },
                    bank_details: { account: form.bank_account, ifsc: form.ifsc_code }
                })
            })
            if (res.ok) {
                setShowOnboard(false)
                setForm({ name: '', mobile: '', email: '', pan_number: '', aadhar_number: '', bank_account: '', ifsc_code: '' })
                fetchTeachers()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to onboard partner')
            }
        } catch (e) {
            alert('Something went wrong')
        } finally {
            setSaving(false)
        }
    }
    if (loading) {
        return (
             <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING AFFILIATE NETWORK...</div>
            </div>
        )
    }
    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes float { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .hover-btn:hover { transform: scale(1.02); }
                .table-row:hover { background: #F8FAFC !important; }
            `}</style>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Users size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>External Partner Network</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        Onboard and manage affiliate teachers. Review their KYC documents, monitor their referred enrollments, and coordinate reward payouts.
                    </p>
                </div>
                <button onClick={() => setShowOnboard(true)} className="hover-btn" style={{ padding: '14px 28px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 14, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', display: 'flex', alignItems: 'center', gap: 10, transition: '0.2s' }}>
                    <PlusCircle size={20} /> Onboard Affiliate
                </button>
            </div>
            {/* OVERVIEW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                {[
                    { label: 'Network Size', val: teachers.length.toString(), color: COLORS.primary, icon: Users },
                    { label: 'Pending KYC', val: teachers.filter(t => t.kyc_status === 'pending').length.toString(), color: COLORS.warning, icon: FileText },
                    { label: 'Total Placements', val: '12', color: COLORS.success, icon: CheckCircle2 },
                    { label: 'Est. Commission Gen', val: '₹45,000', color: '#8B5CF6', icon: Banknote }
                ].map((s, i) => (
                    <div key={i} style={{ background: '#FFF', padding: 24, borderRadius: 24, border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ padding: 10, background: `${s.color}15`, borderRadius: 12, color: s.color }}>
                                <s.icon size={18} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{s.val}</div>
                    </div>
                ))}
            </div>
            {/* SEARCH AND TABLE */}
            <div style={{ background: '#FFF', borderRadius: 28, border: `1px solid ${COLORS.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '12px 20px', borderRadius: 16, border: `1px solid ${COLORS.border}`, width: 350 }}>
                        <Search size={18} color={COLORS.slate} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search partners via name or email..." style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: 14, fontWeight: 700, color: '#0F172A' }} />
                    </div>
                    <button style={{ padding: '12px 20px', background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Filter size={16} /> Filter List</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: `1px solid ${COLORS.border}` }}>
                        <tr style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <th style={{ padding: '20px 32px' }}>Affiliate Details</th>
                            <th style={{ padding: '20px 32px' }}>Contacts</th>
                            <th style={{ padding: '20px 32px' }}>KYC Status</th>
                            <th style={{ padding: '20px 32px' }}>Performance</th>
                            <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                            <tr key={t.id} className="table-row" style={{ borderBottom: `1px solid ${COLORS.border}`, transition: '0.2s' }}>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{t.name}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>ID: {t.id}</div>
                                </td>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{t.mobile}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginTop: 4 }}>{t.email}</div>
                                </td>
                                <td style={{ padding: '24px 32px' }}>
                                    {t.kyc_status === 'approved' ? (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${COLORS.success}15`, color: COLORS.success, borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                            <ShieldCheck size={14} /> VERIFIED
                                        </div>
                                    ) : (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${COLORS.warning}15`, color: COLORS.warning, borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                            <HelpCircle size={14} /> PENDING
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{t.joins} Enrollments</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.success, marginTop: 4 }}>Generated: {t.revenue}</div>
                                </td>
                                <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                                         <WhatsAppShareButton 
                                            compact
                                            affiliateType="teacher"
                                            mode="teacher_invite"
                                            label="Send Link"
                                         />
                                         <button style={{ padding: '8px 16px', background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 10, color: '#475569', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Manage</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* ONBOARD MODAL */}
            {showOnboard && (
                 <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                     <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth: 700, boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'float 0.3s ease-out' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Onboard New Affiliate</h3>
                            <button onClick={() => setShowOnboard(false)} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} color="#64748B" /></button>
                        </div>
                        <div style={{ padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Personal Details */}
                            <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Professional Details</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                                    <input placeholder="Mobile Number" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                                    <input placeholder="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ gridColumn: '1 / -1', padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                                </div>
                            </div>
                            {/* KYC Details */}
                            <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} /> Compliance & KYC</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <input placeholder="PAN Number" value={form.pan_number} onChange={e => setForm({...form, pan_number: e.target.value})} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }} />
                                    <input placeholder="Aadhar Number" value={form.aadhar_number} onChange={e => setForm({...form, aadhar_number: e.target.value})} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                                </div>
                                <div style={{ padding: '24px', border: `2px dashed ${COLORS.border}`, borderRadius: 12, textAlign: 'center', background: '#FFF' }}>
                                    <UploadCloud size={32} color={COLORS.slate} style={{ marginBottom: 12 }} />
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Drop KYC Documents Here</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 4 }}>Scan of PAN and Aadhar (PDF/JPG)</div>
                                </div>
                            </div>
                            {/* Banking Details */}
                            <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}><Banknote size={18} /> Bank Payout Routing</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <input placeholder="Bank Account Number" value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                                    <input placeholder="IFSC Code" value={form.ifsc_code} onChange={e => setForm({...form, ifsc_code: e.target.value})} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
                            <button onClick={() => setShowOnboard(false)} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: `1px solid ${COLORS.border}`, color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleOnboard} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: COLORS.primaryGradient, border: 'none', color: '#fff', fontSize: 14, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                                {saving ? <><Loader2 size={16} className="spin" /> Processing...</> : 'Send KYC for Approval'}
                            </button>
                        </div>
                     </div>
                 </div>
            )}
        </div>
    )
}
