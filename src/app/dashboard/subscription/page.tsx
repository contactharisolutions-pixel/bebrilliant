'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    CreditCard, CheckCircle2, Zap, Package, Info, ShieldCheck,
    Settings, ArrowRight, ShieldAlert, CalendarDays, Loader2, XCircle,
    Activity, Cpu, BarChart3, Globe, Shield, RefreshCcw, History,
    ArrowUpRight, Lock, Target, Plus, Check, Percent, FileText
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
};

// ── CHECOUT MODAL WITH GST & COUPONS ────────────────────────
function CheckoutModal({ title, onClose, plan, onSubmit, saving }: any) {
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);

    const basePrice = plan.price;
    const gstAmount = Math.round(basePrice * 0.18);
    const originalTotal = basePrice + gstAmount;

    const handleApplyCoupon = () => {
        const code = couponCode.toUpperCase();
        if (code === 'WELCOME30') {
            const disc = Math.round(basePrice * 0.3); // 30% off
            setDiscountAmount(disc);
            setCouponApplied(true);
        } else if (code === 'FESTIVE50') {
            const disc = Math.round(basePrice * 0.5); // 50% off
            setDiscountAmount(disc);
            setCouponApplied(true);
        } else {
            alert('Invalid coupon code. Try WELCOME30 or FESTIVE50!');
        }
    };

    const finalBasePrice = basePrice - discountAmount;
    const finalGst = Math.round(finalBasePrice * 0.18);
    const finalTotal = finalBasePrice + finalGst;

    const handleConfirm = () => {
        onSubmit({
            plan_id: plan.id,
            promo_code: couponApplied ? couponCode.toUpperCase() : null,
            discount_amount: discountAmount,
            total_amount: finalTotal
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '-0.02em' }}><CreditCard size={20} color={COLORS.primary} /> {title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={18} color="#64748B" /></button>
                </div>
                <div style={{ padding: 32, overflowY: 'auto' }}>
                    <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 20, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Upgrade Target</div>
                        <div style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.03em' }}>{plan.name}</div>
                        <div style={{ fontSize: 13, color: COLORS.slate, fontWeight: 700, marginTop: 4 }}>Price rate: ₹{basePrice.toLocaleString()} / mo</div>
                    </div>

                    {/* Cost Summary Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px', marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569', fontWeight: 600 }}>
                            <span>Base Subscription Cost:</span>
                            <span>₹{basePrice.toLocaleString()}</span>
                        </div>
                        {couponApplied && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: COLORS.success, fontWeight: 700 }}>
                                <span>Coupon discount ({couponCode.toUpperCase()}):</span>
                                <span>-₹{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569', fontWeight: 600 }}>
                            <span>GST Tax (18%):</span>
                            <span>₹{finalGst.toLocaleString()}</span>
                        </div>
                        <div style={{ borderTop: '1px solid #E2E8F0', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>
                            <span>Total Billing Cost:</span>
                            <span>₹{finalTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Coupon Apply Code Box */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                        <input
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            disabled={couponApplied}
                            placeholder="Promo Code (WELCOME30, FESTIVE50)"
                            style={{ flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, outline: 'none', background: '#F8FAFC' }}
                        />
                        <button
                            onClick={handleApplyCoupon}
                            disabled={couponApplied || !couponCode.trim()}
                            style={{ padding: '10px 20px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: couponApplied || !couponCode.trim() ? 0.7 : 1 }}
                        >
                            {couponApplied ? 'Applied' : 'Apply'}
                        </button>
                    </div>

                    <div style={{ background: `${COLORS.primary}08`, border: `1px solid ${COLORS.primary}20`, padding: '16px 20px', borderRadius: 20, fontSize: 12, color: '#1E3A8A', fontWeight: 700, lineHeight: 1.6, display: 'flex', gap: 12 }}>
                        <Lock size={18} style={{ flexShrink: 0 }} />
                        <span>By authorizing, you agree to the Automated Billing Lifecycle Policy. Tiers scale immediately.</span>
                    </div>
                </div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleConfirm} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: COLORS.primaryGradient, border: 'none', color: '#fff', fontSize: 14, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                        {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />} Confirm Upgrade
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN PAGE ────────────────────────────────────────────
export default function SubscriptionPage() {
    const [current, setCurrent] = useState<SubscriptionState | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [addons, setAddons] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState<Plan | null>(null);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            // Load subscription usages + plans
            const res = await fetch('/api/dashboard/subscription');
            const json = await res.json();
            if (res.ok) {
                setCurrent(json.current);
                setPlans(json.plans || []);
                setUsage(json.usage || null);
            } else {
                setError(json.error || 'Signal Desynchronization Detected');
            }

            // Load addons
            const addonsRes = await fetch('/api/owner/billing');
            const addonsJson = await addonsRes.json();
            if (addonsRes.ok) {
                setAddons(addonsJson.addons || []);
            }
        } catch (e: any) {
            setError('Gateway Timeout: Connection failure');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpgrade = async (checkoutPayload: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPGRADE_PLAN',
                    payload: {
                        plan_id: checkoutPayload.plan_id,
                        promo_code: checkoutPayload.promo_code,
                        discount_amount: checkoutPayload.discount_amount
                    }
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Upgrade Action Failed');

            // Generate an Invoice log entry in background
            await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_INVOICE',
                    payload: {
                        plan_id: checkoutPayload.plan_id,
                        total_amount: checkoutPayload.total_amount,
                        promo_code: checkoutPayload.promo_code,
                        discount_amount: checkoutPayload.discount_amount
                    }
                })
            });

            await fetchData();
            showToast('Subscription Tier Upgraded Successfully!', true);
            setShowUpgradeModal(null);
        } catch (e: any) {
            showToast(e.message || 'Upgrade Failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (confirm('CRITICAL: Terminating the auto-renewal sequence will deactivate institutional bounds at the end of the current cycle. Proceed?')) {
            setSaving(true);
            try {
                const res = await fetch('/api/dashboard/subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'CANCEL_SUBSCRIPTION', payload: {} })
                });
                if (res.ok) {
                    showToast('Subscription auto-renew disabled', true);
                    fetchData();
                }
            } finally {
                setSaving(false);
            }
        }
    };

    const currentPlan = useMemo(() => plans.find(p => p.id === current?.plan_id), [plans, current]);

    if (loading) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} style={{ animation: 'spin 1.5s linear infinite', marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>CALIBRATING BILLING GATEWAY...</div>
            </div>
        );
    }

    if (error || !current) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <ShieldAlert size={64} color={COLORS.danger} style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.02em' }}>Signal Desynchronization</div>
                <div style={{ fontSize: 15, color: '#64748B', fontWeight: 600, textAlign: 'center', maxWidth: 450, marginBottom: 32, lineHeight: 1.6 }}>{error || 'The system was unable to reconcile your institutional billing heartbeat.'}</div>
                <button onClick={fetchData} style={{ padding: '16px 32px', background: COLORS.primaryGradient, color: '#FFF', border: 'none', borderRadius: 18, fontSize: 14, fontWeight: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}><RefreshCcw size={18} /> Re-Sync Data</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: '1px solid ' + (toast.ok ? COLORS.success : COLORS.danger) + '40', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 20000 }}>
                    {toast.ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: toast.ok ? '#065F46' : '#991B1B' }}>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Zap size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Billing & Subscriptions</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 600, lineHeight: 1.6 }}>
                        Manage your institutional subscription, track resource usage, and configure upgrade triggers.
                    </p>
                </div>
                <button onClick={fetchData} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: '0.2s' }}>
                    <RefreshCcw size={16} /> Refresh Info
                </button>
            </div>

            {/* ACTIVE TIER TABLE WITH USAGE BARS */}
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
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Quota Limits</div>
                    {[
                        { label: 'Student Assignments', val: usage?.students ?? 0, max: usage?.max_students ?? 100, icon: Globe, color: COLORS.primary },
                        { label: 'Faculty Nodes', val: usage?.teachers ?? 0, max: usage?.max_teachers ?? 10, icon: Shield, color: COLORS.success },
                        { label: 'AI Resource Usage', val: usage?.ai_tokens ?? 0, max: usage?.max_ai_tokens ?? 1000000, icon: Cpu, color: COLORS.warning }
                    ].map((stat, i) => {
                        const pct = Math.min(100, Math.round(((stat.val || 0) / (stat.max || 1)) * 100));
                        return (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 800, color: '#475569' }}>
                                        <stat.icon size={16} color={stat.color} /> {stat.label}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 1000, color: '#1E293B' }}>{stat.val?.toLocaleString()} / {stat.max?.toLocaleString()} ({pct}%)</div>
                                </div>
                                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: stat.color, borderRadius: 10, transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ADD-ONS SECTION */}
            {addons.filter(a => a.is_active).length > 0 && (
                <div style={{ marginBottom: 48 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <Plus size={24} color="#0F172A" />
                        <h2 style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Available Add-on Blocks</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                        {addons.filter(a => a.is_active).map(addon => (
                            <div key={addon.id} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{addon.name}</div>
                                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>+{addon.resource_value} {addon.resource_type.replace('_', ' ').toUpperCase()} Allowance</div>
                                </div>
                                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 16, fontWeight: 900, color: COLORS.primary }}>₹{addon.price} / mo</span>
                                    <button onClick={() => alert('Add-on purchases are managed securely. Contact support or use card billing updates to authorize.')} style={{ padding: '6px 12px', background: `${COLORS.primary}10`, border: 'none', borderRadius: 8, color: COLORS.primary, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Buy</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* INSTITUTIONAL TIER MARKETPLACE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <Package size={24} color="#0F172A" />
                <h2 style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Available Plans</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                {plans.map((plan) => {
                    const isActive = current.plan_id === plan.id;
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
                            </div>
                            <div style={{ flex: 1, marginBottom: 40 }}>
                                <div style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.1em' }}>Included features</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#475569', fontWeight: 700, lineHeight: 1.5 }}>
                                        <CheckCircle2 size={18} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{plan.max_students} Student Nodes capacity</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#475569', fontWeight: 700, lineHeight: 1.5 }}>
                                        <CheckCircle2 size={18} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{plan.max_teachers} Faculty Slots</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#475569', fontWeight: 700, lineHeight: 1.5 }}>
                                        <CheckCircle2 size={18} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{plan.max_storage_gb || 50} GB Space limit</span>
                                    </div>
                                    {plan.features?.ai_mentor && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#475569', fontWeight: 700, lineHeight: 1.5 }}>
                                            <CheckCircle2 size={18} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />
                                            <span>Dynamic AI Mentor access</span>
                                        </div>
                                    )}
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
                    );
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
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { date: formatDate('2026-04-10'), plan: currentPlan?.name || 'Starter Plan', amount: '₹' + (currentPlan?.price ? (currentPlan.price * 1.18).toLocaleString('en-IN') : '5,898'), status: 'COMPLETED' },
                                { date: formatDate('2026-03-10'), plan: currentPlan?.name || 'Starter Plan', amount: '₹' + (currentPlan?.price ? (currentPlan.price * 1.18).toLocaleString('en-IN') : '5,898'), status: 'COMPLETED' }
                            ].map((inv, i) => (
                                <tr key={i} style={{ borderBottom: i === 1 ? 'none' : '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{inv.date}</td>
                                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 800, color: '#475569' }}>{inv.plan}</td>
                                    <td style={{ padding: '20px 32px', fontSize: 14, fontWeight: 1000, color: '#1E293B' }}>{inv.amount} (Incl. GST)</td>
                                    <td style={{ padding: '20px 32px' }}>
                                        <span style={{ padding: '6px 14px', background: `${COLORS.success}10`, color: COLORS.success, borderRadius: 10, fontSize: 11, fontWeight: 1000 }}>{inv.status}</span>
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
    );
}
