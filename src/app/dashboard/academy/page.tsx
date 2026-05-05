'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
    School, BookOpen, Users, Plus, Layers, ChevronRight, 
    MoreVertical, Trash2, Edit3, CheckCircle2, Loader2, 
    Search, Filter, GraduationCap, LayoutPanelLeft, 
    Link as LinkIcon, UserPlus, MapPin
} from 'lucide-react'

const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    border: '#E2E8F0',
    background: '#F8FAFC'
}

export default function AcademySetupPage() {
    const [activeTab, setActiveTab] = useState('classes') 
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [mappings, setMappings] = useState<any[]>([])
    const [classSubMappings, setClassSubMappings] = useState<any[]>([])
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Modals
    const [showClassModal, setShowClassModal] = useState(false)
    const [showDivisionModal, setShowDivisionModal] = useState<{classId: string, className: string} | null>(null)
    const [showSubjectModal, setShowSubjectModal] = useState(false)
    const [showMappingModal, setShowMappingModal] = useState(false)
    const [showClassSubModal, setShowClassSubModal] = useState<{classId: string, className: string} | null>(null)

    // Forms
    const [classForm, setClassForm] = useState({ name: '', code: '' })
    const [divisionForm, setDivisionForm] = useState({ name: '', capacity: 40 })
    const [subjectForm, setSubjectForm] = useState({ name: '' })
    const [mappingForm, setMappingForm] = useState({ teacher_id: '', class_id: '', division_id: '', subject_id: '' })
    const [classSubForm, setClassSubForm] = useState<string[]>([])

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [clsRes, facRes, mapRes, clsSubRes] = await Promise.all([
                fetch('/api/dashboard/tenant/classes'),
                fetch('/api/dashboard/teachers'), 
                fetch('/api/dashboard/tenant/structure/mapping?type=teacher-subject'),
                fetch('/api/dashboard/tenant/structure/mapping?type=class-subject')
            ])

            const clsData = await clsRes.json()
            const facData = await facRes.json() 
            const mapData = await mapRes.json()
            const clsSubData = await clsSubRes.json()

            setClasses(clsData.classes || [])
            setSubjects(facData.subjects || [])
            setTeachers(facData.teachers || [])
            setMappings(mapData.mapping || [])
            setClassSubMappings(clsSubData.mapping || [])
        } catch (e) {
            console.error('Fetch failed', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreateClass = async () => {
        if (!classForm.name) return
        try {
            const res = await fetch('/api/dashboard/tenant/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classForm)
            })
            if (res.ok) {
                showToast('Class Created successfully', true)
                setShowClassModal(false)
                fetchData()
            }
        } catch (e) { showToast('Failed to create class', false) }
    }

    const handleCreateDivision = async () => {
        if (!divisionForm.name || !showDivisionModal) return
        try {
            const res = await fetch('/api/dashboard/tenant/divisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...divisionForm, class_id: showDivisionModal.classId })
            })
            if (res.ok) {
                showToast('Section Added successfully', true)
                setShowDivisionModal(null)
                fetchData()
            }
        } catch (e) { showToast('Failed to add section', false) }
    }

    const handleCreateSubject = async () => {
        if (!subjectForm.name) return
        try {
            const res = await fetch('/api/dashboard/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_SUBJECT', payload: subjectForm })
            })
            if (res.ok) {
                showToast('Subject Created successfully', true)
                setShowSubjectModal(false)
                fetchData()
            }
        } catch (e) { showToast('Failed to create subject', false) }
    }

    const handleCreateMapping = async () => {
        if (!mappingForm.teacher_id || !mappingForm.class_id || !mappingForm.subject_id) return
        try {
            const res = await fetch('/api/dashboard/tenant/structure/mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'teacher-subject', data: mappingForm })
            })
            if (res.ok) {
                showToast('Teacher mapping saved', true)
                setShowMappingModal(false)
                setMappingForm({ teacher_id: '', class_id: '', division_id: '', subject_id: '' })
                fetchData()
            }
        } catch (e) { showToast('Failed to save mapping', false) }
    }

    const handleUpdateClassSubjects = async () => {
        if (!showClassSubModal) return
        try {
            const res = await fetch('/api/dashboard/tenant/structure/mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'class-subject', 
                    data: { class_id: showClassSubModal.classId, subject_ids: classSubForm } 
                })
            })
            if (res.ok) {
                showToast('Class subjects updated', true)
                setShowClassSubModal(null)
                fetchData()
            }
        } catch (e) { showToast('Failed to update subjects', false) }
    }

    return (
        <div style={{ padding: '40px 48px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
             {/* TOAST PANEL */}
             {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? COLORS.success : COLORS.danger) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 20000 }}>
                    {toast.ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <Trash2 size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 800, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            <header style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, color: '#FFF' }}>
                        <School size={24} />
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Academy Setup</h1>
                </div>
                <p style={{ color: COLORS.slate, fontSize: 16, fontWeight: 600, margin: 0 }}>Configure your institute's classes, sections, and subject-teacher mappings.</p>
            </header>

            {/* TAB NAV */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: '#FFF', padding: 8, borderRadius: 20, width: 'fit-content', border: '1px solid #E2E8F0' }}>
                {[
                    { id: 'classes', label: 'Classes & Sections', icon: Layers },
                    { id: 'subjects', label: 'Subjects Management', icon: BookOpen },
                    { id: 'mapping', label: 'Teacher Mapping', icon: GraduationCap }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 14, border: 'none', 
                            background: activeTab === tab.id ? COLORS.primaryGradient : 'transparent',
                            color: activeTab === tab.id ? '#FFF' : COLORS.slate,
                            fontSize: 14, fontWeight: 850, cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                 <div style={{ padding: 100, textAlign: 'center' }}>
                    <Loader2 size={48} color={COLORS.primary} className="animate-spin" style={{ margin: '0 auto 24px' }} />
                    <div style={{ fontWeight: 800, color: COLORS.slate }}>Loading Academy Structure...</div>
                 </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {activeTab === 'classes' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', margin: 0 }}>Institute Classes</h2>
                                <button onClick={() => setShowClassModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer' }}>
                                    <Plus size={18} /> New Class
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
                                {classes.map(cls => (
                                    <div key={cls.id} style={{ background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.primary, textTransform: 'uppercase', marginBottom: 4 }}>{cls.code || 'CLS-' + cls.name}</div>
                                                <h3 style={{ fontSize: 22, fontWeight: 950, color: '#0F172A', margin: 0 }}>{cls.name}</h3>
                                            </div>
                                            <button onClick={() => setShowDivisionModal({ classId: cls.id, className: cls.name })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#F1F5F9', border: 'none', color: '#475569', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                                                <Plus size={14} /> Add Section
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                                            {cls.divisions?.length > 0 ? cls.divisions.map((div: any) => (
                                                <div key={div.id} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                                                    Section {div.name} <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 6 }}>({div.capacity} Cap)</span>
                                                </div>
                                            )) : (
                                                <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No sections defined</div>
                                            )}
                                        </div>

                                        <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Subjects Taught</div>
                                                <button 
                                                    onClick={() => {
                                                        const currentSubs = classSubMappings.filter(m => m.class_id === cls.id).map(m => m.subject_id)
                                                        setClassSubForm(currentSubs)
                                                        setShowClassSubModal({ classId: cls.id, className: cls.name })
                                                    }}
                                                    style={{ border: 'none', background: 'transparent', color: COLORS.primary, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
                                                >
                                                    Manage Subjects
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {classSubMappings.filter(m => m.class_id === cls.id).length > 0 ? (
                                                    classSubMappings.filter(m => m.class_id === cls.id).map((m, mi) => (
                                                        <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: COLORS.primary + '08', borderRadius: 8, fontSize: 10, fontWeight: 800, color: COLORS.primary }}>
                                                            <BookOpen size={12} /> {m.subjects?.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>No subjects mapped yet</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                         <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', margin: 0 }}>Available Subjects</h2>
                                <button onClick={() => setShowSubjectModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer' }}>
                                    <Plus size={18} /> New Subject
                                </button>
                            </div>

                            <div style={{ background: '#FFF', borderRadius: 28, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                                        <tr>
                                            <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Subject Name</th>
                                            <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>System ID</th>
                                            <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Type</th>
                                            <th style={{ padding: '20px 32px', textAlign: 'right', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.map(sub => (
                                            <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '24px 32px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.primary + '08', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary }}>
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div style={{ fontWeight: 800, color: '#1E293B' }}>{sub.name}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '24px 32px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>{sub.id.substring(0, 8)}</td>
                                                <td style={{ padding: '24px 32px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: 8, background: sub.tenant_id ? '#FEF3C7' : '#DCFCE7', color: sub.tenant_id ? '#92400E' : '#166534', fontSize: 11, fontWeight: 900 }}>
                                                        {sub.tenant_id ? 'CUSTOM' : 'SYSTEM'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                                    <button style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}><Edit3 size={18} /></button>
                                                    <button style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.danger }}><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    )}

                    {activeTab === 'mapping' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', margin: 0 }}>Faculty Assignments</h2>
                                <button onClick={() => setShowMappingModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer' }}>
                                    <Plus size={18} /> Assign Teacher
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                                {mappings.map((map, i) => (
                                    <div key={i} style={{ background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', padding: 24, display: 'flex', gap: 16 }}>
                                         <div style={{ width: 56, height: 56, borderRadius: 16, background: COLORS.primaryGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                            <GraduationCap size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: '#1E293B' }}>{map.user_profiles?.first_name} {map.user_profiles?.last_name}</div>
                                            <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 600, marginBottom: 12 }}>{map.user_profiles?.email}</div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <div style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#475569' }}>
                                                    {map.subjects?.name}
                                                </div>
                                                <ChevronRight size={12} color="#CBD5E1" />
                                                <div style={{ padding: '4px 10px', background: COLORS.primary + '08', color: COLORS.primary, borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                    {map.classes?.name} - {map.divisions?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <button style={{ padding: 8, height: 'fit-content', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.danger }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODALS */}
            {showClassModal && (
                <Modal title="Create New Class" onClose={() => setShowClassModal(false)} onSave={handleCreateClass}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Academic Detail</div>
                        <input placeholder="Class Name (e.g. Class 10)" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} style={inputStyle} />
                        <input placeholder="Class Code (e.g. C10)" value={classForm.code} onChange={e => setClassForm({...classForm, code: e.target.value})} style={inputStyle} />
                    </div>
                </Modal>
            )}

            {showDivisionModal && (
                <Modal title={`Add Section to ${showDivisionModal.className}`} onClose={() => setShowDivisionModal(null)} onSave={handleCreateDivision}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Section Identity</div>
                        <input placeholder="Section Name (e.g. A)" value={divisionForm.name} onChange={e => setDivisionForm({...divisionForm, name: e.target.value})} style={inputStyle} />
                        <input type="number" placeholder="Capacity" value={divisionForm.capacity} onChange={e => setDivisionForm({...divisionForm, capacity: parseInt(e.target.value)})} style={inputStyle} />
                    </div>
                </Modal>
            )}

            {showSubjectModal && (
                <Modal title="Create New Subject" onClose={() => setShowSubjectModal(false)} onSave={handleCreateSubject}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Subject Detail</div>
                        <input placeholder="Subject Name (e.g. Mathematics)" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} style={inputStyle} />
                    </div>
                </Modal>
            )}

            {showClassSubModal && (
                <Modal title={`Map Subjects for ${showClassSubModal.className}`} onClose={() => setShowClassSubModal(null)} onSave={handleUpdateClassSubjects}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Select Subjects Taught in this Class</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 300, overflowY: 'auto', padding: 4 }}>
                            {subjects.map(s => {
                                const selected = classSubForm.includes(s.id)
                                return (
                                    <div 
                                        key={s.id} 
                                        onClick={() => {
                                            if (selected) setClassSubForm(classSubForm.filter(id => id !== s.id))
                                            else setClassSubForm([...classSubForm, s.id])
                                        }}
                                        style={{ 
                                            padding: '12px 16px', borderRadius: 12, border: '2px solid',
                                            borderColor: selected ? COLORS.primary : '#F1F5F9',
                                            background: selected ? COLORS.primary + '05' : '#F8FAFC',
                                            cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: 10
                                        }}
                                    >
                                        <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid', borderColor: selected ? COLORS.primary : '#CBD5E1', background: selected ? COLORS.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                            {selected && <div style={{ fontSize: 10 }}>✓</div>}
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 750, color: selected ? COLORS.primary : '#475569' }}>{s.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Modal>
            )}

            {showMappingModal && (
                <Modal title="Assign Teacher to Class/Section/Subject" onClose={() => setShowMappingModal(false)} onSave={handleCreateMapping}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label style={labelStyle}>Select Teacher</label>
                            <select style={inputStyle} value={mappingForm.teacher_id} onChange={e => setMappingForm({...mappingForm, teacher_id: e.target.value})}>
                                <option value="">CHOOSE TEACHER...</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Select Class</label>
                                <select 
                                    style={inputStyle} 
                                    value={mappingForm.class_id} 
                                    onChange={e => {
                                        setMappingForm({...mappingForm, class_id: e.target.value, subject_id: '', division_id: ''})
                                    }}
                                >
                                    <option value="">CLASS...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Select Section</label>
                                <select style={inputStyle} value={mappingForm.division_id} onChange={e => setMappingForm({...mappingForm, division_id: e.target.value})}>
                                    <option value="">SECTION...</option>
                                    {classes.find(c => c.id === mappingForm.class_id)?.divisions?.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Select Subject</label>
                            <select style={inputStyle} value={mappingForm.subject_id} onChange={e => setMappingForm({...mappingForm, subject_id: e.target.value})}>
                                <option value="">CHOOSE SUBJECT...</option>
                                {/* Filter subjects to only show those mapped to this class */}
                                {classSubMappings.filter(m => m.class_id === mappingForm.class_id).map(m => (
                                    <option key={m.subject_id} value={m.subject_id}>{m.subjects?.name}</option>
                                ))}
                                {mappingForm.class_id && classSubMappings.filter(m => m.class_id === mappingForm.class_id).length === 0 && (
                                    <option disabled>No subjects mapped to this class</option>
                                )}
                            </select>
                        </div>
                    </div>
                </Modal>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

function Modal({ title, onClose, onSave, children }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth: 500, boxShadow: '0 40px 80px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>✕</button>
                </div>
                <div style={{ padding: 32 }}>{children}</div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid #E2E8F0', background: 'transparent', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSave} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: COLORS.primaryGradient, color: '#FFF', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,75,147,0.15)' }}>Save Configuration</button>
                </div>
            </div>
        </div>
    )
}

const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 14,
    border: '2px solid #F1F5F9',
    background: '#F8FAFC',
    fontSize: 14,
    fontWeight: 700,
    outline: 'none',
    boxSizing: 'border-box' as const
}

const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 900,
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
}
