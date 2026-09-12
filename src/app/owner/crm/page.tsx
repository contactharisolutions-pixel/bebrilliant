'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Search, Plus, RefreshCw, X, Loader2, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, Mail, Phone, Calendar, Clock,
    Building2, User, Filter, Trash2, Pencil, Download,
    PhoneCall, Video, StickyNote, Trophy, Ban, Sparkles,
    ArrowUpRight, Target, History, Layers, LayoutGrid, BarChart2,
    Users, DollarSign, Percent, Save, Copy, Check,
    AlertCircle, MessageSquare, Tag, ChevronDown, Activity
} from 'lucide-react'

// ── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
    bg: '#F8F9FA',
    card: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F1F3F5',
    brand: '#004B93',
    brandLight: '#0A62BD',
    brandBg: '#EEF4FF',
    brandHover: '#003A72',
    cta: '#F0A026',
    ctaBg: '#FFF7E6',
    dark: '#111827',
    text: '#374151',
    muted: '#6B7280',
    subtle: '#9CA3AF',
    hover: '#F9FAFB',
    success: '#059669',
    successBg: '#ECFDF5',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    info: '#2563EB',
    infoBg: '#EFF6FF',
    purple: '#7C3AED',
    purpleBg: '#F5F3FF',
}

// ── PIPELINE STAGES ───────────────────────────────────────────────────────────
const DEFAULT_STAGES = [
    { key: 'new',            label: 'New Inquiry',    color: '#059669', bg: '#ECFDF5', icon: Sparkles },
    { key: 'contacted',      label: 'Contacted',      color: '#D97706', bg: '#FFFBEB', icon: PhoneCall },
    { key: 'demo_scheduled', label: 'Demo Scheduled', color: '#2563EB', bg: '#EFF6FF', icon: Calendar },
    { key: 'demo_completed', label: 'Demo Completed', color: '#7C3AED', bg: '#F5F3FF', icon: Video },
    { key: 'converted',      label: 'Enrolled',       color: '#059669', bg: '#ECFDF5', icon: Trophy },
    { key: 'lost',           label: 'Closed',         color: '#DC2626', bg: '#FEF2F2', icon: Ban },
]

const SOURCES = ['Website', 'Referral', 'Phone Call', 'Social Media', 'Conference', 'Google Search', 'Manual', 'Import', 'Other']
const PRIORITY_CONFIG = {
    low:    { label: 'Low',    color: '#6B7280', bg: '#F3F4F6' },
    medium: { label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
    high:   { label: 'High',   color: '#DC2626', bg: '#FEF2F2' },
    urgent: { label: 'Urgent', color: '#7C3AED', bg: '#F5F3FF' },
}

const NOTE_TYPES = [
    { key: 'note',        label: 'General Note',    icon: StickyNote,    color: '#2563EB', bg: '#EFF6FF' },
    { key: 'requirement', label: 'Requirement',     icon: Sparkles,      color: '#7C3AED', bg: '#F5F3FF' },
    { key: 'call',        label: 'Call Summary',    icon: PhoneCall,     color: '#059669', bg: '#ECFDF5' },
    { key: 'insight',     label: 'Deal Strategy',   icon: Target,        color: '#D97706', bg: '#FFFBEB' },
    { key: 'urgent',      label: 'Critical Alert',  icon: AlertCircle,   color: '#DC2626', bg: '#FEF2F2' },
]

const AVATAR_COLORS = [
    { bg: '#EEF4FF', text: '#004B93' },
    { bg: '#ECFDF5', text: '#059669' },
    { bg: '#F5F3FF', text: '#7C3AED' },
    { bg: '#FFF7E6', text: '#D97706' },
    { bg: '#EFF6FF', text: '#2563EB' },
    { bg: '#FEF2F2', text: '#DC2626' },
]

function getAvatarColor(name: string) {
    let hash = 0
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatRelativeTime(dateStr: string) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function stageOf(key: string) {
    return DEFAULT_STAGES.find(s => s.key === key) ?? DEFAULT_STAGES[0]
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span style={{ background: bg, color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
            {label}
        </span>
    )
}

function Toast({ msg, ok, action }: { msg: string; ok: boolean; action?: { label: string; onClick: () => void } }) {
    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: ok ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.2)', zIndex: 9999, animation: 'slideUp 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {ok ? <CheckCircle size={16} /> : <XCircle size={16} />} <span>{msg}</span>
            </div>
            {action && (
                <button type="button" onClick={action.onClick} style={{ background: '#fff', color: ok ? P.success : P.error, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginLeft: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {action.label}
                </button>
            )}
        </div>
    )
}

// ── ADD INQUIRY MODAL ────────────────────────────────────────────────────────
function AddLeadModal({ onClose, onSuccess, staffList }: { onClose: () => void; onSuccess: () => void; staffList: any[] }) {
    const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', source: 'Website', status: 'new', type: 'INSTITUTE', priority: 'medium', lead_score: 50, expected_value: '', assigned_to: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function submit() {
        if (!form.name.trim() || !form.organization.trim() || !form.email.trim()) {
            setError('Contact Person Name, School Name, and Email are required.')
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/owner/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, expected_value: form.expected_value ? parseFloat(form.expected_value) : null })
            })
            if (!res.ok) {
                const j = await res.json()
                setError(j.error || 'Failed to create inquiry')
                return
            }
            onSuccess()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: P.card, borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={20} color={P.brand} />
                    </div>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: P.dark }}>Add New Inquiry</div>
                        <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>Capture details to begin lead lifecycle tracking</div>
                    </div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={18} color={P.muted} />
                    </button>
                </div>
                {error && (
                    <div style={{ background: P.errorBg, color: P.error, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Contact Person Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rajesh Verma" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>School / Institute Name *</label>
                        <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="e.g. Silver Bells School" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Email Address *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@school.org" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Phone Number</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Inquiry Source</label>
                        <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                            {SOURCES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Priority</label>
                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Estimated Annual Value (₹)</label>
                        <input type="number" value={form.expected_value} onChange={e => setForm(f => ({ ...f, expected_value: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 5 }}>Assign To Staff</label>
                        <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                            <option value="">— Unassigned —</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px 0', border: '1px solid ' + P.border, borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: P.bg, fontSize: 13, color: P.text }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '11px 0', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: P.brand, color: '#fff', fontSize: 13, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={14} /> Save Inquiry</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── ENTERPRISE DETAIL & NOTES DRAWER ─────────────────────────────────────────
function LeadDetailDrawer({
    lead,
    staffList,
    initialTab = 'notes',
    onClose,
    onSuccess
}: {
    lead: any
    staffList: any[]
    initialTab?: 'notes' | 'info' | 'call' | 'demos' | 'timeline'
    onClose: () => void
    onSuccess: () => void
}) {
    const [tab, setTab] = useState<'notes' | 'info' | 'call' | 'demos' | 'timeline'>(initialTab)
    const [fullLead, setFullLead] = useState<any>(lead)
    const [demos, setDemos] = useState<any[]>(lead.demos || [])
    const [activities, setActivities] = useState<any[]>([])
    const [timeline, setTimeline] = useState<any[]>([])
    const [callLogs, setCallLogs] = useState<any[]>([])
    const [loadingActivities, setLoadingActivities] = useState(false)
    const [loadingTimeline, setLoadingTimeline] = useState(false)
    const [loadingDemos, setLoadingDemos] = useState(false)

    // Note Composer State
    const [noteContent, setNoteContent] = useState('')
    const [noteType, setNoteType] = useState('note')
    const [postingNote, setPostingNote] = useState(false)
    const [activityFilter, setActivityFilter] = useState<'all' | 'notes' | 'calls'>('all')

    // Form states
    const [formInfo, setFormInfo] = useState({
        name: lead.name || '',
        organization: lead.organization || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'Website',
        priority: lead.priority || 'medium',
        lead_score: lead.lead_score || 0,
        expected_value: lead.expected_value || '',
        assigned_to: lead.assigned_to || ''
    })

    const [callForm, setCallForm] = useState({
        outcome: 'connected',
        notes: '',
        customer_requirement: '',
        demo_interest: false,
        preferred_demo_date: '',
        preferred_demo_time: '',
        demo_type: 'online',
        next_followup_date: '',
        duration_mins: 5
    })

    const [demoForm, setDemoForm] = useState({ scheduled_at: '', conducted_by: '', notes: '' })
    const [saving, setSaving] = useState(false)
    const [scheduling, setScheduling] = useState(false)
    const [loggingCall, setLoggingCall] = useState(false)
    const [copiedPhone, setCopiedPhone] = useState(false)

    const fetchLeadDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}`)
            if (res.ok) {
                const d = await res.json()
                setFullLead(d.lead)
                setDemos(d.lead.demos || [])
            }
        } catch (e) {
            console.error(e)
        }
    }, [lead.id])

    const fetchActivities = useCallback(async () => {
        setLoadingActivities(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}/activities`)
            if (res.ok) {
                const d = await res.json()
                setActivities(d.activities ?? [])
            }
        } finally {
            setLoadingActivities(false)
        }
    }, [lead.id])

    const fetchTimeline = useCallback(async () => {
        setLoadingTimeline(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}/timeline`)
            if (res.ok) {
                const d = await res.json()
                setTimeline(d.timeline ?? [])
            }
        } finally {
            setLoadingTimeline(false)
        }
    }, [lead.id])

    const fetchCallLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}/call`)
            if (res.ok) {
                const d = await res.json()
                setCallLogs(d.call_logs ?? [])
            }
        } catch (e) {
            console.error(e)
        }
    }, [lead.id])

    useEffect(() => {
        fetchLeadDetails()
        fetchActivities()
        fetchTimeline()
        fetchCallLogs()
    }, [fetchLeadDetails, fetchActivities, fetchTimeline, fetchCallLogs])

    useEffect(() => {
        if (fullLead) {
            setFormInfo({
                name: fullLead.name || '',
                organization: fullLead.organization || '',
                email: fullLead.email || '',
                phone: fullLead.phone || '',
                source: fullLead.source || 'Website',
                priority: fullLead.priority || 'medium',
                lead_score: fullLead.lead_score || 0,
                expected_value: fullLead.expected_value || '',
                assigned_to: fullLead.assigned_to || ''
            })
        }
    }, [fullLead])

    async function handlePostNote() {
        const text = noteContent.trim()
        if (!text) return
        setPostingNote(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: noteType,
                    content: text,
                    metadata: { posted_at: new Date().toISOString() }
                })
            })
            if (res.ok) {
                setNoteContent('')
                fetchActivities()
                fetchTimeline()
                onSuccess()
            }
        } finally {
            setPostingNote(false)
        }
    }

    async function handleSaveDetails() {
        setSaving(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formInfo,
                    expected_value: formInfo.expected_value ? parseFloat(formInfo.expected_value) : null,
                    assigned_to: formInfo.assigned_to || null
                })
            })
            if (res.ok) {
                onSuccess()
                fetchLeadDetails()
                fetchTimeline()
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleLogCallSubmit() {
        if (!callForm.outcome) return
        setLoggingCall(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}/call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(callForm)
            })
            if (res.ok) {
                setCallForm({
                    outcome: 'connected',
                    notes: '',
                    customer_requirement: '',
                    demo_interest: false,
                    preferred_demo_date: '',
                    preferred_demo_time: '',
                    demo_type: 'online',
                    next_followup_date: '',
                    duration_mins: 5
                })
                fetchLeadDetails()
                fetchCallLogs()
                fetchActivities()
                fetchTimeline()
                onSuccess()
            }
        } finally {
            setLoggingCall(false)
        }
    }

    async function handleScheduleDemo() {
        if (!demoForm.scheduled_at) return
        setScheduling(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}/demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheduled_at: new Date(demoForm.scheduled_at).toISOString(),
                    notes: demoForm.notes,
                    conducted_by: demoForm.conducted_by || null
                })
            })
            if (res.ok) {
                setDemoForm({ scheduled_at: '', conducted_by: '', notes: '' })
                fetchLeadDetails()
                fetchTimeline()
                fetchActivities()
                onSuccess()
            }
        } finally {
            setScheduling(false)
        }
    }

    function copyPhone() {
        if (!fullLead.phone) return
        navigator.clipboard.writeText(fullLead.phone)
        setCopiedPhone(true)
        setTimeout(() => setCopiedPhone(false), 2000)
    }

    const filteredActivities = useMemo(() => {
        if (activityFilter === 'notes') {
            return activities.filter(a => ['note', 'requirement', 'insight', 'urgent'].includes(a.type))
        }
        if (activityFilter === 'calls') {
            return activities.filter(a => a.type === 'call')
        }
        return activities
    }, [activities, activityFilter])

    const avatarTone = getAvatarColor(fullLead.name)
    const currentStage = stageOf(fullLead.status)
    const currentPriority = PRIORITY_CONFIG[fullLead.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} />

            <div style={{ position: 'relative', width: 620, background: P.card, height: '100%', overflowY: 'hidden', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                {/* Header Profile Bar */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + P.border, background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: avatarTone.bg, color: avatarTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                            {getInitials(fullLead.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: P.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fullLead.name}
                                </span>
                                <span style={{ background: currentStage.bg, color: currentStage.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                    {currentStage.label}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: P.muted, fontSize: 12 }}>
                                <Building2 size={13} color={P.muted} />
                                <span style={{ fontWeight: 600, color: P.text }}>{fullLead.organization}</span>
                                <span>•</span>
                                <span>{fullLead.email}</span>
                                {fullLead.phone && (
                                    <>
                                        <span>•</span>
                                        <button onClick={copyPhone} title="Click to copy phone" style={{ background: 'none', border: 'none', padding: 0, color: P.muted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12 }}>
                                            {copiedPhone ? <Check size={12} color={P.success} /> : <Phone size={12} />}
                                            {fullLead.phone}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 8, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={16} color={P.muted} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid ' + P.border, padding: '0', marginTop: 18, gap: 4 }}>
                        {[
                            { key: 'notes',    label: 'Notes & Activity', icon: StickyNote, count: activities.length },
                            { key: 'info',     label: 'Inquiry Info',     icon: User },
                            { key: 'call',     label: 'Log Call',         icon: PhoneCall, count: callLogs.length },
                            { key: 'demos',    label: 'Demos',            icon: Video, count: demos.length },
                            { key: 'timeline', label: 'Timeline',         icon: History, count: timeline.length },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '10px 14px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    color: tab === t.key ? P.brand : P.muted,
                                    borderBottom: tab === t.key ? '2px solid ' + P.brand : '2px solid transparent',
                                    marginBottom: -1,
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <t.icon size={14} />
                                <span>{t.label}</span>
                                {t.count !== undefined && t.count > 0 && (
                                    <span style={{
                                        background: tab === t.key ? P.brandBg : P.borderLight,
                                        color: tab === t.key ? P.brand : P.muted,
                                        borderRadius: 10,
                                        padding: '1px 6px',
                                        fontSize: 10,
                                        fontWeight: 800
                                    }}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Container */}
                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: P.bg }}>
                    {/* TAB 1: NOTES & ACTIVITY (AUDITED & UPGRADED) */}
                    {tab === 'notes' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Note Composer Card */}
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <StickyNote size={14} color={P.brand} /> Add Internal Note or Observation
                                </div>

                                {/* Note Type Selectors */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                                    {NOTE_TYPES.map(nt => {
                                        const isSel = noteType === nt.key
                                        return (
                                            <button
                                                key={nt.key}
                                                type="button"
                                                onClick={() => setNoteType(nt.key)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    padding: '5px 10px',
                                                    borderRadius: 6,
                                                    border: isSel ? `1px solid ${nt.color}` : '1px solid ' + P.border,
                                                    background: isSel ? nt.bg : P.card,
                                                    color: isSel ? nt.color : P.muted,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <nt.icon size={12} />
                                                {nt.label}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Textarea */}
                                <textarea
                                    rows={3}
                                    value={noteContent}
                                    onChange={e => setNoteContent(e.target.value)}
                                    onKeyDown={e => {
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                            e.preventDefault()
                                            handlePostNote()
                                        }
                                    }}
                                    placeholder="Type note, requirement, pain points, or next steps... (Ctrl + Enter to save)"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid ' + P.border,
                                        borderRadius: 8,
                                        fontSize: 13,
                                        background: P.bg,
                                        outline: 'none',
                                        resize: 'vertical',
                                        minHeight: 70,
                                        boxSizing: 'border-box',
                                        color: P.dark,
                                        lineHeight: 1.5
                                    }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                    <span style={{ fontSize: 11, color: P.subtle }}>
                                        Shortcut: <kbd style={{ background: P.borderLight, padding: '2px 4px', borderRadius: 4, fontSize: 10 }}>Ctrl</kbd> + <kbd style={{ background: P.borderLight, padding: '2px 4px', borderRadius: 4, fontSize: 10 }}>Enter</kbd>
                                    </span>
                                    <button
                                        onClick={handlePostNote}
                                        disabled={postingNote || !noteContent.trim()}
                                        style={{
                                            padding: '7px 14px',
                                            background: P.brand,
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            opacity: !noteContent.trim() ? 0.6 : 1
                                        }}
                                    >
                                        {postingNote ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                                        Save Note
                                    </button>
                                </div>
                            </div>

                            {/* Feed Filtering */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Activity & Notes History ({filteredActivities.length})
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {(['all', 'notes', 'calls'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setActivityFilter(f)}
                                            style={{
                                                padding: '3px 8px',
                                                border: '1px solid ' + (activityFilter === f ? P.brand : P.border),
                                                borderRadius: 6,
                                                background: activityFilter === f ? P.brandBg : P.card,
                                                color: activityFilter === f ? P.brand : P.muted,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {f === 'all' ? 'All' : f === 'notes' ? 'Notes' : 'Calls'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Feed Stream */}
                            {loadingActivities ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <Loader2 size={24} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 32, textAlign: 'center' }}>
                                    <StickyNote size={32} color={P.border} style={{ marginBottom: 8 }} />
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>No notes recorded yet</div>
                                    <div style={{ fontSize: 12, color: P.muted, marginTop: 4 }}>
                                        Use the composer above to record your first note or team observation.
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {filteredActivities.map((act: any) => {
                                        const noteTypeConfig = NOTE_TYPES.find(n => n.key === act.type) || {
                                            label: act.type?.replace('_', ' ') || 'Activity',
                                            icon: Activity,
                                            color: '#6B7280',
                                            bg: '#F3F4F6'
                                        }
                                        const author = act.created_by_profile
                                        const authorName = author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email : 'System Staff'

                                        return (
                                            <div
                                                key={act.id}
                                                style={{
                                                    background: P.card,
                                                    border: '1px solid ' + P.border,
                                                    borderRadius: 10,
                                                    padding: '14px 16px',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 24, height: 24, borderRadius: 6,
                                                            background: noteTypeConfig.bg, color: noteTypeConfig.color,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <noteTypeConfig.icon size={13} />
                                                        </div>
                                                        <span style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>
                                                            {authorName}
                                                        </span>
                                                        <span style={{
                                                            background: noteTypeConfig.bg, color: noteTypeConfig.color,
                                                            borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {noteTypeConfig.label}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: 11, color: P.muted }} title={new Date(act.created_at).toLocaleString('en-IN')}>
                                                        {formatRelativeTime(act.created_at)}
                                                    </span>
                                                </div>

                                                <div style={{
                                                    fontSize: 13,
                                                    color: P.text,
                                                    lineHeight: 1.5,
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    paddingLeft: 32
                                                }}>
                                                    {act.content || act.notes || '—'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: INQUIRY INFO */}
                    {tab === 'info' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 14 }}>Contact & Organization</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Contact Person</label>
                                        <input value={formInfo.name} onChange={e => setFormInfo({ ...formInfo, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>School / Institute</label>
                                        <input value={formInfo.organization} onChange={e => setFormInfo({ ...formInfo, organization: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Email Address</label>
                                        <input value={formInfo.email} onChange={e => setFormInfo({ ...formInfo, email: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Phone Number</label>
                                        <input value={formInfo.phone} onChange={e => setFormInfo({ ...formInfo, phone: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 14 }}>Lifecycle Assignment & Priority</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Assigned Staff Member</label>
                                        <select value={formInfo.assigned_to} onChange={e => setFormInfo({ ...formInfo, assigned_to: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                                            <option value="">— Unassigned —</option>
                                            {staffList.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Priority</label>
                                            <select value={formInfo.priority} onChange={e => setFormInfo({ ...formInfo, priority: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                                                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Inquiry Source</label>
                                            <select value={formInfo.source} onChange={e => setFormInfo({ ...formInfo, source: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                                                {SOURCES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Estimated Value (₹)</label>
                                        <input type="number" value={formInfo.expected_value} onChange={e => setFormInfo({ ...formInfo, expected_value: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                                    </div>
                                </div>

                                <button onClick={handleSaveDetails} disabled={saving} style={{ padding: '10px 16px', background: P.brand, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, width: '100%' }}>
                                    {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: LOG CALL */}
                    {tab === 'call' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <PhoneCall size={15} color={P.brand} /> Log Call Record
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Call Outcome *</label>
                                        <select value={callForm.outcome} onChange={e => setCallForm({ ...callForm, outcome: e.target.value, demo_interest: e.target.value === 'demo_required' })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}>
                                            <option value="connected">📞 Connected & Spoke</option>
                                            <option value="not_reachable">📵 Not Reachable / Busy</option>
                                            <option value="call_back_later">⏳ Call Back Requested</option>
                                            <option value="qualified">⭐ Qualified Prospect</option>
                                            <option value="demo_required">📺 Demo Required</option>
                                            <option value="follow_up_required">📋 Follow-up Required</option>
                                            <option value="not_interested">❌ Not Interested</option>
                                            <option value="invalid_lead">🚫 Invalid Lead</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Call Duration (Mins)</label>
                                        <input type="number" value={callForm.duration_mins} onChange={e => setCallForm({ ...callForm, duration_mins: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }} />
                                    </div>
                                </div>

                                {(callForm.outcome === 'demo_required' || callForm.demo_interest) && (
                                    <div style={{ background: P.brandBg, border: `1px solid ${P.brand}30`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: P.brand, marginBottom: 8 }}>Preferred Demo Details</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div>
                                                <label style={{ fontSize: 10, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 4 }}>Demo Format</label>
                                                <select value={callForm.demo_type} onChange={e => setCallForm({ ...callForm, demo_type: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + P.border, borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none' }}>
                                                    <option value="online">Online Video Conference</option>
                                                    <option value="on_site">On-Site School Visit</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 10, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 4 }}>Preferred Date</label>
                                                <input type="date" value={callForm.preferred_demo_date} onChange={e => setCallForm({ ...callForm, preferred_demo_date: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + P.border, borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Call Summary Notes</label>
                                    <textarea rows={3} value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Discussion points, institutional requirements, feedback..." style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none', resize: 'vertical' }} />
                                </div>

                                <button onClick={handleLogCallSubmit} disabled={loggingCall} style={{ width: '100%', padding: 11, background: P.brand, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {loggingCall ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <PhoneCall size={14} />} Save Call Record
                                </button>
                            </div>

                            {/* Call History */}
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                                    Call Records ({callLogs.length})
                                </div>
                                {callLogs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: P.muted, fontSize: 12 }}>No calls logged yet.</div>
                                ) : callLogs.map((c: any) => (
                                    <div key={c.id} style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>
                                                Call #{c.call_number} — {c.outcome?.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: 11, color: P.muted }}>
                                                {new Date(c.call_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {c.notes && <div style={{ fontSize: 12, color: P.text, marginTop: 4 }}>{c.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: DEMOS */}
                    {tab === 'demos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Video size={15} color={P.brand} /> Schedule Demo Presentation
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Date & Time</label>
                                            <input type="datetime-local" value={demoForm.scheduled_at} onChange={e => setDemoForm({ ...demoForm, scheduled_at: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid ' + P.border, borderRadius: 6, fontSize: 12, background: P.bg, outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Staff Host</label>
                                            <select value={demoForm.conducted_by} onChange={e => setDemoForm({ ...demoForm, conducted_by: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid ' + P.border, borderRadius: 6, fontSize: 12, background: P.bg, outline: 'none' }}>
                                                <option value="">— Unassigned —</option>
                                                {staffList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'block', marginBottom: 4 }}>Agenda / Demo Notes</label>
                                        <textarea value={demoForm.notes} onChange={e => setDemoForm({ ...demoForm, notes: e.target.value })} rows={2} placeholder="School objectives, focus modules (Exams, Fees, Portal)..." style={{ width: '100%', padding: '8px 10px', border: '1px solid ' + P.border, borderRadius: 6, fontSize: 12, background: P.bg, outline: 'none', resize: 'vertical' }} />
                                    </div>
                                    <button onClick={handleScheduleDemo} disabled={scheduling || !demoForm.scheduled_at} style={{ padding: '9px 14px', background: P.brand, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !demoForm.scheduled_at ? 0.6 : 1 }}>
                                        {scheduling ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={13} />} Schedule Demo
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                                    Scheduled Demos ({demos.length})
                                </div>
                                {loadingDemos ? (
                                    <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={20} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
                                ) : demos.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: P.muted, fontSize: 12 }}>No demos scheduled yet.</div>
                                ) : demos.map(d => {
                                    const host = staffList.find(s => s.id === d.conducted_by)
                                    return (
                                        <div key={d.id} style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>
                                                    {new Date(d.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                                <span style={{ background: d.status === 'completed' ? P.successBg : P.warningBg, color: d.status === 'completed' ? P.success : P.warning, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                                                    {d.status.toUpperCase()}
                                                </span>
                                            </div>
                                            {d.notes && <div style={{ fontSize: 12, color: P.text, marginBottom: 6 }}>{d.notes}</div>}
                                            {host && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: P.muted }}>
                                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: P.brand }}>
                                                        {host.first_name?.[0]}
                                                    </div>
                                                    Host: {host.first_name} {host.last_name}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: LIFECYCLE TIMELINE */}
                    {tab === 'timeline' && (
                        <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 18 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 14 }}>Full Lifecycle Audit Trail</div>
                            {loadingTimeline ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
                            ) : timeline.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40, color: P.muted, fontSize: 13 }}>No timeline events recorded yet.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {timeline.map((evt: any, i: number) => (
                                        <div key={evt.id} style={{ display: 'flex', gap: 12, paddingBottom: 14, borderBottom: i < timeline.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Sparkles size={14} color={P.brand} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{evt.event_label}</span>
                                                    <span style={{ fontSize: 11, color: P.muted }}>
                                                        {new Date(evt.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {evt.description && <div style={{ fontSize: 12, color: P.text, marginTop: 2 }}>{evt.description}</div>}
                                                {evt.staff && (
                                                    <div style={{ fontSize: 11, color: P.muted, marginTop: 4, fontWeight: 600 }}>
                                                        By: {evt.staff.first_name} {evt.staff.last_name} ({evt.staff.role})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── KANBAN CARD ─────────────────────────────────────────────────────────────
function KanbanCard({ lead, onDragStart, onClick, staffList }: any) {
    const priority = PRIORITY_CONFIG[lead.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
    const assigned = staffList.find((s: any) => s.id === lead.assigned_to)
    const avatarTone = getAvatarColor(lead.name)

    return (
        <div
            draggable
            onDragStart={e => onDragStart(e, lead)}
            onClick={() => onClick(lead, 'notes')}
            style={{
                background: P.card,
                border: '1px solid ' + P.border,
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: 10,
                userSelect: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = P.brand
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                e.currentTarget.style.borderColor = P.border
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: avatarTone.bg, color: avatarTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    {getInitials(lead.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.name}
                    </div>
                    <div style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                        <Building2 size={11} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.organization}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <Pill label={priority.label} color={priority.color} bg={priority.bg} />
                {lead.expected_value && (
                    <Pill label={'₹' + Number(lead.expected_value).toLocaleString('en-IN')} color={P.success} bg={P.successBg} />
                )}
                {lead.activity_count ? (
                    <span style={{ fontSize: 10, fontWeight: 700, background: P.brandBg, color: P.brand, padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <StickyNote size={10} /> {lead.activity_count}
                    </span>
                ) : null}
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid ' + P.borderLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {assigned ? (
                    <div style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: P.brand }}>
                            {assigned.first_name?.[0] || '?'}
                        </div>
                        <span>{assigned.first_name}</span>
                    </div>
                ) : (
                    <span style={{ fontSize: 11, color: P.subtle }}>Unassigned</span>
                )}

                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => onClick(lead, 'notes')}
                        title="View & Add Notes"
                        style={{ padding: '4px 7px', border: '1px solid ' + P.border, borderRadius: 6, background: P.bg, color: P.text, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                        Notes
                    </button>
                    <button
                        type="button"
                        onClick={() => onClick(lead, 'call')}
                        title="Log Call"
                        style={{ padding: '4px 7px', border: '1px solid ' + P.border, borderRadius: 6, background: P.bg, color: P.brand, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <PhoneCall size={11} />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── ANALYTICS PANEL ─────────────────────────────────────────────────────────
function AnalyticsPanel({ onClose }: { onClose: () => void }) {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/owner/crm/analytics?days=30')
            .then(r => r.json())
            .then(d => { setAnalytics(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: P.card, borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <Loader2 size={28} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
                <div style={{ color: P.muted, fontWeight: 600 }}>Loading inquiry intelligence...</div>
            </div>
        </div>
    )

    const s = analytics?.summary ?? {}

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 24 }}>
            <div style={{ background: P.card, borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: P.purpleBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={18} color={P.purple} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>Pipeline Performance</div>
                        <div style={{ fontSize: 12, color: P.muted }}>Last 30 days inquiry metrics</div>
                    </div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={18} color={P.muted} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Total Inquiries',  value: s.totalLeads ?? 0,     icon: Users,      color: P.brand,   bg: P.brandBg },
                        { label: 'Enrolled Schools',  value: s.convertedLeads ?? 0, icon: Trophy,     color: P.success, bg: P.successBg },
                        { label: 'Enrollment Rate',  value: (s.conversionRate ?? 0) + '%', icon: Percent, color: P.purple, bg: P.purpleBg },
                        { label: 'Estimated Pipeline', value: '₹' + Number(s.pipelineValue ?? 0).toLocaleString('en-IN'), icon: DollarSign, color: P.warning, bg: P.warningBg },
                    ].map(k => (
                        <div key={k.label} style={{ background: k.bg, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <k.icon size={18} color={k.color} />
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 800, color: P.dark }}>{k.value}</div>
                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{k.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: P.bg, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Pipeline Funnel Conversion
                    </div>
                    {(analytics?.funnel ?? []).map((f: any) => {
                        const st = stageOf(f.status)
                        const max = Math.max(...(analytics?.funnel ?? []).map((x: any) => x.count), 1)
                        const width = Math.round((f.count / max) * 100)
                        return (
                            <div key={f.status} style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>{f.count}</span>
                                </div>
                                <div style={{ height: 6, background: P.border, borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: width + '%', background: st.color, borderRadius: 3 }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ── MAIN CRM COMPONENT ───────────────────────────────────────────────────────
export default function CRMPage() {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [total, setTotal] = useState(0)
    const [stageCounts, setStageCounts] = useState<Record<string, number>>({})

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [page, setPage] = useState(1)

    // Selection & Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [bulkActing, setBulkActing] = useState(false)

    // Drawer state with target tab
    const [drawerState, setDrawerState] = useState<{ lead: any; tab: 'notes' | 'info' | 'call' | 'demos' | 'timeline' } | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [staffList, setStaffList] = useState<any[]>([])
    const [dragOver, setDragOver] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean; action?: { label: string; onClick: () => void } } | null>(null)

    function showToast(msg: string, ok = true, action?: { label: string; onClick: () => void }) {
        setToast({ msg, ok, action })
        setTimeout(() => setToast(null), action ? 8000 : 3000)
    }

    const fetchLeads = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ search, status: statusFilter, page: String(page), limit: '25' })
            if (priorityFilter !== 'all') params.set('priority', priorityFilter)
            const res = await fetch(`/api/owner/crm/leads?${params}`)
            if (res.ok) {
                const d = await res.json()
                setLeads(d.leads ?? [])
                setTotal(d.total ?? 0)
            }

            // Fetch per-stage counts
            const analyticsRes = await fetch('/api/owner/crm/analytics?days=3650')
            if (analyticsRes.ok) {
                const analyticsData = await analyticsRes.json()
                const map: Record<string, number> = {}
                for (const f of analyticsData.funnel ?? []) {
                    map[f.status] = f.count
                }
                setStageCounts(map)
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [search, statusFilter, priorityFilter, page])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    useEffect(() => {
        fetch('/api/owner/rbac?role=staff')
            .then(r => r.json())
            .then(d => setStaffList(d.users ?? []))
            .catch(() => {})
    }, [])

    function handleDragStart(e: React.DragEvent, lead: any) {
        e.dataTransfer.setData('leadId', lead.id)
    }

    async function handleDrop(e: React.DragEvent, targetStatus: string) {
        e.preventDefault()
        const leadId = e.dataTransfer.getData('leadId')
        setDragOver(null)
        if (!leadId) return
        const lead = leads.find(l => l.id === leadId)
        if (!lead || lead.status === targetStatus) return

        setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: targetStatus } : l))

        try {
            await fetch(`/api/owner/crm/leads/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status_change', lead_ids: [leadId], payload: { status: targetStatus } })
            })
            if (targetStatus === 'converted') {
                showToast('Inquiry enrolled! Ready to set up school.', true, {
                    label: 'Create School',
                    onClick: () => {
                        window.location.href = `/owner/tenants?provision=true&leadId=${leadId}`
                    }
                })
            } else {
                showToast(`Moved to ${stageOf(targetStatus).label}`)
            }
            fetchLeads(true)
        } catch {
            setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: lead.status } : l))
            showToast('Failed to update status', false)
        }
    }

    async function handleStatusChange(leadId: string, newStatus: string) {
        setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        try {
            await fetch(`/api/owner/crm/leads/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status_change', lead_ids: [leadId], payload: { status: newStatus } })
            })
            if (newStatus === 'converted') {
                showToast('Inquiry enrolled! Ready to set up school.', true, {
                    label: 'Create School',
                    onClick: () => {
                        window.location.href = `/owner/tenants?provision=true&leadId=${leadId}`
                    }
                })
            } else {
                showToast(`Moved to ${stageOf(newStatus).label}`)
            }
            fetchLeads(true)
        } catch {
            showToast('Failed to update status', false)
        }
    }

    async function handleAssignTo(leadId: string, staffId: string) {
        setLeads(ls => ls.map(l => l.id === leadId ? { ...l, assigned_to: staffId || null } : l))
        try {
            const res = await fetch(`/api/owner/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: staffId || null })
            })
            if (!res.ok) throw new Error()
            showToast('Inquiry assigned successfully')
            fetchLeads(true)
        } catch {
            showToast('Failed to assign inquiry', false)
            fetchLeads(true)
        }
    }

    async function handleDeleteLead(leadId: string, name: string) {
        if (!confirm(`Are you sure you want to delete inquiry for "${name}"? This will delete associated activity history.`)) return
        try {
            const res = await fetch(`/api/owner/crm/leads/${leadId}`, { method: 'DELETE' })
            if (res.ok) {
                showToast('Inquiry deleted successfully')
                setSelectedIds(ids => ids.filter(i => i !== leadId))
                fetchLeads(true)
            } else {
                showToast('Failed to delete inquiry', false)
            }
        } catch {
            showToast('Failed to delete inquiry', false)
        }
    }

    // Bulk action handlers
    function toggleSelectAll() {
        if (selectedIds.length === leads.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(leads.map(l => l.id))
        }
    }

    function toggleSelect(id: string) {
        setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
    }

    async function handleBulkStatusChange(status: string) {
        if (!status || selectedIds.length === 0) return
        setBulkActing(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status_change', lead_ids: selectedIds, payload: { status } })
            })
            if (res.ok) {
                showToast(`Updated ${selectedIds.length} inquiries to ${stageOf(status).label}`)
                setSelectedIds([])
                fetchLeads(true)
            }
        } finally {
            setBulkActing(false)
        }
    }

    async function handleBulkAssign(staffId: string) {
        if (selectedIds.length === 0) return
        setBulkActing(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'assign', lead_ids: selectedIds, payload: { assigned_to: staffId || null } })
            })
            if (res.ok) {
                showToast(`Assigned ${selectedIds.length} inquiries`)
                setSelectedIds([])
                fetchLeads(true)
            }
        } finally {
            setBulkActing(false)
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return
        if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} inquiries?`)) return
        setBulkActing(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', lead_ids: selectedIds })
            })
            if (res.ok) {
                showToast(`Deleted ${selectedIds.length} inquiries`)
                setSelectedIds([])
                fetchLeads(true)
            }
        } finally {
            setBulkActing(false)
        }
    }

    function handleExport() {
        const params = new URLSearchParams({ search, status: statusFilter })
        window.open(`/api/owner/crm/leads/export?${params}`, '_blank')
    }

    const totalPages = Math.ceil(total / 25)

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ color: P.muted, fontWeight: 600 }}>Loading inquiry intelligence...</div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: P.bg, padding: '28px 32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                * { box-sizing: border-box; }
                .crm-table-row:hover { background-color: #F9FAFB !important; }
                .custom-select {
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                }
            `}</style>

            {toast && <Toast msg={toast.msg} ok={toast.ok} action={toast.action} />}
            {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSuccess={() => fetchLeads(true)} staffList={staffList} />}
            {drawerState && (
                <LeadDetailDrawer
                    lead={drawerState.lead}
                    initialTab={drawerState.tab}
                    staffList={staffList}
                    onClose={() => setDrawerState(null)}
                    onSuccess={() => fetchLeads(true)}
                />
            )}
            {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}

            {/* Top Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: P.dark, letterSpacing: '-0.4px' }}>CRM & Inquiries</div>
                    <div style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>
                        Track institutional leads, follow-ups, notes, and seamless conversion into registered schools.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => fetchLeads(true)}
                        title="Refresh inquiries"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: P.card, border: '1px solid ' + P.border, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}
                    >
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button
                        onClick={() => setShowAnalytics(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', background: P.purpleBg, border: '1px solid ' + P.purple + '30', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.purple }}
                    >
                        <BarChart2 size={14} /> View Reports
                    </button>
                    <button
                        onClick={handleExport}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', background: P.card, border: '1px solid ' + P.border, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}
                    >
                        <Download size={14} /> Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: P.brand, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff' }}
                    >
                        <Plus size={14} /> Add Inquiry
                    </button>
                </div>
            </div>

            {/* KPI Metric Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
                {DEFAULT_STAGES.map(s => {
                    const count = stageCounts[s.key] ?? leads.filter(l => l.status === s.key).length
                    const isSelected = statusFilter === s.key
                    const Icon = s.icon
                    return (
                        <button
                            key={s.key}
                            onClick={() => { setStatusFilter(isSelected ? 'all' : s.key); setPage(1) }}
                            style={{
                                background: isSelected ? s.bg : P.card,
                                border: '1px solid ' + (isSelected ? s.color : P.border),
                                borderRadius: 12,
                                padding: '14px 16px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                                outline: isSelected ? `2px solid ${s.color}30` : 'none',
                                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? s.color : P.muted }}>
                                    {s.label}
                                </span>
                                <Icon size={14} color={s.color} />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>
                                {count}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Toolbar */}
            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                    <Search size={14} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search by contact person, school, or email..."
                        style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 32 : 12, paddingTop: 8, paddingBottom: 8, border: '1px solid ' + P.border, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}
                    />
                    {search && (
                        <button onClick={() => { setSearch(''); setPage(1) }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                            <X size={13} color={P.muted} />
                        </button>
                    )}
                </div>

                <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 12, background: P.bg, outline: 'none', fontWeight: 600, color: P.text }}
                >
                    <option value="all">All Priorities</option>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} Priority</option>)}
                </select>

                <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                    {total} {total === 1 ? 'inquiry' : 'inquiries'}
                </div>

                <div style={{ display: 'flex', background: P.bg, border: '1px solid ' + P.border, borderRadius: 8, overflow: 'hidden', marginLeft: 'auto' }}>
                    {[{ m: 'list' as const, Icon: Layers, label: 'List' }, { m: 'kanban' as const, Icon: LayoutGrid, label: 'Board' }].map(({ m, Icon, label }) => (
                        <button
                            key={m}
                            onClick={() => setViewMode(m)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 14px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 12,
                                background: viewMode === m ? P.brand : 'transparent',
                                color: viewMode === m ? '#fff' : P.muted,
                                transition: 'all 0.15s'
                            }}
                        >
                            <Icon size={13} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST VIEW (ENTERPRISE GRADE) */}
            {viewMode === 'list' && (
                <>
                    <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        {leads.length === 0 ? (
                            <div style={{ padding: 80, textAlign: 'center' }}>
                                <Target size={44} color={P.border} style={{ marginBottom: 14 }} />
                                <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No inquiries found</div>
                                <div style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>
                                    Try adjusting your search criteria or add a new institutional inquiry.
                                </div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                                    <thead>
                                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid ' + P.border }}>
                                            <th style={{ padding: '12px 14px', width: 38, textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === leads.length && leads.length > 0}
                                                    onChange={toggleSelectAll}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Contact Person
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                School / Institute
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Pipeline Stage
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Assigned Staff
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Priority & Value
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Received
                                            </th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map((l: any, i) => {
                                            const st = stageOf(l.status)
                                            const pr = PRIORITY_CONFIG[l.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
                                            const avatarTone = getAvatarColor(l.name)
                                            const isChecked = selectedIds.includes(l.id)

                                            return (
                                                <tr
                                                    key={l.id}
                                                    className="crm-table-row"
                                                    onClick={() => setDrawerState({ lead: l, tab: 'notes' })}
                                                    style={{
                                                        borderBottom: i < leads.length - 1 ? '1px solid ' + P.borderLight : 'none',
                                                        background: isChecked ? '#F4F8FF' : '#FFFFFF',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s ease'
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleSelect(l.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </td>

                                                    {/* Contact Person */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: 8,
                                                                background: avatarTone.bg,
                                                                color: avatarTone.text,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 12,
                                                                fontWeight: 800,
                                                                flexShrink: 0
                                                            }}>
                                                                {getInitials(l.name)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{l.name}</div>
                                                                <div style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                                    <Mail size={11} />
                                                                    <span>{l.email}</span>
                                                                    {l.phone && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{l.phone}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* School / Institute */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Building2 size={13} color={P.brand} />
                                                            <span style={{ fontSize: 13, color: P.dark, fontWeight: 600 }}>{l.organization}</span>
                                                        </div>
                                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
                                                            Source: {l.source || 'Website'}
                                                        </div>
                                                    </td>

                                                    {/* Pipeline Stage Badge Dropdown */}
                                                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                                        <select
                                                            className="custom-select"
                                                            value={l.status}
                                                            onChange={e => handleStatusChange(l.id, e.target.value)}
                                                            style={{
                                                                background: st.bg,
                                                                color: st.color,
                                                                border: `1px solid ${st.color}30`,
                                                                borderRadius: 20,
                                                                padding: '4px 24px 4px 10px',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                outline: 'none'
                                                            }}
                                                        >
                                                            {DEFAULT_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                                        </select>
                                                    </td>

                                                    {/* Assigned Staff Dropdown */}
                                                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                                        <select
                                                            className="custom-select"
                                                            value={l.assigned_to || ''}
                                                            onChange={e => handleAssignTo(l.id, e.target.value)}
                                                            style={{
                                                                padding: '5px 22px 5px 9px',
                                                                border: '1px solid ' + P.border,
                                                                borderRadius: 6,
                                                                fontSize: 12,
                                                                background: P.bg,
                                                                outline: 'none',
                                                                fontWeight: 600,
                                                                color: l.assigned_to ? P.dark : P.muted,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <option value="">— Unassigned —</option>
                                                            {staffList.map(s => (
                                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* Priority & Value */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Pill label={pr.label} color={pr.color} bg={pr.bg} />
                                                            {l.expected_value && (
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: P.success }}>
                                                                    ₹{Number(l.expected_value).toLocaleString('en-IN')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Received / Age */}
                                                    <td style={{ padding: '12px 16px', fontSize: 12, color: P.muted }} title={new Date(l.created_at).toLocaleString('en-IN')}>
                                                        {formatRelativeTime(l.created_at)}
                                                    </td>

                                                    {/* Action Buttons Column */}
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            {/* View Notes Button (Primary audited flow) */}
                                                            <button
                                                                type="button"
                                                                title="View & Add Notes"
                                                                onClick={() => setDrawerState({ lead: l, tab: 'notes' })}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 5,
                                                                    padding: '6px 11px',
                                                                    borderRadius: 7,
                                                                    border: '1px solid ' + (l.activity_count ? P.brand + '40' : P.border),
                                                                    background: l.activity_count ? P.brandBg : P.bg,
                                                                    color: l.activity_count ? P.brand : P.text,
                                                                    cursor: 'pointer',
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                    transition: 'all 0.15s'
                                                                }}
                                                            >
                                                                <StickyNote size={13} />
                                                                <span>Notes</span>
                                                                {l.activity_count > 0 && (
                                                                    <span style={{
                                                                        background: P.brand,
                                                                        color: '#fff',
                                                                        borderRadius: 10,
                                                                        padding: '0 5px',
                                                                        fontSize: 10,
                                                                        fontWeight: 800
                                                                    }}>
                                                                        {l.activity_count}
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {/* Quick Log Call */}
                                                            <button
                                                                type="button"
                                                                title="Log Call"
                                                                onClick={() => setDrawerState({ lead: l, tab: 'call' })}
                                                                style={{
                                                                    padding: '6px 9px',
                                                                    borderRadius: 7,
                                                                    border: '1px solid ' + P.border,
                                                                    background: P.bg,
                                                                    color: P.text,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <PhoneCall size={13} />
                                                            </button>

                                                            {/* Quick Demo */}
                                                            <button
                                                                type="button"
                                                                title="Schedule Demo"
                                                                onClick={() => setDrawerState({ lead: l, tab: 'demos' })}
                                                                style={{
                                                                    padding: '6px 9px',
                                                                    borderRadius: 7,
                                                                    border: '1px solid ' + P.border,
                                                                    background: P.bg,
                                                                    color: P.text,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Video size={13} />
                                                            </button>

                                                            {/* Converted -> Create School CTA */}
                                                            {l.status === 'converted' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.location.href = `/owner/tenants?provision=true&leadId=${l.id}`}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: 7,
                                                                        border: 'none',
                                                                        background: P.brand,
                                                                        color: '#fff',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 4,
                                                                        fontSize: 11,
                                                                        fontWeight: 800
                                                                    }}
                                                                >
                                                                    <ArrowUpRight size={12} /> Create School
                                                                </button>
                                                            )}

                                                            {/* Delete Button */}
                                                            <button
                                                                type="button"
                                                                title="Delete inquiry"
                                                                onClick={() => handleDeleteLead(l.id, l.name)}
                                                                style={{
                                                                    padding: '6px 8px',
                                                                    borderRadius: 7,
                                                                    border: '1px solid transparent',
                                                                    background: 'transparent',
                                                                    color: P.subtle,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center'
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.color = P.error; e.currentTarget.style.background = P.errorBg }}
                                                                onMouseLeave={e => { e.currentTarget.style.color = P.subtle; e.currentTarget.style.background = 'transparent' }}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid ' + P.border, background: P.card, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: page === 1 ? 0.5 : 1 }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid ' + P.border, background: P.card, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: page === totalPages ? 0.5 : 1 }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* KANBAN BOARD VIEW */}
            {viewMode === 'kanban' && (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24 }}>
                    {DEFAULT_STAGES.map(stage => {
                        const colLeads = leads.filter(l => l.status === stage.key)
                        const totalValue = colLeads.reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0)
                        return (
                            <div
                                key={stage.key}
                                onDragOver={e => { e.preventDefault(); setDragOver(stage.key) }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={e => handleDrop(e, stage.key)}
                                style={{
                                    minWidth: 280,
                                    flex: '0 0 280px',
                                    background: dragOver === stage.key ? stage.bg : '#F1F3F5',
                                    border: '2px dashed ' + (dragOver === stage.key ? stage.color : 'transparent'),
                                    borderRadius: 14,
                                    padding: 14,
                                    transition: 'all 0.15s ease',
                                    maxHeight: 'calc(100vh - 280px)',
                                    overflowY: 'auto'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, position: 'sticky', top: 0, background: 'inherit', paddingBottom: 8, borderBottom: '1px solid ' + P.border }}>
                                    <stage.icon size={15} color={stage.color} />
                                    <span style={{ fontSize: 13, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                                    <span style={{ marginLeft: 'auto', background: stage.color, color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>
                                        {colLeads.length}
                                    </span>
                                </div>
                                {totalValue > 0 && (
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginBottom: 10 }}>
                                        Value: ₹{totalValue.toLocaleString('en-IN')}
                                    </div>
                                )}
                                {colLeads.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '36px 12px', color: P.muted, fontSize: 12 }}>
                                        Drop inquiries here
                                    </div>
                                ) : colLeads.map(lead => (
                                    <KanbanCard
                                        key={lead.id}
                                        lead={lead}
                                        onDragStart={handleDragStart}
                                        onClick={(l: any, targetTab: any) => setDrawerState({ lead: l, tab: targetTab || 'notes' })}
                                        staffList={staffList}
                                    />
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* FLOATING BULK ACTIONS BAR */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1F2937',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    zIndex: 900,
                    animation: 'slideUp 0.2s ease'
                }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {selectedIds.length} {selectedIds.length === 1 ? 'lead' : 'leads'} selected
                    </span>

                    <div style={{ height: 18, width: 1, background: '#374151' }} />

                    {/* Change Status */}
                    <select
                        onChange={e => {
                            if (e.target.value) handleBulkStatusChange(e.target.value)
                        }}
                        defaultValue=""
                        style={{
                            background: '#374151',
                            color: '#fff',
                            border: '1px solid #4B5563',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="" disabled>Move Stage...</option>
                        {DEFAULT_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>

                    {/* Assign Staff */}
                    <select
                        onChange={e => {
                            if (e.target.value) handleBulkAssign(e.target.value)
                        }}
                        defaultValue=""
                        style={{
                            background: '#374151',
                            color: '#fff',
                            border: '1px solid #4B5563',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="" disabled>Assign To...</option>
                        <option value="">Unassign</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                        ))}
                    </select>

                    {/* Delete Selected */}
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkActing}
                        style={{
                            background: P.error,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        <Trash2 size={13} /> Delete
                    </button>

                    <button
                        onClick={() => setSelectedIds([])}
                        style={{
                            background: 'transparent',
                            color: '#9CA3AF',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>
            )}
        </div>
    )
}
