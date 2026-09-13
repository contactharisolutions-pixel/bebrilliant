'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ExperimentalHero } from '@/components/home/ExperimentalHero'
import { SovereignStatsStrip } from '@/components/home/SovereignStatsStrip'
import { EditorialSyllabusSection } from '@/components/home/EditorialSyllabusSection'
import { InstitutionalTrustStrip } from '@/components/home/InstitutionalTrustStrip'
import { EditorialCapabilitiesSection } from '@/components/home/EditorialCapabilitiesSection'
import { EditorialRolesSection } from '@/components/home/EditorialRolesSection'
import { EditorialTestimonialsSection } from '@/components/home/EditorialTestimonialsSection'
import { EditorialMobileAppsSection } from '@/components/home/EditorialMobileAppsSection'
import { EditorialClosingCta } from '@/components/home/EditorialClosingCta'

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-worksans antialiased text-[#0F172A] selection:bg-[#001D3D] selection:text-white">
            <PublicHeader />
            <main>
                {/* ─── INSTITUTIONAL NOTICE BAR ──────────────────────────────── */}
                <aside
                    aria-label="Platform Announcement"
                    className="bg-[#00142A] border-b border-white/10 text-slate-300 py-2.5 px-4 sm:px-6 text-xs font-medium font-worksans"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-white">Institutional Update:</span>
                        <span>Multi-tenant WhatsApp affiliate architecture is now active across all sovereign portals.</span>
                        <Link
                            href="/features"
                            className="inline-flex items-center gap-1 text-[#38BDF8] hover:text-white font-bold transition-colors ml-1"
                        >
                            <span>Explore platform capabilities</span>
                            <ArrowRight size={12} />
                        </Link>
                    </div>
                </aside>

                {/* ─── 1. EXPERIMENTAL ART-DIRECTED HERO ─────────────────────── */}
                <ExperimentalHero />

                {/* ─── 2. SOVEREIGN TELEMETRY STATS STRIP ────────────────────── */}
                <SovereignStatsStrip />

                {/* ─── 3. EDITORIAL CURRICULAR SYLLABUS SECTION ──────────────── */}
                <EditorialSyllabusSection />

                {/* ─── 4. INSTITUTIONAL TRUST & COLLABORATORS ────────────────── */}
                <InstitutionalTrustStrip />

                {/* ─── 5. BESPOKE EDITORIAL CORE CAPABILITIES ────────────────── */}
                <EditorialCapabilitiesSection />

                {/* ─── 6. MULTI-ROLE GOVERNANCE MATRIX ───────────────────────── */}
                <EditorialRolesSection />

                {/* ─── 7. EDITORIAL REPUTATION & TESTIMONIALS ────────────────── */}
                <EditorialTestimonialsSection />

                {/* ─── 8. NATIVE MOBILE ECOSYSTEM ────────────────────────────── */}
                <EditorialMobileAppsSection />

                {/* ─── 9. SOVEREIGN CLOSING CALL TO ACTION ───────────────────── */}
                <EditorialClosingCta />
            </main>
            <PublicFooter />
        </div>
    )
}
