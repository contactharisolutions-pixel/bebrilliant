'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    ArrowRight, Menu, X, User, ChevronDown, Building,
    UserCheck, School, GraduationCap, Users, ShieldCheck,
    BarChart3, BrainCircuit, FileText, CheckCircle, Lock,
    HelpCircle, BookOpen, Star, HelpCircle as HelpIcon, Sparkles
} from 'lucide-react'
import { BookDemoModal } from './BookDemoModal'

/* ── Menu Data matching docx ────────────────────────────────────────────── */
const SOLUTIONS_ITEMS = [
    { icon: Building, title: 'School / White-Label', desc: 'Complete examination platform under your own brand', href: '/white-label', badge: 'Popular' },
    { icon: UserCheck, title: 'Teacher Platform', desc: 'Create exams, manage students and analyze results', href: '/solutions/teacher' },
    { icon: School, title: 'Institute Platform', desc: 'Exam & student management for coaching classes', href: '/solutions/institute' },
    { icon: GraduationCap, title: 'Student Platform', desc: 'Self-tests & practice for current standard', href: '/solutions/student' },
]

const FEATURES_ITEMS = [
    { icon: ShieldCheck, title: 'Online Examination', desc: 'Create & conduct secure online tests', href: '/features/online-exam' },
    { icon: BrainCircuit, title: 'AI Question Generator', desc: 'Generate papers using Gemini AI', href: '/features/ai-generator', badge: 'AI Powered' },
    { icon: BarChart3, title: 'Results & Analytics', desc: 'Student, class & performance reports', href: '/features/results-analytics' },
    { icon: Users, title: 'Student Management', desc: 'Manage students, classes and batches', href: '/features/student-management' },
    { icon: FileText, title: 'Question Bank', desc: 'Create, import and manage question repositories', href: '/features/question-bank' },
    { icon: CheckCircle, title: 'OMR Examination', desc: 'Conduct offline OMR-based assessments', href: '/features/omr-examination' },
    { icon: Lock, title: 'Anti-Cheat / Proctoring', desc: 'Secure proctoring & tab-switch monitoring', href: '/features/anti-cheat' },
    { icon: UserCheck, title: 'Teacher Management', desc: 'Create & manage teacher accounts', href: '/features/teacher-management' },
]

const RESOURCES_ITEMS = [
    { icon: BookOpen, title: 'Case Studies', desc: 'Real examples of schools & institutes', href: '/resources/case-studies' },
    { icon: Star, title: 'Success Stories', desc: 'Measurable student & institution outcomes', href: '/resources/success-stories' },
    { icon: HelpIcon, title: 'FAQ', desc: 'Frequently asked questions', href: '/resources/faq' },
    { icon: FileText, title: 'Blog / Knowledge Centre', desc: 'EdTech insights & assessment best practices', href: '/resources/blog' },
    { icon: HelpCircle, title: 'Help Centre', desc: 'User guides and technical support', href: '/resources/help-center' },
]

const LOGIN_PORTALS = [
    { icon: Building, label: 'School / White-Label Login', href: '/auth/login?role=school' },
    { icon: UserCheck, label: 'Teacher Login', href: '/auth/login?role=teacher' },
    { icon: School, label: 'Institute Login', href: '/auth/login?role=institute' },
    { icon: GraduationCap, label: 'Student Login', href: '/auth/login?role=student' },
    { icon: Users, label: 'Parent Login', href: '/auth/login?role=parent' },
]

export const PublicHeader = () => {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

    // Active mega menu dropdown tracking
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 8)
        const modalHandler = () => setIsDemoModalOpen(true)
        window.addEventListener('scroll', handler, { passive: true })
        window.addEventListener('open-demo-modal', modalHandler)
        return () => {
            window.removeEventListener('scroll', handler)
            window.removeEventListener('open-demo-modal', modalHandler)
        }
    }, [])

    const handleMouseEnter = (menu: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setActiveDropdown(menu)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null)
        }, 150)
    }

    const navBase: React.CSSProperties = {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid #E2E8F0' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.25s ease',
    }

    return (
        <header style={navBase}>
            {/* ── Desktop Header Bar ── */}
            <div style={{ width: '100%', padding: '0 5%', height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, boxSizing: 'border-box' }}>

                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
                    <img
                        src="/logo.png"
                        alt="BeBrilliant"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
                        style={{ height: 42, width: 'auto', borderRadius: 8, objectFit: 'contain', display: 'block' }}
                    />
                </Link>

                {/* Main Navigation Menu */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="bb-desktop-nav font-worksans">
                    
                    {/* 1. Solutions Mega Menu */}
                    <div
                        onMouseEnter={() => handleMouseEnter('solutions')}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative' }}
                    >
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 14px',
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: activeDropdown === 'solutions' ? '#00356a' : '#191c20',
                                background: activeDropdown === 'solutions' ? '#f3f3fa' : 'transparent',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Solutions <ChevronDown size={14} style={{ transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                        </button>

                        {activeDropdown === 'solutions' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    width: 440,
                                    background: '#FFFFFF',
                                    borderRadius: 18,
                                    padding: 16,
                                    boxShadow: '0 20px 40px -10px rgba(0, 27, 60, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: 8,
                                    zIndex: 1100,
                                    animation: 'fadeIn 0.2s ease'
                                }}
                            >
                                {SOLUTIONS_ITEMS.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            onClick={() => setActiveDropdown(null)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                                padding: '12px 14px',
                                                borderRadius: 12,
                                                textDecoration: 'none',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', color: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                <Icon size={18} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{item.title}</span>
                                                    {item.badge && (
                                                        <span style={{ fontSize: 10, fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 999 }}>{item.badge}</span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', lineHeight: 1.4 }}>{item.desc}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. Features Mega Menu */}
                    <div
                        onMouseEnter={() => handleMouseEnter('features')}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative' }}
                    >
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 14px',
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: activeDropdown === 'features' ? '#00356a' : '#191c20',
                                background: activeDropdown === 'features' ? '#f3f3fa' : 'transparent',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Features <ChevronDown size={14} style={{ transform: activeDropdown === 'features' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                        </button>

                        {activeDropdown === 'features' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 660,
                                    maxWidth: 'calc(100vw - 32px)',
                                    background: '#FFFFFF',
                                    borderRadius: 20,
                                    padding: 20,
                                    boxShadow: '0 20px 45px -10px rgba(0, 27, 60, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 12,
                                    zIndex: 1100
                                }}
                            >
                                {FEATURES_ITEMS.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            onClick={() => setActiveDropdown(null)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                                padding: '12px 14px',
                                                borderRadius: 12,
                                                textDecoration: 'none',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', color: '#004B93', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                <Icon size={18} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{item.title}</span>
                                                    {item.badge && (
                                                        <span style={{ fontSize: 9.5, fontWeight: 800, background: '#F3E8FF', color: '#7C3AED', padding: '2px 8px', borderRadius: 999 }}>{item.badge}</span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0', lineHeight: 1.4, whiteSpace: 'normal' }}>{item.desc}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* 3. White-Label Direct Link */}
                    <Link
                        href="/white-label"
                        style={{
                            padding: '8px 14px',
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: '#1E3A8A',
                            textDecoration: 'none',
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <Sparkles size={13} style={{ color: '#2563EB' }} /> White-Label
                    </Link>

                    {/* 4. Resources Dropdown */}
                    <div
                        onMouseEnter={() => handleMouseEnter('resources')}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative' }}
                    >
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 14px',
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: activeDropdown === 'resources' ? '#00356a' : '#191c20',
                                background: activeDropdown === 'resources' ? '#f3f3fa' : 'transparent',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Resources <ChevronDown size={14} style={{ transform: activeDropdown === 'resources' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                        </button>

                        {activeDropdown === 'resources' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    width: 360,
                                    background: '#FFFFFF',
                                    borderRadius: 18,
                                    padding: 16,
                                    boxShadow: '0 20px 40px -10px rgba(0, 27, 60, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: 6,
                                    zIndex: 1100
                                }}
                            >
                                {RESOURCES_ITEMS.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            onClick={() => setActiveDropdown(null)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                textDecoration: 'none',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.title}</span>
                                                <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0', lineHeight: 1.3 }}>{item.desc}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* 5. Pricing Link */}
                    <Link
                        href="/pricing"
                        style={{ padding: '8px 14px', fontSize: 13.5, fontWeight: 600, color: '#191c20', textDecoration: 'none', borderRadius: 8 }}
                    >
                        Pricing
                    </Link>

                    {/* 6. About Link */}
                    <Link
                        href="/about"
                        style={{ padding: '8px 14px', fontSize: 13.5, fontWeight: 600, color: '#191c20', textDecoration: 'none', borderRadius: 8 }}
                    >
                        About
                    </Link>
                </nav>

                {/* Right Actions Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} className="font-worksans">
                    
                    {/* Multi-Role Login Dropdown */}
                    <div
                        onMouseEnter={() => handleMouseEnter('login')}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative' }}
                    >
                        <button
                            className="bb-sign-in"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13.5,
                                fontWeight: 700,
                                color: '#191c20',
                                background: activeDropdown === 'login' ? '#f3f3fa' : 'transparent',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <User size={15} /> Login <ChevronDown size={13} />
                        </button>

                        {activeDropdown === 'login' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    width: 240,
                                    background: '#FFFFFF',
                                    borderRadius: 16,
                                    padding: 10,
                                    boxShadow: '0 20px 40px -10px rgba(0, 27, 60, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    zIndex: 1100
                                }}
                            >
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', padding: '6px 10px', letterSpacing: '0.06em' }}>
                                    Select Portal
                                </div>
                                {LOGIN_PORTALS.map((portal) => {
                                    const Icon = portal.icon
                                    return (
                                        <Link
                                            key={portal.label}
                                            href={portal.href}
                                            onClick={() => setActiveDropdown(null)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                fontSize: 12.5,
                                                fontWeight: 700,
                                                color: '#334155',
                                                textDecoration: 'none',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#1E3A8A' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155' }}
                                        >
                                            <Icon size={14} /> {portal.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Book a Demo CTA */}
                    <button
                        type="button"
                        onClick={() => setIsDemoModalOpen(true)}
                        className="bb-cta font-manrope"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'linear-gradient(135deg, #00356a 0%, #004b93 100%)',
                            color: '#fff',
                            padding: '9px 20px',
                            borderRadius: 12,
                            fontSize: 13.5,
                            fontWeight: 800,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0,27,60,0.18)',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,27,60,0.25)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,27,60,0.18)' }}
                    >
                        Book a Demo <ArrowRight size={15} />
                    </button>

                    {/* Hamburger Button for Mobile */}
                    <button
                        className="bb-hamburger"
                        onClick={() => setOpen(v => !v)}
                        style={{ display: 'none', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', background: '#f3f3fa', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#191c20' }}
                        aria-label="Menu"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* ── Mobile Navigation Drawer ── */}
            <div
                className="bb-mobile-nav font-worksans"
                style={{
                    overflow: 'hidden',
                    maxHeight: open ? 800 : 0,
                    opacity: open ? 1 : 0,
                    transition: 'max-height 0.35s ease, opacity 0.25s ease',
                    borderTop: open ? '1px solid #ededf4' : 'none',
                    background: '#ffffff',
                }}
            >
                <div style={{ padding: '20px 5%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Mobile Navigation Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Link href="/white-label" onClick={() => setOpen(false)} style={{ padding: '10px 4px', fontSize: 15, fontWeight: 700, color: '#1E3A8A', textDecoration: 'none', borderBottom: '1px solid #f3f3fa' }}>
                            ✨ White-Label Platform
                        </Link>
                        <Link href="/features" onClick={() => setOpen(false)} style={{ padding: '10px 4px', fontSize: 15, fontWeight: 700, color: '#191c20', textDecoration: 'none', borderBottom: '1px solid #f3f3fa' }}>
                            Features & Capabilities
                        </Link>
                        <Link href="/pricing" onClick={() => setOpen(false)} style={{ padding: '10px 4px', fontSize: 15, fontWeight: 700, color: '#191c20', textDecoration: 'none', borderBottom: '1px solid #f3f3fa' }}>
                            Pricing Plans
                        </Link>
                        <Link href="/case-studies" onClick={() => setOpen(false)} style={{ padding: '10px 4px', fontSize: 15, fontWeight: 700, color: '#191c20', textDecoration: 'none', borderBottom: '1px solid #f3f3fa' }}>
                            Case Studies & Resources
                        </Link>
                        <Link href="/about" onClick={() => setOpen(false)} style={{ padding: '10px 4px', fontSize: 15, fontWeight: 700, color: '#191c20', textDecoration: 'none', borderBottom: '1px solid #f3f3fa' }}>
                            About BeBrilliant
                        </Link>
                    </div>

                    {/* Mobile Login Portal Section */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>
                            Portals & Login
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {LOGIN_PORTALS.map(p => (
                                <Link
                                    key={p.label}
                                    href={p.href}
                                    onClick={() => setOpen(false)}
                                    style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: '#334155', background: '#F8FAFC', borderRadius: 8, textDecoration: 'none', textAlign: 'center', border: '1px solid #E2E8F0' }}
                                >
                                    {p.label.replace(' Login', '')}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Mobile CTA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10 }}>
                        <button
                            type="button"
                            onClick={() => { setOpen(false); setIsDemoModalOpen(true); }}
                            style={{ textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg, #00356a 0%, #004b93 100%)', color: '#ffffff', borderRadius: 12, border: 'none', cursor: 'pointer' }}
                        >
                            Book a Free Demo
                        </button>
                    </div>
                </div>
            </div>

            {/* Book Demo Modal Dialog */}
            <BookDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

            {/* Responsive Media Overrides */}
            <style>{`
                @media (max-width: 960px) {
                    .bb-desktop-nav { display: none !important; }
                    .bb-sign-in     { display: none !important; }
                    .bb-hamburger   { display: flex !important; }
                }
                @media (min-width: 961px) {
                    .bb-mobile-nav  { display: none !important; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </header>
    )
}
