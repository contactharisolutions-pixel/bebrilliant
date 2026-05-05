'use client'

import React, { useEffect, useState } from 'react'
import {
    Zap, Plus, Trash2, Save, Search, ShieldCheck, AlertCircle, Info,
    ArrowUpRight, Loader2, X, Filter, Target, Layers, Activity,
    TrendingUp, DollarSign, PieChart, ShieldAlert, Globe, ChevronRight,
    RefreshCw, CheckCircle, Database
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'

export default function CommissionSettings() {
    const [rules, setRules] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showNewForm, setShowNewForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [newRule, setNewRule] = useState({ type: 'GLOBAL', percentage: 15.0, tenant_id: '', category: 'DEFAULT' })

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/owner/finance/commissions')
            const json = await res.json()
            if (res.ok) setRules(json.rules || [])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchRules() }, [])

    const handleAdd = async () => {
        if (newRule.percentage === undefined || newRule.percentage < 0) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/finance/commissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRule)
            })
            if (!res.ok) throw new Error('Deployment failed')
            const json = await res.json()
            setRules(prev => [json.rule, ...prev])
            setShowNewForm(false)
            setNewRule({ type: 'GLOBAL', percentage: 15.0, tenant_id: '', category: 'DEFAULT' })
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Warning: This will immediately change commission rates. Proceed?')) return
        try {
            const res = await fetch(`/api/owner/finance/commissions?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            setRules(prev => prev.filter(r => r.id !== id))
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: P.bg }}>
            <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ padding: '40px 48px', background: P.bg, minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                @keyframes spin { to { transform: rotate(360deg); } }
                .input-modern { background: #fff; border: 1px solid ${P.border}; border-radius: 14px; padding: 14px 16px; font-size: 14px; font-weight: 700; color: ${P.dark}; outline: none; transition: all 0.2s; }
                .input-modern:focus { border-color: ${P.brand}; box-shadow: 0 0 0 4px ${P.brand}15; }
                .pulse-success { animation: pulseS 2s infinite; }
                @keyframes pulseS { 0% { box-shadow: 0 0 0 0 ${P.success}40; } 70% { box-shadow: 0 0 0 10px ${P.success}00; } 100% { box-shadow: 0 0 0 0 ${P.success}00; } }
            `}</style>

            {/* HEADER SECTION */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                     <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commission Settings</div>
                     <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.muted }} />
                     <div style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>Version 3.0</div>
                   </div>
                    <h1 style={{ fontSize: 36, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Commission Rules</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>Set up and manage commission rates across the platform.</p>
                </div>
                {!showNewForm && (
                   <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => fetchRules()}
                        className="glass-card hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 850, cursor: 'pointer' }}
                    >
                        <RefreshCw size={18} color={P.brand} /> Refresh
                    </button>
                    <button
                        onClick={() => setShowNewForm(true)}
                        className="hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}40` }}
                    >
                        <Plus size={20} strokeWidth={3} /> New Rule
                    </button>
                   </div>
                )}
            </header>

            {/* KPI OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                <KpiCard icon={TrendingUp} title="Avg. Commission" value="18.2%" color={P.brand} trend="1.2%" trendIsUp={true} />
                <KpiCard icon={Database} title="Active Rules" value={String(rules.length)} color={P.success} trend="Live" trendIsUp={true} />
                <KpiCard icon={ShieldAlert} title="Custom Rules" value={String(rules.filter(r => r.type !== 'GLOBAL').length)} color={P.cta} trend="Manual" trendIsUp={true} />
                <KpiCard icon={PieChart} title="Payments" value="Optimal" color={P.info} trend="99.9%" trendIsUp={true} />
            </div>

            {/* NEW RULE FORM - MODAL STYLE */}
            {showNewForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 10, 20, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="glass-card" style={{ background: P.card, borderRadius: 32, width: '100%', maxWidth: 640, boxShadow: '0 40px 120px rgba(0,0,0,0.5)', border: `1px solid rgba(255,255,255,0.1)`, padding: 40 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={28} color={P.brand} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 24, fontWeight: 950, color: P.dark, margin: 0 }}>Create New Rule</h2>
                                    <p style={{ fontSize: 13, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Set up commission rates for specific types or tenants.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowNewForm(false)} style={{ background: P.bg, border: 'none', padding: 10, borderRadius: 10, cursor: 'pointer', color: P.muted }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                            {[
                                { label: 'Rule type', key: 'type', type: 'select', options: [{v: 'GLOBAL', l: 'Global Default'}, {v: 'SUBSCRIPTION', l: 'Subscription'}, {v: 'EXAM', l: 'Exams'}, {v: 'SYLLABUS', l: 'Course Content'}] },
                                { label: 'Rate (%)', key: 'percentage', type: 'number' },
                                { label: 'Category', key: 'category', type: 'text' },
                                { label: 'Tenant ID', key: 'tenant_id', type: 'text', placeholder: 'Global' }
                            ].map(field => (
                                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select className="input-modern" value={newRule[field.key as keyof typeof newRule]} onChange={e => setNewRule({ ...newRule, [field.key]: e.target.value })}>
                                            {field.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    ) : (
                                        <input className="input-modern" type={field.type} step="0.1" placeholder={field.placeholder} value={newRule[field.key as keyof typeof newRule]} onChange={e => setNewRule({ ...newRule, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={() => setShowNewForm(false)} style={{ flex: 1, background: P.bg, border: 'none', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 900, cursor: 'pointer', color: P.dark }}>Cancel</button>
                            <button onClick={handleAdd} disabled={saving} style={{ flex: 2, background: P.brand, color: '#fff', border: 'none', borderRadius: 16, padding: '16px', fontSize: 15, fontWeight: 950, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 12px 24px ${P.brand}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                {saving ? <Loader2 size={20} className="pulse" /> : <ShieldCheck size={20} strokeWidth={2.5} />}
                                {saving ? 'Saving...' : 'Save Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
                
                {/* REVENUE LOGIC TABLE */}
                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 32, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.success }} className="pulse-success" />
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark }}>Active Commission Rules</h3>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                                    {['Type', 'Tenant', 'Rate', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '20px 32px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, i) => (
                                    <tr key={rule.id} style={{ borderBottom: i < rules.length - 1 ? `1px solid ${P.border}` : 'none', transition: 'all 0.2s' }}>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{rule.type}</div>
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4 }}>Protocol: {rule.category}</div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 10, background: rule.tenants?.name ? P.brandBg : P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {rule.tenants?.name ? <Globe size={16} color={P.brand} /> : <Zap size={16} color={P.muted} />}
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{rule.tenants?.name || 'Global Grid'}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontSize: 24, fontWeight: 950, color: P.dark }}>{rule.percentage}<span style={{ fontSize: 16, color: P.muted }}>%</span></div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <StatusBadge type="success" status="ENFORCED" />
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <button onClick={() => handleDelete(rule.id)} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: P.errorBg, color: P.error, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rules.length === 0 && (
                            <div style={{ padding: 100, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 24, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={40} color={P.muted} opacity={0.3} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>No Rules Found</div>
                                    <p style={{ fontSize: 14, color: P.muted, fontWeight: 600, marginTop: 8 }}>You haven't added any commission rules yet.</p>
                                </div>
                                <button onClick={() => setShowNewForm(true)} style={{ background: P.brand, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Add Global Rule</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* SIDEBAR GOVERNANCE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ background: P.card, borderRadius: 32, border: `1px solid ${P.border}`, padding: 32 }}>
                        <h4 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 950, color: P.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={20} color={P.brand} /> Governance Paradigm
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {[
                                { rank: '1', title: 'Custom Rules', desc: 'Tenant-specific rules take priority.' },
                                { rank: '2', title: 'Category Rules', desc: 'Rules for specific types (e.g. Exams).' },
                                { rank: '3', title: 'Global Base', desc: 'Standard commission rate for everyone.' }
                            ].map(item => (
                                <div key={item.rank} style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: P.brandBg, color: P.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{item.rank}</div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 850, color: P.dark }}>{item.title}</div>
                                        <div style={{ fontSize: 12, color: P.muted, fontWeight: 700, marginTop: 4 }}>{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: P.dark, borderRadius: 32, padding: 32, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: P.cta, opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }} />
                        <div style={{ display: 'flex', gap: 12, color: P.cta, marginBottom: 20 }}>
                            <AlertCircle size={24} strokeWidth={2.5} />
                            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>Rate Protection</h4>
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: '0 0 24px' }}>
                            Changes to commission rates are applied in real-time. Rules do not apply to past payments or finalized cycles.
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success }} className="pulse" />
                            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settlements Optimized</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
