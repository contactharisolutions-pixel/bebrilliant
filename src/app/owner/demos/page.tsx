'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Video, MapPin, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle,
    X, Loader2, Search, Filter, RefreshCw, ChevronRight, User, Building2,
    CheckCircle, XCircle, Sparkles, Send, FileText, ArrowRight, ShieldCheck,
    PhoneCall, Star, Award, AlertCircle, Eye, ExternalLink, ThumbsUp, ThumbsDown,
    ArrowUpRight, Copy, Check, Sliders, Layers, LayoutGrid, DollarSign
} from 'lucide-react'

// ── COLOR PALETTE ────────────────────────────────────────────────────────────
const P = {
    bg: '#F8F9FA',
    card: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    brand: '#004B93',
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

const DEMO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending_assignment: { label: 'Pending Staff',    color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
    staff_suggested:    { label: 'Staff Suggested',  color: '#2563EB', bg: '#EFF6FF', icon: UserCheck },
    confirmed:          { label: 'Staff Confirmed',  color: '#059669', bg: '#ECFDF5', icon: ShieldCheck },
    scheduled:          { label: 'Demo Scheduled',   color: '#7C3AED', bg: '#F5F3FF', icon: Calendar },
    completed:          { label: 'Completed',        color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
    missed:             { label: 'Missed',           color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
    cancelled:          { label: 'Cancelled',        color: '#6B7280', bg: '#F3F4F6', icon: X },
}

const OUTCOMES = [
    { key: 'closed_won',        label: 'Closed Won',        sublabel: 'Ready to enroll school',           color: '#059669', bg: '#ECFDF5', icon: Award },
    { key: 'highly_interested', label: 'Highly Interested', sublabel: 'Fast-track follow-up required',     color: '#2563EB', bg: '#EFF6FF', icon: Sparkles },
    { key: 'interested',        label: 'Interested',        sublabel: 'Standard evaluation & demo follow-up', color: '#D97706', bg: '#FFFBEB', icon: ThumbsUp },
    { key: 'proposal_required', label: 'Proposal Required', sublabel: 'Submit commercial / custom quote',  color: '#7C3AED', bg: '#F5F3FF', icon: FileText },
    { key: 'closed_lost',       label: 'Closed Lost',       sublabel: 'Budget mismatch or not feasible',   color: '#DC2626', bg: '#FEF2F2', icon: ThumbsDown },
]

const DEMO_MODULES = [
    'Online Examinations', 'Offline OMR Grading', 'Course & Syllabus Oversight',
    'Tenant Fee & Payments', 'Student & Parent Portal', 'Faculty Question Bank'
]

const AVATAR_COLORS = [
    { bg: '#EEF4FF', text: '#004B93' },
    { bg: '#ECFDF5', text: '#059669' },
    { bg: '#F5F3FF', text: '#7C3AED' },
    { bg: '#FFF7E6', text: '#D97706' },
    { bg: '#EFF6FF', text: '#2563EB' },
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

export default function DemoManagementPage() {
    const [demos, setDemos] = useState<any[]>([])
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [staffList, setStaffList] = useState<any[]>([])
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

    // Modals
    const [confirmTarget, setConfirmTarget] = useState<any>(null)
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [confirmSaving, setConfirmSaving] = useState(false)

    const [scheduleTarget, setScheduleTarget] = useState<any>(null)
    const [scheduleTime, setScheduleTime] = useState('')
    const [meetingLink, setMeetingLink] = useState('')
    const [scheduleSaving, setScheduleSaving] = useState(false)

    // Complete Demo Report Modal
    const [reportTarget, setReportTarget] = useState<any>(null)
    const [reportForm, setReportForm] = useState({
        outcome: 'interested',
        interest_level: 4,
        deal_probability: 70,
        demo_notes: '',
        selected_modules: ['Online Examinations', 'Offline OMR Grading']
    })
    const [reportSaving, setReportSaving] = useState(false)

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error'; action?: { label: string; onClick: () => void } } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error', action?: { label: string; onClick: () => void }) => {
        setToast({ msg, type, action })
        setTimeout(() => setToast(null), action ? 8000 : 3500)
    }

    const fetchDemos = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ status: statusFilter })
            const res = await fetch(`/api/owner/demos?${params}`)
            if (res.ok) {
                const data = await res.json()
                setDemos(data.demos ?? [])
                setCounts(data.counts ?? {})
            }
        } catch (e) {
            showToast('Failed to load demo requests.', 'error')
        } finally {
            setLoading(false); setRefreshing(false)
        }
    }, [statusFilter])

    const fetchStaff = useCallback(async () => {
        try {
            const res = await fetch('/api/owner/rbac')
            if (res.ok) {
                const data = await res.json()
                setStaffList(data.users ?? [])
            }
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => { fetchDemos() }, [fetchDemos])
    useEffect(() => { fetchStaff() }, [fetchStaff])

    // Handlers
    async function handleConfirmStaff() {
        if (!confirmTarget) return
        setConfirmSaving(true)
        try {
            const res = await fetch(`/api/owner/demos/${confirmTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'confirm_staff',
                    assigned_staff_id: selectedStaffId || confirmTarget.suggested_staff_id
                })
            })
            if (res.ok) {
                showToast('Staff member confirmed for demo!', 'success')
                setConfirmTarget(null)
                fetchDemos(true)
            } else {
                const j = await res.json()
                showToast(j.error || 'Failed to confirm staff.', 'error')
            }
        } finally {
            setConfirmSaving(false)
        }
    }

    async function handleScheduleDemo() {
        if (!scheduleTarget || !scheduleTime) return
        setScheduleSaving(true)
        try {
            const res = await fetch(`/api/owner/demos/${scheduleTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'schedule',
                    scheduled_at: scheduleTime,
                    meeting_link: meetingLink
                })
            })
            if (res.ok) {
                showToast('Demo locked on schedule and synced with CRM!', 'success')
                setScheduleTarget(null)
                setScheduleTime('')
                setMeetingLink('')
                fetchDemos(true)
            } else {
                const j = await res.json()
                showToast(j.error || 'Failed to schedule demo.', 'error')
            }
        } finally {
            setScheduleSaving(false)
        }
    }

    async function handleSubmitReport() {
        if (!reportTarget) return
        setReportSaving(true)
        try {
            const fullNotes = [
                reportForm.selected_modules.length > 0 ? `Modules: ${reportForm.selected_modules.join(', ')}` : '',
                reportForm.demo_notes
            ].filter(Boolean).join('\n\n')

            const res = await fetch(`/api/owner/demos/${reportTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'complete',
                    outcome: reportForm.outcome,
                    interest_level: reportForm.interest_level,
                    deal_probability: reportForm.deal_probability,
                    demo_notes: fullNotes
                })
            })
            if (res.ok) {
                const leadId = reportTarget.lead_id
                showToast(
                    reportForm.outcome === 'closed_won'
                        ? 'Demo Closed Won! Moved to Onboarding Process.'
                        : 'Demo report completed! Moved to Onboarding Lifecycle.',
                    'success',
                    {
                        label: 'Open Onboarding',
                        onClick: () => {
                            window.location.href = `/owner/onboarding?leadId=${leadId}`
                        }
                    }
                )
                setReportTarget(null)
                fetchDemos(true)
            } else {
                const j = await res.json()
                showToast(j.error || 'Failed to submit report.', 'error')
            }
        } finally {
            setReportSaving(false)
        }
    }

    function toggleModule(mod: string) {
        setReportForm(f => ({
            ...f,
            selected_modules: f.selected_modules.includes(mod)
                ? f.selected_modules.filter(m => m !== mod)
                : [...f.selected_modules, mod]
        }))
    }

    const filteredDemos = useMemo(() => {
        return demos.filter(d => {
            if (!search) return true
            const s = search.toLowerCase()
            return d.lead?.name?.toLowerCase().includes(s) ||
                   d.lead?.organization?.toLowerCase().includes(s) ||
                   d.lead?.email?.toLowerCase().includes(s) ||
                   d.lead?.phone?.toLowerCase().includes(s)
        })
    }, [demos, search])

    const totalDemos = Object.values(counts).reduce((a, b) => a + b, 0)
    const pendingCount = (counts.pending_assignment || 0) + (counts.staff_suggested || 0)
    const scheduledCount = counts.scheduled || 0
    const completedCount = counts.completed || 0

    return (
        <div style={{ padding: '28px 36px', background: P.bg, minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                * { box-sizing: border-box; }
                .demo-card:hover { border-color: ${P.brand} !important; box-shadow: 0 4px 16px rgba(0,0,0,0.06) !important; }
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: 28, right: 28, background: toast.type === 'success' ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.2)', zIndex: 99999, animation: 'slideUp 0.25s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{toast.msg}</span>
                    </div>
                    {toast.action && (
                        <button type="button" onClick={toast.action.onClick} style={{ background: '#fff', color: P.success, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginLeft: 8 }}>
                            {toast.action.label}
                        </button>
                    )}
                </div>
            )}

            {/* Top Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Video size={22} color={P.brand} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.4px' }}>Demo Operations & Staff Manager</h1>
                        <p style={{ fontSize: 13, color: P.muted, margin: '3px 0 0', fontWeight: 500 }}>
                            Track school product presentations, assign specialized staff hosts, and record institutional evaluation reports.
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => fetchDemos(true)}
                        disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', background: P.card, border: `1px solid ${P.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, color: P.text, cursor: 'pointer' }}
                    >
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Overview Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { title: 'Total Demo Requests', value: totalDemos, icon: Video, color: P.brand, bg: P.brandBg, filter: 'all' },
                    { title: 'Pending Staff Review', value: pendingCount, icon: AlertTriangle, color: P.warning, bg: P.warningBg, filter: 'pending_assignment' },
                    { title: 'Scheduled Presentations', value: scheduledCount, icon: Calendar, color: P.purple, bg: P.purpleBg, filter: 'scheduled' },
                    { title: 'Completed Demos', value: completedCount, icon: CheckCircle2, color: P.success, bg: P.successBg, filter: 'completed' },
                ].map(k => {
                    const isSelected = statusFilter === k.filter
                    return (
                        <div
                            key={k.title}
                            onClick={() => setStatusFilter(k.filter)}
                            style={{
                                background: P.card,
                                border: '1px solid ' + (isSelected ? k.color : P.border),
                                borderRadius: 12,
                                padding: '16px 18px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? `0 4px 12px ${k.color}15` : '0 1px 3px rgba(0,0,0,0.03)',
                                outline: isSelected ? `2px solid ${k.color}30` : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? k.color : P.muted }}>{k.title}</span>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <k.icon size={15} color={k.color} />
                                </div>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: P.dark }}>{k.value}</div>
                        </div>
                    )
                })}
            </div>

            {/* Filter Tabs & Toolbar */}
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All Requests', count: totalDemos },
                        { key: 'pending_assignment', label: 'Pending Staff', count: counts.pending_assignment },
                        { key: 'confirmed', label: 'Confirmed Staff', count: counts.confirmed },
                        { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
                        { key: 'completed', label: 'Completed', count: counts.completed },
                    ].map(t => {
                        const isSelected = statusFilter === t.key
                        return (
                            <button
                                key={t.key}
                                onClick={() => setStatusFilter(t.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 14px',
                                    borderRadius: 8,
                                    border: `1px solid ${isSelected ? P.brand : P.border}`,
                                    background: isSelected ? P.brandBg : '#fff',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: isSelected ? P.brand : P.muted,
                                    transition: 'all 0.15s'
                                }}
                            >
                                <span>{t.label}</span>
                                {t.count !== undefined && (
                                    <span style={{ background: isSelected ? P.brand : P.borderLight, color: isSelected ? '#fff' : P.muted, padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', width: 280 }}>
                        <Search size={14} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by prospect, school, or email..."
                            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: P.bg }}
                        />
                    </div>
                </div>
            </div>

            {/* Demos Feed */}
            {loading ? (
                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: P.muted, fontWeight: 600, marginTop: 12, fontSize: 13 }}>Loading demo queue...</p>
                </div>
            ) : filteredDemos.length === 0 ? (
                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 60, textAlign: 'center' }}>
                    <Video size={40} color={P.border} style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: P.dark, margin: 0 }}>No Demo Requests Found</h3>
                    <p style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>
                        {search ? 'No requests match your search criteria.' : 'There are no demo requests in this status.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    {filteredDemos.map(demo => {
                        const st = DEMO_STATUS_CONFIG[demo.status] || DEMO_STATUS_CONFIG.pending_assignment
                        const lead = demo.lead || {}
                        const suggested = demo.suggested_staff
                        const assigned = demo.assigned_staff
                        const avatarTone = getAvatarColor(lead.name)

                        return (
                            <div
                                key={demo.id}
                                className="demo-card"
                                style={{
                                    background: P.card,
                                    border: `1px solid ${P.border}`,
                                    borderRadius: 14,
                                    padding: '18px 22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 20,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {/* Left: Prospect Details */}
                                <div style={{ flex: 2, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: avatarTone.bg, color: avatarTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                                        {getInitials(lead.name)}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: P.dark }}>{lead.name || 'Prospect'}</span>
                                            <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <st.icon size={12} /> {st.label}
                                            </span>
                                            <span style={{ background: demo.demo_type === 'on_site' ? '#FFFBEB' : '#EFF6FF', color: demo.demo_type === 'on_site' ? '#D97706' : '#2563EB', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                                                {demo.demo_type === 'on_site' ? 'CAMPUS VISIT' : 'VIDEO CALL'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: P.text, fontWeight: 700 }}>
                                                <Building2 size={13} color={P.brand} /> {lead.organization || 'Educational Institute'}
                                            </span>
                                            <span>•</span>
                                            <span>{lead.email}</span>
                                            {lead.phone && <span>• {lead.phone}</span>}
                                        </div>

                                        {demo.scheduled_at && (
                                            <div style={{ fontSize: 12, color: P.purple, fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Calendar size={13} />
                                                <span>Scheduled: {new Date(demo.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                            </div>
                                        )}

                                        {demo.demo_notes && (
                                            <div style={{ fontSize: 12, color: P.muted, marginTop: 4, fontStyle: 'italic' }}>
                                                Notes: {demo.demo_notes}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Center: Staff Host Info */}
                                <div style={{ flex: 1.3, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                        Staff Host Assignment
                                    </div>
                                    {assigned ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ShieldCheck size={16} color={P.success} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{assigned.first_name} {assigned.last_name}</div>
                                                <div style={{ fontSize: 11, color: P.muted }}>Confirmed Staff ({assigned.role})</div>
                                            </div>
                                        </div>
                                    ) : suggested ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Sparkles size={16} color={P.info} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: P.brand }}>{suggested.first_name} {suggested.last_name}</div>
                                                <div style={{ fontSize: 11, color: P.muted }}>Auto-Suggested Host</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: P.warning, fontWeight: 700 }}>
                                            Unassigned — Pending Staff Confirmation
                                        </div>
                                    )}
                                </div>

                                {/* Right: Action Buttons */}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {!assigned && (
                                        <button
                                            onClick={() => {
                                                setConfirmTarget(demo)
                                                setSelectedStaffId(demo.suggested_staff_id || '')
                                            }}
                                            style={{ padding: '8px 14px', background: P.brand, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <UserCheck size={14} /> Confirm Staff
                                        </button>
                                    )}

                                    {assigned && demo.status !== 'scheduled' && demo.status !== 'completed' && (
                                        <button
                                            onClick={() => {
                                                setScheduleTarget(demo)
                                                setScheduleTime(demo.preferred_date ? `${demo.preferred_date}T10:00` : '')
                                            }}
                                            style={{ padding: '8px 14px', background: P.purple, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Calendar size={14} /> Set Schedule & Link
                                        </button>
                                    )}

                                    {demo.status === 'scheduled' && (
                                        <button
                                            onClick={() => setReportTarget(demo)}
                                            style={{ padding: '8px 15px', background: P.success, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <FileText size={14} /> Complete Demo Report
                                        </button>
                                    )}

                                    {demo.meeting_link && (
                                        <a href={demo.meeting_link} target="_blank" rel="noreferrer" title="Open Meeting Link" style={{ padding: '8px 10px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, color: P.brand, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>
                                            <ExternalLink size={14} />
                                        </a>
                                    )}

                                    {demo.status === 'completed' ? (
                                        <button
                                            onClick={() => window.location.href = `/owner/onboarding?leadId=${demo.lead_id}&search=${encodeURIComponent(lead.organization || lead.name || '')}`}
                                            title="Move to Onboarding Process"
                                            style={{
                                                padding: '8px 14px',
                                                background: P.success,
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontWeight: 800,
                                                fontSize: 12,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <ShieldCheck size={14} /> Onboarding Process
                                            <ArrowRight size={13} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => window.location.href = `/owner/crm`}
                                            title="View in CRM"
                                            style={{ padding: '8px 10px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, color: P.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL 1: COMPLETE DEMO REPORT (ENTERPRISE UPGRADE) */}
            {reportTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${P.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
                        {/* Header with Prospect Context */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: P.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color={P.success} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: P.dark }}>Complete Demo Report</h3>
                                    <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>
                                        {reportTarget.lead?.name} • {reportTarget.lead?.organization}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setReportTarget(null)} style={{ background: P.bg, border: '1px solid ' + P.border, borderRadius: 6, cursor: 'pointer', padding: 4 }}>
                                <X size={16} color={P.muted} />
                            </button>
                        </div>

                        {/* Visual Outcome Selector */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.dark, marginBottom: 8 }}>
                                Demo Outcome *
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                {OUTCOMES.map(oc => {
                                    const isSel = reportForm.outcome === oc.key
                                    const Icon = oc.icon
                                    return (
                                        <button
                                            key={oc.key}
                                            type="button"
                                            onClick={() => setReportForm({ ...reportForm, outcome: oc.key })}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                border: isSel ? `2px solid ${oc.color}` : `1px solid ${P.border}`,
                                                background: isSel ? oc.bg : '#fff',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 8,
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <Icon size={16} color={oc.color} style={{ marginTop: 2, flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: isSel ? oc.color : P.dark }}>{oc.label}</div>
                                                <div style={{ fontSize: 10, color: P.muted, marginTop: 1 }}>{oc.sublabel}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Customer Interest Level (Interactive 5-Scale) */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: P.dark }}>Customer Interest Level</label>
                                <span style={{ fontSize: 11, fontWeight: 800, color: P.brand }}>
                                    {reportForm.interest_level === 5 ? '⭐ Champions / Immediate Rollout' :
                                     reportForm.interest_level === 4 ? '⭐ Strong Purchase Intent' :
                                     reportForm.interest_level === 3 ? '⭐ Moderate / Comparing' :
                                     reportForm.interest_level === 2 ? '⭐ Hesitant' : '⭐ Low Interest'}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map(lvl => {
                                    const isSel = reportForm.interest_level === lvl
                                    return (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setReportForm({ ...reportForm, interest_level: lvl })}
                                            style={{
                                                padding: '8px 0',
                                                borderRadius: 8,
                                                border: isSel ? `1px solid ${P.brand}` : `1px solid ${P.border}`,
                                                background: isSel ? P.brandBg : P.bg,
                                                color: isSel ? P.brand : P.text,
                                                fontSize: 12,
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 4
                                            }}
                                        >
                                            <Star size={13} fill={isSel ? P.brand : 'transparent'} color={isSel ? P.brand : P.muted} />
                                            <span>{lvl}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Deal Probability with Interactive Chips */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: P.dark }}>Deal Conversion Probability</label>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: reportForm.deal_probability >= 75 ? P.successBg : reportForm.deal_probability >= 50 ? P.warningBg : P.borderLight,
                                    color: reportForm.deal_probability >= 75 ? P.success : reportForm.deal_probability >= 50 ? P.warning : P.muted
                                }}>
                                    {reportForm.deal_probability}% Probability
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                {[25, 50, 70, 85, 100].map(pct => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => setReportForm({ ...reportForm, deal_probability: pct })}
                                        style={{
                                            flex: 1,
                                            padding: '6px 0',
                                            borderRadius: 6,
                                            border: reportForm.deal_probability === pct ? `1px solid ${P.brand}` : `1px solid ${P.border}`,
                                            background: reportForm.deal_probability === pct ? P.brandBg : '#fff',
                                            color: reportForm.deal_probability === pct ? P.brand : P.muted,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={reportForm.deal_probability}
                                onChange={e => setReportForm({ ...reportForm, deal_probability: parseInt(e.target.value) || 50 })}
                                style={{ width: '100%', accentColor: P.brand }}
                            />
                        </div>

                        {/* Key Modules Demonstrated */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.dark, marginBottom: 6 }}>
                                Modules Demonstrated to Customer
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {DEMO_MODULES.map(mod => {
                                    const isSel = reportForm.selected_modules.includes(mod)
                                    return (
                                        <button
                                            key={mod}
                                            type="button"
                                            onClick={() => toggleModule(mod)}
                                            style={{
                                                padding: '4px 9px',
                                                borderRadius: 6,
                                                border: isSel ? `1px solid ${P.brand}` : `1px solid ${P.border}`,
                                                background: isSel ? P.brandBg : P.bg,
                                                color: isSel ? P.brand : P.muted,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isSel ? '✓ ' : '+ '}{mod}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Execution Notes */}
                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.dark, marginBottom: 6 }}>
                                Execution Notes & Key Objections
                            </label>
                            <textarea
                                rows={3}
                                value={reportForm.demo_notes}
                                onChange={e => setReportForm({ ...reportForm, demo_notes: e.target.value })}
                                placeholder="Core requirements, principal's technical feedback, pricing timeline, next follow-up checkpoint..."
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none', resize: 'vertical' }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setReportTarget(null)}
                                style={{ flex: 1, padding: 11, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: P.text }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                disabled={reportSaving}
                                style={{
                                    flex: 2,
                                    padding: 11,
                                    background: reportForm.outcome === 'closed_won' ? P.brand : P.success,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 800,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                {reportSaving ? (
                                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : reportForm.outcome === 'closed_won' ? (
                                    <>
                                        <Award size={15} /> Complete & Convert to School
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={15} /> Submit Demo Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: CONFIRM STAFF ASSIGNMENT */}
            {confirmTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCheck size={18} color={P.brand} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Confirm Staff Assignment</h3>
                                    <div style={{ fontSize: 12, color: P.muted }}>Assign specialist to host the product demonstration</div>
                                </div>
                            </div>
                            <button onClick={() => setConfirmTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        {confirmTarget.suggested_staff && (
                            <div style={{ background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 10, padding: 12, marginBottom: 18 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: P.brand, marginBottom: 2 }}>
                                    ⚡ AI Workload & Location Recommendation
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>
                                    {confirmTarget.suggested_staff.first_name} {confirmTarget.suggested_staff.last_name}
                                </div>
                                <div style={{ fontSize: 11, color: P.muted }}>{confirmTarget.assignment_reason || 'Optimal availability and regional match.'}</div>
                            </div>
                        )}

                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.dark, marginBottom: 6 }}>Select Staff Member *</label>
                            <select
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none', background: P.bg }}
                            >
                                <option value="">Select Staff...</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setConfirmTarget(null)} style={{ flex: 1, padding: 10, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: P.text }}>Cancel</button>
                            <button onClick={handleConfirmStaff} disabled={confirmSaving} style={{ flex: 2, padding: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {confirmSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />} Confirm Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: SET SCHEDULE & MEETING LINK */}
            {scheduleTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: P.purpleBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={18} color={P.purple} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Lock Demo Schedule & Link</h3>
                                    <div style={{ fontSize: 12, color: P.muted }}>Coordinates meeting slot with institutional stakeholder</div>
                                </div>
                            </div>
                            <button onClick={() => setScheduleTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.dark, marginBottom: 6 }}>Date & Time Slot *</label>
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={e => setScheduleTime(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.dark, marginBottom: 6 }}>Meeting Link (Google Meet / Zoom / Microsoft Teams)</label>
                            <input
                                type="url"
                                value={meetingLink}
                                onChange={e => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 13, background: P.bg, outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setScheduleTarget(null)} style={{ flex: 1, padding: 10, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: P.text }}>Cancel</button>
                            <button onClick={handleScheduleDemo} disabled={scheduleSaving} style={{ flex: 2, padding: 10, background: P.purple, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {scheduleSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={15} />} Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
