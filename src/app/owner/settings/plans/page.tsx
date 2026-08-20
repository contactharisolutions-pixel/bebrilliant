'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
    Plus, Save, Check, Loader2, X, Activity, Award, Bot,
    Shield, Users, Database, Cpu, Mail, FileText, CheckCircle,
    TrendingUp, RefreshCw, AlertTriangle, Key, Pencil, Settings,
    CreditCard, DollarSign, Package, Layers, Search, Filter, Trash2
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

type SubscriptionPlan = {
    id: string
    name: string
    type: 'institute' | 'personal_teacher'
    price: number
    billing_cycle: 'monthly' | 'yearly'
    max_students: number
    max_teachers: number
    max_storage_gb: number
    max_ai_tokens: number
    features: {
        ai_mentor?: boolean
        adaptive_exam?: boolean
        white_label?: boolean
        [key: string]: boolean | undefined
    }
    is_active: boolean
}

type TenantSubscription = {
    id: string
    tenant_id: string
    plan_name?: string
    plan_type?: string
    amount: number
    billing_cycle: string
    start_date: string
    end_date: string
    status: 'active' | 'cancelled' | 'expired'
    limit_overrides?: {
        max_students?: number
        max_teachers?: number
        max_storage_gb?: number
        max_ai_tokens?: number
        is_white_label?: boolean
    }
    tenants?: {
        id: string
        name: string
        email: string
    }
}

type Invoice = {
    id: string
    invoice_no: string
    tenant_id: string
    amount: number
    total_amount?: number
    base_amount?: number
    discount_amount?: number
    promo_code?: string
    status: 'paid' | 'pending' | 'failed'
    created_at: string
    tenants?: {
        name: string
    }
}

type ExtraPack = {
    id: string
    name: string
    price: number
    billing_cycle: string
    resource_type: 'teachers' | 'students' | 'storage_gb' | 'ai_tokens'
    resource_value: number
    is_active: boolean
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
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
            {isOk ? <CheckCircle size={20} color={P.success} /> : <AlertTriangle size={20} color={P.error} />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}><X size={14} /></button>
        </div>
    )
}

export default function SubscriptionPlansManager() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [addons, setAddons] = useState<ExtraPack[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState<'tiers' | 'subscriptions' | 'invoices' | 'addons'>('tiers')

    // Search filters
    const [search, setSearch] = useState('')

    // Drawers & Modals States
    const [planDrawerOpen, setPlanDrawerOpen] = useState(false)
    const [editPlanMode, setEditPlanMode] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>({
        name: '', type: 'institute', price: 4999, billing_cycle: 'monthly',
        max_students: 500, max_teachers: 20, max_storage_gb: 50, max_ai_tokens: 1000000,
        features: { ai_mentor: true, adaptive_exam: false, white_label: false },
        is_active: true
    })

    const [overrideDrawerOpen, setOverrideDrawerOpen] = useState(false)
    const [overrideTenant, setOverrideTenant] = useState<any>(null)
    const [overrideForm, setOverrideForm] = useState({
        max_students: 500,
        max_teachers: 20,
        max_storage_gb: 100,
        max_ai_tokens: 5000000,
        is_white_label: false
    })

    const [addonDrawerOpen, setAddonDrawerOpen] = useState(false)
    const [editAddonMode, setEditAddonMode] = useState(false)
    const [currentAddon, setCurrentAddon] = useState<Partial<ExtraPack>>({
        name: '', price: 499, billing_cycle: 'monthly',
        resource_type: 'teachers', resource_value: 5, is_active: true
    })

    const [actionSaving, setActionSaving] = useState(false)

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true)
        else setRefreshing(true)

        try {
            const res = await fetch('/api/owner/billing')
            const data = await res.json()
            if (res.ok) {
                setPlans(data.plans || [])
                setSubscriptions(data.subscriptions || [])
                setInvoices(data.invoices || [])
                setAddons(data.addons || [])
            }
        } catch (e) {
            showToast('Failed sync subscription billing data.', 'error')
        } finally {
            setIsLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Save or Edit Plan
    const handleSavePlan = async () => {
        if (!currentPlan.name?.trim()) return showToast('Please enter a plan name.', 'error')
        setActionSaving(true)
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: editPlanMode ? 'UPDATE_PLAN' : 'CREATE_PLAN',
                    payload: currentPlan
                })
            })
            if (!res.ok) throw new Error('Failed to save subscription plan details')
            showToast(editPlanMode ? 'Subscription plan updated successfully.' : 'New subscription plan created successfully.', 'success')
            setPlanDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    // Save dynamic quota override
    const handleSaveOverride = async () => {
        if (!overrideTenant) return
        setActionSaving(true)
        try {
            const res = await fetch('/api/owner/finance/plans/overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: overrideTenant.id,
                    limit_overrides: overrideForm
                })
            })
            if (!res.ok) throw new Error('Failed setting limit overrides')
            showToast(`Custom limits applied to ${overrideTenant.name} successfully.`, 'success')
            setOverrideDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    // Save or edit addon
    const handleSaveAddon = async () => {
        if (!currentAddon.name?.trim()) return showToast('Please enter an extra pack name.', 'error')
        setActionSaving(true)
        try {
            const method = editAddonMode ? 'PATCH' : 'POST'
            const res = await fetch('/api/owner/finance/plans/addons', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentAddon)
            })
            if (!res.ok) throw new Error('Extra pack save failed')
            showToast(editAddonMode ? 'Extra add-on pack updated.' : 'Extra add-on pack created.', 'success')
            setAddonDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    // Confirm Payment for Invoice
    const handleConfirmPayment = async (invoiceId: string) => {
        if (!confirm('Mark this invoice as PAID and extend the institute subscription?')) return
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CONFIRM_PAYMENT',
                    payload: { invoice_id: invoiceId }
                })
            })
            if (!res.ok) throw new Error('Payment confirmation failed')
            showToast('Invoice marked as PAID and subscription extended.', 'success')
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        }
    }

    // Revoke subscription
    const handleRevokeSubscription = async (subId: string) => {
        if (!confirm('Cancel and revoke this institute subscription?')) return
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'REVOKE_SUBSCRIPTION',
                    payload: { id: subId }
                })
            })
            if (!res.ok) throw new Error('Revoke subscription failed')
            showToast('Institute subscription revoked successfully.', 'success')
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        }
    }

    // Open override form
    const openOverride = (tenant: any, overrides: any) => {
        setOverrideTenant(tenant)
        setOverrideForm({
            max_students: overrides?.max_students ?? 500,
            max_teachers: overrides?.max_teachers ?? 20,
            max_storage_gb: overrides?.max_storage_gb ?? 100,
            max_ai_tokens: overrides?.max_ai_tokens ?? 5000000,
            is_white_label: overrides?.is_white_label ?? false
        })
        setOverrideDrawerOpen(true)
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
                <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

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
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Subscription Plans</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>Manage subscription plans, institute limits, invoices, and extra add-on packs.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => fetchData(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync Plans
                    </button>
                    {activeTab === 'tiers' && (
                        <button onClick={() => { setEditPlanMode(false); setCurrentPlan({ name: '', type: 'institute', price: 4999, billing_cycle: 'monthly', max_students: 500, max_teachers: 20, max_storage_gb: 50, max_ai_tokens: 1000000, features: { ai_mentor: true, adaptive_exam: false, white_label: false }, is_active: true }); setPlanDrawerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={18} strokeWidth={3} /> Add New Plan
                        </button>
                    )}
                    {activeTab === 'addons' && (
                        <button onClick={() => { setEditAddonMode(false); setCurrentAddon({ name: '', price: 499, billing_cycle: 'monthly', resource_type: 'teachers', resource_value: 5, is_active: true }); setAddonDrawerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={18} strokeWidth={3} /> Create Extra Pack
                        </button>
                    )}
                </div>
            </div>

            {/* KPI METRICS OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={CreditCard} title="Active Pricing Plans" value={String(plans.filter(p => p.is_active).length)} color={P.brand} />
                <KpiCard icon={Users} title="Subscribed Institutes" value={String(subscriptions.filter(s => s.status === 'active').length)} color="#059669" />
                <KpiCard icon={FileText} title="Paid Invoices" value={String(invoices.filter(i => i.status === 'paid').length)} color="#7C3AED" />
                <KpiCard icon={Package} title="Extra Add-On Packs" value={String(addons.filter(a => a.is_active).length)} color="#EA580C" />
            </div>

            {/* NAVIGATION TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 4, marginBottom: 28, width: 'fit-content' }}>
                {[
                    { key: 'tiers', label: 'Pricing Plans', count: plans.length },
                    { key: 'subscriptions', label: 'Institute Subscriptions', count: subscriptions.length },
                    { key: 'invoices', label: 'Invoices', count: invoices.length },
                    { key: 'addons', label: 'Extra Add-On Packs', count: addons.length }
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setActiveTab(t.key as any); setSearch(''); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            background: activeTab === t.key ? P.brand : 'transparent',
                            color: activeTab === t.key ? '#fff' : P.muted, transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                        {t.count !== undefined && (
                            <span style={{ background: activeTab === t.key ? '#ffffff30' : P.bg, color: activeTab === t.key ? '#fff' : P.dark, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 900 }}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: PRICING PLANS ── */}
            {activeTab === 'tiers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
                    {plans.map(plan => (
                        <div key={plan.id} style={{ background: '#fff', border: `2px solid ${P.border}`, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                                        {plan.type === 'institute' ? 'SCHOOL / INSTITUTE' : 'INDIVIDUAL TEACHER'}
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark }}>{plan.name}</h3>
                                </div>
                                <button onClick={() => { setCurrentPlan(plan); setEditPlanMode(true); setPlanDrawerOpen(true); }} style={{ background: P.bg, border: `1px solid ${P.border}`, width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Plan">
                                    <Pencil size={15} color={P.brand} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                                <span style={{ fontSize: 32, fontWeight: 950, color: P.dark, letterSpacing: '-0.03em' }}>₹{Number(plan.price).toLocaleString('en-IN')}</span>
                                <span style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0', borderTop: `1px solid ${P.border}`, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                                    <Users size={16} color={P.brand} /> {plan.max_students} Students limit
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                                    <Shield size={16} color={P.brand} /> {plan.max_teachers} Teachers limit
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                                    <Database size={16} color={P.brand} /> {plan.max_storage_gb || 50} GB Storage space
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                                    <Cpu size={16} color={P.brand} /> {(plan.max_ai_tokens || 1000000).toLocaleString('en-IN')} Smart feature tokens
                                </div>

                                {Object.entries(plan.features || {}).map(([feat, active]) => active ? (
                                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#059669', fontWeight: 800 }}>
                                        <Check size={16} strokeWidth={3} /> {feat === 'ai_mentor' ? 'AI study assistant' : feat === 'adaptive_exam' ? 'Online proctored exams' : 'Custom platform branding'}
                                    </div>
                                ) : null)}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${P.border}` }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: plan.is_active ? '#059669' : P.muted }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: plan.is_active ? '#059669' : P.muted }} />
                                    {plan.is_active ? 'ACTIVE' : 'ARCHIVED'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB 2: INSTITUTE SUBSCRIPTIONS ── */}
            {activeTab === 'subscriptions' && (
                <div>
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={16} color={P.muted} />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search institute subscriptions by institute name or plan..." 
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} 
                        />
                        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={P.muted} /></button>}
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                    {['Institute Name', 'Subscription Detail', 'Billing Period', 'Limits & Overrides', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.filter(s => !search || s.tenants?.name?.toLowerCase().includes(search.toLowerCase()) || s.plan_name?.toLowerCase().includes(search.toLowerCase())).map(item => (
                                    <tr key={item.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{item.tenants?.name || 'Institute Account'}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{item.tenants?.email || 'Registered Tenant'}</div>
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: P.brand }}>{item.plan_name || 'Standard Plan'}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>₹{Number(item.amount).toLocaleString('en-IN')} / {item.billing_cycle || 'monthly'}</div>
                                        </td>
                                        <td style={{ padding: '18px 24px', fontSize: 12, color: P.dark, fontWeight: 700 }}>
                                            <div>Start: {new Date(item.start_date).toLocaleDateString('en-IN')}</div>
                                            <div style={{ color: P.muted, fontSize: 11 }}>Ends: {new Date(item.end_date).toLocaleDateString('en-IN')}</div>
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            {item.limit_overrides && Object.keys(item.limit_overrides).length > 0 ? (
                                                <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 800 }}>
                                                    <div>Custom: {item.limit_overrides.max_students} Students</div>
                                                    <div>Staff: {item.limit_overrides.max_teachers} Teachers</div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Standard Plan Limits</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <span style={{ background: item.status === 'active' ? '#ECFDF5' : '#FEF2F2', color: item.status === 'active' ? '#059669' : '#DC2626', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => openOverride(item.tenants, item.limit_overrides)} style={{ padding: '8px 14px', background: P.brandBg, border: `1px solid ${P.brand}20`, borderRadius: 10, color: P.brand, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                    Change Custom Limits
                                                </button>
                                                {item.status === 'active' && (
                                                    <button onClick={() => handleRevokeSubscription(item.id)} style={{ padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB 3: INVOICES ── */}
            {activeTab === 'invoices' && (
                <div>
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={16} color={P.muted} />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search invoices by invoice number or institute..." 
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} 
                        />
                        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={P.muted} /></button>}
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                    {['Invoice Number', 'Institute Name', 'Total Amount (GST 18%)', 'Discount Code', 'Date Issued', 'Status', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.filter(i => !search || i.invoice_no?.toLowerCase().includes(search.toLowerCase()) || i.tenants?.name?.toLowerCase().includes(search.toLowerCase())).map(item => (
                                    <tr key={item.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                        <td style={{ padding: '18px 24px', fontSize: 13, fontWeight: 900, color: P.dark, fontFamily: 'monospace' }}>{item.invoice_no || 'INV-' + item.id.substring(0, 8)}</td>
                                        <td style={{ padding: '18px 24px', fontSize: 13, fontWeight: 800, color: P.dark }}>{item.tenants?.name || 'General Institute'}</td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 950, color: P.dark }}>₹{Number(item.total_amount || item.amount).toLocaleString('en-IN')}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Base: ₹{Number(item.base_amount || item.amount).toLocaleString('en-IN')}</div>
                                        </td>
                                        <td style={{ padding: '18px 24px', fontSize: 12, fontWeight: 700 }}>
                                            {item.promo_code ? <span style={{ color: '#7C3AED' }}>{item.promo_code} (-₹{item.discount_amount})</span> : <span style={{ color: P.muted }}>—</span>}
                                        </td>
                                        <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 700 }}>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <span style={{ background: item.status === 'paid' ? '#ECFDF5' : '#FFFBEB', color: item.status === 'paid' ? '#059669' : '#D97706', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 24px' }}>
                                            {item.status === 'pending' && (
                                                <button onClick={() => handleConfirmPayment(item.id)} style={{ padding: '8px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, color: '#059669', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                    Confirm Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB 4: EXTRA ADD-ON PACKS ── */}
            {activeTab === 'addons' && (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                {['Extra Pack Name', 'Price Rate', 'Resource Added', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {addons.map(item => (
                                <tr key={item.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                    <td style={{ padding: '18px 24px', fontSize: 14, fontWeight: 900, color: P.dark }}>{item.name}</td>
                                    <td style={{ padding: '18px 24px', fontSize: 13, fontWeight: 800, color: P.dark }}>₹{item.price} / {item.billing_cycle || 'monthly'}</td>
                                    <td style={{ padding: '18px 24px', fontSize: 13, fontWeight: 800, color: P.brand }}>
                                        +{item.resource_value} {item.resource_type === 'teachers' ? 'Teachers Limit' : item.resource_type === 'students' ? 'Students Limit' : item.resource_type === 'storage_gb' ? 'Storage Space (GB)' : 'Smart Feature Tokens'}
                                    </td>
                                    <td style={{ padding: '18px 24px' }}>
                                        <span style={{ background: item.is_active ? '#ECFDF5' : P.bg, color: item.is_active ? '#059669' : P.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '18px 24px' }}>
                                        <button onClick={() => { setCurrentAddon(item); setEditAddonMode(true); setAddonDrawerOpen(true); }} style={{ padding: '8px 14px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10, color: P.dark, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                            Configure Pack
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── DRAWER: ADD / EDIT PLAN ── */}
            <SideDrawer
                isOpen={planDrawerOpen}
                onClose={() => setPlanDrawerOpen(false)}
                title={editPlanMode ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '28px 32px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plan Name</label>
                        <input value={currentPlan.name} onChange={e => setCurrentPlan({ ...currentPlan, name: e.target.value })} placeholder="e.g. Pro Institute Plan" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price (₹)</label>
                            <input type="number" value={currentPlan.price} onChange={e => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Target Scope</label>
                            <select value={currentPlan.type} onChange={e => setCurrentPlan({ ...currentPlan, type: e.target.value as any })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                                <option value="institute">School / Institute</option>
                                <option value="personal_teacher">Individual Teacher</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Limit</label>
                            <input type="number" value={currentPlan.max_students} onChange={e => setCurrentPlan({ ...currentPlan, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Teacher Limit</label>
                            <input type="number" value={currentPlan.max_teachers} onChange={e => setCurrentPlan({ ...currentPlan, max_teachers: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Storage Space (GB)</label>
                            <input type="number" value={currentPlan.max_storage_gb} onChange={e => setCurrentPlan({ ...currentPlan, max_storage_gb: parseInt(e.target.value) || 50 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Smart Feature Tokens</label>
                            <input type="number" value={currentPlan.max_ai_tokens} onChange={e => setCurrentPlan({ ...currentPlan, max_ai_tokens: parseInt(e.target.value) || 1000000 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.dark, marginBottom: 12, textTransform: 'uppercase' }}>Available Features Checklist</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { key: 'ai_mentor', label: 'AI study assistant' },
                                { key: 'adaptive_exam', label: 'Online proctored exams' },
                                { key: 'white_label', label: 'Custom platform branding' }
                            ].map(f => (
                                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: P.dark }}>
                                    <input type="checkbox" checked={currentPlan.features?.[f.key] || false} onChange={e => setCurrentPlan({ ...currentPlan, features: { ...currentPlan.features, [f.key]: e.target.checked } })} style={{ width: 16, height: 16, accentColor: P.brand }} />
                                    {f.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                        <button onClick={() => setPlanDrawerOpen(false)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSavePlan} disabled={actionSaving} style={{ flex: 2, padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Plan
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── DRAWER: CHANGE CUSTOM LIMITS OVERRIDES ── */}
            <SideDrawer
                isOpen={overrideDrawerOpen}
                onClose={() => setOverrideDrawerOpen(false)}
                title="Change Custom Limits"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '28px 32px' }}>
                    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 14, padding: 16, fontSize: 12, color: '#92400E', fontWeight: 700, display: 'flex', gap: 10 }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>These custom limits will immediately override plan default limits for {overrideTenant?.name}.</span>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom Student Limit</label>
                        <input type="number" value={overrideForm.max_students} onChange={e => setOverrideForm({ ...overrideForm, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom Teacher Limit</label>
                        <input type="number" value={overrideForm.max_teachers} onChange={e => setOverrideForm({ ...overrideForm, max_teachers: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Storage Limit (GB)</label>
                        <input type="number" value={overrideForm.max_storage_gb} onChange={e => setOverrideForm({ ...overrideForm, max_storage_gb: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Smart Tokens Limit</label>
                        <input type="number" value={overrideForm.max_ai_tokens} onChange={e => setOverrideForm({ ...overrideForm, max_ai_tokens: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: P.dark }}>
                        <input type="checkbox" checked={overrideForm.is_white_label} onChange={e => setOverrideForm({ ...overrideForm, is_white_label: e.target.checked })} style={{ width: 16, height: 16, accentColor: P.brand }} />
                        Enable Custom Platform Branding
                    </label>

                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                        <button onClick={() => setOverrideDrawerOpen(false)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSaveOverride} disabled={actionSaving} style={{ flex: 2, padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />} Apply Override
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── DRAWER: EXTRA ADD-ON PACKS ── */}
            <SideDrawer
                isOpen={addonDrawerOpen}
                onClose={() => setAddonDrawerOpen(false)}
                title={editAddonMode ? 'Configure Extra Add-On Pack' : 'Create Extra Add-On Pack'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '28px 32px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Extra Pack Name</label>
                        <input value={currentAddon.name} onChange={e => setCurrentAddon({ ...currentAddon, name: e.target.value })} placeholder="e.g. Extra 5 Teachers Pack" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price (₹)</label>
                            <input type="number" value={currentAddon.price} onChange={e => setCurrentAddon({ ...currentAddon, price: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resource Type</label>
                            <select value={currentAddon.resource_type} onChange={e => setCurrentAddon({ ...currentAddon, resource_type: e.target.value as any })} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                                <option value="teachers">Teachers Limit</option>
                                <option value="students">Students Limit</option>
                                <option value="storage_gb">Storage Space (GB)</option>
                                <option value="ai_tokens">Smart Tokens Pack</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Added Value Amount</label>
                        <input type="number" value={currentAddon.resource_value} onChange={e => setCurrentAddon({ ...currentAddon, resource_value: parseInt(e.target.value) || 0 })} placeholder="e.g. 5" style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: P.dark }}>
                        <input type="checkbox" checked={currentAddon.is_active} onChange={e => setCurrentAddon({ ...currentAddon, is_active: e.target.checked })} style={{ width: 16, height: 16, accentColor: P.brand }} />
                        Active Immediately
                    </label>

                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20, display: 'flex', gap: 12 }}>
                        <button onClick={() => setAddonDrawerOpen(false)} style={{ flex: 1, padding: 14, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSaveAddon} disabled={actionSaving} style={{ flex: 2, padding: 14, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Extra Pack
                        </button>
                    </div>
                </div>
            </SideDrawer>
        </div>
    )
}
