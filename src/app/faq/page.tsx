'use client'

import React from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Plus, Minus, HelpCircle, ArrowRight, MessageCircle } from 'lucide-react'

export default function FAQPage() {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0)

    const FAQS = [
        {
            q: "What is BeBrilliant?",
            a: "BeBrilliant is a specialized online platform built for Indian schools and coaching centers. It provides everything you need to conduct online exams, manage student results, and grow your institute easily."
        },
        {
            q: "Who can use this platform?",
            a: "Our platform is made for everyone in education: Schools, Coaching & Tuition Centers, and even individual Private Teachers."
        },
        {
            q: "How does the payment and wallet work?",
            a: "Students can pay for exams or courses using UPI, cards, and net banking. This money is safely tracked in your wallet, and you can withdraw it to your bank account anytime."
        },
        {
            q: "Is it easy to use on a mobile phone?",
            a: "Yes! Students can take exams and check results easily on any smartphone, tablet, or computer. It is designed to be very simple and student-friendly."
        },
        {
            q: "Is my student data safe?",
            a: "Absolutely. We use very high security to ensure that your student data and exam papers are 100% private and safe. Only you and your authorized staff can see your data."
        },
        {
            q: "Can I use my own institute name and logo?",
            a: "Yes! You can easily upload your own logo and use your institute's name so that students see your brand everywhere on the platform."
        },
        {
            q: "What are Referral Rewards?",
            a: "You can reward teachers and students for helping you grow. If they refer a new student to your institute, they can earn rewards or credits automatically through our system."
        }
    ]

    return (
        <PageLayout 
            title="Instant Answers" 
            subtitle="Everything you need to know about modernizing your institution with BeBrilliant."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                <div className="max-w-3xl mx-auto space-y-4">
                    {FAQS.map((faq, i) => (
                        <div 
                            key={i} 
                            className={`group border transition-all duration-300 rounded-[32px] overflow-hidden ${openIndex === i ? 'bg-white border-gray-100 shadow-2xl shadow-gray-200' : 'bg-transparent border-gray-100 hover:border-gray-300'}`}
                        >
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full text-left px-8 py-8 flex items-center justify-between gap-6"
                            >
                                <span className="text-xl font-black text-[#111827] leading-tight group-hover:text-[#004B93] transition-colors">
                                    {faq.q}
                                </span>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${openIndex === i ? 'bg-[#004B93] text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-[#004B93]/10 group-hover:text-[#004B93]'}`}>
                                    {openIndex === i ? <Minus size={20} /> : <Plus size={20} />}
                                </div>
                            </button>
                            <div 
                                className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-96' : 'max-h-0'}`}
                            >
                                <div className="px-8 pb-8 text-lg text-gray-500 font-semibold leading-relaxed border-t border-gray-50 pt-6 mt-2">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* HELPLINE / CONTACT SECTION */}
                <section className="mt-40 bg-[#111827] rounded-[64px] p-16 md:p-24 relative overflow-hidden text-center md:text-left">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="md:max-w-xl">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-8 text-[#1FAC63]">
                                <HelpCircle size={32} />
                                <span className="text-sm font-black uppercase tracking-[0.2em]">Still have questions?</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-[950] text-white mb-8 leading-tight">We’re here to <br />support your journey.</h2>
                            <p className="text-xl text-white/50 font-semibold leading-relaxed mb-10">
                                Whether you need help setting up your first exam or want to discuss a custom plan for your school, our team is just a call away.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link href="/contact" className="inline-flex bg-[#004B93] text-white py-5 px-10 rounded-2xl text-lg font-black shadow-xl shadow-blue-900/40 hover:scale-105 transition-all gap-4 items-center justify-center">
                                    Contact Support <MessageCircle size={22} />
                                </Link>
                                <Link href="/request-demo" className="inline-flex bg-white text-[#111827] py-5 px-10 rounded-2xl text-lg font-black hover:scale-105 transition-all gap-4 items-center justify-center">
                                    Request a Demo <ArrowRight size={22} />
                                </Link>
                            </div>
                        </div>
                        
                        {/* DECORATIVE IMPACT STAT */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[48px] text-center hidden lg:block">
                            <div className="text-6xl font-black text-[#1FAC63] mb-2 tracking-tighter">99.9%</div>
                            <div className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Uptime Guarantee</div>
                            <div className="w-full h-[1px] bg-white/10 my-8" />
                            <div className="text-6xl font-black text-[#1FAC63] mb-2 tracking-tighter">24/7</div>
                            <div className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Partner Support</div>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
