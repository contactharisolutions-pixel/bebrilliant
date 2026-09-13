'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

/**
 * Experimental Homepage Hero Section
 * 
 * DESIGN SYSTEM IMPLEMENTATION:
 * 1. UI/UX Design: Full-width composition, anti-card default, intentional typographic hierarchy,
 *    and exactly one primary CTA + one secondary action.
 * 2. Visual Art Direction: The art-directed photographic background (/assets/images/hero/hero_cbse_institutional_leadership_16x9.webp)
 *    acts as the primary spatial environment. The subjects (principals in conference) occupy the right 40%,
 *    while the left 60% provides natural negative space for HTML typography.
 * 3. Responsive Architecture: Evaluated across Desktop (1440px+), Laptop (1024px), Tablet (768px), and Mobile (375px)
 *    with adaptive contrast gradients and touch-friendly targets.
 */
export function ExperimentalHero() {
    return (
        <section
            aria-label="Institutional Excellence Hero"
            className="relative w-full min-h-[640px] lg:min-h-[740px] xl:min-h-[800px] flex items-center overflow-hidden bg-[#001D3D]"
        >
            {/* 1. Full-Bleed Environmental Photographic Canvas (Zero card wrapper) */}
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-no-repeat transition-all duration-700"
                style={{
                    backgroundImage: `url('/assets/images/hero/hero_cbse_institutional_leadership_16x9.webp')`,
                    backgroundPosition: 'center right',
                }}
            />

            {/* 2. Responsive Directional Contrast Wash:
                   - Desktop: Deep institutional navy on the left (55%) tapering into transparent on the right (subjects visible).
                   - Mobile: Deeper full overlay to guarantee WCAG AAA legibility over vertical background. */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, #00142A 0%, rgba(0, 20, 42, 0.94) 38%, rgba(0, 29, 61, 0.72) 60%, rgba(0, 29, 61, 0.2) 85%, transparent 100%)`
                }}
            />
            {/* Ambient vertical subtle tint for mobile viewports */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none lg:hidden"
                style={{
                    background: `linear-gradient(180deg, rgba(0, 20, 42, 0.82) 0%, rgba(0, 20, 42, 0.6) 50%, rgba(0, 20, 42, 0.92) 100%)`
                }}
            />

            {/* 3. High-Contrast Typographic Staging (Left 55% Content-Safe Zone) */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
                <div className="max-w-2xl text-left">
                    
                    {/* Eyebrow / Overline */}
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
                        <Sparkles size={14} className="text-[#38BDF8]" />
                        <span className="text-xs font-bold tracking-widest text-[#E0F2FE] uppercase font-worksans">
                            Institutional Assessment Architecture
                        </span>
                    </div>

                    {/* Display H1 Typography */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-white leading-[1.12] tracking-tight font-manrope mb-6">
                        Architecting academic precision for India&apos;s leading schools and institutes.
                    </h1>

                    {/* Editorial Sub-copy in Content-Safe Space */}
                    <p className="text-base sm:text-lg md:text-xl text-slate-200 font-normal leading-relaxed mb-8 max-w-xl font-worksans">
                        A unified examination ecosystem powering high-speed OMR scanning, AI anti-cheat assessments, curriculum analytics, and institutional fee reconciliation in one authoritative platform.
                    </p>

                    {/* Purposeful Action Triggers: Exactly ONE Primary CTA + ONE Secondary Action */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
                        {/* Primary Dominant Action */}
                        <Link
                            href="/request-demo"
                            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-[#001D3D] bg-white hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5"
                        >
                            <span>Book a live institutional demo</span>
                            <ArrowRight size={18} className="text-[#001D3D]" />
                        </Link>

                        {/* Secondary Supporting Action */}
                        <Link
                            href="/features"
                            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-base text-white bg-white/10 hover:bg-white/15 border border-white/25 backdrop-blur-md active:scale-[0.98] transition-all duration-150"
                        >
                            <span>Explore platform features</span>
                        </Link>
                    </div>

                    {/* Trust Proof Metrics Strip (Unboxed, pure typography & iconography) */}
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-6 border-t border-white/15 text-xs sm:text-sm text-slate-300 font-medium font-worksans">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#34D399] flex-shrink-0" />
                            <span>Trusted by 500+ Indian institutions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#34D399] flex-shrink-0" />
                            <span>DPDP-compliant data isolation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#34D399] flex-shrink-0" />
                            <span>24-hour turnkey deployment</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
