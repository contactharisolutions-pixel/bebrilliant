'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
    Zap, Plus, Trash2, Save, Search, ShieldCheck, AlertCircle, Info,
    ArrowUpRight, Loader2, X, Filter, Target, Layers, Activity,
    TrendingUp, DollarSign, PieChart, ShieldAlert, Globe, ChevronRight,
    RefreshCw, CheckCircle, Database, Edit3, ArrowRight, Calculator
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

type CommissionRule = {
    id: string
    type: string
    tenant_id: string | null
    category: string
    percentage: number
    is_override: boolean
    description: string | null
    created_at: string
    tenants?: { name: string }
}

const TYPE_LABELS: Record<string, string> = {
    global: 'Global Platform Base Rate',
    subscription: 'Student Subscriptions',
    exam: 'Mock Exam Sales',
    syllabus: 'Study Material Sales',
    wallet: 'Student Wallet Recharge',
    marketplace: 'Marketplace Content'
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
            {isOk ? <CheckCircle size={20} color={P.success} /> : <AlertCircle size={20} color={P.error} />}
            <span>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: 'inherit' }}><X size={14} /></button>
        </div>
    )
}

export default function CommissionSettings() {
    const [rules, setRules] = useState<CommissionRule[]>([])
    const [tenants, setTenants] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const [search, setSearch] = useState('')

    // Revenue Simulator state
    const [simAmount, setSimAmount] = useState<number>(10000)
    const [simRuleId, setSimRuleId] = useState<string>('')

    // Form state
    const [form, setForm] = useState({
        id: '',
        type: 'global',
        percentage: 15.0,
        tenant_id: '',
        category: 'default',
        is_override: false,
        description: ''
    })

    const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type })

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [rRes, tRes] = await Promise.all([
                fetch('/api/owner/finance/commissions'),
                fetch('/api/owner/tenants')
            ])
            if (rRes.ok) {
                const rJson = await rRes.json()
                const fetchedRules = rJson.rules || []
                setRules(fetchedRules)
                if (fetchedRules.length > 0 && !simRuleId) {
                    setSimRuleId(fetchedRules[0].id)
                }
            }
            if (tRes.ok) setTenants((await tRes.json()).tenants || [])
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [simRuleId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSave = async () => {
        if (form.percentage === undefined || form.percentage < 0 || form.percentage > 100) {
            return showToast('Commission rate percentage must be between 0% and 100%', 'error')
        }
        setSaving(true)
        try {
            const method = form.id ? 'PUT' : 'POST'
            const res = await fetch('/api/owner/finance/commissions', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Operation failed')

            showToast(`Commission rule ${form.id ? 'updated' : 'created'} successfully.`, 'success')
            setShowForm(false)
            fetchData()
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this commission rule? Rates will immediately update.')) return
        try {
            const res = await fetch(`/api/owner/finance/commissions?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            showToast('Commission rule deleted successfully.', 'success')
            fetchData()
        } catch (err: any) {
            showToast(err.message, 'error')
        }
    }

    const startEdit = (rule: CommissionRule) => {
        setForm({
            id: rule.id,
            type: rule.type,
            percentage: rule.percentage,
            tenant_id: rule.tenant_id || '',
            category: rule.category,
            is_override: rule.is_override,
            description: rule.description || ''
        })
        setShowForm(true)
    }

    const startCreate = () => {
        setForm({
            id: '',
            type: 'global',
            percentage: 15.0,
            tenant_id: '',
            category: 'default',
            is_override: false,
            description: ''
        })
        setShowForm(true)
    }

    const getAvgCommission = () => {
        if (rules.length === 0) return '0%'
        const sum = rules.reduce((acc, r) => acc + Number(r.percentage), 0)
        return `${(sum / rules.length).toFixed(1)}%`
    }

    const getGlobalBaseRate = () => {
        const globalRule = rules.find(r => r.type === 'global' && !r.tenant_id)
        return globalRule ? `${globalRule.percentage}%` : '15%'
    }

    const selectedSimRule = rules.find(r => r.id === simRuleId) || rules[0]
    const platformShareAmt = selectedSimRule ? (simAmount * selectedSimRule.percentage) / 100 : 0
    const instituteShareAmt = simAmount - platformShareAmt

    const filteredRules = rules.filter(r => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            TYPE_LABELS[r.type]?.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.tenants?.name?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        )
    })

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
            <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ padding: '36px 40px', background: P.bg, minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                @keyframes spin { to { transform: rotate(360deg); } }
                .input-modern { background: #fff; border: 1px solid ${P.border}; border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 700; color: ${P.dark}; outline: none; transition: all 0.2s; box-sizing: border-box; width: 100%; }
                .input-modern:focus { border-color: ${P.brand}; box-shadow: 0 0 0 4px ${P.brand}15; }
            `}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER SECTION */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand, boxShadow: `0 0 8px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Settings & Controls</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Commission Settings</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>Configure platform commission rates, institute overrides, and revenue splits.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Sync Rates
                    </button>
                    <button
                        onClick={startCreate}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}
                    >
                        <Plus size={18} strokeWidth={3} /> Create Commission Rule
                    </button>
                </div>
            </header>

            {/* KPI OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={TrendingUp} title="Average Rate" value={getAvgCommission()} color="#EA580C" />
                <KpiCard icon={Database} title="Active Rules" value={String(rules.length)} color="#059669" />
                <KpiCard icon={ShieldAlert} title="Special Overrides" value={String(rules.filter(r => r.is_override).length)} color="#7C3AED" />
                <KpiCard icon={Globe} title="Global Base Rate" value={getGlobalBaseRate()} color="#004B93" />
            </div>

            {/* CREATE / EDIT FORM MODAL */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 620, boxShadow: '0 40px 120px rgba(0,0,0,0.2)', border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={20} color={P.brand} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, margin: 0 }}>{form.id ? 'Edit Commission Rule' : 'Create Commission Rule'}</h3>
                                    <p style={{ fontSize: 12, color: P.muted, margin: '2px 0 0', fontWeight: 600 }}>Set platform revenue commission rates or custom institute overrides.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowForm(false)} style={{ background: '#fff', border: `1px solid ${P.border}`, width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color={P.muted} /></button>
                        </div>

                        <div style={{ padding: '28px 32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                {/* Product / Service Type */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Product / Service Type</label>
                                    <select className="input-modern" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="global">Global Platform Base Rate</option>
                                        <option value="subscription">Student Subscriptions</option>
                                        <option value="exam">Mock Exam Sales</option>
                                        <option value="syllabus">Study Material Sales</option>
                                        <option value="wallet">Student Wallet Recharge</option>
                                    </select>
                                </div>

                                {/* Commission Rate */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commission Rate (%)</label>
                                    <input className="input-modern" type="number" min={0} max={100} step="0.5" value={form.percentage} onChange={e => setForm({ ...form, percentage: parseFloat(e.target.value) || 0 })} placeholder="e.g. 15.0" />
                                </div>

                                {/* Apply To Institute Scope */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Institute Scope</label>
                                    <select className="input-modern" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
                                        <option value="">Global Default (All Institutes)</option>
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rule Category */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rule Category</label>
                                    <select className="input-modern" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        <option value="default">Standard Base Rate</option>
                                        <option value="promotional">Promotional Offer</option>
                                        <option value="custom_deal">Custom Institute Deal</option>
                                        <option value="partnership_bonus">Partner Referral Rate</option>
                                    </select>
                                </div>
                            </div>

                            {/* Override Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>Special Override Rule</div>
                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 2 }}>Enforce this rule rate ahead of default global platform rules.</div>
                                </div>
                                <button onClick={() => setForm(f => ({ ...f, is_override: !f.is_override }))} style={{ width: 44, height: 24, borderRadius: 12, background: form.is_override ? '#059669' : P.border, border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.is_override ? 23 : 3, transition: 'all 0.2s' }} />
                                </button>
                            </div>

                            {/* Description / Note */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reason / Business Note</label>
                                <textarea className="input-modern" rows={3} style={{ resize: 'none' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="State the reason for setting this commission rate..." />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setShowForm(false)} style={{ flex: 1, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', color: P.dark }}>Cancel</button>
                                <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${P.brand}30` }}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
                                    {saving ? 'Saving...' : 'Deploy Commission Rule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
                
                {/* RULES DIRECTORY */}
                <div>
                    {/* SEARCH FILTER BAR */}
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={16} color={P.muted} />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search commission rules by product type, institute, or reason..." 
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} 
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} color={P.muted} />
                            </button>
                        )}
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Active Commission Rules Directory</h3>
                            <span style={{ fontSize: 12, fontWeight: 800, color: P.muted }}>{filteredRules.length} Rules Enforced</span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                                <thead>
                                    <tr style={{ background: P.bg, borderBottom: `2px solid ${P.border}` }}>
                                        {['Product / Service Type', 'Institute Scope', 'Commission Rate', 'Rule Type', 'Reason / Note', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRules.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: P.muted, fontWeight: 700 }}>No commission rules match your search.</td>
                                        </tr>
                                    )}
                                    {filteredRules.map(rule => (
                                        <tr key={rule.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{TYPE_LABELS[rule.type] || rule.type}</div>
                                                <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 2, textTransform: 'capitalize' }}>Category: {rule.category.replace('_', ' ')}</div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: rule.tenants?.name ? P.brand : P.muted }}>
                                                    <Globe size={13} /> {rule.tenants?.name || 'Global Default'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontSize: 20, fontWeight: 950, color: P.dark }}>{rule.percentage}<span style={{ fontSize: 13, color: P.muted }}>%</span></div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                {rule.is_override ? (
                                                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>Special Override</span>
                                                ) : (
                                                    <span style={{ background: P.bg, color: P.muted, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Global Base</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '18px 24px', fontSize: 12, color: P.muted, fontWeight: 600, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rule.description || ''}>
                                                {rule.description || '—'}
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => startEdit(rule)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${P.border}`, background: '#fff', color: P.brand, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Rule">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(rule.id)} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Rule">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: REVENUE SIMULATOR & PRIORITY GUIDE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* REVENUE SPLIT SIMULATOR */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${P.border}`, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Calculator size={18} color={P.brand} /> Live Revenue Split Simulator
                        </h4>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Transaction Amount (Rs.)</label>
                            <input 
                                type="number" 
                                value={simAmount} 
                                onChange={e => setSimAmount(Number(e.target.value) || 0)} 
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 14, fontWeight: 800, color: P.dark, outline: 'none', boxSizing: 'border-box' }} 
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, marginBottom: 6, textTransform: 'uppercase' }}>Select Applied Rule</label>
                            <select 
                                value={simRuleId} 
                                onChange={e => setSimRuleId(e.target.value)} 
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: P.dark, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                            >
                                {rules.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {TYPE_LABELS[r.type] || r.type} ({r.percentage}%) {r.tenants?.name ? `- ${r.tenants.name}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: 16, padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 700, color: P.dark }}>
                                <span>Platform Share ({selectedSimRule?.percentage || 0}%):</span>
                                <span style={{ color: P.brand, fontWeight: 900 }}>Rs. {platformShareAmt.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: P.dark, borderTop: `1px solid ${P.border}`, paddingTop: 10 }}>
                                <span>Institute Share ({100 - (selectedSimRule?.percentage || 0)}%):</span>
                                <span style={{ color: '#059669', fontWeight: 900 }}>Rs. {instituteShareAmt.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* PRIORITY GUIDE */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${P.border}`, padding: 24 }}>
                        <h4 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ShieldCheck size={18} color={P.brand} /> Rule Priority Guide
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { rank: '1', title: '1. Institute Override', desc: 'Special overrides linked to a single institute take highest priority.' },
                                { rank: '2', title: '2. Product Category Rule', desc: 'Specific product category rules like Mock Exam Sales.' },
                                { rank: '3', title: '3. Global Default Base', desc: 'Fallback default rate applied if no specific override exists.' }
                            ].map(item => (
                                <div key={item.rank} style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 6, background: P.brandBg, color: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{item.rank}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{item.title}</div>
                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
