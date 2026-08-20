'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Settings as SettingsIcon, Shield, CreditCard, Save, RefreshCw,
    Loader2, CheckCircle, AlertTriangle, XCircle, Moon, Sun, Globe,
    Briefcase, Key, Mail, Video, Lock, Clock, ShieldAlert, Phone,
    Terminal, Building2, Paintbrush, Database, Brain, Calendar, DollarSign,
    Zap, Cpu, Globe2, Fingerprint, Server, Layout, ShieldCheck, MapPin, FileText, X
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { createClient } from '@/lib/supabase/client'

type SettingsSection = 'GENERAL' | 'SECURITY' | 'INTEGRATIONS' | 'BILLING' | 'MAINTENANCE'

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16 }}>
            <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{label}</div>
                {sub && <div style={{ fontSize: 12, color: P.muted, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
            </div>
            <button onClick={() => onChange(!checked)}
                style={{ width: 48, height: 26, borderRadius: 99, background: checked ? '#059669' : P.border, border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.25s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, left: checked ? 26 : 4, transition: 'all 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
            </button>
        </div>
    )
}

function InputField({ label, value, onChange, type = 'text', sub, disabled = false, icon: Icon, placeholder = '' }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={16} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />}
                <input
                    type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
                    style={{ width: '100%', padding: '12px 16px', paddingLeft: Icon ? 44 : 16, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: disabled ? P.muted : P.dark, background: disabled ? P.bg : '#fff', outline: 'none', boxSizing: 'border-box', fontWeight: 700, transition: 'all 0.2s' }}
                />
            </div>
            {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
        </div>
    )
}

function SelectField({ label, value, onChange, options, sub, icon: Icon }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={16} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.7 }} />}
                <select
                    value={value} onChange={e => onChange(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', paddingLeft: Icon ? 44 : 16, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: P.dark, background: '#fff', outline: 'none', boxSizing: 'border-box', appearance: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                    {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
            {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
        </div>
    )
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
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
        }}>
            {isOk ? <CheckCircle size={20} color={P.success} /> : <AlertTriangle size={20} color={P.error} />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}><X size={14} /></button>
        </div>
    )
}

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsSection>('GENERAL')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<string>('Just now')
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    // Password change state
    const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' })
    const [pwdSaving, setPwdSaving] = useState(false)

    // Form settings state
    const [general, setGeneral] = useState({
        platform_name: 'BeBrilliant Pro',
        support_email: 'support@bebrilliant.io',
        support_phone: '+91 98765 43210',
        gst_no: '27AAAAA0000A1Z5',
        business_address: 'Level 5, Institutional Tower, Cyber City, Mumbai, Maharashtra 400051',
        date_format: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata'
    })

    const [security, setSecurity] = useState({
        require_2fa_admins: false,
        session_timeout_mins: 120,
        max_login_attempts: 5,
        password_policy: 'medium'
    })

    const [integrations, setIntegrations] = useState({
        razorpay_env: 'test',
        razorpay_test_key_id: '',
        razorpay_test_key_secret: '',
        razorpay_live_key_id: '',
        razorpay_live_key_secret: '',
        openai_model: 'gpt-4o',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
        smtp_from: '',
        twilio_sid: '',
        twilio_token: '',
        twilio_whatsapp_number: '',
        zoom_active: false,
        firebase_server_key: '',
        firebase_sender_id: ''
    })

    const [billing, setBilling] = useState({
        default_currency: 'INR',
        trial_days: 14,
        tax_rate: 18,
        invoice_prefix: 'BB-'
    })

    const [maintenance, setMaintenance] = useState({
        maintenance_mode: false,
        maintenance_message: 'Platform is undergoing scheduled system maintenance.'
    })

    const [testStatuses, setTestStatuses] = useState<Record<string, { state: 'idle' | 'testing' | 'success' | 'failed'; msg: string }>>({
        razorpay: { state: 'idle', msg: '' },
        smtp: { state: 'idle', msg: '' },
        twilio: { state: 'idle', msg: '' }
    })

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    const fetchSettings = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/settings')
            const json = await res.json()
            if (Array.isArray(json)) {
                json.forEach((item: any) => {
                    if (item.key === 'general') setGeneral(p => ({ ...p, ...item.value }))
                    if (item.key === 'security') setSecurity(p => ({ ...p, ...item.value }))
                    if (item.key === 'integrations') setIntegrations(p => ({ ...p, ...item.value }))
                    if (item.key === 'billing') setBilling(p => ({ ...p, ...item.value }))
                    if (item.key === 'maintenance') setMaintenance(p => ({ ...p, ...item.value }))
                    if (item.updated_at) {
                        setLastSaved(new Date(item.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                    }
                })
            }
        } catch (e) {
            showToast('Failed to fetch system settings.', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const saveSettings = async (sectionKey: string, value: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: sectionKey, value })
            })
            if (res.ok) {
                showToast('System settings saved successfully.', 'success')
                setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                fetchSettings()
            } else {
                throw new Error('Failed to save settings')
            }
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
            return showToast('Please fill out all password fields.', 'error')
        }
        if (pwdForm.new !== pwdForm.confirm) {
            return showToast('New password confirmation does not match.', 'error')
        }
        if (pwdForm.new.length < 8) {
            return showToast('New password must be at least 8 characters long.', 'error')
        }

        setPwdSaving(true)
        try {
            const supabase = createClient()
            const { data: { user }, error: userErr } = await supabase.auth.getUser()
            if (userErr || !user || !user.email) {
                throw new Error('Failed retrieving user session.')
            }

            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: pwdForm.old
            })
            if (signInErr) throw new Error('Incorrect current password.')

            const { error: updateErr } = await supabase.auth.updateUser({
                password: pwdForm.new
            })
            if (updateErr) throw new Error(updateErr.message)

            showToast('Administrative password updated successfully!', 'success')
            setPwdForm({ old: '', new: '', confirm: '' })
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setPwdSaving(false)
        }
    }

    const runConnectionTest = async (type: 'razorpay' | 'smtp' | 'twilio') => {
        setTestStatuses(prev => ({ ...prev, [type]: { state: 'testing', msg: 'Testing connection...' } }))
        try {
            const payload = type === 'razorpay' ? {
                env: integrations.razorpay_env,
                test_key_id: integrations.razorpay_test_key_id,
                test_key_secret: integrations.razorpay_test_key_secret,
                live_key_id: integrations.razorpay_live_key_id,
                live_key_secret: integrations.razorpay_live_key_secret
            } : type === 'smtp' ? {
                host: integrations.smtp_host,
                port: integrations.smtp_port,
                user: integrations.smtp_user,
                pass: integrations.smtp_pass,
                from: integrations.smtp_from
            } : {
                sid: integrations.twilio_sid,
                token: integrations.twilio_token,
                whatsapp_number: integrations.twilio_whatsapp_number
            }

            const res = await fetch('/api/owner/settings/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, payload })
            })
            const json = await res.json()
            if (res.ok && json.success) {
                setTestStatuses(prev => ({ ...prev, [type]: { state: 'success', msg: json.message || 'Connection verified successfully.' } }))
            } else {
                setTestStatuses(prev => ({ ...prev, [type]: { state: 'failed', msg: json.message || 'Connection test failed.' } }))
            }
        } catch (e: any) {
            setTestStatuses(prev => ({ ...prev, [type]: { state: 'failed', msg: 'Network connection failed.' } }))
        }
    }

    const TABS = [
        { id: 'GENERAL', icon: Globe2, label: 'General Settings' },
        { id: 'SECURITY', icon: Fingerprint, label: 'Security Policies' },
        { id: 'INTEGRATIONS', icon: Cpu, label: 'Integrations' },
        { id: 'BILLING', icon: CreditCard, label: 'Billing Defaults' },
        { id: 'MAINTENANCE', icon: Server, label: 'Maintenance Mode' },
    ] as const

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
                <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand, boxShadow: `0 0 8px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Settings & Controls</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>System Settings</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>Configure global platform parameters, security policies, payment gateways, and system defaults.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchSettings} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Sync Settings
                    </button>
                    <button 
                        onClick={() => {
                            const mapping: Record<SettingsSection, string> = {
                                'GENERAL': 'general',
                                'SECURITY': 'security',
                                'INTEGRATIONS': 'integrations',
                                'BILLING': 'billing',
                                'MAINTENANCE': 'maintenance'
                            }
                            const valuesMapping: Record<SettingsSection, any> = {
                                'GENERAL': general,
                                'SECURITY': security,
                                'INTEGRATIONS': integrations,
                                'BILLING': billing,
                                'MAINTENANCE': maintenance
                            }
                            saveSettings(mapping[activeTab], valuesMapping[activeTab])
                        }} 
                        disabled={saving} 
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}
                    >
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                        Save Settings
                    </button>
                </div>
            </div>

            {/* KPI OVERVIEW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={CheckCircle} title="System Status" value="Online" color="#059669" />
                <KpiCard icon={Clock} title="Last Saved" value={lastSaved} color={P.brand} />
                <KpiCard icon={Cpu} title="Active Integrations" value="4 Active" color="#7C3AED" />
                <KpiCard icon={Server} title="Maintenance Mode" value={maintenance.maintenance_mode ? 'ACTIVE' : 'Disabled'} color={maintenance.maintenance_mode ? '#DC2626' : P.muted} />
            </div>

            {/* MAIN CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-start' }}>
                
                {/* LEFT NAVIGATION TABS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: 12 }}>
                    {TABS.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id)} 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: 'none', 
                                cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 800, 
                                background: activeTab === t.id ? P.brand : 'transparent', 
                                color: activeTab === t.id ? '#fff' : P.muted, transition: 'all 0.2s' 
                            }}
                        >
                            <t.icon size={18} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* MAIN CONFIGURATION CARD */}
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, background: P.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {(() => {
                            const tabItem = TABS.find(t => t.id === activeTab)
                            if (!tabItem) return null
                            const Icon = tabItem.icon
                            return <Icon size={22} color={P.brand} />
                        })()}
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: 0 }}>{TABS.find(t => t.id === activeTab)?.label}</h2>
                            <p style={{ fontSize: 12, color: P.muted, margin: '2px 0 0', fontWeight: 600 }}>Configure operational parameters and system rules.</p>
                        </div>
                    </div>

                    <div style={{ padding: '32px' }}>
                        {/* ── TAB 1: GENERAL SETTINGS ── */}
                        {activeTab === 'GENERAL' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <InputField label="Platform Brand Name" value={general.platform_name} onChange={(v: string) => setGeneral({ ...general, platform_name: v })} icon={Layout} sub="Master portal name visible on all platform headers." />
                                    <InputField label="Support Center Email" value={general.support_email} onChange={(v: string) => setGeneral({ ...general, support_email: v })} icon={Mail} sub="Support email address visible to registered institutes." />
                                    <InputField label="Support Phone Number" value={general.support_phone} onChange={(v: string) => setGeneral({ ...general, support_phone: v })} icon={Phone} sub="Support hotline number for tenant inquiries." />
                                    <InputField label="GST Identification Number (GSTIN)" value={general.gst_no} onChange={(v: string) => setGeneral({ ...general, gst_no: v })} icon={FileText} sub="Official GST registration number for billing tax invoices." />
                                </div>

                                <div>
                                    <InputField label="Registered Business Address" value={general.business_address} onChange={(v: string) => setGeneral({ ...general, business_address: v })} icon={MapPin} sub="Official company address printed on platform invoices and legal notices." />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <SelectField label="System Date Format" value={general.date_format} onChange={(v: string) => setGeneral({ ...general, date_format: v })} icon={Calendar} options={[
                                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Standard Indian Format)' },
                                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
                                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO International)' }
                                    ]} sub="Date format used across reports, tables, and invoices." />

                                    <SelectField label="System Timezone" value={general.timezone} onChange={(v: string) => setGeneral({ ...general, timezone: v })} icon={Clock} options={[
                                        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                                        { value: 'UTC', label: 'UTC Universal Time' },
                                        { value: 'America/New_York', label: 'US Eastern Standard Time' }
                                    ]} sub="Default timezone for timestamps and scheduled queues." />
                                </div>
                            </div>
                        )}

                        {/* ── TAB 2: SECURITY POLICIES ── */}
                        {activeTab === 'SECURITY' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <Toggle checked={security.require_2fa_admins} onChange={v => setSecurity({ ...security, require_2fa_admins: v })} label="Require Two-Factor Verification for Staff" sub="Enforce 2FA verification code checks on administrative logins." />
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <InputField type="number" label="Max Failed Login Attempts" value={security.max_login_attempts} onChange={(v: string) => setSecurity({ ...security, max_login_attempts: Number(v) })} icon={ShieldAlert} sub="Failed attempts allowed before temporary account lock." />
                                    <InputField type="number" label="Idle Session Timeout (Minutes)" value={security.session_timeout_mins} onChange={(v: string) => setSecurity({ ...security, session_timeout_mins: Number(v) })} icon={Clock} sub="Duration of inactive login session before auto-logout." />
                                </div>

                                <div>
                                    <SelectField label="Password Complexity Rules" value={security.password_policy} onChange={(v: string) => setSecurity({ ...security, password_policy: v })} icon={Lock} options={[
                                        { value: 'weak', label: 'Basic (Minimum 8 Characters)' },
                                        { value: 'medium', label: 'Standard Strong (Uppercase, Numbers, 8+ Chars)' },
                                        { value: 'strict', label: 'Strict (Uppercase, Numbers, Special Symbols, 12+ Chars)' }
                                    ]} sub="Enforce password strength rules across all staff & tenant accounts." />
                                </div>

                                {/* Change Administrative Password Box */}
                                <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 24, marginTop: 8 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Key size={18} color={P.brand} /> Change Administrative Password
                                    </h3>
                                    <p style={{ fontSize: 12, color: P.muted, margin: '0 0 20px', fontWeight: 600 }}>Update your current Super Admin login password.</p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                                        <InputField type="password" label="Current Password" value={pwdForm.old} onChange={(v: string) => setPwdForm({ ...pwdForm, old: v })} icon={Lock} />
                                        <InputField type="password" label="New Password" value={pwdForm.new} onChange={(v: string) => setPwdForm({ ...pwdForm, new: v })} icon={Lock} />
                                        <InputField type="password" label="Confirm New Password" value={pwdForm.confirm} onChange={(v: string) => setPwdForm({ ...pwdForm, confirm: v })} icon={Lock} />
                                    </div>

                                    <button onClick={handleChangePassword} disabled={pwdSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 900, cursor: pwdSaving ? 'not-allowed' : 'pointer' }}>
                                        {pwdSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />} Update Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 3: INTEGRATIONS ── */}
                        {activeTab === 'INTEGRATIONS' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                                {/* Razorpay */}
                                <div style={{ background: P.bg, borderRadius: 20, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                    <div style={{ padding: 20, borderBottom: `1px solid ${P.border}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <CreditCard size={18} color={P.brand} />
                                            <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>Razorpay Payment Gateway API Keys</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: 3 }}>
                                            {(['test', 'live'] as const).map(env => (
                                                <button key={env} type="button" onClick={() => setIntegrations({ ...integrations, razorpay_env: env })} style={{
                                                    padding: '6px 14px', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer',
                                                    background: integrations.razorpay_env === env ? '#fff' : 'transparent',
                                                    color: integrations.razorpay_env === env ? P.brand : P.muted, transition: 'all 0.15s'
                                                }}>{env === 'test' ? 'Test Mode' : 'Live Mode'}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <InputField type="text" label="Razorpay Test Key ID" value={integrations.razorpay_test_key_id} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_test_key_id: v })} icon={Key} placeholder="rzp_test_..." />
                                            <InputField type="password" label="Razorpay Test Key Secret" value={integrations.razorpay_test_key_secret} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_test_key_secret: v })} icon={Lock} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <InputField type="text" label="Razorpay Live Key ID" value={integrations.razorpay_live_key_id} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_live_key_id: v })} icon={Key} placeholder="rzp_live_..." />
                                            <InputField type="password" label="Razorpay Live Key Secret" value={integrations.razorpay_live_key_secret} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_live_key_secret: v })} icon={Lock} />
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 20px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: testStatuses.razorpay.state === 'success' ? '#059669' : testStatuses.razorpay.state === 'failed' ? '#DC2626' : P.muted }}>
                                            {testStatuses.razorpay.state === 'idle' ? 'Status: Connection untested' : testStatuses.razorpay.msg}
                                        </span>
                                        <button type="button" onClick={() => runConnectionTest('razorpay')} style={{ padding: '6px 14px', background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 8, color: P.brand, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                                            Test Connection
                                        </button>
                                    </div>
                                </div>

                                {/* Custom SMTP Email */}
                                <div style={{ background: P.bg, borderRadius: 20, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Mail size={18} color={P.brand} />
                                            <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>Custom Email SMTP Gateway Credentials</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <InputField type="text" label="SMTP Host Server" value={integrations.smtp_host} onChange={(v: string) => setIntegrations({ ...integrations, smtp_host: v })} icon={Globe} placeholder="smtp.mailtrap.io" />
                                            <InputField type="number" label="SMTP Port" value={integrations.smtp_port} onChange={(v: string) => setIntegrations({ ...integrations, smtp_port: Number(v) })} icon={SettingsIcon} placeholder="587" />
                                            <InputField type="text" label="SMTP Username" value={integrations.smtp_user} onChange={(v: string) => setIntegrations({ ...integrations, smtp_user: v })} icon={Key} />
                                            <InputField type="password" label="SMTP Password" value={integrations.smtp_pass} onChange={(v: string) => setIntegrations({ ...integrations, smtp_pass: v })} icon={Lock} />
                                        </div>
                                        <InputField type="text" label="Authorized From Email" value={integrations.smtp_from} onChange={(v: string) => setIntegrations({ ...integrations, smtp_from: v })} icon={Mail} placeholder="noreply@bebrilliant.in" />
                                    </div>
                                    <div style={{ padding: '12px 20px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: testStatuses.smtp.state === 'success' ? '#059669' : testStatuses.smtp.state === 'failed' ? '#DC2626' : P.muted }}>
                                            {testStatuses.smtp.state === 'idle' ? 'Status: Connection untested' : testStatuses.smtp.msg}
                                        </span>
                                        <button type="button" onClick={() => runConnectionTest('smtp')} style={{ padding: '6px 14px', background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 8, color: P.brand, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                                            Test Connection
                                        </button>
                                    </div>
                                </div>

                                {/* Twilio WhatsApp */}
                                <div style={{ background: P.bg, borderRadius: 20, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Zap size={18} color={P.brand} />
                                            <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>Twilio WhatsApp Messaging Credentials</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <InputField type="text" label="Twilio Account SID" value={integrations.twilio_sid} onChange={(v: string) => setIntegrations({ ...integrations, twilio_sid: v })} icon={Key} placeholder="AC..." />
                                            <InputField type="password" label="Twilio Auth Token" value={integrations.twilio_token} onChange={(v: string) => setIntegrations({ ...integrations, twilio_token: v })} icon={Lock} />
                                        </div>
                                        <InputField type="text" label="Twilio WhatsApp Phone Number" value={integrations.twilio_whatsapp_number} onChange={(v: string) => setIntegrations({ ...integrations, twilio_whatsapp_number: v })} icon={Globe} placeholder="whatsapp:+14155238886" />
                                    </div>
                                    <div style={{ padding: '12px 20px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: testStatuses.twilio.state === 'success' ? '#059669' : testStatuses.twilio.state === 'failed' ? '#DC2626' : P.muted }}>
                                            {testStatuses.twilio.state === 'idle' ? 'Status: Connection untested' : testStatuses.twilio.msg}
                                        </span>
                                        <button type="button" onClick={() => runConnectionTest('twilio')} style={{ padding: '6px 14px', background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 8, color: P.brand, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                                            Test Connection
                                        </button>
                                    </div>
                                </div>

                                {/* OpenAI Model */}
                                <div style={{ background: P.bg, borderRadius: 20, padding: 20, border: `1px solid ${P.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <Brain size={18} color="#10A37F" />
                                        <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>OpenAI Feature Model Engine</span>
                                    </div>
                                    <SelectField label="Platform AI Engine" value={integrations.openai_model} onChange={(v: string) => setIntegrations({ ...integrations, openai_model: v })} icon={Brain} options={[
                                        { value: 'gpt-4o', label: 'GPT-4o (Recommended Default)' },
                                        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Legacy)' }
                                    ]} sub="Default AI engine model used across student mentor helpers and exam tools." />
                                </div>
                            </div>
                        )}

                        {/* ── TAB 4: BILLING DEFAULTS ── */}
                        {activeTab === 'BILLING' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <SelectField label="Ecosystem Primary Currency" value={billing.default_currency} onChange={(v: string) => setBilling({ ...billing, default_currency: v })} icon={DollarSign} options={[
                                    { value: 'INR', label: 'INR (Indian Rupee - ₹)' },
                                    { value: 'USD', label: 'USD (US Dollar - $)' }
                                ]} sub="Primary currency for platform transactions and billing." />

                                <InputField type="number" label="Default Tax Surcharge Rate (%)" value={billing.tax_rate} onChange={(v: string) => setBilling({ ...billing, tax_rate: Number(v) })} icon={Briefcase} sub="Default tax rate applied to billing invoices (GST 18% standard)." />
                                <InputField type="number" label="Default Trial Interval (Days)" value={billing.trial_days} onChange={(v: string) => setBilling({ ...billing, trial_days: Number(v) })} icon={Calendar} sub="Free trial period duration granted to new institutes." />
                                <InputField type="text" label="Invoice Number Prefix" value={billing.invoice_prefix} onChange={(v: string) => setBilling({ ...billing, invoice_prefix: v })} icon={Database} sub="Custom prefix string used on invoice serial numbers (e.g. BB-)." />
                            </div>
                        )}

                        {/* ── TAB 5: MAINTENANCE MODE ── */}
                        {activeTab === 'MAINTENANCE' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {maintenance.maintenance_mode && (
                                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 12, color: '#991B1B', fontSize: 13, fontWeight: 800 }}>
                                        <AlertTriangle size={20} color="#DC2626" />
                                        <span>MAINTENANCE MODE IS ACTIVE: Registered institutes and public users will see the maintenance screen.</span>
                                    </div>
                                )}
                                
                                <div style={{ padding: 20, borderRadius: 20, background: P.bg, border: `1px solid ${P.border}` }}>
                                    <Toggle checked={maintenance.maintenance_mode} onChange={v => setMaintenance({ ...maintenance, maintenance_mode: v })} label="Enable System Maintenance Mode" sub="Temporarily restrict platform access for system upgrades." />
                                    {maintenance.maintenance_mode && (
                                        <div style={{ marginTop: 20 }}>
                                            <InputField type="text" label="Broadcast Maintenance Banner Message" value={maintenance.maintenance_message ?? ''} onChange={(v: string) => setMaintenance({ ...maintenance, maintenance_message: v })} placeholder="System is undergoing scheduled maintenance." sub="Public notice message shown to users during lockout." />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '20px 32px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button 
                            onClick={() => {
                                const mapping: Record<SettingsSection, string> = {
                                    'GENERAL': 'general',
                                    'SECURITY': 'security',
                                    'INTEGRATIONS': 'integrations',
                                    'BILLING': 'billing',
                                    'MAINTENANCE': 'maintenance'
                                }
                                const valuesMapping: Record<SettingsSection, any> = {
                                    'GENERAL': general,
                                    'SECURITY': security,
                                    'INTEGRATIONS': integrations,
                                    'BILLING': billing,
                                    'MAINTENANCE': maintenance
                                }
                                saveSettings(mapping[activeTab], valuesMapping[activeTab])
                            }} 
                            disabled={saving} 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 8, 
                                background: activeTab === 'MAINTENANCE' && maintenance.maintenance_mode ? '#DC2626' : P.brand, 
                                color: '#fff', border: 'none', borderRadius: 12, 
                                padding: '12px 28px', fontSize: 13, fontWeight: 900, 
                                cursor: saving ? 'wait' : 'pointer', 
                                boxShadow: `0 6px 20px ${activeTab === 'MAINTENANCE' && maintenance.maintenance_mode ? '#DC262630' : P.brand + '30'}`
                            }}
                        >
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
