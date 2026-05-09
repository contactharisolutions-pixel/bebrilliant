'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Award, Clock, ArrowRight, BookOpen, AlertCircle, Zap, ShieldCheck, ChevronRight } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'

export default function StudentDashboardPage() {
    const router = useRouter()

    // Phase 5 Mock Data for UI foundation
    const [kpis] = useState({
        attempted: 24,
        averageScore: 78,
        rank: 12,
        totalHours: 45
    })

    const [ongoingExams] = useState([
        { id: '1', title: 'JEE Advanced Mock Test 1', timeRemaining: 'Ends in 2 hrs', type: 'Objective', statusType: 'info' },
        { id: '2', title: 'Physics Formative Assessment', timeRemaining: 'Ends in 45 mins', type: 'Subjective', statusType: 'warning' }
    ])

    const [upcoming] = useState([
        { id: '3', title: 'Calculus Final Exam', date: 'Tomorrow, 10:00 AM' }
    ])

    return (
        <div style={{ minHeight: '100%', background: P.bg, paddingBottom: 60 }}>
            <style>{GLASS_STYLES + `
                @keyframes pulse-red { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
                .animate-pulse-red { animation: pulse-red 2s infinite; }
            `}</style>

            {/* Header */}
            <div style={{ background: P.card, borderBottom: `1px solid ${P.border}`, padding: '24px 48px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ background: P.brandBg, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Login</div>
                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Active Course: JEE Preparatory</div>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: P.dark, letterSpacing: '-0.03em' }}>Welcome back, Alex.</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: P.muted, fontWeight: 600 }}>Ready to continue your learning journey?</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: P.dark }}>#12 Class Rank</div>
                            <div style={{ fontSize: 11, color: P.success, fontWeight: 700 }}>Top 2% of the class</div>
                        </div>
                        <div style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${P.brand}, ${P.success})`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                            A
                        </div>
                    </div>
                </div>
            </div>

            <main style={{ maxWidth: 1200, margin: '40px auto', padding: '0 48px' }} className="fade-in">

                {/* KPI GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                    <KpiCard title="Exams Attempted" value={kpis.attempted} icon={BookOpen} color={P.brand} trend="+3 this week" trendIsUp={true} />
                    <KpiCard title="Average Score" value={`${kpis.averageScore}%`} icon={Target} color={P.success} trend="+4.2%" trendIsUp={true} />
                    <KpiCard title="Class Rank" value={`#${kpis.rank}`} icon={Award} color={P.cta} trend="Stable" trendIsUp={true} />
                    <KpiCard title="Focus Time" value={`${kpis.totalHours}h`} icon={Clock} color="#7C3AED" trend="Total Hours" trendIsUp={true} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>

                    {/* LIVE EXAMS */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="animate-pulse-red" style={{ width: 10, height: 10, borderRadius: '50%', background: P.error }} />
                                Active Exams
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {ongoingExams.map(exam => (
                                <div key={exam.id} className="glass-card hover-lift" style={{ 
                                    padding: 28, borderRadius: 28, border: `1px solid ${P.border}`, 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: `linear-gradient(to bottom, ${P.brand}, ${P.success})` }} />
                                    
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <StatusBadge status={exam.type} type={exam.statusType as any} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: P.error }}>
                                                <Clock size={14} /> {exam.timeRemaining}
                                            </div>
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: P.dark }}>{exam.title}</h4>
                                    </div>

                                        <button
                                        onClick={() => router.push(`/student/exams/${exam.id}/attempt`)}
                                        style={{ 
                                            background: P.dark, color: '#fff', border: 'none', padding: '14px 28px', 
                                            borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        Start Exam <ChevronRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SIDEBAR: SCHEDULE & AI INSIGHTS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        
                        <div>
                            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 900, color: P.dark }}>Upcoming Exams</h3>
                            <div className="glass-card" style={{ padding: 24, borderRadius: 24, border: `1px solid ${P.border}` }}>
                                {upcoming.map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: P.ctaBg, color: P.cta, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                                            <span style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.7 }}>Mar</span>
                                            <span style={{ fontSize: 16, marginTop: -2 }}>25</span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{item.title}</div>
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{item.date}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ANALYTICS CAARD */}
                        <div style={{ 
                            background: `linear-gradient(135deg, ${P.dark}, #25282C)`, 
                            padding: 32, borderRadius: 32, position: 'relative', overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                        }}>
                            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                                <Zap size={140} color="#fff" strokeWidth={1} />
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: P.cta, marginBottom: 16 }}>
                                <ShieldCheck size={20} />
                                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Targeted Insight</span>
                            </div>
                            
                            <h4 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 900, color: '#fff' }}>Area of Improvement</h4>
                            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#A5A2A6', lineHeight: 1.6, fontWeight: 500 }}>
                                Your overall accuracy in <span style={{ color: '#fff', fontWeight: 700 }}>Calculus</span> dropped 12% in the last 2 exams. We recommend prioritizing Chapter 4 for your next revision.
                            </p>
                            
                            <button style={{ 
                                width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', 
                                padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' 
                            }}>
                                Review Performance Analytics
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}
