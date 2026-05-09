'use client'

import { useState, useEffect } from 'react'
import {
    CreditCard, Settings, Save, Loader2, CheckCircle2,
    AlertCircle, School, Building2, User,
    ToggleLeft, ToggleRight, Clock, Sparkles, X
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

const TENANT_META = {
    school: {
        label: 'School',
        icon: School,
        description: 'Schools with internal teachers and a fixed student base.',
        color: P.brand,
        bg: P.brandBg,
    },
    institute: {
        label: 'Institute',
        icon: Building2,
        description: 'Coaching classes and tuition centres with multiple faculty.',
        color: P.success,
        bg: P.successBg,
    },
    independent_teacher: {
        label: 'Independent Teacher',
        icon: User,
        description: 'Solo educator or tutor with a direct student roster.',
        color: P.cta,
        bg: P.ctaBg,
    },
}

type Config = {
    id: string
    tenant_type: keyof typeof TENANT_META
    free_wallet_credits: number
    credit_expiry_days: number | null
    first_time_only: boolean
    is_active: boolean
}

export default function WalletConfigPage() {
    const [configs, setConfigs] = useState<Config[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        const defaultConfigs: Config[] = [
            { id: '1', tenant_type: 'school', free_wallet_credits: 0, credit_expiry_days: null, first_time_only: true, is_active: true },
            { id: '2', tenant_type: 'institute', free_wallet_credits: 500, credit_expiry_days: null, first_time_only: true, is_active: true },
            { id: '3', tenant_type: 'independent_teacher', free_wallet_credits: 200, credit_expiry_days: null, first_time_only: true, is_active: true },
        ];
        fetch('/api/owner/wallet-config')
            .then(r => r.json())
            .then(data => { 
                if (Array.isArray(data) && data.length > 0) {
                    const merged = defaultConfigs.map(def => {
                        const found = data.find((d: any) => d.tenant_type === def.tenant_type);
                        return found || def;
                    });
                    setConfigs(merged);
                } else {
                    setConfigs(defaultConfigs);
                }
            })
            .catch(() => setConfigs(defaultConfigs))
            .finally(() => setLoading(false))
    }, [])

    const update = (type: string, key: keyof Config, value: unknown) => {
        setConfigs(prev => prev.map(c => c.tenant_type === type ? { ...c, [key]: value } : c))
    }

    const handleSave = async () => {
        setSaving(true)
        setMsg(null)
        try {
            const res = await fetch('/api/owner/wallet-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configs),
            })
            const result = await res.json()
            if (result.success) {
                setMsg({ type: 'success', text: 'Wallet credit settings saved successfully.' })
            } else {
                setMsg({ type: 'error', text: result.error || 'Failed to save settings.' })
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div style={{ padding: 100, textAlign: 'center' }}>
            <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ padding: '40px 60px', background: P.bg, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES}</style>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={24} color={P.brand} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 30, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Wallet Credit Settings</h1>
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: P.muted, fontWeight: 600 }}>Configure how many free credits each tenant type allocates on student enrollment.</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '14px 32px', background: P.brand, color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30`, opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>

            {/* SAVE MESSAGE */}
            {msg && (
                <div style={{
                    marginBottom: 32, padding: '16px 24px', borderRadius: 16,
                    background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                    color: msg.type === 'success' ? '#065F46' : '#991B1B',
                    fontSize: 14, fontWeight: 700
                }}>
                    {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
                </div>
            )}

            {/* EXPLANATION BANNER */}
            <div style={{ marginBottom: 40, padding: '20px 28px', background: P.brandBg, borderRadius: 20, border: `1px solid ${P.brand}20`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <Sparkles size={20} color={P.brand} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 14, color: P.dark, fontWeight: 600, lineHeight: 1.7 }}>
                    <strong>How it works:</strong> When a student is enrolled under a tenant, the system automatically checks the tenant's type and credits the student's wallet with the configured free credits.{' '}
                    <strong>Free credits are always consumed first</strong> before paid credits — and generate no commission or revenue event.
                    Paid credit usage triggers the standard commission split.
                </div>
            </div>

            {/* CONFIG CARDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {configs.map(cfg => {
                    const meta = TENANT_META[cfg.tenant_type]
                    if (!meta) return null
                    const Icon = meta.icon

                    return (
                        <div key={cfg.tenant_type} className="glass-card" style={{
                            background: P.card, borderRadius: 28, border: `1px solid ${P.border}`,
                            overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            {/* CARD HEADER */}
                            <div style={{ padding: '28px 36px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 16, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={26} color={meta.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: P.dark }}>{meta.label}</div>
                                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginTop: 2 }}>{meta.description}</div>
                                    </div>
                                </div>
                                {/* ACTIVE TOGGLE */}
                                <button
                                    onClick={() => update(cfg.tenant_type, 'is_active', !cfg.is_active)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: cfg.is_active ? P.successBg : '#F1F5F9', border: `1px solid ${cfg.is_active ? P.success : P.border}`, borderRadius: 12, padding: '10px 18px', cursor: 'pointer' }}
                                >
                                    {cfg.is_active
                                        ? <ToggleRight size={20} color={P.success} />
                                        : <ToggleLeft size={20} color={P.muted} />}
                                    <span style={{ fontSize: 13, fontWeight: 800, color: cfg.is_active ? P.success : P.muted }}>
                                        {cfg.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </button>
                            </div>

                            {/* FORM FIELDS */}
                            <div style={{ padding: '28px 36px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
                                
                                {/* FREE CREDITS */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                        Free Credits on Enrollment
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 900, color: meta.color }}>₡</span>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={10000}
                                            value={cfg.free_wallet_credits}
                                            onChange={e => update(cfg.tenant_type, 'free_wallet_credits', parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', height: 52, padding: '0 16px 0 56px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 13, fontSize: 20, fontWeight: 900, color: P.dark, outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 6 }}>
                                        Set to 0 to disable free credits.
                                    </div>
                                </div>

                                {/* EXPIRY DAYS */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                        Free Credit Expiry (Days)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} color={P.muted} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="number"
                                            min={0}
                                            placeholder="No Expiry"
                                            value={cfg.credit_expiry_days ?? ''}
                                            onChange={e => update(cfg.tenant_type, 'credit_expiry_days', e.target.value === '' ? null : parseInt(e.target.value))}
                                            style={{ width: '100%', height: 52, padding: '0 16px 0 48px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 13, fontSize: 16, fontWeight: 800, color: P.dark, outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 6 }}>Leave blank for no expiry.</div>
                                </div>

                                {/* FIRST TIME ONLY */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                        Grant Only on First Enrollment
                                    </label>
                                    <button
                                        onClick={() => update(cfg.tenant_type, 'first_time_only', !cfg.first_time_only)}
                                        style={{
                                            width: '100%', height: 52, borderRadius: 13, border: `2px solid ${cfg.first_time_only ? P.brand : P.border}`,
                                            background: cfg.first_time_only ? P.brandBg : P.bg,
                                            display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', cursor: 'pointer'
                                        }}
                                    >
                                        {cfg.first_time_only
                                            ? <ToggleRight size={22} color={P.brand} />
                                            : <ToggleLeft size={22} color={P.muted} />}
                                        <span style={{ fontSize: 14, fontWeight: 800, color: cfg.first_time_only ? P.brand : P.muted }}>
                                            {cfg.first_time_only ? 'Yes — First Time Only' : 'No — Every Enrollment'}
                                        </span>
                                    </button>
                                    <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginTop: 6 }}>
                                        Recommended: keep ON to prevent abuse.
                                    </div>
                                </div>
                            </div>

                            {/* SUMMARY ROW */}
                            <div style={{ padding: '16px 36px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', gap: 32, alignItems: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: P.muted }}>
                                    Students enrolled under a <strong style={{ color: P.dark }}>{meta.label}</strong> tenant receive{' '}
                                    <strong style={{ color: meta.color, fontSize: 16 }}>{cfg.free_wallet_credits}</strong> free credits
                                    {cfg.credit_expiry_days ? ` (expires in ${cfg.credit_expiry_days} days)` : ' (no expiry)'}
                                    {cfg.first_time_only ? ', first enrollment only' : ', on every enrollment'}.
                                </div>
                                <div style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 10, background: cfg.is_active ? P.successBg : '#F1F5F9', color: cfg.is_active ? P.success : P.muted, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', flexShrink: 0 }}>
                                    {cfg.is_active ? '● Active' : '○ Disabled'}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* COMMISSION NOTE */}
            <div style={{ marginTop: 40, padding: '20px 28px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#92400E', lineHeight: 1.7 }}>
                <strong>💡 Commission Note:</strong> Free credits carry no financial value — when a student pays with free credits, no payment or commission event is recorded.
                Commission only applies when students pay using <strong>paid credits</strong> or direct exam fees.
            </div>

            {/* PERMISSIONS GRID */}
            <div style={{ marginTop: 40, background: P.card, border: `1px solid ${P.border}`, borderRadius: 28, overflow: 'hidden' }}>
                <div style={{ padding: '24px 36px', borderBottom: `1px solid ${P.border}` }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: P.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Settings size={20} color={P.brand} /> Tenant Type Permissions Grid
                    </h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: P.bg }}>
                            {['Permission', 'School', 'Institute', 'Independent Teacher'].map(h => (
                                <th key={h} style={{ padding: '16px 24px', textAlign: h === 'Permission' ? 'left' : 'center', fontSize: 12, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { perm: 'Create sub-teachers / faculty', school: true, institute: true, teacher: false },
                            { perm: 'Students assigned to tenant', school: true, institute: true, teacher: true },
                            { 
                                perm: 'Free credits on enrollment', 
                                school: configs.find(c => c.tenant_type === 'school')?.free_wallet_credits?.toString() || '0', 
                                institute: configs.find(c => c.tenant_type === 'institute')?.free_wallet_credits?.toString() || '0', 
                                teacher: configs.find(c => c.tenant_type === 'independent_teacher')?.free_wallet_credits?.toString() || '0' 
                            },
                            { perm: 'Commission configurable', school: true, institute: true, teacher: true },
                            { perm: 'Owner can override credits', school: true, institute: true, teacher: true },
                        ].map((row, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${P.border}` }}>
                                <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: P.dark }}>{row.perm}</td>
                                {[row.school, row.institute, row.teacher].map((val, j) => (
                                    <td key={j} style={{ padding: '16px 24px', textAlign: 'center' }}>
                                        {typeof val === 'boolean' ? (
                                            val
                                                ? <span style={{ color: P.success, fontSize: 16, fontWeight: 900 }}>✓</span>
                                                : <span style={{ color: '#EF4444', fontSize: 16, fontWeight: 900 }}>✕</span>
                                        ) : (
                                            <span style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{val}</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
