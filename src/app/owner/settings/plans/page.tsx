'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Plus, Save, Check, Loader2, X, Activity, Award, Bot,
    Shield, Users, Database, Cpu, Mail, FileText, CheckCircle,
    TrendingUp, RefreshCw, AlertTriangle, Key, Pencil, Settings
} from 'lucide-react';
import { P, SHADOWS } from '@/styles/tokens';
import { DataTable } from '@/components/owner/DataTable';
import { SideDrawer } from '@/components/owner/SideDrawer';

export default function PlanDesigner() {
    const [plans, setPlans] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [addons, setAddons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState<'tiers' | 'subscriptions' | 'invoices' | 'addons'>('tiers');

    // Drawers & Modals States
    const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
    const [editPlanMode, setEditPlanMode] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<any>({
        name: '', type: 'institute', price: 0, billing_cycle: 'monthly',
        max_students: 100, max_teachers: 5, max_storage_gb: 50, max_ai_tokens: 1000000,
        features: { ai_mentor: false, adaptive_exam: false, white_label: false },
        is_active: true
    });

    const [overrideDrawerOpen, setOverrideDrawerOpen] = useState(false);
    const [overrideTenant, setOverrideTenant] = useState<any>(null);
    const [overrideForm, setOverrideForm] = useState({
        max_students: 500,
        max_teachers: 20,
        max_storage_gb: 100,
        max_ai_tokens: 5000000,
        is_white_label: false
    });

    const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);
    const [editAddonMode, setEditAddonMode] = useState(false);
    const [currentAddon, setCurrentAddon] = useState<any>({
        name: '', price: 199, billing_cycle: 'monthly',
        resource_type: 'teachers', resource_value: 1, is_active: true
    });

    const [actionSaving, setActionSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setRefreshing(true);

        try {
            const res = await fetch('/api/owner/billing');
            const data = await res.json();
            if (res.ok) {
                setPlans(data.plans || []);
                setSubscriptions(data.subscriptions || []);
                setInvoices(data.invoices || []);
                setAddons(data.addons || []);
            }
        } catch (e) {
            showToast('Failed to sync billing data', false);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Save or Edit Plan
    const handleSavePlan = async () => {
        setActionSaving(true);
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: editPlanMode ? 'UPDATE_PLAN' : 'CREATE_PLAN',
                    payload: currentPlan
                })
            });
            if (!res.ok) throw new Error('Failed to save plan details');
            showToast(editPlanMode ? 'Subscription plan updated' : 'New subscription plan created');
            setPlanDrawerOpen(false);
            fetchData(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setActionSaving(false);
        }
    };

    // Save dynamic quota override
    const handleSaveOverride = async () => {
        if (!overrideTenant) return;
        setActionSaving(true);
        try {
            const res = await fetch('/api/owner/finance/plans/overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: overrideTenant.id,
                    limit_overrides: overrideForm
                })
            });
            if (!res.ok) throw new Error('Override failed');
            showToast(`Custom limits applied to ${overrideTenant.name}`);
            setOverrideDrawerOpen(false);
            fetchData(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setActionSaving(false);
        }
    };

    // Save or edit addon
    const handleSaveAddon = async () => {
        setActionSaving(true);
        try {
            const method = editAddonMode ? 'PATCH' : 'POST';
            const res = await fetch('/api/owner/finance/plans/addons', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentAddon)
            });
            if (!res.ok) throw new Error('Addon save failed');
            showToast(editAddonMode ? 'Extra pack updated' : 'Extra pack created');
            setAddonDrawerOpen(false);
            fetchData(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setActionSaving(false);
        }
    };

    // Confirm Payment for Invoice
    const handleConfirmPayment = async (invoiceId: string) => {
        if (!confirm('Mark this invoice as PAID and activate subscription?')) return;
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CONFIRM_PAYMENT',
                    payload: { invoice_id: invoiceId }
                })
            });
            if (!res.ok) throw new Error('Payment confirmation failed');
            showToast('Invoice paid, subscription extended.');
            fetchData(true);
        } catch (e: any) {
            showToast(e.message, false);
        }
    };

    // Revoke subscription
    const handleRevokeSubscription = async (subId: string) => {
        if (!confirm('Deactivate and cancel this institute subscription?')) return;
        try {
            const res = await fetch('/api/owner/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'REVOKE_SUBSCRIPTION',
                    payload: { id: subId }
                })
            });
            if (!res.ok) throw new Error('Revoke subscription failed');
            showToast('Subscription revoked');
            fetchData(true);
        } catch (e: any) {
            showToast(e.message, false);
        }
    };

    // Open override form
    const openOverride = (tenant: any, overrides: any) => {
        setOverrideTenant(tenant);
        setOverrideForm({
            max_students: overrides?.max_students ?? 100,
            max_teachers: overrides?.max_teachers ?? 5,
            max_storage_gb: overrides?.max_storage_gb ?? 50,
            max_ai_tokens: overrides?.max_ai_tokens ?? 1000000,
            is_white_label: overrides?.is_white_label ?? false
        });
        setOverrideDrawerOpen(true);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ color: P.muted, fontWeight: 600 }}>Loading subscription configurations...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: P.bg, padding: '28px 32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                * { box-sizing: border-box; }
            `}</style>

            {toast && (
                <div style={{ position: 'fixed', bottom: 28, right: 28, background: toast.ok ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: SHADOWS.lg, zIndex: 9999 }}>
                    <CheckCircle size={16} /> {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: P.brandBg, color: P.brand, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscription Settings</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: '-0.5px' }}>Subscription Plans</div>
                    <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Manage subscription plans, student limits, custom settings, and invoices</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => fetchData(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                    {activeTab === 'tiers' && (
                        <button onClick={() => { setEditPlanMode(false); setCurrentPlan({ name: '', type: 'institute', price: 0, billing_cycle: 'monthly', max_students: 100, max_teachers: 5, max_storage_gb: 50, max_ai_tokens: 1000000, features: { ai_mentor: false, adaptive_exam: false, white_label: false }, is_active: true }); setPlanDrawerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: P.brand, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                            <Plus size={14} /> Add Plan
                        </button>
                    )}
                    {activeTab === 'addons' && (
                        <button onClick={() => { setEditAddonMode(false); setCurrentAddon({ name: '', price: 199, billing_cycle: 'monthly', resource_type: 'teachers', resource_value: 1, is_active: true }); setAddonDrawerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: P.brand, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                            <Plus size={14} /> Create Extra Pack
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid ' + P.border }}>
                {[
                    { key: 'tiers', label: 'Pricing Plans', count: plans.length },
                    { key: 'subscriptions', label: 'Institute Subscriptions', count: subscriptions.length },
                    { key: 'invoices', label: 'Invoices', count: invoices.length },
                    { key: 'addons', label: 'Extra Packs Config', count: addons.length }
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as any)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '10px 20px', background: 'none', border: 'none',
                            cursor: 'pointer', fontWeight: 700, fontSize: 13,
                            color: activeTab === t.key ? P.brand : P.muted,
                            borderBottom: activeTab === t.key ? '2px solid ' + P.brand : '2px solid transparent',
                            marginBottom: -2, transition: 'all 0.15s',
                        }}
                    >
                        {t.label}
                        {t.count !== undefined && (
                            <span style={{ background: activeTab === t.key ? P.brand : P.border, color: activeTab === t.key ? '#fff' : P.muted, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB: PLAN TIERS */}
            {activeTab === 'tiers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {plans.map(plan => (
                        <div key={plan.id} style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: P.dark }}>{plan.name}</div>
                                    <span style={{ background: P.brandBg, color: P.brand, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, display: 'inline-block', marginTop: 6 }}>
                                        {plan.type === 'institute' ? 'SCHOOL / INSTITUTE' : 'INDIVIDUAL TEACHER'}
                                    </span>
                                </div>
                                <button onClick={() => { setCurrentPlan(plan); setEditPlanMode(true); setPlanDrawerOpen(true); }} style={{ background: P.bg, border: 'none', padding: 8, borderRadius: 10, cursor: 'pointer', display: 'flex', color: P.brand }}>
                                    <Settings size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                                <span style={{ fontSize: 32, fontWeight: 900, color: P.dark }}>₹{Number(plan.price).toLocaleString('en-IN')}</span>
                                <span style={{ color: P.muted, fontSize: 13, fontWeight: 700 }}>/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0', borderTop: '1px solid ' + P.border, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.text, fontWeight: 600 }}>
                                    <Users size={16} color={P.brand} /> {plan.max_students} Students limit
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.text, fontWeight: 600 }}>
                                    <Shield size={16} color={P.brand} /> {plan.max_teachers} Teachers limit
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.text, fontWeight: 600 }}>
                                    <Database size={16} color={P.brand} /> {plan.max_storage_gb || 50} GB Storage space
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.text, fontWeight: 600 }}>
                                    <Cpu size={16} color={P.brand} /> {(plan.max_ai_tokens || 1000000).toLocaleString('en-IN')} Smart features allowance
                                </div>

                                {Object.entries(plan.features || {}).map(([feat, active]) => active ? (
                                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: P.success, fontWeight: 700 }}>
                                        <Check size={16} strokeWidth={3} /> {feat === 'ai_mentor' ? 'Smart mentor helper' : feat === 'adaptive_exam' ? 'Online proctored exams' : 'Custom branding'}
                                    </div>
                                ) : null)}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + P.border }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: plan.is_active ? P.success : P.muted }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: plan.is_active ? P.success : P.muted }} />
                                    {plan.is_active ? 'ACTIVE' : 'ARCHIVED'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: TENANT SUBSCRIPTIONS */}
            {activeTab === 'subscriptions' && (
                <DataTable
                    data={subscriptions}
                    getRowId={item => item.id}
                    minWidth={900}
                    columns={[
                        {
                            header: 'Institute Name',
                            render: item => (
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>{item.tenants?.name || 'Unknown Institute'}</div>
                                    <div style={{ fontSize: 11, color: P.muted }}>{item.tenants?.email || 'No email registered'}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Subscription Detail',
                            render: item => (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: P.brand }}>{item.plan_name}</div>
                                    <div style={{ fontSize: 11, color: P.muted }}>{item.plan_type} · ₹{Number(item.amount).toLocaleString('en-IN')} / {item.billing_cycle}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Date Scope',
                            render: item => (
                                <div style={{ fontSize: 12, color: P.text }}>
                                    <div>Start: {new Date(item.start_date).toLocaleDateString('en-IN')}</div>
                                    <div style={{ color: P.muted }}>Ends: {new Date(item.end_date).toLocaleDateString('en-IN')}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Custom Limits',
                            render: item => {
                                const ov = item.limit_overrides || {};
                                const hasOverrides = Object.keys(ov).length > 0;
                                return (
                                    <div style={{ fontSize: 11, color: hasOverrides ? P.warning : P.muted }}>
                                        {hasOverrides ? (
                                            <div>
                                                <div>Cap: {ov.max_students} students</div>
                                                <div>Staff: {ov.max_teachers} teachers</div>
                                            </div>
                                        ) : 'Plan Limits'}
                                    </div>
                                );
                            }
                        },
                        {
                            header: 'Status',
                            render: item => {
                                const active = item.status === 'active';
                                return (
                                    <span style={{ background: active ? P.successBg : P.errorBg, color: active ? P.success : P.error, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                        {item.status.toUpperCase()}
                                    </span>
                                );
                            }
                        },
                        {
                            header: 'Actions',
                            render: item => (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => openOverride(item.tenants, item.limit_overrides)} style={{ padding: '6px 12px', background: P.brandBg, border: 'none', borderRadius: 8, color: P.brand, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                        Change Limits
                                    </button>
                                    {item.status === 'active' && (
                                        <button onClick={() => handleRevokeSubscription(item.id)} style={{ padding: '6px 12px', background: P.errorBg, border: 'none', borderRadius: 8, color: P.error, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            )
                        }
                    ]}
                />
            )}

            {/* TAB: INVOICE LEDGER */}
            {activeTab === 'invoices' && (
                <DataTable
                    data={invoices}
                    getRowId={item => item.id}
                    columns={[
                        { header: 'Invoice Number', key: 'invoice_no' },
                        { header: 'Institute Name', render: item => item.tenants?.name || 'General Platform Account' },
                        {
                            header: 'Total Cost (GST 18%)',
                            render: item => (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>₹{Number(item.total_amount || item.amount).toLocaleString('en-IN')}</div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Base: ₹{Number(item.base_amount || item.amount).toLocaleString('en-IN')}</div>
                                </div>
                            )
                        },
                        { header: 'Applied Coupon', render: item => item.promo_code ? <span style={{ color: P.purple, fontWeight: 700 }}>{item.promo_code} (-₹{item.discount_amount})</span> : <span style={{ color: P.muted }}>—</span> },
                        { header: 'Created', render: item => new Date(item.created_at).toLocaleDateString('en-IN') },
                        {
                            header: 'Status',
                            render: item => {
                                const paid = item.status === 'paid';
                                return (
                                    <span style={{ background: paid ? P.successBg : P.warningBg, color: paid ? P.success : P.warning, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                        {item.status.toUpperCase()}
                                    </span>
                                );
                            }
                        },
                        {
                            header: 'Action',
                            render: item => item.status === 'pending' && (
                                <button onClick={() => handleConfirmPayment(item.id)} style={{ padding: '6px 12px', background: P.successBg, border: 'none', borderRadius: 8, color: P.success, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                    Confirm Paid
                                </button>
                            )
                        }
                    ]}
                />
            )}

            {/* TAB: ADDONS CONFIGURATION */}
            {activeTab === 'addons' && (
                <DataTable
                    data={addons}
                    getRowId={item => item.id}
                    columns={[
                        { header: 'Package Name', key: 'name' },
                        { header: 'Price Rate', render: item => `₹${item.price} / ${item.billing_cycle}` },
                        { header: 'Resource Added', render: item => `+${item.resource_value} ${item.resource_type === 'teachers' ? 'Teachers' : item.resource_type === 'students' ? 'Students' : item.resource_type === 'storage_gb' ? 'Storage (GB)' : 'Smart limits'}` },
                        {
                            header: 'Status',
                            render: item => (
                                <span style={{ background: item.is_active ? P.successBg : P.hover, color: item.is_active ? P.success : P.muted, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                    {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            )
                        },
                        {
                            header: 'Actions',
                            render: item => (
                                <button onClick={() => { setCurrentAddon(item); setEditAddonMode(true); setAddonDrawerOpen(true); }} style={{ padding: '6px 12px', background: P.bg, border: 'none', borderRadius: 8, color: P.brand, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                    Configure
                                </button>
                            )
                        }
                    ]}
                />
            )}

            {/* DRAWER: PLAN TIER DETAILS */}
            <SideDrawer
                isOpen={planDrawerOpen}
                onClose={() => setPlanDrawerOpen(false)}
                title={editPlanMode ? 'Edit Subscription Plan' : 'Add New Plan'}
                subTitle="Enter pricing configurations and scale limit parameters"
                footer={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setPlanDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                            Cancel
                        </button>
                        <button onClick={handleSavePlan} disabled={actionSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Plan
                        </button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Plan Identity Name</label>
                        <input value={currentPlan.name} onChange={e => setCurrentPlan({ ...currentPlan, name: e.target.value })} placeholder="e.g. Premium Hub" style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Pricing (₹)</label>
                            <input type="number" value={currentPlan.price} onChange={e => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Audience Type</label>
                            <select value={currentPlan.type} onChange={e => setCurrentPlan({ ...currentPlan, type: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}>
                                <option value="institute">School / Institute</option>
                                <option value="personal_teacher">Individual Teacher</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Student Limit</label>
                            <input type="number" value={currentPlan.max_students} onChange={e => setCurrentPlan({ ...currentPlan, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Teacher Limit</label>
                            <input type="number" value={currentPlan.max_teachers} onChange={e => setCurrentPlan({ ...currentPlan, max_teachers: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Storage Space (GB)</label>
                            <input type="number" value={currentPlan.max_storage_gb} onChange={e => setCurrentPlan({ ...currentPlan, max_storage_gb: parseInt(e.target.value) || 50 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Smart Features Limit</label>
                            <input type="number" value={currentPlan.max_ai_tokens} onChange={e => setCurrentPlan({ ...currentPlan, max_ai_tokens: parseInt(e.target.value) || 1000000 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid ' + P.border, paddingTop: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 12 }}>Select Available Features</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { key: 'ai_mentor', label: 'Smart mentor helper' },
                                { key: 'adaptive_exam', label: 'Online proctored exams' },
                                { key: 'white_label', label: 'Custom platform branding' }
                            ].map(f => (
                                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: P.text }}>
                                    <input type="checkbox" checked={currentPlan.features[f.key] || false} onChange={e => setCurrentPlan({ ...currentPlan, features: { ...currentPlan.features, [f.key]: e.target.checked } })} style={{ accentColor: P.brand }} />
                                    {f.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </SideDrawer>

            {/* DRAWER: CONTRACT LIMITS OVERRIDES */}
            <SideDrawer
                isOpen={overrideDrawerOpen}
                onClose={() => setOverrideDrawerOpen(false)}
                title="Change Custom Limits"
                subTitle={overrideTenant ? `Apply custom limits for ${overrideTenant.name}` : ''}
                footer={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setOverrideDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                            Cancel
                        </button>
                        <button onClick={handleSaveOverride} disabled={actionSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />} Apply Override
                        </button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: P.warningBg, border: '1px solid ' + P.warning + '30', borderRadius: 10, padding: 14, fontSize: 12, color: P.warning, fontWeight: 600, display: 'flex', gap: 8 }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                        <span>These custom limits will immediately apply to this institute, replacing their plan defaults.</span>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Student Limit</label>
                        <input type="number" value={overrideForm.max_students} onChange={e => setOverrideForm({ ...overrideForm, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Teacher Limit</label>
                        <input type="number" value={overrideForm.max_teachers} onChange={e => setOverrideForm({ ...overrideForm, max_teachers: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Storage Space Limit (GB)</label>
                        <input type="number" value={overrideForm.max_storage_gb} onChange={e => setOverrideForm({ ...overrideForm, max_storage_gb: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Smart Generator Limit</label>
                        <input type="number" value={overrideForm.max_ai_tokens} onChange={e => setOverrideForm({ ...overrideForm, max_ai_tokens: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: P.text, marginTop: 10 }}>
                        <input type="checkbox" checked={overrideForm.is_white_label} onChange={e => setOverrideForm({ ...overrideForm, is_white_label: e.target.checked })} style={{ accentColor: P.brand }} />
                        Enable Custom Branding
                    </label>
                </div>
            </SideDrawer>

            {/* DRAWER: ADDON PACKAGES CONFIGURATION */}
            <SideDrawer
                isOpen={addonDrawerOpen}
                onClose={() => setAddonDrawerOpen(false)}
                title={editAddonMode ? 'Configure Extra Pack' : 'Create New Extra Pack'}
                subTitle="Enter pricing details and resource allowances"
                footer={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setAddonDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                            Cancel
                        </button>
                        <button onClick={handleSaveAddon} disabled={actionSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {actionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Extra Pack
                        </button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Extra Pack Name</label>
                        <input value={currentAddon.name} onChange={e => setCurrentAddon({ ...currentAddon, name: e.target.value })} placeholder="e.g. Extra Faculty slot" style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Price Cost (₹)</label>
                            <input type="number" value={currentAddon.price} onChange={e => setCurrentAddon({ ...currentAddon, price: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Resource Type</label>
                            <select value={currentAddon.resource_type} onChange={e => setCurrentAddon({ ...currentAddon, resource_type: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}>
                                <option value="teachers">Teachers Limit</option>
                                <option value="students">Students Limit</option>
                                <option value="storage_gb">Storage Space (GB)</option>
                                <option value="ai_tokens">Smart Limit Pack</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Added Limit Value</label>
                        <input type="number" value={currentAddon.resource_value} onChange={e => setCurrentAddon({ ...currentAddon, resource_value: parseInt(e.target.value) || 0 })} placeholder="e.g. 5" style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: P.text, marginTop: 10 }}>
                        <input type="checkbox" checked={currentAddon.is_active} onChange={e => setCurrentAddon({ ...currentAddon, is_active: e.target.checked })} style={{ accentColor: P.brand }} />
                        Set active immediately
                    </label>
                </div>
            </SideDrawer>
        </div>
    );
}
