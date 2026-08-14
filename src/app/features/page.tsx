'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import { 
    BrainCircuit, Wallet, Users, School, 
    CheckCircle, ShieldCheck, Zap, ArrowRight,
    Sparkles, Lock, TrendingUp, MessageSquare,
    ChevronRight, Check, Award, Layers, Monitor
} from 'lucide-react'

export default function FeaturesPage() {
    const [activeTab, setActiveTab] = useState(0)

    const FEATURE_CATEGORIES = [
        {
            id: 'exam-engine',
            number: '01',
            tabName: 'Smart Exam & Proctoring',
            category: 'Smart Exam & Proctoring Engine',
            subtitle: 'Gemini AI paper creation, randomized anti-cheat question sets, and real-time live exam supervision.',
            icon: BrainCircuit,
            color: '#004B93',
            badgeBg: '#EBF3FC',
            bgImage: '/tech_hero.png',
            highlights: ['Gemini AI Question Builder', 'Anti-Cheat Jumbling Engine', 'Instant Automated Solution Keys', 'Timed Exam Control'],
            metrics: [
                { val: '< 2s', label: 'AI Generation' },
                { val: '99.9%', label: 'Supervision SLA' },
                { val: '500K+', label: 'Question Bank' }
            ],
            items: [
                { title: 'Create Exams Easily', desc: 'Generate multi-choice and numerical questions instantly with Gemini AI support.' },
                { title: 'Randomized Question Sets', desc: 'Algorithmic question and option shuffling to eliminate student collusion.' },
                { title: 'Instant Evaluation', desc: 'Real-time automatic grading with detailed solution keys upon test submission.' },
                { title: 'Custom Exam Timers', desc: 'Set fixed time limits, window closing rules, and late-submission penalties.' }
            ]
        },
        {
            id: 'payments',
            number: '02',
            tabName: 'Payments & Revenue',
            category: 'Payments & Revenue Engine',
            subtitle: 'Seamless Razorpay UPI payouts, credit wallets, and automated fee reconciliation reports.',
            icon: Wallet,
            color: '#1FAC63',
            badgeBg: '#ECFDF5',
            bgImage: '/pricing_hero.png',
            highlights: ['1-Click UPI & QR Payments', 'Razorpay Automated Payouts', 'Paid & Free Test Wallets', 'Instant Tax Invoicing'],
            metrics: [
                { val: '0%', label: 'Failed Payouts' },
                { val: 'T+1', label: 'Bank Settlement' },
                { val: '100%', label: 'GST Compliant' }
            ],
            items: [
                { title: 'Click-to-Pay UPI', desc: 'Students can purchase exam series seamlessly via PhonePe, Paytm, Google Pay or Cards.' },
                { title: 'Credit & Wallet Rules', desc: 'Assign free test credits for trial students while monetizing premium exam series.' },
                { title: 'Fast Automated Payouts', desc: 'Revenues collected are automatically settled directly into your institute bank account.' },
                { title: 'Clear Financial Audit', desc: 'Download comprehensive financial ledgers, GST tax invoices, and revenue splits.' }
            ]
        },
        {
            id: 'growth',
            number: '03',
            tabName: 'WhatsApp & Referral Growth',
            category: 'WhatsApp & Referral Growth',
            subtitle: 'Turn your students and faculty into brand ambassadors with 1-click WhatsApp referral engine.',
            icon: Users,
            color: '#D97706',
            badgeBg: '#FEF3C7',
            bgImage: '/features_hero.png',
            highlights: ['WhatsApp Group Direct Share', 'Automated Referral Credits', 'Affiliate Commission Split', 'Viral Student Loops'],
            metrics: [
                { val: '3.4x', label: 'Student Growth' },
                { val: '1-Click', label: 'WhatsApp Share' },
                { val: '₹0', label: 'Ad Spend Cost' }
            ],
            items: [
                { title: 'WhatsApp Group Integration', desc: 'Share exam invite links directly to WhatsApp student groups with personalized previews.' },
                { title: 'Student Referral Rewards', desc: 'Automatically credit test wallet points when a student successfully invites a peer.' },
                { title: 'Affiliate Payout Tracker', desc: 'Track affiliate links and pay out commissions to partner creators and teachers.' },
                { title: 'Growth Analytics Console', desc: 'Identify your top-performing referral channels and campaign conversion rates.' }
            ]
        },
        {
            id: 'branding',
            number: '04',
            tabName: 'Branded Institutional Suite',
            category: 'Branded Institutional Suite',
            subtitle: 'Your own institutional identity with multi-tenant domain isolation and role-based permissions.',
            icon: School,
            color: '#7C3AED',
            badgeBg: '#F3E8FF',
            bgImage: '/about_hero.png',
            highlights: ['Whitelabel Domain Support', 'Role-Based Access Control', 'DPDP Data Compliance', 'Custom Logo & Themes'],
            metrics: [
                { val: '100%', label: 'Tenant Isolation' },
                { val: 'DPDP', label: 'Act Compliant' },
                { val: '256-bit', label: 'AES Encryption' }
            ],
            items: [
                { title: 'Custom Institute Identity', desc: 'Upload your official logo, favicon, color theme, and customized header branding.' },
                { title: 'Granular Role Portals', desc: 'Dedicated control panels for Owners, Admins, Teachers, Students, and Parents.' },
                { title: 'Enterprise Data Security', desc: 'End-to-end encrypted student databases with strict multi-tenant isolation.' },
                { title: 'Automated Report Cards', desc: 'Generate PDF performance cards with school branding for parent progress meetings.' }
            ]
        }
    ]

    const currentCat = FEATURE_CATEGORIES[activeTab]

    return (
        <PageLayout 
            title="Enterprise Capabilities" 
            subtitle="An exquisite, ultra-modern toolkit designed for India's leading educational institutions."
            bgImage="/features_hero.png"
        >
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-24 font-worksans">
                
                {/* ─── SEGMENTED TAB CONTROL BAR ─────────────────────────── */}
                <div className="bg-slate-100/90 border border-slate-200/80 p-1.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 shadow-inner mb-12">
                    {FEATURE_CATEGORIES.map((cat, idx) => {
                        const Icon = cat.icon
                        const isSelected = activeTab === idx
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(idx)}
                                className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs md:text-sm transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? 'bg-white text-[#004B93] shadow-md border border-slate-200/60 font-extrabold scale-[1.01]'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-semibold'
                                }`}
                            >
                                <Icon size={16} className={isSelected ? 'text-[#004B93]' : 'text-slate-500'} />
                                <span className="truncate">{cat.tabName}</span>
                            </button>
                        )
                    })}
                </div>

                {/* ─── HERO FEATURE SHOWCASE ──────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl mb-16 text-left">
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 transition-all duration-700"
                        style={{ backgroundImage: `url("${currentCat.bgImage}")` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-12 items-center">
                        
                        {/* Left Info Column */}
                        <div className="lg:col-span-7 space-y-5">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                                <Sparkles size={12} /> {currentCat.number} · {currentCat.tabName}
                            </div>
                            
                            <h2 className="text-2xl md:text-4xl font-extrabold text-white font-manrope leading-tight tracking-tight">
                                {currentCat.category}
                            </h2>

                            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
                                {currentCat.subtitle}
                            </p>

                            {/* Key Highlights Checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                {currentCat.highlights.map((h, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-slate-200">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                            <Check size={11} strokeWidth={3} />
                                        </div>
                                        <span>{h}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Metrics Strip */}
                            <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-800/80">
                                {currentCat.metrics.map((m, i) => (
                                    <div key={i}>
                                        <div className="text-xl font-black text-white font-manrope">{m.val}</div>
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Interactive Console Mockup */}
                        <div className="lg:col-span-5">
                            <div className="rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 p-5 shadow-2xl space-y-3">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                        BEBRILLIANT OS
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {currentCat.items.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all text-left"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-xs font-bold text-white font-manrope flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    {item.title}
                                                </h4>
                                                <ChevronRight size={13} className="text-slate-500" />
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── 4-PILLAR BENTO GRID ─────────────────────────────────── */}
                <div className="text-center mb-10">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#004B93] bg-[#004B93]/10 px-3.5 py-1 rounded-full">
                        COMPLETE SUITE ARCHITECTURE
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-manrope mt-3 mb-1">
                        Designed for Every Educational Workflow
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm font-medium max-w-lg mx-auto">
                        Explore all 4 core pillars powering India's top academic institutions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 text-left">
                    {FEATURE_CATEGORIES.map((cat, i) => {
                        const Icon = cat.icon
                        return (
                            <div 
                                key={cat.id}
                                className="group relative rounded-2xl bg-white border border-slate-200/80 p-6 md:p-7 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: cat.badgeBg, color: cat.color }}>
                                            <Icon size={22} />
                                        </div>
                                        <span className="text-[11px] font-mono font-extrabold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                            PILLAR {cat.number}
                                        </span>
                                    </div>

                                    <h4 className="text-lg font-bold text-slate-900 mb-2 font-manrope group-hover:text-[#004B93] transition-colors">
                                        {cat.category}
                                    </h4>

                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5">
                                        {cat.subtitle}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                                        {cat.items.map((sub, sIdx) => (
                                            <div key={sIdx} className="bg-slate-50/80 border border-slate-200/60 p-3 rounded-xl">
                                                <div className="text-xs font-bold text-slate-900 font-manrope mb-0.5">{sub.title}</div>
                                                <div className="text-[11px] text-slate-500 leading-snug">{sub.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                                    <button 
                                        onClick={() => {
                                            setActiveTab(i)
                                            window.scrollTo({ top: 380, behavior: 'smooth' })
                                        }}
                                        className="text-xs font-bold text-[#004B93] inline-flex items-center gap-1.5 hover:gap-2.5 transition-all cursor-pointer"
                                    >
                                        Deep Dive Showcase <ArrowRight size={13} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ─── LUXURY CTA BANNER ───────────────────────────────────── */}
                <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-[#002C5B] to-slate-900 p-8 md:p-14 text-center text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,172,99,0.15),transparent_60%)]" />
                    
                    <div className="relative z-10 max-w-xl mx-auto space-y-5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                            <Sparkles size={12} /> Institutional Transformation
                        </div>

                        <h2 className="text-2xl md:text-4xl font-extrabold leading-tight font-manrope">
                            Ready to Elevate Your Digital Exam Suite?
                        </h2>

                        <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
                            Join 500+ Indian coaching centers, schools, and competitive exam institutes scaling with BeBrilliant.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                            <Link 
                                href="/request-demo" 
                                className="inline-flex items-center gap-2 bg-[#1FAC63] text-white px-7 py-3.5 rounded-xl text-sm font-extrabold shadow-lg hover:bg-[#199453] transition-all font-manrope"
                            >
                                Schedule Live Demo <ArrowRight size={16} />
                            </Link>
                            <Link 
                                href="/contact" 
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 rounded-xl text-sm font-extrabold border border-white/20 transition-all font-manrope"
                            >
                                Contact Enterprise Team
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
