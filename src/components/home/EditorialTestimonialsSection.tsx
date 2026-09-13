'use client'

import React from 'react'
import { TrendingUp, Quote, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react'

export function EditorialTestimonialsSection() {
    const TESTIMONIALS = [
        {
            quote: 'We reduced our exam-management overhead by 70%. The bulk CSV import, automated grading, and instant result publishing is an absolute operational transformation for our 1,200-student institute.',
            name: 'Priya Sharma',
            role: 'Academic Director',
            org: 'Vidyamandir Classes',
            location: 'Pune',
            metric: '70% Overhead Cut',
            highlight: true
        },
        {
            quote: 'The WhatsApp affiliate architecture brought us 340 new verified enrolments last term with zero paid advertising spend. Our existing student community became our most effective advocates.',
            name: 'Rajesh Menon',
            role: 'Founder & Director',
            org: 'EduPath Academy',
            location: 'Kerala',
            metric: '340+ Enrolments',
            highlight: false
        },
        {
            quote: 'Finally an assessment platform where faculty can track longitudinal topic mastery rather than just superficial scores. The cognitive diagnostics helped us restructure our revision batches.',
            name: 'Anjali Desai',
            role: 'Senior Educator',
            org: 'Concept First',
            location: 'Ahmedabad',
            metric: 'Concept Level Diagnostics',
            highlight: false
        },
        {
            quote: 'Fee collection used to consume 3 days of manual reconciliation every billing cycle. Now Razorpay auto-settles directly with instant receipts and clear ledger accounting.',
            name: 'Suresh Kulkarni',
            role: 'Head Administrator',
            org: 'Nalanda Coaching',
            location: 'Nashik',
            metric: '100% Automated Reconciliation',
            highlight: false
        },
        {
            quote: 'Our students love the clean, distraction-free CBT interface. Zero technical lag during high-stakes full-length mocks gives both faculty and parents total peace of mind.',
            name: 'Meena Thomas',
            role: 'Mathematics Faculty',
            org: 'Bright Minds',
            location: 'Kochi',
            metric: 'Zero CBT Downtime',
            highlight: false
        },
        {
            quote: 'Migrating our entire institutional question repository and student roster took less than 24 hours. The onboarding architecture is remarkably intuitive for non-technical administrative staff.',
            name: 'Arjun Patel',
            role: 'Managing Owner',
            org: 'Zenith Institute',
            location: 'Surat',
            metric: '< 24h Deployment',
            highlight: false
        }
    ]

    const featured = TESTIMONIALS[0]
    const others = TESTIMONIALS.slice(1)

    return (
        <section
            aria-label="Institutional Reviews & Proof"
            className="w-full bg-[#FFFFFF] py-20 lg:py-28 px-6 sm:px-8 lg:px-12 border-b border-slate-200"
        >
            <div className="max-w-7xl mx-auto">
                {/* 1. Header */}
                <div className="max-w-3xl mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#001D3D]/5 border border-[#001D3D]/10 text-[#001D3D] text-xs font-bold uppercase tracking-widest mb-4">
                        <ShieldCheck size={13} />
                        <span>Verified Institutional Reputation</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight font-manrope leading-[1.15] mb-4">
                        Educators and directors on institutional scale, precision, and trust.
                    </h2>

                    <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-worksans">
                        Read how leading coaching networks and schools have replaced manual administrative overhead with sovereign examination infrastructure.
                    </p>
                </div>

                {/* 2. Featured Lead Case Study (Asymmetric Hero Block) */}
                <div className="bg-[#00142A] text-white rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden">
                    <div className="max-w-3xl relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#38BDF8]">
                                Lead Institutional Case Study
                            </span>
                            <span className="text-slate-500">·</span>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                                {featured.metric}
                            </span>
                        </div>

                        <blockquote className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-manrope leading-snug mb-8 text-slate-100">
                            "{featured.quote}"
                        </blockquote>

                        <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg font-manrope text-[#38BDF8]">
                                {featured.name[0]}
                            </div>
                            <div>
                                <div className="text-base font-extrabold text-white font-manrope">
                                    {featured.name}
                                </div>
                                <div className="text-xs text-slate-400 font-worksans">
                                    {featured.role} · {featured.org}, {featured.location}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Supporting Peer Dossier (Unboxed 5-Column Grid with Hairline Dividers) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {others.map((t, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col justify-between p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-mono font-bold text-[#004B93] bg-[#004B93]/5 px-2.5 py-1 rounded">
                                        {t.metric}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed font-worksans mb-6">
                                    "{t.quote}"
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-200/60 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs font-manrope text-slate-700 shrink-0">
                                    {t.name[0]}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-[#0F172A] font-manrope truncate">
                                        {t.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-worksans truncate">
                                        {t.role} · {t.org}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
