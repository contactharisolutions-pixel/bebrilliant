'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import {
    ArrowRight, CheckCircle, TrendingUp, Users, Award,
    Globe, Shield, Eye, Compass, Star, Building,
    ChevronRight, BookOpen, Lightbulb, Handshake, Sparkles
} from 'lucide-react'

/* ─── SUB-COMPONENT: Value Hero Card ────────────────────────────── */
function ValueHeroCard({
    icon: Icon, title, desc, accent, accentBg, bg, textColor, subTextColor, borderColor, principleNum, bgImage
}: {
    icon: React.ElementType, title: string, desc: string,
    accent: string, accentBg: string, bg: string, textColor: string, subTextColor: string, borderColor: string, principleNum: number, bgImage?: string
}) {
    return (
        <div className="relative rounded-[32px] overflow-hidden p-8 md:p-10 flex flex-col justify-between min-h-[280px]"
            style={{ background: bg, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px -15px rgba(12,24,41,0.4)' }}>
            {/* Background image at 50% opacity */}
            {bgImage && (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')`, opacity: 0.5 }} />
            )}
            {/* Colour tint overlay so text stays readable */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${bg}EE 0%, ${bg}99 60%, transparent 100%)` }} />
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(circle at 80% 20%, ${accentBg}, transparent 60%)` }} />
            <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: accentBg, color: accent }}>
                    <Icon size={22} />
                </div>
                <h4 className="text-xl md:text-2xl font-bold font-manrope mb-3" style={{ color: textColor }}>{title}</h4>
                <p className="text-sm font-medium leading-relaxed" style={{ color: subTextColor }}>{desc}</p>
            </div>
            <div className="relative z-10 mt-6 pt-6 border-t flex items-center gap-3" style={{ borderColor }}>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                    BeBrilliant Principle #{principleNum}
                </span>
            </div>
        </div>
    )
}

/* ─── SUB-COMPONENT: Value Compact Card ─────────────────────────── */
function ValueCompactCard({
    icon: Icon, title, desc, accent, accentBg, principleNum, bgImage
}: {
    icon: React.ElementType, title: string, desc: string,
    accent: string, accentBg: string, principleNum: number, bgImage?: string
}) {
    return (
        <div className="md:col-span-3 relative rounded-[28px] overflow-hidden bg-white border border-slate-200 p-7 flex flex-col gap-4 hover:shadow-lg hover:border-slate-300 transition-all">
            {/* Background image at 50% opacity */}
            {bgImage && (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')`, opacity: 0.5 }} />
            )}
            {/* White wash so text stays crisp */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 100%)' }} />
            <div className="relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: accentBg, color: accent }}>
                <Icon size={20} />
            </div>
            <div className="relative z-10">
                <h4 className="text-sm font-bold text-slate-900 font-manrope mb-2">{title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
            </div>
            <div className="relative z-10 mt-auto pt-3 border-t border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                    Principle #{principleNum}
                </span>
            </div>
        </div>
    )
}

/* ─── STAT CARD ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, val, label, bgImage }: { icon: React.ElementType, val: string, label: string, bgImage?: string }) {
    return (
        <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-5 text-center hover:shadow-md hover:border-slate-300 transition-all">
            {bgImage && (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')`, opacity: 0.5 }} />
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.75) 100%)' }} />
            <div className="relative z-10 w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: '#004B9312', color: '#004B93' }}>
                <Icon size={18} />
            </div>
            <div className="relative z-10 text-xl font-black text-slate-900 font-manrope">{val}</div>
            <div className="relative z-10 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-snug">{label}</div>
        </div>
    )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function AboutPage() {
    const [activeWhy, setActiveWhy] = useState(0)

    const STATS = [
        { val: '2022', label: 'Founded in Bangalore', icon: Building },
        { val: '20L+', label: 'Exams Delivered', icon: BookOpen },
        { val: '500+', label: 'Trusting Institutions', icon: Award },
        { val: '1,200+', label: 'Educators on Platform', icon: Users },
        { val: '4.95', label: 'Avg Educator Rating', icon: Star },
        { val: '₹0', label: 'Ad Spend for Growth', icon: TrendingUp },
    ]

    const WHY_US = [
        {
            number: '01',
            title: 'Built Ground-Up for Indian Education',
            desc: 'BeBrilliant is not an adapted foreign product. It is engineered from day one for the CBSE, ICSE, State Board, IIT-JEE, NEET, and competitive exam ecosystems of India — with local payment rails, Hindi UI support, and Tier 2-3 network optimization.',
            proof: ['UPI & Razorpay-native payments', 'Board-specific syllabus support', 'Vernacular language ready'],
            color: '#004B93', accent: '#38BDF8', accentBg: 'rgba(56,189,248,0.08)',
        },
        {
            number: '02',
            title: 'AI Capabilities Without Vendor Lock-In',
            desc: 'Our Gemini 1.5 Pro paper generation engine delivers exam-ready MCQ, assertion-reasoning, and numerical questions from any topic in < 2 seconds. Your question bank belongs to you — fully exportable, always.',
            proof: ['< 2s paper generation', "Bloom's Taxonomy difficulty AI", '500K+ question heritage bank'],
            color: '#1FAC63', accent: '#34D399', accentBg: 'rgba(52,211,153,0.08)',
        },
        {
            number: '03',
            title: 'Revenue Engine, Not Just an Exam Tool',
            desc: 'We are the only Indian edtech platform that combines exam infrastructure with a WhatsApp-native affiliate marketing engine and automated Razorpay fee collection — turning your students into a viral revenue channel.',
            proof: ['WhatsApp affiliate loops', 'Automated fee reconciliation', '3.4x enrolment growth avg.'],
            color: '#7C3AED', accent: '#A78BFA', accentBg: 'rgba(167,139,250,0.08)',
        },
        {
            number: '04',
            title: 'Enterprise Security at Startup Speed',
            desc: 'SOC 2-ready architecture, DPDP Act 2023 compliance, mTLS certificate pinning, and Row-Level Security in PostgreSQL — institutional-grade protection shipped with your first login, not after a compliance audit.',
            proof: ['DPDP Act 2023 compliant', 'AES-256 encryption at rest', 'SOC 2 Type II ready'],
            color: '#F0A026', accent: '#FB923C', accentBg: 'rgba(251,146,60,0.08)',
        },
    ]

    const COMPARISON_ROWS = [
        { cap: 'AI Question Generation', bb: '✓ Gemini 1.5 Pro', manual: '✗ Not possible', lms: '△ Basic templates', foreign: '✓ Available' },
        { cap: 'UPI / Indian Payments', bb: '✓ Native Razorpay', manual: '△ Cash only', lms: '✗ Foreign gateways', foreign: '✗ Stripe / foreign' },
        { cap: 'WhatsApp Affiliate Growth', bb: '✓ Built-in engine', manual: '✗ Not possible', lms: '✗ None', foreign: '✗ None' },
        { cap: 'DPDP Act 2023 Compliance', bb: '✓ Full compliance', manual: '✗ No audit trail', lms: '△ Partial', foreign: '✗ GDPR-aligned only' },
        { cap: 'Anti-Cheat Proctoring', bb: '✓ 32 paper variants', manual: '✗ Not possible', lms: '△ Basic shuffle', foreign: '✓ Available' },
        { cap: 'Sub-200ms Speed (India)', bb: '✓ 300+ CDN PoPs', manual: 'N/A', lms: '△ Variable', foreign: '✗ Global-only CDN' },
        { cap: 'Setup Time', bb: '✓ < 24 hours', manual: '✗ Weeks', lms: '△ Days', foreign: '✗ Weeks + training' },
        { cap: 'Dedicated Indian Support', bb: '✓ In-language team', manual: 'N/A', lms: '△ Email only', foreign: '✗ US timezone' },
    ]

    return (
        <PageLayout
            title="The Institution Behind BeBrilliant"
            subtitle="We exist for one purpose — to make every Indian educator unstoppable."
            bgImage="/about_hero.png"
        >
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-10 pb-28 font-worksans">

                {/* ─── MISSION + VISION HERO ──────────────────────────────── */}
                <section className="relative rounded-[36px] overflow-hidden mb-20 border"
                    style={{ background: '#0C1829', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 30px 60px -20px rgba(12,24,41,0.5)' }}>
                    <div className="absolute inset-0 opacity-25 bg-cover bg-center"
                        style={{ backgroundImage: 'url("/about_hero.png")' }} />
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(135deg, rgba(12,24,41,0.97) 0%, rgba(12,24,41,0.85) 55%, rgba(0,75,147,0.3) 100%)' }} />
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 85% 50%, rgba(31,172,99,0.12), transparent 55%)' }} />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[520px]">
                        {/* Left — Mission */}
                        <div className="p-8 md:p-14 flex flex-col justify-center border-r"
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border mb-7 self-start"
                                style={{ background: 'rgba(31,172,99,0.15)', color: '#34D399', borderColor: 'rgba(52,211,153,0.3)' }}>
                                <Compass size={13} /> Our Mission
                            </div>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-white font-manrope leading-tight mb-6"
                                style={{ letterSpacing: '-0.02em' }}>
                                Empowering those who<br />
                                <span style={{ background: 'linear-gradient(135deg, #34D399, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    shape India's future.
                                </span>
                            </h2>
                            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed max-w-xl mb-6">
                                Founded with a singular conviction — every teacher and institution owner in India deserves a digital infrastructure that is powerful enough for enterprise, yet simple enough to launch in 24 hours.
                            </p>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                                BeBrilliant is not a tool. It is a dedicated institutional partner — combining exam engineering, AI-powered paper creation, WhatsApp-native growth, and automated revenue collection into one unified platform.
                            </p>
                        </div>

                        {/* Right — Vision */}
                        <div className="p-8 md:p-14 flex flex-col justify-between gap-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border self-start"
                                style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)' }}>
                                <Eye size={13} /> Our Vision
                            </div>
                            <div>
                                <blockquote className="text-xl md:text-2xl font-bold text-white font-manrope leading-snug mb-6"
                                    style={{ letterSpacing: '-0.01em' }}>
                                    "To become the operating system powering every independent educational institution in India by 2030 — from a 3-teacher coaching centre in Jaipur to a 10,000-student university in Hyderabad."
                                </blockquote>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-sm font-manrope"
                                        style={{ background: 'linear-gradient(135deg, #004B93, #1FAC63)' }}>
                                        BB
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">BeBrilliant Founding Team</div>
                                        <div className="text-xs text-slate-400 font-medium">Bangalore, India · Est. 2022</div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                {STATS.slice(0, 4).map((s, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(255,255,255,0.06)', color: '#38BDF8' }}>
                                            <s.icon size={16} />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-white font-manrope">{s.val}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── IMPACT STATS STRIP ─────────────────────────────────── */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-24">
                    {STATS.map((s, i) => {
                        const statImages = [
                            '/about_hero.png',
                            '/features_hero.png',
                            '/happy_indian_students.png',
                            '/indian_edu_hero.png',
                            '/student_achievement.png',
                            '/tech_hero.png',
                        ]
                        return <StatCard key={i} icon={s.icon} val={s.val} label={s.label} bgImage={statImages[i % statImages.length]} />
                    })}
                </div>

                {/* ─── VALUES SECTION ─────────────────────────────────────── */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#004B93] bg-[#004B93]/08 px-4 py-1.5 rounded-full border border-[#004B93]/20">
                            CORE VALUES
                        </span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-manrope mt-5 mb-2" style={{ letterSpacing: '-0.02em' }}>
                            Principles we never compromise on.
                        </h3>
                        <p className="text-slate-500 text-sm font-semibold max-w-lg mx-auto leading-relaxed">
                            Six non-negotiable commitments that guide every product decision, partnership, and customer interaction at BeBrilliant.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Hero Value 1 */}
                        <div className="md:col-span-7">
                            <ValueHeroCard
                                icon={Eye}
                                title="Radical Transparency"
                                desc="No hidden fees. No opaque processes. Every rupee, every data point, every decision is visible to the institutions we serve."
                                accent="#38BDF8"
                                accentBg="rgba(56,189,248,0.1)"
                                bg="#0C1829"
                                textColor="#FFFFFF"
                                subTextColor="#94A3B8"
                                borderColor="rgba(255,255,255,0.06)"
                                principleNum={1}
                                bgImage="/about_hero.png"
                            />
                        </div>

                        {/* Hero Value 2 */}
                        <div className="md:col-span-5">
                            <ValueHeroCard
                                icon={Shield}
                                title="Uncompromising Privacy"
                                desc="Your students' data belongs to you — not us. Multi-tenant isolation and AES-256 encryption ensure complete institutional sovereignty."
                                accent="#34D399"
                                accentBg="rgba(52,211,153,0.1)"
                                bg="#064E3B"
                                textColor="#FFFFFF"
                                subTextColor="#A7F3D0"
                                borderColor="rgba(255,255,255,0.08)"
                                principleNum={2}
                                bgImage="/happy_indian_students.png"
                            />
                        </div>

                        {/* Compact Values 3–6 */}
                        <ValueCompactCard icon={Lightbulb} title="Educator-First Design" desc="Every feature is built around the lived reality of Indian educators — minimal tech overhead, maximum academic impact, zero learning curve." accent="#FB923C" accentBg="rgba(251,146,60,0.1)" principleNum={3} bgImage="/features_hero.png" />
                        <ValueCompactCard icon={Handshake} title="Partnership Over Profit" desc="We scale our revenue only when your institution scales. Affiliate payouts, fair pricing, and dedicated account managers prove our commitment." accent="#A78BFA" accentBg="rgba(167,139,250,0.1)" principleNum={4} bgImage="/indian_edu_hero.png" />
                        <ValueCompactCard icon={TrendingUp} title="Continuous Improvement" desc="Weekly product updates, AI model upgrades, and proactive security audits — we evolve so your institution never has to stand still." accent="#F472B6" accentBg="rgba(244,114,182,0.1)" principleNum={5} bgImage="/student_achievement.png" />
                        <ValueCompactCard icon={Globe} title="Inclusive Access" desc="From Tier 1 metro schools to Tier 3 coaching centres — our 300-PoP CDN ensures the same fast, reliable experience from any Indian city." accent="#34D399" accentBg="rgba(52,211,153,0.1)" principleNum={6} bgImage="/indian_school_hero.png" />
                    </div>
                </div>

                {/* ─── WHY US — INTERACTIVE PANEL ─────────────────────────── */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#1FAC63] bg-[#1FAC63]/08 px-4 py-1.5 rounded-full border border-[#1FAC63]/20">
                            WHY BEBRILLIANT
                        </span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-manrope mt-5 mb-2" style={{ letterSpacing: '-0.02em' }}>
                            Four reasons institutions choose us<br />over every alternative.
                        </h3>
                        <p className="text-slate-500 text-sm font-semibold max-w-lg mx-auto leading-relaxed">
                            Not generic SaaS features — specific architectural decisions made for Indian education.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Tab list */}
                        <div className="lg:col-span-4 flex flex-col gap-3">
                            {WHY_US.map((w, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveWhy(idx)}
                                    className="text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer"
                                    style={{
                                        background: activeWhy === idx ? '#0F172A' : '#FFFFFF',
                                        borderColor: activeWhy === idx ? w.color + '60' : '#E2E8F0',
                                        boxShadow: activeWhy === idx ? '0 10px 30px -10px rgba(15,23,42,0.3)' : 'none',
                                        borderLeft: activeWhy === idx ? `3px solid ${w.color}` : '3px solid transparent'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-mono font-extrabold block mb-1"
                                                style={{ color: activeWhy === idx ? w.accent : '#94A3B8' }}>{w.number}</span>
                                            <span className="text-sm font-bold font-manrope"
                                                style={{ color: activeWhy === idx ? '#FFFFFF' : '#0F172A' }}>{w.title}</span>
                                        </div>
                                        <ChevronRight size={16} style={{ color: activeWhy === idx ? w.accent : '#CBD5E1', flexShrink: 0 }} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Detail panel */}
                        <div className="lg:col-span-8">
                            {(() => {
                                const w = WHY_US[activeWhy]
                                return (
                                    <div className="rounded-[32px] overflow-hidden h-full"
                                        style={{ background: '#0F172A', border: `1px solid ${w.color}30`, boxShadow: '0 20px 50px -15px rgba(15,23,42,0.4)' }}>
                                        <div className="p-8 md:p-10 flex flex-col h-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border"
                                                    style={{ background: w.accentBg, color: w.accent, borderColor: w.accent + '40' }}>
                                                    {w.number} · WHY BEBRILLIANT
                                                </div>
                                            </div>
                                            <h4 className="text-xl md:text-2xl font-bold text-white font-manrope mb-5" style={{ letterSpacing: '-0.01em' }}>{w.title}</h4>
                                            <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed mb-8 flex-1">{w.desc}</p>
                                            <div className="flex flex-wrap gap-3 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                                {w.proof.map((p, pi) => (
                                                    <span key={pi} className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border"
                                                        style={{ background: w.accentBg, color: w.accent, borderColor: w.accent + '40' }}>
                                                        <CheckCircle size={11} strokeWidth={3} /> {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>

                {/* ─── COMPARISON TABLE ────────────────────────────────────── */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] bg-[#7C3AED]/08 px-4 py-1.5 rounded-full border border-[#7C3AED]/20">
                            VS THE ALTERNATIVES
                        </span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-manrope mt-5 mb-2">
                            How BeBrilliant compares.
                        </h3>
                        <p className="text-slate-500 text-sm font-semibold max-w-lg mx-auto">
                            An honest side-by-side versus the common alternatives Indian institutions use today.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <div className="grid grid-cols-12 bg-slate-900 px-6 py-5">
                            <div className="col-span-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Capability</div>
                            <div className="col-span-2 text-center text-xs font-extrabold text-emerald-400 uppercase tracking-widest">BeBrilliant</div>
                            <div className="col-span-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Manual</div>
                            <div className="col-span-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Generic LMS</div>
                            <div className="col-span-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Foreign Edtech</div>
                        </div>
                        {COMPARISON_ROWS.map((row, ri) => (
                            <div key={ri} className={`grid grid-cols-12 px-6 py-4 border-t border-slate-100 items-center ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                <div className="col-span-4 text-sm text-slate-700 font-medium">{row.cap}</div>
                                <div className="col-span-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg py-1.5 mx-2">{row.bb}</div>
                                <div className="col-span-2 text-center text-xs font-medium text-slate-500 py-1.5">{row.manual}</div>
                                <div className="col-span-2 text-center text-xs font-medium text-slate-500 py-1.5">{row.lms}</div>
                                <div className="col-span-2 text-center text-xs font-medium text-slate-500 py-1.5">{row.foreign}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── MANIFESTO CTA ───────────────────────────────────────── */}
                <section className="relative rounded-[40px] overflow-hidden text-white"
                    style={{ background: 'linear-gradient(135deg, #060E1C 0%, #0D1F3C 60%, #0A2118 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 80px -30px rgba(6,14,28,0.8)' }}>
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 15% 80%, rgba(31,172,99,0.12), transparent 45%), radial-gradient(circle at 85% 20%, rgba(0,75,147,0.15), transparent 45%)' }} />
                    <div className="relative z-10 p-10 md:p-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/08 border border-white/15 text-slate-300 text-xs font-extrabold uppercase tracking-widest mb-8">
                            <Sparkles size={13} className="text-yellow-400" /> OUR COMMITMENT TO INDIA
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black font-manrope mb-6 max-w-3xl mx-auto" style={{ letterSpacing: '-0.02em' }}>
                            "Technology should make great education accessible to every corner of India — not just the metros."
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto mb-10">
                            This is why we ship every update with Tier 2 and Tier 3 network performance as the primary constraint — not just Bangalore or Mumbai broadband.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/request-demo"
                                className="inline-flex items-center gap-3 bg-[#1FAC63] text-white px-8 py-4 rounded-2xl text-sm font-extrabold hover:bg-[#199453] hover:scale-105 transition-all font-manrope shadow-xl shadow-emerald-900/30">
                                Schedule Institutional Demo <ArrowRight size={16} />
                            </Link>
                            <Link href="/contact"
                                className="inline-flex items-center gap-3 bg-white/08 text-slate-300 px-8 py-4 rounded-2xl text-sm font-extrabold border border-white/12 hover:bg-white/12 transition-all font-manrope">
                                Talk to Our Founding Team
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
