'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Users, Search, PlusCircle, UploadCloud, UserCheck, UserX,
    MoreVertical, Activity, Lock, CheckCircle, XCircle, Loader2, 
    Download, Filter, Layout, ArrowRight, ShieldCheck, Database,
    FileSpreadsheet, SlidersHorizontal, RefreshCcw, UserPlus,
    BarChart3, Calendar, ChevronDown, Trash2, Info, ArrowUpNarrowWide,
    CheckCircle2, Sparkles, Binary, Cpu, Fingerprint, Layers,
    Maximize2, MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.7)'
}

// ── TYPES ────────────────────────────────────────────────
type Student = { 
    id: string; first_name: string; last_name: string; email: string; 
    phone: string; is_active: boolean; created_at: string; role: string; 
    metadata?: { school_class?: string; division?: string; marks_percentage?: number; } 
}

// ── UI COMPONENTS ──────────────────────────────────
function AppToast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 32, right: 32, background: ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${ok ? COLORS.success : COLORS.danger}40`, borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 30000, animation: 'float 0.3s ease-out' }}>
            {ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
            <span style={{ fontSize: 14, fontWeight: 900, color: ok ? '#065F46' : '#991B1B' }}>{msg}</span>
        </div>
    )
}

function AppModal({ title, onClose, children, onSubmit, saving, saveText = 'Save', maxWidth = 640 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'float 0.3s ease-out', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} color="#64748B" /></button>
                </div>
                <div style={{ padding: 40, overflowY: 'auto' }}>{children}</div>
                {onSubmit && (
                    <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
                        <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={onSubmit} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: COLORS.primaryGradient, border: 'none', color: '#fff', fontSize: 14, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                            {saving && <Loader2 size={16} className="spin" />} {saveText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── MAIN APPLICATION ─────────────────────────────
export default function StudentDirectoryPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [showFilters, setShowFilters] = useState(true)
    const [activeRow, setActiveRow] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)

    // Filter Logic
    const [filters, setFilters] = useState({ standard: '', division: '', status: 'all' })
    const [studentForm, setStudentForm] = useState<any>({ first_name: '', last_name: '', email: '', phone: '', school_class: '', division: '' })

    const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

    const fetchStudents = useCallback(async () => {
        setLoading(true)
        try {
            const url = new URL('/api/dashboard/students', window.location.origin)
            if (search) url.searchParams.set('search', search)
            if (filters.standard) url.searchParams.set('school_class', filters.standard)
            if (filters.division) url.searchParams.set('division', filters.division)
            if (filters.status !== 'all') url.searchParams.set('status', filters.status)
            
            const res = await fetch(url.toString())
            const json = await res.json()
            if (res.ok) setStudents(json || [])
        } finally { setLoading(false) }
    }, [search, filters])

    useEffect(() => { fetchStudents() }, [fetchStudents])

    const handleCreateStudent = async () => {
        if (!studentForm.email) return showToast('Email Address Required', false)
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/students', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_STUDENT', payload: studentForm })
            })
            if (res.ok) {
                showToast('Student Profile Created', true)
                setShowAddModal(false)
                fetchStudents()
            }
        } finally { setSaving(false) }
    }

    const handleToggleStatus = async (id: string, current: boolean) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/students', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOGGLE_STATUS', payload: { id, is_active: !current } })
            })
            if (res.ok) {
                showToast('Student Status Updated', true)
                fetchStudents()
            }
        } finally { setSaving(false) }
    }

    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes float { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .student-row:hover { background: #F8FAFC !important; transform: scale(1.002); }
                .action-btn:hover { background: #F1F5F9; color: ${COLORS.primary}; }
                .status-pulse { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
            `}</style>

            {toast && <AppToast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* STUDENT MANAGEMENT HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Users size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Student Directory</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        Manage student admissions, profiles, and attendance. View report cards and track academic progress across all classes and sections.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => setShowBulkModal(true)} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UploadCloud size={16} /> Bulk Upload
                    </button>
                    <button onClick={() => setShowAddModal(true)} style={{ padding: '14px 28px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserPlus size={20} /> Add Student
                    </button>
                </div>
            </div>

            {/* STUDENT STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                {[
                    { label: 'Total Students', val: students.length, icon: Users, color: COLORS.primary },
                    { label: 'Average Marks', val: '84.2%', icon: BarChart3, color: COLORS.success },
                    { label: 'Active Status', val: students.filter(s => s.is_active).length, icon: ShieldCheck, color: COLORS.warning },
                    { label: 'Top Class', val: 'Class 10', icon: Layers, color: "#8B5CF6" }
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#FFF', padding: 28, borderRadius: 28, border: '1px solid #F1F5F9', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ padding: 10, background: `${stat.color}10`, borderRadius: 12 }}>
                                <stat.icon size={20} color={stat.color} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{stat.val}</div>
                    </div>
                ))}
            </div>

            {/* FILTER SECTION */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 36, padding: 32, marginBottom: 40, boxShadow: '0 40px 80px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                        <div style={{ background: '#F8FAFC', padding: '12px 20px', borderRadius: 18, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 500 }}>
                            <Search size={20} color="#94A3B8" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or Roll No..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '12px 24px', borderRadius: 16, border: `1px solid ${showFilters ? COLORS.primary : '#F1F5F9'}`, background: showFilters ? `${COLORS.primary}08` : '#FFF', color: showFilters ? COLORS.primary : COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <SlidersHorizontal size={18} /> Quick Filters
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, animation: 'float 0.3s ease-out' }}>
                        {[
                            { label: 'Select Class', key: 'standard', opts: ['Std 1', 'Std 2', 'Std 5', 'Std 10', 'Std 12'] },
                            { label: 'Select Section', key: 'division', opts: ['A', 'B', 'C', 'D'] },
                            { label: 'Student Status', key: 'status', opts: ['active', 'blocked'] }
                        ].map((f, i) => (
                            <div key={i}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 1000, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>{f.label}</label>
                                <select value={(filters as any)[f.key]} onChange={e => setFilters({...filters, [f.key]: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 13, fontWeight: 700 }}>
                                    <option value="">All Students</option>
                                    {f.opts.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                                </select>
                            </div>
                        ))}
                         <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button onClick={fetchStudents} style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#111827', color: '#FFF', border: 'none', fontSize: 13, fontWeight: 1000, cursor: 'pointer' }}>Apply Filters</button>
                        </div>
                    </div>
                )}
            </div>

            {/* STUDENT LIST */}
            <div style={{ background: '#FFF', borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        <tr style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <th style={{ padding: '24px 40px' }}>Student Name</th>
                            <th style={{ padding: '24px 40px' }}>Class & Section</th>
                            <th style={{ padding: '24px 40px' }}>Status</th>
                            <th style={{ padding: '24px 40px' }}>Average Marks</th>
                            <th style={{ padding: '24px 40px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: 120, textAlign: 'center' }}>
                                    <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                                    <div style={{ fontSize: 12, fontWeight: 1000, color: '#94A3B8' }}>LOADING STUDENT DATA...</div>
                                </td>
                            </tr>
                        ) : students.map((s) => (
                            <tr key={s.id} className="student-row" style={{ borderBottom: '1px solid #F1F5F9', transition: '0.2s' }}>
                                <td style={{ padding: '24px 40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ width: 48, height: 48, background: s.is_active ? `${COLORS.primary}08` : '#FEE2E2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 1000, color: s.is_active ? COLORS.primary : COLORS.danger, border: `1px solid ${s.is_active ? COLORS.primary + '20' : '#FECACA'}` }}>
                                            {s.first_name[0]}{s.last_name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 1000, color: '#1E293B' }}>{s.first_name} {s.last_name}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>ID: {s.id.substring(0,8).toUpperCase()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                     <div style={{ fontSize: 14, fontWeight: 1000, color: '#475569' }}>{s.metadata?.school_class || 'Class 10'}</div>
                                     <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.slate, marginTop: 4 }}>Section: {s.metadata?.division || 'A'}</div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: s.is_active ? `${COLORS.success}10` : '#FEF2F2', border: `1px solid ${s.is_active ? COLORS.success : COLORS.danger}30`, width: 'fit-content' }}>
                                        <div className="status-pulse" style={{ background: s.is_active ? COLORS.success : COLORS.danger }} />
                                        <span style={{ fontSize: 11, fontWeight: 1000, color: s.is_active ? COLORS.success : COLORS.danger }}>{s.is_active ? 'ACTIVE' : 'BLOCKED'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 10, maxWidth: 100, overflow: 'hidden' }}>
                                            <div style={{ width: `${s.metadata?.marks_percentage || 72}%`, height: '100%', background: COLORS.primaryGradient, borderRadius: 10 }} />
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 1000, color: '#1E293B' }}>{s.metadata?.marks_percentage || 72}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                        <Link href={`/dashboard/faculty/analytics/results-360?student_id=${s.id}`} style={{ padding: 10, border: '1px solid #F1F5F9', borderRadius: 12, color: COLORS.primary }} className="action-btn" title="View Report Card"><Activity size={18} /></Link>
                                        <button onClick={() => handleToggleStatus(s.id, s.is_active)} style={{ padding: 10, border: '1px solid #F1F5F9', borderRadius: 12, color: COLORS.slate }} className="action-btn" title="Manage Access"><Lock size={18} /></button>
                                        <button style={{ padding: 10, border: '1px solid #F1F5F9', borderRadius: 12, color: COLORS.danger }} className="action-btn" title="Delete Student"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}
            {showAddModal && (
                <AppModal title="Add New Student" onClose={() => setShowAddModal(false)} onSubmit={handleCreateStudent} saving={saving}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 1000, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>First Name</label>
                                <input value={studentForm.first_name} onChange={e => setStudentForm({...studentForm, first_name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 1000, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>Last Name</label>
                                <input value={studentForm.last_name} onChange={e => setStudentForm({...studentForm, last_name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700 }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 1000, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>Email Address</label>
                            <input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700 }} />
                        </div>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 1000, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>Select Class</label>
                                <select value={studentForm.school_class} onChange={e => setStudentForm({...studentForm, school_class: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 13, fontWeight: 700 }}>
                                    {[...Array(12)].map((_, i) => <option key={i} value={`Std ${i+1}`}>Class {i+1}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 1000, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>Section</label>
                                <select value={studentForm.division} onChange={e => setStudentForm({...studentForm, division: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 13, fontWeight: 700 }}>
                                    {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </AppModal>
            )}

            {showBulkModal && (
                <AppModal title="Bulk Student Upload" onClose={() => setShowBulkModal(false)} onSubmit={() => setShowBulkModal(false)} maxWidth={750}>
                    <div style={{ background: '#0F172A', borderRadius: 24, padding: 32, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 20, right: 20, background: `${COLORS.success}20`, color: COLORS.success, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 1000 }}>READY TO PASTE</div>
                        <textarea placeholder="first_name, last_name, email, phone..." style={{ width: '100%', height: 300, background: 'transparent', border: 'none', outline: 'none', color: COLORS.success, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, resize: 'none' }} />
                    </div>
                </AppModal>
            )}
        </div>
    )
}
