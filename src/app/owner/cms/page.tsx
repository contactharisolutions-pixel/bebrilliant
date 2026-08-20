'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Palette, RefreshCw, Loader2, Plus, Search, Trash2, CheckCircle,
    XCircle, X, Eye, Check, Sparkles, Layers
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

type ThemePalette = {
    id: string
    name: string
    primary_color: string
    secondary_color: string
    background: string
    card_bg: string
    text_color: string
    accent_color: string
    border_color: string
    is_preset?: boolean
    created_at?: string
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000)
        return () => clearTimeout(t)
    }, [onClose])
    const isOk = type === 'success'
    return (
        <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
            background: isOk ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isOk ? P.success : P.error}40`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: isOk ? '#065F46' : '#991B1B', fontSize: 13, fontWeight: 800,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
        }}>
            {isOk ? <CheckCircle size={20} color={P.success} /> : <XCircle size={20} color={P.error} />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}><X size={14} /></button>
        </div>
    )
}

function ColorPickerInput({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input 
                    type="color" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    style={{ width: 44, height: 44, border: `1px solid ${P.border}`, borderRadius: 12, cursor: 'pointer', padding: 3, background: '#fff' }} 
                />
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    style={{ flex: 1, padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 800, color: P.dark, fontFamily: 'monospace', outline: 'none' }} 
                />
            </div>
        </div>
    )
}

export default function WebsiteThemeManagerPage() {
    const [palettes, setPalettes] = useState<ThemePalette[]>([])
    const [activeTheme, setActiveTheme] = useState<ThemePalette | null>(null)
    const [presetCount, setPresetCount] = useState(0)
    const [customCount, setCustomCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    // Filter states
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState<'all' | 'presets' | 'custom'>('all')

    // Modal & Drawer states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [previewPalette, setPreviewPalette] = useState<ThemePalette | null>(null)
    const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false)

    // New custom theme form state
    const [customForm, setCustomForm] = useState<Omit<ThemePalette, 'id'>>({
        name: '',
        primary_color: '#004B93',
        secondary_color: '#002D5B',
        background: '#F8FAFC',
        card_bg: '#FFFFFF',
        text_color: '#0F172A',
        accent_color: '#2563EB',
        border_color: '#E2E8F0'
    })

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    // Apply active theme variables to document DOM
    const applyThemeToDOM = (palette: ThemePalette) => {
        try {
            document.documentElement.style.setProperty('--owner-primary', palette.primary_color)
            document.documentElement.style.setProperty('--owner-secondary', palette.secondary_color)
            document.documentElement.style.setProperty('--owner-bg', palette.background)
            document.documentElement.style.setProperty('--owner-card', palette.card_bg)
            document.documentElement.style.setProperty('--owner-text', palette.text_color)
            document.documentElement.style.setProperty('--owner-accent', palette.accent_color)
            document.documentElement.style.setProperty('--owner-border', palette.border_color)

            localStorage.setItem('owner_active_theme', JSON.stringify(palette))
            window.dispatchEvent(new CustomEvent('owner-theme-changed', { detail: palette }))
        } catch (e) {
            console.error('Failed applying theme to DOM:', e)
        }
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/cms')
            const json = await res.json()
            if (res.ok) {
                setPalettes(json.palettes || [])
                setActiveTheme(json.activeTheme || null)
                setPresetCount(json.presetCount || 0)
                setCustomCount(json.customCount || 0)

                if (json.activeTheme) {
                    applyThemeToDOM(json.activeTheme)
                }
            }
        } catch (e) {
            console.error('Failed fetching CMS theme data:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleApplyTheme = async (palette: ThemePalette) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SET_ACTIVE_THEME', payload: palette })
            })
            if (res.ok) {
                setActiveTheme(palette)
                applyThemeToDOM(palette)
                showToast(`Applied theme "${palette.name}" to owner website & admin panel!`, 'success')
            } else {
                throw new Error('Failed to set active theme')
            }
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateCustomTheme = async () => {
        if (!customForm.name.trim()) return showToast('Please enter a theme palette name.', 'error')
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_PALETTE', payload: customForm })
            })
            if (res.ok) {
                showToast(`Custom theme "${customForm.name}" created successfully!`, 'success')
                setShowCreateModal(false)
                setCustomForm({
                    name: '',
                    primary_color: '#004B93',
                    secondary_color: '#002D5B',
                    background: '#F8FAFC',
                    card_bg: '#FFFFFF',
                    text_color: '#0F172A',
                    accent_color: '#2563EB',
                    border_color: '#E2E8F0'
                })
                fetchData()
            } else {
                throw new Error('Failed creating custom theme')
            }
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeletePalette = async (id: string, name: string) => {
        if (!confirm(`Delete custom theme "${name}"?`)) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_PALETTE', payload: { id } })
            })
            if (res.ok) {
                showToast(`Theme "${name}" deleted.`, 'success')
                fetchData()
            } else throw new Error('Delete theme failed')
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const filteredPalettes = palettes.filter(p => {
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.primary_color.toLowerCase().includes(search.toLowerCase())
        if (filterCategory === 'presets') return matchesSearch && p.is_preset
        if (filterCategory === 'custom') return matchesSearch && !p.is_preset
        return matchesSearch
    })

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand, boxShadow: `0 0 8px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Settings & Controls</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Website & Theme Manager</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>Customize color themes and visual branding for the owner website and admin panel.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Sync Themes
                    </button>
                    <button onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                        <Plus size={18} strokeWidth={3} /> Create Custom Theme
                    </button>
                </div>
            </div>

            {/* KPI METRICS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={Palette} title="Total Themes" value={String(palettes.length)} color={P.brand} />
                <KpiCard icon={CheckCircle} title="Active Theme" value={activeTheme?.name || 'Institutional Navy'} color="#059669" />
                <KpiCard icon={Sparkles} title="Custom Themes" value={String(customCount)} color="#7C3AED" />
                <KpiCard icon={Layers} title="Preset Templates" value={String(presetCount)} color="#EA580C" />
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 4 }}>
                    {(['all', 'presets', 'custom'] as const).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setFilterCategory(cat)} 
                            style={{ 
                                padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, textTransform: 'capitalize',
                                background: filterCategory === cat ? P.brand : 'transparent', 
                                color: filterCategory === cat ? '#fff' : P.muted, transition: 'all 0.2s' 
                            }}
                        >
                            {cat === 'all' ? 'All Theme Palettes' : cat === 'presets' ? 'Preset Templates' : 'Custom Themes'}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', width: 340 }}>
                    <Search size={16} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Search themes by name or color code..." 
                        style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: `1px solid ${P.border}`, borderRadius: 14, fontSize: 13, color: P.dark, background: '#fff', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }} 
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={14} color={P.muted} />
                        </button>
                    )}
                </div>
            </div>

            {/* THEME GRID WORKSPACE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
                {filteredPalettes.map(p => {
                    const isActive = activeTheme?.name === p.name || activeTheme?.id === p.id
                    return (
                        <div key={p.id} style={{
                            background: '#fff', border: `2px solid ${isActive ? P.brand : P.border}`, borderRadius: 24, overflow: 'hidden',
                            boxShadow: isActive ? `0 12px 32px ${P.brand}20` : '0 4px 20px rgba(0,0,0,0.02)',
                            transition: 'all 0.25s ease', position: 'relative'
                        }}>
                            {/* ACTIVE BADGE */}
                            {isActive && (
                                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: '#059669', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(5,150,105,0.4)' }}>
                                    <Check size={13} strokeWidth={3} /> ACTIVE THEME
                                </div>
                            )}

                            {/* COLOR SWATCH BANNER */}
                            <div style={{ height: 110, display: 'flex', width: '100%' }}>
                                <div style={{ flex: 2, background: p.primary_color }} />
                                <div style={{ flex: 1, background: p.secondary_color }} />
                                <div style={{ flex: 1, background: p.accent_color }} />
                                <div style={{ flex: 1, background: p.background, borderLeft: `1px solid ${P.border}` }} />
                            </div>

                            {/* CARD CONTENT */}
                            <div style={{ padding: '24px 28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 900, color: p.is_preset ? P.muted : '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                                            {p.is_preset ? 'Built-in Preset' : 'Custom Palette'}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark }}>{p.name}</h3>
                                    </div>
                                    {!p.is_preset && (
                                        <button onClick={() => handleDeletePalette(p.id, p.name)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Custom Theme">
                                            <Trash2 size={15} color="#DC2626" />
                                        </button>
                                    )}
                                </div>

                                {/* COLOR CHIPS LIST */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, background: P.bg, padding: '14px 18px', borderRadius: 16, border: `1px solid ${P.border}` }}>
                                    {[
                                        { l: 'Primary Brand', c: p.primary_color },
                                        { l: 'Accent Focus', c: p.accent_color },
                                        { l: 'Background', c: p.background },
                                        { l: 'Text Dark', c: p.text_color },
                                    ].map(item => (
                                        <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 11, color: P.muted, fontWeight: 700, textTransform: 'uppercase' }}>{item.l}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <code style={{ fontSize: 11, fontWeight: 800, color: P.dark, fontFamily: 'monospace' }}>{item.c}</code>
                                                <div style={{ width: 16, height: 16, borderRadius: 5, background: item.c, border: `1px solid ${P.border}` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ACTION BUTTONS */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button 
                                        onClick={() => handleApplyTheme(p)} 
                                        disabled={isActive || saving} 
                                        style={{ 
                                            flex: 2, padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 900, cursor: isActive ? 'default' : 'pointer',
                                            background: isActive ? '#059669' : P.brand, color: '#fff',
                                            opacity: isActive ? 0.9 : 1, transition: 'all 0.2s', boxShadow: isActive ? 'none' : `0 6px 16px ${P.brand}25`
                                        }}
                                    >
                                        {isActive ? 'Theme Active' : 'Apply Theme'}
                                    </button>
                                    <button 
                                        onClick={() => { setPreviewPalette(p); setPreviewDrawerOpen(true); }} 
                                        style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, color: P.dark, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        <Eye size={14} /> Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── CREATE CUSTOM THEME MODAL ── */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 580, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.25)', border: `1px solid ${P.border}` }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>Create Custom Theme</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Design a custom color palette for your owner dashboard and portal.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: '#fff', border: `1px solid ${P.border}`, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={P.muted} /></button>
                        </div>

                        <div style={{ padding: '24px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Theme Palette Name</label>
                                <input 
                                    type="text" 
                                    value={customForm.name} 
                                    onChange={e => setCustomForm({ ...customForm, name: e.target.value })} 
                                    placeholder="e.g. Royal Platinum, Cyber Gold" 
                                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} 
                                />
                            </div>

                            {/* Color Pickers Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <ColorPickerInput label="Primary Brand Color" value={customForm.primary_color} onChange={val => setCustomForm({ ...customForm, primary_color: val })} />
                                <ColorPickerInput label="Accent Focus Color" value={customForm.accent_color} onChange={val => setCustomForm({ ...customForm, accent_color: val })} />
                                <ColorPickerInput label="Secondary Dark" value={customForm.secondary_color} onChange={val => setCustomForm({ ...customForm, secondary_color: val })} />
                                <ColorPickerInput label="Background Base" value={customForm.background} onChange={val => setCustomForm({ ...customForm, background: val })} />
                                <ColorPickerInput label="Card Background" value={customForm.card_bg} onChange={val => setCustomForm({ ...customForm, card_bg: val })} />
                                <ColorPickerInput label="Text Dark Color" value={customForm.text_color} onChange={val => setCustomForm({ ...customForm, text_color: val })} />
                            </div>

                            {/* LIVE PREVIEW BOX */}
                            <div style={{ background: customForm.background, border: `2px solid ${customForm.border_color}`, borderRadius: 20, padding: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: customForm.text_color, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 }}>Live Component Preview</div>
                                <div style={{ background: customForm.card_bg, borderRadius: 14, padding: 16, border: `1px solid ${customForm.border_color}`, marginBottom: 12 }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: customForm.text_color }}>Sample Card Component</div>
                                    <div style={{ fontSize: 12, color: customForm.text_color, opacity: 0.7, marginTop: 4 }}>This is how your dashboard metrics will render.</div>
                                </div>
                                <button style={{ background: customForm.primary_color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 12, fontWeight: 900, cursor: 'default' }}>
                                    Sample Action Button
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '20px 32px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', border: `1px solid ${P.border}`, color: P.dark, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateCustomTheme} disabled={saving} style={{ padding: '12px 28px', borderRadius: 12, background: P.brand, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 6px 20px ${P.brand}30` }}>
                                {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />} Save Custom Theme
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PREVIEW PALETTE SIDE DRAWER ── */}
            <SideDrawer isOpen={previewDrawerOpen} onClose={() => setPreviewDrawerOpen(false)} title="Theme Palette Visual Test">
                {previewPalette && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '28px 32px' }}>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 950, color: P.dark }}>{previewPalette.name}</div>
                            <div style={{ fontSize: 13, color: P.muted, marginTop: 2 }}>Visual simulation of owner components with this color palette.</div>
                        </div>

                        <div style={{ background: previewPalette.background, border: `2px solid ${previewPalette.border_color}`, borderRadius: 24, padding: 24 }}>
                            {/* Card 1 */}
                            <div style={{ background: previewPalette.card_bg, borderRadius: 18, padding: 20, border: `1px solid ${previewPalette.border_color}`, marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: previewPalette.accent_color, textTransform: 'uppercase', marginBottom: 6 }}>Metric KPI Card</div>
                                <div style={{ fontSize: 24, fontWeight: 950, color: previewPalette.text_color }}>Rs. 2,45,000</div>
                                <div style={{ fontSize: 12, color: previewPalette.text_color, opacity: 0.7, marginTop: 4 }}>+18.4% growth from last month</div>
                            </div>

                            {/* Card 2 Buttons */}
                            <div style={{ background: previewPalette.card_bg, borderRadius: 18, padding: 20, border: `1px solid ${previewPalette.border_color}` }}>
                                <div style={{ fontSize: 14, fontWeight: 900, color: previewPalette.text_color, marginBottom: 12 }}>Interactive Control Elements</div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button style={{ background: previewPalette.primary_color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 900 }}>Primary Action</button>
                                    <button style={{ background: previewPalette.accent_color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 900 }}>Accent Button</button>
                                    <button style={{ background: previewPalette.background, color: previewPalette.text_color, border: `1px solid ${previewPalette.border_color}`, borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 800 }}>Outline Button</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                            <button onClick={() => setPreviewDrawerOpen(false)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Close Preview
                            </button>
                            <button onClick={() => { handleApplyTheme(previewPalette); setPreviewDrawerOpen(false); }} disabled={saving} style={{ flex: 2, padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                                Apply This Theme
                            </button>
                        </div>
                    </div>
                )}
            </SideDrawer>
        </div>
    )
}
