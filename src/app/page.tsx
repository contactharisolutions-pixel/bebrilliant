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

                {/* ─── BOARDS & SYLLABUS ──────────────────────────────────────── */}
                <section style={{ background: '#fff', padding: '72px 5%' }}>
                    <div className="pub-content">
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,75,147,0.05)', border: '1px solid rgba(0,75,147,0.1)', color: '#004B93', borderRadius: 999, padding: '6px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                                <GraduationCap size={12} /> Syllabus & Curriculum
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Pre-aligned to all major<br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>boards & entrance exams.</span>
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                Instantly assign syllabus modules, mock tests, and question banks matching your students' curriculum.
                            </p>
                        </div>

                        {/* Grid */}
                        <div className="pub-cards-3">
                            {[
                                { icon: School, title: 'National Boards (CBSE & ICSE)', desc: 'Complete Class 1-12 question banks mapped directly to NCERT textbooks, offering topic-wise tests and 10+ years board PYQs.', color: '#004B93', bg: '#B3C9DF', bgHover: '#A0BDD8' },
                                { icon: Target, title: 'JEE Main & Advanced', desc: 'Rigorous preparatory assessment packages for engineering aspirants, including chapter-wise worksheets and full mock series.', color: '#7C3AED', bg: '#D8C4FA', bgHover: '#C6ABF7' },
                                { icon: Activity, title: 'NEET UG Preparation', desc: 'Line-by-line NCERT Biology tests, physics and chemistry numerical setups, and graphical diagram-based assessments.', color: '#EF4444', bg: '#FAC7C7', bgHover: '#F7AFAF' },
                                { icon: Building, title: 'Major State Boards', desc: 'Custom content structures matching State Board requirements of Maharashtra, Uttar Pradesh, Karnataka, and regional languages.', color: '#1FAC63', bg: '#BCE6D0', bgHover: '#A6DDBE' },
                                { icon: Trophy, title: 'Foundation & Olympiads', desc: 'Nurture school foundation students (Classes 6-10) with Olympiad-level mock papers, NTSE preps, and mental ability testing.', color: '#F0A026', bg: '#FBE3BE', bgHover: '#F9D9A5' },
                                { icon: Globe, title: 'International Curriculums', desc: 'Assessments aligned to Cambridge IGCSE, AS/A-Levels, and IB Diploma Programme syllabus standards.', color: '#25D366', bg: '#BEF2D1', bgHover: '#A8ECBF' }
                            ].map(({ icon: Icon, title, desc, color, bg, bgHover }) => (
                                <div
                                    key={title}
                                    style={{ background: bg, border: `1px solid ${color}1A`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', cursor: 'default' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = bgHover;
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = bg;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)';
                                    }}
                                >
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                        <Icon size={22} style={{ color }} />
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>{title}</h3>
                                    <p style={{ fontSize: 14, color: '#4b5563', fontWeight: 500, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                                </div>
                            ))}
                        </div>
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

                {/* ─── FEATURES ──────────────────────────────────────────── */}
                <section style={{ background: '#f9f9ff', padding: '72px 5%' }}>
                    <div className="pub-content">
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', color: '#004B93', borderRadius: 999, padding: '6px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <Zap size={12} /> Platform Capabilities
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                Everything your institution needs,<br />
                                <span style={{ background: 'linear-gradient(135deg,#004B93,#1FAC63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in one platform.</span>
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                From admissions to analytics — every critical workflow streamlined for scale.
                            </p>
                        </div>

                        {/* Grid */}
                        <div className="pub-cards-3">
                            {FEATURES.map(({ icon: Icon, title, desc, color, bgSolid, bgSolidHover }) => (
                                <div
                                    key={title}
                                    style={{ background: bgSolid, border: `1px solid ${color}1A`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', transition: 'all 0.3s', boxShadow: `0 10px 30px -10px ${color}15`, cursor: 'default' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = bgSolidHover;
                                        e.currentTarget.style.borderColor = `${color}33`;
                                        e.currentTarget.style.boxShadow = `0 15px 35px -8px ${color}2E`;
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = bgSolid;
                                        e.currentTarget.style.borderColor = `${color}1A`;
                                        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${color}15`;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                        <Icon size={22} style={{ color }} />
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>{title}</h3>
                                    <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                                </div>
                            ))}
                        </div>
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

                {/* ─── ROLES ───────────────────────────────────────────────── */}
                <section style={{ background: '#fff', padding: '72px 5%' }}>
                    <div className="pub-content">
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,75,147,0.05)', border: '1px solid rgba(0,75,147,0.1)', color: '#004B93', borderRadius: 999, padding: '6px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                                <Users size={12} /> Built for Every Role
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                The right tools for<br />everyone in your institution.
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 440, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                One platform, six dedicated portals — each tailored to what that role actually needs.
                            </p>
                        </div>

                        <div className="pub-cards-3">
                            {ROLES.map(({ icon: Icon, role, desc, perks, color, bgSolid, bgSolidHover }) => (
                                <div
                                    key={role}
                                    style={{ background: bgSolid, border: `1px solid ${color}1A`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s', boxShadow: `0 10px 30px -10px ${color}15` }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = bgSolidHover;
                                        e.currentTarget.style.borderColor = `${color}33`;
                                        e.currentTarget.style.boxShadow = `0 15px 35px -8px ${color}2E`;
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = bgSolid;
                                        e.currentTarget.style.borderColor = `${color}1A`;
                                        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${color}15`;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                            <Icon size={22} style={{ color }} />
                                        </div>
                                        <h3 style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 10, fontFamily: 'var(--font-manrope, sans-serif)' }}>{role}</h3>
                                        <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, lineHeight: 1.7, marginBottom: 20 }}>{desc}</p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {perks.map(p => (
                                                <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151', fontWeight: 600 }}>
                                                    <CheckCircle size={14} style={{ color: '#1FAC63', flexShrink: 0 }} /> {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Link href="/features" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#004B93', textDecoration: 'none' }}>
                                        Learn more <ArrowRight size={14} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── TESTIMONIALS ───────────────────────────────────────── */}
                <section style={{ background: '#f9f9ff', padding: '72px 0' }}>
                    <div className="pub-content">
                        <div style={{ textAlign: 'center', marginBottom: 56, padding: '0 20px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', color: '#004B93', borderRadius: 999, padding: '6px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <Star size={12} style={{ color: '#F0A026' }} /> Trusted by Educators
                            </div>
                            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                500+ institutions trust<br />BeBrilliant.
                            </h2>
                            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 440, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
                                Real testimonials from teachers, admins, and students across India.
                            </p>
                        </div>
                    </div>

                    <div className="pub-testimonial-marquee-container">
                        <div className="pub-testimonial-marquee-track">
                            {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map(({ quote, name, role, org, rating }, idx) => (
                                <div key={idx} className="pub-testimonial-card">
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                                            {Array.from({ length: rating }).map((_, i) => <Star key={i} size={14} style={{ color: '#F0A026', fill: '#F0A026' }} />)}
                                        </div>
                                        <p style={{ fontSize: 14, color: '#4b5563', fontWeight: 500, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>"{quote}"</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20, marginTop: 20, borderTop: '1px solid #f3f4f6' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#004B93,#1FAC63)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                            {name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-manrope, sans-serif)' }}>{name}</div>
                                            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{role} · {org}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                { role: 'Teacher Companion', desc: 'Create exams, track student attendance, grade submissions, and generate Gemini AI tests instantly.', link: '#', icon: UserCheck, color: '#004B93', label: 'Download APK' },
                                { role: 'Student Companion', desc: 'Take online assessments, review question cards, track wallet credits, and view completed grades.', link: '#', icon: GraduationCap, color: '#1FAC63', label: 'Download APK' },
                                { role: 'Parent Companion', desc: 'Switch child profiles, monitor class presence calendars, view test scores, and download payment invoices.', link: '#', icon: Target, color: '#7C3AED', label: 'Download APK' }
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
                                    <a href={link} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: color, color: '#fff', borderRadius: 14, padding: '12px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', gap: 8, transition: 'opacity 0.2s' }}
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
