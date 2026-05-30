'use client'
import React, { useState, useEffect } from 'react'
import {
    Settings2, Users, GraduationCap, Percent, Banknote,
    Save, CheckCircle2, AlertCircle, RefreshCcw, Loader2,
    BuildingIcon, ShieldCheck, HelpCircle, Activity
} from 'lucide-react'
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
function Toast({ msg, type, onClose }: { msg: string, type: 'success' | 'error', onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    const isOk = type === 'success'
    return (
        <div style={{ position: 'fixed', top: 32, right: 32, background: isOk ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${isOk ? COLORS.success : COLORS.danger}40`, borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' }}>
            {isOk ? <CheckCircle2 size={20} color={COLORS.success} /> : <AlertCircle size={20} color={COLORS.danger} />}
            <span style={{ fontSize: 13, fontWeight: 800, color: isOk ? '#065F46' : '#991B1B' }}>{msg}</span>
        </div>
    )
}
export default function AffiliateSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null)
    const [tenants, setTenants] = useState<any[]>([])
    const [selectedTenant, setSelectedTenant] = useState<string>('')
    const [config, setConfig] = useState({
        enable_affiliate_teacher: false,
        teacher_reward_type: 'percentage',
        teacher_reward_value: 20,
        teacher_level2_enabled: false,
        teacher_level2_reward_value: 5,
        teacher_min_withdrawal: 500,
        teacher_tds_percentage: 5.0,
        enable_affiliate_student: false,
        student_reward_credits: 50,
        student_max_reward_limit: 1000,
        student_credit_expiry_days: 365,
        student_usage_restriction: 'none'
    })
    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })
    useEffect(() => {
        fetch('/api/owner/tenants')
            .then(res => res.json())
            .then(data => {
                if(data.tenants) setTenants(data.tenants.filter((t: any) => t.type === 'institute'))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])
    useEffect(() => {
        if (!selectedTenant) return
        setLoading(true)
        fetch(`/api/owner/settings/affiliate?tenant_id=${selectedTenant}`)
            .then(r => r.json())
            .then(d => {
                if(d.settings) setConfig({ ...config, ...d.settings })
                else setConfig({
                    enable_affiliate_teacher: false, teacher_reward_type: 'percentage', teacher_reward_value: 20,
                    teacher_level2_enabled: false, teacher_level2_reward_value: 5, teacher_min_withdrawal: 500, teacher_tds_percentage: 5.0,
                    enable_affiliate_student: false, student_reward_credits: 50, student_max_reward_limit: 1000, student_credit_expiry_days: 365, student_usage_restriction: 'none'
                })
            })
            .finally(() => setLoading(false))
    }, [selectedTenant])
    const handleSave = async () => {
        if (!selectedTenant) return showToast('Select an institute first', 'error')
        setSaving(true)
        try {
            const res = await fetch(`/api/owner/settings/affiliate?tenant_id=${selectedTenant}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            if (res.ok) showToast('Affiliate Configuration Saved', 'success')
            else throw new Error('Failed to save settings')
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }
    // Common Inputs
    const Toggle = ({ label, desc, val, onChange }: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: '#FFF', borderRadius: 16, border: `1px solid ${COLORS.border}`, marginBottom: 12 }}>
            <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{label}</div>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginTop: 4 }}>{desc}</div>
            </div>
            <div 
                onClick={() => onChange(!val)} 
                style={{ width: 44, height: 24, borderRadius: 12, background: val ? COLORS.success : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
            >
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFF', position: 'absolute', top: 3, left: val ? 23 : 3, transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </div>
        </div>
    )
    const Input = ({ label, type = 'number', val, onChange, suffix }: any) => (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input type={type} value={val} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: `2px solid ${COLORS.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0F172A', outline: 'none' }} />
                {suffix && <div style={{ position: 'absolute', right: 16, top: 14, fontSize: 14, fontWeight: 900, color: '#94A3B8' }}>{suffix}</div>}
            </div>
        </div>
    )
    return (
        <div style={{ padding: '40px 56px', minHeight: '100vh', background: COLORS.background, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: COLORS.primaryGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Settings2 size={22} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Affiliate Economics & Rules</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', fontWeight: 600, margin: 0 }}>Configure affiliate commissions, rewards, and payout limits strictly for Educational Institutes.</p>
                </div>
                <button onClick={handleSave} disabled={saving} style={{ padding: '14px 28px', background: COLORS.primaryGradient, color: '#FFF', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                    {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Save Architecture
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32 }}>
                {/* LEFT: TENANT SELECTOR */}
                <div style={{ alignSelf: 'start' }}>
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 1000, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BuildingIcon size={16} color={COLORS.primary} /> Target Institute
                        </h3>
                        {tenants.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setSelectedTenant(t.id)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', background: selectedTenant === t.id ? COLORS.primary : 'transparent', color: selectedTenant === t.id ? '#FFF' : '#475569', fontSize: 14, fontWeight: 800, textAlign: 'left', cursor: 'pointer', marginBottom: 8, transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                {t.name}
                                {selectedTenant === t.id && <CheckCircle2 size={16} color="#FFF" />}
                            </button>
                        ))}
                    </div>
                </div>
                {/* RIGHT: SETTINGS FORM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {!selectedTenant ? (
                        <div style={{ padding: 80, textAlign: 'center', background: '#FFF', borderRadius: 24, border: `1px dashed ${COLORS.border}` }}>
                            <Activity size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#64748B' }}>Select an Institute</div>
                            <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600, marginTop: 8 }}>Choose a tenant from the left to configure their specific affiliate rules.</div>
                        </div>
                    ) : (
                        <>
                            {/* TEACHER MODULE */}
                            <div className="glass-panel" style={{ padding: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLORS.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={20} color={COLORS.success} />
                                    </div>
                                    <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>Affiliate Teachers System</h2>
                                </div>
                                <Toggle label="Enable Teacher Affiliates" desc="Allow external staff to register, undergo KYC, and sell institute exams." val={config.enable_affiliate_teacher} onChange={(v: boolean) => setConfig({...config, enable_affiliate_teacher: v})} />
                                {config.enable_affiliate_teacher && (
                                    <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reward Structure</label>
                                                <select value={config.teacher_reward_type} onChange={e => setConfig({...config, teacher_reward_type: e.target.value})} style={{ width: '100%', padding: '14px 16px', background: '#FFF', border: `2px solid ${COLORS.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0F172A', outline: 'none' }}>
                                                    <option value="percentage">Percentage based (%)</option>
                                                    <option value="flat">Flat amount (₹)</option>
                                                </select>
                                            </div>
                                            <Input label={`Reward Amount (${config.teacher_reward_type === 'percentage' ? '%' : '₹'})`} val={config.teacher_reward_value} onChange={(v: string) => setConfig({...config, teacher_reward_value: Number(v)})} suffix={config.teacher_reward_type === 'percentage' ? '%' : '₹'} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                            <Input label="Minimum Withdrawal Request" val={config.teacher_min_withdrawal} onChange={(v: string) => setConfig({...config, teacher_min_withdrawal: Number(v)})} suffix="₹" />
                                            <Input label="TDS Deduction Percentage" val={config.teacher_tds_percentage} onChange={(v: string) => setConfig({...config, teacher_tds_percentage: Number(v)})} suffix="%" />
                                        </div>
                                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 24 }}>
                                            <Toggle label="Enable Multi-Level Referral (Level 2)" desc="Allow affiliates to earn overriding commissions from other affiliates they refer." val={config.teacher_level2_enabled} onChange={(v: boolean) => setConfig({...config, teacher_level2_enabled: v})} />
                                            {config.teacher_level2_enabled && (
                                                 <div style={{ marginTop: 16 }}>
                                                    <Input label="Level 2 Override Reward" val={config.teacher_level2_reward_value} onChange={(v: string) => setConfig({...config, teacher_level2_reward_value: Number(v)})} suffix="%" />
                                                 </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* STUDENT MODULE */}
                            <div className="glass-panel" style={{ padding: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLORS.warning}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <GraduationCap size={20} color={COLORS.warning} />
                                    </div>
                                    <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>Affiliate Students System</h2>
                                </div>
                                <Toggle label="Enable Student Referral Links" desc="Allow registered institute students to earn wallet credits by sharing exams." val={config.enable_affiliate_student} onChange={(v: boolean) => setConfig({...config, enable_affiliate_student: v})} />
                                {config.enable_affiliate_student && (
                                    <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#FFF7ED', padding: '12px 16px', borderRadius: 12, marginBottom: 24 }}>
                                            <ShieldCheck size={16} color={COLORS.warning} />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#9A3412' }}>Student rewards are strictly non-withdrawable internal credits.</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                            <Input label="Credits per Conversion" val={config.student_reward_credits} onChange={(v: string) => setConfig({...config, student_reward_credits: Number(v)})} suffix="Credits" />
                                            <Input label="Max Credits Earnable (Limit)" val={config.student_max_reward_limit} onChange={(v: string) => setConfig({...config, student_max_reward_limit: Number(v)})} suffix="Credits" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            <Input label="Credit Expiry Duration" val={config.student_credit_expiry_days} onChange={(v: string) => setConfig({...config, student_credit_expiry_days: Number(v)})} suffix="Days" />
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Restriction</label>
                                                <select value={config.student_usage_restriction} onChange={e => setConfig({...config, student_usage_restriction: e.target.value})} style={{ width: '100%', padding: '14px 16px', background: '#FFF', border: `2px solid ${COLORS.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0F172A', outline: 'none' }}>
                                                    <option value="none">Usable anywhere (Exams/Classes)</option>
                                                    <option value="exams_only">Usable strictly for mock exams</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
