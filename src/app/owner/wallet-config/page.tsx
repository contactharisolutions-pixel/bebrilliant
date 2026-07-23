'use client'

import { useState, useEffect } from 'react'
import {
    CreditCard, Settings, Save, Loader2, CheckCircle2,
    AlertCircle, School, Building2, User, Plus, Trash2,
    ToggleLeft, ToggleRight, Clock, Sparkles, X, Filter, Search, ChevronLeft, ChevronRight, Activity, Calendar
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

const RULE_TYPE_LABELS = {
    tenant_type: 'Tenant Type',
    specific_tenant: 'Specific Tenant',
    syllabus_enrollment: 'Syllabus Enrollment',
    promotional: 'Promotional'
}

type Rule = {
    id: string
    name: string
    rule_type: 'tenant_type' | 'specific_tenant' | 'syllabus_enrollment' | 'promotional'
    match_value: string
    credits: number
    expiry_days: number | null
    first_time_only: boolean
    is_active: boolean
    created_at: string
}

type Tenant = {
    id: string
    name: string
    type: string
}

type Transaction = {
    id: string
    student_id: string
    tenant_id: string
    credit_type: 'free' | 'paid'
    txn_type: 'credit' | 'debit'
    amount: number
    balance_after: number
    source: string
    notes: string | null
    created_at: string
    user_profiles: {
        first_name: string
        last_name: string
        email: string
    } | null
    tenants: {
        name: string
        type: string
    } | null
}

export default function WalletConfigPage() {
    const [activeTab, setActiveTab] = useState<'rules' | 'bulk' | 'ledger'>('rules')
    
    // Core Rules State
    const [rules, setRules] = useState<Rule[]>([])
    const [loadingRules, setLoadingRules] = useState(true)
    const [savingRule, setSavingRule] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    // Form inputs for new rule
    const [newRule, setNewRule] = useState({
        name: '',
        rule_type: 'tenant_type' as Rule['rule_type'],
        match_value: 'school',
        credits: 100,
        expiry_days: '' as string | number,
        first_time_only: true,
        is_active: true
    })

    // Dropdowns data
    const [tenants, setTenants] = useState<Tenant[]>([])

    // Bulk operations state
    const [bulkForm, setBulkForm] = useState({
        demographicType: 'all', // all or specific_tenant
        tenantId: '',
        amount: 100,
        creditType: 'free' as 'free' | 'paid',
        expiryDays: '' as string | number,
        notes: ''
    })
    const [executingBulk, setExecutingBulk] = useState(false)
    const [bulkResult, setBulkResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

    // Ledger transactions state
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingLedger, setLoadingLedger] = useState(false)
    const [ledgerFilters, setLedgerFilters] = useState({
        source: 'all',
        type: 'all',
        search: '',
        page: 1
    })
    const [ledgerTotal, setLedgerTotal] = useState(0)

    const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Fetch rules and tenants on mount
    useEffect(() => {
        loadRules()
        loadTenants()
    }, [])

    // Reload transactions when filters or page changes
    useEffect(() => {
        if (activeTab === 'ledger') {
            loadLedger()
        }
    }, [activeTab, ledgerFilters.page, ledgerFilters.source, ledgerFilters.type])

    const loadRules = async () => {
        setLoadingRules(true)
        try {
            const r = await fetch('/api/owner/wallet-config/rules')
            const data = await r.json()
            if (Array.isArray(data)) {
                setRules(data)
            }
        } catch (err) {
            console.error("Failed to load rules", err)
        } finally {
            setLoadingRules(false)
        }
    }

    const loadTenants = async () => {
        try {
            const r = await fetch('/api/owner/tenants')
            const data = await r.json()
            if (data && Array.isArray(data.tenants)) {
                setTenants(data.tenants)
                if (data.tenants.length > 0) {
                    setBulkForm(prev => ({ ...prev, tenantId: data.tenants[0].id }))
                }
            }
        } catch (err) {
            console.error("Failed to load tenants", err)
        }
    }

    const loadLedger = async () => {
        setLoadingLedger(true)
        try {
            const query = new URLSearchParams({
                source: ledgerFilters.source,
                type: ledgerFilters.type,
                search: ledgerFilters.search,
                page: String(ledgerFilters.page)
            })
            const r = await fetch(`/api/owner/wallet-config/transactions?${query.toString()}`)
            const data = await r.json()
            if (data && Array.isArray(data.transactions)) {
                setTransactions(data.transactions)
                setLedgerTotal(data.total)
            }
        } catch (err) {
            console.error("Failed to load ledger transactions", err)
        } finally {
            setLoadingLedger(false)
        }
    }

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newRule.name.trim()) return

        setSavingRule(true)
        setAlert(null)
        try {
            const res = await fetch('/api/owner/wallet-config/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newRule,
                    expiry_days: newRule.expiry_days === '' ? null : Number(newRule.expiry_days)
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setAlert({ type: 'success', text: `Rule "${newRule.name}" created successfully.` })
                setShowCreateModal(false)
                // Reset form
                setNewRule({
                    name: '',
                    rule_type: 'tenant_type',
                    match_value: 'school',
                    credits: 100,
                    expiry_days: '',
                    first_time_only: true,
                    is_active: true
                })
                loadRules()
            } else {
                setAlert({ type: 'error', text: data.error || 'Failed to create rule.' })
            }
        } catch (err) {
            setAlert({ type: 'error', text: 'Internal server error.' })
        } finally {
            setSavingRule(false)
        }
    }

    const handleToggleRuleStatus = async (id: string, currentActive: boolean) => {
        try {
            const res = await fetch(`/api/owner/wallet-config/rules/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentActive }),
            })
            if (res.ok) {
                setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentActive } : r))
            }
        } catch (err) {
            console.error("Failed to toggle rule status", err)
        }
    }

    const handleDeleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this custom credit rule?")) return
        try {
            const res = await fetch(`/api/owner/wallet-config/rules/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== id))
            }
        } catch (err) {
            console.error("Failed to delete rule", err)
        }
    }

    const handleExecuteBulk = async (e: React.FormEvent) => {
        e.preventDefault()
        setExecutingBulk(true)
        setBulkResult(null)
        try {
            const demographic = bulkForm.demographicType === 'all'
                ? { type: 'all' }
                : { type: 'specific_tenant', value: bulkForm.tenantId }

            const res = await fetch('/api/owner/wallet-config/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    demographic,
                    amount: bulkForm.amount,
                    credit_type: bulkForm.creditType,
                    expiry_days: bulkForm.creditType === 'free' && bulkForm.expiryDays !== '' ? Number(bulkForm.expiryDays) : null,
                    notes: bulkForm.notes
                })
            })
            const data = await res.json()
            if (res.ok) {
                setBulkResult({ success: true, count: data.count })
                // Reset notes
                setBulkForm(prev => ({ ...prev, notes: '' }))
            } else {
                setBulkResult({ success: false, error: data.error || 'Failed to execute bulk operation.' })
            }
        } catch (err) {
            setBulkResult({ success: false, error: 'Internal server error.' })
        } finally {
            setExecutingBulk(false)
        }
    }

    return (
        <div style={{ padding: '40px 60px', background: P.bg, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES}</style>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={24} color={P.brand} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 30, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Wallet Credit Engine</h1>
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: P.muted, fontWeight: 600 }}>Manage granular FIFO grants, custom promotion rules, and bulk credit distributions.</p>
                        </div>
                    </div>
                </div>
                {activeTab === 'rules' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ padding: '12px 24px', background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 24px ${P.brand}30` }}
                    >
                        <Plus size={16} />
                        Add Custom Rule
                    </button>
                )}
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${P.border}`, marginBottom: 32, paddingBottom: 12 }}>
                {[
                    { id: 'rules', label: 'Credit Rules Builder', icon: Settings },
                    { id: 'bulk', label: 'Bulk Operations Console', icon: Sparkles },
                    { id: 'ledger', label: 'Transaction Audit Ledger', icon: Activity }
                ].map(t => {
                    const Icon = t.icon
                    const isSelected = activeTab === t.id
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                                background: isSelected ? P.brandBg : 'transparent',
                                border: 'none', borderRadius: 10,
                                fontSize: 13, fontWeight: 800,
                                color: isSelected ? P.brand : P.muted,
                                cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            <Icon size={16} color={isSelected ? P.brand : P.muted} />
                            {t.label}
                        </button>
                    )
                })}
            </div>

            {/* ALERTS */}
            {alert && (
                <div style={{
                    marginBottom: 32, padding: '16px 24px', borderRadius: 16,
                    background: alert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${alert.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                    color: alert.type === 'success' ? '#065F46' : '#991B1B',
                    fontSize: 14, fontWeight: 700
                }}>
                    {alert.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {alert.text}
                    <button onClick={() => setAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
                </div>
            )}

            {/* TAB 1: RULES BUILDER */}
            {activeTab === 'rules' && (
                <div>
                    {/* EXPLANATION BANNER */}
                    <div style={{ marginBottom: 32, padding: '20px 28px', background: P.brandBg, borderRadius: 20, border: `1px solid ${P.brand}20`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <Sparkles size={20} color={P.brand} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: 14, color: P.dark, fontWeight: 600, lineHeight: 1.7 }}>
                            <strong>Rule Engine Execution:</strong> Wallet credit rules are evaluated automatically when a new student profiles is created.
                            If multiple active rules match, their credits are granted cumulatively in isolated, FIFO-tracked expiry buckets.
                            Standard default rules handle enrollment grants by tenant type.
                        </div>
                    </div>

                    {loadingRules ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                            {rules.map(rule => {
                                const isDefault = rule.name.startsWith('Default ')
                                return (
                                    <div key={rule.id} className="glass-card" style={{
                                        background: P.card, borderRadius: 24, border: `1px solid ${P.border}`,
                                        padding: '24px 28px', display: 'flex', flexDirection: 'column',
                                        justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                        opacity: rule.is_active ? 1 : 0.7, transition: 'all 0.2s'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    padding: '4px 10px', borderRadius: 8,
                                                    background: rule.rule_type === 'tenant_type' ? '#E0F2FE' : rule.rule_type === 'specific_tenant' ? '#F3E8FF' : '#FEF3C7',
                                                    color: rule.rule_type === 'tenant_type' ? '#0369A1' : rule.rule_type === 'specific_tenant' ? '#6B21A8' : '#B45309'
                                                }}>
                                                    {RULE_TYPE_LABELS[rule.rule_type]}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <button
                                                        onClick={() => handleToggleRuleStatus(rule.id, rule.is_active)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        {rule.is_active ? <ToggleRight size={22} color={P.success} /> : <ToggleLeft size={22} color={P.muted} />}
                                                    </button>
                                                    {!isDefault && (
                                                        <button onClick={() => handleDeleteRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 style={{ fontSize: 16, fontWeight: 900, color: P.dark, margin: '0 0 6px 0', lineHeight: 1.3 }}>{rule.name}</h3>
                                            <p style={{ fontSize: 12, color: P.muted, fontWeight: 600, margin: '0 0 16px 0' }}>
                                                Matches: <strong style={{ color: P.dark }}>{
                                                    rule.rule_type === 'specific_tenant'
                                                        ? (tenants.find(t => t.id === rule.match_value)?.name || rule.match_value)
                                                        : rule.match_value
                                                }</strong>
                                            </p>
                                        </div>

                                        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                                    <span style={{ fontSize: 24, fontWeight: 900, color: P.brand }}>₡{rule.credits}</span>
                                                    <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>credits</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: P.dark, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={12} />
                                                    {rule.expiry_days ? `${rule.expiry_days} Days Expiry` : 'No Expiry'}
                                                </span>
                                                <span style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>
                                                    {rule.first_time_only ? 'First-enroll only' : 'On every enroll'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: BULK OPERATIONS */}
            {activeTab === 'bulk' && (
                <div style={{ maxWidth: 680, margin: '0 auto', background: P.card, borderRadius: 28, border: `1px solid ${P.border}`, padding: '32px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 900, color: P.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={20} color={P.brand} /> Manual Bulk Credit Grant
                    </h3>
                    <p style={{ margin: '0 0 28px 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Award or adjust credits to targeted demographics immediately.</p>

                    <form onSubmit={handleExecuteBulk} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Demographic Type */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                Target Student Demographic
                            </label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setBulkForm(p => ({ ...p, demographicType: 'all' }))}
                                    style={{
                                        flex: 1, height: 48, borderRadius: 12, border: `2px solid ${bulkForm.demographicType === 'all' ? P.brand : P.border}`,
                                        background: bulkForm.demographicType === 'all' ? P.brandBg : P.bg,
                                        fontSize: 13, fontWeight: 800, color: bulkForm.demographicType === 'all' ? P.brand : P.muted, cursor: 'pointer'
                                    }}
                                >
                                    All Students on Platform
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBulkForm(p => ({ ...p, demographicType: 'specific_tenant' }))}
                                    style={{
                                        flex: 1, height: 48, borderRadius: 12, border: `2px solid ${bulkForm.demographicType === 'specific_tenant' ? P.brand : P.border}`,
                                        background: bulkForm.demographicType === 'specific_tenant' ? P.brandBg : P.bg,
                                        fontSize: 13, fontWeight: 800, color: bulkForm.demographicType === 'specific_tenant' ? P.brand : P.muted, cursor: 'pointer'
                                    }}
                                >
                                    Students of Specific Institution
                                </button>
                            </div>
                        </div>

                        {/* Tenant Select */}
                        {bulkForm.demographicType === 'specific_tenant' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                    Select Target Institution
                                </label>
                                <select
                                    value={bulkForm.tenantId}
                                    onChange={e => setBulkForm(p => ({ ...p, tenantId: e.target.value }))}
                                    style={{ width: '100%', height: 48, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none' }}
                                >
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {/* Amount */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                    Credit Amount (₡)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10000}
                                    value={bulkForm.amount}
                                    onChange={e => setBulkForm(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))}
                                    style={{ width: '100%', height: 48, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 12, fontSize: 15, fontWeight: 800, color: P.dark, outline: 'none' }}
                                />
                            </div>

                            {/* Credit Type */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                    Wallet Balance Type
                                </label>
                                <select
                                    value={bulkForm.creditType}
                                    onChange={e => setBulkForm(p => ({ ...p, creditType: e.target.value as any }))}
                                    style={{ width: '100%', height: 48, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none' }}
                                >
                                    <option value="free">Free Promotional Credits</option>
                                    <option value="paid">Paid Credits Balance</option>
                                </select>
                            </div>
                        </div>

                        {/* Expiry Days (only for free) */}
                        {bulkForm.creditType === 'free' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                    Expiration Duration (Days)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="No Expiry"
                                    value={bulkForm.expiryDays}
                                    onChange={e => setBulkForm(p => ({ ...p, expiryDays: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                    style={{ width: '100%', height: 48, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: P.dark, outline: 'none' }}
                                />
                                <span style={{ fontSize: 11, color: P.muted, display: 'block', marginTop: 6, fontWeight: 600 }}>Specify interval to create an expiring FIFO bucket, or leave empty.</span>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                Operation Audit Notes
                            </label>
                            <textarea
                                value={bulkForm.notes}
                                onChange={e => setBulkForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="E.g. Class XII Welcome Gift credits"
                                style={{ width: '100%', height: 80, padding: '12px 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none', resize: 'none' }}
                            />
                        </div>

                        {/* Results output */}
                        {bulkResult && (
                            <div style={{
                                padding: '12px 18px', borderRadius: 12,
                                background: bulkResult.success ? '#ECFDF5' : '#FEF2F2',
                                border: `1px solid ${bulkResult.success ? '#A7F3D0' : '#FECACA'}`,
                                color: bulkResult.success ? '#065F46' : '#991B1B',
                                fontSize: 13, fontWeight: 700
                            }}>
                                {bulkResult.success
                                    ? `✓ Successfully credited ${bulkForm.amount} credits to ${bulkResult.count} students.`
                                    : `✕ Error: ${bulkResult.error}`}
                            </div>
                        )}

                        {/* Execute Button */}
                        <button
                            type="submit"
                            disabled={executingBulk}
                            style={{ width: '100%', height: 48, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: executingBulk ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${P.brand}30`, opacity: executingBulk ? 0.7 : 1 }}
                        >
                            {executingBulk && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                            {executingBulk ? 'Processing batch allocations...' : 'Execute Bulk Allocation'}
                        </button>
                    </form>
                </div>
            )}

            {/* TAB 3: TRANSACTION AUDIT LEDGER */}
            {activeTab === 'ledger' && (
                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 28, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    {/* FILTERS */}
                    <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                            <Search size={16} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search by student name or email..."
                                value={ledgerFilters.search}
                                onChange={e => {
                                    setLedgerFilters(p => ({ ...p, search: e.target.value, page: 1 }))
                                    // Debounce reload
                                    setTimeout(() => loadLedger(), 300)
                                }}
                                style={{ width: '100%', height: 44, padding: '0 16px 0 44px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                            />
                        </div>

                        {/* Source Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Filter size={14} color={P.muted} />
                            <select
                                value={ledgerFilters.source}
                                onChange={e => setLedgerFilters(p => ({ ...p, source: e.target.value, page: 1 }))}
                                style={{ height: 44, padding: '0 12px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: P.dark, outline: 'none' }}
                            >
                                <option value="all">All Sources</option>
                                <option value="enrollment">Enrollment Grant</option>
                                <option value="manual_bulk">Manual Bulk</option>
                                <option value="expiry_reclaim">Expiry Reclaim</option>
                                <option value="exam_fee">Exam Fee</option>
                            </select>
                        </div>

                        {/* Credit Type Filter */}
                        <select
                            value={ledgerFilters.type}
                            onChange={e => setLedgerFilters(p => ({ ...p, type: e.target.value, page: 1 }))}
                            style={{ height: 44, padding: '0 12px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: P.dark, outline: 'none' }}
                        >
                            <option value="all">All Credit Types</option>
                            <option value="free">Free Promo</option>
                            <option value="paid">Paid Balance</option>
                        </select>
                    </div>

                    {/* TABLE */}
                    {loadingLedger ? (
                        <div style={{ padding: '80px 0', textAlign: 'center' }}>
                            <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: '80px 0', textAlign: 'center', color: P.muted, fontWeight: 600 }}>
                            No wallet transactions found matching filters.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Txn Type</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(txn => {
                                    const studentName = txn.user_profiles ? `${txn.user_profiles.first_name} ${txn.user_profiles.last_name}` : 'Unknown'
                                    const tenantName = txn.tenants ? txn.tenants.name : 'Platform'
                                    return (
                                        <tr key={txn.id} style={{ borderBottom: `1px solid ${P.border}`, fontSize: 13, color: P.dark, fontWeight: 600 }}>
                                            <td style={{ padding: '16px 24px', color: P.muted, fontSize: 12 }}>
                                                {new Date(txn.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div>{studentName}</div>
                                                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{txn.user_profiles?.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {tenantName}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 6,
                                                    background: txn.txn_type === 'credit' ? '#ECFDF5' : '#FEF2F2',
                                                    color: txn.txn_type === 'credit' ? P.success : '#EF4444'
                                                }}>
                                                    {txn.txn_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800 }}>
                                                <span style={{ color: txn.txn_type === 'credit' ? P.success : '#EF4444' }}>
                                                    {txn.txn_type === 'credit' ? '+' : '-'}₡{txn.amount}
                                                </span>
                                                <div style={{ fontSize: 9, color: P.muted, fontWeight: 700, marginTop: 2 }}>
                                                    {txn.credit_type.toUpperCase()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800 }}>
                                                ₡{txn.balance_after}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: 12, color: P.muted }}>
                                                {txn.source}
                                            </td>
                                            <td style={{ padding: '16px 24px', color: P.muted, fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {txn.notes || '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* PAGINATION */}
                    {!loadingLedger && transactions.length > 0 && (
                        <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg, borderTop: `1px solid ${P.border}` }}>
                            <span style={{ fontSize: 12, color: P.muted, fontWeight: 700 }}>
                                Showing {transactions.length} of {ledgerTotal} transactions
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    disabled={ledgerFilters.page === 1}
                                    onClick={() => setLedgerFilters(p => ({ ...p, page: p.page - 1 }))}
                                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.card, border: `1px solid ${P.border}`, borderRadius: 8, cursor: ledgerFilters.page === 1 ? 'not-allowed' : 'pointer', opacity: ledgerFilters.page === 1 ? 0.5 : 1 }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    disabled={ledgerFilters.page * 25 >= ledgerTotal}
                                    onClick={() => setLedgerFilters(p => ({ ...p, page: p.page + 1 }))}
                                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.card, border: `1px solid ${P.border}`, borderRadius: 8, cursor: ledgerFilters.page * 25 >= ledgerTotal ? 'not-allowed' : 'pointer', opacity: ledgerFilters.page * 25 >= ledgerTotal ? 0.5 : 1 }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE RULE MODAL OVERLAY */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 28, width: '100%', maxWidth: 540, padding: 36, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: P.dark, margin: 0 }}>Create Custom Credit Rule</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Rule Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                    Rule Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="E.g. Delhi Public School Welcome Grant"
                                    value={newRule.name}
                                    onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))}
                                    required
                                    style={{ width: '100%', height: 44, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {/* Rule Type */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Trigger Match Scope
                                    </label>
                                    <select
                                        value={newRule.rule_type}
                                        onChange={e => {
                                            const type = e.target.value as Rule['rule_type']
                                            const defMatch = type === 'tenant_type' ? 'school' : type === 'specific_tenant' ? (tenants[0]?.id || '') : ''
                                            setNewRule(p => ({ ...p, rule_type: type, match_value: defMatch }))
                                        }}
                                        style={{ width: '100%', height: 44, padding: '0 12px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                                    >
                                        <option value="tenant_type">Tenant Type</option>
                                        <option value="specific_tenant">Specific Institution</option>
                                        <option value="syllabus_enrollment">Syllabus Enrollment</option>
                                        <option value="promotional">Promo Code</option>
                                    </select>
                                </div>

                                {/* Match Value Selection */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Matching Condition
                                    </label>
                                    {newRule.rule_type === 'tenant_type' ? (
                                        <select
                                            value={newRule.match_value}
                                            onChange={e => setNewRule(p => ({ ...p, match_value: e.target.value }))}
                                            style={{ width: '100%', height: 44, padding: '0 12px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                                        >
                                            <option value="school">School</option>
                                            <option value="institute">Institute</option>
                                            <option value="independent_teacher">Independent Teacher</option>
                                        </select>
                                    ) : newRule.rule_type === 'specific_tenant' ? (
                                        <select
                                            value={newRule.match_value}
                                            onChange={e => setNewRule(p => ({ ...p, match_value: e.target.value }))}
                                            style={{ width: '100%', height: 44, padding: '0 12px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                                        >
                                            {tenants.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder={newRule.rule_type === 'syllabus_enrollment' ? 'E.g. IIT-JEE' : 'E.g. PROMO2026'}
                                            value={newRule.match_value}
                                            onChange={e => setNewRule(p => ({ ...p, match_value: e.target.value }))}
                                            required
                                            style={{ width: '100%', height: 44, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {/* Credits */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Grant Credits (₡)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={newRule.credits}
                                        onChange={e => setNewRule(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))}
                                        required
                                        style={{ width: '100%', height: 44, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 800, color: P.dark, outline: 'none' }}
                                    />
                                </div>

                                {/* Expiry days */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Expiry Duration (Days)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="No Expiry"
                                        value={newRule.expiry_days}
                                        onChange={e => setNewRule(p => ({ ...p, expiry_days: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                        style={{ width: '100%', height: 44, padding: '0 16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: P.dark, outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: P.dark, cursor: 'pointer' }}>
                                    <button
                                        type="button"
                                        onClick={() => setNewRule(p => ({ ...p, first_time_only: !p.first_time_only }))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        {newRule.first_time_only ? <ToggleRight size={20} color={P.brand} /> : <ToggleLeft size={20} color={P.muted} />}
                                    </button>
                                    First Enrollment Only
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: P.dark, cursor: 'pointer' }}>
                                    <button
                                        type="button"
                                        onClick={() => setNewRule(p => ({ ...p, is_active: !p.is_active }))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        {newRule.is_active ? <ToggleRight size={20} color={P.success} /> : <ToggleLeft size={20} color={P.muted} />}
                                    </button>
                                    Rule Enabled
                                </label>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ flex: 1, height: 44, background: '#F1F5F9', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 800, color: P.muted, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingRule}
                                    style={{ flex: 2, height: 44, background: P.brand, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: savingRule ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${P.brand}30`, opacity: savingRule ? 0.7 : 1 }}
                                >
                                    {savingRule && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    Create Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
