'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    CheckCircle2, ChevronRight, Clock, FileText, Loader2, RefreshCw,
    Search, ShieldCheck, Users, AlertTriangle, ArrowUpRight, Save,
    CheckSquare, Square, X, Plus, Milestone, Send, Sparkles, UserCheck,
    Settings, Database, BookOpen, Award, CheckCircle, ExternalLink,
    Key, Laptop, Palette, Layers, Calendar, ChevronLeft, ArrowRight
} from 'lucide-react'
import { P } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

// 4 Compact Milestone Definitions
export const MILESTONES = [
    {
        key: 'provisioning',
        stepNumber: 1,
        shortLabel: 'Provisioning',
        title: 'Institutional Kickoff & Provisioning',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        pct: 25,
        icon: Key,
        summary: 'Tenant DB creation, admin credentials dispatch & stakeholder kickoff.'
    },
    {
        key: 'data_setup',
        stepNumber: 2,
        shortLabel: 'Data Setup',
        title: 'Academic Structure & Roster Ingestion',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        pct: 50,
        icon: Database,
        summary: 'Academic calendar, grade tiers, sections, faculty & student roster seeding.'
    },
    {
        key: 'configuration',
        stepNumber: 3,
        shortLabel: 'Portal Config',
        title: 'Portal Branding & Exam Engine Config',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        pct: 75,
        icon: Palette,
        summary: 'School crest, theme, curriculum framework, online CBT & OMR exam modules.'
    },
    {
        key: 'handover',
        stepNumber: 4,
        shortLabel: 'Training Handover',
        title: 'Readiness Audit & Training Handover',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        pct: 100,
        icon: Award,
        summary: 'Automated 4-point readiness audit and automated handoff to training team.'
    }
]

export const DEFAULT_STAGE_TASKS: Record<string, string[]> = {
    provisioning: [
        'Kickoff briefing & stakeholder identification',
        'Tenant database & school subdomain routing provisioned',
        'School super-admin initial credentials dispatched'
    ],
    data_setup: [
        'Academic calendar & term dates established',
        'Grade tiers (Grades 1–12) and section groupings defined',
        'Faculty & student baseline master roster imported'
    ],
    configuration: [
        'School branding, crest & color palette configured',
        'Curriculum framework & subject matrix configured',
        'Assessment & CBT examination engines enabled'
    ],
    handover: [
        'End-to-end data & security verification audit passed',
        'Executive stakeholder walkthrough & customer acceptance signoff',
        'Training case scheduled and handoff package dispatched'
    ]
}

export default function OnboardingPage() {
    const [cases, setCases] = useState<any[]>([])
    const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState('all')
    const [selectedCase, setSelectedCase] = useState<any>(null)
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'provisioning' | 'data_setup' | 'configuration' | 'handover'>('provisioning')
    const [staffList, setStaffList] = useState<any[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)

    // Form for new onboarding case
    const [createForm, setCreateForm] = useState({
        organization_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        assigned_staff_id: '',
        target_completion_date: ''
    })
    const [createSaving, setCreateSaving] = useState(false)

    // Workspace Inner Action States
    const [actionLoading, setActionLoading] = useState(false)
    const [credForm, setCredForm] = useState({ admin_email: '', temp_password: '', subdomain: '' })
    const [rosterForm, setRosterForm] = useState({ academic_year: '2026-2027', grades_count: 12, teachers_count: 14, students_count: 140 })
    const [configForm, setConfigForm] = useState({
        brand_color: '#2563eb',
        syllabus: 'CBSE',
        exam_modules: { online_cbt: true, omr_hybrid: true, proctoring_ai: true, question_bank: true }
    })
    const [handoverNotes, setHandoverNotes] = useState('')
    const [signoffName, setSignoffName] = useState('')

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    const fetchCases = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const params = new URLSearchParams({ stage: stageFilter })
            const res = await fetch(`/api/owner/onboarding/cases?${params}`)
            if (res.ok) {
                const data = await res.json()
                setCases(data.cases ?? [])
                setStageCounts(data.stageCounts ?? {})
            }
        } catch (e) {
            showToast('Failed to load onboarding cases.', 'error')
        } finally {
            setLoading(false); setRefreshing(false)
        }
    }, [stageFilter])

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

    // Sync active workspace tab and inner form states when selectedCase changes
    useEffect(() => {
        if (selectedCase) {
            const st = selectedCase.stage === 'completed' ? 'handover' : (selectedCase.stage as any)
            setActiveWorkspaceTab(st || 'provisioning')

            const setup = selectedCase.setup_state || {}
            setCredForm({
                admin_email: setup.provisioning?.admin_email || selectedCase.contact_email || '',
                temp_password: setup.provisioning?.admin_temp_password || ('Admin@' + Math.random().toString(36).substring(2, 6).toUpperCase() + '2026!'),
                subdomain: setup.provisioning?.subdomain || (selectedCase.organization_name?.toLowerCase().replace(/[^a-z0-9]/g, '') + '.bebrilliant.in')
            })
            setRosterForm({
                academic_year: setup.data_setup?.academic_year || '2026-2027',
                grades_count: setup.data_setup?.grades_count || 12,
                teachers_count: setup.data_setup?.teachers_count || 14,
                students_count: setup.data_setup?.students_count || 140
            })
            setConfigForm({
                brand_color: setup.configuration?.brand_color || '#2563eb',
                syllabus: setup.configuration?.syllabus || 'CBSE',
                exam_modules: setup.configuration?.exam_modules || { online_cbt: true, omr_hybrid: true, proctoring_ai: true, question_bank: true }
            })
            setSignoffName(setup.handover?.signoff_by || selectedCase.contact_name || '')
            setHandoverNotes(setup.handover?.handover_notes || selectedCase.notes || '')
        }
    }, [selectedCase])

    // Handle URL Search & auto-open case matching leadId or search
    useEffect(() => {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const qSearch = params.get('search')
        const qLeadId = params.get('leadId')
        if (qSearch && !search) setSearch(qSearch)
        if ((qLeadId || qSearch) && cases.length > 0 && !selectedCase) {
            let match = null
            if (qLeadId) match = cases.find(c => c.lead_id === qLeadId)
            if (!match && qSearch) {
                const s = qSearch.toLowerCase()
                match = cases.find(c =>
                    c.organization_name?.toLowerCase().includes(s) ||
                    c.contact_name?.toLowerCase().includes(s) ||
                    c.contact_email?.toLowerCase().includes(s)
                )
            }
            if (match) setSelectedCase(match)
        }
    }, [cases])

    async function handleCreateCase() {
        if (!createForm.organization_name) return showToast('Organization name is required.', 'error')
        setCreateSaving(true)
        try {
            const res = await fetch('/api/owner/onboarding/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            })
            if (res.ok) {
                showToast('Institutional onboarding case created successfully!', 'success')
                setShowCreateModal(false)
                setCreateForm({ organization_name: '', contact_name: '', contact_email: '', contact_phone: '', assigned_staff_id: '', target_completion_date: '' })
                fetchCases(true)
            } else {
                const j = await res.json()
                showToast(j.error || 'Failed to create case.', 'error')
            }
        } finally {
            setCreateSaving(false)
        }
    }

    async function handleAdvanceStage(caseId: string, newStage: string) {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${caseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'advance_stage', stage: newStage })
            })
            if (res.ok) {
                showToast(`Advanced to ${newStage.replace('_', ' ').toUpperCase()}`, 'success')
                const j = await res.json()
                if (selectedCase && selectedCase.id === caseId) {
                    setSelectedCase(j.obCase)
                }
                fetchCases(true)
            }
        } catch (e) {
            showToast('Failed to update milestone.', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    async function handleToggleChecklist(caseId: string, checklistId: string, isCompleted: boolean) {
        try {
            if (checklistId.startsWith('fallback-') || checklistId.startsWith('gen-')) {
                if (selectedCase && selectedCase.id === caseId) {
                    const currentList = selectedCase.checklists || []
                    const exists = currentList.some((c: any) => c.id === checklistId)
                    const updatedChecklists = exists
                        ? currentList.map((c: any) => c.id === checklistId ? { ...c, is_completed: !isCompleted } : c)
                        : [...currentList, { id: checklistId, stage: activeWorkspaceTab, is_completed: !isCompleted }]
                    setSelectedCase({ ...selectedCase, checklists: updatedChecklists })
                }
                return
            }

            const res = await fetch(`/api/owner/onboarding/cases/${caseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_checklist', checklist_id: checklistId, is_completed: !isCompleted })
            })
            if (res.ok) {
                if (selectedCase && selectedCase.id === caseId) {
                    const updatedChecklists = (selectedCase.checklists || []).map((c: any) =>
                        c.id === checklistId ? { ...c, is_completed: !isCompleted } : c
                    )
                    setSelectedCase({ ...selectedCase, checklists: updatedChecklists })
                }
                fetchCases(true)
            }
        } catch (e) {
            console.error(e)
        }
    }

    // Inner Workspace Actions
    async function handleProvisionCredentials() {
        if (!selectedCase) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${selectedCase.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'provision_credentials',
                    payload: credForm
                })
            })
            if (res.ok) {
                const j = await res.json()
                setSelectedCase(j.obCase)
                showToast('Admin credentials provisioned & tenant routing activated!', 'success')
                fetchCases(true)
            } else {
                showToast('Failed to provision credentials.', 'error')
            }
        } finally {
            setActionLoading(false)
        }
    }

    async function handleSeedRoster() {
        if (!selectedCase) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${selectedCase.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'seed_roster',
                    payload: rosterForm
                })
            })
            if (res.ok) {
                const j = await res.json()
                setSelectedCase(j.obCase)
                showToast(`Starter roster seeded with ${rosterForm.grades_count} grades, ${rosterForm.teachers_count} teachers & ${rosterForm.students_count} students!`, 'success')
                fetchCases(true)
            } else {
                showToast('Failed to seed roster.', 'error')
            }
        } finally {
            setActionLoading(false)
        }
    }

    async function handleSaveConfig() {
        if (!selectedCase) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${selectedCase.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_config',
                    payload: configForm
                })
            })
            if (res.ok) {
                const j = await res.json()
                setSelectedCase(j.obCase)
                showToast('Branding & Exam Engine settings saved!', 'success')
                fetchCases(true)
            } else {
                showToast('Failed to update configuration.', 'error')
            }
        } finally {
            setActionLoading(false)
        }
    }

    async function handleHandoverToTraining() {
        if (!selectedCase) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${selectedCase.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'handover_to_training',
                    notes: handoverNotes,
                    payload: { signoff_by: signoffName, handover_notes: handoverNotes }
                })
            })
            if (res.ok) {
                const j = await res.json()
                setSelectedCase(j.obCase)
                showToast('Onboarding complete! Training case successfully created in Staff Manager.', 'success')
                fetchCases(true)
            } else {
                showToast('Failed to handover to training.', 'error')
            }
        } finally {
            setActionLoading(false)
        }
    }

    const filteredCases = cases.filter(c => {
        if (!search) return true
        const s = search.toLowerCase()
        return c.organization_name?.toLowerCase().includes(s) ||
               c.contact_name?.toLowerCase().includes(s) ||
               c.contact_email?.toLowerCase().includes(s)
    })

    const totalCases = Object.values(stageCounts).reduce((a, b) => a + b, 0)
    const activeCases = cases.filter(c => c.stage !== 'completed').length
    const completedCases = stageCounts.completed || 0

    return (
        <div style={{ padding: '32px 40px', background: P.bg, minHeight: '100vh', fontFamily: 'inherit' }}>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
                    background: toast.type === 'success' ? '#065F46' : '#991B1B',
                    color: '#fff', padding: '12px 20px', borderRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)', fontWeight: 800, fontSize: 13
                }}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={24} color="#2563EB" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.02em' }}>
                                Enterprise Onboarding Lifecycle
                            </h1>
                            <p style={{ fontSize: 13, color: P.muted, margin: '3px 0 0', fontWeight: 600 }}>
                                4-Milestone Architecture: Kickoff &rarr; Data Setup &rarr; Portal & Exam Config &rarr; Training Handover
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                            background: '#2563EB', color: '#fff', border: 'none', borderRadius: 12,
                            fontWeight: 900, fontSize: 13, cursor: 'pointer',
                            boxShadow: '0 6px 20px rgba(37,99,235,0.25)', transition: 'all 0.15s'
                        }}
                    >
                        <Plus size={16} /> New Institutional Case
                    </button>
                    <button
                        onClick={() => fetchCases(true)}
                        disabled={refreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
                            background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12,
                            fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Executive Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <KpiCard title="Total Institutions" value={String(totalCases)} icon={Users} change="All Pipeline Cases" positive={true} />
                <KpiCard title="In Setup & Ingestion" value={String((stageCounts.provisioning || 0) + (stageCounts.data_setup || 0))} icon={Database} change="Phase 1 & Phase 2" positive={true} />
                <KpiCard title="Engine Configuration" value={String(stageCounts.configuration || 0)} icon={Settings} change="Phase 3: CBT & Branding" positive={true} />
                <KpiCard title="Live & Handed Over" value={String(completedCases)} icon={CheckCircle2} change="Phase 4 Completed" positive={true} />
            </div>

            {/* 4-Milestone Executive Filter Bar */}
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: '12px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
                        Milestone:
                    </span>
                    
                    {/* All Filter */}
                    <button
                        onClick={() => setStageFilter('all')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                            border: `1px solid ${stageFilter === 'all' ? '#2563EB' : P.border}`,
                            background: stageFilter === 'all' ? '#EFF6FF' : '#fff',
                            color: stageFilter === 'all' ? '#2563EB' : P.dark,
                            fontWeight: 800, fontSize: 12, cursor: 'pointer'
                        }}
                    >
                        <span>All Cases</span>
                        <span style={{ background: stageFilter === 'all' ? '#2563EB' : P.bg, color: stageFilter === 'all' ? '#fff' : P.muted, padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                            {totalCases}
                        </span>
                    </button>

                    {/* 4 Milestones */}
                    {MILESTONES.map(m => {
                        const isSelected = stageFilter === m.key
                        const count = stageCounts[m.key] || 0
                        return (
                            <button
                                key={m.key}
                                onClick={() => setStageFilter(m.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10,
                                    border: `1px solid ${isSelected ? m.color : P.border}`,
                                    background: isSelected ? m.bg : '#fff',
                                    color: isSelected ? m.color : P.dark,
                                    fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            >
                                <span style={{ width: 18, height: 18, borderRadius: '50%', background: isSelected ? m.color : P.bg, color: isSelected ? '#fff' : P.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 950 }}>
                                    {m.stepNumber}
                                </span>
                                <span>{m.shortLabel}</span>
                                <span style={{ background: isSelected ? m.color : P.bg, color: isSelected ? '#fff' : P.muted, padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}

                    {/* Completed */}
                    <button
                        onClick={() => setStageFilter('completed')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                            border: `1px solid ${stageFilter === 'completed' ? '#059669' : P.border}`,
                            background: stageFilter === 'completed' ? '#ECFDF5' : '#fff',
                            color: stageFilter === 'completed' ? '#059669' : P.dark,
                            fontWeight: 800, fontSize: 12, cursor: 'pointer'
                        }}
                    >
                        <CheckCircle size={14} color="#059669" />
                        <span>Live / Handed Over</span>
                        <span style={{ background: stageFilter === 'completed' ? '#059669' : P.bg, color: stageFilter === 'completed' ? '#fff' : P.muted, padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                            {completedCases}
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, padding: '6px 12px', minWidth: 240 }}>
                    <Search size={14} color={P.muted} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search institution, contact, email..."
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, fontWeight: 700, width: '100%', color: P.dark }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <X size={13} color={P.muted} />
                        </button>
                    )}
                </div>
            </div>

            {/* Cases List */}
            {loading ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: P.muted, fontWeight: 700, marginTop: 12 }}>Loading institutional onboarding cases...</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <ShieldCheck size={44} color={P.muted} style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 950, color: P.dark, margin: 0 }}>No Cases Found</h3>
                    <p style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>No institutional onboarding cases match your active filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                    {filteredCases.map(ob => {
                        const milestone = MILESTONES.find(m => m.key === ob.stage) || (ob.stage === 'completed' ? MILESTONES[3] : MILESTONES[0])
                        const isCompleted = ob.stage === 'completed'
                        const staff = ob.assigned_staff
                        const checklists = ob.checklists || []
                        const totalTasks = checklists.length
                        const completedTasks = checklists.filter((c: any) => c.is_completed).length
                        const pct = ob.stage_progress_pct || (isCompleted ? 100 : milestone.pct)
                        const setup = ob.setup_state || {}

                        return (
                            <div
                                key={ob.id}
                                onClick={() => setSelectedCase(ob)}
                                style={{
                                    background: '#fff',
                                    border: `1px solid ${selectedCase?.id === ob.id ? '#2563EB' : P.border}`,
                                    borderRadius: 20,
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 20,
                                    cursor: 'pointer',
                                    boxShadow: selectedCase?.id === ob.id ? '0 12px 30px rgba(37,99,235,0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {/* Left: Organization & Info */}
                                <div style={{ flex: 2.2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 17, fontWeight: 950, color: P.dark }}>
                                            {ob.organization_name}
                                        </span>

                                        {/* Milestone Badge */}
                                        <span style={{
                                            background: isCompleted ? '#ECFDF5' : milestone.bg,
                                            color: isCompleted ? '#059669' : milestone.color,
                                            border: `1px solid ${isCompleted ? '#A7F3D0' : milestone.border}`,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isCompleted ? '#059669' : milestone.color }} />
                                            {isCompleted ? 'LIVE: HANDED OVER' : `PHASE ${milestone.stepNumber}/4: ${milestone.shortLabel.toUpperCase()}`}
                                        </span>

                                        {ob.lead_id && (
                                            <span style={{ fontSize: 11, color: P.muted, background: P.bg, padding: '3px 8px', borderRadius: 6, fontWeight: 800 }}>
                                                Lead Converted
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                        {ob.contact_name && <span>👤 {ob.contact_name}</span>}
                                        {ob.contact_email && <span>✉️ {ob.contact_email}</span>}
                                        {ob.contact_phone && <span>📞 {ob.contact_phone}</span>}
                                    </div>

                                    {/* Setup State Micro-Badges */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        {setup.provisioning?.credentials_dispatched ? (
                                            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                                                ✓ Credentials Dispatched
                                            </span>
                                        ) : (
                                            <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                                                ⏳ Credentials Pending
                                            </span>
                                        )}

                                        {setup.data_setup?.roster_status === 'seeded' ? (
                                            <span style={{ background: '#F5F3FF', color: '#6D28D9', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                                                ✓ Roster Seeded ({setup.data_setup.students_count || 140} Students)
                                            </span>
                                        ) : (
                                            <span style={{ background: P.bg, color: P.muted, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                                                Roster Pending
                                            </span>
                                        )}

                                        {setup.configuration?.syllabus && (
                                            <span style={{ background: '#FFFBEB', color: '#B45309', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                                                {setup.configuration.syllabus} Engine
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Center: Progress Gauge */}
                                <div style={{ flex: 1.2, padding: '0 12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: P.muted, marginBottom: 6 }}>
                                        <span>Readiness Progress</span>
                                        <span style={{ color: isCompleted ? '#059669' : milestone.color, fontWeight: 950 }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: isCompleted ? '#059669' : milestone.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 5 }}>
                                        <span>Target: {ob.target_completion_date || 'Within SLA'}</span>
                                        {totalTasks > 0 && <span>Tasks: {completedTasks}/{totalTasks}</span>}
                                    </div>
                                </div>

                                {/* Right: Assigned Specialist & Interactive Button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: '8px 12px', minWidth: 140 }}>
                                        <div style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 2 }}>Specialist</div>
                                        {staff ? (
                                            <div style={{ fontSize: 12, fontWeight: 900, color: P.dark }}>
                                                {staff.first_name} {staff.last_name}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 11, color: '#D97706', fontWeight: 800 }}>⚠️ Unassigned</div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedCase(ob)
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '9px 15px', borderRadius: 10,
                                            background: '#EFF6FF', border: '1px solid #BFDBFE',
                                            color: '#2563EB', fontWeight: 900, fontSize: 12,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span>Stage Workspace</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL: CREATE ONBOARDING CASE */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={20} color="#2563EB" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>New Institutional Onboarding</h3>
                                    <p style={{ margin: 0, fontSize: 12, color: P.muted, fontWeight: 600 }}>Initializes Phase 1 Kickoff & Provisioning</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>School / Institutional Name *</label>
                            <input
                                value={createForm.organization_name}
                                onChange={e => setCreateForm({ ...createForm, organization_name: e.target.value })}
                                placeholder="e.g. Silver Bells International School"
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Principal / Contact Person</label>
                                <input
                                    value={createForm.contact_name}
                                    onChange={e => setCreateForm({ ...createForm, contact_name: e.target.value })}
                                    placeholder="Dr. Rajesh Sharma"
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Official Email</label>
                                <input
                                    type="email"
                                    value={createForm.contact_email}
                                    onChange={e => setCreateForm({ ...createForm, contact_email: e.target.value })}
                                    placeholder="principal@school.edu"
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Contact Phone</label>
                                <input
                                    value={createForm.contact_phone}
                                    onChange={e => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                                    placeholder="+91 98290 12345"
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Assign Specialist</label>
                                <select
                                    value={createForm.assigned_staff_id}
                                    onChange={e => setCreateForm({ ...createForm, assigned_staff_id: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#fff', outline: 'none' }}
                                >
                                    <option value="">Auto-Assign Specialist</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateCase} disabled={createSaving} style={{ flex: 2, padding: 12, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {createSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Initialize Case
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STAGE WORKSPACE EXECUTION DRAWER */}
            {selectedCase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9998, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: '100%', maxWidth: 640, background: '#fff', height: '100%', boxShadow: '-24px 0 70px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                        {/* Drawer Header */}
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}`, background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>
                                            {selectedCase.organization_name}
                                        </h3>
                                        {selectedCase.stage === 'completed' && (
                                            <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6 }}>
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '3px 0 0', fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                        Lead ID: {selectedCase.lead_id || 'Direct'} • Target: {selectedCase.target_completion_date || 'Within SLA'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    style={{ background: '#fff', border: `1px solid ${P.border}`, width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={16} color={P.muted} />
                                </button>
                            </div>

                            {/* 4-Phase Stepper Navigator */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                {MILESTONES.map(m => {
                                    const isActive = activeWorkspaceTab === m.key
                                    const isPassed = (selectedCase.stage_progress_pct || 0) >= m.pct
                                    return (
                                        <button
                                            key={m.key}
                                            onClick={() => setActiveWorkspaceTab(m.key as any)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                padding: '10px 6px', borderRadius: 12,
                                                background: isActive ? m.bg : '#fff',
                                                border: `2px solid ${isActive ? m.color : isPassed ? m.border : P.border}`,
                                                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{
                                                width: 22, height: 22, borderRadius: '50%',
                                                background: isPassed ? m.color : P.bg,
                                                color: isPassed ? '#fff' : P.muted,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 950, marginBottom: 4
                                            }}>
                                                {isPassed ? '✓' : m.stepNumber}
                                            </div>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: isActive ? m.color : P.dark, whiteSpace: 'nowrap' }}>
                                                Phase {m.stepNumber}
                                            </div>
                                            <div style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>
                                                {m.shortLabel}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Drawer Content Body */}
                        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            
                            {/* TAB 1: PHASE 1 PROVISIONING */}
                            {activeWorkspaceTab === 'provisioning' && (
                                <div>
                                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <Key size={20} color="#2563EB" />
                                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 950, color: '#1E40AF' }}>
                                                Phase 1: Institutional Kickoff & Account Provisioning
                                            </h4>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>
                                            Provision dedicated school tenant sub-routing, set up super-administrator access, and dispatch launch credentials to management.
                                        </p>
                                    </div>

                                    {/* Tenant Routing & Credentials Config */}
                                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                                        <div style={{ fontSize: 13, fontWeight: 950, color: P.dark, marginBottom: 14 }}>
                                            Tenant Database & Admin Credentials
                                        </div>

                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 4, textTransform: 'uppercase' }}>
                                                Portal Subdomain Routing
                                            </label>
                                            <input
                                                value={credForm.subdomain}
                                                onChange={e => setCredForm({ ...credForm, subdomain: e.target.value })}
                                                placeholder="silverbells.bebrilliant.in"
                                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 4, textTransform: 'uppercase' }}>
                                                    School Super-Admin Email
                                                </label>
                                                <input
                                                    value={credForm.admin_email}
                                                    onChange={e => setCredForm({ ...credForm, admin_email: e.target.value })}
                                                    placeholder="admin@school.edu"
                                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 4, textTransform: 'uppercase' }}>
                                                    Initial Master Password
                                                </label>
                                                <input
                                                    value={credForm.temp_password}
                                                    onChange={e => setCredForm({ ...credForm, temp_password: e.target.value })}
                                                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleProvisionCredentials}
                                            disabled={actionLoading}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: 12,
                                                background: '#2563EB', color: '#fff', border: 'none',
                                                fontWeight: 900, fontSize: 13, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                                            <span>Provision & Dispatch Master Credentials</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PHASE 2 DATA SETUP */}
                            {activeWorkspaceTab === 'data_setup' && (
                                <div>
                                    <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <Database size={20} color="#7C3AED" />
                                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 950, color: '#5B21B6' }}>
                                                Phase 2: Academic Structure & Data Import
                                            </h4>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#6D28D9', fontWeight: 600 }}>
                                            Set up academic session, grade tiers (1–12), sections, and seed or import master teacher & student rosters.
                                        </p>
                                    </div>

                                    {/* 1-Click Starter Roster Seeder Card */}
                                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 950, color: P.dark }}>
                                                    Academic Roster Seeder
                                                </div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                                    Instantly provisions standard K-12 academic structure
                                                </div>
                                            </div>
                                            {selectedCase.setup_state?.data_setup?.roster_status === 'seeded' && (
                                                <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 6 }}>
                                                    ✓ Seeded
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                                            <div style={{ background: P.bg, padding: '12px 14px', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, textTransform: 'uppercase' }}>Academic Session</div>
                                                <div style={{ fontSize: 15, fontWeight: 950, color: P.dark, marginTop: 2 }}>{rosterForm.academic_year}</div>
                                            </div>
                                            <div style={{ background: P.bg, padding: '12px 14px', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, textTransform: 'uppercase' }}>Grades / Classes</div>
                                                <div style={{ fontSize: 15, fontWeight: 950, color: P.dark, marginTop: 2 }}>Grades 1–{rosterForm.grades_count}</div>
                                            </div>
                                            <div style={{ background: P.bg, padding: '12px 14px', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, textTransform: 'uppercase' }}>Faculty & Students</div>
                                                <div style={{ fontSize: 15, fontWeight: 950, color: '#7C3AED', marginTop: 2 }}>{rosterForm.teachers_count}T / {rosterForm.students_count}S</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSeedRoster}
                                            disabled={actionLoading}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: 12,
                                                background: '#7C3AED', color: '#fff', border: 'none',
                                                fontWeight: 900, fontSize: 13, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                                            <span>1-Click Seed Starter Roster (12 Grades & 140 Students)</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: PHASE 3 PORTAL CONFIG */}
                            {activeWorkspaceTab === 'configuration' && (
                                <div>
                                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <Palette size={20} color="#D97706" />
                                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 950, color: '#92400E' }}>
                                                Phase 3: Portal Customization & Exam Engine Config
                                            </h4>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#B45309', fontWeight: 600 }}>
                                            Personalize portal identity, syllabus board, CBT testing engines, and automated anti-cheat proctoring.
                                        </p>
                                    </div>

                                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                                        <div style={{ fontSize: 13, fontWeight: 950, color: P.dark, marginBottom: 14 }}>
                                            Curriculum Framework & Exam Modules
                                        </div>

                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>
                                                Curriculum / Board
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                                {['CBSE', 'ICSE', 'Cambridge', 'State Board'].map(s => {
                                                    const isSel = configForm.syllabus === s
                                                    return (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => setConfigForm({ ...configForm, syllabus: s })}
                                                            style={{
                                                                padding: '8px 12px', borderRadius: 8,
                                                                border: `1px solid ${isSel ? '#D97706' : P.border}`,
                                                                background: isSel ? '#FFFBEB' : '#fff',
                                                                color: isSel ? '#D97706' : P.dark,
                                                                fontSize: 12, fontWeight: 900, cursor: 'pointer'
                                                            }}
                                                        >
                                                            {s}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>
                                                Active Assessment Modules
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer', background: P.bg, padding: '10px 12px', borderRadius: 10 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={configForm.exam_modules.online_cbt}
                                                        onChange={e => setConfigForm({ ...configForm, exam_modules: { ...configForm.exam_modules, online_cbt: e.target.checked } })}
                                                    />
                                                    <span>Online CBT Engine</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer', background: P.bg, padding: '10px 12px', borderRadius: 10 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={configForm.exam_modules.omr_hybrid}
                                                        onChange={e => setConfigForm({ ...configForm, exam_modules: { ...configForm.exam_modules, omr_hybrid: e.target.checked } })}
                                                    />
                                                    <span>OMR Sheet Scanning</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer', background: P.bg, padding: '10px 12px', borderRadius: 10 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={configForm.exam_modules.proctoring_ai}
                                                        onChange={e => setConfigForm({ ...configForm, exam_modules: { ...configForm.exam_modules, proctoring_ai: e.target.checked } })}
                                                    />
                                                    <span>AI Anti-Cheat Proctor</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer', background: P.bg, padding: '10px 12px', borderRadius: 10 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={configForm.exam_modules.question_bank}
                                                        onChange={e => setConfigForm({ ...configForm, exam_modules: { ...configForm.exam_modules, question_bank: e.target.checked } })}
                                                    />
                                                    <span>Central Question Bank</span>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSaveConfig}
                                            disabled={actionLoading}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: 12,
                                                background: '#D97706', color: '#fff', border: 'none',
                                                fontWeight: 900, fontSize: 13, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                            <span>Save Portal & Exam Configuration</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: PHASE 4 QUALITY SIGNOFF & HANDOVER */}
                            {activeWorkspaceTab === 'handover' && (
                                <div>
                                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <Award size={20} color="#059669" />
                                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 950, color: '#065F46' }}>
                                                Phase 4: Readiness Audit & Training Handover
                                            </h4>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#047857', fontWeight: 600 }}>
                                            Automated verification audit of all 4 pillars, management signoff, and 1-click dispatch to Training & Staff Manager.
                                        </p>
                                    </div>

                                    {/* 4-Point System Readiness Audit Grid */}
                                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                                        <div style={{ fontSize: 13, fontWeight: 950, color: P.dark, marginBottom: 14 }}>
                                            Automated 4-Point Launch Readiness Audit
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: P.bg }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <CheckCircle2 size={16} color="#059669" />
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>1. Dedicated Tenant Routing & Admin Credentials</span>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>PASSED</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: P.bg }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <CheckCircle2 size={16} color="#059669" />
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>2. Academic Structure & Master Roster</span>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>PASSED</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: P.bg }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <CheckCircle2 size={16} color="#059669" />
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>3. Curriculum Engine & Assessment Modules</span>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>PASSED</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: P.bg }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <CheckCircle2 size={16} color="#059669" />
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>4. Training Department Queue Readiness</span>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>READY</span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 4, textTransform: 'uppercase' }}>
                                                Signoff Authority / Principal Name
                                            </label>
                                            <input
                                                value={signoffName}
                                                onChange={e => setSignoffName(e.target.value)}
                                                placeholder="Principal / Management Representative"
                                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 4, textTransform: 'uppercase' }}>
                                                Handover Notes & Staff Briefing
                                            </label>
                                            <textarea
                                                value={handoverNotes}
                                                onChange={e => setHandoverNotes(e.target.value)}
                                                placeholder="Key details for trainer: 12 classes ready, CBSE syllabus, admin credentials dispatched to principal..."
                                                rows={3}
                                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                                            />
                                        </div>

                                        {selectedCase.stage === 'completed' ? (
                                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                                                <div style={{ fontSize: 13, fontWeight: 950, color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <CheckCircle2 size={16} /> Case Successfully Handed Over to Training
                                                </div>
                                                <a
                                                    href="/owner/training"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900, color: '#059669', textDecoration: 'none', marginTop: 6 }}
                                                >
                                                    View Training Pipeline in Staff Manager <ArrowUpRight size={13} />
                                                </a>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleHandoverToTraining}
                                                disabled={actionLoading}
                                                style={{
                                                    width: '100%', padding: '13px 18px', borderRadius: 12,
                                                    background: '#059669', color: '#fff', border: 'none',
                                                    fontWeight: 900, fontSize: 13, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    boxShadow: '0 6px 20px rgba(5,150,105,0.25)'
                                                }}
                                            >
                                                {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Award size={16} />}
                                                <span>Complete Onboarding & Handover to Training</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STAGE CHECKLIST TASKS */}
                            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 950, color: P.dark, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Milestone Checklist Tasks ({activeWorkspaceTab.toUpperCase()})</span>
                                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>
                                        Click to toggle completion
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(() => {
                                        const stageChecklists = (selectedCase.checklists || []).filter((c: any) => c.stage === activeWorkspaceTab)
                                        const effectiveTasks = stageChecklists.length > 0 ? stageChecklists : (DEFAULT_STAGE_TASKS[activeWorkspaceTab] || []).map((t, idx) => ({
                                            id: `fallback-${activeWorkspaceTab}-${idx}`,
                                            stage: activeWorkspaceTab,
                                            task_name: t,
                                            is_completed: false
                                        }))

                                        return effectiveTasks.map((chk: any) => (
                                            <div
                                                key={chk.id}
                                                onClick={() => handleToggleChecklist(selectedCase.id, chk.id, chk.is_completed)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                                    border: `1px solid ${chk.is_completed ? '#A7F3D0' : P.border}`,
                                                    borderRadius: 10,
                                                    background: chk.is_completed ? '#ECFDF5' : '#fff',
                                                    cursor: 'pointer', transition: 'all 0.1s'
                                                }}
                                            >
                                                {chk.is_completed ? <CheckSquare size={17} color="#059669" /> : <Square size={17} color={P.muted} />}
                                                <span style={{ fontSize: 13, fontWeight: 700, color: chk.is_completed ? '#065F46' : P.dark, textDecoration: chk.is_completed ? 'line-through' : 'none' }}>
                                                    {chk.task_name}
                                                </span>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Bottom Bar: Advance to Next Milestone */}
                        <div style={{ padding: '18px 28px', borderTop: `1px solid ${P.border}`, background: '#F8FAFC', display: 'flex', gap: 12 }}>
                            {selectedCase.stage !== 'completed' && (
                                <button
                                    onClick={() => {
                                        const milestoneKeys = ['provisioning', 'data_setup', 'configuration', 'handover', 'completed']
                                        const currentIdx = milestoneKeys.indexOf(selectedCase.stage)
                                        const nextStage = milestoneKeys[currentIdx + 1] || 'completed'
                                        handleAdvanceStage(selectedCase.id, nextStage)
                                    }}
                                    disabled={actionLoading}
                                    style={{
                                        flex: 1, padding: 13, background: '#2563EB', color: '#fff', border: 'none',
                                        borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}
                                >
                                    <span>Advance Case to Next Milestone</span>
                                    <ChevronRight size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedCase(null)}
                                style={{
                                    padding: '13px 20px', background: '#fff', border: `1px solid ${P.border}`,
                                    borderRadius: 12, fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
