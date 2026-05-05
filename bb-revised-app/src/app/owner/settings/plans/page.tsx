'use client'

import React, { useEffect, useState } from 'react'
import {
    Plus, Trash2, Save, CreditCard, Zap, Users, Settings, Shield, Check,
    ArrowUpRight, Loader2, X, Activity, Award, Bot
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

export default function PlanDesigner() {
    const [plans, setPlans] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<any>({
        name: '', type: 'institute', price: 0, billing_cycle: 'monthly',
        max_students: 100, max_teachers: 5,
        features: { ai_mentor: false, adaptive_exam: false, white_label: false },
        is_active: true
    })

    useEffect(() => {
        fetch('/api/owner/finance/plans')
            .then(res => res.json())
            .then(json => {
                setPlans(json.plans || [])
                setIsLoading(false)
            })
            .catch(err => {
                console.error(err)
                setIsLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const method = editMode ? 'PATCH' : 'POST'
            const res = await fetch('/api/owner/finance/plans', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentPlan)
            })
            if (!res.ok) throw new Error('Save failed')
            const json = await res.json()

            if (editMode) {
                setPlans(prev => prev.map(p => p.id === json.plan.id ? json.plan : p))
            } else {
                setPlans(prev => [...prev, json.plan])
            }
            setShowForm(false)
            setEditMode(false)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: P.bg }}>
            <Loader2 size={32} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ padding: '40px 48px', background: P.bg, minHeight: '100vh', position: 'relative' }}>
            <style>{GLASS_STYLES + `
                .focus-ring:focus-within { box-shadow: 0 0 0 3px ${P.brand}20; border-color: ${P.brand} !important; }
            `}</style>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Architecture</div>
                  </div>
                    <h1 style={{ fontSize: 36, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Subscription Plans</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>Provision and architect institutional computational tiers.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditMode(false); setCurrentPlan({ name: '', type: 'institute', price: 0, billing_cycle: 'monthly', max_students: 100, max_teachers: 5, features: { ai_mentor: false, adaptive_exam: false, white_label: false }, is_active: true }) }}
                        className="hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: P.brand, color: '#fff', border: 'none', borderRadius: 16, padding: '14px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}40` }}
                    >
                        <Plus size={20} strokeWidth={3} /> Architect Tier
                    </button>
                )}
            </header>

            {showForm && (
                <div className="glass-card hover-lift" style={{ border: `1px solid ${P.brand}40`, borderRadius: 32, padding: '40px', marginBottom: 48, boxShadow: `0 32px 80px ${P.brand}15`, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{editMode ? 'Refactor Tier' : 'Draft New Tier'}</h3>
                        <button onClick={() => setShowForm(false)} style={{ background: P.bg, border: 'none', padding: 8, borderRadius: 10, cursor: 'pointer', color: P.muted }}><X size={24} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {[
                            { label: 'Tier Identity', key: 'name', type: 'text', placeholder: 'Enterprise Elite' },
                            { label: 'Cost Registry (₹)', key: 'price', type: 'number', placeholder: '4999' },
                            { label: 'Billing Epoch', key: 'billing_cycle', type: 'select', options: [{v: 'monthly', l: 'Monthly Subscription'}, {v: 'yearly', l: 'Annual Commitment'}] },
                            { label: 'Student Capacity', key: 'max_students', type: 'number' },
                            { label: 'Faculty Capacity', key: 'max_teachers', type: 'number' },
                            { label: 'Target Audience', key: 'type', type: 'select', options: [{v: 'institute', l: 'Institutional Portal'}, {v: 'personal_teacher', l: 'Independent Teacher'}] },
                        ].map(field => (
                            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</label>
                                {field.type === 'select' ? (
                                    <select className="focus-ring" value={currentPlan[field.key]} onChange={e => setCurrentPlan({ ...currentPlan, [field.key]: e.target.value })} style={{ padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, fontSize: 14, outline: 'none', fontWeight: 800, color: P.dark, background: P.bg, appearance: 'none' }}>
                                        {field.options?.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                                    </select>
                                ) : (
                                    <input type={field.type} className="focus-ring" placeholder={field.placeholder} value={currentPlan[field.key]} onChange={e => setCurrentPlan({ ...currentPlan, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })} style={{ padding: '14px 16px', borderRadius: 14, border: `1px solid ${P.border}`, fontSize: 14, outline: 'none', fontWeight: 800, color: P.dark, background: P.bg }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 40, padding: 32, background: P.bg, borderRadius: 24, border: `1px solid ${P.border}` }}>
                        <label style={{ fontSize: 13, fontWeight: 950, color: P.dark, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24, display: 'block' }}>Access & Governance Flags</label>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            {[
                                { key: 'ai_mentor', label: 'AI Mentor Core', icon: Bot },
                                { key: 'adaptive_exam', label: 'Adaptive Assessments', icon: Activity },
                                { key: 'white_label', label: 'Full White-Label UI', icon: Award }
                            ].map(feat => {
                                const active = currentPlan.features[feat.key]
                                return (
                                    <div key={feat.key} onClick={() => setCurrentPlan((p: any) => ({ ...p, features: { ...p.features, [feat.key]: !active } }))}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderRadius: 16, border: `2px solid ${active ? P.success : P.border}`, background: active ? P.successBg : P.card, cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? `0 8px 16px ${P.success}20` : 'none' }}>
                                        <div style={{ width: 20, height: 20, borderRadius: 6, background: active ? P.success : P.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {active && <Check size={14} color="#fff" strokeWidth={4} />}
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: active ? P.success : P.muted }}>{feat.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                        <button onClick={handleSave} disabled={saving} className="hover-lift" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', background: P.brand, color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 12px 30px ${P.brand}40` }}>
                            {saving ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={20} strokeWidth={2.5} />}
                            {saving ? 'Synchronizing Cluster...' : 'Commit Tier Architecture'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="hover-lift" style={{ padding: '16px 32px', background: P.card, color: P.muted, border: `1px solid ${P.border}`, borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                            Abandon Draft
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32 }}>
                {plans.map(plan => (
                    <div key={plan.id} className="glass-card hover-lift" style={{ border: `1px solid ${P.border}`, borderRadius: 32, padding: 40, display: 'flex', flexDirection: 'column', position: 'relative', background: P.card }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>{plan.name}</h3>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', marginTop: 10, letterSpacing: '0.05em', background: P.brandBg, display: 'inline-block', padding: '5px 12px', borderRadius: 10 }}>
                                    {plan.type === 'institute' ? 'INSTITUTIONAL GRID' : 'INDEPENDENT NODE'}
                                </div>
                            </div>
                            <button onClick={() => { setEditMode(true); setCurrentPlan(plan); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: P.bg, border: 'none', color: P.brand, width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <Settings size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 32 }}>
                            <span style={{ fontSize: 48, fontWeight: 950, color: P.dark, letterSpacing: '-0.05em' }}>₹{plan.price.toLocaleString()}</span>
                            <span style={{ color: P.muted, fontSize: 16, fontWeight: 800 }}>/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '32px 0', borderTop: `1px solid ${P.border}`, flex: 1 }}>
                            {[
                                { icon: Users, label: `${plan.max_students} Student Capacity` },
                                { icon: Shield, label: `${plan.max_teachers} Faculty Slots` }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, fontWeight: 700, color: P.dark }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 12, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={18} color={P.brand} /></div>
                                    {item.label}
                                </div>
                            ))}
                            
                            {Object.entries(plan.features || {}).map(([key, val]) => val ? (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, fontWeight: 800, color: P.success }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 12, background: P.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18} color={P.success} strokeWidth={4} /></div>
                                    {key.replace('_', ' ').toUpperCase()}
                                </div>
                            ) : null)}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: plan.is_active ? P.success : P.muted }} />
                                {plan.is_active ? 'TIER ACTIVE' : 'TIER ARCHIVED'}
                            </div>
                            <ArrowUpRight size={20} color={P.brand} opacity={0.3} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
