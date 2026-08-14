'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/public/PageLayout'
import {
    Check, X, ArrowRight, Zap, Target, Star, ShieldCheck,
    Users, TrendingUp, Building, MessageSquare, BarChart3,
    Lock, Globe, Activity, Sparkles, ChevronDown, ChevronUp,
    School, UserCheck, GraduationCap, Award
} from 'lucide-react'

/* ─── 4 CATEGORIES PRICING DATA matching docx ────────────────────────────── */
const CATEGORIES = [
    { id: 'school', label: 'School / White-Label', icon: Building, badge: 'Enterprise' },
    { id: 'teacher', label: 'Teacher Platform', icon: UserCheck, badge: 'Popular for Tutors' },
    { id: 'institute', label: 'Institute Platform', icon: School, badge: 'Coaching Chains' },
    { id: 'student', label: 'Student Platform', icon: GraduationCap, badge: 'Self-Test' },
]

const CATEGORY_PLANS: Record<string, any[]> = {
    school: [
        {
            name: 'White-Label Starter',
            tagline: 'Single school branch under your own brand',
            price: '9,999',
            annual: '8,499',
            period: 'month',
            color: '#1E3A8A',
            accent: '#2563EB',
            popular: false,
            features: [
                'Custom Domain (exams.school.edu.in)',
                'School Logo, Colors & Seal',
                'Up to 3,000 Active Students',
                'Unlimited Teacher Logins',
                'Online CBT + OMR Exam Engine',
                'AI Question Paper Generator',
                'Automated PDF Report Cards',
                'Parent Score WhatsApp Alerts',
                '99.9% Dedicated SLA & Support'
            ],
            cta: 'Request White-Label Demo',
            ctaHref: '/request-demo'
        },
        {
            name: 'White-Label Multi-Branch',
            tagline: 'Multi-school chain or franchise network',
            price: 'Custom',
            annual: 'Custom',
            period: 'quote',
            color: '#672AEA',
            accent: '#9333EA',
            popular: true,
            features: [
                'All Starter White-Label Features',
                'Multi-Branch Central Control',
                'Unlimited Students & Teachers',
                'White-Label Android Mobile App',
                'Full API & ERP Data Sync',
                'Dedicated Account Manager',
                'DPDP Act Compliance SLA',
                'Custom Security & Onboarding'
            ],
            cta: 'Contact Sales for Custom Quote',
            ctaHref: '/contact'
        }
    ],
    teacher: [
        {
            name: 'Independent Educator',
            tagline: 'Individual tutors & subject experts',
            price: '999',
            annual: '799',
            period: 'month',
            color: '#0CA35C',
            accent: '#16A34A',
            popular: true,
            features: [
                '1 Teacher Account',
                '500 Student Capacity',
                'Online Test Creation Engine',
                'Gemini AI Question Generator',
                'Instant Auto-Grading',
                'Per-Student Growth Graphs',
                'PDF Question Paper Downloads',
                'Email & WhatsApp Support'
            ],
            cta: 'Start Free Trial',
            ctaHref: '/request-demo'
        },
        {
            name: 'Educator Pro',
            tagline: 'High-volume private tutors',
            price: '1,999',
            annual: '1,599',
            period: 'month',
            color: '#1E3A8A',
            accent: '#2563EB',
            popular: false,
            features: [
                'Up to 3 Teacher Accounts',
                '1,500 Student Capacity',
                'All Independent Educator Features',
                'Anti-Cheat Proctoring & Shuffling',
                'Parent Automated Score Alerts',
                'Custom Exam Paper Branding',
                'Priority 12h Support'
            ],
            cta: 'Get Started',
            ctaHref: '/request-demo'
        }
    ],
    institute: [
        {
            name: 'Coaching Growth',
            tagline: 'Growing coaching centers up to 2 branches',
            price: '3,999',
            annual: '3,299',
            period: 'month',
            color: '#F0A026',
            accent: '#D97706',
            popular: false,
            features: [
                '5 Teacher Logins',
                '2,000 Student Capacity',
                'Online CBT + Offline OMR Exams',
                'Gemini AI Question Builder',
                'WhatsApp Student Referral Engine',
                'Secure Fee Collection (Razorpay)',
                'Cohort & AIR Rank Analytics',
                'Weekly Payout Settlements'
            ],
            cta: 'Start Growth Plan',
            ctaHref: '/request-demo'
        },
        {
            name: 'Institute Enterprise',
            tagline: 'Established coaching institutes & academies',
            price: '7,999',
            annual: '6,499',
            period: 'month',
            color: '#0CA35C',
            accent: '#16A34A',
            popular: true,
            features: [
                '15 Teacher Logins',
                '5,000 Student Capacity',
                'All Growth Plan Features',
                'Custom Subdomain & Logo',
                'Bulk CSV Question Importer',
                'Automated Fee Receipts & GST',
                'Parent Score WhatsApp Alerts',
                'Dedicated Account Manager'
            ],
            cta: 'Get Enterprise Plan',
            ctaHref: '/request-demo'
        }
    ],
    student: [
        {
            name: 'Student Practice Pass',
            tagline: 'Unlimited self-tests & mock exams',
            price: '299',
            annual: '199',
            period: 'month',
            color: '#2563EB',
            accent: '#3B82F6',
            popular: true,
            features: [
                'Unlimited Self-Practice Mocks',
                'CBSE, ICSE & JEE/NEET Question Banks',
                'Instant Step-by-Step Solutions',
                'Subject-wise Weakness Analysis',
                'Performance Leaderboard Ranking',
                'Mobile-Friendly Test Interface'
            ],
            cta: 'Subscribe Now',
            ctaHref: '/request-demo'
        }
    ]
}

export default function PricingPage() {
    const [selectedCategory, setSelectedCategory] = useState('school')
    const [isAnnual, setIsAnnual] = useState(false)

    const currentPlans = CATEGORY_PLANS[selectedCategory] || CATEGORY_PLANS['school']

    return (
        <PageLayout
            title="Transparent, Institutional Pricing"
            subtitle="Tailored plans for Schools, Teachers, Institutes, and Students with complete transparency."
            bgImage="/pricing_hero.png"
        >
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-10 pb-28 font-worksans">

                {/* ── 1. CATEGORY TAB SWITCHER ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon
                        const isActive = selectedCategory === cat.id
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '14px 24px',
                                    borderRadius: 999,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    border: isActive ? '2px solid #1E3A8A' : '1px solid #E2E8F0',
                                    background: isActive ? '#1E3A8A' : '#FFFFFF',
                                    color: isActive ? '#FFFFFF' : '#475569',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isActive ? '0 10px 25px -5px rgba(30,58,138,0.3)' : '0 2px 6px rgba(0,0,0,0.02)'
                                }}
                            >
                                <Icon size={18} style={{ color: isActive ? '#FFFFFF' : '#1E3A8A' }} />
                                <span>{cat.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* ── 2. MONTHLY / ANNUAL TOGGLE ── */}
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
                        <span className="ml-2 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Save 20%</span>
                    </span>
                </div>

                {/* ── 3. PRICING CARDS GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-24 max-w-4xl mx-auto items-stretch">
                    {currentPlans.map((plan, i) => {
                        const displayPrice = isAnnual ? plan.annual : plan.price
                        return (
                            <div
                                key={i}
                                className="relative rounded-[32px] overflow-hidden flex flex-col p-8 md:p-10"
                                style={{
                                    background: plan.popular ? '#0C1829' : '#FFFFFF',
                                    border: plan.popular ? `2px solid ${plan.accent}` : '1px solid #E2E8F0',
                                    boxShadow: plan.popular ? '0 25px 50px -12px rgba(12,24,41,0.4)' : '0 4px 20px rgba(0,0,0,0.03)',
                                }}
                            >
                                {plan.popular && (
                                    <div className="absolute top-6 right-6">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            <Sparkles size={10} /> Recommended
                                        </span>
                                    </div>
                                )}

                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold font-manrope mb-2" style={{ color: plan.popular ? '#FFFFFF' : '#0F172A' }}>
                                        {plan.name}
                                    </h3>
                                    <p className="text-xs font-semibold mb-6" style={{ color: plan.popular ? '#94A3B8' : '#64748B' }}>
                                        {plan.tagline}
                                    </p>

                                    {/* Price Header */}
                                    <div className="mb-8 pb-6 border-b" style={{ borderColor: plan.popular ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }}>
                                        {displayPrice !== 'Custom' ? (
                                            <div className="flex items-end gap-1 font-manrope">
                                                <span className="text-5xl font-black tracking-tighter" style={{ color: plan.popular ? '#FFFFFF' : '#0F172A' }}>
                                                    ₹{displayPrice}
                                                </span>
                                                <span className="text-sm font-bold mb-2" style={{ color: plan.popular ? '#94A3B8' : '#64748B' }}>
                                                    /{plan.period}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-5xl font-black tracking-tighter font-manrope" style={{ color: plan.popular ? '#FFFFFF' : '#0F172A' }}>
                                                Custom
                                            </div>
                                        )}
                                    </div>

                                    {/* Features Checklist */}
                                    <div className="space-y-3.5 mb-8">
                                        {plan.features.map((feat: string, j: number) => (
                                            <div key={j} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#DCFCE7', color: '#15803D' }}>
                                                    <Check size={11} strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: plan.popular ? '#E2E8F0' : '#334155' }}>
                                                    {feat}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <Link
                                    href={plan.ctaHref}
                                    className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-extrabold transition-all font-manrope text-center"
                                    style={{
                                        background: plan.popular ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#1E3A8A',
                                        color: '#FFFFFF',
                                        boxShadow: plan.popular ? '0 10px 20px rgba(37, 99, 235, 0.35)' : 'none'
                                    }}
                                >
                                    {plan.cta} <ArrowRight size={16} />
                                </Link>
                            </div>
                        )
                    })}
                </div>

                {/* ── 4. ENTERPRISE SECURITY BANNER ── */}
                <section
                    className="relative rounded-[36px] overflow-hidden p-10 md:p-14"
                    style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', color: '#FFFFFF' }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                                <ShieldCheck size={14} /> Enterprise Security Included
                            </div>
                            <h4 className="text-2xl md:text-3xl font-extrabold font-manrope mb-2">
                                100% DPDP Act Compliant & Data Isolated
                            </h4>
                            <p className="text-slate-300 text-sm max-w-xl">
                                Every plan includes row-level database security, encrypted backups, and dedicated infrastructure.
                            </p>
                        </div>

                        <Link
                            href="/request-demo"
                            className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] px-8 py-4 rounded-2xl text-sm font-extrabold font-manrope hover:bg-slate-100 transition-all flex-shrink-0"
                        >
                            Book a Demo <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

            </div>
        </PageLayout>
    )
}
