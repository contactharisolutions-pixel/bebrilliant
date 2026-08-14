'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-[#000]'
import { createPortal as reactCreatePortal } from 'react-dom'
import {
    X, User, Mail, Phone, Building, Briefcase, MessageSquare,
    ArrowRight, CheckCircle2, Sparkles, ShieldCheck
} from 'lucide-react'

interface BookDemoModalProps {
    isOpen: boolean
    onClose: () => void
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
    const [mounted, setMounted] = useState(false)
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

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleKeyDown)
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen || !mounted) return null

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

    const modalContent = (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '30px 16px',
                overflowY: 'auto',
                boxSizing: 'border-box'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 580,
                    maxHeight: 'calc(100vh - 60px)',
                    overflowY: 'auto',
                    margin: 'auto 0',
                    background: '#FFFFFF',
                    borderRadius: 24,
                    padding: '32px 28px',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
                    position: 'relative',
                    fontFamily: 'var(--font-worksans, sans-serif)',
                    border: '1px solid #E2E8F0',
                    boxSizing: 'border-box'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{
                        position: 'absolute',
                        top: 18,
                        right: 18,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#F1F5F9',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748B',
                        transition: 'all 0.15s ease',
                        zIndex: 10
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#E2E8F0'
                        e.currentTarget.style.color = '#0F172A'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#F1F5F9'
                        e.currentTarget.style.color = '#64748B'
                    }}
                >
                    <X size={18} />
                </button>

                {submitted ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 10 }}>
                            Demo Request Confirmed!
                        </h3>
                        <p style={{ fontSize: 14.5, color: '#64748B', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 28px' }}>
                            Thank you, <strong style={{ color: '#0F172A' }}>{formData.name}</strong>. Our institutional specialist will reach out to schedule your personalized walkthrough.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                background: '#004B93',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '12px 28px',
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 24, paddingRight: 20 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#004B93', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                <Sparkles size={12} /> Book Live Demo
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-manrope, sans-serif)', marginBottom: 4 }}>
                                Schedule a Campus Walkthrough
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                                See how BeBrilliant automates your examinations in under 20 minutes.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
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
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: 13.5,
                                            outline: 'none',
                                            background: '#F8FAFC',
                                            color: '#0F172A',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                                        Designation *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Principal / Director"
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: 13.5,
                                            outline: 'none',
                                            background: '#F8FAFC',
                                            color: '#0F172A',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                                        Work Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@school.edu.in"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: 13.5,
                                            outline: 'none',
                                            background: '#F8FAFC',
                                            color: '#0F172A',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: 13.5,
                                            outline: 'none',
                                            background: '#F8FAFC',
                                            color: '#0F172A',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                                        School / Institute Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Apex Academy"
                                        value={formData.organization}
                                        onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: 13.5,
                                            outline: 'none',
                                            background: '#F8FAFC',
                                            color: '#0F172A',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                                        Institution Category *
                                    </label>
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: 13.5,
                                            outline: 'none',
                                            background: '#F8FAFC',
                                            color: '#0F172A',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="school">School / School Group</option>
                                        <option value="institute">Coaching Institute / Academy</option>
                                        <option value="teacher">Independent Educator / Tutor</option>
                                        <option value="enterprise">Enterprise Franchise Chain</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, background: '#FEF2F2', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: 8 }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #004B93 0%, #1FAC63 100%)',
                                    color: '#FFFFFF',
                                    fontSize: 14.5,
                                    fontWeight: 800,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    boxShadow: '0 6px 18px rgba(0, 75, 147, 0.25)',
                                    marginTop: 4
                                }}
                            >
                                {submitting ? 'Submitting Request...' : (
                                    <>Schedule Walkthrough <ArrowRight size={16} /></>
                                )}
                            </button>

                            <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#10B981' }} />
                                Secure submission · Response within 24 hours
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    )

    return reactCreatePortal(modalContent, document.body)
}
