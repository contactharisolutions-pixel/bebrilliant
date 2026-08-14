'use client'

import React from 'react'
import Link from 'next/link'
import {
    BrainCircuit, Sparkles, FileText, CheckCircle, ArrowRight,
    Zap, Layers, RefreshCw, Check, BookOpen, Award
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function AIGeneratorPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #4C1D95 0%, #312E81 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#DDD6FE', marginBottom: 20 }}>
                            <BrainCircuit size={14} /> Feature Highlight · Gemini AI Generator
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Generate Whole Question Papers in Under 5 Seconds
                        </h1>

                        <p style={{ fontSize: 17, color: '#C4B5FD', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Powered by Gemini AI — instantly synthesize NCERT-aligned MCQs, subjective questions, numerical problems, and solution keys with customizable difficulty weights.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#FFFFFF',
                                    color: '#4C1D95',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Try AI Paper Generator <ArrowRight size={16} />
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
                                AI Capabilities
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Next-Generation Automated Paper Synthesis
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: Sparkles,
                                    badge: '1-Click Synthesis',
                                    title: 'Multi-Format Question Generation',
                                    desc: 'Generates MCQs, Assertion-Reasoning, Short Answer, Long Answer, and Numerical problems instantly.',
                                    bullets: [
                                        'Automatic MCQ option distractor creation',
                                        'Assertion & Reasoning paired question synthesis',
                                        'Numerical problems with step-by-step solutions'
                                    ],
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
                                },
                                {
                                    icon: BookOpen,
                                    badge: 'NCERT & Board Aligned',
                                    title: 'Blueprint & Chapter Targeting',
                                    desc: 'Select specific subjects, chapters, and difficulty percentages (Easy, Medium, Hard) to match official board blueprints.',
                                    bullets: [
                                        '100% CBSE, ICSE & State Board syllabus mapping',
                                        'Custom difficulty weight controls (e.g. 40% Easy / 60% Hard)',
                                        'Topic-level concept tag filtering'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: FileText,
                                    badge: 'PDF & Word Export',
                                    title: 'Instant Solution Keys & Printing',
                                    desc: 'Generates answer keys and step-by-step explanations alongside formatted PDF paper exports ready for printing.',
                                    bullets: [
                                        'Print-ready PDF question papers with school logo',
                                        'Separate teacher answer key document',
                                        'Word (.docx) export for custom editing'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    icon: RefreshCw,
                                    badge: 'Infinite Variants',
                                    title: 'Anti-Collusion Paper Variants',
                                    desc: 'Generate multiple unique sets (Set A, Set B, Set C) of the same paper in one click to prevent cheating.',
                                    bullets: [
                                        'Generate 4 distinct sets instantly',
                                        'Shuffled question & option order',
                                        'Matching marking scheme across all sets'
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
                <section style={{ padding: '70px 5%', background: '#4C1D95', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Experience Gemini AI Paper Creation
                        </h2>
                        <p style={{ fontSize: 16, color: '#DDD6FE', marginBottom: 28 }}>
                            Save 10+ hours weekly on test preparation and paper setting.
                        </p>
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#4C1D95',
                                padding: '15px 34px',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 800,
                                textDecoration: 'none'
                            }}
                        >
                            Try AI Generator Free <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
