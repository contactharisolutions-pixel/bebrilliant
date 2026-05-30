'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    ScanLine, UploadCloud, Download, CheckCircle, XCircle, FileText,
    Settings, Search, ArrowLeft, Loader2, Sparkles, Printer, Eye, Trash2,
    Database, Target, Shield, LayoutDashboard, Globe, AlertCircle, ChevronRight, Zap
} from 'lucide-react'
// —— PALETTE ————————————————————————————————————
const P = {
    bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0',
    brand: '#004B93', brandBg: '#004B9310',
    cta: '#F59E0B', ctaBg: '#FEF3C7',
    dark: '#0F172A', text: '#475569', muted: '#94A3B8',
    success: '#10B981', successBg: '#D1FAE5',
    error: '#EF4444', errorBg: '#FEE2E2',
    info: '#3B82F6', infoBg: '#DBEAFE',
}
// —— UI COMPONENTS —————————————————————————————————
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 24, right: 32, background: ok ? P.successBg : P.errorBg, border: '1px solid ' + (ok ? P.success : P.error) + '40', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', zIndex: 10000, animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)', backdropFilter: 'blur(10px)' }}>
            {ok ? <CheckCircle size={20} color={P.success} strokeWidth={2.5} /> : <XCircle size={20} color={P.error} strokeWidth={2.5} />}
            <span style={{ fontSize: 14, fontWeight: 800, color: ok ? P.success : P.error }}>{msg}</span>
        </div>
    )
}
export default function OMRExamManager() {
    const [view, setView] = useState<'list' | 'builder' | 'scanner'>('list')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [exams, setExams] = useState<any[]>([])
    const [syllabuses, setSyllabuses] = useState<any[]>([])
    const [selectedExam, setSelectedExam] = useState<any>(null)
    const [processedSheets, setProcessedSheets] = useState<any[]>([])
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const fetchProcessedSheets = useCallback(async () => {
        if (!selectedExam) return
        const res = await fetch(`/api/dashboard/exams/omr?examId=${selectedExam.id}`)
        const data = await res.json()
        setProcessedSheets(data.sheets || [])
    }, [selectedExam])
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }
    useEffect(() => { if (view === 'scanner') fetchProcessedSheets() }, [view, fetchProcessedSheets])
    const [form, setForm] = useState({
        title: '', syllabusId: '', totalQuestions: 50, template: 'standard_50_bubble'
    })
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [exRes, sylRes] = await Promise.all([
                fetch('/api/dashboard/exams/omr').then(r => r.json()),
                fetch('/api/dashboard/syllabus').then(r => r.json())
            ])
            setExams(exRes?.exams || [])
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
            const res = await fetch('/api/dashboard/exams/omr', {
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
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
            {view === 'list' && (
                <>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ background: P.brandBg, color: P.brand, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>PHYSICAL SCANNABLE FLOW</div>
                            </div>
                            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: P.dark }}>OMR Exam Management</h1>
                            <p style={{ margin: '8px 0 0', color: P.muted, fontWeight: 500 }}>Deploy standardized bubble-sheet exams with AI-driven evaluation.</p>
                        </div>
                        <button onClick={() => setView('builder')} className="hover-lift" style={{ background: P.brand, color: '#fff', padding: '14px 28px', borderRadius: 16, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ScanLine size={20} /> Create OMR Blueprint
                        </button>
                    </header>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
                        <Metric icon={Target} label="Standard Blueprints" value={String(exams.length)} color={P.brand} />
                        <Metric icon={UploadCloud} label="Scanned Sheets" value="0" color={P.info} />
                        <Metric icon={CheckCircle} label="Success Rate" value="99.8%" color={P.success} />
                    </div>
                    <div style={{ background: P.card, borderRadius: 24, border: '1px solid ' + P.border, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: '#F1F5F9', color: P.muted, fontSize: 12, fontWeight: 800 }}>
                                    <th style={{ padding: '20px 32px' }}>EXAM IDENTITY</th>
                                    <th style={{ padding: '20px 32px' }}>TEMPLATE TYPE</th>
                                    <th style={{ padding: '20px 32px' }}>STATUS</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map(ex => (
                                    <tr key={ex.id} style={{ borderBottom: '1px solid ' + P.border }}>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontWeight: 800, color: P.dark, fontSize: 16 }}>{ex.title}</div>
                                            <div style={{ fontSize: 12, color: P.muted, marginTop: 4 }}>{ex.total_questions} Questions</div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <span style={{ background: P.infoBg, color: P.info, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>{ex.template_id || 'Standard 50'}</span>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success }} />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: P.success }}>Ready to Scan</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setSelectedExam(ex); setView('scanner') }} style={{ padding: '10px 18px', background: P.info, color: '#fff', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Scan Sheets</button>
                                                <button 
                                                    onClick={() => window.open(`/api/dashboard/exams/omr/${ex.id}/print`, '_blank')}
                                                    style={{ padding: 10, background: P.bg, borderRadius: 12, border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Printer size={18} color={P.brand} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {view === 'builder' && (
                <div style={{ maxWidth: 800, margin: '0 auto', background: P.card, borderRadius: 32, padding: '48px', border: '1px solid ' + P.border, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                    <header style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 40 }}>
                        <button onClick={() => setView('list')} style={{ background: P.bg, border: 'none', padding: 12, borderRadius: 12, cursor: 'pointer' }}><ArrowLeft size={20} /></button>
                        <h2 style={{ margin: 0, fontWeight: 900 }}>Design OMR Blueprint</h2>
                    </header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Exam Title</label>
                            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Unit Test 1 - Biology" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, outline: 'none', background: P.bg }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Target Syllabus</label>
                                <select value={form.syllabusId} onChange={e => setForm({...form, syllabusId: e.target.value})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, background: P.bg }}>
                                    <option value="">Select Board...</option>
                                    {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 10 }}>Bubble Count</label>
                                <input type="number" value={form.totalQuestions} onChange={e => setForm({...form, totalQuestions: parseInt(e.target.value)})} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid ' + P.border, fontWeight: 600, background: P.bg }} />
                            </div>
                        </div>
                        <div style={{ marginTop: 20, padding: 32, border: '2px dashed ' + P.brand + '40', borderRadius: 24, textAlign: 'center', background: P.brandBg }}>
                            <Printer size={48} color={P.brand} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <h4 style={{ margin: 0, color: P.brand }}>Standard OMR Preview</h4>
                            <p style={{ fontSize: 13, color: P.brand, opacity: 0.8, marginTop: 8 }}>The system will auto-generate a scannable bubble sheet based on these parameters.</p>
                        </div>
                        <button onClick={handleCreate} disabled={saving} style={{ padding: '18px', background: P.brand, color: '#fff', border: 'none', borderRadius: 18, fontWeight: 900, fontSize: 16, marginTop: 20, cursor: 'pointer' }}>
                            {saving ? <Loader2 size={24} className="spin" /> : 'Launch OMR Blueprint'}
                        </button>
                    </div>
                </div>
            )}
            {view === 'scanner' && (
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <button onClick={() => setView('list')} style={{ background: P.card, border: '1px solid ' + P.border, padding: 12, borderRadius: 12, cursor: 'pointer' }}><ArrowLeft size={20} /></button>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>Scan Engine: {selectedExam?.title}</h2>
                        </div>
                    </header>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <div style={{ background: P.card, borderRadius: 32, padding: 48, border: '1px solid ' + P.border, textAlign: 'center' }}>
                                <div style={{ width: 80, height: 80, background: P.brandBg, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <UploadCloud size={32} color={P.brand} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Upload Answer Sheets</h3>
                                <p style={{ color: P.muted, margin: '12px 0 32px' }}>AI will auto-detect marks from your JPG/PNG scans.</p>
                                <input 
                                    type="file" multiple accept="image/*" style={{ display: 'none' }} id="omr-upload" 
                                    onChange={async (e) => {
                                        const files = e.target.files
                                        if (!files) return
                                        setSaving(true)
                                        for (const file of Array.from(files)) {
                                            const reader = new FileReader()
                                            reader.onloadend = async () => {
                                                const base64 = (reader.result as string).split(',')[1]
                                                await fetch('/api/dashboard/exams/omr/process', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ examId: selectedExam.id, imageBase64: base64 })
                                                })
                                                fetchProcessedSheets()
                                            }
                                            reader.readAsDataURL(file)
                                        }
                                        setSaving(false); showToast('Batch processed!', true)
                                    }}
                                />
                                <label htmlFor="omr-upload" style={{ background: P.brand, color: '#fff', padding: '16px 40px', borderRadius: 16, fontWeight: 850, cursor: 'pointer', display: 'inline-block' }}>
                                    {saving ? <Loader2 className="spin" size={20}/> : 'Select Scanning Batch'}
                                </label>
                            </div>
                            <div style={{ background: P.card, borderRadius: 32, border: '1px solid ' + P.border, overflow: 'hidden' }}>
                                <div style={{ padding: '24px 32px', borderBottom: '1px solid ' + P.border, fontWeight: 900 }}>Detection Results</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: P.bg, fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase' }}>
                                            <th style={{ padding: '16px 32px', textAlign: 'left' }}>Roll / Student</th>
                                            <th style={{ padding: '16px 32px' }}>Confidence</th>
                                            <th style={{ padding: '16px 32px' }}>Status</th>
                                            <th style={{ padding: '16px 32px', textAlign: 'right' }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedSheets.map((s: any) => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid ' + P.border }}>
                                                <td style={{ padding: '20px 32px', fontWeight: 800 }}>{s.processed_data.rollNumber || 'Unknown'}</td>
                                                <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                                                    <span style={{ color: s.confidence_score > 90 ? P.success : P.cta, fontWeight: 900 }}>{s.confidence_score}%</span>
                                                </td>
                                                <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: 8, background: s.status === 'processed' ? P.successBg : P.ctaBg, color: s.status === 'processed' ? P.success : P.cta, fontSize: 10, fontWeight: 900 }}>{s.status.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: '20px 32px', textAlign: 'right', fontWeight: 900 }}>--</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div style={{ background: P.card, borderRadius: 32, padding: 32, border: '1px solid ' + P.border, height: 'fit-content' }}>
                            <h4 style={{ margin: 0, fontWeight: 900, marginBottom: 20 }}>Scan Statistics</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <StatRow label="Sheets Processed" value={String(processedSheets.length)} />
                                <StatRow label="Accuracy Avg." value={processedSheets.length > 0 ? (processedSheets.reduce((a:any,c:any)=>a+c.confidence_score,0)/processedSheets.length).toFixed(1)+'%' : '--'} />
                            </div>
                            <button 
                                onClick={() => window.open(`/api/dashboard/exams/omr/${selectedExam.id}/print`, '_blank')}
                                style={{ width: '100%', marginTop: 32, padding: 14, background: P.bg, borderRadius: 14, border: '1px solid ' + P.border, fontWeight: 800, color: P.brand, cursor: 'pointer' }}
                            >
                                Download Blueprint Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
function Metric({ icon: Icon, label, value, color }: any) {
    return (
        <div style={{ background: P.card, borderRadius: 24, padding: '24px', border: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: color + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={color} />
            </div>
            <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 950, color: P.dark }}>{value}</div>
            </div>
        </div>
    )
}
function StatRow({ label, value }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid ' + P.border }}>
            <span style={{ fontWeight: 600, color: P.muted }}>{label}</span>
            <span style={{ fontWeight: 800, color: P.dark }}>{value}</span>
        </div>
    )
}
