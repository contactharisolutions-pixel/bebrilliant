'use client'

import Link from 'next/link'
import { Building, ShieldCheck, BarChart3, Users } from 'lucide-react'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="auth-layout" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
            <style>{`
                .glass-premium {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 24px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass-premium:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateY(-5px);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                }
                .mesh-bg {
                    position: absolute;
                    inset: 0;
                    background-color: #004B93;
                    background-image: 
                        radial-gradient(at 0% 0%, #004B93 0, transparent 50%), 
                        radial-gradient(at 50% 0%, #1FAC63 0, transparent 50%), 
                        radial-gradient(at 100% 0%, #00366A 0, transparent 50%), 
                        radial-gradient(at 0% 50%, #00366A 0, transparent 50%), 
                        radial-gradient(at 100% 100%, #1FAC63 0, transparent 50%), 
                        radial-gradient(at 0% 100%, #004B93 0, transparent 50%);
                    opacity: 0.95;
                }
                .floating {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @media (max-width: 768px) {
                    .branding-panel { display: none !important; }
                    .form-panel { padding: 24px !important; }
                }
            `}</style>

            {/* Left — Branding Panel */}
            <div style={{
                flex: 1.2,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px 80px',
                color: '#fff',
            }} className="branding-panel">
                <div className="mesh-bg" />
                
                {/* Decorative Blobs */}
                <div style={{ position: 'absolute', top: '10%', right: '-10%', width: 400, height: 400, background: '#1FAC63', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 400, height: 400, background: '#F0A026', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    {/* Logo */}
                    <div style={{ marginBottom: 40 }} className="fade-in-up">
                        <img 
                            src="https://bfzlkdurgggzytegvvrw.supabase.co/storage/v1/object/public/bebrilliant/Logo2.jpeg" 
                            alt="BeBrilliant Logo" 
                            style={{ 
                                height: 50, 
                                borderRadius: 12,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }} 
                        />
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(32px, 4vw, 56px)', 
                        fontWeight: 900, 
                        lineHeight: 1.1, 
                        marginBottom: 20,
                        letterSpacing: '-0.04em'
                    }} className="fade-in-up">
                        Modernizing<br />
                        <span style={{ color: '#F0A026' }}>Education Delivery</span>
                    </h1>
                    
                    <p style={{ 
                        fontSize: 18, 
                        opacity: 0.8, 
                        maxWidth: 480, 
                        lineHeight: 1.6, 
                        marginBottom: 48,
                        fontWeight: 500
                    }} className="fade-in-up fade-in-up-delay-1">
                        The ultimate high-fidelity ERP infrastructure for leading academic institutions worldwide.
                    </p>

                    {/* Feature Matrix */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: 20,
                        width: '100%' 
                    }} className="fade-in-up fade-in-up-delay-2">
                        {[
                            { icon: Building, title: 'Multi-Tenant ERP', desc: 'Secure institutional silos.', color: '#1FAC63' },
                            { icon: ShieldCheck, title: 'AI Proctored Exams', desc: 'Enterprise examination core.', color: '#F0A026' },
                            { icon: BarChart3, title: 'Live Analytics', desc: '360° student telemetry.', color: '#60A5FA' },
                            { icon: Users, title: 'Global CRM', desc: 'Admissions & lead logic.', color: '#A78BFA' }
                        ].map((f, i) => (
                            <div key={i} className="glass-premium">
                                <div style={{ 
                                    width: 42, height: 42, 
                                    borderRadius: 12, 
                                    background: `${f.color}20`, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 16,
                                    border: `1px solid ${f.color}40`
                                }}>
                                    <f.icon size={20} color={f.color} strokeWidth={2.5} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{f.title}</h3>
                                <p style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Visual Accent */}
                <div style={{ 
                    position: 'absolute', bottom: 40, left: 80, 
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 16px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', opacity: 0.7
                }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1FAC63', boxShadow: '0 0 10px #1FAC63' }} />
                    PHASE 2 DEPLOYED · GLOBAL NETWORK ACTIVE
                </div>
            </div>

            {/* Right — Form Panel */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                background: '#fff'
            }} className="form-panel">
                <div style={{ width: '100%', maxWidth: 440 }}>
                    <div style={{ marginBottom: 32 }} className="fade-in-up">
                        <h2 style={{ fontSize: 32, fontWeight: 900, color: '#111827', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h2>
                        {subtitle && <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>{subtitle}</p>}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
