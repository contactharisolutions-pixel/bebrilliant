'use client'

import React from 'react'
import Link from 'next/link'
import {
    FileText, Sparkles, BookOpen, Clock, ArrowRight,
    CheckCircle, Tag, TrendingUp
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function BlogKnowledgePage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60A5FA', marginBottom: 20 }}>
                            <FileText size={14} /> Knowledge Centre & Insights · Blog
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            EdTech Trends, Exam Blueprints & AI Assessment Strategies
                        </h1>

                        <p style={{ fontSize: 17, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Stay updated with official CBSE/ICSE exam pattern changes, AI paper-setting strategies, and digital campus transformation guides.
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
                                Subscribe to EdTech Insights <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. FEATURED ARTICLES GRID ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Knowledge Articles
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Featured Educational Guides & Analysis
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
                            {[
                                {
                                    title: "How Gemini AI is Revolutionizing CBSE & Entrance Exam Paper Setting",
                                    cat: "AI Assessment",
                                    read: "5 min read",
                                    desc: "Explore how Indian educators save 10+ hours weekly while maintaining strict NCERT blueprint alignment using AI generation.",
                                    date: "Aug 12, 2026",
                                    color: "#7C3AED",
                                    bg: "#F3E8FF"
                                },
                                {
                                    title: "OMR Camera Scanning vs CBT: Choosing the Right Hybrid Testing Mix",
                                    cat: "Exam Operations",
                                    read: "7 min read",
                                    desc: "A comprehensive operational breakdown comparing paper-based OMR mobile camera scanning with full CBT digital testing.",
                                    date: "Aug 08, 2026",
                                    color: "#059669",
                                    bg: "#ECFDF5"
                                },
                                {
                                    title: "5 Proven Strategies to Boost Student Exam Performance using Heatmaps",
                                    cat: "Student Analytics",
                                    read: "6 min read",
                                    desc: "Learn how subject-wise accuracy heatmaps help teachers turn individual student weakness areas into top ranks.",
                                    date: "Aug 02, 2026",
                                    color: "#2563EB",
                                    bg: "#EFF6FF"
                                }
                            ].map((post, i) => (
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, background: post.bg, color: post.color, padding: '4px 12px', borderRadius: 999, letterSpacing: '0.04em' }}>
                                                {post.cat}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {post.read}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', marginBottom: 10, lineHeight: 1.4, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                            {post.title}
                                        </h3>

                                        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                                            {post.desc}
                                        </p>
                                    </div>

                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{post.date}</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: post.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            Read Article <ArrowRight size={14} />
                                        </span>
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
                            Stay Ahead in EdTech Innovation
                        </h2>
                        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28 }}>
                            Get weekly insights on digital assessment, AI exam setting, and student analytics.
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
                            Subscribe to Newsletter <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
