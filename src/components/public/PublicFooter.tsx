'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Globe, Twitter, Linkedin, Youtube } from 'lucide-react'

const COLS = [
    {
        title: 'Platform',
        links: [
            { label: 'Features',     href: '/features' },
            { label: 'Technology',   href: '/technology' },
            { label: 'Case Studies', href: '/case-studies' },
            { label: 'Pricing',      href: '/pricing' },
            { label: 'Request Demo', href: '/request-demo' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About Us',    href: '/about' },
            { label: 'Contact Us',  href: '/contact' },
            { label: 'FAQ',         href: '/faq' },
            { label: 'Careers',     href: '/contact' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy Policy',     href: '/privacy' },
            { label: 'Terms & Conditions', href: '/terms' },
            { label: 'Refund Policy',      href: '/refund' },
        ],
    },
]

export const PublicFooter = () => {
    return (
        <footer style={{ background: '#04122A', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            {/* Subtle gradient mesh */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% 0%,rgba(31,172,99,0.07),transparent),radial-gradient(ellipse 50% 60% at 10% 100%,rgba(0,75,147,0.1),transparent)', pointerEvents: 'none' }} />
            {/* Top separator line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />

            <div style={{ width: '100%', padding: '0 5%', position: 'relative', zIndex: 1, boxSizing: 'border-box' }} className="font-worksans">

                {/* ── Main grid ── */}
                <div className="bb-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, padding: '56px 0 48px' }}>

                    {/* Brand column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {/* Logo */}
                        <Link href="/" style={{ display: 'inline-flex', marginBottom: 24 }}>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '8px 14px', display: 'inline-flex' }}>
                                <img
                                    src="/logo.png"
                                    alt="BeBrilliant"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
                                    style={{ height: 36, width: 'auto', borderRadius: 6, objectFit: 'contain', display: 'block' }}
                                />
                            </div>
                        </Link>

                        {/* Tagline */}
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28, maxWidth: 280 }}>
                            India's most trusted multi-role platform — smart exams, WhatsApp growth, real-time analytics, and secure fee collection in one place.
                        </p>

                        {/* Contact details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                            {[
                                { Icon: Mail,   text: 'support@bebrilliant.in',  href: 'mailto:support@bebrilliant.in' },
                                { Icon: Phone,  text: '+91 98751 59220',         href: 'tel:+919875159220' },
                                { Icon: MapPin, text: 'BeBrilliant Hub, Mumbai, India', href: null },
                            ].map(({ Icon, text, href }) => {
                                const content = (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <Icon size={14} style={{ color: '#1FAC63', flexShrink: 0, marginTop: 2 }} />
                                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{text}</span>
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
                                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'background 0.2s, color 0.2s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)' }}
                                >
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>

                        {/* App Download Badges */}
                        <div style={{ marginTop: 32 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 16 }}>
                                Available App On
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                {/* Play Store */}
                                <a
                                    href="#"
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', textDecoration: 'none', transition: 'all 0.2s', width: 'fit-content' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = '#1FAC63'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                        <path d="M5.1 3.4c-.3.3-.4.9-.4 1.6v14c0 .7.1 1.3.4 1.6l.1.1 7.7-7.7v-.2L5.2 3.3l-.1.1z" fill="#00FFF0"/>
                                        <path d="M15.5 15.6l-2.6-2.6v-.1l2.6-2.6.1.1 3.1 1.8c.9.5.9 1.3 0 1.8l-3.1 1.8c0 0-.1 0-.1-.2z" fill="#FFB900"/>
                                        <path d="M13 12.9l-7.8-7.8c.3-.3.8-.3 1.4 0l8.9 5.1L13 12.9z" fill="#FF007F"/>
                                        <path d="M13 13.1l2.5 2.5-8.9 5.1c-.6.3-1.1.3-1.4 0l7.8-7.6z" fill="#00E060"/>
                                    </svg>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>GET IT ON</div>
                                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-manrope, sans-serif)', lineHeight: 1 }}>Google Play</div>
                                    </div>
                                </a>

                                {/* App Store */}
                                <a
                                    href="#"
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', textDecoration: 'none', transition: 'all 0.2s', width: 'fit-content' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = '#0070c9'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style={{ flexShrink: 0, color: '#fff' }}>
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.5-1.34 0-1.77-.82-3.3-.82s-2 .8-3.3 0c-1.34-.05-2.29-1.33-3.09-2.52-1.72-2.46-3-7.21-1.22-10.29.9-1.55 2.5-2.53 4.25-2.56 1.33 0 2.58.92 3.4 1 1-.08 2.5-1 4.12-1a4.91 4.91 0 0 1 3.88 2 4.83 4.83 0 0 0-2.31 4.17c0 3.3 2.69 4.47 2.72 4.49a10.82 10.82 0 0 1-2.3 4.53zM15.91 5.17A4.68 4.68 0 0 0 17 1.84a4.83 4.83 0 0 0-3.17 1.63 4.55 4.55 0 0 0-1.14 3.22A4 4 0 0 0 15.91 5.17z"/>
                                    </svg>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Download on the</div>
                                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-manrope, sans-serif)', lineHeight: 1 }}>App Store</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Nav columns */}
                    {COLS.map(({ title, links }) => (
                        <div key={title}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>
                                {title}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {links.map(({ label, href }) => (
                                    <li key={label}>
                                        <Link
                                            href={href}
                                            style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.48)', textDecoration: 'none', transition: 'color 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.48)'}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── Bottom bar ── */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
                        © 2026 BeBrilliant. All rights reserved.{' '}
                        <span style={{ color: 'rgba(255,255,255,0.12)' }}>· Designed & Developed by Hari Solutions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
                        <Globe size={12} /> English (India)
                    </div>
                </div>
            </div>

            {/* Responsive: stack on mobile */}
            <style>{`
                @media (max-width: 860px) {
                    .bb-footer-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }
                @media (max-width: 520px) {
                    .bb-footer-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </footer>
    )
}
