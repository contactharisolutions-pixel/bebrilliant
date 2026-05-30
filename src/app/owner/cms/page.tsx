'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    FileText, Palette, Building2, Users, RefreshCw, Loader2,
    Plus, Search, Edit3, Trash2, Globe, Link as LinkIcon, CheckCircle,
    XCircle, ChevronRight, Mail, LayoutTemplate, Activity, Zap
} from 'lucide-react'
// ── PALETTE ── MATCHING INSTITUTIONAL SYSTEM ────────────────
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9315',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6310',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}
// ── TYPES ───────────────────────────────────────────────────
type CmsPage = { id: string; page_name: string; slug: string; is_published: boolean; created_at: string }
type Palette = { id: string; name: string; primary_color: string; secondary_color: string; background: string; text_color: string; created_at: string }
type Branding = { tenant_id: string; brand_name: string; email_sender: string; custom_domain: string; logo: string; created_at: string; tenants: { name: string; type: string; is_active: boolean } }
type DemoRequest = { id: string; name: string; organization: string; email: string; phone: string; message: string; status: string; created_at: string }
type ApiData = {
    pages: CmsPage[]
    palettes: Palette[]
    branding: Branding[]
    demos: DemoRequest[]
}
// ── MODALS ──────────────────────────────────────────────────
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Save' }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 20, 40, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: 20 }}>
            <div className="glass-card" style={{ background: P.card, borderRadius: 28, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.3)', border: `1px solid ${P.border}`, animation: 'scaleUp 0.3s ease' }}>
                <style>{`
                    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                `}</style>
                <div style={{ padding: '32px 40px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} className="hover-lift" style={{ background: '#fff', border: '1px solid ' + P.border, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={18} color={P.muted} /></button>
                </div>
                <div style={{ padding: '32px 40px' }}>{children}</div>
                <div style={{ padding: '24px 40px', background: P.bg, borderTop: '1px solid ' + P.border, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid ' + P.border, color: P.dark, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} disabled={saving} className="hover-lift" style={{ padding: '12px 28px', borderRadius: 14, background: P.brand, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 20px ${P.brand}30` }}>
                        {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}
function KpiCard({ icon: Icon, label, value, sub, color, bg }: {
    icon: any; label: string; value: string; sub?: string; color: string; bg: string
}) {
    return (
        <div className="glass-card hover-lift" style={{ 
            background: P.card, 
            border: '1px solid ' + P.border, 
            borderRadius: 24, 
            padding: '24px 28px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${color}15` }}>
                    <Icon size={20} color={color} strokeWidth={2.5} />
                </div>
                {sub && <span style={{ fontSize: 11, fontWeight: 800, color: P.muted, background: P.bg, padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sub}</span>}
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 950, color: P.dark, letterSpacing: '-0.03em' }}>{value}</div>
            </div>
        </div>
    )
}
function Input({ label, value, onChange, placeholder = '', type = 'text', readOnly = false }: any) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <input type={type} readOnly={readOnly} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} 
                className="focus-ring"
                style={{ width: '100%', padding: type === 'color' ? '4px 8px' : '12px 16px', border: '1px solid ' + P.border, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', boxSizing: 'border-box', height: type === 'color' ? 48 : 'auto', cursor: type === 'color' ? 'pointer' : 'text', background: readOnly ? P.hover : '#fff', fontWeight: 600, transition: 'all 0.2s' }} />
        </div>
    )
}
// ── MAIN PAGE ────────────────────────────────────────────────
export default function CMSPage() {
    const [activeTab, setActiveTab] = useState<'pages' | 'palettes' | 'branding' | 'demos'>('pages')
    const [data, setData] = useState<ApiData>({ pages: [], palettes: [], branding: [], demos: [] })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    // Modal States
    const [showPageModal, setShowPageModal] = useState(false)
    const [pageForm, setPageForm] = useState({ page_name: '', slug: '', is_published: true })
    const [showPaletteModal, setShowPaletteModal] = useState(false)
    const [paletteForm, setPaletteForm] = useState({ name: '', primary_color: '#004B93', secondary_color: '#F0A026', background: '#FFFFFF', text_color: '#18181A' })
    const [saving, setSaving] = useState(false)
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3000)
    }
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/cms')
            if (res.ok) setData(await res.json())
        } catch (e) { showToast('Error fetching CMS data', false) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchData() }, [fetchData])
    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/cms', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            if (!res.ok) throw new Error(await res.text())
            await fetchData()
            showToast('Action saved successfully', true)
            return true
        } catch (e: any) {
            showToast(e.message || 'Action failed', false)
            return false
        } finally { setSaving(false) }
    }
    const tabStyle = (id: string) => ({
        padding: '12px 20px', borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
        background: activeTab === id ? P.card : 'transparent',
        color: activeTab === id ? P.brand : P.muted,
        boxShadow: activeTab === id ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
        fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
    })
    // HANDLERS
    const handleCreatePage = async () => {
        if (!pageForm.page_name || !pageForm.slug) return showToast('Fill all fields', false)
        if (await apiAction('CREATE_PAGE', pageForm)) setShowPageModal(false)
    }
    const handleDeletePage = async (id: string) => {
        if (!confirm('Delete this platform page globally?')) return
        await apiAction('DELETE_PAGE', { id })
    }
    const handleTogglePage = async (p: CmsPage) => {
        await apiAction('TOGGLE_PAGE', { id: p.id, is_published: !p.is_published })
    }
    const handleCreatePalette = async () => {
        if (!paletteForm.name) return showToast('Palette needs a name', false)
        if (await apiAction('CREATE_PALETTE', paletteForm)) setShowPaletteModal(false)
    }
    const handleDeletePalette = async (id: string) => {
        if (!confirm('Delete this theme palette? Existing tenants will lose it.')) return
        await apiAction('DELETE_PALETTE', { id })
    }
    const handleUpdateDemoStatus = async (id: string, status: string) => {
        await apiAction('UPDATE_DEMO_STATUS', { id, status })
    }
    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px', position: 'relative' }}>
            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 28, background: toast.ok ? P.successBg : P.errorBg, border: '1px solid ' + (toast.ok ? P.success : P.error) + '40', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 9000 }}>
                    {toast.ok ? <CheckCircle size={16} color={P.success} /> : <XCircle size={16} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 700, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
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
                <button onClick={fetchData} disabled={loading} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: '1px solid ' + P.border, borderRadius: 14, padding: '12px 24px', fontSize: 13, fontWeight: 850, color: P.dark, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <RefreshCw size={16} color={P.brand} strokeWidth={2.5} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Data
                </button>
            </div>
            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={LayoutTemplate} label="Platform Pages" value={String(data.pages.length)} sub="Active Pages" color={P.brand} bg={P.brandBg} />
                <KpiCard icon={Zap} label="Demo Requests" value={String(data.demos.filter(d => d.status === 'new').length)} sub="New Requests" color={P.cta} bg={P.ctaBg} />
                <KpiCard icon={Globe} label="Brand Whitelabels" value={String(data.branding.length)} sub="Custom Domains" color={P.info} bg={P.infoBg} />
                <KpiCard icon={Palette} label="Theme Palettes" value={String(data.palettes.length)} sub="Saved Presets" color={P.success} bg={P.successBg} />
            </div>
            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: '1px solid ' + P.border, borderRadius: 18, padding: 6, marginBottom: 28, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <button onClick={() => setActiveTab('pages')} style={tabStyle('pages')}><LayoutTemplate size={16} /> Platform Pages</button>
                <button onClick={() => setActiveTab('palettes')} style={tabStyle('palettes')}><Palette size={16} /> Theme Palettes</button>
                <button onClick={() => setActiveTab('branding')} style={tabStyle('branding')}><Globe size={16} /> Brand Whitelabels</button>
                <button onClick={() => setActiveTab('demos')} style={tabStyle('demos')}><Zap size={16} /> Demo Requests</button>
            </div>
            {loading && data.pages.length === 0 ? (
                <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
                    <div style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>Loading data...</div>
                </div>
            ) : (
                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden', minHeight: 400 }}>
                    {/* SEARCH & ACTIONS HEADER (Per Tab) */}
                    <div style={{ padding: '24px 28px', borderBottom: '1px solid ' + P.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.card }}>
                        <div style={{ position: 'relative', width: 320 }}>
                            <Search size={16} color={P.brand} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." 
                                className="focus-ring"
                                style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: '1px solid ' + P.border, borderRadius: 12, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600, transition: 'all 0.2s' }} />
                        </div>
                        {activeTab === 'pages' && (
                            <button onClick={() => { setPageForm({ page_name: '', slug: '', is_published: true }); setShowPageModal(true) }} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 850, cursor: 'pointer', boxShadow: `0 8px 20px ${P.brand}25` }}>
                                <Plus size={18} strokeWidth={3} /> Create New Page
                            </button>
                        )}
                        {activeTab === 'palettes' && (
                            <button onClick={() => { setPaletteForm({ name: '', primary_color: '#004B93', secondary_color: '#F0A026', background: '#FFFFFF', text_color: '#18181A' }); setShowPaletteModal(true) }} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 850, cursor: 'pointer', boxShadow: `0 8px 20px ${P.brand}25` }}>
                                <Plus size={18} strokeWidth={3} /> Add Custom Theme
                            </button>
                        )}
                    </div>
                    {/* ── DEPLOYMENT NODES ── */}
                    {activeTab === 'pages' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid ' + P.border, background: P.bg }}>
                                        {['Page Name', 'URL Slug', 'Status', 'Created', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '18px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pages.filter(p => p.page_name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid ' + P.border, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = P.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 900, color: P.dark }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={18} color={P.brand} strokeWidth={2.5} />
                                                    </div>
                                                    {p.page_name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <code style={{ background: P.bg, padding: '6px 12px', borderRadius: 8, border: '1px solid ' + P.border, fontSize: 13, fontWeight: 800, color: P.brand, letterSpacing: '0.02em' }}>
                                                    /{p.slug}
                                                </code>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <button onClick={() => handleTogglePage(p)} disabled={saving} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 900, border: 'none', cursor: 'pointer', background: p.is_published ? P.successBg : P.errorBg, color: p.is_published ? P.success : P.error, transition: 'all 0.2s' }}>
                                                    {p.is_published ? <CheckCircle size={14} strokeWidth={2.5} /> : <XCircle size={14} strokeWidth={2.5} />} 
                                                    {p.is_published ? 'PUBLISHED' : 'DRAFT'}
                                                </button>
                                            </td>
                                            <td style={{ padding: '20px 24px', fontSize: 13, color: P.muted, fontWeight: 700 }}>
                                                {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => handleDeletePage(p.id)} className="hover-lift" style={{ background: P.bg, border: '1px solid ' + P.border, cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = P.error} onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
                                                        <Trash2 size={16} color={P.error} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.pages.length === 0 && <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: P.muted, fontSize: 15, fontWeight: 700 }}>No pages created yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* ── THEMATIC SOVEREIGNTY ── */}
                    {activeTab === 'palettes' && (
                        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, background: P.bg }}>
                            {data.palettes.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                                <div key={p.id} className="glass-card hover-lift" style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', height: 100, position: 'relative' }}>
                                        <div style={{ flex: 1.5, background: p.primary_color }} />
                                        <div style={{ flex: 1, background: p.secondary_color }} />
                                        <div style={{ position: 'absolute', bottom: -12, left: 24, padding: '6px 14px', background: P.card, borderRadius: 10, border: '1px solid ' + P.border, fontSize: 11, fontWeight: 900, color: P.dark, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>COLORS</div>
                                    </div>
                                    <div style={{ padding: '24px 28px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 950, color: P.dark }}>{p.name}</h4>
                                            <button onClick={() => handleDeletePalette(p.id)} className="hover-lift" style={{ background: P.errorBg, border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    {/* ── WHITELABEL ENFORCEMENTS ── */}
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
                                        <tr key={b.tenant_id} style={{ borderBottom: '1px solid ' + P.border, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = P.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                                                    <a href={`https://${b.custom_domain}`} target="_blank" rel="noreferrer" className="hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: P.brand, textDecoration: 'none', background: P.brandBg, padding: '8px 16px', borderRadius: 10, border: '1px solid ' + P.brand + '20' }}>
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
                    {/* ── ACQUISITION ANALYTICS ── */}
                    {activeTab === 'demos' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid ' + P.border, background: P.bg }}>
                                        {['Date', 'Name', 'Institution', 'Contact Info', 'Status', 'Message'].map(h => (
                                            <th key={h} style={{ padding: '18px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.demos.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.organization.toLowerCase().includes(search.toLowerCase())).map((d) => (
                                        <tr key={d.id} style={{ borderBottom: '1px solid ' + P.border, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = P.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '20px 24px', fontSize: 13, color: P.muted, fontWeight: 700 }}>
                                                {new Date(d.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 900, color: P.dark }}>{d.name}</td>
                                            <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 850, color: P.brand }}>{d.organization}</td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: P.dark, fontWeight: 650 }}>
                                                        <Mail size={12} color={P.brand} /> {d.email}
                                                    </span>
                                                    {d.phone && <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{d.phone}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <select
                                                    value={d.status}
                                                    onChange={(e) => handleUpdateDemoStatus(d.id, e.target.value)}
                                                    className="focus-ring"
                                                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid ' + P.border, fontSize: 12, fontWeight: 850, background: P.card, color: d.status === 'converted' ? P.success : d.status === 'rejected' ? P.error : P.brand, outline: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}
                                                >
                                                    <option value="new">✨ NEW</option>
                                                    <option value="contacted">📞 CONTACTED</option>
                                                    <option value="demo_given">💻 DEMO ACTIVE</option>
                                                    <option value="converted">✅ CONVERTED</option>
                                                    <option value="rejected">❌ REJECTED</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '20px 24px', fontSize: 12, color: P.text, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontStyle: 'italic' }} title={d.message}>
                                                {d.message || 'No message provided.'}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.demos.length === 0 && <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: P.muted, fontSize: 15, fontWeight: 700 }}>No demo requests recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {/* NEW PAGE MODAL */}
            {showPageModal && (
                <Modal title="Create Platform Page" onClose={() => setShowPageModal(false)} onSubmit={handleCreatePage} saving={saving}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Input label="Page Name" value={pageForm.page_name} onChange={(v: string) => setPageForm({ ...pageForm, page_name: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="e.g. Terms of Service" />
                        <Input label="URL Slug" value={pageForm.slug} onChange={(v: string) => setPageForm({ ...pageForm, slug: v })} placeholder="e.g. terms-of-service" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>Publish Immediately</span>
                            <input type="checkbox" checked={pageForm.is_published} onChange={e => setPageForm({ ...pageForm, is_published: e.target.checked })} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                        </div>
                        <p style={{ fontSize: 11, color: P.muted, margin: '4px 0 0' }}>Creating a page sets up the container. Sections are managed separately.</p>
                    </div>
                </Modal>
            )}
            {/* NEW PALETTE MODAL */}
            {showPaletteModal && (
                <Modal title="Add Custom Theme Palette" onClose={() => setShowPaletteModal(false)} onSubmit={handleCreatePalette} saving={saving} saveText="Publish Theme">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Input label="Theme Name" value={paletteForm.name} onChange={(v: string) => setPaletteForm({ ...paletteForm, name: v })} placeholder="e.g. Midnight Ruby" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Input type="color" label="Primary Accent" value={paletteForm.primary_color} onChange={(v: string) => setPaletteForm({ ...paletteForm, primary_color: v })} />
                            <Input type="color" label="Secondary Accent" value={paletteForm.secondary_color} onChange={(v: string) => setPaletteForm({ ...paletteForm, secondary_color: v })} />
                            <Input type="color" label="App Background" value={paletteForm.background} onChange={(v: string) => setPaletteForm({ ...paletteForm, background: v })} />
                            <Input type="color" label="Base Text" value={paletteForm.text_color} onChange={(v: string) => setPaletteForm({ ...paletteForm, text_color: v })} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
