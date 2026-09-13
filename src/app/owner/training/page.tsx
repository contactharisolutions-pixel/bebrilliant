'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Award, Star, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle,
    X, Loader2, Search, RefreshCw, ChevronRight, User, Building2,
    CheckCircle, Sparkles, Send, FileText, ArrowRight, ShieldCheck,
    Video, Users, ThumbsUp, MessageSquare, PlayCircle, Rocket, ExternalLink,
    Plus, Check, ChevronDown, BookOpen, CheckSquare, BarChart3, HelpCircle,
    Sliders, PhoneCall, Copy, Download, Printer
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

const TRAINING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending_trainer:  { label: 'Pending Trainer', color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
    trainer_assigned: { label: 'Trainer Assigned',color: '#2563EB', bg: '#EFF6FF', icon: UserCheck },
    in_progress:      { label: 'In Delivery',      color: '#004B93', bg: '#EEF4FF', icon: PlayCircle },
    dry_run:          { label: 'Dry-Run & Sign-Off',color: '#7C3AED', bg: '#F5F3FF', icon: ShieldCheck },
    completed:        { label: 'Go-Live Certified',color: '#059669', bg: '#ECFDF5', icon: Rocket },
    cancelled:        { label: 'Cancelled',        color: '#6B7280', bg: '#F3F4F6', icon: X },
}

const TRAINING_PACKAGES = [
    'Full Enterprise Suite',
    'Executive Admin & Academic Core',
    'Faculty CBT Exam Engine & Question Bank',
    'Hybrid OMR Evaluation Masterclass',
    'Custom Institutional Package'
]

export default function TrainingManagementPage() {
    const [cases, setCases] = useState<any[]>([])
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
    const [avgRating, setAvgRating] = useState('5.0')
    const [onboardedCandidates, setOnboardedCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [staffList, setStaffList] = useState<any[]>([])

    // Drawer state (deep workspace)
    const [activeCase, setActiveCase] = useState<any | null>(null)
    const [drawerTab, setDrawerTab] = useState<'sessions' | 'dry_run' | 'golive' | 'details'>('sessions')

    // Modals
    const [showNewCaseModal, setShowNewCaseModal] = useState(false)
    const [newCaseForm, setNewCaseForm] = useState({
        organization_name: '',
        onboarding_case_id: '',
        lead_id: '',
        training_package: 'Full Enterprise Suite',
        assigned_trainer_id: '',
        notes: '',
        create_default_curriculum: true
    })
    const [newCaseSaving, setNewCaseSaving] = useState(false)

    // Assign trainer modal
    const [assignTarget, setAssignTarget] = useState<any>(null)
    const [selectedTrainerId, setSelectedTrainerId] = useState('')
    const [assignSaving, setAssignSaving] = useState(false)

    // Edit/Log session modal
    const [sessionTargetCase, setSessionTargetCase] = useState<any>(null)
    const [editingSession, setEditingSession] = useState<any | null>(null)
    const [sessionForm, setSessionForm] = useState({
        session_id: '',
        session_no: 1,
        topic: '',
        conducted_at: '',
        duration_mins: 60,
        attendees_count: 5,
        meeting_link: '',
        recording_url: '',
        session_notes: '',
        key_learnings: '',
        session_status: 'conducted'
    })
    const [sessionSaving, setSessionSaving] = useState(false)

    // Dry-run sign-off modal
    const [dryRunTarget, setDryRunTarget] = useState<any>(null)
    const [dryRunForm, setDryRunForm] = useState({
        dry_run_status: 'passed',
        signoff_by: '',
        signoff_role: 'Principal & Examination Controller',
        dry_run_notes: 'All faculty mock tests and OMR evaluation verified.'
    })
    const [dryRunSaving, setDryRunSaving] = useState(false)

    // Go-Live certification modal
    const [goliveTarget, setGoliveTarget] = useState<any>(null)
    const [goliveForm, setGoliveForm] = useState({
        feedback_rating: 5,
        feedback_comments: 'Excellent training and prompt support from the EduBrilliant team.'
    })
    const [goliveSaving, setGoliveSaving] = useState(false)

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    const fetchCases = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ status: statusFilter })
            const res = await fetch(`/api/owner/training?${params}`)
            if (res.ok) {
                const data = await res.json()
                setCases(data.cases ?? [])
                setStatusCounts(data.statusCounts ?? {})
                setAvgRating(data.avgRating ?? '5.0')
                setOnboardedCandidates(data.onboardedCandidates ?? [])
                
                // If drawer is open, keep activeCase updated with fresh data
                if (activeCase) {
                    const freshActive = (data.cases ?? []).find((c: any) => c.id === activeCase.id)
                    if (freshActive) setActiveCase(freshActive)
                }
            }
        } catch (e) {
            showToast('Failed to load training cases.', 'error')
        } finally {
            setLoading(false); setRefreshing(false)
        }
    }, [statusFilter, activeCase?.id])

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

    // Handler: Create New Case
    async function handleCreateNewCase() {
        if (!newCaseForm.organization_name.trim()) {
            showToast('Please enter an institution name.', 'error')
            return
        }
        setNewCaseSaving(true)
        try {
            const res = await fetch('/api/owner/training', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCaseForm)
            })
            if (res.ok) {
                const data = await res.json()
                showToast('Training case initiated with full curriculum roadmap!', 'success')
                setShowNewCaseModal(false)
                setNewCaseForm({
                    organization_name: '',
                    onboarding_case_id: '',
                    lead_id: '',
                    training_package: 'Full Enterprise Suite',
                    assigned_trainer_id: '',
                    notes: '',
                    create_default_curriculum: true
                })
                fetchCases(true)
                if (data.trainingCase) {
                    setActiveCase(data.trainingCase)
                    setDrawerTab('sessions')
                }
            } else {
                const err = await res.json()
                showToast(err.error || 'Failed to create training case', 'error')
            }
        } catch (e) {
            showToast('Error creating training case', 'error')
        } finally {
            setNewCaseSaving(false)
        }
    }

    // Handler: Assign Trainer
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
                showToast('Specialist trainer assigned successfully!', 'success')
                setAssignTarget(null)
                fetchCases(true)
            }
        } finally {
            setAssignSaving(false)
        }
    }

    // Handler: Save / Complete Session
    async function handleSaveSession() {
        if (!sessionTargetCase || !sessionForm.topic.trim()) {
            showToast('Please provide a session topic.', 'error')
            return
        }
        setSessionSaving(true)
        try {
            const res = await fetch(`/api/owner/training/${sessionTargetCase.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'schedule_session',
                    ...sessionForm
                })
            })
            if (res.ok) {
                showToast('Curriculum session updated and logged!', 'success')
                setSessionTargetCase(null)
                setEditingSession(null)
                fetchCases(true)
            }
        } finally {
            setSessionSaving(false)
        }
    }

    // Handler: Quick Toggle Session Conducted
    async function handleToggleSessionConducted(caseItem: any, sessionItem: any) {
        try {
            const nextStatus = sessionItem.status === 'conducted' ? 'scheduled' : 'conducted'
            const res = await fetch(`/api/owner/training/${caseItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'schedule_session',
                    session_id: sessionItem.id,
                    topic: sessionItem.topic,
                    conducted_at: sessionItem.conducted_at || new Date().toISOString(),
                    duration_mins: sessionItem.duration_mins,
                    attendees_count: sessionItem.attendees_count,
                    meeting_link: sessionItem.meeting_link,
                    recording_url: sessionItem.recording_url,
                    session_notes: sessionItem.notes,
                    key_learnings: sessionItem.key_learnings,
                    session_status: nextStatus
                })
            })
            if (res.ok) {
                showToast(`Session marked as ${nextStatus}!`, 'success')
                fetchCases(true)
            }
        } catch (e) {
            showToast('Failed to update session status', 'error')
        }
    }

    // Handler: Dry-Run Sign-Off
    async function handleDryRunSignoff() {
        if (!dryRunTarget) return
        setDryRunSaving(true)
        try {
            const res = await fetch(`/api/owner/training/${dryRunTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'dry_run_signoff',
                    ...dryRunForm
                })
            })
            if (res.ok) {
                showToast('Institutional dry-run sign-off recorded!', 'success')
                setDryRunTarget(null)
                fetchCases(true)
            }
        } finally {
            setDryRunSaving(false)
        }
    }

    // Handler: Go-Live Certification
    async function handleCertifyGoLive() {
        if (!goliveTarget) return
        setGoliveSaving(true)
        try {
            const res = await fetch(`/api/owner/training/${goliveTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'certify_golive',
                    ...goliveForm
                })
            })
            if (res.ok) {
                showToast('🎉 Institutional Go-Live Certified & Activated!', 'success')
                setGoliveTarget(null)
                fetchCases(true)
            }
        } finally {
            setGoliveSaving(false)
        }
    }

    const filteredCases = cases.filter(c => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            c.organization_name?.toLowerCase().includes(q) ||
            c.training_package?.toLowerCase().includes(q) ||
            c.assigned_trainer?.first_name?.toLowerCase().includes(q) ||
            c.assigned_trainer?.last_name?.toLowerCase().includes(q)
        )
    })

    const totalCases = Object.values(statusCounts).reduce((a, b) => a + b, 0)
    const inProgressCount = (statusCounts.trainer_assigned || 0) + (statusCounts.in_progress || 0)
    const dryRunCount = statusCounts.dry_run || 0
    const completedCount = statusCounts.completed || 0

    return (
        <div style={{ padding: '32px 40px', background: P.bg, minHeight: '100vh', position: 'relative' }}>
            <style dangerouslySetInnerHTML={{ __html: GLASS_STYLES }} />

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 28, right: 36, zIndex: 99999,
                    background: toast.type === 'success' ? '#059669' : '#DC2626',
                    color: '#fff', padding: '12px 22px', borderRadius: 14,
                    fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out'
                }}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Top Bar / Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${P.brand}, #002D5A)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(0,75,147,0.25)'
                    }}>
                        <Award size={24} color="#fff" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h1 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>
                                Customer Training & Go-Live Operations
                            </h1>
                            <span style={{
                                background: P.brandBg, color: P.brand, fontSize: 11, fontWeight: 900,
                                padding: '3px 10px', borderRadius: 20, border: `1px solid ${P.brand}25`
                            }}>
                                Enterprise Lifecycle
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>
                            Curriculum execution, faculty attendance logging, dry-run acceptance & official institutional Go-Live certification.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => fetchCases(true)}
                        disabled={refreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                            background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12,
                            fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>

                    <button
                        onClick={() => setShowNewCaseModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                            background: `linear-gradient(135deg, ${P.brand}, #003666)`, color: '#fff',
                            border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(0,75,147,0.25)'
                        }}
                    >
                        <Plus size={16} /> New Training Case
                    </button>
                </div>
            </div>

            {/* Candidate Intake Alert Banner if any completed onboarding schools need training */}
            {onboardedCandidates.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '1px solid #BFDBFE', borderRadius: 16, padding: '14px 20px',
                    marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#1E3A8A' }}>
                                {onboardedCandidates.length} Institutional Client{onboardedCandidates.length > 1 ? 's' : ''} Ready for Training Intake
                            </div>
                            <div style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>
                                Onboarding setup is verified. Ready to designate specialist trainer and schedule curriculum.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {onboardedCandidates.slice(0, 2).map(oc => (
                            <button
                                key={oc.id}
                                onClick={() => {
                                    setNewCaseForm({
                                        organization_name: oc.organization_name,
                                        onboarding_case_id: oc.id,
                                        lead_id: oc.lead_id || '',
                                        training_package: 'Full Enterprise Suite',
                                        assigned_trainer_id: '',
                                        notes: 'Intaken from completed Onboarding setup.',
                                        create_default_curriculum: true
                                    })
                                    setShowNewCaseModal(true)
                                }}
                                style={{
                                    padding: '7px 14px', background: '#2563EB', color: '#fff',
                                    border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                }}
                            >
                                Intake {oc.organization_name} <ArrowRight size={13} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 26 }}>
                <KpiCard
                    title="Total Training Cases"
                    value={String(totalCases)}
                    icon={Award}
                    change="All Time Institutions"
                    positive={true}
                />
                <KpiCard
                    title="Pending Trainer Assignment"
                    value={String(statusCounts.pending_trainer || 0)}
                    icon={AlertTriangle}
                    change="Requires Staff Assignment"
                    positive={(statusCounts.pending_trainer || 0) === 0}
                />
                <KpiCard
                    title="In Curriculum Delivery"
                    value={String(inProgressCount)}
                    icon={PlayCircle}
                    change="Active Multi-Sessions"
                    positive={true}
                />
                <KpiCard
                    title="Institutional Go-Lives"
                    value={String(completedCount)}
                    icon={Rocket}
                    change={`Avg Rating: ${avgRating} ★`}
                    positive={true}
                />
            </div>

            {/* Filter Tabs & Search Header */}
            <div style={{
                background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18,
                padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12,
                alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All Cases', count: totalCases },
                        { key: 'pending_trainer', label: 'Pending Trainer', count: statusCounts.pending_trainer },
                        { key: 'trainer_assigned', label: 'Trainer Assigned', count: statusCounts.trainer_assigned },
                        { key: 'in_progress', label: 'In Delivery', count: statusCounts.in_progress },
                        { key: 'dry_run', label: 'Dry-Run & Sign-Off', count: dryRunCount },
                        { key: 'completed', label: 'Go-Live Certified', count: completedCount },
                    ].map(t => {
                        const isSelected = statusFilter === t.key
                        return (
                            <button
                                key={t.key}
                                onClick={() => setStatusFilter(t.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 11,
                                    border: `1px solid ${isSelected ? P.brand : P.border}`,
                                    background: isSelected ? P.brandBg : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                                    color: isSelected ? P.brand : P.dark, transition: 'all 0.15s ease'
                                }}
                            >
                                <span>{t.label}</span>
                                <span style={{
                                    background: isSelected ? P.brand : '#F1F3F5',
                                    color: isSelected ? '#fff' : P.muted,
                                    padding: '2px 7px', borderRadius: 7, fontSize: 11, fontWeight: 900
                                }}>
                                    {t.count || 0}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div style={{ position: 'relative', width: 280 }}>
                    <Search size={15} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search institution, package, trainer..."
                        style={{
                            width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                            border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, outline: 'none',
                            boxSizing: 'border-box', background: '#FAFAFA'
                        }}
                    />
                </div>
            </div>

            {/* Cases List */}
            {loading ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: P.muted, fontWeight: 700, margin: 0 }}>Hydrating training operations and curricula...</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <Award size={28} color={P.muted} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: P.dark, margin: '0 0 6px' }}>No Training Cases Found</h3>
                    <p style={{ fontSize: 13, color: P.muted, margin: '0 0 16px' }}>
                        Initiate a training case or intake a completed institutional client from onboarding.
                    </p>
                    <button
                        onClick={() => setShowNewCaseModal(true)}
                        style={{
                            padding: '9px 18px', background: P.brand, color: '#fff', border: 'none',
                            borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer'
                        }}
                    >
                        + Create First Training Case
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                    {filteredCases.map(tc => {
                        const st = TRAINING_STATUS_CONFIG[tc.status] || TRAINING_STATUS_CONFIG.pending_trainer
                        const trainer = tc.assigned_trainer
                        const sessions = tc.sessions || []
                        const conductedCount = sessions.filter((s: any) => s.status === 'conducted').length
                        const totalSessions = sessions.length || 4
                        const curriculumProgress = Math.min(100, Math.round((conductedCount / totalSessions) * 100))

                        return (
                            <div
                                key={tc.id}
                                style={{
                                    background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20,
                                    padding: '20px 24px', transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                                    {/* Left: Institution Info & Package */}
                                    <div style={{ flex: '1 1 320px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <div style={{
                                                width: 38, height: 38, borderRadius: 12, background: '#F0F5FF',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.brand
                                            }}>
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>
                                                        {tc.organization_name}
                                                    </span>
                                                    <span style={{
                                                        background: st.bg, color: st.color, padding: '3px 10px',
                                                        borderRadius: 8, fontSize: 11, fontWeight: 900,
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        border: `1px solid ${st.color}25`
                                                    }}>
                                                        <st.icon size={12} /> {st.label}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ color: P.brand, fontWeight: 800 }}>{tc.training_package || 'Full Enterprise Suite'}</span>
                                                    <span>•</span>
                                                    <span>Created {new Date(tc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center: Assigned Trainer Profile */}
                                    <div style={{
                                        flex: '1 1 240px', background: '#FAFAFA', border: `1px solid ${P.border}`,
                                        borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                                Specialist Trainer
                                            </div>
                                            {trainer ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: P.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                                                        {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>{trainer.first_name} {trainer.last_name}</div>
                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{trainer.role}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 12, color: P.warning, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <AlertTriangle size={13} /> Unassigned
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setAssignTarget(tc)
                                                setSelectedTrainerId(tc.assigned_trainer_id || '')
                                            }}
                                            style={{
                                                padding: '6px 10px', background: '#fff', border: `1px solid ${P.border}`,
                                                borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.dark, cursor: 'pointer'
                                            }}
                                        >
                                            {trainer ? 'Change' : 'Assign'}
                                        </button>
                                    </div>

                                    {/* Right: Quick Action Buttons */}
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => {
                                                setActiveCase(tc)
                                                setDrawerTab('sessions')
                                            }}
                                            style={{
                                                padding: '9px 16px', background: P.brandBg, color: P.brand,
                                                border: `1px solid ${P.brand}30`, borderRadius: 10, fontWeight: 900,
                                                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                            }}
                                        >
                                            <BookOpen size={14} /> Training Workspace
                                        </button>

                                        {tc.status !== 'completed' ? (
                                            <button
                                                onClick={() => {
                                                    setGoliveTarget(tc)
                                                    setGoliveForm({
                                                        feedback_rating: tc.feedback_rating || 5,
                                                        feedback_comments: tc.feedback_comments || ''
                                                    })
                                                }}
                                                style={{
                                                    padding: '9px 16px', background: P.success, color: '#fff',
                                                    border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12,
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                                    boxShadow: '0 4px 12px rgba(31,172,99,0.25)'
                                                }}
                                            >
                                                <Rocket size={14} /> Certify Go-Live
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setActiveCase(tc)
                                                    setDrawerTab('golive')
                                                }}
                                                style={{
                                                    padding: '9px 16px', background: '#ECFDF5', color: '#059669',
                                                    border: '1px solid #A7F3D0', borderRadius: 10, fontWeight: 900,
                                                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                                }}
                                            >
                                                <Award size={14} /> View Certificate
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 4-Stage Lifecycle Stepper Indicator */}
                                <div style={{
                                    marginTop: 18, paddingTop: 16, borderTop: `1px solid ${P.border}`,
                                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12
                                }}>
                                    {/* Stage 1: Trainer Assignment */}
                                    <div style={{
                                        background: trainer ? '#F0FDF4' : '#FFFBEB',
                                        border: `1px solid ${trainer ? '#BBF7D0' : '#FDE68A'}`,
                                        borderRadius: 12, padding: '10px 12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: trainer ? '#166534' : '#92400E' }}>
                                                1. Trainer Setup
                                            </span>
                                            {trainer ? <CheckCircle2 size={14} color="#16a34a" /> : <Clock size={14} color="#d97706" />}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>
                                            {trainer ? `${trainer.first_name}` : 'Pending'}
                                        </div>
                                    </div>

                                    {/* Stage 2: Curriculum Sessions */}
                                    <div style={{
                                        background: conductedCount > 0 ? '#EEF4FF' : '#F8FAFC',
                                        border: `1px solid ${conductedCount > 0 ? '#BFDBFE' : '#E2E8F0'}`,
                                        borderRadius: 12, padding: '10px 12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: conductedCount > 0 ? P.brand : P.muted }}>
                                                2. Curriculum
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: P.brand }}>
                                                {conductedCount}/{totalSessions}
                                            </span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{ width: `${curriculumProgress}%`, height: '100%', background: P.brand, borderRadius: 10, transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>

                                    {/* Stage 3: Dry-Run Acceptance */}
                                    <div style={{
                                        background: tc.dry_run_status === 'passed' ? '#FAF5FF' : '#F8FAFC',
                                        border: `1px solid ${tc.dry_run_status === 'passed' ? '#E9D5FF' : '#E2E8F0'}`,
                                        borderRadius: 12, padding: '10px 12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: tc.dry_run_status === 'passed' ? '#6B21A8' : P.muted }}>
                                                3. Dry-Run Sign-Off
                                            </span>
                                            {tc.dry_run_status === 'passed' ? (
                                                <ShieldCheck size={14} color="#7C3AED" />
                                            ) : (
                                                <Clock size={14} color={P.muted} />
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>
                                            {tc.dry_run_status === 'passed' ? (tc.signoff_by || 'Verified') : 'Pending Trial'}
                                        </div>
                                    </div>

                                    {/* Stage 4: Go-Live Certified */}
                                    <div style={{
                                        background: tc.status === 'completed' ? '#ECFDF5' : '#F8FAFC',
                                        border: `1px solid ${tc.status === 'completed' ? '#A7F3D0' : '#E2E8F0'}`,
                                        borderRadius: 12, padding: '10px 12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: tc.status === 'completed' ? '#065F46' : P.muted }}>
                                                4. Go-Live
                                            </span>
                                            {tc.status === 'completed' ? <Rocket size={14} color="#059669" /> : <Clock size={14} color={P.muted} />}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: P.dark, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {tc.status === 'completed' ? (
                                                <>
                                                    <span style={{ color: '#059669' }}>Certified</span>
                                                    {tc.feedback_rating && <span style={{ color: P.warning }}>({tc.feedback_rating}★)</span>}
                                                </>
                                            ) : (
                                                'Pending'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ========================================================= */}
            {/* DEEP SLIDE-OVER DRAWER: TRAINING WORKSPACE */}
            {/* ========================================================= */}
            {activeCase && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
                    zIndex: 9998, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(6px)'
                }}>
                    <div style={{
                        width: '100%', maxWidth: 780, background: '#fff', height: '100%',
                        display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 40px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.25s ease-out'
                    }}>
                        {/* Drawer Header */}
                        <div style={{
                            padding: '24px 30px', borderBottom: `1px solid ${P.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: `linear-gradient(135deg, ${P.brand}08 0%, #fff 100%)`
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 950, color: P.dark, margin: 0 }}>
                                        {activeCase.organization_name}
                                    </h2>
                                    <span style={{
                                        background: TRAINING_STATUS_CONFIG[activeCase.status]?.bg || '#F1F5F9',
                                        color: TRAINING_STATUS_CONFIG[activeCase.status]?.color || P.brand,
                                        fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 8,
                                        border: `1px solid ${TRAINING_STATUS_CONFIG[activeCase.status]?.color || P.brand}25`
                                    }}>
                                        {TRAINING_STATUS_CONFIG[activeCase.status]?.label || activeCase.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4 }}>
                                    Package: <strong style={{ color: P.brand }}>{activeCase.training_package || 'Full Enterprise Suite'}</strong>
                                    {' '}• Trainer: <strong>{activeCase.assigned_trainer ? `${activeCase.assigned_trainer.first_name} ${activeCase.assigned_trainer.last_name}` : 'Unassigned'}</strong>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveCase(null)}
                                style={{
                                    width: 36, height: 36, borderRadius: 10, background: '#F1F3F5',
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={18} color={P.dark} />
                            </button>
                        </div>

                        {/* Drawer Navigation Tabs */}
                        <div style={{
                            display: 'flex', borderBottom: `1px solid ${P.border}`, background: '#FAFAFA',
                            padding: '0 30px', gap: 24
                        }}>
                            {[
                                { key: 'sessions', label: 'Curriculum Sessions', icon: BookOpen },
                                { key: 'dry_run', label: 'Dry-Run & Sign-Off', icon: ShieldCheck },
                                { key: 'golive', label: 'Go-Live Certification', icon: Rocket },
                                { key: 'details', label: 'Case Notes & Info', icon: FileText },
                            ].map(tb => {
                                const isSel = drawerTab === tb.key
                                return (
                                    <button
                                        key={tb.key}
                                        onClick={() => setDrawerTab(tb.key as any)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0',
                                            border: 'none', borderBottom: `2.5px solid ${isSel ? P.brand : 'transparent'}`,
                                            background: 'none', color: isSel ? P.brand : P.muted,
                                            fontWeight: isSel ? 900 : 700, fontSize: 13, cursor: 'pointer'
                                        }}
                                    >
                                        <tb.icon size={16} />
                                        {tb.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Drawer Body Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px' }}>
                            {/* =================================================== */}
                            {/* TAB 1: CURRICULUM SESSIONS */}
                            {/* =================================================== */}
                            {drawerTab === 'sessions' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: 0 }}>
                                                Structured Training Curriculum
                                            </h3>
                                            <p style={{ fontSize: 12, color: P.muted, margin: '3px 0 0', fontWeight: 600 }}>
                                                Track delivery, meeting video links, attendance and faculty mastery notes.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSessionTargetCase(activeCase)
                                                setEditingSession(null)
                                                setSessionForm({
                                                    session_id: '',
                                                    session_no: (activeCase.sessions?.length || 0) + 1,
                                                    topic: '',
                                                    conducted_at: new Date().toISOString().slice(0, 16),
                                                    duration_mins: 60,
                                                    attendees_count: 10,
                                                    meeting_link: '',
                                                    recording_url: '',
                                                    session_notes: '',
                                                    key_learnings: '',
                                                    session_status: 'scheduled'
                                                })
                                            }}
                                            style={{
                                                padding: '8px 14px', background: P.brand, color: '#fff',
                                                border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                            }}
                                        >
                                            <Plus size={14} /> Add Session
                                        </button>
                                    </div>

                                    {(!activeCase.sessions || activeCase.sessions.length === 0) ? (
                                        <div style={{ padding: 40, textAlign: 'center', background: '#F8FAFC', borderRadius: 16, border: `1px solid ${P.border}` }}>
                                            <BookOpen size={32} color={P.muted} style={{ margin: '0 auto 10px' }} />
                                            <p style={{ fontSize: 13, color: P.muted, fontWeight: 700, margin: 0 }}>No sessions created yet.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            {activeCase.sessions.map((sess: any) => {
                                                const isConducted = sess.status === 'conducted'
                                                return (
                                                    <div
                                                        key={sess.id}
                                                        style={{
                                                            background: isConducted ? '#FAFCFF' : '#fff',
                                                            border: `1px solid ${isConducted ? '#BFDBFE' : P.border}`,
                                                            borderRadius: 16, padding: '18px 20px', transition: 'all 0.2s ease',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <button
                                                                    onClick={() => handleToggleSessionConducted(activeCase, sess)}
                                                                    title="Click to toggle Conducted state"
                                                                    style={{
                                                                        width: 28, height: 28, borderRadius: 8,
                                                                        background: isConducted ? '#10B981' : '#F1F5F9',
                                                                        color: isConducted ? '#fff' : P.muted,
                                                                        border: 'none', cursor: 'pointer', display: 'flex',
                                                                        alignItems: 'center', justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    {isConducted ? <Check size={16} /> : <Clock size={15} />}
                                                                </button>

                                                                <div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, background: P.brandBg, padding: '2px 8px', borderRadius: 6 }}>
                                                                            Session {sess.session_no}
                                                                        </span>
                                                                        <h4 style={{ fontSize: 14, fontWeight: 950, color: P.dark, margin: 0 }}>
                                                                            {sess.topic}
                                                                        </h4>
                                                                    </div>
                                                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                        <span>🕒 {sess.duration_mins || 60} mins</span>
                                                                        <span>•</span>
                                                                        <span>👥 {sess.attendees_count || 1} Attendees</span>
                                                                        <span>•</span>
                                                                        <span>📅 {new Date(sess.conducted_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setSessionTargetCase(activeCase)
                                                                        setEditingSession(sess)
                                                                        setSessionForm({
                                                                            session_id: sess.id,
                                                                            session_no: sess.session_no,
                                                                            topic: sess.topic,
                                                                            conducted_at: sess.conducted_at ? new Date(sess.conducted_at).toISOString().slice(0, 16) : '',
                                                                            duration_mins: sess.duration_mins || 60,
                                                                            attendees_count: sess.attendees_count || 5,
                                                                            meeting_link: sess.meeting_link || '',
                                                                            recording_url: sess.recording_url || '',
                                                                            session_notes: sess.notes || '',
                                                                            key_learnings: sess.key_learnings || '',
                                                                            session_status: sess.status || 'conducted'
                                                                        })
                                                                    }}
                                                                    style={{
                                                                        padding: '5px 10px', background: '#fff', border: `1px solid ${P.border}`,
                                                                        borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.dark, cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    Edit / Log
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Meeting & Recording Links */}
                                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                                                            {sess.meeting_link && (
                                                                <a
                                                                    href={sess.meeting_link}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                        padding: '6px 12px', background: '#EFF6FF', color: '#2563EB',
                                                                        borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: 'none',
                                                                        border: '1px solid #BFDBFE'
                                                                    }}
                                                                >
                                                                    <Video size={13} /> Join Meeting URL <ExternalLink size={11} />
                                                                </a>
                                                            )}
                                                            {sess.recording_url && (
                                                                <a
                                                                    href={sess.recording_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                        padding: '6px 12px', background: '#F5F3FF', color: '#7C3AED',
                                                                        borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: 'none',
                                                                        border: '1px solid #DDD6FE'
                                                                    }}
                                                                >
                                                                    <PlayCircle size={13} /> Watch Recording <ExternalLink size={11} />
                                                                </a>
                                                            )}
                                                        </div>

                                                        {/* Notes & Key Learnings */}
                                                        {(sess.notes || sess.key_learnings) && (
                                                            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${P.border}` }}>
                                                                {sess.notes && (
                                                                    <div style={{ fontSize: 12, color: P.dark, fontWeight: 600, marginBottom: 4 }}>
                                                                        <strong>Notes:</strong> {sess.notes}
                                                                    </div>
                                                                )}
                                                                {sess.key_learnings && (
                                                                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                                                        <strong>Key Milestone:</strong> {sess.key_learnings}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* =================================================== */}
                            {/* TAB 2: DRY-RUN & SIGN-OFF */}
                            {/* =================================================== */}
                            {drawerTab === 'dry_run' && (
                                <div>
                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: 0 }}>
                                            Institutional Dry-Run & Stakeholder Acceptance
                                        </h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '3px 0 0', fontWeight: 600 }}>
                                            Verify mock examination execution, test paper printing, OMR verification and formal sign-off.
                                        </p>
                                    </div>

                                    {/* Mock Trial Checklist */}
                                    <div style={{ background: '#F8FAFC', border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                                        <div style={{ fontSize: 12, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                                            Pre-Go-Live Dry-Run Checklist
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {[
                                                { label: 'Admin hierarchy and branch access verified by institution head' },
                                                { label: 'Faculty conducted mock CBT trial test and reviewed question formatting' },
                                                { label: 'Sample OMR test sheet printed, camera scanned & auto-graded accurately' },
                                                { label: 'SMS / Email gateway notification test triggered successfully' }
                                            ].map((chk, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: P.dark }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                        <Check size={13} />
                                                    </div>
                                                    {chk.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sign-Off Status Card */}
                                    <div style={{
                                        background: activeCase.dry_run_status === 'passed' ? '#F0FDF4' : '#FFFBEB',
                                        border: `1px solid ${activeCase.dry_run_status === 'passed' ? '#BBF7D0' : '#FDE68A'}`,
                                        borderRadius: 16, padding: '20px 22px', marginBottom: 20
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <ShieldCheck size={22} color={activeCase.dry_run_status === 'passed' ? '#16A34A' : '#D97706'} />
                                                <div>
                                                    <h4 style={{ fontSize: 15, fontWeight: 950, color: P.dark, margin: 0 }}>
                                                        {activeCase.dry_run_status === 'passed' ? 'Institutional Sign-Off Approved' : 'Sign-Off Pending Verification'}
                                                    </h4>
                                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                                        {activeCase.signoff_at ? `Signed off on ${new Date(activeCase.signoff_at).toLocaleDateString()}` : 'Awaiting formal principal / controller acceptance'}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setDryRunTarget(activeCase)
                                                    setDryRunForm({
                                                        dry_run_status: activeCase.dry_run_status || 'passed',
                                                        signoff_by: activeCase.signoff_by || '',
                                                        signoff_role: activeCase.signoff_role || 'Principal & Examination Controller',
                                                        dry_run_notes: activeCase.dry_run_notes || 'Mock trial validated across all faculty cohorts.'
                                                    })
                                                }}
                                                style={{
                                                    padding: '8px 14px', background: activeCase.dry_run_status === 'passed' ? '#16A34A' : P.brand,
                                                    color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer'
                                                }}
                                            >
                                                {activeCase.dry_run_status === 'passed' ? 'Update Sign-Off' : 'Record Sign-Off'}
                                            </button>
                                        </div>

                                        {activeCase.signoff_by && (
                                            <div style={{ fontSize: 13, color: P.dark, fontWeight: 700, marginTop: 10, borderTop: `1px solid ${P.border}`, paddingTop: 10 }}>
                                                Signatory: <strong>{activeCase.signoff_by}</strong> ({activeCase.signoff_role})
                                                {activeCase.dry_run_notes && (
                                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 4 }}>
                                                        Feedback: &ldquo;{activeCase.dry_run_notes}&rdquo;
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* =================================================== */}
                            {/* TAB 3: GO-LIVE CERTIFICATION */}
                            {/* =================================================== */}
                            {drawerTab === 'golive' && (
                                <div>
                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: 0 }}>
                                            Institutional Go-Live Certification & Cutover
                                        </h3>
                                        <p style={{ fontSize: 12, color: P.muted, margin: '3px 0 0', fontWeight: 600 }}>
                                            Formal certification badge, satisfaction feedback, and system handover.
                                        </p>
                                    </div>

                                    {/* Certificate Card Preview */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #0A192F 0%, #002244 100%)',
                                        borderRadius: 20, padding: 30, color: '#fff', position: 'relative',
                                        boxShadow: '0 20px 50px rgba(0,34,68,0.3)', border: '2px solid rgba(240,160,38,0.4)',
                                        marginBottom: 24, overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(240,160,38,0.1)', pointerEvents: 'none' }} />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(240,160,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(240,160,38,0.5)' }}>
                                                    <Award size={24} color="#F0A026" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 900, color: '#F0A026', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                                        Official Certificate of Institutional Go-Live
                                                    </div>
                                                    <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', letterSpacing: '-0.02em' }}>
                                                        {activeCase.organization_name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                background: activeCase.status === 'completed' ? '#059669' : '#D97706',
                                                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 900, textTransform: 'uppercase'
                                            }}>
                                                {activeCase.status === 'completed' ? 'Certified Live' : 'Cutover Pending'}
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 20px' }}>
                                            This certifies that <strong>{activeCase.organization_name}</strong> has completed the institutional onboarding & multi-session training curriculum.
                                            Examination controllers and faculty have successfully validated all dry-run operational requirements.
                                        </p>

                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                                            borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Certificate Code</div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: '#F0A026', marginTop: 2 }}>
                                                    {activeCase.certificate_id || 'GL-CERT-PENDING'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Go-Live Date</div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                                                    {activeCase.completed_at ? new Date(activeCase.completed_at).toLocaleDateString() : 'Pending Activation'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Customer Satisfaction</div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: '#F59E0B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Star size={14} fill="#F59E0B" /> {activeCase.feedback_rating || 5}.0 / 5.0
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    {activeCase.status !== 'completed' ? (
                                        <button
                                            onClick={() => {
                                                setGoliveTarget(activeCase)
                                                setGoliveForm({
                                                    feedback_rating: activeCase.feedback_rating || 5,
                                                    feedback_comments: activeCase.feedback_comments || ''
                                                })
                                            }}
                                            style={{
                                                width: '100%', padding: '14px 20px', background: P.success,
                                                color: '#fff', border: 'none', borderRadius: 14, fontWeight: 950,
                                                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: 8, boxShadow: '0 8px 25px rgba(31,172,99,0.25)'
                                            }}
                                        >
                                            <Rocket size={18} /> Certify & Activate Production Go-Live Now
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={() => window.print()}
                                                style={{
                                                    flex: 1, padding: '12px 18px', background: '#fff', border: `1px solid ${P.border}`,
                                                    borderRadius: 12, fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                                }}
                                            >
                                                <Printer size={15} /> Print Certificate
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setGoliveTarget(activeCase)
                                                    setGoliveForm({
                                                        feedback_rating: activeCase.feedback_rating || 5,
                                                        feedback_comments: activeCase.feedback_comments || ''
                                                    })
                                                }}
                                                style={{
                                                    flex: 1, padding: '12px 18px', background: P.brandBg, border: `1px solid ${P.brand}30`,
                                                    borderRadius: 12, fontWeight: 800, fontSize: 13, color: P.brand, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                                }}
                                            >
                                                <Star size={15} /> Edit Rating & Notes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* =================================================== */}
                            {/* TAB 4: CASE NOTES & DETAILS */}
                            {/* =================================================== */}
                            {drawerTab === 'details' && (
                                <div>
                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 950, color: P.dark, margin: 0 }}>
                                            Operational Details & Audit Record
                                        </h3>
                                    </div>

                                    <div style={{ background: '#FAFAFA', border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Internal Notes</div>
                                            <div style={{ fontSize: 13, color: P.dark, fontWeight: 600, marginTop: 4 }}>
                                                {activeCase.notes || 'No internal notes specified.'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: `1px solid ${P.border}`, paddingTop: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Training Case ID</div>
                                                <div style={{ fontSize: 12, color: P.dark, fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>{activeCase.id}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>SLA Deadline</div>
                                                <div style={{ fontSize: 12, color: P.dark, fontWeight: 800, marginTop: 2 }}>
                                                    {activeCase.sla_deadline ? new Date(activeCase.sla_deadline).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {activeCase.onboarding_case_id && (
                                            <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 12 }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Linked Onboarding Case</div>
                                                <div style={{ fontSize: 12, color: P.brand, fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>
                                                    {activeCase.onboarding_case_id}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: NEW TRAINING CASE */}
            {/* ========================================================= */}
            {showNewCaseModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, padding: 30, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.brand }}>
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Initiate Training Case</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: P.muted, fontWeight: 600 }}>Create institutional training pipeline & provision 4 curriculum sessions.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowNewCaseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Institution Name *</label>
                            <input
                                value={newCaseForm.organization_name}
                                onChange={e => setNewCaseForm({ ...newCaseForm, organization_name: e.target.value })}
                                placeholder="e.g. St. Xavier's Senior Secondary School"
                                style={{ width: '100%', padding: '12px 14px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Training Package</label>
                            <select
                                value={newCaseForm.training_package}
                                onChange={e => setNewCaseForm({ ...newCaseForm, training_package: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                            >
                                {TRAINING_PACKAGES.map(pkg => (
                                    <option key={pkg} value={pkg}>{pkg}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Assign Specialist Trainer</label>
                            <select
                                value={newCaseForm.assigned_trainer_id}
                                onChange={e => setNewCaseForm({ ...newCaseForm, assigned_trainer_id: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                            >
                                <option value="">Assign Later (Pending Trainer)</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={newCaseForm.create_default_curriculum}
                                    onChange={e => setNewCaseForm({ ...newCaseForm, create_default_curriculum: e.target.checked })}
                                    style={{ width: 16, height: 16, accentColor: P.brand }}
                                />
                                Auto-provision standard 4-session institutional curriculum
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowNewCaseModal(false)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateNewCase} disabled={newCaseSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {newCaseSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Rocket size={16} />} Initiate Training Case
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ASSIGN TRAINER */}
            {/* ========================================================= */}
            {assignTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserCheck size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Assign Training Specialist</h3>
                            </div>
                            <button onClick={() => setAssignTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>Select Certified Specialist *</label>
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

            {/* ========================================================= */}
            {/* MODAL: LOG / EDIT CURRICULUM SESSION */}
            {/* ========================================================= */}
            {sessionTargetCase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Video size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>
                                    {editingSession ? `Edit Session ${editingSession.session_no}` : 'Log Training Session'}
                                </h3>
                            </div>
                            <button onClick={() => setSessionTargetCase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Session Topic *</label>
                            <input
                                value={sessionForm.topic}
                                onChange={e => setSessionForm({ ...sessionForm, topic: e.target.value })}
                                placeholder="e.g. Faculty CBT & LaTeX Question Authoring"
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Conducted / Scheduled Date</label>
                                <input
                                    type="datetime-local"
                                    value={sessionForm.conducted_at}
                                    onChange={e => setSessionForm({ ...sessionForm, conducted_at: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Status</label>
                                <select
                                    value={sessionForm.session_status}
                                    onChange={e => setSessionForm({ ...sessionForm, session_status: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                                >
                                    <option value="conducted">Conducted (Completed)</option>
                                    <option value="scheduled">Scheduled (Upcoming)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Duration (Minutes)</label>
                                <input
                                    type="number"
                                    value={sessionForm.duration_mins}
                                    onChange={e => setSessionForm({ ...sessionForm, duration_mins: parseInt(e.target.value) || 60 })}
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Attendees Count</label>
                                <input
                                    type="number"
                                    value={sessionForm.attendees_count}
                                    onChange={e => setSessionForm({ ...sessionForm, attendees_count: parseInt(e.target.value) || 1 })}
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Meeting URL (Google Meet / Zoom)</label>
                            <input
                                value={sessionForm.meeting_link}
                                onChange={e => setSessionForm({ ...sessionForm, meeting_link: e.target.value })}
                                placeholder="https://meet.google.com/..."
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Video Recording URL (Drive / Cloud)</label>
                            <input
                                value={sessionForm.recording_url}
                                onChange={e => setSessionForm({ ...sessionForm, recording_url: e.target.value })}
                                placeholder="https://drive.google.com/..."
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Session Notes & Discussions</label>
                            <textarea
                                rows={2}
                                value={sessionForm.session_notes}
                                onChange={e => setSessionForm({ ...sessionForm, session_notes: e.target.value })}
                                placeholder="Key questions from faculty, areas covered..."
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Key Milestone / Action Items</label>
                            <input
                                value={sessionForm.key_learnings}
                                onChange={e => setSessionForm({ ...sessionForm, key_learnings: e.target.value })}
                                placeholder="e.g. Teachers verified question blueprint import"
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setSessionTargetCase(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveSession} disabled={sessionSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {sessionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Save Session Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: DRY-RUN SIGN-OFF */}
            {/* ========================================================= */}
            {dryRunTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <ShieldCheck size={22} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Dry-Run Sign-Off</h3>
                            </div>
                            <button onClick={() => setDryRunTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Sign-Off Status</label>
                            <select
                                value={dryRunForm.dry_run_status}
                                onChange={e => setDryRunForm({ ...dryRunForm, dry_run_status: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 800, outline: 'none', background: '#fff' }}
                            >
                                <option value="passed">✅ Passed & Approved for Go-Live</option>
                                <option value="revision_required">⚠️ Revisions Required (Needs Further Training)</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Signatory Name *</label>
                            <input
                                value={dryRunForm.signoff_by}
                                onChange={e => setDryRunForm({ ...dryRunForm, signoff_by: e.target.value })}
                                placeholder="e.g. Dr. R.K. Sharma"
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Designation / Role</label>
                            <input
                                value={dryRunForm.signoff_role}
                                onChange={e => setDryRunForm({ ...dryRunForm, signoff_role: e.target.value })}
                                placeholder="e.g. Principal & Examination Controller"
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Validation Comments</label>
                            <textarea
                                rows={2}
                                value={dryRunForm.dry_run_notes}
                                onChange={e => setDryRunForm({ ...dryRunForm, dry_run_notes: e.target.value })}
                                placeholder="Details regarding mock exam verification..."
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDryRunTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleDryRunSignoff} disabled={dryRunSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {dryRunSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />} Save Acceptance Sign-Off
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: GO-LIVE CERTIFICATION */}
            {/* ========================================================= */}
            {goliveTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Rocket size={22} color={P.success} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>Certify Institutional Go-Live!</h3>
                            </div>
                            <button onClick={() => setGoliveTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>Customer Satisfaction Rating</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setGoliveForm({ ...goliveForm, feedback_rating: star })}
                                        style={{
                                            flex: 1, padding: '10px 0', borderRadius: 10,
                                            border: `1px solid ${goliveForm.feedback_rating >= star ? P.warning : P.border}`,
                                            background: goliveForm.feedback_rating >= star ? '#FFFBEB' : '#fff',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                            fontWeight: 900, fontSize: 13, color: goliveForm.feedback_rating >= star ? '#D97706' : P.muted
                                        }}
                                    >
                                        <Star size={14} fill={goliveForm.feedback_rating >= star ? '#F59E0B' : 'none'} /> {star}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase' }}>Customer Go-Live Feedback & Testimonial</label>
                            <textarea
                                rows={3}
                                value={goliveForm.feedback_comments}
                                onChange={e => setGoliveForm({ ...goliveForm, feedback_comments: e.target.value })}
                                placeholder="Quote or feedback comments from the school management..."
                                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setGoliveTarget(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCertifyGoLive} disabled={goliveSaving} style={{ flex: 2, padding: 12, background: P.success, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {goliveSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Rocket size={16} />} Issue Go-Live Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
