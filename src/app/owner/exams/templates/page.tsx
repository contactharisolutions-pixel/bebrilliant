'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    Plus, Search, X, ChevronRight, Save, Loader2, RefreshCw,
    BookOpen, Target, GraduationCap, Clock, FileText, CheckCircle2,
    Layers, Trash2, Edit3, AlertCircle, Sparkles,
    Globe, Copy, Tag, Hash, Zap, BarChart3, ChevronUp, ChevronDown,
    Eye, Printer, Building2, ArrowLeft, Check, Info, ChevronLeft,
    SlidersHorizontal, BookMarked, Trophy, Award, FlaskConical
} from 'lucide-react'

// ── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9310', brandLight: '#004B9325',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6312',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}

// ── TYPES ─────────────────────────────────────────────────────────────────────
type QuestionType = 'MCQ' | 'MSQ' | 'True/False' | 'Fill in the blanks' | 'Assertion Reason' | 'Short Answer' | 'Long Answer' | 'Case Study' | 'Numerical' | 'Diagram-based'
type QuestionRule = {
    id?: string; question_type: QuestionType; num_questions: number
    marks_per_question: number; negative_marks: number
    difficulty_easy_pct: number; difficulty_medium_pct: number; difficulty_hard_pct: number
    internal_choice: boolean; topic_filter?: string[]; order_index?: number
}
type TemplateSection = {
    id?: string; section_name: string; section_type: 'Objective' | 'Subjective' | 'Mixed'
    optional_flag: boolean; attempt_limit?: number; instructions?: string
    time_limit_minutes?: number; order_index?: number; rules: QuestionRule[]
}
type PaperTemplate = {
    id: string; name: string; category: 'School' | 'Entrance' | 'Competitive'
    exam_type: 'Objective' | 'Subjective' | 'Mixed'; duration_minutes: number
    total_marks: number; instructions: string[]; description?: string
    tags?: string[]; is_active: boolean; is_global: boolean
    version?: number; usage_count?: number; last_used_at?: string
    syllabus_node_id?: string; cloned_from?: string
    sections?: TemplateSection[]; created_at: string
}
type Tenant = { id: string; name: string; type: string }
type Preset = { key: string; name: string; category: string; sections: number; total_marks: number; duration_minutes: number }
type ToastState = { msg: string; ok: boolean } | null
type ActiveTab = 'overview' | 'builder' | 'ai'
type WizardMode = 'blank' | 'preset' | null

const QUESTION_TYPES: QuestionType[] = ['MCQ', 'MSQ', 'True/False', 'Fill in the blanks', 'Assertion Reason', 'Short Answer', 'Long Answer', 'Case Study', 'Numerical', 'Diagram-based']
const CATEGORIES = ['School', 'Entrance', 'Competitive'] as const
const EXAM_TYPES = ['Objective', 'Subjective', 'Mixed'] as const
const SECTION_TYPES = ['Objective', 'Subjective', 'Mixed'] as const

const CATEGORY_META: Record<string, { color: string; bg: string; icon: React.ElementType; desc: string }> = {
    School:      { color: P.success, bg: P.successBg, icon: GraduationCap, desc: 'CBSE, ICSE, State Board' },
    Entrance:    { color: P.cta,     bg: P.ctaBg,     icon: Trophy,        desc: 'JEE, NEET, CET' },
    Competitive: { color: P.info,    bg: P.infoBg,    icon: Award,         desc: 'UPSC, SSC, Banking' },
}

const PRESET_ICONS: Record<string, React.ElementType> = {
    'cbse-class10': GraduationCap,
    'jee-main':     FlaskConical,
    'neet':         FlaskConical,
    'upsc-prelims': BookMarked,
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function calcSectionTotal(s: TemplateSection) {
    return s.rules.reduce((a, r) => a + r.num_questions * r.marks_per_question, 0)
}
function calcGrandTotal(sections: TemplateSection[]) {
    return sections.reduce((a, s) => a + calcSectionTotal(s), 0)
}
function newRule(): QuestionRule {
    return { question_type: 'MCQ', num_questions: 10, marks_per_question: 1, negative_marks: 0, difficulty_easy_pct: 30, difficulty_medium_pct: 50, difficulty_hard_pct: 20, internal_choice: false }
}
function newSection(idx: number): TemplateSection {
    return { section_name: `Section ${'ABCDEFGHIJ'[idx] ?? idx + 1}`, section_type: 'Mixed', optional_flag: false, rules: [] }
}
function blankForm(): Partial<PaperTemplate> {
    return { name: '', category: 'School', exam_type: 'Mixed', duration_minutes: 180, total_marks: 100, instructions: [], tags: [], description: '' }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: ToastState }) {
    if (!toast) return null
    return (
        <div style={{ position: 'fixed', top: 24, right: 28, zIndex: 9999, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s' }}>
            {toast.ok ? <CheckCircle2 size={16} color={P.success} /> : <AlertCircle size={16} color={P.error} />}
            <span style={{ fontSize: 13, fontWeight: 700, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
        </div>
    )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: React.ElementType; color: string; bg: string }) {
    return (
        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 18, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} strokeWidth={2.5} />
            </div>
            <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 950, color: P.dark, letterSpacing: '-0.03em' }}>{value}</div>
            </div>
        </div>
    )
}

// ── TEMPLATE CARD ─────────────────────────────────────────────────────────────
function TemplateCard({
    t, selected, onSelect, onClone, onDelete, onPublish
}: {
    t: PaperTemplate; selected: boolean
    onSelect: () => void; onClone: () => void; onDelete: () => void; onPublish: () => void
}) {
    const meta = CATEGORY_META[t.category] ?? CATEGORY_META.School
    const totalQ = (t.sections ?? []).reduce((a, s) => a + (s.rules ?? []).reduce((b: number, r: any) => b + r.num_questions, 0), 0)
    return (
        <div
            onClick={onSelect}
            style={{
                background: selected ? P.brandBg : '#fff',
                borderRadius: 16, padding: '16px', cursor: 'pointer', transition: 'all 0.2s',
                border: `1px solid ${selected ? P.brand : P.border}`,
                boxShadow: selected ? `0 4px 20px ${P.brand}15` : 'none',
                position: 'relative', marginBottom: 10,
            }}
        >
            {t.is_global && (
                <div style={{ position: 'absolute', top: -8, right: 12, background: P.brand, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={9} /> PUBLISHED
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ background: meta.bg, padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <meta.icon size={10} /> {t.category}
                </div>
                {t.version && t.version > 1 && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: P.muted, background: P.hover, padding: '2px 7px', borderRadius: 6 }}>v{t.version}</span>
                )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: P.dark, marginBottom: 6, lineHeight: 1.3 }}>{t.name}</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: P.muted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {t.duration_minutes}m</span>
                <span style={{ fontSize: 11, color: P.muted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Target size={11} /> {t.total_marks} marks</span>
                {totalQ > 0 && <span style={{ fontSize: 11, color: P.muted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={11} /> {totalQ} Q</span>}
            </div>
            {t.tags && t.tags.filter(tag => !tag.startsWith('preset:')).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {t.tags.filter(tag => !tag.startsWith('preset:')).slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: 9, fontWeight: 800, color: P.brand, background: P.brandBg, padding: '3px 8px', borderRadius: 6 }}>{tag}</span>
                    ))}
                </div>
            )}
            <div style={{ display: 'flex', gap: 6, borderTop: `1px solid ${P.border}`, paddingTop: 10 }}>
                <button onClick={e => { e.stopPropagation(); onPublish() }}
                    title={t.is_global ? 'Unpublish' : 'Publish to all tenants'}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, background: t.is_global ? P.brandBg : P.hover, border: 'none', cursor: 'pointer', color: t.is_global ? P.brand : P.muted, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Globe size={12} /> {t.is_global ? 'Published' : 'Publish'}
                </button>
                <button onClick={e => { e.stopPropagation(); onClone() }}
                    title="Clone template"
                    style={{ padding: '6px 8px', borderRadius: 8, background: P.hover, border: 'none', cursor: 'pointer', color: P.muted }}>
                    <Copy size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete() }}
                    title="Delete template"
                    style={{ padding: '6px 8px', borderRadius: 8, background: P.errorBg, border: 'none', cursor: 'pointer', color: P.error }}>
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    )
}

// ── BUILDER ───────────────────────────────────────────────────────────────────
function TemplateBuilder({
    form, setForm, sections, setSections, onSave, onCancel, saving, isEdit
}: {
    form: Partial<PaperTemplate>; setForm: (f: any) => void
    sections: TemplateSection[]; setSections: (s: TemplateSection[]) => void
    onSave: () => void; onCancel: () => void; saving: boolean; isEdit: boolean
}) {
    const [step, setStep] = useState(1)
    const grand = calcGrandTotal(sections)
    const declared = form.total_marks ?? 0
    const balanced = sections.length === 0 || grand === declared
    const diff = grand - declared

    const updateSection = (i: number, updates: Partial<TemplateSection>) => {
        const ns = [...sections]; ns[i] = { ...ns[i], ...updates }; setSections(ns)
    }
    const updateRule = (si: number, ri: number, updates: Partial<QuestionRule>) => {
        const ns = [...sections]
        ns[si] = { ...ns[si], rules: ns[si].rules.map((r, i) => i === ri ? { ...r, ...updates } : r) }
        setSections(ns)
    }
    const moveSection = (i: number, dir: -1 | 1) => {
        const ns = [...sections]; const j = i + dir
        if (j < 0 || j >= ns.length) return
        ;[ns[i], ns[j]] = [ns[j], ns[i]]; setSections(ns)
    }
    const autoBalance = () => {
        if (sections.length === 0 || declared === 0) return
        const totalQ = sections.reduce((a, s) => a + s.rules.reduce((b, r) => b + r.num_questions, 0), 0)
        if (totalQ === 0) return
        const perQ = Number((declared / totalQ).toFixed(2))
        setSections(sections.map(s => ({ ...s, rules: s.rules.map(r => ({ ...r, marks_per_question: perQ })) })))
    }

    const fieldStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${P.border}`, fontSize: 13, fontWeight: 600, outline: 'none', background: P.bg, color: P.dark, boxSizing: 'border-box' }
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 850, color: P.dark, marginBottom: 6 }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Step tabs */}
            <div style={{ display: 'flex', gap: 4, background: P.bg, borderRadius: 12, padding: 4, marginBottom: 24 }}>
                {[{ n: 1, label: 'Basic Info' }, { n: 2, label: 'Sections' }, { n: 3, label: 'Question Rules' }].map(s => (
                    <button key={s.n} onClick={() => setStep(s.n)} style={{
                        flex: 1, padding: '9px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        background: step === s.n ? '#fff' : 'transparent',
                        color: step === s.n ? P.brand : P.muted,
                        boxShadow: step === s.n ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: step === s.n ? P.brand : P.hover, color: step === s.n ? '#fff' : P.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>{s.n}</span>
                        {s.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* STEP 1 */}
                {step === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Template Name <span style={{ color: P.error }}>*</span></label>
                            <input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. CBSE 2024 Mathematics — Class 10"
                                style={{ ...fieldStyle, fontSize: 14, fontWeight: 700 }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Description</label>
                            <textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe this template — pattern, board, year, subjects covered..."
                                rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Category</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                {CATEGORIES.map(c => {
                                    const meta = CATEGORY_META[c]
                                    return (
                                        <button key={c} onClick={() => setForm({ ...form, category: c })} style={{
                                            padding: '10px 8px', borderRadius: 10, border: `1px solid ${form.category === c ? meta.color : P.border}`,
                                            background: form.category === c ? meta.bg : 'transparent', cursor: 'pointer',
                                            fontSize: 12, fontWeight: 750, color: form.category === c ? meta.color : P.muted,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                        }}>
                                            <meta.icon size={16} />
                                            {c}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Exam Type</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {EXAM_TYPES.map(et => (
                                    <button key={et} onClick={() => setForm({ ...form, exam_type: et })} style={{
                                        padding: '9px 14px', borderRadius: 9, border: `1px solid ${form.exam_type === et ? P.brand : P.border}`,
                                        background: form.exam_type === et ? P.brandBg : 'transparent', cursor: 'pointer',
                                        fontSize: 12, fontWeight: 750, color: form.exam_type === et ? P.brand : P.muted, textAlign: 'left',
                                    }}>
                                        {et}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Time Limit (minutes)</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={14} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="number" value={form.duration_minutes ?? 180}
                                    onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                                    style={{ ...fieldStyle, paddingLeft: 34 }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Total Marks</label>
                            <div style={{ position: 'relative' }}>
                                <Target size={14} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="number" value={form.total_marks ?? 100}
                                    onChange={e => setForm({ ...form, total_marks: parseInt(e.target.value) || 0 })}
                                    style={{ ...fieldStyle, paddingLeft: 34 }} />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Tags <span style={{ fontWeight: 500, color: P.muted }}>(comma separated)</span></label>
                            <input
                                value={(form.tags ?? []).join(', ')}
                                onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                placeholder="e.g. CBSE, 2024, Mathematics, Class 10"
                                style={fieldStyle} />
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontSize: 14, fontWeight: 850, color: P.dark }}>Sections ({sections.length})</div>
                            <button onClick={() => setSections([...sections, newSection(sections.length)])}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: P.successBg, color: P.success, padding: '9px 16px', borderRadius: 10, border: 'none', fontWeight: 850, fontSize: 12, cursor: 'pointer' }}>
                                <Plus size={14} /> Add Section
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {sections.map((s, idx) => (
                                <div key={idx} style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, color: P.muted, padding: 0, display: 'flex' }}><ChevronUp size={14} /></button>
                                            <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} style={{ background: 'none', border: 'none', cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === sections.length - 1 ? 0.3 : 1, color: P.muted, padding: 0, display: 'flex' }}><ChevronDown size={14} /></button>
                                        </div>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: P.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                                            {'ABCDEFGHIJ'[idx] ?? idx + 1}
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 850, color: P.dark, flex: 1 }}>{s.section_name}</span>
                                        <button onClick={() => setSections(sections.filter((_, i) => i !== idx))}
                                            style={{ background: P.errorBg, border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 7, color: P.error, display: 'flex' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>Section Name</label>
                                            <input value={s.section_name} onChange={e => updateSection(idx, { section_name: e.target.value })}
                                                style={{ ...fieldStyle, fontSize: 12 }} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>Section Type</label>
                                            <select value={s.section_type} onChange={e => updateSection(idx, { section_type: e.target.value as any })}
                                                style={{ ...fieldStyle, fontSize: 12 }}>
                                                {SECTION_TYPES.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 750, color: P.dark }}>
                                                <input type="checkbox" checked={s.optional_flag} onChange={e => updateSection(idx, { optional_flag: e.target.checked })}
                                                    style={{ width: 16, height: 16 }} />
                                                Optional Section
                                            </label>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ ...labelStyle, fontSize: 11 }}>Section Instructions <span style={{ fontWeight: 500, color: P.muted }}>(optional)</span></label>
                                            <input value={s.instructions ?? ''} onChange={e => updateSection(idx, { instructions: e.target.value })}
                                                placeholder="e.g. Attempt any 10 out of 12 questions."
                                                style={{ ...fieldStyle, fontSize: 12 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {sections.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: P.muted, fontWeight: 600, background: '#fff', borderRadius: 16, border: `1px dashed ${P.border}` }}>
                                    Click "Add Section" to build your exam structure (e.g. Section A, Physics, Part I)
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {sections.length === 0 && (
                            <div style={{ background: P.warningBg, border: `1px solid ${P.warning}30`, borderRadius: 14, padding: '16px', fontSize: 13, color: P.dark, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <AlertCircle size={16} color={P.warning} /> No sections defined. Go to Step 2 to add sections first.
                            </div>
                        )}
                        {sections.map((s, sIdx) => (
                            <div key={sIdx} style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 20px', background: P.bg, borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: P.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                                            {'ABCDEFGHIJ'[sIdx] ?? sIdx + 1}
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{s.section_name}</span>
                                        <span style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>• {s.section_type}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 12, fontWeight: 900, color: calcSectionTotal(s) > 0 ? P.brand : P.muted }}>
                                            Subtotal: <strong>{calcSectionTotal(s)}</strong> marks
                                        </span>
                                        <button onClick={() => {
                                            const ns = [...sections]; ns[sIdx] = { ...ns[sIdx], rules: [...ns[sIdx].rules, newRule()] }; setSections(ns)
                                        }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: P.successBg, color: P.success, padding: '6px 12px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                                            <Plus size={12} /> Add Rule
                                        </button>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 20px' }}>
                                    {s.rules.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: P.muted, fontSize: 12, fontWeight: 600 }}>
                                            No question rules yet. Click "Add Rule" to define question types for this section.
                                        </div>
                                    )}
                                    {s.rules.map((r, rIdx) => (
                                        <div key={rIdx} style={{ background: P.bg, borderRadius: 12, padding: '16px', marginBottom: 10, display: 'grid', gridTemplateColumns: '160px 70px 70px 70px 1fr 80px 36px', gap: 10, alignItems: 'end' }}>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 5 }}>Question Type</div>
                                                <select value={r.question_type} onChange={e => updateRule(sIdx, rIdx, { question_type: e.target.value as any })}
                                                    style={{ ...fieldStyle, fontSize: 12, padding: '8px 10px' }}>
                                                    {QUESTION_TYPES.map(qt => <option key={qt}>{qt}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 5 }}>Count</div>
                                                <input type="number" value={r.num_questions} onChange={e => updateRule(sIdx, rIdx, { num_questions: parseInt(e.target.value) || 0 })}
                                                    style={{ ...fieldStyle, fontSize: 13, padding: '8px', textAlign: 'center' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 5 }}>Marks/Q</div>
                                                <input type="number" step="0.5" value={r.marks_per_question} onChange={e => updateRule(sIdx, rIdx, { marks_per_question: parseFloat(e.target.value) || 0 })}
                                                    style={{ ...fieldStyle, fontSize: 13, padding: '8px', textAlign: 'center' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 5 }}>Neg.</div>
                                                <input type="number" step="0.25" value={r.negative_marks} onChange={e => updateRule(sIdx, rIdx, { negative_marks: parseFloat(e.target.value) || 0 })}
                                                    style={{ ...fieldStyle, fontSize: 13, padding: '8px', textAlign: 'center' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 5 }}>Difficulty % (Easy / Med / Hard)</div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <input type="number" value={r.difficulty_easy_pct} onChange={e => updateRule(sIdx, rIdx, { difficulty_easy_pct: parseInt(e.target.value) || 0 })}
                                                        style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', background: P.successBg, color: P.success, fontSize: 12, fontWeight: 800, textAlign: 'center', outline: 'none' }} />
                                                    <input type="number" value={r.difficulty_medium_pct} onChange={e => updateRule(sIdx, rIdx, { difficulty_medium_pct: parseInt(e.target.value) || 0 })}
                                                        style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', background: P.warningBg, color: P.warning, fontSize: 12, fontWeight: 800, textAlign: 'center', outline: 'none' }} />
                                                    <input type="number" value={r.difficulty_hard_pct} onChange={e => updateRule(sIdx, rIdx, { difficulty_hard_pct: parseInt(e.target.value) || 0 })}
                                                        style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', background: P.errorBg, color: P.error, fontSize: 12, fontWeight: 800, textAlign: 'center', outline: 'none' }} />
                                                    {(r.difficulty_easy_pct + r.difficulty_medium_pct + r.difficulty_hard_pct) !== 100 && (
                                                        <AlertCircle size={14} color={P.error} title="Must sum to 100%" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 5 }}>Int. Choice</div>
                                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: 36 }}>
                                                    <input type="checkbox" checked={r.internal_choice} onChange={e => updateRule(sIdx, rIdx, { internal_choice: e.target.checked })} style={{ width: 16, height: 16 }} />
                                                </label>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                <button onClick={() => {
                                                    const ns = [...sections]; ns[sIdx] = { ...ns[sIdx], rules: ns[sIdx].rules.filter((_, i) => i !== rIdx) }; setSections(ns)
                                                }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, padding: '8px 4px', display: 'flex' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Marks balance bar */}
                        {sections.length > 0 && (
                            <div style={{ background: balanced ? P.successBg : P.errorBg, border: `1px solid ${balanced ? P.success : P.error}30`, borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {balanced ? <CheckCircle2 size={18} color={P.success} /> : <AlertCircle size={18} color={P.error} />}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 900, color: P.dark }}>
                                            Marks Check: <strong style={{ color: balanced ? P.success : P.error }}>{grand}</strong> / {declared} declared
                                        </div>
                                        {!balanced && <div style={{ fontSize: 11, color: P.error, fontWeight: 700 }}>{diff > 0 ? `${diff} marks over` : `${Math.abs(diff)} marks short`}</div>}
                                    </div>
                                </div>
                                {!balanced && (
                                    <button onClick={autoBalance} style={{ background: P.brand, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                        Auto-Balance
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: `1px solid ${P.border}`, marginTop: 20 }}>
                <button onClick={onCancel} style={{ padding: '10px 20px', background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                    Cancel
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} style={{ padding: '10px 20px', background: P.hover, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ChevronLeft size={16} /> Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} style={{ padding: '10px 24px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button onClick={onSave} disabled={saving || !form.name?.trim()} style={{ padding: '10px 28px', background: !balanced && sections.length > 0 ? P.muted : P.success, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: !form.name?.trim() ? 0.5 : 1 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {isEdit ? 'Save Changes' : 'Save Template'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── PDF PREVIEW ───────────────────────────────────────────────────────────────
function PdfPreviewModal({ template, onClose }: { template: PaperTemplate; onClose: () => void }) {
    const handlePrint = () => window.print()
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: P.dark }}>Template Blueprint Preview</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                            <Printer size={15} /> Print / Save PDF
                        </button>
                        <button onClick={onClose} style={{ background: P.hover, border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={18} color={P.muted} />
                        </button>
                    </div>
                </div>
                <div id="template-print" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {/* Print Header */}
                    <div style={{ textAlign: 'center', borderBottom: `2px solid ${P.dark}`, paddingBottom: 16, marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>BeBrilliant Platform — Exam Format Template</div>
                        <div style={{ fontSize: 22, fontWeight: 950, color: P.dark, marginBottom: 4 }}>{template.name}</div>
                        <div style={{ fontSize: 13, color: P.text, fontWeight: 600 }}>{template.category} | {template.exam_type} | {template.duration_minutes} Minutes | {template.total_marks} Marks</div>
                    </div>
                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Category', value: template.category },
                            { label: 'Exam Type', value: template.exam_type },
                            { label: 'Duration', value: `${template.duration_minutes} minutes` },
                            { label: 'Total Marks', value: `${template.total_marks}` },
                            { label: 'Sections', value: `${(template.sections ?? []).length}` },
                            { label: 'Status', value: template.is_global ? 'Published' : 'Draft' },
                        ].map(r => (
                            <div key={r.label} style={{ background: P.bg, padding: '12px 16px', borderRadius: 10 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>{r.label}</div>
                                <div style={{ fontSize: 14, fontWeight: 850, color: P.dark }}>{r.value}</div>
                            </div>
                        ))}
                    </div>
                    {/* Sections */}
                    {(template.sections ?? []).map((s, si) => {
                        const totalQ = (s.rules ?? []).reduce((a, r: any) => a + r.num_questions, 0)
                        const subTotal = (s.rules ?? []).reduce((a, r: any) => a + (r.num_questions * r.marks_per_question), 0)
                        return (
                            <div key={si} style={{ marginBottom: 16 }}>
                                <div style={{ background: P.dark, color: '#fff', padding: '10px 16px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 900, fontSize: 14 }}>{s.section_name} — {s.section_type}</span>
                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{totalQ} Questions | {subTotal} Marks</span>
                                </div>
                                {s.instructions && (
                                    <div style={{ background: P.warningBg, padding: '8px 16px', fontSize: 12, color: P.dark, fontWeight: 600, borderLeft: `3px solid ${P.warning}` }}>
                                        Note: {s.instructions}
                                    </div>
                                )}
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ background: P.bg }}>
                                            {['Question Type', 'Count', 'Marks/Q', 'Neg.', 'Subtotal', 'Difficulty (E/M/H %)', 'Int. Choice'].map(h => (
                                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800, color: P.muted, borderBottom: `1px solid ${P.border}`, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(s.rules ?? []).map((r: any, ri: number) => (
                                            <tr key={ri} style={{ borderBottom: `1px solid ${P.border}` }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 700, color: P.dark }}>{r.question_type}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.num_questions}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.marks_per_question}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700, color: r.negative_marks > 0 ? P.error : P.muted }}>{r.negative_marks > 0 ? `-${r.negative_marks}` : '—'}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 900, color: P.brand }}>{r.num_questions * r.marks_per_question}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.difficulty_easy_pct}% / {r.difficulty_medium_pct}% / {r.difficulty_hard_pct}%</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.internal_choice ? '✓' : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    })}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.border}`, fontSize: 11, color: P.muted, fontWeight: 600, textAlign: 'center' }}>
                        Generated by BeBrilliant Platform — bebrilliant.in • Template v{template.version ?? 1}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ExamFormatTemplatesPage() {
    const [templates, setTemplates] = useState<PaperTemplate[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [presets, setPresets] = useState<Preset[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [sortBy, setSortBy] = useState('created_at')
    const [toast, setToast] = useState<ToastState>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<PaperTemplate | null>(null)
    const [pdfPreview, setPdfPreview] = useState<PaperTemplate | null>(null)
    const [wizardMode, setWizardMode] = useState<WizardMode>(null) // null=hidden, 'blank'=new blank, 'preset'=preset picker
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

    // Builder form state
    const [form, setForm] = useState<Partial<PaperTemplate>>(blankForm())
    const [sections, setSections] = useState<TemplateSection[]>([])
    const [isEdit, setIsEdit] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    // AI generation state
    const [aiTenantId, setAiTenantId] = useState('')
    const [aiSyllabusId, setAiSyllabusId] = useState('')
    const [aiRunning, setAiRunning] = useState(false)
    const [aiResult, setAiResult] = useState<any>(null)

    const showToast = useCallback((msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 4000)
    }, [])

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ sort: sortBy })
            if (search) params.set('search', search)
            if (categoryFilter !== 'All') params.set('category', categoryFilter)
            const [tRes, tenRes, preRes] = await Promise.all([
                fetch('/api/owner/exams/templates?' + params),
                fetch('/api/owner/tenants?limit=100'),
                fetch('/api/owner/exams/templates?list_presets=1'),
            ])
            const tData = await tRes.json()
            if (tRes.ok && Array.isArray(tData)) setTemplates(tData)
            const tenData = await tenRes.json()
            if (tenRes.ok && Array.isArray(tenData?.tenants ?? tenData)) setTenants(tenData?.tenants ?? tenData)
            const preData = await preRes.json()
            if (preRes.ok && Array.isArray(preData)) setPresets(preData)
        } finally { setLoading(false) }
    }, [search, categoryFilter, sortBy])

    useEffect(() => { fetchAll() }, [fetchAll])

    const selected = templates.find(t => t.id === selectedId) ?? null

    // Stats
    const stats = {
        total: templates.length,
        school: templates.filter(t => t.category === 'School').length,
        entrance: templates.filter(t => t.category === 'Entrance').length,
        competitive: templates.filter(t => t.category === 'Competitive').length,
        published: templates.filter(t => t.is_global).length,
    }

    const openEditMode = (t: PaperTemplate) => {
        setForm({ name: t.name, category: t.category, exam_type: t.exam_type, duration_minutes: t.duration_minutes, total_marks: t.total_marks, instructions: t.instructions, description: t.description, tags: t.tags ?? [], syllabus_node_id: t.syllabus_node_id })
        setSections((t.sections ?? []).map(s => ({ ...s, rules: s.rules ?? [] })))
        setIsEdit(true); setEditId(t.id); setActiveTab('builder')
    }

    const openNewBlank = () => {
        setForm(blankForm()); setSections([]); setIsEdit(false); setEditId(null)
        setWizardMode('blank'); setSelectedPreset(null); setSelectedId(null); setActiveTab('builder')
    }

    const handleSave = async () => {
        if (!form.name?.trim()) { showToast('Template name is required.', false); return }
        setSaving(true)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isEdit ? 'UPDATE_TEMPLATE' : 'CREATE_TEMPLATE',
                    id: editId,
                    template: form,
                    sections,
                })
            })
            const data = await res.json()
            if (res.ok) {
                showToast(isEdit ? 'Template updated.' : 'Template created!', true)
                setWizardMode(null); setIsEdit(false); setEditId(null)
                await fetchAll()
                if (data.template?.id) { setSelectedId(data.template.id); setActiveTab('overview') }
            } else {
                showToast(data.error || 'Save failed.', false)
            }
        } finally { setSaving(false) }
    }

    const handleDelete = async (t: PaperTemplate) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_TEMPLATE', id: t.id })
            })
            if (res.ok) {
                showToast(`"${t.name}" deleted.`, true); setDeleteConfirm(null)
                if (selectedId === t.id) setSelectedId(null)
                await fetchAll()
            } else {
                const d = await res.json(); showToast(d.error || 'Delete failed.', false)
            }
        } finally { setSaving(false) }
    }

    const handleClone = async (t: PaperTemplate) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CLONE_TEMPLATE', templateId: t.id })
            })
            const data = await res.json()
            if (res.ok) {
                showToast(`Cloned as "${data.template?.name}"`, true)
                await fetchAll()
                if (data.template?.id) setSelectedId(data.template.id)
            } else {
                const d = await res.json(); showToast(d.error || 'Clone failed.', false)
            }
        } finally { setSaving(false) }
    }

    const handlePublish = async (id: string, current: boolean) => {
        const res = await fetch('/api/owner/exams/templates', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'PUBLISH_TEMPLATE', id, is_published: !current })
        })
        if (res.ok) { showToast(!current ? 'Published to all tenants.' : 'Unpublished.', true); await fetchAll() }
        else showToast('Failed to update publish status.', false)
    }

    const handleAIGenerate = async () => {
        if (!selectedId) return
        if (!aiTenantId) { showToast('Please select a tenant to generate questions for.', false); return }
        setAiRunning(true); setAiResult(null)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'GENERATE_QUESTIONS', templateId: selectedId, tenantId: aiTenantId, syllabusNodeId: aiSyllabusId || undefined })
            })
            const data = await res.json()
            if (res.ok) { setAiResult(data); showToast(`${data.totalGenerated} questions added to question bank!`, true) }
            else showToast(data.error || 'Generation failed.', false)
        } finally { setAiRunning(false) }
    }

    const handleFromPreset = async (presetKey: string) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/exams/templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_FROM_PRESET', presetKey })
            })
            const data = await res.json()
            if (res.ok) {
                showToast(`Created from "${presets.find(p => p.key === presetKey)?.name ?? presetKey}" preset!`, true)
                setWizardMode(null); await fetchAll()
                if (data.template?.id) { setSelectedId(data.template.id); setActiveTab('overview') }
            } else showToast(data.error || 'Failed to create from preset.', false)
        } finally { setSaving(false) }
    }

    // Filtered + sorted
    const filtered = templates.filter(t => {
        const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = categoryFilter === 'All' || t.category === categoryFilter
        return matchSearch && matchCat
    })

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div style={{ background: P.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                * { box-sizing: border-box; }
                input:focus, select:focus, textarea:focus { border-color: ${P.brand} !important; outline: none; box-shadow: 0 0 0 3px ${P.brandBg}; }
                @media print {
                    body > *:not(#template-print) { display: none !important; }
                    #template-print { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
                }
            `}</style>
            <Toast toast={toast} />

            {/* PDF Preview */}
            {pdfPreview && <PdfPreviewModal template={pdfPreview} onClose={() => setPdfPreview(null)} />}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 40 }}>
                    <div style={{ width: 420, background: '#fff', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: P.errorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={28} color={P.error} /></div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 950, color: P.dark }}>Delete Template?</h3>
                        <p style={{ color: P.muted, fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                            This will permanently delete <strong>"{deleteConfirm.name}"</strong> and all its sections and rules. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 12, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, cursor: 'pointer', color: P.dark }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} style={{ flex: 2, padding: 12, background: P.error, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div style={{ padding: '28px 40px 0', background: '#fff', borderBottom: `1px solid ${P.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Syllabus & Exams</div>
                            <span style={{ color: P.border }}>›</span>
                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Exam Format Manager</div>
                        </div>
                        <h1 style={{ fontSize: 30, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Exam Format Templates</h1>
                        <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 500 }}>Define reusable exam blueprints — publish them so tenants can build exams instantly.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setWizardMode('preset')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.ctaBg, color: P.cta, border: `1px solid ${P.cta}30`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                            <Sparkles size={16} /> Quick Start
                        </button>
                        <button onClick={openNewBlank}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={16} strokeWidth={2.5} /> New Template
                        </button>
                    </div>
                </div>
                {/* Stats strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, paddingBottom: 24 }}>
                    <StatCard label="Total Templates" value={stats.total} icon={FileText} color={P.brand} bg={P.brandBg} />
                    <StatCard label="School Formats" value={stats.school} icon={GraduationCap} color={P.success} bg={P.successBg} />
                    <StatCard label="Entrance Formats" value={stats.entrance} icon={Trophy} color={P.cta} bg={P.ctaBg} />
                    <StatCard label="Competitive" value={stats.competitive} icon={Award} color={P.info} bg={P.infoBg} />
                    <StatCard label="Published" value={stats.published} icon={Globe} color={P.brand} bg={P.brandBg} />
                </div>
            </div>

            {/* BODY: 2-panel layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 220px)', overflow: 'hidden' }}>

                {/* LEFT: Template List */}
                <div style={{ borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
                    {/* Search + filter bar */}
                    <div style={{ padding: '16px', borderBottom: `1px solid ${P.border}` }}>
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <Search size={14} color={P.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                                style={{ width: '100%', padding: '9px 36px 9px 34px', borderRadius: 10, border: `1px solid ${P.border}`, fontSize: 13, fontWeight: 600, outline: 'none', background: P.bg, color: P.dark }} />
                            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={13} color={P.muted} /></button>}
                        </div>
                        <div style={{ display: 'flex', gap: 1, background: P.bg, borderRadius: 10, padding: 3, marginBottom: 10 }}>
                            {['All', 'School', 'Entrance', 'Competitive'].map(f => (
                                <button key={f} onClick={() => setCategoryFilter(f)} style={{
                                    flex: 1, padding: '6px 4px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s',
                                    background: categoryFilter === f ? '#fff' : 'transparent',
                                    color: categoryFilter === f ? P.dark : P.muted,
                                    boxShadow: categoryFilter === f ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                                }}>{f}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <SlidersHorizontal size={12} color={P.muted} />
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 11, fontWeight: 700, color: P.dark, background: P.bg, outline: 'none' }}>
                                <option value="created_at">Recently Created</option>
                                <option value="name">Name (A–Z)</option>
                                <option value="total_marks">Total Marks</option>
                                <option value="usage_count">Most Used</option>
                            </select>
                            <button onClick={() => fetchAll()} disabled={loading} style={{ background: P.hover, border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', display: 'flex' }}>
                                <RefreshCw size={13} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                            </button>
                        </div>
                    </div>

                    {/* Template list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                                <Loader2 size={28} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: P.muted }}>
                                <Layers size={32} color={P.muted} style={{ opacity: 0.4, marginBottom: 12 }} />
                                <div style={{ fontWeight: 800, fontSize: 14, color: P.dark, marginBottom: 6 }}>
                                    {search || categoryFilter !== 'All' ? 'No matches found' : 'No Templates Yet'}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>
                                    {search || categoryFilter !== 'All' ? 'Try adjusting your search or filter.' : 'Create your first template or use Quick Start presets.'}
                                </div>
                            </div>
                        ) : filtered.map(t => (
                            <TemplateCard
                                key={t.id} t={t}
                                selected={selectedId === t.id}
                                onSelect={() => { setSelectedId(t.id); setActiveTab('overview'); setWizardMode(null) }}
                                onClone={() => handleClone(t)}
                                onDelete={() => setDeleteConfirm(t)}
                                onPublish={() => handlePublish(t.id, !!t.is_global)}
                            />
                        ))}
                    </div>
                    <div style={{ padding: '10px 16px', borderTop: `1px solid ${P.border}`, fontSize: 11, color: P.muted, fontWeight: 600, textAlign: 'center' }}>
                        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* RIGHT: Detail Panel */}
                <div style={{ overflowY: 'auto', background: P.bg }}>

                    {/* PRESET PICKER WIZARD */}
                    {wizardMode === 'preset' && (
                        <div style={{ padding: '32px 40px', animation: 'fadeIn 0.3s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <button onClick={() => setWizardMode(null)} style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10, padding: '8px', cursor: 'pointer', display: 'flex' }}>
                                    <ArrowLeft size={16} color={P.muted} />
                                </button>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: P.dark }}>Quick Start with a Preset</h2>
                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Choose a preset to instantly create a pre-configured template.</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                                {presets.map(p => {
                                    const meta = CATEGORY_META[p.category] ?? CATEGORY_META.School
                                    const Icon = PRESET_ICONS[p.key] ?? BookOpen
                                    const isSelected = selectedPreset === p.key
                                    return (
                                        <div key={p.key} onClick={() => setSelectedPreset(isSelected ? null : p.key)}
                                            style={{
                                                background: '#fff', borderRadius: 20, padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                                                border: `2px solid ${isSelected ? meta.color : P.border}`,
                                                boxShadow: isSelected ? `0 4px 20px ${meta.color}20` : 'none',
                                            }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 14, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon size={24} color={meta.color} />
                                                </div>
                                                {isSelected && (
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Check size={14} color="#fff" />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: P.dark, marginBottom: 6 }}>{p.name}</div>
                                            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={12} /> {p.sections} sections</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={12} /> {p.total_marks} marks</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {p.duration_minutes}m</span>
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                <span style={{ background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{p.category}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={openNewBlank} style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1px solid ${P.border}`, background: '#fff', fontWeight: 800, cursor: 'pointer', color: P.dark, fontSize: 13 }}>
                                    Start Blank Instead
                                </button>
                                <button onClick={() => selectedPreset && handleFromPreset(selectedPreset)}
                                    disabled={!selectedPreset || saving}
                                    style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: selectedPreset ? P.brand : P.muted, color: '#fff', fontWeight: 800, cursor: selectedPreset ? 'pointer' : 'not-allowed', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                                    Create from Preset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BUILDER MODE */}
                    {(wizardMode === 'blank' || (isEdit && activeTab === 'builder')) && !wizardMode?.includes('preset') && (
                        <div style={{ padding: '32px 40px', animation: 'fadeIn 0.3s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Layers size={22} color={P.brand} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>{isEdit ? `Editing — ${selected?.name ?? ''}` : 'New Exam Template'}</h2>
                                    <p style={{ margin: 0, fontSize: 12, color: P.muted, fontWeight: 600 }}>Fill in basic info → add sections → define question rules</p>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <TemplateBuilder
                                    form={form} setForm={setForm}
                                    sections={sections} setSections={setSections}
                                    onSave={handleSave} onCancel={() => { setWizardMode(null); setIsEdit(false); setEditId(null) }}
                                    saving={saving} isEdit={isEdit}
                                />
                            </div>
                        </div>
                    )}

                    {/* NO SELECTION */}
                    {!selected && !wizardMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '40px', animation: 'fadeIn 0.3s' }}>
                            <div style={{ width: 100, height: 100, borderRadius: 28, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                <FileText size={44} color={P.brand} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 950, color: P.dark, margin: '0 0 10px' }}>Select a Template</h3>
                            <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, lineHeight: 1.6, maxWidth: 360, margin: '0 0 28px' }}>
                                Pick a template from the left panel to view its details, edit, or generate questions. Or create a new one.
                            </p>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setWizardMode('preset')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.ctaBg, color: P.cta, border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                                    <Sparkles size={15} /> Use a Preset
                                </button>
                                <button onClick={openNewBlank} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                                    <Plus size={15} /> Create Blank
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SELECTED TEMPLATE DETAIL */}
                    {selected && !wizardMode && (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            {/* Detail Header */}
                            <div style={{ background: '#fff', borderBottom: `1px solid ${P.border}`, padding: '20px 32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            {(() => { const meta = CATEGORY_META[selected.category] ?? CATEGORY_META.School; return (
                                                <div style={{ background: meta.bg, padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 900, color: meta.color, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <meta.icon size={12} /> {selected.category}
                                                </div>
                                            )})()}
                                            {selected.is_global && <div style={{ background: P.brandBg, padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 900, color: P.brand, display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={12} /> Published</div>}
                                            {selected.version && selected.version > 1 && <div style={{ background: P.hover, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, color: P.muted }}>v{selected.version}</div>}
                                        </div>
                                        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{selected.name}</h2>
                                        {selected.description && <p style={{ margin: 0, fontSize: 13, color: P.text, fontWeight: 500 }}>{selected.description}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 20 }}>
                                        <button onClick={() => setPdfPreview(selected)} title="Print / PDF" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: P.dark }}>
                                            <Printer size={14} />
                                        </button>
                                        <button onClick={() => handlePublish(selected.id, !!selected.is_global)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1px solid ${selected.is_global ? P.brand : P.border}`, background: selected.is_global ? P.brandBg : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: selected.is_global ? P.brand : P.dark }}>
                                            <Globe size={14} /> {selected.is_global ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button onClick={() => handleClone(selected)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: P.dark }}>
                                            <Copy size={14} /> Clone
                                        </button>
                                        <button onClick={() => openEditMode(selected)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1px solid ${P.border}`, background: P.brand, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#fff' }}>
                                            <Edit3 size={14} /> Edit
                                        </button>
                                    </div>
                                </div>
                                {/* Tab bar */}
                                <div style={{ display: 'flex', gap: 4, background: P.bg, borderRadius: 12, padding: 4, width: 'fit-content', marginTop: 16 }}>
                                    {[
                                        { key: 'overview', label: 'Overview', icon: Eye },
                                        { key: 'builder', label: 'Edit Builder', icon: SlidersHorizontal },
                                        { key: 'ai', label: 'AI Generate', icon: Sparkles },
                                    ].map(tab => (
                                        <button key={tab.key} onClick={() => { setActiveTab(tab.key as ActiveTab); if (tab.key === 'builder') openEditMode(selected) }}
                                            style={{
                                                padding: '8px 16px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                                background: activeTab === tab.key ? '#fff' : 'transparent',
                                                color: activeTab === tab.key ? P.brand : P.muted,
                                                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                            <tab.icon size={13} /> {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s' }}>
                                    {/* KPI row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                        {[
                                            { label: 'Duration', value: `${selected.duration_minutes}m`, icon: Clock, color: P.brand, bg: P.brandBg },
                                            { label: 'Total Marks', value: String(selected.total_marks), icon: Target, color: P.cta, bg: P.ctaBg },
                                            { label: 'Sections', value: String((selected.sections ?? []).length), icon: Layers, color: P.success, bg: P.successBg },
                                            { label: 'Times Used', value: String(selected.usage_count ?? 0), icon: BarChart3, color: P.info, bg: P.infoBg },
                                        ].map(k => (
                                            <div key={k.label} style={{ background: '#fff', borderRadius: 16, padding: '18px', border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <k.icon size={18} color={k.color} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>{k.label}</div>
                                                    <div style={{ fontSize: 20, fontWeight: 950, color: P.dark }}>{k.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tags */}
                                    {selected.tags && selected.tags.filter(t => !t.startsWith('preset:')).length > 0 && (
                                        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${P.border}` }}>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={12} /> Tags</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {selected.tags.filter(t => !t.startsWith('preset:')).map(tag => (
                                                    <span key={tag} style={{ background: P.brandBg, color: P.brand, padding: '5px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sections summary */}
                                    <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                        <div style={{ padding: '16px 20px', background: P.bg, borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: P.dark, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={15} color={P.brand} /> Sections & Rules</div>
                                            <div style={{ fontSize: 12, fontWeight: 900, color: P.brand }}>Total: {selected.total_marks} marks</div>
                                        </div>
                                        {(selected.sections ?? []).length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: P.muted, fontSize: 13, fontWeight: 600 }}>
                                                No sections defined. Click "Edit" to add sections and question rules.
                                            </div>
                                        ) : (
                                            <div>
                                                {(selected.sections ?? []).map((s, si) => {
                                                    const sTotal = calcSectionTotal(s as TemplateSection)
                                                    const totalQ = (s.rules ?? []).reduce((a, r: any) => a + r.num_questions, 0)
                                                    return (
                                                        <div key={si} style={{ borderBottom: si < (selected.sections ?? []).length - 1 ? `1px solid ${P.border}` : 'none' }}>
                                                            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: si % 2 === 0 ? '#fff' : P.bg }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <div style={{ width: 26, height: 26, borderRadius: 7, background: P.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                                                                        {'ABCDEFGHIJ'[si] ?? si + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 13, fontWeight: 850, color: P.dark }}>{s.section_name}</div>
                                                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{s.section_type} • {totalQ} questions{s.optional_flag ? ' • Optional' : ''}</div>
                                                                        {s.instructions && <div style={{ fontSize: 11, color: P.text, fontWeight: 600, fontStyle: 'italic', marginTop: 2 }}>"{s.instructions}"</div>}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: 14, fontWeight: 950, color: P.brand }}>{sTotal} marks</div>
                                                            </div>
                                                            {(s.rules ?? []).map((r: any, ri: number) => (
                                                                <div key={ri} style={{ padding: '8px 20px 8px 56px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${P.border}50` }}>
                                                                    <span style={{ fontSize: 11, fontWeight: 800, color: P.dark, minWidth: 120 }}>{r.question_type}</span>
                                                                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{r.num_questions}Q × {r.marks_per_question}M = <strong style={{ color: P.brand }}>{r.num_questions * r.marks_per_question}M</strong></span>
                                                                    {r.negative_marks > 0 && <span style={{ fontSize: 10, background: P.errorBg, color: P.error, padding: '2px 7px', borderRadius: 6, fontWeight: 800 }}>-{r.negative_marks}</span>}
                                                                    <span style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>E:{r.difficulty_easy_pct}% M:{r.difficulty_medium_pct}% H:{r.difficulty_hard_pct}%</span>
                                                                    {r.internal_choice && <span style={{ fontSize: 10, background: P.successBg, color: P.success, padding: '2px 7px', borderRadius: 6, fontWeight: 800 }}>Internal Choice</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta info */}
                                    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${P.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { label: 'Exam Type', value: selected.exam_type },
                                            { label: 'Version', value: `v${selected.version ?? 1}` },
                                            { label: 'Created', value: new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                                            { label: 'Last Used', value: selected.last_used_at ? new Date(selected.last_used_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never' },
                                        ].map(r => (
                                            <div key={r.label}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>{r.label}</div>
                                                <div style={{ fontSize: 14, fontWeight: 850, color: P.dark }}>{r.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BUILDER TAB (inline edit) */}
                            {activeTab === 'builder' && isEdit && (
                                <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s' }}>
                                    <TemplateBuilder
                                        form={form} setForm={setForm}
                                        sections={sections} setSections={setSections}
                                        onSave={handleSave} onCancel={() => { setIsEdit(false); setEditId(null); setActiveTab('overview') }}
                                        saving={saving} isEdit={true}
                                    />
                                </div>
                            )}

                            {/* AI GENERATE TAB */}
                            {activeTab === 'ai' && (
                                <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                                        <div style={{ padding: '20px', background: `linear-gradient(135deg, ${P.ctaBg}, ${P.brandBg})`, borderBottom: `1px solid ${P.border}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${P.cta}20` }}>
                                                    <Sparkles size={24} color={P.cta} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>AI Question Generator</div>
                                                    <div style={{ fontSize: 12, color: P.text, fontWeight: 600 }}>Generates questions per section rule and adds to a tenant's question bank</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {/* Tenant Picker */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 850, color: P.dark, marginBottom: 6 }}>
                                                    <Building2 size={12} style={{ marginRight: 5 }} />
                                                    Target Tenant Question Bank <span style={{ color: P.error }}>*</span>
                                                </label>
                                                <select value={aiTenantId} onChange={e => setAiTenantId(e.target.value)}
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${P.border}`, fontSize: 13, fontWeight: 600, outline: 'none', background: P.bg }}>
                                                    <option value="">— Select a tenant —</option>
                                                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                                                </select>
                                                <div style={{ fontSize: 11, color: P.muted, marginTop: 5, fontWeight: 600 }}>Questions will be created in this tenant's question bank.</div>
                                            </div>
                                            {/* Syllabus context (optional) */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 850, color: P.dark, marginBottom: 6 }}>
                                                    Syllabus Node ID <span style={{ fontWeight: 500, color: P.muted }}>(optional — for topic-specific questions)</span>
                                                </label>
                                                <input value={aiSyllabusId} onChange={e => setAiSyllabusId(e.target.value)}
                                                    placeholder="Paste a syllabus node UUID for contextual questions..."
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${P.border}`, fontSize: 13, fontWeight: 600, outline: 'none', background: P.bg }} />
                                            </div>
                                            {/* What will be generated */}
                                            <div style={{ background: P.bg, borderRadius: 14, padding: '16px' }}>
                                                <div style={{ fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>What will be generated</div>
                                                {(selected.sections ?? []).length === 0 ? (
                                                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>This template has no sections yet. Add sections in the Builder tab first.</div>
                                                ) : (selected.sections ?? []).map((s, si) => {
                                                    const totalQ = (s.rules ?? []).reduce((a, r: any) => a + r.num_questions, 0)
                                                    return (
                                                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.dark, marginBottom: 6 }}>
                                                            <CheckCircle2 size={14} color={P.success} />
                                                            <span><strong>{s.section_name}</strong> — {totalQ} questions across {(s.rules ?? []).length} rule{(s.rules ?? []).length !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {/* Warning */}
                                            <div style={{ background: P.infoBg, border: `1px solid ${P.info}30`, borderRadius: 12, padding: '12px 16px', fontSize: 12, color: P.dark, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                <Info size={14} color={P.info} style={{ flexShrink: 0, marginTop: 1 }} />
                                                Generation runs section by section and may take 30–90 seconds. Questions are saved directly to the tenant's question bank. If AI is unavailable, placeholder questions will be created for manual editing.
                                            </div>
                                            {/* Generate Button */}
                                            <button onClick={handleAIGenerate} disabled={aiRunning || !aiTenantId || (selected.sections ?? []).length === 0}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: aiRunning ? P.muted : P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 850, cursor: aiRunning ? 'wait' : 'pointer', width: '100%' }}>
                                                {aiRunning ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating Questions...</> : <><Zap size={18} /> Generate Question Bank</>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* AI Result */}
                                    {aiResult && (
                                        <div style={{ background: P.successBg, border: `1px solid ${P.success}30`, borderRadius: 18, padding: '20px 24px', animation: 'slideUp 0.4s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                <CheckCircle2 size={20} color={P.success} />
                                                <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>Generation Complete!</div>
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: P.dark, marginBottom: 12 }}>
                                                {aiResult.totalGenerated} questions created successfully
                                            </div>
                                            {(aiResult.sections ?? []).map((s: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: P.text, padding: '4px 0', borderBottom: `1px solid ${P.border}40` }}>
                                                    <span>{s.sectionName}</span>
                                                    <span style={{ color: P.success }}>{s.questionCount} questions</span>
                                                </div>
                                            ))}
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 10 }}>{aiResult.message}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
