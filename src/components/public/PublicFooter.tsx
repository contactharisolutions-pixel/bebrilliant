'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Globe, Twitter, Linkedin, Youtube, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

const FOOTER_COLUMNS = [
    {
        title: 'Solutions',
        links: [
            { label: 'School / White-Label', href: '/white-label' },
            { label: 'Teacher Platform',    href: '/solutions/teacher' },
            { label: 'Institute Platform',  href: '/solutions/institute' },
            { label: 'Student Platform',    href: '/solutions/student' },
            { label: 'Pricing Plans',       href: '/pricing' },
        ],
    },
    {
        title: 'Key Capabilities',
        links: [
            { label: 'Online Examination',   href: '/features/online-exam' },
            { label: 'AI Question Generator', href: '/features/ai-generator' },
            { label: 'Results & Analytics',  href: '/features/results-analytics' },
            { label: 'Question Bank',        href: '/features/question-bank' },
            { label: 'OMR Examination',     href: '/features/omr-examination' },
            { label: 'Anti-Cheat Proctoring', href: '/features/anti-cheat' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Case Studies',        href: '/resources/case-studies' },
            { label: 'Success Stories',     href: '/resources/success-stories' },
            { label: 'Detailed FAQ',        href: '/resources/faq' },
            { label: 'Knowledge Centre',    href: '/resources/blog' },
            { label: 'Help Centre',         href: '/resources/help-center' },
        ],
    },
    {
        title: 'Company & Legal',
        links: [
            { label: 'About Us',            href: '/about' },
            { label: 'Contact Us',          href: '/contact' },
            { label: 'Privacy Policy',      href: '/privacy' },
            { label: 'Terms & Conditions',  href: '/terms' },
            { label: 'Refund Policy',       href: '/refund' },
        ],
    },
]

export const PublicFooter = () => {
    return (
        <footer style={{ background: '#090D16', color: '#FFFFFF', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Subtle radial ambient glow */}
            <div style={{ position: 'absolute', top: 0, right: '15%', width: 500, height: 300, background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', padding: '64px 5% 32px', position: 'relative', zIndex: 10, boxSizing: 'border-box' }} className="font-worksans">

                {/* ── 1. MAIN GRID ── */}
                <div className="bb-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, paddingBottom: 56, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>

                    {/* Brand column */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Logo */}
                        <Link href="/" style={{ display: 'inline-flex', marginBottom: 20 }}>
                            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '8px 14px', display: 'inline-flex' }}>
                                <img
                                    src="/logo.png"
                                    alt="BeBrilliant"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
                                    style={{ height: 34, width: 'auto', borderRadius: 4, objectFit: 'contain', display: 'block' }}
                                />
                            </div>
                        </Link>

                        {/* Tagline */}
                        <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.65, marginBottom: 24, maxWidth: 300 }}>
                            India's most trusted multi-role examination platform — AI paper generation, anti-cheat proctoring, real-time analytics, and automated fee collection.
                        </p>

                        {/* Contact details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                            {[
                                { Icon: Mail,   text: 'support@bebrilliant.in',  href: 'mailto:support@bebrilliant.in' },
                                { Icon: Phone,  text: '+91 98751 59220',         href: 'tel:+919875159220' },
                                { Icon: MapPin, text: 'BeBrilliant Hub, Mumbai, India', href: null },
                            ].map(({ Icon, text, href }) => {
                                const content = (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Icon size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: '#CBD5E1' }}>{text}</span>
                                    </div>
                                )
                                return href
                                    ? <a key={text} href={href} style={{ textDecoration: 'none' }}>{content}</a>
                                    : <div key={text}>{content}</div>
                            })}
                        </div>

                        {/* Socials */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[
                                { Icon: Twitter,  href: '#', label: 'Twitter' },
                                { Icon: Linkedin, href: '#', label: 'LinkedIn' },
                                { Icon: Youtube,  href: '#', label: 'YouTube' },
                            ].map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94A3B8',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = '#2563EB'
                                        ;(e.currentTarget as HTMLElement).style.color = '#FFFFFF'
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)'
                                        ;(e.currentTarget as HTMLElement).style.color = '#94A3B8'
                                    }}
                                >
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Nav columns */}
                    {FOOTER_COLUMNS.map(({ title, links }) => (
                        <div key={title}>
                            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 20, fontFamily: 'var(--font-manrope, sans-serif)' }}>
                                {title}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                                {links.map(({ label, href }) => (
                                    <li key={label}>
                                        <Link
                                            href={href}
                                            style={{ fontSize: 13.5, fontWeight: 500, color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s ease' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFFFFF'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── 2. APP STORE BADGES & DPDP STRIP ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '28px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>Available App On:</span>
                        
                        {/* Play Store */}
                        <a
                            href="#"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.1 3.4c-.3.3-.4.9-.4 1.6v14c0 .7.1 1.3.4 1.6l.1.1 7.7-7.7v-.2L5.2 3.3l-.1.1z" fill="#00FFF0"/>
                                <path d="M15.5 15.6l-2.6-2.6v-.1l2.6-2.6.1.1 3.1 1.8c.9.5.9 1.3 0 1.8l-3.1 1.8c0 0-.1 0-.1-.2z" fill="#FFB900"/>
                                <path d="M13 12.9l-7.8-7.8c.3-.3.8-.3 1.4 0l8.9 5.1L13 12.9z" fill="#FF007F"/>
                                <path d="M13 13.1l2.5 2.5-8.9 5.1c-.6.3-1.1.3-1.4 0l7.8-7.6z" fill="#00E060"/>
                            </svg>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>GET IT ON</div>
                                <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-manrope, sans-serif)', lineHeight: 1 }}>Google Play</div>
                            </div>
                        </a>

                        {/* App Store */}
                        <a
                            href="#"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: '#fff' }}>
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.5-1.34 0-1.77-.82-3.3-.82s-2 .8-3.3 0c-1.34-.05-2.29-1.33-3.09-2.52-1.72-2.46-3-7.21-1.22-10.29.9-1.55 2.5-2.53 4.25-2.56 1.33 0 2.58.92 3.4 1 1-.08 2.5-1 4.12-1a4.91 4.91 0 0 1 3.88 2 4.83 4.83 0 0 0-2.31 4.17c0 3.3 2.69 4.47 2.72 4.49a10.82 10.82 0 0 1-2.3 4.53zM15.91 5.17A4.68 4.68 0 0 0 17 1.84a4.83 4.83 0 0 0-3.17 1.63 4.55 4.55 0 0 0-1.14 3.22A4 4 0 0 0 15.91 5.17z"/>
                            </svg>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>Download on the</div>
                                <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-manrope, sans-serif)', lineHeight: 1 }}>App Store</div>
                            </div>
                        </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748B' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} style={{ color: '#10B981' }} /> DPDP & Data Privacy Compliant
                        </span>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Globe size={14} /> English (India)
                        </span>
                    </div>
                </div>

                {/* ── 3. BOTTOM BAR ── */}
                <div style={{ paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>
                        © 2026 BeBrilliant. All rights reserved.
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                        Designed & Developed with excellence by{' '}
                        <a
                            href="https://www.harisolutions.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#94A3B8', textDecoration: 'none', fontWeight: 700, transition: 'color 0.15s ease' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                        >
                            Hari Solutions
                        </a>
                    </div>
                </div>
            </div>

            {/* Responsive Breakpoints */}
            <style>{`
                @media (max-width: 1024px) {
                    .bb-footer-grid {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 36px !important;
                    }
                }
                @media (max-width: 640px) {
                    .bb-footer-grid {
                        grid-template-columns: 1fr !important;
                        gap: 32px !important;
                    }
                }
            `}</style>
        </footer>
    )
}
