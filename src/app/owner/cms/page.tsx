'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    FileText, Palette, Building2, Users, RefreshCw, Loader2,
    Plus, Search, Edit3, Trash2, Globe, Mail, LayoutTemplate, Zap,
    CheckCircle, XCircle, ArrowUp, ArrowDown, X, Eye, ShieldAlert, Settings, Info, Save
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'
import { DataTable } from '@/components/owner/DataTable'
import { SideDrawer } from '@/components/owner/SideDrawer'

// ── TYPES ───────────────────────────────────────────────────
type CmsPage = {
    page_id: string
    page_name: string
    slug: string
    active_status: boolean
    meta_title?: string
    meta_description?: string
    keywords?: string
    created_at: string
}
type ThemePalette = {
    id: string
    name: string
    primary_color: string
    secondary_color: string
    background: string
    text_color: string
    created_at: string
}
type Branding = {
    tenant_id: string
    brand_name: string
    email_sender: string
    custom_domain: string
    logo: string
    created_at: string
    tenants: { name: string; type: string; is_active: boolean }
}
type ApiData = {
    pages: CmsPage[]
    palettes: ThemePalette[]
    branding: Branding[]
}

// Custom Modal Wrapper
function CustomModal({ title, onClose, children, onSubmit, saving, saveText = 'Save' }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 20, 40, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: 20 }}>
            <div className="glass-card" style={{ background: P.card, borderRadius: 28, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.3)', border: `1px solid ${P.border}` }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#fff', border: '1px solid ' + P.border, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={P.muted} /></button>
                </div>
                <div style={{ padding: '24px 32px' }}>{children}</div>
                <div style={{ padding: '20px 32px', background: P.bg, borderTop: '1px solid ' + P.border, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid ' + P.border, color: P.dark, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: P.brand, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 20px ${P.brand}30` }}>
                        {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}

function CustomInput({ label, value, onChange, placeholder = '', type = 'text', readOnly = false }: any) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <input type={type} readOnly={readOnly} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} 
                style={{ width: '100%', padding: type === 'color' ? '4px 8px' : '12px 16px', border: '1px solid ' + P.border, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', boxSizing: 'border-box', height: type === 'color' ? 48 : 'auto', cursor: type === 'color' ? 'pointer' : 'text', background: readOnly ? P.hover : '#fff', fontWeight: 600 }} />
        </div>
    )
}

export default function CMSPage() {
    const [activeTab, setActiveTab] = useState<'pages' | 'palettes' | 'branding'>('pages')
    const [data, setData] = useState<ApiData>({ pages: [], palettes: [], branding: [] })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    
    // Modal States
    const [showPageModal, setShowPageModal] = useState(false)
    const [pageForm, setPageForm] = useState({ page_name: '', slug: '', is_published: true })
    const [showPaletteModal, setShowPaletteModal] = useState(false)
    const [paletteForm, setPaletteForm] = useState({ name: '', primary_color: '#004B93', secondary_color: '#F0A026', background: '#FFFFFF', text_color: '#18181A' })
    const [saving, setSaving] = useState(false)

    // SideDrawer section editor state
    const [showSectionDrawer, setShowSectionDrawer] = useState(false)
    const [editingPage, setEditingPage] = useState<CmsPage | null>(null)
    const [drawerTab, setDrawerTab] = useState<'sections' | 'seo'>('sections')
    const [sectionsList, setSectionsList] = useState<any[]>([])
    const [newSectionType, setNewSectionType] = useState('hero')
    const [seoForm, setSeoForm] = useState({ meta_title: '', meta_description: '', keywords: '' })
    const [drawerLoading, setDrawerLoading] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/cms')
            if (res.ok) setData(await res.json())
        } catch (e) {
            console.error('Error fetching CMS data:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            if (!res.ok) throw new Error(await res.text())
            await fetchData()
            return true
        } catch (e: any) {
            alert(e.message || 'Action failed')
            return false
        } finally {
            setSaving(false)
        }
    }

    // HANDLERS
    const handleCreatePage = async () => {
        if (!pageForm.page_name || !pageForm.slug) return alert('Fill all fields')
        if (await apiAction('CREATE_PAGE', pageForm)) setShowPageModal(false)
    }

    const handleDeletePage = async (id: string) => {
        if (!confirm('Delete this platform page globally?')) return
        await apiAction('DELETE_PAGE', { id })
    }

    const handleTogglePage = async (pageId: string, currentActive: boolean) => {
        await apiAction('TOGGLE_PAGE', { id: pageId, is_published: !currentActive })
    }

    const handleCreatePalette = async () => {
        if (!paletteForm.name) return alert('Palette needs a name')
        if (await apiAction('CREATE_PALETTE', paletteForm)) setShowPaletteModal(false)
    }

    const handleDeletePalette = async (id: string) => {
        if (!confirm('Delete this theme palette? Existing tenants will lose it.')) return
        await apiAction('DELETE_PALETTE', { id })
    }



    // Open dynamic page layout builder SideDrawer
    const openSectionBuilder = async (page: CmsPage) => {
        setEditingPage(page)
        setDrawerTab('sections')
        setSeoForm({
            meta_title: page.meta_title || page.page_name,
            meta_description: page.meta_description || '',
            keywords: page.keywords || ''
        })
        setSectionsList([])
        setShowSectionDrawer(true)
        setDrawerLoading(true)
        
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'GET_PAGE_SECTIONS', payload: { page_id: page.page_id } })
            })
            const result = await res.json()
            if (res.ok) {
                setSectionsList(result.sections || [])
            }
        } catch (e) {
            console.error('Failed loading page sections:', e)
        } finally {
            setDrawerLoading(false)
        }
    }

    // Add new section to page layout list
    const addNewSection = () => {
        let initialContent: any = {}
        if (newSectionType === 'hero') {
            initialContent = { title: 'Welcome to BeBrilliant', subtitle: 'Dynamic landing page', cta_text: 'Get Started', cta_link: '/auth/login', image_url: '/hero_banner.png' }
        } else if (newSectionType === 'features') {
            initialContent = { list: [{ title: 'Advanced Analytics', desc: 'Realtime diagnostics', icon: 'Activity' }] }
        } else if (newSectionType === 'pricing') {
            initialContent = { plans: [{ name: 'Growth', price: '2,499', period: 'Month', features: ['All Core Tools'] }] }
        } else if (newSectionType === 'faq') {
            initialContent = { list: [{ q: 'How to register?', a: 'Click sign up at the top.' }] }
        } else if (newSectionType === 'cta') {
            initialContent = { title: 'Ready to join BeBrilliant?', subtitle: 'Register today', button_text: 'Sign Up Now', button_link: '/auth/login' }
        }

        setSectionsList(prev => [...prev, {
            section_id: 'new-' + Math.random().toString(36).substr(2, 9),
            section_type: newSectionType,
            content_json: initialContent
        }])
    }

    const removeSection = (secId: string) => {
        setSectionsList(prev => prev.filter(s => s.section_id !== secId))
    }

    const moveSection = (idx: number, dir: 'up' | 'down') => {
        const nextIdx = dir === 'up' ? idx - 1 : idx + 1
        if (nextIdx < 0 || nextIdx >= sectionsList.length) return
        
        const nextList = [...sectionsList]
        const temp = nextList[idx]
        nextList[idx] = nextList[nextIdx]
        nextList[nextIdx] = temp
        setSectionsList(nextList)
    }

    // Publish edited page content list to database
    const handlePublishSections = async () => {
        if (!editingPage) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_PAGE_SECTIONS',
                    payload: { page_id: editingPage.page_id, sections: sectionsList }
                })
            })
            if (res.ok) {
                alert('Page content sections published successfully.')
            } else {
                alert('Failed to publish content sections.')
            }
        } catch (e) {
            console.error('Publish sections request failed:', e)
        } finally {
            setSaving(false)
        }
    }

    // Save SEO metadata modifications
    const handleSaveSeo = async () => {
        if (!editingPage) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_PAGE_SEO',
                    payload: { page_id: editingPage.page_id, ...seoForm }
                })
            })
            if (res.ok) {
                alert('SEO configuration saved successfully.')
                fetchData()
            } else {
                alert('Failed to save SEO config.')
            }
        } catch (e) {
            console.error('Save SEO request failed:', e)
        } finally {
            setSaving(false)
        }
    }

    // Pages columns configuration
    const pagesColumns = [
        {
            header: 'Page Name',
            render: (p: CmsPage) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => openSectionBuilder(p)}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} color={P.brand} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{p.page_name}</span>
                </div>
            )
        },
        {
            header: 'URL Slug',
            render: (p: CmsPage) => (
                <code style={{ background: P.bg, padding: '6px 12px', borderRadius: 8, border: '1px solid ' + P.border, fontSize: 13, fontWeight: 800, color: P.brand, fontFamily: 'monospace' }}>
                    /{p.slug}
                </code>
            )
        },
        {
            header: 'Status',
            render: (p: CmsPage) => (
                <button 
                    onClick={() => handleTogglePage(p.page_id, p.active_status)} 
                    disabled={saving} 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 900, border: 'none', cursor: 'pointer', background: p.active_status ? P.successBg : P.errorBg, color: p.active_status ? P.success : P.error, transition: 'all 0.2s' }}
                >
                    {p.active_status ? <CheckCircle size={14} strokeWidth={2.5} /> : <XCircle size={14} strokeWidth={2.5} />} 
                    {p.active_status ? 'PUBLISHED' : 'DRAFT'}
                </button>
            )
        },
        {
            header: 'Created',
            render: (p: CmsPage) => (
                <span style={{ fontSize: 13, color: P.muted, fontWeight: 700 }}>
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            )
        },
        {
            header: 'Actions',
            render: (p: CmsPage) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                        onClick={() => openSectionBuilder(p)}
                        style={{ background: P.brandBg, border: `1px solid ${P.brand}20`, cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit dynamic layout"
                    >
                        <Edit3 size={15} color={P.brand} />
                    </button>
                    <button 
                        onClick={() => handleDeletePage(p.page_id)} 
                        style={{ background: P.bg, border: '1px solid ' + P.border, cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete page"
                    >
                        <Trash2 size={16} color={P.error} />
                    </button>
                </div>
            )
        }
    ]

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES}</style>

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.brand, boxShadow: `0 0 10px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Platform Management</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Content Management</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>
                        Manage platform marketing pages, custom themes, and whitelabel domains.
                    </p>
                </div>
                <button onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: '1px solid ' + P.border, borderRadius: 14, padding: '12px 24px', fontSize: 13, fontWeight: 850, color: P.dark, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <RefreshCw size={16} color={P.brand} strokeWidth={2.5} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Data
                </button>
            </div>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={LayoutTemplate} title="Platform Pages" value={String(data.pages.length)} color={P.brand} />
                <KpiCard icon={CheckCircle} title="Published Pages" value={String(data.pages.filter(p => p.active_status).length)} color={P.success} />
                <KpiCard icon={Globe} title="Brand Whitelabels" value={String(data.branding.length)} color={P.info} />
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: '1px solid ' + P.border, borderRadius: 18, padding: 6, marginBottom: 28, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <button onClick={() => { setActiveTab('pages'); setSearch(''); }} style={{
                    padding: '12px 20px', borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                    background: activeTab === 'pages' ? P.card : 'transparent',
                    color: activeTab === 'pages' ? P.brand : P.muted,
                    boxShadow: activeTab === 'pages' ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}><LayoutTemplate size={16} /> Platform Pages</button>
                <button onClick={() => { setActiveTab('palettes'); setSearch(''); }} style={{
                    padding: '12px 20px', borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                    background: activeTab === 'palettes' ? P.card : 'transparent',
                    color: activeTab === 'palettes' ? P.brand : P.muted,
                    boxShadow: activeTab === 'palettes' ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}><Palette size={16} /> Theme Palettes</button>
                <button onClick={() => { setActiveTab('branding'); setSearch(''); }} style={{
                    padding: '12px 20px', borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                    background: activeTab === 'branding' ? P.card : 'transparent',
                    color: activeTab === 'branding' ? P.brand : P.muted,
                    boxShadow: activeTab === 'branding' ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}><Globe size={16} /> Brand Whitelabels</button>
            </div>

            {/* TAB CONTAINER */}
            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden', minHeight: 400 }}>
                {/* SEARCH & ACTIONS HEADER */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.card }}>
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search size={16} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." 
                            style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: '1px solid ' + P.border, borderRadius: 12, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }} />
                    </div>
                    {activeTab === 'pages' && (
                        <button onClick={() => { setPageForm({ page_name: '', slug: '', is_published: true }); setShowPageModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 850, cursor: 'pointer', boxShadow: `0 8px 20px ${P.brand}25` }}>
                            <Plus size={18} strokeWidth={3} /> Create New Page
                        </button>
                    )}
                    {activeTab === 'palettes' && (
                        <button onClick={() => { setPaletteForm({ name: '', primary_color: '#004B93', secondary_color: '#F0A026', background: '#FFFFFF', text_color: '#18181A' }); setShowPaletteModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 850, cursor: 'pointer', boxShadow: `0 8px 20px ${P.brand}25` }}>
                            <Plus size={18} strokeWidth={3} /> Add Custom Theme
                        </button>
                    )}
                </div>

                {/* ── PLATFORM PAGES TAB ── */}
                {activeTab === 'pages' && (
                    <DataTable
                        columns={pagesColumns}
                        data={data.pages.filter(p => p.page_name.toLowerCase().includes(search.toLowerCase()))}
                        loading={loading}
                        emptyText="No pages created yet."
                    />
                )}

                {/* ── THEME PALETTES TAB ── */}
                {activeTab === 'palettes' && (
                    <div style={{ padding: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, background: P.bg }}>
                        {data.palettes.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                            <div key={p.id} style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', height: 100, position: 'relative' }}>
                                    <div style={{ flex: 1.5, background: p.primary_color }} />
                                    <div style={{ flex: 1, background: p.secondary_color }} />
                                    <div style={{ position: 'absolute', bottom: -12, left: 24, padding: '6px 14px', background: P.card, borderRadius: 10, border: '1px solid ' + P.border, fontSize: 11, fontWeight: 900, color: P.dark, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>COLORS</div>
                                </div>
                                <div style={{ padding: '24px 28px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <h4 style={{ margin: 0, fontSize: 17, fontWeight: 950, color: P.dark }}>{p.name}</h4>
                                        <button onClick={() => handleDeletePalette(p.id)} style={{ background: P.errorBg, border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={15} color={P.error} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { l: 'Primary Hub', c: p.primary_color },
                                            { l: 'Accent Node', c: p.secondary_color },
                                            { l: 'Base Layer', c: p.background },
                                            { l: 'Typography', c: p.text_color },
                                        ].map(sw => (
                                            <div key={sw.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 12, color: P.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sw.l}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <code style={{ fontSize: 12, fontWeight: 850, color: P.dark, textTransform: 'uppercase', background: P.bg, padding: '2px 8px', borderRadius: 6 }}>{sw.c}</code>
                                                    <div style={{ width: 18, height: 18, borderRadius: 6, background: sw.c, border: '1px solid ' + P.border, boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── BRAND WHITELABELS TAB ── */}
                {activeTab === 'branding' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid ' + P.border, background: P.bg }}>
                                    {['Tenant Name', 'Brand Name', 'Custom Domain', 'Email Sender', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '18px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.branding.filter(b => b.tenants?.name.toLowerCase().includes(search.toLowerCase())).map((b) => (
                                    <tr key={b.tenant_id} style={{ borderBottom: '1px solid ' + P.border, transition: 'all 0.2s' }}>
                                        <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 900, color: P.dark }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: P.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Building2 size={18} color={P.info} strokeWidth={2.5} />
                                                </div>
                                                {b.tenants?.name || 'Unknown Tenant'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 800, color: P.brand }}>{b.brand_name || 'Default Brand'}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            {b.custom_domain ? (
                                                <a href={`https://${b.custom_domain}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: P.brand, textDecoration: 'none', background: P.brandBg, padding: '8px 16px', borderRadius: 10, border: '1px solid ' + P.brand + '20' }}>
                                                    <Globe size={13} /> {b.custom_domain}
                                                </a>
                                            ) : <span style={{ color: P.muted, fontSize: 12, fontWeight: 700, fontStyle: 'italic' }}>Default Domain</span>}
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: 13, color: P.text, fontWeight: 650 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Mail size={14} color={P.muted} /> {b.email_sender || 'ledger@bebrilliant.io'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, padding: '6px 12px', borderRadius: 10, background: b.tenants?.is_active ? P.successBg : P.errorBg, color: b.tenants?.is_active ? P.success : P.error, border: '1px solid ' + (b.tenants?.is_active ? P.success : P.error) + '20' }}>
                                                {b.tenants?.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {data.branding.length === 0 && <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: P.muted, fontSize: 15, fontWeight: 700 }}>No brand whitelabels found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}


            </div>

            {/* DYNAMIC CMS PAGE CONTENT EDITOR SIDEDRAWER */}
            <SideDrawer
                isOpen={showSectionDrawer}
                onClose={() => setShowSectionDrawer(false)}
                title={`Layout Builder: ${editingPage?.page_name || ''}`}
                subTitle={`Establish dynamic section contents mapping for URL path /${editingPage?.slug || ''}`}
            >
                {editingPage && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Tab Switcher inside Drawer */}
                        <div style={{ display: 'flex', borderBottom: `1px solid ${P.border}`, background: P.bg, padding: '0 16px' }}>
                            <button 
                                onClick={() => setDrawerTab('sections')}
                                style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, border: 'none', borderBottom: `2px solid ${drawerTab === 'sections' ? P.brand : 'transparent'}`, color: drawerTab === 'sections' ? P.brand : P.muted, background: 'transparent', cursor: 'pointer' }}
                            >
                                Page Sections ({sectionsList.length})
                            </button>
                            <button 
                                onClick={() => setDrawerTab('seo')}
                                style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, border: 'none', borderBottom: `2px solid ${drawerTab === 'seo' ? P.brand : 'transparent'}`, color: drawerTab === 'seo' ? P.brand : P.muted, background: 'transparent', cursor: 'pointer' }}
                            >
                                SEO Meta Config
                            </button>
                        </div>

                        {/* Drawer body content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 24, minHeight: '60vh' }}>
                            {drawerLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                                    <div style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>Loading layouts...</div>
                                </div>
                            ) : drawerTab === 'sections' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* Add Section Controller */}
                                    <div style={{ border: `1px solid ${P.border}`, borderRadius: 16, padding: 16, background: P.bg, display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <select 
                                            value={newSectionType}
                                            onChange={e => setNewSectionType(e.target.value)}
                                            style={{ flex: 1, padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, background: '#fff', fontWeight: 600, outline: 'none' }}
                                        >
                                            <option value="hero">Hero Banner Banner</option>
                                            <option value="features">Core Features Grid</option>
                                            <option value="pricing">Pricing Plans Tier</option>
                                            <option value="faq">FAQ Accordion</option>
                                            <option value="cta">Call to Action Block</option>
                                        </select>
                                        <button 
                                            onClick={addNewSection}
                                            style={{ background: P.brand, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                                        >
                                            + Add Section
                                        </button>
                                    </div>

                                    {/* Sections Array list */}
                                    {sectionsList.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 40, border: `2px dashed ${P.border}`, borderRadius: 16, color: P.muted, fontSize: 13, fontWeight: 600 }}>
                                            No sections established. Add a hero banner or pricing grid to begin!
                                        </div>
                                    ) : (
                                        sectionsList.map((sec, idx) => (
                                            <div key={sec.section_id} style={{ border: `1px solid ${P.border}`, borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                                                {/* Header row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                                    <span style={{ fontSize: 12, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Section {idx + 1}: {sec.section_type}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <button disabled={idx === 0} onClick={() => moveSection(idx, 'up')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowUp size={14} color={P.muted} /></button>
                                                        <button disabled={idx === sectionsList.length - 1} onClick={() => moveSection(idx, 'down')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowDown size={14} color={P.muted} /></button>
                                                        <button onClick={() => removeSection(sec.section_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={14} color={P.error} /></button>
                                                    </div>
                                                </div>

                                                {/* Section content forms */}
                                                <div style={{ padding: 16 }}>
                                                    {sec.section_type === 'hero' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            <CustomInput label="Title Header" value={sec.content_json.title || ''} onChange={(v: string) => {
                                                                const updated = [...sectionsList]; updated[idx].content_json.title = v; setSectionsList(updated);
                                                            }} />
                                                            <CustomInput label="Subtitle description" value={sec.content_json.subtitle || ''} onChange={(v: string) => {
                                                                const updated = [...sectionsList]; updated[idx].content_json.subtitle = v; setSectionsList(updated);
                                                            }} />
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                                <CustomInput label="CTA Button Text" value={sec.content_json.cta_text || ''} onChange={(v: string) => {
                                                                    const updated = [...sectionsList]; updated[idx].content_json.cta_text = v; setSectionsList(updated);
                                                                }} />
                                                                <CustomInput label="CTA Button Link" value={sec.content_json.cta_link || ''} onChange={(v: string) => {
                                                                    const updated = [...sectionsList]; updated[idx].content_json.cta_link = v; setSectionsList(updated);
                                                                }} />
                                                            </div>
                                                            <CustomInput label="Image path URL" value={sec.content_json.image_url || ''} onChange={(v: string) => {
                                                                const updated = [...sectionsList]; updated[idx].content_json.image_url = v; setSectionsList(updated);
                                                            }} />
                                                        </div>
                                                    )}

                                                    {sec.section_type === 'features' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: 11, fontWeight: 800, color: P.muted }}>Features Cards list</span>
                                                                <button onClick={() => {
                                                                    const updated = [...sectionsList];
                                                                    updated[idx].content_json.list = [...(updated[idx].content_json.list || []), { title: 'New Feature', desc: 'Detail info', icon: 'Info' }];
                                                                    setSectionsList(updated);
                                                                }} style={{ background: 'transparent', border: 'none', color: P.brand, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ Add Card</button>
                                                            </div>
                                                            {(sec.content_json.list || []).map((feat: any, fIdx: number) => (
                                                                <div key={fIdx} style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, position: 'relative' }}>
                                                                    <button onClick={() => {
                                                                        const updated = [...sectionsList];
                                                                        updated[idx].content_json.list = updated[idx].content_json.list.filter((_: any, i: number) => i !== fIdx);
                                                                        setSectionsList(updated);
                                                                    }} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} color={P.error} /></button>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                                                                        <CustomInput label="Feature Title" value={feat.title || ''} onChange={(v: string) => {
                                                                            const updated = [...sectionsList]; updated[idx].content_json.list[fIdx].title = v; setSectionsList(updated);
                                                                        }} />
                                                                        <CustomInput label="Lucide Icon Tag" value={feat.icon || ''} onChange={(v: string) => {
                                                                            const updated = [...sectionsList]; updated[idx].content_json.list[fIdx].icon = v; setSectionsList(updated);
                                                                        }} />
                                                                    </div>
                                                                    <CustomInput label="Feature Description" value={feat.desc || ''} onChange={(v: string) => {
                                                                        const updated = [...sectionsList]; updated[idx].content_json.list[fIdx].desc = v; setSectionsList(updated);
                                                                    }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {sec.section_type === 'pricing' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: 11, fontWeight: 800, color: P.muted }}>Pricing Tiers list</span>
                                                                <button onClick={() => {
                                                                    const updated = [...sectionsList];
                                                                    updated[idx].content_json.plans = [...(updated[idx].content_json.plans || []), { name: 'Tier name', price: '999', period: 'Month', features: [] }];
                                                                    setSectionsList(updated);
                                                                }} style={{ background: 'transparent', border: 'none', color: P.brand, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ Add Plan</button>
                                                            </div>
                                                            {(sec.content_json.plans || []).map((plan: any, pIdx: number) => (
                                                                <div key={pIdx} style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, position: 'relative' }}>
                                                                    <button onClick={() => {
                                                                        const updated = [...sectionsList];
                                                                        updated[idx].content_json.plans = updated[idx].content_json.plans.filter((_: any, i: number) => i !== pIdx);
                                                                        setSectionsList(updated);
                                                                    }} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} color={P.error} /></button>
                                                                    
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 10 }}>
                                                                        <CustomInput label="Plan Name" value={plan.name || ''} onChange={(v: string) => {
                                                                            const updated = [...sectionsList]; updated[idx].content_json.plans[pIdx].name = v; setSectionsList(updated);
                                                                        }} />
                                                                        <CustomInput label="Price (INR)" value={plan.price || ''} onChange={(v: string) => {
                                                                            const updated = [...sectionsList]; updated[idx].content_json.plans[pIdx].price = v; setSectionsList(updated);
                                                                        }} />
                                                                        <CustomInput label="Period (e.g. Month)" value={plan.period || ''} onChange={(v: string) => {
                                                                            const updated = [...sectionsList]; updated[idx].content_json.plans[pIdx].period = v; setSectionsList(updated);
                                                                        }} />
                                                                    </div>
                                                                    
                                                                    <CustomInput label="Tier Description" value={plan.desc || ''} onChange={(v: string) => {
                                                                        const updated = [...sectionsList]; updated[idx].content_json.plans[pIdx].desc = v; setSectionsList(updated);
                                                                    }} />

                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                                        <input type="checkbox" checked={!!plan.popular} onChange={e => {
                                                                            const updated = [...sectionsList]; updated[idx].content_json.plans[pIdx].popular = e.target.checked; setSectionsList(updated);
                                                                        }} />
                                                                        <span style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>Mark Popular (Badge Highlight)</span>
                                                                    </div>

                                                                    <CustomInput 
                                                                        label="Features list (comma separated values)" 
                                                                        value={(plan.features || []).join(', ')} 
                                                                        onChange={(v: string) => {
                                                                            const updated = [...sectionsList];
                                                                            updated[idx].content_json.plans[pIdx].features = v.split(',').map(s => s.trim()).filter(Boolean);
                                                                            setSectionsList(updated);
                                                                        }} 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {sec.section_type === 'faq' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: 11, fontWeight: 800, color: P.muted }}>Accordion rows list</span>
                                                                <button onClick={() => {
                                                                    const updated = [...sectionsList];
                                                                    updated[idx].content_json.list = [...(updated[idx].content_json.list || []), { q: 'Question text?', a: 'Answer text.' }];
                                                                    setSectionsList(updated);
                                                                }} style={{ background: 'transparent', border: 'none', color: P.brand, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ Add Row</button>
                                                            </div>
                                                            {(sec.content_json.list || []).map((faq: any, fIdx: number) => (
                                                                <div key={fIdx} style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, position: 'relative' }}>
                                                                    <button onClick={() => {
                                                                        const updated = [...sectionsList];
                                                                        updated[idx].content_json.list = updated[idx].content_json.list.filter((_: any, i: number) => i !== fIdx);
                                                                        setSectionsList(updated);
                                                                    }} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} color={P.error} /></button>
                                                                    
                                                                    <CustomInput label="Question Text" value={faq.q || ''} onChange={(v: string) => {
                                                                        const updated = [...sectionsList]; updated[idx].content_json.list[fIdx].q = v; setSectionsList(updated);
                                                                    }} />
                                                                    <CustomInput label="Answer Explanation" value={faq.a || ''} onChange={(v: string) => {
                                                                        const updated = [...sectionsList]; updated[idx].content_json.list[fIdx].a = v; setSectionsList(updated);
                                                                    }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {sec.section_type === 'cta' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            <CustomInput label="Section Header" value={sec.content_json.title || ''} onChange={(v: string) => {
                                                                const updated = [...sectionsList]; updated[idx].content_json.title = v; setSectionsList(updated);
                                                            }} />
                                                            <CustomInput label="Section Subtitle" value={sec.content_json.subtitle || ''} onChange={(v: string) => {
                                                                const updated = [...sectionsList]; updated[idx].content_json.subtitle = v; setSectionsList(updated);
                                                            }} />
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                                <CustomInput label="Button Display Text" value={sec.content_json.button_text || ''} onChange={(v: string) => {
                                                                    const updated = [...sectionsList]; updated[idx].content_json.button_text = v; setSectionsList(updated);
                                                                }} />
                                                                <CustomInput label="Button Navigation URL" value={sec.content_json.button_link || ''} onChange={(v: string) => {
                                                                    const updated = [...sectionsList]; updated[idx].content_json.button_link = v; setSectionsList(updated);
                                                                }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Save Sections Button */}
                                    <button
                                        onClick={handlePublishSections}
                                        disabled={saving}
                                        style={{ width: '100%', background: P.brand, color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${P.brand}25` }}
                                    >
                                        <Save size={16} /> Publish Layout Builder
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <CustomInput 
                                        label="Meta Title (SEO Header)" 
                                        value={seoForm.meta_title} 
                                        onChange={(v: string) => setSeoForm(f => ({ ...f, meta_title: v }))} 
                                    />
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Meta Description</label>
                                        <textarea 
                                            value={seoForm.meta_description} 
                                            onChange={e => setSeoForm(f => ({ ...f, meta_description: e.target.value }))}
                                            style={{ width: '100%', height: 90, padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, outline: 'none', background: '#fff', fontWeight: 600 }}
                                        />
                                    </div>
                                    <CustomInput 
                                        label="SEO Keywords (comma separated)" 
                                        value={seoForm.keywords} 
                                        onChange={(v: string) => setSeoForm(f => ({ ...f, keywords: v }))} 
                                    />

                                    <button
                                        onClick={handleSaveSeo}
                                        disabled={saving}
                                        style={{ width: '100%', background: P.brand, color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${P.brand}25` }}
                                    >
                                        <Save size={16} /> Save SEO Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SideDrawer>

            {/* NEW PAGE MODAL */}
            {showPageModal && (
                <CustomModal title="Create Platform Page" onClose={() => setShowPageModal(false)} onSubmit={handleCreatePage} saving={saving}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <CustomInput label="Page Name" value={pageForm.page_name} onChange={(v: string) => setPageForm({ ...pageForm, page_name: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="e.g. Terms of Service" />
                        <CustomInput label="URL Slug" value={pageForm.slug} onChange={(v: string) => setPageForm({ ...pageForm, slug: v })} placeholder="e.g. terms-of-service" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>Publish Immediately</span>
                            <input type="checkbox" checked={pageForm.is_published} onChange={e => setPageForm({ ...pageForm, is_published: e.target.checked })} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                        </div>
                    </div>
                </CustomModal>
            )}

            {/* NEW PALETTE MODAL */}
            {showPaletteModal && (
                <CustomModal title="Add Custom Theme Palette" onClose={() => setShowPaletteModal(false)} onSubmit={handleCreatePalette} saving={saving} saveText="Publish Theme">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <CustomInput label="Theme Name" value={paletteForm.name} onChange={(v: string) => setPaletteForm({ ...paletteForm, name: v })} placeholder="e.g. Midnight Ruby" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <CustomInput type="color" label="Primary Accent" value={paletteForm.primary_color} onChange={(v: string) => setPaletteForm({ ...paletteForm, primary_color: v })} />
                            <CustomInput type="color" label="Secondary Accent" value={paletteForm.secondary_color} onChange={(v: string) => setPaletteForm({ ...paletteForm, secondary_color: v })} />
                            <CustomInput type="color" label="App Background" value={paletteForm.background} onChange={(v: string) => setPaletteForm({ ...paletteForm, background: v })} />
                            <CustomInput type="color" label="Base Text" value={paletteForm.text_color} onChange={(v: string) => setPaletteForm({ ...paletteForm, text_color: v })} />
                        </div>
                    </div>
                </CustomModal>
            )}
        </div>
    )
}
