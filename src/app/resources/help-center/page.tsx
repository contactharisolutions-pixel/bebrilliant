'use client'

import React from 'react'
import Link from 'next/link'
import {
    LifeBuoy, BookOpen, ShieldCheck, Zap, ArrowRight,
    CheckCircle, MessageSquare, PhoneCall, FileText, Search
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function HelpCenterPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', marginBottom: 20 }}>
                            <LifeBuoy size={14} /> Documentation & Technical Support · Help Centre
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            How Can We Help You Today?
                        </h1>

                        <p style={{ fontSize: 17, color: '#BFDBFE', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Search setup guides, video tutorials, OMR scanning troubleshooting, and developer API documentations.
                        </p>

                        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Search help topics, setup guides, or error codes..."
                                style={{
                                    width: '100%',
                                    padding: '14px 20px 14px 50px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#FFFFFF',
                                    fontSize: 15,
                                    outline: 'none',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* ── 2. QUICK HELP CATEGORIES ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Knowledge Base Categories
                            </div>
                            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Step-by-Step User Guides & Support
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            {[
                                {
                                    icon: BookOpen,
                                    title: "Getting Started Guide",
                                    desc: "Learn how to configure school branding, import student rosters, and assign teacher accounts.",
                                    bullets: ["Account creation & domain setup", "Student CSV roster import", "Teacher role assignment"],
                                    color: "#2563EB",
                                    bg: "#EFF6FF"
                                },
                                {
                                    icon: Zap,
                                    title: "Creating Your First Exam",
                                    desc: "Step-by-step guide to generating AI question papers, setting test timers, and publishing exams.",
                                    bullets: ["Gemini AI paper synthesis", "Custom timer & mark allocation", "Batch assignment & publishing"],
                                    color: "#059669",
                                    bg: "#ECFDF5"
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "OMR & Mobile Scanner Support",
                                    desc: "Troubleshooting OMR printing templates, camera lighting tips, and scanning double-bubbled sheets.",
                                    bullets: ["Standard A4 OMR sheet printing", "Smartphone camera scanning tips", "Invalid roll number resolution"],
                                    color: "#7C3AED",
                                    bg: "#F3E8FF"
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
                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                                <Icon size={24} />
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
                <section style={{ padding: '70px 5%', background: '#1E3A8A', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Need Live Dedicated Technical Support?
                        </h2>
                        <p style={{ fontSize: 16, color: '#BFDBFE', marginBottom: 28 }}>
                            Our technical support team is available Monday through Saturday (9 AM - 7 PM IST).
                        </p>
                        <Link
                            href="/contact"
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
                            Contact Support Team <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
