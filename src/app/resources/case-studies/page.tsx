'use client'

import React from 'react'
import Link from 'next/link'
import {
    BookOpen, Building, TrendingUp, CheckCircle, ArrowRight,
    Sparkles, Award, Users, Star, Layers, ShieldCheck
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function CaseStudiesPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', marginBottom: 20 }}>
                            <BookOpen size={14} /> Real World Impact · Institutional Case Studies
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            How Leading Indian Institutions Scale with BeBrilliant
                        </h1>

                        <p style={{ fontSize: 17, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Read in-depth transformation stories of coaching chains, schools, and competitive entrance academies that automated exams and boosted student ranks.
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
                                Schedule Demo for Your Campus <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. CASE STUDY CARDS GRID ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                In-Depth Transformations
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Measurable Results Delivered across India
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
                            {[
                                {
                                    name: 'Apex JEE & NEET Coaching Academy',
                                    category: 'Coaching Chain · 12 Branches',
                                    metric: '92% Faster Paper Setting',
                                    desc: 'Automated weekly test creation for 8,000+ NEET & JEE aspirants across 12 branches using Gemini AI & Ready Question Banks.',
                                    outcomes: [
                                        'Saved 45+ faculty hours per branch weekly',
                                        'Zero paper leakage with 4-set dynamic shuffling',
                                        'Instant WhatsApp score alerts sent to parents'
                                    ],
                                    color: '#2563EB',
                                    bg: '#EFF6FF'
                                },
                                {
                                    name: 'St. Xavier\'s Group of Schools',
                                    category: 'K-12 School Network · 5 Campuses',
                                    metric: '3.8x Student Retention',
                                    desc: 'Implemented White-Label custom domain exam platform for Class 6-12 mid-term and final examinations.',
                                    outcomes: [
                                        '100% NCERT blueprint exam compliance',
                                        'Custom school domain & branded report cards',
                                        'Automated parent fee payment sync via Razorpay'
                                    ],
                                    color: '#059669',
                                    bg: '#ECFDF5'
                                },
                                {
                                    name: 'Vision IAS & State Board Classes',
                                    category: 'Competitive Test Prep · Hybrid',
                                    metric: '180,000 OMR Sheets Evaluated',
                                    desc: 'Combined offline printed OMR sheet testing with mobile camera scanning for zero-delay rank list generation.',
                                    outcomes: [
                                        'Evaluated 15,000+ monthly offline OMR sheets',
                                        '99.9% scanning precision with mobile cameras',
                                        'All-India Rank percentiles published within 1 hour'
                                    ],
                                    color: '#7C3AED',
                                    bg: '#F3E8FF'
                                }
                            ].map((item, i) => (
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, background: item.bg, color: item.color, padding: '4px 12px', borderRadius: 999, letterSpacing: '0.04em' }}>
                                                {item.category}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                            {item.name}
                                        </h3>

                                        <div style={{ fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 12 }}>
                                            {item.metric}
                                        </div>

                                        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                                            {item.desc}
                                        </p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                                            {item.outcomes.map((o, j) => (
                                                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                                                    <CheckCircle size={14} style={{ color: item.color, flexShrink: 0 }} /> {o}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 3. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#0F172A', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Write Your Institution's Success Story
                        </h2>
                        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28 }}>
                            Schedule a consultation with our EdTech specialists.
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
                            Request Institutional Demo <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
