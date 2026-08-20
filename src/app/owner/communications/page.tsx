'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Mail, MessageCircle, Bell, Zap, Plus, Edit3, Trash2, Eye, Send,
    CheckCircle, AlertCircle, Loader2, X, RefreshCw, ToggleLeft, ToggleRight,
    ArrowRight, Settings, Code, Play, Save, Search, Clock, Globe, Database,
    FileText, Sparkles, Copy, Check
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { SideDrawer } from '@/components/owner/SideDrawer'

type EmailTemplate = { id: string; name: string; subject: string; body: string; created_at: string }
type WaTemplate = { id: string; template_key: string; template_text: string; is_active: boolean; updated_at: string }
type AutomationRule = { id: number; trigger_event: string; channel: string; template_id: number; delay_minutes: number; active_status: boolean; created_at: string }
type PushTemplate = { id: string; title: string; body: string; deep_link?: string; icon?: string }

const TRIGGER_EVENT_OPTIONS = [
    { key: 'User.Signup', label: 'User Signup' },
    { key: 'Student.Register', label: 'Student Registration' },
    { key: 'Teacher.Register', label: 'Teacher Registration' },
    { key: 'Exam.Publish', label: 'Exam Published' },
    { key: 'Exam.Submit', label: 'Exam Submission' },
    { key: 'Exam.DayBefore', label: 'Exam Day Before Alert' },
    { key: 'Payment.Success', label: 'Payment Received' },
    { key: 'Payment.Failed', label: 'Payment Failed' },
    { key: 'Affiliate.Commission', label: 'Partner Commission Earned' },
    { key: 'Tenant.Created', label: 'New Institute Registered' },
    { key: 'Tenant.Onboarded', label: 'Institute Onboarding Complete' }
]

const CHANNEL_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    email: { label: 'Email', color: '#2563EB', bg: '#EFF6FF', icon: Mail },
    whatsapp: { label: 'WhatsApp', color: '#16A34A', bg: '#F0FDF4', icon: MessageCircle },
    push: { label: 'Push Notification', color: '#9333EA', bg: '#F5F3FF', icon: Bell }
}

const PLACEHOLDERS = [
    '{name}', '{email}', '{student_name}', '{exam_name}', '{institute_name}',
    '{exam_fee}', '{amount}', '{txn_id}', '{score}', '{rank}', '{temp_password}', '{setup_link}', '{date}'
]

function Toast({ msg, onClose }: { msg: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
            background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
            color: msg.type === 'success' ? '#065F46' : '#991B1B', fontSize: 14, fontWeight: 700,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)', minWidth: 300, maxWidth: 440
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
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px',
            borderRadius: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: active ? '#EA580C' : 'transparent',
            color: active ? '#fff' : P.muted,
            fontSize: 14, fontWeight: 700,
            boxShadow: active ? '0 6px 20px rgba(234,88,12,0.35)' : 'none'
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
    const [searchQuery, setSearchQuery] = useState('')

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
                setPushTpls(d.pushTemplates || [])
                setAutoRules(d.automationRules || [])
                setStats(d.stats || {})
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const seedDefaults = async () => {
        if (!confirm('Seed default message templates and automation rules into database?')) return
        setSeeding(true)
        try {
            const res = await fetch('/api/owner/communications/seed', { method: 'POST' })
            const d = await res.json()
            if (d.success) {
                showToast('success', `Default templates seeded successfully: ${d.seeded.email_templates} email templates, ${d.seeded.whatsapp_templates} WhatsApp templates.`)
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
        if (!emailForm.name || !emailForm.subject) {
            showToast('error', 'Please fill in template name and subject.')
            return
        }
        setSaving(true)
        try {
            const action = emailForm.id ? 'UPDATE_EMAIL_TEMPLATE' : 'CREATE_EMAIL_TEMPLATE'
            const d = await callAPI(action, emailForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `Email template "${emailForm.name}" ${emailForm.id ? 'updated' : 'created'} successfully.`)
            setEmailDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    const deleteEmail = async (id: string, name: string) => {
        if (!confirm(`Delete email template "${name}" permanently?`)) return
        const d = await callAPI('DELETE_EMAIL_TEMPLATE', { id })
        if (d.success) { showToast('success', 'Email template deleted.'); fetchData() }
        else showToast('error', d.error)
    }

    const testEmail = async (id: string) => {
        setTestingId(id)
        try {
            const d = await callAPI('TEST_EMAIL', { id })
            if (d.success) showToast('success', d.message)
            else showToast('error', d.error || 'Test email failed')
        } finally { setTestingId(null) }
    }

    // ── WhatsApp Handlers ─────────────────────────────────────────────────────
    const saveWa = async () => {
        if (!waForm.template_key) {
            showToast('error', 'Please fill in template name.')
            return
        }
        setSaving(true)
        try {
            const action = waForm.id ? 'UPDATE_WHATSAPP_TEMPLATE' : 'CREATE_WHATSAPP_TEMPLATE'
            const d = await callAPI(action, waForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `WhatsApp template "${waForm.template_key}" ${waForm.id ? 'updated' : 'created'}.`)
            setWaDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    const deleteWa = async (id: string, name: string) => {
        if (!confirm(`Delete WhatsApp template "${name}" permanently?`)) return
        const d = await callAPI('DELETE_WHATSAPP_TEMPLATE', { id })
        if (d.success) { showToast('success', 'WhatsApp template deleted.'); fetchData() }
        else showToast('error', d.error)
    }

    const testWa = async (id: string) => {
        setTestingId(id)
        try {
            const d = await callAPI('TEST_WHATSAPP', { id })
            if (d.success) showToast('success', d.message)
            else showToast('error', d.error || 'Test WhatsApp failed')
        } finally { setTestingId(null) }
    }

    const toggleWaActive = async (tpl: WaTemplate) => {
        await callAPI('UPDATE_WHATSAPP_TEMPLATE', { ...tpl, is_active: !tpl.is_active })
        fetchData()
    }

    // ── Push Handlers ─────────────────────────────────────────────────────────
    const savePush = async () => {
        if (!pushForm.title || !pushForm.body) {
            showToast('error', 'Please fill in notification title and body.')
            return
        }
        setSaving(true)
        try {
            const action = pushForm.id ? 'UPDATE_PUSH_TEMPLATE' : 'CREATE_PUSH_TEMPLATE'
            const d = await callAPI(action, pushForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', `Push notification template "${pushForm.title}" saved.`)
            setPushDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    const deletePush = async (id: string, title: string) => {
        if (!confirm(`Delete push template "${title}" permanently?`)) return
        const d = await callAPI('DELETE_PUSH_TEMPLATE', { id })
        if (!d.error) { showToast('success', 'Push template deleted.'); fetchData() }
        else showToast('error', d.error)
    }

    // ── Automation Handlers ───────────────────────────────────────────────────
    const toggleRule = async (rule: AutomationRule) => {
        await callAPI('TOGGLE_AUTOMATION_RULE', { id: rule.id, active_status: !rule.active_status })
        fetchData()
    }

    const deleteRule = async (id: number) => {
        if (!confirm('Delete this automatic message rule?')) return
        await callAPI('DELETE_AUTOMATION_RULE', { id })
        showToast('success', 'Rule deleted.')
        fetchData()
    }

    const saveRule = async () => {
        setSaving(true)
        try {
            const d = await callAPI('CREATE_AUTOMATION_RULE', ruleForm)
            if (d.error) { showToast('error', d.error); return }
            showToast('success', 'Automatic messaging rule created.')
            setRuleDrawer(false)
            fetchData()
        } finally { setSaving(false) }
    }

    // Card & Button helpers
    const card: React.CSSProperties = {
        background: P.card, border: `1px solid ${P.border}`, borderRadius: 20,
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }
    const actionBtn = (color: string, bg: string): React.CSSProperties => ({
        background: bg, border: `1px solid ${color}30`, color, borderRadius: 10, padding: '8px 14px',
        fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
    })

    const filteredEmailTpls = emailTpls.filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredWaTpls = waTpls.filter(t => !searchQuery || t.template_key.toLowerCase().includes(searchQuery.toLowerCase()) || t.template_text.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredPushTpls = pushTpls.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.body.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredAutoRules = autoRules.filter(r => !searchQuery || r.trigger_event.toLowerCase().includes(searchQuery.toLowerCase()) || r.channel.toLowerCase().includes(searchQuery.toLowerCase()))

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: P.muted, fontWeight: 700 }}>Loading Message Templates...</p>
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
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C', boxShadow: '0 0 8px #EA580C' }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Communication & Marketing</span>
                    </div>
                    <h1 style={{ fontSize: 34, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Message Templates</h1>
                    <p style={{ color: P.muted, margin: '8px 0 0', fontWeight: 600, fontSize: 15 }}>
                        Manage email templates, WhatsApp messages, push notifications & automatic messaging rules.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' }}>
                        <RefreshCw size={16} color={P.brand} /> Refresh
                    </button>
                    <button onClick={seedDefaults} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 800, color: '#059669', cursor: 'pointer', opacity: seeding ? 0.7 : 1 }}>
                        {seeding ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Database size={16} />}
                        {seeding ? 'Seeding...' : 'Seed Default Templates'}
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 36 }}>
                <KpiCard icon={Mail} title="Email Templates" value={String(stats.emailTemplates || 0)} color="#2563EB" />
                <KpiCard icon={MessageCircle} title="WhatsApp Messages" value={String(stats.waTemplates || 0)} color="#16A34A" />
                <KpiCard icon={Bell} title="Push Notifications" value={String(stats.pushTemplates || pushTpls.length || 0)} color="#9333EA" />
                <KpiCard icon={Zap} title="Automatic Rules" value={`${stats.activeRules || 0} / ${stats.totalRules || 0}`} color="#EA580C" />
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', border: `1px solid ${P.border}`, borderRadius: 18, padding: 6, marginBottom: 28, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <TabBtn active={tab === 'email'} onClick={() => setTab('email')} icon={Mail} label="Email Templates" count={emailTpls.length} />
                <TabBtn active={tab === 'whatsapp'} onClick={() => setTab('whatsapp')} icon={MessageCircle} label="WhatsApp Messages" count={waTpls.length} />
                <TabBtn active={tab === 'push'} onClick={() => setTab('push')} icon={Bell} label="Push Notifications" count={pushTpls.length} />
                <TabBtn active={tab === 'automation'} onClick={() => setTab('automation')} icon={Zap} label="Automatic Rules" count={autoRules.length} />
            </div>

            {/* SEARCH BAR */}
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Search size={16} color={P.muted} />
                <input 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder={`Search ${tab === 'email' ? 'email templates' : tab === 'whatsapp' ? 'WhatsApp messages' : tab === 'push' ? 'push notifications' : 'automation rules'}...`} 
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: P.dark, background: 'transparent', fontWeight: 600 }} 
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <X size={14} color={P.muted} />
                    </button>
                )}
            </div>

            {/* ── EMAIL TEMPLATES TAB ── */}
            {tab === 'email' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>Email Templates</h2>
                        <button onClick={() => { setEmailForm({ id: '', name: '', subject: '', body: '' }); setEmailDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,88,12,0.3)' }}>
                            <Plus size={18} strokeWidth={3} /> New Email Template
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredEmailTpls.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 20, border: `1px solid ${P.border}` }}>
                                <Mail size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16, color: P.dark }}>No email templates found</p>
                                <p style={{ fontSize: 14 }}>{searchQuery ? 'Try adjusting your search query' : 'Click "Seed Default Templates" to add standard platform email templates'}</p>
                            </div>
                        )}
                        {filteredEmailTpls.map(tpl => (
                            <div key={tpl.id} style={card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 28px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Mail size={20} color="#2563EB" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 16, color: P.dark }}>{tpl.name}</div>
                                                <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Subject: {tpl.subject}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: P.muted, marginLeft: 52 }}>
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
                                        <button onClick={() => deleteEmail(tpl.id, tpl.name)} style={actionBtn('#DC2626', '#FEF2F2')}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {previewEmail === tpl.id && (
                                    <div style={{ borderTop: `1px solid ${P.border}`, padding: '24px 28px', background: P.bg }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Email Preview</div>
                                        <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', background: '#fff', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <div style={{ fontWeight: 800, fontSize: 15, borderBottom: `1px solid ${P.border}`, paddingBottom: 12, marginBottom: 16, color: P.dark }}>
                                                Subject: {tpl.subject}
                                            </div>
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
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>WhatsApp Messages</h2>
                        <button onClick={() => { setWaForm({ id: '', template_key: '', template_text: '', is_active: true }); setWaDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(22,163,74,0.3)' }}>
                            <Plus size={18} strokeWidth={3} /> New WhatsApp Template
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredWaTpls.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 20, border: `1px solid ${P.border}` }}>
                                <MessageCircle size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16, color: P.dark }}>No WhatsApp messages found</p>
                                <p style={{ fontSize: 14 }}>Click "Seed Default Templates" to add standard WhatsApp notification templates</p>
                            </div>
                        )}
                        {filteredWaTpls.map(tpl => (
                            <div key={tpl.id} style={card}>
                                <div style={{ display: 'grid', gridTemplateColumns: waPreview === tpl.id ? '1fr 340px' : '1fr auto', gap: 0 }}>
                                    <div style={{ padding: '24px 28px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 16, color: P.dark, marginBottom: 4 }}>{tpl.template_key}</div>
                                                <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginBottom: 12, lineHeight: 1.7, maxWidth: 520 }}>
                                                    {tpl.template_text.slice(0, 140)}{tpl.template_text.length > 140 ? '...' : ''}
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
                                                    <Edit3 size={14} /> Edit
                                                </button>
                                                <button onClick={() => deleteWa(tpl.id, tpl.template_key)} style={actionBtn('#DC2626', '#FEF2F2')}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {waPreview === tpl.id && (
                                        <div style={{ padding: '24px 28px', borderLeft: `1px solid ${P.border}`, background: '#ECE5DD', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: '#667781', textTransform: 'uppercase', marginBottom: 8 }}>WhatsApp Preview</div>
                                            <div style={{ background: '#fff', borderRadius: '0 14px 14px 14px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 13, color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxWidth: 280 }}>
                                                {tpl.template_text.replace(/{exam_name}/g, 'Mock Exam 2026').replace(/{institute_name}/g, 'BeBrilliant').replace(/{exam_fee}/g, '199').replace(/{referral_link}/g, 'https://bebrilliant.io/exam/demo').replace(/{affiliate_signup_link}/g, 'https://bebrilliant.io/join').replace(/{student_name}/g, 'Test Student').replace(/{login_link}/g, 'https://bebrilliant.io/login').replace(/{exam_date}/g, 'July 15').replace(/{exam_time}/g, '10:00 AM').replace(/{exam_link}/g, 'https://bebrilliant.io/exam/demo')}
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
                            <div style={{ fontWeight: 900, color: '#9A3412', fontSize: 15, marginBottom: 4 }}>Firebase Push Notifications Integration</div>
                            <div style={{ color: '#C2410C', fontSize: 13, fontWeight: 600 }}>
                                Push notification templates are stored dynamically in live DB and trigger in-app alerts as well as mobile/browser notifications via FCM settings.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredPushTpls.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 20, border: `1px solid ${P.border}` }}>
                                <Bell size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16, color: P.dark }}>No push notification templates yet</p>
                                <p style={{ fontSize: 14, marginBottom: 20 }}>Create templates for exam reminders, enrollment updates, and payment alerts</p>
                                <button onClick={() => { setPushForm({ id: '', title: 'New Exam Published', body: 'A new exam has been published for your class. Attempt now!', deep_link: '/exams', icon: '📚' }); setPushDrawer(true) }}
                                    style={{ background: '#9333EA', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                                    Create Push Template
                                </button>
                            </div>
                        )}

                        {filteredPushTpls.map(tpl => (
                            <div key={tpl.id} style={card}>
                                <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ fontSize: 26, width: 46, height: 46, borderRadius: 14, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {tpl.icon || '🔔'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: 16, color: P.dark }}>{tpl.title}</div>
                                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 600, marginTop: 2 }}>{tpl.body}</div>
                                            {tpl.deep_link && (
                                                <div style={{ fontSize: 11, color: '#9333EA', fontWeight: 800, marginTop: 4 }}>
                                                    Link: {tpl.deep_link}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => { setPushForm({ id: tpl.id, title: tpl.title, body: tpl.body, deep_link: tpl.deep_link || '', icon: tpl.icon || '🔔' }); setPushDrawer(true) }}
                                            style={actionBtn('#9333EA', '#F5F3FF')}>
                                            <Edit3 size={14} /> Edit
                                        </button>
                                        <button onClick={() => deletePush(tpl.id, tpl.title)} style={actionBtn('#DC2626', '#FEF2F2')}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── AUTOMATION RULES TAB ── */}
            {tab === 'automation' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.dark }}>Automatic Messaging Rules</h2>
                        <button onClick={() => { setRuleForm({ trigger_event: 'User.Signup', channel: 'email', template_id: '', delay_minutes: 0, active_status: true }); setRuleDrawer(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,88,12,0.3)' }}>
                            <Plus size={18} strokeWidth={3} /> New Rule
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filteredAutoRules.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 80, color: P.muted, background: P.card, borderRadius: 20, border: `1px solid ${P.border}` }}>
                                <Zap size={48} color={P.border} style={{ marginBottom: 16 }} />
                                <p style={{ fontWeight: 700, fontSize: 16, color: P.dark }}>No automatic rules found</p>
                                <p style={{ fontSize: 14 }}>Click "Seed Default Templates" to load automatic rules</p>
                            </div>
                        )}

                        {filteredAutoRules.map(rule => {
                            const ch = CHANNEL_META[rule.channel] || CHANNEL_META.email
                            const eventObj = TRIGGER_EVENT_OPTIONS.find(o => o.key === rule.trigger_event)
                            const displayEvent = eventObj ? eventObj.label : rule.trigger_event

                            return (
                                <div key={rule.id} style={{ ...card, opacity: rule.active_status ? 1 : 0.65 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px' }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Zap size={22} color="#EA580C" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <span style={{ fontWeight: 900, fontSize: 15, color: P.dark }}>{displayEvent}</span>
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
                                                Template ID: {rule.template_id || 'Auto-selected template'}
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
                    
                    {/* Placeholders Bar */}
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Available Dynamic Variables</FieldLabel>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: '#F8FAFC', padding: 12, borderRadius: 12, border: `1px solid ${P.border}` }}>
                            {PLACEHOLDERS.map(p => (
                                <button key={p} onClick={() => setEmailForm(f => ({ ...f, body: f.body + ' ' + p }))} 
                                    style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: P.brand, cursor: 'pointer' }}>
                                    + {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Message Content (HTML Body)</FieldLabel>
                        <textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} rows={16}
                            style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontFamily: 'monospace', color: P.dark, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }}
                            placeholder="<div>Enter email HTML content here... Use variables like {name}</div>" />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setEmailDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={saveEmail} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#EA580C', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(234,88,12,0.3)', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Email Template'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── WHATSAPP TEMPLATE DRAWER ── */}
            <SideDrawer isOpen={waDrawer} onClose={() => setWaDrawer(false)} title={waForm.id ? 'Edit WhatsApp Message' : 'New WhatsApp Message'} width={640}>
                <div style={{ padding: '28px 32px' }}>
                    <Input label="Template Name" value={waForm.template_key} onChange={(v: string) => setWaForm(f => ({ ...f, template_key: v }))} placeholder="e.g. exam_reminder" />
                    
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Available Dynamic Variables</FieldLabel>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: '#F0FDF4', padding: 12, borderRadius: 12, border: '1px solid #A7F3D0' }}>
                            {['{student_name}', '{exam_name}', '{institute_name}', '{exam_fee}', '{referral_link}', '{exam_date}', '{exam_time}'].map(p => (
                                <button key={p} onClick={() => setWaForm(f => ({ ...f, template_text: f.template_text + ' ' + p }))} 
                                    style={{ background: '#fff', border: '1px solid #A7F3D0', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: '#166534', cursor: 'pointer' }}>
                                    + {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Message Text</FieldLabel>
                        <textarea value={waForm.template_text} onChange={e => setWaForm(f => ({ ...f, template_text: e.target.value }))} rows={10}
                            style={{ width: '100%', padding: '14px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontFamily: 'var(--font-sans)', color: P.dark, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box', fontWeight: 600 }}
                            placeholder="Hi {student_name}! Your exam {exam_name} is scheduled on..." />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <button onClick={() => setWaForm(f => ({ ...f, is_active: !f.is_active }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: waForm.is_active ? '#F0FDF4' : P.bg, border: `1px solid ${waForm.is_active ? '#A7F3D0' : P.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: waForm.is_active ? '#059669' : P.muted }}>
                            {waForm.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {waForm.is_active ? 'Active Status' : 'Inactive Status'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setWaDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={saveWa} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#16A34A', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(22,163,74,0.3)', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save WhatsApp Message'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── PUSH TEMPLATE DRAWER ── */}
            <SideDrawer isOpen={pushDrawer} onClose={() => setPushDrawer(false)} title={pushForm.id ? 'Edit Push Notification' : 'New Push Notification'} width={560}>
                <div style={{ padding: '28px 32px' }}>
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>Select Icon</FieldLabel>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {['🔔', '📚', '💰', '✅', '⚠️', '🎉', '📊', '🏆'].map(e => (
                                <button key={e} onClick={() => setPushForm(f => ({ ...f, icon: e }))} style={{ fontSize: 24, padding: '8px 12px', borderRadius: 10, border: `2px solid ${pushForm.icon === e ? '#9333EA' : P.border}`, background: pushForm.icon === e ? '#F5F3FF' : '#fff', cursor: 'pointer' }}>{e}</button>
                            ))}
                        </div>
                    </div>
                    <Input label="Notification Title" value={pushForm.title} onChange={(v: string) => setPushForm(f => ({ ...f, title: v }))} placeholder="e.g. New Exam Published" />
                    <Input label="Notification Message Body" value={pushForm.body} onChange={(v: string) => setPushForm(f => ({ ...f, body: v }))} placeholder="e.g. A new exam has been published for your class. Attempt now!" multiline rows={3} />
                    <Input label="Deep Link URL (Optional)" value={pushForm.deep_link} onChange={(v: string) => setPushForm(f => ({ ...f, deep_link: v }))} placeholder="e.g. /exams/123" />
                    
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button onClick={() => setPushDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={savePush} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#9333EA', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(147,51,234,0.3)', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Push Notification'}
                        </button>
                    </div>
                </div>
            </SideDrawer>

            {/* ── AUTOMATION RULE DRAWER ── */}
            <SideDrawer isOpen={ruleDrawer} onClose={() => setRuleDrawer(false)} title="Create Automatic Message Rule" width={560}>
                <div style={{ padding: '28px 32px' }}>
                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Event Trigger</FieldLabel>
                        <select value={ruleForm.trigger_event} onChange={e => setRuleForm(f => ({ ...f, trigger_event: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700, background: '#fff' }}>
                            {TRIGGER_EVENT_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Notification Channel</FieldLabel>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {(['email', 'whatsapp', 'push'] as const).map(ch => {
                                const meta = CHANNEL_META[ch]
                                return (
                                    <button key={ch} onClick={() => setRuleForm(f => ({ ...f, channel: ch }))} style={{
                                        flex: 1, padding: '14px 12px', borderRadius: 12,
                                        border: `2px solid ${ruleForm.channel === ch ? meta.color : P.border}`,
                                        background: ruleForm.channel === ch ? meta.bg : '#fff',
                                        color: ruleForm.channel === ch ? meta.color : P.muted,
                                        fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, justifyContent: 'center'
                                    }}>
                                        <meta.icon size={16} /> {meta.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <FieldLabel>Send Delay (Minutes — 0 for instant send)</FieldLabel>
                        <input type="number" min={0} value={ruleForm.delay_minutes} onChange={e => setRuleForm(f => ({ ...f, delay_minutes: parseInt(e.target.value) || 0 }))}
                            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${P.border}`, borderRadius: 12, fontSize: 14, color: P.dark, outline: 'none', fontWeight: 700 }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <button onClick={() => setRuleForm(f => ({ ...f, active_status: !f.active_status }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: ruleForm.active_status ? '#F0FDF4' : P.bg, border: `1px solid ${ruleForm.active_status ? '#A7F3D0' : P.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: ruleForm.active_status ? '#059669' : P.muted }}>
                            {ruleForm.active_status ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {ruleForm.active_status ? 'Active Rule' : 'Paused Rule'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setRuleDrawer(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: P.bg, border: `1px solid ${P.border}`, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                        <button onClick={saveRule} disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#EA580C', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(234,88,12,0.3)', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                            {saving ? 'Saving...' : 'Create Automatic Rule'}
                        </button>
                    </div>
                </div>
            </SideDrawer>
        </div>
    )
}
