'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ExperimentalHero } from '@/components/home/ExperimentalHero'
import { SovereignStatsStrip } from '@/components/home/SovereignStatsStrip'
import { InstitutionalTrustStrip } from '@/components/home/InstitutionalTrustStrip'
import { CapabilitiesSection } from '@/components/home/CapabilitiesSection'
import { AssessmentWorkflowSection } from '@/components/home/AssessmentWorkflowSection'
import { InstitutionalControlsSection } from '@/components/home/InstitutionalControlsSection'
import { EditorialTestimonialsSection } from '@/components/home/EditorialTestimonialsSection'
import { EditorialMobileAppsSection } from '@/components/home/EditorialMobileAppsSection'
import { CtaSection } from '@/components/home/CtaSection'
import { FaqSection } from '@/components/home/FaqSection'

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white font-worksans antialiased text-[#0F172A] selection:bg-[#001D3D] selection:text-white">
            <PublicHeader />
            <main>
                {/* ─── INSTITUTIONAL NOTICE BAR ──────────────────────────────── */}
                <aside
                    aria-label="Platform Announcement"
                    className="bg-[#00142A] border-b border-white/10 text-slate-300 py-2.5 px-4 sm:px-6 text-xs font-medium font-worksans"
                >
                    <div className="w-full mx-auto flex items-center justify-center gap-2 text-center flex-wrap">
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

                {/* ─── 3. INSTITUTIONAL TRUST & COLLABORATORS ────────────────── */}
                <InstitutionalTrustStrip />

                {/* ─── 4. BESPOKE EDITORIAL CORE CAPABILITIES ────────────────── */}
                <CapabilitiesSection />

                {/* ─── 5. ASSESSMENT WORKFLOW ────────────────────────────────── */}
                <AssessmentWorkflowSection />

                {/* ─── 6. INSTITUTIONAL CONTROLS ─────────────────────────────── */}
                <InstitutionalControlsSection />

                {/* ─── 7. EDITORIAL REPUTATION & TESTIMONIALS ────────────────── */}
                <EditorialTestimonialsSection />

                {/* ─── 8. NATIVE MOBILE ECOSYSTEM ────────────────────────────── */}
                <EditorialMobileAppsSection />

                {/* ─── 9. FREQUENTLY ASKED QUESTIONS ─────────────────────────── */}
                <FaqSection />

                {/* ─── 10. CLOSING CALL TO ACTION ────────────────────────────── */}
                <CtaSection />
            </main>
            <PublicFooter />
        </div>
    )
}
