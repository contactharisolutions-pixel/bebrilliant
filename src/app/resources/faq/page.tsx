'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    HelpCircle, ChevronDown, Search, ArrowRight,
    CheckCircle, ShieldCheck, Zap, Lock, BookOpen
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function DetailedFAQPage() {
    const [activeCategory, setActiveCategory] = useState('all')
    const [openQuestion, setOpenQuestion] = useState<number | null>(0)
    const [searchQuery, setSearchQuery] = useState('')

    const FAQ_CATEGORIES = [
        { id: 'all', label: 'All Questions' },
        { id: 'platform', label: 'Platform & Setup' },
        { id: 'anticheat', label: 'Anti-Cheat & Security' },
        { id: 'ai', label: 'AI Paper Generator' },
        { id: 'pricing', label: 'Pricing & Payments' },
        { id: 'omr', label: 'OMR & Offline Exams' }
    ]

    const FAQS = [
        {
            category: 'platform',
            q: "How fast can an institution set up BeBrilliant?",
            a: "Setup takes less than 24 hours. Our onboarding team configures your domain SSL, uploads your official school logo & branding, and imports student rosters via CSV in a single business day."
        },
        {
            category: 'anticheat',
            q: "How does the Anti-Cheat Proctoring system prevent student collusion?",
            a: "BeBrilliant enforces browser lockdown, tab-switch monitoring, dynamic question/option shuffling, and live candidate session logs. If a student leaves the exam window, warnings are logged automatically."
        },
        {
            category: 'ai',
            q: "How accurate is the Gemini AI Question Paper Generator?",
            a: "Our AI model is 100% trained on NCERT textbook blueprints, CBSE, ICSE, JEE, and NEET syllabus standards. Teachers can review, edit, or regenerate any question before finalizing exam papers."
        },
        {
            category: 'omr',
            q: "Can we use ordinary printers to print OMR sheets?",
            a: "Yes! BeBrilliant generates standard A4 PDF OMR sheets that can be printed on any regular laser or inkjet printer. Scans can be processed using standard smartphone cameras or flatbed scanners with 99.9% precision."
        },
        {
            category: 'pricing',
            q: "Does BeBrilliant support online student fee collection via UPI?",
            a: "Yes. BeBrilliant integrates directly with Razorpay, supporting Google Pay, PhonePe, Paytm, Cards, and Net Banking with automated GST invoice generation and instant bank account settlements."
        },
        {
            category: 'platform',
            q: "Is student data DPDP and data-privacy compliant in India?",
            a: "Absolutely. All databases use AES-256 bit encryption with strict multi-tenant isolation, adhering strictly to the Digital Personal Data Protection (DPDP) Act of India."
        }
    ]

    const filteredFaqs = FAQS.filter(faq => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
        const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── 1. HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '90px 5% 70px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60A5FA', marginBottom: 20 }}>
                            <HelpCircle size={14} /> Knowledge & Help · Detailed FAQ
                        </div>

                        <h1 style={{ fontSize: 'clamp(30px, 3.8vw, 52px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 18 }}>
                            Frequently Asked Questions
                        </h1>

                        <p style={{ fontSize: 17, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 740, margin: '0 auto 32px' }}>
                            Everything you need to know about setting up BeBrilliant, AI paper generation, anti-cheat proctoring, and billing.
                        </p>

                        {/* Search Bar */}
                        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Search questions or keywords..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* ── 2. FAQ ACCORDION SECTION ── */}
                <section style={{ padding: '80px 5%', background: '#FFFFFF' }}>
                    <div style={{ maxWidth: 900, margin: '0 auto' }}>

                        {/* Category Filter Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 44 }}>
                            {FAQ_CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat.id
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        style={{
                                            padding: '8px 18px',
                                            borderRadius: 999,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            border: isActive ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                                            background: isActive ? '#EFF6FF' : '#FFFFFF',
                                            color: isActive ? '#2563EB' : '#475569',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {cat.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Accordion Questions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, i) => {
                                    const isOpen = openQuestion === i
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                borderRadius: 16,
                                                border: '1px solid #E2E8F0',
                                                background: '#FFFFFF',
                                                overflow: 'hidden',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <button
                                                onClick={() => setOpenQuestion(isOpen ? null : i)}
                                                style={{
                                                    width: '100%',
                                                    padding: '20px 24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: 'none',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                                    {faq.q}
                                                </span>
                                                <ChevronDown
                                                    size={18}
                                                    style={{
                                                        color: '#64748B',
                                                        transform: isOpen ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.2s ease',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div style={{ padding: '0 24px 20px', fontSize: 14, color: '#475569', lineHeight: 1.7, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                    No questions match your search query. Try searching for other terms or pick a category.
                                </div>
                            )}
                        </div>

                    </div>
                </section>

                {/* ── 3. CTA BANNER ── */}
                <section style={{ padding: '70px 5%', background: '#0F172A', color: '#FFFFFF', textAlign: 'center' }}>
                    <div style={{ maxWidth: 750, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 14 }}>
                            Still Have Questions?
                        </h2>
                        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28 }}>
                            Our product specialists are ready to answer any questions about campus deployment.
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
                            Speak with Our Team <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
