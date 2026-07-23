'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Send, Users, Calendar, Filter, Plus, Trash2, Play, X, CheckCircle,
    AlertCircle, Loader2, RefreshCw, Clock, Mail, MessageCircle, Bell,
    BarChart3, TrendingUp, Globe, Target, Layers, ChevronDown, ChevronRight
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'
import { SideDrawer } from '@/components/owner/SideDrawer'

type Campaign = {
    id: string; name: string; channel: string; status: string
    template_id: string; audience_filter: any; scheduled_at: string | null
    total_recipients: number; sent_count: number; failed_count: number
    created_at: string; sent_at: string | null
}

type Group = {
    id: string; name: string; description: string; filter_config: any
    member_count: number; created_at: string
}

const CHANNEL_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    email:     { label: 'Email',     color: '#2563EB', bg: '#EFF6FF', icon: Mail },
    whatsapp:  { label: 'WhatsApp',  color: '#16A34A', bg: '#F0FDF4', icon: MessageCircle },
    push:      { label: 'Push',      color: '#9333EA', bg: '#F5F3FF', icon: Bell }
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    draft:     { color: '#6B7280', bg: '#F3F4F6' },
    scheduled: { color: '#D97706', bg: '#FFF7ED' },
    sending:   { color: '#2563EB', bg: '#EFF6FF' },
    sent:      { color: '#059669', bg: '#ECFDF5' },
    failed:    { color: '#DC2626', bg: '#FEF2F2' },
    cancelled: { color: '#6B7280', bg: '#F3F4F6' }
}

const AUDIENCE_TARGETS = [
    { key: 'all_tenants', label: 'All Institutes', desc: 'All registered tenant institutions', icon: '🏫' },
    { key: 'all_teachers', label: 'All Teachers', desc: 'All affiliate teachers on the platform', icon: '👨‍🏫' },
    { key: 'all_students', label: 'All Students', desc: 'All registered students', icon: '👨‍🎓' },
]

function Toast({ msg, onClose }: { msg: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`, borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, color: msg.type === 'success' ? '#065F46' : '#991B1B', fontSize: 14, fontWeight: 700, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', minWidth: 300, maxWidth: 440 }}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span style={{ flex: 1 }}>{msg.text}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
        </div>
    )
}

function FieldLabel({ children }: any) {
    return <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{children}</label>
}

function Select({ label, value, onChange, children }: any) {
    return (
        <div style={{ marginBottom: 18 }}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700, background: '#fff' }}>
                {children}
            </select>
        </div>
    )
}

function Input({ label, value, onChange, placeholder = '', type = 'text' }: any) {
    return (
        <div style={{ marginBottom: 18 }}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700, boxSizing: 'border-box' }} />
        </div>
    )
}

export default function MarketingPage() {
    const [tab, setTab] = useState<'campaigns' | 'groups' | 'queue'>('campaigns')
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [stats, setStats] = useState<any>({})
    const [emailTpls, setEmailTpls] = useState<any[]>([])
    const [waTpls, setWaTpls] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [tenants, setTenants] = useState<any[]>([])

    // Campaign drawer
    const [campaignDrawer, setCampaignDrawer] = useState(false)
    const [campaignForm, setCampaignForm] = useState({
        name: '', channel: 'email', template_id: '', audience_filter: { target: 'all_tenants' }, scheduled_at: ''
    })
    const [audiencePreview, setAudiencePreview] = useState<{ count: number; sample: any[] } | null>(null)
    const [previewingAudience, setPreviewingAudience] = useState(false)

    // Group drawer
    const [groupDrawer, setGroupDrawer] = useState(false)
    const [groupForm, setGroupForm] = useState({ name: '', description: '', filter_config: { target: 'all_tenants' } })

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 5000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [mktRes, commRes] = await Promise.all([
                fetch('/api/owner/marketing'),
                fetch('/api/owner/communications')
            ])
            if (mktRes.ok) { 
                const d = await mktRes.json()
                setCampaigns(d.campaigns)
                setGroups(d.groups)
                setStats(d.stats)
                setTenants(d.tenants || [])
            }
            if (commRes.ok) { const d = await commRes.json(); setEmailTpls(d.emailTemplates); setWaTpls(d.waTemplates) }
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const callAPI = async (action: string, payload: any) => {
        const res = await fetch('/api/owner/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) })
        return res.json()
    }

    const previewAudience = async () => {
        setPreviewingAudience(true)
        const d = await callAPI('RESOLVE_AUDIENCE', { filter: campaignForm.audience_filter })
        setAudiencePreview(d)
        setPreviewingAudience(false)
    }

    const createCampaign = async () => {
        setSavingId('creating')
        try {
            const d = await callAPI('CREATE_CAMPAIGN', campaignForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `Campaign "${campaignForm.name}" created with ${d.total_recipients} recipients.`)
            setCampaignDrawer(false)
            fetchData()
        } finally { setSavingId(null) }
    }

    const launchCampaign = async (id: string, name: string) => {
        if (!confirm(`Launch campaign "${name}" now? This will send messages to all recipients immediately.`)) return
        setSavingId(id)
        try {
            const d = await callAPI('LAUNCH_CAMPAIGN', { id })
            if (d.success) showToast('success', `✅ Campaign launched! Sent: ${d.sent}, Failed: ${d.failed} of ${d.total} recipients.`)
            else showToast('error', d.error || 'Launch failed.')
            fetchData()
        } finally { setSavingId(null) }
    }

    const cancelCampaign = async (id: string) => {
        if (!confirm('Cancel this campaign?')) return
        await callAPI('CANCEL_CAMPAIGN', { id })
        fetchData()
    }

    const deleteCampaign = async (id: string) => {
        if (!confirm('Delete this campaign permanently?')) return
        await callAPI('DELETE_CAMPAIGN', { id })
        fetchData()
    }

    const createGroup = async () => {
        setSavingId('group')
        try {
            const d = await callAPI('CREATE_GROUP', groupForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `Group "${groupForm.name}" created.`)
            setGroupDrawer(false)
            fetchData()
        } finally { setSavingId(null) }
    }

    const refreshGroupCount = async (id: string) => {
        setSavingId(id)
        const d = await callAPI('REFRESH_GROUP_COUNT', { id })
        showToast('success', `Group updated: ${d.count} members.`)
        setSavingId(null)
        fetchData()
    }

    const getTemplateOptions = () => {
        if (campaignForm.channel === 'email') return emailTpls
        if (campaignForm.channel === 'whatsapp') return waTpls
        return []
    }

    const renderDeepFilters = (filter: any, setFilter: any) => {
        const target = filter.target || 'all_tenants'

        const updateFilterValue = (key: string, val: any) => {
            setFilter((prev: any) => ({
                ...prev,
                [key]: val === 'all' ? undefined : val
            }))
        }

        return (
            <div style={{ marginTop: 20, padding: 20, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 10, marginBottom: 4 }}>
                    <Filter size={15} color="var(--color-primary)" />
                    <span style={{ fontSize: 11, fontWeight: 900, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deep Filtering Criteria</span>
                </div>

                {/* Common status check (all / true / false) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <FieldLabel>Active Status</FieldLabel>
                        <select 
                            value={filter.is_active !== undefined ? String(filter.is_active) : 'all'} 
                            onChange={e => updateFilterValue('is_active', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                        >
                            <option value="all">All (Active & Suspended)</option>
                            <option value="true">Active Only</option>
                            <option value="false">Suspended Only</option>
                        </select>
                    </div>

                    {target === 'all_tenants' && (
                        <div>
                            <FieldLabel>Institute Type</FieldLabel>
                            <select 
                                value={filter.tenant_type || 'all'} 
                                onChange={e => updateFilterValue('tenant_type', e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                            >
                                <option value="all">All Types</option>
                                <option value="INSTITUTE">Institute / School</option>
                                <option value="PERSONAL_TEACHER">Personal Teacher</option>
                            </select>
                        </div>
                    )}

                    {target === 'all_teachers' && (
                        <div>
                            <FieldLabel>Verification Role</FieldLabel>
                            <select 
                                value={filter.teacher_role || 'all'} 
                                onChange={e => updateFilterValue('teacher_role', e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                            >
                                <option value="all">All status</option>
                                <option value="teacher">Approved Teachers</option>
                                <option value="teacher_pending">Pending Approval</option>
                            </select>
                        </div>
                    )}

                    {target === 'all_students' && (
                        <div>
                            <FieldLabel>Associated Institute</FieldLabel>
                            <select 
                                value={filter.tenant_id || 'all'} 
                                onChange={e => updateFilterValue('tenant_id', e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                            >
                                <option value="all">All Institutes</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {target === 'all_tenants' && (
                    <div>
                        <FieldLabel>Subscription Plan Status</FieldLabel>
                        <select 
                            value={filter.subscription_status || 'all'} 
                            onChange={e => updateFilterValue('subscription_status', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                        >
                            <option value="all">All Plans</option>
                            <option value="active">Active Plan</option>
                            <option value="inactive">Inactive Plan</option>
                            <option value="cancelled">Cancelled Plan</option>
                            <option value="expired">Expired Plan</option>
                        </select>
                    </div>
                )}

                {target === 'all_teachers' && (
                    <div>
                        <FieldLabel>Has Registered Email</FieldLabel>
                        <select 
                            value={filter.has_email || 'all'} 
                            onChange={e => updateFilterValue('has_email', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                        >
                            <option value="all">All</option>
                            <option value="yes">Yes (Email exists)</option>
                            <option value="no">No (Email blank)</option>
                        </select>
                    </div>
                )}

                {target === 'all_students' && (
                    <div>
                        <FieldLabel>Has Contact Phone Number</FieldLabel>
                        <select 
                            value={filter.has_phone || 'all'} 
                            onChange={e => updateFilterValue('has_phone', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                        >
                            <option value="all">All</option>
                            <option value="yes">Yes (Phone exists)</option>
                            <option value="no">No (Phone blank)</option>
                        </select>
                    </div>
                )}
            </div>
        )
    }

    const StatusPill = ({ status }: { status: string }) => {
        const s = STATUS_COLORS[status] || STATUS_COLORS.draft
        return <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
    }

    const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending')

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: P.muted, fontWeight: 700 }}>Loading Marketing Console...</p>
        </div>
    )

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C', boxShadow: '0 0 8px #EA580C' }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Broadcast Marketing</span>
                    </div>
                    <h1 style={{ fontSize: 34, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Marketing Console</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>
                        Send bulk emails, WhatsApp messages & push notifications to tenants, teachers and students.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Refresh
                    </button>
                    <button onClick={() => { setCampaignForm({ name: '', channel: 'email', template_id: '', audience_filter: { target: 'all_tenants' }, scheduled_at: '' }); setAudiencePreview(null); setCampaignDrawer(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,88,12,0.3)' }}>
                        <Plus size={18} strokeWidth={3} /> Create Campaign
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 36 }}>
                <KpiCard icon={BarChart3} title="Total Campaigns" value={String(stats.total || 0)} color="#EA580C" />
                <KpiCard icon={Calendar} title="Scheduled" value={String(stats.scheduled || 0)} color="#D97706" />
                <KpiCard icon={CheckCircle} title="Sent" value={String(stats.sent || 0)} color="#059669" />
                <KpiCard icon={Users} title="Audience Groups" value={String(stats.groups || 0)} color={P.brand} />
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18, padding: 6, marginBottom: 32, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                {(['campaigns', 'groups', 'queue'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === t ? '#EA580C' : 'transparent', color: tab === t ? '#fff' : P.muted, fontSize: 14, fontWeight: 700, boxShadow: tab === t ? '0 6px 20px rgba(234,88,12,0.35)' : 'none', textTransform: 'capitalize' }}>
                        {t === 'campaigns' && <Send size={16} />}
                        {t === 'groups' && <Users size={16} />}
                        {t === 'queue' && <Clock size={16} />}
                        {t === 'campaigns' ? 'All Campaigns' : t === 'groups' ? 'Audience Groups' : 'Scheduled Queue'}
                    </button>
                ))}
            </div>

            {/* ── CAMPAIGNS TAB ── */}
            {tab === 'campaigns' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {campaigns.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 24, border: `1px solid ${P.border}` }}>
                            <Send size={48} color={P.border} style={{ marginBottom: 16 }} />
                            <p style={{ fontWeight: 700, fontSize: 18 }}>No campaigns yet</p>
                            <p style={{ fontSize: 14, marginBottom: 24 }}>Create your first broadcast campaign to reach tenants, teachers and students</p>
                            <button onClick={() => setCampaignDrawer(true)} style={{ background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>Create First Campaign</button>
                        </div>
                    )}
                    {campaigns.map(c => {
                        const ch = CHANNEL_META[c.channel] || CHANNEL_META.email
                        const isLaunching = savingId === c.id
                        const sent = c.sent_count || 0
                        const total = c.total_recipients || 0
                        const pct = total > 0 ? Math.round((sent / total) * 100) : 0
                        return (
                            <div key={c.id} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                <div style={{ padding: '22px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 10, background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ch.icon size={20} color={ch.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 17, color: P.dark }}>{c.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                                    <span style={{ background: ch.bg, color: ch.color, padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{ch.label}</span>
                                                    <StatusPill status={c.status} />
                                                    <span style={{ color: P.muted, fontSize: 12, fontWeight: 600 }}>{c.total_recipients} recipients</span>
                                                </div>
                                            </div>
                                        </div>
                                        {c.status === 'sent' && total > 0 && (
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{ height: 6, background: P.border, borderRadius: 3, overflow: 'hidden', maxWidth: 300 }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: '#059669', borderRadius: 3, transition: 'width 0.3s' }} />
                                                </div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 4 }}>
                                                    {sent}/{total} sent ({pct}%) — {c.failed_count || 0} failed
                                                </div>
                                            </div>
                                        )}
                                        {c.scheduled_at && c.status === 'scheduled' && (
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#D97706', fontWeight: 700 }}>
                                                <Clock size={13} /> Scheduled: {new Date(c.scheduled_at).toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {(c.status === 'draft' || c.status === 'scheduled') && (
                                            <button onClick={() => launchCampaign(c.id, c.name)} disabled={isLaunching}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.3)' }}>
                                                {isLaunching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                                                {isLaunching ? 'Sending...' : 'Launch'}
                                            </button>
                                        )}
                                        {c.status === 'scheduled' && (
                                            <button onClick={() => cancelCampaign(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                <X size={14} /> Cancel
                                            </button>
                                        )}
                                        <button onClick={() => deleteCampaign(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: P.bg, color: P.muted, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── AUDIENCE GROUPS TAB ── */}
            {tab === 'groups' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <button onClick={() => { setGroupForm({ name: '', description: '', filter_config: { target: 'all_tenants' } }); setGroupDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={18} strokeWidth={3} /> Create Group
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {groups.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 24, border: `1px solid ${P.border}` }}>
                                <Users size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 18 }}>No audience groups yet</p>
                                <p style={{ fontSize: 14 }}>Create saved segments to quickly target specific audiences in your campaigns</p>
                            </div>
                        )}
                        {groups.map(g => (
                            <div key={g.id} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 18, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: 16, color: P.dark, marginBottom: 4 }}>{g.name}</div>
                                    {g.description && <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginBottom: 6 }}>{g.description}</div>}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ background: P.brandBg, color: P.brand, padding: '3px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                                            {g.member_count} members
                                        </span>
                                        <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                            Target: {g.filter_config?.target === 'all_tenants' ? 'Institutes' : g.filter_config?.target === 'all_teachers' ? 'Teachers' : 'Students'}
                                            {g.filter_config?.is_active === 'true' && ' (Active only)'}
                                            {g.filter_config?.is_active === 'false' && ' (Suspended only)'}
                                            {g.filter_config?.tenant_type === 'INSTITUTE' && ' [Schools]'}
                                            {g.filter_config?.tenant_type === 'PERSONAL_TEACHER' && ' [Tutors]'}
                                            {g.filter_config?.teacher_role === 'teacher_pending' && ' [Pending]'}
                                            {g.filter_config?.has_email === 'yes' && ' [With Email]'}
                                            {g.filter_config?.has_phone === 'yes' && ' [With Phone]'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => refreshGroupCount(g.id)} disabled={savingId === g.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: P.bg, color: P.brand, border: `1px solid ${P.border}`, borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                        {savingId === g.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
                                        Refresh Count
                                    </button>
                                    <button onClick={async () => { await callAPI('DELETE_GROUP', { id: g.id }); fetchData() }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── SCHEDULED QUEUE TAB ── */}
            {tab === 'queue' && (
                <div>
                    {scheduledCampaigns.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 24, border: `1px solid ${P.border}` }}>
                            <Clock size={48} color={P.border} style={{ marginBottom: 16 }} />
                            <p style={{ fontWeight: 700, fontSize: 18 }}>No campaigns in queue</p>
                            <p style={{ fontSize: 14 }}>Scheduled and in-progress campaigns will appear here</p>
                        </div>
                    )}
                    {scheduledCampaigns.map(c => {
                        const ch = CHANNEL_META[c.channel] || CHANNEL_META.email
                        return (
                            <div key={c.id} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 18, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ch.icon size={22} color={ch.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: 16, color: P.dark }}>{c.name}</div>
                                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginTop: 2 }}>
                                            {c.status === 'sending' ? '🔄 Currently sending...' : `⏰ Scheduled: ${c.scheduled_at ? new Date(c.scheduled_at).toLocaleString('en-IN') : 'Manual'}`}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ background: ch.bg, color: ch.color, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>{c.total_recipients} recipients</span>
                                    {c.status === 'scheduled' && (
                                        <button onClick={() => cancelCampaign(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                            <X size={14} /> Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── CREATE CAMPAIGN DRAWER ── */}
            <SideDrawer isOpen={campaignDrawer} onClose={() => setCampaignDrawer(false)} title="Create Broadcast Campaign" width={680}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Campaign Name" value={campaignForm.name} onChange={(v: string) => setCampaignForm(f => ({ ...f, name: v }))} placeholder="e.g. July Exam Promotion" />

                    {/* Channel */}
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Channel</FieldLabel>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {(['email', 'whatsapp', 'push'] as const).map(ch => {
                                const meta = CHANNEL_META[ch]
                                return (
                                    <button key={ch} onClick={() => setCampaignForm(f => ({ ...f, channel: ch, template_id: '' }))} style={{ flex: 1, padding: '14px 12px', borderRadius: 12, border: `2px solid ${campaignForm.channel === ch ? meta.color : P.border}`, background: campaignForm.channel === ch ? meta.bg : '#fff', color: campaignForm.channel === ch ? meta.color : P.muted, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, justifyContent: 'center' }}>
                                        <meta.icon size={16} /> {meta.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Template */}
                    <Select label="Message Template" value={campaignForm.template_id} onChange={(v: string) => setCampaignForm(f => ({ ...f, template_id: v }))}>
                        <option value="">— Select a template —</option>
                        {getTemplateOptions().map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name || t.template_key}</option>
                        ))}
                    </Select>

                    {/* Audience */}
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Target Audience</FieldLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {AUDIENCE_TARGETS.map(a => (
                                <button key={a.key} onClick={() => { setCampaignForm(f => ({ ...f, audience_filter: { target: a.key } })); setAudiencePreview(null) }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14, border: `2px solid ${campaignForm.audience_filter.target === a.key ? P.brand : P.border}`, background: campaignForm.audience_filter.target === a.key ? P.brandBg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                                    <span style={{ fontSize: 24 }}>{a.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 800, color: P.dark, fontSize: 14 }}>{a.label}</div>
                                        <div style={{ fontSize: 12, color: P.muted }}>{a.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Deep dynamic filters for campaigns */}
                    {renderDeepFilters(campaignForm.audience_filter, (updater: any) => {
                        setCampaignForm(f => {
                            const nextFilter = typeof updater === 'function' ? updater(f.audience_filter) : updater
                            return { ...f, audience_filter: nextFilter }
                        })
                        setAudiencePreview(null)
                    })}

                    {/* Preview audience */}
                    <div style={{ marginBottom: 18 }}>
                        <button onClick={previewAudience} disabled={previewingAudience} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                            {previewingAudience ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Target size={15} color={P.brand} />}
                            Preview Audience Count
                        </button>
                        {audiencePreview && (
                            <div style={{ marginTop: 10, background: P.brandBg, border: `1px solid ${P.brand}30`, borderRadius: 12, padding: '14px 18px' }}>
                                <div style={{ fontWeight: 900, color: P.brand, fontSize: 18, marginBottom: 4 }}>
                                    {audiencePreview.count} recipients
                                </div>
                                {audiencePreview.sample?.length > 0 && (
                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                        Sample: {audiencePreview.sample.map((s: any) => s.name || s.email).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Schedule */}
                    <div style={{ marginBottom: 20 }}>
                        <FieldLabel>Schedule (leave empty to save as draft)</FieldLabel>
                        <input type="datetime-local" value={campaignForm.scheduled_at} onChange={e => setCampaignForm(f => ({ ...f, scheduled_at: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700, boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setCampaignDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={createCampaign} disabled={savingId === 'creating' || !campaignForm.name}
                            style={{ flex: 2, padding: 14, borderRadius: 12, background: '#EA580C', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !campaignForm.name ? 0.5 : 1 }}>
                            {savingId === 'creating' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                            {savingId === 'creating' ? 'Creating...' : 'Create Campaign'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── CREATE GROUP DRAWER ── */}
            <SideDrawer isOpen={groupDrawer} onClose={() => setGroupDrawer(false)} title="Create Audience Group" width={520}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Group Name" value={groupForm.name} onChange={(v: string) => setGroupForm(f => ({ ...f, name: v }))} placeholder="e.g. Premium Institutes" />
                    <Input label="Description (optional)" value={groupForm.description} onChange={(v: string) => setGroupForm(f => ({ ...f, description: v }))} placeholder="e.g. All institutes with active plans" />
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Base Target Audience</FieldLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {AUDIENCE_TARGETS.map(a => (
                                <button key={a.key} onClick={() => setGroupForm(f => ({ ...f, filter_config: { target: a.key } }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `2px solid ${groupForm.filter_config.target === a.key ? P.brand : P.border}`, background: groupForm.filter_config.target === a.key ? P.brandBg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                                    <div style={{ fontWeight: 800, color: P.dark, fontSize: 14 }}>{a.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Deep dynamic filters for groups */}
                    {renderDeepFilters(groupForm.filter_config, (updater: any) => {
                        setGroupForm(f => {
                            const nextFilter = typeof updater === 'function' ? updater(f.filter_config) : updater
                            return { ...f, filter_config: nextFilter }
                        })
                    })}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setGroupDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={createGroup} disabled={savingId === 'group' || !groupForm.name} style={{ flex: 2, padding: 14, borderRadius: 12, background: P.brand, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {savingId === 'group' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={16} />}
                            Create Group
                        </button>
                    </div>
                </div>
            </SideDrawer>
        </div>
    )
}
