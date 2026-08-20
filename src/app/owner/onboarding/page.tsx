'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    CheckCircle2, ChevronRight, Clock, FileText, Loader2, RefreshCw,
    Search, ShieldCheck, Users, AlertTriangle, ArrowUpRight, Save,
    CheckSquare, Square, X, Plus, MessageSquare, Flag, Calendar,
    Activity, TrendingDown, Target, AlertCircle, Heart, Circle,
    MoreHorizontal, ChevronDown, Milestone, Send, Flame, Sparkles, UserCheck
} from 'lucide-react'
import { P } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

const ONBOARDING_STAGES_CONFIG: Record<string, { label: string; color: string; bg: string; pct: number }> = {
    assigned:           { label: 'Assigned',           color: '#6366F1', bg: '#EEF2FF', pct: 12 },
    kickoff:            { label: 'Kickoff',            color: '#D97706', bg: '#FFFBEB', pct: 25 },
    account_setup:      { label: 'Account Setup',      color: '#2563EB', bg: '#EFF6FF', pct: 38 },
    data_setup:         { label: 'Data Setup',         color: '#7C3AED', bg: '#F5F3FF', pct: 50 },
    configuration:      { label: 'Configuration',      color: '#004B93', bg: '#EEF4FF', pct: 65 },
    quality_check:      { label: 'Quality Check',      color: '#F0A026', bg: '#FFF7E6', pct: 78 },
    customer_review:    { label: 'Customer Review',    color: '#059669', bg: '#ECFDF5', pct: 88 },
    ready_for_training: { label: 'Ready for Training', color: '#059669', bg: '#ECFDF5', pct: 95 },
    completed:          { label: 'Completed',          color: '#059669', bg: '#ECFDF5', pct: 100 },
}

export default function OnboardingPage() {
    const [cases, setCases] = useState<any[]>([])
    const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState('all')
    const [selectedCase, setSelectedCase] = useState<any>(null)
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

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

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
                showToast('Onboarding case created successfully!', 'success')
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
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${caseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'advance_stage', stage: newStage })
            })
            if (res.ok) {
                showToast(`Stage updated to ${newStage.replace('_', ' ').toUpperCase()}`, 'success')
                fetchCases(true)
                if (selectedCase && selectedCase.id === caseId) {
                    const j = await res.json()
                    setSelectedCase(j.obCase)
                }
            }
        } catch (e) {
            showToast('Failed to update stage.', 'error')
        }
    }

    async function handleToggleChecklist(caseId: string, checklistId: string, isCompleted: boolean) {
        try {
            const res = await fetch(`/api/owner/onboarding/cases/${caseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_checklist', checklist_id: checklistId, is_completed: !isCompleted })
            })
            if (res.ok) {
                fetchCases(true)
                if (selectedCase && selectedCase.id === caseId) {
                    const j = await res.json()
                    setSelectedCase(j.obCase)
                }
            }
        } catch (e) {
            console.error(e)
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
        <div style={{ padding: '32px 40px', background: P.bg, minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={22} color={P.brand} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0 }}>Enterprise Onboarding Lifecycle</h1>
                            <p style={{ fontSize: 13, color: P.muted, margin: '2px 0 0', fontWeight: 600 }}>8-Stage structured onboarding engine, SLA tracking & capacity management.</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}
                    >
                        <Plus size={16} /> New Onboarding Case
                    </button>
                    <button
                        onClick={() => fetchCases(true)}
                        disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, color: P.dark, cursor: 'pointer' }}
                    >
                        <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <KpiCard title="Total Onboarding Cases" value={String(totalCases)} icon={Users} change="All Time" positive={true} />
                <KpiCard title="Active Onboarding" value={String(activeCases)} icon={Activity} change="In 8-Stage Pipeline" positive={true} />
                <KpiCard title="Ready for Training" value={String(stageCounts.ready_for_training || 0)} icon={Sparkles} change="Hand-off Pending" positive={true} />
                <KpiCard title="Completed & Live" value={String(completedCases)} icon={CheckCircle2} change="Success Rate" positive={true} />
            </div>

            {/* 8-Stage Filter Strip */}
            <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: 12, marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: 8 }}>Filter Stage:</span>
                {[{ key: 'all', label: 'All Stages', count: totalCases }, ...Object.entries(ONBOARDING_STAGES_CONFIG).map(([k, v]) => ({ key: k, label: v.label, count: stageCounts[k] || 0 }))].map(s => {
                    const isSelected = stageFilter === s.key
                    return (
                        <button
                            key={s.key}
                            onClick={() => setStageFilter(s.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
                                border: `1px solid ${isSelected ? P.brand : P.border}`,
                                background: isSelected ? P.brandBg : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                                color: isSelected ? P.brand : P.dark
                            }}
                        >
                            <span>{s.label}</span>
                            <span style={{ background: isSelected ? P.brand : P.bg, color: isSelected ? '#fff' : P.muted, padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                                {s.count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Cases List */}
            {loading ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: P.muted, fontWeight: 700, marginTop: 12 }}>Loading onboarding cases...</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 60, textAlign: 'center' }}>
                    <ShieldCheck size={40} color={P.muted} style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: P.dark, margin: 0 }}>No Onboarding Cases Found</h3>
                    <p style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>Click "New Onboarding Case" or change your stage filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                    {filteredCases.map(ob => {
                        const st = ONBOARDING_STAGES_CONFIG[ob.stage] || ONBOARDING_STAGES_CONFIG.assigned
                        const staff = ob.assigned_staff
                        const checklists = ob.checklists || []
                        const totalTasks = checklists.length
                        const completedTasks = checklists.filter((c: any) => c.is_completed).length
                        const pct = ob.stage_progress_pct || st.pct

                        return (
                            <div key={ob.id} onClick={() => setSelectedCase(ob)} style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, cursor: 'pointer', transition: 'all 0.15s' }}>
                                {/* Left: Organization & Contact */}
                                <div style={{ flex: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>{ob.organization_name}</span>
                                        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                            STAGE {Object.keys(ONBOARDING_STAGES_CONFIG).indexOf(ob.stage) + 1}/8: {st.label.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {ob.contact_name && <span>Contact: {ob.contact_name}</span>}
                                        {ob.contact_email && <span>• {ob.contact_email}</span>}
                                        {ob.contact_phone && <span>• {ob.contact_phone}</span>}
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginTop: 10, maxWidth: 360 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: P.muted, marginBottom: 4 }}>
                                            <span>Progress: {pct}%</span>
                                            {totalTasks > 0 && <span>Checklist: {completedTasks}/{totalTasks} Done</span>}
                                        </div>
                                        <div style={{ height: 6, background: P.bg, borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: st.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Assigned Specialist */}
                                <div style={{ flex: 1, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                        Onboarding Specialist
                                    </div>
                                    {staff ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: P.brand }}>
                                                {staff.first_name?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>{staff.first_name} {staff.last_name}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{staff.role}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: P.warning, fontWeight: 800 }}>⚠️ Unassigned</div>
                                    )}
                                </div>

                                {/* Right: Stage Dropdown & Action */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <select
                                        value={ob.stage}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                            e.stopPropagation()
                                            handleAdvanceStage(ob.id, e.target.value)
                                        }}
                                        style={{ padding: '8px 12px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 12, fontWeight: 800, background: '#fff', color: P.dark, outline: 'none' }}
                                    >
                                        {Object.entries(ONBOARDING_STAGES_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={18} color={P.muted} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL: CREATE ONBOARDING CASE */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <ShieldCheck size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>New Onboarding Case</h3>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Organization / School Name *</label>
                            <input value={createForm.organization_name} onChange={e => setCreateForm({ ...createForm, organization_name: e.target.value })} placeholder="e.g. St. Xavier International" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Contact Person</label>
                                <input value={createForm.contact_name} onChange={e => setCreateForm({ ...createForm, contact_name: e.target.value })} placeholder="Rahul Sharma" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Contact Email</label>
                                <input type="email" value={createForm.contact_email} onChange={e => setCreateForm({ ...createForm, contact_email: e.target.value })} placeholder="rahul@school.com" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Assign Onboarding Specialist</label>
                            <select value={createForm.assigned_staff_id} onChange={e => setCreateForm({ ...createForm, assigned_staff_id: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#fff', outline: 'none' }}>
                                <option value="">Auto-Assign Best Specialist</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateCase} disabled={createSaving} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {createSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} Start Onboarding
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL DRAWER / MODAL FOR CHECKLIST EXECUTION */}
            {selectedCase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9998, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: '100%', maxWidth: 540, background: '#fff', height: '100%', boxShadow: '-20px 0 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.brandBg }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.brand }}>{selectedCase.organization_name}</h3>
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: P.muted, fontWeight: 600 }}>8-Stage Onboarding Checklist Execution</p>
                            </div>
                            <button onClick={() => setSelectedCase(null)} style={{ background: '#fff', border: `1px solid ${P.border}`, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color={P.muted} /></button>
                        </div>

                        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Current Stage</label>
                                <select
                                    value={selectedCase.stage}
                                    onChange={e => handleAdvanceStage(selectedCase.id, e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 900, color: P.brand, background: P.brandBg, outline: 'none' }}
                                >
                                    {Object.entries(ONBOARDING_STAGES_CONFIG).map(([k, v]) => (
                                        <option key={k} value={k}>STAGE: {v.label.toUpperCase()} ({v.pct}%)</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ fontSize: 13, fontWeight: 900, color: P.dark, marginBottom: 12 }}>Checklist Tasks for Current Stage ({selectedCase.stage.toUpperCase()})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(selectedCase.checklists || []).filter((c: any) => c.stage === selectedCase.stage).length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: P.muted, fontSize: 12 }}>No checklist items defined for this stage.</div>
                                ) : (selectedCase.checklists || []).filter((c: any) => c.stage === selectedCase.stage).map((chk: any) => (
                                    <div
                                        key={chk.id}
                                        onClick={() => handleToggleChecklist(selectedCase.id, chk.id, chk.is_completed)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: `1px solid ${P.border}`, borderRadius: 10, background: chk.is_completed ? '#ECFDF5' : '#fff', cursor: 'pointer' }}
                                    >
                                        {chk.is_completed ? <CheckSquare size={18} color={P.success} /> : <Square size={18} color={P.muted} />}
                                        <span style={{ fontSize: 13, fontWeight: 700, color: chk.is_completed ? P.muted : P.dark, textDecoration: chk.is_completed ? 'line-through' : 'none' }}>
                                            {chk.task_name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '20px 28px', borderTop: `1px solid ${P.border}`, background: P.bg }}>
                            <button
                                onClick={() => {
                                    const stageKeys = Object.keys(ONBOARDING_STAGES_CONFIG)
                                    const currIdx = stageKeys.indexOf(selectedCase.stage)
                                    if (currIdx < stageKeys.length - 1) {
                                        handleAdvanceStage(selectedCase.id, stageKeys[currIdx + 1])
                                    }
                                }}
                                style={{ width: '100%', padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                Advance to Next Stage <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
