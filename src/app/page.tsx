'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    ArrowRight, CheckCircle, ShieldCheck, Zap,
    BarChart3, Users, Shield,
    Building, GraduationCap, School, UserCheck, Wallet,
    MessageSquare, Globe, Star,
    Trophy, Activity, Target, BrainCircuit,
    BookOpen, Bell, TrendingUp, Lock, Sparkles,
    Play, PhoneCall, ChevronRight, FileText, Check, Layers, Award
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

/* ── Animated counter ──────────────────────────────────────────────────────── */
function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
    const [val, setVal] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const ran = useRef(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !ran.current) {
                ran.current = true
                const dur = 1600
                const t0 = performance.now()
                const tick = (now: number) => {
                    const p = Math.min((now - t0) / dur, 1)
                    setVal(Math.round((1 - Math.pow(1 - p, 3)) * end))
                    if (p < 1) requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
            }
        }, { threshold: 0.3 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [end])
    return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>
}

/* ── Data ──────────────────────────────────────────────────────────────────── */
const FEATURES = [
    { icon: ShieldCheck, title: 'Anti-Cheat Exam Engine', desc: 'AI-backed proctoring, tab-switch detection, and randomised question pools keep every exam fair.', color: '#004B93', bgSolid: '#B3C9DF', bgSolidHover: '#A0BDD8' },
    { icon: BarChart3,   title: '360° Learning Analytics', desc: 'Real-time dashboards from cohort performance to individual learning trajectories for every role.', color: '#1FAC63', bgSolid: '#BCE6D0', bgSolidHover: '#A6DDBE' },
    { icon: Wallet,      title: 'Secure Fee Collection',   desc: 'Razorpay-powered payments with instant settlements, auto-receipts, and full audit trails.', color: '#F0A026', bgSolid: '#FBE3BE', bgSolidHover: '#F9D9A5' },
    { icon: MessageSquare, title: 'WhatsApp Growth Engine', desc: 'Recruit students via WhatsApp affiliate links with automated referral tracking and payouts.', color: '#25D366', bgSolid: '#BEF2D1', bgSolidHover: '#A8ECBF' },
    { icon: BrainCircuit, title: 'AI Question Builder',  desc: 'Generate, import, and organise question banks by subject and difficulty with Gemini AI.', color: '#7C3AED', bgSolid: '#D8C4FA', bgSolidHover: '#C6ABF7' },
    { icon: Bell,         title: 'Smart Notifications',  desc: 'Automated alerts for exam schedules, result releases, payment due dates, and milestones.', color: '#004B93', bgSolid: '#B3C9DF', bgSolidHover: '#A0BDD8' },
    { icon: Globe,        title: 'Multi-Tenant Architecture', desc: 'Fully isolated per-institution environments with custom branding, domain, and roles.', color: '#1FAC63', bgSolid: '#BCE6D0', bgSolidHover: '#A6DDBE' },
    { icon: Activity,     title: 'Real-Time Monitoring', desc: 'Live exam supervision, submission tracking, and instant result computation.', color: '#EF4444', bgSolid: '#FAC7C7', bgSolidHover: '#F7AFAF' },
    { icon: Lock,         title: 'Enterprise Security',  desc: 'Row-level data isolation, DPDP-compliant storage, encrypted credentials, full audit logs.', color: '#F0A026', bgSolid: '#FBE3BE', bgSolidHover: '#F9D9A5' },
]

const ROLES = [
    { icon: Building,      role: 'Institution Owner', desc: 'Run your entire coaching empire from one place. Track revenue, growth, staff, and students.', perks: ['Multi-branch management', 'Subscription & billing control', 'WhatsApp affiliate tracking', 'Revenue & growth analytics'], color: '#004B93', bgSolid: '#B3C9DF', bgSolidHover: '#A0BDD8' },
    { icon: School,        role: 'Admin',             desc: 'Streamline operations, manage teachers, configure exams, and handle academic logistics.', perks: ['Teacher & class management', 'Bulk question import (CSV)', 'Automated result sharing', 'Fee collection oversight'], color: '#7C3AED', bgSolid: '#D8C4FA', bgSolidHover: '#C6ABF7' },
    { icon: UserCheck,     role: 'Teacher',           desc: 'Create rich assessments, track your students\' growth, and share insights with parents.', perks: ['Question bank builder', 'Live exam monitoring', 'Per-student performance view', 'Automated result reports'], color: '#1FAC63', bgSolid: '#BCE6D0', bgSolidHover: '#A6DDBE' },
    { icon: GraduationCap, role: 'Student',           desc: 'Take timed exams, review answers, track scores, and stay on top of upcoming assessments.', perks: ['Clean exam interface', 'Instant result & solutions', 'Progress timeline', 'Leaderboard & rankings'], color: '#F0A026', bgSolid: '#FBE3BE', bgSolidHover: '#F9D9A5' },
    { icon: Target,        role: 'Parent',            desc: 'Stay informed about your child\'s academic journey — scores, attendance, fee status.', perks: ['Real-time score alerts', 'Fee payment history', 'Exam schedule notifications', 'Teacher communication'], color: '#EF4444', bgSolid: '#FAC7C7', bgSolidHover: '#F7AFAF' },
    { icon: Trophy,        role: 'Affiliate',         desc: 'Earn commissions by referring students through your unique WhatsApp sharing links.', perks: ['Unique referral link', 'Real-time earnings tracker', 'WhatsApp quick-share', 'Withdrawal dashboard'], color: '#25D366', bgSolid: '#BEF2D1', bgSolidHover: '#A8ECBF' },
]

const TESTIMONIALS = [
    { quote: 'We reduced our exam-management overhead by 70%. The bulk CSV import and automated result sharing is a game-changer for our 1,200-student institute.', name: 'Priya Sharma', role: 'Academic Director', org: 'Vidyamandir Classes, Pune', rating: 5 },
    { quote: 'The WhatsApp affiliate feature brought us 340 new enrolments last month with zero marketing spend. Our students are now our best promoters.', name: 'Rajesh Menon', role: 'Founder', org: 'EduPath Academy, Kerala', rating: 5 },
    { quote: 'Finally a platform where I can see every student\'s performance trend, not just raw scores. The analytics helped me redesign my teaching approach.', name: 'Anjali Desai', role: 'Senior Educator', org: 'Concept First, Ahmedabad', rating: 5 },
    { quote: 'Fee collection used to take 3 days of manual work. Now it\'s instant and fully automated — including receipts and reconciliation reports.', name: 'Suresh Kulkarni', role: 'Admin', org: 'Nalanda Coaching, Nashik', rating: 5 },
    { quote: 'My students love the clean exam interface. No confusion, no tech issues. They can focus entirely on the questions — that trust is priceless.', name: 'Meena Thomas', role: 'Mathematics Teacher', org: 'Bright Minds, Kochi', rating: 5 },
    { quote: 'Setting up our entire institute took less than 24 hours. The onboarding flow is exceptional — even our non-technical admin team managed it.', name: 'Arjun Patel', role: 'Owner', org: 'Zenith Institute, Surat', rating: 5 },
]

const COLLABORATORS = [
    { name: 'Vidyamandir Classes', icon: School },
    { name: 'Zenith Academy', icon: Trophy },
    { name: 'Nalanda Public School', icon: GraduationCap },
    { name: 'Concept First Academy', icon: Target },
    { name: 'Bright Minds Coaching', icon: BrainCircuit },
    { name: 'EduPath Institute', icon: BookOpen },
    { name: 'Chaitanya Group', icon: GraduationCap },
    { name: 'FIITJEE Pune Center', icon: Target }
]

/* ── Interactive Syllabus Showcase Component ──────────────────────────────── */
function SyllabusInteractiveShowcase() {
    const [activeTab, setActiveTab] = useState(0)

    const BOARDS = [
        {
            id: 'national',
            category: 'National Boards',
            badge: 'CBSE & ICSE',
            icon: School,
            title: 'National Boards (CBSE & ICSE)',
            subtitle: 'Complete Class 1-12 NCERT-Mapped Question Banks',
            desc: 'Topic-wise assessment modules aligned directly with NCERT textbooks. Includes 10+ years of previous year board exam questions (PYQs), chapter-end quizzes, and term-end mock papers.',
            color: '#004B93',
            bgAccent: '#EBF3FC',
            gradient: 'linear-gradient(135deg, #004B93 0%, #0077CC 100%)',
            image: '/student_achievement.png',
            stats: [
                { label: 'Question Bank', val: '45,000+' },
                { label: 'Board PYQs', val: '10+ Years' },
                { label: 'NCERT Mapped', val: '100%' }
            ],
            tags: ['Class 1-12', 'NCERT Solutions', 'Topic-wise Tests', '10+ Yrs PYQs', 'Term Mocks'],
            subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'English']
        },
        {
            id: 'competitive',
            category: 'Competitive Entrance',
            badge: 'JEE Main & NEET UG',
            icon: Target,
            title: 'JEE Main, Advanced & NEET UG',
            subtitle: 'High-Yield Mock Tests & Numerical Practice Engine',
            desc: 'Built for engineering & medical aspirants with chapter-wise worksheets, line-by-line NCERT Biology assessments, physics & chemistry numerical setups, and full NTA pattern mocks.',
            color: '#7C3AED',
            bgAccent: '#F3E8FF',
            gradient: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
            image: '/images/indian_classroom.png',
            stats: [
                { label: 'Question Bank', val: '60,000+' },
                { label: 'Entrance PYQs', val: '15+ Years' },
                { label: 'NTA Pattern', val: 'Full Mock' }
            ],
            tags: ['NTA Pattern', 'NTA Mock Series', 'Diagram Tests', 'Formula Drills', 'AIR Ranking'],
            subjects: ['Physics Numericals', 'Organic Chemistry', 'Calculus & Algebra', 'NCERT Biology']
        },
        {
            id: 'state',
            category: 'State Boards',
            badge: 'Regional Languages',
            icon: Building,
            title: 'Major State Boards',
            subtitle: 'Maharashtra, UP, Karnataka & Regional Mediums',
            desc: 'Customized content structures engineered to match State Board syllabus guidelines of Maharashtra (SSC/HSC), Uttar Pradesh (UP Board), Karnataka (SSLC/PUC), and regional mediums.',
            color: '#1FAC63',
            bgAccent: '#ECFDF5',
            gradient: 'linear-gradient(135deg, #1FAC63 0%, #10B981 100%)',
            image: '/indian_edu_hero.png',
            stats: [
                { label: 'Question Bank', val: '35,000+' },
                { label: 'State PYQs', val: '8+ Years' },
                { label: 'Mediums', val: 'Regional' }
            ],
            tags: ['Maharashtra SSC/HSC', 'UP Board', 'Karnataka SSLC', 'Regional Mediums', 'State PYQs'],
            subjects: ['State Maths', 'State Science', 'Social Studies', 'Regional Languages']
        },
        {
            id: 'foundation',
            category: 'Foundation & Global',
            badge: 'Olympiad & IB/IGCSE',
            icon: Trophy,
            title: 'Foundation, Olympiads & International',
            subtitle: 'Class 6-10 Foundation, NTSE, Cambridge IGCSE & IB',
            desc: 'Nurture school foundation students with Olympiad-level mock papers, NTSE prep, and mental ability testing alongside Cambridge IGCSE, AS/A-Levels, and IB Diploma Programme standards.',
            color: '#F0A026',
            bgAccent: '#FEF3C7',
            gradient: 'linear-gradient(135deg, #F0A026 0%, #EAB308 100%)',
            image: '/about_card_bg.png',
            stats: [
                { label: 'Question Bank', val: '30,000+' },
                { label: 'Olympiad Mocks', val: 'NTSE Prep' },
                { label: 'Standard', val: 'Global IB' }
            ],
            tags: ['Olympiad Prep', 'NTSE Testing', 'Mental Ability', 'Cambridge IGCSE', 'IB Diploma'],
            subjects: ['Advanced Maths', 'Analytical Reasoning', 'Global Science', 'Critical Thinking']
        }
    ]

    const item = BOARDS[activeTab]
    const Icon = item.icon

    return (
        <div style={{ width: '100%' }}>
            {/* 1. Tab Bar Navigation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
                {BOARDS.map((b, idx) => {
                    const BIcon = b.icon
                    const isActive = activeTab === idx
                    return (
                        <button
                            key={b.id}
                            onClick={() => setActiveTab(idx)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '12px 22px',
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 700,
                                border: isActive ? `2px solid ${b.color}` : '1px solid #E2E8F0',
                                background: isActive ? b.color : '#FFFFFF',
                                color: isActive ? '#FFFFFF' : '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                boxShadow: isActive ? `0 10px 25px -5px ${b.color}40` : '0 2px 6px rgba(0,0,0,0.02)'
                            }}
                        >
                            <BIcon size={16} style={{ color: isActive ? '#FFFFFF' : b.color }} />
                            <span>{b.category}</span>
                            <span
                                style={{
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: isActive ? 'rgba(255,255,255,0.2)' : b.bgAccent,
                                    color: isActive ? '#FFFFFF' : b.color,
                                    fontWeight: 700
                                }}
                            >
                                {b.badge}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* 2. Interactive Split Feature Showcase Card */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 32,
                    background: '#FFFFFF',
                    borderRadius: 32,
                    border: '1px solid #E2E8F0',
                    padding: '40px',
                    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
                    alignItems: 'center'
                }}
            >
                {/* Left Column — Detailed Content */}
                <div style={{ textAlign: 'left' }}>
                    {/* Header Pill */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: item.bgAccent, color: item.color, padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                        <Icon size={16} /> {item.badge}
                    </div>

                    <h3 style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 800, color: '#0F172A', lineHeight: 1.25, marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                        {item.title}
                    </h3>

                    <p style={{ fontSize: 15, color: '#64748B', fontWeight: 500, lineHeight: 1.7, marginBottom: 24 }}>
                        {item.desc}
                    </p>

                    {/* Stats Grid Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: '#F8FAFC', borderRadius: 20, padding: '16px', border: '1px solid #F1F5F9', marginBottom: 24 }}>
                        {item.stats.map((st, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: 'var(--font-manrope, sans-serif)' }}>{st.val}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{st.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Check Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {item.tags.map((tg, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', color: '#334155', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                                <CheckCircle size={13} style={{ color: item.color }} /> {tg}
                            </span>
                        ))}
                    </div>

                    {/* Subject Tags */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>
                            Available Subject Banks:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {item.subjects.map((sb, i) => (
                                <span key={i} style={{ background: item.bgAccent, color: item.color, border: `1px solid ${item.color}33`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                                    {sb}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column — Visual Image & Interactive Live Preview Box */}
                <div style={{ position: 'relative', minHeight: 380, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 24 }}>
                    {/* Background Image Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%), url("${item.image}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transition: 'all 0.5s ease'
                        }}
                    />

                    {/* Floating Glassmorphic Exam Widget */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: 20,
                            padding: 24,
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            boxShadow: '0 20px 30px rgba(0,0,0,0.15)',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: item.color, color: '#FFFFFF', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <Sparkles size={10} /> Live Module Preview
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Active Batch
                            </span>
                        </div>

                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                            {item.subtitle}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 16 }}>
                            Automated Question Bank & Timed Mock Test Engine
                        </div>

                        {/* Live Progress Bar */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                <span>Syllabus Coverage</span>
                                <span style={{ color: item.color }}>98.4% Aligned</span>
                            </div>
                            <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: '98.4%', height: '100%', background: item.gradient, borderRadius: 999 }} />
                            </div>
                        </div>

                        {/* CTA button */}
                        <Link
                            href="/request-demo"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                width: '100%',
                                background: item.gradient,
                                color: '#FFFFFF',
                                borderRadius: 12,
                                padding: '12px',
                                fontSize: 13,
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: `0 8px 16px -4px ${item.color}50`
                            }}
                        >
                            Explore {item.badge} Question Bank <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* 3. Bottom Scrolling Board Badges Strip */}
            <div style={{ marginTop: 40, overflow: 'hidden', padding: '16px 0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                    {[
                        'CBSE Class 1-12', 'ICSE & ISC Board', 'JEE Main (NTA)', 'JEE Advanced',
                        'NEET UG (Medical)', 'Maharashtra SSC/HSC', 'UP Board', 'Karnataka SSLC',
                        'Olympiads & NTSE', 'Cambridge IGCSE', 'IB Diploma'
                    ].map((bName, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 999,
                                padding: '8px 16px',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#334155',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        >
                            <Award size={14} style={{ color: '#004B93' }} /> {bName}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ── Enterprise Capability Showcase Component ──────────────────────────────── */
function EnterpriseCapabilityShowcase() {
    const [activePillar, setActivePillar] = useState(0)

    const PILLARS = [
        {
            id: 'assessment',
            title: 'Assessment & Anti-Cheat Engine',
            badge: 'Proctoring & AI Builder',
            icon: ShieldCheck,
            color: '#004B93',
            bgAccent: '#EBF3FC',
            gradient: 'linear-gradient(135deg, #004B93 0%, #0077CC 100%)',
            image: '/tech_hero.png',
            headline: 'AI Proctoring, Question Generators & Live Supervision',
            desc: 'Eliminate exam malpractice with AI-backed tab-switch tracking, randomized question pools, and instant Gemini question generation by subject and difficulty.',
            features: [
                { icon: ShieldCheck, name: 'Anti-Cheat Engine', detail: 'Tab-switch detection, browser locking, and randomized question shuffling.' },
                { icon: BrainCircuit, name: 'AI Question Builder', detail: 'Generate, import, and organize question banks with Gemini AI.' },
                { icon: Activity, name: 'Real-Time Monitoring', detail: 'Supervise ongoing exams, track live submissions, and view active test takers.' }
            ],
            metrics: [
                { label: 'Proctoring Accuracy', val: '99.9%' },
                { label: 'AI Gen Speed', val: '< 2 Secs' },
                { label: 'Question Bank', val: '500,000+' }
            ]
        },
        {
            id: 'analytics',
            title: '360° Intelligence & Analytics',
            badge: 'Cohort Trajectories & Alerts',
            icon: BarChart3,
            color: '#1FAC63',
            bgAccent: '#ECFDF5',
            gradient: 'linear-gradient(135deg, #1FAC63 0%, #10B981 100%)',
            image: '/features_hero.png',
            headline: 'Complete Visibility From Student Growth to Institution KPIs',
            desc: 'Empower educators, admins, and parents with real-time performance dashboards, score trajectories, automated alerts, and per-student weakness analysis.',
            features: [
                { icon: BarChart3, name: '360° Learning Analytics', detail: 'Individual & cohort trajectory graphs with rank predictors.' },
                { icon: Bell, name: 'Smart Notifications', detail: 'Automated alerts for exam schedules, result releases, and milestones.' },
                { icon: TrendingUp, name: 'Performance Ranking', detail: 'Automated leaderboards, percentiles, and subject-wise score splits.' }
            ],
            metrics: [
                { label: 'Analytics Depth', val: '360° View' },
                { label: 'Alert Speed', val: 'Instant' },
                { label: 'Report Auto-Gen', val: '100%' }
            ]
        },
        {
            id: 'revenue',
            title: 'WhatsApp & Fee Revenue Engine',
            badge: 'Razorpay & Affiliate Links',
            icon: Wallet,
            color: '#F0A026',
            bgAccent: '#FEF3C7',
            gradient: 'linear-gradient(135deg, #F0A026 0%, #EAB308 100%)',
            image: '/pricing_hero.png',
            headline: 'Instant Fee Collection & WhatsApp Affiliate Growth',
            desc: 'Automate student fee collections with Razorpay integration, instant receipts, and turn existing students into advocates via WhatsApp referral tracking.',
            features: [
                { icon: Wallet, name: 'Secure Fee Collection', detail: 'Razorpay integration, instant payouts, auto receipts, and audit trails.' },
                { icon: MessageSquare, name: 'WhatsApp Growth Engine', detail: 'Recruit students via WhatsApp affiliate links with referral payouts.' },
                { icon: CheckCircle, name: 'Auto Reconciliation', detail: 'Automatic ledger entry, pending fee reminders, and GST invoicing.' }
            ],
            metrics: [
                { label: 'Payout Speed', val: 'Instant' },
                { label: 'Referral Growth', val: '+35%' },
                { label: 'Security', val: 'PCI-DSS' }
            ]
        },
        {
            id: 'security',
            title: 'Multi-Tenant Enterprise Security',
            badge: 'DPDP Compliant & Isolated',
            icon: Lock,
            color: '#7C3AED',
            bgAccent: '#F3E8FF',
            gradient: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
            image: '/about_hero.png',
            headline: 'Complete Institutional Isolation & Enterprise Compliance',
            desc: 'Dedicated tenant environments with custom branding, domain mapping, role-based access control (RBAC), and DPDP data sovereignty standards.',
            features: [
                { icon: Globe, name: 'Multi-Tenant Architecture', detail: 'Isolated institution environments with custom domain & branding.' },
                { icon: Lock, name: 'Enterprise Security', detail: 'Row-level security, DPDP compliance, encrypted credentials, full logs.' },
                { icon: Shield, name: 'Role-Based Access Control', detail: 'Granular permissions for Owners, Admins, Teachers, Students, and Parents.' }
            ],
            metrics: [
                { label: 'Tenant Isolation', val: '100%' },
                { label: 'Data Security', val: 'DPDP Standard' },
                { label: 'Uptime SLA', val: '99.9%' }
            ]
        }
    ]

    const pillar = PILLARS[activePillar]
    const PillarIcon = pillar.icon

    return (
        <div style={{ width: '100%' }}>
            {/* Top Interactive Pillar Grid Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
                {PILLARS.map((p, idx) => {
                    const IconComp = p.icon
                    const isActive = activePillar === idx
                    return (
                        <button
                            key={p.id}
                            onClick={() => setActivePillar(idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '18px 20px',
                                borderRadius: 20,
                                background: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                                border: isActive ? `2px solid ${p.color}` : '1px solid #E2E8F0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isActive ? `0 12px 25px -8px ${p.color}35` : '0 2px 8px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    background: isActive ? p.color : p.bgAccent,
                                    color: isActive ? '#FFFFFF' : p.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <IconComp size={20} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? '#0F172A' : '#475569', lineHeight: 1.3, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                    {p.title}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: p.color, marginTop: 2 }}>
                                    {p.badge}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Main Interactive Enterprise Command Console */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: 32,
                    background: '#FFFFFF',
                    borderRadius: 32,
                    border: '1px solid #E2E8F0',
                    padding: '40px',
                    boxShadow: '0 20px 50px -20px rgba(0,0,0,0.08)',
                    alignItems: 'stretch'
                }}
            >
                {/* Left Column — Deep Features List */}
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: pillar.bgAccent, color: pillar.color, padding: '6px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                            <PillarIcon size={14} /> Enterprise Suite
                        </div>

                        <h3 style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 800, color: '#0F172A', lineHeight: 1.25, marginBottom: 12, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                            {pillar.headline}
                        </h3>

                        <p style={{ fontSize: 15, color: '#64748B', fontWeight: 500, lineHeight: 1.7, marginBottom: 28 }}>
                            {pillar.desc}
                        </p>

                        {/* 3 Sub-Features Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                            {pillar.features.map((feat, i) => {
                                const FIcon = feat.icon
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 14,
                                            padding: '14px 18px',
                                            borderRadius: 16,
                                            background: '#F8FAFC',
                                            border: '1px solid #F1F5F9'
                                        }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: pillar.bgAccent, color: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                            <FIcon size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>{feat.name}</div>
                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, lineHeight: 1.5, marginTop: 2 }}>{feat.detail}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Metrics Footer */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: pillar.bgAccent, borderRadius: 16, padding: '14px', border: `1px solid ${pillar.color}22` }}>
                        {pillar.metrics.map((m, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: pillar.color, fontFamily: 'var(--font-manrope, sans-serif)' }}>{m.val}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column — Enterprise Console Graphics */}
                <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 24, background: '#0F172A' }}>
                    {/* Background Hero Image */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.92) 100%), url("${pillar.image}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transition: 'all 0.5s ease'
                        }}
                    />

                    {/* Console Header Bar */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.06em' }}>ENTERPRISE CORE · ACTIVE</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>V3.0 SLA 99.9%</span>
                    </div>

                    {/* Console Content Card */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            background: 'rgba(255, 255, 255, 0.96)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: 20,
                            padding: 24,
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 800, color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                            {pillar.badge} Module
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                            {pillar.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.6, marginBottom: 20 }}>
                            Fully integrated into institution administrative workflows with automated real-time data sync.
                        </div>

                        {/* Interactive Action CTA */}
                        <Link
                            href="/features"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                width: '100%',
                                background: pillar.gradient,
                                color: '#FFFFFF',
                                borderRadius: 14,
                                padding: '14px',
                                fontSize: 14,
                                fontWeight: 800,
                                textDecoration: 'none',
                                boxShadow: `0 10px 20px -5px ${pillar.color}60`
                            }}
                        >
                            Explore {pillar.title} <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Roles Bento Grid Showcase Component ───────────────────────────────────── */
function RolesBentoGridShowcase() {
    return (
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
            {/* Bento Grid Matrix Container */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                
                {/* 1. Bento Box 1 (Col Span 7) — Institution Owner */}
                <div
                    className="md:col-span-7"
                    style={{
                        position: 'relative',
                        borderRadius: 32,
                        overflow: 'hidden',
                        padding: '36px',
                        minHeight: 320,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: '#002C5B',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 40px -15px rgba(0, 44, 91, 0.4)',
                        textAlign: 'left'
                    }}
                >
                    {/* Background Hero Image */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'linear-gradient(135deg, rgba(0, 44, 91, 0.94) 0%, rgba(0, 75, 147, 0.88) 100%), url("/about_hero.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />

                    {/* Top Header */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 16, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <Building size={22} />
                            </div>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>C-SUITE & EXECUTIVE</span>
                                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-manrope, sans-serif)', lineHeight: 1.1 }}>Institution Owner</h3>
                            </div>
                        </div>

                        {/* Live Revenue Tag */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(31, 172, 99, 0.25)', border: '1px solid rgba(31, 172, 99, 0.4)', color: '#6EE7B7', padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                            <TrendingUp size={13} /> ₹2.4L Growth
                        </div>
                    </div>

                    {/* Middle Content */}
                    <div style={{ position: 'relative', zIndex: 10, margin: '24px 0 16px' }}>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
                            Run your multi-branch coaching empire from a central executive dashboard. Monitor live revenue, student enrolments, staff performance, and WhatsApp affiliate growth.
                        </p>
                    </div>

                    {/* Bottom Feature Micro-Pills */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {['Multi-Branch Control', 'Revenue & Billing', 'WhatsApp Affiliate Engine', 'Staff Governance'].map((tag, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 12 }}>
                                <CheckCircle size={13} style={{ color: '#38BDF8' }} /> {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 2. Bento Box 2 (Col Span 5) — Teacher Console */}
                <div
                    className="md:col-span-5"
                    style={{
                        position: 'relative',
                        borderRadius: 32,
                        overflow: 'hidden',
                        padding: '36px',
                        minHeight: 320,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: '#064E3B',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.4)',
                        textAlign: 'left'
                    }}
                >
                    {/* Background Hero Image */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'linear-gradient(135deg, rgba(6, 78, 59, 0.94) 0%, rgba(16, 185, 129, 0.88) 100%), url("/images/indian_classroom.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />

                    {/* Top Header */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 16, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <UserCheck size={22} />
                            </div>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#A7F3D0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>EDUCATOR SUITE</span>
                                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-manrope, sans-serif)', lineHeight: 1.1 }}>Teacher Console</h3>
                            </div>
                        </div>
                    </div>

                    {/* Middle Content */}
                    <div style={{ position: 'relative', zIndex: 10, margin: '24px 0 16px' }}>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                            Generate custom exam papers with Gemini AI, monitor ongoing tests live, and view per-student learning trajectories.
                        </p>
                    </div>

                    {/* Live Status Widget & Tags */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 12, fontSize: 11, color: '#FFFFFF', fontWeight: 700 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} /> Live Supervision Active
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {['Gemini AI Builder', 'Student Analytics', 'Auto Grading'].map((t, i) => (
                                <span key={i} style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Bento Box 3 (Col Span 4) — Academic Admin */}
                <div
                    className="md:col-span-4"
                    style={{
                        borderRadius: 32,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: '32px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px -10px rgba(124, 58, 237, 0.08)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <School size={22} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', background: '#F3E8FF', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.06em' }}>
                            OPERATIONS
                        </span>
                    </div>

                    <div>
                        <h4 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                            Academic Admin
                        </h4>
                        <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
                            Streamline class logistics, import question banks via CSV, and automate result publishing.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {['Bulk CSV Import', 'Automated Results', 'Fee Oversight'].map((t, i) => (
                                <span key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Bento Box 4 (Col Span 4) — Student Hub */}
                <div
                    className="md:col-span-4"
                    style={{
                        borderRadius: 32,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: '32px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px -10px rgba(240, 160, 38, 0.08)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GraduationCap size={22} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.06em' }}>
                            LEARNER PORTAL
                        </span>
                    </div>

                    <div>
                        <h4 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                            Student Hub
                        </h4>
                        <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
                            Distraction-free timed exam interface, instant solution keys, and national AIR rankings.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {['Clean Exam UI', 'Instant Solutions', 'AIR Rankings'].map((t, i) => (
                                <span key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. Bento Box 5 (Col Span 4) — Parent & Affiliate */}
                <div
                    className="md:col-span-4"
                    style={{
                        borderRadius: 32,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: '32px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px -10px rgba(31, 172, 99, 0.08)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={22} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.06em' }}>
                            PARENT & AFFILIATE
                        </span>
                    </div>

                    <div>
                        <h4 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                            Parent & Affiliate Portal
                        </h4>
                        <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
                            Real-time score alerts for parents + 1-click WhatsApp referral sharing links with instant payouts.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {['Score Alerts', 'WhatsApp Share', 'Instant Payouts'].map((t, i) => (
                                <span key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Enterprise Testimonial Showcase Component ───────────────────────────── */
function EnterpriseTestimonialShowcase() {
    const TESTIMONIALS_DATA = [
        {
            featured: true,
            quote: 'We reduced our exam-management overhead by 70%. The bulk CSV import and automated result sharing is a game-changer for our 1,200-student institute.',
            name: 'Priya Sharma',
            role: 'Academic Director',
            org: 'Vidyamandir Classes, Pune',
            metric: '70% Overhead Saved',
            metricIcon: TrendingUp,
            color: '#004B93',
            badgeBg: '#EBF3FC',
            avatarBg: 'linear-gradient(135deg, #004B93, #0077CC)'
        },
        {
            quote: 'The WhatsApp affiliate feature brought us 340 new enrolments last month with zero marketing spend. Our students are now our best promoters.',
            name: 'Rajesh Menon',
            role: 'Founder & Director',
            org: 'EduPath Academy, Kerala',
            metric: '+340 Enrolments',
            metricIcon: MessageSquare,
            color: '#1FAC63',
            badgeBg: '#ECFDF5',
            avatarBg: 'linear-gradient(135deg, #1FAC63, #10B981)'
        },
        {
            quote: 'Fee collection used to take 3 days of manual work. Now it is instant and fully automated — including receipts and reconciliation reports.',
            name: 'Suresh Kulkarni',
            role: 'Administrative Lead',
            org: 'Nalanda Coaching, Nashik',
            metric: '3 Days Saved / Month',
            metricIcon: Wallet,
            color: '#F0A026',
            badgeBg: '#FEF3C7',
            avatarBg: 'linear-gradient(135deg, #F0A026, #EAB308)'
        },
        {
            quote: 'Finally a platform where I can see every student\'s performance trend, not just raw scores. The analytics helped me redesign my teaching approach.',
            name: 'Anjali Desai',
            role: 'Senior Educator',
            org: 'Concept First, Ahmedabad',
            metric: '360° Trend Insights',
            metricIcon: BarChart3,
            color: '#7C3AED',
            badgeBg: '#F3E8FF',
            avatarBg: 'linear-gradient(135deg, #7C3AED, #9333EA)'
        },
        {
            quote: 'My students love the clean exam interface. No confusion, no tech issues. They can focus entirely on the questions — that trust is priceless.',
            name: 'Meena Thomas',
            role: 'Mathematics Faculty',
            org: 'Bright Minds, Kochi',
            metric: 'Zero Tech Issues',
            metricIcon: ShieldCheck,
            color: '#004B93',
            badgeBg: '#EBF3FC',
            avatarBg: 'linear-gradient(135deg, #004B93, #1FAC63)'
        },
        {
            quote: 'Setting up our entire institute took less than 24 hours. The onboarding flow is exceptional — even our non-technical admin team managed it.',
            name: 'Arjun Patel',
            role: 'Institute Owner',
            org: 'Zenith Institute, Surat',
            metric: '< 24h Setup Time',
            metricIcon: Zap,
            color: '#EF4444',
            badgeBg: '#FEE2E2',
            avatarBg: 'linear-gradient(135deg, #EF4444, #F87171)'
        }
    ]

    return (
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
            {/* Top Stats Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
                {[
                    { val: '4.95 / 5', label: 'Average Educator Rating', icon: Star, color: '#F0A026' },
                    { val: '500+ Institutions', label: 'Coaching Centers & Schools', icon: Building, color: '#004B93' },
                    { val: '4.8M+ Exams', label: 'Successfully Delivered', icon: GraduationCap, color: '#1FAC63' },
                    { val: '99.4% CSAT', label: 'Admin & Teacher Satisfaction', icon: ShieldCheck, color: '#7C3AED' }
                ].map((st, i) => {
                    const SIcon = st.icon
                    return (
                        <div
                            key={i}
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 20,
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${st.color}15`, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <SIcon size={18} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)' }}>{st.val}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{st.label}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Testimonials Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                
                {/* Featured Spotlight Card — (Col Span 7) */}
                <div
                    className="md:col-span-7"
                    style={{
                        position: 'relative',
                        borderRadius: 32,
                        overflow: 'hidden',
                        padding: '36px',
                        minHeight: 320,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -15px rgba(15, 23, 42, 0.4)',
                        textAlign: 'left'
                    }}
                >
                    {/* Background Hero Watermark */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.88) 100%), url("/student_achievement.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />

                    {/* Top Header */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={16} style={{ color: '#F0A026', fill: '#F0A026' }} />
                            ))}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#6EE7B7', background: 'rgba(31, 172, 99, 0.2)', border: '1px solid rgba(31, 172, 99, 0.4)', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.06em' }}>
                            FEATURED CASE STUDY
                        </span>
                    </div>

                    {/* Middle Quote */}
                    <div style={{ position: 'relative', zIndex: 10, margin: '24px 0' }}>
                        <p style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 600, lineHeight: 1.6, fontFamily: 'var(--font-manrope, sans-serif)', fontStyle: 'italic', margin: 0 }}>
                            "{TESTIMONIALS_DATA[0].quote}"
                        </p>
                    </div>

                    {/* Author & Metric Footer */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: TESTIMONIALS_DATA[0].avatarBg, color: '#FFFFFF', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                                {TESTIMONIALS_DATA[0].name[0]}
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-manrope, sans-serif)' }}>{TESTIMONIALS_DATA[0].name}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{TESTIMONIALS_DATA[0].role} · {TESTIMONIALS_DATA[0].org}</div>
                            </div>
                        </div>

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', color: '#38BDF8', padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                            <TrendingUp size={14} /> {TESTIMONIALS_DATA[0].metric}
                        </span>
                    </div>
                </div>

                {/* Secondary Cards Grid — (Col Span 5 & 4s) */}
                {TESTIMONIALS_DATA.slice(1).map((item, idx) => {
                    const MIcon = item.metricIcon
                    return (
                        <div
                            key={idx}
                            className={idx === 0 ? "md:col-span-5" : "md:col-span-4"}
                            style={{
                                borderRadius: 32,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                padding: '32px',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {/* Stars & Metric Pill */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={14} style={{ color: '#F0A026', fill: '#F0A026' }} />
                                    ))}
                                </div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: item.badgeBg, color: item.color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                                    <MIcon size={12} /> {item.metric}
                                </span>
                            </div>

                            {/* Quote */}
                            <p style={{ fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                                "{item.quote}"
                            </p>

                            {/* Author */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: item.avatarBg, color: '#FFFFFF', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {item.name[0]}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.role} · {item.org}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9f9ff', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />
            <main>

                {/* ─── ANNOUNCEMENT ──────────────────────────────────── */}
                <div style={{ background: 'linear-gradient(90deg,#004B93,#0077CC,#1FAC63)', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: '13px', fontWeight: 600, lineHeight: 1.4 }}>
                    🚀 New: WhatsApp-powered affiliate program is live!{' '}
                    <Link href="/features" style={{ color: '#fff', textDecoration: 'underline', opacity: 0.85 }}>Explore now &rarr;</Link>
                </div>

                {/* ─── HERO ─────────────────────────────────────────────────── */}
                <section style={{ position: 'relative', padding: '130px 5% 88px', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {/* Subtle bg blobs as per Academic Atelier design system */}
                    <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,75,147,0.05),transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,172,99,0.04),transparent 70%)', pointerEvents: 'none' }} />
                    {/* Hero background image watermark representing Indian education */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/indian_school_hero.png")', backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />

                    <div className="max-w-3xl w-full relative z-10 flex flex-col items-center" style={{ margin: '0 auto' }}>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-[#004B93]/5 border border-[#004B93]/10 text-[#004B93] rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider mb-8">
                            <Sparkles size={12} className="text-[#004B93]" /> Institutional Excellence Platform
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#191c20] leading-tight font-manrope mb-6 text-center" style={{ letterSpacing: '-0.02em' }}>
                            Empower Every{' '}
                            <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                Educator.
                            </span>
                            <br />Inspire Every Student.
                        </h1>

                        {/* Sub */}
                        <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-xl mx-auto mb-10 font-worksans text-center">
                            India's most trusted multi-role platform — smart exams, WhatsApp growth, real-time analytics, and secure fee collection in one place.
                        </p>

                        {/* CTA row */}
                        <div className="flex flex-wrap justify-center items-center gap-4 mb-8 w-full">
                            <Link href="/request-demo" className="inline-flex items-center gap-2 bg-gradient-to-br from-[#00356A] to-[#004B93] text-white px-8 py-4 rounded-2xl font-bold text-[15px] transition-all hover:scale-[1.02] shadow-lg shadow-[#004B93]/20">
                                Get Started Free <ArrowRight size={16} />
                            </Link>
                            <Link href="/pricing" className="inline-flex items-center gap-2 bg-white text-[#191c20] px-8 py-4 rounded-2xl font-bold text-[15px] border border-gray-200 transition-all hover:bg-gray-50 hover:scale-[1.02]">
                                <Play size={14} className="text-[#004B93]" /> View Pricing
                            </Link>
                        </div>

                        {/* Trust strip */}
                        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs md:text-sm text-gray-400 font-semibold font-worksans w-full">
                            {['No credit card required', 'DPDP & data-compliant', 'Setup in under 24h'].map(t => (
                                <span key={t} className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-[#1FAC63] flex-shrink-0" /> {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard mockup */}
                    <div style={{ width: '100%', maxWidth: '960px', marginTop: '60px', position: 'relative', margin: '60px auto 0' }}>
                        {/* Floating badges */}
                        <div style={{ position: 'absolute', left: '-20px', top: '40%', zIndex: 20, display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', transition: 'transform 0.2s' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(31,172,99,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><TrendingUp size={14} className="text-[#1FAC63]" /></div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>This week</div>
                                <div style={{ fontSize: '13px', color: '#111', fontWeight: 'bold' }}>+24% Growth</div>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', right: '-20px', top: '15%', zIndex: 20, display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', transition: 'transform 0.2s' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,75,147,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><Shield size={14} className="text-[#004B93]" /></div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>Exam integrity</div>
                                <div style={{ fontSize: '13px', color: '#111', fontWeight: 'bold' }}>99.9% Uptime</div>
                            </div>
                        </div>

                        {/* Screen chrome */}
                        <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Title bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
                                <div style={{ flex: 1, fontSize: '12px', color: '#9ca3af', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '4px 10px' }}>
                                    <Lock size={10} className="text-[#1FAC63]" /> app.bebrilliant.in/dashboard
                                </div>
                            </div>
                            {/* Content */}
                            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: '300px' }}>
                                {/* Sidebar */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 10px', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    {['Dashboard', 'Exams', 'Students', 'Analytics', 'Billing', 'Settings'].map((item, i) => (
                                        <div key={item} style={{ padding: '8px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 'cbd', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)', background: i === 0 ? '#004B93' : 'transparent', userSelect: 'none' }}>{item}</div>
                                    ))}
                                </div>
                                {/* Main */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', textAlign: 'left' }}>
                                    {/* KPI row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {[
                                            { label: 'Students', val: '4,821', gradient: 'linear-gradient(135deg,#004B93,#0077CC)', Icon: Users },
                                            { label: 'Exams Today', val: '12', gradient: 'linear-gradient(135deg,#1FAC63,#28CC78)', Icon: BookOpen },
                                            { label: 'Revenue (₹)', val: '2.4L', gradient: 'linear-gradient(135deg,#F0A026,#F5B94A)', Icon: Wallet },
                                            { label: 'Avg Score', val: '78%', gradient: 'linear-gradient(135deg,#7C3AED,#9B59B6)', Icon: Trophy },
                                        ].map(({ label, val, gradient, Icon }) => (
                                            <div key={label} style={{ background: gradient, padding: '12px', borderRadius: '16px', color: '#fff' }}>
                                                <Icon size={14} style={{ opacity: 0.7, marginBottom: 6 }} />
                                                <div style={{ fontSize: '18px', fontWeight: 'extrabold' }}>{val}</div>
                                                <div style={{ fontSize: '8px', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Chart */}
                                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '16px' }}>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 'semibold', marginBottom: '10px' }}>Weekly Exam Activity</div>
                                        <div style={{ display: 'flex', alignItems: 'end', gap: '6px', height: '60px' }}>
                                            {[45, 72, 58, 85, 63, 91, 77].map((h, i) => (
                                                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: 'linear-gradient(to top,#004B93,#1FAC63)', opacity: 0.75, height: `${h}%` }} />
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: '8px', color: 'rgba(255,255,255,0.2)', fontWeight: 'semibold' }}>{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── STATS ────────────────────────────────────────────────── */}
                <section style={{ background: 'linear-gradient(135deg, #051329 0%, #0a2246 100%)', padding: '64px 5%', display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className="pub-stats-grid-6">
                        {[
                            { end: 1200000, suffix: '+', label: 'Exams Delivered', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' },
                            { end: 500,     suffix: '+', label: 'Active Institutions', gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' },
                            { end: 4800000, suffix: '+', label: 'Students Served', gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)' },
                            { end: 15000,   suffix: '+', label: 'Syllabus Covered', gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)' },
                            { end: 500000,  suffix: '+', label: 'Questions Banked', gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' },
                            { end: 99,      suffix: '.9%', label: 'Platform Uptime', gradient: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)' },
                        ].map(({ end, suffix, label, gradient }) => (
                            <div key={label} style={{ background: gradient, padding: '32px 20px', textAlign: 'center', borderRadius: 24, transition: 'all 0.3s', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.boxShadow = '0 18px 28px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                                }}
                            >
                                <div style={{ fontSize: 'clamp(26px,2.8vw,38px)', fontWeight: 900, color: '#ffffff', lineHeight: 1, marginBottom: 12, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                    <CountUp end={end} suffix={suffix} />
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#f3f4f6', textTransform: 'uppercase', letterSpacing: '0.12em', lineHeight: 1.3 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── BOARDS & SYLLABUS — Interactive Feature Showcase ────────────────── */}
                <section style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', padding: '88px 5%', overflow: 'hidden' }}>
                    <div className="pub-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,75,147,0.06)', border: '1px solid rgba(0,75,147,0.12)', color: '#004B93', borderRadius: 999, padding: '6px 18px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                                <GraduationCap size={13} /> Syllabus & Curriculum
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Pre-aligned to all major<br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>boards & entrance exams.</span>
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 540, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                Instantly assign syllabus modules, mock tests, and question banks matching your students' curriculum.
                            </p>
                        </div>

                        {/* Interactive Syllabus Showcase */}
                        <SyllabusInteractiveShowcase />
                    </div>
                </section>

                {/* ─── COLLABORATORS ─────────────────────────────────────────── */}
                <section style={{ background: '#fff', padding: '64px 0 72px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="pub-content" style={{ marginBottom: 40 }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 12, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Trusted by Leading Educational Institutions
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 640, margin: '0 auto', fontWeight: 500, lineHeight: 1.6 }}>
                                Over 500+ schools, coaching centers, and educators across India deliver assessments and manage operations with BeBrilliant.
                            </p>
                        </div>
                    </div>
                    <div className="pub-logo-marquee-container" style={{ padding: '48px 0', background: 'transparent', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <div className="pub-logo-marquee-track">
                            {[...COLLABORATORS, ...COLLABORATORS, ...COLLABORATORS].map((partner, idx) => (
                                <div key={idx} className="pub-logo-item" style={{ fontSize: '18px' }}>
                                    <partner.icon size={24} style={{ color: '#004B93' }} />
                                    <span>{partner.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FEATURES — Enterprise Capability Suite ────────────────────────── */}
                <section style={{ background: '#F8FAFC', padding: '88px 5%', overflow: 'hidden' }}>
                    <div className="pub-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#004B93', borderRadius: 999, padding: '6px 18px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                                <Zap size={13} /> Enterprise Capability Suite
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Everything your institution needs,<br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in one unified suite.</span>
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                From admissions to analytics — every critical workflow streamlined for scale.
                            </p>
                        </div>

                        {/* Enterprise Showcase */}
                        <EnterpriseCapabilityShowcase />
                    </div>
                </section>

                {/* ─── STUDENT BANNER ────────────────────────────────────────── */}
                <section style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '400px', 
                    backgroundImage: 'linear-gradient(rgba(4,18,42,0.65), rgba(0,75,147,0.52)), url("/happy_indian_students.png")', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    padding: '0 20px',
                    color: '#ffffff'
                }}>
                    <div style={{ zIndex: 10, maxWidth: '800px' }}>
                        <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, marginBottom: '8px', fontFamily: 'var(--font-manrope, sans-serif)', letterSpacing: '-0.02em', color: '#ffffff' }}>
                            Transforming the Assessment Experience for Indian Students
                        </h2>
                        <p style={{ fontSize: 'clamp(12px, 1.5vw, 15px)', fontWeight: 500, color: 'rgba(255,255,255,0.9)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.5, fontFamily: 'var(--font-worksans, sans-serif)' }}>
                            Distraction-free exam interfaces, instant result analytics, and automated study paths tailored for every student's growth.
                        </p>
                    </div>
                </section>

                {/* ─── ROLES — Bento Grid Showcase ───────────────────────────────────────── */}
                <section style={{ background: '#FFFFFF', padding: '88px 5%', overflow: 'hidden' }}>
                    <div className="pub-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,75,147,0.06)', border: '1px solid rgba(0,75,147,0.12)', color: '#004B93', borderRadius: 999, padding: '6px 18px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                                <Users size={13} /> Built for Every Role
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                The right tools for<br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>everyone in your institution.</span>
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 460, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                One platform, six dedicated portals — each tailored with high-density minimal precision.
                            </p>
                        </div>

                        {/* Bento Grid */}
                        <RolesBentoGridShowcase />
                    </div>
                </section>

                {/* ─── TESTIMONIALS — Enterprise Social Proof ────────────────────────── */}
                <section style={{ background: '#F8FAFC', padding: '88px 5%', overflow: 'hidden' }}>
                    <div className="pub-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#004B93', borderRadius: 999, padding: '6px 18px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                                <Star size={13} style={{ color: '#F0A026', fill: '#F0A026' }} /> Verified Institutional Impact
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                500+ institutions trust<br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BeBrilliant for scale & accuracy.</span>
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                Real results from institute owners, academic directors, and senior teachers across India.
                            </p>
                        </div>

                        {/* Enterprise Showcase */}
                        <EnterpriseTestimonialShowcase />
                    </div>
                </section>

                <section style={{ background: '#f8fafc', padding: '72px 5%', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="pub-content">
                        <div className="pub-trust-grid">
                            {[
                                { Icon: ShieldCheck, label: 'DPDP Compliant', sub: 'Data Privacy', desc: '100% DPDP Act compliant architecture securing student and institutional logs.' },
                                { Icon: Lock,        label: 'Bank-Grade Security', sub: 'Security', desc: 'End-to-end AES-256 encryption for user passwords, payment data, and API keys.' },
                                { Icon: Zap,         label: '< 200ms Response', sub: 'Performance', desc: 'Optimized server-rendering ensures lightning-fast quiz loads on any connection.' },
                                { Icon: Globe,       label: 'Pan-India CDN', sub: 'Availability', desc: 'Distributed edge servers deliver high-availability access from anywhere in India.' },
                                { Icon: Activity,    label: '99.9% Uptime SLA', sub: 'Reliability', desc: 'Guaranteed infrastructure uptime backed by enterprise-grade cloud redundancies.' },
                            ].map(({ Icon, label, sub, desc }) => (
                                <div key={label} className="pub-trust-card">
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,75,147,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                                        <Icon size={26} style={{ color: '#004B93' }} />
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 11, color: '#1FAC63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{sub}</div>
                                    <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── MOBILE COMPANION APPS ─────────────────────────────────── */}
                <section style={{ background: '#fff', padding: '72px 5%', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="pub-content">
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,75,147,0.05)', border: '1px solid rgba(0,75,147,0.1)', color: '#004B93', borderRadius: 999, padding: '6px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                                📱 Mobile Companion
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Download Mobile Companion Apps
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 540, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                Get immediate access to exams, schedules, performance records, and fee receipts on the go.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                            {[
                                { role: 'Teacher Companion', desc: 'Create exams, track student attendance, grade submissions, and generate Gemini AI tests instantly.', link: '/downloads/teacher-companion.apk', icon: UserCheck, color: '#004B93', label: 'Download APK' },
                                { role: 'Student Companion', desc: 'Take online assessments, review question cards, track wallet credits, and view completed grades.', link: '/downloads/student-companion.apk', icon: GraduationCap, color: '#1FAC63', label: 'Download APK' },
                                { role: 'Parent Companion', desc: 'Switch child profiles, monitor class presence calendars, view test scores, and download payment invoices.', link: '/downloads/parent-companion.apk', icon: Target, color: '#7C3AED', label: 'Download APK' }
                            ].map(({ role, desc, link, icon: Icon, color, label }) => (
                                <div key={role} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = color;
                                        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}1A`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <Icon size={20} style={{ color }} />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>{role}</h3>
                                        <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, lineHeight: 1.6, marginBottom: 24 }}>{desc}</p>
                                    </div>
                                    <a href={link} download style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: color, color: '#fff', borderRadius: 14, padding: '12px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', gap: 8, transition: 'opacity 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        <Icon size={14} /> {label}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ──────────────────────────────────────────────────── */}
                {/* ─── CTA ──────────────────────────────────────────────────── */}
                <section style={{ 
                    width: '100%', 
                    position: 'relative', 
                    backgroundImage: 'linear-gradient(rgba(0,40,80,0.85), rgba(0,60,120,0.85)), url("/student_achievement.png")', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    padding: '96px 5%',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    marginBottom: '80px'
                }}>
                    {/* Decorative blobs */}
                    <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(31,172,99,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                    {/* Dot grid overlay */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

                    <div className="relative z-10 max-w-[1200px] mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider mb-6">
                            <Sparkles size={12} /> Start Your Free Trial
                        </div>

                        <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight font-manrope mb-6 max-w-[800px] mx-auto" style={{ letterSpacing: '-0.02em' }}>
                            Ready to transform your institution?
                        </h2>
                        <p className="text-base md:text-lg text-white/70 max-w-[680px] mx-auto mb-10 leading-relaxed font-worksans">
                            Join 500+ educators redefining digital education in India. No setup fees. No hidden charges. Results from day one.
                        </p>

                        {/* Mini stats */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px 64px', paddingBottom: '36px', marginBottom: '36px', borderBottom: '1px solid rgba(255,255,255,0.12)', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
                            {[{ val: '48h', label: 'Avg. onboarding time' }, { val: '₹0', label: 'Setup cost' }, { val: '24/7', label: 'Support' }].map(({ val, label }) => (
                                <div key={label} style={{ textAlign: 'center', flexShrink: 0 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-manrope, sans-serif)' }}>{val}</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 4, fontFamily: 'var(--font-worksans, sans-serif)' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/request-demo" className="inline-flex items-center gap-2 bg-white text-[#004B93] px-8 py-4 rounded-2xl font-bold text-[15px] hover:scale-[1.02] transition-transform shadow-lg shadow-black/5">
                                Book a Free Demo <ArrowRight size={16} />
                            </Link>
                            <Link href="/contact" className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-4 rounded-2xl font-bold text-[15px] border border-white/20 hover:bg-white/25 hover:scale-[1.02] transition-transform">
                                <PhoneCall size={16} /> Talk to Sales
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
            <PublicFooter />
        </div>
    )
}
