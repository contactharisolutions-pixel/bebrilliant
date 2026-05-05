'use client'

import React, { useState, useEffect } from 'react'
import {
    GraduationCap, Share2, TrendingUp, Wallet, ShieldCheck,
    CheckCircle2, PlusCircle, Search, Filter, Loader2,
    BarChart3, UserCheck, Zap, HelpCircle, MessageCircle
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

export default function AffiliateStudentsManagement() {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAffiliates()
    }, [])

    const fetchAffiliates = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/affiliates/students')
            const data = await res.json()
            if (data.affiliates) setStudents(data.affiliates)
        } catch (e) {
            console.error('Fetch failed', e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
             <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 13, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.1em' }}>SYNCHRONIZING STUDENT REFERRAL DATA...</div>
            </div>
        )
    }

    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: 'linear-gradient(135deg, #F0A026 0%, #B4781C 100%)', borderRadius: 14, boxShadow: '0 8px 16px rgba(240,160,38,0.2)' }}>
                            <GraduationCap size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Student Referral Hub</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        Track how students are growing the academy network. Student rewards are credited as internal exam tokens and are completely non-withdrawable.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: `1px solid ${COLORS.border}`, color: '#475569', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrendingUp size={18} /> View Analytics
                    </button>
                    <button style={{ padding: '14px 24px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 14, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Zap size={18} /> Global Distribution
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                {[
                    { label: 'Active Student Referrers', val: students.length.toString(), color: COLORS.primary, icon: UserCheck },
                    { label: 'Referral Conversions', val: '26', color: COLORS.success, icon: CheckCircle2 },
                    { label: 'Credits Distributed', val: '1,300', color: COLORS.warning, icon: Wallet },
                    { label: 'Platform Engagement', val: 'High', color: '#8B5CF6', icon: BarChart3 }
                ].map((s, i) => (
                    <div key={i} style={{ background: '#FFF', padding: 24, borderRadius: 24, border: `1px solid ${COLORS.border}` }}>
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

            {/* TABLE AREA */}
            <div style={{ background: '#FFF', borderRadius: 28, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '12px 20px', borderRadius: 16, border: `1px solid ${COLORS.border}`, width: 350 }}>
                        <Search size={18} color={COLORS.slate} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Find student by name or roll..." style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: 14, fontWeight: 700, color: '#0F172A' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF7ED', padding: '10px 18px', borderRadius: 14, border: '1px solid #FFEDD5' }}>
                        <ShieldCheck size={16} color={COLORS.warning} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#9A3412' }}>Auto-Distribution: Active</span>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: `1px solid ${COLORS.border}` }}>
                        <tr style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <th style={{ padding: '20px 32px' }}>Student Profile</th>
                            <th style={{ padding: '20px 32px' }}>Enrollments Referred</th>
                            <th style={{ padding: '20px 32px' }}>Credits (Total/Used)</th>
                            <th style={{ padding: '20px 32px' }}>Wallet Balance</th>
                            <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.filter(s => (s.student?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                            <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{s.student?.first_name} {s.student?.last_name}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>ID: {s.id}</div>
                                </td>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>{s.referrals || 0}</div>
                                        <div style={{ padding: '4px 10px', background: '#F0F9FF', color: '#0369A1', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>RECOGNIZED</div>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Earned: {s.credits_earned || 0}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginTop: 4 }}>Used/Expired: {s.credits_used || 0}</div>
                                </td>
                                <td style={{ padding: '24px 32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.success }} />
                                        <div style={{ fontSize: 14, fontWeight: 1000, color: COLORS.success }}>{(s.credits_earned || 0) - (s.credits_used || 0)} Tokens</div>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                                         <WhatsAppShareButton 
                                            compact
                                            affiliateType="student"
                                            mode="student_exam_share"
                                            label="Share Promo"
                                         />
                                         <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B' }}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
                 <div style={{ flex: 1, background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 20, padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                        <GraduationCap size={22} color={COLORS.primary} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#1E40AF', marginBottom: 4 }}>Student Incentive Policy</div>
                        <div style={{ fontSize: 12, color: '#60A5FA', fontWeight: 700, lineHeight: 1.5 }}>Students receive exam tokens immediately upon successful purchase by referred users. Tokens can be used for taking mock exams and upgrading study modules.</div>
                    </div>
                 </div>
                 <div style={{ flex: 1, background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 20, padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                        <ShieldCheck size={22} color={COLORS.success} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#166534', marginBottom: 4 }}>Zero-Risk Wallet Architecture</div>
                        <div style={{ fontSize: 12, color: '#4ADE80', fontWeight: 700, lineHeight: 1.5 }}>All student affiliate earnings are locked to the internal ecosystem. Money never leaves the platform via students, ensuring owner profitability remains protected.</div>
                    </div>
                 </div>
            </div>
        </div>
    )
}
