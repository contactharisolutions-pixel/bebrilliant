'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
    Plus, Save, Check, Loader2, X, Activity, Award, Bot,
    Shield, Users, Database, Cpu, Mail, FileText, CheckCircle,
    TrendingUp, RefreshCw, AlertTriangle, Key, Pencil, Settings,
    CreditCard, DollarSign, Package, Layers, Search, Filter, Trash2,
    Copy, Archive, ArchiveRestore, Star, Download, ChevronDown,
    Video, UserCheck, MessageSquare, ShoppingBag, Palette, ShieldCheck,
    BarChart2, ZapOff, Zap, GripVertical, Eye, EyeOff, Tag, Boxes
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

// ─── Dynamic Lucide icon lookup ──────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    Bot, Shield, Users, Database, Cpu, Mail, FileText, TrendingUp, Award,
    CreditCard, DollarSign, Package, Layers, Star, Video, UserCheck,
    MessageSquare, ShoppingBag, Palette, ShieldCheck, BarChart2, Zap,
    ZapOff, Tag, Boxes, Activity, Settings, Key, Check, Eye, EyeOff,
    Search, Download, Filter, Copy, Archive, Pencil, Plus
}

function DynIcon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
    const Ic = ICON_MAP[name] ?? Star
    return <Ic size={size} color={color} />
}

// ─── Types ───────────────────────────────────────────────────────────────────
type PlatformFeature = {
    id: string
    key: string
    label: string
    description: string | null
    icon: string
    category: string
    is_system: boolean
    sort_order: number
}

type SubscriptionPlan = {
    id: string
    name: string
    type: 'institute' | 'personal_teacher' | string
    price: number
    billing_cycle: 'monthly' | 'yearly'
    max_students: number
    max_teachers: number
    max_storage_gb: number
    max_ai_tokens: number
    features: Record<string, boolean>
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
    tenants?: { id: string; name: string; email: string }
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
    tenants?: { name: string }
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

const PLAN_TYPES = [
    { value: 'institute', label: 'School / Institute' },
    { value: 'personal_teacher', label: 'Individual Teacher' },
    { value: 'coaching', label: 'Coaching Centre' },
    { value: 'university', label: 'College / University' }
]

const FEATURE_CATEGORIES = ['Core', 'Learning', 'AI & Smart', 'Examinations', 'Reporting', 'Communication', 'Revenue', 'Customisation', 'Advanced']

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4500)
        return () => clearTimeout(t)
    }, [onClose])
    const ok = type === 'success'
    return (
        <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
            background: ok ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${ok ? P.success : P.error}40`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: ok ? '#065F46' : '#991B1B', fontSize: 13, fontWeight: 800,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)', maxWidth: 420
        }}>
            {ok ? <CheckCircle size={20} color={P.success} /> : <AlertTriangle size={20} color={P.error} />}
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
    )
}

// ─── Quota Bar ───────────────────────────────────────────────────────────────
function QuotaBar({ label, used, max, color = P.brand }: { label: string; used: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
    const warn = pct > 85
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: P.muted, marginBottom: 3 }}>
                <span>{label}</span>
                <span style={{ color: warn ? '#DC2626' : P.dark }}>{used}/{max}</span>
            </div>
            <div style={{ height: 5, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: warn ? '#DC2626' : color, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
        </div>
    )
}

// ─── Label input ─────────────────────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
            </label>
            {children}
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: `1.5px solid ${P.border}`, borderRadius: 12,
    fontSize: 13.5, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff', boxSizing: 'border-box',
    transition: 'border-color 0.15s'
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SubscriptionPlansManager() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [addons, setAddons] = useState<ExtraPack[]>([])
    const [featureRegistry, setFeatureRegistry] = useState<PlatformFeature[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    const [activeTab, setActiveTab] = useState<'tiers' | 'subscriptions' | 'invoices' | 'addons' | 'features'>('tiers')
    const [search, setSearch] = useState('')
    const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all')
    const [showArchived, setShowArchived] = useState(false)

    // ── Plan drawer ──
    const [planDrawerOpen, setPlanDrawerOpen] = useState(false)
    const [editPlanMode, setEditPlanMode] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>({
        name: '', type: 'institute', price: 4999, billing_cycle: 'monthly',
        max_students: 500, max_teachers: 20, max_storage_gb: 50, max_ai_tokens: 1000000,
        features: {}, is_active: true
    })

    // ── Override drawer ──
    const [overrideDrawerOpen, setOverrideDrawerOpen] = useState(false)
    const [overrideTenant, setOverrideTenant] = useState<any>(null)
    const [overrideForm, setOverrideForm] = useState({ max_students: 500, max_teachers: 20, max_storage_gb: 100, max_ai_tokens: 5000000, is_white_label: false })

    // ── Addon drawer ──
    const [addonDrawerOpen, setAddonDrawerOpen] = useState(false)
    const [editAddonMode, setEditAddonMode] = useState(false)
    const [currentAddon, setCurrentAddon] = useState<Partial<ExtraPack>>({ name: '', price: 499, billing_cycle: 'monthly', resource_type: 'teachers', resource_value: 5, is_active: true })

    // ── Feature drawer ──
    const [featDrawerOpen, setFeatDrawerOpen] = useState(false)
    const [editFeatMode, setEditFeatMode] = useState(false)
    const [currentFeat, setCurrentFeat] = useState<Partial<PlatformFeature>>({ key: '', label: '', description: '', icon: 'Star', category: 'Core', sort_order: 99 })

    const [actionSaving, setActionSaving] = useState(false)

    // ── Fetch ──
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
                setFeatureRegistry(data.features || [])
            }
        } catch {
            showToast('Failed to sync billing data.', 'error')
        } finally {
            setIsLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Computed ──
    const visiblePlans = useMemo(() =>
        plans.filter(p => showArchived ? !p.is_active : p.is_active),
        [plans, showArchived]
    )

    const featuresByCategory = useMemo(() => {
        const map: Record<string, PlatformFeature[]> = {}
        featureRegistry.forEach(f => {
            if (!map[f.category]) map[f.category] = []
            map[f.category].push(f)
        })
        return map
    }, [featureRegistry])

    // ── Helpers ──
    const billingAction = async (action: string, payload: any, successMsg: string) => {
        setActionSaving(true)
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Operation failed')
            showToast(successMsg, 'success')
            fetchData(true)
            return true
        } catch (e: any) {
            showToast(e.message, 'error')
            return false
        } finally {
            setActionSaving(false)
        }
    }

    const handleSavePlan = async () => {
        if (!currentPlan.name?.trim()) return showToast('Plan name is required.', 'error')
        const ok = await billingAction(
            editPlanMode ? 'UPDATE_PLAN' : 'CREATE_PLAN',
            currentPlan,
            editPlanMode ? 'Plan updated successfully.' : 'New plan created.'
        )
        if (ok) setPlanDrawerOpen(false)
    }

    const handleArchivePlan = (id: string) => {
        if (!confirm('Archive this plan? Existing subscriptions are unaffected.')) return
        billingAction('DELETE_PLAN', { id, hard_delete: false }, 'Plan archived.')
    }

    const handleRestorePlan = (id: string) =>
        billingAction('RESTORE_PLAN', { id }, 'Plan restored and set to active.')

    const handleDuplicatePlan = (id: string) =>
        billingAction('DUPLICATE_PLAN', { id }, 'Plan duplicated as draft (inactive).')

    // Override uses its own dedicated route (not the generic billing action)
    const handleOverrideSave = async () => {
        if (!overrideTenant) return
        setActionSaving(true)
        try {
            const res = await fetch('/api/owner/finance/plans/overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: overrideTenant.id, limit_overrides: overrideForm })
            })
            if (!res.ok) throw new Error('Limit override failed')
            showToast(`Custom limits applied to ${overrideTenant.name}.`, 'success')
            setOverrideDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    const handleSaveAddon = async () => {
        if (!currentAddon.name?.trim()) return showToast('Pack name is required.', 'error')
        setActionSaving(true)
        try {
            const method = editAddonMode ? 'PATCH' : 'POST'
            const res = await fetch('/api/owner/finance/plans/addons', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentAddon)
            })
            if (!res.ok) throw new Error('Add-on save failed')
            showToast(editAddonMode ? 'Add-on updated.' : 'Add-on created.', 'success')
            setAddonDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    // Feature CRUD
    const handleSaveFeature = async () => {
        if (!currentFeat.key?.trim()) return showToast('Feature key is required.', 'error')
        if (!currentFeat.label?.trim()) return showToast('Feature label is required.', 'error')
        setActionSaving(true)
        try {
            const method = editFeatMode ? 'PATCH' : 'POST'
            const res = await fetch('/api/owner/billing/features', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentFeat)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')
            showToast(editFeatMode ? 'Module updated.' : 'New module added to registry.', 'success')
            setFeatDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    const handleDeleteFeature = async (id: string, label: string) => {
        if (!confirm(`Remove "${label}" from the platform module registry? This won't affect existing plan assignments.`)) return
        try {
            const res = await fetch(`/api/owner/billing/features?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Delete failed')
            showToast('Module removed from registry.', 'success')
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        }
    }

    const handleConfirmPayment = async (invoiceId: string) => {
        if (!confirm('Mark this invoice as PAID and activate subscription?')) return
        billingAction('CONFIRM_PAYMENT', { invoice_id: invoiceId }, 'Invoice confirmed and subscription activated.')
    }

    const handleRevokeSubscription = async (subId: string) => {
        if (!confirm('Cancel and revoke this subscription?')) return
        billingAction('REVOKE_SUBSCRIPTION', { id: subId }, 'Subscription revoked.')
    }

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

    // CSV export
    const exportInvoicesCSV = () => {
        const rows = [
            ['Invoice No', 'Institute', 'Total Amount', 'Promo Code', 'Discount', 'Status', 'Date'],
            ...invoices.map(i => [
                i.invoice_no || i.id.substring(0, 8),
                i.tenants?.name || '',
                i.total_amount || i.amount,
                i.promo_code || '',
                i.discount_amount || 0,
                i.status,
                new Date(i.created_at).toLocaleDateString('en-IN')
            ])
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
        a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
    }

    // ── Loading ──
    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
                <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    // ── Plan card ──────────────────────────────────────────────────────────────
    const PlanCard = ({ plan }: { plan: SubscriptionPlan }) => {
        const enabledFeatures = featureRegistry.filter(f => plan.features?.[f.key])
        return (
            <div style={{
                background: '#fff', border: `2px solid ${plan.is_active ? P.border : '#E5E7EB'}`,
                borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column',
                position: 'relative', boxShadow: plan.is_active ? '0 4px 24px rgba(0,0,0,0.04)' : 'none',
                opacity: plan.is_active ? 1 : 0.65
            }}>
                {/* Type badge */}
                <div style={{ fontSize: 10, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {PLAN_TYPES.find(t => t.value === plan.type)?.label || plan.type}
                </div>

                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: P.dark, lineHeight: 1.2 }}>{plan.name}</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleDuplicatePlan(plan.id)} title="Duplicate plan"
                            style={{ width: 32, height: 32, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Copy size={13} color={P.muted} />
                        </button>
                        <button onClick={() => { setCurrentPlan(plan); setEditPlanMode(true); setPlanDrawerOpen(true) }} title="Edit plan"
                            style={{ width: 32, height: 32, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pencil size={13} color={P.brand} />
                        </button>
                    </div>
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                    <span style={{ fontSize: 34, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>
                        ₹{Number(plan.price).toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>
                        /{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                </div>

                {/* Quotas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 0', borderTop: `1px solid ${P.border}`, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                        <Users size={15} color={P.brand} /> {plan.max_students.toLocaleString()} Students
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                        <Shield size={15} color={P.brand} /> {plan.max_teachers} Teachers
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                        <Database size={15} color={P.brand} /> {plan.max_storage_gb} GB Storage
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.dark, fontWeight: 700 }}>
                        <Cpu size={15} color={P.brand} /> {(plan.max_ai_tokens || 0).toLocaleString('en-IN')} AI Tokens
                    </div>
                </div>

                {/* Feature chips */}
                {enabledFeatures.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 14, borderTop: `1px solid ${P.border}` }}>
                        {enabledFeatures.slice(0, 5).map(f => (
                            <span key={f.key} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: `${P.brand}10`, color: P.brand,
                                borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 800
                            }}>
                                <DynIcon name={f.icon} size={11} color={P.brand} />
                                {f.label}
                            </span>
                        ))}
                        {enabledFeatures.length > 5 && (
                            <span style={{ background: P.bg, color: P.muted, borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 800 }}>
                                +{enabledFeatures.length - 5} more
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${P.border}` }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: plan.is_active ? '#059669' : P.muted }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: plan.is_active ? '#059669' : P.muted }} />
                        {plan.is_active ? 'ACTIVE' : 'ARCHIVED'}
                    </span>
                    {plan.is_active ? (
                        <button onClick={() => handleArchivePlan(plan.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, color: '#C2410C', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            <Archive size={12} /> Archive
                        </button>
                    ) : (
                        <button onClick={() => handleRestorePlan(plan.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, color: '#059669', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            <ArchiveRestore size={12} /> Restore
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── HEADER ──────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand, boxShadow: `0 0 8px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Settings &amp; Controls</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Subscription Plans</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>
                        Manage pricing tiers, feature modules, institute limits, invoices &amp; add-on packs.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => fetchData(true)} disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '11px 18px', fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={14} color={P.brand} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync
                    </button>
                    {activeTab === 'tiers' && (
                        <>
                            <button onClick={() => setShowArchived(v => !v)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: showArchived ? '#FFF7ED' : '#fff', border: `1px solid ${showArchived ? '#FED7AA' : P.border}`, borderRadius: 12, padding: '11px 18px', fontSize: 12, fontWeight: 800, color: showArchived ? '#C2410C' : P.dark, cursor: 'pointer' }}>
                                <Archive size={14} /> {showArchived ? 'Showing Archived' : 'Show Archived'}
                            </button>
                            <button onClick={() => { setEditPlanMode(false); setCurrentPlan({ name: '', type: 'institute', price: 4999, billing_cycle: 'monthly', max_students: 500, max_teachers: 20, max_storage_gb: 50, max_ai_tokens: 1000000, features: {}, is_active: true }); setPlanDrawerOpen(true) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 12, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                                <Plus size={16} strokeWidth={3} /> Add Plan
                            </button>
                        </>
                    )}
                    {activeTab === 'addons' && (
                        <button onClick={() => { setEditAddonMode(false); setCurrentAddon({ name: '', price: 499, billing_cycle: 'monthly', resource_type: 'teachers', resource_value: 5, is_active: true }); setAddonDrawerOpen(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 12, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={16} strokeWidth={3} /> Create Pack
                        </button>
                    )}
                    {activeTab === 'features' && (
                        <button onClick={() => { setEditFeatMode(false); setCurrentFeat({ key: '', label: '', description: '', icon: 'Star', category: 'Core', sort_order: 99 }); setFeatDrawerOpen(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 12, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={16} strokeWidth={3} /> Add Module
                        </button>
                    )}
                    {activeTab === 'invoices' && (
                        <button onClick={exportInvoicesCSV}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '11px 18px', fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                            <Download size={14} color={P.brand} /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* ── KPI ─────────────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18, marginBottom: 32 }}>
                <KpiCard icon={CreditCard} title="Active Plans" value={String(plans.filter(p => p.is_active).length)} color={P.brand} />
                <KpiCard icon={Users} title="Active Institutes" value={String(subscriptions.filter(s => s.status === 'active').length)} color="#059669" />
                <KpiCard icon={FileText} title="Paid Invoices" value={String(invoices.filter(i => i.status === 'paid').length)} color="#7C3AED" />
                <KpiCard icon={Package} title="Add-On Packs" value={String(addons.filter(a => a.is_active).length)} color="#EA580C" />
                <KpiCard icon={Boxes} title="Feature Modules" value={String(featureRegistry.length)} color="#0EA5E9" />
            </div>

            {/* ── TABS ────────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 6, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 16, padding: 4, marginBottom: 28, width: 'fit-content' }}>
                {[
                    { key: 'tiers', label: 'Pricing Plans', count: plans.filter(p => p.is_active).length },
                    { key: 'subscriptions', label: 'Subscriptions', count: subscriptions.length },
                    { key: 'invoices', label: 'Invoices', count: invoices.length },
                    { key: 'addons', label: 'Add-On Packs', count: addons.length },
                    { key: 'features', label: 'Platform Modules', count: featureRegistry.length }
                ].map(t => (
                    <button key={t.key}
                        onClick={() => { setActiveTab(t.key as any); setSearch('') }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            background: activeTab === t.key ? P.brand : 'transparent',
                            color: activeTab === t.key ? '#fff' : P.muted, transition: 'all 0.2s'
                        }}>
                        {t.label}
                        <span style={{ background: activeTab === t.key ? '#ffffff30' : P.bg, color: activeTab === t.key ? '#fff' : P.dark, borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 900 }}>{t.count}</span>
                    </button>
                ))}
            </div>

            {/* ─────────────────────────────────────────────────────────────────
                TAB 1: PRICING PLANS
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'tiers' && (
                <>
                    {visiblePlans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 40px', color: P.muted }}>
                            <Archive size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{showArchived ? 'No archived plans.' : 'No active plans yet.'}</div>
                            <div style={{ fontSize: 14, marginTop: 8 }}>{showArchived ? 'All plans are active.' : 'Click "Add Plan" to create your first pricing tier.'}</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
                            {visiblePlans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
                        </div>
                    )}
                </>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                TAB 2: INSTITUTE SUBSCRIPTIONS
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'subscriptions' && (
                <div>
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 14, padding: '10px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Search size={15} color={P.muted} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by institute name or plan…"
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} />
                        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={13} color={P.muted} /></button>}
                    </div>
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                    {['Institute', 'Plan', 'Billing Period', 'Quota Usage', 'Custom Limits', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions
                                    .filter(s => !search || s.tenants?.name?.toLowerCase().includes(search.toLowerCase()) || s.plan_name?.toLowerCase().includes(search.toLowerCase()))
                                    .map(item => (
                                        <tr key={item.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{item.tenants?.name || 'Institute'}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{item.tenants?.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: P.brand }}>{item.plan_name || 'Custom'}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>₹{Number(item.amount).toLocaleString('en-IN')} / {item.billing_cycle}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 11, color: P.dark, fontWeight: 700 }}>
                                                <div>Start: {new Date(item.start_date).toLocaleDateString('en-IN')}</div>
                                                <div style={{ color: P.muted }}>End: {new Date(item.end_date).toLocaleDateString('en-IN')}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px', minWidth: 140 }}>
                                                <QuotaBar label="Students" used={0} max={item.limit_overrides?.max_students ?? 500} />
                                                <QuotaBar label="Teachers" used={0} max={item.limit_overrides?.max_teachers ?? 20} color="#7C3AED" />
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                {item.limit_overrides && Object.keys(item.limit_overrides).length > 0 ? (
                                                    <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 800 }}>
                                                        <div>👥 {item.limit_overrides.max_students} students</div>
                                                        <div>🧑‍🏫 {item.limit_overrides.max_teachers} teachers</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Plan defaults</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{
                                                    background: item.status === 'active' ? '#ECFDF5' : '#FEF2F2',
                                                    color: item.status === 'active' ? '#059669' : '#DC2626',
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900
                                                }}>{item.status.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => openOverride(item.tenants, item.limit_overrides)}
                                                        style={{ padding: '7px 12px', background: `${P.brand}12`, border: `1px solid ${P.brand}20`, borderRadius: 8, color: P.brand, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                                                        Override
                                                    </button>
                                                    {item.status === 'active' && (
                                                        <button onClick={() => handleRevokeSubscription(item.id)}
                                                            style={{ padding: '7px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
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

            {/* ─────────────────────────────────────────────────────────────────
                TAB 3: INVOICES
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'invoices' && (
                <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <div style={{ flex: 1, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 14, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Search size={15} color={P.muted} />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by invoice number or institute…"
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {(['all', 'paid', 'pending', 'failed'] as const).map(f => (
                                <button key={f} onClick={() => setInvoiceFilter(f)}
                                    style={{
                                        padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${invoiceFilter === f ? P.brand : P.border}`,
                                        background: invoiceFilter === f ? `${P.brand}10` : '#fff',
                                        color: invoiceFilter === f ? P.brand : P.muted,
                                        fontSize: 12, fontWeight: 800, cursor: 'pointer'
                                    }}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                    {['Invoice #', 'Institute', 'Amount (incl. GST)', 'Promo Code', 'Date', 'Status', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {invoices
                                    .filter(i => (invoiceFilter === 'all' || i.status === invoiceFilter) && (!search || i.invoice_no?.toLowerCase().includes(search.toLowerCase()) || i.tenants?.name?.toLowerCase().includes(search.toLowerCase())))
                                    .map(item => (
                                        <tr key={item.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 900, color: P.dark, fontFamily: 'monospace' }}>{item.invoice_no || 'BB-' + item.id.substring(0, 8).toUpperCase()}</td>
                                            <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: P.dark }}>{item.tenants?.name || '—'}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 950, color: P.dark }}>₹{Number(item.total_amount || item.amount).toLocaleString('en-IN')}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Base: ₹{Number(item.base_amount || item.amount).toLocaleString('en-IN')}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700 }}>
                                                {item.promo_code ? <span style={{ color: '#7C3AED' }}>{item.promo_code} (-₹{item.discount_amount})</span> : <span style={{ color: P.muted }}>—</span>}
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 12, color: P.muted, fontWeight: 700 }}>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{
                                                    background: item.status === 'paid' ? '#ECFDF5' : item.status === 'failed' ? '#FEF2F2' : '#FFFBEB',
                                                    color: item.status === 'paid' ? '#059669' : item.status === 'failed' ? '#DC2626' : '#D97706',
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900
                                                }}>{item.status.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                {item.status === 'pending' && (
                                                    <button onClick={() => handleConfirmPayment(item.id)}
                                                        style={{ padding: '7px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, color: '#059669', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                                                        Mark Paid
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

            {/* ─────────────────────────────────────────────────────────────────
                TAB 4: EXTRA ADD-ON PACKS
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'addons' && (
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                {['Pack Name', 'Price', 'Resource', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '14px 22px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {addons.map(item => (
                                <tr key={item.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                    <td style={{ padding: '16px 22px', fontSize: 14, fontWeight: 900, color: P.dark }}>{item.name}</td>
                                    <td style={{ padding: '16px 22px', fontSize: 13, fontWeight: 800, color: P.dark }}>₹{item.price.toLocaleString('en-IN')} / {item.billing_cycle}</td>
                                    <td style={{ padding: '16px 22px', fontSize: 13, fontWeight: 800, color: P.brand }}>
                                        +{item.resource_value.toLocaleString()} {item.resource_type === 'teachers' ? 'Teachers' : item.resource_type === 'students' ? 'Students' : item.resource_type === 'storage_gb' ? 'GB Storage' : 'AI Tokens'}
                                    </td>
                                    <td style={{ padding: '16px 22px' }}>
                                        <span style={{ background: item.is_active ? '#ECFDF5' : P.bg, color: item.is_active ? '#059669' : P.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 22px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => { setCurrentAddon(item); setEditAddonMode(true); setAddonDrawerOpen(true) }}
                                                style={{ padding: '7px 14px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, color: P.dark, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                                                Configure
                                            </button>
                                            <button onClick={async () => {
                                                const r = await fetch('/api/owner/finance/plans/addons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, is_active: !item.is_active }) })
                                                if (r.ok) { showToast(item.is_active ? 'Pack deactivated.' : 'Pack activated.', 'success'); fetchData(true) }
                                            }} style={{ padding: '7px 14px', background: item.is_active ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${item.is_active ? '#FECACA' : '#A7F3D0'}`, borderRadius: 8, color: item.is_active ? '#DC2626' : '#059669', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                                                {item.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                TAB 5: PLATFORM MODULES (Feature Registry)
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'features' && (
                <div>
                    <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Settings size={18} color="#1D4ED8" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#1D4ED8', marginBottom: 3 }}>Dynamic Feature Registry</div>
                            <div style={{ fontSize: 12, color: '#1E3A8A', fontWeight: 600 }}>
                                Every module listed here becomes available as a toggle in your plan configuration drawer. Add new platform capabilities here and instantly assign them to any plan — no code changes required.
                            </div>
                        </div>
                    </div>

                    {Object.entries(featuresByCategory).map(([category, features]) => (
                        <div key={category} style={{ marginBottom: 28 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{category}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                {features.map(feat => (
                                    <div key={feat.id} style={{
                                        background: '#fff', border: `1.5px solid ${P.border}`, borderRadius: 16, padding: '18px 20px',
                                        display: 'flex', alignItems: 'flex-start', gap: 14
                                    }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${P.brand}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <DynIcon name={feat.icon} size={20} color={P.brand} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{feat.label}</span>
                                                {feat.is_system && (
                                                    <span style={{ background: '#F0FDF4', color: '#15803D', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>SYSTEM</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginBottom: 6, wordBreak: 'break-word' }}>{feat.description || '—'}</div>
                                            <code style={{ fontSize: 10, background: P.bg, color: '#6B7280', padding: '2px 7px', borderRadius: 5, fontFamily: 'monospace' }}>{feat.key}</code>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button onClick={() => { setCurrentFeat(feat); setEditFeatMode(true); setFeatDrawerOpen(true) }}
                                                title="Edit module"
                                                style={{ width: 30, height: 30, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Pencil size={12} color={P.brand} />
                                            </button>
                                            {!feat.is_system && (
                                                <button onClick={() => handleDeleteFeature(feat.id, feat.label)}
                                                    title="Remove module"
                                                    style={{ width: 30, height: 30, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Trash2 size={12} color="#DC2626" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                DRAWER: ADD / EDIT PLAN
            ═══════════════════════════════════════════════════════════════ */}
            <SideDrawer isOpen={planDrawerOpen} onClose={() => setPlanDrawerOpen(false)} title={editPlanMode ? 'Edit Subscription Plan' : 'Add Subscription Plan'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px' }}>

                    <FormField label="Plan Name">
                        <input value={currentPlan.name} onChange={e => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                            placeholder="e.g. Pro Institute Plan" style={inputStyle} />
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Price (₹)">
                            <input type="number" value={currentPlan.price} onChange={e => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                        </FormField>
                        <FormField label="Target Scope">
                            <select value={currentPlan.type} onChange={e => setCurrentPlan({ ...currentPlan, type: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                                {PLAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Billing Cycle">
                            <select value={currentPlan.billing_cycle} onChange={e => setCurrentPlan({ ...currentPlan, billing_cycle: e.target.value as any })} style={{ ...inputStyle, appearance: 'none' }}>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </FormField>
                        <FormField label="Status">
                            <select value={currentPlan.is_active ? 'active' : 'inactive'} onChange={e => setCurrentPlan({ ...currentPlan, is_active: e.target.value === 'active' })} style={{ ...inputStyle, appearance: 'none' }}>
                                <option value="active">Active</option>
                                <option value="inactive">Draft / Archived</option>
                            </select>
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Student Limit">
                            <input type="number" value={currentPlan.max_students} onChange={e => setCurrentPlan({ ...currentPlan, max_students: parseInt(e.target.value) || 0 })} style={inputStyle} />
                        </FormField>
                        <FormField label="Teacher Limit">
                            <input type="number" value={currentPlan.max_teachers} onChange={e => setCurrentPlan({ ...currentPlan, max_teachers: parseInt(e.target.value) || 0 })} style={inputStyle} />
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Storage Space (GB)">
                            <input type="number" value={currentPlan.max_storage_gb} onChange={e => setCurrentPlan({ ...currentPlan, max_storage_gb: parseInt(e.target.value) || 50 })} style={inputStyle} />
                        </FormField>
                        <FormField label="Smart Feature Tokens">
                            <input type="number" value={currentPlan.max_ai_tokens} onChange={e => setCurrentPlan({ ...currentPlan, max_ai_tokens: parseInt(e.target.value) || 1000000 })} style={inputStyle} />
                        </FormField>
                    </div>

                    {/* Dynamic Features — grouped by category */}
                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: P.dark, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Available Feature Modules
                            <span style={{ marginLeft: 8, fontSize: 10, color: P.muted, textTransform: 'none', fontWeight: 700 }}>({featureRegistry.filter(f => currentPlan.features?.[f.key]).length}/{featureRegistry.length} enabled)</span>
                        </div>

                        {featureRegistry.length === 0 && (
                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, textAlign: 'center', padding: '20px 0' }}>
                                No feature modules defined. Go to the "Platform Modules" tab to add them.
                            </div>
                        )}

                        {Object.entries(featuresByCategory).map(([cat, feats]) => (
                            <div key={cat} style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{cat}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {feats.map(f => {
                                        const on = !!(currentPlan.features?.[f.key])
                                        return (
                                            <button key={f.key}
                                                onClick={() => setCurrentPlan({ ...currentPlan, features: { ...currentPlan.features, [f.key]: !on } })}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                                                    border: `1.5px solid ${on ? P.brand : P.border}`,
                                                    background: on ? `${P.brand}10` : '#FAFAFA',
                                                    color: on ? P.brand : P.muted,
                                                    fontSize: 12, fontWeight: 800, transition: 'all 0.15s'
                                                }}>
                                                <DynIcon name={f.icon} size={13} color={on ? P.brand : P.muted} />
                                                {f.label}
                                                {on && <Check size={11} color={P.brand} strokeWidth={3} />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 18, display: 'flex', gap: 10 }}>
                        {editPlanMode && (
                            <button onClick={() => handleDuplicatePlan(currentPlan.id!)} disabled={actionSaving}
                                style={{ padding: '13px 16px', background: P.bg, color: P.muted, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Copy size={14} /> Clone
                            </button>
                        )}
                        <button onClick={() => setPlanDrawerOpen(false)} style={{ flex: 1, padding: 13, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSavePlan} disabled={actionSaving}
                            style={{ flex: 2, padding: 13, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Plan
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ═══════════════════════════════════════════════════════════════
                DRAWER: CUSTOM LIMIT OVERRIDES
            ═══════════════════════════════════════════════════════════════ */}
            <SideDrawer isOpen={overrideDrawerOpen} onClose={() => setOverrideDrawerOpen(false)} title={`Custom Limits — ${overrideTenant?.name || 'Institute'}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px 28px' }}>
                    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: 14, fontSize: 12, color: '#92400E', fontWeight: 700, display: 'flex', gap: 10 }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                        <span>These limits will immediately override the plan defaults for this institute only.</span>
                    </div>
                    {[
                        { label: 'Custom Student Limit', field: 'max_students' },
                        { label: 'Custom Teacher Limit', field: 'max_teachers' },
                        { label: 'Custom Storage (GB)', field: 'max_storage_gb' },
                        { label: 'Custom AI Tokens', field: 'max_ai_tokens' }
                    ].map(f => (
                        <FormField key={f.field} label={f.label}>
                            <input type="number" value={(overrideForm as any)[f.field]}
                                onChange={e => setOverrideForm({ ...overrideForm, [f.field]: parseInt(e.target.value) || 0 })}
                                style={inputStyle} />
                        </FormField>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: P.dark }}>
                        <input type="checkbox" checked={overrideForm.is_white_label}
                            onChange={e => setOverrideForm({ ...overrideForm, is_white_label: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: P.brand }} />
                        Enable Custom Platform Branding
                    </label>
                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 16, display: 'flex', gap: 10 }}>
                        <button onClick={() => setOverrideDrawerOpen(false)} style={{ flex: 1, padding: 13, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleOverrideSave} disabled={actionSaving}
                            style={{ flex: 2, padding: 13, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />} Apply Override
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ═══════════════════════════════════════════════════════════════
                DRAWER: EXTRA ADD-ON PACKS
            ═══════════════════════════════════════════════════════════════ */}
            <SideDrawer isOpen={addonDrawerOpen} onClose={() => setAddonDrawerOpen(false)} title={editAddonMode ? 'Configure Add-On Pack' : 'Create Add-On Pack'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px 28px' }}>
                    <FormField label="Pack Name">
                        <input value={currentAddon.name} onChange={e => setCurrentAddon({ ...currentAddon, name: e.target.value })}
                            placeholder="e.g. Extra 5 Teachers" style={inputStyle} />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Price (₹)">
                            <input type="number" value={currentAddon.price} onChange={e => setCurrentAddon({ ...currentAddon, price: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                        </FormField>
                        <FormField label="Resource Type">
                            <select value={currentAddon.resource_type} onChange={e => setCurrentAddon({ ...currentAddon, resource_type: e.target.value as any })} style={{ ...inputStyle, appearance: 'none' }}>
                                <option value="teachers">Teachers Limit</option>
                                <option value="students">Students Limit</option>
                                <option value="storage_gb">Storage Space (GB)</option>
                                <option value="ai_tokens">Smart AI Tokens</option>
                            </select>
                        </FormField>
                    </div>
                    <FormField label="Added Value Amount">
                        <input type="number" value={currentAddon.resource_value} onChange={e => setCurrentAddon({ ...currentAddon, resource_value: parseInt(e.target.value) || 0 })} placeholder="e.g. 5" style={inputStyle} />
                    </FormField>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: P.dark }}>
                        <input type="checkbox" checked={currentAddon.is_active}
                            onChange={e => setCurrentAddon({ ...currentAddon, is_active: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: P.brand }} />
                        Active Immediately
                    </label>
                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 16, display: 'flex', gap: 10 }}>
                        <button onClick={() => setAddonDrawerOpen(false)} style={{ flex: 1, padding: 13, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSaveAddon} disabled={actionSaving}
                            style={{ flex: 2, padding: 13, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Pack
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ═══════════════════════════════════════════════════════════════
                DRAWER: ADD / EDIT PLATFORM FEATURE MODULE
            ═══════════════════════════════════════════════════════════════ */}
            <SideDrawer isOpen={featDrawerOpen} onClose={() => setFeatDrawerOpen(false)} title={editFeatMode ? 'Edit Feature Module' : 'Add Platform Module'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px 28px' }}>
                    <FormField label="Feature Key (unique, no spaces)">
                        <input value={currentFeat.key} onChange={e => setCurrentFeat({ ...currentFeat, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                            placeholder="e.g. parent_portal" disabled={editFeatMode && !!currentFeat.is_system}
                            style={{ ...inputStyle, opacity: editFeatMode && currentFeat.is_system ? 0.5 : 1 }} />
                    </FormField>
                    <FormField label="Display Label">
                        <input value={currentFeat.label} onChange={e => setCurrentFeat({ ...currentFeat, label: e.target.value })}
                            placeholder="e.g. Parent Portal" style={inputStyle} />
                    </FormField>
                    <FormField label="Description (optional)">
                        <textarea value={currentFeat.description || ''} onChange={e => setCurrentFeat({ ...currentFeat, description: e.target.value })}
                            placeholder="Short description shown in plan drawer…"
                            rows={2}
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Lucide Icon Name">
                            <input value={currentFeat.icon} onChange={e => setCurrentFeat({ ...currentFeat, icon: e.target.value })}
                                placeholder="e.g. Users" style={inputStyle} />
                        </FormField>
                        <FormField label="Category">
                            <select value={currentFeat.category} onChange={e => setCurrentFeat({ ...currentFeat, category: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                                {FEATURE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <FormField label="Sort Order">
                        <input type="number" value={currentFeat.sort_order} onChange={e => setCurrentFeat({ ...currentFeat, sort_order: parseInt(e.target.value) || 99 })} style={inputStyle} />
                    </FormField>

                    {currentFeat.icon && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${P.brand}08`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: P.dark }}>
                            <DynIcon name={currentFeat.icon} size={18} color={P.brand} />
                            Preview: {currentFeat.label || 'Module Label'}
                        </div>
                    )}

                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 16, display: 'flex', gap: 10 }}>
                        <button onClick={() => setFeatDrawerOpen(false)} style={{ flex: 1, padding: 13, background: P.bg, color: P.dark, border: `1px solid ${P.border}`, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSaveFeature} disabled={actionSaving}
                            style={{ flex: 2, padding: 13, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Module
                        </button>
                    </div>
                </div>
            </SideDrawer>
        </div>
    )
}
