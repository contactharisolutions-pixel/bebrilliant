'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
    BookOpen, ShoppingBag, BarChart2, Globe,
    Plus, Trash2, Edit3, ChevronRight, ChevronDown, ChevronLeft,
    Check, X, Save, Loader2, AlertCircle, RefreshCw,
    Tag, Settings, Eye, EyeOff, TrendingUp, Package,
    Send, Sparkles, Upload, Download, FileSpreadsheet,
    CheckCircle2, XCircle, Info, Infinity, Layers, ShieldCheck,
    Target, Search, Filter, Move, Copy, MoreHorizontal,
    Activity, Clock, User, Zap, Award, Lock, Unlock,
    ChevronUp, Hash, AlignLeft, Gauge, Palette, FolderOpen,
    BrainCircuit, ArrowRight, CheckSquare, Square, MoveRight
} from 'lucide-react'
import { CURRICULUM_TEMPLATES } from '@/lib/ai/curriculum-templates'

// ── TYPES ──────────────────────────────────────────────────────────────────────
type NodeType = 'category' | 'board' | 'class' | 'subject' | 'chapter' | 'topic'
type SyllabusNode = {
    id: string; parent_id: string | null; type: NodeType; name: string
    metadata: any; order_index: number; version: number; is_active: boolean
    created_at: string; description?: string; difficulty_level?: string
    exam_weightage?: number; estimated_hours?: number; color_tag?: string; tags?: string[]
}
type Plan = {
    id: string; name: string; syllabus_id: string; pricing_type: string
    price: number; validity_days: number; features: any; is_active: boolean
    description?: string; trial_days?: number; subscribers_count?: number; total_revenue?: number
    syllabus_nodes?: { name: string; type: string }
}
type Distribution = {
    id: string; tenant_id: string; master_syllabus_id: string
    is_active: boolean; created_at: string; expires_at?: string
    access_level?: string; notes?: string; features?: Record<string, boolean>
    tenants?: { name: string }; syllabus_nodes?: { name: string }
}
type Tenant = { id: string; name: string }
type AIConfig = { id: string; parameter: string; value: any; updated_at: string }
type ActivityEntry = { id: string; action: string; actor_email: string; changes: any; created_at: string; node_id?: string }

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const NODE_TYPES: { value: NodeType; label: string; color: string; bg: string; icon: any }[] = [
    { value: 'category', label: 'Curriculum Type', color: '#6366F1', bg: '#F5F3FF', icon: FolderOpen },
    { value: 'board', label: 'Board / Exam', color: '#004B93', bg: '#EFE9FF', icon: BookOpen },
    { value: 'class', label: 'Class / Level', color: '#0EA5E9', bg: '#E0F2FE', icon: Layers },
    { value: 'subject', label: 'Subject', color: '#10B981', bg: '#ECFDF5', icon: Tag },
    { value: 'chapter', label: 'Chapter', color: '#F59E0B', bg: '#FFF3CD', icon: FileSpreadsheet },
    { value: 'topic', label: 'Topic', color: '#EF4444', bg: '#FEF2F2', icon: CheckCircle2 },
]
const getNodeMeta = (type: NodeType) => NODE_TYPES.find(n => n.value === type) ?? NODE_TYPES[0]
const NEXT_TYPES: Record<NodeType, NodeType> = {
    category: 'board', board: 'class', class: 'subject', subject: 'chapter', chapter: 'topic', topic: 'topic'
}
const VALID_CHILD_TYPES: Record<NodeType, NodeType | null> = {
    category: 'board', board: 'class', class: 'subject', subject: 'chapter', chapter: 'topic', topic: null
}
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', 'mixed']
const BOARD_GROUPS = [
    { label: 'School Syllabus', cat: 'School Syllabus', items: ['CBSE', 'ICSE', 'IB Board', 'NIOS Board', 'Gujarat Board (English Medium)', 'Gujarat Board (Gujarati Medium)', 'State Board', 'Olympiad'] },
    { label: 'Entrance Exams', cat: 'Entrance Exam', items: ['JEE Main', 'JEE Advanced', 'NEET', 'CUET', 'CLAT', 'CAT', 'IPMAT/JIPMAT', 'NID Entrance Exam', 'NATA'] },
    { label: 'Competitive Exams', cat: 'Competitive Exam', items: ['UPSC Civil Services', 'SSC CGL', 'SSC CHSL', 'SBI PO & Clerk', 'IBPS PO & Clerk', 'RBI Grade B & Assistant', 'RRB NTPC', 'NDA', 'CDS', 'GATE', 'UPPSC/MPSC/TNPSC'] }
]
const ALL_BOARDS = BOARD_GROUPS.flatMap(g => g.items)

// ── CSS HELPERS ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10,
    fontSize: 13, color: '#1B1D21', outline: 'none', boxSizing: 'border-box',
    background: '#fff', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s'
}
const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: '#004B93', color: '#fff', border: 'none', borderRadius: 10,
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
}
const btnSecondary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
    background: '#fff', color: '#1B1D21', border: '1px solid #E8E8E8', borderRadius: 10,
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
}
const iconBtnStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#6B7280', transition: 'all 0.15s', flexShrink: 0
}

// ── TOAST ──────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 12,
            background: ok ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${ok ? '#22C55E30' : '#EF444430'}`,
            borderRadius: 16, padding: '14px 18px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)', maxWidth: 420,
            animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)'
        }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: ok ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ok ? <Check size={18} color="#fff" /> : <AlertCircle size={18} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1B1D21' }}>{ok ? 'Success' : 'Attention'}</div>
                <div style={{ fontSize: 12, color: ok ? '#166534' : '#991B1B', marginTop: 1, lineHeight: 1.4 }}>{msg}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A5A2A6', padding: 2 }}><X size={14} /></button>
        </div>
    )
}

// ── MODAL ──────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSubmit, loading, children, saveLabel = 'Save', cancelLabel = 'Cancel', hideSave, maxWidth = 520 }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.22)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#1B1D21' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F7F8FA', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#A5A2A6" /></button>
                </div>
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={onClose} style={btnSecondary}>{cancelLabel}</button>
                    {!hideSave && <button onClick={onSubmit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                        {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />} {saveLabel}
                    </button>}
                </div>
            </div>
        </div>
    )
}

function Field({ label, children, hint, required }: any) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            {children}
            {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
        </div>
    )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = '#004B93', bg = '#EFE9FF', sub }: any) {
    return (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0F0F0', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#A5A2A6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 950, color: '#1B1D21', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                {sub && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
            </div>
        </div>
    )
}

// ── TAB BAR ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: any; count?: number }[]; active: string; onChange: (id: string) => void }) {
    return (
        <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 12, padding: 4 }}>
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => onChange(tab.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9,
                    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif',
                    background: active === tab.id ? '#fff' : 'transparent',
                    color: active === tab.id ? '#004B93' : '#6B7280',
                    boxShadow: active === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s', whiteSpace: 'nowrap'
                }}>
                    <tab.icon size={14} />
                    {tab.label}
                    {tab.count !== undefined && <span style={{ background: active === tab.id ? '#004B9315' : '#E5E7EB', color: active === tab.id ? '#004B93' : '#6B7280', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 10 }}>{tab.count}</span>}
                </button>
            ))}
        </div>
    )
}

// ── TREE NODE ─────────────────────────────────────────────────────────────────
function TreeNode({ node, nodes, plans, onEdit, onDelete, onAddChild, onToggle, onSelect, selectedIds, level = 0 }: any) {
    const [expanded, setExpanded] = useState(false)
    const [inlineEdit, setInlineEdit] = useState(false)
    const [inlineName, setInlineName] = useState(node.name)
    const children = nodes.filter((n: SyllabusNode) => n.parent_id === node.id)
    const meta = getNodeMeta(node.type)
    const isLinkedToPlan = plans.some((p: Plan) => p.syllabus_id === node.id)
    const isSelected = selectedIds?.includes(node.id)
    const hasChildren = children.length > 0
    const canAddChild = VALID_CHILD_TYPES[node.type as NodeType] !== null

    return (
        <div style={{ marginLeft: level > 0 ? 28 : 0, position: 'relative' }}>
            {level > 0 && <div style={{ position: 'absolute', left: -16, top: 0, bottom: hasChildren && expanded ? 0 : '14px', width: 14, borderLeft: '1.5px solid #E5E7EB', borderBottom: '1.5px solid #E5E7EB', borderBottomLeftRadius: 8 }} />}
            <div
                onClick={() => onSelect(node)}
                className="tree-node-row"
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 12, marginBottom: 4, cursor: 'pointer',
                    background: isSelected ? `${meta.color}10` : level === 0 ? '#FAFAFA' : '#fff',
                    border: isSelected ? `1.5px solid ${meta.color}40` : '1px solid transparent',
                    opacity: node.is_active ? 1 : 0.55,
                    transition: 'all 0.15s',
                }}
            >
                {/* Multi-select checkbox */}
                <div onClick={e => { e.stopPropagation() }} style={{ flexShrink: 0 }}>
                    <div
                        onClick={e => { e.stopPropagation(); onSelect(node, true) }}
                        style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? meta.color : '#D1D5DB'}`, background: isSelected ? meta.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                        {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={e => { e.stopPropagation(); if (hasChildren) setExpanded(ex => !ex) }}
                    style={{ ...iconBtnStyle, width: 20, height: 20, border: hasChildren ? '1px solid #E5E7EB' : 'none', background: hasChildren ? '#fff' : 'transparent', borderRadius: 5, flexShrink: 0 }}
                >
                    {hasChildren ? (expanded ? <ChevronDown size={10} strokeWidth={3} /> : <ChevronRight size={10} strokeWidth={3} />) : <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#D1D5DB' }} />}
                </button>

                {/* Type icon */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <meta.icon size={13} color={meta.color} />
                </div>

                {/* Name (inline edit on double-click) */}
                {inlineEdit ? (
                    <input
                        autoFocus
                        value={inlineName}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setInlineName(e.target.value)}
                        onBlur={() => { setInlineEdit(false); if (inlineName !== node.name) onEdit(node, inlineName) }}
                        onKeyDown={e => { if (e.key === 'Enter') { setInlineEdit(false); if (inlineName !== node.name) onEdit(node, inlineName) } if (e.key === 'Escape') { setInlineName(node.name); setInlineEdit(false) } }}
                        style={{ ...inputStyle, padding: '2px 8px', fontSize: 13, flex: 1, height: 24, borderRadius: 6 }}
                    />
                ) : (
                    <span
                        onDoubleClick={e => { e.stopPropagation(); setInlineEdit(true) }}
                        style={{ fontSize: 13, fontWeight: 700, color: '#1B1D21', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={node.name}
                    >
                        {node.name}
                    </span>
                )}

                {/* Indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isLinkedToPlan && <div title="Linked to Marketplace Plan" style={{ background: '#004B9315', padding: '2px 6px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <ShoppingBag size={9} color="#004B93" /><span style={{ fontSize: 8, fontWeight: 900, color: '#004B93', textTransform: 'uppercase' }}>Plan</span>
                    </div>}
                    {node.metadata?.ai_generated && <span title="AI Generated"><Sparkles size={11} color="#F0A026" /></span>}
                    {!node.is_active && <span style={{ fontSize: 8, background: '#FEF2F2', color: '#EF4444', padding: '1px 5px', borderRadius: 10, fontWeight: 800 }}>OFF</span>}
                    {hasChildren && <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{children.length}</span>}
                </div>

                {/* Action buttons (hover reveal) */}
                <div className="node-actions" style={{ display: 'flex', gap: 3, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                    {canAddChild && <button onClick={e => { e.stopPropagation(); onAddChild(node) }} title="Add child" style={iconBtnStyle}><Plus size={12} /></button>}
                    <button onClick={e => { e.stopPropagation(); onEdit(node) }} title="Edit" style={iconBtnStyle}><Edit3 size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); onToggle(node) }} title={node.is_active ? 'Deactivate' : 'Activate'} style={iconBtnStyle}>{node.is_active ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                    <button onClick={e => { e.stopPropagation(); onDelete(node) }} title="Delete" style={{ ...iconBtnStyle, color: '#EF4444' }}><Trash2 size={12} /></button>
                </div>
            </div>

            {expanded && hasChildren && (
                <div style={{ marginTop: 0 }}>
                    {children
                        .sort((a: SyllabusNode, b: SyllabusNode) => a.order_index - b.order_index || a.name.localeCompare(b.name))
                        .map((child: SyllabusNode) => (
                            <TreeNode key={child.id} node={child} nodes={nodes} plans={plans} level={level + 1}
                                onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onToggle={onToggle}
                                onSelect={onSelect} selectedIds={selectedIds} />
                        ))}
                </div>
            )}
        </div>
    )
}

// ── NODE INSPECTOR (RIGHT PANEL) ───────────────────────────────────────────────
function NodeInspector({ nodeId, nodes, plans, distributions, onClose, apiCall, showToast, saving }: any) {
    const [detail, setDetail] = useState<any>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [inspectorTab, setInspectorTab] = useState('overview')
    const [editForm, setEditForm] = useState<any>({})
    const [tagInput, setTagInput] = useState('')
    const [newConceptTag, setNewConceptTag] = useState('')

    const node = nodes.find((n: SyllabusNode) => n.id === nodeId)
    const meta = node ? getNodeMeta(node.type) : null

    const fetchDetail = useCallback(async () => {
        if (!nodeId) return
        setDetailLoading(true)
        try {
            const res = await fetch('/api/owner/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'GET_NODE_DETAIL', payload: { id: nodeId } })
            })
            const data = await res.json()
            if (res.ok) {
                setDetail(data)
                setEditForm({
                    name: data.node.name,
                    description: data.node.description || '',
                    difficulty_level: data.node.difficulty_level || 'medium',
                    exam_weightage: data.node.exam_weightage || 0,
                    estimated_hours: data.node.estimated_hours || '',
                    color_tag: data.node.color_tag || '',
                    tags: (data.node.tags || []).join(', '),
                })
            }
        } catch { } finally { setDetailLoading(false) }
    }, [nodeId])

    useEffect(() => { fetchDetail() }, [fetchDetail])

    const handleSaveMeta = async () => {
        const result = await apiCall('UPDATE_NODE', {
            id: nodeId,
            name: editForm.name,
            description: editForm.description,
            difficulty_level: editForm.difficulty_level,
            exam_weightage: parseFloat(editForm.exam_weightage) || 0,
            estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : null,
            color_tag: editForm.color_tag,
            tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        })
        if (result) { showToast('Node updated', true); fetchDetail() }
    }

    const handleAddConceptTag = async () => {
        if (!newConceptTag.trim()) return
        await apiCall('ADD_TAG', { topic_id: nodeId, tag: newConceptTag.trim(), weightage: 1.0 })
        setNewConceptTag('')
        fetchDetail()
    }

    const handleRemoveConceptTag = async (tagId: string) => {
        await apiCall('DELETE_TAG', { id: tagId })
        fetchDetail()
    }

    if (!node || !meta) return null

    const INSPECTOR_TABS = [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'metadata', label: 'Metadata', icon: Settings },
        { id: 'tags', label: 'Concept Tags', icon: Tag },
        { id: 'history', label: 'History', icon: Clock },
    ]

    return (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E8E8', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Inspector Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <meta.icon size={16} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#1B1D21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</div>
                </div>
                <button onClick={onClose} style={{ ...iconBtnStyle, flexShrink: 0 }}><X size={14} /></button>
            </div>

            {/* Inspector Tabs */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {INSPECTOR_TABS.map(t => (
                    <button key={t.id} onClick={() => setInspectorTab(t.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        background: inspectorTab === t.id ? '#004B9310' : 'transparent', color: inspectorTab === t.id ? '#004B93' : '#9CA3AF'
                    }}>
                        <t.icon size={11} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Inspector Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {detailLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} color="#004B93" style={{ animation: 'spin 1s linear infinite' }} /></div>}

                {!detailLoading && detail && inspectorTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Quick Stats</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {[
                                    { label: 'Children', value: detail.childrenCount },
                                    { label: 'Questions', value: detail.questionCount ?? 0 },
                                    { label: 'Version', value: `v${detail.node.version || 1}` },
                                    { label: 'Plans', value: detail.linkedPlans?.length || 0 },
                                ].map(s => (
                                    <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #F0F0F0' }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: '#1B1D21' }}>{s.value}</div>
                                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {detail.node.description && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{detail.node.description}</p>
                            </div>
                        )}
                        {detail.linkedPlans?.length > 0 && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Linked Plans</div>
                                {detail.linkedPlans.map((p: any) => (
                                    <div key={p.id} style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 8, padding: '8px 12px', marginBottom: 4, fontSize: 12, fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ShoppingBag size={11} /> {p.name} — ₹{p.price?.toLocaleString()}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { }} style={{ ...btnSecondary, flex: 1, fontSize: 12, justifyContent: 'center' }}>
                                <Tag size={12} /> View Questions
                            </button>
                            <button onClick={handleSaveMeta} disabled={saving} style={{ ...btnPrimary, flex: 1, fontSize: 12, justifyContent: 'center', background: '#004B93' }}>
                                {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} Save
                            </button>
                        </div>
                    </div>
                )}

                {!detailLoading && inspectorTab === 'metadata' && (
                    <div>
                        <Field label="Name" required>
                            <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                        </Field>
                        <Field label="Description">
                            <textarea value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Topic description or learning objective..." />
                        </Field>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Field label="Difficulty">
                                <select value={editForm.difficulty_level || 'medium'} onChange={e => setEditForm({ ...editForm, difficulty_level: e.target.value })} style={inputStyle}>
                                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                            </Field>
                            <Field label="Exam Weightage %">
                                <input type="number" min="0" max="100" value={editForm.exam_weightage || ''} onChange={e => setEditForm({ ...editForm, exam_weightage: e.target.value })} style={inputStyle} placeholder="0" />
                            </Field>
                        </div>
                        <Field label="Estimated Hours">
                            <input type="number" min="0" step="0.5" value={editForm.estimated_hours || ''} onChange={e => setEditForm({ ...editForm, estimated_hours: e.target.value })} style={inputStyle} placeholder="e.g. 2.5" />
                        </Field>
                        <Field label="Tags (comma-separated)">
                            <input value={editForm.tags || ''} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} style={inputStyle} placeholder="algebra, equations, linear..." />
                        </Field>
                        <button onClick={handleSaveMeta} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save Metadata
                        </button>
                    </div>
                )}

                {!detailLoading && detail && inspectorTab === 'tags' && (
                    <div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                            Concept tags are used by the AI engine to automatically map questions to this topic.
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input value={newConceptTag} onChange={e => setNewConceptTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddConceptTag()} style={{ ...inputStyle, flex: 1 }} placeholder="Add concept tag..." />
                            <button onClick={handleAddConceptTag} style={{ ...btnPrimary, flexShrink: 0, padding: '10px 14px' }}><Plus size={14} /></button>
                        </div>
                        {detail.conceptTags?.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '20px 0' }}>No concept tags yet</div>}
                        {detail.conceptTags?.map((tag: any) => (
                            <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                                <Tag size={12} color="#6366F1" />
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1B1D21' }}>{tag.tag}</span>
                                <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700 }}>w: {tag.weightage}</span>
                                <button onClick={() => handleRemoveConceptTag(tag.id)} style={{ ...iconBtnStyle, color: '#EF4444', width: 22, height: 22 }}><X size={10} /></button>
                            </div>
                        ))}
                    </div>
                )}

                {!detailLoading && detail && inspectorTab === 'history' && (
                    <div>
                        {detail.versions?.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '20px 0' }}>No version history yet</div>}
                        {detail.versions?.map((v: any) => (
                            <div key={v.id} style={{ borderLeft: '2px solid #E5E7EB', paddingLeft: 14, marginBottom: 16, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -5, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#6366F1' }} />
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B1D21' }}>Version {v.version}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{v.changes?.updated_by || 'System'} · {new Date(v.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── BULK ACTION BAR ────────────────────────────────────────────────────────────
function BulkActionBar({ selectedIds, onDeactivate, onActivate, onDelete, onClear, saving }: any) {
    if (selectedIds.length === 0) return null
    return (
        <div style={{
            position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 100,
            background: '#1B1D21', color: '#fff', borderRadius: 14, padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease'
        }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#004B93', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckSquare size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{selectedIds.length} node{selectedIds.length > 1 ? 's' : ''} selected</span>
            <button onClick={onActivate} disabled={saving} style={{ ...btnSecondary, background: '#10B98120', border: 'none', color: '#10B981', fontSize: 12, padding: '7px 14px' }}>
                <Eye size={12} /> Activate All
            </button>
            <button onClick={onDeactivate} disabled={saving} style={{ ...btnSecondary, background: '#F59E0B20', border: 'none', color: '#F59E0B', fontSize: 12, padding: '7px 14px' }}>
                <EyeOff size={12} /> Deactivate All
            </button>
            <button onClick={onDelete} disabled={saving} style={{ ...btnSecondary, background: '#EF444420', border: 'none', color: '#EF4444', fontSize: 12, padding: '7px 14px' }}>
                <Trash2 size={12} /> Delete Selected
            </button>
            <button onClick={onClear} style={{ ...iconBtnStyle, background: '#ffffff20', border: 'none', color: '#fff' }}><X size={14} /></button>
        </div>
    )
}

// ── AI GENERATE MODAL (with SSE streaming) ────────────────────────────────────
function AIGenerateModal({ onClose, onDone, showToast }: { onClose: () => void; onDone: () => void; showToast: (m: string, ok: boolean) => void }) {
    const [step, setStep] = useState<'config' | 'generating' | 'preview' | 'saving' | 'done'>('config')
    const [selectedBoard, setSelectedBoard] = useState(ALL_BOARDS[0])
    const [deepGen, setDeepGen] = useState(false)
    const [previewTree, setPreviewTree] = useState<any>(null)
    const [categoryName, setCategoryName] = useState('')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')
    const [warning, setWarning] = useState('')
    const [progress, setProgress] = useState<string[]>([])
    const progressEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => { if (step === 'done') { const t = setTimeout(onDone, 4500); return () => clearTimeout(t) } }, [step, onDone])
    useEffect(() => { progressEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [progress])

    const handleGenerate = async () => {
        setStep('generating')
        setError('')
        setWarning('')
        setProgress([])
        try {
            const catMap: Record<string, string[]> = {
                'School Syllabus': BOARD_GROUPS[0].items,
                'Entrance Exam': BOARD_GROUPS[1].items,
                'Competitive Exam': BOARD_GROUPS[2].items,
            }
            const cat = Object.keys(catMap).find(c => catMap[c].includes(selectedBoard)) || 'Syllabus'
            setCategoryName(cat)

            setProgress(p => [...p, `🤖 Contacting Gemini AI for ${selectedBoard}...`])

            // No client-side timeout cap — allow deep generation and saving to take as long as needed
            const res = await fetch('/api/owner/syllabus/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'preview', boardName: selectedBoard, deepGen }),
            })

            const resText = await res.text()
            let json: any = {}
            try {
                json = JSON.parse(resText)
            } catch {
                if (res.status === 504) throw new Error('Request timed out on the server. Try again or check network connection.')
                throw new Error(`Server error (${res.status}): Invalid response`)
            }
            if (!res.ok) throw new Error(json.error || `Generation failed (${res.status})`)

            const classCount = json.tree?.length || 0
            setProgress(p => [...p,
                `✅ Curriculum generated successfully`,
                `📋 ${classCount} classes ready for review`
            ])
            if (json.fallback) setProgress(p => [...p, `📚 Loaded verified curriculum template (AI unavailable)`])
            setPreviewTree(json.tree)
            if (json.warning) setWarning(json.warning)
            setStep('preview')
        } catch (e: any) {
            const msg = e.message || 'Generation failed'
            setError(msg)
            setStep('config')
            showToast(msg, false)
        }
    }

    const handleSave = async () => {
        setStep('saving')
        setError('')
        try {
            const res = await fetch('/api/owner/syllabus/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', boardName: selectedBoard, category: categoryName, tree: previewTree }),
            })
            const resText = await res.text()
            let json: any = {}
            try { json = JSON.parse(resText) } catch { throw new Error(`Server error (${res.status})`) }
            if (!res.ok) throw new Error(json.error || `Save failed (${res.status})`)
            setResult(json)
            setStep('done')
        } catch (e: any) {
            const msg = e.message || 'Save failed'
            setError(msg)
            setStep('preview')
            showToast(msg, false)
        }
    }

    const stepLabel = step === 'config' ? 'Generate & Preview' : step === 'preview' ? 'Confirm & Save' : 'Done'

    return (
        <Modal
            title="Auto-Generate Syllabus with AI"
            onClose={step === 'done' ? onDone : onClose}
            onSubmit={step === 'config' ? handleGenerate : step === 'preview' ? handleSave : onDone}
            loading={step === 'generating' || step === 'saving'}
            hideSave={step === 'done'}
            saveLabel={stepLabel}
            cancelLabel={step === 'done' ? 'Close' : 'Cancel'}
        >
            {step === 'config' && (
                <div>
                    <div style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', gap: 12 }}>
                        <Sparkles size={20} color="#6366F1" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: 13, color: '#5B21B6', lineHeight: 1.6 }}>
                            Gemini AI will generate a complete curriculum: <strong>Board → Class → Subject → Chapter → Topic</strong>. An examination agent will validate it for uniqueness before you approve.
                        </div>
                    </div>
                    <Field label="Select Board / Exam" required>
                        <select value={selectedBoard} onChange={e => setSelectedBoard(e.target.value)} style={inputStyle}>
                            {BOARD_GROUPS.map(g => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.items.map(b => <option key={b} value={b}>{b}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </Field>
                    <div style={{ padding: 14, background: '#F9FAFB', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #F0F0F0' }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B1D21' }}>AI Deep Generation</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Gemini creates distinct subjects and topics per class level (slower, more detailed)</div>
                        </div>
                        <button onClick={() => setDeepGen(!deepGen)} style={{ width: 44, height: 24, borderRadius: 12, background: deepGen ? '#10B981' : '#E5E7EB', border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 2, left: deepGen ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                        </button>
                    </div>
                    {error && <div style={{ marginTop: 14, color: '#EF4444', fontSize: 13, background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, fontWeight: 600 }}>⚠️ {error}</div>}
                </div>
            )}

            {step === 'generating' && (
                <div style={{ padding: '20px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
                            <Loader2 size={72} color="#6366F1" style={{ animation: 'spin 2s linear infinite', opacity: 0.15 }} />
                            <Sparkles size={28} color="#6366F1" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#1B1D21' }}>Generating & Examining</div>
                        <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Gemini is drafting and validating the curriculum. Please wait…</div>
                    </div>
                    <div style={{ background: '#1B1D21', borderRadius: 12, padding: 16, maxHeight: 180, overflowY: 'auto', fontFamily: 'monospace' }}>
                        {progress.map((line, i) => <div key={i} style={{ fontSize: 12, color: i === progress.length - 1 ? '#10B981' : '#9CA3AF', marginBottom: 4 }}>{line}</div>)}
                        <div ref={progressEndRef} />
                    </div>
                </div>
            )}

            {step === 'preview' && (
                <div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'inline-flex', padding: '6px 14px', background: '#F0FDF4', color: '#10B981', borderRadius: 20, fontSize: 12, fontWeight: 800, gap: 6, alignItems: 'center' }}>
                            <Check size={13} /> Structure Ready to Save
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, margin: '10px 0 4px', color: '#1B1D21' }}>Review Generated Curriculum</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Verify before saving to the database.</div>
                    </div>
                    {warning && <div style={{ marginBottom: 14, color: '#D97706', fontSize: 12, background: '#FFFBEB', border: '1px solid #FCD34D', padding: '10px 14px', borderRadius: 10 }}>💡 {warning}</div>}
                    <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, maxHeight: 340, overflowY: 'auto', border: '1px solid #F0F0F0', fontSize: 13 }}>
                        {previewTree?.map((c: any, i: number) => (
                            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <strong style={{ color: '#0EA5E9', fontSize: 14 }}>{c.class}</strong>
                                    <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700 }}>{c.subjects?.length || 0} subjects · {c.subjects?.reduce((acc: number, s: any) => acc + (s.chapters?.length || 0), 0) || 0} chapters</span>
                                </div>
                                <div style={{ marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {c.subjects?.map((s: any, j: number) => (
                                        <details key={j} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px' }}>
                                            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{s.name}</span>
                                                <span style={{ fontSize: 10, background: '#ECFDF5', color: '#10B981', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>{s.chapters?.length || 0} Chapters</span>
                                            </summary>
                                            <ol style={{ margin: '6px 0 2px 18px', padding: 0, fontSize: 11, color: '#4B5563', lineHeight: 1.5 }}>
                                                {s.chapters?.map((chap: any, k: number) => (
                                                    <li key={k}>
                                                        <strong>{chap.name}</strong> <span style={{ color: '#9CA3AF' }}>({chap.topics?.length || 0} topics)</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {error && <div style={{ marginTop: 10, color: '#EF4444', fontSize: 12, fontWeight: 600 }}>⚠️ {error}</div>}
                </div>
            )}

            {step === 'saving' && (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <Loader2 size={48} color="#004B93" style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
                    <div style={{ fontSize: 16, fontWeight: 800 }}>Saving to database…</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Building full hierarchy. This may take a moment.</div>
                </div>
            )}

            {step === 'done' && result && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle2 size={32} color="#10B981" />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Syllabus Saved!</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>{result.message}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        {[
                            { label: 'Classes', v: result.created?.classes || 0 },
                            { label: 'Subjects', v: result.created?.subjects || 0 },
                            { label: 'Chapters', v: result.created?.chapters || 0 },
                            { label: 'Topics', v: result.created?.topics || 0 },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                                <div style={{ fontSize: 22, fontWeight: 950, color: '#1B1D21' }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    )
}

// ── UPLOAD MODAL (with dry-run) ───────────────────────────────────────────────
function UploadModal({ onClose, onDone, showToast }: { onClose: () => void; onDone: () => void; showToast: (m: string, ok: boolean) => void }) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [step, setStep] = useState<'pick' | 'preview' | 'uploading' | 'done' | 'error'>('pick')
    const [preview, setPreview] = useState<any>(null)
    const [result, setResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [dragging, setDragging] = useState(false)

    const handleFile = (f: File) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) { showToast('Only CSV, XLSX, XLS files allowed', false); return }
        setFile(f)
    }

    const handleDryRun = async () => {
        if (!file) return
        try {
            const fd = new FormData(); fd.append('file', file); fd.append('dryRun', 'true')
            const res = await fetch('/api/owner/syllabus/upload', { method: 'POST', body: fd })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Preview failed')
            setPreview(json.preview)
            setStep('preview')
        } catch (e: any) { showToast(e.message, false) }
    }

    const handleUpload = async () => {
        if (!file) return
        setStep('uploading')
        try {
            const fd = new FormData(); fd.append('file', file)
            const res = await fetch('/api/owner/syllabus/upload', { method: 'POST', body: fd })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Upload failed')
            setResult(json); setStep('done'); onDone()
        } catch (e: any) { setErrorMsg(e.message); setStep('error') }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.22)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileSpreadsheet size={20} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#1B1D21' }}>Bulk Upload via CSV / Excel</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Upload a spreadsheet to import the entire hierarchy at once</div>
                    </div>
                    <button onClick={onClose} style={{ background: '#F7F8FA', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#A5A2A6" /></button>
                </div>
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                    {step === 'done' && result ? (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <CheckCircle2 size={52} color="#10B981" style={{ marginBottom: 16 }} />
                            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Upload Successful!</div>
                            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>{result.rowsProcessed} rows processed → {result.totalNodesCreated} nodes created</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                                {[
                                    { label: 'Categories', v: result.stats?.categories ?? 0, color: '#6366F1' },
                                    { label: 'Boards', v: result.stats?.boards ?? 0, color: '#004B93' },
                                    { label: 'Classes', v: result.stats?.classes ?? 0, color: '#0EA5E9' },
                                    { label: 'Subjects', v: result.stats?.subjects ?? 0, color: '#10B981' },
                                    { label: 'Topics', v: result.stats?.topics ?? 0, color: '#EF4444' },
                                ].map(s => <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.v}</div>
                                    <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                                </div>)}
                            </div>
                            <button onClick={onClose} style={{ ...btnPrimary, justifyContent: 'center', width: '100%' }}>View Tree</button>
                        </div>
                    ) : step === 'preview' && preview ? (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#1B1D21' }}>Dry Run Preview</div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Review what will be created before importing</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                                {[
                                    { label: 'Categories', v: preview.categories, color: '#6366F1' },
                                    { label: 'Boards', v: preview.boards, color: '#004B93' },
                                    { label: 'Classes', v: preview.classes, color: '#0EA5E9' },
                                    { label: 'Subjects', v: preview.subjects, color: '#10B981' },
                                    { label: 'Chapters', v: preview.chapters, color: '#F59E0B' },
                                    { label: 'Topics', v: preview.topics, color: '#EF4444' },
                                ].map(s => <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.v}</div>
                                    <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                                </div>)}
                            </div>
                            <div style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#065F46', fontWeight: 600 }}>
                                ✅ Total {preview.total_nodes} nodes will be created from {preview.total_rows} rows ({preview.skipped} skipped)
                            </div>
                        </div>
                    ) : step === 'error' ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <XCircle size={52} color="#EF4444" style={{ marginBottom: 16 }} />
                            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Upload Failed</div>
                            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 20 }}>{errorMsg}</p>
                            <button onClick={() => setStep('pick')} style={btnSecondary}>Try Again</button>
                        </div>
                    ) : step === 'uploading' ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Loader2 size={48} color="#10B981" style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
                            <div style={{ fontWeight: 700, fontSize: 15 }}>Processing {file?.name}…</div>
                            <div style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6 }}>Creating nodes and building hierarchy</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Download size={16} color="#10B981" />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Download Sample Template</div>
                                        <div style={{ fontSize: 11, color: '#047857' }}>XLSX with sample data + instructions sheet</div>
                                    </div>
                                </div>
                                <button onClick={() => window.open('/api/owner/syllabus/upload', '_blank')} style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Download</button>
                            </div>
                            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: '#6B7280' }}>
                                <div style={{ fontWeight: 800, color: '#374151', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Info size={11} /> Required Format</div>
                                <code style={{ color: '#004B93' }}>Board</code> | <code style={{ color: '#0EA5E9' }}>Class</code> | <code style={{ color: '#10B981' }}>Subject</code> | <code style={{ color: '#F59E0B' }}>Chapter</code> | <code style={{ color: '#EF4444' }}>Topic</code>
                                <div style={{ marginTop: 6 }}>✓ Known boards (CBSE, JEE etc.) auto-grouped under category · ✓ Duplicates skipped</div>
                            </div>
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
                                onClick={() => fileRef.current?.click()}
                                style={{ border: `2px dashed ${dragging ? '#004B93' : file ? '#10B981' : '#D1D5DB'}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#F5F0FF' : file ? '#F0FDF4' : '#FAFAFA', transition: 'all 0.2s' }}
                            >
                                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                {file ? (
                                    <><FileSpreadsheet size={32} color="#10B981" style={{ marginBottom: 8 }} /><div style={{ fontWeight: 800, fontSize: 14, color: '#065F46' }}>{file.name}</div><div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div></>
                                ) : (
                                    <><Upload size={32} color="#9CA3AF" style={{ marginBottom: 8 }} /><div style={{ fontWeight: 700, fontSize: 14 }}>Drag & drop your file here</div><div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>or click to browse · CSV / XLSX / XLS</div></>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {(step === 'pick' || step === 'preview') && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button onClick={onClose} style={btnSecondary}>Cancel</button>
                        {step === 'pick' && <button onClick={handleDryRun} disabled={!file} style={{ ...btnSecondary, background: file ? '#F0FDF4' : '#F3F4F6', color: file ? '#065F46' : '#9CA3AF', borderColor: file ? '#D1FAE5' : '#F0F0F0' }}>
                            <Eye size={14} /> Preview Import
                        </button>}
                        <button onClick={step === 'preview' ? handleUpload : handleDryRun} disabled={!file} style={{ ...btnPrimary, background: file ? 'linear-gradient(135deg, #10B981, #059669)' : '#E5E7EB', cursor: file ? 'pointer' : 'not-allowed' }}>
                            <Upload size={14} /> {step === 'preview' ? 'Confirm Import' : 'Upload & Import'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── NODE MODAL (Add / Edit) ────────────────────────────────────────────────────
function NodeModal({ nodeModal, nodeForm, setNodeForm, onClose, onSave, onAIGenerate, saving }: any) {
    const isEdit = !!nodeModal.editing
    const hasParent = !!nodeModal.parentNode
    const canAutoGen = hasParent && !isEdit

    return (
        <Modal
            title={isEdit ? `Edit: ${nodeModal.editing.name}` : hasParent ? `Add to "${nodeModal.parentNode.name}"` : 'Add Root Node'}
            onClose={onClose}
            onSubmit={onSave}
            loading={saving}
            saveLabel={isEdit ? 'Update' : 'Add Node'}
        >
            {canAutoGen && (
                <div style={{ marginBottom: 20 }}>
                    <button type="button" onClick={onAIGenerate} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                        <Sparkles size={15} /> Auto-Generate {nodeForm.type}s with AI
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>OR ADD MANUALLY</span>
                        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    </div>
                </div>
            )}
            <Field label="Name" required>
                <input
                    autoFocus
                    value={nodeForm.name}
                    onChange={e => setNodeForm({ ...nodeForm, name: e.target.value })}
                    placeholder={`Enter ${nodeForm.type} name...`}
                    style={inputStyle}
                />
            </Field>
            {!hasParent && !isEdit && (
                <Field label="Node Type">
                    <select value={nodeForm.type} onChange={e => setNodeForm({ ...nodeForm, type: e.target.value })} style={inputStyle}>
                        {NODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </Field>
            )}
            {hasParent && <div style={{ fontSize: 12, color: '#9CA3AF', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8 }}>
                Adding <strong style={{ color: NODE_TYPES.find(t => t.value === nodeForm.type)?.color }}>{nodeForm.type}</strong> under <strong>{nodeModal.parentNode.name}</strong>
            </div>}
        </Modal>
    )
}

// ── PLAN WIZARD (3-step) ──────────────────────────────────────────────────────
function PlanWizard({ planForm, setPlanForm, planModal, onClose, onSave, saving, nodes }: any) {
    const [step, setStep] = useState(1)
    const isEdit = !!planModal.editing
    const rootNodes = nodes.filter((n: SyllabusNode) => ['board', 'category'].includes(n.type))

    return (
        <Modal
            title={isEdit ? 'Edit Plan' : 'Create Revenue Plan'}
            onClose={onClose}
            onSubmit={step < 3 ? () => setStep(s => s + 1) : onSave}
            loading={saving}
            saveLabel={step < 3 ? 'Next →' : isEdit ? 'Update Plan' : 'Create Plan'}
            cancelLabel={step > 1 ? '← Back' : 'Cancel'}
        >
            {/* Steps indicator */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                {['Details', 'Pricing', 'Features'].map((s, i) => (
                    <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i + 1 <= step ? '#004B93' : '#E5E7EB', transition: 'background 0.2s' }} />
                ))}
            </div>

            {step === 1 && (
                <div>
                    <Field label="Plan Name" required>
                        <input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. CBSE Complete Access" style={inputStyle} />
                    </Field>
                    <Field label="Description">
                        <textarea value={planForm.description || ''} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="What's included in this plan..." />
                    </Field>
                    <Field label="Link to Syllabus Node" required>
                        <select value={planForm.syllabus_id} onChange={e => setPlanForm({ ...planForm, syllabus_id: e.target.value })} style={inputStyle}>
                            <option value="">Select a board or exam...</option>
                            {rootNodes.map((n: SyllabusNode) => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
                        </select>
                    </Field>
                </div>
            )}

            {step === 2 && (
                <div>
                    <Field label="Pricing Type">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {['one-time', 'monthly', 'yearly'].map(pt => (
                                <button key={pt} onClick={() => setPlanForm({ ...planForm, pricing_type: pt })} type="button" style={{ padding: '12px', borderRadius: 10, border: `2px solid ${planForm.pricing_type === pt ? '#004B93' : '#E5E7EB'}`, background: planForm.pricing_type === pt ? '#004B9310' : '#fff', color: planForm.pricing_type === pt ? '#004B93' : '#6B7280', fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
                                    {pt}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Price (₹)" required>
                            <input type="number" min="0" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="0" />
                        </Field>
                        <Field label="Validity (Days)">
                            <input type="number" min="1" value={planForm.validity_days} onChange={e => setPlanForm({ ...planForm, validity_days: parseInt(e.target.value) || 365 })} style={inputStyle} />
                        </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Trial Days">
                            <input type="number" min="0" value={planForm.trial_days || 0} onChange={e => setPlanForm({ ...planForm, trial_days: parseInt(e.target.value) || 0 })} style={inputStyle} placeholder="0" />
                        </Field>
                        <Field label="Revenue Tracked (₹)">
                            <input type="number" min="0" value={planForm.total_revenue || 0} onChange={e => setPlanForm({ ...planForm, total_revenue: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="0" />
                        </Field>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Toggle the modules included in this plan:</div>
                    {[
                        { key: 'ai_mapping', label: 'AI Question Mapping', desc: 'Auto-map questions to syllabus topics', icon: BrainCircuit },
                        { key: 'adaptive_learning', label: 'Adaptive Learning', desc: 'Personalized study paths', icon: Target },
                        { key: 'board_comparison', label: 'Board Comparison', desc: 'Compare coverage across boards', icon: BarChart2 },
                        { key: 'proctoring', label: 'Proctoring', desc: 'AI-powered exam monitoring', icon: ShieldCheck },
                        { key: 'certification', label: 'Certification', desc: 'Issue completion certificates', icon: Award },
                        { key: 'analytics', label: 'Analytics Dashboard', desc: 'Full progress analytics', icon: BarChart2 },
                    ].map(f => (
                        <div key={f.key} onClick={() => setPlanForm({ ...planForm, features: { ...planForm.features, [f.key]: !planForm.features?.[f.key] } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${planForm.features?.[f.key] ? '#004B93' : '#E5E7EB'}`, background: planForm.features?.[f.key] ? '#004B9308' : '#FAFAFA', cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: planForm.features?.[f.key] ? '#004B9315' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <f.icon size={15} color={planForm.features?.[f.key] ? '#004B93' : '#9CA3AF'} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: planForm.features?.[f.key] ? '#004B93' : '#1B1D21' }}>{f.label}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{f.desc}</div>
                            </div>
                            <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${planForm.features?.[f.key] ? '#004B93' : '#D1D5DB'}`, background: planForm.features?.[f.key] ? '#004B93' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {planForm.features?.[f.key] && <Check size={11} color="#fff" strokeWidth={3} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}

// ── DISTRIBUTE WIZARD (3-step) ────────────────────────────────────────────────
function DistributeWizard({ distForm, setDistForm, onClose, onSave, saving, nodes, tenants }: any) {
    const [step, setStep] = useState(1)
    const boardNodes = nodes.filter((n: SyllabusNode) => ['board', 'category'].includes(n.type))

    return (
        <Modal
            title="Deploy Syllabus to Tenant"
            onClose={onClose}
            onSubmit={step < 3 ? () => setStep(s => s + 1) : onSave}
            loading={saving}
            saveLabel={step < 3 ? 'Next →' : 'Deploy'}
            cancelLabel={step > 1 ? '← Back' : 'Cancel'}
        >
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                {['Syllabus', 'Tenant', 'Configuration'].map((s, i) => (
                    <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i + 1 <= step ? '#004B93' : '#E5E7EB', transition: 'background 0.2s' }} />
                ))}
            </div>

            {step === 1 && (
                <div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Select the syllabus board or exam to deploy:</div>
                    <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {boardNodes.map((n: SyllabusNode) => {
                            const meta = getNodeMeta(n.type)
                            return (
                                <div key={n.id} onClick={() => setDistForm({ ...distForm, syllabus_id: n.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${distForm.syllabus_id === n.id ? meta.color : '#E5E7EB'}`, background: distForm.syllabus_id === n.id ? `${meta.color}08` : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <meta.icon size={14} color={meta.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B1D21' }}>{n.name}</div>
                                        <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>{meta.label}</div>
                                    </div>
                                    {distForm.syllabus_id === n.id && <Check size={16} color={meta.color} style={{ marginLeft: 'auto' }} />}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Select the tenant to deploy to:</div>
                    <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {tenants.map((t: Tenant) => (
                            <div key={t.id} onClick={() => setDistForm({ ...distForm, tenant_id: t.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${distForm.tenant_id === t.id ? '#004B93' : '#E5E7EB'}`, background: distForm.tenant_id === t.id ? '#004B9308' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EFE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <User size={14} color="#004B93" />
                                </div>
                                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1B1D21' }}>{t.name}</div>
                                {distForm.tenant_id === t.id && <Check size={16} color="#004B93" />}
                            </div>
                        ))}
                        {tenants.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '30px 0', fontSize: 13 }}>No active tenants found</div>}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <Field label="Access Level">
                            <select value={distForm.access_level || 'full'} onChange={e => setDistForm({ ...distForm, access_level: e.target.value })} style={inputStyle}>
                                <option value="full">Full Access</option>
                                <option value="read">Read Only</option>
                                <option value="limited">Limited</option>
                            </select>
                        </Field>
                        <Field label="Expires On">
                            <input type="date" value={distForm.expires_at || ''} onChange={e => setDistForm({ ...distForm, expires_at: e.target.value })} style={inputStyle} />
                        </Field>
                    </div>
                    <Field label="Notes">
                        <textarea value={distForm.notes || ''} onChange={e => setDistForm({ ...distForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Any notes for this deployment..." />
                    </Field>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 10 }}>Include Features:</div>
                    {[
                        { key: 'adaptive', label: 'Adaptive Learning' },
                        { key: 'ai_help', label: 'AI Assistance' },
                        { key: 'analytics', label: 'Analytics' },
                    ].map(f => (
                        <div key={f.key} onClick={() => setDistForm({ ...distForm, features: { ...distForm.features, [f.key]: !distForm.features?.[f.key] } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#F9FAFB', cursor: 'pointer', marginBottom: 6 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${distForm.features?.[f.key] ? '#004B93' : '#D1D5DB'}`, background: distForm.features?.[f.key] ? '#004B93' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {distForm.features?.[f.key] && <Check size={10} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}

// ── ANALYTICS PANEL ────────────────────────────────────────────────────────────
function AnalyticsPanel({ stats, plans, distributions, nodes }: any) {
    const totalRevenue = plans.reduce((s: number, p: Plan) => s + (p.total_revenue || 0), 0)
    const activePlanCount = plans.filter((p: Plan) => p.is_active !== false).length
    const topicCount = stats.nodesByType?.topic ?? 0
    const topicCoverage = topicCount > 0 ? Math.round((Math.min(stats.totalQuestions, topicCount) / topicCount) * 100) : 0
    const activeDistributions = distributions.filter((d: Distribution) => d.is_active).length

    const kpis = [
        { label: 'Total Nodes', value: (stats.totalNodes ?? 0).toLocaleString(), icon: BookOpen, color: '#6366F1', bg: '#F5F3FF' },
        { label: 'Topic Coverage', value: `${topicCoverage}%`, icon: Target, color: '#10B981', bg: '#F0FDF4', sub: `${topicCount} topics` },
        { label: 'Questions Linked', value: (stats.totalQuestions ?? 0).toLocaleString(), icon: Tag, color: '#F59E0B', bg: '#FFFBEB' },
        { label: 'Revenue Tracked', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#004B93', bg: '#EFE9FF' },
        { label: 'Active Plans', value: activePlanCount, icon: ShoppingBag, color: '#EC4899', bg: '#FDF2F8' },
        { label: 'Tenant Adoption', value: `${stats.adoptionRate ?? 0}%`, icon: Globe, color: '#0EA5E9', bg: '#F0F9FF', sub: `${activeDistributions} deployments` },
    ]

    return (
        <div style={{ animation: 'slideUp 0.3s' }}>
            <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#1B1D21' }}>Syllabus Intelligence</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Live metrics from your academic infrastructure.</div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                {kpis.map(k => <StatCard key={k.label} {...k} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                {/* Architecture Density */}
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E8E8', padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#1B1D21' }}>Architecture Density</div>
                        <div style={{ padding: '3px 10px', background: '#F0FDF4', borderRadius: 8, fontSize: 10, fontWeight: 700, color: '#10B981' }}>LIVE</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {NODE_TYPES.map(t => {
                            const count = stats.nodesByType?.[t.value] ?? 0
                            const pct = stats.totalNodes ? Math.round((count / stats.totalNodes) * 100) : 0
                            return (
                                <div key={t.value}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5563' }}>{t.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 900, color: '#1B1D21' }}>{count.toLocaleString()}</span>
                                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>({pct}%)</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3 }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: t.color, borderRadius: 3, transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Revenue Panel */}
                    <div style={{ background: 'linear-gradient(135deg, #004B93, #1E3A8A)', borderRadius: 20, padding: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                        <TrendingUp size={80} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tracked Revenue</div>
                        <div style={{ fontSize: 32, fontWeight: 950, margin: '8px 0', letterSpacing: '-0.03em' }}>₹{totalRevenue.toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{activePlanCount} active plan{activePlanCount !== 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 11, marginTop: 6, color: '#10B981', fontWeight: 600 }}>💡 Update revenue per plan in Marketplace tab</div>
                    </div>

                    {/* Marketplace velocity */}
                    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8E8E8', padding: 24, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, color: '#1B1D21' }}>Marketplace Breakdown</div>
                        {plans.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '20px 0' }}>No plans created yet</div>}
                        {plans.slice(0, 4).map((p: Plan) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1B1D21' }}>{p.name}</div>
                                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{p.is_active !== false ? '● Active' : '○ Inactive'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1B1D21' }}>₹{(p.total_revenue || 0).toLocaleString()}</div>
                                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>₹{p.price?.toLocaleString()} / plan</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SyllabusPage() {
    const [tab, setTab] = useState('tree')
    const [nodes, setNodes] = useState<SyllabusNode[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [distributions, setDistributions] = useState<Distribution[]>([])
    const [stats, setStats] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const showToast = useCallback((msg: string, ok: boolean) => setToast({ msg, ok }), [])

    // Modals
    const [showAIGen, setShowAIGen] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [nodeModal, setNodeModal] = useState<{ open: boolean; editing?: SyllabusNode; parentNode?: SyllabusNode }>({ open: false })
    const [nodeForm, setNodeForm] = useState({ name: '', type: 'board' as NodeType, order_index: 0 })
    const [planModal, setPlanModal] = useState<{ open: boolean; editing?: Plan }>({ open: false })
    const [planForm, setPlanForm] = useState<any>({ name: '', syllabus_id: '', pricing_type: 'one-time', price: 0, validity_days: 365, features: { ai_mapping: true, adaptive_learning: true }, description: '', trial_days: 0, total_revenue: 0 })
    const [distModal, setDistModal] = useState(false)
    const [distForm, setDistForm] = useState<any>({ syllabus_id: '', tenant_id: '', features: { adaptive: true, ai_help: true, analytics: true }, access_level: 'full', expires_at: '', notes: '' })

    // Tree state
    const [treeSearch, setTreeSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [activeFilter, setActiveFilter] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Distribution search
    const [distSearch, setDistSearch] = useState('')

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (treeSearch) params.set('search', treeSearch)
            if (typeFilter) params.set('type', typeFilter)
            if (activeFilter) params.set('is_active', 'true')
            const res = await fetch(`/api/owner/syllabus?${params}`)
            if (!res.ok) throw new Error('Failed to load data')
            const json = await res.json()
            setNodes(json.nodes ?? [])
            setPlans(json.plans ?? [])
            setTenants(json.tenants ?? [])
            setDistributions(json.distributions ?? [])
            setStats(json.stats ?? {})
        } catch (e: any) { showToast(e.message, false) }
        finally { setLoading(false) }
    }, [showToast, treeSearch, typeFilter, activeFilter])

    useEffect(() => { fetchAll() }, [fetchAll])

    const apiCall = useCallback(async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/owner/syllabus', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Action failed')
            await fetchAll()
            if (!['GET_NODE_DETAIL'].includes(action)) showToast('Saved!', true)
            return json
        } catch (e: any) { showToast(e.message, false); return null }
        finally { setSaving(false) }
    }, [fetchAll, showToast])

    // Node handlers
    const openAddRoot = () => { setNodeForm({ name: '', type: 'board', order_index: 0 }); setNodeModal({ open: true }) }
    const openAddChild = (parent: SyllabusNode) => { setNodeForm({ name: '', type: NEXT_TYPES[parent.type], order_index: 0 }); setNodeModal({ open: true, parentNode: parent }) }
    const openEditNode = (node: SyllabusNode, inlineName?: string) => {
        if (inlineName) { apiCall('UPDATE_NODE', { id: node.id, name: inlineName }); return }
        setNodeForm({ name: node.name, type: node.type, order_index: node.order_index })
        setNodeModal({ open: true, editing: node })
    }
    const handleSaveNode = async () => {
        if (!nodeForm.name.trim()) { showToast('Name is required', false); return }
        const isEdit = !!nodeModal.editing
        const result = await apiCall(isEdit ? 'UPDATE_NODE' : 'CREATE_NODE',
            isEdit ? { id: nodeModal.editing!.id, ...nodeForm }
                : { ...nodeForm, parent_id: nodeModal.parentNode?.id || null })
        if (result) setNodeModal({ open: false })
    }
    const handleDeleteNode = (node: SyllabusNode) => {
        const childCount = nodes.filter(n => n.parent_id === node.id).length
        const msg = childCount > 0 ? `Delete "${node.name}" and all ${childCount}+ children?` : `Delete "${node.name}"?`
        if (!confirm(msg)) return
        apiCall('DELETE_NODE', { id: node.id })
        if (selectedNodeId === node.id) setSelectedNodeId(null)
    }
    const handleToggleNode = (node: SyllabusNode) => {
        apiCall('TOGGLE_NODE', { id: node.id, is_active: !node.is_active })
    }
    const handleAIGenerateChildren = async () => {
        if (!nodeModal.parentNode) return
        setSaving(true)
        try {
            const res = await fetch('/api/owner/syllabus/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate_children', parentId: nodeModal.parentNode.id, parentName: nodeModal.parentNode.name, parentType: nodeModal.parentNode.type, targetType: nodeForm.type })
            })
            const text = await res.text(); let data: any = {}
            try { data = JSON.parse(text) } catch { throw new Error(`Server error (${res.status})`) }
            if (!res.ok) throw new Error(data.error || 'Generation failed')
            showToast(data.message || 'Generated!', true)
            setNodeModal({ open: false }); fetchAll()
        } catch (e: any) { showToast(e.message, false) }
        finally { setSaving(false) }
    }

    // Node selection (multi-select on ctrl/checkbox, single-select on row click)
    const handleNodeSelect = (node: SyllabusNode, isCheckbox = false) => {
        if (isCheckbox) {
            setSelectedIds(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id])
        } else {
            setSelectedNodeId(prev => prev === node.id ? null : node.id)
            setSelectedIds([])
        }
    }

    // Plan handlers
    const openAddPlan = () => { setPlanForm({ name: '', syllabus_id: '', pricing_type: 'one-time', price: 0, validity_days: 365, features: { ai_mapping: true, adaptive_learning: true, board_comparison: false, proctoring: false, certification: false, analytics: true }, description: '', trial_days: 0, total_revenue: 0 }); setPlanModal({ open: true }) }
    const handleSavePlan = async () => {
        if (!planForm.name.trim()) { showToast('Plan name required', false); return }
        if (!planForm.syllabus_id) { showToast('Select a syllabus node', false); return }
        const isEdit = !!planModal.editing
        const result = await apiCall(isEdit ? 'UPDATE_PLAN' : 'CREATE_PLAN', isEdit ? { id: planModal.editing!.id, ...planForm } : planForm)
        if (result) setPlanModal({ open: false })
    }

    // Distribution handlers
    const handleDistribute = async () => {
        if (!distForm.syllabus_id) { showToast('Select a syllabus', false); return }
        if (!distForm.tenant_id) { showToast('Select a tenant', false); return }
        const result = await apiCall('DISTRIBUTE_SYLLABUS', distForm)
        if (result) setDistModal(false)
    }

    // Bulk actions
    const handleBulkToggle = (is_active: boolean) => { if (confirm(`${is_active ? 'Activate' : 'Deactivate'} ${selectedIds.length} nodes?`)) { apiCall('BULK_TOGGLE', { ids: selectedIds, is_active }); setSelectedIds([]) } }
    const handleBulkDelete = () => { if (confirm(`Delete ${selectedIds.length} nodes and all their children?`)) { apiCall('BULK_DELETE', { ids: selectedIds }); setSelectedIds([]) } }

    // Quick add board from sidebar
    const handleQuickAdd = async (board: string, group: typeof BOARD_GROUPS[0]) => {
        const catName = group.cat
        let parent_id: string | null = null
        const catNode = nodes.find(n => n.name === catName && n.type === 'category')
        if (catNode) {
            parent_id = catNode.id
        } else {
            const res = await apiCall('CREATE_NODE', { name: catName, type: 'category', parent_id: null, order_index: 0, is_active: true })
            if (res?.node) parent_id = res.node.id
        }
        await apiCall('CREATE_NODE', { name: board, type: 'board', parent_id, order_index: 0, is_active: true })
    }

    // Computed
    const rootNodes = useMemo(() => {
        let filtered = nodes.filter(n => !n.parent_id)
        if (treeSearch) filtered = filtered.filter(n => n.name.toLowerCase().includes(treeSearch.toLowerCase()))
        return filtered
    }, [nodes, treeSearch])

    const filteredNodes = useMemo(() => {
        let filtered = nodes
        if (typeFilter) filtered = filtered.filter(n => n.type === typeFilter)
        if (activeFilter) filtered = filtered.filter(n => n.is_active)
        return filtered
    }, [nodes, typeFilter, activeFilter])

    const filteredDistributions = useMemo(() => {
        if (!distSearch) return distributions
        const q = distSearch.toLowerCase()
        return distributions.filter(d =>
            (d.tenants?.name || '').toLowerCase().includes(q) ||
            (d.syllabus_nodes?.name || '').toLowerCase().includes(q)
        )
    }, [distributions, distSearch])

    const TABS = [
        { id: 'tree', label: 'Academic Structure', icon: BookOpen, count: stats.totalNodes },
        { id: 'market', label: 'Marketplace', icon: ShoppingBag, count: plans.length },
        { id: 'dist', label: 'Distribution', icon: Globe, count: distributions.length },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    ]

    return (
        <div style={{ background: '#F7F8FA', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                .tree-node-row:hover { background: #F9FAFB !important; }
                .tree-node-row:hover .node-actions { opacity: 1 !important; }
                a { text-decoration: none; }
            `}</style>

            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* ── HEADER ── */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '20px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: '#1B1D21', letterSpacing: '-0.03em' }}>Syllabus Management</h1>
                        <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: 13 }}>Define academic structures, build marketplace plans, and distribute to tenants.</p>
                    </div>
                    <button onClick={fetchAll} disabled={loading} style={{ ...btnSecondary, gap: 7 }}>
                        <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                    </button>
                </div>
                {/* KPI Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                    <StatCard label="Total Nodes" value={stats.totalNodes ?? 0} icon={BookOpen} color="#6366F1" bg="#F5F3FF" />
                    <StatCard label="Active Nodes" value={stats.activeNodes ?? 0} icon={Check} color="#10B981" bg="#F0FDF4" />
                    <StatCard label="Boards / Exams" value={(stats.nodesByType?.board ?? 0) + (stats.nodesByType?.category ?? 0)} icon={Globe} color="#0EA5E9" bg="#F0F9FF" />
                    <StatCard label="Market Plans" value={plans.length} icon={ShoppingBag} color="#F59E0B" bg="#FFFBEB" />
                    <StatCard label="Distributions" value={stats.activeDistributions ?? 0} icon={Send} color="#EC4899" bg="#FDF2F8" />
                    <StatCard label="Questions" value={(stats.totalQuestions ?? 0).toLocaleString()} icon={Tag} color="#EF4444" bg="#FEF2F2" />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ padding: '24px 32px' }}>
                {/* Tab Bar */}
                <div style={{ marginBottom: 20 }}>
                    <TabBar tabs={TABS} active={tab} onChange={setTab} />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                        <Loader2 size={36} color="#004B93" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        {/* ══ ACADEMIC STRUCTURE TAB ══ */}
                        {tab === 'tree' && (
                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                                {/* LEFT: Quick-add sidebar */}
                                {sidebarOpen && (
                                    <div style={{ width: 260, flexShrink: 0, background: '#fff', borderRadius: 16, border: '1px solid #E8E8E8', overflow: 'hidden', maxHeight: 'calc(100vh - 260px)', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B1D21' }}>⚡ Quick Add Board</div>
                                                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Click to add a board instantly</div>
                                            </div>
                                            <button onClick={() => setSidebarOpen(false)} style={{ ...iconBtnStyle, width: 22, height: 22 }}><ChevronLeft size={12} /></button>
                                        </div>
                                        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 10px 14px' }}>
                                            {BOARD_GROUPS.map(group => (
                                                <div key={group.label} style={{ marginBottom: 14 }}>
                                                    <div style={{ fontSize: 9, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 4 }}>{group.label}</div>
                                                    {group.items.map(board => {
                                                        const added = nodes.some(n => n.name === board && (n.type === 'board' || n.type === 'category'))
                                                        return (
                                                            <button key={board} disabled={added || saving} onClick={() => handleQuickAdd(board, group)} style={{
                                                                width: '100%', padding: '8px 10px', border: '1px solid', textAlign: 'left',
                                                                borderColor: added ? '#F0F0F0' : '#E8E8E8', borderRadius: 10, background: added ? '#FAFAFA' : '#fff',
                                                                fontSize: 11, fontWeight: 700, color: added ? '#9CA3AF' : '#004B93', cursor: added ? 'default' : 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, transition: 'all 0.15s'
                                                            }}>
                                                                <span>{board}</span>
                                                                {added ? <Check size={12} color="#10B981" /> : <Plus size={12} color="#6366F1" />}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 8 }}>
                                                <button onClick={openAddRoot} style={{ width: '100%', padding: '8px', border: '1px dashed #D1D5DB', borderRadius: 10, background: 'transparent', fontSize: 11, fontWeight: 700, color: '#9CA3AF', cursor: 'pointer' }}>
                                                    + Custom Board / Exam…
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CENTER: Knowledge Tree */}
                                <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #E8E8E8', overflow: 'hidden', minWidth: 0 }}>
                                    {/* Tree toolbar */}
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} style={{ ...iconBtnStyle, flexShrink: 0 }}><ChevronRight size={14} /></button>}
                                        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                                            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            <input value={treeSearch} onChange={e => setTreeSearch(e.target.value)} placeholder="Search nodes…" style={{ ...inputStyle, paddingLeft: 36, height: 36, fontSize: 12 }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                            {['', 'board', 'class', 'subject', 'chapter', 'topic'].map(t => (
                                                <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${typeFilter === t ? '#004B93' : '#E5E7EB'}`, background: typeFilter === t ? '#004B9310' : '#fff', fontSize: 10, fontWeight: 700, color: typeFilter === t ? '#004B93' : '#6B7280', cursor: 'pointer' }}>
                                                    {t || 'All'}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setActiveFilter(a => !a)} style={{ ...iconBtnStyle, flexShrink: 0, background: activeFilter ? '#F0FDF4' : '#fff', borderColor: activeFilter ? '#10B981' : '#E5E7EB', color: activeFilter ? '#10B981' : '#9CA3AF' }} title="Active only">
                                            <Eye size={13} />
                                        </button>
                                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                                            <button onClick={() => setShowUpload(true)} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12 }}><Upload size={12} color="#10B981" /> Bulk Upload</button>
                                            <button onClick={() => setShowAIGen(true)} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12, background: '#EFE9FF', borderColor: 'transparent', color: '#6366F1' }}><Sparkles size={12} /> AI Generate</button>
                                            <button onClick={openAddRoot} style={{ ...btnPrimary, padding: '7px 12px', fontSize: 12 }}><Plus size={12} /> Add Board</button>
                                        </div>
                                    </div>
                                    {/* Tree */}
                                    <div style={{ padding: '16px 20px', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
                                        {rootNodes.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                                                <BookOpen size={40} style={{ marginBottom: 14, opacity: 0.3 }} />
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>{treeSearch ? `No nodes match "${treeSearch}"` : 'No academic structure yet'}</div>
                                                <div style={{ fontSize: 12, marginTop: 6 }}>{treeSearch ? 'Try a different search' : 'Use the Quick Add panel to add a Board.'}</div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {rootNodes.map(node => (
                                                    <TreeNode key={node.id} node={node}
                                                        nodes={typeFilter || activeFilter ? filteredNodes : nodes}
                                                        plans={plans}
                                                        onEdit={openEditNode}
                                                        onDelete={handleDeleteNode}
                                                        onAddChild={openAddChild}
                                                        onToggle={handleToggleNode}
                                                        onSelect={handleNodeSelect}
                                                        selectedIds={selectedIds}
                                                        level={0}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <BulkActionBar
                                            selectedIds={selectedIds}
                                            onActivate={() => handleBulkToggle(true)}
                                            onDeactivate={() => handleBulkToggle(false)}
                                            onDelete={handleBulkDelete}
                                            onClear={() => setSelectedIds([])}
                                            saving={saving}
                                        />
                                    </div>
                                </div>

                                {/* RIGHT: Node Inspector */}
                                {selectedNodeId && (
                                    <div style={{ width: 320, flexShrink: 0, maxHeight: 'calc(100vh - 260px)' }}>
                                        <NodeInspector
                                            nodeId={selectedNodeId}
                                            nodes={nodes}
                                            plans={plans}
                                            distributions={distributions}
                                            onClose={() => setSelectedNodeId(null)}
                                            apiCall={apiCall}
                                            showToast={showToast}
                                            saving={saving}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ MARKETPLACE TAB ══ */}
                        {tab === 'market' && (
                            <div style={{ animation: 'slideUp 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: '#1B1D21' }}>Marketplace Plans</div>
                                        <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Create revenue plans to monetize your academic structures.</div>
                                    </div>
                                    <button onClick={openAddPlan} style={{ ...btnPrimary, background: '#10B981' }}><Plus size={15} /> New Revenue Plan</button>
                                </div>
                                {plans.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', borderRadius: 20, border: '1px solid #E8E8E8' }}>
                                        <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                        <div style={{ fontSize: 18, fontWeight: 900, color: '#1B1D21', marginBottom: 8 }}>No Plans Yet</div>
                                        <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>Create your first revenue plan to start monetizing your syllabus</div>
                                        <button onClick={openAddPlan} style={{ ...btnPrimary, background: '#10B981', display: 'inline-flex' }}><Plus size={15} /> Create First Plan</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                                        {plans.map(plan => (
                                            <div key={plan.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <div style={{ background: plan.is_active !== false ? '#10B98115' : '#F3F4F6', color: plan.is_active !== false ? '#10B981' : '#9CA3AF', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                                                            {plan.is_active !== false ? '● Active' : '○ Inactive'}
                                                        </div>
                                                        {plan.trial_days ? <div style={{ background: '#FFF3CD', color: '#B45309', padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 900 }}>{plan.trial_days}d trial</div> : null}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => apiCall('TOGGLE_PLAN', { id: plan.id, is_active: !(plan.is_active !== false) })} style={{ ...iconBtnStyle }} title={plan.is_active !== false ? 'Deactivate' : 'Activate'}>{plan.is_active !== false ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                                                        <button onClick={() => { setPlanForm({ ...plan }); setPlanModal({ open: true, editing: plan }) }} style={iconBtnStyle}><Edit3 size={13} /></button>
                                                        <button onClick={() => { if (confirm('Delete plan?')) apiCall('DELETE_PLAN', { id: plan.id }) }} style={{ ...iconBtnStyle, color: '#EF4444' }}><Trash2 size={13} /></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 17, fontWeight: 900, color: '#1B1D21' }}>{plan.name}</div>
                                                    {plan.description && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{plan.description}</div>}
                                                    <div style={{ fontSize: 11, color: '#004B93', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Globe size={10} /> {plan.syllabus_nodes?.name || 'No syllabus linked'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ fontSize: 26, fontWeight: 950, color: '#1B1D21' }}>₹{plan.price.toLocaleString()}</div>
                                                    <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
                                                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{plan.validity_days}d access</div>
                                                </div>
                                                {/* Revenue row */}
                                                <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>Tracked Revenue</div>
                                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>₹{(plan.total_revenue || 0).toLocaleString()}</div>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                    {Object.entries(plan.features || {}).map(([k, v]) => v ? (
                                                        <span key={k} style={{ background: '#EFE9FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</span>
                                                    ) : null)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ DISTRIBUTION TAB ══ */}
                        {tab === 'dist' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: '#1B1D21' }}>Infrastructure Deployment</div>
                                        <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Deploy syllabus assets to tenants with granular access control.</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            <input value={distSearch} onChange={e => setDistSearch(e.target.value)} placeholder="Search deployments…" style={{ ...inputStyle, paddingLeft: 36, width: 240, height: 36 }} />
                                        </div>
                                        <button onClick={() => setDistModal(true)} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #004B93, #1E3A8A)', boxShadow: '0 4px 14px rgba(0,75,147,0.2)' }}>
                                            <Send size={14} /> Deploy Payload
                                        </button>
                                    </div>
                                </div>
                                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
                                    {filteredDistributions.length === 0 ? (
                                        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>
                                            <Globe size={40} style={{ marginBottom: 14, opacity: 0.3 }} />
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>{distSearch ? `No matches for "${distSearch}"` : 'No distributions yet'}</div>
                                            <div style={{ fontSize: 12, marginTop: 6 }}>{distSearch ? 'Try a different search' : 'Deploy a syllabus to a tenant to get started.'}</div>
                                        </div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#F9FAFB' }}>
                                                    {['Syllabus / Tenant', 'Access Level', 'Deployed On', 'Expires', 'Status', 'Features', ''].map(h => (
                                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredDistributions.map(d => {
                                                    const expiryDate = d.expires_at ? new Date(d.expires_at) : null
                                                    const isExpired = expiryDate ? expiryDate < new Date() : false
                                                    const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000) : null
                                                    return (
                                                        <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <BookOpen size={16} color="#004B93" />
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1B1D21' }}>{d.syllabus_nodes?.name ?? d.master_syllabus_id}</div>
                                                                        <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                                            <User size={10} /> {d.tenants?.name ?? d.tenant_id}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                <span style={{ background: '#F0F7FF', color: '#004B93', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'capitalize' }}>
                                                                    {d.access_level || 'full'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '16px 20px', fontSize: 12, color: '#374151', fontWeight: 600 }}>
                                                                {new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                {expiryDate ? (
                                                                    <div>
                                                                        <div style={{ fontSize: 12, fontWeight: 700, color: isExpired ? '#EF4444' : daysLeft && daysLeft < 30 ? '#F59E0B' : '#374151' }}>
                                                                            {expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                        </div>
                                                                        <div style={{ fontSize: 10, color: isExpired ? '#EF4444' : '#9CA3AF', marginTop: 1 }}>
                                                                            {isExpired ? 'Expired' : `${daysLeft}d left`}
                                                                        </div>
                                                                    </div>
                                                                ) : <span style={{ fontSize: 11, color: '#9CA3AF' }}>No expiry</span>}
                                                            </td>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: d.is_active ? '#ECFDF5' : '#F9FAFB', padding: '4px 10px', borderRadius: 8, width: 'fit-content', border: `1px solid ${d.is_active ? '#D1FAE5' : '#E5E7EB'}` }}>
                                                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: d.is_active ? '#10B981' : '#9CA3AF' }} />
                                                                    <span style={{ fontSize: 10, fontWeight: 900, color: d.is_active ? '#065F46' : '#6B7280', textTransform: 'uppercase' }}>{d.is_active ? 'Live' : 'Revoked'}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px 20px' }}>
                                                                <div style={{ display: 'flex', gap: 4 }}>
                                                                    {d.features?.adaptive && <span title="Adaptive"><Zap size={13} color="#6366F1" /></span>}
                                                                    {d.features?.ai_help && <span title="AI Help"><BrainCircuit size={13} color="#F59E0B" /></span>}
                                                                    {d.features?.analytics && <span title="Analytics"><BarChart2 size={13} color="#10B981" /></span>}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                                <button onClick={() => { if (confirm('Revoke this distribution?')) apiCall('REVOKE_DISTRIBUTION', { id: d.id }) }} style={{ border: '1px solid #E8E8E8', background: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#EF4444', fontSize: 11, fontWeight: 800 }}>
                                                                    Revoke
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ ANALYTICS TAB ══ */}
                        {tab === 'analytics' && (
                            <AnalyticsPanel stats={stats} plans={plans} distributions={distributions} nodes={nodes} />
                        )}
                    </>
                )}
            </div>

            {/* ── MODALS ── */}
            {showAIGen && <AIGenerateModal onClose={() => setShowAIGen(false)} onDone={() => { setShowAIGen(false); fetchAll() }} showToast={showToast} />}
            {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); fetchAll() }} showToast={showToast} />}
            {nodeModal.open && (
                <NodeModal
                    nodeModal={nodeModal} nodeForm={nodeForm} setNodeForm={setNodeForm}
                    onClose={() => setNodeModal({ open: false })} onSave={handleSaveNode}
                    onAIGenerate={handleAIGenerateChildren} saving={saving}
                />
            )}
            {planModal.open && (
                <PlanWizard
                    planForm={planForm} setPlanForm={setPlanForm} planModal={planModal}
                    onClose={() => setPlanModal({ open: false })} onSave={handleSavePlan}
                    saving={saving} nodes={nodes}
                />
            )}
            {distModal && (
                <DistributeWizard
                    distForm={distForm} setDistForm={setDistForm}
                    onClose={() => setDistModal(false)} onSave={handleDistribute}
                    saving={saving} nodes={nodes} tenants={tenants}
                />
            )}
        </div>
    )
}
