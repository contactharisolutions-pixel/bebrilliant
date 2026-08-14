'use client'

import React from 'react'
import Link from 'next/link'
import {
    GraduationCap, Trophy, BookOpen, Target, BrainCircuit, Clock,
    ArrowRight, CheckCircle, Sparkles, Star, Activity, Award, Zap
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function StudentPlatformPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(147, 197, 253, 0.25), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#BFDBFE', marginBottom: 20 }}>
                            <GraduationCap size={14} /> Student Platform & Practice Engine
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Ace Your Exams with Unlimited Self-Tests, Mock Papers & Instant Solutions
                        </h1>

                        <p style={{ fontSize: 17, color: '#DBEAFE', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Get complete subscription access to topic-wise question banks for Class 1-12, CBSE, ICSE, JEE Main, NEET UG, and State Boards.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/pricing"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#FFFFFF',
                                    color: '#1E3A8A',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Get Student Practice Pass <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#FFFFFF',
                                    padding: '14px 26px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                Try Sample Test
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. STUDENT CORE FEATURES ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Student Toolkit
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Designed to Boost Scores & Confidence
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: BrainCircuit,
                                    badge: 'AI Powered · Custom Mocks',
                                    title: 'Custom AI Question Paper & Exam Creator',
                                    desc: 'Generate custom practice papers on demand by selecting your subject, specific chapters, question count, and difficulty level with Gemini AI.',
                                    bullets: [
                                        'Custom multi-chapter & topic test assembly',
                                        'Flexible question count & difficulty (Easy, Medium, Hard)',
                                        'Instant AI paper compilation & solution key generation'
                                    ],
                                    color: '#672AEA',
                                    bg: '#F3E8FF'
                                },
                                {
                                    icon: BookOpen,
                                    badge: '10+ Yrs PYQs',
                                    title: 'Comprehensive Question Repositories',
                                    desc: 'NCERT textbook questions, 10+ years of previous year board papers (PYQs), and high-yield competitive entrance mocks.',
                                    bullets: [
                                        'Class 1-12 NCERT topic-wise practice drills',
                                        '10+ years solved previous year board papers',
                                        'JEE Main, NEET UG & Olympiad mock series'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: Clock,
                                    badge: 'Real Exam Simulation',
                                    title: 'Timed NTA Pattern Engine',
                                    desc: 'Practice under real exam conditions with countdown timers, question bookmarking, and instant solution explanations.',
                                    bullets: [
                                        'Exact NTA online exam interface & navigation',
                                        'Instant step-by-step solution explanations',
                                        'Real-time timer & question status indicators'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    icon: Activity,
                                    badge: 'Precision Analytics',
                                    title: 'Subject Weakness Heatmaps',
                                    desc: 'Identify specific chapters where you lose marks and get personalized recommendations to turn weak topics into strengths.',
                                    bullets: [
                                        'Chapter-wise accuracy & speed breakdown',
                                        'Personalized topic revision recommendations',
                                        'Historical score trajectory & target tracker'
                                    ],
                                    color: '#D97706',
                                    bg: '#FEF3C7'
                                },
                                {
                                    icon: Trophy,
                                    badge: 'National Benchmarking',
                                    title: 'All-India Rank & Leaderboard',
                                    desc: 'Compare your test scores, speed, and accuracy against thousands of students nationwide on live leaderboards.',
                                    bullets: [
                                        'Predicted All-India Rank (AIR) percentiles',
                                        'National & institute live leaderboards',
                                        'Peer benchmarking accuracy & speed stats'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: Sparkles,
                                    badge: 'Instant Feedback',
                                    title: 'AI Revision & Detailed Explanations',
                                    desc: 'Review failed questions with Gemini AI step-by-step solution guides, concept hints, and formula memory cards.',
                                    bullets: [
                                        'Step-by-step AI solution explanations',
                                        'Instant concept revision & formula drills',
                                        'Automated re-test on incorrect questions'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                }
                            ].map((item, i) => {
                                const Icon = item.icon
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            background: '#FFFFFF',
                                            borderRadius: 24,
                                            padding: 32,
                                            border: '1px solid #E2E8F0',
                                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon size={24} />
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 800, background: item.bg, color: item.color, padding: '4px 12px', borderRadius: 999, letterSpacing: '0.04em' }}>
                                                    {item.badge}
                                                </span>
                                            </div>

                                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                                {item.title}
                                            </h3>

                                            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                                                {item.desc}
                                            </p>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                                                {item.bullets.map((b, j) => (
                                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                                                        <CheckCircle size={14} style={{ color: item.color, flexShrink: 0 }} /> {b}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* ── 3. VISUAL SHOWCASE & IMAGE OVERLAY ── */}
                <section style={{ padding: '60px 5%', background: '#F8FAFC' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                                Academic Excellence
                            </div>
                            <h3 style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', fontWeight: 800, color: '#0F172A', lineHeight: 1.3, marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Master Every Subject at Your Own Pace
                            </h3>
                            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>
                                Whether preparing for Class 10/12 Board Exams or competitive entrance tests like JEE and NEET, BeBrilliant gives you unlimited practice tests anytime, anywhere.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    '100% NCERT-Mapped Chapter Practice Drills',
                                    'Step-by-Step Detailed Answer Explanations',
                                    'Mobile-Optimized Exam Interface for On-the-Go Testing',
                                    'Instant Score Sharing with Parents & Teachers'
                                ].map((point, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#334155' }}>
                                        <CheckCircle size={16} style={{ color: '#2563EB' }} /> {point}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Image Showcase */}
                        <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 380, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: 'linear-gradient(180deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 58, 138, 0.85) 100%), url("/student_achievement.png")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                            <div style={{ position: 'relative', zIndex: 10, padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#FFFFFF' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                    Proven Results
                                </div>
                                <h4 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 4 }}>
                                    94.2% Higher Exam Score Confidence
                                </h4>
                                <p style={{ fontSize: 13, color: '#DBEAFE', margin: 0 }}>
                                    Join thousands of students practicing daily to achieve top ranks.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#2563EB', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Unlock Unlimited Practice Mocks Today
                        </h2>
                        <p style={{ fontSize: 16, color: '#DBEAFE', marginBottom: 28 }}>
                            Subscribe to the Student Practice Pass starting at just ₹199/month.
                        </p>
                        <Link
                            href="/pricing"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#1E3A8A',
                                padding: '15px 34px',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 800,
                                textDecoration: 'none'
                            }}
                        >
                            Get Student Practice Pass <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
