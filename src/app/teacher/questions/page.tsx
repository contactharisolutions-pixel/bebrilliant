'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UploadCloud, Sparkles, Filter, Search, MoreVertical, CheckCircle2, Layers, Activity, BrainCircuit, Layout, ArrowRight, ArrowLeft } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

export default function QuestionBankPage() {
    const router = useRouter()
    const [view, setView] = useState<'list' | 'add'>('list')
    const [qType, setQType] = useState('objective')

    // Mock Data for UI presentation
    const questionsList = [
        { id: '1', text: 'What is the absolute maximum value of the function f(x) = x^3 - 3x on the interval [-2, 2]?', type: 'objective', difficulty: 'hard', subject: 'Mathematics' },
        { id: '2', text: 'Explain the principle of electromagnetic induction with an example.', type: 'subjective', difficulty: 'medium', subject: 'Physics' },
        { id: '3', text: 'Who wrote the play "Hamlet"?', type: 'objective', difficulty: 'easy', subject: 'Literature' }
    ]

    return (
        <div style={{ minHeight: '100%', background: P.bg, padding: '40px 48px' }}>
            <style>{GLASS_STYLES + `input:focus, textarea:focus, select:focus { outline: none; border-color: ${P.brand} !important; border-width: 2px !important; }`}</style>
            
            <div style={{ maxWidth: 1100, margin: '0 auto' }} className="fade-in">

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty Portal</div>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Question Bank</div>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>Question Bank</h1>
                        <p style={{ margin: '8px 0 0', fontSize: 15, color: P.muted, fontWeight: 600, maxWidth: 600 }}>
                            Manage, categorize, and synthesize your institutional question bank.
                        </p>
                    </div>
                    {view === 'list' && (
                        <div style={{ display: 'flex', gap: 14 }}>
                            <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                                <Sparkles size={18} color={P.brand} /> AI Synthesis
                            </button>
                            <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                                <UploadCloud size={18} color={P.brand} /> Bulk Injection
                            </button>
                            <button onClick={() => setView('add')} className="hover-lift" style={{ background: P.brand, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30`, cursor: 'pointer' }}>
                                <Plus size={18} strokeWidth={3} /> Add Question
                            </button>
                        </div>
                    )}
                    {view === 'add' && (
                        <button onClick={() => setView('list')} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                            <ArrowLeft size={18} color={P.muted} /> Back to Bank
                        </button>
                    )}
                </header>

                {/* Main Content Area */}
                {view === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Filters */}
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                                <Search size={18} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="text" placeholder="Search Questions..." style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.card, fontSize: 14, fontWeight: 600 }} />
                            </div>
                            <button style={{ background: P.card, border: `1px solid ${P.border}`, padding: '14px 24px', borderRadius: 16, fontSize: 14, fontWeight: 800, color: P.dark, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <Filter size={16} /> Advanced Filters
                            </button>
                        </div>

                        {/* List */}
                        <div className="glass-card" style={{ borderRadius: 28, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            {questionsList.map((q, idx) => (
                                <div key={q.id} style={{ padding: '24px 32px', borderBottom: idx !== questionsList.length - 1 ? `1px solid ${P.border}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 24, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = P.bg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ 
                                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', 
                                                padding: '4px 12px', borderRadius: 99, 
                                                background: q.type === 'objective' ? P.brandBg : P.warningBg, 
                                                color: q.type === 'objective' ? P.brand : P.warning 
                                            }}>
                                                {q.type}
                                            </div>
                                            <div style={{ 
                                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', 
                                                padding: '4px 12px', borderRadius: 99, 
                                                background: q.difficulty === 'hard' ? P.errorBg : q.difficulty === 'medium' ? P.warningBg : P.successBg, 
                                                color: q.difficulty === 'hard' ? P.error : q.difficulty === 'medium' ? P.warning : P.success 
                                            }}>
                                                {q.difficulty}
                                            </div>
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginLeft: 8 }}>{q.subject}</div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: P.dark, lineHeight: 1.6 }}>{q.text}</p>
                                    </div>
                                    <button style={{ background: P.bg, border: 'none', padding: 10, borderRadius: 12, color: P.muted, cursor: 'pointer' }}>
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ADD QUESTION FORM */
                    <div className="glass-card" style={{ borderRadius: 32, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: '32px 48px', borderBottom: `1px solid ${P.border}`, background: '#FAFBFC' }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>Manual Question Addition</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Create a new question for the question bank.</p>
                        </div>
                        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 40 }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Question Type</label>
                                    <select value={qType} onChange={(e) => setQType(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, fontSize: 14, fontWeight: 700, color: P.dark }}>
                                        <option value="objective">Objective (Multiple Choice)</option>
                                        <option value="subjective">Subjective (Deep Analysis)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Complexity Grade</label>
                                    <select style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, fontSize: 14, fontWeight: 700, color: P.dark }}>
                                        <option value="easy">Easy (Foundational)</option>
                                        <option value="medium">Medium (Transitional)</option>
                                        <option value="hard">Hard (Advanced)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Weight (Marks)</label>
                                    <input type="number" defaultValue={1} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, fontSize: 14, fontWeight: 700, color: P.dark }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Question Content</label>
                                <textarea rows={4} placeholder="Define the question content..." style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark, resize: 'none' }}></textarea>
                            </div>

                            {qType === 'objective' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: P.bg, padding: 32, borderRadius: 24, border: `1px solid ${P.border}` }}>
                                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Options</h4>
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: P.card, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: P.brand }}>{opt}</div>
                                            <input type="text" placeholder={`Option ${opt} Logic`} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: `1px solid ${P.border}`, background: P.card, fontSize: 14, fontWeight: 600 }} />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: P.text }}>
                                                <input type="radio" name="correct_answer" style={{ accentColor: P.brand, width: 18, height: 18 }} />
                                                Active
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Rationale Sequence (Optional Explanation)</label>
                                <textarea rows={2} placeholder="Explain the reasoning for this answer..." style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 14, fontWeight: 600, color: P.dark, resize: 'none' }}></textarea>
                            </div>

                            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 12, padding: '32px 0 0', borderTop: `1px solid ${P.border}` }}>
                                <button onClick={() => setView('list')} style={{ padding: '12px 28px', borderRadius: 14, fontSize: 14, fontWeight: 850, color: P.text, background: P.bg, border: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 14, fontSize: 14, fontWeight: 900, boxShadow: `0 8px 24px ${P.brand}30`, cursor: 'pointer' }}>
                                    <CheckCircle2 size={18} /> Save Question
                                </button>
                            </footer>

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
