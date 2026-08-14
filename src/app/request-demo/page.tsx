'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    User, Mail, Phone, Building, Briefcase, MessageSquare,
    Send, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Calendar, Clock
} from 'lucide-react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function RequestDemoPage() {
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        email: '',
        phone: '',
        organization: '',
        type: 'school',
        message: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    organization: formData.organization,
                    email: formData.email,
                    phone: formData.phone,
                    message: `[Designation: ${formData.designation}] [Type: ${formData.type}] ${formData.message}`
                })
            })
            if (res.ok) {
                setSubmitted(true)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to submit request')
            }
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-worksans, sans-serif)' }}>
            <PublicHeader />

            <main style={{ flex: 1 }}>

                {/* ── HERO SECTION ── */}
                <section style={{ position: 'relative', padding: '80px 5% 60px', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', color: '#FFFFFF', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', marginBottom: 20 }}>
                            <Sparkles size={14} /> Schedule Walkthrough · Live Demo
                        </div>

                        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 16 }}>
                            Book a Personalized Campus Demo
                        </h1>

                        <p style={{ fontSize: 16, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6, maxWidth: 680, margin: '0 auto' }}>
                            See how BeBrilliant automates exam paper generation, mobile OMR scanning, anti-cheat proctoring, and student rank analytics in under 20 minutes.
                        </p>
                    </div>
                </section>

                {/* ── FORM CONTAINER ── */}
                <section style={{ padding: '60px 5% 90px', background: '#F8FAFC' }}>
                    <div style={{ maxWidth: 740, margin: '0 auto' }}>

                        <div style={{ background: '#FFFFFF', borderRadius: 28, padding: '44px 40px', border: '1px solid #E2E8F0', boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.05)' }}>

                            {submitted ? (
                                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 12 }}>
                                        Demo Request Received!
                                    </h2>
                                    <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px' }}>
                                        Thank you, <strong style={{ color: '#0F172A' }}>{formData.name}</strong>. Our institutional specialist will reach out to schedule your live platform walkthrough.
                                    </p>
                                    <Link
                                        href="/"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            background: '#004B93',
                                            color: '#FFFFFF',
                                            padding: '14px 32px',
                                            borderRadius: 14,
                                            fontSize: 15,
                                            fontWeight: 800,
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Return Home <ArrowRight size={16} />
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Dr. Rajesh Sharma"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: 14,
                                                    border: '1.5px solid #E2E8F0',
                                                    fontSize: 14.5,
                                                    outline: 'none',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                                Designation *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Principal / Managing Director"
                                                value={formData.designation}
                                                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: 14,
                                                    border: '1.5px solid #E2E8F0',
                                                    fontSize: 14.5,
                                                    outline: 'none',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                                Work Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="name@institution.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: 14,
                                                    border: '1.5px solid #E2E8F0',
                                                    fontSize: 14.5,
                                                    outline: 'none',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                                Phone / WhatsApp Number *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="+91 98765 43210"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: 14,
                                                    border: '1.5px solid #E2E8F0',
                                                    fontSize: 14.5,
                                                    outline: 'none',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                                Institution Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Apex Coaching Classes"
                                                value={formData.organization}
                                                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: 14,
                                                    border: '1.5px solid #E2E8F0',
                                                    fontSize: 14.5,
                                                    outline: 'none',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                                Institution Type *
                                            </label>
                                            <select
                                                required
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: 14,
                                                    border: '1.5px solid #E2E8F0',
                                                    fontSize: 14.5,
                                                    outline: 'none',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    cursor: 'pointer',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                <option value="school">K-12 School / School Group</option>
                                                <option value="institute">Coaching Institute / Academy</option>
                                                <option value="teacher">Independent Educator / Tutor</option>
                                                <option value="enterprise">Enterprise Franchise Network</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                                            Institutional Needs / Message (Optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Tell us about student strength, target exams, or specific requirements..."
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '13px 16px',
                                                borderRadius: 14,
                                                border: '1.5px solid #E2E8F0',
                                                fontSize: 14.5,
                                                outline: 'none',
                                                background: '#F8FAFC',
                                                color: '#0F172A',
                                                resize: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    {error && (
                                        <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: 12 }}>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: 16,
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #004B93 0%, #1FAC63 100%)',
                                            color: '#FFFFFF',
                                            fontSize: 16,
                                            fontWeight: 800,
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            boxShadow: '0 8px 24px rgba(0, 75, 147, 0.25)',
                                            marginTop: 10
                                        }}
                                    >
                                        {submitting ? 'Submitting Request...' : (
                                            <>Schedule Walkthrough <ArrowRight size={18} /></>
                                        )}
                                    </button>

                                    <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                                        <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#10B981' }} />
                                        Secure 256-bit submission · Zero credit card required · Response in 24h
                                    </div>
                                </form>
                            )}

                        </div>

                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    )
}
