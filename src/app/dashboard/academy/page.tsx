'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    School, BookOpen, Users, Plus, Layers, ChevronRight,
    MoreVertical, Trash2, Edit3, CheckCircle2, Loader2,
    Search, Filter, GraduationCap, LayoutPanelLeft,
    Check, X, AlertCircle, ArrowRight, ShieldCheck,
    Sparkles, RefreshCw, Settings, UserCheck, BookMarked,
    Grid, Hash, SlidersHorizontal, ArrowUpDown
} from 'lucide-react'
import { useIdentity } from '@/contexts/IdentityContext'

// ── TYPES ────────────────────────────────────────────────────────
type Division = {
    id: string
    class_id: string
    name: string
    capacity: number
    created_at?: string
}

type Subject = {
    id: string
    name: string
    code?: string
    is_optional?: boolean
    mapped_classes_count?: number
    is_system_fallback?: boolean
    created_at?: string
}

type ClassItem = {
    id: string
    name: string
    code?: string
    sort_order?: number
    is_active?: boolean
    divisions?: Division[]
    mapped_subjects?: Subject[]
    total_capacity?: number
    created_at?: string
}

type Teacher = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    role?: string
    metadata?: {
        designation?: string
    }
}

type TeacherMapping = {
    id: string
    teacher_id: string
    class_id: string
    division_id: string
    subject_id: string
    teacher?: {
        id: string
        first_name: string
        last_name: string
        email: string
        designation?: string
    }
    class?: { id: string; name: string; code?: string }
    division?: { id: string; name: string; capacity?: number }
    subject?: { id: string; name: string; code?: string; is_optional?: boolean }
    created_at?: string
}

type AcademyStats = {
    total_classes: number
    total_sections: number
    total_capacity: number
    total_subjects: number
    core_subjects: number
    elective_subjects: number
    total_mappings: number
    faculty_coverage_pct: number
}

// ── COLOR TOKENS (OpenAI Inspired) ──────────────────────────────
const PALETTE = {
    primary: '#004B93',
    primaryHover: '#003B73',
    primaryLight: '#EFF6FF',
    accent: '#2563EB',
    emerald: '#10B981',
    emeraldLight: '#ECFDF5',
    amber: '#F59E0B',
    amberLight: '#FFFBEB',
    slateDark: '#0F172A',
    slateMedium: '#334155',
    slateMuted: '#64748B',
    slateLight: '#F8FAFC',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    danger: '#EF4444',
    dangerLight: '#FEF2F2'
}

// ── TOAST NOTIFICATION ──────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: ok ? '#064E3B' : '#7F1D1D',
            color: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: 14,
            fontWeight: 600,
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {ok ? <CheckCircle2 size={18} color="#34D399" /> : <AlertCircle size={18} color="#F87171" />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 2, display: 'flex' }}>
                <X size={16} />
            </button>
        </div>
    )
}

// ── REUSABLE MODAL ──────────────────────────────────────────────
function Modal({
    title,
    subtitle,
    onClose,
    children,
    onSubmit,
    saving,
    submitText = 'Save Changes',
    maxWidth = 520
}: {
    title: string
    subtitle?: string
    onClose: () => void
    children: React.ReactNode
    onSubmit?: () => void
    saving?: boolean
    submitText?: string
    maxWidth?: number
}) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            padding: 20
        }}>
            <div style={{
                background: '#FFFFFF',
                borderRadius: 20,
                width: '100%',
                maxWidth,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '22px 28px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: '#FFFFFF'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</h2>
                        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 10,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748B',
                            flexShrink: 0
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>

                <div style={{
                    padding: '18px 28px',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                    background: '#F8FAFC'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            padding: '10px 18px',
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#475569',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    {onSubmit && (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={saving}
                            style={{
                                padding: '10px 22px',
                                borderRadius: 10,
                                background: PALETTE.primary,
                                border: '1px solid #003B73',
                                color: '#FFFFFF',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: saving ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 2px 4px rgba(0, 75, 147, 0.2)'
                            }}
                        >
                            {saving && <Loader2 size={15} className="animate-spin" />}
                            {submitText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── MAIN ACADEMY SETUP MODULE ───────────────────────────────────
export default function AcademySetupPage() {
    const { identity } = useIdentity()
    const tenantType = identity?.tenant?.tenant_type || 'institute'

    const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'mapping'>('classes')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Data State
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [mappings, setMappings] = useState<TeacherMapping[]>([])
    const [stats, setStats] = useState<AcademyStats>({
        total_classes: 0,
        total_sections: 0,
        total_capacity: 0,
        total_subjects: 0,
        core_subjects: 0,
        elective_subjects: 0,
        total_mappings: 0,
        faculty_coverage_pct: 0
    })

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [subjectTypeFilter, setSubjectTypeFilter] = useState<'all' | 'core' | 'elective'>('all')
    const [mappingTeacherFilter, setMappingTeacherFilter] = useState('all')
    const [mappingClassFilter, setMappingClassFilter] = useState('all')

    // Modals
    const [showClassModal, setShowClassModal] = useState(false)
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
    const [showDivisionModal, setShowDivisionModal] = useState<{ classId: string; className: string } | null>(null)
    const [editingDivision, setEditingDivision] = useState<{ id: string; name: string; capacity: number; className: string } | null>(null)
    const [showClassSubModal, setShowClassSubModal] = useState<{ classId: string; className: string } | null>(null)
    const [showSubjectModal, setShowSubjectModal] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [showMappingModal, setShowMappingModal] = useState(false)
    const [deletingItem, setDeletingItem] = useState<{ type: 'class' | 'division' | 'subject' | 'mapping'; id: string; name: string } | null>(null)

    // Form States
    const [classForm, setClassForm] = useState({ name: '', code: '', initial_sections: ['A'], default_capacity: 40 })
    const [editClassForm, setEditClassForm] = useState({ id: '', name: '', code: '', is_active: true })
    const [divisionForm, setDivisionForm] = useState({ name: '', capacity: 40 })
    const [classSubSelected, setClassSubSelected] = useState<string[]>([])
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', is_optional: false })
    const [editSubjectForm, setEditSubjectForm] = useState({ id: '', name: '', code: '', is_optional: false })
    const [mappingForm, setMappingForm] = useState({ teacher_id: '', class_id: '', division_id: '', subject_id: '' })

    // ── DATA FETCHING ────────────────────────────────────────────
    const fetchAcademyData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/tenant/academy')
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                setClasses(data.classes || [])
                setSubjects(data.subjects || [])
                setTeachers(data.teachers || [])
                setMappings(data.mappings || [])
                if (data.stats) setStats(data.stats)
            } else {
                setToast({ msg: data.error || `Failed to load academy configuration (${res.status})`, ok: false })
            }
        } catch (err: any) {
            setToast({ msg: err.message || 'Network error fetching academy data', ok: false })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAcademyData()
    }, [fetchAcademyData])

    // ── API ACTION DISPATCHER ────────────────────────────────────
    const executeApi = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/tenant/academy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || `Operation failed (${res.status})`)
            await fetchAcademyData()
            setToast({ msg: 'Changes saved successfully', ok: true })
            return { success: true, data }
        } catch (err: any) {
            setToast({ msg: err.message || 'Operation failed', ok: false })
            return { success: false }
        } finally {
            setSaving(false)
        }
    }

    // ── CLASS HANDLERS ───────────────────────────────────────────
    const handleCreateClass = async () => {
        if (!classForm.name.trim()) {
            setToast({ msg: 'Please provide a class name', ok: false })
            return
        }
        const res = await executeApi('CREATE_CLASS', classForm)
        if (res.success) {
            setShowClassModal(false)
            setClassForm({ name: '', code: '', initial_sections: ['A'], default_capacity: 40 })
        }
    }

    const handleUpdateClass = async () => {
        if (!editClassForm.name.trim()) return
        const res = await executeApi('UPDATE_CLASS', editClassForm)
        if (res.success) setEditingClass(null)
    }

    // ── SECTION HANDLERS ─────────────────────────────────────────
    const handleCreateDivision = async () => {
        if (!divisionForm.name.trim() || !showDivisionModal) return
        const res = await executeApi('CREATE_DIVISION', {
            class_id: showDivisionModal.classId,
            name: divisionForm.name.trim(),
            capacity: divisionForm.capacity
        })
        if (res.success) {
            setShowDivisionModal(null)
            setDivisionForm({ name: '', capacity: 40 })
        }
    }

    const handleUpdateDivision = async () => {
        if (!editingDivision || !editingDivision.name.trim()) return
        const res = await executeApi('UPDATE_DIVISION', {
            id: editingDivision.id,
            name: editingDivision.name.trim(),
            capacity: editingDivision.capacity
        })
        if (res.success) setEditingDivision(null)
    }

    // ── SUBJECT HANDLERS ─────────────────────────────────────────
    const handleCreateSubject = async () => {
        if (!subjectForm.name.trim()) {
            setToast({ msg: 'Please provide a subject name', ok: false })
            return
        }
        const res = await executeApi('CREATE_SUBJECT', subjectForm)
        if (res.success) {
            setShowSubjectModal(false)
            setSubjectForm({ name: '', code: '', is_optional: false })
        }
    }

    const handleUpdateSubject = async () => {
        if (!editSubjectForm.name.trim()) return
        const res = await executeApi('UPDATE_SUBJECT', editSubjectForm)
        if (res.success) setEditingSubject(null)
    }

    // ── CLASS-SUBJECT SYNC HANDLER ───────────────────────────────
    const handleSyncClassSubjects = async () => {
        if (!showClassSubModal) return
        const res = await executeApi('SYNC_CLASS_SUBJECTS', {
            class_id: showClassSubModal.classId,
            subject_ids: classSubSelected
        })
        if (res.success) setShowClassSubModal(null)
    }

    // ── TEACHER MAPPING HANDLERS ─────────────────────────────────
    const handleCreateMapping = async () => {
        if (!mappingForm.teacher_id || !mappingForm.class_id || !mappingForm.division_id || !mappingForm.subject_id) {
            setToast({ msg: 'Please complete all mapping selections', ok: false })
            return
        }
        const res = await executeApi('ASSIGN_TEACHER', mappingForm)
        if (res.success) {
            setShowMappingModal(false)
            setMappingForm({ teacher_id: '', class_id: '', division_id: '', subject_id: '' })
        }
    }

    // ── DELETE MODAL CONFIRMATION HANDLER ────────────────────────
    const handleConfirmDelete = async () => {
        if (!deletingItem) return
        let action = ''
        if (deletingItem.type === 'class') action = 'DELETE_CLASS'
        if (deletingItem.type === 'division') action = 'DELETE_DIVISION'
        if (deletingItem.type === 'subject') action = 'DELETE_SUBJECT'
        if (deletingItem.type === 'mapping') action = 'REVOKE_TEACHER_ASSIGNMENT'

        const res = await executeApi(action, { id: deletingItem.id })
        if (res.success) setDeletingItem(null)
    }

    // ── FILTERED DATA ────────────────────────────────────────────
    const filteredClasses = useMemo(() => {
        if (!searchQuery.trim()) return classes
        const q = searchQuery.toLowerCase()
        return classes.filter(c => c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)))
    }, [classes, searchQuery])

    const filteredSubjects = useMemo(() => {
        return subjects.filter(s => {
            const matchesSearch = !searchQuery.trim() ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesType = subjectTypeFilter === 'all' ||
                (subjectTypeFilter === 'core' && !s.is_optional) ||
                (subjectTypeFilter === 'elective' && s.is_optional)
            return matchesSearch && matchesType
        })
    }, [subjects, searchQuery, subjectTypeFilter])

    const filteredMappings = useMemo(() => {
        return mappings.filter(m => {
            const matchesTeacher = mappingTeacherFilter === 'all' || m.teacher_id === mappingTeacherFilter
            const matchesClass = mappingClassFilter === 'all' || m.class_id === mappingClassFilter
            const matchesSearch = !searchQuery.trim() ||
                (m.teacher && `${m.teacher.first_name} ${m.teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (m.subject && m.subject.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (m.class && m.class.name.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesTeacher && matchesClass && matchesSearch
        })
    }, [mappings, mappingTeacherFilter, mappingClassFilter, searchQuery])

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 80, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* ── 1. EDITORIAL HERO BANNER ────────────────────────────── */}
            <div style={{ position: 'relative', width: '100%', height: 280, background: '#0F172A', overflow: 'hidden' }}>
                <Image
                    src="/assets/images/dashboard/academy_banner.jpg"
                    alt="Institutional Curriculum Architecture"
                    fill
                    style={{ objectFit: 'cover', opacity: 0.42 }}
                    priority
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%)'
                }} />

                <div style={{
                    position: 'relative',
                    maxWidth: 1400,
                    margin: '0 auto',
                    padding: '40px 32px 0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span style={{
                                padding: '4px 12px',
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(8px)',
                                color: '#FFFFFF',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                Institutional Architecture
                            </span>
                            <span style={{
                                padding: '4px 12px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#34D399',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                                AY 2026-27 Active
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: '#FFFFFF',
                            margin: 0,
                            letterSpacing: '-0.02em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                        }}>
                            Academy Setup & Curriculum Structure
                        </h1>
                        <p style={{
                            color: '#E2E8F0',
                            fontSize: 14,
                            marginTop: 6,
                            maxWidth: 720,
                            lineHeight: 1.5
                        }}>
                            Configure your institution&apos;s grade hierarchy, section intake capacities, core curriculum subjects, and teacher teaching matrices.
                        </p>
                    </div>

                    {/* Quick Trigger Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 20,
                        borderBottom: '1px solid rgba(255,255,255,0.15)'
                    }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowClassModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            >
                                <Plus size={16} /> New Class
                            </button>
                            <button
                                onClick={() => setShowSubjectModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                <BookOpen size={16} /> New Subject
                            </button>
                            <button
                                onClick={() => setShowMappingModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                <GraduationCap size={16} /> Assign Teacher
                            </button>
                        </div>
                        <button
                            onClick={fetchAcademyData}
                            title="Refresh structure"
                            style={{
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 10,
                                width: 38,
                                height: 38,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF',
                                cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── 2. EXECUTIVE METRIC KPI CARDS ─────────────────────── */}
            <div style={{ maxWidth: 1400, margin: '-24px auto 0', padding: '0 32px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {/* Card 1: Classes & Sections */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: '20px 24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Class Hierarchy</span>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: PALETTE.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.primary }}>
                                <Layers size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                            {stats.total_classes}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B', marginLeft: 8 }}>Grades</span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                            {stats.total_sections} Active Sections Configured
                        </div>
                    </div>

                    {/* Card 2: Section Capacity */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: '20px 24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Student Intake Capacity</span>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                <Users size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                            {stats.total_capacity}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B', marginLeft: 8 }}>Seats</span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                            Avg. {stats.total_sections > 0 ? Math.round(stats.total_capacity / stats.total_sections) : 0} students per section
                        </div>
                    </div>

                    {/* Card 3: Subjects */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: '20px 24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Curriculum Subjects</span>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FDF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
                                <BookOpen size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                            {stats.total_subjects}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B', marginLeft: 8 }}>Registered</span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                            {stats.core_subjects} Core · {stats.elective_subjects} Elective
                        </div>
                    </div>

                    {/* Card 4: Faculty Mapping Coverage */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: '20px 24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Faculty Allocation</span>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                <GraduationCap size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                            {stats.faculty_coverage_pct}%
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B', marginLeft: 8 }}>Coverage</span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                            {stats.total_mappings} Active Teaching Assignments
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. SEGMENTED TABS & SEARCH BAR ────────────────────── */}
            <div style={{ maxWidth: 1400, margin: '32px auto 0', padding: '0 32px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: '8px 12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)'
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => setActiveTab('classes')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 10,
                                border: 'none',
                                background: activeTab === 'classes' ? PALETTE.primary : 'transparent',
                                color: activeTab === 'classes' ? '#FFFFFF' : '#64748B',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.15s'
                            }}
                        >
                            <Layers size={16} /> Classes & Sections
                            <span style={{
                                padding: '2px 7px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: activeTab === 'classes' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                                color: activeTab === 'classes' ? '#FFFFFF' : '#475569'
                            }}>
                                {classes.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('subjects')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 10,
                                border: 'none',
                                background: activeTab === 'subjects' ? PALETTE.primary : 'transparent',
                                color: activeTab === 'subjects' ? '#FFFFFF' : '#64748B',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.15s'
                            }}
                        >
                            <BookOpen size={16} /> Subject Management
                            <span style={{
                                padding: '2px 7px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: activeTab === 'subjects' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                                color: activeTab === 'subjects' ? '#FFFFFF' : '#475569'
                            }}>
                                {subjects.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('mapping')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 10,
                                border: 'none',
                                background: activeTab === 'mapping' ? PALETTE.primary : 'transparent',
                                color: activeTab === 'mapping' ? '#FFFFFF' : '#64748B',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.15s'
                            }}
                        >
                            <GraduationCap size={16} /> Faculty Mapping
                            <span style={{
                                padding: '2px 7px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: activeTab === 'mapping' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                                color: activeTab === 'mapping' ? '#FFFFFF' : '#475569'
                            }}>
                                {mappings.length}
                            </span>
                        </button>
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative', width: 280 }}>
                        <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'classes' ? 'Search classes or codes...' :
                                activeTab === 'subjects' ? 'Search subjects...' :
                                'Search faculty or assignments...'
                            }
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                borderRadius: 10,
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                fontSize: 13,
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: 10,
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#94A3B8',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── 4. TAB CONTENTS ─────────────────────────────────── */}
                <div style={{ marginTop: 24 }}>
                    {loading ? (
                        <div style={{
                            padding: '80px 0',
                            textAlign: 'center',
                            background: '#FFFFFF',
                            borderRadius: 16,
                            border: '1px solid #E2E8F0'
                        }}>
                            <Loader2 size={36} color={PALETTE.primary} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Loading Academy Structure...</div>
                            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Retrieving classes, section quotas, and faculty teaching matrices.</div>
                        </div>
                    ) : (
                        <>
                            {/* ── TAB 1: CLASSES & SECTIONS ────────────────── */}
                            {activeTab === 'classes' && (
                                <div>
                                    {filteredClasses.length === 0 ? (
                                        <div style={{
                                            background: '#FFFFFF',
                                            borderRadius: 16,
                                            padding: '80px 24px',
                                            textAlign: 'center',
                                            border: '1px solid #E2E8F0'
                                        }}>
                                            <div style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 16,
                                                background: PALETTE.primaryLight,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 20px',
                                                color: PALETTE.primary
                                            }}>
                                                <School size={30} />
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                                {searchQuery ? 'No matching classes found' : 'No Classes Configured Yet'}
                                            </h3>
                                            <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, maxWidth: 440, margin: '6px auto 20px' }}>
                                                {searchQuery ? `No class names or codes matched "${searchQuery}".` : 'Get started by creating your institution’s first class grade and setting up sections.'}
                                            </p>
                                            <button
                                                onClick={() => setShowClassModal(true)}
                                                style={{
                                                    padding: '11px 22px',
                                                    borderRadius: 10,
                                                    background: PALETTE.primary,
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                + Register First Class
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
                                            {filteredClasses.map(cls => (
                                                <div
                                                    key={cls.id}
                                                    style={{
                                                        background: '#FFFFFF',
                                                        borderRadius: 16,
                                                        border: '1px solid #E2E8F0',
                                                        padding: 24,
                                                        boxShadow: '0 2px 10px -2px rgba(0,0,0,0.03)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        transition: '0.15s'
                                                    }}
                                                >
                                                    <div>
                                                        {/* Header */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                    <span style={{
                                                                        padding: '2px 8px',
                                                                        borderRadius: 6,
                                                                        fontSize: 11,
                                                                        fontWeight: 800,
                                                                        background: PALETTE.primaryLight,
                                                                        color: PALETTE.primary,
                                                                        letterSpacing: '0.04em'
                                                                    }}>
                                                                        {cls.code || 'CLS-' + cls.name}
                                                                    </span>
                                                                    {cls.is_active !== false ? (
                                                                        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Active
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Archived</span>
                                                                    )}
                                                                </div>
                                                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                                                                    {cls.name}
                                                                </h3>
                                                            </div>

                                                            {/* Actions Menu */}
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingClass(cls)
                                                                        setEditClassForm({
                                                                            id: cls.id,
                                                                            name: cls.name,
                                                                            code: cls.code || '',
                                                                            is_active: cls.is_active !== false
                                                                        })
                                                                    }}
                                                                    title="Edit class"
                                                                    style={{
                                                                        padding: 6,
                                                                        borderRadius: 8,
                                                                        border: '1px solid #E2E8F0',
                                                                        background: '#FFFFFF',
                                                                        color: '#64748B',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <Edit3 size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingItem({ type: 'class', id: cls.id, name: cls.name })}
                                                                    title="Delete class"
                                                                    style={{
                                                                        padding: 6,
                                                                        borderRadius: 8,
                                                                        border: '1px solid #E2E8F0',
                                                                        background: '#FFFFFF',
                                                                        color: '#EF4444',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Sections (Divisions) Container */}
                                                        <div style={{ marginBottom: 20 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                    Sections & Quotas
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        setShowDivisionModal({ classId: cls.id, className: cls.name })
                                                                        setDivisionForm({ name: '', capacity: 40 })
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 4,
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        color: PALETTE.primary,
                                                                        fontSize: 12,
                                                                        fontWeight: 700,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <Plus size={13} /> Add Section
                                                                </button>
                                                            </div>

                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                                {cls.divisions && cls.divisions.length > 0 ? (
                                                                    cls.divisions.map(div => (
                                                                        <div
                                                                            key={div.id}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 8,
                                                                                padding: '6px 12px',
                                                                                background: '#F8FAFC',
                                                                                border: '1px solid #E2E8F0',
                                                                                borderRadius: 8,
                                                                                fontSize: 13,
                                                                                fontWeight: 600,
                                                                                color: '#334155'
                                                                            }}
                                                                        >
                                                                            <span>Section {div.name}</span>
                                                                            <span style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8' }}>
                                                                                ({div.capacity} seats)
                                                                            </span>
                                                                            <button
                                                                                onClick={() => setEditingDivision({ id: div.id, name: div.name, capacity: div.capacity, className: cls.name })}
                                                                                title="Edit section"
                                                                                style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', padding: 1 }}
                                                                            >
                                                                                <Edit3 size={12} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setDeletingItem({ type: 'division', id: div.id, name: `Section ${div.name} (${cls.name})` })}
                                                                                title="Delete section"
                                                                                style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: 1 }}
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>
                                                                        No sections created yet. Click &quot;Add Section&quot; to begin.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Mapped Subjects Footer */}
                                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                Subjects Taught ({cls.mapped_subjects?.length || 0})
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setShowClassSubModal({ classId: cls.id, className: cls.name })
                                                                    setClassSubSelected(cls.mapped_subjects?.map(s => s.id) || [])
                                                                }}
                                                                style={{
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: PALETTE.primary,
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Manage Subjects
                                                            </button>
                                                        </div>

                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {cls.mapped_subjects && cls.mapped_subjects.length > 0 ? (
                                                                cls.mapped_subjects.map(s => (
                                                                    <span
                                                                        key={s.id}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 5,
                                                                            padding: '3px 9px',
                                                                            background: PALETTE.primaryLight,
                                                                            color: PALETTE.primary,
                                                                            borderRadius: 6,
                                                                            fontSize: 11,
                                                                            fontWeight: 700
                                                                        }}
                                                                    >
                                                                        <BookOpen size={11} /> {s.name}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                                                                    No subjects linked to this class.
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 2: SUBJECTS MANAGEMENT ──────────────── */}
                            {activeTab === 'subjects' && (
                                <div>
                                    {/* Filter Sub-bar */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 16
                                    }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {(['all', 'core', 'elective'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSubjectTypeFilter(type)}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: 8,
                                                        border: '1px solid',
                                                        borderColor: subjectTypeFilter === type ? PALETTE.primary : '#E2E8F0',
                                                        background: subjectTypeFilter === type ? PALETTE.primaryLight : '#FFFFFF',
                                                        color: subjectTypeFilter === type ? PALETTE.primary : '#64748B',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        textTransform: 'capitalize'
                                                    }}
                                                >
                                                    {type === 'all' ? 'All Curriculum Types' : type === 'core' ? 'Core Mandatory' : 'Optional Elective'}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowSubjectModal(true)
                                                setSubjectForm({ name: '', code: '', is_optional: false })
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '8px 16px',
                                                background: PALETTE.primary,
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Plus size={15} /> Create Subject
                                        </button>
                                    </div>

                                    {filteredSubjects.length === 0 ? (
                                        <div style={{
                                            background: '#FFFFFF',
                                            borderRadius: 16,
                                            padding: '80px 24px',
                                            textAlign: 'center',
                                            border: '1px solid #E2E8F0'
                                        }}>
                                            <div style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 16,
                                                background: '#FDF4FF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 20px',
                                                color: '#9333EA'
                                            }}>
                                                <BookOpen size={30} />
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                                {searchQuery ? 'No matching subjects found' : 'No Subjects Registered'}
                                            </h3>
                                            <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, maxWidth: 440, margin: '6px auto 20px' }}>
                                                Add subjects like Mathematics, Physics, and English to start structuring your institutional curriculum.
                                            </p>
                                            <button
                                                onClick={() => setShowSubjectModal(true)}
                                                style={{
                                                    padding: '11px 22px',
                                                    borderRadius: 10,
                                                    background: PALETTE.primary,
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                + Create New Subject
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: '#FFFFFF',
                                            borderRadius: 16,
                                            border: '1px solid #E2E8F0',
                                            overflow: 'hidden',
                                            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)'
                                        }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                                        <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Name</th>
                                                        <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Code</th>
                                                        <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Curriculum Category</th>
                                                        <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade Coverage</th>
                                                        <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredSubjects.map(sub => (
                                                        <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9', transition: '0.1s' }}>
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    <div style={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        borderRadius: 10,
                                                                        background: sub.is_optional ? '#FFFBEB' : PALETTE.primaryLight,
                                                                        color: sub.is_optional ? '#D97706' : PALETTE.primary,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <BookOpen size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{sub.name}</div>
                                                                        {sub.is_system_fallback && (
                                                                            <span style={{ fontSize: 11, color: '#94A3B8' }}>System Standard</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <span style={{
                                                                    padding: '3px 8px',
                                                                    borderRadius: 6,
                                                                    background: '#F1F5F9',
                                                                    color: '#475569',
                                                                    fontSize: 12,
                                                                    fontWeight: 800,
                                                                    letterSpacing: '0.03em'
                                                                }}>
                                                                    {sub.code || 'GEN'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <span style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: 20,
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    background: sub.is_optional ? '#FFFBEB' : '#ECFDF5',
                                                                    color: sub.is_optional ? '#B45309' : '#047857',
                                                                    border: `1px solid ${sub.is_optional ? '#FDE68A' : '#A7F3D0'}`
                                                                }}>
                                                                    {sub.is_optional ? 'Elective / Optional' : 'Core Mandatory'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                                                                {sub.mapped_classes_count || 0} Grades
                                                            </td>
                                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingSubject(sub)
                                                                            setEditSubjectForm({
                                                                                id: sub.id,
                                                                                name: sub.name,
                                                                                code: sub.code || '',
                                                                                is_optional: !!sub.is_optional
                                                                            })
                                                                        }}
                                                                        title="Edit subject"
                                                                        style={{
                                                                            padding: 6,
                                                                            borderRadius: 8,
                                                                            border: '1px solid #E2E8F0',
                                                                            background: '#FFFFFF',
                                                                            color: '#64748B',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <Edit3 size={15} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingItem({ type: 'subject', id: sub.id, name: sub.name })}
                                                                        title="Delete subject"
                                                                        style={{
                                                                            padding: 6,
                                                                            borderRadius: 8,
                                                                            border: '1px solid #E2E8F0',
                                                                            background: '#FFFFFF',
                                                                            color: '#EF4444',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 3: FACULTY MAPPING MATRIX ───────────── */}
                            {activeTab === 'mapping' && (
                                <div>
                                    {/* Filter Sub-bar */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 16
                                    }}>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            {/* Teacher Filter */}
                                            <select
                                                value={mappingTeacherFilter}
                                                onChange={e => setMappingTeacherFilter(e.target.value)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: 8,
                                                    border: '1px solid #E2E8F0',
                                                    background: '#FFFFFF',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: '#334155',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="all">All Faculty Members</option>
                                                {teachers.map(t => (
                                                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                                ))}
                                            </select>

                                            {/* Class Filter */}
                                            <select
                                                value={mappingClassFilter}
                                                onChange={e => setMappingClassFilter(e.target.value)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: 8,
                                                    border: '1px solid #E2E8F0',
                                                    background: '#FFFFFF',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: '#334155',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="all">All Grades</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowMappingModal(true)
                                                setMappingForm({ teacher_id: '', class_id: '', division_id: '', subject_id: '' })
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '8px 16px',
                                                background: PALETTE.primary,
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Plus size={15} /> Assign Teacher
                                        </button>
                                    </div>

                                    {filteredMappings.length === 0 ? (
                                        <div style={{
                                            background: '#FFFFFF',
                                            borderRadius: 16,
                                            padding: '80px 24px',
                                            textAlign: 'center',
                                            border: '1px solid #E2E8F0'
                                        }}>
                                            <div style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 16,
                                                background: '#ECFDF5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 20px',
                                                color: '#10B981'
                                            }}>
                                                <GraduationCap size={30} />
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                                {searchQuery || mappingTeacherFilter !== 'all' || mappingClassFilter !== 'all' ? 'No matching assignments found' : 'No Faculty Assignments Yet'}
                                            </h3>
                                            <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, maxWidth: 440, margin: '6px auto 20px' }}>
                                                Map qualified teachers to specific classes, sections, and subjects to empower your faculty directory.
                                            </p>
                                            <button
                                                onClick={() => setShowMappingModal(true)}
                                                style={{
                                                    padding: '11px 22px',
                                                    borderRadius: 10,
                                                    background: PALETTE.primary,
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                + Assign Teacher
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                                            {filteredMappings.map(map => (
                                                <div
                                                    key={map.id}
                                                    style={{
                                                        background: '#FFFFFF',
                                                        borderRadius: 16,
                                                        border: '1px solid #E2E8F0',
                                                        padding: 20,
                                                        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        gap: 16
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        {/* Teacher Info */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{
                                                                width: 44,
                                                                height: 44,
                                                                borderRadius: 12,
                                                                background: PALETTE.primaryLight,
                                                                color: PALETTE.primary,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 800,
                                                                fontSize: 15
                                                            }}>
                                                                {map.teacher?.first_name?.[0]}{map.teacher?.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                                                                    {map.teacher ? `${map.teacher.first_name} ${map.teacher.last_name}` : 'Unknown Faculty'}
                                                                </div>
                                                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                                                    {map.teacher?.email}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Revoke Button */}
                                                        <button
                                                            onClick={() => setDeletingItem({
                                                                type: 'mapping',
                                                                id: map.id,
                                                                name: `${map.teacher?.first_name} ${map.teacher?.last_name} (${map.subject?.name} - ${map.class?.name})`
                                                            })}
                                                            title="Revoke assignment"
                                                            style={{
                                                                padding: 6,
                                                                borderRadius: 8,
                                                                border: '1px solid #FEE2E2',
                                                                background: '#FEF2F2',
                                                                color: '#EF4444',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    {/* Target Class & Subject Flow */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        background: '#F8FAFC',
                                                        borderRadius: 10,
                                                        padding: '10px 14px',
                                                        border: '1px solid #F1F5F9'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <BookOpen size={14} color={PALETTE.primary} />
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                                                                {map.subject?.name || 'Subject'}
                                                            </span>
                                                        </div>
                                                        <ArrowRight size={14} color="#94A3B8" />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: PALETTE.primary }}>
                                                                {map.class?.name}
                                                            </span>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                borderRadius: 4,
                                                                background: '#E2E8F0',
                                                                color: '#334155',
                                                                fontSize: 11,
                                                                fontWeight: 700
                                                            }}>
                                                                Sec {map.division?.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── 5. INTERACTIVE MODALS ────────────────────────────── */}

            {/* MODAL 1: CREATE NEW CLASS */}
            {showClassModal && (
                <Modal
                    title="Register New Class Grade"
                    subtitle="Create an academic class and configure its initial student sections."
                    onClose={() => setShowClassModal(false)}
                    onSubmit={handleCreateClass}
                    saving={saving}
                    submitText="Create Class"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Class / Grade Name *</label>
                            <input
                                placeholder="e.g. Class 10, Grade 12, Kindergarten"
                                value={classForm.name}
                                onChange={e => {
                                    const val = e.target.value
                                    setClassForm({
                                        ...classForm,
                                        name: val,
                                        code: classForm.code || (val ? 'CLS-' + val.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() : '')
                                    })
                                }}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Class Code</label>
                            <input
                                placeholder="e.g. CLS-10, G12"
                                value={classForm.code}
                                onChange={e => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Default Student Intake Capacity per Section</label>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                value={classForm.default_capacity}
                                onChange={e => setClassForm({ ...classForm, default_capacity: parseInt(e.target.value) || 40 })}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 2: EDIT CLASS */}
            {editingClass && (
                <Modal
                    title="Edit Class Grade"
                    subtitle="Update the name, code, or academic status for this class."
                    onClose={() => setEditingClass(null)}
                    onSubmit={handleUpdateClass}
                    saving={saving}
                    submitText="Update Class"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Class Name *</label>
                            <input
                                value={editClassForm.name}
                                onChange={e => setEditClassForm({ ...editClassForm, name: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Class Code</label>
                            <input
                                value={editClassForm.code}
                                onChange={e => setEditClassForm({ ...editClassForm, code: e.target.value.toUpperCase() })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                            <input
                                type="checkbox"
                                id="active_toggle"
                                checked={editClassForm.is_active}
                                onChange={e => setEditClassForm({ ...editClassForm, is_active: e.target.checked })}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                            <label htmlFor="active_toggle" style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                                Class is active and enrollable
                            </label>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 3: ADD SECTION TO CLASS */}
            {showDivisionModal && (
                <Modal
                    title={`Add Section to ${showDivisionModal.className}`}
                    subtitle="Define a classroom section and its maximum student quota."
                    onClose={() => setShowDivisionModal(null)}
                    onSubmit={handleCreateDivision}
                    saving={saving}
                    submitText="Add Section"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Section Identifier (e.g. A, B, C, Rose) *</label>
                            <input
                                placeholder="e.g. A"
                                value={divisionForm.name}
                                onChange={e => setDivisionForm({ ...divisionForm, name: e.target.value.toUpperCase() })}
                                style={inputStyle}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Student Quota / Capacity</label>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                value={divisionForm.capacity}
                                onChange={e => setDivisionForm({ ...divisionForm, capacity: parseInt(e.target.value) || 40 })}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 4: EDIT SECTION */}
            {editingDivision && (
                <Modal
                    title={`Edit Section ${editingDivision.name}`}
                    subtitle={`Update details for this section of ${editingDivision.className}.`}
                    onClose={() => setEditingDivision(null)}
                    onSubmit={handleUpdateDivision}
                    saving={saving}
                    submitText="Save Section"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Section Identifier *</label>
                            <input
                                value={editingDivision.name}
                                onChange={e => setEditingDivision({ ...editingDivision, name: e.target.value.toUpperCase() })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Student Capacity</label>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                value={editingDivision.capacity}
                                onChange={e => setEditingDivision({ ...editingDivision, capacity: parseInt(e.target.value) || 40 })}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 5: MANAGE CLASS SUBJECTS */}
            {showClassSubModal && (
                <Modal
                    title={`Curriculum Subjects for ${showClassSubModal.className}`}
                    subtitle="Select all the subjects taught in this class grade."
                    onClose={() => setShowClassSubModal(null)}
                    onSubmit={handleSyncClassSubjects}
                    saving={saving}
                    submitText="Save Curriculum"
                    maxWidth={580}
                >
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                                {classSubSelected.length} of {subjects.length} Subjects Selected
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => setClassSubSelected(subjects.map(s => s.id))}
                                    style={{ border: 'none', background: 'transparent', color: PALETTE.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Select All
                                </button>
                                <span style={{ color: '#CBD5E1' }}>·</span>
                                <button
                                    type="button"
                                    onClick={() => setClassSubSelected([])}
                                    style={{ border: 'none', background: 'transparent', color: '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxHeight: 340, overflowY: 'auto', padding: 2 }}>
                            {subjects.map(sub => {
                                const selected = classSubSelected.includes(sub.id)
                                return (
                                    <div
                                        key={sub.id}
                                        onClick={() => {
                                            if (selected) setClassSubSelected(classSubSelected.filter(id => id !== sub.id))
                                            else setClassSubSelected([...classSubSelected, sub.id])
                                        }}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 10,
                                            border: '1.5px solid',
                                            borderColor: selected ? PALETTE.primary : '#E2E8F0',
                                            background: selected ? PALETTE.primaryLight : '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            cursor: 'pointer',
                                            transition: '0.1s'
                                        }}
                                    >
                                        <div style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 6,
                                            border: '2px solid',
                                            borderColor: selected ? PALETTE.primary : '#CBD5E1',
                                            background: selected ? PALETTE.primary : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#FFFFFF'
                                        }}>
                                            {selected && <Check size={14} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: selected ? PALETTE.primary : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {sub.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748B' }}>
                                                {sub.code || 'CODE'} {sub.is_optional ? '· Elective' : '· Core'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 6: CREATE NEW SUBJECT */}
            {showSubjectModal && (
                <Modal
                    title="Register New Curriculum Subject"
                    subtitle="Create an academic subject to be assigned to classes and teachers."
                    onClose={() => setShowSubjectModal(false)}
                    onSubmit={handleCreateSubject}
                    saving={saving}
                    submitText="Create Subject"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Subject Name *</label>
                            <input
                                placeholder="e.g. Mathematics, Organic Chemistry, English Literature"
                                value={subjectForm.name}
                                onChange={e => {
                                    const val = e.target.value
                                    setSubjectForm({
                                        ...subjectForm,
                                        name: val,
                                        code: subjectForm.code || (val ? val.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() : '')
                                    })
                                }}
                                style={inputStyle}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Subject Code</label>
                            <input
                                placeholder="e.g. MATH, CHEM, ENGL"
                                value={subjectForm.code}
                                onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Curriculum Classification</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                                <div
                                    onClick={() => setSubjectForm({ ...subjectForm, is_optional: false })}
                                    style={{
                                        padding: 14,
                                        borderRadius: 10,
                                        border: '1.5px solid',
                                        borderColor: !subjectForm.is_optional ? '#10B981' : '#E2E8F0',
                                        background: !subjectForm.is_optional ? '#ECFDF5' : '#FFFFFF',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: !subjectForm.is_optional ? '#047857' : '#0F172A' }}>Core Mandatory</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Compulsory for all enrolled students</div>
                                </div>
                                <div
                                    onClick={() => setSubjectForm({ ...subjectForm, is_optional: true })}
                                    style={{
                                        padding: 14,
                                        borderRadius: 10,
                                        border: '1.5px solid',
                                        borderColor: subjectForm.is_optional ? '#F59E0B' : '#E2E8F0',
                                        background: subjectForm.is_optional ? '#FFFBEB' : '#FFFFFF',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: subjectForm.is_optional ? '#B45309' : '#0F172A' }}>Optional Elective</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Optional track chosen by students</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 7: EDIT SUBJECT */}
            {editingSubject && (
                <Modal
                    title="Edit Curriculum Subject"
                    subtitle="Update subject metadata and curriculum classification."
                    onClose={() => setEditingSubject(null)}
                    onSubmit={handleUpdateSubject}
                    saving={saving}
                    submitText="Update Subject"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Subject Name *</label>
                            <input
                                value={editSubjectForm.name}
                                onChange={e => setEditSubjectForm({ ...editSubjectForm, name: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Subject Code</label>
                            <input
                                value={editSubjectForm.code}
                                onChange={e => setEditSubjectForm({ ...editSubjectForm, code: e.target.value.toUpperCase() })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Curriculum Classification</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                                <div
                                    onClick={() => setEditSubjectForm({ ...editSubjectForm, is_optional: false })}
                                    style={{
                                        padding: 14,
                                        borderRadius: 10,
                                        border: '1.5px solid',
                                        borderColor: !editSubjectForm.is_optional ? '#10B981' : '#E2E8F0',
                                        background: !editSubjectForm.is_optional ? '#ECFDF5' : '#FFFFFF',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: !editSubjectForm.is_optional ? '#047857' : '#0F172A' }}>Core Mandatory</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Compulsory curriculum</div>
                                </div>
                                <div
                                    onClick={() => setEditSubjectForm({ ...editSubjectForm, is_optional: true })}
                                    style={{
                                        padding: 14,
                                        borderRadius: 10,
                                        border: '1.5px solid',
                                        borderColor: editSubjectForm.is_optional ? '#F59E0B' : '#E2E8F0',
                                        background: editSubjectForm.is_optional ? '#FFFBEB' : '#FFFFFF',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: editSubjectForm.is_optional ? '#B45309' : '#0F172A' }}>Optional Elective</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Optional track</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 8: ASSIGN TEACHER TO CLASS/SECTION/SUBJECT */}
            {showMappingModal && (
                <Modal
                    title="Assign Teacher to Class/Section/Subject"
                    subtitle="Map a faculty member to specific class sections and course subjects."
                    onClose={() => setShowMappingModal(false)}
                    onSubmit={handleCreateMapping}
                    saving={saving}
                    submitText="Save Teaching Assignment"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* 1. Teacher Selector */}
                        <div>
                            <label style={labelStyle}>Faculty Member *</label>
                            <select
                                value={mappingForm.teacher_id}
                                onChange={e => setMappingForm({ ...mappingForm, teacher_id: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="">Select a teacher...</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.first_name} {t.last_name} ({t.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Class Selector */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Class Grade *</label>
                                <select
                                    value={mappingForm.class_id}
                                    onChange={e => setMappingForm({
                                        ...mappingForm,
                                        class_id: e.target.value,
                                        division_id: '',
                                        subject_id: ''
                                    })}
                                    style={inputStyle}
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Section Selector (Cascading) */}
                            <div>
                                <label style={labelStyle}>Section *</label>
                                <select
                                    value={mappingForm.division_id}
                                    onChange={e => setMappingForm({ ...mappingForm, division_id: e.target.value })}
                                    style={inputStyle}
                                    disabled={!mappingForm.class_id}
                                >
                                    <option value="">Select section...</option>
                                    {classes.find(c => c.id === mappingForm.class_id)?.divisions?.map(d => (
                                        <option key={d.id} value={d.id}>Section {d.name} ({d.capacity} Seats)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 4. Subject Selector */}
                        <div>
                            <label style={labelStyle}>Course Subject *</label>
                            <select
                                value={mappingForm.subject_id}
                                onChange={e => setMappingForm({ ...mappingForm, subject_id: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="">Select subject...</option>
                                {(() => {
                                    const chosenClass = classes.find(c => c.id === mappingForm.class_id)
                                    const availableSubs = chosenClass?.mapped_subjects && chosenClass.mapped_subjects.length > 0
                                        ? chosenClass.mapped_subjects
                                        : subjects

                                    return availableSubs.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code || 'CODE'}) {s.is_optional ? '[Elective]' : '[Core]'}
                                        </option>
                                    ))
                                })()}
                            </select>
                            {mappingForm.class_id && classes.find(c => c.id === mappingForm.class_id)?.mapped_subjects?.length === 0 && (
                                <p style={{ fontSize: 11, color: '#F59E0B', margin: '4px 0 0' }}>
                                    Tip: This class has no mapped subjects yet; showing all available institutional subjects.
                                </p>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 9: DELETE CONFIRMATION */}
            {deletingItem && (
                <Modal
                    title="Confirm Permanent Deletion"
                    subtitle="This action cannot be undone."
                    onClose={() => setDeletingItem(null)}
                    onSubmit={handleConfirmDelete}
                    saving={saving}
                    submitText="Yes, Delete Permanently"
                >
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            background: '#FEF2F2',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                            Are you sure you want to delete {deletingItem.name}?
                        </h4>
                        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                            {deletingItem.type === 'class' && 'Deleting this class will also cascade-delete all sections and mapped assignments belonging to it.'}
                            {deletingItem.type === 'division' && 'Deleting this section will also revoke any teacher assignments linked to it.'}
                            {deletingItem.type === 'subject' && 'Deleting this subject will remove it from all class curricula and faculty teaching assignments.'}
                            {deletingItem.type === 'mapping' && 'Revoking this assignment will remove the teacher from this specific classroom section.'}
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    )
}

// ── SHARED STYLES ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    fontSize: 13,
    fontWeight: 600,
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box'
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
}
