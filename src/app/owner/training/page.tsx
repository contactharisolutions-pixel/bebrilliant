'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Award, Star, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle,
    X, Loader2, Search, Filter, RefreshCw, ChevronRight, User, Building2,
    CheckCircle, XCircle, Sparkles, Send, FileText, ArrowRight, ShieldCheck,
    Video, Users, ThumbsUp, MessageSquare, PlayCircle, Rocket
} from 'lucide-react'
import { P } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

const TRAINING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending_trainer:  { label: 'Pending Trainer', color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
    trainer_assigned: { label: 'Trainer Assigned',color: '#2563EB', bg: '#EFF6FF', icon: UserCheck },
    scheduled:        { label: 'Session Scheduled',color: '#7C3AED', bg: '#F5F3FF', icon: Calendar },
    in_progress:      { label: 'In Progress',      color: '#004B93', bg: '#EEF4FF', icon: PlayCircle },
    completed:        { label: 'Live & Completed', color: '#059669', bg: '#ECFDF5', icon: Rocket },
    cancelled:        { label: 'Cancelled',        color: '#6B7280', bg: '#F3F4F6', icon: X },
}

export default function TrainingManagementPage() {
    const [cases, setCases] = useState<any[]>([])
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [staffList, setStaffList] = useState<any[]>([])

    // Modals
    const [assignTarget, setAssignTarget] = useState<any>(null)
    const [selectedTrainerId, setSelectedTrainerId] = useState('')
    const [assignSaving, setAssignSaving] = useState(false)

    const [sessionTarget, setSessionTarget] = useState<any>(null)
    const [sessionForm, setSessionForm] = useState({
        topic: '',
        conducted_at: '',
        duration_mins: 60,
        attendees_count: 5,
        meeting_link: '',
        session_notes: ''
    })
    const [sessionSaving, setSessionSaving] = useState(false)

    const [completeTarget, setCompleteTarget] = useState<any>(null)
    const [completeForm, setCompleteForm] = useState({
        feedback_rating: 5,
        feedback_comments: ''
    })
    const [completeSaving, setCompleteSaving] = useState(false)

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    const fetchCases = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ status: statusFilter })
            const res = await fetch(`/api/owner/training?${params}`)
            if (res.ok) {
                const data = await res.json()
                setCases(data.cases ?? [])
                setStatusCounts(data.statusCounts ?? {})
            }
        } catch (e) {
            showToast('Failed to load training cases.', 'error')
        } finally {
            setLoading(false); setRefreshing(false)
        }
    }, [statusFilter])

    const fetchStaff = useCallback(async () => {
        try {
            const res = await fetch('/api/owner/rbac')
            if (res.ok) {
                const d = await res.json()
                setStaffList(d.users ?? [])
            }
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => { fetchCases() }, [fetchCases])
    useEffect(() => { fetchStaff() }, [fetchStaff])

    async function handleAssignTrainer() {
        if (!assignTarget || !selectedTrainerId) return
        setAssignSaving(true)
        try {
            const res = await fetch(`/api/owner/training/${assignTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'assign_trainer', assigned_trainer_id: selectedTrainerId })
            })
            if (res.ok) {
                showToast('Trainer assigned successfully!', 'success')
                setAssignTarget(null)
                fetchCases(true)
            }
        } finally {
            setAssignSaving(false)
        }
    }

    async function handleLogSession() {
        if (!sessionTarget || !sessionForm.topic) return
        setSessionSaving(true)
        try {
            const res = await fetch(`/api/owner/training/${sessionTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'log_session', ...sessionForm })
            })
            if (res.ok) {
                showToast('Training session logged!', 'success')
                setSessionTarget(null)
                setSessionForm({ topic: '', conducted_at: '', duration_mins: 60, attendees_count: 5, meeting_link: '', session_notes: '' })
                fetchCases(true)
            }
        } finally {
            setSessionSaving(false)
        }
    }

    async function handleCompleteTraining() {
        if (!completeTarget) return
        setCompleteSaving(true)
        try {
            const res = await fetch(`/api/owner/training/${completeTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_training', ...completeForm })
            })
            if (res.ok) {
                showToast('🚀 Customer Go-Live & Training Completed!', 'success')
                setCompleteTarget(null)
                fetchCases(true)
            }
        } finally {
            setCompleteSaving(false)
        }
    }

    const filteredCases = cases.filter(c => {
        if (!search) return true
        return c.organization_name?.toLowerCase().includes(search.toLowerCase())
    })

    const totalCases = Object.values(statusCounts).reduce((a, b) => a + b, 0)
    const inProgressCount = (statusCounts.trainer_assigned || 0) + (statusCounts.scheduled || 0) + (statusCounts.in_progress || 0)
    const completedCount = statusCounts.completed || 0

    return (
        <div style={{ padding: '32px 40px', background: P.bg, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={22} color={P.brand} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0 }}>Customer Training & Go-Live Operations</h1>
                            <p style={{ fontSize: 13, color: P.muted, margin: '2px 0 0', fontWeight: 600 }}>Structured training delivery, session attendance logging & Go-Live validation.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => fetchCases(true)}
                    disabled={refreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer' }}
                >
                    <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <KpiCard title="Total Training Cases" value={String(totalCases)} icon={Award} change="All Time" positive={true} />
                <KpiCard title="Pending Trainer Assignment" value={String(statusCounts.pending_trainer || 0)} icon={AlertTriangle} change="Requires Action" positive={(statusCounts.pending_trainer || 0) === 0} />
                <KpiCard title="Active Training Sessions" value={String(inProgressCount)} icon={PlayCircle} change="In Delivery" positive={true} />
                <KpiCard title="Successful Go-Lives" value={String(completedCount)} icon={Rocket} change="Go-Live Rate" positive={true} />
            </div>

            {/* Status Tabs & Search */}
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All Cases', count: totalCases },
                        { key: 'pending_trainer', label: 'Pending Trainer', count: statusCounts.pending_trainer },
                        { key: 'trainer_assigned', label: 'Trainer Assigned', count: statusCounts.trainer_assigned },
                        { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
                        { key: 'completed', label: 'Completed & Live', count: statusCounts.completed },
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
                                <span style={{ background: isSelected ? P.brand : P.bg, color: isSelected ? '#fff' : P.muted, padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                    {t.count || 0}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div style={{ position: 'relative', width: 260 }}>
                    <Search size={15} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search institution..."
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Cases List */}
            {loading ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: P.muted, fontWeight: 700, marginTop: 12 }}>Loading training cases...</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Award size={40} color={P.muted} style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: P.dark, margin: 0 }}>No Training Cases Found</h3>
                    <p style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>Training cases are automatically created when onboarding completes.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                    {filteredCases.map(tc => {
                        const st = TRAINING_STATUS_CONFIG[tc.status] || TRAINING_STATUS_CONFIG.pending_trainer
                        const trainer = tc.assigned_trainer
                        const sessions = tc.sessions || []

                        return (
                            <div key={tc.id} style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                                {/* Left: Institution & Training Details */}
                                <div style={{ flex: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>{tc.organization_name}</span>
                                        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <st.icon size={12} /> {st.label}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span>Type: {tc.training_type?.replace('_', ' ').toUpperCase()}</span>
                                        <span>• Sessions Logged: {sessions.length}</span>
                                        {tc.feedback_rating && (
                                            <span style={{ color: P.warning, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Star size={13} fill={P.warning} /> {tc.feedback_rating}/5.0 Rating
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Center: Assigned Trainer */}
                                <div style={{ flex: 1.5, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                        Assigned Trainer
                                    </div>
                                    {trainer ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <UserCheck size={16} color={P.brand} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>{trainer.first_name} {trainer.last_name}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{trainer.role}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: P.warning, fontWeight: 800 }}>⚠️ Pending Trainer Assignment</div>
                                    )}
                                </div>

                                {/* Right: Actions */}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {!trainer && (
                                        <button
                                            onClick={() => setAssignTarget(tc)}
                                            style={{ padding: '9px 16px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <UserCheck size={14} /> Assign Trainer
                                        </button>
                                    )}

                                    {trainer && tc.status !== 'completed' && (
                                        <>
                                            <button
                                                onClick={() => setSessionTarget(tc)}
                                                style={{ padding: '9px 14px', background: P.brandBg, color: P.brand, border: `1px solid ${P.brand}30`, borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <Video size={14} /> Log Session
                                            </button>
                                            <button
                                                onClick={() => setCompleteTarget(tc)}
                                                style={{ padding: '9px 16px', background: P.success, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <Rocket size={14} /> Complete & Go-Live!
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL 1: ASSIGN TRAINER */}
            {assignTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserCheck size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Assign Training Specialist</h3>
                            </div>
                            <button onClick={() => setAssignTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>Select Trainer *</label>
                            <select
                                value={selectedTrainerId}
                                onChange={e => setSelectedTrainerId(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff' }}
                            >
                                <option value="">Select Staff...</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setAssignTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAssignTrainer} disabled={assignSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {assignSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Confirm Trainer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: LOG TRAINING SESSION */}
            {sessionTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Video size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Log Training Session</h3>
                            </div>
                            <button onClick={() => setSessionTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Session Topic *</label>
                            <input value={sessionForm.topic} onChange={e => setSessionForm({ ...sessionForm, topic: e.target.value })} placeholder="e.g. Teacher Dashboard & Exam Creation" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Duration (Mins)</label>
                                <input type="number" value={sessionForm.duration_mins} onChange={e => setSessionForm({ ...sessionForm, duration_mins: parseInt(e.target.value) || 60 })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Attendees Count</label>
                                <input type="number" value={sessionForm.attendees_count} onChange={e => setSessionForm({ ...sessionForm, attendees_count: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Session Notes</label>
                            <textarea rows={2} value={sessionForm.session_notes} onChange={e => setSessionForm({ ...sessionForm, session_notes: e.target.value })} placeholder="Key discussions, attendee feedback..." style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setSessionTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleLogSession} disabled={sessionSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {sessionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={16} />} Save Training Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: GO-LIVE & FEEDBACK */}
            {completeTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Rocket size={22} color={P.success} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Complete Training & Go-Live!</h3>
                            </div>
                            <button onClick={() => setCompleteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>Customer Satisfaction Rating (1-5 Stars)</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={completeForm.feedback_rating}
                                onChange={e => setCompleteForm({ ...completeForm, feedback_rating: parseInt(e.target.value) || 5 })}
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 900, color: P.warning, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>Customer Go-Live Feedback</label>
                            <textarea
                                rows={3}
                                value={completeForm.feedback_comments}
                                onChange={e => setCompleteForm({ ...completeForm, feedback_comments: e.target.value })}
                                placeholder="Final feedback comments from customer..."
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setCompleteTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCompleteTraining} disabled={completeSaving} style={{ flex: 2, padding: 12, background: P.success, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {completeSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Rocket size={16} />} Mark Go-Live Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
