'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Mail, MessageCircle, Bell, Zap, Plus, Edit3, Trash2, Eye, Send,
    CheckCircle, AlertCircle, Loader2, X, RefreshCw, ToggleLeft, ToggleRight,
    ArrowRight, Cpu, Settings, Code, Play, Save, Search, Clock, Globe, Database
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'
import { SideDrawer } from '@/components/owner/SideDrawer'

type EmailTemplate = { id: string; name: string; subject: string; body: string; created_at: string }
type WaTemplate = { id: string; template_key: string; template_text: string; is_active: boolean; updated_at: string }
type AutomationRule = { id: number; trigger_event: string; channel: string; template_id: number; delay_minutes: number; active_status: boolean; created_at: string }
type PushTemplate = { id: string; title: string; body: string; deep_link?: string; icon?: string }

const TRIGGER_OPTIONS = [
    'User.Signup', 'Student.Register', 'Teacher.Register',
    'Exam.Publish', 'Exam.Submit', 'Exam.DayBefore',
    'Payment.Success', 'Payment.Failed',
    'Affiliate.Commission', 'Tenant.Created', 'Tenant.Onboarded'
]

const CHANNEL_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    email: { label: 'Email', color: '#2563EB', bg: '#EFF6FF', icon: Mail },
    whatsapp: { label: 'WhatsApp', color: '#16A34A', bg: '#F0FDF4', icon: MessageCircle },
    push: { label: 'Push', color: '#9333EA', bg: '#F5F3FF', icon: Bell }
}

function Toast({ msg, onClose }: { msg: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
            background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: msg.type === 'success' ? '#065F46' : '#991B1B', fontSize: 14, fontWeight: 700,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)', minWidth: 300, maxWidth: 420
        }}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span style={{ flex: 1 }}>{msg.text}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
        </div>
    )
}

function TabBtn({ active, onClick, icon: Icon, label, count }: any) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '13px 22px',
            borderRadius: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: active ? P.brand : 'transparent',
            color: active ? '#fff' : P.muted,
            fontSize: 14, fontWeight: 700,
            boxShadow: active ? `0 6px 20px ${P.brand}35` : 'none'
        }}>
            <Icon size={16} />
            {label}
            {count !== undefined && (
                <span style={{
                    background: active ? 'rgba(255,255,255,0.25)' : P.border,
                    color: active ? '#fff' : P.muted,
                    borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 900, minWidth: 20, textAlign: 'center'
                }}>{count}</span>
            )}
        </button>
    )
}

function FieldLabel({ children }: any) {
    return <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{children}</label>
}

function Input({ label, value, onChange, placeholder = '', type = 'text', multiline = false, rows = 4 }: any) {
    const base: React.CSSProperties = { width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', boxSizing: 'border-box', fontWeight: 600, fontFamily: 'var(--font-sans)' }
    return (
        <div style={{ marginBottom: 18 }}>
            {label && <FieldLabel>{label}</FieldLabel>}
            {multiline
                ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, resize: 'vertical', lineHeight: 1.7 }} />
                : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
            }
        </div>
    )
}

export default function CommunicationsPage() {
    const [tab, setTab] = useState<'email' | 'whatsapp' | 'push' | 'automation'>('email')
    const [emailTpls, setEmailTpls] = useState<EmailTemplate[]>([])
    const [waTpls, setWaTpls] = useState<WaTemplate[]>([])
    const [pushTpls, setPushTpls] = useState<PushTemplate[]>([])
    const [autoRules, setAutoRules] = useState<AutomationRule[]>([])
    const [stats, setStats] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [testingId, setTestingId] = useState<string | null>(null)

    // Email drawer state
    const [emailDrawer, setEmailDrawer] = useState(false)
    const [emailForm, setEmailForm] = useState({ id: '', name: '', subject: '', body: '' })
    const [previewEmail, setPreviewEmail] = useState<string | null>(null)

    // WA drawer state
    const [waDrawer, setWaDrawer] = useState(false)
    const [waForm, setWaForm] = useState({ id: '', template_key: '', template_text: '', is_active: true })
    const [waPreview, setWaPreview] = useState<string | null>(null)

    // Push drawer state
    const [pushDrawer, setPushDrawer] = useState(false)
    const [pushForm, setPushForm] = useState({ id: '', title: '', body: '', deep_link: '', icon: '🔔' })

    // Automation drawer state
    const [ruleDrawer, setRuleDrawer] = useState(false)
    const [ruleForm, setRuleForm] = useState({ trigger_event: 'User.Signup', channel: 'email', template_id: '', delay_minutes: 0, active_status: true })

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 5000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/owner/communications')
            if (res.ok) {
                const d = await res.json()
                setEmailTpls(d.emailTemplates || [])
                setWaTpls(d.waTemplates || [])
                setAutoRules(d.automationRules || [])
                setStats(d.stats || {})
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchPushTpls = useCallback(async () => {
        // Push templates stored in platform_settings
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const seedDefaults = async () => {
        setSeeding(true)
        try {
            const res = await fetch('/api/owner/communications/seed', { method: 'POST' })
            const d = await res.json()
            if (d.success) {
                showToast('success', `Seeded: ${d.seeded.email_templates} email templates, ${d.seeded.whatsapp_templates} WhatsApp templates, ${d.seeded.automation_rules} automation rules.`)
                fetchData()
            } else showToast('error', d.error || 'Seed failed.')
        } finally { setSeeding(false) }
    }

    const callAPI = async (action: string, payload: any) => {
        const res = await fetch('/api/owner/communications', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload })
        })
        return res.json()
    }

    // ── Email Handlers ────────────────────────────────────────────────────────
    const saveEmail = async () => {
        setSaving(true)
        try {
            const action = emailForm.id ? 'UPDATE_EMAIL_TEMPLATE' : 'CREATE_EMAIL_TEMPLATE'
            const d = await callAPI(action, emailForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `Email template ${emailForm.id ? 'updated' : 'created'} successfully.`)
            setEmailDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    const deleteEmail = async (id: string) => {
        if (!confirm('Delete this email template?')) return
        const d = await callAPI('DELETE_EMAIL_TEMPLATE', { id })
        if (d.success) { showToast('success', 'Template deleted.'); fetchData() }
        else showToast('error', d.error)
    }

    const testEmail = async (id: string) => {
        setTestingId(id)
        try {
            const d = await callAPI('TEST_EMAIL', { id })
            if (d.success) showToast('success', d.message)
            else showToast('error', d.error)
        } finally { setTestingId(null) }
    }

    // ── WhatsApp Handlers ─────────────────────────────────────────────────────
    const saveWa = async () => {
        setSaving(true)
        try {
            const action = waForm.id ? 'UPDATE_WHATSAPP_TEMPLATE' : 'CREATE_WHATSAPP_TEMPLATE'
            const d = await callAPI(action, waForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `WhatsApp template ${waForm.id ? 'updated' : 'created'}.`)
            setWaDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    const testWa = async (id: string) => {
        setTestingId(id)
        try {
            const d = await callAPI('TEST_WHATSAPP', { id })
            if (d.success) showToast('success', d.message)
            else showToast('error', d.error)
        } finally { setTestingId(null) }
    }

    const toggleWaActive = async (tpl: WaTemplate) => {
        await callAPI('UPDATE_WHATSAPP_TEMPLATE', { ...tpl, is_active: !tpl.is_active })
        fetchData()
    }

    // ── Automation Handlers ───────────────────────────────────────────────────
    const toggleRule = async (rule: AutomationRule) => {
        await callAPI('TOGGLE_AUTOMATION_RULE', { id: rule.id, active_status: !rule.active_status })
        fetchData()
    }

    const deleteRule = async (id: number) => {
        if (!confirm('Delete this automation rule?')) return
        await callAPI('DELETE_AUTOMATION_RULE', { id })
        fetchData()
    }

    const saveRule = async () => {
        setSaving(true)
        try {
            const d = await callAPI('CREATE_AUTOMATION_RULE', ruleForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', 'Automation rule created.')
            setRuleDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    // ── Card Styles ───────────────────────────────────────────────────────────
    const card: React.CSSProperties = {
        background: P.card, border: `1px solid ${P.border}`, borderRadius: 20,
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }
    const row: React.CSSProperties = {
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
        padding: '20px 28px', borderBottom: `1px solid ${P.border}`, gap: 16
    }
    const actionBtn = (color: string, bg: string): React.CSSProperties => ({
        background: bg, border: `1px solid ${color}30`, color, borderRadius: 10, padding: '8px 14px',
        fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
    })

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: P.muted, fontWeight: 700 }}>Loading Communications Hub...</p>
        </div>
    )

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '36px 40px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.brand, boxShadow: `0 0 8px ${P.brand}` }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Platform Communications</span>
                    </div>
                    <h1 style={{ fontSize: 34, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Communications Hub</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>
                        Manage email templates, WhatsApp messages, push notifications & automation rules — unified.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Refresh
                    </button>
                    <button onClick={seedDefaults} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: '#059669', cursor: 'pointer', opacity: seeding ? 0.7 : 1 }}>
                        {seeding ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Database size={16} />}
                        {seeding ? 'Seeding...' : 'Seed Defaults'}
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 36 }}>
                <KpiCard icon={Mail} title="Email Templates" value={String(stats.emailTemplates || 0)} color="#2563EB" />
                <KpiCard icon={MessageCircle} title="WhatsApp Templates" value={String(stats.waTemplates || 0)} color="#16A34A" />
                <KpiCard icon={Zap} title="Active Rules" value={`${stats.activeRules || 0} / ${stats.totalRules || 0}`} color={P.brand} />
                <KpiCard icon={Bell} title="Push Templates" value={String(pushTpls.length)} color="#9333EA" />
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18, padding: 6, marginBottom: 32, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <TabBtn active={tab === 'email'} onClick={() => setTab('email')} icon={Mail} label="Email Templates" count={emailTpls.length} />
                <TabBtn active={tab === 'whatsapp'} onClick={() => setTab('whatsapp')} icon={MessageCircle} label="WhatsApp Templates" count={waTpls.length} />
                <TabBtn active={tab === 'push'} onClick={() => setTab('push')} icon={Bell} label="Push Notifications" count={pushTpls.length} />
                <TabBtn active={tab === 'automation'} onClick={() => setTab('automation')} icon={Zap} label="Automation Rules" count={autoRules.length} />
            </div>

            {/* ── EMAIL TEMPLATES TAB ── */}
            {tab === 'email' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>Email Templates</h2>
                        <button onClick={() => { setEmailForm({ id: '', name: '', subject: '', body: '' }); setEmailDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={18} strokeWidth={3} /> New Email Template
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {emailTpls.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted }}>
                                <Mail size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16 }}>No email templates yet</p>
                                <p style={{ fontSize: 14 }}>Click "Seed Defaults" to add 6 ready-to-use templates</p>
                            </div>
                        )}
                        {emailTpls.map(tpl => (
                            <div key={tpl.id} style={card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 28px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Mail size={18} color="#2563EB" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 16, color: P.dark }}>{tpl.name}</div>
                                                <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>{tpl.subject}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: P.muted, marginLeft: 48 }}>
                                            Created {new Date(tpl.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => setPreviewEmail(previewEmail === tpl.id ? null : tpl.id)}
                                            style={actionBtn('#6366F1', '#EEF2FF')}>
                                            <Eye size={14} /> Preview
                                        </button>
                                        <button onClick={() => testEmail(tpl.id)} disabled={testingId === tpl.id}
                                            style={actionBtn('#059669', '#ECFDF5')}>
                                            {testingId === tpl.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                                            {testingId === tpl.id ? 'Sending...' : 'Test Send'}
                                        </button>
                                        <button onClick={() => { setEmailForm({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body }); setEmailDrawer(true) }}
                                            style={actionBtn(P.brand, P.brandBg)}>
                                            <Edit3 size={14} /> Edit
                                        </button>
                                        <button onClick={() => deleteEmail(tpl.id)} style={actionBtn('#DC2626', '#FEF2F2')}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {previewEmail === tpl.id && (
                                    <div style={{ borderTop: `1px solid ${P.border}`, padding: '20px 28px', background: P.bg }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Email Preview</div>
                                        <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
                                            <div dangerouslySetInnerHTML={{ __html: tpl.body }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── WHATSAPP TEMPLATES TAB ── */}
            {tab === 'whatsapp' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>WhatsApp Templates</h2>
                        <button onClick={() => { setWaForm({ id: '', template_key: '', template_text: '', is_active: true }); setWaDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(22,163,74,0.3)' }}>
                            <Plus size={18} strokeWidth={3} /> New Template
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {waTpls.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted }}>
                                <MessageCircle size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16 }}>No WhatsApp templates yet</p>
                                <p style={{ fontSize: 14 }}>Click "Seed Defaults" to add 6 ready-to-use templates</p>
                            </div>
                        )}
                        {waTpls.map(tpl => (
                            <div key={tpl.id} style={card}>
                                <div style={{ display: 'grid', gridTemplateColumns: waPreview === tpl.id ? '1fr 340px' : '1fr auto', gap: 0 }}>
                                    <div style={{ padding: '24px 28px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 16, color: P.dark, marginBottom: 4 }}>{tpl.template_key}</div>
                                                <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginBottom: 12, lineHeight: 1.7, maxWidth: 520 }}>
                                                    {tpl.template_text.slice(0, 120)}{tpl.template_text.length > 120 ? '...' : ''}
                                                </div>
                                                <button onClick={() => toggleWaActive(tpl)} style={{
                                                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                                                    background: tpl.is_active ? '#F0FDF4' : P.bg,
                                                    border: `1px solid ${tpl.is_active ? '#A7F3D0' : P.border}`,
                                                    borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                                                    color: tpl.is_active ? '#059669' : P.muted
                                                }}>
                                                    {tpl.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                    {tpl.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => setWaPreview(waPreview === tpl.id ? null : tpl.id)} style={actionBtn('#6366F1', '#EEF2FF')}>
                                                    <Eye size={14} /> Preview
                                                </button>
                                                <button onClick={() => testWa(tpl.id)} disabled={testingId === tpl.id} style={actionBtn('#059669', '#ECFDF5')}>
                                                    {testingId === tpl.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                                                    {testingId === tpl.id ? 'Sending...' : 'Test Send'}
                                                </button>
                                                <button onClick={() => { setWaForm({ id: tpl.id, template_key: tpl.template_key, template_text: tpl.template_text, is_active: tpl.is_active }); setWaDrawer(true) }}
                                                    style={actionBtn(P.brand, P.brandBg)}>
                                                    <Edit3 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {waPreview === tpl.id && (
                                        <div style={{ padding: '24px 28px', borderLeft: `1px solid ${P.border}`, background: '#ECE5DD', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: '#667781', textTransform: 'uppercase', marginBottom: 8 }}>WhatsApp Preview</div>
                                            <div style={{ background: '#fff', borderRadius: '0 14px 14px 14px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 13, color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxWidth: 280 }}>
                                                {tpl.template_text.replace(/{exam_name}/g, 'Mock Exam 2026').replace(/{institute_name}/g, 'BeBrilliant').replace(/{exam_fee}/g, '199').replace(/{referral_link}/g, 'https://bb.app/exam/demo').replace(/{affiliate_signup_link}/g, 'https://bb.app/join').replace(/{student_name}/g, 'Test Student').replace(/{login_link}/g, 'https://bb.app/login').replace(/{exam_date}/g, 'July 15').replace(/{exam_time}/g, '10:00 AM').replace(/{exam_link}/g, 'https://bb.app/exam/demo')}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#667781', textAlign: 'right' }}>
                                                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── PUSH NOTIFICATIONS TAB ── */}
            {tab === 'push' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>Push Notification Templates</h2>
                        <button onClick={() => { setPushForm({ id: '', title: '', body: '', deep_link: '', icon: '🔔' }); setPushDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#9333EA', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(147,51,234,0.3)' }}>
                            <Plus size={18} strokeWidth={3} /> New Push Template
                        </button>
                    </div>
                    <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <Bell size={24} color="#EA580C" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontWeight: 900, color: '#9A3412', fontSize: 15, marginBottom: 4 }}>Firebase Cloud Messaging (FCM) Integration</div>
                            <div style={{ color: '#C2410C', fontSize: 13, fontWeight: 600 }}>
                                To enable live push notifications, add your Firebase Server Key in <strong>Global Settings → Integrations → Firebase FCM</strong>.
                                Push templates work as in-app notifications today and will activate FCM once configured.
                            </div>
                        </div>
                    </div>
                    {pushTpls.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 20, border: `1px solid ${P.border}` }}>
                            <Bell size={48} color={P.border} style={{ marginBottom: 16 }} />
                            <p style={{ fontWeight: 700, fontSize: 16 }}>No push notification templates yet</p>
                            <p style={{ fontSize: 14 }}>Create templates for exam reminders, payment alerts, and more</p>
                            <button onClick={() => { setPushForm({ id: '', title: 'New Exam Available', body: 'A new exam has been published. Attempt it now!', deep_link: '/exams', icon: '📚' }); setPushDrawer(true) }}
                                style={{ marginTop: 16, background: '#9333EA', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 800, cursor: 'pointer' }}>
                                Create First Template
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── AUTOMATION RULES TAB ── */}
            {tab === 'automation' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>Automation Rules</h2>
                        <button onClick={() => { setRuleForm({ trigger_event: 'User.Signup', channel: 'email', template_id: '', delay_minutes: 0, active_status: true }); setRuleDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 6px 20px ${P.brand}30` }}>
                            <Plus size={18} strokeWidth={3} /> New Rule
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {autoRules.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 20, border: `1px solid ${P.border}` }}>
                                <Zap size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16 }}>No automation rules yet</p>
                                <p style={{ fontSize: 14 }}>Click "Seed Defaults" to add 8 ready-to-use automation rules</p>
                            </div>
                        )}
                        {autoRules.map(rule => {
                            const ch = CHANNEL_META[rule.channel] || CHANNEL_META.email
                            return (
                                <div key={rule.id} style={{ ...card, opacity: rule.active_status ? 1 : 0.65 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Zap size={20} color={P.brand} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <span style={{ fontWeight: 900, fontSize: 15, color: P.dark }}>{rule.trigger_event}</span>
                                                <ArrowRight size={14} color={P.muted} />
                                                <span style={{ background: ch.bg, color: ch.color, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                                                    {ch.label}
                                                </span>
                                                {rule.delay_minutes > 0 && (
                                                    <span style={{ background: '#FFF7ED', color: '#D97706', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={11} /> +{rule.delay_minutes}min delay
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
                                                Template ID: {rule.template_id || 'unlinked'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => toggleRule(rule)} style={actionBtn(rule.active_status ? '#059669' : P.muted, rule.active_status ? '#ECFDF5' : P.bg)}>
                                                {rule.active_status ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                {rule.active_status ? 'Active' : 'Paused'}
                                            </button>
                                            <button onClick={() => deleteRule(rule.id)} style={actionBtn('#DC2626', '#FEF2F2')}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── EMAIL TEMPLATE DRAWER ── */}
            <SideDrawer isOpen={emailDrawer} onClose={() => setEmailDrawer(false)} title={emailForm.id ? 'Edit Email Template' : 'New Email Template'} width={720}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Template Name" value={emailForm.name} onChange={(v: string) => setEmailForm(f => ({ ...f, name: v }))} placeholder="e.g. welcome_tenant" />
                    <Input label="Email Subject" value={emailForm.subject} onChange={(v: string) => setEmailForm(f => ({ ...f, subject: v }))} placeholder="e.g. Welcome to BeBrilliant!" />
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>HTML Body</FieldLabel>
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400E', fontWeight: 700, marginBottom: 10 }}>
                            💡 Available variables: {'{name}'}, {'{email}'}, {'{exam_name}'}, {'{amount}'}, {'{score}'}, {'{temp_password}'}, {'{setup_link}'}
                        </div>
                        <textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} rows={18}
                            style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 12, fontFamily: 'monospace', color: P.dark, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }}
                            placeholder="<div>Your HTML email body here...</div>" />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setEmailDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={saveEmail} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: P.brand, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── WHATSAPP TEMPLATE DRAWER ── */}
            <SideDrawer isOpen={waDrawer} onClose={() => setWaDrawer(false)} title={waForm.id ? 'Edit WhatsApp Template' : 'New WhatsApp Template'} width={640}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Template Key" value={waForm.template_key} onChange={(v: string) => setWaForm(f => ({ ...f, template_key: v }))} placeholder="e.g. exam_reminder" />
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Message Text</FieldLabel>
                        <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#166534', fontWeight: 700, marginBottom: 10 }}>
                            💡 Variables: {'{exam_name}'}, {'{institute_name}'}, {'{exam_fee}'}, {'{referral_link}'}, {'{student_name}'}
                        </div>
                        <textarea value={waForm.template_text} onChange={e => setWaForm(f => ({ ...f, template_text: e.target.value }))} rows={10}
                            style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontFamily: 'monospace', color: P.dark, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }}
                            placeholder="Hi {student_name}! ..." />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <button onClick={() => setWaForm(f => ({ ...f, is_active: !f.is_active }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: waForm.is_active ? '#F0FDF4' : P.bg, border: `1px solid ${waForm.is_active ? '#A7F3D0' : P.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: waForm.is_active ? '#059669' : P.muted }}>
                            {waForm.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {waForm.is_active ? 'Active' : 'Inactive'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setWaDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={saveWa} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#16A34A', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── PUSH TEMPLATE DRAWER ── */}
            <SideDrawer isOpen={pushDrawer} onClose={() => setPushDrawer(false)} title="Push Notification Template" width={560}>
                <div style={{ padding: '28px 32px' }}>
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Icon Emoji</FieldLabel>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {['🔔', '📚', '💰', '✅', '⚠️', '🎉', '📊', '🏆'].map(e => (
                                <button key={e} onClick={() => setPushForm(f => ({ ...f, icon: e }))} style={{ fontSize: 24, padding: '8px 12px', borderRadius: 10, border: `2px solid ${pushForm.icon === e ? '#9333EA' : P.border}`, background: pushForm.icon === e ? '#F5F3FF' : '#fff', cursor: 'pointer' }}>{e}</button>
                            ))}
                        </div>
                    </div>
                    <Input label="Title" value={pushForm.title} onChange={(v: string) => setPushForm(f => ({ ...f, title: v }))} placeholder="New Exam Available!" />
                    <Input label="Body" value={pushForm.body} onChange={(v: string) => setPushForm(f => ({ ...f, body: v }))} placeholder="Click to view and attempt" multiline rows={3} />
                    <Input label="Deep Link URL" value={pushForm.deep_link} onChange={(v: string) => setPushForm(f => ({ ...f, deep_link: v }))} placeholder="/exams/123" />
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button onClick={() => setPushDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={async () => { setSaving(true); const d = await callAPI('CREATE_PUSH_TEMPLATE', pushForm); if (!d.error) { showToast('success', 'Push template created.'); setPushDrawer(false) } setSaving(false) }} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#9333EA', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Save size={16} /> Save Template
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── AUTOMATION RULE DRAWER ── */}
            <SideDrawer isOpen={ruleDrawer} onClose={() => setRuleDrawer(false)} title="New Automation Rule" width={560}>
                <div style={{ padding: '28px 32px' }}>
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Trigger Event</FieldLabel>
                        <select value={ruleForm.trigger_event} onChange={e => setRuleForm(f => ({ ...f, trigger_event: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700 }}>
                            {TRIGGER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Notification Channel</FieldLabel>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {(['email', 'whatsapp', 'push'] as const).map(ch => {
                                const meta = CHANNEL_META[ch]
                                return (
                                    <button key={ch} onClick={() => setRuleForm(f => ({ ...f, channel: ch }))} style={{
                                        flex: 1, padding: '14px 16px', borderRadius: 12,
                                        border: `2px solid ${ruleForm.channel === ch ? meta.color : P.border}`,
                                        background: ruleForm.channel === ch ? meta.bg : '#fff',
                                        color: ruleForm.channel === ch ? meta.color : P.muted,
                                        fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13
                                    }}>
                                        <meta.icon size={16} /> {meta.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Delay (minutes)</FieldLabel>
                        <input type="number" min={0} value={ruleForm.delay_minutes} onChange={e => setRuleForm(f => ({ ...f, delay_minutes: parseInt(e.target.value) || 0 }))}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <button onClick={() => setRuleForm(f => ({ ...f, active_status: !f.active_status }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: ruleForm.active_status ? '#F0FDF4' : P.bg, border: `1px solid ${ruleForm.active_status ? '#A7F3D0' : P.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: ruleForm.active_status ? '#059669' : P.muted }}>
                            {ruleForm.active_status ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {ruleForm.active_status ? 'Active' : 'Paused'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setRuleDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={saveRule} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: P.brand, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                            {saving ? 'Saving...' : 'Create Rule'}
                        </button>
                    </div>
                </div>
            </SideDrawer>
        </div>
    )
}
