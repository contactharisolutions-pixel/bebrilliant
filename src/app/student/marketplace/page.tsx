'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, PlayCircle, Video, PlaySquare, Star, ArrowRight, HelpCircle, CheckCircle, Search, Tag, Sparkles, Filter, Globe } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { createClient } from '@/lib/supabase/client'
import CheckoutOverlay from '@/components/commerce/CheckoutOverlay'

// Updated Mock Data with Institutional Lexicon
const ASSETS = [
    { id: '1', title: 'AIEEE/JEE Predictive Mock Series', type: 'EXAM' as const, price: 4999, tenant: 'Allen Institute', thumb: 'P.brandBg', color: P.brand },
    { id: '2', title: 'Calculus Architecture: Mastery Core', type: 'PLAN' as const, price: 8999, tenant: 'Prof. Sarah', thumb: 'P.ctaBg', color: P.cta },
    { id: '3', title: 'Organic Chemistry Handbooks', type: 'EXAM' as const, price: 2999, tenant: 'PrepMaster Central', thumb: 'P.successBg', color: P.success },
]

const LIVE_STREAMS = [
    { id: '1', title: 'Thermodynamics Final Revision (Live)', time: 'Today, 16:00', duration: '90 Min', tutor: 'Prof. Jenkins' },
    { id: '2', title: 'Vector Space Crash Course', time: 'Tomorrow, 10:00', duration: '120 Min', tutor: 'Dr. Patel' },
]

const INTEL_BOUNTIES = [
    { id: '1', q: 'How to reliably calculate the angular momentum from this vector?', subject: 'Physics', bounty: '₹500', answers: 2 },
    { id: '2', q: 'Explain the mechanism of nucleophilic substitution (SN1 vs SN2).', subject: 'Chemistry', bounty: 'Free', answers: 1 },
]

export default function StudentMarketplace() {
    const [view, setView] = useState<'market' | 'doubts' | 'live'>('market')
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
                setUser({ ...user, ...profile })
            }
        }
        fetchUser()
    }, [])

    return (
        <div style={{ background: P.bg, minHeight: '100vh', paddingBottom: 60, fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                .view-tab { padding: 10px 24px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; border: none; display: flex; alignItems: center; gap: 10px; }
                .tab-active { background: #fff !important; color: ${P.brand} !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .asset-card:hover .asset-image { transform: scale(1.05); }
            `}</style>

            {selectedItem && user && (
                <CheckoutOverlay 
                    isOpen={!!selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                    item={selectedItem} 
                    user={{
                        id: user.id,
                        email: user.email,
                        name: user.full_name || user.email,
                        tenantId: user.tenant_id
                    }}
                />
            )}

            {/* HEADER / NAV */}
            <header style={{ background: P.card, borderBottom: `1px solid ${P.border}`, padding: '20px 40px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Globe size={20} color="#fff" />
                            </div>
                            <h1 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Course Marketplace</h1>
                        </div>
                        <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Discover and purchase top-tier study resources across the platform.</p>
                    </div>

                    <div style={{ display: 'flex', background: P.bg, padding: 6, borderRadius: 16, border: `1px solid ${P.border}` }}>
                        <button onClick={() => setView('market')} className={`view-tab ${view === 'market' ? 'tab-active' : ''}`} style={{ color: P.muted, background: 'transparent' }}>
                            <Sparkles size={16} /> Mock Exams
                        </button>
                        <button onClick={() => setView('live')} className={`view-tab ${view === 'live' ? 'tab-active' : ''}`} style={{ color: P.muted, background: 'transparent' }}>
                            <Video size={16} /> Live Masterclasses
                        </button>
                        <button onClick={() => setView('doubts')} className={`view-tab ${view === 'doubts' ? 'tab-active' : ''}`} style={{ color: P.muted, background: 'transparent' }}>
                            <HelpCircle size={16} /> Q&A Board
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1400, margin: '40px auto', padding: '0 40px' }}>
                
                {view === 'market' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                        {/* FEATURED BANNER */}
                        <div style={{ 
                            background: `linear-gradient(135deg, ${P.dark} 0%, #0A192F 100%)`, 
                            borderRadius: 32, padding: '80px 100px', position: 'relative', overflow: 'hidden',
                            boxShadow: `0 32px 80px -20px ${P.dark}80`, color: '#fff' 
                        }}>
                            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: P.brand, opacity: 0.15, filter: 'blur(100px)', borderRadius: '50%' }} />
                            <div style={{ position: 'relative', zIndex: 10, maxWidth: 650 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(255,255,255,0.1)' }}>Exclusive Access</div>
                                </div>
                                <h2 style={{ fontSize: 42, fontWeight: 950, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.04em' }}>Complete JEE <br/><span style={{ color: P.cta }}>Mock Series 2026</span></h2>
                                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.6, marginBottom: 40 }}>Boost your performance with 40+ adaptive mock exams and 14 masterclasses curated by top educators.</p>
                                <button style={{ background: '#fff', color: P.dark, border: 'none', padding: '16px 40px', borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                    Purchase Bundle
                                </button>
                            </div>
                        </div>

                        {/* GRID SECTION */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 900, color: P.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Tag size={20} color={P.brand} /> Available Items
                                </h3>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                        <input placeholder="Search catalog..." style={{ padding: '12px 16px 12px 42px', borderRadius: 14, border: `1px solid ${P.border}`, fontSize: 14, background: P.card, outline: 'none', width: 300 }} />
                                    </div>
                                    <button style={{ width: 44, height: 44, borderRadius: 14, border: `1px solid ${P.border}`, background: P.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Filter size={18} color={P.muted} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                                {ASSETS.map(asset => (
                                    <div key={asset.id} className="glass-card hover-lift asset-card" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 28, overflow: 'hidden' }}>
                                        <div style={{ height: 200, background: asset.id === '1' ? P.brandBg : asset.id === '2' ? P.ctaBg : P.successBg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 950, color: asset.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{asset.type}</div>
                                            {asset.type.includes('Stream') ? <PlayCircle size={48} color={asset.color} opacity={0.3} className="asset-image" style={{ transition: 'all 0.3s' }} /> : <Sparkles size={48} color={asset.color} opacity={0.3} className="asset-image" style={{ transition: 'all 0.3s' }} />}
                                        </div>
                                        <div style={{ padding: 28 }}>
                                            <h4 style={{ fontSize: 18, fontWeight: 850, color: P.dark, marginBottom: 8, lineHeight: 1.3 }}>{asset.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.muted, fontSize: 13, fontWeight: 700, marginBottom: 28 }}>
                                                <CheckCircle size={14} color={P.success} /> {asset.tenant}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
                                                <div style={{ fontSize: 24, fontWeight: 950, color: P.dark }}>₹{asset.price.toLocaleString('en-IN')}</div>
                                                <button onClick={() => setSelectedItem(asset)} style={{ background: P.dark, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    Buy Now <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'live' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <div style={{ background: P.errorBg, border: `1px solid ${P.error}20`, borderRadius: 24, padding: '32px 40px', display: 'flex', alignItems: 'center', gap: 24 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: P.error, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 24px ${P.error}40` }}>
                                <Video size={32} color="#fff" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 900, color: P.dark, margin: 0 }}>Live Video Infrastructure Online</h3>
                                <p style={{ fontSize: 15, color: P.text, margin: '6px 0 0', fontWeight: 600 }}>Tutors are currently conducting live, interactive video classes.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
                            {LIVE_STREAMS.map(stream => (
                                <div key={stream.id} className="glass-card hover-lift" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 32, padding: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <div style={{ background: P.infoBg, color: P.info, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Live Now</div>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: P.error }} />
                                    </div>
                                    <h4 style={{ fontSize: 22, fontWeight: 900, color: P.dark, marginBottom: 24 }}>{stream.title}</h4>
                                    <div style={{ display: 'flex', gap: 24, background: P.bg, padding: 20, borderRadius: 20, border: `1px solid ${P.border}`, marginBottom: 32 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>Faculty</div>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{stream.tutor}</div>
                                        </div>
                                        <div style={{ width: 1, background: P.border }} />
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>Start Time</div>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: P.brand }}>{stream.time}</div>
                                        </div>
                                    </div>
                                    <button style={{ width: '100%', padding: '16px', background: P.brand, color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}30` }}>
                                        Join Live Stream
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'doubts' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {INTEL_BOUNTIES.map(doubt => (
                                <div key={doubt.id} className="glass-card hover-lift" style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 32, padding: 32 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                        <div style={{ background: P.brandBg, color: P.brand, padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 950, textTransform: 'uppercase' }}>{doubt.subject}</div>
                                        <div style={{ background: P.successBg, color: P.success, border: `1px solid ${P.success}20`, padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 950 }}>Bounty: {doubt.bounty}</div>
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 800, color: P.dark, lineHeight: 1.5, marginBottom: 32 }}>"{doubt.q}"</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${P.border}`, paddingTop: 24 }}>
                                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 700 }}>{doubt.answers} Responses</div>
                                        <button style={{ background: 'transparent', border: 'none', color: P.brand, fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            View Solution <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ background: `linear-gradient(135deg, ${P.cta} 0%, #D97706 100%)`, borderRadius: 32, padding: 40, color: '#fff', boxShadow: `0 20px 40px ${P.cta}30` }}>
                                <HelpCircle size={48} color="#fff" style={{ marginBottom: 24, opacity: 0.8 }} />
                                <h3 style={{ fontSize: 24, fontWeight: 950, marginBottom: 12, letterSpacing: '-0.02em' }}>Have a Doubt?</h3>
                                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1.5, marginBottom: 32 }}>Post your doubt and our top educators or peers will answer it quickly.</p>
                                <button style={{ width: '100%', background: '#fff', color: P.cta, border: 'none', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                    Post Your Doubt
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    )
}
