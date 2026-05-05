'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Video, Calendar, Clock, PlusCircle, Server, CheckCircle, XCircle, UsersRound,
    DownloadCloud, Link as LinkIcon, AlertCircle, PhoneCall, Loader2
} from 'lucide-react'

// â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type LiveClass = { id: string, title: string, scheduled_at: string, duration_minutes: number, status: string, join_url: string, auto_record: boolean, teacher?: { first_name: string, last_name: string } }

// â”€â”€ MODALS & COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Deploy', maxWidth = 560 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 24, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}><Video size={22} color="var(--color-primary)" /> {title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', transition: 'background 0.2s' }}><XCircle size={18} color="#64748B" /></button>
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

function Toggle({ label, checked, onChange, desc }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: '1px solid ' + (checked ? 'var(--color-primary)' : '#E2E8F0') + '50', borderRadius: 16, background: checked ? 'var(--color-primary-bg)' : '#FFF', marginBottom: 16, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => onChange(!checked)}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: checked ? 'var(--color-primary)' : '#0F172A' }}>{label}</div>
                {desc && <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>}
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? 'var(--color-primary)' : '#CBD5E1', position: 'relative', transition: 'background 0.3s ease' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFF', position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: checked ? 'var(--shadow-primary)' : '0 2px 4px rgba(0,0,0,0.1)' }} />
            </div>
        </div>
    )
}

// â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LiveClassesDashboard() {
    const [classes, setClasses] = useState<LiveClass[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Modals
    const [showScheduleModal, setShowScheduleModal] = useState(false)

    // Form State
    const [form, setForm] = useState<any>({
        title: '', teacher_id: '', date: '', duration: 60, auto_record: true
    })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    const fetchClasses = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/live')
            const json = await res.json()
            if (res.ok) {
                setClasses(json.classes || [])
                setTeachers(json.teachers || [])
            }
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchClasses() }, [fetchClasses])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/live', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'API Execution Fault')
            await fetchClasses()
            showToast('Session Authorized Successfully', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Transmission Exception', false)
            return { success: false }
        } finally { setSaving(false) }
    }

    const handleSchedule = async () => {
        if (!form.title || !form.date) return showToast('Please enter session title and schedule timestamp.', false)
        const { success } = await apiAction('SCHEDULE_CLASS', form)
        if (success) setShowScheduleModal(false)
    }

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
                        Institutional Live: Interactive Synapse Sessions <div style={{ background: '#EF4444', border: '4px solid #FEE2E2', width: 14, height: 14, borderRadius: '50%' }} />
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 0', fontWeight: 600 }}>
                        Manage real-time learning streams, manage digital classrooms, and automate session archives.
                    </p>
                </div>
                <div>
                    <button onClick={() => setShowScheduleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary-gradient)', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: '#FFF', cursor: 'pointer', boxShadow: 'var(--shadow-primary)' }}>
                        <PlusCircle size={16} color="#FFF" /> START SESSION
                    </button>
                </div>
            </div>

            {/* TOP STATUS KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <div style={{ background: '#FFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={20} /></div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Streams</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A' }}>{classes.filter(c => c.status === 'live').length}</div>
                </div>
                <div style={{ background: '#FFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, background: '#F5F3FF', color: '#1FAC63', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Server size={20} /></div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Session Recordings</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A' }}>{classes.filter(c => c.auto_record).length} Sessions</div>
                </div>
            </div>

            {/* LIVE CLASS GRID */}
            {loading && classes.length === 0 ? (
                <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                    {classes.map((cls) => (
                        <div key={cls.id} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>

                            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                                <div style={{ width: 64, height: 64, background: cls.status === 'live' ? '#FEF2F2' : '#F1F5F9', border: '1px solid ' + (cls.status === 'live' ? '#FECACA' : '#E2E8F0'), borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PhoneCall size={28} color={cls.status === 'live' ? '#EF4444' : '#64748B'} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{cls.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                            <Calendar size={14} /> {new Date(cls.scheduled_at).toLocaleDateString()}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                            <Clock size={14} /> {cls.duration_minutes} Mins Block
                                        </span>
                                        {cls.teacher && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 700, background: '#F1F5F9', padding: '4px 8px', borderRadius: 6 }}>
                                                Faculty: {cls.teacher.first_name} {cls.teacher.last_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                                {cls.status === 'completed' && cls.auto_record ? (
                                    <button style={{ background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <DownloadCloud size={16} /> DOWNLOAD RECORDING
                                    </button>
                                ) : cls.status === 'live' ? (
                                    <a href={cls.join_url} target="_blank" rel="noreferrer" style={{ background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', boxShadow: 'var(--shadow-primary)' }}>
                                        JOIN SESSION
                                    </a>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E2E8F0' }}>
                                            <LinkIcon size={14} /> Link Generated
                                        </div>
                                        <button style={{ background: '#0F172A', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                                            LAUNCH SESSION
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div style={{ padding: 60, textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 24 }}>
                            <div style={{ width: 64, height: 64, background: '#F1F5F9', borderRadius: '50%', color: '#94A3B8', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle size={32} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No live sessions found.</h4>
                            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748B', fontWeight: 500 }}>Schedule Zoom sessions and configure server tracking to populate graph.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ZOOM SCHEDULER MODAL */}
            {showScheduleModal && (
                <Modal title="Schedule Live Session" onClose={() => setShowScheduleModal(false)} onSubmit={handleSchedule} saving={saving} saveText="AUTHORIZE SESSION" maxWidth={600}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        <Input label="Session Title" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} placeholder="e.g. Physics Thermodynamics Class 6" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ marginBottom: 4 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Schedule Launch Timestamp</label>
                                <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', outline: 'none' }} />
                            </div>
                            <Input label="Session Duration (Minutes)" type="number" value={form.duration} onChange={(v: string) => setForm({ ...form, duration: Number(v) })} />
                        </div>

                        <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Override Faculty Node</label>
                            <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', outline: 'none', background: '#fff' }}>
                                <option value="">Self (Admin Authority)</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <Toggle label="Automated Server Recording" desc="Initiates explicit rendering algorithms compiling the MP4 recording post-class directly into your institutional database." checked={form.auto_record} onChange={(v: boolean) => setForm({ ...form, auto_record: v })} />
                        </div>

                        <p style={{ margin: '0', fontSize: 11, color: '#64748B', fontWeight: 600, padding: '12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            * Once authorized, session triggers fire generating automated API sequences. Zoom sessions deploy dynamically parsing the join URLs securely to students enrolled in this course session.
                        </p>
                    </div>
                </Modal>
            )}

        </div>
    )
}
