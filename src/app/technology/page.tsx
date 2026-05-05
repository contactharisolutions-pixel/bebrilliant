'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Code2, Server, Globe as GlobeIcon, ShieldCheck, Zap, Database, Cpu, Lock } from 'lucide-react'

export default function TechnologyPage() {
    const TECH_STACK = [
        {
            title: 'Speed & Design',
            icon: Code2,
            color: '#004B93',
            items: [
                { name: 'Fast Loading', desc: 'Your students won’t have to wait for pages to load.' },
                { name: 'Modern Design', desc: 'A clean and professional look for your institute.' },
                { name: 'Mobile Ready', desc: 'Works perfectly on all smartphones and tablets.' },
                { name: 'Smooth Transitions', desc: 'Easy on the eyes with smooth page changes.' }
            ]
        },
        {
            title: 'Security & Backup',
            icon: Database,
            color: '#1FAC63',
            items: [
                { name: 'Safe Data Storage', desc: 'Your exam papers and student data are fully protected.' },
                { name: 'Private Accounts', desc: 'Data from one school is never visible to another.' },
                { name: 'Secure Login', desc: 'State-of-the-art protection for all user accounts.' },
                { name: 'Regular Backups', desc: 'We keep your data safe with automatic backups.' }
            ]
        },
        {
            title: 'Cloud Reliability',
            icon: Server,
            color: '#004B93',
            items: [
                { name: 'Always Available', desc: 'Our platform is online 24/7 without any downtime.' },
                { name: 'Global Servers', desc: 'Fast connection from anywhere in the world.' },
                { name: 'Safe Storage', desc: 'Encrypted storage for all your uploaded files.' },
                { name: 'Smart Updates', desc: 'We add new features without stopping your work.' }
            ]
        }
    ]

    return (
        <PageLayout 
            title="Our Technology" 
            subtitle="Built on modern infrastructure that is fast, secure, and ready for your growth."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                {/* ── TECH CARDS ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                    {TECH_STACK.map((tech, i) => (
                        <div key={i} className="bg-white p-12 rounded-[48px] border border-gray-50 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-all">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8" style={{ background: `${tech.color}10`, color: tech.color }}>
                                <tech.icon size={32} />
                            </div>
                            <h3 className="text-2xl font-[950] text-[#111827] mb-8">{tech.title}</h3>
                            <div className="space-y-8">
                                {tech.items.map((item, j) => (
                                    <div key={j}>
                                        <div className="text-[15px] font-black uppercase tracking-widest mb-2" style={{ color: tech.color }}>{item.name}</div>
                                        <div className="text-gray-500 font-semibold leading-relaxed">{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── PERFORMANCE BENCHMARKS ── */}
                <section className="bg-[#111827] rounded-[64px] p-20 md:p-32 relative overflow-hidden text-center text-white shadow-3xl shadow-gray-900/40">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[#1FAC63] text-xs font-black uppercase tracking-widest mb-10">
                            <Cpu size={16} /> Technical Reliability
                        </div>
                        <h2 className="text-4xl md:text-5xl font-[950] mb-20 tracking-tight">Built to handle anything.</h2>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
                            {[
                                { label: 'Uptime', val: '99.9%', icon: ShieldCheck },
                                { label: 'Speed', val: 'Super Fast', icon: Zap },
                                { label: 'Security', val: 'Encrypted', icon: Lock },
                                { label: 'Capacity', val: 'Scalable', icon: GlobeIcon }
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#1FAC63] mb-6">
                                        <stat.icon size={24} />
                                    </div>
                                    <div className="text-4xl font-black text-white mb-2 tracking-tighter">{stat.val}</div>
                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* DECORATIVE LIGHT STREAK */}
                    <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-gradient-to-br from-[#1FAC63]/10 to-transparent pointer-events-none opacity-50" />
                </section>
            </div>
        </PageLayout>
    )
}
