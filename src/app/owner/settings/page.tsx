'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Settings as SettingsIcon, Shield, CreditCard, Save, RefreshCw,
    Loader2, CheckCircle, AlertTriangle, XCircle, Moon, Sun, Globe,
    Briefcase, Key, Mail, Video, Lock, Clock, ShieldAlert,
    Terminal, Building2, Paintbrush, Database, Brain, Calendar, DollarSign,
    Zap, Cpu, Globe2, Fingerprint, Server, Layout, ShieldCheck
} from 'lucide-react';
import { P, SHADOWS } from '@/styles/tokens';
import { createClient } from '@/lib/supabase/client';


type SettingsSection = 'GENERAL' | 'SECURITY' | 'INTEGRATIONS' | 'BILLING' | 'MAINTENANCE';

// ── CUSTOMIZED STYLE TOKENS ──
const CARD_BG = '#FEFEFE';

// ── COMPONENTS ──
function Toggle({ checked, onChange, label, sub }: { checked: boolean, onChange: (v: boolean) => void, label: string, sub?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: CARD_BG, border: `1px solid ${P.border}`, borderRadius: 16, boxShadow: SHADOWS.sm }}>
            <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>{label}</div>
                {sub && <div style={{ fontSize: 12, color: P.muted, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
            </div>
            <button onClick={() => onChange(!checked)}
                style={{ width: 50, height: 26, borderRadius: 99, background: checked ? P.success : '#D1D5DB', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, left: checked ? 28 : 4, transition: 'all 0.3s cubic-bezier(0.3, 0, 0.2, 1)', boxShadow: SHADOWS.sm }} />
            </button>
        </div>
    );
}

function InputField({ label, value, onChange, type = 'text', sub, disabled = false, icon: Icon }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={16} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />}
                <input
                    type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                    className="focus-ring"
                    style={{ width: '100%', padding: '12px 16px', paddingLeft: Icon ? 44 : 16, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: disabled ? P.muted : P.dark, background: disabled ? P.bg : '#fff', outline: 'none', boxSizing: 'border-box', fontWeight: 650, transition: 'all 0.2s' }}
                />
            </div>
            {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, sub, icon: Icon }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={16} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />}
                <select
                    value={value} onChange={e => onChange(e.target.value)}
                    className="focus-ring"
                    style={{ width: '100%', padding: '12px 16px', paddingLeft: Icon ? 44 : 16, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, color: P.dark, background: '#fff', outline: 'none', boxSizing: 'border-box', appearance: 'none', fontWeight: 650, cursor: 'pointer' }}
                >
                    {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
            {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
        </div>
    );
}

export default function GlobalSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsSection>('GENERAL');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    // Password change states
    const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
    const [pwdSaving, setPwdSaving] = useState(false);

    const handleChangePassword = async () => {
        if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
            return showToast('Please fill all password fields.', false);
        }
        if (pwdForm.new !== pwdForm.confirm) {
            return showToast('New password confirmation does not match.', false);
        }
        if (pwdForm.new.length < 8) {
            return showToast('New password must be at least 8 characters long.', false);
        }

        setPwdSaving(true);
        try {
            const supabase = createClient();
            
            // 1. Get current logged in user details
            const { data: { user }, error: userErr } = await supabase.auth.getUser();
            if (userErr || !user || !user.email) {
                throw new Error('Failed to retrieve user session details.');
            }

            // 2. Re-authenticate by signing in with email and old password
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: pwdForm.old
            });

            if (signInErr) {
                throw new Error('Incorrect current password.');
            }

            // 3. Update to the new password
            const { error: updateErr } = await supabase.auth.updateUser({
                password: pwdForm.new
            });

            if (updateErr) {
                throw new Error(updateErr.message || 'Password update failed.');
            }

            showToast('Administrative password updated successfully.');
            setPwdForm({ old: '', new: '', confirm: '' });
        } catch (e: any) {
            showToast(e.message || 'An error occurred.', false);
        } finally {
            setPwdSaving(false);
        }
    };

    // Initialized states matching the new schema
    const [general, setGeneral] = useState({ platform_name: '', support_email: '', timezone: 'Asia/Kolkata' });
    const [security, setSecurity] = useState({ require_2fa_admins: false, session_timeout_mins: 60, max_login_attempts: 5, password_policy: 'medium' });
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
    });
    const [billing, setBilling] = useState({ default_currency: 'INR', trial_days: 14, tax_rate: 18, invoice_prefix: 'BB-' });
    const [maintenance, setMaintenance] = useState({ maintenance_mode: false, maintenance_message: 'System is undergoing scheduled maintenance.' });

    const [testStatuses, setTestStatuses] = useState<Record<string, { state: 'idle' | 'testing' | 'success' | 'failed'; msg: string }>>({
        razorpay: { state: 'idle', msg: '' },
        smtp: { state: 'idle', msg: '' },
        twilio: { state: 'idle', msg: '' }
    });

    const runConnectionTest = async (type: 'razorpay' | 'smtp' | 'twilio') => {
        setTestStatuses(prev => ({ ...prev, [type]: { state: 'testing', msg: 'Verifying credentials connection...' } }));
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
            };

            const res = await fetch('/api/owner/settings/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, payload })
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setTestStatuses(prev => ({ ...prev, [type]: { state: 'success', msg: json.message || 'Verification success' } }));
            } else {
                setTestStatuses(prev => ({ ...prev, [type]: { state: 'failed', msg: json.message || 'Verification rejected.' } }));
            }
        } catch (e: any) {
            setTestStatuses(prev => ({ ...prev, [type]: { state: 'failed', msg: 'Network desynchronization.' } }));
        }
    };

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/owner/settings');
            const json = await res.json();
            if (Array.isArray(json)) {
                json.forEach((item: any) => {
                    if (item.key === 'general') setGeneral(p => ({ ...p, ...item.value }));
                    if (item.key === 'security') setSecurity(p => ({ ...p, ...item.value }));
                    if (item.key === 'integrations') setIntegrations(p => ({ ...p, ...item.value }));
                    if (item.key === 'billing') setBilling(p => ({ ...p, ...item.value }));
                    if (item.key === 'maintenance') setMaintenance(p => ({ ...p, ...item.value }));
                });
            }
        } catch (e) {
            showToast('Sync failure', false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async (sectionKey: string, value: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/owner/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: sectionKey, value })
            });
            if (res.ok) {
                showToast('Ecosystem architecture committed successfully');
                fetchSettings();
            } else {
                showToast('Failed to deploy logic settings', false);
            }
        } catch (e) {
            showToast('Save transmission error', false);
        } finally {
            setSaving(false);
        }
    };

    // Removed Users & Permissions (RBAC) Tab entry per instructions
    const TABS = [
        { id: 'GENERAL', icon: Globe2, label: 'General' },
        { id: 'SECURITY', icon: Fingerprint, label: 'Security' },
        { id: 'INTEGRATIONS', icon: Cpu, label: 'Integrations' },
        { id: 'BILLING', icon: CreditCard, label: 'Billing' },
        { id: 'MAINTENANCE', icon: Server, label: 'Maintenance' },
    ] as const;

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px', position: 'relative', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .focus-ring:focus-within { border-color: ${P.brand} !important; box-shadow: 0 0 0 3px ${P.brand}15 !important; }
                .tab-active { background: ${P.brandBg} !important; color: ${P.brand} !important; font-weight: 700 !important; }
                .tab-inactive:hover { background: ${P.hover}; color: ${P.dark}; }
            `}</style>

            {/* TOAST PANEL */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 12, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: SHADOWS.lg, zIndex: 9999 }}>
                    {toast.ok ? <CheckCircle size={18} color={P.success} /> : <XCircle size={18} color={P.error} />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: P.brandBg, color: P.brand, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Configurations</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: '-0.5px' }}>General Settings</div>
                    <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Manage global platform names, security variables, integrations, and server maintenance states.</div>
                </div>
                <button onClick={fetchSettings} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: P.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={14} color={P.brand} /> Sync Settings
                </button>
            </div>

            {/* CONTENT DIVISION GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-start' }}>
                
                {/* VERTICAL NAV TABS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 10 }}>
                    {TABS.map(t => (
                        <button key={t.id} 
                            onClick={() => setActiveTab(t.id)}
                            className={activeTab === t.id ? 'tab-active' : 'tab-inactive'}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                background: 'transparent', border: 'none',
                                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                color: activeTab === t.id ? P.brand : P.muted, transition: 'all 0.2s', fontWeight: 600, fontSize: 13
                            }}>
                            <t.icon size={16} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* MAIN CONFIGURATION CARD */}
                <div style={{ position: 'relative' }}>
                    {loading ? (
                        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 700, marginTop: 16 }}>Retrieving platform variables...</div>
                        </div>
                    ) : (
                        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: SHADOWS.sm }}>
                            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, background: P.bg }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {(() => {
                                        const tab = TABS.find(t => t.id === activeTab);
                                        if (!tab) return null;
                                        const Icon = tab.icon;
                                        return <Icon size={20} color={P.brand} />;
                                    })()}
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: P.dark, margin: 0 }}>{TABS.find(t => t.id === activeTab)?.label} Settings</h2>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '32px' }}>
                                {activeTab === 'GENERAL' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <InputField label="Platform Name" value={general.platform_name} onChange={(v: string) => setGeneral({ ...general, platform_name: v })} icon={Layout} sub="Brand name of the master portal." />
                                        <InputField label="Support Center Email" value={general.support_email} onChange={(v: string) => setGeneral({ ...general, support_email: v })} icon={Mail} sub="Support inbox visible to institutional tenants." />
                                        <SelectField label="System Timezone" value={general.timezone} onChange={(v: string) => setGeneral({ ...general, timezone: v })} icon={Clock} options={[
                                            { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' }, { value: 'UTC', label: 'UTC Universal Time' }, { value: 'America/New_York', label: 'US Eastern Standard Time' }
                                        ]} />
                                    </div>
                                )}

                                {activeTab === 'SECURITY' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <Toggle checked={security.require_2fa_admins} onChange={(v) => setSecurity({ ...security, require_2fa_admins: v })} label="Require Two-Factor Verification for Staff" sub="Require verification code checks for administrative staff logins." />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                            <InputField type="number" label="Max Failed Login Attempts" value={security.max_login_attempts} onChange={(v: string) => setSecurity({ ...security, max_login_attempts: Number(v) })} icon={ShieldAlert} sub="Limit before locking security locks." />
                                            <InputField type="number" label="Idle Session Timeout (Minutes)" value={security.session_timeout_mins} onChange={(v: string) => setSecurity({ ...security, session_timeout_mins: Number(v) })} icon={Clock} sub="Duration of inactive session persistence." />
                                            <SelectField label="Password Complexity Rules" value={security.password_policy} onChange={(v: string) => setSecurity({ ...security, password_policy: v })} icon={Lock} options={[
                                                { value: 'weak', label: 'Weak (8 Characters minimum)' }, { value: 'medium', label: 'Standard Strong complexity' }, { value: 'strict', label: 'Strict Special character bounds' }
                                            ]} />
                                        </div>

                                        {/* CHANGE PASSWORD COMPONENT */}
                                        <div style={{ borderTop: `1px dashed ${P.border}`, paddingTop: 28, marginTop: 10 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 900, color: P.dark, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Key size={18} color={P.brand} /> Change Administrative Password
                                            </h3>
                                            <p style={{ fontSize: 12, color: P.muted, margin: '0 0 20px', fontWeight: 600 }}>Update your login credentials. You must confirm your old password first.</p>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                                                <InputField type="password" label="Old Password" value={pwdForm.old} onChange={(v: string) => setPwdForm({ ...pwdForm, old: v })} icon={Lock} />
                                                <InputField type="password" label="New Password" value={pwdForm.new} onChange={(v: string) => setPwdForm({ ...pwdForm, new: v })} icon={Lock} />
                                                <InputField type="password" label="Confirm New Password" value={pwdForm.confirm} onChange={(v: string) => setPwdForm({ ...pwdForm, confirm: v })} icon={Lock} />
                                            </div>

                                            <button onClick={handleChangePassword} disabled={pwdSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: pwdSaving ? 'not-allowed' : 'pointer' }}>
                                                {pwdSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={15} />} Update Password
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'INTEGRATIONS' && (
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                                         {/* Razorpay Gateway */}
                                         <div style={{ background: P.bg, borderRadius: 16, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                             <div style={{ padding: 20, borderBottom: '1px solid ' + P.border, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                     <CreditCard size={18} color={P.brand} />
                                                     <span style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>Razorpay Payment Gateway Keys</span>
                                                 </div>
                                                 {/* Environment Switcher */}
                                                 <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: 3 }}>
                                                     {[
                                                         { key: 'test', label: 'Test Mode' },
                                                         { key: 'live', label: 'Live Mode' }
                                                     ].map(env => (
                                                         <button key={env.key} type="button" onClick={() => setIntegrations({ ...integrations, razorpay_env: env.key })} style={{
                                                             padding: '6px 12px', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                                             background: integrations.razorpay_env === env.key ? P.card : 'transparent',
                                                             color: integrations.razorpay_env === env.key ? P.brand : P.muted,
                                                             transition: 'all 0.15s'
                                                         }}>{env.label}</button>
                                                     ))}
                                                 </div>
                                             </div>
                                             <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                 {/* Test Credentials Fields */}
                                                 <div style={{ borderBottom: '1px solid ' + P.border, paddingBottom: 16 }}>
                                                     <div style={{ fontSize: 12, fontWeight: 800, color: P.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                         <span style={{ width: 6, height: 6, borderRadius: '50%', background: integrations.razorpay_env === 'test' ? P.success : P.muted }} />
                                                         Test Environment Keys
                                                     </div>
                                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                         <InputField type="text" label="Razorpay Test Key ID" value={integrations.razorpay_test_key_id} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_test_key_id: v })} icon={Key} placeholder="rzp_test_..." />
                                                         <InputField type="password" label="Razorpay Test Key Secret" value={integrations.razorpay_test_key_secret} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_test_key_secret: v })} icon={Lock} />
                                                     </div>
                                                 </div>
                                                 {/* Live Credentials Fields */}
                                                 <div>
                                                     <div style={{ fontSize: 12, fontWeight: 800, color: P.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                         <span style={{ width: 6, height: 6, borderRadius: '50%', background: integrations.razorpay_env === 'live' ? P.success : P.muted }} />
                                                         Live Production Keys
                                                     </div>
                                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                         <InputField type="text" label="Razorpay Live Key ID" value={integrations.razorpay_live_key_id} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_live_key_id: v })} icon={Key} placeholder="rzp_live_..." />
                                                         <InputField type="password" label="Razorpay Live Key Secret" value={integrations.razorpay_live_key_secret} onChange={(v: string) => setIntegrations({ ...integrations, razorpay_live_key_secret: v })} icon={Lock} />
                                                     </div>
                                                 </div>
                                             </div>
                                             {/* Card Footer test verified status */}
                                             <div style={{ padding: '12px 20px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                     {testStatuses.razorpay.state === 'testing' && <Loader2 size={14} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />}
                                                     <span style={{
                                                         fontSize: 12, fontWeight: 700,
                                                         color: testStatuses.razorpay.state === 'success' ? P.success : testStatuses.razorpay.state === 'failed' ? P.error : P.muted
                                                     }}>
                                                         {testStatuses.razorpay.state === 'idle' ? 'Status: Connection untested' : testStatuses.razorpay.msg}
                                                     </span>
                                                 </div>
                                                 <button type="button" onClick={() => runConnectionTest('razorpay')} style={{ padding: '6px 12px', background: P.brandBg, border: 'none', borderRadius: 8, color: P.brand, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                     Test connection
                                                 </button>
                                             </div>
                                         </div>

                                         {/* Custom SMTP */}
                                         <div style={{ background: P.bg, borderRadius: 16, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                             <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                     <Mail size={18} color={P.brand} />
                                                     <span style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>Custom Email SMTP Sender Setup</span>
                                                 </div>
                                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                     <InputField type="text" label="SMTP Host Server" value={integrations.smtp_host} onChange={(v: string) => setIntegrations({ ...integrations, smtp_host: v })} icon={Globe} sub="Mail server address (e.g. smtp.gmail.com)" />
                                                     <InputField type="number" label="SMTP Port" value={integrations.smtp_port} onChange={(v: string) => setIntegrations({ ...integrations, smtp_port: Number(v) })} icon={SettingsIcon} sub="Connection port (587 standard, 465 SSL)" />
                                                     <InputField type="text" label="SMTP Username" value={integrations.smtp_user} onChange={(v: string) => setIntegrations({ ...integrations, smtp_user: v })} icon={Key} sub="Username or API user identifier." />
                                                     <InputField type="password" label="SMTP Password" value={integrations.smtp_pass} onChange={(v: string) => setIntegrations({ ...integrations, smtp_pass: v })} icon={Lock} sub="Secret SMTP sender credentials." />
                                                 </div>
                                                 <div>
                                                     <InputField type="text" label="Authorized From Email" value={integrations.smtp_from} onChange={(v: string) => setIntegrations({ ...integrations, smtp_from: v })} icon={Mail} sub="Verified sender email address." />
                                                 </div>
                                             </div>
                                             {/* Card Footer test verified status */}
                                             <div style={{ padding: '12px 20px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                     {testStatuses.smtp.state === 'testing' && <Loader2 size={14} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />}
                                                     <span style={{
                                                         fontSize: 12, fontWeight: 700,
                                                         color: testStatuses.smtp.state === 'success' ? P.success : testStatuses.smtp.state === 'failed' ? P.error : P.muted
                                                     }}>
                                                         {testStatuses.smtp.state === 'idle' ? 'Status: Connection untested' : testStatuses.smtp.msg}
                                                     </span>
                                                 </div>
                                                 <button type="button" onClick={() => runConnectionTest('smtp')} style={{ padding: '6px 12px', background: P.brandBg, border: 'none', borderRadius: 8, color: P.brand, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                     Test connection
                                                 </button>
                                             </div>
                                         </div>

                                         {/* Twilio Integration */}
                                         <div style={{ background: P.bg, borderRadius: 16, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                             <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                     <Zap size={18} color={P.brand} />
                                                     <span style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>Twilio Integration for WhatsApp</span>
                                                 </div>
                                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                     <InputField type="text" label="Twilio Account SID" value={integrations.twilio_sid} onChange={(v: string) => setIntegrations({ ...integrations, twilio_sid: v })} icon={Key} sub="Main account identifier key." />
                                                     <InputField type="password" label="Twilio Auth Token" value={integrations.twilio_token} onChange={(v: string) => setIntegrations({ ...integrations, twilio_token: v })} icon={Lock} sub="Authorization webhook token." />
                                                 </div>
                                                 <div>
                                                     <InputField type="text" label="Twilio WhatsApp Phone Number" value={integrations.twilio_whatsapp_number} onChange={(v: string) => setIntegrations({ ...integrations, twilio_whatsapp_number: v })} icon={Globe} sub="Must match twilio sender: whatsapp:+14155238886" />
                                                 </div>
                                             </div>
                                             {/* Card Footer test verified status */}
                                             <div style={{ padding: '12px 20px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                     {testStatuses.twilio.state === 'testing' && <Loader2 size={14} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />}
                                                     <span style={{
                                                         fontSize: 12, fontWeight: 700,
                                                         color: testStatuses.twilio.state === 'success' ? P.success : testStatuses.twilio.state === 'failed' ? P.error : P.muted
                                                     }}>
                                                         {testStatuses.twilio.state === 'idle' ? 'Status: Connection untested' : testStatuses.twilio.msg}
                                                     </span>
                                                 </div>
                                                 <button type="button" onClick={() => runConnectionTest('twilio')} style={{ padding: '6px 12px', background: P.brandBg, border: 'none', borderRadius: 8, color: P.brand, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                     Test connection
                                                 </button>
                                             </div>
                                         </div>

                                         {/* OpenAI Engine */}
                                         <div style={{ background: P.bg, borderRadius: 16, padding: 20, border: `1px solid ${P.border}` }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                                 <Brain size={18} color="#10A37F" />
                                                 <span style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>OpenAI Engine Model</span>
                                             </div>
                                             <SelectField label="Standard LLM Engine" value={integrations.openai_model} onChange={(v: string) => setIntegrations({ ...integrations, openai_model: v })} icon={Brain} options={[
                                                 { value: 'gpt-4o', label: 'GPT-4o (Default Recommended)' }, { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Legacy)' }
                                             ]} />
                                         </div>

                                         {/* Firebase FCM Integration */}
                                         <div style={{ background: P.bg, borderRadius: 16, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                             <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                     <Server size={18} color="#FFCA28" />
                                                     <span style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>Firebase FCM Push Notifications</span>
                                                 </div>
                                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                     <InputField type="password" label="Firebase Server Key" value={integrations.firebase_server_key} onChange={(v: string) => setIntegrations({ ...integrations, firebase_server_key: v })} icon={Lock} sub="Legacy Server Key or Service Account Private Key." />
                                                     <InputField type="text" label="Firebase Sender ID" value={integrations.firebase_sender_id} onChange={(v: string) => setIntegrations({ ...integrations, firebase_sender_id: v })} icon={Key} sub="FCM Sender identifier value." />
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                )}

                                {activeTab === 'BILLING' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <SelectField label="Ecosystem Primary Currency" value={billing.default_currency} onChange={(v: string) => setBilling({ ...billing, default_currency: v })} icon={DollarSign} options={[
                                            { value: 'INR', label: 'INR (Indian Rupee - ₹)' }, { value: 'USD', label: 'USD (US Dollar - $)' }
                                        ]} />
                                        <InputField type="number" label="Trial Limit Interval (Days)" value={billing.trial_days} onChange={(v: string) => setBilling({ ...billing, trial_days: Number(v) })} icon={Calendar} sub="Standard trial period before deactivation." />
                                        <InputField type="number" label="Standard Tax Surcharge (%)" value={billing.tax_rate} onChange={(v: string) => setBilling({ ...billing, tax_rate: Number(v) })} icon={Briefcase} sub="Tax applied to invoices (GST 18% standard)." />
                                        <InputField type="text" label="Invoice Unique Prefix" value={billing.invoice_prefix} onChange={(v: string) => setBilling({ ...billing, invoice_prefix: v })} icon={Database} sub="Prefix for invoice generation numbering." />
                                    </div>
                                )}

                                {activeTab === 'MAINTENANCE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {maintenance.maintenance_mode && (
                                            <div style={{ background: P.errorBg, border: `1px solid ${P.error}30`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10, color: P.error, fontSize: 13, fontWeight: 700 }}>
                                                <AlertTriangle size={16} />
                                                <span>CRITICAL WARNING: Maintenance mode is active. Tenants will see the maintenance screen.</span>
                                            </div>
                                        )}
                                        <div style={{ padding: 20, borderRadius: 16, background: P.bg, border: `1px solid ${P.border}` }}>
                                            <Toggle checked={maintenance.maintenance_mode} onChange={(v) => setMaintenance({ ...maintenance, maintenance_mode: v })} label="Lock Maintenance Access" sub="Put BeBrilliant platform into maintenance status." />
                                            {maintenance.maintenance_mode && (
                                                <div style={{ marginTop: 20 }}>
                                                    <InputField type="text" label="Broadcast Maintenance Message" value={maintenance.maintenance_message ?? ''} onChange={(v: string) => setMaintenance({ ...maintenance, maintenance_message: v })} sub="Displayed on client screen during lockouts." />
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
                                        display: 'flex', alignItems: 'center', gap: 8, 
                                        background: activeTab === 'MAINTENANCE' && maintenance.maintenance_mode ? P.error : P.brand, 
                                        color: '#fff', border: 'none', borderRadius: 10, 
                                        padding: '12px 24px', fontSize: 14, fontWeight: 700, 
                                        cursor: saving ? 'wait' : 'pointer', 
                                        boxShadow: activeTab === 'MAINTENANCE' && maintenance.maintenance_mode ? `0 8px 16px ${P.error}25` : `0 8px 16px ${P.brand}25`,
                                        transition: 'all 0.2s', outline: 'none'
                                    }}
                                >
                                    {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                    {saving ? 'Synchronizing...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* SYSTEM HEARBEAT FOOTER */}
            <div style={{ marginTop: 44, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: P.card, padding: '10px 20px', borderRadius: 12, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success, animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>System Status: <span style={{ color: P.success }}>Online</span></span>
                    </div>
                    <div style={{ width: 1, height: 12, background: P.border }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>Server Cluster: ap-south-1a</span>
                </div>
            </div>
        </div>
    );
}
