'use client'

import Link from 'next/link'
import {
    Building2, Sparkles, BarChart3, ShieldCheck, CheckCircle2, Globe2,
    GraduationCap, BookOpen, Award, BrainCircuit, Atom, Compass, Calculator,
    Pencil, Scroll, Bookmark, FileText, Lightbulb, Library, FlaskConical,
    Shapes, Percent, Trophy, Clock, Binary
} from 'lucide-react'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    tenantName?: string
    tenantSubdomain?: string
}

// Randomly scattered educational watermark icons to beautify the form background
const EDU_WATERMARK_ICONS = [
    { Icon: GraduationCap, top: '3%', left: '5%', size: 42, rotate: -15, opacity: 0.08, color: '#004B93' },
    { Icon: Atom, top: '6%', right: '7%', size: 46, rotate: 20, opacity: 0.09, color: '#1FAC63' },
    { Icon: BookOpen, top: '15%', right: '20%', size: 36, rotate: -10, opacity: 0.07, color: '#4F46E5' },
    { Icon: BrainCircuit, top: '22%', left: '3%', size: 50, rotate: 12, opacity: 0.08, color: '#004B93' },
    { Icon: Award, top: '32%', right: '5%', size: 40, rotate: -18, opacity: 0.09, color: '#F59E0B' },
    { Icon: Calculator, top: '40%', left: '6%', size: 38, rotate: 8, opacity: 0.07, color: '#475569' },
    { Icon: FlaskConical, top: '49%', right: '6%', size: 44, rotate: -22, opacity: 0.08, color: '#10B981' },
    { Icon: Compass, top: '60%', left: '4%', size: 46, rotate: 28, opacity: 0.08, color: '#0284C7' },
    { Icon: Scroll, top: '69%', right: '10%', size: 38, rotate: -14, opacity: 0.08, color: '#7C3AED' },
    { Icon: Lightbulb, top: '80%', left: '6%', size: 42, rotate: 16, opacity: 0.09, color: '#F59E0B' },
    { Icon: Library, top: '89%', right: '6%', size: 46, rotate: -8, opacity: 0.08, color: '#004B93' },
    { Icon: Pencil, top: '11%', left: '36%', size: 30, rotate: 45, opacity: 0.06, color: '#64748B' },
    { Icon: Shapes, top: '86%', left: '34%', size: 36, rotate: -15, opacity: 0.07, color: '#0EA5E9' },
    { Icon: Sparkles, top: '56%', right: '22%', size: 34, rotate: 15, opacity: 0.09, color: '#F59E0B' },
    { Icon: FileText, top: '28%', right: '26%', size: 36, rotate: -12, opacity: 0.07, color: '#004B93' },
    { Icon: Bookmark, top: '2%', left: '44%', size: 30, rotate: -6, opacity: 0.07, color: '#10B981' },
    { Icon: Trophy, top: '74%', left: '24%', size: 38, rotate: 14, opacity: 0.08, color: '#D97706' },
    { Icon: Binary, top: '42%', right: '32%', size: 34, rotate: -5, opacity: 0.06, color: '#059669' },
    { Icon: Percent, top: '63%', right: '34%', size: 32, rotate: 18, opacity: 0.06, color: '#2563EB' },
    { Icon: Clock, top: '93%', left: '56%', size: 32, rotate: -12, opacity: 0.06, color: '#64748B' },
]

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
                    .form-panel { padding: 32px 20px !important; }
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
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
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
                            marginBottom: 20
                        }}>
                            {tenantName ? (
                                <>
                                    Welcome to <span style={{ color: '#34D399' }}>{tenantName}</span>
                                </>
                            ) : (
                                <>
                                    Architecting <span style={{ color: '#FFFFFF' }}>Academic</span>{' '}
                                    <span style={{ color: '#34D399' }}>Precision</span> & Institutional Scale.
                                </>
                            )}
                        </h1>

                        <p style={{
                            fontSize: 'clamp(14px, 1.2vw, 16px)',
                            color: 'rgba(255, 255, 255, 0.82)',
                            lineHeight: 1.6,
                            fontWeight: 400
                        }}>
                            {tenantName
                                ? 'Access your official school examinations, OMR evaluations, teacher curriculums, and real-time student performance analytics.'
                                : "India's premier AI-powered examination infrastructure, sub-second OMR evaluation, and sovereign multi-tenant school governance."}
                        </p>
                    </div>
                </div>

                {/* Capability Matrix Cards */}
                <div style={{ position: 'relative', zIndex: 10, margin: '32px 0 24px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
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

            {/* Right — Form Panel with Random Education Icons Watermark & Top Logo */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 36px',
                    background: '#F8FAFC',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                className="form-panel"
            >
                {/* Background Pattern: Delicate Academic Grid */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }}
                />

                {/* Ambient Soft Glows */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 340, height: 340, background: 'rgba(0, 75, 147, 0.05)', filter: 'blur(110px)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 340, height: 340, background: 'rgba(31, 172, 99, 0.05)', filter: 'blur(110px)', borderRadius: '50%', pointerEvents: 'none' }} />

                {/* Random Education Icons Watermark Pattern */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    {EDU_WATERMARK_ICONS.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                top: item.top,
                                left: item.left,
                                right: item.right,
                                transform: `rotate(${item.rotate}deg)`,
                                opacity: item.opacity,
                                color: item.color,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <item.Icon size={item.size} strokeWidth={1.8} />
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 10 }}>
                    {/* Top Logo */}
                    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '6px 14px',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                <img
                                    src="https://bebrilliant.in/uploads/Logo2.jpeg"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
                                    alt="BeBrilliant Logo"
                                    style={{
                                        height: 38,
                                        width: 'auto',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        </Link>

                        {tenantSubdomain ? (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 100,
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#065F46'
                            }}>
                                <Globe2 size={12} className="text-emerald-600" />
                                {tenantSubdomain}.bebrilliant.in
                            </span>
                        ) : (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 12px',
                                borderRadius: 100,
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#475569'
                            }}>
                                Institutional Portal
                            </span>
                        )}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.025em' }}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500, lineHeight: 1.5 }}>
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
