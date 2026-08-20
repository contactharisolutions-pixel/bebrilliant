'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    Search, Plus, RefreshCw, X, Loader2, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, Mail, Phone, Calendar, Clock,
    Building2, User, Filter, Trash2, Pencil, Download, Upload,
    PhoneCall, Video, StickyNote, Trophy, Ban, Sparkles,
    ArrowUpRight, Target, History, Layers, LayoutGrid, BarChart2,
    Globe, MessageSquare, Users, Star, Flame, Zap, TrendingUp,
    CheckCheck, AlertCircle, MoreHorizontal, Send, Paperclip,
    Bell, Tag, ChevronDown, Activity, DollarSign, Percent, Save,
} from 'lucide-react'

// ── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#EEF4FF',
    cta: '#F0A026', ctaBg: '#FFF7E6',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#059669', successBg: '#ECFDF5',
    warning: '#D97706', warningBg: '#FFFBEB',
    error: '#DC2626', errorBg: '#FEF2F2',
    info: '#2563EB', infoBg: '#EFF6FF',
    purple: '#7C3AED', purpleBg: '#F5F3FF',
}

// ── PIPELINE STAGES ───────────────────────────────────────────────────────────
const DEFAULT_STAGES = [
    { key: 'new',           label: 'New Inquiry',    color: '#059669', bg: '#ECFDF5', icon: Sparkles },
    { key: 'contacted',     label: 'Contacted',      color: '#D97706', bg: '#FFFBEB', icon: PhoneCall },
    { key: 'demo_scheduled',label: 'Demo Scheduled', color: '#2563EB', bg: '#EFF6FF', icon: Calendar },
    { key: 'demo_completed',label: 'Demo Completed', color: '#7C3AED', bg: '#F5F3FF', icon: Video },
    { key: 'converted',     label: 'Enrolled',       color: '#059669', bg: '#ECFDF5', icon: Trophy },
    { key: 'lost',          label: 'Closed',         color: '#DC2626', bg: '#FEF2F2', icon: Ban },
]

const SOURCES = ['Website', 'Referral', 'Phone Call', 'Social Media', 'Conference', 'Google Search', 'Manual', 'Import', 'Other']
const PRIORITY_CONFIG = {
    low:    { label: 'Low',    color: P.muted,   bg: P.hover },
    medium: { label: 'Medium', color: P.warning, bg: P.warningBg },
    high:   { label: 'High',   color: P.error,   bg: P.errorBg },
    urgent: { label: 'Urgent', color: P.purple,  bg: P.purpleBg },
}

function stageOf(key: string) { return DEFAULT_STAGES.find(s => s.key === key) ?? DEFAULT_STAGES[0] }
function scoreColor(s: number) { return s >= 70 ? P.error : s >= 40 ? P.warning : P.muted }
function scoreBg(s: number)    { return s >= 70 ? P.errorBg : s >= 40 ? P.warningBg : P.hover }

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
    return <span style={{ background: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
}

function Toast({ msg, ok, action }: { msg: string; ok: boolean; action?: { label: string; onClick: () => void } }) {
    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: ok ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999, animation: 'slideUp 0.3s ease' }}>
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
        if (!form.name || !form.organization || !form.email) { setError('Contact Person Name, School Name, and Email are required.'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/owner/crm/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, expected_value: form.expected_value ? parseFloat(form.expected_value) : null }) })
            if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed'); return }
            onSuccess(); onClose()
        } finally { setLoading(false) }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: P.card, borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color={P.brand} /></div>
                    <div><div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>Add New Inquiry</div><div style={{ fontSize: 12, color: P.muted }}>Enter school inquiry details</div></div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                </div>
                {error && <div style={{ background: P.errorBg, color: P.error, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 700 }}>{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Contact Person Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rajesh Verma" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>School / Institute Name *</label>
                        <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="e.g. Bright Future Convent School" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Email Address *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@school.org" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Phone Number</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Inquiry Source</label>
                        <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }}>
                            {SOURCES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Priority</label>
                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }}>
                            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Estimated Value (₹)</label>
                        <input type="number" value={form.expected_value} onChange={e => setForm(f => ({ ...f, expected_value: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 5 }}>Assign To Staff</label>
                        <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }}>
                            <option value="">— Unassigned —</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px 0', border: '1px solid ' + P.border, borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: P.bg, fontSize: 13 }}>Cancel</button>
                    <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '11px 0', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: P.brand, color: '#fff', fontSize: 13, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={14} /> Save Inquiry</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── DETAIL DRAWER ────────────────────────────────────────────────────────────
function LeadDetailDrawer({ lead, staffList, onClose, onSuccess }: { lead: any; staffList: any[]; onClose: () => void; onSuccess: () => void }) {
    const [tab, setTab] = useState<'info' | 'demos' | 'activities'>('info')
    const [fullLead, setFullLead] = useState<any>(lead)
    const [demos, setDemos] = useState<any[]>(lead.demos || [])
    const [activities, setActivities] = useState<any[]>([])
    const [loadingDemos, setLoadingDemos] = useState(false)
    const [loadingActivities, setLoadingActivities] = useState(true)

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

    const [demoForm, setDemoForm] = useState({ scheduled_at: '', conducted_by: '', notes: '' })
    const [actForm, setActForm] = useState({ type: 'note', content: '' })
    const [saving, setSaving] = useState(false)
    const [scheduling, setScheduling] = useState(false)
    const [logging, setLogging] = useState(false)

    const fetchLeadDetails = useCallback(async () => {
        setLoadingDemos(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}`)
            if (res.ok) {
                const d = await res.json()
                setFullLead(d.lead)
                setDemos(d.lead.demos || [])
            }
        } finally {
            setLoadingDemos(false)
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

    useEffect(() => {
        fetchLeadDetails()
        fetchActivities()
    }, [fetchLeadDetails, fetchActivities])

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
            }
        } finally {
            setSaving(false)
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
                fetchActivities()
                onSuccess()
            }
        } finally {
            setScheduling(false)
        }
    }

    async function handleAddActivity() {
        if (!actForm.content.trim()) return
        setLogging(true)
        const res = await fetch(`/api/owner/crm/leads/${lead.id}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actForm)
        })
        if (res.ok) {
            setActForm(f => ({ ...f, content: '' }))
            fetchActivities()
        }
        setLogging(false)
    }

    const ACTIVITY_TYPES = [
        { key: 'note', label: 'Note', icon: StickyNote, color: P.info },
        { key: 'call', label: 'Call', icon: PhoneCall, color: P.success },
        { key: 'email', label: 'Email', icon: Mail, color: P.purple },
        { key: 'meeting', label: 'Meeting', icon: Video, color: P.warning },
    ]

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />
            
            <div style={{ position: 'relative', width: 520, background: P.card, height: '100%', overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + P.border, background: P.card }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>{fullLead.name}</div>
                            <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>{fullLead.organization} · {fullLead.email}</div>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color={P.muted} /></button>
                    </div>
                    
                    <div style={{ display: 'flex', borderBottom: '1px solid ' + P.border, padding: '0 8px', marginTop: 12 }}>
                        {[
                            { key: 'info', label: 'Inquiry Details', icon: User },
                            { key: 'demos', label: 'Scheduled Demos', icon: Video },
                            { key: 'activities', label: 'Notes & Timeline', icon: History }
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key as any)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '10px 14px', background: 'none', border: 'none',
                                    cursor: 'pointer', fontWeight: 700, fontSize: 12,
                                    color: tab === t.key ? P.brand : P.muted,
                                    borderBottom: tab === t.key ? '2px solid ' + P.brand : '2px solid transparent',
                                    marginBottom: -1, transition: 'all 0.15s'
                                }}
                            >
                                <t.icon size={13} /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                    {tab === 'info' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Contact Person</label>
                                    <input value={formInfo.name} onChange={e => setFormInfo({ ...formInfo, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>School / Institute</label>
                                    <input value={formInfo.organization} onChange={e => setFormInfo({ ...formInfo, organization: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Email Address</label>
                                    <input value={formInfo.email} onChange={e => setFormInfo({ ...formInfo, email: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Phone Number</label>
                                    <input value={formInfo.phone} onChange={e => setFormInfo({ ...formInfo, phone: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid ' + P.border, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Assigned Staff Member</label>
                                    <select value={formInfo.assigned_to} onChange={e => setFormInfo({ ...formInfo, assigned_to: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                        <option value="">— Unassigned —</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Priority</label>
                                        <select value={formInfo.priority} onChange={e => setFormInfo({ ...formInfo, priority: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Inquiry Source</label>
                                        <select value={formInfo.source} onChange={e => setFormInfo({ ...formInfo, source: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                            {SOURCES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 5 }}>Estimated Value (₹)</label>
                                    <input type="number" value={formInfo.expected_value} onChange={e => setFormInfo({ ...formInfo, expected_value: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                                </div>
                            </div>

                            <button onClick={handleSaveDetails} disabled={saving} style={{ padding: '11px', background: P.brand, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Changes
                            </button>
                        </div>
                    )}

                    {tab === 'demos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, padding: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 12 }}>Schedule Demo Presentation</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 10, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 4 }}>Date & Time</label>
                                            <input type="datetime-local" value={demoForm.scheduled_at} onChange={e => setDemoForm({ ...demoForm, scheduled_at: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 12, background: P.card, outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 4 }}>Staff Host</label>
                                            <select value={demoForm.conducted_by} onChange={e => setDemoForm({ ...demoForm, conducted_by: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 12, background: P.card, outline: 'none', fontWeight: 600 }}>
                                                <option value="">— Unassigned —</option>
                                                {staffList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 10, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 4 }}>Demo Agenda / Notes</label>
                                        <textarea value={demoForm.notes} onChange={e => setDemoForm({ ...demoForm, notes: e.target.value })} rows={2} placeholder="Add agenda notes..." style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 12, background: P.card, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <button onClick={handleScheduleDemo} disabled={scheduling || !demoForm.scheduled_at} style={{ padding: '8px 12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !demoForm.scheduled_at ? 0.6 : 1 }}>
                                        {scheduling ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={13} />} Schedule Demo
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Scheduled Demos ({demos.length})</div>
                                {loadingDemos ? (
                                    <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={20} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
                                ) : demos.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: P.muted, fontSize: 12 }}>No demos scheduled yet.</div>
                                ) : demos.map(d => {
                                    const cond = staffList.find(s => s.id === d.conducted_by)
                                    return (
                                        <div key={d.id} style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>{new Date(d.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                <span style={{ background: d.status === 'completed' ? P.successBg : P.warningBg, color: d.status === 'completed' ? P.success : P.warning, padding: '2px 6px', borderRadius: 5, fontSize: 9, fontWeight: 800 }}>{d.status.toUpperCase()}</span>
                                            </div>
                                            {d.notes && <div style={{ fontSize: 12, color: P.text, marginBottom: 6 }}>{d.notes}</div>}
                                            {cond && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: P.muted }}>
                                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: P.brand }}>{cond.first_name?.[0]}</div>
                                                    Host: {cond.first_name} {cond.last_name}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {tab === 'activities' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: P.bg, borderRadius: 12, padding: 14, border: '1px solid ' + P.border }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    {ACTIVITY_TYPES.map(t => (
                                        <button key={t.key} onClick={() => setActForm(f => ({ ...f, type: t.key }))}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid ' + (actForm.type === t.key ? t.color : P.border), background: actForm.type === t.key ? t.color + '20' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: actForm.type === t.key ? t.color : P.muted }}>
                                            <t.icon size={11} /> {t.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input value={actForm.content} onChange={e => setActForm(f => ({ ...f, content: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddActivity()} placeholder="Add a follow-up note..." style={{ flex: 1, padding: '8px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card, outline: 'none' }} />
                                    <button onClick={handleAddActivity} disabled={logging || !actForm.content.trim()} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: P.brand, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 12, opacity: actForm.content.trim() && !logging ? 1 : 0.6 }}>
                                        {logging ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={12} />} Save Note
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                {loadingActivities ? (
                                    <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
                                ) : activities.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: P.muted, fontSize: 13 }}>No activity notes yet.</div>
                                ) : activities.map((a, i) => {
                                    const t = ACTIVITY_TYPES.find(t => t.key === a.type) ?? ACTIVITY_TYPES[0]
                                    return (
                                        <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: i < activities.length - 1 ? 16 : 0, marginBottom: i < activities.length - 1 ? 16 : 0, borderBottom: i < activities.length - 1 ? '1px solid ' + P.border : 'none' }}>
                                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: t.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}><t.icon size={13} color={t.color} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                                    <Pill label={t.label} color={t.color} bg={t.color + '20'} />
                                                    <span style={{ fontSize: 11, color: P.muted }}>{new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div style={{ fontSize: 13, color: P.text, lineHeight: 1.5 }}>{a.content}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function KanbanCard({ lead, onDragStart, onClick, onStageChange, stages, staffList }: any) {
    const stage = stageOf(lead.status)
    const priority = PRIORITY_CONFIG[lead.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
    const assigned = staffList.find((s: any) => s.id === lead.assigned_to)
    return (
        <div
            draggable
            onDragStart={e => onDragStart(e, lead)}
            onClick={() => onClick(lead)}
            style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 10, userSelect: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = stage.color }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = P.border }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 2 }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={10} /> {lead.organization}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <Pill label={priority.label} color={priority.color} bg={priority.bg} />
                {lead.expected_value && <Pill label={'₹' + Number(lead.expected_value).toLocaleString('en-IN')} color={P.success} bg={P.successBg} />}
                {lead.source && <Pill label={lead.source} color={P.muted} bg={P.hover} />}
            </div>
            
            {assigned && (
                <div style={{ marginTop: 10, fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 5, background: P.bg, padding: '4px 8px', borderRadius: 6, width: 'fit-content' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: P.brand }}>
                        {assigned.first_name?.[0] || '?'}
                    </div>
                    <span>{assigned.first_name} {assigned.last_name}</span>
                </div>
            )}

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: P.muted }}>{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                {lead.status === 'converted' && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); window.location.href = `/owner/tenants?provision=true&leadId=${lead.id}`; }}
                        style={{ padding: '3px 8px', border: 'none', borderRadius: 6, background: P.brand, color: '#fff', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ArrowUpRight size={10} /> Create School
                    </button>
                )}
            </div>
        </div>
    )
}

function AnalyticsPanel({ onClose }: { onClose: () => void }) {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/owner/crm/analytics?days=30')
            .then(r => r.json()).then(d => { setAnalytics(d); setLoading(false) })
    }, [])

    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: P.card, borderRadius: 20, padding: 40, textAlign: 'center' }}>
                <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div style={{ color: P.muted, fontWeight: 600 }}>Loading summary report...</div>
            </div>
        </div>
    )

    const s = analytics?.summary ?? {}

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 20 }}>
            <div style={{ background: P.card, borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: P.purpleBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={16} color={P.purple} /></div>
                    <div><div style={{ fontSize: 15, fontWeight: 800, color: P.dark }}>Inquiry Report (Last 30 Days)</div></div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Total Inquiries',  value: s.totalLeads ?? 0,     icon: Users,     color: P.brand,   bg: P.brandBg },
                        { label: 'Enrolled Schools',  value: s.convertedLeads ?? 0, icon: Trophy,    color: P.success, bg: P.successBg },
                        { label: 'Enrollment Rate',  value: (s.conversionRate ?? 0) + '%', icon: Percent, color: P.purple, bg: P.purpleBg },
                        { label: 'Estimated Value',  value: '₹' + Number(s.pipelineValue ?? 0).toLocaleString('en-IN'), icon: DollarSign, color: P.warning, bg: P.warningBg },
                    ].map(k => (
                        <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <k.icon size={18} color={k.color} />
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: P.dark }}>{k.value}</div>
                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{k.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: P.bg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Inquiry Stages Progress</div>
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
                                <div style={{ height: 8, background: P.border, borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: width + '%', background: st.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

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

    const [showAddModal, setShowAddModal] = useState(false)
    const [activityLead, setActivityLead] = useState<any>(null)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [staffList, setStaffList] = useState<any[]>([])
    const [stages, setStages] = useState(DEFAULT_STAGES)
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
            // Fetch per-stage counts (unfiltered) for the KPI strip
            const countsRes = await fetch('/api/owner/crm/leads?limit=1&page=1&status=all')
            if (countsRes.ok) {
                const countsData = await countsRes.json()
                // Build stage counts from analytics (all leads, no pagination)
                const analyticsRes = await fetch('/api/owner/crm/analytics?days=3650')
                if (analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json()
                    const map: Record<string, number> = {}
                    for (const f of analyticsData.funnel ?? []) {
                        map[f.status] = f.count
                    }
                    setStageCounts(map)
                }
            }
        } finally { setLoading(false); setRefreshing(false) }
    }, [search, statusFilter, priorityFilter, page])

    useEffect(() => { fetchLeads() }, [fetchLeads])
    useEffect(() => {
        fetch('/api/owner/rbac?role=staff').then(r => r.json()).then(d => setStaffList(d.users ?? []))
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        } catch {
            setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: lead.status } : l))
            showToast('Failed to update status', false)
        }
    }

    async function handleStatusChange(leadId: string, newStatus: string) {
        setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        try {
            await fetch(`/api/owner/crm/leads/bulk`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        } catch {
            showToast('Failed to assign inquiry', false)
            fetchLeads(true)
        }
    }

    async function handleExport() {
        const params = new URLSearchParams({ search, status: statusFilter })
        window.open(`/api/owner/crm/leads/export?${params}`, '_blank')
    }

    const totalPages = Math.ceil(total / 25)
    const filtered = leads

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ color: P.muted, fontWeight: 600 }}>Loading inquiries...</div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: P.bg, padding: '28px 32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } * { box-sizing: border-box; }`}</style>
            {toast && <Toast msg={toast.msg} ok={toast.ok} action={toast.action} />}
            {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSuccess={() => fetchLeads(true)} staffList={staffList} />}
            {activityLead && <LeadDetailDrawer lead={activityLead} staffList={staffList} onClose={() => setActivityLead(null)} onSuccess={() => fetchLeads(true)} />}
            {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: '-0.5px' }}>CRM & Pipeline</div>
                    <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Track new inquiries, follow-ups, and convert leads into registered tenants.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => fetchLeads(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button onClick={() => setShowAnalytics(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', background: P.purpleBg, border: '1px solid ' + P.purple + '40', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.purple }}>
                        <BarChart2 size={14} /> View Reports
                    </button>
                    <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}>
                        <Download size={14} /> Export
                    </button>
                    <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: P.brand, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                        <Plus size={14} /> Add Inquiry
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
                {DEFAULT_STAGES.map(s => {
                    const count = stageCounts[s.key] ?? leads.filter(l => l.status === s.key).length
                    return (
                        <button key={s.key} onClick={() => { setStatusFilter(statusFilter === s.key ? 'all' : s.key); setPage(1) }}
                            style={{ background: statusFilter === s.key ? s.bg : P.card, border: '1px solid ' + (statusFilter === s.key ? s.color : P.border), borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{count}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.label}</div>
                        </button>
                    )
                })}
            </div>

            {/* Toolbar */}
            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search inquiries by contact or school name..." style={{ width: '100%', paddingLeft: 33, paddingRight: search ? 30 : 12, paddingTop: 8, paddingBottom: 8, border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                    {search && <button onClick={() => { setSearch(''); setPage(1) }} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={12} color={P.muted} /></button>}
                </div>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '8px 11px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none', fontWeight: 600 }}>
                    <option value="all">All Priority</option>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{total} inquiries</span>
                <div style={{ display: 'flex', background: P.bg, border: '1px solid ' + P.border, borderRadius: 9, overflow: 'hidden', marginLeft: 'auto' }}>
                    {[{ m: 'list' as const, Icon: Layers, label: 'List' }, { m: 'kanban' as const, Icon: LayoutGrid, label: 'Board' }].map(({ m, Icon, label }) => (
                        <button key={m} onClick={() => setViewMode(m)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: viewMode === m ? P.brand : 'transparent', color: viewMode === m ? '#fff' : P.muted, transition: 'all 0.15s' }}>
                            <Icon size={13} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <>
                    <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: 80, textAlign: 'center' }}>
                                <Target size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No inquiries found</div>
                                <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Adjust your search filter or add a new inquiry.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                                    <thead>
                                        <tr style={{ background: P.bg, borderBottom: '1px solid ' + P.border }}>
                                            {['Contact Person', 'School / Institute', 'Status', 'Assigned Staff', 'Priority', 'Estimated Value', 'Source', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((l: any, i) => {
                                            const st = stageOf(l.status)
                                            const pr = PRIORITY_CONFIG[l.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
                                            return (
                                                <tr key={l.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid ' + P.border : 'none', transition: 'background 0.1s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{l.name}</div>
                                                        <div style={{ fontSize: 11, color: P.muted }}>{l.email}</div>
                                                    </td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Building2 size={12} color={P.muted} />
                                                            <span style={{ fontSize: 13, color: P.text, fontWeight: 600 }}>{l.organization}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <select value={l.status} onChange={e => handleStatusChange(l.id, e.target.value)}
                                                            style={{ background: st.bg, color: st.color, border: 'none', borderRadius: 7, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                                            {DEFAULT_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <select value={l.assigned_to || ''} onChange={e => handleAssignTo(l.id, e.target.value)}
                                                            style={{ padding: '5px 10px', border: '1px solid ' + P.border, borderRadius: 8, fontSize: 12, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                                            <option value="">— Unassigned —</option>
                                                            {staffList.map(s => (
                                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '13px 16px' }}><Pill label={pr.label} color={pr.color} bg={pr.bg} /></td>
                                                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: l.expected_value ? P.success : P.muted }}>
                                                        {l.expected_value ? '₹' + Number(l.expected_value).toLocaleString('en-IN') : '—'}
                                                    </td>
                                                    <td style={{ padding: '13px 16px' }}><Pill label={l.source || 'Manual'} color={P.muted} bg={P.hover} /></td>
                                                    <td style={{ padding: '13px 16px' }}>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button title="View Notes & Activities" onClick={() => setActivityLead(l)}
                                                                style={{ padding: '5px 9px', borderRadius: 8, border: '1px solid ' + P.border, background: P.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: P.text }}>
                                                                <History size={11} /> View Notes
                                                            </button>
                                                            {l.status === 'converted' && (
                                                                <button type="button" onClick={() => window.location.href = `/owner/tenants?provision=true&leadId=${l.id}`}
                                                                    style={{ padding: '5px 9px', borderRadius: 8, border: 'none', background: P.brand, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800 }}>
                                                                    <ArrowUpRight size={11} /> Create School
                                                                </button>
                                                            )}
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
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid ' + P.border, background: P.card, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid ' + P.border, background: P.card, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
                        </div>
                    )}
                </>
            )}

            {/* KANBAN VIEW */}
            {viewMode === 'kanban' && (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
                    {DEFAULT_STAGES.map(stage => {
                        const colLeads = filtered.filter(l => l.status === stage.key)
                        const totalValue = colLeads.reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0)
                        return (
                            <div key={stage.key}
                                onDragOver={e => { e.preventDefault(); setDragOver(stage.key) }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={e => handleDrop(e, stage.key)}
                                style={{ minWidth: 260, flex: '0 0 260px', background: dragOver === stage.key ? stage.bg : P.bg, border: '2px dashed ' + (dragOver === stage.key ? stage.color : P.border), borderRadius: 16, padding: 14, transition: 'all 0.15s', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, position: 'sticky', top: 0, background: 'inherit', paddingBottom: 10, borderBottom: '1px solid ' + P.border }}>
                                    <stage.icon size={14} color={stage.color} />
                                    <span style={{ fontSize: 12, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                                    <span style={{ marginLeft: 'auto', background: stage.color, color: '#fff', borderRadius: 12, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{colLeads.length}</span>
                                </div>
                                {totalValue > 0 && (
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginBottom: 10 }}>
                                        Total Value: ₹{totalValue.toLocaleString('en-IN')}
                                    </div>
                                )}
                                {colLeads.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px 10px', color: P.muted, fontSize: 12 }}>
                                        Drag inquiries here
                                    </div>
                                ) : colLeads.map(lead => (
                                    <KanbanCard key={lead.id} lead={lead} stages={stages}
                                        onDragStart={handleDragStart}
                                        onClick={(l: any) => setActivityLead(l)}
                                        onStageChange={handleStatusChange}
                                        staffList={staffList} />
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
