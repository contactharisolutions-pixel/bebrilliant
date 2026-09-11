'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Building2, Search, Plus, Activity, Users, Settings, Filter,
    Ban, ShieldCheck, RefreshCw, X, Eye, EyeOff, CheckCircle,
    XCircle, Loader2, AlertTriangle, Globe, Crown, UserCheck,
    Download, Mail, Pencil, Trash2, ShieldAlert, Zap, Award,
    School, Key, Database, ExternalLink, GraduationCap,
    Sparkles, HardDrive, Cpu, Check, Layers, ChevronRight, LogIn
} from 'lucide-react';
import { P, SHADOWS } from '@/styles/tokens';
import { DataTable } from '@/components/owner/DataTable';
import { SideDrawer } from '@/components/owner/SideDrawer';

type PlanFeature = {
    id: string;
    key: string;
    label: string;
    description: string;
    icon: string;
    category: string;
    is_system: boolean;
    sort_order: number;
};

type SubscriptionPlan = {
    id: string;
    name: string;
    type: string;
    price: number;
    yearly_price?: number;
    billing_cycle?: string;
    max_students: number;
    max_teachers: number;
    max_storage_gb?: number;
    max_ai_tokens?: number;
    features?: Record<string, boolean>;
    is_active: boolean;
};

type Tenant = {
    id: string;
    name: string;
    type: string;
    tenant_type: 'school' | 'institute' | 'independent_teacher';
    subdomain?: string;
    domain?: string;
    email: string;
    is_active: boolean;
    subscription_status: string;
    subscription_plan?: string;
    current_plan_id?: string;
    current_plan?: SubscriptionPlan | null;
    max_students: number;
    max_teachers: number;
    max_storage_gb: number;
    max_ai_tokens: number;
    features?: Record<string, boolean>;
    is_white_label: boolean;
    created_at: string;
    total_users?: number;
    examCount?: number;
    avgAccuracy?: string | number | null;
    revenueInPeriod?: number;
};

const SYSTEM_TENANT_TYPES = [
    { key: 'school', label: 'School (K-12)', icon: School, color: '#004B93', bg: '#004B9315', desc: 'Comprehensive school academies & chains' },
    { key: 'institute', label: 'Coaching Institute', icon: Building2, color: '#7C3AED', bg: '#7C3AED15', desc: 'Exam prep centres & coaching institutes' },
    { key: 'independent_teacher', label: 'Independent Teacher', icon: GraduationCap, color: '#D97706', bg: '#D9770615', desc: 'Solo educators, private tutors & creators' },
] as const;

export default function TenantManagementPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
    const [availableFeatures, setAvailableFeatures] = useState<PlanFeature[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
    const [classificationFilter, setClassificationFilter] = useState<'all' | 'school' | 'institute' | 'independent_teacher'>('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // SideDrawer: Register New Tenant
    const [provisionDrawerOpen, setProvisionDrawerOpen] = useState(false);
    const [provisionForm, setProvisionForm] = useState({
        name: '',
        tenant_type: 'school' as 'school' | 'institute' | 'independent_teacher',
        plan_id: '',
        email: '',
        subdomain: '',
        admin_first_name: '',
        admin_last_name: '',
        admin_password: '',
        max_students: 500,
        max_teachers: 25,
        max_storage_gb: 100,
        max_ai_tokens: 25000,
        is_white_label: false,
        lead_id: ''
    });
    const [showPass, setShowPass] = useState(false);
    const [provisionSaving, setProvisionSaving] = useState(false);
    const [provisionError, setProvisionError] = useState('');

    // SideDrawer: Inspect Tenant
    const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [inspectTab, setInspectTab] = useState<'overview' | 'capacity' | 'control'>('overview');
    const [inspectSaving, setInspectSaving] = useState(false);

    // Selected Tenant Edit States
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [tenantFeatureOverrides, setTenantFeatureOverrides] = useState<Record<string, boolean>>({});
    const [limitsForm, setLimitsForm] = useState({
        max_students: 500,
        max_teachers: 25,
        max_storage_gb: 100,
        max_ai_tokens: 25000,
        is_white_label: false,
        domain: ''
    });

    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    // Auto-generate subdomain from name in provision drawer
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
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    const fetchTenants = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(classificationFilter !== 'all' && { tenant_type: classificationFilter }),
                ...(debouncedSearch && { search: debouncedSearch }),
            });
            const res = await fetch(`/api/owner/tenants?${params}`);
            const json = await res.json();
            if (res.ok) {
                setTenants(json.tenants ?? []);
                setTotal(json.total ?? 0);
                if (json.plans) setAvailablePlans(json.plans);
                if (json.planFeatures) setAvailableFeatures(json.planFeatures);
            }

            // Enrich with platform dashboard activity if available
            try {
                const aRes = await fetch('/api/owner/dashboard?days=30');
                const aJson = await aRes.json();
                if (aRes.ok && aJson.tenantSummaries) {
                    setTenants(prev => prev.map(t => {
                        const summary = aJson.tenantSummaries.find((s: any) => s.id === t.id);
                        return summary ? { ...t, ...summary } : t;
                    }));
                }
            } catch {
                // optional enrichment
            }
        } catch (e) {
            showToast('Failed to load registered tenants', false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, statusFilter, debouncedSearch, classificationFilter]);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    // Check if coming from CRM lead conversion
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
                            
                            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                            let pass = "";
                            for (let i = 0; i < 10; i++) {
                                pass += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            pass += "A1#";
                            
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
                            showToast(`Pre-populated details for inquiry: ${lead.name}`);
                        }
                    })
                    .catch(() => {
                        showToast('Failed to load inquiry details.', false);
                    });
            }
        }
    }, []);

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        pass += "A1#";
        setProvisionForm(f => ({ ...f, admin_password: pass }));
        setShowPass(true);
    };

    // When institution type changes in provision form, pick a recommended plan
    const handleProvisionTypeChange = (type: 'school' | 'institute' | 'independent_teacher') => {
        const matchingPlan = availablePlans.find(p => p.type === type) || availablePlans[0];
        setProvisionForm(f => ({
            ...f,
            tenant_type: type,
            plan_id: matchingPlan ? matchingPlan.id : '',
            max_students: matchingPlan ? matchingPlan.max_students : 500,
            max_teachers: matchingPlan ? matchingPlan.max_teachers : 25,
            max_storage_gb: matchingPlan?.max_storage_gb ?? 100,
            max_ai_tokens: matchingPlan?.max_ai_tokens ?? 25000,
        }));
    };

    const handleProvisionPlanChange = (planId: string) => {
        const plan = availablePlans.find(p => p.id === planId);
        setProvisionForm(f => ({
            ...f,
            plan_id: planId,
            ...(plan ? {
                max_students: plan.max_students,
                max_teachers: plan.max_teachers,
                max_storage_gb: plan.max_storage_gb ?? 100,
                max_ai_tokens: plan.max_ai_tokens ?? 25000,
            } : {})
        }));
    };

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
                body: JSON.stringify({
                    name: provisionForm.name,
                    type: provisionForm.tenant_type === 'school' ? 'SCHOOL' : (provisionForm.tenant_type === 'institute' ? 'INSTITUTE' : 'PERSONAL_TEACHER'),
                    tenant_type: provisionForm.tenant_type,
                    email: provisionForm.email,
                    subdomain: provisionForm.subdomain,
                    admin_first_name: provisionForm.admin_first_name,
                    admin_last_name: provisionForm.admin_last_name,
                    admin_password: provisionForm.admin_password,
                    max_students: provisionForm.max_students,
                    max_teachers: provisionForm.max_teachers,
                    max_storage_gb: provisionForm.max_storage_gb,
                    max_ai_tokens: provisionForm.max_ai_tokens,
                    is_white_label: provisionForm.is_white_label,
                    lead_id: provisionForm.lead_id || undefined
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to create tenant');

            // If a specific plan was selected, link it immediately
            if (provisionForm.plan_id && json.tenant?.id) {
                await fetch('/api/owner/tenants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'ASSIGN_PLAN',
                        payload: {
                            tenant_id: json.tenant.id,
                            plan_id: provisionForm.plan_id,
                            apply_defaults: false
                        }
                    })
                });
            }

            showToast(`Tenant "${provisionForm.name}" registered successfully`);
            setProvisionDrawerOpen(false);
            fetchTenants(true);
        } catch (e: any) {
            setProvisionError(e.message);
        } finally {
            setProvisionSaving(false);
        }
    };

    const openInspector = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setSelectedPlanId(tenant.current_plan_id || availablePlans.find(p => p.name?.toLowerCase() === tenant.subscription_plan?.toLowerCase())?.id || '');
        setTenantFeatureOverrides(tenant.features || {});
        setLimitsForm({
            max_students: tenant.max_students || 500,
            max_teachers: tenant.max_teachers || 25,
            max_storage_gb: tenant.max_storage_gb || 100,
            max_ai_tokens: tenant.max_ai_tokens || 25000,
            is_white_label: tenant.is_white_label || false,
            domain: tenant.domain || ''
        });
        setInspectTab('overview');
        setInspectDrawerOpen(true);
    };

    const handleAssignPlan = async (applyDefaults: boolean) => {
        if (!selectedTenant || !selectedPlanId) return;
        setInspectSaving(true);
        try {
            const res = await fetch('/api/owner/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ASSIGN_PLAN',
                    payload: {
                        tenant_id: selectedTenant.id,
                        plan_id: selectedPlanId,
                        apply_defaults: applyDefaults
                    }
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to assign plan');
            
            showToast(`Plan updated to ${json.plan?.name || 'new plan'} successfully`);
            if (applyDefaults && json.plan) {
                setLimitsForm(f => ({
                    ...f,
                    max_students: json.plan.max_students || f.max_students,
                    max_teachers: json.plan.max_teachers || f.max_teachers,
                    max_storage_gb: json.plan.max_storage_gb || f.max_storage_gb,
                    max_ai_tokens: json.plan.max_ai_tokens || f.max_ai_tokens
                }));
                if (json.plan.features) {
                    setTenantFeatureOverrides(json.plan.features);
                }
            }
            fetchTenants(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setInspectSaving(false);
        }
    };

    const handleToggleFeature = async (featureKey: string) => {
        if (!selectedTenant) return;
        const currentVal = tenantFeatureOverrides[featureKey] ?? false;
        const updated = { ...tenantFeatureOverrides, [featureKey]: !currentVal };
        setTenantFeatureOverrides(updated);

        try {
            const res = await fetch(`/api/owner/tenants/${selectedTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: updated })
            });
            if (!res.ok) throw new Error('Failed to update feature toggle');
            showToast(`Feature "${featureKey.replace(/_/g, ' ')}" updated`);
            setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, features: updated } : t));
        } catch (e: any) {
            setTenantFeatureOverrides(tenantFeatureOverrides);
            showToast(e.message, false);
        }
    };

    const handleSaveLimits = async () => {
        if (!selectedTenant) return;
        setInspectSaving(true);
        try {
            const res = await fetch(`/api/owner/tenants/${selectedTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    max_students: limitsForm.max_students,
                    max_teachers: limitsForm.max_teachers,
                    max_storage_gb: limitsForm.max_storage_gb,
                    max_ai_tokens: limitsForm.max_ai_tokens,
                    is_white_label: limitsForm.is_white_label,
                    domain: limitsForm.domain || null
                })
            });
            if (!res.ok) {
                const j = await res.json();
                throw new Error(j.error || 'Failed to update capacity limits');
            }
            showToast('Capacity settings and quotas updated successfully');
            fetchTenants(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setInspectSaving(false);
        }
    };

    const handleToggleSuspension = async () => {
        if (!selectedTenant) return;
        const futureActive = !selectedTenant.is_active;
        if (!confirm(`Are you sure you want to ${futureActive ? 'unsuspend' : 'suspend'} this account?`)) return;
        
        setInspectSaving(true);
        try {
            const res = await fetch(`/api/owner/tenants/${selectedTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_active: futureActive,
                    subscription_status: futureActive ? 'active' : 'suspended'
                })
            });
            if (!res.ok) throw new Error('Failed to change tenant status');
            showToast(futureActive ? 'Tenant reactivated successfully' : 'Tenant access suspended');
            setSelectedTenant({ ...selectedTenant, is_active: futureActive });
            fetchTenants(true);
        } catch (e: any) {
            showToast(e.message, false);
        } finally {
            setInspectSaving(false);
        }
    };

    const handleImpersonate = async () => {
        if (!selectedTenant) return;
        try {
            const res = await fetch(`/api/owner/tenants/${selectedTenant.id}/impersonate`, {
                method: 'POST'
            });
            const json = await res.json();
            if (res.ok) {
                showToast(`Session established for ${selectedTenant.name}. Opening dashboard...`);
                setTimeout(() => {
                    window.open(json.redirectUrl || '/dashboard', '_blank');
                }, 400);
            } else {
                showToast(json.error || 'Could not launch admin session', false);
            }
        } catch {
            showToast('Failed to start impersonation session', false);
        }
    };

    // Calculate Summary Metrics
    const metrics = useMemo(() => {
        const totalTenants = tenants.length;
        const activeTenants = tenants.filter(t => t.is_active).length;
        const schoolCount = tenants.filter(t => t.tenant_type === 'school').length;
        const instituteCount = tenants.filter(t => t.tenant_type === 'institute').length;
        const teacherCount = tenants.filter(t => t.tenant_type === 'independent_teacher').length;
        const totalAllocatedStudents = tenants.reduce((acc, t) => acc + (t.max_students || 0), 0);
        const totalCurrentUsers = tenants.reduce((acc, t) => acc + (t.total_users || 0), 0);
        return { totalTenants, activeTenants, schoolCount, instituteCount, teacherCount, totalAllocatedStudents, totalCurrentUsers };
    }, [tenants]);

    const getTenantTypeMeta = (type?: string) => {
        return SYSTEM_TENANT_TYPES.find(t => t.key === type) || SYSTEM_TENANT_TYPES[0];
    };

    const activeSelectedPlan = useMemo(() => {
        return availablePlans.find(p => p.id === selectedPlanId);
    }, [availablePlans, selectedPlanId]);

    return (
        <div style={{ background: P.bg, minHeight: '100vh', padding: '32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }
                .tab-btn:hover { background: #E2E8F0 !important; }
                .tenant-row:hover { background: #F8FAFC !important; }
            `}</style>

            {toast && (
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: toast.ok ? '#0F172A' : P.error, color: '#fff', borderRadius: 12, padding: '14px 22px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, boxShadow: SHADOWS.xl, zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {toast.ok ? <CheckCircle size={18} color="#10B981" /> : <AlertTriangle size={18} color="#F87171" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: P.brandBg, color: P.brand, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.brand }} />
                            Registered Tenants
                        </span>
                        <span style={{ background: '#F1F5F9', color: P.text, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 800 }}>
                            {total} Platforms
                        </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: '-0.5px' }}>Tenant Management</div>
                    <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Manage platform institutions, dynamic plan subscriptions, resource capacities, and access control.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => fetchTenants(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text, boxShadow: SHADOWS.sm }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Sync
                    </button>
                    <button onClick={() => {
                        const defaultPlan = availablePlans[0];
                        setProvisionForm({
                            name: '',
                            tenant_type: 'school',
                            plan_id: defaultPlan ? defaultPlan.id : '',
                            email: '',
                            subdomain: '',
                            admin_first_name: '',
                            admin_last_name: '',
                            admin_password: '',
                            max_students: defaultPlan ? defaultPlan.max_students : 500,
                            max_teachers: defaultPlan ? defaultPlan.max_teachers : 25,
                            max_storage_gb: defaultPlan?.max_storage_gb ?? 100,
                            max_ai_tokens: defaultPlan?.max_ai_tokens ?? 25000,
                            is_white_label: false,
                            lead_id: ''
                        });
                        setProvisionError('');
                        setProvisionDrawerOpen(true);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: P.brand, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff', boxShadow: '0 2px 8px rgba(0,75,147,0.25)' }}>
                        <Plus size={15} strokeWidth={2.5} /> Register Tenant
                    </button>
                </div>
            </div>

            {/* TOP METRIC KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: SHADOWS.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>TOTAL INSTITUTIONS</span>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={18} color={P.brand} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: P.dark }}>{metrics.totalTenants}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#004B93', background: '#004B9310', padding: '2px 6px', borderRadius: 4 }}>{metrics.schoolCount} Schools</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', background: '#7C3AED10', padding: '2px 6px', borderRadius: 4 }}>{metrics.instituteCount} Institutes</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#D97706', background: '#D9770610', padding: '2px 6px', borderRadius: 4 }}>{metrics.teacherCount} Educators</span>
                    </div>
                </div>

                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: SHADOWS.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>SUBSCRIPTION HEALTH</span>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: P.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={18} color={P.success} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: P.dark }}>
                        {metrics.totalTenants > 0 ? `${Math.round((metrics.activeTenants / metrics.totalTenants) * 100)}%` : '100%'}
                    </div>
                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 8 }}>
                        <span style={{ color: P.success, fontWeight: 800 }}>{metrics.activeTenants} Active</span> • {metrics.totalTenants - metrics.activeTenants} Suspended
                    </div>
                </div>

                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: SHADOWS.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>STUDENT CAPACITY</span>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: P.purpleBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={18} color={P.purple} />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: P.dark }}>
                        {metrics.totalCurrentUsers} <span style={{ fontSize: 14, fontWeight: 700, color: P.muted }}>/ {metrics.totalAllocatedStudents}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
                        <div style={{ width: `${Math.min(100, Math.round((metrics.totalCurrentUsers / (metrics.totalAllocatedStudents || 1)) * 100))}%`, height: '100%', background: P.purple, borderRadius: 4 }} />
                    </div>
                </div>

                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: SHADOWS.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>SYSTEM PLANS & MODULES</span>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={18} color="#2563EB" />
                        </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: P.dark }}>
                        {availablePlans.length} <span style={{ fontSize: 13, fontWeight: 700, color: P.muted }}>Plans</span>
                    </div>
                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 8 }}>
                        <span style={{ color: '#2563EB', fontWeight: 800 }}>{availableFeatures.length} Feature Modules</span> configured
                    </div>
                </div>
            </div>

            {/* FILTER PANEL */}
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, boxShadow: SHADOWS.sm }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search tenants by institution name, subdomain, or admin email..."
                        style={{ width: '100%', padding: '10px 14px 10px 40px', border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 13, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: P.muted }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    {/* TYPE FILTER PILLS */}
                    <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: 4 }}>
                        {[
                            { key: 'all', label: 'ALL TYPES', icon: Layers },
                            { key: 'school', label: 'SCHOOLS', icon: School },
                            { key: 'institute', label: 'INSTITUTES', icon: Building2 },
                            { key: 'independent_teacher', label: 'EDUCATORS', icon: GraduationCap },
                        ].map(f => {
                            const IconComponent = f.icon;
                            const isSel = classificationFilter === f.key;
                            return (
                                <button key={f.key} onClick={() => { setClassificationFilter(f.key as any); setPage(1); }} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                    background: isSel ? P.card : 'transparent',
                                    color: isSel ? P.brand : P.muted,
                                    border: 'none', boxShadow: isSel ? SHADOWS.sm : 'none', transition: 'all 0.15s'
                                }}>
                                    <IconComponent size={13} />
                                    <span>{f.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* STATUS FILTER PILLS */}
                    <div style={{ display: 'flex', gap: 4, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 12, padding: 4 }}>
                        {(['all', 'active', 'suspended'] as const).map(f => (
                            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }} style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                background: statusFilter === f ? P.card : 'transparent',
                                color: statusFilter === f ? (f === 'suspended' ? P.error : P.brand) : P.muted,
                                border: 'none', boxShadow: statusFilter === f ? SHADOWS.sm : 'none', transition: 'all 0.15s'
                            }}>{f === 'all' ? 'ALL STATUS' : f.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <DataTable
                data={tenants}
                loading={loading}
                getRowId={item => item.id}
                minWidth={940}
                columns={[
                    {
                        header: 'Institution Details',
                        render: item => {
                            const meta = getTenantTypeMeta(item.tenant_type);
                            const IconComp = meta.icon;
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <IconComp size={22} color={meta.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: P.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span>{item.name}</span>
                                            {item.is_white_label && (
                                                <span title="White-label Active" style={{ background: '#FEF3C7', color: '#D97706', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 900 }}>PRO</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                            <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{item.subdomain}.bebrilliant.in</span>
                                            <a
                                                href={`https://${item.subdomain}.bebrilliant.in`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                title="Visit Live Tenant Portal"
                                                style={{ color: P.brand, display: 'inline-flex', alignItems: 'center' }}
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                            <span style={{ fontSize: 9, fontWeight: 800, color: meta.color, background: meta.bg, padding: '1px 6px', borderRadius: 4 }}>
                                                {meta.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    },
                    {
                        header: 'Account Owner',
                        render: item => (
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: P.dark }}>{item.email}</div>
                                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
                                    Registered: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Subscription Plan',
                        render: item => {
                            const planName = item.subscription_plan || 'School (Basic)';
                            return (
                                <div>
                                    <span style={{ background: P.brandBg, color: P.brand, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <Crown size={12} /> {planName.toUpperCase()}
                                    </span>
                                </div>
                            );
                        }
                    },
                    {
                        header: 'Resource Capacities',
                        render: item => {
                            const totalUsers = item.total_users ?? 0;
                            const maxStud = item.max_students || 500;
                            const pct = Math.min(100, Math.round((totalUsers / maxStud) * 100));
                            return (
                                <div style={{ width: 160 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: P.dark, marginBottom: 4 }}>
                                        <span>{totalUsers} / {maxStud} Students</span>
                                        <span style={{ color: P.muted }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: P.brand, borderRadius: 4 }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>
                                        {item.max_teachers || 25} Teachers • {item.max_storage_gb || 100} GB • {((item.max_ai_tokens || 25000)/1000).toFixed(0)}k AI
                                    </div>
                                </div>
                            );
                        }
                    },
                    {
                        header: 'Activity',
                        render: item => (
                            <div style={{ fontSize: 12, color: P.text }}>
                                <div style={{ fontWeight: 700, color: P.dark }}>{item.examCount ?? 0} Exams</div>
                                <div style={{ color: P.success, fontWeight: 800, fontSize: 11 }}>{item.avgAccuracy ?? 0}% Accuracy</div>
                            </div>
                        )
                    },
                    {
                        header: 'Status',
                        render: item => (
                            <span style={{
                                background: item.is_active ? P.successBg : P.errorBg,
                                color: item.is_active ? P.success : P.error,
                                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                                display: 'inline-flex', alignItems: 'center', gap: 5
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.is_active ? P.success : P.error }} />
                                {item.is_active ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        render: item => (
                            <button onClick={() => openInspector(item)} style={{ padding: '7px 14px', background: P.brandBg, border: 'none', borderRadius: 9, color: P.brand, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Settings size={13} /> Manage
                            </button>
                        )
                    }
                ]}
            />

            {/* DRAWER: REGISTER NEW TENANT */}
            <SideDrawer
                isOpen={provisionDrawerOpen}
                onClose={() => setProvisionDrawerOpen(false)}
                title="Register New Tenant"
                subTitle="Onboard a new school, coaching institute, or independent educator"
                width={560}
                footer={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setProvisionDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, color: P.text }}>
                            Cancel
                        </button>
                        <button onClick={handleProvisionTenant} disabled={provisionSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,75,147,0.25)' }}>
                            {provisionSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />} Save & Create Account
                        </button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {provisionError && (
                        <div style={{ background: P.errorBg, border: `1px solid ${P.error}30`, borderRadius: 10, padding: 14, fontSize: 12, color: P.error, fontWeight: 600, display: 'flex', gap: 8 }}>
                            <AlertTriangle size={16} /> <span>{provisionError}</span>
                        </div>
                    )}

                    {/* Institution Type Selector */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution Classification</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {SYSTEM_TENANT_TYPES.map(st => {
                                const IconComp = st.icon;
                                const isSel = provisionForm.tenant_type === st.key;
                                return (
                                    <div
                                        key={st.key}
                                        onClick={() => handleProvisionTypeChange(st.key)}
                                        style={{
                                            border: `2px solid ${isSel ? P.brand : P.border}`,
                                            background: isSel ? P.brandBg : P.card,
                                            borderRadius: 12, padding: '12px 10px', cursor: 'pointer', textAlign: 'center',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: isSel ? P.brand : st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                                            <IconComp size={16} color={isSel ? '#fff' : st.color} />
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: isSel ? P.brand : P.dark }}>{st.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Initial Plan Assignment */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Subscription Plan</label>
                        <select
                            value={provisionForm.plan_id}
                            onChange={e => handleProvisionPlanChange(e.target.value)}
                            style={{ width: '100%', padding: '11px 14px', border: '1px solid ' + P.border, borderRadius: 10, fontSize: 13, background: P.card, fontWeight: 700, color: P.dark }}
                        >
                            {availablePlans.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — ₹{Number(p.price).toLocaleString('en-IN')}/mo ({p.max_students} Students, {p.max_teachers} Teachers)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Institution Name */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution / Brand Name</label>
                        <input
                            value={provisionForm.name}
                            onChange={e => setProvisionForm({ ...provisionForm, name: e.target.value })}
                            placeholder="e.g. Silver Bells School or Apex Coaching"
                            style={{ width: '100%', padding: '11px 14px', border: '1px solid ' + P.border, borderRadius: 10, fontSize: 13, background: P.card, fontWeight: 600 }}
                        />
                    </div>

                    {/* Subdomain URL */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subdomain URL</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                value={provisionForm.subdomain}
                                onChange={e => setProvisionForm({ ...provisionForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                placeholder="silverbells"
                                style={{ flex: 1, padding: '11px 14px', border: '1px solid ' + P.border, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderRight: 'none', fontSize: 13, background: P.card, fontWeight: 700, color: P.dark }}
                            />
                            <span style={{ padding: '11px 14px', border: '1px solid ' + P.border, borderTopRightRadius: 10, borderBottomRightRadius: 10, fontSize: 13, background: '#F1F5F9', color: P.text, fontWeight: 700 }}>
                                .bebrilliant.in
                            </span>
                        </div>
                    </div>

                    {/* Admin Contact Name */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Admin First Name</label>
                            <input
                                value={provisionForm.admin_first_name}
                                onChange={e => setProvisionForm({ ...provisionForm, admin_first_name: e.target.value })}
                                placeholder="e.g. Principal"
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Admin Last Name</label>
                            <input
                                value={provisionForm.admin_last_name}
                                onChange={e => setProvisionForm({ ...provisionForm, admin_last_name: e.target.value })}
                                placeholder="e.g. Sharma"
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}
                            />
                        </div>
                    </div>

                    {/* Admin Login Email */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Login Email</label>
                        <input
                            value={provisionForm.email}
                            onChange={e => setProvisionForm({ ...provisionForm, email: e.target.value })}
                            placeholder="admin@school.com"
                            style={{ width: '100%', padding: '11px 14px', border: '1px solid ' + P.border, borderRadius: 10, fontSize: 13, background: P.card, fontWeight: 600 }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 900, color: P.dark, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Password</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={provisionForm.admin_password}
                                    onChange={e => setProvisionForm({ ...provisionForm, admin_password: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    {showPass ? <EyeOff size={16} color={P.muted} /> : <Eye size={16} color={P.muted} />}
                                </button>
                            </div>
                            <button type="button" onClick={generatePassword} style={{ padding: '10px 14px', background: P.brandBg, border: 'none', borderRadius: 9, color: P.brand, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Key size={14} /> Generate
                            </button>
                        </div>
                    </div>

                    {/* Default Capacity Preview */}
                    <div style={{ borderTop: '1px solid ' + P.border, paddingTop: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: P.dark, marginBottom: 10 }}>Resource Allocations</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            <div style={{ background: P.bg, padding: 10, borderRadius: 8, border: '1px solid ' + P.border }}>
                                <div style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>STUDENTS</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: P.dark, marginTop: 2 }}>{provisionForm.max_students}</div>
                            </div>
                            <div style={{ background: P.bg, padding: 10, borderRadius: 8, border: '1px solid ' + P.border }}>
                                <div style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>TEACHERS</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: P.dark, marginTop: 2 }}>{provisionForm.max_teachers}</div>
                            </div>
                            <div style={{ background: P.bg, padding: 10, borderRadius: 8, border: '1px solid ' + P.border }}>
                                <div style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>STORAGE</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: P.dark, marginTop: 2 }}>{provisionForm.max_storage_gb} GB</div>
                            </div>
                            <div style={{ background: P.bg, padding: 10, borderRadius: 8, border: '1px solid ' + P.border }}>
                                <div style={{ fontSize: 10, color: P.muted, fontWeight: 700 }}>AI TOKENS</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: P.dark, marginTop: 2 }}>{(provisionForm.max_ai_tokens/1000).toFixed(0)}k</div>
                            </div>
                        </div>
                    </div>
                </div>
            </SideDrawer>

            {/* DRAWER: MANAGE TENANT ACCOUNT */}
            <SideDrawer
                isOpen={inspectDrawerOpen}
                onClose={() => setInspectDrawerOpen(false)}
                title={
                    selectedTenant ? (
                        selectedTenant.tenant_type === 'school' ? 'Manage School Account' :
                        selectedTenant.tenant_type === 'institute' ? 'Manage Coaching Institute' :
                        'Manage Educator Account'
                    ) : 'Manage Tenant Account'
                }
                subTitle={selectedTenant ? `${selectedTenant.name} • ${selectedTenant.subdomain}.bebrilliant.in` : ''}
                width={580}
                footer={
                    inspectTab === 'capacity' ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setInspectDrawerOpen(false)} style={{ flex: 1, padding: '12px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, color: P.text }}>
                                Cancel
                            </button>
                            <button onClick={handleSaveLimits} disabled={inspectSaving} style={{ flex: 2, padding: '12px', background: P.brand, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {inspectSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />} Save Capacity Settings
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
                                { key: 'overview', label: 'Overview & Plan', icon: Layers },
                                { key: 'capacity', label: 'Capacity Matrix', icon: HardDrive },
                                { key: 'control', label: 'Account Control', icon: ShieldAlert }
                            ].map(t => {
                                const IconComponent = t.icon;
                                const isAct = inspectTab === t.key;
                                return (
                                    <button key={t.key} onClick={() => setInspectTab(t.key as any)} style={{
                                        flex: 1, padding: '9px 10px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                        background: isAct ? P.card : 'transparent',
                                        color: isAct ? P.brand : P.muted,
                                        boxShadow: isAct ? SHADOWS.sm : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        transition: 'all 0.15s'
                                    }}>
                                        <IconComponent size={14} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* TAB 1: OVERVIEW & PLAN */}
                        {inspectTab === 'overview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Top Banner Cards */}
                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <div style={{ fontSize: 11, color: P.muted, fontWeight: 800, textTransform: 'uppercase' }}>Subdomain Portal Website</div>
                                        <a
                                            href={`https://${selectedTenant.subdomain}.bebrilliant.in`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ fontSize: 11, fontWeight: 800, color: P.brand, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                                        >
                                            <span>Visit Portal</span> <ExternalLink size={12} />
                                        </a>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: P.dark }}>https://{selectedTenant.subdomain}.bebrilliant.in</div>
                                    {selectedTenant.domain && (
                                        <div style={{ fontSize: 12, color: P.brand, fontWeight: 700, marginTop: 4 }}>
                                            Custom Domain: https://{selectedTenant.domain}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={{ background: P.bg, padding: 14, borderRadius: 12, border: '1px solid ' + P.border }}>
                                        <div style={{ fontSize: 10, color: P.muted, fontWeight: 800, textTransform: 'uppercase' }}>Account Owner Email</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: P.dark, marginTop: 4, wordBreak: 'break-all' }}>{selectedTenant.email}</div>
                                    </div>
                                    <div style={{ background: P.bg, padding: 14, borderRadius: 12, border: '1px solid ' + P.border }}>
                                        <div style={{ fontSize: 10, color: P.muted, fontWeight: 800, textTransform: 'uppercase' }}>Registration Date</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: P.dark, marginTop: 4 }}>
                                            {new Date(selectedTenant.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Plan Selector & Assignment */}
                                <div style={{ background: P.card, border: `2px solid ${P.brand}30`, borderRadius: 14, padding: 18, boxShadow: SHADOWS.sm }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <Crown size={16} color={P.brand} />
                                            <span style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>ASSIGN SUBSCRIPTION PLAN</span>
                                        </div>
                                        <span style={{ background: P.brandBg, color: P.brand, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>
                                            CURRENT: {(selectedTenant.subscription_plan || 'School (Basic)').toUpperCase()}
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: 14 }}>
                                        <label style={{ fontSize: 11, fontWeight: 800, color: P.muted, display: 'block', marginBottom: 6 }}>Select System Plan from Catalog</label>
                                        <select
                                            value={selectedPlanId}
                                            onChange={e => setSelectedPlanId(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 10, fontSize: 13, background: P.bg, fontWeight: 700, color: P.dark }}
                                        >
                                            <option value="">-- Choose Plan to Assign --</option>
                                            {availablePlans.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (₹{Number(p.price).toLocaleString('en-IN')}/mo) — {p.max_students} Students
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {activeSelectedPlan && (
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{activeSelectedPlan.name} Specs</span>
                                                <span style={{ fontSize: 12, fontWeight: 900, color: P.brand }}>
                                                    ₹{Number(activeSelectedPlan.price).toLocaleString('en-IN')} / mo
                                                    {activeSelectedPlan.yearly_price && <span style={{ fontSize: 10, color: P.muted, marginLeft: 6 }}>or ₹{Number(activeSelectedPlan.yearly_price).toLocaleString('en-IN')}/yr</span>}
                                                </span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 11 }}>
                                                <div><span style={{ color: P.muted }}>Students:</span> <strong>{activeSelectedPlan.max_students}</strong></div>
                                                <div><span style={{ color: P.muted }}>Teachers:</span> <strong>{activeSelectedPlan.max_teachers}</strong></div>
                                                <div><span style={{ color: P.muted }}>Storage:</span> <strong>{activeSelectedPlan.max_storage_gb ?? 50}GB</strong></div>
                                                <div><span style={{ color: P.muted }}>AI Tokens:</span> <strong>{((activeSelectedPlan.max_ai_tokens ?? 25000)/1000).toFixed(0)}k</strong></div>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleAssignPlan(false)}
                                            disabled={inspectSaving || !selectedPlanId}
                                            style={{ flex: 1, padding: '10px', background: P.bg, border: '1px solid ' + P.border, borderRadius: 8, fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer' }}
                                        >
                                            Assign Plan Only
                                        </button>
                                        <button
                                            onClick={() => handleAssignPlan(true)}
                                            disabled={inspectSaving || !selectedPlanId}
                                            style={{ flex: 1.5, padding: '10px', background: P.brand, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                        >
                                            <Zap size={13} /> Assign & Apply Quotas
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Feature Modules Registry */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: P.dark }}>AVAILABLE FEATURE MODULES</div>
                                            <div style={{ fontSize: 11, color: P.muted }}>Toggle specific system features ON or OFF for this tenant</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {availableFeatures.map(feat => {
                                            const isEnabled = tenantFeatureOverrides[feat.key] ?? false;
                                            return (
                                                <div
                                                    key={feat.key}
                                                    onClick={() => handleToggleFeature(feat.key)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '12px 16px', background: isEnabled ? '#F0FDF4' : P.card,
                                                        border: `1px solid ${isEnabled ? '#86EFAC' : P.border}`,
                                                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 800, color: isEnabled ? '#166534' : P.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span>{feat.label}</span>
                                                            <span style={{ fontSize: 10, color: P.muted, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{feat.category}</span>
                                                        </div>
                                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{feat.description}</div>
                                                    </div>
                                                    <div style={{
                                                        width: 44, height: 24, borderRadius: 12,
                                                        background: isEnabled ? P.success : '#CBD5E1',
                                                        position: 'relative', transition: 'all 0.2s', flexShrink: 0
                                                    }}>
                                                        <div style={{
                                                            width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                                            position: 'absolute', top: 3, left: isEnabled ? 23 : 3,
                                                            transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CAPACITY MATRIX */}
                        {inspectTab === 'capacity' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Resource Capacity Allocation</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                        <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 6 }}>MAX STUDENT SLOTS</label>
                                        <input
                                            type="number"
                                            value={limitsForm.max_students}
                                            onChange={e => setLimitsForm({ ...limitsForm, max_students: parseInt(e.target.value) || 0 })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 15, fontWeight: 800, color: P.dark, background: P.card }}
                                        />
                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>
                                            Enrolled: <strong>{selectedTenant.total_users ?? 0}</strong> users
                                        </div>
                                    </div>

                                    <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                        <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 6 }}>MAX TEACHER SLOTS</label>
                                        <input
                                            type="number"
                                            value={limitsForm.max_teachers}
                                            onChange={e => setLimitsForm({ ...limitsForm, max_teachers: parseInt(e.target.value) || 0 })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 15, fontWeight: 800, color: P.dark, background: P.card }}
                                        />
                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>Staff licenses allowed</div>
                                    </div>

                                    <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                        <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 6 }}>CLOUD STORAGE (GB)</label>
                                        <input
                                            type="number"
                                            value={limitsForm.max_storage_gb}
                                            onChange={e => setLimitsForm({ ...limitsForm, max_storage_gb: parseInt(e.target.value) || 50 })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 15, fontWeight: 800, color: P.dark, background: P.card }}
                                        />
                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>PDF & material quota</div>
                                    </div>

                                    <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border }}>
                                        <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 6 }}>SMART AI TOKENS</label>
                                        <input
                                            type="number"
                                            value={limitsForm.max_ai_tokens}
                                            onChange={e => setLimitsForm({ ...limitsForm, max_ai_tokens: parseInt(e.target.value) || 25000 })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 15, fontWeight: 800, color: P.dark, background: P.card }}
                                        />
                                        <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>Monthly GenAI calls</div>
                                    </div>
                                </div>

                                <div style={{ background: P.bg, padding: 16, borderRadius: 12, border: '1px solid ' + P.border, marginTop: 4 }}>
                                    <label style={{ fontSize: 11, color: P.muted, fontWeight: 800, display: 'block', marginBottom: 6 }}>CUSTOM DOMAIN MAPPING</label>
                                    <input
                                        value={limitsForm.domain}
                                        onChange={e => setLimitsForm({ ...limitsForm, domain: e.target.value })}
                                        placeholder="e.g. portal.silverbells.edu.in"
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.card }}
                                    />
                                    <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>
                                        Allows institution to point their own CNAME domain.
                                    </div>
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: P.dark, padding: '8px 12px', background: P.bg, borderRadius: 10, border: '1px solid ' + P.border }}>
                                    <input
                                        type="checkbox"
                                        checked={limitsForm.is_white_label}
                                        onChange={e => setLimitsForm({ ...limitsForm, is_white_label: e.target.checked })}
                                        style={{ width: 16, height: 16, accentColor: P.brand }}
                                    />
                                    <span>Enable Custom Branding & White-Label Domain</span>
                                </label>
                            </div>
                        )}

                        {/* TAB 3: ACCOUNT CONTROL */}
                        {inspectTab === 'control' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Impersonation / Direct Switch */}
                                <div style={{ padding: 18, background: P.brandBg, border: `1px solid ${P.brand}30`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <LogIn size={16} color={P.brand} />
                                        <div style={{ fontSize: 13, fontWeight: 800, color: P.brand }}>Platform Super Admin Direct Login</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: P.text, lineHeight: 1.5 }}>
                                        Instantly launch the live admin dashboard for this institution to review curriculum, exams, or troubleshoot issues.
                                    </div>
                                    <button
                                        onClick={handleImpersonate}
                                        style={{ width: '100%', padding: '11px', background: P.brand, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        <ExternalLink size={14} /> Open Tenant Workspace
                                    </button>
                                </div>

                                {/* Suspension Box */}
                                <div style={{ padding: 16, background: selectedTenant.is_active ? '#FEF2F2' : '#ECFDF5', border: '1px solid ' + (selectedTenant.is_active ? '#FCA5A5' : '#86EFAC'), borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: selectedTenant.is_active ? P.error : P.success }}>
                                        {selectedTenant.is_active ? 'Suspend Tenant Access' : 'Reactivate Tenant Access'}
                                    </div>
                                    <div style={{ fontSize: 11, color: P.text, lineHeight: 1.5 }}>
                                        {selectedTenant.is_active 
                                            ? 'Suspending this tenant blocks all students and teachers from logging in. Data is preserved.'
                                            : 'Reactivating will restore instant access across all portals.'}
                                    </div>
                                    <button
                                        onClick={handleToggleSuspension}
                                        disabled={inspectSaving}
                                        style={{ width: '100%', padding: '10px', background: selectedTenant.is_active ? P.error : P.success, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                                    >
                                        {selectedTenant.is_active ? 'SUSPEND TENANT ACCESS' : 'REACTIVATE TENANT ACCESS'}
                                    </button>
                                </div>

                                {/* Password Reset Box */}
                                <div style={{ padding: 16, background: P.bg, border: '1px solid ' + P.border, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Admin Password Reset</div>
                                    <div style={{ fontSize: 11, color: P.muted }}>Send an automated password reset link to the account owner ({selectedTenant.email}).</div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/owner/tenants/reset-password', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email: selectedTenant.email })
                                                });
                                                const j = await res.json();
                                                if (res.ok) {
                                                    showToast('Password reset link sent to ' + selectedTenant.email);
                                                } else {
                                                    showToast(j.error || 'Failed to send reset email', false);
                                                }
                                            } catch {
                                                showToast('Failed to send reset email', false);
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px', background: '#F1F5F9', color: P.dark, border: '1px solid ' + P.border, borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                                    >
                                        Send Password Reset Email
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
