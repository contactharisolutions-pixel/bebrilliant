'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    CreditCard, CheckCircle2, Zap, Package, Info, ShieldCheck,
    Settings, ArrowRight, ShieldAlert, BadgeInfo, CalendarDays, Loader2, XCircle,
    Activity, Cpu, BarChart3, Globe, Shield, RefreshCcw, History,
    ArrowUpRight, Lock, Target
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ── TYPES ────────────────────────────────────────────────
type Plan = { id: string, name: string, price: number, tokens: number, features: string[] }
type SubscriptionState = { plan_id: string, status: string, renewal: string }
type Usage = { students: number, max_students: number, teachers: number, max_teachers: number, storage: number, max_storage: number }

const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    background: '#F8FAFC',
    slate: '#64748B',
    border: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.7)'
}

// ── MODALS & COMPONENTS ──────────────────────────────────
function CheckoutModal({ title, onClose, plan, onSubmit, saving }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'float 0.3s ease-out', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '-0.02em' }}><CreditCard size={20} color={COLORS.primary} /> {title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={18} color="#64748B" /></button>
                </div>
                <div style={{ padding: 40, overflowY: 'auto' }}>
                    <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', marginBottom: 24 }}>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Selected Plan</div>
                        <div style={{ fontSize: 28, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.03em' }}>{plan.name}</div>
                        <div style={{ fontSize: 15, color: COLORS.warning, fontWeight: 900, marginTop: 8 }}>Subscription Price: ₹{plan.price.toLocaleString()} / mo</div>
                    </div>

                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: '0 0 24px', fontWeight: 600 }}>
                        Switching to the <strong>{plan.name}</strong> will instantly update your subscription plan. Additional faculty slots and student nodes will be provisioned immediately.
                    </p>

                    <div style={{ background: `${COLORS.primary}08`, border: `1px solid ${COLORS.primary}20`, padding: '16px 20px', borderRadius: 20, fontSize: 12, color: '#1E3A8A', fontWeight: 700, lineHeight: 1.6, display: 'flex', gap: 12 }}>
                        <Lock size={18} style={{ flexShrink: 0 }} />
                        <span>Your transaction is secure. By authorizing, you agree to the Automated Billing Lifecycle Policy.</span>
                    </div>
                </div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: COLORS.primaryGradient, border: 'none', color: '#fff', fontSize: 14, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                        {saving && <Loader2 size={16} className="spin" />} Confirm Upgrade
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── MAIN PAGE ────────────────────────────────────────────
export default function SubscriptionPage() {
    const [current, setCurrent] = useState<SubscriptionState | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [usage, setUsage] = useState<Usage | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const [showUpgradeModal, setShowUpgradeModal] = useState<Plan | null>(null)

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }

    const fetchData = useCallback(async () => {
        setError(null)
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/subscription')
            const json = await res.json()
            if (res.ok) {
                setCurrent(json.current)
                setPlans(json.plans || [])
                setUsage(json.usage || null)
            } else {
                setError(json.error || 'Signal Desynchronization Detected')
            }
        } catch (e: any) {
            setError('Gateway Timeout: Connection failure')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/subscription', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Execution Error')
            await fetchData()
            showToast('Institutional Billing Cycle Synchronized', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Transmission Failed', false)
            return { success: false }
        } finally { setSaving(false) }
    }

    const handleUpgrade = async () => {
        if (!showUpgradeModal) return
        const { success } = await apiAction('UPGRADE_PLAN', { plan_id: showUpgradeModal.id })
        if (success) setShowUpgradeModal(null)
    }

    const handleCancel = async () => {
        if (confirm('CRITICAL: Terminating the auto-renewal sequence will deactivate institutional bounds at the end of the current cycle. Proceed?')) {
            apiAction('CANCEL_SUBSCRIPTION', {})
        }
    }

    const currentPlan = useMemo(() => plans.find(p => p.id === current?.plan_id), [plans, current])

    if (loading) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>CALIBRATING BILLING GATEWAY...</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (error || !current) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <ShieldAlert size={64} color={COLORS.danger} style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.02em' }}>Signal Desynchronization</div>
                <div style={{ fontSize: 15, color: '#64748B', fontWeight: 600, textAlign: 'center', maxWidth: 450, marginBottom: 32, lineHeight: 1.6 }}>{error || 'The system was unable to reconcile your institutional billing heartbeat.'}</div>
                <button onClick={fetchData} style={{ padding: '16px 32px', background: COLORS.primaryGradient, color: '#FFF', border: 'none', borderRadius: 18, fontSize: 14, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}><RefreshCcw size={18} /> Re-Sync Data</button>
            </div>
        )
    }

    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes float { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .plan-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,75,147,0.06) !important; border-color: ${COLORS.primary}40 !important; }
            `}</style>

            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? COLORS.success : COLORS.danger) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 20000, animation: 'float 0.3s ease-out' }}>
                    {toast.ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* INSTITUTIONAL BILLING HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Zap size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Billing & Subscriptions</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 600, lineHeight: 1.6 }}>
                        Manage your institutional subscription, monitor usage, and adjust your plan as needed.
                    </p>
                </div>
                <button onClick={fetchData} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}>
                    <RefreshCcw size={16} /> Refresh Info
                </button>
            </div>

            {/* ACTIVE TIER TABLE */}
            <div style={{ background: '#FFF', borderRadius: 32, padding: 48, boxShadow: '0 10px 40px rgba(0,75,147,0.03)', border: '1px solid #F1F5F9', marginBottom: 48, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, #004B9308 0%, transparent 70%)', zIndex: 0 }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 1000, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                        <ShieldCheck size={18} /> Primary Institutional Node
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.04em', marginBottom: 12 }}>{currentPlan?.name || 'Active Instance'}</div>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 10, height: 10, background: COLORS.success, borderRadius: '50%', boxShadow: `0 0 10px ${COLORS.success}` }} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>AUTHORIZATION ACTIVE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '10px 20px', borderRadius: 14, border: '1px solid #F1F5F9' }}>
                            <CalendarDays size={18} color={COLORS.warning} />
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>Renewal: {formatDate(current.renewal)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
                        <button style={{ padding: '16px 28px', borderRadius: 18, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 14, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,75,147,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            Manage Billing <ArrowUpRight size={18} />
                        </button>
                        <button onClick={handleCancel} style={{ padding: '16px 28px', borderRadius: 18, background: '#FFF', border: `2px solid #FEE2E2`, color: COLORS.danger, fontSize: 14, fontWeight: 1000, cursor: 'pointer' }}>
                            Cancel Subscription
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Analytics</div>
                    
                    {[
                        { label: 'Student Assignments', val: usage?.students, max: usage?.max_students, icon: Globe, color: COLORS.primary },
                        { label: 'Faculty Nodes', val: usage?.teachers, max: usage?.max_teachers, icon: Shield, color: COLORS.success },
                        { label: 'AI Resource Usage', val: 45000, max: currentPlan?.tokens || 100000, icon: Cpu, color: COLORS.warning }
                    ].map((stat, i) => (
                        <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 800, color: '#475569' }}>
                                    <stat.icon size={16} color={stat.color} /> {stat.label}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 1000, color: '#1E293B' }}>{stat.val?.toLocaleString()} / {stat.max?.toLocaleString()}</div>
                            </div>
                            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ width: `${(stat.val! / stat.max!) * 100}%`, height: '100%', background: stat.color, borderRadius: 10 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* INSTITUTIONAL TIER MARKETPLACE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <Package size={24} color="#0F172A" />
                <h2 style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Available Plans</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                {plans.map((plan) => {
                    const isActive = current.plan_id === plan.id
                    return (
                        <div key={plan.id} className="plan-card" style={{ background: '#FFF', border: `2px solid ${isActive ? COLORS.primary : '#F1F5F9'}`, borderRadius: 32, padding: 40, display: 'flex', flexDirection: 'column', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', boxShadow: isActive ? '0 15px 35px rgba(0,75,147,0.08)' : 'none' }}>
                            {isActive && (
                                <div style={{ position: 'absolute', top: 24, right: 24, background: COLORS.primaryGradient, color: '#FFF', padding: '6px 14px', borderRadius: 12, fontSize: 10, fontWeight: 1000, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Target size={14} /> ACTIVE NODE
                                </div>
                            )}

                            <div style={{ marginBottom: 32 }}>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{plan.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 20 }}>
                                    <span style={{ fontSize: 36, fontWeight: 1000, color: '#111827', letterSpacing: '-0.04em' }}>₹{plan.price.toLocaleString()}</span>
                                    <span style={{ fontSize: 15, color: '#94A3B8', fontWeight: 800 }}>/ mo</span>
                                </div>
                                <div style={{ marginTop: 16, background: `${COLORS.primary}05`, padding: '10px 16px', borderRadius: 14, fontSize: 12, fontWeight: 900, color: COLORS.primary, border: `1px solid ${COLORS.primary}10`, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <Cpu size={14} /> {plan.tokens.toLocaleString()} AI Resources
                                </div>
                            </div>

                            <div style={{ flex: 1, marginBottom: 40 }}>
                                <div style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.1em' }}>Included Features</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {plan.features.map((feat, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#475569', fontWeight: 700, lineHeight: 1.5 }}>
                                            <CheckCircle2 size={18} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!isActive ? (
                                <button onClick={() => setShowUpgradeModal(plan)} style={{ width: '100%', padding: '18px', background: COLORS.primaryGradient, border: 'none', borderRadius: 20, color: '#FFF', fontSize: 15, fontWeight: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 10px 20px rgba(0,75,147,0.1)', transition: '0.2s' }}>
                                    Upgrade Plan <ArrowRight size={18} />
                                </button>
                            ) : (
                                <div style={{ width: '100%', padding: '18px', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: 20, color: '#94A3B8', fontSize: 15, fontWeight: 1000, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <Lock size={18} /> Plan Online
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* BILLING HISTORY LOGS */}
            <div style={{ marginTop: 64 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                    <History size={24} color="#0F172A" />
                    <h2 style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Invoice History</h2>
                </div>
                
                <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 32, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plan</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount</th>
                                <th style={{ padding: '20px 32px', fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                                <th style={{ padding: '20px 32px', textAlign: 'right', fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
    { date: formatDate('2026-04-10'), plan: currentPlan?.name, amount: '₹' + currentPlan?.price, status: 'COMPLETED' },
    { date: formatDate('2026-03-10'), plan: currentPlan?.name, amount: '₹' + currentPlan?.price, status: 'COMPLETED' }
                            ].map((inv, i) => (
                                <tr key={i} style={{ borderBottom: i === 1 ? 'none' : '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{inv.date}</td>
                                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 800, color: '#475569' }}>{inv.plan}</td>
                                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 1000, color: '#1E293B' }}>{inv.amount}</td>
                                    <td style={{ padding: '20px 32px' }}>
                                        <span style={{ padding: '6px 14px', background: `${COLORS.success}10`, color: COLORS.success, borderRadius: 10, fontSize: 11, fontWeight: 1000 }}>{inv.status}</span>
                                    </td>
                                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                        <button style={{ background: 'transparent', border: 'none', color: COLORS.primary, fontSize: 13, fontWeight: 1000, cursor: 'pointer' }}>View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showUpgradeModal && (
                <CheckoutModal
                    title="Confirm Plan Upgrade"
                    plan={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(null)}
                    onSubmit={handleUpgrade}
                    saving={saving}
                />
            )}
        </div>
    )
}
