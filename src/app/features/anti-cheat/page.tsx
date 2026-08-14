'use client'

import React from 'react'
import Link from 'next/link'
import {
    Lock, ShieldCheck, Eye, CheckCircle, ArrowRight,
    Sparkles, AlertCircle, RefreshCw, Layers, Award
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function AntiCheatPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #5B21B6 0%, #3B0764 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196, 181, 253, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#DDD6FE', marginBottom: 20 }}>
                            <Lock size={14} /> Feature Highlight · Anti-Cheat & Proctoring
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Algorithmic Anti-Cheat Supervision & Integrity Control
                        </h1>

                        <p style={{ fontSize: 17, color: '#DDD6FE', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Protect exam integrity with automated tab-switch tracking, randomized question jumbling, browser lockdown, and real-time candidate session logs.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#FFFFFF',
                                    color: '#5B21B6',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Demo Anti-Cheat Engine <ArrowRight size={16} />
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
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Integrity Protection
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Multilayer Safeguards Against Exam Malpractice
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: Eye,
                                    badge: 'Tab Switch Tracking',
                                    title: 'Tab & Window Focus Supervision',
                                    desc: 'Tracks whenever a candidate navigates away from the exam window or opens auxiliary browser tabs.',
                                    bullets: [
                                        'Real-time tab switch timestamp log',
                                        'Custom warning count limit before auto-disqualification',
                                        'Browser focus & blur event alerts'
                                    ],
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
                                },
                                {
                                    icon: RefreshCw,
                                    badge: 'Collusion Prevention',
                                    title: 'Randomized Question & Option Shuffling',
                                    desc: 'Algorithmic question pool randomization ensuring no two adjacent candidates receive the same question sequence.',
                                    bullets: [
                                        'Per-student dynamic question order shuffling',
                                        'Dynamic MCQ option permutation',
                                        'Unique set code assignment'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: Lock,
                                    badge: 'Browser Lockdown',
                                    title: 'Copy-Paste & Keyboard Lockdown',
                                    desc: 'Disables right-clicking, text selection, copy-paste shortcuts, and developer tool access during the test session.',
                                    bullets: [
                                        'Strict clipboard & selection lockout',
                                        'Shortcut key interception (Ctrl+C, Ctrl+V, F12)',
                                        'External display & screen capture prevention'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    icon: AlertCircle,
                                    badge: 'Session Audit Logs',
                                    title: 'Candidate Activity Timeline',
                                    desc: 'Detailed event timeline recording every click, answer submission, network drop, and warning triggered.',
                                    bullets: [
                                        'Second-by-second candidate activity stream',
                                        'Integrity risk score assigned per student',
                                        'Downloadable proctoring audit log for institute admins'
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
                <section style={{ padding: '70px 5%', background: '#5B21B6', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Ensure 100% Fair Examinations Today
                        </h2>
                        <p style={{ fontSize: 16, color: '#DDD6FE', marginBottom: 28 }}>
                            Protect your institution's credibility with smart anti-cheat supervision.
                        </p>
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#5B21B6',
                                padding: '15px 34px',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 800,
                                textDecoration: 'none'
                            }}
                        >
                            Request Anti-Cheat Demo <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
