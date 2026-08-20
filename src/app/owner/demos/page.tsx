'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Video, MapPin, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle,
    X, Loader2, Search, Filter, RefreshCw, ChevronRight, User, Building2,
    CheckCircle, XCircle, Sparkles, Send, FileText, ArrowRight, ShieldCheck,
    PhoneCall, Star, Award, AlertCircle, Eye, ExternalLink, ThumbsUp, ThumbsDown
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

const DEMO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending_assignment: { label: 'Pending Staff',    color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
    staff_suggested:    { label: 'Staff Suggested',  color: '#2563EB', bg: '#EFF6FF', icon: UserCheck },
    confirmed:          { label: 'Staff Confirmed',  color: '#059669', bg: '#ECFDF5', icon: ShieldCheck },
    scheduled:          { label: 'Demo Scheduled',   color: '#7C3AED', bg: '#F5F3FF', icon: Calendar },
    completed:          { label: 'Completed',        color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
    missed:             { label: 'Missed',           color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
    cancelled:          { label: 'Cancelled',        color: '#6B7280', bg: '#F3F4F6', icon: X },
}

export default function DemoManagementPage() {
    const [demos, setDemos] = useState<any[]>([])
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [staffList, setStaffList] = useState<any[]>([])

    // Modals
    const [confirmTarget, setConfirmTarget] = useState<any>(null)
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [confirmSaving, setConfirmSaving] = useState(false)

    const [scheduleTarget, setScheduleTarget] = useState<any>(null)
    const [scheduleTime, setScheduleTime] = useState('')
    const [meetingLink, setMeetingLink] = useState('')
    const [scheduleSaving, setScheduleSaving] = useState(false)

    const [reportTarget, setReportTarget] = useState<any>(null)
    const [reportForm, setReportForm] = useState({
        outcome: 'interested',
        interest_level: 4,
        deal_probability: 70,
        demo_notes: ''
    })
    const [reportSaving, setReportSaving] = useState(false)

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

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
            showToast('Failed to load demos.', 'error')
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
                showToast('Demo scheduled successfully!', 'success')
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
            const res = await fetch(`/api/owner/demos/${reportTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'complete',
                    ...reportForm
                })
            })
            if (res.ok) {
                showToast('Demo report submitted and case completed!', 'success')
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

    const filteredDemos = demos.filter(d => {
        if (!search) return true
        const s = search.toLowerCase()
        return d.lead?.name?.toLowerCase().includes(s) ||
               d.lead?.organization?.toLowerCase().includes(s) ||
               d.lead?.email?.toLowerCase().includes(s)
    })

    const totalDemos = Object.values(counts).reduce((a, b) => a + b, 0)
    const pendingCount = (counts.pending_assignment || 0) + (counts.staff_suggested || 0)
    const scheduledCount = counts.scheduled || 0
    const completedCount = counts.completed || 0

    return (
        <div style={{ padding: '32px 40px', background: P.bg, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={22} color={P.brand} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0 }}>Demo Operations & Staff Manager</h1>
                            <p style={{ fontSize: 13, color: P.muted, margin: '2px 0 0', fontWeight: 600 }}>Manage demo requests, confirm staff assignments, and monitor execution SLA.</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => fetchDemos(true)}
                    disabled={refreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer' }}
                >
                    <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                </button>
            </div>

            {/* KPI Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <KpiCard title="Total Demo Requests" value={String(totalDemos)} icon={Video} change="All Time" positive={true} />
                <KpiCard title="Pending Staff Review" value={String(pendingCount)} icon={AlertTriangle} change="Requires Owner Action" positive={pendingCount === 0} />
                <KpiCard title="Scheduled Demos" value={String(scheduledCount)} icon={Calendar} change="Active Pipeline" positive={true} />
                <KpiCard title="Demos Completed" value={String(completedCount)} icon={CheckCircle2} change="Success Rate" positive={true} />
            </div>

            {/* Filter Tabs & Search */}
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All Requests', count: totalDemos },
                        { key: 'pending_assignment', label: 'Pending Assignment', count: counts.pending_assignment },
                        { key: 'staff_suggested', label: 'Suggested Staff', count: counts.staff_suggested },
                        { key: 'confirmed', label: 'Staff Confirmed', count: counts.confirmed },
                        { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
                        { key: 'completed', label: 'Completed', count: counts.completed },
                    ].map(t => {
                        const isSelected = statusFilter === t.key
                        return (
                            <button
                                key={t.key}
                                onClick={() => setStatusFilter(t.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
                                    border: `1px solid ${isSelected ? P.brand : P.border}`,
                                    background: isSelected ? P.brandBg : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                                    color: isSelected ? P.brand : P.dark
                                }}
                            >
                                <span>{t.label}</span>
                                {t.count !== undefined && (
                                    <span style={{ background: isSelected ? P.brand : P.bg, color: isSelected ? '#fff' : P.muted, padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div style={{ position: 'relative', width: 260 }}>
                    <Search size={15} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search lead or school..."
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Demos List */}
            {loading ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: P.muted, fontWeight: 700, marginTop: 12 }}>Loading demo requests...</p>
                </div>
            ) : filteredDemos.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Video size={40} color={P.muted} style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: P.dark, margin: 0 }}>No Demo Requests Found</h3>
                    <p style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>There are no demo requests matching this status filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                    {filteredDemos.map(demo => {
                        const st = DEMO_STATUS_CONFIG[demo.status] || DEMO_STATUS_CONFIG.pending_assignment
                        const lead = demo.lead || {}
                        const suggested = demo.suggested_staff
                        const assigned = demo.assigned_staff

                        return (
                            <div key={demo.id} style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                {/* Left: Prospect details */}
                                <div style={{ flex: 2, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: demo.demo_type === 'on_site' ? '#FEF3C7' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {demo.demo_type === 'on_site' ? <MapPin size={22} color="#D97706" /> : <Video size={22} color="#2563EB" />}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>{lead.name || 'Unnamed Prospect'}</span>
                                            <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <st.icon size={12} /> {st.label}
                                            </span>
                                            <span style={{ background: demo.demo_type === 'on_site' ? '#FFFBEB' : '#EFF6FF', color: demo.demo_type === 'on_site' ? '#D97706' : '#2563EB', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                                                {demo.demo_type === 'on_site' ? 'ON-SITE DEMO' : 'ONLINE DEMO'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={13} /> {lead.organization || 'No Organization'}</span>
                                            {lead.phone && <span>• {lead.phone}</span>}
                                            <span>• {lead.email}</span>
                                        </div>
                                        {demo.preferred_date && (
                                            <div style={{ fontSize: 12, color: P.brand, fontWeight: 800, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Clock size={13} /> Customer Preferred Slot: {demo.preferred_date} {demo.preferred_time || ''}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Center: Staff Assignment Status */}
                                <div style={{ flex: 1.5, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                        Staff Assignment (Manager Flow)
                                    </div>
                                    {assigned ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ShieldCheck size={16} color={P.success} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>{assigned.first_name} {assigned.last_name}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>Confirmed Staff ({assigned.role})</div>
                                            </div>
                                        </div>
                                    ) : suggested ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Sparkles size={16} color={P.info} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: P.brand }}>{suggested.first_name} {suggested.last_name}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>Auto-Suggested (Score: {demo.assignment_score || 80})</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: P.warning, fontWeight: 800 }}>⚠ Unassigned — Select Staff</div>
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
                                            style={{ padding: '9px 16px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 12px ${P.brand}25` }}
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
                                            style={{ padding: '9px 16px', background: P.purple, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Calendar size={14} /> Set Schedule & Link
                                        </button>
                                    )}

                                    {demo.status === 'scheduled' && (
                                        <button
                                            onClick={() => setReportTarget(demo)}
                                            style={{ padding: '9px 16px', background: P.success, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <FileText size={14} /> Complete Demo Report
                                        </button>
                                    )}

                                    {demo.meeting_link && (
                                        <a href={demo.meeting_link} target="_blank" rel="noreferrer" style={{ padding: '9px 12px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, color: P.brand, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 800, fontSize: 12 }}>
                                            <ExternalLink size={14} /> Link
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL 1: CONFIRM STAFF ASSIGNMENT */}
            {confirmTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserCheck size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Confirm Staff Assignment</h3>
                            </div>
                            <button onClick={() => setConfirmTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <p style={{ fontSize: 13, color: P.muted, fontWeight: 600, margin: '0 0 20px' }}>
                            Owner/Manager Confirmation is required before assigning staff to conducting demos.
                        </p>

                        {confirmTarget.suggested_staff && (
                            <div style={{ background: P.brandBg, border: `1px solid ${P.brand}30`, borderRadius: 14, padding: 14, marginBottom: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                    ⚡ System Auto-Suggestion Engine
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>
                                    {confirmTarget.suggested_staff.first_name} {confirmTarget.suggested_staff.last_name}
                                </div>
                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{confirmTarget.assignment_reason || 'Highest area & availability score'}</div>
                            </div>
                        )}

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Staff Member *</label>
                            <select
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff' }}
                            >
                                <option value="">Select Staff...</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setConfirmTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleConfirmStaff} disabled={confirmSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {confirmSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Confirm & Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: SET SCHEDULE & MEETING LINK */}
            {scheduleTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Calendar size={20} color={P.purple} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Set Demo Schedule & Link</h3>
                            </div>
                            <button onClick={() => setScheduleTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date & Time *</label>
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={e => setScheduleTime(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Online Meeting Link (Google Meet / Zoom / Teams)</label>
                            <input
                                type="url"
                                value={meetingLink}
                                onChange={e => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setScheduleTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleScheduleDemo} disabled={scheduleSaving} style={{ flex: 2, padding: 12, background: P.purple, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {scheduleSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={16} />} Lock Demo Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: DEMO COMPLETION REPORT */}
            {reportTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <FileText size={20} color={P.success} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Complete Demo Report</h3>
                            </div>
                            <button onClick={() => setReportTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Outcome *</label>
                            <select
                                value={reportForm.outcome}
                                onChange={e => setReportForm({ ...reportForm, outcome: e.target.value })}
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff' }}
                            >
                                <option value="highly_interested">🔥 Highly Interested</option>
                                <option value="interested">👍 Interested (Follow-up Required)</option>
                                <option value="proposal_required">📄 Proposal Required</option>
                                <option value="closed_won">🏆 Closed Won (Enroll Customer)</option>
                                <option value="closed_lost">❌ Closed Lost</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer Interest Level (1-5)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={reportForm.interest_level}
                                    onChange={e => setReportForm({ ...reportForm, interest_level: parseInt(e.target.value) || 3 })}
                                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deal Probability (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={reportForm.deal_probability}
                                    onChange={e => setReportForm({ ...reportForm, deal_probability: parseInt(e.target.value) || 50 })}
                                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Execution Notes & Customer Questions</label>
                            <textarea
                                rows={3}
                                value={reportForm.demo_notes}
                                onChange={e => setReportForm({ ...reportForm, demo_notes: e.target.value })}
                                placeholder="Summary of demo discussions..."
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setReportTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSubmitReport} disabled={reportSaving} style={{ flex: 2, padding: 12, background: P.success, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {reportSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Submit Demo Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
