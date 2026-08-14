'use client'

import React from 'react'
import Link from 'next/link'
import {
    FileText, BookOpen, Layers, CheckCircle, ArrowRight,
    Sparkles, Upload, Database, Search, Award
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function QuestionBankPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A5B4FC', marginBottom: 20 }}>
                            <FileText size={14} /> Feature Highlight · Central Question Bank
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            500,000+ Pre-Loaded Questions & Bulk Import Tools
                        </h1>

                        <p style={{ fontSize: 17, color: '#CBD5E1', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Access comprehensive NCERT, CBSE, ICSE, JEE & NEET repositories or upload your proprietary institution question banks via Word or CSV files.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Explore Question Bank <ArrowRight size={16} />
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
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Repository System
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Organize & Deploy Questions Effortlessly
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: Database,
                                    badge: '500,000+ Ready Questions',
                                    title: 'NCERT & Competitive Question Repositories',
                                    desc: 'Pre-loaded questions for Physics, Chemistry, Math, Biology, and General Knowledge from Class 6 to 12.',
                                    bullets: [
                                        '100% NCERT chapter & topic mapping',
                                        '10+ years solved previous year board papers (PYQs)',
                                        'JEE Main, NEET & Olympiad entrance level questions'
                                    ],
                                    color: '#4F46E5',
                                    bg: '#EEF2FF'
                                },
                                {
                                    icon: Upload,
                                    badge: 'Bulk Import',
                                    title: 'Word & CSV Import Engine',
                                    desc: 'Upload thousands of custom questions with LaTeX formulas, diagrams, and images from MS Word (.docx) or Excel.',
                                    bullets: [
                                        'MS Word table & image parser engine',
                                        'Support for KaTeX math formulas & chemical equations',
                                        'Automated duplicate question detection'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    icon: Search,
                                    badge: 'Smart Taxonomy',
                                    title: 'Granular Tagging & Search Filters',
                                    desc: 'Filter questions instantly by subject, chapter, sub-topic, difficulty level, and blooms taxonomy cognitive level.',
                                    bullets: [
                                        'Multi-level topic taxonomy structure',
                                        'Bloom\'s Taxonomy cognitive filters (Remember, Apply, Analyze)',
                                        'Instant key search & usage frequency tracking'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: Layers,
                                    badge: 'Proprietary Protection',
                                    title: 'Encrypted Institution Vault',
                                    desc: 'Store proprietary question banks in an encrypted private vault isolated strictly to your institution.',
                                    bullets: [
                                        'Strict multi-tenant question bank isolation',
                                        'Role-based access permissions for faculty',
                                        'Export permission controls & audit logs'
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
                <section style={{ padding: '70px 5%', background: '#1E293B', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Build Your Master Question Vault Today
                        </h2>
                        <p style={{ fontSize: 16, color: '#CBD5E1', marginBottom: 28 }}>
                            Accelerate exam paper creation with our 500K+ repository.
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
                            Demo Question Bank <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
