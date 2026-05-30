'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    BellRing, Zap, Mail, MessageSquare, PlayCircle, PlusCircle,
    PauseCircle, Trash2, CheckCircle2, XCircle, Loader2, Save, ArrowRight
} from 'lucide-react'
// ── MAIN PAGE ────────────────────────────────────────────
export default function AutomatedWorkflows() {
    const [flows, setFlows] = useState<any[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }
    const fetchFlows = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/automation')
            const json = await res.json()
            if (res.ok) setFlows(json)
        } finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchFlows() }, [fetchFlows])
    const handleSave = async (updatedFlows = flows) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/automation', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SAVE_WORKFLOWS', payload: updatedFlows })
            })
            if (!res.ok) throw new Error()
            showToast('Workflow rule committed', true)
        } catch (e: any) {
            showToast('Sync Failed', false)
        } finally { setSaving(false) }
    }
    const toggleStatus = (id: string) => {
        const newFlows = flows!.map(f => f.id === id ? { ...f, status: f.status === 'active' ? 'paused' : 'active' } : f)
        setFlows(newFlows)
        handleSave(newFlows)
    }
    const deleteFlow = (id: string) => {
        if (confirm('Delete this automated sequence permanently?')) {
            const newFlows = flows!.filter(f => f.id !== id)
            setFlows(newFlows)
            handleSave(newFlows)
        }
    }
    if (loading || !flows) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: '#F8FAFC' }}>
                <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>Synchronizing Automation Engine...</div>
            </div>
        )
    }
    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100%', position: 'relative' }}>
            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? '#10B981' : '#EF4444') + '40', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle2 size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                        Workflow Triggers <BellRing size={24} color="var(--color-primary)" />
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0', fontWeight: 600 }}>Configure intelligent responses to system events (Enrollments, Payments, Assessments).</p>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary-gradient)', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 800, color: '#FFF', cursor: 'pointer', boxShadow: 'var(--shadow-primary)' }}>
                    <PlusCircle size={18} /> INITIALIZE WORKFLOW
                </button>
            </div>
            {/* FLOWS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                {flows.map((flow) => {
                    const isActive = flow.status === 'active'
                    return (
                        <div key={flow.id} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                            {!isActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', backdropFilter: 'grayscale(1)', zIndex: 10, borderRadius: 24, pointerEvents: 'none' }} />}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative', zIndex: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 48, height: 48, background: isActive ? 'var(--color-primary-bg)' : '#F1F5F9', color: isActive ? 'var(--color-primary)' : '#94A3B8', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{flow.name}</h3>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? 'var(--color-primary)' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                                            {isActive ? 'WORKFLOW ACTIVE' : 'WORKFLOW PAUSED'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => toggleStatus(flow.id)} style={{ width: 32, height: 32, borderRadius: '50%', background: isActive ? '#FEF2F2' : '#EFF6FF', border: 'none', color: isActive ? '#EF4444' : '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isActive ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                                    </button>
                                    <button onClick={() => deleteFlow(flow.id)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F8FAFC', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 20 }}>
                                <div style={{ flex: 1, padding: '16px 20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Event Trigger</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <PlayCircle size={14} color="var(--color-primary)" /> {flow.trigger.split('_').join(' ').toUpperCase()}
                                    </div>
                                </div>
                                <ArrowRight size={20} color="#CBD5E1" />
                                <div style={{ flex: 1, padding: '16px 20px', background: 'var(--color-primary-bg)', border: '1px solid var(--color-primary)50', borderRadius: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 8 }}>Target Action</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Mail size={14} color="var(--color-primary)" /> {flow.action.split('_').join(' ').toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                 {/* ADD STUB */}
                <button style={{ border: '2px dashed #E2E8F0', borderRadius: 24, padding: 60, background: 'transparent', color: '#94A3B8', cursor: 'pointer', textAlign: 'center' }}>
                    <PlusCircle size={32} color="#CBD5E1" style={{ marginBottom: 16 }} />
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Authorize Trigger</h4>
                    <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>Create extra automated triggers mapped to your student base.</p>
                </button>
            </div>
        </div>
    )
}
