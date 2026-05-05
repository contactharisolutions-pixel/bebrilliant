'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Settings as SettingsIcon, Shield, Link2, CreditCard, Wrench, Save, RefreshCw,
    Loader2, CheckCircle, AlertTriangle, XCircle, Moon, Sun, Globe,
    Briefcase, Key, Mail, Video, Lock, Clock, ShieldAlert,
    Terminal, Building2, Paintbrush, Database, Brain, Calendar, DollarSign,
    Zap, Cpu, Globe2, Fingerprint, Activity, Server, Layout, ChevronRight
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'

type SettingsSection = 'GENERAL' | 'SECURITY' | 'INTEGRATIONS' | 'BILLING' | 'MAINTENANCE'

// â”€â”€ COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Toggle({ checked, onChange, label, sub }: { checked: boolean, onChange: (v: boolean) => void, label: string, sub?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: 15, fontWeight: 850, color: P.dark }}>{label}</div>
                {sub && <div style={{ fontSize: 12, color: P.muted, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
            </div>
            <button onClick={() => onChange(!checked)}
                style={{ width: 52, height: 28, borderRadius: 99, background: checked ? P.success : P.muted + '40', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, left: checked ? 28 : 4, transition: 'all 0.3s cubic-bezier(0.3, 0, 0.2, 1)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
            </button>
        </div>
    )
}

function InputField({ label, value, onChange, type = 'text', sub, disabled = false, icon: Icon }: any) {
    return (
        <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 950, color: P.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={18} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />}
                <input
                    type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                    className="focus-ring"
                    style={{ width: '100%', padding: '16px 20px', paddingLeft: Icon ? 50 : 20, border: `1px solid ${P.border}`, borderRadius: 16, fontSize: 14, color: disabled ? P.muted : P.dark, background: disabled ? P.bg : '#fff', outline: 'none', boxSizing: 'border-box', fontWeight: 700, transition: 'all 0.2s' }}
                />
            </div>
            {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 8, fontWeight: 600 }}>{sub}</div>}
        </div>
    )
}

function SelectField({ label, value, onChange, options, sub, icon: Icon }: any) {
    return (
        <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 950, color: P.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={18} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />}
                <select
                    value={value} onChange={e => onChange(e.target.value)}
                    className="focus-ring"
                    style={{ width: '100%', padding: '16px 20px', paddingLeft: Icon ? 50 : 20, border: `1px solid ${P.border}`, borderRadius: 16, fontSize: 14, color: P.dark, background: '#fff', outline: 'none', boxSizing: 'border-box', appearance: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                    {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
            {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 8, fontWeight: 600 }}>{sub}</div>}
        </div>
    )
}

export default function GlobalSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsSection>('GENERAL')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Modernized State with Calibrated Lexicon
    const [general, setGeneral] = useState({ platform_name: '', support_email: '', timezone: 'Asia/Kolkata' })
    const [security, setSecurity] = useState({ require_2fa_admins: false, session_timeout_mins: 60, max_login_attempts: 5, password_policy: 'medium' })
    const [integrations, setIntegrations] = useState({ stripe_public: '', openai_model: 'gpt-4o', sendgrid_active: false, zoom_active: false })
    const [billing, setBilling] = useState({ default_currency: 'INR', trial_days: 14, tax_rate: 18, invoice_prefix: 'BB-' })
    const [maintenance, setMaintenance] = useState({ maintenance_mode: false, maintenance_message: 'System is undergoing scheduled maintenance.' })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3000)
    }

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
                })
            }
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchSettings() }, [fetchSettings])

    const saveSettings = async (sectionKey: string, value: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/settings', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: sectionKey, value })
            })
            if (res.ok) showToast('Ecosystem architecture committed successfully', true)
            else showToast('Deployment failure in logic sequence', false)
        } finally { setSaving(false) }
    }

    const TABS = [
        { id: 'GENERAL', icon: Globe2, label: 'General' },
        { id: 'SECURITY', icon: Fingerprint, label: 'Security' },
        { id: 'INTEGRATIONS', icon: Cpu, label: 'Integrations' },
        { id: 'BILLING', icon: CreditCard, label: 'Billing' },
        { id: 'MAINTENANCE', icon: Server, label: 'Maintenance' },
    ] as const

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '40px 48px', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                @keyframes spin { to { transform: rotate(360deg); } }
                .focus-ring:focus-within { border-color: ${P.brand} !important; box-shadow: 0 0 0 4px ${P.brand}15 !important; }
                .tab-active { background: ${P.brand} !important; color: #fff !important; box-shadow: 0 12px 24px ${P.brand}30 !important; }
                .tab-inactive:hover { background: ${P.card}; color: ${P.brand}; }
            `}</style>

            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 16, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 9999, backdropFilter: 'blur(12px)', animation: 'slideIn 0.3s ease-out' }}>
                    {toast.ok ? <CheckCircle size={20} color={P.success} /> : <XCircle size={20} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.muted }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>Version 4.2</div>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>General Settings</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>Manage your platform name, security, and integration settings.</p>
                </div>
                <button onClick={() => fetchSettings()} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '12px 24px', fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RefreshCw size={18} color={P.brand} /> Sync Foundation
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 48, alignItems: 'flex-start' }}>
                
                {/* VERTICAL NAV */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={activeTab === t.id ? 'tab-active' : 'tab-inactive'}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
                                background: 'transparent', border: 'none',
                                borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                                color: P.muted, transition: 'all 0.3s', fontWeight: 800, fontSize: 14
                            }}>
                            <t.icon size={22} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT ENGINE */}
                <div style={{ position: 'relative' }}>
                    {loading ? (
                        <div className="glass-card" style={{ border: `1px solid ${P.border}`, borderRadius: 32, padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Loader2 size={48} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontSize: 16, color: P.muted, fontWeight: 800, marginTop: 24 }}>Loading settings...</div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 32, overflow: 'hidden', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.03)' }}>
                            <div style={{ padding: '40px 48px', borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg, ${P.card}, ${P.bg})` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    {(() => {
                                        const tab = TABS.find(t => t.id === activeTab);
                                        if (!tab) return null;
                                        const Icon = tab.icon;
                                        return <Icon size={28} color={P.brand} strokeWidth={2.5} />;
                                    })()}
                                    <div>
                                        <h2 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0 }}>{TABS.find(t => t.id === activeTab)?.label}</h2>
                                        <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Manage global platform settings.</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '48px' }}>
                                {activeTab === 'GENERAL' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                        <InputField label="Platform Name" value={general.platform_name} onChange={(v: string) => setGeneral({ ...general, platform_name: v })} icon={Layout} sub="The name of your platform." />
                                        <InputField label="Support Email" value={general.support_email} onChange={(v: string) => setGeneral({ ...general, support_email: v })} icon={Mail} sub="Email for customer support." />
                                        <SelectField label="Timezone" value={general.timezone} onChange={(v: string) => setGeneral({ ...general, timezone: v })} icon={Clock} options={[
                                            { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' }, { value: 'UTC', label: 'UTC Universal' }, { value: 'America/New_York', label: 'US Eastern Standard' }
                                        ]} />
                                    </div>
                                )}

                                {activeTab === 'SECURITY' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                        <Toggle checked={security.require_2fa_admins} onChange={(v) => setSecurity({ ...security, require_2fa_admins: v })} label="Two-Factor Auth (2FA)" sub="Ask admins for a code when logging in." />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                            <InputField type="number" label="Login Attempts" value={security.max_login_attempts} onChange={(v: string) => setSecurity({ ...security, max_login_attempts: Number(v) })} icon={ShieldAlert} sub="Max failed logins before lock." />
                                            <InputField type="number" label="Session Timeout (Mins)" value={security.session_timeout_mins} onChange={(v: string) => setSecurity({ ...security, session_timeout_mins: Number(v) })} icon={Clock} sub="How long users stay logged in." />
                                            <SelectField label="Password Strength" value={security.password_policy} onChange={(v: string) => setSecurity({ ...security, password_policy: v })} icon={Lock} options={[
                                                { value: 'weak', label: 'Normal' }, { value: 'medium', label: 'Strong' }, { value: 'strict', label: 'Very Strong' }
                                            ]} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'INTEGRATIONS' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                        <div style={{ background: P.bg, borderRadius: 24, padding: 32, border: `1px solid ${P.border}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#635BFF15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={24} color="#635BFF" /></div>
                                                <span style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>Stripe Payments</span>
                                            </div>
                                            <InputField type="password" label="API Key" value={integrations.stripe_public} onChange={(v: string) => setIntegrations({ ...integrations, stripe_public: v })} icon={Key} sub="Stripe public key for payments." />
                                        </div>

                                        <div style={{ background: P.bg, borderRadius: 24, padding: 32, border: `1px solid ${P.border}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#10A37F15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={24} color="#10A37F" /></div>
                                                <span style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>AI (OpenAI)</span>
                                            </div>
                                            <SelectField label="AI Model" value={integrations.openai_model} onChange={(v: string) => setIntegrations({ ...integrations, openai_model: v })} icon={Bot} options={[
                                                { value: 'gpt-4o', label: 'GPT-4o (Standard)' }, { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
                                            ]} />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                            <Toggle checked={integrations.sendgrid_active} onChange={(v) => setIntegrations({ ...integrations, sendgrid_active: v })} label="Email (SendGrid)" sub="Enable email sending." />
                                            <Toggle checked={integrations.zoom_active} onChange={(v) => setIntegrations({ ...integrations, zoom_active: v })} label="Video (Zoom)" sub="Enable online classes via Zoom." />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'BILLING' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                        <SelectField label="Currency" value={billing.default_currency} onChange={(v: string) => setBilling({ ...billing, default_currency: v })} icon={DollarSign} options={[
                                            { value: 'INR', label: 'INR (Indian Rupee)' }, { value: 'USD', label: 'USD (US Dollar)' }
                                        ]} />
                                        <InputField type="number" label="Trial Period (Days)" value={billing.trial_days} onChange={(v: string) => setBilling({ ...billing, trial_days: Number(v) })} icon={Calendar} sub="Free trial days for new tenants." />
                                        <InputField type="number" label="Tax Rate (%)" value={billing.tax_rate} onChange={(v: string) => setBilling({ ...billing, tax_rate: Number(v) })} icon={Briefcase} sub="Standard tax rate for invoices." />
                                        <InputField type="text" label="Invoice Prefix" value={billing.invoice_prefix} onChange={(v: string) => setBilling({ ...billing, invoice_prefix: v })} icon={Database} sub="Prefix for all generated invoices." />
                                    </div>
                                )}

                                {activeTab === 'MAINTENANCE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                        <div style={{ padding: 40, borderRadius: 28, background: maintenance.maintenance_mode ? P.errorBg : P.bg, border: `2px solid ${maintenance.maintenance_mode ? P.error : P.border}`, transition: 'all 0.3s' }}>
                                            <Toggle checked={maintenance.maintenance_mode} onChange={(v) => setMaintenance({ ...maintenance, maintenance_mode: v })} label="Maintenance Mode" sub="Turn on maintenance mode for all users." />
                                            {maintenance.maintenance_mode && (
                                                <div style={{ marginTop: 32, animation: 'fadeIn 0.4s' }}>
                                                    <InputField type="text" label="Message" value={maintenance.maintenance_message ?? ''} onChange={(v: string) => setMaintenance({ ...maintenance, maintenance_message: v })} sub="Message users will see during maintenance." />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '32px 48px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                                <button
                                    onClick={() => {
                                        const mapping: Record<SettingsSection, string> = {
                                            'GENERAL': 'general',
                                            'SECURITY': 'security',
                                            'INTEGRATIONS': 'integrations',
                                            'BILLING': 'billing',
                                            'MAINTENANCE': 'maintenance'
                                        };
                                        const valuesMapping: Record<SettingsSection, any> = {
                                            'GENERAL': general,
                                            'SECURITY': security,
                                            'INTEGRATIONS': integrations,
                                            'BILLING': billing,
                                            'MAINTENANCE': maintenance
                                        };
                                        saveSettings(mapping[activeTab], valuesMapping[activeTab]);
                                    }}
                                    disabled={saving}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: 12, 
                                        background: activeTab === 'MAINTENANCE' && maintenance.maintenance_mode ? P.error : P.brand, 
                                        color: '#fff', border: 'none', borderRadius: 16, 
                                        padding: '16px 40px', fontSize: 16, fontWeight: 950, 
                                        cursor: saving ? 'wait' : 'pointer', 
                                        boxShadow: activeTab === 'MAINTENANCE' && maintenance.maintenance_mode ? `0 12px 24px ${P.error}30` : `0 12px 24px ${P.brand}30`,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {saving ? <Loader2 size={20} className="pulse" /> : <Save size={20} />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* FOOTER STATUS */}
            <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: P.card, padding: '12px 24px', borderRadius: 14, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.success }} className="pulse" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>System Status: <span style={{ color: P.success }}>Online</span></span>
                    </div>
                    <div style={{ width: 1, height: 16, background: P.border }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.muted }}>Server: ap-south-1a</span>
                </div>
            </div>
        </div>
    )
}

function Bot(props: any) {
  return <Brain {...props} />
}
