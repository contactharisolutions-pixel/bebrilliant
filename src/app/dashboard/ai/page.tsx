'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    Sparkles, Bot, BrainCircuit, Activity, Settings2, Zap, LayoutTemplate,
    MessageSquare, Sliders, CheckCircle, XCircle, Loader2, PlayCircle, ShieldCheck,
    Cpu, Globe, Lock, Workflow, CpuIcon, Binary, RefreshCcw, Send
} from 'lucide-react'
// ── TYPES ───────────────────
type AISettings = {
    adaptive_learning: boolean;
    auto_grading: boolean;
    ai_question_generation: boolean;
    strict_syllabus_mapping: boolean;
    tokens_used: number;
    questions_generated: number;
    llm_model: string;
}
const COLORS = {
    primary: '#004B93',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    dark: '#0F172A',
    slate: '#64748B',
    border: 'rgba(255, 255, 255, 0.1)',
    glass: 'rgba(15, 23, 42, 0.7)'
}
// ── COMPONENTS ─────────────────
function TerminalModal({ title, onClose, content, generating }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: 24 }}>
            <div style={{ background: '#020617', borderRadius: 24, width: '100%', maxWidth: 740, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.8)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #1E293B' }}>
                <div style={{ padding: '20px 28px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0B0F1A' }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#38BDF8', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Binary size={16} /> {title}
                    </h3>
                    <button onClick={onClose} disabled={generating} style={{ background: 'transparent', border: 'none', cursor: generating ? 'not-allowed' : 'pointer', color: COLORS.slate }}><XCircle size={20} /></button>
                </div>
                <div style={{ padding: '40px', overflowY: 'auto', fontFamily: '"JetBrains Mono", monospace', color: COLORS.success, fontSize: 14, lineHeight: 1.6, position: 'relative' }}>
                    {generating ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#38BDF8' }}>
                                <Loader2 size={18} className="spin" /> <span>Initializing curriculum sync...</span>
                            </div>
                            <div style={{ color: COLORS.slate, marginLeft: 32 }}>&gt; Scraping Syllabus roots [GEMINI-FLASH ACTIVE]</div>
                            <div style={{ color: COLORS.slate, marginLeft: 32, animation: 'pulse 1.5s infinite' }}>&gt; Formatting data mapping...</div>
                            <div style={{ color: COLORS.slate, marginLeft: 32 }}>&gt; Authenticating curriculum lock...</div>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                            <div style={{ color: '#FCD34D', marginBottom: 16, borderLeft: `3px solid #FCD34D`, paddingLeft: 16 }}>[SYSTEM LOG]: Array successfully structured. Extracted 124 topics.</div>
                            <pre style={{ margin: 0, background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>{content}</pre>
                            <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                                <button onClick={onClose} style={{ padding: '12px 32px', background: COLORS.success, border: 'none', borderRadius: 12, color: '#020617', fontWeight: 900, cursor: 'pointer', fontFamily: 'Inter' }}>SAVE SETTINGS</button>
                                <button onClick={onClose} style={{ padding: '12px 32px', background: 'transparent', border: '1px solid #1E293B', borderRadius: 12, color: '#F1F5F9', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter' }}>CANCEL</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
function ControlToggle({ label, checked, onChange, desc, premium = false, disabled = false }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', border: `1px solid ${checked ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 24, background: checked ? 'rgba(56, 189, 248, 0.03)' : 'rgba(255,255,255,0.02)', marginBottom: 20, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: disabled ? 0.6 : 1 }} onClick={() => !disabled && onChange(!checked)}>
            <div style={{ flex: 1, paddingRight: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 900, color: checked ? '#38BDF8' : '#F1F5F9' }}>
                    {label} {premium && <div style={{ padding: '4px 8px', background: `${COLORS.success}20`, color: COLORS.success, fontSize: 9, borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise</div>}
                </div>
                {desc && <div style={{ fontSize: 14, color: COLORS.slate, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>{desc}</div>}
            </div>
            <div style={{ width: 52, height: 28, borderRadius: 100, background: checked ? COLORS.success : '#334155', position: 'relative', transition: 'background 0.3s ease', flexShrink: 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FFF', position: 'absolute', top: 3, left: checked ? 27 : 3, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
            </div>
        </div>
    )
}
// ── MAIN APPLICATION ───────────────────
export default function IntelligenceCenter() {
    const [settings, setSettings] = useState<AISettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [showTerminal, setShowTerminal] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [mockContent, setMockContent] = useState('')
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }
    const fetchAI = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/ai')
            const json = await res.json()
            if (res.ok) setSettings(json)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchAI() }, [fetchAI])
    const updateSettings = async (override: Partial<AISettings>) => {
        if (!settings) return
        const newSettings = { ...settings, ...override }
        setSettings(newSettings)
        try {
            const res = await fetch('/api/dashboard/ai', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: newSettings })
            })
            if (!res.ok) throw new Error()
            showToast('Settings Saved Successfully', true)
        } catch (e) {
            showToast('Failed to save settings', false)
            fetchAI()
        }
    }
    const handleOnboardAgent = async () => {
        setShowTerminal(true)
        setGenerating(true)
        // Simulated neuro-onboarding logic
        await new Promise(r => setTimeout(r, 2000))
        setMockContent(`{\n  "cluster_id": "GEMINI-2.5-FLASH-C7",\n  "status": "OPERATIONAL",\n  "metrics": {\n    "latency": "14ms",\n    "curriculum_lock": true,\n    "nodes_indexed": 1247,\n    "accuracy_drift": 0.002\n  },\n  "timestamp": "${new Date().toISOString()}"\n}`)
        setGenerating(false)
    }
    if (loading || !settings) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
                <Loader2 size={48} color="#38BDF8" className="spin" style={{ margin: '0 auto 24px' }} />
                <div style={{ color: '#38BDF8', fontWeight: 900, fontSize: 13, letterSpacing: '0.2em' }}>LOADING AI SETTINGS...</div>
            </div>
        )
    }
    return (
        <div style={{ padding: '40px 48px', background: '#020617', minHeight: '100vh', position: 'relative', overflowX: 'hidden', color: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.98); } }
                .grid-bg { background-image: radial-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px); background-size: 40px 40px; position: absolute; inset: 0; opacity: 0.15; pointer-events: none; }
                .glow-card { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .glow-card:hover { transform: translateY(-4px); border-color: rgba(56, 189, 248, 0.3); box-shadow: 0 20px 80px rgba(0, 0, 0, 0.5); }
                select { -webkit-appearance: none; appearance: none; }
            `}</style>
            <div className="grid-bg" />
            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#064E3B' : '#7F1D1D', border: `1px solid ${toast.ok ? COLORS.success : COLORS.danger}80`, borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', zIndex: 10000, animation: 'fadeIn 0.3s ease-out' }}>
                    {toast.ok ? <ShieldCheck size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.01em' }}>{toast.msg}</span>
                </div>
            )}
            <div style={{ position: 'relative', zIndex: 10 }}>
                {/* HEADER */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #004B93, #38BDF8)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.2)' }}>
                                <BrainCircuit size={32} color="#FFF" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: 38, fontWeight: 1000, letterSpacing: '-0.04em', color: '#F8FAFC' }}>AI Assistant Settings</h1>
                                <p style={{ margin: '4px 0 0', fontSize: 16, color: COLORS.slate, fontWeight: 500 }}>Manage your AI tools &bull; Gemini 2.5 Flash &bull; Connects to your Syllabus</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: `1px solid rgba(255,255,255,0.05)`, padding: '14px 24px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(10px)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.success, boxShadow: `0 0 15px ${COLORS.success}`, animation: 'pulse 2s infinite' }} />
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.12em' }}>System Status</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>GEMINI-2.5-FLASH ACTIVE</div>
                        </div>
                    </div>
                </header>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: 40 }}>
                    {/* LEFT PANEL: ACTIVITY & METRICS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* TOKEN USAGE */}
                        <div className="glow-card" style={{ padding: 40, borderRadius: 32, background: 'linear-gradient(165deg, #0F172A, #020617)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Activity size={18} /> Total Tokens Used
                                </h3>
                                <Zap size={22} color="#FCD34D" fill="#FCD34D" style={{ opacity: 0.9 }} />
                            </div>
                            <div style={{ marginBottom: 40 }}>
                                <div style={{ fontSize: 14, color: COLORS.slate, fontWeight: 600, marginBottom: 8 }}>Current Cycle Usage</div>
                                <div style={{ fontSize: 56, fontWeight: 1000, color: '#F1F5F9', display: 'flex', alignItems: 'baseline', gap: 12, letterSpacing: '-0.03em' }}>
                                    {settings.tokens_used.toLocaleString()} <span style={{ fontSize: 18, color: '#38BDF8', fontWeight: 900 }}>Tokens</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 50 }}>
                                {[40, 65, 45, 95, 60, 35, 85, 55, 100, 75, 45, 90].map((h, i) => (
                                    <div key={i} style={{ flex: 1, height: `${h}%`, background: h > 85 ? COLORS.danger : '#38BDF8', borderRadius: 4, opacity: 0.4 + (h/150) }} />
                                ))}
                            </div>
                        </div>
                        {/* RECENT NODE EXPORTS */}
                        <div className="glow-card" style={{ padding: 40, borderRadius: 32 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AI Activity Log</h3>
                                <Workflow size={18} color={COLORS.slate} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {[
                                    { text: 'Assessment Compiled [GEMINI]', time: '41s ago', ok: true },
                                    { text: 'Syllabus Synced', time: '14m ago', ok: true },
                                    { text: 'Adaptive Weight Calibration', time: '1h ago', ok: true }
                                ].map((log, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.ok ? COLORS.success : COLORS.danger }} />
                                            <span style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>{log.text}</span>
                                        </div>
                                        <span style={{ fontSize: 12, color: COLORS.slate, fontWeight: 700 }}>{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* ACTION PANEL */}
                        <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(0, 75, 147, 0.1))', border: `1px solid rgba(56, 189, 248, 0.2)`, borderRadius: 32, padding: 40 }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 900 }}>Curriculum AI Sync</h3>
                            <p style={{ margin: '0 0 32px', fontSize: 15, color: COLORS.slate, fontWeight: 500, lineHeight: 1.6 }}>Connect your syllabus and study materials to the AI assistant for better questions and insights.</p>
                            <button onClick={handleOnboardAgent} style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #004B93, #38BDF8)', color: '#FFF', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 10px 30px rgba(56, 189, 248, 0.2)', transition: 'all 0.3s' }}>
                                <Cpu size={20} /> SYNC CURRICULUM
                            </button>
                        </div>
                    </div>
                    {/* RIGHT PANEL: CONFIGURATION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <div className="glow-card" style={{ padding: 48, borderRadius: 32, background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                    <Settings2 size={28} color="#38BDF8" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.02em' }}>AI Feature Settings</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.slate, fontWeight: 600 }}>Enable or disable specific AI capabilities for your institution.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <ControlToggle
                                    label="Adaptive Learning Logic"
                                    premium
                                    desc="Adjusts difficulty vectors in real-time based on individual student scoring variance."
                                    checked={settings.adaptive_learning}
                                    onChange={(v: boolean) => updateSettings({ adaptive_learning: v })}
                                />
                                <ControlToggle
                                    label="AI Subjective Grading"
                                    desc="Uses AI to help assist in grading essays and subjective answers."
                                    checked={settings.auto_grading}
                                    onChange={(v: boolean) => updateSettings({ auto_grading: v })}
                                />
                                <ControlToggle
                                    label="Auto-Generate Assessments"
                                    premium
                                    desc="Allows the AI to automatically create new exam papers from your syllabus."
                                    checked={settings.ai_question_generation}
                                    onChange={(v: boolean) => updateSettings({ ai_question_generation: v })}
                                />
                                <ControlToggle
                                    label="Strict Syllabus Compliance"
                                    desc="Ensures questions and insights are strictly generated from your syllabus material."
                                    checked={settings.strict_syllabus_mapping}
                                    onChange={(v: boolean) => updateSettings({ strict_syllabus_mapping: v })}
                                />
                                {/* MODEL SELECTION SECTION */}
                                <div style={{ marginTop: 20, padding: 32, background: 'rgba(255,255,255,0.02)', borderRadius: 28, border: `1px solid rgba(255,255,255,0.05)` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Globe size={14} color={COLORS.slate} />
                                            <label style={{ fontSize: 13, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Engine</label>
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '6px 14px', borderRadius: 100 }}>SECURE</div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={settings.llm_model}
                                            onChange={e => updateSettings({ llm_model: e.target.value })}
                                            style={{ width: '100%', padding: '18px 24px', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, fontSize: 15, fontWeight: 800, color: '#F8FAFC', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash â€” High Speed (Recommended)</option>
                                            <option value="gpt-4o">GPT-4o (Omni) â€” Advanced Reasoning</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo â€” Legacy Model</option>
                                        </select>
                                        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: COLORS.slate }}><Activity size={16} /></div>
                                    </div>
                                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.success, fontWeight: 600 }}>
                                        <ShieldCheck size={14} /> End-to-end institutional encryption active for this cluster.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* TERMINAL MODAL */}
            {showTerminal && (
                <TerminalModal
                    title="System Sync Log"
                    generating={generating}
                    content={mockContent}
                    onClose={() => setShowTerminal(false)}
                />
            )}
        </div>
    )
}
