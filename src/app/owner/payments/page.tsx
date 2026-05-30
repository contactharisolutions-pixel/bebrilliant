'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    CreditCard, LayoutTemplate, Briefcase, FileText, CheckCircle, XCircle,
    Plus, Upload, Shield, Zap, Search, Activity, MoreVertical, RefreshCw, Loader2, ArrowUpRight,
    X, Check, Filter, ArrowRight, ExternalLink, ShieldCheck, Info, Layers
} from 'lucide-react'
// â”€â”€ PALETTE â”” MATCHING INSTITUTIONAL SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
// â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Plan = {
    id: string; name: string; type: string; price: number; billing_cycle: string;
    max_students: number; max_teachers: number;
    features: { ai_mentor: boolean; adaptive_exam: boolean; white_label: boolean };
    is_active: boolean;
}
type Subscription = {
    id: string; tenant_id: string; plan_id: string; status: string;
    start_date: string; end_date: string; auto_renew: boolean;
    tenants: { name: string; email: string };
    plans: { name: string; price: number };
}
type Invoice = {
    id: string; 
    tenant_id: string; 
    amount: number; 
    status: string;
    created_at: string; 
    invoice_url: string;
    base_amount: number;
    gst_amount: number;
    gst_percent: number;
    tenants: { name: string };
}
type ApiData = { plans: Plan[]; subscriptions: Subscription[]; invoices: Invoice[] }
// â”€â”€ COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Save' }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 24 }}>
            <div className="glass-card" style={{ borderRadius: 24, width: '100%', maxWidth: 560, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${P.border}` }}>
                <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} className="hover-lift" style={{ background: P.bg, border: 'none', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color={P.muted} /></button>
                </div>
                <div style={{ padding: 32, overflowY: 'auto' }}>{children}</div>
                <div style={{ padding: '20px 32px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', border: `1px solid ${P.border}`, color: P.muted, fontSize: 14, fontWeight: 750, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} disabled={saving} className="hover-lift" style={{ padding: '12px 28px', borderRadius: 12, background: P.brand, border: 'none', color: '#fff', fontSize: 14, fontWeight: 850, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 20px ${P.brand}35` }}>
                        {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={18} strokeWidth={2.5} />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}
function InputField({ label, value, onChange, placeholder = '', type = 'text', readOnly = false }: any) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 850, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            <input type={type} readOnly={readOnly} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="focus-ring" style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: readOnly ? P.muted : P.dark, outline: 'none', boxSizing: 'border-box', background: readOnly ? P.bg : '#fff', fontWeight: 600 }} />
        </div>
    )
}
function FeatureToggle({ label, checked, onChange }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 750, color: P.dark }}>{label}</span>
            <button onClick={() => onChange(!checked)}
                style={{ width: 42, height: 22, borderRadius: 99, background: checked ? P.success : P.muted + '40', border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', padding: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s' }} />
            </button>
        </div>
    )
}
// â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SubscriptionsPage() {
    const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'invoices'>('plans')
    const [data, setData] = useState<ApiData>({ plans: [], subscriptions: [], invoices: [] })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    // Form
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [planForm, setPlanForm] = useState<any>({ name: '', type: 'institute', price: 0, billing_cycle: 'monthly', max_students: 100, max_teachers: 5, features: { ai_mentor: false, adaptive_exam: false, white_label: false }, is_active: true })
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3000)
    }
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/billing')
            if (res.ok) setData(await res.json())
        } catch (e) { showToast('Error loading revenue metadata', false) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchData() }, [fetchData])
    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            if (!res.ok) throw new Error(await res.text())
            await fetchData()
            showToast('Logic successfully deployed', true)
            return true
        } catch (e: any) {
            showToast(e.message || 'Deployment failure', false)
            return false
        } finally { setSaving(false) }
    }
    const handleSavePlan = async () => {
        if (!planForm.name) return showToast('Descriptor required', false)
        const success = planForm.id
            ? await apiAction('UPDATE_PLAN', planForm)
            : await apiAction('CREATE_PLAN', planForm)
        if (success) setShowPlanModal(false)
    }
    const handleToggleSub = async (sub: Subscription) => {
        const nextStatus = sub.status === 'active' ? 'cancelled' : 'active'
        if (!confirm(`Transition subscription state to ${nextStatus}?`)) return
        await apiAction('TOGGLE_SUBSCRIPTION', { id: sub.id, status: nextStatus })
    }
    const TABS = [
        { id: 'plans', icon: LayoutTemplate, label: 'Service Tiers' },
        { id: 'subscriptions', icon: Zap, label: 'Ecosystem Nodes' },
        { id: 'invoices', icon: FileText, label: 'Settlement Log' },
    ] as const
    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '40px 48px', position: 'relative' }}>
            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? P.successBg : P.errorBg, border: `1px solid ${toast.ok ? P.success : P.error}40`, borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 9000, backdropFilter: 'blur(8px)' }}>
                    {toast.ok ? <CheckCircle size={18} color={P.success} /> : <XCircle size={18} color={P.error} />}
                    <span style={{ fontSize: 14, fontWeight: 800, color: toast.ok ? P.success : P.error }}>{toast.msg}</span>
                </div>
            )}
            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue & Governance</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Configuration Layer</div>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Subscription Architecture</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>Establish network-wide asset tiers, manage settlements, and audit payment records.</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={fetchData} disabled={loading} className="hover-lift shadow-sm" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={18} color={P.brand} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> 
                        {loading ? 'Synchronizing...' : 'Sync Revenue Ops'}
                    </button>
                    {activeTab === 'plans' && (
                        <button onClick={() => { setPlanForm({ name: '', type: 'institute', price: 0, billing_cycle: 'monthly', max_students: 100, max_teachers: 5, features: { ai_mentor: false, adaptive_exam: false, white_label: false }, is_active: true }); setShowPlanModal(true) }} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}30` }}>
                            <Plus size={20} strokeWidth={3} /> Define Asset Tier
                        </button>
                    )}
                </div>
            </header>
            {/* TABS NAVIGATION */}
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 18, width: 'fit-content', marginBottom: 32 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={activeTab === t.id ? 'tab-active' : ''} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 14, border: '1px solid transparent', background: 'transparent', color: P.muted, fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <t.icon size={18} strokeWidth={2.5} /> {t.label}
                    </button>
                ))}
            </div>
            <div className="glass-card" style={{ border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', minHeight: 480 }}>
                {/* SEARCH & ACTIONS */}
                <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search size={18} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records by entity or tier..." className="focus-ring" style={{ width: '100%', padding: '14px 16px', paddingLeft: 46, border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, background: '#fff', outline: 'none', fontWeight: 600 }} />
                    </div>
                    {activeTab === 'plans' && (
                        <button onClick={() => { setPlanForm({ name: '', type: 'institute', price: 0, billing_cycle: 'monthly', max_students: 100, max_teachers: 5, features: { ai_mentor: false, adaptive_exam: false, white_label: false }, is_active: true }); setShowPlanModal(true) }} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 850, cursor: 'pointer', boxShadow: `0 8px 18px ${P.brand}35` }}>
                            <Plus size={18} strokeWidth={3} /> Define New Asset Tier
                        </button>
                    )}
                </div>
                {loading && data.plans.length === 0 ? (
                    <div style={{ padding: 120, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
                        <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <div style={{ padding: '0' }}>
                        {/* ── PLANS TAB ── */}
                        {activeTab === 'plans' && (
                            <div style={{ padding: 32 }}>
                                {data.plans.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: 24, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `1px solid ${P.border}` }}>
                                            <LayoutTemplate size={32} color={P.muted} />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 900, color: P.dark, margin: 0 }}>No Service Tiers Found</h3>
                                        <p style={{ fontSize: 14, color: P.muted, margin: '8px 0 24px', fontWeight: 600 }}>Architecture tiers define the revenue and capability constraints of the network.</p>
                                        <button onClick={() => setShowPlanModal(true)} className="hover-lift" style={{ background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 8px 20px ${P.brand}30` }}>
                                            Define Initial Asset Tier
                                        </button>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 32 }}>
                                    {data.plans.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(plan => (
                                        <div key={plan.id} className="hover-lift" style={{ border: `1px solid ${plan.is_active ? P.border : P.error + '20'}`, borderRadius: 24, padding: 32, background: plan.is_active ? '#fff' : P.bg, position: 'relative', overflow: 'hidden' }}>
                                            {!plan.is_active && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, background: P.error, color: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspended</div>}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{plan.name}</h3>
                                                    <div style={{ fontSize: 12, color: P.muted, marginTop: 4, textTransform: 'uppercase', fontWeight: 850, letterSpacing: '0.05em' }}>{plan.type.replace('_', ' ')} Logic</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 28, fontWeight: 950, color: P.brand, letterSpacing: '-0.03em' }}>\u20B9{plan.price}</div>
                                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 750 }}>Per {plan.billing_cycle === 'monthly' ? 'Month' : 'Year'}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                                                <div style={{ flex: 1, background: P.bg, padding: '12px', borderRadius: 14, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>{plan.max_students}</div>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>Students</div>
                                                </div>
                                                <div style={{ flex: 1, background: P.bg, padding: '12px', borderRadius: 14, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>{plan.max_teachers}</div>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: P.muted, textTransform: 'uppercase' }}>Staff</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                                                {[
                                                    { active: plan.features.ai_mentor, label: 'AI Question Generation' },
                                                    { active: plan.features.adaptive_exam, label: 'Adaptive Exams & Proctor' },
                                                    { active: plan.features.white_label, label: 'Enterprise White-Labeling' }
                                                ].map((f, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: f.active ? P.dark : P.muted, fontWeight: 700 }}>
                                                        <div style={{ width: 22, height: 22, borderRadius: 7, background: f.active ? P.successBg : P.muted + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {f.active ? <Check size={14} color={P.success} strokeWidth={3.5} /> : <X size={14} color={P.muted} strokeWidth={3.5} />}
                                                        </div>
                                                        {f.label}
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => { setPlanForm(plan); setShowPlanModal(true); }} className="hover-lift" style={{ width: '100%', padding: '14px', background: P.bg, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 850, color: P.dark, cursor: 'pointer' }}>
                                                Configure Logic
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* â”€â”€ SUBSCRIPTIONS TAB â”€â”€ */}
                        {activeTab === 'subscriptions' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: P.bg }}>
                                        {['Institutional Node', 'Active Tier', 'Settlement Cycle', 'Status', 'Control'].map(h => <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.subscriptions.filter(s => s.tenants?.name.toLowerCase().includes(search.toLowerCase()) || s.plans?.name.toLowerCase().includes(search.toLowerCase())).map(s => (
                                        <tr key={s.id} style={{ borderBottom: `1px solid ${P.bg}`, transition: 'all 0.2s', background: s.status === 'expired' || s.status === 'cancelled' ? P.errorBg : 'transparent' }}>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ fontSize: 15, fontWeight: 850, color: P.dark }}>{s.tenants?.name}</div>
                                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 650, marginTop: 2 }}>{s.tenants?.email}</div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.cta }} />
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{s.plans?.name}</div>
                                                </div>
                                                <div style={{ fontSize: 12, color: P.brand, fontWeight: 850, marginLeft: 20 }}>\u20B9{s.plans?.price.toLocaleString()} / Cycle</div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ fontSize: 13, color: s.status === 'expired' ? P.error : P.dark, fontWeight: 800 }}>Next: {new Date(s.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginTop: 2 }}>Auto-Renew: {s.auto_renew ? 'Active' : 'Disabled'}</div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <span style={{ fontSize: 11, fontWeight: 900, padding: '5px 12px', borderRadius: 8, background: s.status === 'active' ? P.successBg : P.errorBg, color: s.status === 'active' ? P.success : P.error, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <button onClick={() => handleToggleSub(s)} disabled={saving} className="hover-lift" style={{ fontSize: 12, fontWeight: 850, padding: '10px 18px', borderRadius: 12, border: 'none', background: P.card, color: P.brand, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderBottom: `1px solid ${P.border}` }}>
                                                    Modify Plan
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.subscriptions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 120, textAlign: 'center' }}>
                                                <div style={{ width: 64, height: 64, borderRadius: 20, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                                    <Zap size={28} color={P.muted} />
                                                </div>
                                                <div style={{ fontSize: 16, fontWeight: 850, color: P.dark }}>No Active Node Subscriptions</div>
                                                <div style={{ fontSize: 13, color: P.muted, marginTop: 4, fontWeight: 600 }}>Analytics will appear as institutional nodes activate their tiers.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {/* â”€â”€ INVOICES TAB â”€â”€ */}
                        {activeTab === 'invoices' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: P.bg }}>
                                        {['Capture Date', 'Entity Node', 'Base Amount', 'GST (18%)', 'Total', 'Status', 'Artifacts'].map(h => <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.invoices.filter(i => i.tenants?.name.toLowerCase().includes(search.toLowerCase())).map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: `1px solid ${P.bg}`, transition: 'all 0.2s' }}>
                                            <td style={{ padding: '20px 32px', fontSize: 14, color: P.muted, fontWeight: 750 }}>{new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                            <td style={{ padding: '20px 32px', fontSize: 15, fontWeight: 850, color: P.dark }}>{inv.tenants?.name}</td>
                                            <td style={{ padding: '20px 32px', fontSize: 15, fontWeight: 750, color: P.text }}>\u20B9{(inv.base_amount || inv.amount / 1.18).toLocaleString()}</td>
                                            <td style={{ padding: '20px 32px', fontSize: 15, fontWeight: 750, color: P.muted }}>\u20B9{(inv.gst_amount || (inv.amount - inv.amount / 1.18)).toLocaleString()}</td>
                                            <td style={{ padding: '20px 32px', fontSize: 16, fontWeight: 950, color: P.brand }}>\u20B9{inv.amount.toLocaleString()}</td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: inv.status === 'paid' ? P.success : P.warning }} />
                                                    <span style={{ fontSize: 13, fontWeight: 850, color: inv.status === 'paid' ? P.success : P.warning, textTransform: 'capitalize' }}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                {inv.invoice_url ? (
                                                    <a href={inv.invoice_url} target="_blank" rel="noreferrer" className="hover-lift" style={{ fontSize: 12, fontWeight: 850, color: P.brand, textDecoration: 'none', background: P.brandBg, padding: '8px 16px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                        Artifact PDF <ExternalLink size={14} />
                                                    </a>
                                                ) : <span style={{ color: P.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Legacy Record</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.invoices.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 120, textAlign: 'center' }}>
                                                <div style={{ width: 64, height: 64, borderRadius: 20, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                                    <FileText size={28} color={P.muted} />
                                                </div>
                                                <div style={{ fontSize: 16, fontWeight: 850, color: P.dark }}>No Settlement Artifacts</div>
                                                <div style={{ fontSize: 13, color: P.muted, marginTop: 4, fontWeight: 600 }}>Financial captures are generated automatically upon billing cycles.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
            {/* SIDE LEGEND CARDS */}
            {activeTab === 'plans' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 40 }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: 20, border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', gap: 12, color: P.brand, marginBottom: 12 }}>
                            <Layers size={20} strokeWidth={2.5} />
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>Standardized Tiers</h4>
                        </div>
                        <p style={{ fontSize: 12, color: P.muted, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>Institutions and solo educators are governed by distinct price-to-resource logic paths.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: 20, border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', gap: 12, color: P.cta, marginBottom: 12 }}>
                            <Activity size={20} strokeWidth={2.5} />
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>Resource Caps</h4>
                        </div>
                        <p style={{ fontSize: 12, color: P.muted, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>Automated enforcement of student and teacher limits occurs at the database trigger layer.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: 20, border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', gap: 12, color: P.success, marginBottom: 12 }}>
                            <Zap size={20} strokeWidth={2.5} />
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>Direct Support</h4>
                        </div>
                        <p style={{ fontSize: 12, color: P.muted, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>Toggling AI Mentor or Adaptive Exams immediately updates API capabilities across nodes.</p>
                    </div>
                </div>
            )}
            {/* PLAN MODAL */}
            {showPlanModal && (
                <Modal title={planForm.id ? "Edit Enterprise Architecture" : "Define New Service Tier"} onClose={() => setShowPlanModal(false)} onSubmit={handleSavePlan} saving={saving} saveText={planForm.id ? "Update Architecture" : "Deploy System Tier"}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <InputField label="Plan Descriptor" value={planForm.name} onChange={(v: string) => setPlanForm({ ...planForm, name: v })} placeholder="e.g. Master Gold" />
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 850, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Category</label>
                                <select value={planForm.type} onChange={e => setPlanForm({ ...planForm, type: e.target.value })} className="focus-ring" style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', background: '#fff', fontWeight: 600, appearance: 'none' }}>
                                    <option value="institute">Enterprise Institutes</option>
                                    <option value="personal_teacher">Solo Educators</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <InputField label="Base Multiplier (INR)" type="number" value={planForm.price} onChange={(v: string) => setPlanForm({ ...planForm, price: Number(v) })} />
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 850, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Cycle</label>
                                <select value={planForm.billing_cycle} onChange={e => setPlanForm({ ...planForm, billing_cycle: e.target.value })} className="focus-ring" style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', background: '#fff', fontWeight: 600, appearance: 'none' }}>
                                    <option value="monthly">Monthly Settlement</option>
                                    <option value="yearly">Annual Bulk Settlement</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <InputField label="Max Node Students" type="number" value={planForm.max_students} onChange={(v: string) => setPlanForm({ ...planForm, max_students: Number(v) })} />
                            <InputField label="Max Node Staff" type="number" value={planForm.max_teachers} onChange={(v: string) => setPlanForm({ ...planForm, max_teachers: Number(v) })} />
                        </div>
                        <div style={{ marginTop: 12, padding: '20px', background: P.bg, borderRadius: 20 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: P.dark, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Capabilities</label>
                            <FeatureToggle label="Generative AI Engine" checked={planForm.features.ai_mentor} onChange={(v: boolean) => setPlanForm({ ...planForm, features: { ...planForm.features, ai_mentor: v } })} />
                            <FeatureToggle label="Adaptive & Proctor Module" checked={planForm.features.adaptive_exam} onChange={(v: boolean) => setPlanForm({ ...planForm, features: { ...planForm.features, adaptive_exam: v } })} />
                            <FeatureToggle label="Bespoke Node Branding" checked={planForm.features.white_label} onChange={(v: boolean) => setPlanForm({ ...planForm, features: { ...planForm.features, white_label: v } })} />
                        </div>
                        <div style={{ marginTop: 24 }}>
                            <FeatureToggle label="Tier Visibility & Intake Active" checked={planForm.is_active} onChange={(v: boolean) => setPlanForm({ ...planForm, is_active: v })} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
