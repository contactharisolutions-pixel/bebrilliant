'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TrendingUp, Award, Target, LayoutDashboard, Share2, Printer, Loader2, CheckCircle, ChevronRight, BookOpen } from 'lucide-react'

// —— PALETTE ————————————————————————————————————
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9315',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    success: '#1FAC63', successBg: '#1FAC6310',
    error: '#EF4444', errorBg: '#FEF2F2',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6'
}

export default function OnlineResult() {
    const params = useParams()
    const router = useRouter()
    const examId = params.id as string

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    const fetchResult = useCallback(async () => {
        try {
            const res = await fetch(`/api/dashboard/exams/online/${examId}/analytics?studentId=current`)
            const json = await res.json()
            setData(json)
            setLoading(false)
        } catch (e) { console.error('Failed to load result', e) }
    }, [examId])

    useEffect(() => { fetchResult() }, [fetchResult])

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: P.bg, gap: 20 }}>
            <Loader2 size={48} color={P.brand} className="spin" />
            <div style={{ fontSize: 16, fontWeight: 900, color: P.brand }}>CALCULATING PERFORMANCE METRICS...</div>
        </div>
    )

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '60px 40px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
                
                {/* Hero section */}
                <header style={{ textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, background: P.successBg, color: P.success, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle size={40} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 950, color: P.dark }}>Assessment Concluded</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 18, color: P.muted, fontWeight: 600 }}>Your vectors have been successfully evaluated.</p>
                </header>

                {/* Score Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    <div style={{ background: P.card, borderRadius: 32, padding: 40, border: '1px solid ' + P.border, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 12 }}>Final Score</div>
                        <div style={{ fontSize: 48, fontWeight: 950, color: P.brand }}>{data.metrics?.score}</div>
                    </div>
                    <div style={{ background: P.card, borderRadius: 32, padding: 40, border: '1px solid ' + P.border, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 12 }}>Global Rank</div>
                        <div style={{ fontSize: 48, fontWeight: 950, color: P.cta }}>#{data.metrics?.rank}</div>
                    </div>
                    <div style={{ background: P.card, borderRadius: 32, padding: 40, border: '1px solid ' + P.border, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 12 }}>Percentile</div>
                        <div style={{ fontSize: 48, fontWeight: 950, color: P.success }}>{data.metrics?.percentile}%</div>
                    </div>
                </div>

                {/* Detailed Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
                    <div style={{ background: P.card, borderRadius: 32, border: '1px solid ' + P.border, padding: 40 }}>
                        <h4 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <TrendingUp size={24} color={P.brand} /> Topic-wise Precision
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {Object.entries(data.topicBreakdown || {}).map(([topic, stats]: any) => (
                                <div key={topic}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, fontWeight: 800 }}>
                                        <span style={{ color: P.dark }}>{topic}</span>
                                        <span style={{ color: P.brand }}>{stats.correct} / {stats.total}</span>
                                    </div>
                                    <div style={{ height: 10, background: P.bg, borderRadius: 5, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(stats.correct / stats.total) * 100}%`, background: P.brand, borderRadius: 5 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ background: P.brand, borderRadius: 32, padding: 40, color: '#fff', boxShadow: '0 20px 40px ' + P.brand + '30' }}>
                            <Award size={40} style={{ marginBottom: 20 }} />
                            <h4 style={{ margin: 0, fontSize: 22, fontWeight: 950 }}>Certificate Ready</h4>
                            <p style={{ margin: '12px 0 24px', fontSize: 14, opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>You've qualified for the achievement badge. Download your verifiable certificate now.</p>
                            <button style={{ width: '100%', padding: 16, background: '#fff', color: P.brand, border: 'none', borderRadius: 16, fontWeight: 900, cursor: 'pointer' }}>Download PDF</button>
                        </div>
                        <button onClick={() => router.push('/dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, border: '2px solid ' + P.border, background: '#fff', borderRadius: 24, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                            <LayoutDashboard size={20}/> Back to Terminal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
