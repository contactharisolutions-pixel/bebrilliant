'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Zap, Activity, Shield, Clock, Plus, Search, Filter, 
    Settings, Play, Pause, Trash2, ArrowRight, Bell, 
    Database, RefreshCw, CheckCircle, AlertTriangle, Loader2,
    Eye, MoreVertical, Terminal, Cpu
} from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'
import { StatusBadge } from '@/components/shared/institutional/StatusBadge'

// Type definitions for Automation Pipeline
type LogicSequence = {
    id: string
    name: string
    trigger: string
    action: string
    status: 'OPTIMAL' | 'PAUSED' | 'DEGRADED'
    last_run: string
    execution_count: number
}

export default function AutomationController() {
    const [sequences, setSequences] = useState<LogicSequence[]>([
        { id: '1', name: 'Auto account setup', trigger: 'User.Signup', action: 'Create.LMS', status: 'OPTIMAL', last_run: '2 mins ago', execution_count: 1420 },
        { id: '2', name: 'Subscription reminder', trigger: 'Billing.Expire', action: 'Send.Email', status: 'PAUSED', last_run: '1 day ago', execution_count: 85 },
        { id: '3', name: 'Sync exam results', trigger: 'Exam.Submit', action: 'Update.Reports', status: 'OPTIMAL', last_run: 'Just now', execution_count: 45210 },
    ])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px', fontFamily: 'var(--font-sans)' }}>
            <style>{GLASS_STYLES + `
                .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24 }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                     <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automation</div>
                     <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.muted }} />
                     <div style={{ fontSize: 12, fontWeight: 700, color: P.muted }}>Version 2.1</div>
                   </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>Automation Rules</h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>
                        Set up rules to automate platform tasks.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button style={{ 
                        display: 'flex', alignItems: 'center', gap: 8, background: P.card, 
                        border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 20px', 
                        fontSize: 13, fontWeight: 800, color: P.dark, cursor: 'pointer' 
                    }}>
                        <Terminal size={16} color={P.brand} /> System Logs
                    </button>
                    <button style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, background: P.brand, 
                        color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', 
                        fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}40` 
                    }}>
                        <Plus size={20} strokeWidth={3} /> New Rule
                    </button>
                </div>
            </div>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
              <KpiCard icon={Zap} title="Active Rules" value="24" color={P.brand} trend="4" trendIsUp={true} />
              <KpiCard icon={Activity} title="Rule Health" value="99.9%" color={P.success} trend="Stable" trendIsUp={true} />
              <KpiCard icon={Database} title="Tasks Done" value="1.2M" color={P.info} trend="24k" trendIsUp={true} />
              <KpiCard icon={Clock} title="Task Speed" value="18ms" color={P.cta} trend="2ms" trendIsUp={false} />
            </div>

            {/* CONTROLS BAR */}
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 24, padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search rules..."
                        style={{ width: '100%', padding: '14px 16px 14px 48px', border: `1px solid ${P.border}`, borderRadius: 14, fontSize: 14, color: P.dark, background: P.bg, outline: 'none', fontWeight: 600 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8, background: P.bg, border: `1px solid ${P.border}`, borderRadius: 14, padding: 6 }}>
                    {['ALL', 'ACTIVE', 'TRIGGERED', 'ERROR'].map(f => (
                        <button key={f} style={{
                            padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer',
                            background: f === 'ALL' ? P.card : 'transparent',
                            color: f === 'ALL' ? P.brand : P.muted,
                            border: 'none', transition: 'all 0.2s',
                            boxShadow: f === 'ALL' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}>{f}</button>
                    ))}
                </div>
            </div>

            {/* SEQUENCES LIST */}
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                            {['Rule Name', 'When this happens', 'Do this', 'Status', 'Last Run', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '20px', textAlign: 'left', fontSize: 11, fontWeight: 950, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sequences.map((s, i) => (
                            <tr key={s.id} style={{ borderBottom: i < sequences.length - 1 ? `1px solid ${P.border}` : 'none', transition: 'all 0.2s' }}>
                                <td style={{ padding: '24px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: s.status === 'OPTIMAL' ? P.brandBg : P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Cpu size={22} color={s.status === 'OPTIMAL' ? P.brand : P.muted} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>ID: {s.id.padStart(4, '0')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <code style={{ fontSize: 13, color: P.brand, fontWeight: 800, background: P.brandBg, padding: '4px 10px', borderRadius: 8 }}>{s.trigger}</code>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: P.text }}>
                                        <ArrowRight size={14} color={P.muted} /> {s.action}
                                    </div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <StatusBadge type={s.status === 'OPTIMAL' ? 'success' : s.status === 'PAUSED' ? 'warning' : 'error'} status={s.status} />
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>{s.last_run}</div>
                                    <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{s.execution_count} executions</div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${P.border}`, background: P.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            {s.status === 'PAUSED' ? <Play size={16} color={P.success} fill={P.success} /> : <Pause size={16} color={P.warning} fill={P.warning} />}
                                        </button>
                                        <button style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${P.border}`, background: P.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Settings size={16} color={P.muted} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ACTIVITY LOG */}
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 28, padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 950, color: P.dark, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Terminal size={18} color={P.brand} /> Activity Log
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { time: '15:38:21', msg: 'Rule setup successful', status: 'success' },
                            { time: '15:38:18', msg: 'System check complete', status: 'info' },
                            { time: '15:37:54', msg: 'Warning: Rule takes longer than usual', status: 'warning' },
                        ].map((log, i) => (
                            <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: i < 2 ? `1px solid ${P.border}` : 'none' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: P.muted, fontFamily: 'monospace' }}>[{log.time}]</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: log.status === 'warning' ? P.warning : log.status === 'info' ? P.info : P.dark }}>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: P.brand, borderRadius: 28, padding: 32, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: '#fff', opacity: 0.1, borderRadius: '50%' }} />
                    <Shield size={48} color="#fff" style={{ marginBottom: 24, opacity: 0.8 }} />
                    <h3 style={{ fontSize: 22, fontWeight: 950, marginBottom: 12 }}>Safeguards</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>Platform safety is on. Automated tasks are monitored.</p>
                    <button style={{ width: '100%', background: '#fff', color: P.brand, border: 'none', padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                        Edit Safeguards
                    </button>
                </div>
            </div>
        </div>
    )
}
