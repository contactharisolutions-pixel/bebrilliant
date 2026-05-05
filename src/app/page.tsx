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
    Play, PhoneCall
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
    { icon: ShieldCheck, title: 'Anti-Cheat Exam Engine', desc: 'AI-backed proctoring, tab-switch detection, and randomised question pools keep every exam fair.', color: '#004B93', bg: 'rgba(0,75,147,0.07)' },
    { icon: BarChart3,   title: '360° Learning Analytics', desc: 'Real-time dashboards from cohort performance to individual learning trajectories for every role.', color: '#1FAC63', bg: 'rgba(31,172,99,0.07)' },
    { icon: Wallet,      title: 'Secure Fee Collection',   desc: 'Razorpay-powered payments with instant settlements, auto-receipts, and full audit trails.', color: '#F0A026', bg: 'rgba(240,160,38,0.08)' },
    { icon: MessageSquare, title: 'WhatsApp Growth Engine', desc: 'Recruit students via WhatsApp affiliate links with automated referral tracking and payouts.', color: '#25D366', bg: 'rgba(37,211,102,0.07)' },
    { icon: BrainCircuit, title: 'AI Question Builder',  desc: 'Generate, import, and organise question banks by subject and difficulty with Gemini AI.', color: '#7C3AED', bg: 'rgba(124,58,237,0.07)' },
    { icon: Bell,         title: 'Smart Notifications',  desc: 'Automated alerts for exam schedules, result releases, payment due dates, and milestones.', color: '#004B93', bg: 'rgba(0,75,147,0.07)' },
    { icon: Globe,        title: 'Multi-Tenant Architecture', desc: 'Fully isolated per-institution environments with custom branding, domain, and roles.', color: '#1FAC63', bg: 'rgba(31,172,99,0.07)' },
    { icon: Activity,     title: 'Real-Time Monitoring', desc: 'Live exam supervision, submission tracking, and instant result computation.', color: '#EF4444', bg: 'rgba(239,68,68,0.07)' },
    { icon: Lock,         title: 'Enterprise Security',  desc: 'Row-level data isolation, DPDP-compliant storage, encrypted credentials, full audit logs.', color: '#F0A026', bg: 'rgba(240,160,38,0.08)' },
]

const ROLES = [
    { icon: Building,      role: 'Institution Owner', desc: 'Run your entire coaching empire from one place. Track revenue, growth, staff, and students.', perks: ['Multi-branch management', 'Subscription & billing control', 'WhatsApp affiliate tracking', 'Revenue & growth analytics'], color: '#004B93', bg: 'rgba(0,75,147,0.08)' },
    { icon: School,        role: 'Admin',             desc: 'Streamline operations, manage teachers, configure exams, and handle academic logistics.', perks: ['Teacher & class management', 'Bulk question import (CSV)', 'Automated result sharing', 'Fee collection oversight'], color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
    { icon: UserCheck,     role: 'Teacher',           desc: 'Create rich assessments, track your students\' growth, and share insights with parents.', perks: ['Question bank builder', 'Live exam monitoring', 'Per-student performance view', 'Automated result reports'], color: '#1FAC63', bg: 'rgba(31,172,99,0.08)' },
    { icon: GraduationCap, role: 'Student',           desc: 'Take timed exams, review answers, track scores, and stay on top of upcoming assessments.', perks: ['Clean exam interface', 'Instant result & solutions', 'Progress timeline', 'Leaderboard & rankings'], color: '#F0A026', bg: 'rgba(240,160,38,0.08)' },
    { icon: Target,        role: 'Parent',            desc: 'Stay informed about your child\'s academic journey — scores, attendance, fee status.', perks: ['Real-time score alerts', 'Fee payment history', 'Exam schedule notifications', 'Teacher communication'], color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
    { icon: Trophy,        role: 'Affiliate',         desc: 'Earn commissions by referring students through your unique WhatsApp sharing links.', perks: ['Unique referral link', 'Real-time earnings tracker', 'WhatsApp quick-share', 'Withdrawal dashboard'], color: '#25D366', bg: 'rgba(37,211,102,0.08)' },
]

const TESTIMONIALS = [
    { quote: 'We reduced our exam-management overhead by 70%. The bulk CSV import and automated result sharing is a game-changer for our 1,200-student institute.', name: 'Priya Sharma', role: 'Academic Director', org: 'Vidyamandir Classes, Pune', rating: 5 },
    { quote: 'The WhatsApp affiliate feature brought us 340 new enrolments last month with zero marketing spend. Our students are now our best promoters.', name: 'Rajesh Menon', role: 'Founder', org: 'EduPath Academy, Kerala', rating: 5 },
    { quote: 'Finally a platform where I can see every student\'s performance trend, not just raw scores. The analytics helped me redesign my teaching approach.', name: 'Anjali Desai', role: 'Senior Educator', org: 'Concept First, Ahmedabad', rating: 5 },
    { quote: 'Fee collection used to take 3 days of manual work. Now it\'s instant and fully automated — including receipts and reconciliation reports.', name: 'Suresh Kulkarni', role: 'Admin', org: 'Nalanda Coaching, Nashik', rating: 5 },
    { quote: 'My students love the clean exam interface. No confusion, no tech issues. They can focus entirely on the questions — that trust is priceless.', name: 'Meena Thomas', role: 'Mathematics Teacher', org: 'Bright Minds, Kochi', rating: 5 },
    { quote: 'Setting up our entire institute took less than 24 hours. The onboarding flow is exceptional — even our non-technical admin team managed it.', name: 'Arjun Patel', role: 'Owner', org: 'Zenith Institute, Surat', rating: 5 },
]

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
    return (
        <div style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }} className="flex flex-col min-h-screen bg-white">
            <PublicHeader />
            <main>

                {/* ─── ANNOUNCEMENT ─────────────────────────────────────────── */}
                <div style={{ background: 'linear-gradient(90deg,#004B93,#0077CC,#1FAC63)', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: '13px', fontWeight: 600, lineHeight: 1.4 }}>
                    🎉 New: WhatsApp-powered affiliate program is live!{' '}
                    <Link href="/features" style={{ color: '#fff', textDecoration: 'underline', opacity: 0.85 }}>Explore now →</Link>
                </div>

                {/* ─── HERO ─────────────────────────────────────────────────── */}
                <section style={{ padding: '96px 5% 80px', background: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    {/* Subtle bg blobs */}
                    <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,75,147,0.06),transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,172,99,0.05),transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        {/* Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,75,147,0.06)', border: '1px solid rgba(0,75,147,0.12)', color: '#004B93', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 28 }}>
                            <Sparkles size={11} /> Institutional Excellence Platform
                        </div>

                        {/* Headline */}
                        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, color: '#0a0a0a', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
                            Empower Every{' '}
                            <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                Educator.
                            </span>
                            <br />Inspire Every Student.
                        </h1>

                        {/* Sub */}
                        <p style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                            India's most trusted multi-role platform — smart exams, WhatsApp growth, real-time analytics, and secure fee collection in one place.
                        </p>

                        {/* CTA row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
                            <Link href="/request-demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#004B93', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,75,147,0.25)' }}>
                                Get Started Free <ArrowRight size={15} />
                            </Link>
                            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#111', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1.5px solid #e5e7eb' }}>
                                <Play size={14} style={{ color: '#004B93' }} /> View Pricing
                            </Link>
                        </div>

                        {/* Trust strip */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px', fontSize: 13, color: '#9ca3af' }}>
                            {['No credit card required', 'DPDP & data-compliant', 'Setup in under 24h'].map(t => (
                                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <CheckCircle size={13} style={{ color: '#1FAC63', flexShrink: 0 }} /> {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard mockup */}
                    <div style={{ maxWidth: 1040, margin: '60px auto 0', position: 'relative' }}>
                        {/* Floating badges */}
                        <div style={{ position: 'absolute', left: -16, top: '30%', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(31,172,99,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={14} style={{ color: '#1FAC63' }} /></div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>This week</div>
                                <div style={{ fontSize: 13, color: '#111', fontWeight: 700 }}>+24% Growth</div>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', right: -16, top: 24, zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,75,147,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={14} style={{ color: '#004B93' }} /></div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Exam integrity</div>
                                <div style={{ fontSize: 13, color: '#111', fontWeight: 700 }}>99.9% Uptime</div>
                            </div>
                        </div>

                        {/* Screen chrome */}
                        <div style={{ background: '#111827', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}>
                            {/* Title bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
                                <div style={{ flex: 1, marginLeft: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Lock size={9} style={{ color: '#1FAC63' }} /> app.bebrilliant.in/dashboard
                                </div>
                            </div>
                            {/* Content */}
                            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 0, minHeight: 260 }}>
                                {/* Sidebar */}
                                <div style={{ padding: '16px 10px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {['Dashboard', 'Exams', 'Students', 'Analytics', 'Billing', 'Settings'].map((item, i) => (
                                        <div key={item} style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)', background: i === 0 ? '#004B93' : 'transparent' }}>{item}</div>
                                    ))}
                                </div>
                                {/* Main */}
                                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* KPI row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                                        {[
                                            { label: 'Students', val: '4,821', gradient: 'linear-gradient(135deg,#004B93,#0077CC)', Icon: Users },
                                            { label: 'Exams Today', val: '12', gradient: 'linear-gradient(135deg,#1FAC63,#28CC78)', Icon: BookOpen },
                                            { label: 'Revenue (₹)', val: '2.4L', gradient: 'linear-gradient(135deg,#F0A026,#F5B94A)', Icon: Wallet },
                                            { label: 'Avg Score', val: '78%', gradient: 'linear-gradient(135deg,#7C3AED,#9B59B6)', Icon: Trophy },
                                        ].map(({ label, val, gradient, Icon }) => (
                                            <div key={label} style={{ background: gradient, borderRadius: 12, padding: '12px 10px', color: '#fff' }}>
                                                <Icon size={13} style={{ opacity: 0.7, marginBottom: 6 }} />
                                                <div style={{ fontSize: 18, fontWeight: 900 }}>{val}</div>
                                                <div style={{ fontSize: 9, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Chart */}
                                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 }}>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 10 }}>Weekly Exam Activity</div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                                            {[45, 72, 58, 85, 63, 91, 77].map((h, i) => (
                                                <div key={i} style={{ flex: 1, borderRadius: '4px 4px 0 0', background: 'linear-gradient(to top,#004B93,#1FAC63)', opacity: 0.75, height: `${h}%` }} />
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── STATS ────────────────────────────────────────────────── */}
                <section style={{ padding: '0 5% 80px', background: '#fff' }}>
                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid #f0f0f0', borderRadius: 20, overflow: 'hidden', boxSizing: 'border-box' }}>
                        {[
                            { end: 1200000, suffix: '+', label: 'Exams Delivered', color: '#004B93' },
                            { end: 500,     suffix: '+', label: 'Active Institutions', color: '#1FAC63' },
                            { end: 4800000, suffix: '+', label: 'Students Served', color: '#004B93' },
                            { end: 99,      suffix: '.9%', label: 'Platform Uptime', color: '#1FAC63' },
                        ].map(({ end, suffix, label, color }, i) => (
                            <div key={label} style={{ padding: '40px 16px', textAlign: 'center', borderLeft: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
                                <div style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color, lineHeight: 1, marginBottom: 8 }}>
                                    <CountUp end={end} suffix={suffix} />
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── FEATURES ─────────────────────────────────────────────── */}
                <section style={{ padding: '80px 5%', background: '#f9fafb' }}>
                    <div style={{ width: '100%' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#004B93', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <Zap size={11} /> Platform Capabilities
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
                                Everything your institution needs,
                                <br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in one platform.</span>
                            </h2>
                            <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
                                From admissions to analytics — every critical workflow streamlined for scale.
                            </p>
                        </div>

                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
                                <div key={title} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20, padding: '28px 24px' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Icon size={22} style={{ color }} />
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>{title}</div>
                                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── ROLES ────────────────────────────────────────────────── */}
                <section style={{ padding: '80px 5%', background: '#fff' }}>
                    <div style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,75,147,0.06)', border: '1px solid rgba(0,75,147,0.1)', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#004B93', marginBottom: 20 }}>
                                <Users size={11} /> Built for Every Role
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
                                The right tools for<br />everyone in your institution.
                            </h2>
                            <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 440, margin: '0 auto' }}>
                                One platform, six dedicated portals — each tailored to what that role actually needs.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                            {ROLES.map(({ icon: Icon, role, desc, perks, color, bg }) => (
                                <div key={role} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20, padding: '28px 24px' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Icon size={22} style={{ color }} />
                                    </div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>{role}</div>
                                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>{desc}</div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {perks.map(p => (
                                            <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                                                <CheckCircle size={13} style={{ color: '#1FAC63', flexShrink: 0 }} /> {p}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/features" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#004B93', textDecoration: 'none' }}>
                                        Learn more <ArrowRight size={13} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── TESTIMONIALS ─────────────────────────────────────────── */}
                <section style={{ padding: '80px 5%', background: '#f9fafb' }}>
                    <div style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#004B93', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <Star size={11} style={{ color: '#F0A026', fill: '#F0A026' }} /> Trusted by Educators
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
                                500+ institutions trust<br />BeBrilliant.
                            </h2>
                            <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 440, margin: '0 auto' }}>
                                Real testimonials from teachers, admins, and students across India.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                            {TESTIMONIALS.map(({ quote, name, role, org, rating }) => (
                                <div key={name} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Stars */}
                                    <div style={{ display: 'flex', gap: 3 }}>
                                        {Array.from({ length: rating }).map((_, i) => <Star key={i} size={13} style={{ color: '#F0A026', fill: '#F0A026' }} />)}
                                    </div>
                                    {/* Quote */}
                                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, flex: 1, margin: 0 }}>"{quote}"</p>
                                    {/* Author */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid #f9fafb' }}>
                                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#004B93,#1FAC63)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                            {name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{role} · {org}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── TRUST BAR ────────────────────────────────────────────── */}
                <section style={{ padding: '48px 5%', background: '#fff', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '24px 48px' }}>
                        {[
                            { Icon: ShieldCheck, label: 'DPDP Compliant', sub: 'Data Privacy' },
                            { Icon: Lock,        label: 'Bank-Grade Encryption', sub: 'Security' },
                            { Icon: Zap,         label: '< 200ms Response', sub: 'Performance' },
                            { Icon: Globe,       label: 'Pan-India CDN', sub: 'Availability' },
                            { Icon: Activity,    label: '99.9% Uptime SLA', sub: 'Reliability' },
                        ].map(({ Icon, label, sub }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,75,147,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} style={{ color: '#004B93' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{label}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── CTA ──────────────────────────────────────────────────── */}
                <section style={{ padding: '80px 5%', background: '#fff' }}>
                    <div style={{ width: '100%' }}>
                        <div style={{ background: 'linear-gradient(135deg,#003d7a,#004B93,#005fa3)', borderRadius: 28, padding: '72px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            {/* Decorative blobs */}
                            <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(31,172,99,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                            {/* Dot grid overlay */}
                            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', marginBottom: 24 }}>
                                    <Sparkles size={11} /> Start Your Free Trial
                                </div>

                                <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
                                    Ready to transform<br />your institution?
                                </h2>
                                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', margin: '0 0 36px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                                    Join 500+ educators redefining digital education in India.<br />
                                    No setup fees. No hidden charges. Results from day one.
                                </p>

                                {/* CTAs */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 48 }}>
                                    <Link href="/request-demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#004B93', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                                        Book a Free Demo <ArrowRight size={15} />
                                    </Link>
                                    <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                                        <PhoneCall size={15} /> Talk to Sales
                                    </Link>
                                </div>

                                {/* Mini stats */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 40px', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    {[{ val: '48h', label: 'Avg. onboarding time' }, { val: '₹0', label: 'Setup cost' }, { val: '24/7', label: 'Support' }].map(({ val, label }) => (
                                        <div key={label} style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{val}</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <PublicFooter />
        </div>
    )
}
