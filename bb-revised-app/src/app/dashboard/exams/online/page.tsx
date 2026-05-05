'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    ClipboardList, Search, PlusCircle, UploadCloud, Download, CheckCircle, XCircle,
    MoreVertical, ArrowLeft, Loader2, PlayCircle, PauseCircle, Save, Printer, Key, Settings,
    FileText, CheckSquare, Layers, Sparkles, BookOpen, Clock, Calendar, Check, X, ArrowRight, Users,
    Zap, Target, Shield, LayoutDashboard, Database, AlertCircle, ChevronRight, Eye, Globe, RefreshCw, Building2, TrendingUp, DollarSign, Trash2
} from 'lucide-react'
import Link from 'next/link'

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
type Exam = { 
    id: string; name: string; description?: string; is_paid: boolean; price: number; 
    is_active: boolean; created_at: string; duration?: number; 
    user_profiles?: { first_name: string; last_name: string }; 
    exam_config?: { total_questions: number; randomization_mode: string } 
}
type Node = { id: string; name: string; type: string; parent_id: string | null }

// —— UI COMPONENTS —————————————————————————————————
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 24, right: 32, background: ok ? P.successBg : P.errorBg, border: '1px solid ' + (ok ? P.success : P.error) + '40', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', zIndex: 10000, animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)', backdropFilter: 'blur(10px)' }}>
            {ok ? <CheckCircle size={20} color={P.success} strokeWidth={2.5} /> : <XCircle size={20} color={P.error} strokeWidth={2.5} />}
            <span style={{ fontSize: 14, fontWeight: 800, color: ok ? P.success : P.error }}>{msg}</span>
            <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', opacity: 0.6 }} className="hover-lift"><X size={16} color={ok ? P.success : P.error} /></button>
        </div>
    )
}

function MetricCard({ icon: Icon, label, value, sub, color, bg }: any) {
    return (
        <div className="glass-card hover-lift" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}20` }}>
                    <Icon size={24} color={color} strokeWidth={2.5} />
                </div>
            </div>
            <div>
                <div style={{ fontSize: 12, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 32, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>{value}</div>
            </div>
        </div>
    )
}

export default function AssessmentManagement() {
    const [view, setView] = useState<'list' | 'builder'>('list')
    const [step, setStep] = useState(1) 
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    
    const [exams, setExams] = useState<Exam[]>([])
    const [search, setSearch] = useState('')
    const [editExamId, setEditExamId] = useState<string|null>(null)
    const [syllabuses, setSyllabuses] = useState<Node[]>([])
    const [allNodes, setAllNodes] = useState<Node[]>([])

    const [s1, setS1] = useState({
        name: '', description: '', mode: 'online', pricing_type: 'free', price: 0,
        schedule: 'live', liveDate: '', liveTime: '', duration: 60, targetStandards: [] as string[]
    })
    const [s2, setS2] = useState({ syllabusId: '', subjectsConfig: [] as any[] })
    const [mockQuestions, setMockQuestions] = useState<any[]>([])
    const [approvedQs, setApprovedQs] = useState<Set<number>>(new Set())
    
    const [showMarketplace, setShowMarketplace] = useState(false)
    const [marketTemplates, setMarketTemplates] = useState<any[]>([])

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 4000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [exRes, sylRes] = await Promise.all([
                fetch('/api/dashboard/exams/online').then(r => r.json()),
                fetch('/api/dashboard/syllabus').then(r => r.json())
            ])
            setExams(exRes?.exams || [])
            const nodes = Array.isArray(sylRes?.nodes) ? sylRes.nodes : []
            setAllNodes(nodes)
            setSyllabuses(nodes.filter((n: any) => n.type === 'board'))
        } catch (e) { showToast('Sync failed', false) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const fetchMarketplace = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/online?action=GET_TEMPLATES')
            const data = await res.json()
            setMarketTemplates(data || [])
            setShowMarketplace(true)
        } finally { setLoading(false) }
    }

    const loadTemplate = (tmpl: any) => {
        setS1({
            ...s1,
            name: `${tmpl.name} (Blueprint)`,
            duration: tmpl.duration_minutes,
            description: tmpl.instructions?.join('\n') || ''
        } as any)
        
        const configs = tmpl.sections.flatMap((s: any) => 
            s.rules.map((r: any) => ({
                id: Math.random().toString(36).substr(2, 9), 
                name: `${s.section_name} • ${r.question_type}`,
                qCount: r.num_questions,
                mark: r.marks_per_question,
                negMark: r.negative_marks,
                diffEasy: r.difficulty_easy_pct,
                diffMed: r.difficulty_medium_pct,
                diffHard: r.difficulty_hard_pct
            }))
        )

        setS2({ ...s2, subjectsConfig: configs })
        setShowMarketplace(false)
        setView('builder')
        setStep(1)
        showToast('Template Architecture Synced!', true)
    }

    const generateQuestions = async () => {
        if (!s2.syllabusId) return showToast('Please select a reference syllabus node', false)
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_QUESTIONS',
                    payload: {
                        total_nodes: s2.subjectsConfig.reduce((a, c) => a + Number(c.qCount || 0), 0),
                        syllabus_name: syllabuses.find(s => s.id === s2.syllabusId)?.name || 'General',
                        subjects: s2.subjectsConfig,
                        language: 'English',
                        format: 'OBJECTIVE_ONLY' // Strict objective enforcement
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setMockQuestions(data.questions || [])
            setApprovedQs(new Set((data.questions || []).map((_: any, i: number) => i)))
            setStep(3)
            showToast('AI Questions Ready!', true)
        } catch (e: any) { showToast(e.message, false) }
        finally { setSaving(false) }
    }

    const handleFinalize = async () => {
        setSaving(true)
        try {
            const totalMarks = s2.subjectsConfig.reduce((a, c) => a + (Number(c.qCount) * Number(c.mark)), 0)
            const payload = {
                id: editExamId, title: s1.name, status: 'publish',
                total_marks: totalMarks, duration: s1.duration, 
                pricing_type: s1.pricing_type, price: s1.price,
                instructions: s1.description,
                blueprint: {
                    ...s1, ...s2, questions: mockQuestions.filter((_, i) => approvedQs.has(i))
                }
            }
            const res = await fetch('/api/dashboard/exams/online', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: editExamId ? 'UPDATE_EXAM' : 'CREATE_EXAM', payload })
            })
            if (res.ok) {
                showToast('Online Exam Published!', true)
                setView('list'); fetchData()
            }
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('This exam will be permanently removed. Proceed?')) return
        await fetch('/api/dashboard/exams/online', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE_EXAM', payload: { id } })
        })
        fetchData(); showToast('Exam Deleted', true)
    }

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: P.bg, gap: 20 }}>
            <Loader2 size={48} color={P.brand} style={{ animation: 'spin 1.5s linear infinite' }} />
            <div style={{ fontSize: 16, fontWeight: 900, color: P.brand, letterSpacing: '0.1em' }}>REFINING CORE ENGINE...</div>
        </div>
    )

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px 40px', fontFamily: 'Inter, sans-serif' }}>
            <style>{`.hover-lift { transition: all 0.2s; } .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }`}</style>
            
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {showMarketplace && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: 40 }}>
                    <div style={{ width: '100%', maxWidth: 1000, background: '#fff', borderRadius: 32, display: 'flex', flexDirection: 'column', maxHeight: '90%', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '32px 40px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: P.dark }}>Assessment Marketplace</h2>
                                <p style={{ margin: '8px 0 0', fontSize: 15, color: P.muted, fontWeight: 600 }}>Standardized patterns from global education boards.</p>
                            </div>
                            <button onClick={() => setShowMarketplace(false)} style={{ background: '#fff', border: 'none', borderRadius: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                            {marketTemplates.map(t => (
                                <div key={t.id} className="hover-lift" style={{ border: '1px solid ' + P.border, borderRadius: 24, padding: 24, cursor: 'pointer', background: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ background: P.brandBg, color: P.brand, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, width: 'fit-content' }}>{t.category.toUpperCase()}</div>
                                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>{t.name}</h3>
                                    <div style={{ display: 'flex', gap: 12, color: P.muted, fontSize: 12, fontWeight: 700 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14}/> {t.duration_minutes}m</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14}/> {t.total_marks}pts</div>
                                    </div>
                                    <button onClick={() => loadTemplate(t)} style={{ width: '100%', padding: '14px', background: P.brand, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13, marginTop: 'auto' }}>Deploy Template</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'list' ? (
                <>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ background: P.successBg, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.success, textTransform: 'uppercase' }}>Online Exam Portal</div>
                                <div style={{ background: P.ctaBg, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.cta, textTransform: 'uppercase' }}>Objective Only</div>
                            </div>
                            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>Online Exam Engine</h1>
                            <p style={{ margin: '8px 0 0', fontSize: 16, color: P.muted, fontWeight: 600 }}>Provision, monitor, and monetize online assessments with real-time AI evaluation.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={fetchMarketplace} className="hover-lift" style={{ background: '#fff', border: '2px solid ' + P.brand, color: P.brand, padding: '14px 28px', borderRadius: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <Globe size={20} strokeWidth={2.5} /> Blueprint Library
                            </button>
                            <button onClick={() => { setView('builder'); setStep(1); setEditExamId(null); setMockQuestions([]) }} className="hover-lift" style={{ background: P.brand, color: '#fff', padding: '14px 28px', borderRadius: 14, border: 'none', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 24px ' + P.brand + '30' }}>
                                + Launch Online Exam
                            </button>
                        </div>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                        <MetricCard icon={Zap} label="Online Vectors" value={String(exams.length)} color={P.brand} bg={P.brandBg} />
                        <MetricCard icon={CheckCircle} label="Live Sessions" value={String(exams.filter(e => e.is_active).length)} color={P.success} bg={P.successBg} />
                        <MetricCard icon={DollarSign} label="Exam Revenue" value="₹0" color={P.cta} bg={P.ctaBg} />
                        <MetricCard icon={Shield} label="Integrity Score" value="99.9%" color={P.info} bg={P.infoBg} />
                    </div>

                    <div style={{ background: P.card, borderRadius: 24, border: '1px solid ' + P.border, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.03)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: 340 }}>
                                <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter exams..." style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid ' + P.border, background: P.bg, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                            </div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, textAlign: 'left', fontSize: 12, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '18px 28px' }}>Exam Blueprint</th>
                                    <th style={{ padding: '18px 28px' }}>Configuration</th>
                                    <th style={{ padding: '18px 28px' }}>Status</th>
                                    <th style={{ padding: '18px 28px', textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(ex => (
                                    <tr key={ex.id} style={{ borderBottom: '1px solid ' + P.border }}>
                                        <td style={{ padding: '20px 28px' }}>
                                            <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>{ex.name}</div>
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 4 }}>Added: {new Date(ex.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '20px 28px' }}>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <span style={{ padding: '4px 10px', background: P.infoBg, color: P.info, borderRadius: 8, fontSize: 11, fontWeight: 850 }}>{ex.duration} Mins</span>
                                                <span style={{ padding: '4px 10px', background: P.brandBg, color: P.brand, borderRadius: 8, fontSize: 11, fontWeight: 850 }}>{ex.exam_config?.total_questions || 0} Vectors</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 28px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ex.is_active ? P.success : P.muted }} />
                                                <span style={{ fontSize: 13, fontWeight: 800, color: ex.is_active ? P.success : P.muted }}>{ex.is_active ? 'Live Node' : 'Draft Mode'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 28px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleDelete(ex.id)} style={{ padding: 10, borderRadius: 10, background: P.errorBg, color: P.error, border: 'none', cursor: 'pointer' }} className="hover-lift"><Trash2 size={16} /></button>
                                                <button style={{ padding: '10px 20px', background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 850, fontSize: 13, cursor: 'pointer' }} className="hover-lift">Open Portal</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'slideUp 0.4s' }}>
                    <header style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
                        <button onClick={() => setView('list')} style={{ background: '#fff', border: '1px solid ' + P.border, padding: 12, borderRadius: 14, cursor: 'pointer' }} className="hover-lift"><ArrowLeft size={20} /></button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: P.dark }}>Institutional Exam Builder</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: P.muted, fontWeight: 600 }}>Step {step} of 3 — {step === 1 ? 'Core Parameters' : step === 2 ? 'Question Architecture' : 'Final Validation'}</p>
                        </div>
                    </header>

                    <div style={{ background: '#fff', borderRadius: 32, padding: 40, border: '1px solid ' + P.border, boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}>
                        {step === 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 850, color: P.dark, marginBottom: 10 }}>Assessment Title</label>
                                        <input value={s1.name} onChange={e => setS1({...s1, name: e.target.value})} placeholder="e.g. Semi-Final Mathematics" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontSize: 15, fontWeight: 600, outline: 'none', background: P.bg }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 14, fontWeight: 850, color: P.dark, marginBottom: 10 }}>Session Duration (m)</label>
                                            <input type="number" value={s1.duration} onChange={e => setS1({...s1, duration: parseInt(e.target.value)})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontSize: 15, fontWeight: 600, background: P.bg }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 14, fontWeight: 850, color: P.dark, marginBottom: 10 }}>Monetization Hub</label>
                                            <div style={{ display: 'flex', gap: 8, background: P.bg, padding: 4, borderRadius: 12 }}>
                                                <button onClick={() => setS1({...s1, pricing_type: 'free'})} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: s1.pricing_type === 'free' ? P.brand : 'transparent', color: s1.pricing_type === 'free' ? '#fff' : P.muted, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Free</button>
                                                <button onClick={() => setS1({...s1, pricing_type: 'paid'})} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: s1.pricing_type === 'paid' ? P.brand : 'transparent', color: s1.pricing_type === 'paid' ? '#fff' : P.muted, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Paid</button>
                                            </div>
                                        </div>
                                    </div>
                                    {s1.pricing_type === 'paid' && (
                                        <div style={{ animation: 'slideDown 0.3s' }}>
                                            <label style={{ display: 'block', fontSize: 14, fontWeight: 850, color: P.dark, marginBottom: 10 }}>Assessment Price (₹)</label>
                                            <input type="number" value={s1.price} onChange={e => setS1({...s1, price: parseInt(e.target.value)})} placeholder="0.00" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.brand, fontSize: 15, fontWeight: 800, outline: 'none', background: '#fff' }} />
                                        </div>
                                    )}
                                    <button onClick={() => setStep(2)} style={{ width: 'fit-content', padding: '16px 40px', background: P.brand, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 15, cursor: 'pointer', marginTop: 20 }}>Next Architecture Stage <ChevronRight size={18} style={{ marginLeft: 8 }} /></button>
                                </div>
                                <div style={{ background: P.bg, borderRadius: 24, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}><CheckSquare size={32} color={P.brand} /></div>
                                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Production Guard</h4>
                                    <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.6, margin: '12px 0 0', fontWeight: 500 }}>Only Objective questions are allowed in this flow for instant evaluation.</p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 850, color: P.dark, marginBottom: 12 }}>Reference Syllabus Node</label>
                                    <select value={s2.syllabusId} onChange={e => setS2({...s2, syllabusId: e.target.value})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontSize: 14, fontWeight: 700, background: P.bg }}>
                                        <option value="">Select Target Board/Standard...</option>
                                        {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>Blueprinted Rules</h4>
                                    {s2.subjectsConfig.map((sub, idx) => (
                                        <div key={idx} style={{ padding: 24, background: P.bg, borderRadius: 20, border: '1px solid ' + P.border, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 20, alignItems: 'center' }}>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{sub.name}</div>
                                            <div><label style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Qty</label><input type="number" value={sub.qCount} onChange={e => { const nc = [...s2.subjectsConfig]; nc[idx].qCount = e.target.value; setS2({...s2, subjectsConfig: nc }) }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid ' + P.border }} /></div>
                                            <div><label style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Mark</label><input type="number" value={sub.mark} onChange={e => { const nc = [...s2.subjectsConfig]; nc[idx].mark = e.target.value; setS2({...s2, subjectsConfig: nc }) }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid ' + P.border }} /></div>
                                            <div><label style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>Neg.</label><input type="number" value={sub.negMark} onChange={e => { const nc = [...s2.subjectsConfig]; nc[idx].negMark = e.target.value; setS2({...s2, subjectsConfig: nc }) }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid ' + P.border }} /></div>
                                        </div>
                                    ))}
                                    <button onClick={() => setS2({...s2, subjectsConfig: [...s2.subjectsConfig, { name: 'Custom Section', qCount: 10, mark: 4, negMark: 1 }]})} style={{ padding: 16, border: '1px dashed ' + P.brand, borderRadius: 16, background: P.brandBg, color: P.brand, fontWeight: 850, cursor: 'pointer' }}>+ Add Custom Structural Node</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                                    <button onClick={() => setStep(1)} style={{ padding: '16px 32px', border: '1px solid ' + P.border, borderRadius: 16, fontWeight: 800, cursor: 'pointer' }}>Back</button>
                                    <button onClick={generateQuestions} disabled={saving} style={{ padding: '16px 40px', background: P.brand, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                        {saving ? <Loader2 size={20} className="spin" /> : <Sparkles size={20} />} Run AI Question Pipeline
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                <div style={{ background: P.successBg, border: '1px solid ' + P.success + '30', padding: 24, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <CheckCircle size={32} color={P.success} />
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.success }}>Generation Complete</h4>
                                        <p style={{ margin: '4px 0 0', fontSize: 14, color: P.success, fontWeight: 600 }}>{mockQuestions.length} Questions matched your architectural constraints.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                                    {mockQuestions.map((q, i) => (
                                        <div key={i} style={{ padding: '20px', background: P.bg, borderRadius: 16, border: '1px solid ' + P.border, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                            <input type="checkbox" checked={approvedQs.has(i)} onChange={() => { const n = new Set(approvedQs); n.has(i) ? n.delete(i) : n.add(i); setApprovedQs(n); }} style={{ width: 22, height: 22, borderRadius: 6, marginTop: 4 }} />
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: P.dark, lineHeight: 1.5 }}>{q.text}</div>
                                                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>{q.options?.map((o: any, oi: number) => <span key={oi} style={{ fontSize: 12, fontWeight: 600, background: '#fff', padding: '4px 10px', borderRadius: 6, border: '1px solid ' + P.border }}>{o}</span>)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <button onClick={() => setStep(2)} style={{ padding: '16px 32px', border: '1px solid ' + P.border, borderRadius: 16, fontWeight: 800 }}>Back</button>
                                    <button onClick={handleFinalize} disabled={saving} style={{ padding: '16px 48px', background: P.success, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px ' + P.success + '30' }}>
                                        {saving ? <Loader2 size={22} className="spin" /> : <Shield size={20} />} Launch Assessment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}


