'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
    Plus, Save, Check, Loader2, X, Activity, Award, Bot,
    Shield, Users, Database, Cpu, Mail, FileText, CheckCircle,
    TrendingUp, RefreshCw, AlertTriangle, Key, Pencil, Settings,
    CreditCard, DollarSign, Package, Layers, Search, Filter, Trash2,
    Copy, Archive, ArchiveRestore, Star, Download, ChevronDown,
    Video, UserCheck, MessageSquare, ShoppingBag, Palette, ShieldCheck,
    BarChart2, ZapOff, Zap, GripVertical, Eye, EyeOff, Tag, Boxes,
    GraduationCap, Building2, Sparkles, CheckCheck
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
    Search, Download, Filter, Copy, Archive, Pencil, Plus,
    GraduationCap, Building2, Sparkles, CheckCheck
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
    yearly_price?: number | null
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

// ─── System Tenant Types (Strictly aligned with platform architecture) ───────
export const SYSTEM_TENANT_TYPES = [
    {
        value: 'school',
        label: 'School (K-12)',
        badgeColor: '#2563EB',
        badgeBg: '#EFF6FF',
        border: '#BFDBFE',
        icon: 'GraduationCap',
        gradient: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)',
        description: 'Comprehensive K-12 Academics, Multi-Branch & OMR'
    },
    {
        value: 'institute',
        label: 'Institute / Coaching',
        badgeColor: '#059669',
        badgeBg: '#ECFDF5',
        border: '#A7F3D0',
        icon: 'Building2',
        gradient: 'linear-gradient(90deg, #059669 0%, #34D399 100%)',
        description: 'Test Prep, Competitive Batches & Coaching Centers'
    },
    {
        value: 'independent_teacher',
        label: 'Independent Teacher',
        badgeColor: '#7C3AED',
        badgeBg: '#F5F3FF',
        border: '#DDD6FE',
        icon: 'UserCheck',
        gradient: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)',
        description: 'Private Tutors, Subject Mentors & Solo Educators'
    },
]

export const getTenantTypeMeta = (type?: string) => {
    if (type === 'school') return SYSTEM_TENANT_TYPES[0]
    if (type === 'institute') return SYSTEM_TENANT_TYPES[1]
    if (type === 'independent_teacher' || type === 'personal_teacher') return SYSTEM_TENANT_TYPES[2]
    return {
        value: type || 'custom',
        label: type || 'Custom',
        badgeColor: P.muted,
        badgeBg: P.bg,
        border: P.border,
        icon: 'Star',
        gradient: `linear-gradient(90deg, ${P.muted}, ${P.muted}88)`,
        description: 'Custom Platform Tier'
    }
}

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
    const [planScopeFilter, setPlanScopeFilter] = useState<'all' | 'school' | 'institute' | 'independent_teacher'>('all')
    const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all')
    const [showArchived, setShowArchived] = useState(false)

    // ── Plan drawer & Billing cycle view ──
    const [billingCycleView, setBillingCycleView] = useState<'monthly' | 'yearly'>('monthly')
    const [planDrawerOpen, setPlanDrawerOpen] = useState(false)
    const [editPlanMode, setEditPlanMode] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>({
        name: '', type: 'institute', price: 4999, yearly_price: 49990, billing_cycle: 'monthly',
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
    const visiblePlans = useMemo(() => {
        return plans.filter(p => {
            const matchesArchive = showArchived ? !p.is_active : p.is_active
            if (!matchesArchive) return false
            if (planScopeFilter !== 'all') {
                const pType = p.type === 'personal_teacher' ? 'independent_teacher' : p.type
                if (pType !== planScopeFilter) return false
            }
            if (search.trim()) {
                const q = search.toLowerCase()
                if (!p.name.toLowerCase().includes(q)) return false
            }
            return true
        })
    }, [plans, showArchived, planScopeFilter, search])

    const scopeCounts = useMemo(() => {
        const base = plans.filter(p => showArchived ? !p.is_active : p.is_active)
        return {
            all: base.length,
            school: base.filter(p => p.type === 'school').length,
            institute: base.filter(p => p.type === 'institute').length,
            independent_teacher: base.filter(p => p.type === 'independent_teacher' || p.type === 'personal_teacher').length,
        }
    }, [plans, showArchived])

    const featuresByCategory = useMemo(() => {
        const map: Record<string, PlatformFeature[]> = {}
        featureRegistry.forEach(f => {
            if (!map[f.category]) map[f.category] = []
            map[f.category].push(f)
        })
        return map
    }, [featureRegistry])

    // ── Helpers ──
    const billingAction = async (action: string, payload: any, successMsg?: string) => {
        setActionSaving(true)
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Operation failed')
            if (successMsg) showToast(successMsg, 'success')
            await fetchData(true)
            return data
        } catch (e: any) {
            showToast(e.message, 'error')
            return null
        } finally {
            setActionSaving(false)
        }
    }

    const handleSavePlan = async () => {
        if (!currentPlan.name?.trim()) return showToast('Plan name is required.', 'error')
        const payload = {
            ...currentPlan,
            price: parseFloat(String(currentPlan.price)) || 0,
            yearly_price: currentPlan.yearly_price != null && String(currentPlan.yearly_price).trim() !== ''
                ? parseFloat(String(currentPlan.yearly_price)) || 0
                : null
        }
        const res = await billingAction(
            editPlanMode ? 'UPDATE_PLAN' : 'CREATE_PLAN',
            payload,
            editPlanMode ? 'Plan updated successfully.' : 'New plan created.'
        )
        if (res) setPlanDrawerOpen(false)
    }

    const handleArchivePlan = (id: string) => {
        if (!confirm('Archive this plan? Existing subscriptions are unaffected.')) return
        billingAction('DELETE_PLAN', { id, hard_delete: false }, 'Plan archived.')
    }

    const handleRestorePlan = (id: string) =>
        billingAction('RESTORE_PLAN', { id }, 'Plan restored and set to active.')

    const handleDuplicatePlan = async (id: string) => {
        const res = await billingAction('DUPLICATE_PLAN', { id })
        if (res?.plan) {
            showToast(`Plan cloned successfully as "${res.plan.name}".`, 'success')
            setCurrentPlan({
                ...res.plan,
                yearly_price: res.plan.yearly_price ?? Math.round(Number(res.plan.price) * 10)
            })
            setEditPlanMode(true)
            setPlanDrawerOpen(true)
        }
    }

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
            showToast(editFeatMode ? `Module "${currentFeat.label}" updated.` : `New module "${currentFeat.label}" registered!`, 'success')

            // If created while plan drawer is open, auto-enable it on current plan!
            if (!editFeatMode && data.feature?.key) {
                setCurrentPlan(prev => ({
                    ...prev,
                    features: { ...(prev.features || {}), [data.feature.key]: true }
                }))
            }

            setFeatDrawerOpen(false)
            fetchData(true)
        } catch (e: any) {
            showToast(e.message, 'error')
        } finally {
            setActionSaving(false)
        }
    }

    const handleDeleteFeature = async (id: string, label: string) => {
        if (!confirm(`Permanently delete "${label}" from available modules? This will remove it from all plans.`)) return
        try {
            const res = await fetch(`/api/owner/billing/features?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Delete failed')
            showToast(`Module "${label}" deleted successfully.`, 'success')

            // Remove from current plan if open
            const feat = featureRegistry.find(f => f.id === id)
            if (feat) {
                setCurrentPlan(prev => {
                    const nextFeats = { ...(prev.features || {}) }
                    delete nextFeats[feat.key]
                    return { ...prev, features: nextFeats }
                })
            }

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
        const meta = getTenantTypeMeta(plan.type)
        const isYearly = billingCycleView === 'yearly'
        const regularMonthly = Number(plan.price) || 0
        const regularAnnual = regularMonthly * 12
        const yearlyPrice = Number(plan.yearly_price ?? Math.round(regularMonthly * 10))
        const annualSavings = Math.max(0, regularAnnual - yearlyPrice)
        const savingsPercent = regularAnnual > 0 ? Math.round((annualSavings / regularAnnual) * 100) : 0
        const effectiveMonthly = Math.round(yearlyPrice / 12)

        return (
            <div style={{
                background: '#FFFFFF',
                border: `1.5px solid ${plan.is_active ? '#E2E8F0' : '#E5E7EB'}`,
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.is_active
                    ? '0 10px 28px -6px rgba(15, 23, 42, 0.05), 0 2px 8px -2px rgba(15, 23, 42, 0.03)'
                    : 'none',
                opacity: plan.is_active ? 1 : 0.72,
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Top Accent Gradient Bar mapped to Tenant Scope */}
                <div style={{
                    height: 5,
                    width: '100%',
                    background: plan.is_active ? meta.gradient : '#CBD5E1'
                }} />

                <div style={{ padding: '24px 26px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Header Row: Tenant Scope Badge + Quick Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                            border: `1px solid ${meta.border}`,
                            borderRadius: 10,
                            padding: '4px 11px',
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                        }}>
                            <DynIcon name={meta.icon} size={13} color={meta.badgeColor} />
                            <span>{meta.label}</span>
                        </div>

                        {/* Squircle Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                                type="button"
                                onClick={() => handleDuplicatePlan(plan.id)}
                                title="Duplicate / Clone Plan"
                                style={{
                                    width: 34,
                                    height: 34,
                                    background: '#F8FAFC',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = P.brand; e.currentTarget.style.background = '#EEF2FF' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' }}
                            >
                                <Copy size={13.5} color="#64748B" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentPlan({
                                        ...plan,
                                        yearly_price: plan.yearly_price ?? Math.round(Number(plan.price) * 10)
                                    })
                                    setEditPlanMode(true)
                                    setPlanDrawerOpen(true)
                                }}
                                title="Edit Plan Configuration"
                                style={{
                                    width: 34,
                                    height: 34,
                                    background: '#F8FAFC',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = P.brand; e.currentTarget.style.background = '#EEF2FF' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' }}
                            >
                                <Pencil size={13.5} color={P.brand} />
                            </button>
                        </div>
                    </div>

                    {/* Plan Name & Tagline */}
                    <div style={{ marginBottom: 18 }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 950,
                            color: '#0F172A',
                            letterSpacing: '-0.03em',
                            lineHeight: 1.2
                        }}>
                            {plan.name}
                        </h3>
                        <p style={{
                            margin: '4px 0 0',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#64748B',
                            lineHeight: 1.4
                        }}>
                            {meta.description}
                        </p>
                    </div>

                    {/* Hero Pricing Section Box */}
                    <div style={{
                        background: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 16,
                        padding: '16px 18px',
                        marginBottom: 18
                    }}>
                        {isYearly ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 32, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em' }}>
                                        ₹{yearlyPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span style={{ color: '#64748B', fontSize: 13, fontWeight: 800 }}>
                                        /year
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>
                                        ₹{effectiveMonthly.toLocaleString('en-IN')}/mo billed annually
                                    </span>
                                    {annualSavings > 0 && (
                                        <span style={{
                                            background: '#ECFDF5',
                                            color: '#047857',
                                            border: '1px solid #A7F3D0',
                                            padding: '2px 8px',
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            <Sparkles size={11} color="#059669" />
                                            Save ₹{annualSavings.toLocaleString('en-IN')} ({savingsPercent}% OFF)
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 32, fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em' }}>
                                        ₹{regularMonthly.toLocaleString('en-IN')}
                                    </span>
                                    <span style={{ color: '#64748B', fontSize: 13, fontWeight: 800 }}>
                                        /month
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>
                                        or ₹{yearlyPrice.toLocaleString('en-IN')}/yr
                                    </span>
                                    {savingsPercent > 0 && (
                                        <span style={{
                                            background: '#ECFDF5',
                                            color: '#047857',
                                            border: '1px solid #A7F3D0',
                                            padding: '2px 8px',
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            <Sparkles size={11} color="#059669" />
                                            Save {savingsPercent}% yearly
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Capacity Limits: 2x2 Resource Matrix (Fully mapped with DB) */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 10
                        }}>
                            <span style={{ fontSize: 10.5, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Capacity Allocations
                            </span>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 10
                        }}>
                            {/* Students */}
                            <div style={{
                                background: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                borderRadius: 12,
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    background: '#EFF6FF',
                                    border: '1px solid #DBEAFE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Users size={15} color="#2563EB" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {plan.max_students.toLocaleString('en-IN')}
                                    </div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>Students</div>
                                </div>
                            </div>

                            {/* Teachers */}
                            <div style={{
                                background: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                borderRadius: 12,
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    background: '#F5F3FF',
                                    border: '1px solid #EDE9FE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Shield size={15} color="#7C3AED" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {plan.max_teachers.toLocaleString('en-IN')}
                                    </div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>
                                        {plan.max_teachers === 1 ? 'Teacher' : 'Teachers'}
                                    </div>
                                </div>
                            </div>

                            {/* Storage */}
                            <div style={{
                                background: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                borderRadius: 12,
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    background: '#ECFDF5',
                                    border: '1px solid #D1FAE5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Database size={15} color="#059669" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {plan.max_storage_gb} GB
                                    </div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>Storage</div>
                                </div>
                            </div>

                            {/* AI Smart Tokens */}
                            <div style={{
                                background: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                borderRadius: 12,
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    background: '#FFFBEB',
                                    border: '1px solid #FEF3C7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Cpu size={15} color="#D97706" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 950, color: '#0F172A', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {Number(plan.max_ai_tokens || 0) >= 1000000
                                            ? `${(Number(plan.max_ai_tokens) / 1000000).toFixed(1)}M`
                                            : (plan.max_ai_tokens || 0).toLocaleString('en-IN')}
                                    </div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>AI Tokens</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Included Feature Modules Section */}
                    <div style={{
                        paddingTop: 16,
                        borderTop: '1px solid #F1F5F9',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10
                        }}>
                            <span style={{ fontSize: 10.5, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Feature Modules
                            </span>
                            <span style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                color: enabledFeatures.length > 0 ? '#4F46E5' : '#94A3B8',
                                background: enabledFeatures.length > 0 ? '#EEF2FF' : '#F1F5F9',
                                padding: '2px 7px',
                                borderRadius: 6
                            }}>
                                {enabledFeatures.length} Active
                            </span>
                        </div>

                        {enabledFeatures.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {enabledFeatures.slice(0, 5).map(f => (
                                    <span
                                        key={f.key}
                                        title={f.description || f.label}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: '#F8FAFC',
                                            color: '#1E293B',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: 8,
                                            padding: '4px 9px',
                                            fontSize: 11,
                                            fontWeight: 700
                                        }}
                                    >
                                        <DynIcon name={f.icon} size={12} color="#4F46E5" />
                                        <span>{f.label}</span>
                                    </span>
                                ))}
                                {enabledFeatures.length > 5 && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        background: '#EEF2FF',
                                        color: '#4F46E5',
                                        border: '1px solid #C7D2FE',
                                        borderRadius: 8,
                                        padding: '4px 9px',
                                        fontSize: 11,
                                        fontWeight: 800
                                    }}>
                                        +{enabledFeatures.length - 5} more
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, fontStyle: 'italic', padding: '4px 0' }}>
                                Essential platform features included
                            </div>
                        )}
                    </div>

                    {/* Card Footer: Status & Quick Action Buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: '1.5px solid #F1F5F9'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: plan.is_active ? '#10B981' : '#94A3B8',
                                boxShadow: plan.is_active ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
                                animation: plan.is_active ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                            }} />
                            <span style={{
                                fontSize: 11,
                                fontWeight: 950,
                                letterSpacing: '0.06em',
                                color: plan.is_active ? '#047857' : '#64748B'
                            }}>
                                {plan.is_active ? 'ACTIVE' : 'ARCHIVED'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {plan.is_active ? (
                                <button
                                    type="button"
                                    onClick={() => handleArchivePlan(plan.id)}
                                    title="Archive plan"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '6px 12px',
                                        background: '#FFF7ED',
                                        border: '1.5px solid #FED7AA',
                                        borderRadius: 9,
                                        color: '#C2410C',
                                        fontSize: 11.5,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#FFEDD5' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFF7ED' }}
                                >
                                    <Archive size={12.5} />
                                    <span>Archive</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleRestorePlan(plan.id)}
                                    title="Restore plan"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '6px 12px',
                                        background: '#ECFDF5',
                                        border: '1.5px solid #A7F3D0',
                                        borderRadius: 9,
                                        color: '#047857',
                                        fontSize: 11.5,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#D1FAE5' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5' }}
                                >
                                    <ArchiveRestore size={12.5} />
                                    <span>Restore</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentPlan({
                                        ...plan,
                                        yearly_price: plan.yearly_price ?? Math.round(Number(plan.price) * 10)
                                    })
                                    setEditPlanMode(true)
                                    setPlanDrawerOpen(true)
                                }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '6px 12px',
                                    background: '#F8FAFC',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: 9,
                                    color: '#0F172A',
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = P.brand; e.currentTarget.style.color = P.brand }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A' }}
                            >
                                <Pencil size={11.5} />
                                <span>Edit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.2)}}`}</style>
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
                            <button onClick={() => { setEditPlanMode(false); setCurrentPlan({ name: '', type: 'institute', price: 4999, yearly_price: 49990, billing_cycle: 'monthly', max_students: 500, max_teachers: 20, max_storage_gb: 50, max_ai_tokens: 1000000, features: {}, is_active: true }); setPlanDrawerOpen(true) }}
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
                    {/* Controls & Scope Filter Toolbar */}
                    <div style={{
                        background: '#FFFFFF',
                        border: `1.5px solid ${P.border}`,
                        borderRadius: 18,
                        padding: '16px 20px',
                        marginBottom: 26,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14
                    }}>
                        {/* Top Bar: Billing Switcher + Search */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 14
                        }}>
                            {/* Billing Cycle Switcher */}
                            <div style={{
                                display: 'inline-flex',
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                padding: 3
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycleView('monthly')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        background: billingCycleView === 'monthly' ? '#FFFFFF' : 'transparent',
                                        color: billingCycleView === 'monthly' ? '#0F172A' : '#64748B',
                                        boxShadow: billingCycleView === 'monthly' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    Monthly Billing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycleView('yearly')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 7,
                                        background: billingCycleView === 'yearly' ? '#FFFFFF' : 'transparent',
                                        color: billingCycleView === 'yearly' ? '#0F172A' : '#64748B',
                                        boxShadow: billingCycleView === 'yearly' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span>Yearly Billing</span>
                                    <span style={{
                                        background: '#ECFDF5',
                                        color: '#047857',
                                        border: '1px solid #A7F3D0',
                                        fontSize: 10,
                                        fontWeight: 900,
                                        padding: '1px 6px',
                                        borderRadius: 6
                                    }}>
                                        Save up to 20%
                                    </span>
                                </button>
                            </div>

                            {/* Search Plans Input */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#F8FAFC',
                                border: '1.5px solid #E2E8F0',
                                borderRadius: 12,
                                padding: '8px 14px',
                                width: 280,
                                maxWidth: '100%'
                            }}>
                                <Search size={14} color="#64748B" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search plans by name..."
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: '#0F172A',
                                        width: '100%'
                                    }}
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        <X size={13} color="#94A3B8" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bottom Bar: System Tenant Scope Filter Pills */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 10,
                            paddingTop: 12,
                            borderTop: '1px solid #F1F5F9'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
                                    Target Scope:
                                </span>

                                {/* All Plans Filter Pill */}
                                <button
                                    type="button"
                                    onClick={() => setPlanScopeFilter('all')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '5px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${planScopeFilter === 'all' ? P.brand : '#E2E8F0'}`,
                                        background: planScopeFilter === 'all' ? `${P.brand}12` : '#FFFFFF',
                                        color: planScopeFilter === 'all' ? P.brand : '#475569',
                                        fontSize: 12,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span>All Tiers</span>
                                    <span style={{
                                        background: planScopeFilter === 'all' ? P.brand : '#F1F5F9',
                                        color: planScopeFilter === 'all' ? '#FFFFFF' : '#64748B',
                                        fontSize: 10,
                                        fontWeight: 900,
                                        padding: '1px 6px',
                                        borderRadius: 20
                                    }}>
                                        {scopeCounts.all}
                                    </span>
                                </button>

                                {/* School (K-12) */}
                                <button
                                    type="button"
                                    onClick={() => setPlanScopeFilter('school')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '5px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${planScopeFilter === 'school' ? '#2563EB' : '#E2E8F0'}`,
                                        background: planScopeFilter === 'school' ? '#EFF6FF' : '#FFFFFF',
                                        color: planScopeFilter === 'school' ? '#2563EB' : '#475569',
                                        fontSize: 12,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <GraduationCap size={13} color={planScopeFilter === 'school' ? '#2563EB' : '#64748B'} />
                                    <span>Schools (K-12)</span>
                                    <span style={{
                                        background: planScopeFilter === 'school' ? '#2563EB' : '#F1F5F9',
                                        color: planScopeFilter === 'school' ? '#FFFFFF' : '#64748B',
                                        fontSize: 10,
                                        fontWeight: 900,
                                        padding: '1px 6px',
                                        borderRadius: 20
                                    }}>
                                        {scopeCounts.school}
                                    </span>
                                </button>

                                {/* Institute / Coaching */}
                                <button
                                    type="button"
                                    onClick={() => setPlanScopeFilter('institute')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '5px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${planScopeFilter === 'institute' ? '#059669' : '#E2E8F0'}`,
                                        background: planScopeFilter === 'institute' ? '#ECFDF5' : '#FFFFFF',
                                        color: planScopeFilter === 'institute' ? '#059669' : '#475569',
                                        fontSize: 12,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Building2 size={13} color={planScopeFilter === 'institute' ? '#059669' : '#64748B'} />
                                    <span>Institutes</span>
                                    <span style={{
                                        background: planScopeFilter === 'institute' ? '#059669' : '#F1F5F9',
                                        color: planScopeFilter === 'institute' ? '#FFFFFF' : '#64748B',
                                        fontSize: 10,
                                        fontWeight: 900,
                                        padding: '1px 6px',
                                        borderRadius: 20
                                    }}>
                                        {scopeCounts.institute}
                                    </span>
                                </button>

                                {/* Independent Teacher */}
                                <button
                                    type="button"
                                    onClick={() => setPlanScopeFilter('independent_teacher')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '5px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${planScopeFilter === 'independent_teacher' ? '#7C3AED' : '#E2E8F0'}`,
                                        background: planScopeFilter === 'independent_teacher' ? '#F5F3FF' : '#FFFFFF',
                                        color: planScopeFilter === 'independent_teacher' ? '#7C3AED' : '#475569',
                                        fontSize: 12,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <UserCheck size={13} color={planScopeFilter === 'independent_teacher' ? '#7C3AED' : '#64748B'} />
                                    <span>Independent Tutors</span>
                                    <span style={{
                                        background: planScopeFilter === 'independent_teacher' ? '#7C3AED' : '#F1F5F9',
                                        color: planScopeFilter === 'independent_teacher' ? '#FFFFFF' : '#64748B',
                                        fontSize: 10,
                                        fontWeight: 900,
                                        padding: '1px 6px',
                                        borderRadius: 20
                                    }}>
                                        {scopeCounts.independent_teacher}
                                    </span>
                                </button>
                            </div>

                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                                Showing <span style={{ color: '#0F172A', fontWeight: 900 }}>{visiblePlans.length}</span> {showArchived ? 'archived' : 'active'} {visiblePlans.length === 1 ? 'plan' : 'plans'}
                            </div>
                        </div>
                    </div>

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
                        <FormField label="Target Scope (System Tenant Type)">
                            <select
                                value={currentPlan.type === 'personal_teacher' ? 'independent_teacher' : (currentPlan.type || 'institute')}
                                onChange={e => setCurrentPlan({ ...currentPlan, type: e.target.value })}
                                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                            >
                                {SYSTEM_TENANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Status">
                            <select value={currentPlan.is_active ? 'active' : 'inactive'} onChange={e => setCurrentPlan({ ...currentPlan, is_active: e.target.value === 'active' })} style={{ ...inputStyle, appearance: 'none' }}>
                                <option value="active">Active</option>
                                <option value="inactive">Draft / Archived</option>
                            </select>
                        </FormField>
                    </div>

                    {/* ── Separate Monthly & Yearly Discounted Pricing ── */}
                    <div style={{
                        background: '#F8FAFC',
                        border: `1.5px solid ${P.border}`,
                        borderRadius: 16,
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Tag size={14} color={P.brand} />
                                <span style={{ fontSize: 11, fontWeight: 900, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Pricing Structure
                                </span>
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: P.brand, background: `${P.brand}12`, padding: '2px 8px', borderRadius: 6 }}>
                                Separate Monthly &amp; Yearly Rates
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <FormField label="Monthly Price (₹ / month)">
                                <input
                                    type="number"
                                    value={currentPlan.price ?? ''}
                                    onChange={e => {
                                        const mPrice = parseFloat(e.target.value) || 0
                                        const oldM = currentPlan.price || 0
                                        // If yearly was default ~10x or not customized, keep in sync with ~17% off / 2 months free
                                        const autoYearly = (!currentPlan.yearly_price || currentPlan.yearly_price === oldM * 10)
                                            ? Math.round(mPrice * 10)
                                            : currentPlan.yearly_price
                                        setCurrentPlan({ ...currentPlan, price: mPrice, yearly_price: autoYearly })
                                    }}
                                    placeholder="e.g. 1999"
                                    style={inputStyle}
                                />
                            </FormField>

                            <FormField label="Yearly Discounted Price (₹ / year)">
                                <input
                                    type="number"
                                    value={currentPlan.yearly_price ?? ''}
                                    onChange={e => setCurrentPlan({ ...currentPlan, yearly_price: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 19990"
                                    style={inputStyle}
                                />
                            </FormField>
                        </div>

                        {/* Live Savings & Discount Analysis */}
                        {Number(currentPlan.price) > 0 && (
                            <div style={{
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: 12,
                                padding: '10px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontWeight: 800, color: '#065F46' }}>
                                    <span>Regular 12-Month Total: ₹{(Number(currentPlan.price) * 12).toLocaleString('en-IN')}</span>
                                    {Number(currentPlan.yearly_price) > 0 && Number(currentPlan.yearly_price) < Number(currentPlan.price) * 12 ? (
                                        <span style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 900 }}>
                                            Save ₹{((Number(currentPlan.price) * 12) - Number(currentPlan.yearly_price)).toLocaleString('en-IN')} ({Math.round((((Number(currentPlan.price) * 12) - Number(currentPlan.yearly_price)) / (Number(currentPlan.price) * 12)) * 100)}% OFF)
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6B7280', fontSize: 11 }}>No discount on yearly</span>
                                    )}
                                </div>
                                {Number(currentPlan.yearly_price) > 0 && (
                                    <div style={{ fontSize: 11, color: '#047857', fontWeight: 700 }}>
                                        Effective: ₹{Math.round(Number(currentPlan.yearly_price) / 12).toLocaleString('en-IN')} / month when billed annually
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick 1-Click Discount Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: P.muted }}>Quick Presets:</span>
                            {[
                                { label: '2 Months Free (~17% off)', fn: (p: number) => Math.round(p * 10) },
                                { label: '15% Off', fn: (p: number) => Math.round(p * 12 * 0.85) },
                                { label: '20% Off', fn: (p: number) => Math.round(p * 12 * 0.80) },
                                { label: '25% Off', fn: (p: number) => Math.round(p * 12 * 0.75) },
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setCurrentPlan({ ...currentPlan, yearly_price: preset.fn(Number(currentPlan.price) || 0) })}
                                    style={{
                                        padding: '4px 9px',
                                        borderRadius: 8,
                                        background: '#fff',
                                        border: `1px solid ${P.border}`,
                                        fontSize: 10.5,
                                        fontWeight: 800,
                                        color: P.dark,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = P.brand; e.currentTarget.style.color = P.brand }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.dark }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, paddingTop: 6, borderTop: `1px dashed ${P.border}` }}>
                            <FormField label="Default Billing Cycle">
                                <select
                                    value={currentPlan.billing_cycle || 'monthly'}
                                    onChange={e => setCurrentPlan({ ...currentPlan, billing_cycle: e.target.value as any })}
                                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                                >
                                    <option value="monthly">Monthly (Default)</option>
                                    <option value="yearly">Yearly (Default)</option>
                                </select>
                            </FormField>
                        </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Available Feature Modules
                                    <span style={{ marginLeft: 8, fontSize: 10, color: P.muted, textTransform: 'none', fontWeight: 700 }}>
                                        ({featureRegistry.filter(f => currentPlan.features?.[f.key]).length}/{featureRegistry.length} enabled)
                                    </span>
                                </div>
                                <div style={{ fontSize: 10.5, color: P.muted, fontWeight: 600, marginTop: 2 }}>
                                    Toggle for plan, or click ✏️ / 🗑️ to edit or delete module from system
                                </div>
                            </div>

                            {/* Quick Add Module button inside plan drawer */}
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentFeat({
                                        key: '',
                                        label: '',
                                        description: '',
                                        icon: 'Star',
                                        category: 'Core',
                                        sort_order: (featureRegistry.length + 1) * 10
                                    })
                                    setEditFeatMode(false)
                                    setFeatDrawerOpen(true)
                                }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', borderRadius: 10,
                                    background: `${P.brand}12`, color: P.brand,
                                    border: `1.5px solid ${P.brand}40`,
                                    fontSize: 11.5, fontWeight: 900, cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <Plus size={13} strokeWidth={3} /> Add Module
                            </button>
                        </div>

                        {featureRegistry.length === 0 && (
                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, textAlign: 'center', padding: '24px 0', background: P.bg, borderRadius: 12 }}>
                                No feature modules defined. Click "+ Add Module" to register one now.
                            </div>
                        )}

                        {Object.entries(featuresByCategory).map(([cat, feats]) => (
                            <div key={cat} style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{cat}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {feats.map(f => {
                                        const on = !!(currentPlan.features?.[f.key])
                                        return (
                                            <div key={f.key}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    borderRadius: 10,
                                                    border: `1.5px solid ${on ? P.brand : P.border}`,
                                                    background: on ? `${P.brand}10` : '#FAFAFA',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {/* Toggle chip for this plan */}
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPlan({ ...currentPlan, features: { ...(currentPlan.features || {}), [f.key]: !on } })}
                                                    title={on ? `Enabled in this plan (click to disable)` : `Disabled in this plan (click to enable)`}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        padding: '7px 11px', background: 'transparent', border: 'none',
                                                        color: on ? P.brand : P.dark,
                                                        fontSize: 12, fontWeight: 800, cursor: 'pointer'
                                                    }}
                                                >
                                                    <DynIcon name={f.icon} size={13} color={on ? P.brand : P.muted} />
                                                    <span>{f.label}</span>
                                                    {on && <Check size={12} color={P.brand} strokeWidth={3} />}
                                                </button>

                                                {/* Edit module button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setCurrentFeat(f)
                                                        setEditFeatMode(true)
                                                        setFeatDrawerOpen(true)
                                                    }}
                                                    title={`Edit "${f.label}" module settings`}
                                                    style={{
                                                        padding: '7px 7px', background: 'transparent', border: 'none',
                                                        borderLeft: `1px solid ${on ? `${P.brand}30` : P.border}`,
                                                        color: P.muted, cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        transition: 'color 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.color = P.brand)}
                                                    onMouseLeave={(e) => (e.currentTarget.style.color = P.muted)}
                                                >
                                                    <Pencil size={11} />
                                                </button>

                                                {/* Delete module button (for non-system modules) */}
                                                {!f.is_system && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteFeature(f.id, f.label)
                                                        }}
                                                        title={`Delete "${f.label}" from system`}
                                                        style={{
                                                            padding: '7px 7px', background: 'transparent', border: 'none',
                                                            borderLeft: `1px solid ${on ? `${P.brand}30` : P.border}`,
                                                            color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                            transition: 'opacity 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#B91C1C')}
                                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#EF4444')}
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                )}
                                            </div>
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
            <SideDrawer isOpen={featDrawerOpen} onClose={() => setFeatDrawerOpen(false)} title={editFeatMode ? 'Edit Feature Module' : 'Add Platform Module'} zIndex={980}>
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
