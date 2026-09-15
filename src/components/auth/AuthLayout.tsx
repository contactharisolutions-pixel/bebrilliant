'use client'

import Link from 'next/link'
import { Building2, Sparkles, BarChart3, ShieldCheck, CheckCircle2, Globe2 } from 'lucide-react'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    tenantName?: string
    tenantSubdomain?: string
}

export function AuthLayout({ children, title, subtitle, tenantName, tenantSubdomain }: AuthLayoutProps) {
    return (
        <div className="auth-layout" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
            <style>{`
                .edu-bg {
                    position: absolute;
                    inset: 0;
                    background-image: linear-gradient(145deg, rgba(8, 22, 44, 0.90) 0%, rgba(10, 37, 64, 0.82) 45%, rgba(4, 40, 30, 0.78) 100%), url('/images/auth_education_campus.jpg');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }
                .glass-card-editorial {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 18px;
                    padding: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass-card-editorial:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.22);
                    transform: translateY(-3px);
                    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
                }
                @media (max-width: 900px) {
                    .branding-panel { display: none !important; }
                    .form-panel { padding: 24px 16px !important; }
                }
            `}</style>

            {/* Left — Visual Branding Panel */}
            <div
                style={{
                    flex: 1.25,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '60px 70px',
                    color: '#fff',
                }}
                className="branding-panel"
            >
                <div className="edu-bg" />

                {/* Ambient Soft Glows */}
                <div style={{ position: 'absolute', top: '5%', right: '-5%', width: 380, height: 380, background: '#004B93', filter: 'blur(160px)', opacity: 0.3, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 380, height: 380, background: '#1FAC63', filter: 'blur(160px)', opacity: 0.25, borderRadius: '50%' }} />

                {/* Top Branding Section */}
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255, 255, 255, 0.95)', padding: '8px 18px', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                                <img
                                    src="https://bebrilliant.in/uploads/Logo2.jpeg"
                                    alt="BeBrilliant Logo"
                                    style={{ height: 36, objectFit: 'contain' }}
                                />
                            </div>
                        </Link>

                        {tenantName ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(31, 172, 99, 0.15)', border: '1px solid rgba(31, 172, 99, 0.35)', fontSize: 12, fontWeight: 700, color: '#34D399' }}>
                                <Globe2 size={13} />
                                {tenantSubdomain ? `${tenantSubdomain}.bebrilliant.in` : 'Sovereign Portal'}
                            </div>
                        ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#E2E8F0' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1FAC63', boxShadow: '0 0 8px #1FAC63' }} />
                                SOVEREIGN CAMPUS NETWORK
                            </div>
                        )}
                    </div>

                    <div style={{ maxWidth: 540 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 8, background: 'rgba(240, 160, 38, 0.15)', border: '1px solid rgba(240, 160, 38, 0.3)', color: '#FBBF24', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                            <Sparkles size={13} /> Institutional Excellence Ecosystem
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(28px, 3.2vw, 44px)',
                            fontWeight: 900,
                            lineHeight: 1.15,
                            letterSpacing: '-0.03em',
                            marginBottom: 16,
                            color: '#FFFFFF'
                        }}>
                            {tenantName ? (
                                <>Welcome to <span style={{ color: '#6EE7B7' }}>{tenantName}</span></>
                            ) : (
                                <>Architecting <span style={{ color: '#6EE7B7' }}>Academic Precision</span> & Institutional Scale.</>
                            )}
                        </h1>

                        <p style={{
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: 'rgba(255, 255, 255, 0.82)',
                            fontWeight: 500,
                            marginBottom: 32
                        }}>
                            {tenantName
                                ? `Access your official school examinations, OMR evaluations, teacher curriculums, and real-time student performance analytics.`
                                : `India's premier AI-powered examination infrastructure, sub-second OMR evaluation, and sovereign multi-tenant school governance.`
                            }
                        </p>
                    </div>

                    {/* 4 Feature Highlights Matrix */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16,
                        maxWidth: 560
                    }}>
                        {[
                            {
                                icon: Building2,
                                title: 'Sovereign Subdomains',
                                desc: 'Independent branded portals for each institution.',
                                accent: '#38BDF8'
                            },
                            {
                                icon: Sparkles,
                                title: 'Sub-Second OMR & AI',
                                desc: 'High-speed automated grading with 99.9% precision.',
                                accent: '#34D399'
                            },
                            {
                                icon: BarChart3,
                                title: 'Curriculum & Reports',
                                desc: 'Instant student scorecards and board analytics.',
                                accent: '#FBBF24'
                            },
                            {
                                icon: ShieldCheck,
                                title: 'DPDP Data Governance',
                                accent: '#A78BFA',
                                desc: 'Bank-grade role isolation & tamper-proof integrity.'
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="glass-card-editorial">
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: `${item.accent}20`,
                                    border: `1px solid ${item.accent}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12
                                }}>
                                    <item.icon size={18} color={item.accent} strokeWidth={2.2} />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                                    {item.title}
                                </div>
                                <div style={{ fontSize: 12, lineHeight: 1.4, color: 'rgba(255, 255, 255, 0.72)', fontWeight: 500 }}>
                                    {item.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Trust & Compliance Bar */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    paddingTop: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontWeight: 600
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} color="#34D399" />
                        <span>99.98% High Availability SLA</span>
                    </div>
                    <span>DPDP Compliant Tenancy</span>
                    <span>256-Bit SHA-2 Encryption</span>
                </div>
            </div>

            {/* Right — Form Panel */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 36px',
                    background: '#FFFFFF',
                    position: 'relative'
                }}
                className="form-panel"
            >
                <div style={{ width: '100%', maxWidth: 480 }}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.025em' }}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
