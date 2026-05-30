'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    BookOpen, Database, ShoppingBag, BarChart2,
    Plus, Trash2, Edit3, ChevronRight, ChevronDown, PlusCircle,
    Check, X, Save, Loader2, AlertCircle, RefreshCcw,
    Globe, Eye, EyeOff, Upload,
    CheckCircle2, XCircle, Info, Download, FileSpreadsheet, Lock, Unlock, ShoppingCart,
    Layers, Target, Zap, Shield, Sparkles, LayoutDashboard, Search,
    Cpu, Activity, GraduationCap, ArrowUpRight, MousePointer2,
    Binary, CheckCheck
} from 'lucide-react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
// ── TYPES ────────────────────────────────────────────────
type NodeType = 'board' | 'class' | 'subject' | 'chapter' | 'topic'
type SyllabusNode = {
    id: string; parent_id: string | null; type: NodeType; name: string
    order_index: number; is_active: boolean; created_at: string
}
type SyllabusPlan = {
    id: string; name: string; syllabus_id: string; pricing_type: string
    price: number; features: any; is_active: boolean
    syllabus_nodes?: { name: string; type: string }
}
const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.7)'
}
const NODE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    board: { label: 'Board', color: '#004B93', bg: '#004B9310', icon: Globe },
    class: { label: 'Class', color: '#8B5CF6', bg: '#8B5CF610', icon: GraduationCap },
    subject: { label: 'Subject', color: '#1FAC63', bg: '#1FAC6310', icon: BookOpen },
    chapter: { label: 'Chapter', color: '#F0A026', bg: '#F0A02610', icon: Layers },
    topic: { label: 'Topic', color: '#64748B', bg: '#64748B10', icon: Target },
}
const BOARD_GROUPS = [
    { label: 'School Syllabus', items: ['CBSE', 'ICSE', 'IB Board', 'NIOS Board', 'GUJCET', 'Gujarat Board', 'State Board'] },
    { label: 'Entrance Exams', items: ['JEE Main', 'JEE Advanced', 'NEET', 'CUET', 'CLAT', 'CAT', 'GATE'] },
    { label: 'Competitive', items: ['UPSC Civil Services', 'SSC CGL', 'NDA', 'CDS', 'RRB'] }
]
const SCHOOL_BOARDS = BOARD_GROUPS[0].items;
// ── COMPONENTS ──────────────────────────────────
function ToastNotification({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 32, right: 32, background: ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${ok ? COLORS.success : COLORS.danger}40`, borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 30000, animation: 'float 0.3s ease-out' }}>
            {ok ? <CheckCircle2 size={20} color={COLORS.success} /> : <XCircle size={20} color={COLORS.danger} />}
            <span style={{ fontSize: 14, fontWeight: 900, color: ok ? '#065F46' : '#991B1B' }}>{msg}</span>
        </div>
    )
}
function Modal({ title, onClose, children, onSubmit, saving, saveText = 'Save' }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 28, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'float 0.3s ease-out', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#64748B" /></button>
                </div>
                <div style={{ padding: 40, overflowY: 'auto' }}>{children}</div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Discard</button>
                    <button onClick={onSubmit} disabled={saving} style={{ padding: '12px 28px', borderRadius: 14, background: COLORS.primaryGradient, border: 'none', color: '#fff', fontSize: 14, fontWeight: 1000, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,75,147,0.15)' }}>
                        {saving && <Loader2 size={16} className="spin" />} {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}
// ── TREE NODE COMPONENT ──────────────────────────
function TreeNode({ node, nodes, onEdit, onDelete, onAddChild, onToggle, onAIGen, level = 0 }: any) {
    const [expanded, setExpanded] = useState(false) // Default minimized
    const [generating, setGenerating] = useState(false)
    const children = useMemo(() => nodes.filter((n: SyllabusNode) => n.parent_id === node.id), [nodes, node.id])
    const config = NODE_CONFIG[node.type] || NODE_CONFIG.topic
    return (
        <div style={{ marginLeft: level > 0 ? 36 : 0, WebkitUserSelect: 'none' }}>
            <div className="node-pulse" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: '#FFF', border: `1px solid ${expanded ? COLORS.primary + '20' : '#F1F5F9'}`, borderRadius: 20, marginBottom: 8, transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' }}>
                {expanded && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: COLORS.primaryGradient }} />}
                <button onClick={() => children.length > 0 && setExpanded(!expanded)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: COLORS.slate }}>
                    {children.length > 0 ? (expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <Binary size={14} color="#CBD5E1" />}
                </button>
                <div style={{ padding: 10, background: config.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <config.icon size={18} color={config.color} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 1000, color: node.is_active ? '#1E293B' : '#94A3B8' }}>{node.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: config.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{config.label}</div>
                </div>
                {children.length > 0 && (
                    <div style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 900, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Layers size={12} /> {children.length} Sequences
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    {!node.is_master && (
                        <>
                            <button onClick={async () => { setGenerating(true); await onAIGen(node); setGenerating(false) }} className="control-btn" title="AI Generate Child Sequence" style={{ color: COLORS.warning }}>
                                {generating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                            </button>
                            <button onClick={() => onToggle(node)} className="control-btn" title="Toggle Signal State">{node.is_active ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                            <button onClick={() => onAddChild(node)} className="control-btn" title="Provision Child Node" style={{ color: COLORS.primary }}><PlusCircle size={16} /></button>
                            <button onClick={() => onEdit(node)} className="control-btn" title="Edit Node Architecture"><Edit3 size={16} /></button>
                            <button onClick={() => onDelete(node)} className="control-btn" title="Purge Node" style={{ color: COLORS.danger }}><Trash2 size={16} /></button>
                        </>
                    )}
                    {node.is_master && (
                        <button onClick={() => onToggle(node)} className="control-btn" title="Toggle Active State">{node.is_active ? <CheckCircle2 size={16} color={COLORS.success} /> : <EyeOff size={16} />}</button>
                    )}
                </div>
            </div>
            {expanded && children.length > 0 && (
                <div style={{ borderLeft: `2px solid #F1F5F9`, marginLeft: 8, paddingLeft: 4 }}>
                    {children.map((child: SyllabusNode) => (
                        <TreeNode key={child.id} node={child} nodes={nodes} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onToggle={onToggle} onAIGen={onAIGen} />
                    ))}
                </div>
            )}
        </div>
    )
}
// ── MAIN APPLICATION ─────────────────────────────
export default function SyllabusManagement() {
    const [tab, setTab] = useState('tree')
    const [nodes, setNodes] = useState<SyllabusNode[]>([])
    const [marketplace, setMarketplace] = useState<SyllabusPlan[]>([])
    const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [nodeModal, setNodeModal] = useState<{ open: boolean; editing?: SyllabusNode; parent?: SyllabusNode; success?: boolean }>({ open: false })
    const [nodeForm, setNodeForm] = useState({ name: '', type: 'chapter' as NodeType })
    const fetchHierarchy = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/syllabus')
            const json = await res.json()
            if (res.ok) {
                setNodes(json.nodes || [])
                setMarketplace(json.marketplace || [])
                setActiveSubscriptions(json.active_subscriptions || [])
            }
        } finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchHierarchy() }, [fetchHierarchy])
    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Signal Refused')
            await fetchHierarchy()
            showToast('Syllabus Synchronized', true)
            return json
        } catch (e: any) { showToast(e.message, false); return null }
        finally { setSaving(false) }
    }
    const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }
    const openAddChild = (p: SyllabusNode) => {
        const nextMap: Record<NodeType, NodeType> = { board: 'class', class: 'subject', subject: 'chapter', chapter: 'topic', topic: 'topic' }
        setNodeForm({ name: '', type: nextMap[p.type] })
        setNodeModal({ open: true, parent: p })
    }
    const handleSaveNode = async () => {
        if (!nodeForm.name.trim()) return showToast('Identity Name Required', false)
        if (nodeModal.editing) {
            await apiAction('UPDATE_NODE', { id: nodeModal.editing.id, ...nodeForm })
        } else if (nodeModal.parent) {
            await apiAction('CREATE_NODE', { ...nodeForm, parent_id: nodeModal.parent.id })
        } else {
            await apiAction('CREATE_MANUAL_SYLLABUS', { name: nodeForm.name, type: 'board' })
        }
        setNodeModal({ ...nodeModal, success: true })
        setTimeout(() => {
            setNodeModal({ open: false })
            fetchHierarchy()
        }, 5000)
    }
    const handleAIGenNode = async (node: SyllabusNode) => {
        const res = await apiAction('GENERATE_SYLLABUS', { node_id: node.id, node_type: node.type, node_name: node.name })
        if (res) fetchHierarchy()
    }
    const rootNodes = useMemo(() => nodes.filter(n => !n.parent_id), [nodes])
    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* TOAST NODES */}
            {toast && <ToastNotification msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
            {/* SYLLABUS HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: COLORS.primaryGradient, borderRadius: 14, boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>
                            <Cpu size={24} color="#FFF" />
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Syllabus Management</h1>
                    </div>
                    <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 600, maxWidth: 650, lineHeight: 1.6 }}>
                        Manage your school syllabus, subjects, and topics. Create boards, classes, and assign chapters to maintain an organized course structure.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={fetchHierarchy} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <RefreshCcw size={16} className={loading ? 'spin' : ''} /> Refresh List
                    </button>
                    <button onClick={() => { setNodeForm({ name: '', type: 'board' }); setNodeModal({ open: true }) }} style={{ padding: '14px 28px', borderRadius: 16, background: COLORS.primaryGradient, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,75,147,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <PlusCircle size={20} /> Add New Board
                    </button>
                </div>
            </div>
            {/* SYLLABUS STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                {[
                    { label: 'Total Items', val: nodes.length, icon: Target, color: COLORS.primary },
                    { label: 'School Boards', val: rootNodes.length, icon: Globe, color: COLORS.warning },
                    { label: 'Active Topics', val: nodes.filter(n => n.is_active).length, icon: Zap, color: COLORS.success },
                    { label: 'Total Depth', val: 'Level 5', icon: Binary, color: '#8B5CF6' }
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#FFF', padding: 28, borderRadius: 28, border: '1px solid #F1F5F9', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ padding: 10, background: `${stat.color}10`, borderRadius: 12 }}>
                                <stat.icon size={20} color={stat.color} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{stat.val}</div>
                    </div>
                ))}
            </div>
            {/* VIEW TABS */}
            <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: 8, borderRadius: 24, width: 'fit-content', marginBottom: 40 }}>
                {[
                    { id: 'tree', label: 'My Syllabus', icon: Layers },
                    { id: 'acquired', label: 'Book Library', icon: Database },
                    { id: 'market', label: 'Buy Books', icon: ShoppingBag },
                    { id: 'bulk', label: 'Bulk Upload', icon: Upload }
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? 'tab-active' : ''} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 18, border: 'none', background: 'transparent', color: '#64748B', fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>
            {/* CONTENT AREA */}
            {loading ? (
                <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={48} color={COLORS.primary} className="spin" style={{ marginBottom: 24 }} />
                    <p style={{ fontSize: 13, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING SYLLABUS STRUCTURE...</p>
                </div>
            ) : (
                <div style={{ animation: 'float 0.4s ease-out' }}>
                    {tab === 'tree' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: 40 }}>
                            {/* MASTER HIERARCHY TREE */}
                            <div style={{ background: '#FFF', borderRadius: 32, padding: 40, border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>Academic Structure</h2>
                                    <div style={{ padding: '8px 16px', background: `${COLORS.primary}08`, color: COLORS.primary, borderRadius: 12, fontSize: 11, fontWeight: 1000, letterSpacing: '0.05em' }}>DEPTH ENFORCED</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {rootNodes.length > 0 ? rootNodes.map(node => (
                                        <TreeNode 
                                            key={node.id} 
                                            node={node} 
                                            nodes={nodes} 
                                            onEdit={(n: any) => { setNodeForm({ name: n.name, type: n.type }); setNodeModal({ open: true, editing: n }) }} 
                                            onDelete={(n: any) => confirm(`Delete Subject Node "${n.name}"?`) && apiAction('DELETE_NODE', { id: n.id })} 
                                            onAddChild={openAddChild} 
                                            onToggle={(n: any) => apiAction('TOGGLE_NODE', { id: n.id, is_active: !n.is_active })} 
                                            onAIGen={handleAIGenNode}
                                        />
                                    )) : (
                                        <div style={{ padding: 80, textAlign: 'center' }}>
                                            <LayoutDashboard size={48} color="#E2E8F0" style={{ marginBottom: 20 }} />
                                            <p style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8' }}>No Academic Nodes Provisioned</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                             {/* INFORMATION SIDEBAR */}
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                 <div style={{ background: COLORS.primaryGradient, borderRadius: 32, padding: 32, color: '#FFF', boxShadow: '0 20px 40px rgba(0,75,147,0.2)', position: 'relative', overflow: 'hidden' }}>
                                     <Globe size={120} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }} />
                                     <h3 style={{ margin: 0, fontSize: 18, fontWeight: 1000, marginBottom: 12, position: 'relative' }}>Provisioning Engine</h3>
                                     <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.6, marginBottom: 24, position: 'relative' }}>
                                         Instantiate authoritative board structures. Note: The system enforces an <b>Exclusive School Board</b> policy.
                                     </p>
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                                         {BOARD_GROUPS.map(group => (
                                             <div key={group.label}>
                                                 <div style={{ fontSize: 10, fontWeight: 1000, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>{group.label}</div>
                                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                     {group.items.map(b => {
                                                         const exists = nodes.some(n => n.name === b && !n.parent_id);
                                                         const active = nodes.some(n => n.name === b && !n.parent_id && n.is_active);
                                                         return (
                                                             <button 
                                                                 key={b} 
                                                                 disabled={exists || saving} 
                                                                 onClick={() => {
                                                                     const isSchool = SCHOOL_BOARDS.includes(b);
                                                                     if (isSchool && nodes.some(n => !n.parent_id && n.is_active && SCHOOL_BOARDS.includes(n.name))) {
                                                                         if (!confirm(`Provisioning "${b}" will deactivate your current active school board. Proceed?`)) return;
                                                                     }
                                                                     apiAction('CREATE_MANUAL_SYLLABUS', { name: b, type: 'board' })
                                                                 }} 
                                                                 style={{ 
                                                                     padding: '8px 12px', borderRadius: 10, 
                                                                     border: `1px solid rgba(255,255,255,${active ? 0.4 : 0.15})`, 
                                                                     background: active ? 'rgba(255,255,255,0.15)' : exists ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)', 
                                                                     color: exists ? 'rgba(255,255,255,0.4)' : '#FFF', 
                                                                     fontSize: 10, fontWeight: 900, cursor: exists ? 'default' : 'pointer', 
                                                                     transition: '0.2s', display: 'flex', alignItems: 'center', gap: 6
                                                                 }}
                                                             >
                                                                 {b} {active && <CheckCheck size={12} />}
                                                             </button>
                                                         )
                                                     })}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                                 <div style={{ background: '#FFF', borderRadius: 32, padding: 32, border: '1px solid #E2E8F0', borderTop: `4px solid ${COLORS.warning}` }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                         <Shield size={18} color={COLORS.warning} />
                                         <span style={{ fontSize: 12, fontWeight: 1000, color: '#1B1D21', textTransform: 'uppercase' }}>Concurrency Policy</span>
                                     </div>
                                     <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>
                                         Activating a secondary school board will automatically archive current academic evaluators to prevent curriculum conflict.
                                     </p>
                                 </div>
                             </div>
                         </div>
                     )}
                    {tab === 'acquired' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                            {activeSubscriptions.map((s: any) => (
                                <div key={s.id} style={{ background: '#FFF', padding: 32, borderRadius: 28, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 24 }}>
                                    <div style={{ padding: 16, background: `${COLORS.primary}08`, borderRadius: 20 }}>
                                        <Database size={28} color={COLORS.primary} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 18, fontWeight: 1000, color: '#1E293B' }}>{s.syllabus_nodes?.name}</div>
                                        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, marginTop: 4 }}>Syllabus ID: {s.syllabus_id?.substring(0,16)}...</div>
                                    </div>
                                    <div style={{ padding: '8px 16px', background: `${COLORS.success}10`, color: COLORS.success, borderRadius: 12, fontSize: 11, fontWeight: 1000 }}>VERIFIED</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {tab === 'market' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                             {marketplace.map(p => (
                                <div key={p.id} style={{ background: '#FFF', borderRadius: 32, padding: 40, border: '2px solid #F1F5F9', position: 'relative' }}>
                                    <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 1000 }}>{p.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                                        <span style={{ fontSize: 28, fontWeight: 1000 }}>₹{p.price}</span>
                                        <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 800 }}>ONE-TIME</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                                        {Array.isArray(p.features) && p.features.map((f: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#475569', fontWeight: 600 }}>
                                                <Check size={16} color={COLORS.success} /> {f}
                                            </div>
                                        ))}
                                    </div>
                                     {(() => {
                                        const sub = activeSubscriptions.find((s: any) => s.syllabus_id === p.syllabus_id);
                                        const isActive = sub?.is_active;
                                        return (
                                            <button 
                                                onClick={() => apiAction('PURCHASE_SYLLABUS', { plan_id: p.id, price: p.price })} 
                                                disabled={saving || isActive}
                                                style={{ 
                                                    width: '100%', padding: '16px', borderRadius: 18, 
                                                    background: isActive ? COLORS.success + '10' : sub ? COLORS.primaryGradient : '#F1F5F9', 
                                                    border: 'none', 
                                                    color: isActive ? COLORS.success : sub ? '#FFF' : COLORS.primary, 
                                                    fontSize: 13, fontWeight: 1000, 
                                                    cursor: isActive ? 'default' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                                }}
                                            >
                                                {isActive ? <><CheckCheck size={16}/> Active</> : sub ? <><Zap size={16}/> Deploy Blueprint</> : 'Acquire Blueprint'}
                                            </button>
                                        )
                                     })()}
                                </div>
                             ))}
                        </div>
                    )}
                </div>
            )}
            {/* ADD / EDIT MODAL */}
            {nodeModal.open && (
                <Modal title={nodeModal.editing ? `Configure: ${nodeModal.editing.name}` : `Add Syllabus Item`} onClose={() => setNodeModal({ open: false })} onSubmit={handleSaveNode} saving={saving} saveText={nodeModal.success ? 'Synced!' : 'Save'}>
                    {nodeModal.success ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ padding: 20, background: '#F0FDF4', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <CheckCircle2 size={40} color={COLORS.success} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1E293B' }}>Syllabus Saved</h4>
                            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>Master Knowledge Tree will refresh in 5 seconds...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node Identity</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#F8FAFC', borderRadius: 18, border: '2px solid #F1F5F9' }}>
                                    <Edit3 size={18} color="#94A3B8" />
                                    <input value={nodeForm.name} onChange={e => setNodeForm({...nodeForm, name: e.target.value})} placeholder="e.g. Physics / Std 10" style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: '#0F172A', outline: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organizational Type</label>
                                <select value={nodeForm.type} onChange={e => setNodeForm({...nodeForm, type: e.target.value as NodeType})} style={{ width: '100%', padding: '16px', borderRadius: 18, border: '2px solid #F1F5F9', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none', appearance: 'none' }}>
                                    {Object.entries(NODE_CONFIG).map(([val, conf]) => (
                                        <option key={val} value={val}>{conf.label.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    )
}
