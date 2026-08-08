'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import {
    Check, X, ArrowRight, Zap, Target, Star, ShieldCheck,
    Users, TrendingUp, Building, MessageSquare, BarChart3,
    Lock, Globe, Activity, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react'

/* ─── PLAN DATA ─────────────────────────────────────────────────── */
const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        tagline: 'For independent educators',
        price: '1,199',
        annual: '999',
        period: 'month',
        icon: Zap,
        color: '#1E3A8A',
        accent: '#2563EB',
        accentBg: 'rgba(37, 99, 235, 0.1)',
        features: [
            '1 Teacher Account',
            '500 Student Capacity',
            'Core Exam Engine',
            'MCQ & Numerical Questions',
            'Instant Auto-Grading',
            'Basic Analytics Dashboard',
            'Monthly Razorpay Payouts',
            'Email Support (48h SLA)',
        ],
        notIncluded: [
            'AI Question Builder',
            'WhatsApp Affiliate Engine',
            'Custom Branding / Domain',
            'Parent SMS/WhatsApp Alerts',
            'API Access',
            'Dedicated Account Manager',
        ],
        cta: 'Start Free Trial',
        ctaHref: '/request-demo',
        popular: false
    },
    {
        id: 'professional',
        name: 'Professional',
        tagline: 'For growing coaching institutes',
        price: '4,499',
        annual: '3,749',
        period: 'month',
        icon: Target,
        color: '#0CA35C',
        accent: '#16A34A',
        accentBg: 'rgba(22, 163, 74, 0.1)',
        features: [
            '10 Teacher Accounts',
            '2,500 Student Capacity',
            'Gemini AI Question Builder',
            'Anti-Cheat Question Shuffling',
            'Weekly Razorpay Payouts',
            'WhatsApp Affiliate Module',
            'Custom Branding & Logo',
            'Parent Score Alerts (WhatsApp)',
            'Advanced Analytics & AIR Rank',
            'Priority Support (12h SLA)',
        ],
        notIncluded: [
            'Custom Domain / Subdomain',
            'API Data Access',
            'Dedicated Account Manager',
        ],
        cta: 'Get Started',
        ctaHref: '/request-demo',
        popular: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'For large institutions & chains',
        price: 'Custom',
        annual: 'Custom',
        period: 'quote',
        icon: Star,
        color: '#672AEA',
        accent: '#8B5CF6',
        accentBg: 'rgba(139, 92, 246, 0.1)',
        features: [
            'Unlimited Teacher Accounts',
            'Unlimited Student Capacity',
            'All Professional Features',
            'Custom Domain & Subdomain',
            'Full API Data Access',
            'Custom Payout Cycles',
            'Dedicated Account Manager',
            'SLA-Backed 24/7 Phone Support',
            'DPDP & SOC 2 Compliance Docs',
            'Custom Onboarding & Training',
            'White-label Mobile App (Add-on)',
            'Multi-Branch Management Console',
        ],
        notIncluded: [],
        cta: 'Contact Enterprise Sales',
        ctaHref: '/contact',
        popular: false
    }
]

/* ─── COMPARISON MATRIX DATA ────────────────────────────────────── */
const COMPARISON_CATEGORIES = [
    {
        label: 'Exam & Assessment',
        features: [
            { name: 'MCQ & Numerical Questions', starter: true, professional: true, enterprise: true },
            { name: 'Gemini AI Paper Generator', starter: false, professional: true, enterprise: true },
            { name: 'Anti-Cheat Question Shuffling', starter: false, professional: true, enterprise: true },
            { name: 'Custom Exam Timers & Rules', starter: true, professional: true, enterprise: true },
            { name: 'Instant Auto-Grading & Solution Keys', starter: true, professional: true, enterprise: true },
            { name: 'Live Exam Supervision Dashboard', starter: false, professional: true, enterprise: true },
        ]
    },
    {
        label: 'Revenue & Payments',
        features: [
            { name: 'UPI / Card Payment Collection', starter: true, professional: true, enterprise: true },
            { name: 'Paid & Free Credit Wallets', starter: true, professional: true, enterprise: true },
            { name: 'Monthly Razorpay Payouts', starter: true, professional: true, enterprise: true },
            { name: 'Weekly Razorpay Payouts', starter: false, professional: true, enterprise: true },
            { name: 'Custom Payout Cycles', starter: false, professional: false, enterprise: true },
            { name: 'GST Invoicing & Tax Reports', starter: true, professional: true, enterprise: true },
        ]
    },
    {
        label: 'Growth & Marketing',
        features: [
            { name: 'Student Referral Rewards', starter: true, professional: true, enterprise: true },
            { name: 'WhatsApp Affiliate Engine', starter: false, professional: true, enterprise: true },
            { name: 'Affiliate Commission Splits', starter: false, professional: true, enterprise: true },
            { name: 'Bulk WhatsApp Notifications', starter: false, professional: true, enterprise: true },
            { name: 'Parent Score Alert Messaging', starter: false, professional: true, enterprise: true },
        ]
    },
    {
        label: 'Branding & Customization',
        features: [
            { name: 'Custom Institute Logo & Theme', starter: false, professional: true, enterprise: true },
            { name: 'Custom Domain / Subdomain', starter: false, professional: false, enterprise: true },
            { name: 'Whitelabel Mobile App (Add-on)', starter: false, professional: false, enterprise: true },
            { name: 'Multi-Branch Console', starter: false, professional: false, enterprise: true },
        ]
    },
    {
        label: 'Analytics & Insights',
        features: [
            { name: 'Basic Score Reports', starter: true, professional: true, enterprise: true },
            { name: 'Cohort & AIR Rank Analytics', starter: false, professional: true, enterprise: true },
            { name: 'Student Performance Trends', starter: false, professional: true, enterprise: true },
            { name: 'API Data Access', starter: false, professional: false, enterprise: true },
            { name: 'Custom Analytics Reports', starter: false, professional: false, enterprise: true },
        ]
    },
    {
        label: 'Security & Support',
        features: [
            { name: 'AES-256 Data Encryption', starter: true, professional: true, enterprise: true },
            { name: 'Multi-Tenant Data Isolation', starter: true, professional: true, enterprise: true },
            { name: 'DPDP Act 2023 Compliance', starter: true, professional: true, enterprise: true },
            { name: 'Email Support (48h SLA)', starter: true, professional: true, enterprise: true },
            { name: 'Priority Support (12h SLA)', starter: false, professional: true, enterprise: true },
            { name: 'Dedicated Account Manager', starter: false, professional: false, enterprise: true },
            { name: '24/7 Phone Support', starter: false, professional: false, enterprise: true },
            { name: 'SOC 2 Compliance Documents', starter: false, professional: false, enterprise: true },
        ]
    }
]

/* ─── COMPONENT ─────────────────────────────────────────────────── */
export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false)
    const [expandedCats, setExpandedCats] = useState<number[]>([0, 1])

    const toggleCat = (i: number) =>
        setExpandedCats(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])

    return (
        <PageLayout
            title="Transparent, Institutional Pricing"
            subtitle="One platform. Three tiers. Built for independent educators, growing coaching institutes, and large academic chains."
            bgImage="/pricing_hero.png"
        >
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-10 pb-28 font-worksans">

                {/* ─── BILLING TOGGLE ─────────────────────────────────────── */}
                <div className="flex items-center justify-center gap-5 mb-16">
                    <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly Billing</span>
                    <button
                        onClick={() => setIsAnnual(v => !v)}
                        className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                        style={{ background: isAnnual ? '#1E3A8A' : '#E5E7EB' }}
                    >
                        <span
                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300"
                            style={{ left: isAnnual ? 'calc(100% - 24px)' : '4px' }}
                        />
                    </button>
                    <span className={`text-sm font-bold ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>
                        Annual Billing
                        <span className="ml-2 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Save 17%</span>
                    </span>
                </div>

                {/* ─── PRICING TIER PANELS ────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 items-start">
                    {PLANS.map((plan) => {
                        const PIcon = plan.icon
                        const displayPrice = isAnnual ? plan.annual : plan.price
                        return (
                            <div
                                key={plan.id}
                                className="relative rounded-[32px] overflow-hidden flex flex-col"
                                style={{
                                    background: plan.popular ? '#0C1829' : '#FFFFFF',
                                    border: plan.popular ? `1.5px solid ${plan.accent}40` : '1px solid #E5E7EB',
                                    boxShadow: plan.popular ? `0 30px 60px -20px rgba(12,24,41,0.5)` : '0 4px 16px rgba(0,0,0,0.03)',
                                    transform: plan.popular ? 'scale(1.03)' : 'none',
                                    zIndex: plan.popular ? 10 : 1
                                }}
                            >
                                {/* Top accent bar */}
                                {plan.popular && (
                                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${plan.color}, ${plan.accent})` }} />
                                )}

                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute top-5 right-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest" style={{ background: plan.accentBg, color: plan.accent, border: `1px solid ${plan.accent}40` }}>
                                            <Sparkles size={10} /> Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="p-8 md:p-10 flex flex-col flex-1">
                                    {/* Icon + Name */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: plan.accentBg, color: plan.accent }}>
                                            <PIcon size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold font-manrope" style={{ color: plan.popular ? '#FFFFFF' : '#0F172A' }}>
                                                {plan.name}
                                            </h3>
                                            <p className="text-xs font-semibold" style={{ color: plan.popular ? '#64748B' : '#94A3B8' }}>
                                                {plan.tagline}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-8 pb-8 border-b" style={{ borderColor: plan.popular ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                                        {displayPrice !== 'Custom' ? (
                                            <div className="flex items-end gap-1 font-manrope">
                                                <span className="text-5xl font-black tracking-tighter" style={{ color: plan.popular ? '#FFFFFF' : '#0F172A' }}>
                                                    ₹{displayPrice}
                                                </span>
                                                <span className="text-sm font-bold mb-2" style={{ color: plan.popular ? '#64748B' : '#94A3B8' }}>
                                                    /{plan.period}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-5xl font-black tracking-tighter font-manrope" style={{ color: plan.popular ? '#FFFFFF' : '#0F172A' }}>
                                                Custom
                                            </div>
                                        )}
                                        {isAnnual && displayPrice !== 'Custom' && (
                                            <div className="mt-1 text-xs font-bold" style={{ color: plan.accent }}>
                                                Billed ₹{Number(plan.annual.replace(',', '')) * 12 / 1000}K annually · Save ₹{((Number(plan.price.replace(',', '')) - Number(plan.annual.replace(',', ''))) * 12 / 1000).toFixed(1)}K/yr
                                            </div>
                                        )}
                                    </div>

                                    {/* Features list */}
                                    <div className="flex-1 mb-8 space-y-3">
                                        {plan.features.map((f, fi) => (
                                            <div key={fi} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${plan.accent}20`, color: plan.accent }}>
                                                    <Check size={11} strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: plan.popular ? '#CBD5E1' : '#475569' }}>{f}</span>
                                            </div>
                                        ))}
                                        {plan.notIncluded.map((f, fi) => (
                                            <div key={fi} className="flex items-start gap-3 opacity-40">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-200">
                                                    <X size={10} strokeWidth={3} className="text-slate-400" />
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: plan.popular ? '#4B5563' : '#94A3B8' }}>{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    <Link
                                        href={plan.ctaHref}
                                        className="flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-extrabold transition-all font-manrope hover:scale-[1.02]"
                                        style={{
                                            background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.accent}CC)` : '#F8FAFC',
                                            color: plan.popular ? '#FFFFFF' : plan.color,
                                            border: plan.popular ? 'none' : `1.5px solid ${plan.color}30`,
                                            boxShadow: plan.popular ? `0 8px 24px -6px ${plan.accent}60` : 'none'
                                        }}
                                    >
                                        {plan.cta} <ArrowRight size={15} />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ─── FULL COMPARISON MATRIX ─────────────────────────────── */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#1E3A8A] bg-[#1E3A8A]/08 px-4 py-1.5 rounded-full border border-[#1E3A8A]/20">
                            PLAN COMPARISON
                        </span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-manrope mt-5 mb-2">
                            Every feature. Every tier. Transparent.
                        </h3>
                        <p className="text-slate-500 text-sm font-semibold max-w-lg mx-auto">
                            No asterisks. No hidden limits. Here's exactly what each plan includes.
                        </p>
                    </div>

                    {/* Sticky header row */}
                    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl mb-2 px-4 py-4 grid grid-cols-12 gap-4 shadow-sm">
                        <div className="col-span-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Feature</div>
                        {PLANS.map(p => (
                            <div key={p.id} className="col-span-2 text-center">
                                <span className="text-xs font-extrabold font-manrope" style={{ color: p.color }}>{p.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Category groups */}
                    <div className="space-y-3 rounded-3xl overflow-hidden border border-slate-200 bg-white">
                        {COMPARISON_CATEGORIES.map((cat, catIdx) => {
                            const isExpanded = expandedCats.includes(catIdx)
                            return (
                                <div key={catIdx}>
                                    {/* Category header */}
                                    <button
                                        onClick={() => toggleCat(catIdx)}
                                        className="w-full grid grid-cols-12 gap-4 px-6 py-5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <div className="col-span-6 flex items-center gap-3 text-left">
                                            <span className="text-sm font-bold text-slate-900 font-manrope">{cat.label}</span>
                                            <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                                {cat.features.length} features
                                            </span>
                                        </div>
                                        <div className="col-span-6 flex items-center justify-end">
                                            {isExpanded
                                                ? <ChevronUp size={16} className="text-slate-400" />
                                                : <ChevronDown size={16} className="text-slate-400" />
                                            }
                                        </div>
                                    </button>

                                    {/* Feature rows */}
                                    {isExpanded && cat.features.map((feat, fIdx) => (
                                        <div
                                            key={fIdx}
                                            className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <div className="col-span-6 text-sm text-slate-600 font-medium flex items-center gap-2">
                                                {feat.name}
                                            </div>
                                            {[feat.starter, feat.professional, feat.enterprise].map((val, vIdx) => {
                                                const plan = PLANS[vIdx]
                                                return (
                                                    <div key={vIdx} className="col-span-2 flex items-center justify-center">
                                                        {val ? (
                                                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${plan.accent}18`, color: plan.accent }}>
                                                                <Check size={12} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                                <X size={11} strokeWidth={2.5} className="text-slate-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ─── ADD-ONS BENTO ──────────────────────────────────────── */}
                <div className="mb-24">
                    <div className="text-center mb-10">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#0CA35C] bg-[#0CA35C]/08 px-4 py-1.5 rounded-full border border-[#0CA35C]/20">
                            MODULAR ADD-ONS
                        </span>
                        <h3 className="text-3xl font-extrabold text-slate-900 font-manrope mt-5 mb-2">Scale exactly what you need.</h3>
                        <p className="text-slate-500 text-sm font-semibold max-w-md mx-auto">Bolt on extra capacity to any plan without a tier upgrade.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { label: 'Extra Teacher Account', price: '₹199', period: '/mo per seat', icon: Users, color: '#1E3A8A', bg: '#EFF6FF', desc: 'Add individual teacher logins without upgrading your base plan.' },
                            { label: '500 Extra Students', price: '₹499', period: '/mo', icon: TrendingUp, color: '#0CA35C', bg: '#DCFCE7', desc: 'Expand student capacity in increments of 500 on any plan tier.' },
                            { label: 'Bulk WhatsApp Package', price: '₹999', period: '/mo', icon: MessageSquare, color: '#672AEA', bg: '#F3E8FF', desc: '10,000 WhatsApp message credits for notifications, alerts, and referrals.' },
                        ].map((addon, i) => {
                            const AIcon = addon.icon
                            return (
                                <div key={i} className="rounded-3xl bg-white border border-slate-200 p-7 flex flex-col gap-4 hover:shadow-lg hover:border-slate-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: addon.bg, color: addon.color }}>
                                            <AIcon size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black font-manrope" style={{ color: addon.color }}>{addon.price}</span>
                                            <span className="text-xs font-bold text-slate-400 ml-1">{addon.period}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 font-manrope mb-1">{addon.label}</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{addon.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ─── ENTERPRISE TRUST BANNER ────────────────────────────── */}
                <section
                    className="relative rounded-[40px] overflow-hidden p-10 md:p-16"
                    style={{ background: 'linear-gradient(135deg, #060E1C 0%, #0D1F3C 60%, #0F2A1E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 50%, rgba(12,163,92,0.12), transparent 50%)' }} />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest mb-5">
                                <ShieldCheck size={13} /> ENTERPRISE-GRADE SECURITY
                            </div>
                            <h4 className="text-2xl md:text-3xl font-extrabold text-white font-manrope mb-4">
                                Every plan is secured at the enterprise level.
                            </h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                Regardless of which tier you're on, your students' data and academic materials are protected by AES-256 encryption, multi-tenant isolation, and full DPDP Act 2023 compliance.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {['AES-256 Encryption', 'DPDP Compliant', 'Multi-Tenant Isolated', '99.9% Uptime SLA', 'SOC 2 Ready'].map((t, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-emerald-400 border border-emerald-500/20 bg-emerald-500/08">
                                        <Check size={10} strokeWidth={3} /> {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 flex-shrink-0">
                            <Link href="/request-demo" className="inline-flex items-center gap-3 bg-[#0CA35C] text-white px-7 py-4 rounded-2xl text-sm font-extrabold hover:bg-[#098048] hover:scale-105 transition-all font-manrope shadow-xl shadow-emerald-900/30">
                                Schedule a Live Demo <ArrowRight size={16} />
                            </Link>
                            <Link href="/faq" className="inline-flex items-center gap-3 bg-white/08 text-slate-300 px-7 py-4 rounded-2xl text-sm font-extrabold border border-white/10 hover:bg-white/12 transition-all font-manrope">
                                Read Pricing FAQ
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    )
}
