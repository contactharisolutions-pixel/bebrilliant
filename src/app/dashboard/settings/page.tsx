'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Settings, Globe, Shield, CreditCard, Palette, UserCircle,
    BellRing, Lock, Save, Loader2, CheckCircle2, XCircle,
    Zap, Share2, UploadCloud, Info, Layout, Fingerprint,
    Cpu, Radio, Eye, CheckCheck, RefreshCcw, ArrowRight,
    MousePointer2, Terminal, History
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ── TYPES ────────────────────────────────────────────────
type TenantData = {
    id: string;
    name: string;
    subdomain: string;
    logo_url: string;
    primary_color: string;
    subscription_plan: string;
    tenant_type?: string;
    type?: string;
    settings: {
        auth?: { allow_registration: boolean, allow_social_login: boolean, mfa_required?: boolean },
        workflows?: { notify_on_login: boolean, auto_archive_exams: boolean },
        domains?: { host: string, status: string }[],
        contact?: { address?: string, email?: string, phone?: string, website?: string }
    };
}
const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.7)'
}
// ── MAIN PAGE ────────────────────────────────────────────
export default function SettingsPage() {
    const [data, setData] = useState<TenantData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    // UI Tabs
    const [activeTab, setActiveTab] = useState('branding')
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/settings')
            const json = await res.json()
            if (res.ok) {
                // Default settings if null
                if (!json.settings) json.settings = {}
                if (!json.settings.auth) json.settings.auth = { allow_registration: true, allow_social_login: false }
                if (!json.settings.workflows) json.settings.workflows = { notify_on_login: true, auto_archive_exams: false }
                setData(json)
            }
        } finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchData() }, [fetchData])
    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/settings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Update failed')
            await fetchData()
            showToast('Settings Saved', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Saving Failed', false)
            return { success: false }
        } finally { setSaving(false) }
    }
    const saveSettings = async () => {
        if (!data) return
        if (activeTab === 'branding') {
            await apiAction('UPDATE_BRANDING', {
                name: data.name,
                logo_url: data.logo_url,
                primary_color: data.primary_color,
                subdomain: data.subdomain,
                contact: data.settings.contact
            })
        } else {
            const section = activeTab === 'security' ? 'auth' : activeTab === 'automation' ? 'workflows' : 'unknown'
            if (section === 'unknown') return
            await apiAction('UPDATE_SETTINGS', {
                section,
                data: data.settings[section as keyof typeof data.settings]
            })
        }
    }
    if (loading || !data) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING SETTINGS...</div>
            </div>
        )
    }
    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? COLORS.success : COLORS.danger) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 20000, animation: 'float 0.3s ease-out' }}>
                    {toast.ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}
            {/* INSTITUTIONAL CONTROL HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Settings size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Settings</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 600, lineHeight: 1.6 }}>
                        Manage your institution's branding, security configurations, and other preferences.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={fetchData} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    <button onClick={saveSettings} disabled={saving} style={{ padding: '14px 28px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px rgba(0,75,147,0.2)', transition: '0.2s' }}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={18} />} Save Changes
                    </button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 48 }}>
                {/* INSTITUTIONAL TABS SIDECAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                     {[
                        { id: 'branding', label: 'Branding', icon: Palette, desc: 'Logos, colors, and display name' },
                        { id: 'security', label: 'Security & Access', icon: Lock, desc: 'Login and authentication rules' },
                        { id: 'automation', label: 'Automation', icon: Zap, desc: 'Automated settings' },
                        { id: 'domains', label: 'Domains', icon: Globe, desc: 'Custom link configuration' },
                    ].map(tab => {
                        const active = activeTab === tab.id
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="settings-tab" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 24, border: `2px solid ${active ? COLORS.primary : 'transparent'}`, background: active ? '#FFF' : 'transparent', color: active ? COLORS.primary : '#475569', cursor: 'pointer', textAlign: 'left', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', boxShadow: active ? '0 10px 30px rgba(0,75,147,0.04)' : 'none' }}>
                                <div style={{ padding: 10, background: active ? COLORS.primaryGradient : '#F1F5F9', borderRadius: 12, color: active ? '#FFF' : '#94A3B8' }}>
                                    <tab.icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 1000, letterSpacing: '-0.01em' }}>{tab.label}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: active ? `${COLORS.primary}90` : '#94A3B8', marginTop: 2, textTransform: 'uppercase' }}>{tab.desc}</div>
                                </div>
                                {active && <ArrowRight size={16} style={{ position: 'absolute', right: 24 }} />}
                            </button>
                        )
                    })}
                </div>
                {/* SETTINGS CONTROL CORE */}
                <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 36, padding: 48, boxShadow: '0 40px 80px rgba(0,0,0,0.02)', position: 'relative' }}>
                    {activeTab === 'branding' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'float 0.3s ease-out' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Institution Branding</h3>
                                    <p style={{ margin: 0, fontSize: 15, color: '#64748B', fontWeight: 600 }}>Update your logo, brand colors, and contact info.</p>
                                </div>
                                <div style={{ padding: '8px 16px', background: `${COLORS.success}10`, color: COLORS.success, borderRadius: 12, fontSize: 12, fontWeight: 900, border: `1px solid ${COLORS.success}20` }}>ACTIVE</div>
                             </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tenant Configuration Type</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#F1F5F9', borderRadius: 18, border: '2px solid #E2E8F0', opacity: 0.8 }}>
                                            <Layout size={18} color="#94A3B8" />
                                            <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>{(data.tenant_type || data.type || 'Standard').replace(/_/g, ' ')}</div>
                                            <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', padding: '4px 8px', background: '#E2E8F0', borderRadius: 8 }}>READ ONLY</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution Name</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#F8FAFC', borderRadius: 18, border: '2px solid #F1F5F9' }}>
                                            <Shield size={18} color="#94A3B8" />
                                            <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: '#0F172A', outline: 'none' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subdomain</label>
                                        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: 18, border: '2px solid #F1F5F9', overflow: 'hidden' }}>
                                            <div style={{ paddingLeft: 20 }}><Globe size={18} color="#94A3B8" /></div>
                                            <input value={data.subdomain || ''} onChange={e => setData({ ...data, subdomain: e.target.value })} style={{ flex: 1, padding: '18px 12px', background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: '#0F172A', outline: 'none' }} />
                                            <div style={{ padding: '0 24px', background: '#E2E8F0', color: '#475569', fontSize: 13, fontWeight: 800, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>.bebrilliant.in</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Color</label>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ position: 'relative', width: 64, height: 60, borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                <input type="color" value={data.primary_color || '#004B93'} onChange={e => setData({ ...data, primary_color: e.target.value })} style={{ position: 'absolute', top: -10, left: -10, width: 100, height: 100, border: 'none', cursor: 'pointer' }} />
                                            </div>
                                            <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 18, border: '2px solid #F1F5F9', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Palette size={16} color="#94A3B8" />
                                                <input value={data.primary_color || '#004B93'} onChange={e => setData({ ...data, primary_color: e.target.value })} style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 14, fontWeight: 1000, color: '#0F172A', outline: 'none', textTransform: 'uppercase' }} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* CONTACT & LOCATION VERTICAL */}
                                    <div style={{ marginTop: 16, paddingTop: 32, borderTop: '1px dashed #E2E8F0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                            <div style={{ width: 4, height: 20, background: COLORS.primary, borderRadius: 10 }} />
                                            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Location Details</h4>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Institutional Address</label>
                                                <textarea 
                                                    value={data.settings.contact?.address || ''} 
                                                    onChange={e => setData({ ...data, settings: { ...data.settings, contact: { ...data.settings.contact, address: e.target.value } } })}
                                                    placeholder="Enter physical address of the institute..."
                                                    style={{ width: '100%', padding: '14px 20px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none', minHeight: 80, resize: 'none' }} 
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Contact Numbers (Multiple)</label>
                                                    <input 
                                                        value={data.settings.contact?.phone || ''} 
                                                        onChange={e => setData({ ...data, settings: { ...data.settings, contact: { ...data.settings.contact, phone: e.target.value } } })}
                                                        placeholder="+91 ..., +91 ..."
                                                        style={{ width: '100%', padding: '14px 20px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }} 
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Official Email</label>
                                                    <input 
                                                        value={data.settings.contact?.email || ''} 
                                                        onChange={e => setData({ ...data, settings: { ...data.settings, contact: { ...data.settings.contact, email: e.target.value } } })}
                                                        placeholder="contact@institute.com"
                                                        style={{ width: '100%', padding: '14px 20px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }} 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Official Website</label>
                                                <input 
                                                    value={data.settings.contact?.website || ''} 
                                                    onChange={e => setData({ ...data, settings: { ...data.settings, contact: { ...data.settings.contact, website: e.target.value } } })}
                                                    placeholder="https://www.institute.com"
                                                    style={{ width: '100%', padding: '14px 20px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                 </div>
                                 <div style={{ background: '#F1F5F930', borderRadius: 28, border: '1px dashed #CBD5E1', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Institution Logo</div>
                                    <input 
                                        type="file" 
                                        id="logo-upload" 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            setSaving(true)
                                            try {
                                                const base64 = await new Promise<string>((resolve, reject) => {
                                                    const reader = new FileReader()
                                                    reader.readAsDataURL(file)
                                                    reader.onload = () => resolve((reader.result as string).split(',')[1])
                                                    reader.onerror = reject
                                                })
                                                const fileName = `${data.id}/logo_${Date.now()}.${file.name.split('.').pop()}`
                                                const res = await fetch('/api/dashboard/settings', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        action: 'UPLOAD_LOGO',
                                                        payload: {
                                                            fileBase64: base64,
                                                            fileName,
                                                            contentType: file.type
                                                        }
                                                    })
                                                })
                                                const json = await res.json()
                                                if (!res.ok) throw new Error(json.error || 'Upload Failed')
                                                setData({ ...data, logo_url: json.url })
                                                showToast('Logo Uploaded Successfully', true)
                                            } catch (err: any) {
                                                showToast(err.message || 'Upload Failed', false)
                                            } finally {
                                                setSaving(false)
                                            }
                                        }}
                                    />
                                    <label 
                                        htmlFor="logo-upload"
                                        style={{ 
                                            width: 140, height: 140, borderRadius: 28, background: '#FFF', padding: 20, 
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: 24, display: 'flex', 
                                            alignItems: 'center', justifyContent: 'center', overflow: 'hidden', 
                                            border: '1px solid #E2E8F0', cursor: 'pointer', transition: '0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {data.logo_url ? (
                                            <img src={data.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                                <UploadCloud size={32} color={COLORS.primary} />
                                                <span style={{ fontSize: 10, fontWeight: 900, color: COLORS.primary }}>UPLOAD LOGO</span>
                                            </div>
                                        )}
                                        {saving && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Loader2 size={24} color={COLORS.primary} className="spin" />
                                            </div>
                                        )}
                                    </label>
                                    <button 
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        style={{ 
                                            width: '100%', padding: '14px 20px', borderRadius: 14, border: '2px solid #F1F5F9', 
                                            background: '#FFF', fontSize: 13, fontWeight: 1000, color: COLORS.primary, 
                                            cursor: 'pointer', textAlign: 'center', transition: '0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                                    >
                                        {data.logo_url ? 'Change Logo' : 'Select Logo'}
                                    </button>
                                    <p style={{ marginTop: 16, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Supports High-Res SVG, PNG, and JPGS.</p>
                                 </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'security' && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'float 0.3s ease-out' }}>
                             <div>
                                <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Security & Access</h3>
                                <p style={{ margin: 0, fontSize: 15, color: '#64748B', fontWeight: 600 }}>Configure student registration and login options.</p>
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {[
                                    { key: 'allow_registration', label: 'Student Self-Registration', icon: MousePointer2, desc: 'Allow students to create accounts from the login page' },
                                    { key: 'allow_social_login', label: 'Social Login (Google/Microsoft)', icon: Fingerprint, desc: 'Allow users to log in with their Google or Microsoft accounts' },
                                    { key: 'mfa_required', label: 'Two-Factor Authentication (2FA)', icon: Shield, desc: 'Require staff to use two-factor authentication for extra security' }
                                ].map(row => (
                                    <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 32px', background: '#F8FAFC', borderRadius: 24, border: '2px solid #F1F5F9' }}>
                                        <div style={{ padding: 12, background: '#FFF', borderRadius: 14, color: COLORS.primary, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                                            <row.icon size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 15, fontWeight: 1000, color: '#1E293B' }}>{row.label}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>{row.desc}</div>
                                        </div>
                                        <label style={{ display: 'inline-block', position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                                            <input type="checkbox" className="toggle-input" style={{ opacity: 0, width: 0, height: 0 }} checked={(data.settings.auth as any)?.[row.key]} onChange={e => {
                                                const newAuth = { ...data.settings.auth, [row.key]: e.target.checked }
                                                setData({ ...data, settings: { ...data.settings, auth: newAuth } } as any)
                                            }} />
                                            <span className="toggle-slider" style={{ position: 'absolute', inset: 0, background: '#E2E8F0', borderRadius: 34, transition: '.4s' }} />
                                            <style>{`.toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }`}</style>
                                        </label>
                                    </div>
                                ))}
                             </div>
                         </div>
                    )}
                    {activeTab === 'automation' && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'float 0.3s ease-out' }}>
                             <div>
                                <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Automation</h3>
                                <p style={{ margin: 0, fontSize: 15, color: '#64748B', fontWeight: 600 }}>Configure automatic notifications and exam actions.</p>
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                 <div style={{ background: `${COLORS.success}08`, border: `2px solid ${COLORS.success}20`, padding: 32, borderRadius: 28 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <BellRing size={20} color={COLORS.success} />
                                        <span style={{ fontSize: 14, fontWeight: 1000, color: '#065F46' }}>Login Notifications</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600, lineHeight: 1.5 }}>Email administrator when new staff logs in.</p>
                                    <button onClick={() => {
                                        const newWork = { ...data.settings.workflows, notify_on_login: !data.settings.workflows?.notify_on_login }
                                        setData({ ...data, settings: { ...data.settings, workflows: newWork } } as any)
                                    }} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 12, border: 'none', background: data.settings.workflows?.notify_on_login ? COLORS.success : '#F1F5F9', color: data.settings.workflows?.notify_on_login ? '#FFF' : '#64748B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                                        {data.settings.workflows?.notify_on_login ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                 </div>
                                 <div style={{ background: `${COLORS.primary}08`, border: `2px solid ${COLORS.primary}20`, padding: 32, borderRadius: 28 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <History size={20} color={COLORS.primary} />
                                        <span style={{ fontSize: 14, fontWeight: 1000, color: COLORS.primary }}>Exam Auto-Archive</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600, lineHeight: 1.5 }}>Automatically archive past exams.</p>
                                    <button onClick={() => {
                                        const newWork = { ...data.settings.workflows, auto_archive_exams: !data.settings.workflows?.auto_archive_exams }
                                        setData({ ...data, settings: { ...data.settings, workflows: newWork } } as any)
                                    }} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 12, border: 'none', background: data.settings.workflows?.auto_archive_exams ? COLORS.primary : '#F1F5F9', color: data.settings.workflows?.auto_archive_exams ? '#FFF' : '#64748B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                                        {data.settings.workflows?.auto_archive_exams ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                 </div>
                             </div>
                         </div>
                    )}
                    {activeTab === 'domains' && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'float 0.3s ease-out' }}>
                             <div>
                                <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Domains</h3>
                                <p style={{ margin: 0, fontSize: 15, color: '#64748B', fontWeight: 600 }}>Manage your custom URLs.</p>
                             </div>
                             <div style={{ background: '#0F172A', borderRadius: 28, padding: 32, color: '#FFF' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Terminal size={18} color={COLORS.success} />
                                        <span style={{ fontSize: 12, fontWeight: 1000, letterSpacing: '0.1em' }}>DNS SETTINGS</span>
                                    </div>
                                    <button style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#FFF', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Add Domain</button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '20px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ width: 12, height: 12, background: COLORS.success, borderRadius: '50%', boxShadow: `0 0 10px ${COLORS.success}` }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 900 }}>{data.subdomain || 'www'}.bebrilliant.in</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 2 }}>Primary Domain</div>
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 1000, color: COLORS.success }}>Secure</div>
                                </div>
                                <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontWeight: 600 }}>Custom domains are available on the Enterprise plan.</p>
                             </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    )
}
