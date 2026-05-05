'use client'

import React from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { 
    BrainCircuit, Wallet, Users, MessageSquare, 
    BarChart3, School, Building, UserCheck, 
    CheckCircle, ShieldCheck, Zap, Globe, ArrowRight
} from 'lucide-react'

export default function FeaturesPage() {
    const FEATURES = [
        {
            category: 'Easy Exam Management',
            icon: BrainCircuit,
            color: '#004B93',
            items: [
                { title: 'Create Exams Easily', desc: 'Add MCQ and multiple-choice questions quickly and simply.' },
                { title: 'Randomized Question Sets', desc: 'Give different questions to every student to prevent cheating.' },
                { title: 'Instant Results', desc: 'Students see their results and scores as soon as they finish.' },
                { title: 'Custom Exam Timers', desc: 'Set fixed start and end times for all your exams.' }
            ]
        },
        {
            category: 'Payments & Wallet',
            icon: Wallet,
            color: '#1FAC63',
            items: [
                { title: 'Paid & Free Credits', desc: 'Give free trials or charge students for premium exams.' },
                { title: 'Click-to-Pay', desc: 'Students can pay for exams using UPI, Cards, or Net Banking.' },
                { title: 'Fast Payouts', desc: 'Get your hard-earned money directly in your bank account.' },
                { title: 'Clear Billing', desc: 'Track every rupee with a simple and clear transaction history.' }
            ]
        },
        {
            category: 'Refer & Grow',
            icon: Users,
            color: '#004B93',
            items: [
                { title: 'Helpful Referrals', desc: 'Reward teachers and students for helping you reach more people.' },
                { title: 'Student Rewards', desc: 'Give credits to students who refer their friends to your class.' },
                { title: 'WhatsApp Sharing', desc: 'Share your institute link on WhatsApp groups with one click.' },
                { title: 'Growth Tracking', desc: 'See how many new students joined from each referral.' }
            ]
        },
        {
            category: 'Your Branded Portal',
            icon: School,
            color: '#1FAC63',
            items: [
                { title: 'Use Your Own Logo', desc: 'Show your school or institute name and logo to students.' },
                { title: 'Different Logins', desc: 'Separate logins for Admins, Teachers, and Students.' },
                { title: 'Private Data', desc: 'Your student and exam data is safe and 100% private.' },
                { title: 'Simple Reports', desc: 'Get clear reports on student performance and attendance.' }
            ]
        }
    ]

    return (
        <PageLayout 
            title="SaaS Features" 
            subtitle="The most comprehensive toolkit for modern academic assessment and revenue management."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24 space-y-32">
                {FEATURES.map((cat, idx) => (
                    <div key={idx} className={`flex flex-col lg:items-center gap-16 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                        {/* TEXT SIDE */}
                        <div className="lg:w-2/5">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-gray-200" style={{ background: `${cat.color}15`, color: cat.color }}>
                                <cat.icon size={32} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-[950] text-[#111827] mb-6">{cat.category}</h2>
                            <p className="text-lg text-gray-500 font-semibold mb-10 leading-relaxed">
                                Streamline your {cat.category.toLowerCase()} with tools that were built specifically for Indian educators. Simple to set up, and even easier to manage daily.
                            </p>
                            <div className="space-y-4">
                                {['100% Secure', 'Easy for Students', 'Works on Mobile'].map(label => (
                                    <div key={label} className="flex items-center gap-3 text-sm font-black uppercase tracking-widest" style={{ color: cat.color }}>
                                        <CheckCircle size={18} strokeWidth={3} /> {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* GRID SIDE */}
                        <div className="lg:w-3/5 grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                            {cat.items.map((card, i) => (
                                <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-all">
                                    <h4 className="text-lg font-black text-[#111827] mb-3">{card.title}</h4>
                                    <p className="text-gray-500 font-semibold leading-relaxed">{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* FINAL CTA SECTION */}
                <section className="bg-[#004B93] rounded-[64px] p-20 md:p-32 text-center text-white relative overflow-hidden shadow-3xl shadow-[#004B93]/30">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-[950] mb-8 leading-tight">Ready to see these <br />features in action?</h2>
                        <Link href="/request-demo" className="inline-flex bg-[#1FAC63] text-white py-5 px-10 rounded-2xl text-lg font-black shadow-2xl shadow-green-900/40 hover:scale-105 transition-all gap-4 items-center">
                            Request a Live Demo <ArrowRight size={22} />
                        </Link>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
