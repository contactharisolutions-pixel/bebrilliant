'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
    Zap, Plus, Trash2, Save, Search, ShieldCheck, AlertCircle, Info,
    ArrowUpRight, Loader2, X, Filter, Target, Layers, Activity,
    TrendingUp, DollarSign, PieChart, ShieldAlert, Globe, ChevronRight,
    RefreshCw, CheckCircle, Database, Edit3, ArrowRight
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'

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
    global: 'Global Base Rate',
    subscription: 'Ecosystem Subscriptions',
    exam: 'Mock Exam Sales',
    syllabus: 'Syllabus Content Sales',
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
    const [seeding, setSeeding] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

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
            if (rRes.ok) setRules((await rRes.json()).rules || [])
            if (tRes.ok) setTenants((await tRes.json()).tenants || [])
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const runSeed = async () => {
        setSeeding(true)
        try {
            const res = await fetch('/api/owner/finance/commissions/seed', { method: 'POST' })
            const d = await res.json()
            if (d.success) {
                showToast(`Seeded ${d.seeded} ecosystem default commission rules.`, 'success')
                fetchData()
            } else {
                showToast(d.error || 'Seed failed', 'error')
            }
        } finally {
            setSeeding(false)
        }
    }

    const handleSave = async () => {
        if (form.percentage === undefined || form.percentage < 0 || form.percentage > 100) {
            return showToast('Percentage must be between 0 and 100', 'error')
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
            if (!res.ok) throw new Error(data.error || 'Commit failed')

            showToast(`Commission Rule ${form.id ? 'updated' : 'deployed'} successfully.`, 'success')
            setShowForm(false)
            fetchData()
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Warning: This will change commission rates in real-time. Proceed?')) return
        try {
            const res = await fetch(`/api/owner/finance/commissions?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            showToast('Commission Rule removed.', 'success')
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
        if (rules.length === 0) return 'N/A'
        const sum = rules.reduce((acc, r) => acc + Number(r.percentage), 0)
        return `${(sum / rules.length).toFixed(1)}%`
    }

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: P.bg }}>
            <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ padding: '40px 48px', background: P.bg, minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                @keyframes spin { to { transform: rotate(360deg); } }
                .input-modern { background: #fff; border: 1px solid ${P.border}; border-radius: 14px; padding: 12px 16px; font-size: 14px; font-weight: 700; color: ${P.dark}; outline: none; transition: all 0.2s; box-sizing: border-box; width: 100%; }
                .input-modern:focus { border-color: ${P.brand}; box-shadow: 0 0 0 4px ${P.brand}15; }
                .pulse-success { animation: pulseS 2s infinite; }
                @keyframes pulseS { 0% { box-shadow: 0 0 0 0 ${P.success}40; } 70% { box-shadow: 0 0 0 10px ${P.success}00; } 100% { box-shadow: 0 0 0 0 ${P.success}00; } }
            `}</style>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER SECTION */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                     <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commission Settings</div>
                     <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                     <div style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>Enterprise Governance</div>
                   </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Commission Rates</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>Govern platform commission rates, overrides, and discount models across registered institutes.</p>
                </div>
                {!showForm && (
                   <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={runSeed} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brandBg, color: P.brand, border: `1px solid ${P.brand}20`, borderRadius: 12, padding: '13px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                        {seeding ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />} Seed Default Rules
                    </button>
                    <button
                        onClick={startCreate}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}40` }}
                    >
                        <Plus size={20} strokeWidth={3} /> Create Rule
                    </button>
                   </div>
                )}
            </header>

            {/* KPI OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                <KpiCard icon={TrendingUp} title="Avg. Commission" value={getAvgCommission()} color="#EA580C" />
                <KpiCard icon={Database} title="Enforced Rules" value={String(rules.length)} color={P.success} />
                <KpiCard icon={ShieldAlert} title="Custom Overrides" value={String(rules.filter(r => r.is_override).length)} color={P.cta} />
                <KpiCard icon={PieChart} title="Rules Coverage" value={`${rules.some(r => r.type === 'global') ? 'Complete' : 'Partial'}`} color={P.info} />
            </div>

            {/* CREATE / EDIT FORM MODAL */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 10, 20, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="glass-card" style={{ background: P.card, borderRadius: 28, width: '100%', maxWidth: 640, boxShadow: '0 40px 120px rgba(0,0,0,0.12)', border: `1px solid ${P.border}`, padding: 40 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={22} color={P.brand} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 900, color: P.dark, margin: 0 }}>{form.id ? 'Edit Commission Rule' : 'Create Commission Rule'}</h2>
                                    <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Establish dynamic splits or custom overrides.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowForm(false)} style={{ background: P.bg, border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer', color: P.muted }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            {/* Rule Type */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rule type</label>
                                <select className="input-modern" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="global">Global Base Rate</option>
                                    <option value="subscription">Subscriptions</option>
                                    <option value="exam">Mock Exams Sale</option>
                                    <option value="syllabus">Study Material Sale</option>
                                    <option value="wallet">Student Wallet Recharge</option>
                                </select>
                            </div>

                            {/* Rate */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commission Rate (%)</label>
                                <input className="input-modern" type="number" min={0} max={100} step="0.5" value={form.percentage} onChange={e => setForm({ ...form, percentage: parseFloat(e.target.value) || 0 })} />
                            </div>

                            {/* Target Tenant (dropdown instead of UUID text input) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Apply To Institute</label>
                                <select className="input-modern" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
                                    <option value="">— Global Default Rate (All Institutes) —</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category preset */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rule category</label>
                                <select className="input-modern" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="default">Default base rate</option>
                                    <option value="promotional">Promotional campaign</option>
                                    <option value="custom_deal">Custom corporate deal</option>
                                    <option value="partnership_bonus">Partnership referral rate</option>
                                </select>
                            </div>
                        </div>

                        {/* Override Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>Is Override Rule</div>
                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>Enforce this rule override across other matching criteria.</div>
                            </div>
                            <button onClick={() => setForm(f => ({ ...f, is_override: !f.is_override }))} style={{ width: 44, height: 24, borderRadius: 12, background: form.is_override ? P.success : P.border, border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.is_override ? 23 : 3, transition: 'all 0.2s' }} />
                            </button>
                        </div>

                        {/* Description rationale */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                            <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description / Business Justification</label>
                            <textarea className="input-modern" rows={3} style={{ resize: 'none' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="State the rationale for auditing trails..." />
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={() => setShowForm(false)} style={{ flex: 1, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', color: P.dark }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
                                {saving ? 'Saving...' : 'Deploy Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
                
                {/* RULES TABLE CARD */}
                <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.01)' }}>
                    <div style={{ padding: '20px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success }} className="pulse-success" />
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Active Commissions Directory</h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                    {['Category type', 'Institute scope', 'Commission Split', 'Override', 'Rationale', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '18px 24px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id} style={{ borderBottom: `1px solid ${P.border}`, transition: 'all 0.2s' }}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: P.dark }}>{TYPE_LABELS[rule.type] || rule.type}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginTop: 3 }}>Category: {rule.category}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 750, color: rule.tenants?.name ? P.brand : P.muted }}>
                                                <Globe size={13} /> {rule.tenants?.name || 'Global default'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: 22, fontWeight: 950, color: P.dark }}>{rule.percentage}<span style={{ fontSize: 14, color: P.muted }}>%</span></div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            {rule.is_override ? (
                                                <span style={{ background: '#ECFDF4', color: '#059669', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>Override</span>
                                            ) : (
                                                <span style={{ background: P.bg, color: P.muted, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Base</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: 12, color: P.muted, fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rule.description || ''}>
                                            {rule.description || '—'}
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => startEdit(rule)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${P.border}`, background: '#fff', color: P.brand, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => handleDelete(rule.id)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rules.length === 0 && (
                            <div style={{ padding: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                <Activity size={40} color={P.border} />
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: P.dark }}>No Rules Defined</div>
                                    <p style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginTop: 4 }}>Platform splits defaults haven't been seeded yet.</p>
                                </div>
                                <button onClick={runSeed} style={{ background: P.brand, color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Seed default Rules</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* SIDE PANEL PARADIGMS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${P.border}`, padding: 24 }}>
                        <h4 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ShieldCheck size={18} color={P.brand} /> Which rule is applied first?
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { rank: '1', title: '1. Institute Specific Override', desc: 'Overrides linked to a single institute take highest priority.' },
                                { rank: '2', title: '2. Product Specific Rule', desc: 'Specific product categories like Mock Exams.' },
                                { rank: '3', title: '3. Global Default Rate', desc: 'Fallback default rate applied if no specific override exists.' }
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
