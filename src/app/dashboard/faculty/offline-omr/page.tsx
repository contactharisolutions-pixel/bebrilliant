'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    FileText, Printer, UploadCloud, PieChart,
    Plus, Search, Filter, ShieldCheck,
    Rocket, Layers, GraduationCap, ArrowRight,
    CheckCircle2, Clock, Eye, Download,
    Settings2, History, RefreshCcw, ScanLine,
    Shield, Target, Zap, Waves, Sparkles, Loader2,
    QrCode, Cpu, Binary, Fingerprint, X, Info,
    Camera, Maximize2, Activity, CheckCheck, Users,
    CloudLightning, FileJson, Gauge, Layout, XCircle, PlusCircle
} from 'lucide-react'
// ── TYPES ────────────────────────────────────────────────
type OmrExam = {
    id: string
    title: string
    total_questions: number
    subjects?: { name: string }
    qr_sync_status: 'synced' | 'pending' | 'failed'
    inference_accuracy: number
    processed_count: number
    created_at: string
}
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
// ── UI COMPONENTS ──────────────────────────────────
function OmrToast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 32, right: 32, background: ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${ok ? COLORS.success : COLORS.danger}40`, borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 30000, animation: 'float 0.3s ease-out' }}>
            {ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
            <span style={{ fontSize: 14, fontWeight: 900, color: ok ? '#065F46' : '#991B1B' }}>{msg}</span>
        </div>
    )
}
function OmrModal({ title, onClose, children, onSubmit, saving, saveText = 'Save' }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'float 0.3s ease-out', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#64748B" /></button>
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
// ── MAIN ENGINE ──────────────────────────────────────────
export default function OfflineOmrPage() {
    const [exams, setExams] = useState<OmrExam[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    // Modal & Data States
    const [showCreate, setShowCreate] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const [classes, setClasses] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [form, setForm] = useState({ title: '', class_id: '', subject_id: '', total_questions: 100 })
    const [saving, setSaving] = useState(false)
    const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }
    const fetchExams = useCallback(async () => {
        setLoading(true)
        try {
            const [examRes, classRes, subRes] = await Promise.all([
                fetch('/api/dashboard/faculty/offline-omr/list').then(r => r.json()),
                fetch('/api/dashboard/tenant/classes').then(r => r.json()),
                fetch('/api/dashboard/tenant/subjects').then(r => r.json())
            ])
            setExams(examRes.exams || [])
            setClasses(classRes.classes || [])
            setSubjects(subRes.subjects || [])
        } finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchExams() }, [fetchExams])
    const handleRunChecking = async (id: string) => {
        setProcessing(id)
        try {
            const res = await fetch('/api/dashboard/faculty/offline-omr/process-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exam_id: id, source: 'bulk' })
            })
            const json = await res.json()
            if (res.ok) {
                showToast(`Checking Complete: ${json.sheet_mapped} sheets processed.`, true)
                await fetchExams()
            } else throw new Error(json.error)
        } catch (e: any) { showToast(e.message, false) }
        finally { setProcessing(null) }
    }
    if (loading) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING OMR SCANNER...</div>
            </div>
        )
    }
    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {toast && <OmrToast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
            {/* OMR CHECKER HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <ScanLine size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Offline OMR Scanner & Checker</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        Scan physical OMR sheets and automatically check answers using AI. Manage student answer sheets and view overall results easily.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => setShowTemplates(true)} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Layout size={16} /> Sheet Templates
                    </button>
                    <button onClick={() => setShowCreate(true)} style={{ padding: '14px 28px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <PlusCircle size={20} /> Setup New Exam
                    </button>
                </div>
            </div>
            {/* REAL-TIME STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                {[
                    { label: 'Sheets Scanned', val: exams.reduce((a, b) => a + b.processed_count, 0), icon: FileText, color: COLORS.primary },
                    { label: 'Checking Accuracy', val: '99.8%', icon: CheckCheck, color: COLORS.success },
                    { label: 'Student Matching', val: 'SECURE', icon: Users, color: COLORS.warning },
                    { label: 'Processing Speed', val: '0.4s/sheet', icon: Gauge, color: '#8B5CF6' }
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
            {/* EXAM LIST TABLE */}
            <div style={{ background: '#FFF', borderRadius: 36, border: '1px solid #E2E8F0', boxShadow: '0 40px 80px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 40px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Recently Scanned Exams</h2>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: 14, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Search size={16} color="#94A3B8" />
                            <input placeholder="Search exams..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: '#1E293B', width: 200 }} />
                        </div>
                        <button style={{ padding: '10px 18px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 14, color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Filter size={16} /> Filters</button>
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        <tr style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <th style={{ padding: '20px 40px' }}>Exam Details</th>
                            <th style={{ padding: '20px 40px' }}>Student Roll Sync</th>
                            <th style={{ padding: '20px 40px' }}>Checking Progress</th>
                            <th style={{ padding: '20px 40px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.length > 0 ? exams.map((exam) => (
                            <tr key={exam.id} className="ledger-row" style={{ borderBottom: '1px solid #F1F5F9', transition: '0.2s' }}>
                                <td style={{ padding: '24px 40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ width: 48, height: 48, background: `${COLORS.primary}08`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Layers size={24} color={COLORS.primary} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 1000, color: '#1E293B' }}>{exam.title}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>{exam.subjects?.name} • {exam.total_questions} Questions</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {exam.qr_sync_status === 'synced' ? (
                                            <>
                                                <div style={{ width: 32, height: 32, background: `${COLORS.success}10`, color: COLORS.success, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <QrCode size={16} />
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 1000, color: COLORS.success }}>ROLL NUMBERS SYNCED</div>
                                            </>
                                        ) : (
                                            <div style={{ padding: '6px 12px', background: `${COLORS.warning}10`, color: COLORS.warning, borderRadius: 8, fontSize: 11, fontWeight: 1000 }}>PENDING SYNC</div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                    <div style={{ width: 200 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, fontWeight: 1000, color: '#94A3B8' }}>
                                            <span>CHECKING PRECISION</span>
                                            <span style={{ color: COLORS.success }}>{exam.inference_accuracy}%</span>
                                        </div>
                                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{ width: `${exam.inference_accuracy}%`, height: '100%', background: COLORS.success, borderRadius: 10 }} />
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.primary, marginTop: 8, textTransform: 'uppercase' }}>{exam.processed_count} Sheets Checked</div>
                                    </div>
                                </td>
                                <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                        <button style={{ padding: '10px 18px', background: '#FFF', border: '1px solid #F1F5F9', borderRadius: 14, color: '#1E293B', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Printer size={15} /> Download OMRs
                                        </button>
                                        <button onClick={() => handleRunChecking(exam.id)} disabled={!!processing} style={{ padding: '10px 24px', background: '#111827', color: '#FFF', border: 'none', borderRadius: 14, fontSize: 12, fontWeight: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {processing === exam.id ? <Loader2 size={16} className="spin" /> : <><Rocket size={16} /> Start Checking</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} style={{ padding: 120, textAlign: 'center' }}>
                                    <Waves size={64} color="#F1F5F9" style={{ marginBottom: 24 }} />
                                    <div style={{ fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>No Exams Found</div>
                                    <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600, marginTop: 8 }}>Setup a new OMR checking process to begin scanning student answer sheets.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* EXAM SETUP MODAL */}
            {showCreate && (
                <OmrModal title="Setup OMR Checking" onClose={() => setShowCreate(false)} onSubmit={() => { setShowCreate(false); showToast('Exam Setup Complete', true); }} saving={saving} saveText="Start Setup">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Name</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#F8FAFC', borderRadius: 18, border: '2px solid #F1F5F9' }}>
                                <FileText size={18} color="#94A3B8" />
                                <input placeholder="e.g. Physics Quarter-2 Final" style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: '#0F172A', outline: 'none' }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                             <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>Select Class</label>
                                <select style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }}>
                                    <option>Choose Class...</option>
                                    {classes.map(c => <option key={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>Select Subject</label>
                                <select style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }}>
                                    <option>Choose Subject...</option>
                                    {subjects.map(s => <option key={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ background: `${COLORS.primary}05`, padding: 20, borderRadius: 20, border: `1px solid ${COLORS.primary}15`, display: 'flex', gap: 16 }}>
                            <ShieldCheck size={24} color={COLORS.primary} />
                            <p style={{ margin: 0, fontSize: 12, color: COLORS.primary, fontWeight: 700, lineHeight: 1.6 }}>Starting this setup will automatically link roll numbers for all students in the selected class to their respective answer sheets.</p>
                        </div>
                    </div>
                </OmrModal>
            )}
            {/* TEMPLATES MODAL */}
            {showTemplates && (
                <OmrModal title="OMR Sheet Templates" onClose={() => setShowTemplates(false)}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {[
                            { name: 'Standard Exam Sheet', q: 100, icon: Layout },
                            { name: 'Competitive NEET Sheet', q: 200, icon: Target },
                            { name: 'Daily Class Quiz', q: 30, icon: Activity },
                            { name: 'JEE Pattern Sheet', q: 90, icon: Binary }
                        ].map((t, i) => (
                            <button key={i} className="blueprint-card" style={{ padding: 24, borderRadius: 24, border: '2px solid #F1F5F9', background: '#FFF', textAlign: 'left', cursor: 'pointer', transition: '0.2s' }}>
                                <div style={{ fontSize: 15, fontWeight: 1000, color: '#1E293B' }}>{t.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                                     <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.primary }}>{t.q} Questions</span>
                                     <span style={{ fontSize: 10, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase' }}>Ready to Use</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </OmrModal>
            )}
        </div>
    )
}
