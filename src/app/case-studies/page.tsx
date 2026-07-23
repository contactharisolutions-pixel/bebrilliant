'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import {
    Building2, GraduationCap, TrendingUp, ShieldCheck, Users, Zap,
    ArrowRight, CheckCircle2, ChevronRight, Award, BarChart3,
    Clock, Sparkles, FileText, Download, Share2
} from 'lucide-react'

/* ─── CASE STUDIES DATA ─────────────────────────────────────────── */
const CASE_STUDIES = [
    {
        id: 'zenith-academy',
        title: 'Zenith Academy (Kota & Jaipur)',
        tagline: 'Scaling JEE/NEET Mock Exams to 25,000+ Concurrent Students With Zero Downtime',
        category: 'Coaching Institute Chain',
        badge: 'FEATURED ENTERPRISE CASE STUDY',
        heroImage: '/student_achievement.png',
        logoText: 'ZENITH',
        stats: [
            { val: '25,000+', label: 'Peak Concurrent Test Takers' },
            { val: '99.99%', label: 'Exam Delivery Reliability' },
            { val: '84%', label: 'Reduction in Grading Turnaround' },
            { val: '3.2x', label: 'Student Admissions via Referral' },
        ],
        challenge: 'Zenith Academy was struggling with server crashes during synchronized Sunday mock tests for 25,000+ JEE aspirants across 6 branches in Rajasthan. Physical paper evaluation took 4+ days, delaying rank feedback.',
        solution: 'Migrated to BeBrilliant Enterprise Cloud with 300-PoP Edge CDN and Supabase Real-Time syncing. Deployed Gemini AI paper generation for 32 randomized set variants to eliminate test collusion.',
        results: [
            'Instant AIR rank generation within 5 seconds of test completion',
            'Zero server latency or connection drops during 3-hour mock exam peak',
            'Automated WhatsApp parent scorecard delivery boosting CSAT to 99.4%',
            'Integrated affiliate payouts driving 3,400+ new student signups in Q1'
        ],
        testimonial: {
            quote: 'BeBrilliant transformed our Sunday test series from an operational nightmare into our strongest marketing asset. The AI paper generator alone saves our faculty 30 hours every single week.',
            author: 'Dr. Rajesh Sharma',
            role: 'Academic Director & Founder, Zenith Academy'
        }
    },
    {
        id: 'nalanda-international',
        title: 'Nalanda International Schools',
        tagline: '100% Automated Fee Reconciliation & WhatsApp Parent Engagement for 4,500 Students',
        category: 'K-12 School Group',
        badge: 'ENTERPRISE DEPLOYMENT',
        heroImage: '/indian_school_hero.png',
        logoText: 'NALANDA',
        stats: [
            { val: '₹1.8 Cr', label: 'Monthly Fee Payouts Processed' },
            { val: '100%', label: 'Automated Razorpay Reconciliation' },
            { val: '3 Days', label: 'Admin Hours Saved Per Month' },
            { val: '98.5%', label: 'Parent Engagement Rate' },
        ],
        challenge: 'Manual fee collection via cash and cheques caused reconciliation delays, missing records, and constant follow-ups by class teachers, diverting focus from academics.',
        solution: 'Implemented BeBrilliant WhatsApp Fee & Billing Engine with instant UPI links, automated receipt generation, and real-time Razorpay settlement tracking for school management.',
        results: [
            '92% of parents settled term fees within 48 hours of automated WhatsApp reminders',
            'Eliminated paper receipt issuance completely, saving ₹2.4 Lakhs annually',
            'Unified student academic performance and fee history in one dashboard',
            'Full DPDP Act 2023 compliance with student data sovereignty guaranteed'
        ],
        testimonial: {
            quote: 'Fee collection used to take our administrative staff an entire week every month. With BeBrilliant, payments flow automatically into our accounts with zero friction for parents.',
            author: 'Suresh Kulkarni',
            role: 'Chief Administrative Officer, Nalanda Group of Schools'
        }
    },
    {
        id: 'concept-first',
        title: 'Concept First Commerce Classes',
        tagline: 'Growing From a Single Classroom to 4,000 Online Learners with Affiliate Referral Loops',
        category: 'Independent Coaching',
        badge: 'GROWTH SCALE-UP',
        heroImage: '/happy_indian_students.png',
        logoText: 'CONCEPT 1st',
        stats: [
            { val: '400%', label: 'Enrolment Growth in 6 Months' },
            { val: '₹4.2L', label: 'Affiliate Commissions Paid' },
            { val: '< 2 sec', label: 'AI Question Generation Speed' },
            { val: '4.9/5', label: 'Student Satisfaction Rating' },
        ],
        challenge: 'High customer acquisition costs via digital ads were eating into profit margins, making it difficult for an independent faculty of 4 teachers to scale across Maharashtra.',
        solution: 'Activated BeBrilliant WhatsApp Referral & Affiliate engine. Students received instant wallet credits and UPI cashbacks when friends enrolled through their unique referral link.',
        results: [
            'Zero performance marketing ad spend required to scale from 800 to 4,000 students',
            'Students earned up to ₹8,000/month promoting test series to peers',
            'AI-generated practice quizzes increased daily student app engagement by 320%',
            'Ranked #1 Commerce Test Series in Pune & Nashik regions'
        ],
        testimonial: {
            quote: 'Our students became our biggest growth partners. BeBrilliant\'s WhatsApp referral mechanism made organic growth 10x faster and cheaper than running Google or Meta ads.',
            author: 'Prof. Anjali Desai',
            role: 'Lead Educator & Founder, Concept First'
        }
    }
]

/* ─── INDUSTRY BREAKDOWN ─────────────────────────────────────────── */
const INDUSTRIES = [
    { title: 'IIT-JEE & NEET Institutes', impact: 'Sub-second AIR rank publishing & 32-variant anti-cheat papers', icon: GraduationCap, color: '#004B93' },
    { title: 'K-12 CBSE/ICSE Schools', impact: 'Automated WhatsApp fee collection & DPDP Act compliance', icon: Building2, color: '#1FAC63' },
    { title: 'State Board & UPSC Centers', impact: 'Vernacular question generator & multi-tenant teacher portals', icon: Award, color: '#7C3AED' },
    { title: 'University & College Chains', impact: 'Row-level security, SOC 2 compliance & API analytics pipelines', icon: ShieldCheck, color: '#F0A026' },
]

export default function CaseStudiesPage() {
    const [selectedTab, setSelectedTab] = useState(0)

    const activeCase = CASE_STUDIES[selectedTab]

    return (
        <PageLayout
            title="Institutional Success Stories"
            subtitle="Discover how India's top coaching centers, schools, and edtech leaders scale with BeBrilliant."
            bgImage="/student_achievement.png"
        >
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-10 pb-28 font-worksans">

                {/* ─── METRIC BANNER ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
                    {[
                        { val: '500+', label: 'Institutions Powered', sub: 'Across 18 Indian states' },
                        { val: '4.8M+', label: 'Exams Evaluated', sub: 'Sub-50ms response time' },
                        { val: '99.9%', label: 'Uptime Reliability SLA', sub: 'Zero exam disruptions' },
                        { val: '3.4x', label: 'Avg Enrolment Growth', sub: 'Via WhatsApp referral engine' },
                    ].map((stat, i) => (
                        <div key={i} className="relative rounded-3xl bg-white border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition-all">
                            <div className="text-3xl md:text-4xl font-black text-slate-900 font-manrope mb-1" style={{ color: i === 0 ? '#004B93' : i === 1 ? '#1FAC63' : i === 2 ? '#7C3AED' : '#F0A026' }}>
                                {stat.val}
                            </div>
                            <div className="text-xs font-extrabold text-slate-800 font-manrope mb-0.5">{stat.label}</div>
                            <div className="text-[11px] font-medium text-slate-400">{stat.sub}</div>
                        </div>
                    ))}
                </div>

                {/* ─── CASE STUDY SELECTOR TABS ───────────────────────────── */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-12 no-scrollbar">
                    {CASE_STUDIES.map((cs, idx) => (
                        <button
                            key={cs.id}
                            onClick={() => setSelectedTab(idx)}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex-shrink-0"
                            style={{
                                background: selectedTab === idx ? '#0F172A' : '#FFFFFF',
                                borderColor: selectedTab === idx ? '#004B93' : '#E2E8F0',
                                boxShadow: selectedTab === idx ? '0 10px 30px -10px rgba(15,23,42,0.35)' : 'none',
                                transform: selectedTab === idx ? 'translateY(-2px)' : 'none'
                            }}
                        >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs" style={{
                                background: selectedTab === idx ? 'rgba(56,189,248,0.15)' : '#F1F5F9',
                                color: selectedTab === idx ? '#38BDF8' : '#64748B'
                            }}>
                                0{idx + 1}
                            </div>
                            <div>
                                <div className="text-xs font-extrabold font-manrope" style={{ color: selectedTab === idx ? '#FFFFFF' : '#0F172A' }}>
                                    {cs.title.split('(')[0]}
                                </div>
                                <div className="text-[11px] font-medium" style={{ color: selectedTab === idx ? '#94A3B8' : '#64748B' }}>
                                    {cs.category}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* ─── APPLE HERO FEATURED CASE STUDY SHOWCASE ───────────── */}
                <div className="relative rounded-[36px] overflow-hidden mb-24 border" style={{ background: '#0C1829', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 30px 60px -20px rgba(12,24,41,0.5)' }}>
                    {/* Hero Background image with 50% opacity */}
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${activeCase.heroImage}')`, opacity: 0.5 }} />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(12,24,41,0.96) 0%, rgba(12,24,41,0.85) 60%, transparent 100%)' }} />

                    <div className="relative z-10 p-8 md:p-14">
                        {/* Top Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border" style={{ background: 'rgba(31,172,99,0.15)', color: '#34D399', borderColor: 'rgba(52,211,153,0.3)' }}>
                                <Sparkles size={13} /> {activeCase.badge}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                                CASE STUDY #{selectedTab + 1} OF {CASE_STUDIES.length}
                            </span>
                        </div>

                        {/* Title & Tagline */}
                        <h2 className="text-3xl md:text-5xl font-black text-white font-manrope leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
                            {activeCase.title}
                        </h2>
                        <p className="text-slate-300 text-lg md:text-xl font-medium max-w-3xl leading-relaxed mb-10">
                            {activeCase.tagline}
                        </p>

                        {/* Impact Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 p-6 rounded-3xl border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            {activeCase.stats.map((st, i) => (
                                <div key={i} className="text-left">
                                    <div className="text-2xl md:text-3xl font-black text-emerald-400 font-manrope mb-1">{st.val}</div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Deep Breakdown: Challenge vs Solution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="p-7 rounded-3xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-2">
                                    <Clock size={14} /> The Challenge
                                </div>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                    {activeCase.challenge}
                                </p>
                            </div>

                            <div className="p-7 rounded-3xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-3 flex items-center gap-2">
                                    <Zap size={14} /> The BeBrilliant Solution
                                </div>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                    {activeCase.solution}
                                </p>
                            </div>
                        </div>

                        {/* Quantifiable Results List */}
                        <div className="mb-12">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Key Outcomes & Quantifiable Results</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activeCase.results.map((res, rIdx) => (
                                    <div key={rIdx} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle2 size={12} />
                                        </div>
                                        <span className="text-sm text-slate-300 font-medium">{res}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Verified Testimonial Quote */}
                        <div className="p-8 rounded-3xl border relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(31,172,99,0.12) 0%, rgba(0,75,147,0.15) 100%)', borderColor: 'rgba(52,211,153,0.3)' }}>
                            <blockquote className="text-lg md:text-xl font-bold text-white font-manrope leading-snug mb-4">
                                "{activeCase.testimonial.quote}"
                            </blockquote>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <div className="text-sm font-black text-emerald-400 font-manrope">{activeCase.testimonial.author}</div>
                                    <div className="text-xs text-slate-400 font-medium">{activeCase.testimonial.role}</div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                                    <ShieldCheck size={12} className="text-emerald-400" /> VERIFIED CASE STUDY
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── INDUSTRY IMPACT GRID ───────────────────────────────── */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#004B93] bg-[#004B93]/08 px-4 py-1.5 rounded-full border border-[#004B93]/20">
                            PROVEN ACROSS ECOSYSTEMS
                        </span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-manrope mt-5 mb-2">
                            Tailored for every educational format.
                        </h3>
                        <p className="text-slate-500 text-sm font-semibold max-w-lg mx-auto leading-relaxed">
                            Whether you run a single-center coaching or a multi-state school network, our architecture adapts to your exact operational workflow.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {INDUSTRIES.map((ind, i) => {
                            const IndIcon = ind.icon
                            return (
                                <div key={i} className="rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${ind.color}15`, color: ind.color }}>
                                            <IndIcon size={24} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 font-manrope mb-3">{ind.title}</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{ind.impact}</p>
                                    </div>
                                    <Link href="/request-demo" className="inline-flex items-center gap-2 text-xs font-extrabold font-manrope" style={{ color: ind.color }}>
                                        Explore Architecture <ArrowRight size={13} />
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ─── CARTIER DARK CALL TO ACTION ────────────────────────── */}
                <section className="relative rounded-[40px] overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #060E1C 0%, #0D1F3C 60%, #0A2118 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 80px -30px rgba(6,14,28,0.8)' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 50%, rgba(31,172,99,0.15), transparent 50%)' }} />
                    <div className="relative z-10 p-10 md:p-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/08 border border-white/15 text-slate-300 text-xs font-extrabold uppercase tracking-widest mb-6">
                            <Sparkles size={13} className="text-emerald-400" /> READY TO TRANSFORM YOUR INSTITUTE?
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black font-manrope mb-6 max-w-2xl mx-auto" style={{ letterSpacing: '-0.02em' }}>
                            Join 500+ institutions scaling with BeBrilliant.
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto mb-10">
                            Book a 1-on-1 personalized demo tailored to your institution's specific student volume and operational workflow.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/request-demo" className="inline-flex items-center gap-3 bg-[#1FAC63] text-white px-8 py-4 rounded-2xl text-sm font-extrabold hover:bg-[#199453] hover:scale-105 transition-all font-manrope shadow-xl shadow-emerald-900/30">
                                Schedule Custom Demo <ArrowRight size={16} />
                            </Link>
                            <Link href="/contact" className="inline-flex items-center gap-3 bg-white/08 text-slate-300 px-8 py-4 rounded-2xl text-sm font-extrabold border border-white/12 hover:bg-white/12 transition-all font-manrope">
                                Speak with Solutions Architect
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
