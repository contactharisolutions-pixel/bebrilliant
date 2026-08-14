'use client'

import React from 'react'
import Link from 'next/link'
import {
    ShieldCheck, Monitor, Clock, CheckCircle, ArrowRight,
    Sparkles, Lock, Layers, Zap, Check, AlertCircle, FileText
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function OnlineExaminationPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60A5FA', marginBottom: 20 }}>
                            <ShieldCheck size={14} /> Feature Highlight · Online Exam Engine
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Ultra-Secure, Scalable Digital Examination Engine
                        </h1>

                        <p style={{ fontSize: 17, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Conduct high-stakes CBT entrance exams, semester tests, and weekly quizzes with zero latency, NTA-style interfaces, and instant evaluation.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    color: '#FFFFFF',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
                                }}
                            >
                                Book Online Exam Demo <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/pricing"
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
                                View Plans
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. FEATURE CAPABILITY GRID ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Engine Capabilities
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Everything Needed to Run Flawless Digital Exams
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: Monitor,
                                    badge: 'NTA Exam Interface',
                                    title: 'NTA Pattern Exam Window',
                                    desc: 'Exact exam screen navigation with question palette, answered/unanswered indicators, and sectional switching.',
                                    bullets: [
                                        'Question palette with color status indicators',
                                        'Section-wise navigation & time bounds',
                                        'Supports English, Hindi & regional languages'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: Clock,
                                    badge: 'Precision Timers',
                                    title: 'Automated Test Timers & Submission',
                                    desc: 'Server-synchronized countdown timers preventing local clock tampering with auto-submission upon time expiry.',
                                    bullets: [
                                        'Server-side atomic countdown clock',
                                        'Auto-save answer drafts every 2 seconds',
                                        'Automated instant submission SLA'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    icon: Lock,
                                    badge: 'Anti-Tamper Lockout',
                                    title: 'Secure Full-Screen Lockout',
                                    desc: 'Prevents window switching, keyboard shortcut tricks, right-clicking, and unauthorized background apps.',
                                    bullets: [
                                        'Strict full-screen enforcement mode',
                                        'Tab switch counting & auto-disqualification',
                                        'Disables copy-paste & print-screen functions'
                                    ],
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
                                },
                                {
                                    icon: Zap,
                                    badge: 'Instant Results',
                                    title: 'Automated Mark Calculation',
                                    desc: 'Generates total scores, percentiles, negative marking calculations, and solution keys right after completion.',
                                    bullets: [
                                        'Custom negative marking rules (+4 / -1)',
                                        'Instant score breakdown & percentile generation',
                                        'Step-by-step solution key access control'
                                    ],
                                    color: '#D97706',
                                    bg: '#FEF3C7'
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

                {/* ── 3. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#0F172A', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Power Your Examinations with BeBrilliant
                        </h2>
                        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28 }}>
                            Experience seamless, zero-latency digital testing engineered for Indian education.
                        </p>
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#0F172A',
                                padding: '15px 34px',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 800,
                                textDecoration: 'none'
                            }}
                        >
                            Request Online Exam Demo <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
