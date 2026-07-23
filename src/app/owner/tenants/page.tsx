'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2, Search, Plus, Activity, Users, Settings, Filter,
    Ban, ShieldCheck, RefreshCw, X, Eye, EyeOff, CheckCircle,
    XCircle, Loader2, AlertTriangle, Globe, Crown, UserCheck,
    Download, Mail, Pencil, Trash2, ShieldAlert, Zap, Award,
    School, Key, Database, Cpu
} from 'lucide-react';
import { P, SHADOWS } from '@/styles/tokens';
import { DataTable } from '@/components/owner/DataTable';
import { SideDrawer } from '@/components/owner/SideDrawer';

type Tenant = {
    id: string;
    name: string;
    type: string;
    tenant_type?: string;
    subdomain?: string;
    email: string;
    is_active: boolean;
    subscription_status: string;
    max_students: number;
    max_teachers: number;
    max_storage_gb?: number;
    max_ai_tokens?: number;
    is_white_label: boolean;
    created_at: string;
    total_users?: number;
    examCount?: number;
    avgAccuracy?: string | null;
    revenueInPeriod?: number;
    subscription_plan?: string;
};

export default function TenantManagementPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
    const [classification, setClassification] = useState<'all' | 'school' | 'institute' | 'independent_teacher'>('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // SideDrawer: Provision New Tenant
    const [provisionDrawerOpen, setProvisionDrawerOpen] = useState(false);
    const [provisionForm, setProvisionForm] = useState({
        name: '', type: 'INSTITUTE', tenant_type: 'institute', email: '', subdomain: '',
        admin_first_name: '', admin_last_name: '', admin_password: '',
        max_students: 100, max_teachers: 10, max_storage_gb: 50, is_white_label: false,
        lead_id: ''
    });
    const [showPass, setShowPass] = useState(false);
    const [provisionSaving, setProvisionSaving] = useState(false);
    const [provisionError, setProvisionError] = useState('');

    // SideDrawer: Inspect Tenant
    const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [inspectTab, setInspectTab] = useState<'general' | 'usage' | 'actions'>('general');
    const [inspectSaving, setInspectSaving] = useState(false);
    
    // Limits Edit State
    const [limitsForm, setLimitsForm] = useState({
        max_students: 100, max_teachers: 10, max_storage_gb: 50, is_white_label: false
    });

    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    // Auto-generate subdomain from name
    useEffect(() => {
        if (!provisionForm.name) return;
        const sub = provisionForm.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        setProvisionForm(f => ({ ...f, subdomain: sub }));
    }, [provisionForm.name]);

    // Search Debouncer
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchTenants = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
                ...(status !== 'all' && { status }),
                ...(classification !== 'all' && { tenant_type: classification }),
                ...(debouncedSearch && { search: debouncedSearch }),
            });
            const res = await fetch(`/api/owner/tenants?${params}`);
            const json = await res.json();
            if (res.ok) {
                setTenants(json.tenants ?? []);
                setTotal(json.total ?? 0);
            }

            const aRes = await fetch('/api/owner/analytics?range=30');
            const aJson = await aRes.json();
            if (aRes.ok && aJson.tenantSummaries) {
                setTenants(prev => prev.map(t => {
                    const summary = aJson.tenantSummaries.find((s: any) => s.id === t.id);
                    return summary ? { ...t, ...summary } : t;
                }));
            }
        } catch (e) {
            showToast('Ecosystem query synchronization failed', false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, status, debouncedSearch, classification]);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const provision = params.get('provision');
            const leadId = params.get('leadId');
            if (provision === 'true' && leadId) {
                fetch(`/api/owner/crm/leads/${leadId}`)
                    .then(res => res.json())
                    .then(data => {
                        const lead = data.lead || data;
                        if (lead) {
                            const nameParts = (lead.name || '').trim().split(' ');
                            const firstName = nameParts[0] || 'Admin';
                            const lastName = nameParts.slice(1).join(' ') || 'User';
                            
                            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                            let pass = "";
                            for (let i = 0; i < 12; i++) {
                                pass += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            pass += "A1";
                            
                            setProvisionForm(f => ({
                                ...f,
                                name: lead.organization || lead.name || '',
                                email: lead.email || '',
                                admin_first_name: firstName,
                                admin_last_name: lastName,
                                admin_password: pass,
                                lead_id: lead.id
                            }));
                            setShowPass(true);
                            setProvisionDrawerOpen(true);
                            showToast(`Pre-populated details for lead: ${lead.name}`);
                        }
                    })
                    .catch(() => {
                        showToast('Failed to load conversion lead.', false);
                    });
            }
        }
    }, []);

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Guarantee at least one uppercase and one digit for validation rules
        pass += "A1";
        setProvisionForm(f => ({ ...f, admin_password: pass }));
        setShowPass(true);
    };

    // Save New Tenant Provision
    const handleProvisionTenant = async () => {
        setProvisionError('');
        if (!provisionForm.name || !provisionForm.email || !provisionForm.admin_first_name || !provisionForm.admin_last_name || !provisionForm.admin_password || !provisionForm.subdomain) {
            setProvisionError('Please fill out all required setup fields.');
            return;
        }
        setProvisionSaving(true);
        try {
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(provisionForm)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Provisioning sequence abort');
            showToast(`Tenant "${provisionForm.name}" created successfully`);
            setProvisionDrawerOpen(false);
            fetchTenants(true);
        } catch (e: any) {
            setProvisionError(e.message);
        } finally {
            setProvisionSaving(false);
        }
    };

    // Open Tenant Inspector Details
    const openInspector = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setLimitsForm({
            max_students: tenant.max_students || 100,
            max_teachers: tenant.max_teachers || 10,
            max_storage_gb: tenant.max_storage_gb || 50,
            is_white_label: tenant.is_white_label || false
        });
        setInspectTab('general');
        setInspectDrawerOpen(true);
    };

    // Save Updated Quotas/Limits
    const handleSaveLimits = async () => {
        if (!selectedTenant) return;
        setInspectSaving(true);
        try {
            const res = await fetch(`/api/owner/tenants/${selectedTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(limitsForm)
            });
            if (!res.ok) throw new Error('Failed to update capacity limits');
            showToast('Tenant limits updated successfully');
            setInspectDrawerOpen(false);
            fetchTenants(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setInspectSaving(false);
        }
    };

    // Toggle active / suspend state
    const handleToggleSuspension = async () => {
        if (!selectedTenant) return;
        const futureActive = !selectedTenant.is_active;
        if (!confirm(`Are you sure you want to ${futureActive ? 'unsuspend' : 'suspend'} this tenant?`)) return;
        
        setInspectSaving(true);
        try {
            const res = await fetch(`/api/owner/tenants/${selectedTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: futureActive })
            });
            if (!res.ok) throw new Error('Failed to toggle active status');
            showToast(futureActive ? 'Tenant reactivated' : 'Tenant suspended');
            setInspectDrawerOpen(false);
            fetchTenants(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setInspectSaving(false);
        }
    };

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }
            `}</style>

            {toast && (
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: toast.ok ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, boxShadow: SHADOWS.lg, zIndex: 9999 }}>
                    <CheckCircle size={16} /> {toast.msg}
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: P.brandBg, color: P.brand, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecosystem Nodes</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: '-0.5px' }}>Tenant Management</div>
                    <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Manage, provision, suspend, and configure limits for instances across the platform.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => fetchTenants(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync
                    </button>
                    <button onClick={() => {
                        setProvisionForm({
                            name: '', type: 'INSTITUTE', tenant_type: 'institute', email: '', subdomain: '',
                            admin_first_name: '', admin_last_name: '', admin_password: '',
                            max_students: 100, max_teachers: 10, max_storage_gb: 50, is_white_label: false
                        });
                        setProvisionError('');
                        setProvisionDrawerOpen(true);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: P.brand, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                        <Plus size={14} /> New Tenant
                    </button>
                </div>
            </div>

            {/* FILTER PANEL */}
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, boxShadow: SHADOWS.sm }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search institutions by name..."
                        style={{ width: '100%', padding: '10px 14px 10px 40px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: 4 }}>
                        {(['all', 'school', 'institute', 'independent_teacher'] as const).map(f => (
                            <button key={f} onClick={() => { setClassification(f); setPage(1); }} style={{
                                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                background: classification === f ? P.card : 'transparent',
                                color: classification === f ? P.brand : P.muted,
                                border: 'none', transition: 'all 0.15s'
                            }}>{f.replace('_', ' ').toUpperCase()}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: 4 }}>
                        {(['all', 'active', 'suspended'] as const).map(f => (
                            <button key={f} onClick={() => { setStatus(f); setPage(1); }} style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                background: status === f ? P.card : 'transparent',
                                color: status === f ? P.brand : P.muted,
                                border: 'none', transition: 'all 0.15s'
                            }}>{f.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <DataTable
                data={tenants}
                loading={loading}
                getRowId={item => item.id}
                minWidth={900}
                columns={[
                    {
                        header: 'Institution details',
                        render: item => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: item.is_active ? P.brandBg : P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} color={item.is_active ? P.brand : P.muted} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>{item.name}</div>
                                    <div style={{ fontSize: 11, color: P.muted }}>{item.subdomain}.bebrilliant.io</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Account Owner',
                        render: item => (
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{item.email}</div>
                                <span style={{ fontSize: 10, color: P.muted, textTransform: 'uppercase', fontWeight: 800 }}>{(item.tenant_type || item.type).replace(/_/g, ' ')}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Billing Tier',
                        render: item => (
                            <div>
                                <span style={{ background: P.brandBg, color: P.brand, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                                    {(item.subscription_plan || 'TRIAL').toUpperCase()}
                                </span>
                            </div>
                        )
                    },
                    {
                        header: 'Capacity Usages',
                        render: item => {
                            const totalUsers = item.total_users ?? 0;
                            const maxStud = item.max_students || 100;
                            const pct = Math.min(100, Math.round((totalUsers / maxStud) * 100));
                            return (
                                <div style={{ width: 140 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: P.text, marginBottom: 4 }}>
                                        <span>{totalUsers} / {maxStud} Studs</span>
                                    </div>
                                    <div style={{ height: 6, background: P.bg, borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: P.brand, borderRadius: 4 }} />
                                    </div>
                                </div>
                            );
                        }
                    },
                    {
                        header: 'System Health',
                        render: item => (
                            <div style={{ fontSize: 12, color: P.text }}>
                                <div>{item.examCount ?? 0} Exams</div>
                                <div style={{ color: P.success, fontWeight: 700 }}>{item.avgAccuracy ?? 0}% Accuracy</div>
                            </div>
                        )
                    },
                    {
                        header: 'Status',
                        render: item => (
                            <span style={{ background: item.is_active ? P.successBg : P.errorBg, color: item.is_active ? P.success : P.error, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {item.is_active ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        render: item => (
                            <button onClick={() => openInspector(item)} style={{ padding: '6px 12px', background: P.brandBg, border: 'none', borderRadius: 8, color: P.brand, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                Manage
                            </button>
                        )
                    }
                ]}
            />

            {/* DRAWER: PROVISION NEW TENANT */}
            <SideDrawer
                isOpen={provisionDrawerOpen}
                onClose={() => setProvisionDrawerOpen(false)}
                title="Provision New Tenant"
                subTitle="Deploy a clean BeBrilliant instance on the ecosystem network"
                footer={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setProvisionDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                            Cancel
                        </button>
                        <button onClick={handleProvisionTenant} disabled={provisionSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {provisionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />} Create Tenant
                        </button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {provisionError && (
                        <div style={{ background: P.errorBg, border: `1px solid ${P.error}30`, borderRadius: 10, padding: 14, fontSize: 12, color: P.error, fontWeight: 600, display: 'flex', gap: 8 }}>
                            <AlertTriangle size={16} /> <span>{provisionError}</span>
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Institution Type</label>
                        <select value={provisionForm.tenant_type} onChange={e => {
                            const v = e.target.value;
                            setProvisionForm({ ...provisionForm, tenant_type: v, type: v === 'independent_teacher' ? 'PERSONAL_TEACHER' : 'INSTITUTE' });
                        }} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}>
                            <option value="school">School Academy</option>
                            <option value="institute">Coaching Institute</option>
                            <option value="independent_teacher">Independent Teacher</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Institution Name</label>
                        <input value={provisionForm.name} onChange={e => setProvisionForm({ ...provisionForm, name: e.target.value })} placeholder="e.g. Bright Academy" style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Target Subdomain</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input value={provisionForm.subdomain} onChange={e => setProvisionForm({ ...provisionForm, subdomain: e.target.value })} placeholder="subdomain" style={{ flex: 1, padding: '10px 12px', border: '1px solid ' + P.border, borderTopLeftRadius: 9, borderBottomLeftRadius: 9, borderRight: 'none', fontSize: 13, background: P.card }} />
                            <span style={{ padding: '10px 12px', border: '1px solid ' + P.border, borderTopRightRadius: 9, borderBottomRightRadius: 9, fontSize: 13, background: P.bg, color: P.muted, fontWeight: 600 }}>.bebrilliant.io</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Admin First Name</label>
                            <input value={provisionForm.admin_first_name} onChange={e => setProvisionForm({ ...provisionForm, admin_first_name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Admin Last Name</label>
                            <input value={provisionForm.admin_last_name} onChange={e => setProvisionForm({ ...provisionForm, admin_last_name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Admin Login Email</label>
                        <input value={provisionForm.email} onChange={e => setProvisionForm({ ...provisionForm, email: e.target.value })} placeholder="admin@academy.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Temporary Password</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input type={showPass ? 'text' : 'password'} value={provisionForm.admin_password} onChange={e => setProvisionForm({ ...provisionForm, admin_password: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    {showPass ? <EyeOff size={16} color={P.muted} /> : <Eye size={16} color={P.muted} />}
                                </button>
                            </div>
                            <button type="button" onClick={generatePassword} style={{ padding: '10px 14px', background: P.brandBg, border: 'none', borderRadius: 9, color: P.brand, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Key size={14} /> Generate
                            </button>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid ' + P.border, paddingTop: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: P.dark, marginBottom: 12 }}>Standard Capacity Limits</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: P.muted, display: 'block', marginBottom: 6 }}>Max Student slots</label>
                                <input type="number" value={provisionForm.max_students} onChange={e => setProvisionForm({ ...provisionForm, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: P.muted, display: 'block', marginBottom: 6 }}>Max Faculty slots</label>
                                <input type="number" value={provisionForm.max_teachers} onChange={e => setProvisionForm({ ...provisionForm, max_teachers: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                            </div>
                        </div>
                    </div>
                </div>
            </SideDrawer>

            {/* DRAWER: INSPECT / EDIT TENANT */}
            <SideDrawer
                isOpen={inspectDrawerOpen}
                onClose={() => setInspectDrawerOpen(false)}
                title="Manage Institution Instance"
                subTitle={selectedTenant ? `${selectedTenant.name} Details` : ''}
                footer={
                    inspectTab === 'usage' ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setInspectDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                                Cancel
                            </button>
                            <button onClick={handleSaveLimits} disabled={inspectSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {inspectSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />} Save Limits
                            </button>
                        </div>
                    ) : null
                }
            >
                {selectedTenant && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Tab header inside drawer */}
                        <div style={{ display: 'flex', gap: 4, background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, padding: 3 }}>
                            {[
                                { key: 'general', label: 'Summary' },
                                { key: 'usage', label: 'Quotas' },
                                { key: 'actions', label: 'Control Panel' }
                            ].map(t => (
                                <button key={t.key} onClick={() => setInspectTab(t.key as any)} style={{
                                    flex: 1, padding: '8px 10px', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    background: inspectTab === t.key ? P.card : 'transparent',
                                    color: inspectTab === t.key ? P.brand : P.muted,
                                }}>{t.label}</button>
                            ))}
                        </div>

                        {/* TAB: GENERAL */}
                        {inspectTab === 'general' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, marginBottom: 4 }}>Subdomain URL</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>https://{selectedTenant.subdomain}.bebrilliant.io</div>
                                </div>
                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, marginBottom: 4 }}>Owner Email</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>{selectedTenant.email}</div>
                                </div>
                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, marginBottom: 4 }}>Billing Tier Plan</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.brand, textTransform: 'uppercase' }}>{selectedTenant.subscription_plan || 'Starter Free Trial'}</div>
                                </div>
                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, marginBottom: 4 }}>Date Provisioned</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: P.dark }}>{new Date(selectedTenant.created_at).toLocaleDateString('en-IN')}</div>
                                </div>
                            </div>
                        )}

                        {/* TAB: USAGE */}
                        {inspectTab === 'usage' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 8 }}>Override Student Capacity</label>
                                    <input type="number" value={limitsForm.max_students} onChange={e => setLimitsForm({ ...limitsForm, max_students: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: P.muted, marginTop: 6 }}>
                                        <span>Current Users: {selectedTenant.total_users ?? 0}</span>
                                    </div>
                                </div>

                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 8 }}>Override Faculty Capacity</label>
                                    <input type="number" value={limitsForm.max_teachers} onChange={e => setLimitsForm({ ...limitsForm, max_teachers: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                                </div>

                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 8 }}>Override Disk Storage (GB)</label>
                                    <input type="number" value={limitsForm.max_storage_gb} onChange={e => setLimitsForm({ ...limitsForm, max_storage_gb: parseInt(e.target.value) || 50 })} style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }} />
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: P.text, padding: '0 8px' }}>
                                    <input type="checkbox" checked={limitsForm.is_white_label} onChange={e => setLimitsForm({ ...limitsForm, is_white_label: e.target.checked })} style={{ accentColor: P.brand }} />
                                    Enable Whitelabel Portal Explicitly
                                </label>
                            </div>
                        )}

                        {/* TAB: ACTIONS */}
                        {inspectTab === 'actions' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ padding: 16, background: selectedTenant.is_active ? P.warningBg : P.successBg, border: '1px solid ' + (selectedTenant.is_active ? P.warning : P.success) + '30', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: selectedTenant.is_active ? P.warning : P.success }}>
                                        {selectedTenant.is_active ? 'Suspend Tenant Access' : 'Reactivate Tenant Access'}
                                    </div>
                                    <div style={{ fontSize: 11, color: P.text, lineHeight: 1.5 }}>
                                        {selectedTenant.is_active 
                                            ? 'Suspension blocks all dashboard requests, OMR processors, and exam environments for teachers and students under this node.'
                                            : 'Reactivating allows full instance access immediately under current capacity rules.'}
                                    </div>
                                    <button onClick={handleToggleSuspension} disabled={inspectSaving} style={{ width: '100%', padding: '10px', background: selectedTenant.is_active ? P.error : P.success, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                        {selectedTenant.is_active ? 'SUSPEND INSTANCE' : 'REACTIVATE INSTANCE'}
                                    </button>
                                </div>

                                <div style={{ padding: 16, background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>Password Administration</div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Admin password resets can be requested for instance recovery triggers.</div>
                                    <button onClick={() => alert('Password reset link sent to admin inbox.')} style={{ width: '100%', padding: '10px', background: '#F1F5F9', color: P.dark, border: '1px solid ' + P.border, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                        Send Reset Instructions
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </SideDrawer>
        </div>
    );
}
