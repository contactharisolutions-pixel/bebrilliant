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

            <div style={{ width: '100%', padding: '0 5%', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>

                {/* ── Main grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, padding: '72px 0 56px' }}>

                    {/* Brand column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {/* Logo */}
                        <Link href="/" style={{ display: 'inline-flex', marginBottom: 24 }}>
                            <div style={{ background: '#fff', borderRadius: 12, padding: '8px 14px', display: 'inline-flex' }}>
                                <img
                                    src="/images/blinkopticals-logo.png"
                                    alt="BlinkOpticals"
                                    style={{ height: 32, width: 'auto', objectFit: 'contain', display: 'block' }}
                                />
                            </div>
                        </Link>

                        {/* Tagline */}
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28, maxWidth: 280 }}>
                            India's most trusted cloud ERP for optical stores and clinics. Manage inventory, prescriptions, and sales with ease.
                        </p>

                        {/* Contact details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                            {[
                                { Icon: Mail,   text: 'support@blinkopticals.com',  href: 'mailto:support@blinkopticals.com' },
                                { Icon: Phone,  text: '+91 98751 59220',         href: 'tel:+919875159220' },
                                { Icon: MapPin, text: 'BlinkOpticals Hub, Mumbai, India', href: null },
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
                        © 2026 BlinkOpticals. All rights reserved.{' '}
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
