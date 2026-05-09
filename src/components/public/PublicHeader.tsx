'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X, User } from 'lucide-react'

const NAV = [
    { label: 'Features',   href: '/features' },
    { label: 'Technology', href: '/technology' },
    { label: 'Pricing',    href: '/pricing' },
    { label: 'FAQ',        href: '/faq' },
    { label: 'About',      href: '/about' },
    { label: 'Contact',    href: '/contact' },
]

export const PublicHeader = () => {
    const [open, setOpen]       = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 8)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const navBase: React.CSSProperties = {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: scrolled ? '1px solid #f0f0f0' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    }

    return (
        <header style={navBase}>
            {/* ── Desktop bar ── */}
            <div style={{ width: '100%', padding: '0 5%', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, boxSizing: 'border-box' }}>

                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
                    <img
                        src="/images/blinkopticals-logo.png"
                        alt="BlinkOpticals"
                        style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
                    />
                </Link>

                {/* Centre nav — hidden on mobile */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="bb-desktop-nav">
                    {NAV.map(({ label, href }) => (
                        <Link
                            key={href}
                            href={href}
                            style={{ padding: '6px 14px', fontSize: 13.5, fontWeight: 500, color: '#4b5563', textDecoration: 'none', borderRadius: 8, transition: 'background 0.15s, color 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = '#004B93' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#4b5563' }}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Sign in — hidden on mobile */}
                    <Link
                        href="/auth/login"
                        className="bb-sign-in"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#004B93'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#374151'}
                    >
                        <User size={15} /> Sign In
                    </Link>

                    {/* CTA */}
                    <Link
                        href="/request-demo"
                        className="bb-cta"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#004B93', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,75,147,0.22)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,75,147,0.28)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,75,147,0.22)' }}
                    >
                        Request Demo <ArrowRight size={13} />
                    </Link>

                    {/* Hamburger */}
                    <button
                        className="bb-hamburger"
                        onClick={() => setOpen(v => !v)}
                        style={{ display: 'none', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', color: '#374151' }}
                        aria-label="Menu"
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* ── Mobile drawer ── */}
            <div
                className="bb-mobile-nav"
                style={{
                    overflow: 'hidden',
                    maxHeight: open ? 600 : 0,
                    opacity: open ? 1 : 0,
                    transition: 'max-height 0.3s ease, opacity 0.2s ease',
                    borderTop: open ? '1px solid #f3f4f6' : 'none',
                    background: '#fff',
                }}
            >
                <div style={{ padding: '20px 5%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {NAV.map(({ label, href }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            style={{ padding: '12px 4px', fontSize: 15, fontWeight: 600, color: '#111827', textDecoration: 'none', borderBottom: '1px solid #f9fafb' }}
                        >
                            {label}
                        </Link>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20 }}>
                        <Link href="/auth/login" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 700, color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 12, textDecoration: 'none' }}>
                            Sign In
                        </Link>
                        <Link href="/request-demo" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 700, background: '#004B93', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                            Book a Free Demo
                        </Link>
                    </div>
                </div>
            </div>

            {/* Responsive overrides */}
            <style>{`
                @media (max-width: 900px) {
                    .bb-desktop-nav { display: none !important; }
                    .bb-sign-in     { display: none !important; }
                    .bb-hamburger   { display: flex !important; }
                }
                @media (min-width: 901px) {
                    .bb-mobile-nav  { display: none !important; }
                }
            `}</style>
        </header>
    )
}
