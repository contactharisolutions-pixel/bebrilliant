'use client'

import React, { useState, useEffect } from 'react'
import { 
    Layers, BookOpen, UserCheck, Plus, 
    Save, Trash2, ArrowRight, Settings2,
    Calendar, CheckCircle2, AlertCircle, ChevronRight,
    Search, Filter, LayoutGrid, Users, RefreshCcw
} from 'lucide-react'

export default function AcademicStructureHub() {
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'standards' | 'subjects' | 'mapping'>('standards')
    
    // Data States
    const [years, setYears] = useState([])
    const [classes, setClasses] = useState([])
    const [subjects, setSubjects] = useState([])
    const [teachers, setTeachers] = useState([])
    const [classSubMapping, setClassSubMapping] = useState([])
    const [teacherSubMapping, setTeacherSubMapping] = useState([])
    
    // UI States
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedStandard, setSelectedStandard] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        initPortal()
    }, [])

    const initPortal = async () => {
        try {
            const [yRes, cRes, sRes, tRes, m1Res, m2Res] = await Promise.all([
                fetch('/api/dashboard/tenant/academic-year'),
                fetch('/api/dashboard/tenant/classes'),
                fetch('/api/dashboard/tenant/subjects'),
                fetch('/api/dashboard/teachers'),
                fetch('/api/dashboard/tenant/structure/mapping?type=class-subject'),
                fetch('/api/dashboard/tenant/structure/mapping?type=teacher-subject')
            ])

            const yData = await yRes.json()
            const cData = await cRes.json()
            const sData = await sRes.json()
            const tData = await tRes.json()
            const m1Data = await m1Res.json()
            const m2Data = await m2Res.json()

            setYears(yData.years || [])
            setClasses(cData.classes || [])
            setSubjects(sData.subjects || [])
            setTeachers(tData.users || [])
            setClassSubMapping(m1Data.mapping || [])
            setTeacherSubMapping(m2Data.mapping || [])

            if (yData.years?.length > 0) setSelectedYear(yData.years.find((y: any) => y.is_active)?.id || yData.years[0].id)
        } catch (err) {
            console.error('Portal Init Failed', err)
        } finally {
            setLoading(false)
        }
    }

    // --- Action Handlers ---
    const handleAddClass = async (name: string) => {
        if (!selectedYear) return alert('Select academic year first')
        const res = await fetch('/api/dashboard/tenant/classes', {
            method: 'POST',
            body: JSON.stringify({ name, academic_year_id: selectedYear })
        })
        if (res.ok) initPortal()
    }

    const handleAddDivision = async (classId: string, name: string) => {
        const res = await fetch('/api/dashboard/tenant/divisions', {
            method: 'POST',
            body: JSON.stringify({ class_id: classId, name })
        })
        if (res.ok) initPortal()
    }

    const handleAddSubject = async (name: string) => {
        const res = await fetch('/api/dashboard/tenant/subjects', {
            method: 'POST',
            body: JSON.stringify({ name })
        })
        if (res.ok) initPortal()
    }

    const handleMapSubject = async (classId: string, subjectIds: string[]) => {
        setSaving(true)
        const res = await fetch('/api/dashboard/tenant/structure/mapping', {
            method: 'POST',
            body: JSON.stringify({ type: 'class-subject', data: { class_id: classId, subject_ids: subjectIds } })
        })
        if (res.ok) initPortal()
        setSaving(false)
    }

    const handleMapTeacher = async (teacherId: string, classId: string, divId: string, subId: string) => {
        setSaving(true)
        const res = await fetch('/api/dashboard/tenant/structure/mapping', {
            method: 'POST',
            body: JSON.stringify({ type: 'teacher-subject', data: { teacher_id: teacherId, class_id: classId, division_id: divId, subject_id: subId } })
        })
        if (res.ok) initPortal()
        setSaving(false)
    }

    if (loading) return (
        <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontWeight: 800, color: '#64748B' }}>Loading academic structure...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
                 <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>Academic Structure</h1>
                    <p style={{ color: '#64748B', fontWeight: 600, marginTop: 8 }}>Manage your institute's academic standards, subjects, and faculty assignments.</p>
                </div>
                
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ background: '#FFF', padding: '10px 16px', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Calendar size={18} color="var(--color-primary)" />
                        <select 
                            value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 800, color: '#0F172A' }}
                        >
                            {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ background: '#FFF', borderRadius: 28, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                    {(['standards', 'subjects', 'mapping'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{ 
                                padding: '20px 32px', border: 'none', borderBottom: activeTab === tab ? '3px solid var(--color-primary)' : '3px solid transparent',
                                background: activeTab === tab ? '#FFF' : 'transparent',
                                color: activeTab === tab ? 'var(--color-primary)' : '#64748B',
                                fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            {tab === 'standards' && <Layers size={18} />}
                            {tab === 'subjects' && <BookOpen size={18} />}
                            {tab === 'mapping' && <UserCheck size={18} />}
                             {tab === 'standards' ? 'Standards & Divisions' : tab === 'subjects' ? 'Subjects' : 'Faculty Mapping'}
                        </button>
                    ))}
                </div>

                <div style={{ padding: 40 }}>
                    
                    {/* --- STANDARDS & DIVISIONS --- */}
                    {activeTab === 'standards' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                            {classes.filter((c: any) => c.academic_year_id === selectedYear).map((cls: any) => (
                                <div key={cls.id} style={{ background: '#F8FAFC', borderRadius: 24, border: '1px solid #F1F5F9', padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>{cls.name}</h4>
                                        <Settings2 size={16} color="#94A3B8" />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                        {cls.divisions?.map((div: any) => (
                                            <div key={div.id} style={{ background: '#FFF', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#672AEA', border: '1px solid #E2E8F0' }}>
                                                 Div {div.name}
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const name = prompt('Enter Division Name (e.g. A, B, C)')
                                                if (name) handleAddDivision(cls.id, name)
                                            }}
                                            style={{ background: '#FFF', border: '1px dashed #CBD5E1', color: '#94A3B8', padding: '6px 10px', borderRadius: 10, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            + ADD DIV
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => {
                                    const name = prompt('Enter Standard Name (e.g. Std 10)')
                                    if (name) handleAddClass(name)
                                }}
                                style={{ background: 'transparent', border: '2px dashed #E2E8F0', borderRadius: 24, fontSize: 14, fontWeight: 800, color: '#94A3B8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 180 }}
                            >
                                 <Plus size={32} /> Add Standard
                            </button>
                        </div>
                    )}

                    {/* --- SUBJECTS MASTER --- */}
                    {activeTab === 'subjects' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                 <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>Subject Directory</h3>
                                <button 
                                    onClick={() => {
                                        const name = prompt('Enter Subject Name')
                                        if (name) handleAddSubject(name)
                                    }}
                                    style={{ background: 'var(--color-primary-gradient)', color: '#FFF', padding: '12px 24px', borderRadius: 14, border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-primary)' }}
                                >
                                     <Plus size={18} /> Add Subject
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                                {subjects.map((sub: any) => (
                                    <div key={sub.id} style={{ padding: 20, background: '#F8FAFC', borderRadius: 18, border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                        <BookOpen size={24} color="#672AEA" style={{ marginBottom: 12 }} />
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{sub.name}</div>
                                         <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>Standard</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TEACHER & SUBJECT MAPPING --- */}
                    {activeTab === 'mapping' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
                            {/* Live Assignments Feed */}
                            <div>
                                 <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 24 }}>Current Assignments</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {teacherSubMapping.map((m: any) => (
                                        <div key={m.id} style={{ padding: 20, background: '#FFF', borderRadius: 20, border: '1px solid #F1F5F9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 44, height: 44, background: '#EEF2FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={20} color="#4F46E5" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{m.user_profiles?.first_name} {m.user_profiles?.last_name}</div>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{m.subjects?.name} • {m.classes?.name} — {m.divisions?.name}</div>
                                                </div>
                                            </div>
                                            <button style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: 8, cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* New Assignment Form */}
                            <div style={{ background: '#F8FAFC', padding: 32, borderRadius: 28, border: '1px solid #E2E8F0', height: 'fit-content' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                     <UserCheck size={20} color="var(--color-primary)" /> Faculty Assignment
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>Select Faculty Member</label>
                                        <select id="teacher_id" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700 }}>
                                            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>Target Standard & Division</label>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <select 
                                                id="class_id" 
                                                onChange={e => {
                                                    const cls = classes.find((c: any) => c.id === e.target.value)
                                                    setSelectedStandard(cls)
                                                }}
                                                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700 }}
                                            >
                                                <option value="">Select Standard</option>
                                                {classes.filter((c: any) => c.academic_year_id === selectedYear).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <select id="division_id" style={{ flex: 0.6, padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700 }}>
                                                <option value="">Division</option>
                                                {selectedStandard?.divisions?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>Assign Subject</label>
                                        <select id="sub_id" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700 }}>
                                            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            const tid = (document.getElementById('teacher_id') as HTMLSelectElement).value
                                            const cid = (document.getElementById('class_id') as HTMLSelectElement).value
                                            const did = (document.getElementById('division_id') as HTMLSelectElement).value
                                            const sid = (document.getElementById('sub_id') as HTMLSelectElement).value
                                            if (tid && cid && did && sid) handleMapTeacher(tid, cid, did, sid)
                                            else alert('Please fill all fields')
                                        }}
                                        disabled={saving}
                                        style={{ width: '100%', marginTop: 12, background: 'var(--color-primary-gradient)', color: '#FFF', padding: '14px', borderRadius: 14, border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-primary)' }}
                                    >
                                         {saving ? <RefreshCcw size={18} style={{ animation: 'spin 1.5s linear infinite' }} /> : <><Plus size={18} /> Assign Faculty</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
