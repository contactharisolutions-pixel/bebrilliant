'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    Printer, FileText, Download, Share2, PlusCircle, LayoutDashboard,
    Search, ArrowLeft, Loader2, BookOpen, Target, Clock, ChevronRight,
    Zap, Sparkles, Database, Settings, Shield, Globe, Building2, Trash2
} from 'lucide-react'
// —— PALETTE ————————————————————————————————————
const P = {
    bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
    brand: '#004B93', brandBg: '#004B9310',
    cta: '#8B5CF6', ctaBg: '#F5F3FF',
    dark: '#0F172A', text: '#475569', muted: '#94A3B8',
    success: '#10B981', successBg: '#D1FAE5',
    error: '#EF4444', errorBg: '#FEE2E2',
    info: '#0EA5E9', infoBg: '#E0F2FE',
}
export default function OfflinePaperManager() {
    const [view, setView] = useState<'list' | 'builder'>('list')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [papers, setPapers] = useState<any[]>([])
    const [syllabuses, setSyllabuses] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [form, setForm] = useState({
        title: '', syllabusId: '', templateId: '', marks: 100, duration: 180
    })
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [exRes, sylRes, tmplRes] = await Promise.all([
                fetch('/api/dashboard/exams/offline').then(r => r.json()),
                fetch('/api/dashboard/syllabus').then(r => r.json()),
                fetch('/api/dashboard/exams/offline?action=GET_TEMPLATES').then(r => r.json())
            ])
            setPapers(exRes?.exams || [])
            setTemplates(Array.isArray(tmplRes) ? tmplRes : [])
            setSyllabuses(Array.isArray(sylRes?.nodes) ? sylRes.nodes.filter((n: any) => n.type === 'board') : [])
        } catch (e) {
            console.error('Fetch error:', e)
        } finally {
            setLoading(false)
        }
    }, [])
    useEffect(() => { fetchData() }, [fetchData])
    const handleCreate = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_EXAM', payload: form })
            })
            if (res.ok) {
                setView('list')
                fetchData()
            }
        } finally {
            setSaving(false)
        }
    }
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: P.bg }}>
            <Loader2 size={40} className="spin" color={P.brand} />
        </div>
    )
    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
            {view === 'list' && (
                <>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ background: P.ctaBg, color: P.cta, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>DESCRIPTIVE PAPER ENGINE</div>
                            </div>
                            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: P.dark }}>Offline Exam Papers</h1>
                            <p style={{ margin: '8px 0 0', color: P.muted, fontWeight: 500 }}>Generate, print, and archive descriptive examinations using custom patterns.</p>
                        </div>
                        <button onClick={() => setView('builder')} className="hover-lift" style={{ background: P.brand, color: '#fff', padding: '14px 28px', borderRadius: 16, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Printer size={20} /> Generate New Paper
                        </button>
                    </header>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                        <Metric icon={FileText} label="Generated Papers" value={String(papers.length)} color={P.brand} />
                        <Metric icon={Printer} label="Printed Assets" value="0" color={P.cta} />
                        <Metric icon={Target} label="Question Pool" value="12k+" color={P.success} />
                        <Metric icon={Shield} label="Archived Exam" value="0" color={P.info} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {papers.map(p => (
                            <div key={p.id} className="hover-lift" style={{ background: P.card, borderRadius: 24, padding: 32, border: '1px solid ' + P.border, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: 48, height: 48, background: P.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={22} color={P.brand} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 900, color: P.muted }}>ID: {p.id.split('-')[0].toUpperCase()}</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark }}>{p.title}</h3>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, fontWeight: 700, color: P.muted }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> {p.total_marks} Marks</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {p.duration || 180}m</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                                    <button 
                                        onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=paper`, '_blank')}
                                        style={{ width: '100%', padding: '12px', borderRadius: 12, background: P.brand, color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        <Printer size={16}/> Print Question Paper
                                    </button>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <button 
                                            onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=key`, '_blank')}
                                            style={{ padding: '10px', borderRadius: 12, background: P.bg, color: P.brand, border: '1px solid ' + P.brand, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                                        >
                                            Answer Key
                                        </button>
                                        <button 
                                            onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=solution`, '_blank')}
                                            style={{ padding: '10px', borderRadius: 12, background: P.infoBg, color: P.info, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                                        >
                                            Solution Set
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {view === 'builder' && (
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <header style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 40 }}>
                        <button onClick={() => setView('list')} style={{ background: P.card, border: '1px solid ' + P.border, padding: 12, borderRadius: 14, cursor: 'pointer' }}><ArrowLeft size={20} /></button>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>Descriptive Paper Generator</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: P.muted, fontWeight: 600 }}>Configure structural constraints for the physical paper.</p>
                        </div>
                    </header>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
                        <div style={{ background: P.card, borderRadius: 32, padding: 48, border: '1px solid ' + P.border, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Paper Headline</label>
                                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Annual Term 2 - Mathematics" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, outline: 'none', background: P.bg }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Select Reference Pattern</label>
                                <select value={form.templateId} onChange={e => setForm({...form, templateId: e.target.value})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, background: P.bg }}>
                                    <option value="">Standard Pattern...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Total Marks</label>
                                    <input type="number" value={form.marks} onChange={e => setForm({...form, marks: parseInt(e.target.value)})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, background: P.bg }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Time Limit (m)</label>
                                    <input type="number" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, background: P.bg }} />
                                </div>
                            </div>
                            <button onClick={handleCreate} disabled={saving} style={{ marginTop: 20, padding: '18px', background: P.brand, color: '#fff', border: 'none', borderRadius: 18, fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                {saving ? <Loader2 size={24} className="spin" /> : <Sparkles size={22} />} Compile & Generate Paper
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {form.templateId && templates.find(t => t.id === form.templateId) && (
                                <div style={{ background: P.brandBg, borderRadius: 24, padding: 32, border: '1px solid ' + P.brand + '20' }}>
                                    <h4 style={{ margin: 0, color: P.brand, fontWeight: 900, fontSize: 18 }}>Pattern Architecture</h4>
                                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                                            <span style={{ color: P.muted }}>Category</span>
                                            <span style={{ color: P.brand }}>{templates.find(t => t.id === form.templateId).category}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                                            <span style={{ color: P.muted }}>Marking Mode</span>
                                            <span style={{ color: P.brand }}>{templates.find(t => t.id === form.templateId).exam_type}</span>
                                        </div>
                                        <hr style={{ border: 'none', borderTop: '1px dashed ' + P.brand + '30', margin: '4px 0' }} />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            <span style={{ background: P.successBg, color: P.success, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>🟢 ONLINE READY</span>
                                            <span style={{ background: P.infoBg, color: P.info, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>🔵 OFFLINE READY</span>
                                            {templates.find(t => t.id === form.templateId).exam_type === 'Objective' && (
                                                <span style={{ background: P.ctaBg, color: P.cta, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>🟡 OMR COMPATIBLE</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{ background: P.ctaBg, borderRadius: 24, padding: 32, border: '1px solid ' + P.cta + '20' }}>
                                <h4 style={{ margin: 0, color: P.cta, fontWeight: 900, fontSize: 18 }}>Paper Policy</h4>
                                <ul style={{ margin: '16px 0 0', paddingLeft: 20, color: P.cta, fontWeight: 600, fontSize: 13, lineHeight: 1.8 }}>
                                    <li>Automated nodal question selection</li>
                                    <li>Syllabus coverage verification</li>
                                    <li>Export-ready high-dpi PDF</li>
                                    <li>Solution set generation</li>
                                </ul>
                            </div>
                            <div style={{ flex: 1, background: '#fff', borderRadius: 24, border: '1px solid ' + P.border, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                                <Printer size={48} color={P.muted} style={{ opacity: 0.3 }} />
                                <p style={{ textAlign: 'center', fontSize: 13, color: P.muted, fontWeight: 600 }}>Paper structure preview will appear here during compilation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
function Metric({ icon: Icon, label, value, color }: any) {
    return (
        <div style={{ background: P.card, borderRadius: 24, padding: '24px', border: '1px solid ' + P.border, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 950, color: P.dark }}>{value}</div>
            </div>
        </div>
    )
}
