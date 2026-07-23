'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    CheckCircle2, ChevronRight, Clock, FileText, Loader2, RefreshCw,
    Search, ShieldCheck, Users, AlertTriangle, ArrowUpRight, Save,
    CheckSquare, Square, X, Plus, MessageSquare, Flag, Calendar,
    Activity, TrendingDown, Target, AlertCircle, Heart, Circle,
    MoreHorizontal, ChevronDown, Milestone, Send, Flame,
} from 'lucide-react'

// ── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#EEF4FF',
    cta: '#F0A026', ctaBg: '#FFF7E6',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#059669', successBg: '#ECFDF5',
    warning: '#D97706', warningBg: '#FFFBEB',
    error: '#DC2626', errorBg: '#FEF2F2',
    info: '#2563EB', infoBg: '#EFF6FF',
    purple: '#7C3AED', purpleBg: '#F5F3FF',
}

// ── LIFECYCLE STAGES ──────────────────────────────────────────────────────────
const LIFECYCLE_STAGES = [
    { key: 'provisioned', label: 'Provisioned', color: '#6366F1', bg: '#EEF2FF' },
    { key: 'setup',       label: 'Setup',       color: P.warning, bg: P.warningBg },
    { key: 'training',    label: 'Training',    color: P.brand,   bg: P.brandBg },
    { key: 'go_live',     label: 'Go Live',     color: P.purple,  bg: P.purpleBg },
    { key: 'active',      label: 'Active',      color: P.success, bg: P.successBg },
    { key: 'at_risk',     label: 'At Risk',     color: P.error,   bg: P.errorBg },
    { key: 'churned',     label: 'Churned',     color: P.muted,   bg: P.hover },
]

const PRIORITY_CONFIG = {
    low:    { label: 'Low',    color: P.muted,   bg: P.hover },
    medium: { label: 'Medium', color: P.warning, bg: P.warningBg },
    high:   { label: 'High',   color: P.error,   bg: P.errorBg },
}

function stageOf(key: string) { return LIFECYCLE_STAGES.find(s => s.key === key) ?? LIFECYCLE_STAGES[0] }

function healthColor(score: number) {
    if (score >= 75) return P.success
    if (score >= 50) return P.warning
    return P.error
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: ok ? P.success : P.error, color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999, animation: 'slideUp 0.3s ease' }}>
            {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {msg}
        </div>
    )
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
    return <span style={{ background: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
}

// ── HEALTH SCORE RING ─────────────────────────────────────────────────────────
function HealthRing({ score, size = 40 }: { score: number; size?: number }) {
    const r = (size / 2) - 4
    const circumference = 2 * Math.PI * r
    const dash = (score / 100) * circumference
    const color = healthColor(score)
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={P.border} strokeWidth={4} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
                strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            <text x={size / 2} y={size / 2} dominantBaseline="middle" textAnchor="middle" fill={color} fontSize={size > 48 ? 14 : 10} fontWeight={800}>{score}</text>
        </svg>
    )
}

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ tasks }: { tasks: any[] }) {
    const total = tasks.length
    const done = tasks.filter(t => t.completed).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: P.muted }}>{done}/{total} tasks</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? P.success : P.text }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: P.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? P.success : P.brand, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
        </div>
    )
}

// ── COMMENT THREAD ────────────────────────────────────────────────────────────
function CommentPanel({ checklistId, staffList }: { checklistId: string; staffList: any[] }) {
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetch(`/api/owner/onboarding/${checklistId}/comments`)
            .then(r => r.json()).then(d => { setComments(d.comments ?? []); setLoading(false) })
    }, [checklistId])

    async function post() {
        if (!text.trim()) return
        setSending(true)
        const res = await fetch(`/api/owner/onboarding/${checklistId}/comments`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text }),
        })
        if (res.ok) { const d = await res.json(); setComments(c => [...c, d.comment]); setText('') }
        setSending(false)
    }

    return (
        <div>
            {loading ? <div style={{ padding: 30, textAlign: 'center' }}><Loader2 size={20} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
            : comments.length === 0 ? <div style={{ padding: '30px 0', textAlign: 'center', color: P.muted, fontSize: 13 }}>No comments yet. Be the first to add one.</div>
            : <div style={{ marginBottom: 16 }}>
                {comments.map((c, i) => {
                    const author = c.created_by_profile
                    return (
                        <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: P.brand, flexShrink: 0 }}>
                                {author ? (author.first_name?.[0] ?? '?') : '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>{author ? `${author.first_name} ${author.last_name}` : 'Unknown'}</span>
                                    <span style={{ fontSize: 11, color: P.muted }}>{new Date(c.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div style={{ background: P.bg, borderRadius: '0 10px 10px 10px', padding: '10px 14px', fontSize: 13, color: P.text, lineHeight: 1.5 }}>{c.content}</div>
                            </div>
                        </div>
                    )
                })}
            </div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && post()} placeholder="Add a comment..." style={{ flex: 1, padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                <button onClick={post} disabled={sending || !text.trim()} style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: P.brand, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 12, opacity: !text.trim() || sending ? 0.6 : 1 }}>
                    <Send size={12} /> Post
                </button>
            </div>
        </div>
    )
}

// ── DETAIL DRAWER ─────────────────────────────────────────────────────────────
function OnboardingDrawer({ checklist: initial, staffList, onClose, onSaved }: { checklist: any; staffList: any[]; onClose: () => void; onSaved: () => void }) {
    const [tab, setTab] = useState<'tasks' | 'timeline' | 'comments' | 'health'>('tasks')
    const [checklist, setChecklist] = useState(initial)
    const [tasks, setTasks] = useState<any[]>(initial.tasks ?? [])
    const [stage, setStage] = useState(initial.lifecycle_stage ?? 'provisioned')
    const [healthScore, setHealthScore] = useState(initial.health_score ?? 100)
    const [churnRisk, setChurnRisk] = useState(initial.churn_risk_level ?? 'safe')
    const [notes, setNotes] = useState(initial.notes ?? '')
    const [assignedStaff, setAssignedStaff] = useState(initial.assigned_staff_id ?? '')
    const [saving, setSaving] = useState(false)
    const [timeline, setTimeline] = useState<any[]>([])
    const [timelineLoading, setTimelineLoading] = useState(false)
    const [newTask, setNewTask] = useState('')

    useEffect(() => {
        if (tab === 'timeline') {
            setTimelineLoading(true)
            fetch(`/api/owner/onboarding/${checklist.id}`)
                .then(r => r.json()).then(d => { setTimeline(d.timeline ?? []); setTimelineLoading(false) })
        }
    }, [tab, checklist.id])

    async function save() {
        setSaving(true)
        try {
            await fetch(`/api/owner/onboarding/${checklist.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks, lifecycle_stage: stage, health_score: healthScore, churn_risk_level: churnRisk, notes, assigned_staff_id: assignedStaff || null }),
            })
            onSaved()
        } finally { setSaving(false) }
    }

    function toggleTask(idx: number) {
        setTasks(ts => ts.map((t, i) => i === idx ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null } : t))
    }

    function addTask() {
        if (!newTask.trim()) return
        setTasks(ts => [...ts, { id: Math.random().toString(36).slice(2), title: newTask.trim(), completed: false, priority: 'medium', subtasks: [] }])
        setNewTask('')
    }

    function removeTask(idx: number) { setTasks(ts => ts.filter((_, i) => i !== idx)) }

    const st = stageOf(stage)
    const tenant = checklist.tenant
    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.completed).length
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    const DRAWER_TABS = [
        { key: 'tasks',    label: 'Tasks',    icon: CheckSquare },
        { key: 'timeline', label: 'Timeline', icon: Activity },
        { key: 'comments', label: 'Comments', icon: MessageSquare },
        { key: 'health',   label: 'Health',   icon: Heart },
    ]

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'relative', width: 540, background: P.card, height: '100%', overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + P.border, background: P.card, position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 17, fontWeight: 900, color: P.dark }}>{tenant?.name ?? 'Unknown Tenant'}</div>
                            <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>{tenant?.tenant_type ?? tenant?.type} · {tenant?.email}</div>
                        </div>
                        <HealthRing score={healthScore} size={44} />
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color={P.muted} /></button>
                    </div>
                    {/* Stage selector */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {LIFECYCLE_STAGES.map(ls => (
                            <button key={ls.key} onClick={() => setStage(ls.key)}
                                style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid ' + (stage === ls.key ? ls.color : P.border), background: stage === ls.key ? ls.bg : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: stage === ls.key ? ls.color : P.muted }}>
                                {ls.label}
                            </button>
                        ))}
                    </div>
                    {/* Progress */}
                    <ProgressBar tasks={tasks} />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid ' + P.border, padding: '0 24px' }}>
                    {DRAWER_TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: 'transparent', color: tab === t.key ? P.brand : P.muted, borderBottom: '2px solid ' + (tab === t.key ? P.brand : 'transparent'), marginBottom: -1 }}>
                            <t.icon size={13} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                    {/* TASKS TAB */}
                    {tab === 'tasks' && (
                        <div>
                            {tasks.map((task, i) => {
                                const pr = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
                                return (
                                    <div key={task.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 6, background: task.completed ? P.successBg : P.bg, border: '1px solid ' + (task.completed ? P.success + '30' : P.border), transition: 'all 0.15s' }}>
                                        <button onClick={() => toggleTask(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0, marginTop: 1 }}>
                                            {task.completed
                                                ? <CheckSquare size={18} color={P.success} />
                                                : <Square size={18} color={P.muted} />}
                                        </button>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: task.completed ? P.muted : P.dark, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</div>
                                            {task.due_date && <div style={{ fontSize: 11, color: P.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> Due: {new Date(task.due_date).toLocaleDateString('en-IN')}</div>}
                                            {(task.subtasks ?? []).length > 0 && (
                                                <div style={{ marginTop: 4 }}>
                                                    {task.subtasks.map((st: any, j: number) => (
                                                        <div key={j} style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                                            <Circle size={6} fill={P.muted} color={P.muted} /> {st.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <Pill label={pr.label} color={pr.color} bg={pr.bg} />
                                            <button onClick={() => removeTask(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6, opacity: 0.5 }} title="Remove task">
                                                <X size={12} color={P.error} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Add new task */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Add a task..." style={{ flex: 1, padding: '8px 12px', border: '1px dashed ' + P.border, borderRadius: 9, fontSize: 13, background: 'transparent', outline: 'none' }} />
                                <button onClick={addTask} disabled={!newTask.trim()} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: P.brand, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, opacity: !newTask.trim() ? 0.5 : 1 }}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TIMELINE TAB */}
                    {tab === 'timeline' && (
                        <div>
                            {timelineLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} /></div>
                            : timeline.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: P.muted, fontSize: 13 }}>No timeline events yet.</div>
                            : timeline.map((e, i) => {
                                const typeColors: any = {
                                    stage_change: P.brand, task_complete: P.success, comment_added: P.purple,
                                    staff_assigned: P.warning, milestone_reached: P.cta, health_score_change: P.error,
                                }
                                const color = typeColors[e.type] ?? P.muted
                                return (
                                    <div key={e.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                            {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, background: P.border, minHeight: 20, marginTop: 4 }} />}
                                        </div>
                                        <div style={{ flex: 1, paddingBottom: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: P.dark }}>{e.type.replace(/_/g, ' ')}</div>
                                            {e.payload && (
                                                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
                                                    {e.payload.from && e.payload.to ? `${e.payload.from} → ${e.payload.to}` : JSON.stringify(e.payload).slice(0, 80)}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 10, color: P.muted, marginTop: 3 }}>{new Date(e.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* COMMENTS TAB */}
                    {tab === 'comments' && <CommentPanel checklistId={checklist.id} staffList={staffList} />}

                    {/* HEALTH TAB */}
                    {tab === 'health' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                                <HealthRing score={healthScore} size={100} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 8 }}>Health Score (0-100)</label>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input type="range" min={0} max={100} value={healthScore} onChange={e => setHealthScore(Number(e.target.value))} style={{ flex: 1, accentColor: healthColor(healthScore) }} />
                                    <span style={{ fontSize: 16, fontWeight: 800, color: healthColor(healthScore), minWidth: 32 }}>{healthScore}</span>
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 8 }}>Churn Risk Level</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { k: 'safe',     label: '✅ Safe',     color: P.success, bg: P.successBg },
                                        { k: 'at_risk',  label: '⚠️ At Risk',  color: P.warning, bg: P.warningBg },
                                        { k: 'critical', label: '🔴 Critical', color: P.error,   bg: P.errorBg },
                                    ].map(r => (
                                        <button key={r.k} onClick={() => setChurnRisk(r.k)}
                                            style={{ flex: 1, padding: '8px 10px', borderRadius: 9, border: '1px solid ' + (churnRisk === r.k ? r.color : P.border), background: churnRisk === r.k ? r.bg : P.bg, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: churnRisk === r.k ? r.color : P.muted }}>
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: 'block', marginBottom: 8 }}>Internal Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Add internal notes..." style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, resize: 'none', outline: 'none', background: P.bg, boxSizing: 'border-box' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid ' + P.border, background: P.card, position: 'sticky', bottom: 0 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <select value={assignedStaff} onChange={e => setAssignedStaff(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none', fontWeight: 600 }}>
                                <option value="">— Unassigned —</option>
                                {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                            </select>
                        </div>
                        <button onClick={save} disabled={saving} style={{ padding: '9px 20px', border: 'none', borderRadius: 10, background: P.brand, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── TENANT CARD ───────────────────────────────────────────────────────────────
function TenantCard({ checklist, onClick }: { checklist: any; onClick: () => void }) {
    const tenant = checklist.tenant
    const tasks = checklist.tasks ?? []
    const stage = stageOf(checklist.lifecycle_stage ?? 'provisioned')
    const total = tasks.length
    const done = tasks.filter((t: any) => t.completed).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const isSlaBreached = checklist.sla_breached_at

    return (
        <div onClick={onClick} style={{ background: P.card, border: '1px solid ' + (isSlaBreached ? P.error : P.border), borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = stage.color }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = isSlaBreached ? P.error : P.border }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: P.dark, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tenant?.name ?? 'Unknown Tenant'}
                    </div>
                    <div style={{ fontSize: 11, color: P.muted }}>
                        {tenant?.tenant_type ?? tenant?.type ?? 'Institute'}
                    </div>
                </div>
                <HealthRing score={checklist.health_score ?? 100} size={36} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <Pill label={stage.label} color={stage.color} bg={stage.bg} />
                {checklist.churn_risk_level && checklist.churn_risk_level !== 'safe' && (
                    <Pill label={checklist.churn_risk_level === 'critical' ? '🔴 Critical' : '⚠️ At Risk'} color={P.error} bg={P.errorBg} />
                )}
                {isSlaBreached && <Pill label="SLA Breached" color={P.error} bg={P.errorBg} />}
            </div>
            <ProgressBar tasks={tasks} />
            {checklist.assigned_staff && (
                <div style={{ marginTop: 8, fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: P.brand }}>
                        {checklist.assigned_staff.first_name?.[0]}
                    </div>
                    {checklist.assigned_staff.first_name} {checklist.assigned_staff.last_name}
                </div>
            )}
        </div>
    )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const [checklists, setChecklists] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState('all')
    const [riskFilter, setRiskFilter] = useState('all')
    const [selected, setSelected] = useState<any>(null)
    const [staffList, setStaffList] = useState<any[]>([])
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true)
        try {
            const res = await fetch('/api/owner/onboarding')
            if (res.ok) setChecklists(await res.json())
        } finally { setLoading(false); setRefreshing(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => {
        fetch('/api/owner/rbac?role=staff').then(r => r.json()).then(d => setStaffList(d.users ?? []))
    }, [])

    const filtered = checklists.filter(c => {
        const name = c.tenant?.name?.toLowerCase() ?? ''
        const q = search.toLowerCase()
        if (search && !name.includes(q)) return false
        if (stageFilter !== 'all' && c.lifecycle_stage !== stageFilter) return false
        if (riskFilter === 'at_risk' && c.churn_risk_level === 'safe') return false
        if (riskFilter === 'sla_breached' && !c.sla_breached_at) return false
        return true
    })

    // KPIs
    const total = checklists.length
    const active = checklists.filter(c => ['setup', 'training', 'go_live'].includes(c.lifecycle_stage ?? '')).length
    const completed = checklists.filter(c => c.lifecycle_stage === 'active').length
    const atRisk = checklists.filter(c => c.churn_risk_level !== 'safe' || c.sla_breached_at).length
    const avgHealth = total > 0 ? Math.round(checklists.reduce((acc, c) => acc + (c.health_score ?? 100), 0) / total) : 100

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ color: P.muted, fontWeight: 600 }}>Loading onboarding pipeline...</div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: P.bg, padding: '28px 32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } * { box-sizing: border-box; }`}</style>
            {toast && <Toast msg={toast.msg} ok={toast.ok} />}
            {selected && <OnboardingDrawer checklist={selected} staffList={staffList} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); fetchData(true); showToast('Onboarding updated successfully') }} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: '-0.5px' }}>Tenant Onboarding</div>
                    <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Lifecycle management, task tracking, and health monitoring</div>
                </div>
                <button onClick={() => fetchData(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: P.card, border: '1px solid ' + P.border, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: P.text }}>
                    <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                </button>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total',      value: total,     color: P.brand,   bg: P.brandBg,   icon: Users },
                    { label: 'In Progress',value: active,    color: P.warning, bg: P.warningBg, icon: Activity },
                    { label: 'Active',     value: completed, color: P.success, bg: P.successBg, icon: CheckCircle2 },
                    { label: 'At Risk',    value: atRisk,    color: P.error,   bg: P.errorBg,   icon: AlertTriangle },
                    { label: 'Avg Health', value: avgHealth + '%', color: healthColor(avgHealth), bg: P.bg, icon: Heart },
                ].map(k => (
                    <div key={k.label} style={{ background: k.bg, border: '1px solid ' + P.border, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <k.icon size={20} color={k.color} />
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: P.dark }}>{k.value}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: P.muted }}>{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stage pipeline strip */}
            <div style={{ display: 'flex', gap: 0, background: P.card, border: '1px solid ' + P.border, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                {[{ key: 'all', label: 'All', color: P.brand }, ...LIFECYCLE_STAGES].map((s, i) => {
                    const count = s.key === 'all' ? total : checklists.filter(c => c.lifecycle_stage === s.key).length
                    return (
                        <button key={s.key} onClick={() => setStageFilter(s.key)}
                            style={{ flex: 1, padding: '11px 6px', border: 'none', cursor: 'pointer', background: stageFilter === s.key ? s.color : 'transparent', color: stageFilter === s.key ? '#fff' : P.muted, fontWeight: 700, fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s', borderRight: i < LIFECYCLE_STAGES.length ? '1px solid ' + P.border : 'none' }}>
                            <span style={{ fontSize: 16, fontWeight: 900 }}>{count}</span>
                            <span>{s.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Filters */}
            <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenant..." style={{ width: '100%', paddingLeft: 33, paddingRight: search ? 30 : 12, paddingTop: 8, paddingBottom: 8, border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none' }} />
                    {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={12} color={P.muted} /></button>}
                </div>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ padding: '8px 11px', border: '1px solid ' + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: 'none', fontWeight: 600 }}>
                    <option value="all">All Risk Levels</option>
                    <option value="at_risk">At Risk / Critical</option>
                    <option value="sla_breached">SLA Breached</option>
                </select>
                <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{filtered.length} tenants</span>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, padding: 80, textAlign: 'center' }}>
                    <ShieldCheck size={48} color={P.border} style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No onboarding records found</div>
                    <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Adjust your filters to see results.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {filtered.map(c => (
                        <TenantCard key={c.id} checklist={c} onClick={() => setSelected(c)} />
                    ))}
                </div>
            )}
        </div>
    )
}
