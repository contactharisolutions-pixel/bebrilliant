'use client'

import React from 'react'
import Link from 'next/link'
import {
    Building, ShieldCheck, Globe, Sparkles, ArrowRight, CheckCircle2,
    School, UserCheck, GraduationCap, Award, Lock, Smartphone, LayoutDashboard,
    Layers, Zap, Check
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function WhiteLabelPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '100px 5% 80px', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    
                    {/* Glowing Accent Blobs */}
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        {/* Pill Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60A5FA', marginBottom: 24 }}>
                            <Sparkles size={14} /> Enterprise White-Label Solution
                        </div>

                        <h1 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 20 }}>
                            Your Own Branded Examination & Assessment Platform
                        </h1>

                        <p style={{ fontSize: 18, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 720, margin: '0 auto 36px' }}>
                            Deliver custom online exams, OMR evaluations, and AI question papers under your school or institute's own brand name, domain, and mobile application.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    color: '#FFFFFF',
                                    padding: '14px 32px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
                                }}
                            >
                                Request White-Label Demo <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/pricing"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#FFFFFF',
                                    padding: '14px 28px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                View Enterprise Pricing
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. WHAT IS WHITE-LABEL SECTION ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Institutional Identity
                            </div>
                            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                What is BeBrilliant White-Label?
                            </h2>
                            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 680, margin: '12px auto 0', lineHeight: 1.6 }}>
                                A turnkey digital examination ecosystem engineered to run on your custom web domain (e.g. <code style={{ background: '#F1F5F9', color: '#1E3A8A', padding: '2px 8px', borderRadius: 6, fontSize: 14 }}>exams.yourschool.edu.in</code>) with your custom logo, colors, and official seals.
                            </p>
                        </div>

                        {/* 3 Pillar Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: Globe,
                                    title: 'Custom Domain & Branding',
                                    desc: 'Use your own domain, custom logo, theme colors, and email sender signatures across all student communications.',
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: ShieldCheck,
                                    title: '100% Data Sovereignty',
                                    desc: 'Isolated institution database storage with strict DPDP compliance and full ownership of your exam question banks.',
                                    color: '#0CA35C',
                                    bg: '#DCFCE7'
                                },
                                {
                                    icon: Smartphone,
                                    title: 'Branded Portals & Mobile Apps',
                                    desc: 'Provide dedicated web & mobile portals for Admins, Teachers, Students, and Parents under your institution brand.',
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
                                }
                            ].map((card, i) => {
                                const Icon = card.icon
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            background: '#FFFFFF',
                                            borderRadius: 24,
                                            padding: 32,
                                            border: '1px solid #E2E8F0',
                                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div>
                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                                <Icon size={24} />
                                            </div>
                                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                                {card.title}
                                            </h3>
                                            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
                                                {card.desc}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* ── 3. HOW IT WORKS (4 PORTALS FLOW) ── */}
                <section style={{ padding: '80px 5%', background: '#F8FAFC' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Complete Ecosystem
                            </div>
                            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                How White-Label Works Across Roles
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                            {[
                                {
                                    step: '01',
                                    icon: School,
                                    role: 'School Admin',
                                    desc: 'Manage institution branches, configure exam schedules, oversee fee collections, and publish official rank lists.',
                                    perks: ['Branch Management', 'Batch Configuration', 'Fee Oversight']
                                },
                                {
                                    step: '02',
                                    icon: UserCheck,
                                    role: 'Teacher Portal',
                                    desc: 'Import question banks, generate paper sets with AI, supervise live exams, and record OMR evaluation marks.',
                                    perks: ['AI Paper Builder', 'OMR Evaluation', 'Live Proctoring']
                                },
                                {
                                    step: '03',
                                    icon: GraduationCap,
                                    role: 'Student Portal',
                                    desc: 'Take online tests on web or mobile, access instant solution keys, and view personal score analytics.',
                                    perks: ['Timed Test Engine', 'Instant Solutions', 'Leaderboard']
                                },
                                {
                                    step: '04',
                                    icon: Sparkles,
                                    role: 'Your Branding',
                                    desc: 'Custom domain SSL, white-labeled report cards, custom logos, and branded automated WhatsApp alerts.',
                                    perks: ['Custom SSL Domain', 'Branded PDFs', 'WhatsApp Alerts']
                                }
                            ].map((p, i) => {
                                const Icon = p.icon
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            background: '#FFFFFF',
                                            borderRadius: 20,
                                            padding: 28,
                                            border: '1px solid #E2E8F0',
                                            position: 'relative'
                                        }}
                                    >
                                        <span style={{ position: 'absolute', top: 20, right: 20, fontSize: 12, fontWeight: 900, color: '#CBD5E1', fontFamily: 'monospace' }}>
                                            {p.step}
                                        </span>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', color: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <Icon size={20} />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                            {p.role}
                                        </h3>
                                        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>
                                            {p.desc}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {p.perks.map((prk, j) => (
                                                <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                                                    <Check size={12} style={{ color: '#0CA35C' }} /> {prk}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* ── 4. BENEFITS FOR SCHOOLS ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Institutional Advantages
                            </div>
                            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Benefits for Schools & Coaching Chains
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            {[
                                { title: 'Elevate Brand Authority', desc: 'Position your institution as a tech-forward leader with your own proprietary examination software.' },
                                { title: 'Zero Maintenance & Cloud Overhead', desc: 'We handle servers, security patches, scaling, and database backups behind the scenes.' },
                                { title: 'Comprehensive Exam Coverage', desc: 'Support for Online CBT exams, offline OMR scanning, subjectives, and competitive entrance mocks.' },
                                { title: 'Instant Setup in Under 24h', desc: 'No lengthy custom development required. Launch your branded platform within 1 business day.' },
                                { title: 'Multi-Branch & Multi-Tenant Controls', desc: 'Central management for multiple centers, branches, and regional franchise networks.' },
                                { title: 'Automated Parent & Fee Reports', desc: 'Send automated PDF report cards and fee receipts with your institutional seal.' }
                            ].map((b, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        gap: 16,
                                        padding: 24,
                                        borderRadius: 18,
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0'
                                    }}
                                >
                                    <CheckCircle2 size={20} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                            {b.title}
                                        </h3>
                                        <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>
                                            {b.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 5. REQUEST DEMO CTA BANNER ── */}
                <section style={{ padding: '80px 5%', background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 16 }}>
                            Ready to Launch Your White-Label Examination Portal?
                        </h2>
                        <p style={{ fontSize: 16, color: '#DBEAFE', marginBottom: 32, lineHeight: 1.6 }}>
                            Schedule a 1-on-1 walkthrough with our institutional solutions team to preview your branded portal setup.
                        </p>
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#1E3A8A',
                                padding: '16px 36px',
                                borderRadius: 14,
                                fontSize: 16,
                                fontWeight: 800,
                                textDecoration: 'none',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                            }}
                        >
                            Book a White-Label Demo <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
