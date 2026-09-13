'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap, BrainCircuit, BarChart3, ChevronRight, Activity } from 'lucide-react'

/**
 * EditorialCapabilitiesSection
 * 
 * DESIGN SYSTEM ARCHITECTURE:
 * - Workflow: Complete Premium Website Design Workflow (Phases 1-10)
 * - UX: Editorial asymmetry (60/40), anti-card default (zero boxed containers), progressive disclosure.
 * - Visual Art Direction: Primary environmental background (/assets/images/sections/section_optical_assessment_station_16x9.webp)
 *   grounding the narrative in tangible physical OMR hardware and modern academic laboratory daylight.
 * - Typography: High-contrast Manrope display H2, overline eyebrow, Work Sans editorial narrative.
 * - Responsive: Full-width edge-to-edge canvas with adaptive contrast gradient on desktop & mobile.
 */
export function EditorialCapabilitiesSection() {
    const [activePillarIndex, setActivePillarIndex] = useState(0)

    const PILLARS = [
        {
            id: 'omr-scanning',
            number: '01',
            title: 'Optical Assessment & OMR Scanning',
            badge: 'Hardware & Optical Suite',
            icon: Zap,
            headline: 'Sub-millimeter optical bubble detection at 120 sheets per minute.',
            description: 'Bridge physical paper examinations with digital record-keeping. Our proprietary optical calibration engine detects faint pencil markings, auto-corrects skew angles, and publishes grade rosters in seconds.',
            specs: [
                { label: 'Optical Velocity', value: '120 Sheets/min' },
                { label: 'Bubble Accuracy', value: '99.98%' },
                { label: 'Grade Publishing', value: 'Instant' }
            ],
            telemetry: 'OPTICAL SCANNER READY · 12ms LATENCY'
        },
        {
            id: 'anti-cheat-cbt',
            number: '02',
            title: 'AI Vision Anti-Cheat Proctoring',
            badge: 'Integrity Engine',
            icon: ShieldCheck,
            headline: 'Tab-switch interception and randomized question pool encryption.',
            description: 'Eliminate exam malpractice across online assessments. Active proctoring monitors browser focus, restricts copy-paste shortcuts, shuffles answer stems dynamically, and generates tamper-evident audit logs.',
            specs: [
                { label: 'Malpractice Reduction', value: '100%' },
                { label: 'Question Pools', value: 'Dynamic AIR' },
                { label: 'Browser Locking', value: 'Strict' }
            ],
            telemetry: 'AI PROCTORING ARMED · ZERO MALPRACTICE'
        },
        {
            id: 'ai-question-builder',
            number: '03',
            title: 'Cognitive Question Bank Authoring',
            badge: 'Generative Pedagogy',
            icon: BrainCircuit,
            headline: 'Curriculum-aligned question generation calibrated by Bloom’s taxonomy.',
            description: 'Empower faculty to produce rigorous chapter-wise worksheets and full-length term assessments in minutes. Direct mapping across CBSE, ICSE, JEE Main, and NEET syllabi with instant model answers and step-by-step solutions.',
            specs: [
                { label: 'Pre-loaded Questions', value: '500,000+' },
                { label: 'NCERT Alignment', value: '100%' },
                { label: 'Generation Speed', value: '< 3 seconds' }
            ],
            telemetry: 'COGNITIVE AI ENGINE · ONLINE'
        },
        {
            id: 'longitudinal-telemetry',
            number: '04',
            title: '360° Longitudinal Learning Analytics',
            badge: 'Decision Intelligence',
            icon: BarChart3,
            headline: 'Automated student diagnostic trajectory heatmaps for academic heads.',
            description: 'Move beyond simplistic aggregate scores. Identify systemic concept gaps across batches, track teacher syllabus pacing, predict board exam percentiles, and generate parent-ready circular reports automatically.',
            specs: [
                { label: 'Concept Diagnosed', value: 'Topic-Level' },
                { label: 'Report Generation', value: 'One-Click' },
                { label: 'Executive CSAT', value: '99.4%' }
            ],
            telemetry: 'ANALYTICS PIPELINE · SYNCHRONIZED'
        }
    ]

    const activePillar = PILLARS[activePillarIndex]
    const ActiveIcon = activePillar.icon

    return (
        <section
            aria-label="Core Academic Assessment Architecture"
            className="relative w-full min-h-[720px] lg:min-h-[840px] flex items-center overflow-hidden bg-[#001D3D]"
        >
            {/* 1. Full-Bleed Environmental Photographic Canvas (Zero card wrapper) */}
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-no-repeat transition-all duration-700"
                style={{
                    backgroundImage: `url('/assets/images/sections/section_optical_assessment_station_16x9.webp')`,
                    backgroundPosition: 'center right',
                }}
            />

            {/* 2. Directional Contrast Gradient Wash (Protects left-side text while revealing hardware on right) */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, #001226 0%, rgba(0, 18, 38, 0.96) 42%, rgba(0, 29, 61, 0.82) 64%, rgba(0, 29, 61, 0.25) 88%, transparent 100%)`
                }}
            />
            {/* Mobile Adaptive Full-Bleed Dark Tint */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none lg:hidden"
                style={{
                    background: `linear-gradient(180deg, rgba(0, 18, 38, 0.92) 0%, rgba(0, 29, 61, 0.85) 60%, rgba(0, 18, 38, 0.96) 100%)`
                }}
            />

            {/* 3. Editorial Layout Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    
                    {/* Left Column (7 Cols / ~60% Width): Pure Typographic & Interactive Storytelling */}
                    <div className="lg:col-span-8 xl:col-span-7 text-left">
                        
                        {/* Eyebrow / Overline */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span className="text-xs font-bold tracking-widest text-[#E0F2FE] uppercase font-worksans">
                                Proprietary Academic Engines
                            </span>
                        </div>

                        {/* Display H2 Heading */}
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.14] tracking-tight font-manrope mb-6">
                            The architecture of uncompromising exam integrity and cognitive intelligence.
                        </h2>

                        {/* Editorial Narrative */}
                        <p className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed mb-10 max-w-2xl font-worksans">
                            Uniting high-speed physical OMR bubble evaluation, AI anti-cheat online supervision, generative curriculum authoring, and longitudinal cohort telemetry into one sovereign cloud infrastructure.
                        </p>

                        {/* Bespoke Interactive Pillar Switcher (Zero boxed cards: pure typographic lines) */}
                        <div className="border-t border-b border-white/15 divide-y divide-white/10 mb-10">
                            {PILLARS.map((pillar, idx) => {
                                const isActive = activePillarIndex === idx
                                return (
                                    <button
                                        key={pillar.id}
                                        onClick={() => setActivePillarIndex(idx)}
                                        className={`w-full py-4 text-left flex items-center justify-between transition-all duration-200 group ${
                                            isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 sm:gap-6">
                                            <span className={`text-xs sm:text-sm font-mono font-bold ${
                                                isActive ? 'text-[#38BDF8]' : 'text-slate-500 group-hover:text-slate-400'
                                            }`}>
                                                {pillar.number}
                                            </span>
                                            <span className={`text-base sm:text-lg font-bold font-manrope ${
                                                isActive ? 'text-white' : 'text-slate-300'
                                            }`}>
                                                {pillar.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isActive && (
                                                <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-[#34D399] bg-[#064E3B]/60 border border-[#059669]/50 px-2.5 py-1 rounded-full">
                                                    Active Engine
                                                </span>
                                            )}
                                            <ChevronRight
                                                size={18}
                                                className={`transition-transform duration-200 ${
                                                    isActive ? 'rotate-90 text-[#38BDF8]' : 'text-slate-600 group-hover:text-slate-400'
                                                }`}
                                            />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Active Pillar Detailed Disclosure */}
                        <div className="mb-10 pl-2 border-l-2 border-[#38BDF8]">
                            <h3 className="text-xl sm:text-2xl font-bold text-white font-manrope mb-3">
                                {activePillar.headline}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-worksans mb-6 max-w-xl">
                                {activePillar.description}
                            </p>

                            {/* Unboxed Precision Metric Counters */}
                            <div className="grid grid-cols-3 gap-6 pt-2">
                                {activePillar.specs.map((spec, i) => (
                                    <div key={i}>
                                        <div className="text-lg sm:text-2xl font-extrabold text-white font-manrope">
                                            {spec.value}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium font-worksans mt-0.5">
                                            {spec.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Purposeful Action Hierarchy: 1 Primary CTA + 1 Secondary Action */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <Link
                                href="/request-demo"
                                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-[#001D3D] bg-white hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5"
                            >
                                <span>Schedule an architectural briefing</span>
                                <ArrowRight size={18} className="text-[#001D3D]" />
                            </Link>

                            <Link
                                href="/technology"
                                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-base text-white bg-white/10 hover:bg-white/15 border border-white/25 backdrop-blur-md active:scale-[0.98] transition-all duration-150"
                            >
                                <span>Explore technical specifications</span>
                            </Link>
                        </div>

                    </div>

                    {/* Right Column (4-5 Cols / ~40% Width): Live Hardware Telemetry Dock in Environmental Space */}
                    <div className="lg:col-span-4 xl:col-span-5 flex flex-col justify-end lg:h-full lg:pt-32">
                        {/* Minimalist Glassmorphic Telemetry Float */}
                        <div className="p-6 rounded-2xl bg-[#00142A]/80 border border-white/20 backdrop-blur-xl shadow-2xl text-left">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                                    <span className="text-xs font-mono font-bold text-white tracking-wide">
                                        HARDWARE ENGINE TELEMETRY
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-400">
                                    SLA 99.98%
                                </span>
                            </div>

                            <div className="text-sm font-semibold text-white font-manrope mb-2">
                                {activePillar.telemetry}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-worksans">
                                Monitored under DPDP sovereign cloud isolation with real-time replication across Mumbai and Bangalore availability zones.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
