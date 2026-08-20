'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    Plus, Search, Filter, X, ChevronRight, Save, Loader2, RefreshCw,
    BookOpen, Target, GraduationCap, Clock, FileText, CheckCircle2,
    Layout, Settings, Trash2, Edit3, ArrowRight, AlertCircle, Sparkles,
    ChevronDown, ChevronUp, Layers, Hash, Zap, Globe
} from 'lucide-react'
// —— PALETTE ————————————————————————————————————
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9315',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6310',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}
// —— TYPES ——————————————————————————————————————
type QuestionType = 'MCQ' | 'MSQ' | 'True/False' | 'Fill in the blanks' | 'Assertion Reason' | 'Short Answer' | 'Long Answer' | 'Case Study' | 'Numerical' | 'Diagram-based'
type QuestionRule = {
    id?: string
    question_type: QuestionType
    num_questions: number
    marks_per_question: number
    negative_marks: number
    difficulty_easy_pct: number
    difficulty_medium_pct: number
    difficulty_hard_pct: number
    internal_choice: boolean
}
type TemplateSection = {
    id?: string
    section_name: string
    section_type: 'Objective' | 'Subjective' | 'Mixed'
    optional_flag: boolean
    attempt_limit?: number
    rules: QuestionRule[]
}
type PaperTemplate = {
    id: string
    name: string
    category: 'School' | 'Entrance' | 'Competitive'
    exam_type: 'Objective' | 'Subjective' | 'Mixed'
    duration_minutes: number
    total_marks: number
    instructions: string[]
    is_active: boolean
    is_global: boolean
    sections?: Array<{ id?: string; section_name: string; section_type: string }>
    created_at: string
}
// —— QUESTION MASTER ——————————————————————————————
const QUESTION_TYPES: QuestionType[] = [
    'MCQ', 'MSQ', 'True/False', 'Fill in the blanks', 'Assertion Reason',
    'Short Answer', 'Long Answer', 'Case Study', 'Numerical', 'Diagram-based'
]
const CATEGORIES = ['School', 'Entrance', 'Competitive']
const EXAM_TYPES = ['Objective', 'Subjective', 'Mixed']
// —— COMPONENTS ——————————————————————————————————
export default function ExamFormatTemplatesPage() {
    const [templates, setTemplates] = useState<PaperTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [modal, setModal] = useState<{ open: boolean, step: number, editing?: PaperTemplate | null }>({ open: false, step: 1 })
    const [viewModal, setViewModal] = useState<PaperTemplate | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<PaperTemplate | null>(null)
    const [aiModal, setAiModal] = useState<{ open: boolean, template: PaperTemplate | null }>({ open: false, template: null })
    const [search, setSearch] = useState('')
    // Form State
    const [form, setForm] = useState<Partial<PaperTemplate>>({
        name: '',
        category: 'School',
        exam_type: 'Mixed',
        duration_minutes: 180,
        total_marks: 100,
        instructions: []
    })
    const [sections, setSections] = useState<TemplateSection[]>([])

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }
    const fetchTemplates = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/exams/templates')
            const data = await res.json()
            if (res.ok) setTemplates(data)
        } finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchTemplates() }, [fetchTemplates])
    const handleSaveTemplate = async () => {
        if (!form.name?.trim()) { showToast('Template name is required.', false); return }
        setSaving(true)
        try {
            const isEdit = !!modal.editing
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isEdit ? 'UPDATE_TEMPLATE' : 'CREATE_TEMPLATE',
                    template: { ...form, ...(isEdit ? { id: modal.editing!.id } : {}) },
                    sections: sections
                })
            })
            if (res.ok) {
                showToast(isEdit ? 'Template updated.' : 'Template created successfully.', true)
                setModal({ open: false, step: 1 })
                fetchTemplates()
            } else {
                const d = await res.json()
                showToast(d.error || 'Save failed.', false)
            }
        } finally { setSaving(false) }
    }

    const handleDeleteTemplate = async (template: PaperTemplate) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_TEMPLATE', id: template.id })
            })
            if (res.ok) {
                showToast(`"${template.name}" deleted.`, true)
                setDeleteConfirm(null)
                fetchTemplates()
            } else {
                showToast('Delete failed.', false)
            }
        } finally { setSaving(false) }
    }

    const openEditModal = (t: PaperTemplate) => {
        setForm({
            name: t.name,
            category: t.category,
            exam_type: t.exam_type,
            duration_minutes: t.duration_minutes,
            total_marks: t.total_marks,
            instructions: t.instructions || []
        })
        setSections((t.sections || []).map(s => ({ ...s, rules: [] })))
        setModal({ open: true, step: 1, editing: t })
    }

    const handleAIGeneration = async (templateId: string) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'GENERATE_QUESTIONS', templateId })
            })
            const data = await res.json()
            if (res.ok) {
                showToast(`${data.count} questions generated successfully.`, true)
                setAiModal({ open: false, template: null })
            } else {
                showToast('Question generation failed: ' + (data.error || 'Unknown error'), false)
            }
        } finally { setSaving(false) }
    }
    const handlePublish = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'PUBLISH_TEMPLATE',
                    id: id,
                    is_published: !currentStatus
                })
            })
            if (res.ok) fetchTemplates()
        } catch (error) { console.error("Publish failed:", error) }
    }
    const addSection = () => {
        const letters = 'ABCDEFGH'
        const nextId = letters[sections.length] || sections.length
        setSections([...sections, {
            section_name: `Section ${nextId}`,
            section_type: 'Mixed',
            optional_flag: false,
            rules: []
        }])
    }
    const addRule = (sectionIndex: number) => {
        const newSections = [...sections]
        newSections[sectionIndex].rules.push({
            question_type: 'MCQ',
            num_questions: 10,
            marks_per_question: 1,
            negative_marks: 0,
            difficulty_easy_pct: 30,
            difficulty_medium_pct: 50,
            difficulty_hard_pct: 20,
            internal_choice: false
        })
        setSections(newSections)
    }
    const updateRule = (sIdx: number, rIdx: number, updates: Partial<QuestionRule>) => {
        const newSections = [...sections]
        newSections[sIdx].rules[rIdx] = { ...newSections[sIdx].rules[rIdx], ...updates }
        setSections(newSections)
    }
    const removeSection = (idx: number) => setSections(sections.filter((_, i) => i !== idx))
    const removeRule = (sIdx: number, rIdx: number) => {
        const newSections = [...sections]
        newSections[sIdx].rules = newSections[sIdx].rules.filter((_, i) => i !== rIdx)
        setSections(newSections)
    }
    const calculateSectionTotal = (section: TemplateSection) => {
        return section.rules.reduce((acc, r) => acc + (r.num_questions * r.marks_per_question), 0)
    }
    const calculateGrandTotal = () => {
        return sections.reduce((acc, s) => acc + calculateSectionTotal(s), 0)
    }
    // Filtered templates
    const filteredTemplates = templates.filter(t => {
        const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px 40px', fontFamily: 'Inter, sans-serif' }}>
            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, zIndex: 9999, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    {toast.ok ? <CheckCircle2 size={16} color={P.success} /> : <AlertCircle size={16} color={P.error} />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Syllabus &amp; Exams</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Exam Format Manager</div>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Exam Format Templates</h1>
                    <p style={{ fontSize: 16, color: P.text, margin: '8px 0 0', fontWeight: 500 }}>Create and manage standard exam formats. Publish them so tenants can use them when building exams.</p>
                </div>
                <button onClick={() => { setForm({ name: '', category: 'School', exam_type: 'Mixed', duration_minutes: 180, total_marks: 100, instructions: [] }); setSections([]); setModal({ open: true, step: 1, editing: null }) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 850, cursor: 'pointer', boxShadow: '0 8px 24px ' + P.brand + '30' }}>
                    <Plus size={18} strokeWidth={2.5} /> New Template
                </button>
            </div>
            {/* QUICK STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Total Templates', value: templates.length, icon: FileText, color: P.brand, bg: P.brandBg },
                    { label: 'School Formats', value: templates.filter(t => t.category === 'School').length, icon: GraduationCap, color: P.success, bg: P.successBg },
                    { label: 'Entrance Formats', value: templates.filter(t => t.category === 'Entrance').length, icon: Target, color: P.cta, bg: P.ctaBg },
                    { label: 'Competitive Formats', value: templates.filter(t => t.category === 'Competitive').length, icon: Zap, color: P.info, bg: P.infoBg },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', padding: '24px', borderRadius: 20, border: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={24} color={s.color} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                            <div style={{ fontSize: 26, fontWeight: 950, color: P.dark }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            {/* SEARCH & FILTERS */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid ' + P.border, marginBottom: 24, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: '1px solid ' + P.border, background: P.bg, color: P.dark, fontSize: 13, fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, padding: 4 }}>
                        {['All', 'School', 'Entrance', 'Competitive'].map(f => (
                            <button key={f} onClick={() => setCategoryFilter(f)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: categoryFilter === f ? '#fff' : 'transparent', fontSize: 12, fontWeight: 750, color: categoryFilter === f ? P.dark : P.muted, cursor: 'pointer', transition: 'all 0.2s', boxShadow: categoryFilter === f ? '0 1px 4px rgba(0,0,0,0.07)' : 'none' }}>{f}</button>
                        ))}
                    </div>
                    <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{filteredTemplates.length} results</span>
                </div>
                <button onClick={fetchTemplates} disabled={loading} style={{ background: '#fff', border: '1px solid ' + P.border, cursor: 'pointer', padding: 10, borderRadius: 10, display: 'flex', color: P.muted }} className="hover-lift">
                    <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none', color: P.brand }} />
                </button>
            </div>
            {/* TEMPLATE GRID */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                    <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 24, border: '1px dashed ' + P.border, padding: '80px', textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Layout size={36} color={P.muted} opacity={0.4} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: P.dark, margin: 0 }}>{search || categoryFilter !== 'All' ? 'No Templates Match' : 'No Templates Yet'}</h3>
                    <p style={{ color: P.muted, marginTop: 10, maxWidth: 320, marginInline: 'auto' }}>{search || categoryFilter !== 'All' ? 'Try adjusting your search or filter.' : 'Create your first exam format template for schools or entrance exams.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {filteredTemplates.map(t => (
                        <div key={t.id} style={{ background: '#fff', borderRadius: 24, padding: '24px', border: '1px solid ' + (t.is_global ? P.brand : P.border), display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', boxShadow: t.is_global ? '0 10px 40px ' + P.brand + '10' : 'none' }} className="hover-scale">
                            {t.is_global && <div style={{ position: 'absolute', top: -12, right: 24, background: P.brand, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 12px ' + P.brand + '40' }}><Globe size={12} /> PUBLISHED</div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ background: t.category === 'School' ? P.successBg : t.category === 'Entrance' ? P.ctaBg : P.infoBg, padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 900, color: t.category === 'School' ? P.success : t.category === 'Entrance' ? P.cta : P.info, textTransform: 'uppercase' }}>{t.category}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => handlePublish(t.id, !!t.is_global)} style={{ padding: 8, borderRadius: 8, background: t.is_global ? P.brandBg : P.bg, border: 'none', cursor: 'pointer', color: t.is_global ? P.brand : P.muted }} title={t.is_global ? 'Unpublish' : 'Publish to tenants'}><Globe size={15} /></button>
                                    <button onClick={() => openEditModal(t)} style={{ padding: 8, borderRadius: 8, background: P.bg, border: 'none', cursor: 'pointer', color: P.muted }} title="Edit"><Edit3 size={15} /></button>
                                    <button onClick={() => setDeleteConfirm(t)} style={{ padding: 8, borderRadius: 8, background: P.errorBg, border: 'none', cursor: 'pointer', color: P.error }} title="Delete"><Trash2 size={15} /></button>
                                </div>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{t.name}</h3>
                                <div style={{ display: 'flex', gap:10, marginTop:10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: P.muted, fontWeight: 700 }}><Clock size={14}/> {t.duration_minutes} min</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: P.muted, fontWeight: 700 }}><Target size={14}/> {t.total_marks} Marks</div>
                                </div>
                            </div>
                            <div style={{ background: P.bg, padding: '16px', borderRadius: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Sections</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {t.sections && t.sections.length > 0 ? t.sections.map((s, si) => (
                                        <div key={s.id || si} style={{ fontSize: 11, fontWeight: 800, color: P.text, background: '#fff', padding: '5px 10px', borderRadius: 8, border: '1px solid ' + P.border }}>{s.section_name}</div>
                                    )) : (
                                        <div style={{ fontSize: 11, color: P.muted, fontStyle: 'italic' }}>No sections added</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                                <button onClick={() => setViewModal(t)} style={{ flex: 1, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 850, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px ' + P.brand + '20' }}>
                                    View Details <ArrowRight size={14} />
                                </button>
                                <button 
                                    onClick={() => setAiModal({ open: true, template: t })}
                                    style={{ padding: '12px', background: P.ctaBg, color: P.cta, border: '1px solid ' + P.cta + '20', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Generate Questions from this Template"
                                >
                                    <Sparkles size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* MODAL / BUILDER ———————————————————————————————————————————————— */}
            {modal.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 40, animation: 'slideUp 0.3s' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: 1000, background: '#fff', borderRadius: 32, display: 'flex', flexDirection: 'column', maxHeight: '100%', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '32px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={22} color={P.brand} /></div>
                                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: P.dark }}>{modal.editing ? 'Edit Template' : (modal.step === 1 ? 'New Template — Basic Info' : modal.step === 2 ? 'Add Sections' : 'Set Question Rules')}</h2>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: P.muted, fontWeight: 600 }}>Step {modal.step} of 3 — {modal.step === 1 ? 'Name, category, duration and total marks' : modal.step === 2 ? 'Add and label the exam sections' : 'Set how many questions per section and difficulty split'}</p>
                            </div>
                            <button onClick={() => setModal({ ...modal, open: false })} style={{ background: P.hover, border: 'none', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} color={P.muted} /></button>
                        </div>
                        {/* Modal Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                            {modal.step === 1 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 850, color: P.dark, marginBottom: 8 }}>Template Name <span style={{ color: P.error }}>*</span></label>
                                            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. CBSE 2024 Standard Math" style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1px solid ' + P.border, fontSize: 14, fontWeight: 600, outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 850, color: P.dark, marginBottom: 8 }}>Category</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                                {CATEGORIES.map(c => (
                                                    <button key={c} onClick={() => setForm({...form, category: c as any})} style={{ padding: '12px', borderRadius: 12, border: '1px solid ' + (form.category === c ? P.brand : P.border), background: form.category === c ? P.brandBg : 'transparent', color: form.category === c ? P.brand : P.muted, fontWeight: 750, fontSize: 12, cursor: 'pointer' }}>{c}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 850, color: P.dark, marginBottom: 8 }}>Time Limit (mins)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Clock size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                                    <input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value)})} style={{ width: '100%', padding: '14px 18px 14px 40px', borderRadius: 14, border: '1px solid ' + P.border, fontSize: 14, fontWeight: 600, outline: 'none' }} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 850, color: P.dark, marginBottom: 8 }}>Total Marks</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Target size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                                    <input type="number" value={form.total_marks} onChange={e => setForm({...form, total_marks: parseInt(e.target.value)})} style={{ width: '100%', padding: '14px 18px 14px 40px', borderRadius: 14, border: '1px solid ' + P.border, fontSize: 14, fontWeight: 600, outline: 'none' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ background: P.bg, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                        <div style={{ width: 100, height: 100, borderRadius: 50, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.04)' }}>
                                            <Sparkles size={40} color={P.brand} />
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark }}>Tip</h4>
                                        <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.6, margin: '12px 0 0', fontWeight: 500 }}>Once you set the basic details here, you can add sections and question rules in the next steps.</p>
                                    </div>
                                </div>
                            )}
                            {modal.step === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin:0, fontSize: 16, fontWeight: 850 }}>Sections ({sections.length})</h4>
                                        <button onClick={addSection} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.successBg, color: P.success, padding: '10px 18px', borderRadius: 12, border: 'none', fontWeight: 850, fontSize: 13, cursor: 'pointer' }}><Plus size={16} /> Add Section</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {sections.map((s, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid ' + P.border, borderRadius: 24, padding: '24px', position: 'relative' }}>
                                                <button onClick={() => removeSection(idx)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, background: P.errorBg, color: P.error, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                                                <div style={{ display: 'grid', gridTemplateColumns: '240px 180px 1fr 1fr', gap: 20, alignItems: 'center' }}>
                                                    <div>
                                                        <label style={{ fontSize: 11, fontWeight: 850, color: P.muted, display: 'block', marginBottom: 6 }}>Section Label</label>
                                                        <input value={s.section_name} onChange={e => { const ns = [...sections]; ns[idx].section_name = e.target.value; setSections(ns) }} placeholder="e.g. Section A" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid ' + P.border, fontSize: 13, fontWeight: 700 }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 11, fontWeight: 850, color: P.muted, display: 'block', marginBottom: 6 }}>Type</label>
                                                        <select value={s.section_type} onChange={e => { const ns = [...sections]; ns[idx].section_type = e.target.value as any; setSections(ns); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid ' + P.border, fontSize: 13, fontWeight: 700 }}>
                                                            <option>Objective</option>
                                                            <option>Subjective</option>
                                                            <option>Mixed</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <input type="checkbox" checked={s.optional_flag} onChange={e => { const ns = [...sections]; ns[idx].optional_flag = e.target.checked; setSections(ns); }} style={{ width: 18, height: 18, borderRadius: 6 }} />
                                                        <span style={{ fontSize: 13, fontWeight: 750, color: P.dark }}>Optional Section</span>
                                                    </div>
                                                    {s.optional_flag && (
                                                        <div>
                                                            <label style={{ fontSize: 11, fontWeight: 850, color: P.muted, display: 'block', marginBottom: 6 }}>Attempt Limit</label>
                                                            <input type="number" value={s.attempt_limit || ''} onChange={e => { const ns = [...sections]; ns[idx].attempt_limit = parseInt(e.target.value) || undefined; setSections(ns); }} placeholder="e.g. Any 2" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid ' + P.border, fontSize: 13, fontWeight: 700 }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {sections.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: P.muted, fontWeight: 600 }}>Click "Add Section" to add exam sections (e.g. Section A, Section B).</div>}
                                    </div>
                                </div>
                            )}
                            {modal.step === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    {sections.map((s, sIdx) => (
                                        <div key={sIdx} style={{ background: '#fff', border: '1px solid ' + P.border, borderRadius: 24, overflow: 'hidden' }}>
                                            <div style={{ padding: '16px 24px', background: P.bg, borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: P.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>{s.section_name[s.section_name.length - 1]}</div>
                                                    <span style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{s.section_name} • <span style={{ color: P.muted }}>{s.section_type}</span></span>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: P.brand }}>Subtotal: {calculateSectionTotal(s)} Marks</div>
                                            </div>
                                            <div style={{ padding: '24px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '1px solid ' + P.border }}>
                                                            <th style={{ padding: '0 12px 12px 0', textAlign: 'left', fontSize: 11, color: P.muted, textTransform: 'uppercase' }}>Question Type</th>
                                                            <th style={{ padding: '0 12px 12px 12px', textAlign: 'center', fontSize: 11, color: P.muted, textTransform: 'uppercase' }}>Qty</th>
                                                            <th style={{ padding: '0 12px 12px 12px', textAlign: 'center', fontSize: 11, color: P.muted, textTransform: 'uppercase' }}>Marks/ea</th>
                                                            <th style={{ padding: '0 12px 12px 12px', textAlign: 'center', fontSize: 11, color: P.muted, textTransform: 'uppercase' }}>Neg Marking</th>
                                                            <th style={{ padding: '0 12px 12px 12px', textAlign: 'left', fontSize: 11, color: P.muted, textTransform: 'uppercase' }}>Difficulty (E/M/H) %</th>
                                                            <th style={{ padding: '0 0 12px 12px', textAlign: 'center', fontSize: 11, color: P.muted, textTransform: 'uppercase' }}>Choice</th>
                                                            <th style={{ padding: '0 0 12px 12px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {s.rules.map((r, rIdx) => (
                                                            <tr key={rIdx} style={{ borderBottom: rIdx < s.rules.length - 1 ? '1px solid ' + P.border + '50' : 'none' }}>
                                                                <td style={{ padding: '16px 12px 16px 0' }}>
                                                                    <select value={r.question_type} onChange={e => updateRule(sIdx, rIdx, { question_type: e.target.value as any })} style={{ background: P.bg, border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontWeight: 700, outline: 'none' }}>
                                                                        {QUESTION_TYPES.map(qt => <option key={qt}>{qt}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td style={{ padding: '16px 12px' }}><input type="number" value={r.num_questions} onChange={e => updateRule(sIdx, rIdx, { num_questions: parseInt(e.target.value) })} style={{ width: 60, textAlign: 'center', border: '1px solid ' + P.border, borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 700 }} /></td>
                                                                <td style={{ padding: '16px 12px' }}><input type="number" value={r.marks_per_question} onChange={e => updateRule(sIdx, rIdx, { marks_per_question: parseFloat(e.target.value) })} style={{ width: 60, textAlign: 'center', border: '1px solid ' + P.border, borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 700 }} /></td>
                                                                <td style={{ padding: '16px 12px' }}><input type="number" value={r.negative_marks} onChange={e => updateRule(sIdx, rIdx, { negative_marks: parseFloat(e.target.value) })} style={{ width: 60, textAlign: 'center', border: '1px solid ' + P.border, borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 700 }} /></td>
                                                                <td style={{ padding: '16px 12px' }}>
                                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                                        <input type="number" value={r.difficulty_easy_pct} onChange={e => updateRule(sIdx, rIdx, { difficulty_easy_pct: parseInt(e.target.value) })} style={{ width: 44, textAlign: 'center', border: 'none', background: P.successBg, color: P.success, borderRadius: 6, padding: 6, fontSize: 11, fontWeight: 800 }} placeholder="E" />
                                                                        <input type="number" value={r.difficulty_medium_pct} onChange={e => updateRule(sIdx, rIdx, { difficulty_medium_pct: parseInt(e.target.value) })} style={{ width: 44, textAlign: 'center', border: 'none', background: P.warningBg, color: P.warning, borderRadius: 6, padding: 6, fontSize: 11, fontWeight: 800 }} placeholder="M" />
                                                                        <input type="number" value={r.difficulty_hard_pct} onChange={e => updateRule(sIdx, rIdx, { difficulty_hard_pct: parseInt(e.target.value) })} style={{ width: 44, textAlign: 'center', border: 'none', background: P.errorBg, color: P.error, borderRadius: 6, padding: 6, fontSize: 11, fontWeight: 800 }} placeholder="H" />
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '16px 12px', textAlign: 'center' }}><input type="checkbox" checked={r.internal_choice} onChange={e => updateRule(sIdx, rIdx, { internal_choice: e.target.checked })} /></td>
                                                                <td style={{ padding: '16px 0 16px 12px' }}><button onClick={() => removeRule(sIdx, rIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted }}><Trash2 size={16} /></button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <button onClick={() => addRule(sIdx)} className="hover-lift" style={{ marginTop: 12, background: '#fff', border: '1px dashed ' + P.border, borderRadius: 10, width: '100%', padding: 12, fontSize: 12, fontWeight: 850, color: P.brand, cursor: 'pointer' }}>+ Add Question Ruleset</button>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ padding: 24, background: P.dark, borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={24} /></div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 950, letterSpacing: '0.02em' }}>MARKS CHECK</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Total marks from rules: <span style={{ color: '#fff' }}>{calculateGrandTotal()} / {form.total_marks}</span></div>
                                            </div>
                                        </div>
                                        {calculateGrandTotal() !== form.total_marks && <div style={{ background: P.error, color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>MARKS DO NOT MATCH</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Modal Footer */}
                        <div style={{ padding: '24px 32px', borderTop: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: '12px 24px', background: '#fff', border: '1px solid ' + P.border, borderRadius: 12, fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>Cancel</button>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {modal.step > 1 && <button onClick={() => setModal({ ...modal, step: modal.step - 1 })} style={{ padding: '12px 24px', background: P.bg, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>Back</button>}
                                {modal.step < 3 ? (
                                    <button onClick={() => setModal({ ...modal, step: modal.step + 1 })} style={{ padding: '12px 32px', background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>Next Step <ChevronRight size={18} /></button>
                                ) : (
                                    <button onClick={handleSaveTemplate} disabled={saving} style={{ padding: '12px 32px', background: P.success, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>{saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} {modal.editing ? 'Save Changes' : 'Save Template'}</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* VIEW DETAILS MODAL */}
            {viewModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 40 }}>
                    <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 32px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{viewModal.category}</div>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: P.dark }}>{viewModal.name}</h2>
                            </div>
                            <button onClick={() => setViewModal(null)} style={{ background: P.bg, border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color={P.muted} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[{ label: 'Time Limit', value: viewModal.duration_minutes + ' minutes' }, { label: 'Total Marks', value: viewModal.total_marks }, { label: 'Exam Type', value: viewModal.exam_type }, { label: 'Status', value: viewModal.is_global ? 'Published' : 'Draft' }].map(r => (
                                <div key={r.label} style={{ background: P.bg, borderRadius: 12, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>{r.label}</div>
                                    <div style={{ fontSize: 15, fontWeight: 850, color: P.dark }}>{r.value}</div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Sections</div>
                            {viewModal.sections && viewModal.sections.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {viewModal.sections.map((s, i) => (<div key={i} style={{ background: P.brandBg, color: P.brand, padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>{s.section_name}</div>))}
                                </div>
                            ) : <div style={{ color: P.muted, fontSize: 13 }}>No sections added yet.</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <button onClick={() => setViewModal(null)} style={{ flex: 1, padding: 12, background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, fontWeight: 800, cursor: 'pointer', color: P.dark }}>Close</button>
                            <button onClick={() => { openEditModal(viewModal); setViewModal(null) }} style={{ flex: 2, padding: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Edit Template</button>
                        </div>
                    </div>
                </div>
            )}
            {/* DELETE CONFIRM MODAL */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 40 }}>
                    <div style={{ width: 420, background: '#fff', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: P.errorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Trash2 size={28} color={P.error} /></div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 950, color: P.dark }}>Delete Template?</h3>
                        <p style={{ color: P.muted, fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>This will permanently delete <strong>&quot;{deleteConfirm.name}&quot;</strong>. This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 12, background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, fontWeight: 800, cursor: 'pointer', color: P.dark }}>Cancel</button>
                            <button onClick={() => handleDeleteTemplate(deleteConfirm)} disabled={saving} style={{ flex: 2, padding: 12, background: P.error, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {/* GENERATE QUESTIONS MODAL */}
            {aiModal.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', animation: 'slideUp 0.3s' }}>
                    <div style={{ width: 500, background: '#fff', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
                        <div style={{ width: 72, height: 72, borderRadius: 20, background: P.ctaBg, color: P.cta, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Sparkles size={36} />
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0 }}>Generate Questions</h2>
                        <p style={{ fontSize: 14, color: P.muted, margin: '12px 0 24px', lineHeight: 1.6 }}>This will automatically create questions for <br/><strong>{aiModal.template?.name}</strong> based on its sections and rules.</p>
                        <div style={{ background: P.bg, borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
                            <div style={{ fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', marginBottom: 12 }}>What will be generated</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(aiModal.template?.sections?.length ?? 0) > 0 ? aiModal.template!.sections!.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.dark }}><CheckCircle2 size={14} color={P.success} /> {s.section_name}</div>
                                )) : (
                                    <div style={{ fontSize: 13, color: P.muted }}>Sections defined in the template will be used.</div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setAiModal({ open: false, template: null })} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid ' + P.border, background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button 
                                onClick={() => handleAIGeneration(aiModal.template?.id || '')}
                                disabled={saving}
                                style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: P.brand, color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={18} />} Generate Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
