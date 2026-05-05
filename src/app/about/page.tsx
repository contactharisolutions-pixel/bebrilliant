'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Target, Heart, Zap, Shield, Sparkles, GraduationCap } from 'lucide-react'

export default function AboutPage() {
    return (
        <PageLayout 
            title="Our Story & Vision" 
            subtitle="Simplifying digital education for every institution across India."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                {/* ── MISSION SECTION ── */}
                <section className="flex flex-col lg:flex-row gap-24 items-center mb-32">
                    <div className="lg:w-3/5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#004B93]/10 text-[#004B93] rounded-md text-[10px] font-black uppercase tracking-widest mb-6"> Our Mission </div>
                        <h2 className="text-4xl md:text-5xl font-[950] text-[#111827] leading-tight mb-8">
                            Empowering those who <br />
                            <span className="text-[#1FAC63]">shape the future.</span>
                        </h2>
                        <div className="space-y-6 text-xl text-gray-600 font-semibold leading-relaxed">
                            <p>
                                Founded with a clear vision: to ensure that every teacher and school owner in India can leverage the digital era without technical barriers. We believe technology should be an invisible bridge, not a hurdle.
                            </p>
                            <p>
                                BeBrilliant is more than a platform; it’s a dedicated partner in your institutional growth. By consolidating exams, student analytics, and financial management, we provide the clarity you need to lead.
                            </p>
                        </div>
                    </div>
                    <div className="lg:w-2/5 relative">
                        <div className="aspect-[4/5] bg-white rounded-[40px] border-[12px] border-[#004B93]/5 shadow-2xl relative overflow-hidden flex items-center justify-center">
                            <GraduationCap className="w-32 h-32 text-[#004B93]/10" />
                            <div className="absolute bottom-10 left-10 right-10 p-6 bg-[#1FAC63] text-white rounded-2xl shadow-xl">
                                <div className="text-xs font-black uppercase tracking-[0.2em] mb-1 opacity-70">Focus</div>
                                <div className="text-xl font-black">Student Growth</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── PROMISE & VALUES ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
                    <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93] mb-8">
                            <Target size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-[#111827] mb-6">Our Promise</h3>
                        <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                            To remain the most reliable infrastructure provider for your institute, ensuring 99.9% uptime and uncompromising security for your data.
                        </p>
                    </div>
                    <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-[#1FAC63]/10 flex items-center justify-center text-[#1FAC63] mb-8">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-[#111827] mb-6">Our Values</h3>
                        <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                            We treat your institution’s growth as our own. Privacy, transparency, and accessible support are the foundations of our relationship with you.
                        </p>
                    </div>
                </div>

                {/* ── STATS SECTION ── */}
                <section className="bg-[#004B93] rounded-[64px] p-20 md:p-32 text-center text-white relative overflow-hidden shadow-3xl shadow-[#004B93]/30">
                    <div className="relative z-10">
                        <h2 className="text-4xl font-[950] mb-20 tracking-tight">Our Impact in Numbers</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
                            {[
                                { label: 'Started In', val: '2022' },
                                { label: 'Exams Completed', val: '20 Lakh+' },
                                { label: 'Trusting Partners', val: '500+' },
                                { label: 'Happy Teachers', val: '1000+' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="text-4xl md:text-5xl font-black text-[#1FAC63] mb-3 tracking-tighter">{stat.val}</div>
                                    <div className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* DECORATIVE ELEMENTS */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />
                </section>
            </div>
        </PageLayout>
    )
}
