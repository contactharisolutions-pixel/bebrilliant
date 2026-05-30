'use client'
import React, { useEffect, useState } from 'react'
import {
    ShieldCheck, Settings, Save, Percent, IndianRupee, Info, PlusCircle, Trash2,
    Loader2, ArrowLeft, Zap, Layers, Activity, X
} from 'lucide-react'
const P = {
    brand: '#004B93',
    cta: '#F0A026',
    dark: '#1B1D21',
    muted: '#A5A2A6',
    bg: '#F7F8FA',
    border: '#E8E8E8',
    success: '#1FAC63',
    error: '#EF4444',
    white: '#FFFFFF',
    text: '#5A5A5A'
}
export default function CommissionControls() {
    const [config, setConfig] = useState<any>({ platform_fee_percent: 10, min_withdrawal: 1000, tds_percent: 10, gst_percent: 18 })
    const [overrides, setOverrides] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<string | null>(null)
    useEffect(() => {
        fetch('/api/owner/finance/settings')
            .then(res => res.json())
            .then(json => {
                setConfig(json.config)
                setOverrides(json.overrides)
                setLoading(false)
            })
    }, [])
    const saveSettings = async (type: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/finance/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, payload })
            })
            if (res.ok) {
                setToast('Configuration Synchronized')
                setTimeout(() => setToast(null), 3000)
            }
        } finally { setSaving(false) }
    }
    if (loading) return (
        <div style={{ padding: '64px', textAlign: 'center' }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} color={P.brand} />
        </div>
    )
    return (
        <div style={{ padding: '48px 64px', background: P.bg, minHeight: '100vh' }}>
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: P.brand, color: '#FFF', padding: '16px 24px', borderRadius: 16, fontWeight: 900, boxShadow: '0 20px 40px rgba(0,75,147,0.3)', zIndex: 1000 }}>
                    {toast}
                </div>
            )}
            <header style={{ marginBottom: 48 }}>
                <button onClick={() => window.location.href = '/owner/finance'} style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, color: P.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }}>
                    <ArrowLeft size={16} /> Dashboard
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: 12, background: P.brand, borderRadius: 16 }}>
                         <Percent size={28} color="#FFF" />
                    </div>
                    <div>
                         <h1 style={{ fontSize: 36, fontWeight: 1000, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Commission Control Logic</h1>
                         <p style={{ fontSize: 15, color: P.muted, margin: '4px 0 0', fontWeight: 600 }}>Configure global tax parameters and tenant commission overrides.</p>
                    </div>
                </div>
            </header>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                {/* GLOBAL COMMISSION PARAMS */}
                <div style={{ background: P.white, borderRadius: 32, padding: 32, border: `1px solid ${P.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <Zap size={20} color={P.cta} />
                        <h2 style={{ fontSize: 20, fontWeight: 1000, color: P.dark, margin: 0 }}>Global Treasury Parametres</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <InputField label="Platform Distribution Fee" value={config.platform_fee_percent} type="number" suffix="%" onChange={(v: any) => setConfig({...config, platform_fee_percent: v})} />
                        <InputField label="Statutory GST Rate" value={config.gst_percent} type="number" suffix="%" onChange={(v: any) => setConfig({...config, gst_percent: v})} />
                        <InputField label="Withholding Tax (TDS)" value={config.tds_percent} type="number" suffix="%" onChange={(v: any) => setConfig({...config, tds_percent: v})} />
                        <InputField label="Min Redemptive Threshold" value={config.min_withdrawal} type="number" prefix="₹" onChange={(v: any) => setConfig({...config, min_withdrawal: v})} />
                    </div>
                    <div style={{ marginTop: 40, padding: 24, background: P.bg, borderRadius: 20, border: `1px solid ${P.border}`, display: 'flex', gap: 16 }}>
                        <Info size={24} color={P.brand} />
                        <p style={{ fontSize: 13, color: P.text, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                            Adjusting these values will instantly update calculations for all subsequent tenant payments and revenue splits across the ecosystem.
                        </p>
                    </div>
                    <button onClick={() => saveSettings('GLOBAL_CONFIG', config)} disabled={saving} style={{ marginTop: 40, width: '100%', padding: '16px', borderRadius: 16, background: P.brand, color: '#FFF', border: 'none', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />} Update Global Policy
                    </button>
                </div>
                {/* OVERRIDES */}
                <div style={{ background: P.white, borderRadius: 32, padding: 32, border: `1px solid ${P.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <Layers size={20} color={P.brand} />
                        <h2 style={{ fontSize: 20, fontWeight: 1000, color: P.dark, margin: 0 }}>Custom Commission Overrides</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {Object.keys(overrides).length === 0 ? (
                            <div style={{ padding: '64px 0', textAlign: 'center', background: P.bg, borderRadius: 24, border: `1px dashed ${P.border}` }}>
                                <div style={{ fontSize: 14, color: P.muted, fontWeight: 700 }}>No active overrides detected.</div>
                                <div style={{ fontSize: 12, color: P.muted, marginTop: 4 }}>All nodes currently follow global treasury policy.</div>
                            </div>
                        ) : (
                            Object.entries(overrides).map(([tid, fee]: any) => (
                                <div key={tid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: P.bg, borderRadius: 16, border: `1px solid ${P.border}` }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 1000, color: P.dark }}>Node: {tid.slice(0, 16)}...</div>
                                        <div style={{ fontSize: 12, color: P.brand, fontWeight: 800 }}>Special Fee: {fee}%</div>
                                    </div>
                                    <button onClick={() => {
                                        const newOv = {...overrides}
                                        delete newOv[tid]
                                        setOverrides(newOv)
                                    }} style={{ background: 'transparent', border: 'none', color: P.error, cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                        <input placeholder="Enter Tenant_ID..." id="tenant_id" style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${P.border}`, outline: 'none', fontSize: 13, fontWeight: 600 }} />
                        <input placeholder="Fee %" id="tenant_fee" type="number" style={{ width: 100, padding: '14px', borderRadius: 12, border: `1px solid ${P.border}`, outline: 'none', fontSize: 13, fontWeight: 600 }} />
                        <button onClick={() => {
                            const tid = (document.getElementById('tenant_id') as HTMLInputElement).value
                            const fee = (document.getElementById('tenant_fee') as HTMLInputElement).value
                            if (tid && fee) {
                                setOverrides({ ...overrides, [tid]: parseFloat(fee) })
                            }
                        }} style={{ padding: '14px', borderRadius: 12, background: P.brand, color: '#FFF', border: 'none', cursor: 'pointer' }}>
                            <PlusCircle size={20} />
                        </button>
                    </div>
                    <button onClick={() => saveSettings('TENANT_OVERRIDE', overrides)} disabled={saving} style={{ marginTop: 40, width: '100%', padding: '16px', borderRadius: 16, background: '#FFF', color: P.brand, border: `2px solid ${P.brand}`, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={18} />} Synchronize overrides
                    </button>
                </div>
            </div>
        </div>
    )
}
function InputField({ label, value, type, suffix, prefix, onChange }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 1000, color: P.muted, textTransform: 'uppercase' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFF', border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden' }}>
                {prefix && <div style={{ padding: '14px', background: P.bg, borderRight: `1px solid ${P.border}`, fontSize: 14, fontWeight: 1000, color: P.muted }}>{prefix}</div>}
                <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, padding: '14px', border: 'none', outline: 'none', fontSize: 15, fontWeight: 700, color: P.dark }} />
                {suffix && <div style={{ padding: '14px', background: P.bg, borderLeft: `1px solid ${P.border}`, fontSize: 14, fontWeight: 1000, color: P.muted }}>{suffix}</div>}
            </div>
        </div>
    )
}
