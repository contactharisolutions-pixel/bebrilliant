'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Send, Users, Calendar, Filter, Plus, Trash2, Play, X, CheckCircle,
    AlertCircle, Loader2, RefreshCw, Clock, Mail, MessageCircle, Bell,
    BarChart3, Target, Search, Eye, Check, ShieldAlert, FileText, ChevronRight
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

type Campaign = {
    id: string; name: string; channel: string; status: string
    template_id: string; message_subject?: string; message_body?: string
    audience_filter: any; group_id: string | null; scheduled_at: string | null
    total_recipients: number; sent_count: number; failed_count: number
    created_at: string; sent_at: string | null
}

type Group = {
    id: string; name: string; description: string; filter_config: any
    member_count: number; created_at: string
}

type LogItem = {
    id: string; campaign_id: string; recipient_email: string; recipient_phone: string
    status: string; sent_at: string; error: string | null
}

const CHANNEL_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    email:     { label: 'Email',     color: '#2563EB', bg: '#EFF6FF', icon: Mail },
    whatsapp:  { label: 'WhatsApp',  color: '#16A34A', bg: '#F0FDF4', icon: MessageCircle },
    push:      { label: 'Push Notification', color: '#9333EA', bg: '#F5F3FF', icon: Bell }
}

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
    draft:     { label: 'Draft',     color: '#6B7280', bg: '#F3F4F6' },
    scheduled: { label: 'Scheduled', color: '#D97706', bg: '#FFF7ED' },
    sending:   { label: 'Sending...', color: '#2563EB', bg: '#EFF6FF' },
    sent:      { label: 'Sent',      color: '#059669', bg: '#ECFDF5' },
    failed:    { label: 'Failed',    color: '#DC2626', bg: '#FEF2F2' },
    cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' }
}

const AUDIENCE_TARGETS = [
    { key: 'all_tenants', label: 'All Institutes', desc: 'All registered schools & institutes', icon: '🏫' },
    { key: 'all_teachers', label: 'All Teachers', desc: 'All registered teachers', icon: '👨‍🏫' },
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

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [channelFilter, setChannelFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    // Campaign drawer
    const [campaignDrawer, setCampaignDrawer] = useState(false)
    const [campaignForm, setCampaignForm] = useState({
        name: '', 
        channel: 'email', 
        template_id: '', 
        message_subject: '',
        message_body: '',
        use_custom_content: false,
        group_id: '',
        audience_filter: { target: 'all_tenants' }, 
        scheduled_at: ''
    })
    const [audiencePreview, setAudiencePreview] = useState<{ count: number; sample: any[] } | null>(null)
    const [previewingAudience, setPreviewingAudience] = useState(false)

    // Group drawer
    const [groupDrawer, setGroupDrawer] = useState(false)
    const [groupForm, setGroupForm] = useState({ name: '', description: '', filter_config: { target: 'all_tenants' } })

    // Logs drawer
    const [logsDrawer, setLogsDrawer] = useState(false)
    const [selectedCampaignForLogs, setSelectedCampaignForLogs] = useState<Campaign | null>(null)
    const [campaignLogs, setCampaignLogs] = useState<LogItem[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)

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
                setCampaigns(d.campaigns || [])
                setGroups(d.groups || [])
                setStats(d.stats || {})
                setTenants(d.tenants || [])
            }
            if (commRes.ok) { 
                const d = await commRes.json()
                setEmailTpls(d.emailTemplates || [])
                setWaTpls(d.waTemplates || [])
            }
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const callAPI = async (action: string, payload: any) => {
        const res = await fetch('/api/owner/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) })
        return res.json()
    }

    const previewAudience = async (filterOverride?: any) => {
        setPreviewingAudience(true)
        const filterToUse = filterOverride || (campaignForm.group_id ? { group_id: campaignForm.group_id } : campaignForm.audience_filter)
        const d = await callAPI('RESOLVE_AUDIENCE', { filter: filterToUse })
        setAudiencePreview(d)
        setPreviewingAudience(false)
    }

    const createCampaign = async (andLaunch = false) => {
        if (!campaignForm.name) {
            showToast('error', 'Please enter a campaign name.')
            return
        }
        setSavingId('creating')
        try {
            const payload = {
                name: campaignForm.name,
                channel: campaignForm.channel,
                template_id: campaignForm.use_custom_content ? null : campaignForm.template_id,
                message_subject: campaignForm.message_subject,
                message_body: campaignForm.message_body,
                group_id: campaignForm.group_id || null,
                audience_filter: campaignForm.group_id ? { group_id: campaignForm.group_id } : campaignForm.audience_filter,
                scheduled_at: campaignForm.scheduled_at || null
            }
            const d = await callAPI('CREATE_CAMPAIGN', payload)
            if (d.error) { showToast('error', d.error); return }

            showToast('success', `Campaign "${campaignForm.name}" created with ${d.total_recipients} recipients.`)
            setCampaignDrawer(false)

            if (andLaunch && d.id) {
                await launchCampaign(d.id, d.name)
            } else {
                fetchData()
            }
        } finally { setSavingId(null) }
    }

    const launchCampaign = async (id: string, name: string) => {
        if (!confirm(`Launch campaign "${name}" now? This will send messages to all targeted recipients immediately.`)) return
        setSavingId(id)
        try {
            const d = await callAPI('LAUNCH_CAMPAIGN', { id })
            if (d.success) showToast('success', `Campaign launched successfully! Sent: ${d.sent}, Failed: ${d.failed} of ${d.total} recipients.`)
            else showToast('error', d.error || 'Launch failed.')
            fetchData()
        } finally { setSavingId(null) }
    }

    const viewLogs = async (campaign: Campaign) => {
        setSelectedCampaignForLogs(campaign)
        setLogsDrawer(true)
        setLoadingLogs(true)
        try {
            const d = await callAPI('GET_CAMPAIGN_LOGS', { id: campaign.id })
            setCampaignLogs(d.logs || [])
        } finally {
            setLoadingLogs(false)
        }
    }

    const cancelCampaign = async (id: string) => {
        if (!confirm('Cancel this scheduled campaign?')) return
        await callAPI('CANCEL_CAMPAIGN', { id })
        showToast('success', 'Campaign cancelled.')
        fetchData()
    }

    const deleteCampaign = async (id: string) => {
        if (!confirm('Delete this campaign permanently?')) return
        await callAPI('DELETE_CAMPAIGN', { id })
        showToast('success', 'Campaign deleted.')
        fetchData()
    }

    const createGroup = async () => {
        if (!groupForm.name) {
            showToast('error', 'Please enter a group name.')
            return
        }
        setSavingId('group')
        try {
            const d = await callAPI('CREATE_GROUP', groupForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `Audience group "${groupForm.name}" created with ${d.member_count} members.`)
            setGroupDrawer(false)
            fetchData()
        } finally { setSavingId(null) }
    }

    const refreshGroupCount = async (id: string) => {
        setSavingId(id)
        const d = await callAPI('REFRESH_GROUP_COUNT', { id })
        showToast('success', `Group member count updated: ${d.count} members.`)
        setSavingId(null)
        fetchData()
    }

    const openCampaignWithGroup = (group: Group) => {
        setCampaignForm({
            name: `Campaign for ${group.name}`,
            channel: 'email',
            template_id: '',
            message_subject: '',
            message_body: '',
            use_custom_content: false,
            group_id: group.id,
            audience_filter: group.filter_config || { target: 'all_tenants' },
            scheduled_at: ''
        })
        setAudiencePreview(null)
        setCampaignDrawer(true)
    }

    const getTemplateOptions = () => {
        if (campaignForm.channel === 'email') return emailTpls
        if (campaignForm.channel === 'whatsapp') return waTpls
        return []
    }

    const renderAudienceFilters = (filter: any, setFilter: any) => {
        const target = filter.target || 'all_tenants'

        const updateFilterValue = (key: string, val: any) => {
            setFilter((prev: any) => ({
                ...prev,
                [key]: val === 'all' ? undefined : val
            }))
        }

        return (
            <div style={{ marginTop: 16, padding: 18, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                    <Filter size={14} color="#EA580C" />
                    <span style={{ fontSize: 11, fontWeight: 900, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience Filters</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <FieldLabel>Status</FieldLabel>
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
                                <option value="INSTITUTE">School / Institute</option>
                                <option value="PERSONAL_TEACHER">Private Tutor</option>
                            </select>
                        </div>
                    )}

                    {target === 'all_teachers' && (
                        <div>
                            <FieldLabel>Teacher Approval</FieldLabel>
                            <select 
                                value={filter.teacher_role || 'all'} 
                                onChange={e => updateFilterValue('teacher_role', e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                            >
                                <option value="all">All Teachers</option>
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

                {target === 'all_teachers' && (
                    <div>
                        <FieldLabel>Email Filter</FieldLabel>
                        <select 
                            value={filter.has_email || 'all'} 
                            onChange={e => updateFilterValue('has_email', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                        >
                            <option value="all">All</option>
                            <option value="yes">With Email Only</option>
                            <option value="no">Without Email Only</option>
                        </select>
                    </div>
                )}

                {target === 'all_students' && (
                    <div>
                        <FieldLabel>Phone Filter</FieldLabel>
                        <select 
                            value={filter.has_phone || 'all'} 
                            onChange={e => updateFilterValue('has_phone', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, fontWeight: 700, outline: 'none', background: '#fff' }}
                        >
                            <option value="all">All</option>
                            <option value="yes">With Phone Number Only</option>
                            <option value="no">Without Phone Number Only</option>
                        </select>
                    </div>
                )}
            </div>
        )
    }

    const StatusPill = ({ status }: { status: string }) => {
        const s = STATUS_COLORS[status] || STATUS_COLORS.draft
        return <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
    }

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesChannel = channelFilter === 'all' || c.channel === channelFilter
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter
        return matchesSearch && matchesChannel && matchesStatus
    })

    const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending')

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: P.muted, fontWeight: 700 }}>Loading Bulk Messages...</p>
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
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Communication & Marketing</span>
                    </div>
                    <h1 style={{ fontSize: 34, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Bulk Messages</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>
                        Send bulk email, WhatsApp, and push notifications to institutes, teachers, and students.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Refresh
                    </button>
                    <button onClick={() => { setGroupForm({ name: '', description: '', filter_config: { target: 'all_tenants' } }); setGroupDrawer(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <Users size={16} color="#EA580C" /> Create Group
                    </button>
                    <button onClick={() => { setCampaignForm({ name: '', channel: 'email', template_id: '', message_subject: '', message_body: '', use_custom_content: false, group_id: '', audience_filter: { target: 'all_tenants' }, scheduled_at: '' }); setAudiencePreview(null); setCampaignDrawer(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,88,12,0.3)' }}>
                        <Plus size={18} strokeWidth={3} /> Create Campaign
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 36 }}>
                <KpiCard icon={BarChart3} title="Total Campaigns" value={String(stats.total || 0)} color="#EA580C" />
                <KpiCard icon={Clock} title="Scheduled Messages" value={String(stats.scheduled || 0)} color="#D97706" />
                <KpiCard icon={CheckCircle} title="Sent Successfully" value={String(stats.sent || 0)} color="#059669" />
                <KpiCard icon={Users} title="Audience Groups" value={String(stats.groups || 0)} color={P.brand} />
            </div>

            {/* MAIN NAVIGATION TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18, padding: 6, marginBottom: 28, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                {(['campaigns', 'groups', 'queue'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === t ? '#EA580C' : 'transparent', color: tab === t ? '#fff' : P.muted, fontSize: 14, fontWeight: 700, boxShadow: tab === t ? '0 6px 20px rgba(234,88,12,0.35)' : 'none' }}>
                        {t === 'campaigns' && <Send size={16} />}
                        {t === 'groups' && <Users size={16} />}
                        {t === 'queue' && <Clock size={16} />}
                        {t === 'campaigns' ? `All Campaigns (${campaigns.length})` : t === 'groups' ? `Audience Groups (${groups.length})` : `Scheduled Queue (${scheduledCampaigns.length})`}
                    </button>
                ))}
            </div>

            {/* ── CAMPAIGNS TAB ── */}
            {tab === 'campaigns' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* SEARCH & FILTERS */}
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '14px 20px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                            <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                placeholder="Search campaigns by name..." 
                                style={{ width: '100%', paddingLeft: 42, paddingRight: searchQuery ? 36 : 14, paddingTop: 9, paddingBottom: 9, border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, outline: 'none', background: P.bg, boxSizing: 'border-box' }} 
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                    <X size={14} color={P.muted} />
                                </button>
                            )}
                        </div>

                        {/* Channel Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>Channel:</span>
                            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${P.border}`, borderRadius: 9, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                <option value="all">All Channels</option>
                                <option value="email">Email</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="push">Push Notification</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>Status:</span>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${P.border}`, borderRadius: 9, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                <option value="all">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="sending">Sending</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {filteredCampaigns.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 24, border: `1px solid ${P.border}` }}>
                            <Send size={48} color={P.border} style={{ marginBottom: 16 }} />
                            <p style={{ fontWeight: 700, fontSize: 18, color: P.dark }}>No campaigns found</p>
                            <p style={{ fontSize: 14, marginBottom: 24 }}>{searchQuery ? 'Try adjusting your search query or filters' : 'Create your first campaign to send bulk messages'}</p>
                            <button onClick={() => setCampaignDrawer(true)} style={{ background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>Create Campaign</button>
                        </div>
                    )}

                    {filteredCampaigns.map(c => {
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
                                            <div style={{ width: 42, height: 42, borderRadius: 12, background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ch.icon size={22} color={ch.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 17, color: P.dark }}>{c.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                    <span style={{ background: ch.bg, color: ch.color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{ch.label}</span>
                                                    <StatusPill status={c.status} />
                                                    <span style={{ color: P.muted, fontSize: 12, fontWeight: 600 }}>{c.total_recipients} recipients</span>
                                                </div>
                                            </div>
                                        </div>

                                        {c.status === 'sent' && total > 0 && (
                                            <div style={{ marginTop: 10 }}>
                                                <div style={{ height: 6, background: P.border, borderRadius: 3, overflow: 'hidden', maxWidth: 320 }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: '#059669', borderRadius: 3 }} />
                                                </div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4 }}>
                                                    Sent: {sent}/{total} ({pct}%) • Failed: {c.failed_count || 0}
                                                </div>
                                            </div>
                                        )}

                                        {c.scheduled_at && c.status === 'scheduled' && (
                                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#D97706', fontWeight: 700 }}>
                                                <Clock size={13} /> Scheduled for: {new Date(c.scheduled_at).toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                        {(c.status === 'draft' || c.status === 'scheduled') && (
                                            <button onClick={() => launchCampaign(c.id, c.name)} disabled={isLaunching}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.3)' }}>
                                                {isLaunching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                                                {isLaunching ? 'Sending...' : 'Launch Now'}
                                            </button>
                                        )}

                                        {c.status === 'sent' && (
                                            <button onClick={() => viewLogs(c)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: P.brandBg, color: P.brand, border: `1px solid ${P.brand}30`, borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                                <Eye size={14} /> View Delivery Logs
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
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,88,12,0.3)' }}>
                            <Plus size={18} strokeWidth={3} /> Create Group
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {groups.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 24, border: `1px solid ${P.border}` }}>
                                <Users size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 18, color: P.dark }}>No audience groups yet</p>
                                <p style={{ fontSize: 14 }}>Create saved audience groups to quickly send targeted messages</p>
                            </div>
                        )}
                        {groups.map(g => (
                            <div key={g.id} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 18, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: 16, color: P.dark, marginBottom: 4 }}>{g.name}</div>
                                    {g.description && <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginBottom: 8 }}>{g.description}</div>}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <span style={{ background: P.brandBg, color: P.brand, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                                            {g.member_count} members
                                        </span>
                                        <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                            Target: {g.filter_config?.target === 'all_tenants' ? 'Institutes' : g.filter_config?.target === 'all_teachers' ? 'Teachers' : 'Students'}
                                            {g.filter_config?.is_active === 'true' && ' • Active only'}
                                            {g.filter_config?.is_active === 'false' && ' • Suspended only'}
                                            {g.filter_config?.tenant_type === 'INSTITUTE' && ' • Schools'}
                                            {g.filter_config?.teacher_role === 'teacher_pending' && ' • Pending'}
                                            {g.filter_config?.has_email === 'yes' && ' • With Email'}
                                            {g.filter_config?.has_phone === 'yes' && ' • With Phone'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <button onClick={() => openCampaignWithGroup(g)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.25)' }}>
                                        <Send size={14} /> Send Message
                                    </button>
                                    <button onClick={() => refreshGroupCount(g.id)} disabled={savingId === g.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
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
                            <p style={{ fontWeight: 700, fontSize: 18, color: P.dark }}>No campaigns in queue</p>
                            <p style={{ fontSize: 14 }}>Scheduled and sending campaigns will appear here</p>
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
                                            {c.status === 'sending' ? '🔄 Currently sending...' : `⏰ Scheduled for: ${c.scheduled_at ? new Date(c.scheduled_at).toLocaleString('en-IN') : 'Manual launch'}`}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ background: ch.bg, color: ch.color, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>{c.total_recipients} recipients</span>
                                    {c.status === 'scheduled' && (
                                        <button onClick={() => launchCampaign(c.id, c.name)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                            <Play size={14} /> Launch Now
                                        </button>
                                    )}
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
            <SideDrawer isOpen={campaignDrawer} onClose={() => setCampaignDrawer(false)} title="Create Bulk Message Campaign" width={680}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Campaign Name" value={campaignForm.name} onChange={(v: string) => setCampaignForm(f => ({ ...f, name: v }))} placeholder="e.g. July Examination Announcement" />

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

                    {/* Template vs Custom message selection */}
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Message Content Mode</FieldLabel>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setCampaignForm(f => ({ ...f, use_custom_content: false }))}
                                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${!campaignForm.use_custom_content ? P.brand : P.border}`, background: !campaignForm.use_custom_content ? P.brandBg : '#fff', color: !campaignForm.use_custom_content ? P.brand : P.dark, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Saved Template
                            </button>
                            <button onClick={() => setCampaignForm(f => ({ ...f, use_custom_content: true }))}
                                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${campaignForm.use_custom_content ? P.brand : P.border}`, background: campaignForm.use_custom_content ? P.brandBg : '#fff', color: campaignForm.use_custom_content ? P.brand : P.dark, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Custom Text Message
                            </button>
                        </div>
                    </div>

                    {!campaignForm.use_custom_content ? (
                        <Select label="Select Message Template" value={campaignForm.template_id} onChange={(v: string) => setCampaignForm(f => ({ ...f, template_id: v }))}>
                            <option value="">— Choose template from database —</option>
                            {getTemplateOptions().map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name || t.template_key}</option>
                            ))}
                        </Select>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                            {campaignForm.channel === 'email' && (
                                <Input label="Email Subject" value={campaignForm.message_subject} onChange={(v: string) => setCampaignForm(f => ({ ...f, message_subject: v }))} placeholder="e.g. Important Update Regarding Your Account" />
                            )}
                            <div>
                                <FieldLabel>Message Text / HTML Body</FieldLabel>
                                <textarea value={campaignForm.message_body} onChange={e => setCampaignForm(f => ({ ...f, message_body: e.target.value }))} placeholder="Enter your message here... Use {name} for recipient name." style={{ width: '100%', minHeight: 110, padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 600, fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                    )}

                    {/* Saved Group selection vs Base Target */}
                    {groups.length > 0 && (
                        <Select label="Target Saved Audience Group (Optional)" value={campaignForm.group_id || ''} onChange={(v: string) => { setCampaignForm(f => ({ ...f, group_id: v })); setAudiencePreview(null) }}>
                            <option value="">— Select from Saved Groups (or pick target below) —</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name} ({g.member_count} members)</option>
                            ))}
                        </Select>
                    )}

                    {/* Target Audience */}
                    {!campaignForm.group_id && (
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
                    )}

                    {!campaignForm.group_id && renderAudienceFilters(campaignForm.audience_filter, (updater: any) => {
                        setCampaignForm(f => {
                            const nextFilter = typeof updater === 'function' ? updater(f.audience_filter) : updater
                            return { ...f, audience_filter: nextFilter }
                        })
                        setAudiencePreview(null)
                    })}

                    {/* Preview audience */}
                    <div style={{ marginTop: 20, marginBottom: 20 }}>
                        <button onClick={() => previewAudience()} disabled={previewingAudience} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                            {previewingAudience ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Target size={15} color="#EA580C" />}
                            Preview Recipient Count
                        </button>
                        {audiencePreview && (
                            <div style={{ marginTop: 12, background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 14, padding: '16px 20px' }}>
                                <div style={{ fontWeight: 900, color: '#EA580C', fontSize: 18, marginBottom: 4 }}>
                                    {audiencePreview.count} recipients targeted
                                </div>
                                {audiencePreview.sample?.length > 0 && (
                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                        Sample: {audiencePreview.sample.map((s: any) => s.name || s.email || s.phone).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Schedule */}
                    <div style={{ marginBottom: 24 }}>
                        <FieldLabel>Scheduled Date & Time (Optional — leave empty to send immediately or save as draft)</FieldLabel>
                        <input type="datetime-local" value={campaignForm.scheduled_at} onChange={e => setCampaignForm(f => ({ ...f, scheduled_at: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700, boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setCampaignDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={() => createCampaign(false)} disabled={savingId === 'creating' || !campaignForm.name}
                            style={{ flex: 1.2, padding: 14, borderRadius: 12, background: P.card, border: `1.5px solid ${P.border}`, color: P.dark, fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: !campaignForm.name ? 0.5 : 1 }}>
                            Save Draft
                        </button>
                        <button onClick={() => createCampaign(true)} disabled={savingId === 'creating' || !campaignForm.name}
                            style={{ flex: 1.5, padding: 14, borderRadius: 12, background: '#EA580C', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(234,88,12,0.3)', opacity: !campaignForm.name ? 0.5 : 1 }}>
                            {savingId === 'creating' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                            {savingId === 'creating' ? 'Creating...' : 'Create & Launch'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── LOGS DRAWER ── */}
            <SideDrawer isOpen={logsDrawer} onClose={() => setLogsDrawer(false)} title={`Delivery Logs: ${selectedCampaignForLogs?.name || ''}`} width={620}>
                <div style={{ padding: '28px 32px' }}>
                    {selectedCampaignForLogs && (
                        <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Recipients</div>
                                <div style={{ fontSize: 20, fontWeight: 950, color: P.dark, marginTop: 2 }}>{selectedCampaignForLogs.total_recipients}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Delivered</div>
                                <div style={{ fontSize: 20, fontWeight: 950, color: '#059669', marginTop: 2 }}>{selectedCampaignForLogs.sent_count}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Failed</div>
                                <div style={{ fontSize: 20, fontWeight: 950, color: '#DC2626', marginTop: 2 }}>{selectedCampaignForLogs.failed_count}</div>
                            </div>
                        </div>
                    )}

                    {loadingLogs ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : campaignLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, color: P.muted }}>
                            <FileText size={40} color={P.border} style={{ marginBottom: 12 }} />
                            <p style={{ fontWeight: 700 }}>No delivery log entries found</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {campaignLogs.map(log => (
                                <div key={log.id} style={{ padding: '14px 18px', background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: P.dark }}>
                                            {log.recipient_email || log.recipient_phone || 'Recipient'}
                                        </div>
                                        {log.error && (
                                            <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginTop: 2 }}>
                                                Error: {log.error}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ background: log.status === 'sent' ? '#ECFDF5' : '#FEF2F2', color: log.status === 'sent' ? '#059669' : '#DC2626', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                            {log.status === 'sent' ? 'Delivered' : 'Failed'}
                                        </span>
                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 4 }}>
                                            {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SideDrawer>

            {/* ── CREATE GROUP DRAWER ── */}
            <SideDrawer isOpen={groupDrawer} onClose={() => setGroupDrawer(false)} title="Create Audience Group" width={520}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Group Name" value={groupForm.name} onChange={(v: string) => setGroupForm(f => ({ ...f, name: v }))} placeholder="e.g. Premium Institutes" />
                    <Input label="Description (Optional)" value={groupForm.description} onChange={(v: string) => setGroupForm(f => ({ ...f, description: v }))} placeholder="e.g. Active schools subscribed to premium plan" />
                    
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Target Audience Category</FieldLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {AUDIENCE_TARGETS.map(a => (
                                <button key={a.key} onClick={() => setGroupForm(f => ({ ...f, filter_config: { target: a.key } }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `2px solid ${groupForm.filter_config.target === a.key ? P.brand : P.border}`, background: groupForm.filter_config.target === a.key ? P.brandBg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                                    <div style={{ fontWeight: 800, color: P.dark, fontSize: 14 }}>{a.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {renderAudienceFilters(groupForm.filter_config, (updater: any) => {
                        setGroupForm(f => {
                            const nextFilter = typeof updater === 'function' ? updater(f.filter_config) : updater
                            return { ...f, filter_config: nextFilter }
                        })
                    })}

                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button onClick={() => setGroupDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={createGroup} disabled={savingId === 'group' || !groupForm.name} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#EA580C', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(234,88,12,0.3)', opacity: !groupForm.name ? 0.5 : 1 }}>
                            {savingId === 'group' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={16} />}
                            Save Audience Group
                        </button>
                    </div>
                </div>
            </SideDrawer>
        </div>
    )
}
