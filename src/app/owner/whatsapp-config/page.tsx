'use client'

import { useState, useEffect } from 'react'
import {
    MessageCircle, Save, Loader2, CheckCircle2,
    AlertCircle, X, Eye, RefreshCw, Settings,
    School, Building2, User, ToggleLeft, ToggleRight
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

const TEMPLATE_META: Record<string, { label: string; desc: string; vars: string[] }> = {
    teacher_exam_share: {
        label: 'Teacher — Exam Share',
        desc:  'Sent when an affiliate teacher shares an exam.',
        vars:  ['{exam_name}', '{institute_name}', '{exam_fee}', '{referral_link}'],
    },
    student_exam_share: {
        label: 'Student — Exam Share',
        desc:  'Sent when a student shares an exam they attempted.',
        vars:  ['{exam_name}', '{institute_name}', '{referral_link}'],
    },
    teacher_invite: {
        label: 'Teacher Invite',
        desc:  'Sent when an affiliate teacher invites a new affiliate.',
        vars:  ['{institute_name}', '{affiliate_signup_link}'],
    },
    institute_exam_promo: {
        label: 'Institute Exam Promotion',
        desc:  'Used by institute admin for exam promotions.',
        vars:  ['{exam_name}', '{institute_name}', '{exam_fee}', '{referral_link}'],
    },
}

type Template = {
    id:            string
    template_key:  string
    template_text: string
    is_active:     boolean
}

export default function WhatsAppConfigPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading,   setLoading]   = useState(true)
    const [saving,    setSaving]    = useState(false)
    const [msg,       setMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [preview,   setPreview]   = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetch('/api/owner/whatsapp-templates')
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setTemplates(data) })
            .finally(() => setLoading(false))
    }, [])

    const updateTemplate = (key: string, field: keyof Template, value: unknown) => {
        setTemplates(prev => prev.map(t =>
            t.template_key === key ? { ...t, [field]: value } : t
        ))
    }

    const handleSave = async () => {
        setSaving(true)
        setMsg(null)
        try {
            const res = await fetch('/api/owner/whatsapp-templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templates),
            })
            const result = await res.json()
            setMsg(result.success
                ? { type: 'success', text: 'WhatsApp templates saved successfully.' }
                : { type: 'error',   text: result.error || 'Failed to save templates.' }
            )
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
            <style>{GLASS_STYLES + `@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}>
                        <MessageCircle size={28} color="#FFF" fill="#FFF" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 30, fontWeight: 900, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>WhatsApp Message Templates</h1>
                        <p style={{ margin: '6px 0 0', fontSize: 14, color: P.muted, fontWeight: 600 }}>Customise the auto-generated WhatsApp messages for all affiliate sharing scenarios.</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '14px 32px', background: P.brand, color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${P.brand}30`, opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save All Templates'}
                </button>
            </div>

            {/* BANNER */}
            {msg && (
                <div style={{ marginBottom: 32, padding: '16px 24px', borderRadius: 16, background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`, display: 'flex', alignItems: 'center', gap: 12, color: msg.type === 'success' ? '#065F46' : '#991B1B', fontSize: 14, fontWeight: 700 }}>
                    {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
                </div>
            )}

            {/* VARIABLE GUIDE */}
            <div style={{ marginBottom: 40, padding: '20px 28px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, fontSize: 13, color: '#166534', fontWeight: 600, lineHeight: 1.7 }}>
                <strong>💡 Template Variables:</strong> Use placeholders in curly braces — they are automatically replaced when the message is generated.
                Available: <code>{'{exam_name}'}</code> <code>{'{institute_name}'}</code> <code>{'{exam_fee}'}</code> <code>{'{referral_link}'}</code> <code>{'{affiliate_signup_link}'}</code>
            </div>

            {/* TEMPLATE CARDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {templates.map(tpl => {
                    const meta = TEMPLATE_META[tpl.template_key]
                    if (!meta) return null
                    const isPreviewing = preview[tpl.template_key]

                    // Build sample preview
                    const sampleMsg = tpl.template_text
                        .replace(/{exam_name}/g,           'JEE Mock Test 1')
                        .replace(/{institute_name}/g,      'Silver Bells School')
                        .replace(/{exam_fee}/g,            '199')
                        .replace(/{referral_link}/g,       'https://bb.app/exam/123?ref=AT3F8K2X')
                        .replace(/{affiliate_signup_link}/g, 'https://bb.app/join/affiliate?ref=AT3F8K2X')

                    return (
                        <div key={tpl.template_key} style={{ background: P.card, borderRadius: 28, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            {/* CARD HEADER */}
                            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: P.dark }}>{meta.label}</div>
                                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginTop: 4 }}>{meta.desc}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {/* PREVIEW TOGGLE */}
                                    <button
                                        onClick={() => setPreview(p => ({ ...p, [tpl.template_key]: !p[tpl.template_key] }))}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: isPreviewing ? '#F0FDF4' : P.bg, border: `1px solid ${isPreviewing ? '#A7F3D0' : P.border}`, borderRadius: 10, fontSize: 12, fontWeight: 800, color: isPreviewing ? '#059669' : P.muted, cursor: 'pointer' }}
                                    >
                                        <Eye size={14} /> {isPreviewing ? 'Hide Preview' : 'Preview'}
                                    </button>
                                    {/* ACTIVE TOGGLE */}
                                    <button
                                        onClick={() => updateTemplate(tpl.template_key, 'is_active', !tpl.is_active)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: tpl.is_active ? P.successBg : P.bg, border: `1px solid ${tpl.is_active ? P.success : P.border}`, borderRadius: 10, cursor: 'pointer' }}
                                    >
                                        {tpl.is_active ? <ToggleRight size={18} color={P.success} /> : <ToggleLeft size={18} color={P.muted} />}
                                        <span style={{ fontSize: 12, fontWeight: 800, color: tpl.is_active ? P.success : P.muted }}>{tpl.is_active ? 'Active' : 'Disabled'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* EDITOR */}
                            <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: isPreviewing ? '1fr 1fr' : '1fr', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                        Template Text
                                    </label>
                                    <textarea
                                        value={tpl.template_text}
                                        onChange={e => updateTemplate(tpl.template_key, 'template_text', e.target.value)}
                                        rows={8}
                                        style={{ width: '100%', padding: '16px', background: P.bg, border: `2px solid ${P.border}`, borderRadius: 14, fontSize: 13, fontWeight: 600, color: P.dark, fontFamily: 'monospace', resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }}
                                    />
                                    {/* VARIABLE CHIPS */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        {meta.vars.map(v => (
                                            <code key={v} style={{ padding: '3px 10px', background: '#EFF6FF', color: '#2563EB', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{v}</code>
                                        ))}
                                    </div>
                                </div>

                                {isPreviewing && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                            Live Preview (with sample data)
                                        </label>
                                        {/* WhatsApp bubble */}
                                        <div style={{ background: '#ECE5DD', borderRadius: 16, padding: '20px', minHeight: 200 }}>
                                            <div style={{ background: '#FFF', borderRadius: '0 14px 14px 14px', padding: '14px 18px', maxWidth: '90%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 13, color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {sampleMsg}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#667781', fontWeight: 600, marginTop: 6, textAlign: 'right', maxWidth: '90%' }}>
                                                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#ECFDF5', borderRadius: 10, border: '1px solid #A7F3D0' }}>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: '#059669', textTransform: 'uppercase', marginBottom: 4 }}>WhatsApp Deep Link</div>
                                            <div style={{ fontSize: 11, color: '#0EA5E9', fontWeight: 700, wordBreak: 'break-all' }}>
                                                wa.me/?text={encodeURIComponent(sampleMsg).slice(0, 60)}...
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
