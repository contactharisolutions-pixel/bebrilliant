'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Settings2, Users, GraduationCap, Percent, Banknote, Save,
    CheckCircle, AlertCircle, RefreshCw, Loader2, Building,
    ShieldCheck, Eye, X, Clock,
    Search
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

type TeacherAffiliate = {
    id: string
    name: string
    mobile: string
    email: string
    kyc_status: 'pending' | 'approved' | 'rejected'
    status: 'active' | 'suspended'
    pan_details?: { pan: string; name: string; status: string }
    aadhar_details?: { uid: string; name: string }
    bank_details?: { bank_name: string; account_number: string; ifsc: string }
    tenants?: { name: string }
    wallet_balance: number
    wallet_withdrawable: number
    created_at: string
}

type WithdrawalRequest = {
    id: string
    teacher_id: string
    amount_requested: number
    tds_deducted: number
    amount_payable: number
    status: 'pending' | 'paid' | 'rejected'
    bank_reference?: string
    requested_at: string
    processed_at?: string
    affiliate_teachers?: TeacherAffiliate
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000)
        return () => clearTimeout(t)
    }, [onClose])
    const isOk = type === 'success'
    return (
        <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
            background: isOk ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isOk ? P.success : P.error}40`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: isOk ? '#065F46' : '#991B1B', fontSize: 13, fontWeight: 800,
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
            {isOk ? <CheckCircle size={20} color={P.success} /> : <AlertCircle size={20} color={P.error} />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}><X size={14} /></button>
        </div>
    )
}

export default function PartnerRewardsPage() {
    const [tab, setTab] = useState<'economics' | 'kyc' | 'withdrawals'>('economics')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const [tenants, setTenants] = useState<any[]>([])
    const [selectedTenant, setSelectedTenant] = useState<string>('global')
    const [teachersList, setTeachersList] = useState<TeacherAffiliate[]>([])
    const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([])

    const [config, setConfig] = useState({
        enable_affiliate_teacher: true,
        teacher_reward_type: 'percentage',
        teacher_reward_value: 20,
        teacher_level2_enabled: false,
        teacher_level2_reward_value: 5,
        teacher_min_withdrawal: 500,
        teacher_tds_percentage: 5.0,
        enable_affiliate_student: true,
        student_reward_credits: 50,
        student_max_reward_limit: 1000,
        student_credit_expiry_days: 365,
        student_usage_restriction: 'none'
    })

    const [kycDrawer, setKycDrawer] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherAffiliate | null>(null)

    const [payoutDrawer, setPayoutDrawer] = useState(false)
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
    const [bankReference, setBankReference] = useState('')

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    const fetchTenants = useCallback(async () => {
        try {
            const res = await fetch('/api/owner/tenants')
            const data = await res.json()
            if (data.tenants) {
                const insts = data.tenants.filter((t: any) => t.type === 'institute')
                setTenants(insts)
            }
        } catch (e) {
            console.error('Failed fetching tenants list:', e)
        }
    }, [])

    const fetchConfig = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/owner/settings/affiliate?tenant_id=${selectedTenant}`)
            const d = await res.json()
            if (d.settings) {
                setConfig({ ...config, ...d.settings })
            } else {
                setConfig({
                    enable_affiliate_teacher: true, teacher_reward_type: 'percentage', teacher_reward_value: 20,
                    teacher_level2_enabled: false, teacher_level2_reward_value: 5, teacher_min_withdrawal: 500, teacher_tds_percentage: 5.0,
                    enable_affiliate_student: true, student_reward_credits: 50, student_max_reward_limit: 1000, student_credit_expiry_days: 365, student_usage_restriction: 'none'
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [selectedTenant])

    const fetchOperations = useCallback(async () => {
        setLoading(true)
        try {
            const [tRes, wRes] = await Promise.all([
                fetch('/api/owner/settings/affiliate?action=GET_TEACHERS'),
                fetch('/api/owner/settings/affiliate?action=GET_WITHDRAWALS')
            ])
            if (tRes.ok) setTeachersList((await tRes.json()).teachers || [])
            if (wRes.ok) setWithdrawalsList((await wRes.json()).withdrawals || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTenants()
    }, [fetchTenants])

    useEffect(() => {
        if (tab === 'economics') {
            fetchConfig()
        } else {
            fetchOperations()
        }
    }, [tab, selectedTenant, fetchConfig, fetchOperations])

    const handleSaveConfig = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/owner/settings/affiliate?tenant_id=${selectedTenant}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            if (res.ok) showToast('Reward settings saved successfully.', 'success')
            else throw new Error('Failed to save settings')
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateKycStatus = async (teacherId: string, kyc_status: string, status: string) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/settings/affiliate?action=UPDATE_KYC_STATUS', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: teacherId, kyc_status, status })
            })
            if (res.ok) {
                showToast('Partner KYC status updated successfully.', 'success')
                setKycDrawer(false)
                fetchOperations()
            } else throw new Error('KYC update failed')
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleProcessWithdrawal = async (withdrawalId: string, status: 'paid' | 'rejected') => {
        if (status === 'paid' && !bankReference.trim()) {
            return alert('Please enter Bank UTR / Transaction reference code for payout records.')
        }
        setSaving(true)
        try {
            const res = await fetch('/api/owner/settings/affiliate?action=PROCESS_WITHDRAWAL', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: withdrawalId, status, bank_reference: bankReference })
            })
            if (res.ok) {
                showToast(`Payout marked as ${status === 'paid' ? 'Paid' : 'Rejected'}.`, 'success')
                setPayoutDrawer(false)
                setBankReference('')
                fetchOperations()
            } else throw new Error('Payout processing failed')
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const Toggle = ({ label, desc, val, onChange }: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: '#FFF', borderRadius: 16, border: `1px solid ${P.border}`, marginBottom: 12 }}>
            <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{label}</div>
                {desc && <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 4 }}>{desc}</div>}
            </div>
            <button onClick={() => onChange(!val)} style={{ width: 44, height: 24, borderRadius: 12, background: val ? '#059669' : P.border, border: 'none', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFF', position: 'absolute', top: 3, left: val ? 23 : 3, transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
        </div>
    )

    const Input = ({ label, type = 'number', val, onChange, suffix }: any) => (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input type={type} value={val} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', background: '#F8FAFC', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                {suffix && <div style={{ position: 'absolute', right: 16, top: 12, fontSize: 13, fontWeight: 900, color: P.muted }}>{suffix}</div>}
            </div>
        </div>
    )

    const cardStyle: React.CSSProperties = {
        background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    }

    const activePartnersCount = teachersList.filter(t => t.status === 'active').length
    const pendingKycCount = teachersList.filter(t => t.kyc_status === 'pending').length
    const pendingPayoutsCount = withdrawalsList.filter(w => w.status === 'pending').length
    const totalPaidAmount = withdrawalsList.filter(w => w.status === 'paid').reduce((sum, w) => sum + (w.amount_payable || 0), 0)

    const filteredTeachers = teachersList.filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()) || t.mobile.includes(searchQuery))
    const filteredWithdrawals = withdrawalsList.filter(w => !searchQuery || w.affiliate_teachers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || w.affiliate_teachers?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || w.bank_reference?.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C', boxShadow: '0 0 8px #EA580C' }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Communication & Marketing</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Affiliate Rewards</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>Configure referral commission rates, verify partner KYC applications, and process payout requests.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => tab === 'economics' ? fetchConfig() : fetchOperations()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Sync Data
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={Users} title="Active Partners" value={String(activePartnersCount)} color="#004B93" />
                <KpiCard icon={ShieldCheck} title="Pending KYC" value={String(pendingKycCount)} color="#D97706" />
                <KpiCard icon={Clock} title="Pending Payouts" value={String(pendingPayoutsCount)} color="#EA580C" />
                <KpiCard icon={Banknote} title="Total Paid Out" value={`Rs. ${totalPaidAmount.toLocaleString('en-IN')}`} color="#059669" />
            </div>

            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18, padding: 6, marginBottom: 28, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <button onClick={() => setTab('economics')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === 'economics' ? '#EA580C' : 'transparent', color: tab === 'economics' ? '#fff' : P.muted, fontSize: 13, fontWeight: 800 }}>
                    <Percent size={15} /> Reward Settings
                </button>
                <button onClick={() => setTab('kyc')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === 'kyc' ? '#EA580C' : 'transparent', color: tab === 'kyc' ? '#fff' : P.muted, fontSize: 13, fontWeight: 800 }}>
                    <Users size={15} /> Partner KYC Verifications ({teachersList.filter(t => t.kyc_status === 'pending').length})
                </button>
                <button onClick={() => setTab('withdrawals')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === 'withdrawals' ? '#EA580C' : 'transparent', color: tab === 'withdrawals' ? '#fff' : P.muted, fontSize: 13, fontWeight: 800 }}>
                    <Banknote size={15} /> Payout Requests ({withdrawalsList.filter(w => w.status === 'pending').length})
                </button>
            </div>

            {tab === 'economics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
                    <div>
                        <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Building size={14} color={P.brand} /> Scope / Institute
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button onClick={() => setSelectedTenant('global')} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: selectedTenant === 'global' ? '#EA580C' : 'transparent', color: selectedTenant === 'global' ? '#fff' : P.dark, fontSize: 13, fontWeight: 800, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    Global Platform Default
                                </button>
                                {tenants.map(t => (
                                    <button key={t.id} onClick={() => setSelectedTenant(t.id)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: selectedTenant === t.id ? P.brand : 'transparent', color: selectedTenant === t.id ? '#fff' : P.dark, fontSize: 13, fontWeight: 800, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={18} color="#2563EB" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark }}>Teacher Referral Program</h3>
                            </div>
                            <Toggle label="Enable Teacher Referral Program" desc="Allow teachers and staff partners to sign up, complete KYC, and earn commissions on student enrollments." val={config.enable_affiliate_teacher} onChange={(v: boolean) => setConfig({ ...config, enable_affiliate_teacher: v })} />
                            {config.enable_affiliate_teacher && (
                                <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: '24px 28px', marginTop: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commission Calculation Method</label>
                                            <select value={config.teacher_reward_type} onChange={e => setConfig({ ...config, teacher_reward_type: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, color: P.dark, background: '#fff', outline: 'none' }}>
                                                <option value="percentage">Percentage based (%)</option>
                                                <option value="flat">Fixed Amount (Rs.)</option>
                                            </select>
                                        </div>
                                        <Input label={`Commission Rate (${config.teacher_reward_type === 'percentage' ? '%' : 'Rs.'})`} val={config.teacher_reward_value} onChange={(v: string) => setConfig({ ...config, teacher_reward_value: Number(v) })} suffix={config.teacher_reward_type === 'percentage' ? '%' : 'Rs.'} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                        <Input label="Minimum Withdrawal Threshold (Rs.)" val={config.teacher_min_withdrawal} onChange={(v: string) => setConfig({ ...config, teacher_min_withdrawal: Number(v) })} suffix="Rs." />
                                        <Input label="TDS Tax Deduction (%)" val={config.teacher_tds_percentage} onChange={(v: string) => setConfig({ ...config, teacher_tds_percentage: Number(v) })} suffix="%" />
                                    </div>
                                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
                                        <Toggle label="Second-Level Partner Commission" desc="Give overriding commission rewards when teachers invite other secondary partner teachers." val={config.teacher_level2_enabled} onChange={(v: boolean) => setConfig({ ...config, teacher_level2_enabled: v })} />
                                        {config.teacher_level2_enabled && (
                                            <div style={{ marginTop: 12 }}>
                                                <Input label="Second-Level Commission Rate (%)" val={config.teacher_level2_reward_value} onChange={(v: string) => setConfig({ ...config, teacher_level2_reward_value: Number(v) })} suffix="%" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GraduationCap size={18} color="#EA580C" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark }}>Student Referral Program</h3>
                            </div>
                            <Toggle label="Enable Student Referral Program" desc="Allow registered students to share invite links and earn wallet credits." val={config.enable_affiliate_student} onChange={(v: boolean) => setConfig({ ...config, enable_affiliate_student: v })} />
                            {config.enable_affiliate_student && (
                                <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: '24px 28px', marginTop: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFBEB', padding: '10px 14px', borderRadius: 10, border: '1px solid #FDE68A', marginBottom: 20, fontSize: 12, color: '#92400E', fontWeight: 700 }}>
                                        <ShieldCheck size={14} /> Student referral points are saved directly to internal student wallets for exam fee discounts.
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                                        <Input label="Credits Earned Per Successful Referral" val={config.student_reward_credits} onChange={(v: string) => setConfig({ ...config, student_reward_credits: Number(v) })} suffix="pts" />
                                        <Input label="Maximum Referral Credits Limit" val={config.student_max_reward_limit} onChange={(v: string) => setConfig({ ...config, student_max_reward_limit: Number(v) })} suffix="pts" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <Input label="Credits Expiry Duration" val={config.student_credit_expiry_days} onChange={(v: string) => setConfig({ ...config, student_credit_expiry_days: Number(v) })} suffix="Days" />
                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Credits Usage Restrictions</label>
                                            <select value={config.student_usage_restriction} onChange={e => setConfig({ ...config, student_usage_restriction: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, color: P.dark, background: '#fff', outline: 'none' }}>
                                                <option value="none">Usable anywhere (All exams and courses)</option>
                                                <option value="exams_only">Usable strictly for exam fees</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleSaveConfig} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 6px 20px rgba(234,88,12,0.3)', opacity: saving ? 0.7 : 1 }}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Save Reward Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'kyc' && (
                <div>
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={16} color={P.muted} />
                        <input 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search partners by name, email, or mobile..." 
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} 
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} color={P.muted} />
                            </button>
                        )}
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}` }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Partner Registrations & KYC List</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${P.border}`, background: P.bg }}>
                                        {['Partner Profile', 'Associated Institute', 'Wallet Balances', 'KYC Status', 'Account Status', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: P.muted, fontWeight: 700 }}>No partner applications found.</td>
                                        </tr>
                                    )}
                                    {filteredTeachers.map(t => (
                                        <tr key={t.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 800, fontSize: 14, color: P.dark }}>{t.name}</div>
                                                <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>{t.email} • {t.mobile}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 13, fontWeight: 700, color: P.brand }}>
                                                {t.tenants?.name || 'Platform Wide'}
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Rs. {t.wallet_balance} total</div>
                                                <div style={{ fontSize: 11, color: P.muted }}>Rs. {t.wallet_withdrawable} withdrawable</div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{
                                                    background: t.kyc_status === 'approved' ? '#ECFDF5' : t.kyc_status === 'rejected' ? '#FEF2F2' : '#FFF7ED',
                                                    color: t.kyc_status === 'approved' ? '#059669' : t.kyc_status === 'rejected' ? '#DC2626' : '#D97706',
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
                                                }}>{t.kyc_status}</span>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{
                                                    background: t.status === 'active' ? '#ECFDF5' : '#F3F4F6',
                                                    color: t.status === 'active' ? '#059669' : '#6B7280',
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
                                                }}>{t.status}</span>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <button onClick={() => { setSelectedTeacher(t); setKycDrawer(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 8, color: P.brand, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                    <Eye size={13} /> Review KYC
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'withdrawals' && (
                <div>
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={16} color={P.muted} />
                        <input 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search payout requests by partner name, email, or UTR code..." 
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} 
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} color={P.muted} />
                            </button>
                        )}
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}` }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Withdrawal Payout Requests</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${P.border}`, background: P.bg }}>
                                        {['Partner Name', 'Requested Amount', 'TDS Tax', 'Net Payable', 'Status', 'UTR Reference', 'Date Requested'].map(h => (
                                            <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWithdrawals.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ padding: 60, textAlign: 'center', color: P.muted, fontWeight: 700 }}>No withdrawal requests found.</td>
                                        </tr>
                                    )}
                                    {filteredWithdrawals.map(w => (
                                        <tr key={w.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 800, fontSize: 14, color: P.dark }}>{w.affiliate_teachers?.name || 'Partner'}</div>
                                                <div style={{ fontSize: 11, color: P.muted }}>{w.affiliate_teachers?.email}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 13, fontWeight: 800, color: P.dark }}>Rs. {w.amount_requested}</td>
                                            <td style={{ padding: '18px 24px', fontSize: 13, color: P.error, fontWeight: 700 }}>-Rs. {w.tds_deducted}</td>
                                            <td style={{ padding: '18px 24px', fontSize: 13, color: P.success, fontWeight: 850 }}>Rs. {w.amount_payable}</td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{
                                                    background: w.status === 'paid' ? '#ECFDF5' : w.status === 'rejected' ? '#FEF2F2' : '#FFF7ED',
                                                    color: w.status === 'paid' ? '#059669' : w.status === 'rejected' ? '#DC2626' : '#D97706',
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
                                                }}>{w.status}</span>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                {w.status === 'paid' ? (
                                                    <code style={{ background: P.bg, padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 750, color: P.brand, fontFamily: 'monospace' }}>{w.bank_reference}</code>
                                                ) : w.status === 'pending' ? (
                                                    <button onClick={() => { setSelectedWithdrawal(w); setPayoutDrawer(true) }} style={{ padding: '6px 14px', background: P.successBg, border: 'none', borderRadius: 8, color: P.success, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                        Process Payout
                                                    </button>
                                                ) : (
                                                    <span style={{ color: P.muted, fontSize: 12, fontWeight: 700 }}>Rejected</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                                {new Date(w.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <SideDrawer isOpen={kycDrawer} onClose={() => setKycDrawer(false)} title="Partner KYC Verification Profile">
                {selectedTeacher && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '28px 32px' }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>{selectedTeacher.name}</div>
                            <div style={{ fontSize: 13, color: P.muted, marginTop: 2 }}>{selectedTeacher.email} • {selectedTeacher.mobile}</div>
                        </div>

                        <div style={{ padding: '16px 20px', border: `1px solid ${P.border}`, borderRadius: 14, background: P.bg }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Permanent Account Number (PAN)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: P.muted }}>PAN Code</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.pan_details?.pan || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Full Name on PAN</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.pan_details?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 20px', border: `1px solid ${P.border}`, borderRadius: 14, background: P.bg }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Aadhaar Verification UID</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Aadhaar Number</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.aadhar_details?.uid ? `xxxx-xxxx-${selectedTeacher.aadhar_details.uid.slice(-4)}` : 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Registered Name</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.aadhar_details?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 20px', border: `1px solid ${P.border}`, borderRadius: 14, background: P.bg }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Remittance Bank Details</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Bank Name</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.bank_details?.bank_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: P.muted }}>IFSC Code</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.bank_details?.ifsc || 'N/A'}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: P.muted }}>Account Number</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginTop: 2 }}>{selectedTeacher.bank_details?.account_number || 'N/A'}</div>
                            </div>
                        </div>

                        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                            <button onClick={() => handleUpdateKycStatus(selectedTeacher.id, 'rejected', 'suspended')} disabled={saving} style={{ flex: 1, padding: 14, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Reject KYC Profile
                            </button>
                            <button onClick={() => handleUpdateKycStatus(selectedTeacher.id, 'approved', 'active')} disabled={saving} style={{ flex: 2, padding: 14, background: '#059669', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Approve KYC Application
                            </button>
                        </div>
                    </div>
                )}
            </SideDrawer>

            <SideDrawer isOpen={payoutDrawer} onClose={() => setPayoutDrawer(false)} title="Process Withdrawal Payout">
                {selectedWithdrawal && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '28px 32px' }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>{selectedWithdrawal.affiliate_teachers?.name || 'Partner'}</div>
                            <div style={{ fontSize: 13, color: P.muted }}>{selectedWithdrawal.affiliate_teachers?.email}</div>
                        </div>

                        <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Payout Amount Calculations</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 650, color: P.dark }}>
                                <span>Requested Amount:</span>
                                <span>Rs. {selectedWithdrawal.amount_requested}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 650, color: P.error }}>
                                <span>TDS Tax Deducted:</span>
                                <span>-Rs. {selectedWithdrawal.tds_deducted}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${P.border}`, paddingTop: 10, fontSize: 15, fontWeight: 900, color: P.success }}>
                                <span>Net Remittance Payable:</span>
                                <span>Rs. {selectedWithdrawal.amount_payable}</span>
                            </div>
                        </div>

                        <div style={{ padding: '16px 20px', border: `1px solid ${P.border}`, borderRadius: 14, background: '#FFF7ED' }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Beneficiary Account Details</div>
                            <div style={{ fontSize: 13, color: '#9A3412', fontWeight: 600 }}>
                                <div>Bank: <strong>{selectedWithdrawal.affiliate_teachers?.bank_details?.bank_name || 'N/A'}</strong></div>
                                <div style={{ marginTop: 4 }}>A/C Number: <strong>{selectedWithdrawal.affiliate_teachers?.bank_details?.account_number || 'N/A'}</strong></div>
                                <div style={{ marginTop: 4 }}>IFSC Code: <strong>{selectedWithdrawal.affiliate_teachers?.bank_details?.ifsc || 'N/A'}</strong></div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank UTR / Transaction Reference Code</label>
                            <input type="text" value={bankReference} onChange={e => setBankReference(e.target.value)} placeholder="e.g. UTR1203491823" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                            <button onClick={() => handleProcessWithdrawal(selectedWithdrawal.id, 'rejected')} disabled={saving} style={{ flex: 1, padding: 14, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Reject Request
                            </button>
                            <button onClick={() => handleProcessWithdrawal(selectedWithdrawal.id, 'paid')} disabled={saving} style={{ flex: 2, padding: 14, background: '#059669', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Approve & Record Payout
                            </button>
                        </div>
                    </div>
                )}
            </SideDrawer>
        </div>
    )
}
