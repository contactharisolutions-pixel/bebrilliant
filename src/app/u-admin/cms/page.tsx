'use client'

import { useState } from 'react'
import { LayoutTemplate, Eye, MousePointer2, Plus, GripVertical, Settings, Globe, CheckCircle2, ChevronRight, Palette } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

// Dummy Data mapped to `cms_sections` JSON architecture
const MOCK_SECTIONS = [
    { id: '1', type: 'Hero', isVisible: true, content: 'Prepare for JEE with our Adaptive Testing Platform.' },
    { id: '2', type: 'Features', isVisible: true, content: 'Proctored Exams, Analytics, AI Mentor...' },
    { id: '3', type: 'Testimonials', isVisible: false, content: 'Hear from our top ranking students' },
]

export default function TenantCMSBuilder() {
    const [sections, setSections] = useState(MOCK_SECTIONS)
    const [brandColor, setBrandColor] = useState(P.brand)

    const toggleVisibility = (id: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    }

    return (
        <div style={{ minHeight: '100%', background: P.bg, padding: '40px 48px' }}>
            <style>{GLASS_STYLES + `input:focus, select:focus { outline: none; border-color: ${P.brand} !important; border-width: 2px !important; }`}</style>

            <div style={{ maxWidth: 1200, margin: '0 auto' }} className="fade-in">
                
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institute Ops</div>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Public Website Manager</div>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>Public Website Manager</h1>
                        <p style={{ margin: '8px 0 0', fontSize: 15, color: P.muted, fontWeight: 600 }}>
                            Configure your institutional topology and aesthetic identity globally.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 14 }}>
                        <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '12px 24px', fontSize: 14, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                            <Eye size={18} color={P.brand} /> Live Preview
                        </button>
                        <button className="hover-lift" style={{ background: P.brand, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 14, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30`, cursor: 'pointer' }}>
                            <CheckCircle2 size={18} strokeWidth={3} /> Publish Topology
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>

                    {/* Visual Topology Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${P.border}`, paddingBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark }}>Global Visual Topology</h3>
                            <div style={{ fontSize: 12, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Root Interface / Landing</div>
                        </div>

                        {sections.map((section, idx) => (
                            <div key={section.id} className={`glass-card hover-lift`} style={{ 
                                padding: 24, borderRadius: 24, border: `1px solid ${P.border}`, 
                                display: 'flex', alignItems: 'center', gap: 20, 
                                opacity: section.isVisible ? 1 : 0.6,
                                background: section.isVisible ? P.card : '#F9FAFB'
                            }}>
                                <div style={{ cursor: 'grab', color: P.muted }}><GripVertical size={20} /></div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                        <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: P.brand }}>{section.type} Block</div>
                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                                        <div style={{ fontSize: 11, fontWeight: 700, color: P.muted }}>Sequence 0{idx + 1}</div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: P.dark, lineHeight: 1.4 }}>{section.content}</p>
                                </div>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button style={{ background: P.bg, border: 'none', padding: 10, borderRadius: 12, cursor: 'pointer', color: P.text }}>
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => toggleVisibility(section.id)}
                                        style={{ 
                                            background: section.isVisible ? P.successBg : P.errorBg, 
                                            border: 'none', padding: 10, borderRadius: 12, cursor: 'pointer', 
                                            color: section.isVisible ? P.success : P.error 
                                        }}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button className="hover-lift" style={{ 
                            width: '100%', border: `2px dashed ${P.border}`, borderRadius: 24, background: 'transparent',
                            padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                            fontSize: 15, fontWeight: 850, color: P.muted, cursor: 'pointer', marginTop: 12
                        }}>
                            <Plus size={20} strokeWidth={3} color={P.brand} /> Inject Topology Component
                        </button>
                    </div>

                    {/* Theme Config Drawer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                        <div className="glass-card" style={{ padding: 32, borderRadius: 32, border: `1px solid ${P.border}`, boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Palette size={20} color={P.brand} /> Aesthetic Engine
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Dominant Palette</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 12, overflow: 'hidden', border: `2px solid ${P.border}` }}>
                                            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ position: 'absolute', top: -10, left: -10, width: 64, height: 64, cursor: 'pointer', border: 'none' }} />
                                        </div>
                                        <input type="text" value={brandColor.toUpperCase()} readOnly style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: P.dark }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Secondary Accent</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: P.cta, border: `2px solid ${P.border}` }} />
                                        <input type="text" value={P.cta} readOnly style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: P.dark }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Standard Typography</label>
                                    <select style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg, fontSize: 14, fontWeight: 750, color: P.dark }}>
                                        <option>Institutional Default (Inter)</option>
                                        <option>Modern Geometric (Outfit)</option>
                                        <option>High-Contrast (Roboto)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: 32, borderRadius: 32, border: `1px solid ${P.border}`, background: P.dark }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Globe size={18} color={P.brand} /> Domain Configuration
                            </h3>
                            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#A5A2A6', lineHeight: 1.5 }}>
                                Map institutional DNS CNAME records to <code style={{ color: P.brand, fontWeight: 900 }}>cname.brilliantboard.com</code> for custom deployment.
                            </p>
                            <input type="text" placeholder="e.g. academy.tenant.com" style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: 'none', background: '#25282C', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }} />
                            <button className="hover-lift" style={{ width: '100%', background: P.brand, color: '#fff', border: 'none', padding: '14px', borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                                Verify Configuration
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
