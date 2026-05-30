'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    FileText, CheckCircle2, AlertCircle, Edit3,
    ChevronRight, Save, Wand2, Search, Filter,
    ArrowLeft, Eye, MessageSquare, History,
    LayoutGrid, Zap, BrainCircuit, RefreshCcw,
    Shield, Target, Users, LayoutDashboard, Sparkles, Loader2, X
} from 'lucide-react'
// ── TYPES ────────────────────────────────────────────────
type EvaluationScript = {
    id: string
    student: { first_name: string; last_name: string }
    exam: { title: string }
    status: 'pending' | 'completed' | 'review'
    ai_predicted_score: number
    max_score: number
    ai_confidence: number
    created_at: string
}
const COLORS = {
    blue: '#004B93',
    green: '#1FAC63',
    orange: '#F0A026',
    purple: '#8B5CF6',
    slate: '#64748B',
    border: '#E5E7EB',
    bg: '#F9FAFB'
}
const GLASS_CARD = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '24px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.02)'
}
// ── UI COMPONENTS ───────────────────────────────────────
function AnalyticsCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="hover-lift" style={{ ...GLASS_CARD, background: '#FFF', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}20` }}>
                <Icon size={24} color={color} strokeWidth={2.5} />
            </div>
            <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', marginTop: 4, letterSpacing: '-0.02em' }}>{value}</div>
            </div>
        </div>
    )
}
function StatusBadge({ status }: { status: string }) {
    const isCompleted = status === 'completed'
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: isCompleted ? `${COLORS.green}15` : `${COLORS.orange}15`, color: isCompleted ? COLORS.green : COLORS.orange, borderRadius: 100, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {status === 'completed' ? <CheckCircle2 size={12} /> : <History size={12} />} {status}
        </div>
    )
}
export default function AnswerGradingHub() {
    const [view, setView] = useState<'queue' | 'evaluation'>('queue')
    const [loading, setLoading] = useState(true)
    const [uploads, setUploads] = useState<EvaluationScript[]>([])
    const [selectedUpload, setSelectedUpload] = useState<EvaluationScript | null>(null)
    const [gradingDetails, setGradingDetails] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const fetchInitialData = useCallback(async () => {
        setLoading(true)
        try {
            // Simulated backend sync
            await new Promise(r => setTimeout(r, 1000))
            setUploads([
                { id: '1', student: { first_name: 'Aditya', last_name: 'Sharma' }, exam: { title: 'Midterm Science' }, status: 'review', ai_predicted_score: 7.7, max_score: 10, ai_confidence: 94, created_at: new Date().toISOString() },
                { id: '2', student: { first_name: 'Anjali', last_name: 'Verma' }, exam: { title: 'Midterm Science' }, status: 'review', ai_predicted_score: 8.2, max_score: 10, ai_confidence: 88, created_at: new Date().toISOString() },
                { id: '3', student: { first_name: 'Rahul', last_name: 'Kumar' }, exam: { title: 'Physics Final' }, status: 'completed', ai_predicted_score: 9.1, max_score: 10, ai_confidence: 97, created_at: new Date().toISOString() }
            ] as any)
        } finally {
            setLoading(false)
        }
    }, [])
    useEffect(() => { fetchInitialData() }, [fetchInitialData])
    const loadGradingDetails = async (upload: EvaluationScript) => {
        setLoading(true)
        setSelectedUpload(upload)
        // Simulated Extraction & Auto-grading Analysis
        await new Promise(r => setTimeout(r, 800))
        setGradingDetails([
            {
                question: 'Explain the process of Osmosis in plant cells.',
                detected_text: 'Osmosis is the movement of water molecules from high concentration to low concentration through a semi-permeable membrane. In plants, it helps in water absorption.',
                auto_marks: 4.2,
                max_marks: 5,
                ai_feedback: 'SEMANTIC CONSENSUS: 94% | Core biological vectors identified.',
                keywords: ['membrane', 'concentration', 'absorption']
            },
            {
                question: 'Define Photosynthesis and its chemical equation.',
                detected_text: 'It is the way plants make food using sun and water. Carbon dioxide + water = Sugar + Oxygen.',
                auto_marks: 3.5,
                max_marks: 5,
                ai_feedback: 'REASONING ACCURACY: 82% | Equation structure verified.',
                keywords: ['sunlight', 'sugar', 'oxygen']
            }
        ])
        setLoading(false)
        setView('evaluation')
    }
    if (loading && view === 'queue') return (
        <div style={{ padding: 120, textAlign: 'center', background: COLORS.bg, minHeight: '100vh' }}>
            <Loader2 size={48} color={COLORS.blue} className="spin" style={{ margin: '0 auto 24px' }} />
            <div style={{ color: COLORS.blue, fontWeight: 900, fontSize: 18, letterSpacing: '0.1em' }}>INITIALIZING EVALUATION...</div>
        </div>
    )
    return (
        <div style={{ padding: '40px 48px', background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {view === 'queue' ? (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    {/* HEADER */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: `${COLORS.blue}15`, color: COLORS.blue, borderRadius: 100, fontSize: 11, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Zap size={12} fill={COLORS.blue} stroke="none" /> Auto-grading Active
                            </div>
                            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em' }}>Qualitative Evaluation</h1>
                            <p style={{ margin: '6px 0 0', fontSize: 16, color: COLORS.slate, fontWeight: 500 }}>Automate handwriting extraction, semantic synthesis, and predictive scoring.</p>
                        </div>
                        <button onClick={fetchInitialData} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 13, color: '#111827' }}>
                            <RefreshCcw size={16} /> Sync Queue
                        </button>
                    </header>
                    {/* KPI MEASURES */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                        <AnalyticsCard label="Pending Scripts" value={uploads.filter(u => u.status !== 'completed').length} icon={FileText} color={COLORS.orange} bg={`${COLORS.orange}10`} />
                        <AnalyticsCard label="Avg AI Confidence" value="92.4%" icon={BrainCircuit} color={COLORS.blue} bg={`${COLORS.blue}10`} />
                        <AnalyticsCard label="Evaluated Today" value="142" icon={CheckCircle2} color={COLORS.green} bg={`${COLORS.green}10`} />
                        <AnalyticsCard label="Grading Speed" value="1.4s/pg" icon={Zap} color={COLORS.purple} bg={`${COLORS.purple}10`} />
                    </div>
                    {/* SEARCH & FILTER */}
                    <div className="glass-card" style={{ background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '24px 32px', display: 'flex', gap: 20, alignItems: 'center', marginBottom: 40, boxShadow: '0 4px 30px rgba(0,0,0,0.02)' }}>
                        <Search size={22} color={COLORS.slate} />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by candidate or exam..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#111827', fontWeight: 600, background: 'transparent' }} />
                        <div style={{ height: 32, width: 1, background: COLORS.border }} />
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: COLORS.slate }}>
                            <Filter size={18} /> Filters
                        </button>
                    </div>
                    {/* QUEUE TABLE */}
                    <div className="glass-card" style={{ background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 28, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#F9FAFB', borderBottom: `1px solid ${COLORS.border}` }}>
                                <tr style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: COLORS.slate }}>
                                    <th style={{ padding: '20px 32px' }}>Student Identity</th>
                                    <th style={{ padding: '20px 32px' }}>Exam</th>
                                    <th style={{ padding: '20px 32px' }}>AI Prediction</th>
                                    <th style={{ padding: '20px 32px' }}>Sync State</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploads.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 44, height: 44, background: `${COLORS.blue}10`, color: COLORS.blue, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{u.student.first_name} {u.student.last_name}</div>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginTop: 4 }}>ID: {u.id.substring(0,8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#4b5563' }}>{u.exam.title}</div>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.blue, background: `${COLORS.blue}10`, padding: '4px 8px', borderRadius: 6, display: 'inline-block', marginTop: 8 }}>EVAL-2026-B</div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.blue }}>{u.ai_predicted_score}<span style={{ fontSize: 13, color: COLORS.slate }}> / {u.max_score}</span></div>
                                                <div style={{ padding: '4px 8px', background: `${COLORS.green}10`, color: COLORS.green, borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{u.ai_confidence}% CONF</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}><StatusBadge status={u.status} /></td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <button onClick={() => loadGradingDetails(u)} style={{ background: COLORS.blue, color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0, 75, 147, 0.15)' }}>
                                                Grade Now <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    {/* EVALUATION HEADER */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <button onClick={() => setView('queue')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 14, color: COLORS.slate }}>
                            <ArrowLeft size={18} /> Return to List
                        </button>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#111827' }}>Script Vector Verification</h2>
                            <p style={{ margin: '4px 0 0', color: COLORS.slate, fontWeight: 600 }}>Candidate: {selectedUpload?.student.first_name} {selectedUpload?.student.last_name} • ID: {selectedUpload?.id.substring(0,8)}</p>
                        </div>
                    </header>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 32 }}>
                        {/* LEFT: SCRIPT CARDS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {gradingDetails.map((g, i) => (
                                <div key={i} className="glass-card" style={{ background: '#FFF', padding: 32, borderRadius: 28, border: `1px solid ${COLORS.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em' }}>EVALUATIVE NODE 0{i+1}</div>
                                        <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.blue }}>WEIGHT: {g.max_marks} MARKS</div>
                                    </div>
                                    <h3 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 800, color: '#111827', lineHeight: 1.4 }}>{g.question}</h3>
                                    <div style={{ background: '#F8FAFB', padding: 24, borderRadius: 16, borderLeft: `4px solid ${COLORS.blue}40` }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.blue, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                            <Wand2 size={12} /> Extracted Script (OCR Deep Scan)
                                        </div>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>"{g.detected_text}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* RIGHT: AI INSIGHTS PANEL */}
                        <div style={{ position: 'sticky', top: 32, ...GLASS_CARD, background: '#FFF', padding: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                <div style={{ width: 56, height: 56, background: `${COLORS.blue}10`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={28} color={COLORS.blue} /></div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>AI Evaluation Insights</h2>
                                    <p style={{ margin: '4px 0 0', color: COLORS.slate, fontWeight: 600 }}>Semantic Consensus & Logic Verification</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                {gradingDetails.map((g, i) => (
                                    <div key={i} style={{ paddingBottom: 24, borderBottom: `1px solid ${COLORS.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <span style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>Node 0{i+1} Calibration</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <input type="number" defaultValue={g.auto_marks} step="0.1" style={{ width: 64, padding: '10px', borderRadius: 10, border: `1px solid ${COLORS.blue}30`, fontWeight: 900, textAlign: 'center', color: COLORS.blue, fontSize: 15 }} />
                                                <span style={{ fontWeight: 800, color: COLORS.slate }}>/ {g.max_marks}</span>
                                            </div>
                                        </div>
                                        <div style={{ background: `${COLORS.green}10`, color: COLORS.green, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Target size={14} /> {g.ai_feedback}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                                            {g.keywords.map((kw: string) => (
                                                <span key={kw} style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', background: COLORS.bg, color: COLORS.slate, padding: '4px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}` }}>#{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <button style={{ width: '100%', padding: '18px', borderRadius: 18, background: COLORS.blue, color: '#FFF', border: 'none', fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 16px rgba(0, 75, 147, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <CheckCircle2 size={20} /> COMMIT EVALUATION
                                </button>
                                <button style={{ width: '100%', padding: '18px', borderRadius: 18, background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.slate, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                                    REQUEST SECOND OPINION
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
