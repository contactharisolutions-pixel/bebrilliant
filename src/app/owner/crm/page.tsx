'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Search, Plus, RefreshCw, X, Loader2, CheckCircle, XCircle,
    AlertTriangle, ChevronLeft, ChevronRight, Mail, Phone,
    Calendar, Clock, Building2, User, Filter, MoreVertical,
    Trash2, Pencil, Eye, ArrowRight, Tag, Download,
    PhoneCall, Video, StickyNote, CheckCheck, Ban, Trophy,
    Sparkles, ArrowUpRight, Zap, Target, History, ShieldCheck,
    Layers, Layout, PieChart as PieIcon, Activity, Heart,
    Globe, PhoneForwarded, MessageSquare, Users
} from 'lucide-react'

// â”€â”€ PALETTE â”” MATCHING INSTITUTIONAL SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9315', brandHover: '#003A72',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6310',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}

// ——————————————————————————————————————————————————————————————————————————————
const STATUSES = [
    { key: 'new', label: 'New Lead', color: '#1FAC63', bg: '#1FAC6310', icon: Sparkles },
    { key: 'contacted', label: 'Contacted', color: '#F0A026', bg: '#F0A02610', icon: PhoneForwarded },
    { key: 'demo_scheduled', label: 'Demo Set', color: '#004B93', bg: '#004B9310', icon: Calendar },
    { key: 'demo_completed', label: 'Qualified', color: '#7C3AED', bg: '#7C3AED10', icon: Video },
    { key: 'converted', label: 'Partner', color: '#059669', bg: '#05966915', icon: Trophy },
    { key: 'lost', label: 'Lost', color: '#EF4444', bg: '#EF444410', icon: Ban },
]

const SOURCES = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Conference', 'Google Ads', 'Manual', 'Other']

type Demo = { id: string; scheduled_at: string; status: string; notes: string }
type Lead = {
    id: string; name: string; organization: string; email: string
    phone?: string; source?: string; status: string; type?: string
    created_at: string; updated_at: string; demos?: Demo[]
}

function statusMeta(key: string) {
    return STATUSES.find(s => s.key === key) ?? STATUSES[0]
}

// â”€â”€ TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useToast() {
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const show = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }
    return { toast, show }
}

// â”€â”€ ADD LEAD MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', source: 'Website', status: 'new', type: 'INSTITUTE' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const submit = async () => {
        if (!form.name || !form.organization || !form.email) { setError('Name, Organization and Email are required.'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/owner/crm/leads', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (!res.ok) { setError(json.error || 'Failed to initialize lead'); return }
            onSuccess(); onClose()
        } finally { setLoading(false) }
    }

    const field = (label: string, key: keyof typeof form, type = 'text') => (
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, background: '#fff', outline: 'none', boxSizing: 'border-box', fontWeight: 650, transition: 'all 0.2s' }} className="focus-ring" />
        </div>
    )

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 20, 40, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div className="glass-card" style={{ borderRadius: 28, width: '100%', maxWidth: 540, boxShadow: '0 40px 120px rgba(0,0,0,0.3)', border: `1px solid ${P.border}`, overflow: 'hidden', animation: 'scaleUp 0.3s ease' }}>
                <style>{`
                    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                `}</style>
                <div style={{ padding: '32px 40px', borderBottom: `1px solid ${P.border}`, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${P.brand}15` }}>
                            <Plus size={22} color={P.brand} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>Initialize Lead Node</h2>
                            <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Add new lead into the partner pipeline</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: P.hover, border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex' }}><X size={20} color={P.muted} /></button>
                </div>

                <div style={{ padding: '32px 40px', background: '#fff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {field('Identity Identity', 'name')}
                        {field('Organization Logic', 'organization')}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {field('Primary Comms', 'email', 'email')}
                        {field('Secondary Link', 'phone', 'tel')}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Node Architecture Type</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            {[
                                { key: 'INSTITUTE', label: 'Enterprise Node' },
                                { key: 'PERSONAL_TEACHER', label: 'Edge Pro Node' }
                            ].map(opt => (
                                <button key={opt.key} onClick={() => setForm(f => ({ ...f, type: opt.key }))} style={{
                                    flex: 1, padding: '14px', borderRadius: 14, border: `2px solid ${form.type === opt.key ? P.brand : P.border}`,
                                    background: form.type === opt.key ? P.brandBg : '#fff', color: form.type === opt.key ? P.brand : P.muted,
                                    fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                                }}>{opt.label}</button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: P.errorBg, border: `1px solid ${P.error}30`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <AlertTriangle size={18} color={P.error} /><span style={{ fontSize: 13, color: P.error, fontWeight: 750 }}>{error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 14 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, color: P.dark, fontSize: 14, fontWeight: 850, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={submit} disabled={loading} className="hover-lift" style={{ flex: 2, padding: '14px 0', borderRadius: 14, border: 'none', background: P.brand, color: '#fff', fontSize: 14, fontWeight: 950, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30` }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {loading ? 'Processing...' : 'Provision Node'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// â”€â”€ SCHEDULE DEMO MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScheduleDemoModal({ lead, onClose, onSuccess }: { lead: Lead; onClose: () => void; onSuccess: () => void }) {
    const [scheduledAt, setScheduledAt] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const submit = async () => {
        if (!scheduledAt) { setError('Select a sync time.'); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_at: scheduledAt, notes }),
            })
            if (!res.ok) throw new Error('Sync failed')
            onSuccess(); onClose()
        } catch (err) { setError('Failed to synchronize schedule.'); } finally { setLoading(false) }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 20, 40, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
            <div className="glass-card" style={{ borderRadius: 28, width: '100%', maxWidth: 480, boxShadow: '0 40px 100px rgba(0,0,0,0.3)', border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '32px 36px', borderBottom: `1px solid ${P.border}`, background: P.bg }}>
                    <h2 style={{ fontSize: 20, fontWeight: 950, color: P.dark, margin: 0 }}>Schedule Architecture Demo</h2>
                    <p style={{ fontSize: 13, color: P.muted, margin: '6px 0 0', fontWeight: 650 }}>{lead.organization} Â· {lead.name}</p>
                </div>
                <div style={{ padding: '32px 36px', background: '#fff' }}>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Synchronization Target</div>
                        <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, background: P.bg, outline: 'none', boxSizing: 'border-box', fontWeight: 650 }} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discussion Notes</div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Notes for the demonstration..."
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, background: P.bg, outline: 'none', resize: 'none', boxSizing: 'border-box', fontWeight: 600, lineHeight: 1.5 }} />
                    </div>
                    {error && <div style={{ background: P.errorBg, border: `1px solid ${P.error}30`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: P.error, fontSize: 13, fontWeight: 750 }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 14 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: `1px solid ${P.border}`, background: P.bg, color: P.dark, fontSize: 14, fontWeight: 850 }}>Cancel</button>
                        <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '14px 0', borderRadius: 12, background: P.brand, color: '#fff', border: 'none', fontSize: 14, fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />} Schedule Node Sync
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ——————————————————————————————————————————————————————————————————————————————
function LeadDrawer({ lead, onClose, onRefresh }: { lead: Lead; onClose: () => void; onRefresh: () => void }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'demos' | 'update'>('overview')
    const [newStatus, setNewStatus] = useState(lead.status)
    const [loading, setLoading] = useState<string | null>(null)
    const { toast, show: showToast } = useToast()
    const [scheduleOpen, setScheduleOpen] = useState(false)

    const updateStatus = async () => {
        setLoading('status')
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) { showToast('Pipeline status synced.', true); onRefresh() }
            else throw new Error('Sync failed')
        } catch (err) { showToast('Sync failed.', false) } finally { setLoading(null) }
    }

    const deleteLead = async () => {
        if (!confirm('Execute node expungement?')) return
        setLoading('delete')
        try {
            const res = await fetch(`/api/owner/crm/leads/${lead.id}`, { method: 'DELETE' })
            if (res.ok) { showToast('Lead removed.', true); onClose(); onRefresh() }
            else throw new Error('Purge failed')
        } catch (err) { showToast('Purge interrupted.', false) } finally { setLoading(null) }
    }

    const sm = statusMeta(lead.status)

    return (
        <>
            {scheduleOpen && <ScheduleDemoModal lead={lead} onClose={() => setScheduleOpen(false)} onSuccess={() => { setScheduleOpen(false); onRefresh() }} />}

            {/* Side Drawer */}
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 20, 40, 0.4)', backdropFilter: 'blur(8px)', zIndex: 990, animation: 'fadeIn 0.3s ease' }} onClick={onClose} />
            <div style={{ position: 'fixed', top: 0, right: 0, width: 540, height: '100vh', background: P.card, boxShadow: '-20px 0 60px rgba(0,0,0,0.15)', zIndex: 995, display: 'flex', flexDirection: 'column', animation: 'slideRight 0.4s cubic-bezier(0.2, 0, 0, 1)', borderLeft: `1px solid ${P.border}` }}>
                <style>{`
                    @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>

                {toast && (
                    <div style={{ position: 'fixed', top: 32, right: 572, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 30px rgba(0,0,0,0.1)', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
                        {toast.ok ? <CheckCircle size={18} color={P.success} /> : <XCircle size={18} color={P.error} />}
                        <span style={{ fontSize: 13, fontWeight: 900, color: toast.ok ? P.success : P.error, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{toast.msg}</span>
                    </div>
                )}

                {/* Drawer Header */}
                <div style={{ padding: '40px 48px', borderBottom: `1px solid ${P.border}`, background: P.bg }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 18, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 950, color: P.brand, boxShadow: `0 12px 24px ${P.brand}15` }}>
                                {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{lead.name}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                    <Building2 size={16} color={P.muted} />
                                    <span style={{ fontSize: 14, color: P.muted, fontWeight: 700 }}>{lead.organization}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="hover-lift" style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: 10, cursor: 'pointer', display: 'flex', color: P.muted }}><X size={20} /></button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ background: sm.bg, color: sm.color, padding: '8px 18px', borderRadius: 12, fontSize: 12, fontWeight: 950, border: `1px solid ${sm.color}30`, display: 'inline-flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <sm.icon size={16} strokeWidth={2.5} /> {sm.label}
                        </span>
                        <span style={{ background: '#fff', color: P.muted, padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 850, border: `1px solid ${P.border}`, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Globe size={16} /> {lead.source || 'Direct Node'}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ padding: '8px 48px', background: '#fff', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 10 }}>
                    {[
                        { key: 'overview', label: 'Details', icon: StickyNote },
                        { key: 'demos', label: `Sync Logs (${lead.demos?.length ?? 0})`, icon: Video },
                        { key: 'update', label: 'Operations', icon: Zap },
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
                            padding: '12px 20px', borderRadius: 0, border: 'none',
                            background: 'transparent', borderBottom: `3px solid ${activeTab === t.key ? P.brand : 'transparent'}`,
                            color: activeTab === t.key ? P.brand : P.muted,
                            fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s'
                        }}>
                           <t.icon size={16} strokeWidth={activeTab === t.key ? 3 : 2} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', background: '#fff' }}>
                    {activeTab === 'overview' && (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {[
                                { icon: User, label: 'Contact Name', val: lead.name },
                                { icon: Building2, label: 'Architecture Entity', val: lead.organization },
                                { icon: Mail, label: 'Comm Channel 1', val: lead.email },
                                { icon: Phone, label: 'Comm Channel 2', val: lead.phone || 'N/A' },
                                { icon: Clock, label: 'Initialization', val: new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px', background: P.bg, borderRadius: 18, border: `1px solid ${P.border}` }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                                        <row.icon size={20} color={P.brand} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: P.dark, marginTop: 2 }}>{row.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'demos' && (
                        <div>
                             {(!lead.demos || lead.demos.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <Video size={32} color={P.muted} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: 0 }}>No architecture demo logs</h3>
                                    <p style={{ fontSize: 14, color: P.muted, margin: '10px 0 24px', fontWeight: 650 }}>Authorize a product demonstration to synchronize this node.</p>
                                    <button onClick={() => setScheduleOpen(true)} style={{ background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 950, cursor: 'pointer', boxShadow: `0 8px 20px ${P.brand}30` }}>Initialize Demo Path</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {lead.demos.map(demo => {
                                        const dStatus = demo.status === 'scheduled' ? { color: P.brand, bg: P.brandBg }
                                            : demo.status === 'completed' ? { color: P.success, bg: P.successBg }
                                                : { color: P.error, bg: P.errorBg }
                                        return (
                                            <div key={demo.id} style={{ border: `1px solid ${P.border}`, borderRadius: 20, padding: 24, background: P.bg }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Calendar size={18} color={P.brand} strokeWidth={2.5} />
                                                        <span style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{new Date(demo.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <span style={{ background: dStatus.bg, color: dStatus.color, padding: '5px 14px', borderRadius: 10, fontSize: 11, fontWeight: 950, textTransform: 'uppercase' }}>{demo.status}</span>
                                                </div>
                                                <p style={{ fontSize: 14, color: P.text, margin: 0, fontWeight: 600, lineHeight: 1.6 }}>{demo.notes || 'No notes provided.'}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'update' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {lead.status !== 'converted' ? (
                                <div className="glass-card" style={{ background: `linear-gradient(135deg, ${P.brand}, ${P.brandHover})`, borderRadius: 24, padding: 32, color: '#fff', boxShadow: `0 20px 40px ${P.brand}30` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trophy size={28} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>Provision Node</h3>
                                            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8, fontWeight: 700 }}>Initialize full institutional partnership.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => window.location.href = `/owner/tenants?provision=${lead.id}`} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: '#fff', color: P.brand, fontSize: 15, fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                                        Begin Onboarding <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ background: P.successBg, border: `1px solid ${P.success}20`, borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: P.success, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${P.success}30` }}>
                                        <CheckCheck size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 16, fontWeight: 950, color: P.success, margin: 0 }}>ENTITY INTEGRATED</h4>
                                        <p style={{ fontSize: 13, color: P.muted, fontWeight: 700, margin: '4px 0 0' }}>This node is active and providing updates.</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pipeline Life-Cycle Stage</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {STATUSES.map(s => (
                                        <button key={s.key} onClick={() => setNewStatus(s.key)} style={{
                                            padding: '14px', borderRadius: 16, border: `2px solid ${newStatus === s.key ? s.color : P.bg}`,
                                            background: newStatus === s.key ? s.bg : '#fff', color: newStatus === s.key ? s.color : P.muted,
                                            fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', textAlign: 'left'
                                        }}>
                                            <s.icon size={16} /> {s.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={updateStatus} disabled={loading === 'status' || newStatus === lead.status} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: newStatus === lead.status ? P.bg : P.brand, color: newStatus === lead.status ? P.muted : '#fff', fontSize: 15, fontWeight: 950, marginTop: 16, cursor: 'pointer', boxShadow: newStatus !== lead.status ? `0 8px 24px ${P.brand}30` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    {loading === 'status' ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />} Synchronize State
                                </button>
                            </div>

                            <button onClick={deleteLead} disabled={loading === 'delete'} style={{ marginTop: 'auto', padding: '16px', borderRadius: 14, border: `1px solid ${P.error}30`, background: P.errorBg, color: P.error, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                {loading === 'delete' ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} Expunge Entity Logic
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// ——————————————————————————————————————————————————————————————————————————————
export default function CrmDemoPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const pageSize = 25
    const [statusFilter, setStatusFilter] = useState('all')
    const [classificationFilter, setClassificationFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showAdd, setShowAdd] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [scheduleOpen, setScheduleOpen] = useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
    const { toast, show: showToast } = useToast()

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(t)
    }, [search])

    const fetchLeads = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ 
                page: String(page), limit: String(pageSize), 
                status: statusFilter, classification: classificationFilter,
                ...(debouncedSearch && { search: debouncedSearch }) 
            })
            const res = await fetch(`/api/owner/crm/leads?${params}`)
            const json = await res.json()
            if (res.ok) { setLeads(json.leads ?? []); setTotal(json.total ?? 0) }
        } finally { setLoading(false); setRefreshing(false) }
    }, [page, statusFilter, classificationFilter, debouncedSearch])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '40px 48px', position: 'relative' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .glass-card { backdrop-filter: blur(10px); background: rgba(254, 254, 254, 0.8) !important; }
                .hover-lift { transition: transform 0.2s cubic-bezier(0.3, 0, 0.2, 1), box-shadow 0.2s !important; }
                .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; }
                .focus-ring:focus-within { box-shadow: 0 0 0 3px ${P.brand}20; border-color: ${P.brand} !important; }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>

            {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSuccess={() => { showToast('Lead entry initialized.', true); fetchLeads(true) }} />}
            {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onRefresh={() => { fetchLeads(true); setSelectedLead(null) }} />}
            {scheduleOpen.open && scheduleOpen.lead && (
                <ScheduleDemoModal 
                    lead={scheduleOpen.lead} 
                    onClose={() => setScheduleOpen({ open: false, lead: null })} 
                    onSuccess={() => { showToast('Architecture demo synchronized.', true); fetchLeads(true) }} 
                />
            )}

            {toast && !selectedLead && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 9000, backdropFilter: 'blur(10px)' }}>
                    {toast.ok ? <CheckCircle size={18} color={P.success} /> : <XCircle size={18} color={P.error} />}
                    <span style={{ fontSize: 13, fontWeight: 900, color: toast.ok ? P.success : P.error, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner Acquisition</div>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>CRM & Pipeline</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>
                        {loading ? 'Compiling pipeline data...' : `${total.toLocaleString()} leads identified in the institutional ecosystem`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => fetchLeads(true)} disabled={refreshing} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} className={refreshing ? 'animate-spin' : ''} /> Sync Pipeline
                    </button>
                    <button onClick={() => setShowAdd(true)} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 10px 25px ${P.brand}30` }}>
                        <Plus size={18} strokeWidth={3} /> Inject Lead
                    </button>
                </div>
            </header>

            {/* STATUS SUMMARY SCROLL */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, overflowX: 'auto', paddingBottom: 10 }} className="hide-scrollbar">
                {STATUSES.map(s => {
                    const isActive = statusFilter === s.key
                    return (
                        <button key={s.key} onClick={() => { setStatusFilter(isActive ? 'all' : s.key); setPage(1) }} className="hover-lift" style={{ minWidth: 200, flexShrink: 0, padding: '24px', borderRadius: 24, border: `1px solid ${isActive ? s.color : P.border}`, background: isActive ? s.bg : P.card, textAlign: 'left', transition: 'all 0.2s', cursor: 'pointer', boxShadow: isActive ? `0 12px 24px ${s.color}15` : '0 4px 15px rgba(0,0,0,0.02)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <s.icon size={22} color={s.color} strokeWidth={2.5} />
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: P.dark }}>{leads.filter(l => l.status === s.key).length}</div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
                        </button>
                    )
                })}
            </div>

            {/* FILTERS */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by name, entity, email, source..." className="focus-ring" style={{ width: '100%', padding: '14px 20px', paddingLeft: 48, border: `1px solid ${P.border}`, borderRadius: 16, fontSize: 14, color: P.dark, background: P.card, outline: 'none', fontWeight: 650 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 14 }}>
                    {[
                        { key: 'all', label: 'Ecosystem' },
                        { key: 'institutional', label: 'Enterprise Nodes' },
                        { key: 'independent', label: 'Edge Nodes' }
                    ].map(f => (
                        <button key={f.key} onClick={() => setClassificationFilter(f.key)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 850, border: 'none', background: classificationFilter === f.key ? '#fff' : 'transparent', color: classificationFilter === f.key ? P.brand : P.muted, cursor: 'pointer', boxShadow: classificationFilter === f.key ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* GRID */}
            <div className="glass-card" style={{ borderRadius: 24, border: `1px solid ${P.border}`, overflow: 'hidden', minHeight: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.03)' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                        <Loader2 size={40} color={P.brand} className="animate-spin" />
                    </div>
                ) : leads.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                        <Users size={64} color={P.border} style={{ marginBottom: 20 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 950, color: P.dark }}>No leads identified</h3>
                        <p style={{ fontSize: 14, color: P.muted, marginTop: 8, fontWeight: 650 }}>Adjust your search filters or inject a new lead.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: P.bg }}>
                                <tr>
                                    {['Node Identity', 'Entity Architecture', 'Sales Stage', 'Comm Link', 'Sync Logs', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => {
                                    const sm = statusMeta(lead.status)
                                    return (
                                        <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover-row" style={{ borderBottom: `1px solid ${P.bg}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <td style={{ padding: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: P.brandBg, color: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 950, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                                        {lead.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 15, fontWeight: 850, color: P.dark }}>{lead.name}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={10} /> {lead.source || 'Direct Node'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '24px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: P.text }}>{lead.organization}</div>
                                                <div style={{ fontSize: 10, color: P.muted, fontWeight: 850, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.04em' }}>{lead.type?.replace('_', ' ') || 'ENTERPRISE'}</div>
                                            </td>
                                            <td style={{ padding: '24px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 950, textTransform: 'uppercase', border: `1px solid ${sm.color}20` }}>
                                                    <sm.icon size={13} strokeWidth={2.5} /> {sm.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span style={{ fontSize: 13, color: P.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} color={P.muted} /> {lead.email}</span>
                                                    {lead.phone && <span style={{ fontSize: 12, color: P.muted, fontWeight: 650, display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {lead.phone}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '24px' }}>
                                                {lead.demos && lead.demos.length > 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: P.brand, fontWeight: 950, fontSize: 14 }}>
                                                        <Video size={16} /> {lead.demos.length} Cycle(s)
                                                    </div>
                                                ) : <span style={{ color: P.muted, fontSize: 13, fontWeight: 600 }}>-</span>}
                                            </td>
                                            <td style={{ padding: '24px' }} onClick={e => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => setSelectedLead(lead)} className="hover-lift" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: P.brand }}><Eye size={18} /></button>
                                                    <button onClick={() => setScheduleOpen({ open: true, lead })} className="hover-lift" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: P.brand }}><Calendar size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ padding: '24px 32px', borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 750 }}>Telemetric Page {page} of {totalPages} Â· {total} Records total</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', color: P.dark, fontSize: 13, fontWeight: 850, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev Cycle</button>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', color: P.dark, fontSize: 13, fontWeight: 850, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Next Cycle</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
