'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Users, Search, PlusCircle, UploadCloud, Target, Headset, CheckCircle,
    XCircle, Loader2, ArrowRight, Download, Inbox, UserCheck, ShieldCheck
} from 'lucide-react'

// â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Lead = { id: string, name: string, email: string, phone: string, status: string, lead_score: number, created_at: string, source: string }

const STAGES = [
    { id: 'lead', title: 'New Prospects', icon: Inbox, color: '#3B82F6', bg: '#EFF6FF' },
    { id: 'inquiry', title: 'Active Inquiries', icon: Headset, color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'enrolled', title: 'Fee Confirmation', icon: Target, color: '#10B981', bg: '#ECFDF5' },
    { id: 'student', title: 'Enrolled Students', icon: ShieldCheck, color: '#1FAC63', bg: '#F5F3FF' }
]

// â”€â”€ MODALS & COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Save', maxWidth = 520 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={16} color="#64748B" /></button>
                </div>
                <div style={{ padding: 24, overflowY: 'auto' }}>{children}</div>
                <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, background: 'transparent', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel Payload</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--color-primary-gradient)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-primary)' }}>
                        {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Input({ label, value, onChange, placeholder = '', type = 'text', prefix = '' }: any) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.2s' }}>
                {prefix && <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: 14 }}>{prefix}</div>}
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: 14, color: '#0F172A', outline: 'none' }} />
            </div>
        </div>
    )
}

// â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CRMBoard() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)

    const [form, setForm] = useState<any>({ name: '', email: '', phone: '', organization: '', source: 'Manual Entry' })
    const [csvContent, setCsvContent] = useState<string>('')

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/crm')
            const json = await res.json()
            if (res.ok) {
                setLeads(json || [])
                // Hacky check for owner context based on lead data organization field existence
                if (json && json.length > 0 && 'organization' in json[0]) setIsOwner(true)
            }
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/crm', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Action failed')
            await fetchLeads()
            showToast('Pipeline Modified Successfully', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Action failed', false)
            return { success: false }
        } finally { setSaving(false) }
    }

    const handleCreate = async () => {
        if (!form.name || !form.email) return showToast('Name and Email identity required', false)
        const { success } = await apiAction('CREATE_LEAD', form)
        if (success) setShowAddModal(false)
    }

    const handleStatusChange = async (id: string, currentStatus: string) => {
        const currentIndex = STAGES.findIndex(s => s.id === currentStatus)
        if (currentIndex === -1 || currentIndex === STAGES.length - 1) return

        const nextStatus = STAGES[currentIndex + 1].id
        if (confirm(`Advance this target to the next sequence (${STAGES[currentIndex + 1].title})?`)) {
            apiAction('UPDATE_STATUS', { id, status: nextStatus })
        }
    }

    const handleBulkUpload = async () => {
        if (!csvContent) return showToast('Please supply raw CSV string mapping', false)
        const lines = csvContent.trim().split('\n')
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

        if (!headers.includes('name') || !headers.includes('email')) {
            return showToast('Headers missing: name, email', false)
        }

        const payload = lines.slice(1).map(line => {
            const vals = line.split(',')
            const row: any = {}
            headers.forEach((h, i) => row[h] = vals[i]?.trim() || '')
            return row
        }).filter(r => r.name && r.email)

        if (payload.length === 0) return showToast('Zero mapped targets extracted', false)

        const { success } = await apiAction('BULK_CREATE_LEADS', payload)
        if (success) setShowBulkModal(false)
    }

    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        (l as any).organization?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div style={{ padding: '40px 48px', background: '#F8FAFC', minHeight: '100%', position: 'relative' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .kanban-col { background: rgba(241, 245, 249, 0.6); border: 1px solid #E2E8F0; border-radius: 24px; padding: 24px 20px; display: flex; flexDirection: column; min-height: 70vh; backdrop-filter: blur(8px); }
                .lead-card:hover { border-color: var(--color-primary) !important; transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }
            `}</style>

            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? '#10B981' : '#EF4444') + '80', borderRadius: 14, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 10000 }}>
                    {toast.ok ? <CheckCircle size={18} color="#10B981" /> : <XCircle size={18} color="#EF4444" />}
                    <span style={{ fontSize: 14, fontWeight: 800, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.04em' }}>Admissions & Inquiry Pipeline</h1>
                        <span style={{ fontSize: 10, fontWeight: 900, background: isOwner ? '#E0E7FF' : '#F1F5F9', color: isOwner ? '#4338CA' : '#64748B', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid ' + (isOwner ? '#C7D2FE' : '#E2E8F0') }}>
                            {isOwner ? 'Institutional Sector' : 'Campus Registry'}
                        </span>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600 }}>
                        Analytics of enrollment pipeline and conversions mapping globally.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => { setCsvContent('name,email,phone,organization\nJane Client,jane@example.com,555-0900,Alpha Corp'); setShowBulkModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 800, color: '#334155', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                        <UploadCloud size={18} color="#64748B" /> Batch Inject
                    </button>
                    <button onClick={() => { setForm({ name: '', email: '', phone: '', organization: '', source: 'Manual Entry' }); setShowAddModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-primary-gradient)', border: 'none', borderRadius: 14, padding: '12px 24px', fontSize: 14, fontWeight: 800, color: '#FFF', cursor: 'pointer', boxShadow: 'var(--shadow-primary)', transition: 'all 0.2s' }}>
                        <PlusCircle size={18} color="#FFF" /> Add New Prospect
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div style={{ marginBottom: 32, position: 'relative' }}>
                <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search pipeline vectors by identity, tracking credentials, or organization..."
                    style={{ width: '100%', padding: '18px 24px 18px 56px', border: '1px solid #E2E8F0', borderRadius: 20, outline: 'none', fontSize: 15, color: '#0F172A', fontWeight: 600, background: '#FFF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                />
            </div>

            {/* KANBAN BOARD */}
            {loading && leads.length === 0 ? (
                <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={42} color="var(--color-primary)" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 20 }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                    {STAGES.map(stage => {
                        const stageLeads = filteredLeads.filter(l => l.status === stage.id || (stage.id === 'lead' && l.status === 'new'))
                        return (
                            <div key={stage.id} className="kanban-col">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 20px', borderBottom: '2px solid #E2E8F0', marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, background: stage.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <stage.icon size={20} color={stage.color} />
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 1000, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>{stage.title}</h4>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: '#64748B', background: '#E2E8F0', padding: '4px 12px', borderRadius: 10 }}>{stageLeads.length}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                                    {stageLeads.map(l => (
                                        <div key={l.id} className="lead-card" style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'grab' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div>
                                                    <h5 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>{l.name}</h5>
                                                    {(l as any).organization && (
                                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#1FAC63', background: '#F5F3FF', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginTop: 4 }}>
                                                            {(l as any).organization}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 1000, background: '#F8FAFC', padding: '4px 8px', borderRadius: 8, color: '#475569', border: '1px solid #E2E8F0' }}>
                                                        {l.lead_score || 0}% SYNC
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                                                    <Search size={14} color="#94A3B8" /> {l.email}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 13, fontWeight: 500 }}>
                                                    <Users size={14} color="#CBD5E1" /> {l.phone || 'No route data'}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Born</span>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B' }}>{new Date(l.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {stage.id !== 'converted' && (
                                                    <button onClick={() => handleStatusChange(l.id, l.status)} style={{ background: 'var(--color-primary-gradient)', border: 'none', width: 32, height: 32, borderRadius: 12, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)', transition: 'all 0.2s' }} title="Advance Pipeline">
                                                        <ArrowRight size={18} strokeWidth={3} />
                                                    </button>
                                                )}
                                                {stage.id === 'converted' && (
                                                    <div style={{ padding: '6px 12px', background: '#ECFDF5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <ShieldCheck size={14} color="#10B981" />
                                                        <span style={{ fontSize: 11, fontWeight: 900, color: '#10B981', textTransform: 'uppercase' }}>Verified Student</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {stageLeads.length === 0 && (
                                        <div style={{ border: '2px dashed #E2E8F0', borderRadius: 24, padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.4)' }}>
                                            Sequence Sector Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MANUAL LEAD MODAL */}
            {showAddModal && (
                <Modal title="Deploy Tracking Marker" onClose={() => setShowAddModal(false)} onSubmit={handleCreate} saving={saving} saveText="Build Vector">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', fontWeight: 600, lineHeight: 1.5 }}>
                            Register a new identity into the <strong style={{ color: '#0F172A' }}>Initial New Prospect</strong> sector of the global pipeline.
                        </p>
                        <Input label="Identity Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} placeholder="e.g. John Doe" />
                        <Input label="Email Tracker" type="email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} placeholder="john@client.io" />
                        {isOwner && <Input label="Organization Node" value={form.organization} onChange={(v: string) => setForm({ ...form, organization: v })} placeholder="e.g. Acme Tech" />}
                        <Input label="Direct Routing Phone" type="tel" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} placeholder="+91 XXX XXX XXXX" />
                    </div>
                </Modal>
            )}

            {/* BULK CSV MODAL */}
            {showBulkModal && (
                <Modal title="Array Injection Routine" onClose={() => setShowBulkModal(false)} onSubmit={handleBulkUpload} saving={saving} saveText="Fire Sequence" maxWidth={750}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', fontWeight: 600, lineHeight: 1.5 }}>
                            Paste raw CSV mapping schema. Header requirements: <strong style={{ background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, color: '#334155', fontFamily: 'monospace' }}>name, email, phone, organization</strong>
                        </p>
                        <textarea
                            value={csvContent}
                            onChange={e => setCsvContent(e.target.value)}
                            style={{ width: '100%', height: 320, padding: 20, border: '1px solid #E2E8F0', borderRadius: 20, outline: 'none', background: '#F8FAFC', color: '#0F172A', fontFamily: 'monospace', fontSize: 14, fontWeight: 600, resize: 'vertical', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}
                            placeholder="name,email,phone,organization\n..."
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '12px 16px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 12, fontSize: 13, fontWeight: 900 }}>
                            <ArrowRight size={16} strokeWidth={3} /> Mapping Logic Detected: identity, route, tracking, org
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
