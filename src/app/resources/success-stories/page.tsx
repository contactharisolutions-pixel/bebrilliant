'use client'

import React from 'react'
import Link from 'next/link'
import {
    Star, Trophy, Award, CheckCircle, ArrowRight,
    Sparkles, Users, Heart, ThumbsUp
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function SuccessStoriesPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(221, 214, 254, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#DDD6FE', marginBottom: 20 }}>
                            <Star size={14} /> Student & Educator Triumphs · Success Stories
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Top Ranks, Empowered Teachers & Delighted Parents
                        </h1>

                        <p style={{ fontSize: 17, color: '#C4B5FD', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Discover inspiring journeys from AIR Top 100 entrance rankers, dedicated school teachers, and institute directors powered by BeBrilliant.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                            <Link
                                href="/request-demo"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#FFFFFF',
                                    color: '#7C3AED',
                                    padding: '14px 30px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Experience BeBrilliant <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 2. SUCCESS TESTIMONIAL GRID ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Verified Testimonials
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Real Stories from Our Community
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    quote: "BeBrilliant's chapter weakness heatmaps helped me identify my weak topics in Organic Chemistry. I improved my NEET score from 540 to 685!",
                                    name: "Aarav Sharma",
                                    role: "NEET UG AIR 48 Ranker",
                                    badge: "Student Ranker",
                                    stars: 5
                                },
                                {
                                    quote: "Generating custom paper sets with Gemini AI used to take hours. Now I compile 4 distinct test sets with answer keys in under 5 minutes.",
                                    name: "Dr. Sunita Deshmukh",
                                    role: "Senior Physics Faculty, Pune",
                                    badge: "Educator",
                                    stars: 5
                                },
                                {
                                    quote: "Having our own custom white-label domain gave our coaching center immense credibility. Our enrolments grew by 40% in just one season.",
                                    name: "Rajesh Varma",
                                    role: "Director, Varma Classes",
                                    badge: "Institute Director",
                                    stars: 5
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, background: '#F3E8FF', color: '#7C3AED', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.04em' }}>
                                                {item.badge}
                                            </span>
                                            <div style={{ display: 'flex', gap: 2, color: '#F59E0B' }}>
                                                {[...Array(item.stars)].map((_, s) => (
                                                    <Star key={s} size={14} fill="#F59E0B" />
                                                ))}
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 15, color: '#334155', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 24 }}>
                                            "{item.quote}"
                                        </p>
                                    </div>

                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{item.name}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{item.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 3. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#7C3AED', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Ready for Your Own Success Story?
                        </h2>
                        <p style={{ fontSize: 16, color: '#DDD6FE', marginBottom: 28 }}>
                            Join 48,000+ students and 500+ institutes achieving excellence daily.
                        </p>
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#FFFFFF',
                                color: '#7C3AED',
                                padding: '15px 34px',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 800,
                                textDecoration: 'none'
                            }}
                        >
                            Get Started Free <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
