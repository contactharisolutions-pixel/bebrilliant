'use client'

import { useState } from 'react'
import PerformanceChart from '@/components/analytics/PerformanceChart'
import { Sparkles, BrainCircuit, Rocket, LayoutDashboard, Brain, Search, Info, Send, Command, Zap } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

const MOCK_PERFORMANCE_DATA = [
    { subject: 'Physics', accuracy: 82, attempts: 140, color: P.brand },
    { subject: 'Chemistry', accuracy: 76, attempts: 95, color: P.success },
    { subject: 'Mathematics', accuracy: 48, attempts: 110, color: P.error },
    { subject: 'Biology', accuracy: 91, attempts: 60, color: P.cta }
]

export default function StudentAnalyticsDashboard() {
    const [mentorQuery, setMentorQuery] = useState('')
    const [mentorResponse, setMentorResponse] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const handleAskMentor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentorQuery) return
        setIsAnalyzing(true)
        setMentorResponse(null)
        setTimeout(() => {
            const lowerCwq = mentorQuery.toLowerCase()
            let response = `I have reviewed your recent test records. Your score in Mathematics (48%) is currently pulling down your average, specifically in calculus topics. I recommend focusing your next study session on the chain rule.`
            if (lowerCwq.includes('plan') || lowerCwq.includes('revision')) {
                response = "I have automatically generated a 14-day revision schedule targeting your weak areas in Mathematics. You can view this plan in your homework section."
            } else if (lowerCwq.includes('rank')) {
                response = "Analyzing your performance against the rest of the batch... Your estimated rank is around 1,340. Maintaining your current study hours will keep you efficiently in the top 3%."
            }
            setMentorResponse(response)
            setIsAnalyzing(false)
        }, 1200)
    }

    return (
        <div style={{ background: P.bg, minHeight: '100vh', paddingBottom: 60, fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                .chat-bubble-ai { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px 20px 20px 4px; padding: 16px; color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
                .chat-bubble-user { background: ${P.brand}; border-radius: 20px 20px 4px 20px; padding: 12px 20px; color: #fff; font-size: 14px; font-weight: 700; align-self: flex-end; margin-bottom: 20px; }
                .neural-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}</style>

            {/* HEADER */}
            <header style={{ background: P.card, borderBottom: `1px solid ${P.border}`, padding: '24px 40px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BrainCircuit size={24} color="#fff" />
                            </div>
                            <h1 style={{ fontSize: 26, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Detailed Performance Analytics</h1>
                        </div>
                        <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Track your academic progress and subject mastery.</p>
                    </div>
                    <button style={{ background: P.dark, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                        <Zap size={16} /> Improve Weak Areas
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1400, margin: '40px auto', padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40 }}>
                
                {/* LEFT DATA COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div className="glass-card" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 32, padding: 40 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>Overall Subject Marks</h3>
                            <div style={{ background: P.brandBg, color: P.brand, padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 900 }}>TOP 3%</div>
                         </div>
                         <PerformanceChart data={MOCK_PERFORMANCE_DATA} />
                    </div>

                    <div className="glass-card" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 32, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ background: P.ctaBg, color: P.cta, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>Rank Predictor</div>
                            </div>
                            <h3 style={{ fontSize: 28, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Target Ranking Projection</h3>
                            <p style={{ fontSize: 15, color: P.muted, fontWeight: 600, marginTop: 12, lineHeight: 1.5 }}>Calculated by comparing your previous exam results against 54,000 active students in your batch.</p>
                        </div>
                        <div style={{ width: 180, height: 180, borderRadius: '50%', border: `12px solid ${P.bg}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#fff' }}>
                            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `12px solid ${P.brand}`, borderTopColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(-45deg)' }} />
                            <span style={{ fontSize: 12, fontWeight: 800, color: P.muted }}>EST. RANK</span>
                            <span style={{ fontSize: 36, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>#1,340</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT AI MENTOR COLUMN */}
                <div style={{ background: '#0A0B14', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', height: 800, overflow: 'hidden', position: 'relative', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)' }}>
                    <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: P.brand, opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -100, left: -100, width: 250, height: 250, background: P.cta, opacity: 0.05, filter: 'blur(60px)', borderRadius: '50%' }} />

                    <div style={{ padding: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Sparkles size={20} color={P.cta} />
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>AI Academic Assistant</h3>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 700 }}>Your personal study mentor, ready to answer questions.</p>
                    </div>

                    <div style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
                        <div className="chat-bubble-ai">
                            Hi Alex! I've been reviewing your recent test records. I noticed you lost some marks in your Mathematics exam yesterday. How can I help you revise today?
                        </div>

                        {mentorResponse && (
                            <>
                                <div className="chat-bubble-user">{mentorQuery}</div>
                                <div className="chat-bubble-ai animate-in fade-in slide-in-from-bottom-2">
                                    {mentorResponse}
                                </div>
                            </>
                        )}

                        {isAnalyzing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: P.cta, fontSize: 13, fontWeight: 800 }}>
                                <Brain size={16} className="pulse" /> Preparing response...
                            </div>
                        )}
                    </div>

                    <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)', background: '#0A0B14', position: 'relative', zIndex: 10 }}>
                        <form onSubmit={handleAskMentor} style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={mentorQuery}
                                onChange={(e) => setMentorQuery(e.target.value)}
                                placeholder="Request revision plan or explanation..."
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: '16px 56px 16px 20px', color: '#fff', fontSize: 14, outline: 'none', transition: 'all 0.2s', fontWeight: 600 }}
                            />
                            <button type="submit" disabled={isAnalyzing || !mentorQuery} style={{ position: 'absolute', right: 8, top: 8, width: 40, height: 40, background: P.brand, border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', opacity: isAnalyzing ? 0.5 : 1 }}>
                                <Send size={18} />
                            </button>
                        </form>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}><Command size={10} /> k</div>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, paddingTop: 4 }}>BrightBoard AI Assistant</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
