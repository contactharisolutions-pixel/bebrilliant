'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Shield, Flag, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Maximize2 } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

export default function ExamAttemptPage() {
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState(7200) // 2 hours in seconds
    const [activeNode, setActiveNode] = useState(1)
    const [nodes, setNodes] = useState(Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        status: i === 0 ? 'active' : 'unvisited',
        answer: null
    })))

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const selectNode = (id: number) => {
        setActiveNode(id)
        setNodes(nodes.map(n => 
            n.id === id ? { ...n, status: n.status === 'unvisited' ? 'active' : n.status } : 
            n.id === activeNode && n.status === 'active' ? { ...n, status: 'visited' } : n
        ))
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: P.bg }}>
            <style>{GLASS_STYLES + `
                .node-btn { width: 40px; height: 40px; border-radius: 12px; display: flex; alignItems: center; justifyContent: center; fontSize: 13; fontWeight: 800; cursor: pointer; transition: all 0.2s; border: 1px solid ${P.border}; }
                .node-active { background: ${P.brand} !important; color: #fff !important; border-color: ${P.brand} !important; transform: scale(1.1); box-shadow: 0 4px 12px ${P.brand}40; }
                .node-visited { background: ${P.card} !important; color: ${P.brand} !important; border-color: ${P.brand} !important; }
                .node-answered { background: ${P.success} !important; color: #fff !important; border-color: ${P.success} !important; }
            `}</style>

            {/* TOP BAR: CONCENTRATION HEADER */}
            <header style={{ height: 72, background: P.dark, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color="#fff" />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em' }}>JEE Advanced Mock Exam</div>
                        <div style={{ color: P.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Status: Proctored</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: P.muted, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>Time Remaining</div>
                        <div style={{ color: timeLeft < 300 ? P.error : '#fff', fontSize: 20, fontWeight: 950, fontFamily: 'monospace' }}>{formatTime(timeLeft)}</div>
                    </div>
                    <button style={{ background: P.success, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 8px 20px ${P.success}40` }}>
                        Submit Exam
                    </button>
                </div>
            </header>

            {/* MAIN EXAM AREA */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', background: P.bg }}>
                
                {/* QUESTION CONTENT */}
                <div style={{ padding: 60, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ background: P.brandBg, color: P.brand, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900 }}>Question {activeNode}</div>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                            <div style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>Weight: 4 Marks</div>
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.5, color: P.dark, marginBottom: 40 }}>
                            A block of mass 2 kg is placed on a horizontal surface. The coefficient of static friction is 0.4. If a force of 6 N is applied horizontally, what is the magnitude of the frictional force acting on the block?
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {['6 N', '8 N', '4 N', '0 N'].map((option, i) => (
                                <div key={i} className="glass-card hover-lift" style={{ 
                                    padding: 24, borderRadius: 20, border: `1px solid ${P.border}`, 
                                    display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: P.bg, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: P.brand }}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: P.dark }}>{option}</div>
                                </div>
                            ))}
                        </div>

                        <footer style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${P.border}`, paddingTop: 32 }}>
                            <button style={{ background: 'transparent', border: `1px solid ${P.border}`, padding: '12px 24px', borderRadius: 14, color: P.text, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Flag size={18} /> Mark for Review
                            </button>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <button onClick={() => selectNode(Math.max(1, activeNode - 1))} style={{ background: P.card, border: `1px solid ${P.border}`, padding: '12px 20px', borderRadius: 14, color: P.dark, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <ChevronLeft size={18} /> Previous Question
                                </button>
                                <button onClick={() => selectNode(Math.min(30, activeNode + 1))} style={{ background: P.brand, color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30` }}>
                                    Next Question <ChevronRight size={18} />
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>

                {/* QUESTION NAVIGATION PANEL */}
                <div style={{ background: P.card, borderLeft: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 32, borderBottom: `1px solid ${P.border}` }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Maximize2 size={18} color={P.brand} /> Question Navigator
                        </h3>
                    </div>

                    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                            {nodes.map(node => (
                                <div 
                                    key={node.id} 
                                    onClick={() => selectNode(node.id)}
                                    className={`node-btn ${node.id === activeNode ? 'node-active' : ''} ${node.status === 'visited' ? 'node-visited' : ''}`}
                                >
                                    {node.id}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 40, background: P.bg, padding: 24, borderRadius: 24, border: `1px solid ${P.border}` }}>
                            <div style={{ fontSize: 12, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Legend</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: P.text }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand }} /> Active
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: P.text }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success }} /> Answered
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: P.text }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.border }} /> Unvisited
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: P.text }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.cta }} /> Marked for Review
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: 32, background: P.bg, borderTop: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: P.info, fontSize: 12, fontWeight: 700 }}>
                            <AlertCircle size={16} />
                            Active Video Proctoring
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
