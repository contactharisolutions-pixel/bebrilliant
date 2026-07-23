'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X, User } from 'lucide-react'

const NAV = [
    { label: 'Features',     href: '/features' },
    { label: 'Technology',   href: '/technology' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Pricing',      href: '/pricing' },
    { label: 'FAQ',          href: '/faq' },
    { label: 'About',        href: '/about' },
    { label: 'Contact',      href: '/contact' },
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
                        src="https://bebrilliant.in/uploads/Logo2.jpeg"
                        alt="BeBrilliant"
                        style={{ height: 40, width: 'auto', borderRadius: 8, objectFit: 'contain', display: 'block' }}
                    />
                </Link>

                {/* Centre nav — hidden on mobile */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="bb-desktop-nav font-worksans">
                    {NAV.map(({ label, href }) => (
                        <Link
                            key={href}
                            href={href}
                            style={{ padding: '6px 14px', fontSize: 13.5, fontWeight: 600, color: '#191c20', textDecoration: 'none', borderRadius: 8, transition: 'background 0.15s, color 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3f3fa'; (e.currentTarget as HTMLElement).style.color = '#00356a' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#191c20' }}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="font-worksans">
                    {/* Sign in — hidden on mobile */}
                    <Link
                        href="/auth/login"
                        className="bb-sign-in"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#191c20', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00356a'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#191c20'}
                    >
                        <User size={15} /> Sign In
                    </Link>

                    {/* CTA */}
                    <Link
                        href="/request-demo"
                        className="bb-cta font-manrope"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #00356a 0%, #004b93 100%)', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,27,60,0.15)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,27,60,0.22)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,27,60,0.15)' }}
                    >
                        Request Demo <ArrowRight size={13} />
                    </Link>

                    {/* Hamburger */}
                    <button
                        className="bb-hamburger"
                        onClick={() => setOpen(v => !v)}
                        style={{ display: 'none', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', background: '#f3f3fa', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#191c20' }}
                        aria-label="Menu"
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* ── Mobile drawer ── */}
            <div
                className="bb-mobile-nav font-worksans"
                style={{
                    overflow: 'hidden',
                    maxHeight: open ? 600 : 0,
                    opacity: open ? 1 : 0,
                    transition: 'max-height 0.3s ease, opacity 0.2s ease',
                    borderTop: open ? '1px solid #ededf4' : 'none',
                    background: '#ffffff',
                }}
            >
                <div style={{ padding: '20px 5%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {NAV.map(({ label, href }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            style={{ padding: '12px 4px', fontSize: 15, fontWeight: 700, color: '#191c20', textDecoration: 'none', borderBottom: '1px solid #f3f3fa' }}
                        >
                            {label}
                        </Link>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20 }}>
                        <Link href="/auth/login" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 800, color: '#191c20', border: '1.5px solid #c2c6d2', borderRadius: 12, textDecoration: 'none' }}>
                            Sign In
                        </Link>
                        <Link href="/request-demo" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg, #00356a 0%, #004b93 100%)', color: '#ffffff', borderRadius: 12, textDecoration: 'none' }}>
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
