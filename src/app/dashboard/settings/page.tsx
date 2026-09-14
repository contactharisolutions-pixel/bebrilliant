'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
    Settings, Globe, Shield, CreditCard, Palette, UserCircle,
    BellRing, Lock, Save, Loader2, CheckCircle2, XCircle,
    Zap, Share2, UploadCloud, Info, Layout, Fingerprint,
    Cpu, Radio, Eye, CheckCheck, RefreshCcw, ArrowRight,
    MousePointer2, Terminal, History, Building2, Phone, Mail,
    MapPin, Clock, ExternalLink, Copy, Check, Sparkles,
    ShieldCheck, AlertCircle, FileText, Smartphone, Laptop
} from 'lucide-react';

interface BrandingSettings {
    name: string;
    legal_name: string;
    tagline: string;
    logo_url: string;
    favicon_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
}

interface ContactSettings {
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    email: string;
    phone: string;
    alt_phone: string;
    whatsapp: string;
    website: string;
    working_hours: string;
}

interface SecuritySettings {
    allow_registration: boolean;
    allow_teacher_registration: boolean;
    allow_social_login: boolean;
    mfa_required: boolean;
    session_timeout_minutes: number;
    password_policy: string;
    prevent_concurrent_logins: boolean;
}

interface AutomationSettings {
    notify_on_login: boolean;
    notify_on_failed_login: boolean;
    auto_archive_exams: boolean;
    exam_archive_days: number;
    auto_publish_results: boolean;
    fee_due_reminder_days: number;
    attendance_sms_alert: boolean;
    auto_generate_id_cards: boolean;
}

interface DomainSettings {
    subdomain: string;
    custom_domain: string;
    cname_target: string;
    status: string;
    ssl_status: string;
    verification_token: string;
}

interface TenantSettingsData {
    id: string;
    name: string;
    subdomain: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    subscription_plan: string;
    tenant_type: string;
    settings: {
        branding: BrandingSettings;
        contact: ContactSettings;
        security: SecuritySettings;
        automation: AutomationSettings;
        domains: DomainSettings;
        billing?: any;
    };
    completeness_score: number;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'security' | 'automation' | 'domains'>('branding');
    const [data, setData] = useState<TenantSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [copiedDomain, setCopiedDomain] = useState(false);
    const [dnsVerifying, setDnsVerifying] = useState(false);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/settings');
            const json = await res.json();
            if (res.ok) {
                setData(json);
            } else {
                showToast(json.error || 'Failed to fetch settings', false);
            }
        } catch (e: any) {
            showToast('Gateway connection timeout', false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveAll = async () => {
        if (!data) return;
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SAVE_ALL_SETTINGS',
                    payload: data.settings
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to save settings');

            showToast('Institutional configurations saved successfully!', true);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Saving failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyDNS = async () => {
        setDnsVerifying(true);
        try {
            const res = await fetch('/api/dashboard/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'VERIFY_DOMAIN',
                    payload: {
                        custom_domain: data?.settings.domains.custom_domain,
                        subdomain: data?.settings.domains.subdomain
                    }
                })
            });
            const json = await res.json();
            if (res.ok) {
                showToast(json.message || 'Domain DNS verified successfully!', true);
                await fetchData();
            } else {
                showToast(json.error || 'DNS Verification in progress', false);
            }
        } catch {
            showToast('DNS verification lookup timeout', false);
        } finally {
            setDnsVerifying(false);
        }
    };

    const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url') => {
        const file = e.target.files?.[0];
        if (!file || !data) return;
        setSaving(true);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
            });

            const res = await fetch('/api/dashboard/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPLOAD_ASSET',
                    payload: {
                        fileBase64: base64,
                        fileName: file.name,
                        contentType: file.type
                    }
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Upload failed');

            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    settings: {
                        ...prev.settings,
                        branding: {
                            ...prev.settings.branding,
                            [field]: json.url
                        }
                    }
                };
            });
            showToast('Asset uploaded successfully!', true);
        } catch (e: any) {
            showToast(e.message || 'Upload failed', false);
        } finally {
            setSaving(false);
        }
    };

    const copySubdomainUrl = () => {
        if (!data) return;
        navigator.clipboard.writeText(`https://${data.settings.domains.subdomain}.bebrilliant.in`);
        setCopiedDomain(true);
        setTimeout(() => setCopiedDomain(false), 2000);
    };

    if (loading || !data) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
                <Loader2 size={42} className="animate-spin text-[#004B93] mb-4" />
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Synchronizing Institutional Governance Matrix...
                </div>
            </div>
        );
    }

    const { branding, contact, security, automation, domains } = data.settings;

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16">
            {/* Non-blocking Notification Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[20000] px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all ${
                    toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                    {toast.ok ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                    <span className="text-xs font-bold">{toast.msg}</span>
                </div>
            )}

            {/* ART-DIRECTED OPENAI HERO BANNER - FULL WIDTH */}
            <div className="relative w-full bg-slate-950 text-white overflow-hidden border-b border-slate-800">
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
                    <Image
                        src="/assets/images/dashboard/institute_settings_banner.jpg"
                        alt="Institutional Governance Command Center"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />

                <div className="relative z-20 w-full px-6 py-10 sm:px-10 sm:py-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Governance Synchronized
                                </span>
                                <span className="text-xs text-slate-400 font-semibold font-mono">
                                    NODE: {data.subdomain.toUpperCase()} • TIER: {data.subscription_plan}
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                                Institutional Governance & Settings
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-normal">
                                Master institutional controls, multi-tenant domain routing, security auth policies, visual brand tokens, and automated communication triggers.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchData}
                                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition"
                            >
                                <RefreshCcw size={14} /> Refresh
                            </button>
                            <button
                                onClick={handleSaveAll}
                                disabled={saving}
                                className="px-6 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-900/20 transition"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                Save All Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL WIDTH MAIN CONTENT WRAPPER */}
            <div className="w-full px-6 sm:px-10 mt-8 space-y-8">
                {/* 4 EXECUTIVE KPI METRICS (FULL WIDTH) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: Institution Identity */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Institutional Identity</span>
                            <div className="p-2 bg-blue-50 text-[#004B93] rounded-xl">
                                <Building2 size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-slate-900 truncate">
                            {branding.name}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Globe size={13} className="text-[#004B93]" />
                            <span className="font-mono text-slate-700 font-semibold">{domains.subdomain}.bebrilliant.in</span>
                        </div>
                    </div>

                    {/* Card 2: Security Governance */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Access Security Posture</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-slate-900">
                            {security.mfa_required ? 'MFA Enforced' : 'Standard 2FA Ready'}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                            <CheckCircle2 size={13} />
                            <span>{security.allow_social_login ? 'Google Workspace SSO Online' : 'Local Auth Only'}</span>
                        </div>
                    </div>

                    {/* Card 3: Automation Status */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operational Automations</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Zap size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-slate-900">
                            {[automation.notify_on_login, automation.attendance_sms_alert, automation.auto_generate_id_cards, automation.auto_archive_exams].filter(Boolean).length} Rules Active
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Attendance & login alerts enabled</span>
                        </div>
                    </div>

                    {/* Card 4: Domain & SSL */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Domain & SSL Protection</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Lock size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-slate-900">
                            {domains.custom_domain ? 'Custom Route' : 'Wildcard SSL Active'}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <CheckCheck size={13} className="text-emerald-500" />
                            <span>256-Bit SHA-2 Encrypted</span>
                        </div>
                    </div>
                </div>

                {/* TAB NAVIGATION BAR (FULL WIDTH) */}
                <div className="w-full border-b border-slate-200 pb-3 flex flex-wrap items-center gap-2.5">
                    {[
                        { id: 'branding', label: 'Branding & Visual Identity', icon: Palette },
                        { id: 'contact', label: 'Campus, Location & Contact', icon: Building2 },
                        { id: 'security', label: 'Security & Access Governance', icon: Lock },
                        { id: 'automation', label: 'Academic Automation & Workflows', icon: Zap },
                        { id: 'domains', label: 'Custom Domains & DNS Routing', icon: Globe }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-[#004B93] text-white shadow-md shadow-blue-900/15'
                                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                            >
                                <Icon size={15} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT PANELS (FULL WIDTH) */}
                <div className="w-full">
                    {/* ── TAB 1: BRANDING & VISUAL IDENTITY ── */}
                    {activeTab === 'branding' && (
                        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left 2 Cols: Form Fields */}
                            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-lg font-black text-slate-900">Institution Brand Parameters</h3>
                                    <p className="text-xs text-slate-500 font-medium">Customize your school display name, registered identity, and portal branding</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Display School Name</label>
                                        <input
                                            type="text"
                                            value={branding.name}
                                            onChange={e => setData(prev => ({
                                                ...prev!,
                                                settings: {
                                                    ...prev!.settings,
                                                    branding: { ...prev!.settings.branding, name: e.target.value }
                                                }
                                            }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Registered Legal Entity</label>
                                        <input
                                            type="text"
                                            value={branding.legal_name}
                                            onChange={e => setData(prev => ({
                                                ...prev!,
                                                settings: {
                                                    ...prev!.settings,
                                                    branding: { ...prev!.settings.branding, legal_name: e.target.value }
                                                }
                                            }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Motto / Institutional Tagline</label>
                                        <input
                                            type="text"
                                            value={branding.tagline}
                                            onChange={e => setData(prev => ({
                                                ...prev!,
                                                settings: {
                                                    ...prev!.settings,
                                                    branding: { ...prev!.settings.branding, tagline: e.target.value }
                                                }
                                            }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    {/* Subdomain Router */}
                                    <div className="sm:col-span-2">
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Cloud Portal Subdomain</label>
                                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="pl-4 pr-2 text-slate-400 font-mono text-xs">https://</div>
                                            <input
                                                type="text"
                                                value={domains.subdomain}
                                                onChange={e => setData(prev => ({
                                                    ...prev!,
                                                    settings: {
                                                        ...prev!.settings,
                                                        domains: { ...prev!.settings.domains, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }
                                                    }
                                                }))}
                                                className="flex-1 py-2.5 bg-transparent font-mono font-bold text-slate-900 focus:outline-none text-xs"
                                            />
                                            <div className="px-4 py-2.5 bg-slate-200 text-slate-700 font-mono text-xs font-bold border-l border-slate-300">
                                                .bebrilliant.in
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Colors Grid */}
                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <Palette size={14} className="text-[#004B93]" /> Color Palette Tokens
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Primary Brand Color', key: 'primary_color', val: branding.primary_color },
                                            { label: 'Secondary Theme', key: 'secondary_color', val: branding.secondary_color },
                                            { label: 'Accent / Highlight', key: 'accent_color', val: branding.accent_color }
                                        ].map((clr, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                                <span className="text-[11px] font-bold text-slate-500 block">{clr.label}</span>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={clr.val || '#004B93'}
                                                        onChange={e => setData(prev => ({
                                                            ...prev!,
                                                            settings: {
                                                                ...prev!.settings,
                                                                branding: { ...prev!.settings.branding, [clr.key]: e.target.value }
                                                            }
                                                        }))}
                                                        className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={clr.val || '#004B93'}
                                                        onChange={e => setData(prev => ({
                                                            ...prev!,
                                                            settings: {
                                                                ...prev!.settings,
                                                                branding: { ...prev!.settings.branding, [clr.key]: e.target.value }
                                                            }
                                                        }))}
                                                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Logo & Visual Preview Card */}
                            <div className="space-y-6">
                                {/* Logo Upload Box */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Institutional Crest & Logo</div>
                                    <div className="relative w-36 h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-3 overflow-hidden shadow-inner">
                                        {branding.logo_url ? (
                                            <img
                                                src={branding.logo_url}
                                                alt="Institutional Crest"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-slate-400">
                                                <UploadCloud size={32} />
                                                <span className="text-[10px] font-bold uppercase">No Logo</span>
                                            </div>
                                        )}
                                    </div>

                                    <label className="cursor-pointer w-full">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleUploadAsset(e, 'logo_url')}
                                            className="hidden"
                                        />
                                        <div className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#004B93] text-xs font-black rounded-xl transition flex items-center justify-center gap-2">
                                            <UploadCloud size={14} /> Upload Institutional Crest
                                        </div>
                                    </label>
                                    <p className="text-[10px] text-slate-400 font-medium">Supports SVG, PNG, and JPG (max 5MB). High-resolution transparent background recommended.</p>
                                </div>

                                {/* Live Component Preview */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Live Brand Palette Preview</div>
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm"
                                                style={{ backgroundColor: branding.primary_color || '#004B93' }}
                                            >
                                                {branding.name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-900">{branding.name}</div>
                                                <div className="text-[10px] text-slate-500">{branding.tagline}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="flex-1 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-sm"
                                                style={{ backgroundColor: branding.primary_color || '#004B93' }}
                                            >
                                                Primary CTA
                                            </button>
                                            <button
                                                className="flex-1 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-sm"
                                                style={{ backgroundColor: branding.secondary_color || '#10B981' }}
                                            >
                                                Secondary
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: CAMPUS & CONTACT ── */}
                    {activeTab === 'contact' && (
                        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black text-slate-900">Campus Location & Institutional Communications</h3>
                                <p className="text-xs text-slate-500 font-medium">Official addresses and contact points printed on examination papers, invoices, and certificates</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                                <div className="lg:col-span-3">
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Street & Campus Address</label>
                                    <textarea
                                        rows={2}
                                        value={contact.address}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, address: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">City / Municipality</label>
                                    <input
                                        type="text"
                                        value={contact.city}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, city: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">State / Province</label>
                                    <input
                                        type="text"
                                        value={contact.state}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, state: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Postal PIN Code</label>
                                    <input
                                        type="text"
                                        value={contact.pincode}
                                        maxLength={6}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, pincode: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Reception Helpline Phone</label>
                                    <input
                                        type="text"
                                        value={contact.phone}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, phone: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">WhatsApp Support Number</label>
                                    <input
                                        type="text"
                                        value={contact.whatsapp}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, whatsapp: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Official Inquiries Email</label>
                                    <input
                                        type="email"
                                        value={contact.email}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, email: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Official Campus Website</label>
                                    <input
                                        type="url"
                                        value={contact.website}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, website: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Operating Hours & Days</label>
                                    <input
                                        type="text"
                                        value={contact.working_hours}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                contact: { ...prev!.settings.contact, working_hours: e.target.value }
                                            }
                                        }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 3: SECURITY & GOVERNANCE ── */}
                    {activeTab === 'security' && (
                        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black text-slate-900">Access Control & Security Governance</h3>
                                <p className="text-xs text-slate-500 font-medium">Protect institutional data, restrict registration pathways, and enforce authentication protocols</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        key: 'allow_registration',
                                        label: 'Student Self-Registration',
                                        desc: 'Allow students to create accounts from your dedicated portal login page',
                                        icon: UserCircle
                                    },
                                    {
                                        key: 'allow_teacher_registration',
                                        label: 'Faculty Self-Registration',
                                        desc: 'Allow teachers to self-register (recommended: keep disabled for admin-controlled onboarding)',
                                        icon: Shield
                                    },
                                    {
                                        key: 'allow_social_login',
                                        label: 'Enterprise Social SSO (Google Workspace & Microsoft)',
                                        desc: 'Permit 1-click single sign-on using institutional Google or Microsoft accounts',
                                        icon: Fingerprint
                                    },
                                    {
                                        key: 'mfa_required',
                                        label: 'Mandatory Multi-Factor Authentication (2FA)',
                                        desc: 'Require all administrative and faculty accounts to verify via 2FA authenticator apps',
                                        icon: Lock
                                    },
                                    {
                                        key: 'prevent_concurrent_logins',
                                        label: 'Prevent Concurrent Device Sessions',
                                        desc: 'Automatically sign out older sessions when a user logs in from a new machine or browser',
                                        icon: Laptop
                                    }
                                ].map(item => {
                                    const Icon = item.icon;
                                    const isChecked = (security as any)[item.key];
                                    return (
                                        <div
                                            key={item.key}
                                            className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-white rounded-xl text-[#004B93] shadow-sm">
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-xs">{item.label}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">{item.desc}</div>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => setData(prev => ({
                                                    ...prev!,
                                                    settings: {
                                                        ...prev!.settings,
                                                        security: { ...prev!.settings.security, [item.key]: e.target.checked }
                                                    }
                                                }))}
                                                className="w-5 h-5 rounded text-[#004B93] focus:ring-0 cursor-pointer"
                                            />
                                        </div>
                                    );
                                })}

                                {/* Session Timeout Selector */}
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white rounded-xl text-[#004B93] shadow-sm">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-xs">Idle Session Expiration</div>
                                            <div className="text-[11px] text-slate-500 font-medium">Automatically log out inactive faculty and admin users</div>
                                        </div>
                                    </div>
                                    <select
                                        value={security.session_timeout_minutes}
                                        onChange={e => setData(prev => ({
                                            ...prev!,
                                            settings: {
                                                ...prev!.settings,
                                                security: { ...prev!.settings.security, session_timeout_minutes: Number(e.target.value) }
                                            }
                                        }))}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                    >
                                        <option value={15}>15 Minutes</option>
                                        <option value={30}>30 Minutes</option>
                                        <option value={60}>1 Hour (Standard)</option>
                                        <option value={240}>4 Hours</option>
                                        <option value={480}>8 Hours</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 4: ACADEMIC AUTOMATION & WORKFLOWS ── */}
                    {activeTab === 'automation' && (
                        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black text-slate-900">Academic Lifecycle Automation</h3>
                                <p className="text-xs text-slate-500 font-medium">Trigger automated background tasks, fee alerts, attendance reports, and exam lifecycle events</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    {
                                        key: 'notify_on_login',
                                        title: 'Staff Login Notifications',
                                        desc: 'Send an email alert to the IT administrator when new teachers log in from an unfamiliar IP address',
                                        icon: BellRing,
                                        color: '#004B93'
                                    },
                                    {
                                        key: 'attendance_sms_alert',
                                        title: 'Daily Attendance Parent Broadcast',
                                        desc: 'Automatically dispatch WhatsApp/SMS alerts to guardians when a student is marked absent',
                                        icon: Smartphone,
                                        color: '#10B981'
                                    },
                                    {
                                        key: 'auto_generate_id_cards',
                                        title: 'Instant Student ID Card Provisioning',
                                        desc: 'Auto-generate printable QR-coded student identity cards immediately upon admission verification',
                                        icon: CreditCard,
                                        color: '#F59E0B'
                                    },
                                    {
                                        key: 'auto_archive_exams',
                                        title: 'Examination Paper Lifecycle Auto-Archive',
                                        desc: 'Automatically archive completed evaluations and online test submissions after 60 days',
                                        icon: History,
                                        color: '#8B5CF6'
                                    }
                                ].map((wf, idx) => {
                                    const Icon = wf.icon;
                                    const isEnabled = (automation as any)[wf.key];
                                    return (
                                        <div key={idx} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-white shadow-sm" style={{ color: wf.color }}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900">{wf.title}</h4>
                                                </div>
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{wf.desc}</p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Automation Status</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setData(prev => ({
                                                        ...prev!,
                                                        settings: {
                                                            ...prev!.settings,
                                                            automation: { ...prev!.settings.automation, [wf.key]: !isEnabled }
                                                        }
                                                    }))}
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                                                        isEnabled
                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                    }`}
                                                >
                                                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── TAB 5: CUSTOM DOMAINS & DNS ROUTING ── */}
                    {activeTab === 'domains' && (
                        <div className="w-full space-y-6">
                            {/* Primary Domain Router Card */}
                            <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-lg font-black text-slate-900">Custom Domains & DNS White-Labeling</h3>
                                    <p className="text-xs text-slate-500 font-medium">Bind your institution's custom official website URL (e.g. portal.silverbells.edu.in) directly to BeBrilliant cloud infrastructure</p>
                                </div>

                                {/* Active Subdomain Box */}
                                <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Default Cloud Route (Active)</div>
                                            <div className="text-base font-mono font-black text-white">https://{domains.subdomain}.bebrilliant.in</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={copySubdomainUrl}
                                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                                        >
                                            {copiedDomain ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                            {copiedDomain ? 'Copied' : 'Copy URL'}
                                        </button>
                                        <a
                                            href={`https://${domains.subdomain}.bebrilliant.in`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm"
                                        >
                                            <ExternalLink size={14} /> Open Portal
                                        </a>
                                    </div>
                                </div>

                                {/* Custom Domain Binding Input */}
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Bind Custom Domain (FQDN)</label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="text"
                                                value={domains.custom_domain}
                                                onChange={e => setData(prev => ({
                                                    ...prev!,
                                                    settings: {
                                                        ...prev!.settings,
                                                        domains: { ...prev!.settings.domains, custom_domain: e.target.value.toLowerCase().trim() }
                                                    }
                                                }))}
                                                placeholder="e.g. portal.silverbells.edu.in"
                                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                            />
                                            <button
                                                onClick={handleVerifyDNS}
                                                disabled={dnsVerifying || !domains.custom_domain}
                                                className="px-6 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                                            >
                                                {dnsVerifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                                Verify DNS Propagation
                                            </button>
                                        </div>
                                    </div>

                                    {/* DNS Records Table */}
                                    <div className="space-y-2 pt-2">
                                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Required DNS Records (at your domain registrar)</div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                                                    <tr>
                                                        <th className="p-3">Type</th>
                                                        <th className="p-3">Host / Name</th>
                                                        <th className="p-3">Target Value</th>
                                                        <th className="p-3">TTL</th>
                                                        <th className="p-3 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-mono">
                                                    <tr>
                                                        <td className="p-3 font-bold text-slate-900">CNAME</td>
                                                        <td className="p-3 text-slate-600">{domains.custom_domain ? domains.custom_domain.split('.')[0] : 'portal'}</td>
                                                        <td className="p-3 font-bold text-[#004B93]">cname.bebrilliant.in</td>
                                                        <td className="p-3 text-slate-500">Auto (3600)</td>
                                                        <td className="p-3 text-right font-sans">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">CONFIGURED</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-3 font-bold text-slate-900">TXT</td>
                                                        <td className="p-3 text-slate-600">_bebrilliant-challenge</td>
                                                        <td className="p-3 text-slate-500 truncate max-w-xs">{domains.verification_token}</td>
                                                        <td className="p-3 text-slate-500">Auto</td>
                                                        <td className="p-3 text-right font-sans">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">VERIFIED</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
