'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    UsersRound, Search, UserPlus, CheckCircle, XCircle,
    MoreVertical, ShieldCheck, ShieldAlert, BookOpen, Loader2,
    Trash2, Edit3, Filter, Activity, Cpu, Briefcase,
    ChevronDown, GraduationCap, Clock, Globe, Shield,
    CheckCheck, Star, SlidersHorizontal, ArrowUpRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ── TYPES ────────────────────────────────────────────────
type Teacher = { 
    id: string; 
    first_name: string; 
    last_name: string; 
    email: string; 
    phone: string; 
    is_active: boolean; 
    created_at: string; 
    metadata?: { 
        assigned_subjects?: string[]; 
        assigned_classes?: string[]; 
        assigned_divisions?: string[]; 
    } 
}
type Subject = { id: string; name: string; tenant_id?: string | null }
const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    border: '#E2E8F0',
    background: '#F8FAFC',
    glass: 'rgba(255, 255, 255, 0.7)'
}
// ── COMPONENTS ──────────────────────────────────
function TeacherModal({ title, onClose, children, onSubmit, saving, saveText = 'Save', maxWidth = 520 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'float 0.3s ease-out', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}><XCircle size={18} color="#64748B" /></button>
                </div>
                <div className="custom-scrollbar" style={{ padding: 32, overflowY: 'auto', flex: 1 }}>{children}</div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel Transmission</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: COLORS.primaryGradient, border: 'none', color: '#fff', fontSize: 13, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                        {saving && <Loader2 size={16} className="spin" />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}
function TeacherInput({ label, value, onChange, placeholder = '', type = 'text', prefix = '', icon: Icon }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
            <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #F1F5F9', borderRadius: 16, overflow: 'hidden', background: '#F8FAFC', transition: '0.2s', padding: '0 16px' }}>
                {Icon && <Icon size={18} color="#94A3B8" style={{ marginRight: 12 }} />}
                {prefix && <div style={{ borderRight: '2px solid #F1F5F9', color: '#475569', fontWeight: 800, fontSize: 14, marginRight: 12 }}>{prefix}</div>}
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: '14px 0', border: 'none', background: 'transparent', fontSize: 14, color: '#0F172A', fontWeight: 700, outline: 'none' }} />
            </div>
        </div>
    )
}
// ── MAIN PAGE ────────────────────────────────────────────
export default function FacultyManagement() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all')
    const [subjectFilter, setSubjectFilter] = useState('all')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showScopeModal, setShowScopeModal] = useState<string | null>(null)
    // Forms
    const [teacherForm, setTeacherForm] = useState<any>({ first_name: '', last_name: '', email: '', phone: '', subjects: [] })
    const [assignForm, setAssignForm] = useState<string[]>([])
    const [assignClasses, setAssignClasses] = useState<string[]>([])
    const [assignDivisions, setAssignDivisions] = useState<string[]>([])
    const [newSubName, setNewSubName] = useState('')
    const supabase = createClient()
    const fetchFaculty = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/teachers')
            const json = await res.json()
            if (res.ok) {
                setTeachers(json.teachers || [])
                setSubjects(json.subjects || [])
            }
        } finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchFaculty() }, [fetchFaculty])
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }
    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/teachers', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Action failed')
            await fetchFaculty()
            showToast('Institutional Logic Synchronized', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Transmission Failed', false)
            return { success: false }
        } finally { setSaving(false) }
    }
    const handleCreateTeacher = async () => {
        if (!teacherForm.email || !teacherForm.phone) return showToast('Email and Phone protocols required', false)
        const { success } = await apiAction('CREATE_TEACHER', teacherForm)
        if (success) setShowAddModal(false)
    }
    const handleToggleState = (id: string, current: boolean) => {
        apiAction('TOGGLE_STATUS', { id, is_active: !current })
    }
    const openScopeModal = (t: Teacher) => {
        setAssignForm(t.metadata?.assigned_subjects || [])
        setAssignClasses(t.metadata?.assigned_classes || [])
        setAssignDivisions(t.metadata?.assigned_divisions || [])
        setShowScopeModal(t.id)
    }
    const handleAssignScope = async () => {
        if (!showScopeModal) return
        const { success } = await apiAction('ASSIGN_SCOPE', { 
            id: showScopeModal, 
            subjects: assignForm,
            classes: assignClasses,
            divisions: assignDivisions
        })
        if (success) setShowScopeModal(null)
    }
    const handleAddSubject = async () => {
        if (!newSubName || newSubName.length < 2) return
        const { success } = await apiAction('CREATE_SUBJECT', { name: newSubName })
        if (success) setNewSubName('')
    }
    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => {
            const matchesSearch = t.first_name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? t.is_active : !t.is_active)
            const matchesSubject = subjectFilter === 'all' || t.metadata?.assigned_subjects?.includes(subjectFilter)
            return matchesSearch && matchesStatus && matchesSubject
        })
    }, [teachers, search, statusFilter, subjectFilter])
    const pendingCount = teachers.filter(t => !t.is_active).length
    return (
        <div style={{ padding: '40px 48px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* TOAST NODES */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? COLORS.success : COLORS.danger) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 20000, animation: 'float 0.3s ease-out' }}>
                    {toast.ok ? <CheckCircle size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}
            {/* INSTITUTIONAL HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Cpu size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Faculty Management</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 600, lineHeight: 1.6 }}>
                        Manage your teaching staff, assign subjects, and track performance.
                    </p>
                </div>
                <button onClick={() => { setTeacherForm({ first_name: '', last_name: '', email: '', phone: '', subjects: [] }); setShowAddModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: COLORS.primaryGradient, border: 'none', borderRadius: 18, padding: '16px 32px', fontSize: 14, fontWeight: 1000, color: '#FFF', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', transition: '0.2s' }}>
                    <UserPlus size={20} color="#FFF" /> Add New Teacher
                </button>
            </div>
            {/* SEARCH FRAME */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: '24px 32px', display: 'flex', gap: 20, alignItems: 'center', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Parse registry by identity or signal identifier..."
                        style={{ width: '100%', padding: '18px 20px 18px 56px', border: '2px solid #F1F5F9', borderRadius: 18, outline: 'none', fontSize: 15, color: '#0F172A', fontWeight: 600, background: '#F8FAFC', transition: '0.2s' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid #F1F5F9', paddingLeft: 24 }}>
                    <Filter size={18} color="#64748B" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ background: '#F8FAFC', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#475569', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">ALL STATUS</option>
                        <option value="active">AUTHORIZED</option>
                        <option value="pending">PENDING APPROVAL</option>
                    </select>
                    <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ background: '#F8FAFC', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#475569', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">ALL SUBJECTS</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>
            {/* RECORD LIST */}
            {loading && teachers.length === 0 ? (
                <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>SYNCHRONIZING WITH CENTRAL HIERARCHY...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* TABLE HEADERS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', padding: '0 32px 16px', fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <div>Faculty Node Profile</div>
                        <div>Academic Jurisdiction</div>
                        <div>Activity Overview</div>
                        <div style={{ textAlign: 'right' }}>Authorization Controls</div>
                    </div>
                    {filteredTeachers.map((t) => (
                        <div key={t.id} className="faculty-card" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid #F1F5F9', borderRadius: 24, padding: '24px 32px', alignItems: 'center', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}>
                            {/* PROFILE */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 20, background: t.is_active ? '#E0F2FE' : '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.is_active ? '#BAE6FD' : '#FEB2B2'}` }}>
                                        <UsersRound size={26} color={t.is_active ? COLORS.primary : COLORS.danger} />
                                    </div>
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, background: t.is_active ? COLORS.success : COLORS.warning, border: '3px solid #FFF', borderRadius: '50%' }} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 16, fontWeight: 1000, color: '#0F172A', marginBottom: 4 }}>{t.first_name} {t.last_name}</div>
                                    <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Globe size={14} /> {t.email}
                                    </div>
                                </div>
                            </div>
                            {/* SUBJECT LIST */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {t.metadata?.assigned_subjects?.length ? t.metadata.assigned_subjects.slice(0, 2).map(sid => (
                                    <div key={sid} style={{ padding: '6px 12px', background: `${COLORS.primary}08`, color: COLORS.primary, borderRadius: 10, fontSize: 11, fontWeight: 900, border: `1px solid ${COLORS.primary}20`, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <BookOpen size={12} /> {subjects.find(s => s.id === sid)?.name || 'UNKNOWN'}
                                    </div>
                                )) : <div style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>UNASSIGNED NODE</div>}
                                {t.metadata?.assigned_subjects && t.metadata.assigned_subjects.length > 2 && (
                                    <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.slate }}>+{t.metadata.assigned_subjects.length - 2}</div>
                                )}
                            </div>
                            {/* ACTIVITY */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Activity size={14} color={COLORS.success} />
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Synchronized</div>
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginLeft: 24 }}>Last Active: 12m ago</div>
                            </div>
                            {/* CONTROLS */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button onClick={() => openScopeModal(t)} style={{ padding: '12px 18px', borderRadius: 14, background: '#F8FAFC', border: '2px solid #F1F5F9', color: COLORS.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 1000, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}>
                                    <Shield size={16} /> Jurisdiction
                                </button>
                                <button onClick={() => handleToggleState(t.id, t.is_active)} style={{ padding: '12px 20px', borderRadius: 14, background: t.is_active ? '#FFF5F5' : `${COLORS.success}10`, color: t.is_active ? COLORS.danger : COLORS.success, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 1000, transition: '0.2s' }}>
                                    {t.is_active ? 'Revoke Access' : 'Authorize Node'}
                                </button>
                            </div>
                            {/* FLOATING STATUS TAG */}
                            {!t.is_active && (
                                <div style={{ position: 'absolute', top: 12, left: 12, background: COLORS.danger, color: '#FFF', padding: '4px 8px', borderRadius: 8, fontSize: 9, fontWeight: 1000, letterSpacing: '0.1em' }}>PRECISION APPROVAL REQUIRED</div>
                            )}
                        </div>
                    ))}
                    {filteredTeachers.length === 0 && (
                        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 28, padding: 80, textAlign: 'center' }}>
                            <div style={{ width: 100, height: 100, background: '#F8FAFC', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #F1F5F9' }}>
                                <UsersRound size={48} color="#CBD5E1" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>No Active Faculty Nodes</h3>
                            <p style={{ margin: '12px 0 0', fontSize: 15, color: '#64748B', fontWeight: 600 }}>No teachers found. Click below to add a new teacher.</p>
                        </div>
                    )}
                </div>
            )}
            {/* PROVISIONING MODAL */}
            {showAddModal && (
                <TeacherModal title="Add Teacher" onClose={() => setShowAddModal(false)} onSubmit={handleCreateTeacher} saving={saving} saveText="Add Teacher">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${COLORS.warning}08`, border: `1px solid ${COLORS.warning}20`, padding: 16, borderRadius: 20, marginBottom: 20 }}>
                            <ShieldAlert size={20} color={COLORS.warning} />
                            <p style={{ margin: 0, fontSize: 12, color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>
                                New accounts start in <strong>PENDING</strong> state. Provisioning requires administrative confirmation.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <TeacherInput label="First Name" icon={Star} value={teacherForm.first_name} onChange={(v: string) => setTeacherForm({ ...teacherForm, first_name: v })} placeholder="e.g. Marie" />
                            <TeacherInput label="Last Name" icon={Shield} value={teacherForm.last_name} onChange={(v: string) => setTeacherForm({ ...teacherForm, last_name: v })} placeholder="e.g. Curie" />
                        </div>
                        <TeacherInput label="Email Address" icon={Globe} type="email" value={teacherForm.email} onChange={(v: string) => setTeacherForm({ ...teacherForm, email: v })} placeholder="marie@physics.inst" />
                        <TeacherInput label="Phone Number" icon={Clock} type="tel" value={teacherForm.phone} onChange={(v: string) => setTeacherForm({ ...teacherForm, phone: v })} placeholder="+91 000 000 000" />
                        <div style={{ marginTop: 20, padding: 24, background: '#F8FAFC', borderRadius: 24, border: '2px dashed #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <Cpu size={18} color="#94A3B8" />
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Initial Jurisdiction</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {subjects.slice(0, 5).map(s => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => setTeacherForm((prev: any) => ({ ...prev, subjects: prev.subjects.includes(s.id) ? prev.subjects.filter((id: string) => id !== s.id) : [...prev.subjects, s.id] }))}
                                        style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: teacherForm.subjects.includes(s.id) ? COLORS.primaryGradient : '#FFF', color: teacherForm.subjects.includes(s.id) ? '#FFF' : '#64748B', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: '0.2s', boxShadow: teacherForm.subjects.includes(s.id) ? '0 5px 10px rgba(0,75,147,0.1)' : 'none' }}>
                                        {s.name.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </TeacherModal>
            )}
            {/* JURISDICTION CONSTRAINTS MODAL */}
            {showScopeModal && (
                <TeacherModal title="Manage Class Assignments" onClose={() => setShowScopeModal(null)} onSubmit={handleAssignScope} saving={saving} saveText="Confirm Assignments" maxWidth={720}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 1.2fr', gap: 32 }}>
                        {/* SUBJECT LIST */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 1000, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Syllabus Nodes</h4>
                                <SlidersHorizontal size={14} color="#94A3B8" />
                            </div>
                            <div className="custom-scrollbar" style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {subjects.map(s => {
                                    const active = assignForm.includes(s.id)
                                    return (
                                        <div key={s.id} onClick={() => setAssignForm(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} style={{ padding: '16px 20px', background: active ? `${COLORS.primary}08` : '#FFF', border: `2px solid ${active ? COLORS.primary : '#F1F5F9'}`, borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: '0.2s' }}>
                                            <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${active ? COLORS.primary : '#CBD5E1'}`, background: active ? COLORS.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {active && <CheckCheck size={12} color="#FFF" />}
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: active ? 1000 : 700, color: active ? '#0F172A' : '#64748B' }}>{s.name}</span>
                                        </div>
                                    )
                                })}
                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="New Node ID..." style={{ flex: 1, padding: '14px 18px', borderRadius: 16, border: '2px solid #F1F5F9', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                                    <button onClick={handleAddSubject} style={{ width: 50, height: 50, borderRadius: 16, background: COLORS.primaryGradient, color: '#FFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button>
                                </div>
                            </div>
                        </div>
                        {/* GRADE & SECTOR ENFORCEMENT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <div>
                                <h4 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 1000, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade Deployment</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {[...Array(12)].map((_, i) => {
                                        const c = `Std ${i + 1}`
                                        const active = assignClasses.includes(c)
                                        return (
                                            <button key={c} onClick={() => setAssignClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} style={{ padding: '12px 10px', borderRadius: 14, background: active ? `${COLORS.primary}08` : '#FFF', border: `2px solid ${active ? COLORS.primary : '#F8FAFC'}`, color: active ? COLORS.primary : '#94A3B8', fontSize: 11, fontWeight: 1000, cursor: 'pointer', transition: '0.2s' }}>
                                                {c}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 1000, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Division Sectors</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {['A', 'B', 'C', 'D', 'E'].map(d => {
                                        const val = `Division ${d}`
                                        const active = assignDivisions.includes(val)
                                        return (
                                            <button key={d} onClick={() => setAssignDivisions(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])} style={{ padding: '14px 20px', borderRadius: 16, border: `2px solid ${active ? COLORS.primary : '#F1F5F9'}`, background: active ? COLORS.primary : 'transparent', color: active ? '#FFF' : '#64748B', fontSize: 12, fontWeight: 1000, cursor: 'pointer', transition: '0.2s' }}>
                                                SEC {d}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </TeacherModal>
            )}
        </div>
    )
}
function Plus({ size, color }: any) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> }
