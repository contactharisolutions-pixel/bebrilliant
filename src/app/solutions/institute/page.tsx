'use client'

import React from 'react'
import Link from 'next/link'
import {
    School, Building, ShieldCheck, BarChart3, Wallet, MessageSquare,
    ArrowRight, CheckCircle, Sparkles, Trophy, Users, Globe, Layers, Zap
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function InstitutePlatformPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', marginBottom: 20 }}>
                            <School size={14} /> Institute Platform & Management System
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Scale Your Coaching Institute with Smart Exams, WhatsApp Growth & Fee Automation
                        </h1>

                        <p style={{ fontSize: 17, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            An all-in-one institutional engine for coaching centers and academies — manage student enrolments, CBT/OMR examinations, staff roles, and revenue collection.
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
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
                                }}
                            >
                                Request Institute Demo <ArrowRight size={16} />
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
                                View Institute Plans
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. CORE INSTITUTE PILLARS ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Institutional Suite
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Engineered for High-Growth Coaching Chains
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: ShieldCheck,
                                    badge: 'Hybrid Testing Engine',
                                    title: 'CBT & Offline OMR Examination',
                                    desc: 'Conduct both online computer-based tests and offline OMR-based assessments with automatic scanning & instant rank evaluation.',
                                    bullets: [
                                        'Support for online CBT & printed OMR scanning',
                                        'Instant paper checking & rank calculation',
                                        'Custom negative marking & sectional timers'
                                    ],
                                    color: '#1E3A8A',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: MessageSquare,
                                    badge: 'Growth Engine',
                                    title: 'WhatsApp Referral Engine',
                                    desc: 'Turn existing students and parents into advocates with unique WhatsApp referral links, tracking, and instant commission payouts.',
                                    bullets: [
                                        'Automated WhatsApp quick-share referral links',
                                        'Real-time lead conversion & payout tracking',
                                        'Zero customer acquisition marketing spend'
                                    ],
                                    color: '#0CA35C',
                                    bg: '#DCFCE7'
                                },
                                {
                                    icon: Wallet,
                                    badge: 'Razorpay Integration',
                                    title: 'Automated Fee Collection',
                                    desc: 'Razorpay-integrated online payments, automated receipts, pending fee alerts, GST invoicing, and weekly settlements.',
                                    bullets: [
                                        'Auto-generated GST tax receipts & ledger sync',
                                        'Automated WhatsApp pending fee reminders',
                                        'Direct bank account settlement payouts'
                                    ],
                                    color: '#D97706',
                                    bg: '#FEF3C7'
                                },
                                {
                                    icon: BarChart3,
                                    badge: 'Cohort Analytics',
                                    title: 'AIR Rank & Cohort Analytics',
                                    desc: 'Benchmarking dashboards providing All-India Rank (AIR) estimates, batch comparison charts, and subject accuracy splits.',
                                    bullets: [
                                        'Batch-wise performance comparison graphs',
                                        'Predicted All-India Rank (AIR) percentiles',
                                        'Executive multi-branch revenue & student KPIs'
                                    ],
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
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

                {/* ── 3. MULTI-BRANCH SHOWCASE ── */}
                <section style={{ padding: '60px 5%', background: '#F8FAFC' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'center' }}>
                        <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 380, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.85) 100%), url("/tech_hero.png")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                            <div style={{ position: 'relative', zIndex: 10, padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#FFFFFF' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                    Executive Dashboard
                                </div>
                                <h4 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 4 }}>
                                    Multi-Branch Governance
                                </h4>
                                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                                    Track revenue, student enrolments & exam performance across all center branches.
                                </p>
                            </div>
                        </div>

                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                                Operations Management
                            </div>
                            <h3 style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', fontWeight: 800, color: '#0F172A', lineHeight: 1.3, marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Run Your Entire Coaching Empire Centrally
                            </h3>
                            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>
                                BeBrilliant gives institute directors a single central console to oversee multi-branch faculty, student batches, exam schedules, and real-time financial health.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    'Role-Based Permissions for Admins, Faculty & Staff',
                                    'Automated GST Tax Invoicing & Ledger Reconciliation',
                                    'Multi-Branch Performance Benchmarking',
                                    'Integrated WhatsApp Communication Suite'
                                ].map((point, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#334155' }}>
                                        <CheckCircle size={16} style={{ color: '#2563EB' }} /> {point}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#1E3A8A', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Transform Your Institute's Examination Engine
                        </h2>
                        <p style={{ fontSize: 16, color: '#93C5FD', marginBottom: 28 }}>
                            Schedule a demo with our institutional growth specialists today.
                        </p>
                        <Link
                            href="/request-demo"
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
                            Request Institute Demo <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
