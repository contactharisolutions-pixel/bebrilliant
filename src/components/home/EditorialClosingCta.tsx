'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, PhoneCall, ShieldCheck } from 'lucide-react'

export function EditorialClosingCta() {
    return (
        <section
            aria-label="Institutional Call to Action"
            className="w-full bg-[#001D3D] text-white py-24 lg:py-32 px-6 sm:px-8 lg:px-12 relative overflow-hidden"
        >
            {/* Subtle atmospheric radial gradient */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    background: 'radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.25), transparent 70%)'
                }}
            />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#38BDF8] text-xs font-bold uppercase tracking-widest mb-6 font-mono">
                    <ShieldCheck size={14} />
                    <span>Institutional Readiness</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold font-manrope tracking-tight leading-[1.12] mb-6 text-white">
                    Ready to elevate your institution&apos;s academic performance and exam integrity?
                </h2>

                <p className="text-base sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed font-worksans max-w-2xl mx-auto mb-12">
                    Join 500+ premier Indian coaching centers and institutions. Provision your dedicated white-label exam portal in under 24 hours.
                </p>

                {/* Unboxed Mini Stats */}
                <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto py-8 border-y border-white/10 mb-12">
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white font-manrope">
                            &lt; 24h
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 font-worksans">
                            Onboarding Time
                        </div>
                    </div>
                    <div className="border-x border-white/10">
                        <div className="text-2xl sm:text-3xl font-extrabold text-white font-manrope">
                            ₹0
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 font-worksans">
                            Setup Cost
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white font-manrope">
                            24/7
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 font-worksans">
                            Institutional SLA
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/request-demo"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#001D3D] font-extrabold text-base hover:bg-slate-100 transition-all shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                        <span>Schedule an Institutional Briefing</span>
                        <ArrowRight size={18} />
                    </Link>

                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-base hover:bg-white/15 transition-all backdrop-blur-md active:scale-[0.98]"
                    >
                        <PhoneCall size={16} />
                        <span>Speak with Solutions Team</span>
                    </Link>
                </div>
            </div>
        </section>
    )
}
