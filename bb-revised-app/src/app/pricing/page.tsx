'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Check, ArrowRight, Zap, Target, Star, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
    const PLANS = [
        {
            name: 'Basic',
            price: '1,199',
            period: 'Month',
            desc: 'Ideal for independent teachers starting their digital journey.',
            icon: Zap,
            color: '#004B93',
            features: [
                '1 Teacher Account',
                '500 Student Capacity',
                'Monthly Payouts',
                'Core Exam Engine',
                'Basic Analytics',
                'Standard Support'
            ],
            cta: 'Start Free Trial'
        },
        {
            name: 'Standard',
            price: '4,499',
            period: 'Month',
            desc: 'Optimized for small coaching centres and growing institutes.',
            popular: true,
            icon: Target,
            color: '#1FAC63',
            features: [
                '10 Teacher Accounts',
                '2,500 Student Capacity',
                'Weekly Payouts',
                'Affiliate Module',
                'Custom Branding',
                'Priority Support'
            ],
            cta: 'Get Started'
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: 'Quote',
            desc: 'Dedicated infrastructure for large schools and universities.',
            icon: Star,
            color: '#1B3A57',
            features: [
                'Unlimited Teachers',
                'Unlimited Students',
                'Custom Payout Cycles',
                'API Data Insights',
                'Dedicated Account Manager',
                '24/7 Phone Support'
            ],
            cta: 'Contact Sales'
        }
    ]

    return (
        <PageLayout 
            title="Simple Plans for You" 
            subtitle="Affordable plans for teachers, coaching centers, and schools."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {PLANS.map(plan => (
                        <div 
                            key={plan.name} 
                            className={`bg-white p-12 rounded-[48px] border-2 transition-all hover:-translate-y-2 flex flex-col ${plan.popular ? 'border-[#1FAC63] shadow-2xl shadow-green-100' : 'border-gray-50 shadow-xl shadow-gray-100'}`}
                        >
                            {plan.popular && (
                                <div className="inline-flex bg-[#1FAC63] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-8 self-start">
                                    Most Popular
                                </div>
                            )}
                            
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm" style={{ background: `${plan.color}10`, color: plan.color }}>
                                <plan.icon size={32} />
                            </div>

                            <h3 className="text-2xl font-black text-[#111827] mb-2">{plan.name} Plan</h3>
                            <p className="text-sm text-gray-500 font-semibold mb-10 leading-relaxed">{plan.desc}</p>
                            
                            <div className="mb-10 flex items-baseline gap-1">
                                <span className="text-5xl font-[950] text-[#111827] tracking-tighter">
                                    {plan.price !== 'Custom' ? '₹' + plan.price : plan.price}
                                </span>
                                {plan.price !== 'Custom' && <span className="text-gray-400 font-black text-sm uppercase tracking-widest">/{plan.period}</span>}
                            </div>

                            <div className="flex-1 space-y-5 mb-12">
                                {plan.features.map(f => (
                                    <div key={f} className="flex items-center gap-4 text-gray-700 font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <span className="text-[15px]">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link 
                                href={plan.price === 'Custom' ? "/contact" : "/request-demo"} 
                                className={`text-center py-5 rounded-2xl text-lg font-black transition-all ${plan.popular ? 'bg-[#1FAC63] text-white shadow-xl shadow-green-500/30' : 'bg-white border-2 border-gray-100 text-[#004B93] hover:bg-gray-50'}`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* ADD-ONS SECTION */}
                <div className="mt-32">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-[950] text-[#111827] mb-4 tracking-tight">Need More?</h3>
                        <p className="text-lg text-gray-500 font-semibold">Scale your platform with these simple add-ons.</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-6">
                        {[
                            { label: 'Extra Teacher Account', price: '₹199/mo' },
                            { label: '500 Extra Students', price: '₹499/mo' },
                            { label: 'Bulk WhatsApp Package', price: '₹999/mo' }
                        ].map((addon, i) => (
                            <div key={i} className="bg-white px-10 py-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 flex items-center gap-8">
                                <span className="font-black text-[#111827]">{addon.label}</span>
                                <span className="font-black text-[#004B93] bg-[#004B93]/5 px-4 py-2 rounded-xl">{addon.price}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TRUST BANNER */}
                <section className="mt-32 bg-[#f0f4f8] rounded-[48px] p-16 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="md:max-w-xl text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-6 text-[#004B93]">
                            <ShieldCheck size={32} />
                            <span className="text-lg font-black uppercase tracking-[0.2em]">Institutional Security</span>
                        </div>
                        <h4 className="text-3xl font-[950] text-[#111827] mb-6">Built for scale, secured by the best.</h4>
                        <p className="text-lg text-gray-600 font-semibold leading-relaxed">
                            Every plan includes enterprise-grade security, ensuring your students' data and your academic material remain private and protected.
                        </p>
                    </div>
                    <div className="flex gap-4">
                         <Link href="/faq" className="bg-[#111827] text-white py-5 px-10 rounded-2xl text-lg font-black hover:scale-105 transition-all flex items-center gap-3">
                            Read Payment FAQ <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
