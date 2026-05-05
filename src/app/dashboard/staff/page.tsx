'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Shield, Users, Key, PlusCircle, CheckCircle, XCircle, Search,
    Power, ShieldAlert, FileEdit, Eye, Lock, Loader2
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────
type StaffNode = { id: string, first_name: string, last_name: string, email: string, role: string, is_active: boolean, created_at: string }

const ROLES = [
    { id: 'admin', label: 'Tenant Admin', icon: Shield, color: '#EF4444', bg: '#FEF2F2', root: true },
    { id: 'teacher', label: 'Faculty / Teacher', icon: Users, color: '#3B82F6', bg: '#EFF6FF', root: false },
    { id: 'editor', label: 'Editor (Q-Bank Only)', icon: FileEdit, color: '#F59E0B', bg: '#FFFBEB', root: false },
    { id: 'reviewer', label: 'Reviewer (QA Approvals)', icon: Eye, color: '#10B981', bg: '#ECFDF5', root: false }
]

// ── MODALS & COMPONENTS ──────────────────────────────────
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Save', maxWidth = 520 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 24, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}><Key size={22} color="var(--color-primary)" /> {title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}><XCircle size={18} color="#64748B" /></button>
                </div>
                <div style={{ padding: '24px 32px', overflowY: 'auto' }}>{children}</div>
                <div style={{ padding: '20px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '12px 20px', borderRadius: 12, background: 'transparent', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--color-primary-gradient)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-primary)' }}>
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
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: '12px 14px', border: 'none', fontSize: 14, color: '#0F172A', outline: 'none' }} />
            </div>
        </div>
    )
}

// ── MAIN PAGE ────────────────────────────────────────────
export default function RBACDashboard() {
    const [staff, setStaff] = useState<StaffNode[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Modals
    const [showDeployModal, setShowDeployModal] = useState(false)

    // Form State
    const [form, setForm] = useState<any>({
        first_name: '', last_name: '', email: '', role: 'teacher'
    })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    const fetchStaff = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/staff')
            const json = await res.json()
            if (res.ok) setStaff(json || [])
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchStaff() }, [fetchStaff])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/staff', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Access Control logic failure')
            await fetchStaff()
            showToast('Access Control Updated!', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Transmission Exception', false)
            return { success: false }
        } finally { setSaving(false) }
    }

    const handleCreate = async () => {
        if (!form.email || !form.role) return showToast('Email and security scope logic required.', false)
        const { success } = await apiAction('CREATE_STAFF', form)
        if (success) setShowDeployModal(false)
    }

    const toggleStatus = async (id: string, current: boolean) => {
        if (confirm(`Suspend this staff vector? They will lose all portal access instantly.`)) {
            apiAction('TOGGLE_STATUS', { id, is_active: !current })
        }
    }

    const handleRoleSwap = async (id: string, newRole: string) => {
        if (confirm(`WARNING: Modifying root RBAC bounds. Escalating or stripping permissions?`)) {
            apiAction('UPDATE_ROLE', { id, role: newRole })
        }
    }

    const filteredStaff = staff.filter(s => s.email?.toLowerCase().includes(search.toLowerCase()) || s.first_name?.toLowerCase().includes(search.toLowerCase()))

    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100%', position: 'relative' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? '#10B981' : '#EF4444') + '40', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                        Institutional Access Map <ShieldAlert size={20} color="var(--color-primary)" />
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 0', fontWeight: 600 }}>
                        Manage Institutional-scoped permissions. Explicitly provision Editors, Reviewers, and Administration.
                    </p>
                </div>
                <div>
                    <button onClick={() => setShowDeployModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary-gradient)', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: '#FFF', cursor: 'pointer', boxShadow: 'var(--shadow-primary)', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <PlusCircle size={16} color="#FFF" /> Authorize New Staff
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div style={{ marginBottom: 24, position: 'relative' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search hierarchy by exact identity or email structure..."
                    style={{ width: '100%', padding: '14px 16px 14px 44px', border: '1px solid #E2E8F0', borderRadius: 14, outline: 'none', fontSize: 14, color: '#0F172A', fontWeight: 500, background: '#FFF', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                />
            </div>

            {/* RBAC GRID / LIST */}
            {loading && staff.length === 0 ? (
                <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} color="#672AEA" style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {filteredStaff.map(s => {
                        const RoleNode = ROLES.find(r => r.id === s.role) || ROLES[1]
                        const Icon = RoleNode.icon
                        return (
                            <div key={s.id} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>

                                {RoleNode.root && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: RoleNode.color }} />}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: RoleNode.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={20} color={RoleNode.color} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{s.first_name} {s.last_name || ''}</div>
                                            <div style={{ fontSize: 12, color: s.is_active ? '#10B981' : '#EF4444', fontWeight: 800, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {s.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                {s.is_active ? 'ACCESS GRANTED' : 'ACCESS REVOKED'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>System Target</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{s.email}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <select
                                        value={s.role}
                                        onChange={(e) => handleRoleSwap(s.id, e.target.value)}
                                        style={{ flex: 1, padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', fontWeight: 700, outline: 'none', background: '#FFF', cursor: 'pointer' }}
                                    >
                                        {ROLES.map(r => (
                                            <option key={r.id} value={r.id}>{r.label}</option>
                                        ))}
                                    </select>

                                    <button onClick={() => toggleStatus(s.id, s.is_active)} style={{ width: 40, height: 40, background: s.is_active ? '#FFF' : '#FEF2F2', border: '1px solid ' + (s.is_active ? '#E2E8F0' : '#FECACA'), borderRadius: 10, color: s.is_active ? '#94A3B8' : '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title={s.is_active ? "Suspend Identity Engine" : "Re-activate Vector"}>
                                        <Power size={18} />
                                    </button>
                                </div>

                            </div>
                        )
                    })}
                    {filteredStaff.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 24 }}>
                            <div style={{ width: 64, height: 64, background: '#F1F5F9', borderRadius: '50%', color: '#94A3B8', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Lock size={32} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>RBAC Array Empty</h4>
                            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748B', fontWeight: 500 }}>Deploy explicitly mapped identities to grant localized admin/teaching capabilities.</p>
                        </div>
                    )}
                </div>
            )}

            {/* PROTOCOL MODAL */}
            {showDeployModal && (
                <Modal title="New Staff Authorization" onClose={() => setShowDeployModal(false)} onSubmit={handleCreate} saving={saving} saveText="Authorize Account" maxWidth={600}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Input label="First Name" value={form.first_name} onChange={(v: string) => setForm({ ...form, first_name: v })} placeholder="e.g. Rahul" />
                            <Input label="Last Name" value={form.last_name} onChange={(v: string) => setForm({ ...form, last_name: v })} placeholder="e.g. Verma" />
                        </div>

                        <Input label="Official Email Address" type="email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} placeholder="staff@school.edu" />

                        <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Authorization Levels (RBAC)</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, color: '#0F172A', fontWeight: 600, outline: 'none', background: '#fff' }}>
                                {ROLES.map(r => (
                                    <option key={r.id} value={r.id}>{r.label.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#FFFBEB', border: '1px solid #FCD34D', padding: 16, borderRadius: 12, marginTop: 8 }}>
                            <ShieldAlert size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#92400E', lineHeight: 1.5 }}>
                                <strong>WARNING:</strong> Assigning the <strong style={{ color: '#0F172A' }}>TENANT ADMIN</strong> role grants complete destructive authority natively bypassing RLS queries scoped to this specific tenant account. Initial auto-password will be set to: <code>SecureStaff#123!@</code>
                            </p>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    )
}
