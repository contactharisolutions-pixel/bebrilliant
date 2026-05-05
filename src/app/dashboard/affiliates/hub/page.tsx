'use client'

import { useState, useEffect } from 'react'
import {
    Share2, TrendingUp, Users, CreditCard, Award,
    Loader2, MessageCircle, Link2, BarChart2,
    CheckCircle2, Clock, Zap, RefreshCw
} from 'lucide-react'
import { WhatsAppShareButton } from '@/components/shared/WhatsAppShareButton'

type ReferralRow = {
    ref_code:            string
    type:                string
    exam_id:             string | null
    reward_amount:       number
    reward_type:         string
    is_active:           boolean
    created_at:          string
    total_shares:        number
    total_clicks:        number
    total_registrations: number
    total_payments:      number
    total_rewards:       number
    last_shared_at:      string | null
}

type Totals = {
    shares: number; clicks: number; registrations: number; payments: number; rewards: number
}

export default function AffiliateDashboard() {
    const [referrals, setReferrals] = useState<ReferralRow[]>([])
    const [totals,    setTotals]    = useState<Totals>({ shares: 0, clicks: 0, registrations: 0, payments: 0, rewards: 0 })
    const [loading,   setLoading]   = useState(true)
    const [exams,     setExams]     = useState<any[]>([])

    useEffect(() => {
        Promise.all([
            fetch('/api/affiliate/analytics').then(r => r.json()),
            fetch('/api/dashboard/exams').then(r => r.json()),
        ]).then(([aData, eData]) => {
            if (aData.referrals) setReferrals(aData.referrals)
            if (aData.totals)    setTotals(aData.totals)
            if (Array.isArray(eData)) setExams(eData.slice(0, 5))
            else if (eData.exams) setExams(eData.exams.slice(0, 5))
        }).finally(() => setLoading(false))
    }, [])

    const conversionRate = totals.clicks > 0
        ? ((totals.payments / totals.clicks) * 100).toFixed(1)
        : '0.0'

    if (loading) return (
        <div style={{ padding: 100, textAlign: 'center' }}>
            <Loader2 size={36} color="#25D366" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    return (
        <div style={{ padding: '40px 60px', background: '#F8FAFC', minHeight: '100vh' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* HEADER */}
            <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(37,211,102,0.3)' }}>
                        <Share2 size={26} color="#FFF" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Affiliate Dashboard</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748B', fontWeight: 600 }}>Share exams, earn rewards. Track every referral in real time.</p>
                    </div>
                </div>
            </div>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginBottom: 48 }}>
                {[
                    { label: 'Total Shares',        value: totals.shares,        icon: Share2,     color: '#25D366', bg: '#F0FDF4' },
                    { label: 'Link Clicks',          value: totals.clicks,        icon: Link2,      color: '#0EA5E9', bg: '#F0F9FF' },
                    { label: 'Registrations',        value: totals.registrations, icon: Users,      color: '#8B5CF6', bg: '#F5F3FF' },
                    { label: 'Paid Conversions',     value: totals.payments,      icon: CreditCard, color: '#F59E0B', bg: '#FFFBEB' },
                    { label: 'Rewards Earned (₡)',   value: totals.rewards,       icon: Award,      color: '#EF4444', bg: '#FEF2F2' },
                ].map((kpi, i) => (
                    <div key={i} style={{ background: '#FFF', borderRadius: 24, padding: 28, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 13, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <kpi.icon size={22} color={kpi.color} />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>{kpi.value}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.55fr', gap: 32 }}>

                {/* LEFT: EXAM SHARE TABLE */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>Share Exams via WhatsApp</h2>
                        <WhatsAppShareButton
                            affiliateType="teacher"
                            mode="teacher_invite"
                            label="Invite Affiliate Teacher"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {exams.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0' }}>
                                <Zap size={36} color="#E2E8F0" style={{ margin: '0 auto 16px', display: 'block' }} />
                                <p style={{ color: '#94A3B8', fontWeight: 700 }}>No exams available to share yet.</p>
                            </div>
                        ) : exams.map((exam: any) => (
                            <div key={exam.id} style={{
                                background: '#FFF', borderRadius: 20, padding: '20px 24px',
                                border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                                        {exam.title || exam.name}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                                            ₹{exam.fee || exam.price || 0}
                                        </span>
                                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                                            {exam.duration_minutes || exam.duration || '—'} mins
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <WhatsAppShareButton
                                        examId={exam.id}
                                        examName={exam.title || exam.name}
                                        examFee={exam.fee || exam.price || 0}
                                        affiliateType="teacher"
                                        mode="teacher_exam_share"
                                        compact={false}
                                        label="Share"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: MY REFERRAL LINKS + ANALYTICS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* CONVERSION CARD */}
                    <div style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', borderRadius: 24, padding: 28, color: '#FFF', boxShadow: '0 12px 40px rgba(37,211,102,0.25)' }}>
                        <BarChart2 size={28} style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversion Rate</div>
                        <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.04em', margin: '8px 0' }}>{conversionRate}%</div>
                        <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 600 }}>
                            {totals.payments} paid from {totals.clicks} clicks
                        </div>
                    </div>

                    {/* ACTIVE REFERRAL LINKS */}
                    <div style={{ background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Active Referral Links</h3>
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {referrals.length === 0 ? (
                                <p style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '20px 0' }}>
                                    No referral links yet. Share an exam above to get started.
                                </p>
                            ) : referrals.slice(0, 8).map(r => (
                                <div key={r.ref_code} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #F1F5F9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ padding: '3px 10px', borderRadius: 8, background: r.type === 'teacher' ? '#EFF6FF' : '#F0FDF4', color: r.type === 'teacher' ? '#2563EB' : '#059669', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                                            {r.ref_code}
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Clock size={11} />
                                            {r.last_shared_at ? new Date(r.last_shared_at).toLocaleDateString('en-IN') : 'Never shared'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {[
                                            { label: 'Shares',  val: r.total_shares },
                                            { label: 'Clicks',  val: r.total_clicks },
                                            { label: 'Reg.',    val: r.total_registrations },
                                            { label: 'Paid',    val: r.total_payments },
                                        ].map((s, i) => (
                                            <div key={i} style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{s.val}</div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {r.total_rewards > 0 && (
                                        <div style={{ marginTop: 10, padding: '6px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <CheckCircle2 size={13} /> ₡{r.total_rewards} rewards earned
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
