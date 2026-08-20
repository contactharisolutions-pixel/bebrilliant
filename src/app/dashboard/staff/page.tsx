'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Shield, Users, Key, PlusCircle, CheckCircle, XCircle, Search,
    Power, ShieldAlert, FileEdit, Eye, Lock, Loader2, Video, Calendar,
    Clock, PhoneCall, CheckCircle2, AlertTriangle, Sparkles, Award,
    CheckSquare, Square, User, Building2, ChevronRight, Activity, ArrowUpRight
} from 'lucide-react'
import { P } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

export default function StaffPersonalWorkspace() {
    const [userProfile, setUserProfile] = useState<any>(null)
    const [myTasks, setMyTasks] = useState<any[]>([])
    const [myDemos, setMyDemos] = useState<any[]>([])
    const [myOnboarding, setMyOnboarding] = useState<any[]>([])
    const [myTraining, setMyTraining] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [taskFilter, setTaskFilter] = useState<'pending' | 'completed' | 'all'>('pending')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok = true) => setToast({ msg, ok })

    const fetchWorkspaceData = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch current staff user tasks
            const resTasks = await fetch('/api/owner/tasks?assigned_to=me')
            if (resTasks.ok) {
                const d = await resTasks.json()
                setMyTasks(d.tasks ?? [])
            }

            // Fetch current staff demos
            const resDemos = await fetch('/api/owner/demos')
            if (resDemos.ok) {
                const d = await resDemos.json()
                setMyDemos(d.demos ?? [])
            }

            // Fetch onboarding cases
            const resOb = await fetch('/api/owner/onboarding/cases')
            if (resOb.ok) {
                const d = await resOb.json()
                setMyOnboarding(d.cases ?? [])
            }

            // Fetch training cases
            const resTr = await fetch('/api/owner/training')
            if (resTr.ok) {
                const d = await resTr.json()
                setMyTraining(d.cases ?? [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWorkspaceData()
    }, [fetchWorkspaceData])

    async function handleCompleteTask(taskId: string) {
        try {
            const res = await fetch(`/api/owner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            })
            if (res.ok) {
                showToast('Task marked as completed!', true)
                fetchWorkspaceData()
            }
        } catch (e) {
            showToast('Failed to complete task', false)
        }
    }

    const filteredTasks = myTasks.filter(t => {
        if (taskFilter === 'pending') return t.status === 'pending' || t.status === 'in_progress'
        if (taskFilter === 'completed') return t.status === 'completed'
        return true
    })

    const pendingTasksCount = myTasks.filter(t => t.status === 'pending').length
    const completedTasksCount = myTasks.filter(t => t.status === 'completed').length

    return (
        <div style={{ padding: '32px 40px', background: P.bg, minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle2 size={16} color={P.success} /> : <AlertTriangle size={16} color={P.error} />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* Header Banner */}
            <div style={{ background: P.brand, borderRadius: 24, padding: '28px 36px', color: '#fff', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `0 12px 32px ${P.brand}30` }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        <Sparkles size={12} color="#F0A026" /> Platform Operations Workspace
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 950, margin: 0 }}>Staff Personal Operational Hub</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85, fontWeight: 600 }}>Role-aware dashboard: Your assigned tasks, demos, onboarding cases & schedule.</p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 950 }}>{pendingTasksCount}</div>
                        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>My Tasks Due</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 950 }}>{myDemos.length}</div>
                        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>My Demos</div>
                    </div>
                </div>
            </div>

            {/* Role Modules Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Left Column: My Tasks & Assigned Work */}
                <div>
                    {/* My Tasks Panel */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 24, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CheckSquare size={20} color={P.brand} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>My Action Tasks</h3>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                                {[
                                    { key: 'pending', label: 'Pending', count: pendingTasksCount },
                                    { key: 'completed', label: 'Completed', count: completedTasksCount },
                                    { key: 'all', label: 'All', count: myTasks.length },
                                ].map(t => (
                                    <button
                                        key={t.key}
                                        onClick={() => setTaskFilter(t.key as any)}
                                        style={{
                                            padding: '5px 12px', borderRadius: 8, border: 'none',
                                            background: taskFilter === t.key ? P.brandBg : 'transparent',
                                            color: taskFilter === t.key ? P.brand : P.muted,
                                            fontWeight: 800, fontSize: 12, cursor: 'pointer'
                                        }}
                                    >
                                        {t.label} ({t.count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
                        ) : filteredTasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: P.muted, fontSize: 13 }}>No tasks found in this view.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {filteredTasks.map(t => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: `1px solid ${P.border}`, borderRadius: 14, background: t.status === 'completed' ? '#ECFDF5' : '#fff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <button onClick={() => t.status !== 'completed' && handleCompleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                {t.status === 'completed' ? <CheckSquare size={18} color={P.success} /> : <Square size={18} color={P.muted} />}
                                            </button>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: t.status === 'completed' ? P.muted : P.dark, textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                                                    {t.title}
                                                </div>
                                                {t.description && <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>{t.description}</div>}
                                                {t.due_at && (
                                                    <div style={{ fontSize: 11, color: P.brand, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={11} /> Due: {new Date(t.due_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <span style={{ background: t.priority === 'high' ? '#FEF2F2' : P.bg, color: t.priority === 'high' ? '#DC2626' : P.muted, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>
                                            {t.priority?.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Demos Section */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Video size={20} color={P.purple} />
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>My Demo Presentations</h3>
                            </div>
                            <a href="/owner/demos" style={{ fontSize: 12, fontWeight: 800, color: P.brand, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                View All Demos <ArrowUpRight size={13} />
                            </a>
                        </div>

                        {myDemos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 30, color: P.muted, fontSize: 13 }}>No demos assigned to you yet.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {myDemos.slice(0, 5).map(d => (
                                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, border: `1px solid ${P.border}`, borderRadius: 14, background: P.bg }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{d.lead?.name || 'Prospect'} — {d.lead?.organization || ''}</div>
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 2 }}>Format: {d.demo_type === 'on_site' ? 'On-Site School Visit' : 'Online Video Call'}</div>
                                        </div>
                                        <span style={{ background: P.purpleBg, color: P.purple, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                            {d.status?.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Quick Links & Active Workload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Quick Operations Links */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 24 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 950, color: P.dark }}>Operational Shortcuts</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'CRM & Lead Pipeline', href: '/owner/crm', icon: Users, color: P.brand },
                                { label: 'Demo Operations Hub', href: '/owner/demos', icon: Video, color: P.purple },
                                { label: 'Onboarding Lifecycle', href: '/owner/onboarding', icon: ShieldCheck, color: P.success },
                                { label: 'Training & Go-Live', href: '/owner/training', icon: Award, color: P.warning },
                            ].map(link => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: `1px solid ${P.border}`, borderRadius: 14, textDecoration: 'none', background: P.bg, transition: 'transform 0.15s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <link.icon size={16} color={link.color} />
                                        <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{link.label}</span>
                                    </div>
                                    <ChevronRight size={16} color={P.muted} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Active Onboarding Cases */}
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, padding: 24 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 950, color: P.dark }}>Active Onboarding Cases</h3>
                        {myOnboarding.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: P.muted, fontSize: 12 }}>No active onboarding cases.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {myOnboarding.slice(0, 4).map(ob => (
                                    <div key={ob.id} style={{ padding: 12, border: `1px solid ${P.border}`, borderRadius: 12, background: P.bg }}>
                                        <div style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>{ob.organization_name}</div>
                                        <div style={{ fontSize: 11, color: P.brand, fontWeight: 800, marginTop: 4 }}>Stage: {ob.stage?.toUpperCase()} ({ob.stage_progress_pct || 12}%)</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}