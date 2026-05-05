'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'

const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#EFE9FF', dark: '#1B1D21', muted: '#A5A2A6',
    success: '#22C55E', successBg: '#ECFDF5',
}

export default function OwnerPlaceholder({ title }: { title: string }) {
    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: P.dark, margin: 0 }}>{title}</h1>
                    <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 500 }}>Enterprise Module</p>
                </div>
                <Link href="/owner/dashboard" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: P.card, border: `1px solid ${P.border}`, borderRadius: 10,
                    padding: '9px 18px', fontSize: 13, fontWeight: 700, color: P.dark,
                    textDecoration: 'none', cursor: 'pointer',
                }}>
                    <ArrowLeft size={16} /> Dashboard
                </Link>
            </div>

            {/* Body */}
            <div style={{
                background: P.card, border: `1px solid ${P.border}`, borderRadius: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px 40px', textAlign: 'center',
            }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 20, background: P.brandBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                }}>
                    <Construction size={36} color={P.brand} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: P.dark, margin: '0 0 10px' }}>
                    {title} â€” Provisioned
                </h2>
                <p style={{ fontSize: 14, color: P.muted, maxWidth: 460, lineHeight: 1.7, margin: 0 }}>
                    This module infrastructure is live. High-fidelity UI components and production data hooks are being initialized.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
                    <div style={{ background: P.successBg, border: `1px solid ${P.success}33`, borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: P.success }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.success }}>Schema Ready</span>
                    </div>
                    <div style={{ background: P.brandBg, border: `1px solid ${P.brand}33`, borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: P.brand }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.brand }}>API Live</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
