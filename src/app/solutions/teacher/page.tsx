'use client'

import React from 'react'
import Link from 'next/link'
import {
    UserCheck, BrainCircuit, FileText, BarChart3, ShieldCheck,
    ArrowRight, CheckCircle, Sparkles, Zap, Award, BookOpen, Clock, Check
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function TeacherPlatformPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A7F3D0', marginBottom: 20 }}>
                            <UserCheck size={14} /> Teacher Platform & Assistant
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Create AI Paper Sets, Automate Grading & Track Every Student's Trajectory
                        </h1>

                        <p style={{ fontSize: 17, color: '#D1FAE5', fontWeight: 500, lineHeight: 1.6, maxWidth: 720, margin: '0 auto 32px' }}>
                            Designed specifically for school teachers, private tutors, and coaching faculty to save 10+ hours weekly on test preparation and evaluation.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#FFFFFF',
                                    color: '#064E3B',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Start Free Educator Trial <ArrowRight size={16} />
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
                                View Teacher Pricing
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. CORE TEACHER CAPABILITIES ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Dedicated Features
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Everything a Modern Educator Needs
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: BrainCircuit,
                                    badge: 'AI Powered · 95% Faster',
                                    title: 'Gemini AI Question Builder',
                                    desc: 'Instantly generate MCQs, subjective questions, and numerical problems aligned with NCERT & board blueprints.',
                                    bullets: [
                                        'Target by subject, chapter, and difficulty level',
                                        'One-click automated paper synthesis',
                                        'Export to PDF, Word, or online test format'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    icon: Zap,
                                    badge: 'Zero Manual Work',
                                    title: 'Instant Auto-Grading & Keys',
                                    desc: 'Automated evaluation for digital tests and instant score calculation with step-by-step solution keys.',
                                    bullets: [
                                        'Real-time automated mark computation',
                                        'Instant step-by-step solution keys for students',
                                        'Automated class rank list generation'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    icon: ShieldCheck,
                                    badge: '100% Fair Exams',
                                    title: 'Live Anti-Cheat Supervision',
                                    desc: 'Monitor active test-takers with tab-switch detection, randomized question pools, and live session logs.',
                                    bullets: [
                                        'Real-time tab-switch & window focus tracking',
                                        'Randomized question and option order shuffling',
                                        'Live student supervision dashboard'
                                    ],
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
                                },
                                {
                                    icon: BarChart3,
                                    badge: '360° Insights',
                                    title: 'Per-Student Weakness Analysis',
                                    desc: 'Identify student knowledge gaps, view subject-wise trends, and export automated report cards for parents.',
                                    bullets: [
                                        'Chapter-wise weakness heatmaps',
                                        'Individual score trajectory tracking',
                                        'Automated WhatsApp parent report sharing'
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
                                            justifyContent: 'space-between',
                                            position: 'relative'
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
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                                Effortless Exam Workflow
                            </div>
                            <h3 style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', fontWeight: 800, color: '#0F172A', lineHeight: 1.3, marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Spend Less Time Grading, More Time Inspiring
                            </h3>
                            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>
                                Teachers using BeBrilliant report cutting exam assembly time by 80% while providing parents with transparent, data-backed academic progress updates.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    'Bulk Question Import via CSV & Word files',
                                    'Customized PDF Question Paper Exports',
                                    'Parent Score Alerts & WhatsApp Integration',
                                    'Class-wise Average & Percentile Calculation'
                                ].map((point, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#334155' }}>
                                        <CheckCircle size={16} style={{ color: '#059669' }} /> {point}
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
                                    backgroundImage: 'linear-gradient(180deg, rgba(6, 78, 59, 0.2) 0%, rgba(6, 78, 59, 0.75) 100%), url("/images/indian_classroom.png")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                            <div style={{ position: 'relative', zIndex: 10, padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#FFFFFF' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                    Educator Impact
                                </div>
                                <h4 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 4 }}>
                                    Loved by 1,200+ Indian Teachers
                                </h4>
                                <p style={{ fontSize: 13, color: '#D1FAE5', margin: 0 }}>
                                    Streamlining exams for CBSE, ICSE, State Boards & Entrance Coaching.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#064E3B', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Ready to Transform Your Exam Workflow?
                        </h2>
                        <p style={{ fontSize: 16, color: '#A7F3D0', marginBottom: 28 }}>
                            Get started in 5 minutes with our ready-to-use question banks and AI generator.
                        </p>
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#064E3B',
                                padding: '15px 34px',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 800,
                                textDecoration: 'none'
                            }}
                        >
                            Start Free Educator Trial <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
