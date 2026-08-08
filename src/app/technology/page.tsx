'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import {
    Code2, Server, Globe as GlobeIcon, ShieldCheck, Zap, Database, Cpu, Lock,
    ArrowRight, CheckCircle, ChevronRight, Activity, Layers,
    Wifi, BrainCircuit, Clock, RefreshCw, HardDrive, Monitor
} from 'lucide-react'

export default function TechnologyPage() {
    const [activePillar, setActivePillar] = useState(0)

    const TECH_PILLARS = [
        {
            number: '01',
            title: 'Frontend Architecture',
            shortTitle: 'Frontend',
            icon: Monitor,
            accent: '#38BDF8',
            accentBg: 'rgba(56, 189, 248, 0.12)',
            description: 'Server-side rendered Next.js 15 application with React 19, Manrope + Work Sans type system, and TailwindCSS 4 design tokens — built for sub-200ms Time to First Byte on mobile 3G.',
            stackItems: [
                { name: 'Next.js 15 App Router', badge: 'Core Framework', detail: 'Server Components + Streaming SSR for zero-CLS layout shifts and instant Largest Contentful Paint across all 6 user portals.' },
                { name: 'React 19 Concurrent', badge: 'UI Engine', detail: 'Concurrent rendering with Suspense boundaries eliminates loading spinners and renders exam interfaces at 60fps even under API latency.' },
                { name: 'TailwindCSS 4 Design System', badge: 'Styling Layer', detail: 'Atomic CSS design tokens with Manrope typeface for headings and Work Sans for body copy, ensuring consistent brand identity across portal skins.' },
                { name: 'TypeScript 5 Strict Mode', badge: 'Type Safety', detail: 'End-to-end type safety from API response shapes to UI component props, eliminating runtime crashes for critical exam submission flows.' }
            ],
            metrics: [{ val: '< 200ms', label: 'TTFB' }, { val: '100', label: 'Lighthouse' }, { val: '0 CLS', label: 'Layout Shift' }]
        },
        {
            number: '02',
            title: 'Backend & API Layer',
            shortTitle: 'Backend',
            icon: Server,
            accent: '#34D399',
            accentBg: 'rgba(52, 211, 153, 0.12)',
            description: 'Node.js edge runtime APIs with PostgreSQL 16, Redis caching, and Row-Level Security — designed to handle 50,000 concurrent exam takers without degradation.',
            stackItems: [
                { name: 'PostgreSQL 16 + RLS', badge: 'Primary Database', detail: 'Row-Level Security policies enforce strict multi-tenant data isolation — one institute\'s student data is never accessible from another\'s API session.' },
                { name: 'Redis 7 Cache Layer', badge: 'Caching Engine', detail: 'Aggressive edge caching of question paper data and user auth sessions reduces database load by 87% during live exam peak hours.' },
                { name: 'Supabase Real-Time', badge: 'Live Sync', detail: 'Supabase Channels push live exam monitoring signals, submission confirmations, and result unlock events to teacher dashboards in < 50ms.' },
                { name: 'Node.js Edge Runtime', badge: 'API Runtime', detail: 'Middleware-level country routing and edge API execution ensures Indian users access nearest PoP servers with sub-100ms API response times.' }
            ],
            metrics: [{ val: '50K+', label: 'Concurrent Users' }, { val: '87%', label: 'Cache Hit Rate' }, { val: '< 50ms', label: 'Real-Time Latency' }]
        },
        {
            number: '03',
            title: 'Security & Compliance',
            shortTitle: 'Security',
            icon: ShieldCheck,
            accent: '#A78BFA',
            accentBg: 'rgba(167, 139, 250, 0.12)',
            description: 'DPDP Act 2023 compliant architecture with AES-256 encryption at rest, mTLS in transit, and independent security audits — meeting ISO 27001 standards.',
            stackItems: [
                { name: 'DPDP Act 2023 Compliance', badge: 'Legal Framework', detail: 'Full compliance with India\'s Digital Personal Data Protection Act including consent management, data minimization, and right-to-erasure workflows for student records.' },
                { name: 'AES-256 Encryption at Rest', badge: 'Data Security', detail: 'All student PII, exam papers, and payment data encrypted with AES-256-GCM before database write — decryption keys stored in isolated HSM vault.' },
                { name: 'mTLS Certificate Pinning', badge: 'Transit Security', detail: 'Mutual TLS with certificate pinning on all mobile app API calls prevents man-in-the-middle attacks on exam submission and payment flows.' },
                { name: 'SOC 2 Type II Audit Trail', badge: 'Compliance', detail: 'Tamper-proof immutable audit logs for every admin action, question creation, and result modification event — mandatory for institutional compliance teams.' }
            ],
            metrics: [{ val: 'DPDP', label: 'Act Compliant' }, { val: 'AES-256', label: 'Encryption' }, { val: 'SOC 2', label: 'Type II Ready' }]
        },
        {
            number: '04',
            title: 'AI & Intelligence Engine',
            shortTitle: 'AI Engine',
            icon: BrainCircuit,
            accent: '#FB923C',
            accentBg: 'rgba(251, 146, 60, 0.12)',
            description: 'Gemini 1.5 Pro integration for intelligent question generation, automated solution key creation, and adaptive difficulty scoring — all within < 2s generation windows.',
            stackItems: [
                { name: 'Gemini 1.5 Pro Integration', badge: 'AI Core', detail: 'Multi-modal Gemini API generates MCQ, assertion-reasoning, and numerical questions from teacher-uploaded syllabus PDFs or topic keywords in < 2 seconds.' },
                { name: 'Bloom\'s Taxonomy Engine', badge: 'Difficulty AI', detail: 'Custom difficulty calibration model classifies each auto-generated question on a 6-tier Bloom\'s Taxonomy scale — ensuring balanced paper difficulty.' },
                { name: 'Anti-Cheat Shuffle Algorithm', badge: 'Proctoring AI', detail: 'Proprietary question and option shuffling engine generates 32 unique paper variants from a single template, making student collusion statistically impossible.' },
                { name: 'Smart Performance Analytics', badge: 'Analytics AI', detail: 'ML-powered cohort analysis identifies at-risk students, predicts AIR rank ranges, and flags learning gaps for teacher intervention dashboards.' }
            ],
            metrics: [{ val: '< 2s', label: 'AI Generation' }, { val: '32x', label: 'Paper Variants' }, { val: '95%', label: 'Prediction Accuracy' }]
        },
        {
            number: '05',
            title: 'Infrastructure & Reliability',
            shortTitle: 'Infrastructure',
            icon: Activity,
            accent: '#F472B6',
            accentBg: 'rgba(244, 114, 182, 0.12)',
            description: 'Multi-region deployment on AWS with Cloudflare CDN, automated failover, and a 99.9% uptime SLA — engineered for India\'s peak exam season traffic.',
            stackItems: [
                { name: 'AWS Multi-Region Deploy', badge: 'Cloud Backbone', detail: 'Primary workloads on AWS ap-south-1 (Mumbai) with automatic failover to ap-southeast-1 (Singapore) — ensuring zero downtime during AWS AZ outages.' },
                { name: 'Cloudflare Enterprise CDN', badge: 'Edge Network', detail: '300+ Cloudflare PoPs cache static question assets, exam assets, and media globally, delivering sub-50ms asset loads from Tier 2 and Tier 3 Indian cities.' },
                { name: 'Auto-Scaling Lambda Pools', badge: 'Elastic Compute', detail: 'Serverless compute pools auto-scale from 10 to 5,000 concurrent Lambda invocations within 30 seconds — matching Board exam day traffic spikes.' },
                { name: 'PostgreSQL Read Replicas', badge: 'Database Scaling', detail: '3 geographically distributed read replicas handle read-heavy analytics and reporting queries without impacting live exam write throughput.' }
            ],
            metrics: [{ val: '99.9%', label: 'Uptime SLA' }, { val: '300+', label: 'CDN PoPs' }, { val: '5K', label: 'Max Concurrent λ' }]
        }
    ]

    const active = TECH_PILLARS[activePillar]
    const ActiveIcon = active.icon

    return (
        <PageLayout
            title="Engineering Excellence"
            subtitle="Enterprise-grade technology infrastructure purpose-built for India's academic ecosystem."
            bgImage="/tech_hero.png"
        >
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-10 pb-28 font-worksans">

                {/* ─── HORIZONTAL PILLAR SWITCHER ─────────────────────────── */}
                <div className="flex items-stretch gap-3 overflow-x-auto pb-2 mb-16 no-scrollbar justify-start md:justify-center">
                    {TECH_PILLARS.map((p, idx) => {
                        const PIcon = p.icon
                        const isActive = activePillar === idx
                        return (
                            <button
                                key={p.number}
                                onClick={() => setActivePillar(idx)}
                                className="flex flex-col items-start gap-2 px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer border min-w-[140px]"
                                style={{
                                    background: isActive ? '#0F172A' : '#FFFFFF',
                                    borderColor: isActive ? '#0F172A' : '#E2E8F0',
                                    boxShadow: isActive ? '0 8px 24px -6px rgba(15,23,42,0.35)' : 'none',
                                    transform: isActive ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md" style={{
                                        background: isActive ? p.accentBg : '#F1F5F9',
                                        color: isActive ? p.accent : '#94A3B8'
                                    }}>
                                        {p.number}
                                    </span>
                                    <PIcon size={14} style={{ color: isActive ? p.accent : '#94A3B8' }} />
                                </div>
                                <span className="text-xs font-bold text-left leading-tight" style={{ color: isActive ? '#FFFFFF' : '#475569' }}>
                                    {p.shortTitle}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* ─── APPLE HERO SPLIT DEEP-DIVE PANEL ──────────────────────── */}
                <div
                    className="relative rounded-[36px] overflow-hidden mb-20 border"
                    style={{ background: '#0C1220', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 30px 60px -20px rgba(12, 18, 32, 0.6)' }}
                >
                    {/* BG image + gradient */}
                    <div
                        className="absolute inset-0 opacity-20 bg-cover bg-center transition-all duration-700"
                        style={{ backgroundImage: 'url("/tech_hero.png")' }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(12,18,32,0.97) 0%, rgba(12,18,32,0.80) 55%, rgba(12,18,32,0.65) 100%)' }} />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 80% 50%, ${active.accentBg}, transparent 55%)` }} />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[560px]">

                        {/* ── Left: Deep Info ─────────────────────────────── */}
                        <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-between border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            {/* Top badge + number */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border" style={{ background: active.accentBg, color: active.accent, borderColor: `${active.accent}40` }}>
                                        <ActiveIcon size={13} /> {active.number} · {active.shortTitle}
                                    </div>
                                </div>

                                <h2 className="text-3xl md:text-4xl font-extrabold text-white font-manrope leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
                                    {active.title}
                                </h2>

                                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed mb-8">
                                    {active.description}
                                </p>

                                {/* Metric chips */}
                                <div className="flex flex-wrap gap-4 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                    {active.metrics.map((m, i) => (
                                        <div key={i} className="text-left">
                                            <div className="text-2xl font-black font-manrope" style={{ color: active.accent }}>{m.val}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pillar mini-nav */}
                            <div className="mt-8 flex flex-col gap-2">
                                {TECH_PILLARS.map((p, idx) => {
                                    const PIco = p.icon
                                    const isA = idx === activePillar
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePillar(idx)}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer"
                                            style={{
                                                background: isA ? 'rgba(255,255,255,0.07)' : 'transparent',
                                                borderLeft: isA ? `3px solid ${p.accent}` : '3px solid transparent'
                                            }}
                                        >
                                            <PIco size={14} style={{ color: isA ? p.accent : '#475569', flexShrink: 0 }} />
                                            <span className="text-xs font-bold" style={{ color: isA ? '#FFFFFF' : '#64748B' }}>{p.title}</span>
                                            {isA && <ChevronRight size={14} className="ml-auto" style={{ color: p.accent }} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ── Right: Stack Detail Cards ────────────────────── */}
                        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col gap-4">
                            {/* Console header */}
                            <div className="flex items-center justify-between pb-4 border-b mb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                                    STACK SPECIFICATION · {active.title.toUpperCase()}
                                </span>
                            </div>

                            {active.stackItems.map((si, idx) => (
                                <div
                                    key={idx}
                                    className="group rounded-2xl p-5 border transition-all duration-300"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        borderColor: 'rgba(255,255,255,0.07)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                                        e.currentTarget.style.borderColor = `${active.accent}40`
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: active.accent }} />
                                            <h4 className="text-sm font-bold text-white font-manrope">{si.name}</h4>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0" style={{ color: active.accent, borderColor: `${active.accent}40`, background: active.accentBg }}>
                                            {si.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed pl-5">
                                        {si.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── FULL STACK ARCHITECTURE TIMELINE ───────────────────── */}
                <div className="text-center mb-12">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#1E3A8A] bg-[#1E3A8A]/08 px-4 py-1.5 rounded-full border border-[#1E3A8A]/20">
                        COMPLETE TECHNOLOGY STACK
                    </span>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-manrope mt-5 mb-2">
                        Every layer. Engineered for scale.
                    </h3>
                    <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto leading-relaxed">
                        From AI model inference to edge cache delivery — a full-stack architecture built for India's most demanding academic institutions.
                    </p>
                </div>

                {/* Vertical stack timeline */}
                <div className="relative mb-24">
                    {/* Vertical connector line */}
                    <div className="absolute left-[27px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-slate-200 via-slate-300 to-slate-100 hidden md:block" />

                    <div className="space-y-5">
                        {TECH_PILLARS.map((p, i) => {
                            const PIcon = p.icon
                            const isActive = activePillar === i
                            return (
                                <div
                                    key={i}
                                    className="group relative flex gap-6 md:gap-8 items-start cursor-pointer"
                                    onClick={() => {
                                        setActivePillar(i)
                                        window.scrollTo({ top: 300, behavior: 'smooth' })
                                    }}
                                >
                                    {/* Left number circle */}
                                    <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300"
                                        style={{
                                            background: isActive ? '#0F172A' : '#FFFFFF',
                                            borderColor: isActive ? p.accent : '#E2E8F0',
                                            boxShadow: isActive ? `0 0 0 4px ${p.accentBg}` : 'none'
                                        }}
                                    >
                                        <PIcon size={22} style={{ color: isActive ? p.accent : '#94A3B8' }} />
                                    </div>

                                    {/* Right content panel */}
                                    <div
                                        className="flex-1 rounded-3xl p-6 md:p-8 border transition-all duration-300"
                                        style={{
                                            background: isActive ? '#0F172A' : '#FFFFFF',
                                            borderColor: isActive ? p.accent + '60' : '#E2E8F0',
                                            boxShadow: isActive ? `0 15px 35px -10px rgba(15,23,42,0.3)` : '0 2px 8px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-mono font-extrabold" style={{ color: isActive ? p.accent : '#94A3B8' }}>{p.number}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isActive ? p.accent + 'CC' : '#94A3B8' }}>
                                                        BEBRILLIANT TECH LAYER
                                                    </span>
                                                </div>
                                                <h4 className="text-lg md:text-xl font-bold font-manrope" style={{ color: isActive ? '#FFFFFF' : '#0F172A' }}>
                                                    {p.title}
                                                </h4>
                                            </div>

                                            <div className="flex items-center gap-3 flex-wrap">
                                                {p.metrics.map((m, mi) => (
                                                    <div key={mi} className="text-center px-3 py-1.5 rounded-xl border" style={{ borderColor: isActive ? p.accent + '40' : '#E2E8F0', background: isActive ? p.accentBg : '#F8FAFC' }}>
                                                        <div className="text-sm font-black font-manrope" style={{ color: isActive ? p.accent : '#0F172A' }}>{m.val}</div>
                                                        <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: isActive ? p.accent + '99' : '#94A3B8' }}>{m.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: isActive ? '#94A3B8' : '#64748B' }}>
                                            {p.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {p.stackItems.map((si, sIdx) => (
                                                <span key={sIdx} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border" style={{
                                                    background: isActive ? p.accentBg : '#F1F5F9',
                                                    borderColor: isActive ? p.accent + '40' : '#E2E8F0',
                                                    color: isActive ? p.accent : '#475569'
                                                }}>
                                                    <CheckCircle size={10} style={{ color: isActive ? p.accent : '#94A3B8' }} />
                                                    {si.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ─── DARK BENCHMARK PERFORMANCE CONSOLE ─────────────────── */}
                <section className="relative rounded-[40px] overflow-hidden text-white mb-20"
                    style={{ background: 'linear-gradient(135deg, #060E1C 0%, #0D1F3C 60%, #0F2A1E 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 80px -30px rgba(6,14,28,0.8)' }}
                >
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(31,172,99,0.1), transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,75,147,0.12), transparent 50%)' }} />

                    <div className="relative z-10 p-10 md:p-16">
                        {/* Header */}
                        <div className="text-center mb-14">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-widest mb-5">
                                <Activity size={13} /> LIVE PERFORMANCE BENCHMARKS
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black font-manrope mb-4" style={{ letterSpacing: '-0.02em' }}>
                                Built to handle anything.
                            </h2>
                            <p className="text-slate-400 text-sm font-medium max-w-lg mx-auto leading-relaxed">
                                Battle-tested under India's peak Board exam traffic. These aren't theoretical limits — they're observed production benchmarks.
                            </p>
                        </div>

                        {/* Large benchmark grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
                            {[
                                { val: '99.9%', label: 'Platform Uptime SLA', icon: Activity, accent: '#34D399', sub: '12-month rolling average across all tenants' },
                                { val: '< 200ms', label: 'API Response Time (P95)', icon: Zap, accent: '#38BDF8', sub: 'Measured at Mumbai PoP during exam peak' },
                                { val: 'AES-256', label: 'Encryption Standard', icon: Lock, accent: '#A78BFA', sub: 'At-rest and in-transit for all student PII' },
                                { val: '50,000', label: 'Peak Concurrent Exams', icon: Users2, accent: '#FB923C', sub: 'Observed on JEE mock test series day' },
                                { val: '< 2 sec', label: 'AI Paper Generation', icon: BrainCircuit, accent: '#F472B6', sub: 'Gemini 1.5 Pro 30-question paper' },
                                { val: '300+', label: 'CDN Points of Presence', icon: GlobeIcon, accent: '#34D399', sub: 'Cloudflare Enterprise edge network' }
                            ].map((b, i) => {
                                const BIcon = b.icon || Activity
                                return (
                                    <div key={i} className="p-5 md:p-6 rounded-3xl border text-left" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: b.accent + '15', color: b.accent }}>
                                            <BIcon size={20} />
                                        </div>
                                        <div className="text-3xl md:text-4xl font-black font-manrope mb-1" style={{ color: b.accent }}>{b.val}</div>
                                        <div className="text-xs font-bold text-white mb-2">{b.label}</div>
                                        <div className="text-[11px] text-slate-500 font-medium leading-snug">{b.sub}</div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Decorative live status bar */}
                        <div className="flex flex-wrap items-center justify-center gap-6 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            {[
                                { label: 'API Gateway', status: 'Operational' },
                                { label: 'Exam Engine', status: 'Operational' },
                                { label: 'Payment Processor', status: 'Operational' },
                                { label: 'AI Service', status: 'Operational' },
                                { label: 'CDN Network', status: 'Operational' }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.8)' }} />
                                    <span className="text-xs font-bold text-slate-400">{s.label}</span>
                                    <span className="text-[10px] font-bold text-emerald-400">{s.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FINAL CTA ───────────────────────────────────────────── */}
                <div className="text-center">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">ENTERPRISE TECHNOLOGY REVIEW</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-manrope mb-4">
                        Want a technical architecture walkthrough?
                    </h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto mb-8">
                        Our engineering team provides a dedicated technical onboarding session for institutional IT heads and CTO teams.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link href="/request-demo" className="inline-flex items-center gap-3 bg-[#1E3A8A] text-white px-8 py-4 rounded-2xl text-sm font-extrabold hover:bg-[#152A6E] transition-all shadow-xl shadow-blue-900/20 font-manrope">
                            Request Architecture Demo <ArrowRight size={16} />
                        </Link>
                        <Link href="/contact" className="inline-flex items-center gap-3 bg-white text-slate-700 px-8 py-4 rounded-2xl text-sm font-extrabold border border-slate-200 hover:bg-slate-50 transition-all font-manrope">
                            Talk to Engineering Team
                        </Link>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

// Inlined to avoid importing from lucide (Users2 might not be available)
function Users2({ size = 24, ...props }: { size?: number; [key: string]: any }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M14 19a6 6 0 0 0-12 0" />
            <circle cx="8" cy="9" r="4" />
            <path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8" />
        </svg>
    )
}
