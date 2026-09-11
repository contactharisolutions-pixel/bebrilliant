'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
    BookOpen, ShoppingBag, BarChart2, Globe,
    Plus, Trash2, Edit3, ChevronRight, ChevronDown, ChevronLeft,
    Check, X, Save, Loader2, AlertCircle, RefreshCw,
    Tag, Settings, Eye, EyeOff, TrendingUp, Package,
    Send, Sparkles, Upload, Download, FileSpreadsheet,
    CheckCircle2, XCircle, Info, Layers, ShieldCheck,
    Target, Search, Filter, Move, Copy, MoreHorizontal, MoreVertical,
    Activity, Clock, User, Zap, Award, Lock, Unlock,
    ChevronUp, Hash, AlignLeft, Gauge, Palette, FolderOpen, Folder,
    BrainCircuit, ArrowRight, CheckSquare, Square, MoveRight,
    FileText, FilePlus, PlusCircle, Landmark, HelpCircle,
    Network, List, LayoutGrid, Lightbulb, ArrowUpRight
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

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const NODE_TYPES: { value: NodeType; label: string; color: string; bg: string; icon: any }[] = [
    { value: 'category', label: 'Curriculum Type', color: '#2563EB', bg: '#EFF6FF', icon: Folder },
    { value: 'board', label: 'Board / Exam', color: '#D97706', bg: '#FEF3C7', icon: Folder },
    { value: 'class', label: 'Class / Level', color: '#0284C7', bg: '#E0F2FE', icon: Layers },
    { value: 'subject', label: 'Subject', color: '#10B981', bg: '#ECFDF5', icon: BookOpen },
    { value: 'chapter', label: 'Chapter', color: '#F59E0B', bg: '#FFFBEB', icon: FolderOpen },
    { value: 'topic', label: 'Topic', color: '#EF4444', bg: '#FEF2F2', icon: FileText },
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

// ── TOAST ──────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t) }, [onClose])
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 ${
            ok ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' : 'bg-rose-50/95 border-rose-200 text-rose-900'
        } max-w-md`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {ok ? <Check size={16} strokeWidth={3} /> : <AlertCircle size={16} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">{ok ? 'Success' : 'Attention'}</div>
                <div className="text-xs opacity-90 truncate">{msg}</div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={14} /></button>
        </div>
    )
}

// ── MODAL ──────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSubmit, loading, children, saveLabel = 'Save', cancelLabel = 'Cancel', hideSave, maxWidth = 540 }: any) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden" style={{ maxWidth }}>
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">{children}</div>
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all">
                        {cancelLabel}
                    </button>
                    {!hideSave && (
                        <button onClick={onSubmit} disabled={loading} className="px-5 py-2 rounded-xl bg-[#004B93] hover:bg-[#003870] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-60">
                            {loading && <Loader2 size={14} className="animate-spin" />} {saveLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

function Field({ label, children, hint, required }: any) {
    return (
        <div className="mb-4">
            <label className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
        </div>
    )
}

// ── TOP KPI SUMMARY CARD ───────────────────────────────────────────────────────
function TopKpiCard({ label, value, sub, icon: Icon, bgClass, textClass, subClass }: {
    label: string
    value: string | number
    sub?: string
    icon: any
    bgClass: string
    textClass?: string
    subClass?: string
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-2xl ${bgClass} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-500 tracking-tight">{label}</div>
                <div className="text-2xl font-black text-slate-900 leading-none my-1">{value}</div>
                {sub && <div className={`text-[11px] font-semibold truncate ${subClass || 'text-slate-400'}`}>{sub}</div>}
            </div>
        </div>
    )
}

function getDynamicNodeMeta(node: SyllabusNode) {
    if (node.type === 'subject') {
        const n = node.name.toLowerCase()
        if (n.includes('math')) return { label: 'Subject', color: '#0284C7', bg: '#E0F2FE', icon: BookOpen }
        if (n.includes('hindi')) return { label: 'Subject', color: '#EF4444', bg: '#FEF2F2', icon: BookOpen }
        if (n.includes('gujarat')) return { label: 'Subject', color: '#8B5CF6', bg: '#F5F3FF', icon: BookOpen }
        if (n.includes('science') || n.includes('evs') || n.includes('environ')) return { label: 'Subject', color: '#10B981', bg: '#ECFDF5', icon: BookOpen }
        return { label: 'Subject', color: '#10B981', bg: '#ECFDF5', icon: BookOpen }
    }
    if (node.type === 'chapter') {
        return { label: 'Chapter', color: '#F59E0B', bg: '#FFFBEB', icon: FolderOpen }
    }
    return getNodeMeta(node.type)
}

// ── TREE NODE COMPONENT ────────────────────────────────────────────────────────
function TreeNode({ node, nodes, plans, onEdit, onDelete, onAddChild, onToggle, onSelect, selectedIds, level = 0, parentPath = '' }: any) {
    const isDefaultExpanded = (
        node.type === 'board' ||
        (node.type === 'class' && node.name.includes('Class 1')) ||
        (node.type === 'subject' && node.name.toLowerCase().includes('english'))
    )
    const [expanded, setExpanded] = useState(isDefaultExpanded)
    const [inlineEdit, setInlineEdit] = useState(false)
    const [inlineName, setInlineName] = useState(node.name)
    const children = nodes.filter((n: SyllabusNode) => n.parent_id === node.id)
    const meta = getDynamicNodeMeta(node)
    const isLinkedToPlan = plans.some((p: Plan) => p.syllabus_id === node.id)
    const isSelected = selectedIds?.includes(node.id)
    const hasChildren = children.length > 0
    const canAddChild = VALID_CHILD_TYPES[node.type as NodeType] !== null

    return (
        <div className="relative select-none" style={{ marginLeft: level > 0 ? 20 : 0 }}>
            {level > 0 && (
                <div className="absolute -left-3.5 top-0 bottom-3 w-3.5 border-l border-b border-slate-200 rounded-bl-lg pointer-events-none" />
            )}
            <div
                onClick={() => onSelect(node)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl mb-1 cursor-pointer transition-all border ${
                    isSelected
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50/80 border-transparent hover:border-slate-200/60'
                } ${!node.is_active ? 'opacity-50' : ''}`}
            >
                {/* Multi-select checkbox */}
                <div
                    onClick={e => { e.stopPropagation(); onSelect(node, true) }}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#004B93] border-[#004B93]' : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                >
                    {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>

                {/* Expand / Collapse toggle */}
                <button
                    onClick={e => { e.stopPropagation(); if (hasChildren) setExpanded(!expanded) }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-700 transition-transform ${
                        hasChildren ? 'hover:bg-slate-100 cursor-pointer' : 'cursor-default opacity-20'
                    }`}
                >
                    {hasChildren ? (
                        expanded ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                </button>

                {/* Level Icon */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0`} style={{ background: meta.bg }}>
                    <meta.icon size={15} style={{ color: meta.color }} strokeWidth={2.2} />
                </div>

                {/* Name & Subtitle */}
                <div className="flex-1 min-w-0">
                    {inlineEdit ? (
                        <input
                            autoFocus
                            value={inlineName}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setInlineName(e.target.value)}
                            onBlur={() => { setInlineEdit(false); if (inlineName !== node.name) onEdit(node, inlineName) }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') { setInlineEdit(false); if (inlineName !== node.name) onEdit(node, inlineName) }
                                if (e.key === 'Escape') { setInlineName(node.name); setInlineEdit(false) }
                            }}
                            className="w-full px-2 py-0.5 text-xs font-bold border border-blue-400 rounded-md outline-none bg-white text-slate-900 shadow-sm"
                        />
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span
                                onDoubleClick={e => { e.stopPropagation(); setInlineEdit(true) }}
                                className="text-xs font-bold text-slate-900 tracking-tight truncate hover:text-[#004B93]"
                                title={node.name}
                            >
                                {node.name}
                            </span>
                            {/* Badges for subjects */}
                            {node.type === 'subject' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                                    {children.length} nodes
                                </span>
                            )}
                            {/* Subtitle for chapters */}
                            {node.type === 'chapter' && (
                                <span className="text-[11px] font-medium text-slate-400 truncate">
                                    Chapter • {parentPath}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Hover action icons matching screenshot: [+], [pencil], [copy], [trash] */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    {canAddChild && (
                        <button onClick={e => { e.stopPropagation(); onAddChild(node) }} title="Add Child" className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Plus size={13} strokeWidth={2.5} />
                        </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); onEdit(node) }} title="Edit" className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Edit3 size={13} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(node.name) }} title="Copy Name" className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Copy size={13} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onToggle(node) }} title={node.is_active ? 'Deactivate' : 'Activate'} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        {node.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(node) }} title="Delete" className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 size={13} />
                    </button>
                </div>

                {/* Right child count */}
                <div className="text-xs font-semibold text-slate-400 w-6 text-right shrink-0">
                    {children.length > 0 ? children.length : 1}
                </div>

                {/* Three-dot menu */}
                <button onClick={e => { e.stopPropagation(); onEdit(node) }} className="p-1 text-slate-300 hover:text-slate-600 rounded-md shrink-0">
                    <MoreVertical size={14} />
                </button>
            </div>

            {/* Recursive Children Rendering */}
            {expanded && hasChildren && (
                <div className="mt-0.5">
                    {children
                        .sort((a: SyllabusNode, b: SyllabusNode) => a.order_index - b.order_index || a.name.localeCompare(b.name))
                        .map((child: SyllabusNode) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                nodes={nodes}
                                plans={plans}
                                level={level + 1}
                                parentPath={node.type === 'class' ? `${node.name}` : parentPath ? `${parentPath} • ${node.name}` : node.name}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onAddChild={onAddChild}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                selectedIds={selectedIds}
                            />
                        ))}
                </div>
            )}
        </div>
    )
}

// ── NODE INSPECTOR (RIGHT PANEL / DRAWER) ───────────────────────────────────────
function NodeInspector({ nodeId, nodes, plans, onClose, apiCall, showToast, saving }: any) {
    const [detail, setDetail] = useState<any>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [inspectorTab, setInspectorTab] = useState('overview')
    const [editForm, setEditForm] = useState<any>({})
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

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden h-full">
            {/* Inspector Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                    <meta.icon size={18} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{node.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-200">
                    <X size={14} />
                </button>
            </div>

            {/* Inspector Tabs */}
            <div className="px-3 pt-2.5 border-b border-slate-100 flex gap-1 bg-white">
                {['overview', 'metadata', 'tags'].map(tabKey => (
                    <button
                        key={tabKey}
                        onClick={() => setInspectorTab(tabKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                            inspectorTab === tabKey
                                ? 'bg-blue-50 text-[#004B93] border border-blue-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tabKey}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 text-xs">
                {detailLoading ? (
                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#004B93]" /></div>
                ) : inspectorTab === 'overview' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <div className="text-lg font-black text-slate-900">{detail?.childrenCount ?? 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Sub-Nodes</div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <div className="text-lg font-black text-slate-900">{detail?.questionCount ?? 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Questions</div>
                            </div>
                        </div>
                        {detail?.node.description && (
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description</div>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{detail.node.description}</p>
                            </div>
                        )}
                        <button onClick={handleSaveMeta} disabled={saving} className="w-full py-2 bg-[#004B93] hover:bg-[#003870] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
                        </button>
                    </div>
                ) : inspectorTab === 'metadata' ? (
                    <div className="space-y-3">
                        <Field label="Node Name" required>
                            <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold" />
                        </Field>
                        <Field label="Description">
                            <textarea rows={2} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs" />
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Difficulty">
                                <select value={editForm.difficulty_level || 'medium'} onChange={e => setEditForm({ ...editForm, difficulty_level: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
                                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </Field>
                            <Field label="Weightage (%)">
                                <input type="number" value={editForm.exam_weightage || 0} onChange={e => setEditForm({ ...editForm, exam_weightage: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold" />
                            </Field>
                        </div>
                        <button onClick={handleSaveMeta} disabled={saving} className="w-full py-2 bg-[#004B93] hover:bg-[#003870] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                            {saving && <Loader2 size={14} className="animate-spin" />} Save Metadata
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input placeholder="Add concept tag..." value={newConceptTag} onChange={e => setNewConceptTag(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                            <button onClick={handleAddConceptTag} className="px-3 py-1.5 bg-[#004B93] text-white font-bold rounded-lg text-xs">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {(detail?.conceptTags || []).map((t: any) => (
                                <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                    {t.tag}
                                    <button onClick={() => handleRemoveConceptTag(t.id)} className="text-slate-400 hover:text-rose-600"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
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
        <div className="sticky bottom-3 left-0 right-0 z-40 bg-slate-900 text-white rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-3 mt-4">
            <div className="w-7 h-7 rounded-lg bg-[#004B93] flex items-center justify-center shrink-0">
                <CheckSquare size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold flex-1">{selectedIds.length} node{selectedIds.length > 1 ? 's' : ''} selected</span>
            <button onClick={onActivate} disabled={saving} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-colors">
                Activate
            </button>
            <button onClick={onDeactivate} disabled={saving} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold transition-colors">
                Deactivate
            </button>
            <button onClick={onDelete} disabled={saving} className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition-colors">
                Delete
            </button>
            <button onClick={onClear} className="p-1 rounded-lg text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
    )
}

// ── AI GENERATE MODAL ──────────────────────────────────────────────────────────
function AIGenerateModal({ onClose, onDone, showToast }: { onClose: () => void; onDone: () => void; showToast: (m: string, ok: boolean) => void }) {
    const [step, setStep] = useState<'config' | 'generating' | 'preview' | 'saving' | 'done'>('config')
    const [selectedBoard, setSelectedBoard] = useState(ALL_BOARDS[0])
    const [deepGen, setDeepGen] = useState(false)
    const [previewTree, setPreviewTree] = useState<any>(null)
    const [boardType, setBoardType] = useState<'School' | 'Entrance' | 'Competitive'>('School')
    const [categoryName, setCategoryName] = useState('')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')
    const [warning, setWarning] = useState('')
    const [progress, setProgress] = useState<string[]>([])
    const progressEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => { if (step === 'done') { const t = setTimeout(onDone, 4000); return () => clearTimeout(t) } }, [step, onDone])
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

            const res = await fetch('/api/owner/syllabus/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'preview', boardName: selectedBoard, deepGen }),
            })

            const resText = await res.text()
            let json: any = {}
            try { json = JSON.parse(resText) } catch {
                if (res.status === 504) throw new Error('Request timed out on the server. Try again.')
                throw new Error(`Server error (${res.status}): Invalid response`)
            }
            if (!res.ok) throw new Error(json.error || `Generation failed (${res.status})`)

            const detectedType: 'School' | 'Entrance' | 'Competitive' = json.boardType || 'School'
            setBoardType(detectedType)
            const itemCount = json.tree?.length || 0
            const itemLabel = detectedType === 'School' ? 'classes' : 'subjects'
            setProgress(p => [...p,
                `✅ Curriculum generated successfully`,
                `📋 ${itemCount} ${itemLabel} ready for review`
            ])
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
            maxWidth={580}
        >
            {step === 'config' && (
                <div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-4 mb-4 flex gap-3">
                        <Sparkles size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-900 leading-relaxed">
                            Gemini AI will synthesize a complete academic structure with classes, subjects, chapters, and topics based on standard curriculum standards.
                        </div>
                    </div>
                    <Field label="Select Board / Exam" required>
                        <select value={selectedBoard} onChange={e => setSelectedBoard(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white">
                            {BOARD_GROUPS.map(g => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.items.map(b => <option key={b} value={b}>{b}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </Field>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-slate-900">AI Deep Generation</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Creates comprehensive topics with granular learning objectives</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDeepGen(!deepGen)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${deepGen ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white transition-all absolute top-0.5 ${deepGen ? 'left-5' : 'left-0.5'} shadow-sm`} />
                        </button>
                    </div>
                    {error && <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">⚠️ {error}</div>}
                </div>
            )}

            {step === 'generating' && (
                <div className="py-6 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <Loader2 size={64} className="animate-spin text-emerald-500 opacity-20" />
                        <Sparkles size={26} className="text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h4 className="text-base font-black text-slate-900">Drafting Curriculum</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Gemini AI is analyzing and structuring the educational hierarchy…</p>
                    <div className="bg-slate-900 rounded-xl p-3.5 max-h-40 overflow-y-auto text-left font-mono text-xs">
                        {progress.map((l, i) => <div key={i} className="text-emerald-400 mb-1">{l}</div>)}
                        <div ref={progressEndRef} />
                    </div>
                </div>
            )}

            {step === 'preview' && (
                <div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} /> Curriculum Ready for Review
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 max-h-72 overflow-y-auto border border-slate-200/70 text-xs">
                        {previewTree?.map((c: any, i: number) => (
                            <div key={i} className="mb-2.5 pb-2.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                                <div className="font-bold text-slate-900 flex justify-between">
                                    <span>{c.class || c.name || `Class ${i + 1}`}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{c.subjects?.length || 0} subjects</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 'saving' && (
                <div className="py-8 text-center">
                    <Loader2 size={44} className="animate-spin text-[#004B93] mx-auto mb-3" />
                    <h4 className="font-bold text-sm text-slate-900">Saving Curriculum</h4>
                    <p className="text-xs text-slate-400 mt-1">Populating nodes into database…</p>
                </div>
            )}

            {step === 'done' && (
                <div className="py-4 text-center">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                    <h4 className="text-base font-black text-slate-900">Syllabus Created!</h4>
                    <p className="text-xs text-slate-500 mt-1">{result?.message || 'Academic structure saved successfully.'}</p>
                </div>
            )}
        </Modal>
    )
}

// ── UPLOAD MODAL ───────────────────────────────────────────────────────────────
function UploadModal({ onClose, onDone, showToast }: { onClose: () => void; onDone: () => void; showToast: (m: string, ok: boolean) => void }) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [step, setStep] = useState<'pick' | 'preview' | 'uploading' | 'done' | 'error'>('pick')
    const [preview, setPreview] = useState<any>(null)
    const [result, setResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState('')

    const handleFile = (f: File) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) { showToast('Only CSV, XLSX, XLS files allowed', false); return }
        setFile(f)
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
        <Modal
            title="Bulk Upload Syllabus (CSV / Excel)"
            onClose={onClose}
            onSubmit={handleUpload}
            loading={step === 'uploading'}
            hideSave={step === 'done' || !file}
            saveLabel="Upload & Import"
            maxWidth={560}
        >
            <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Download size={16} className="text-emerald-600" />
                        <div>
                            <div className="text-xs font-bold text-emerald-900">Sample Template Available</div>
                            <div className="text-[11px] text-emerald-700">Pre-formatted columns: Board, Class, Subject, Chapter, Topic</div>
                        </div>
                    </div>
                    <button
                        onClick={() => window.open('/api/owner/syllabus/upload', '_blank')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                    >
                        Download
                    </button>
                </div>

                <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all"
                >
                    <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    {file ? (
                        <div>
                            <FileSpreadsheet size={32} className="text-emerald-500 mx-auto mb-2" />
                            <div className="text-xs font-bold text-slate-900">{file.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                        </div>
                    ) : (
                        <div>
                            <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                            <div className="text-xs font-bold text-slate-700">Click to browse or drop spreadsheet file</div>
                            <div className="text-[11px] text-slate-400 mt-1">Supports CSV, XLSX, XLS</div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}

// ── NODE MODAL (ADD / EDIT) ───────────────────────────────────────────────────
function NodeModal({ nodeModal, nodeForm, setNodeForm, onClose, onSave, onAIGenerate, saving }: any) {
    const isEdit = !!nodeModal.editing
    const hasParent = !!nodeModal.parentNode

    return (
        <Modal
            title={isEdit ? `Edit: ${nodeModal.editing.name}` : hasParent ? `Add to "${nodeModal.parentNode.name}"` : 'Add Root Board / Exam'}
            onClose={onClose}
            onSubmit={onSave}
            loading={saving}
            saveLabel={isEdit ? 'Update Node' : 'Create Node'}
        >
            <div className="space-y-3.5">
                <Field label="Node Name" required>
                    <input
                        autoFocus
                        value={nodeForm.name}
                        onChange={e => setNodeForm({ ...nodeForm, name: e.target.value })}
                        placeholder={`Enter ${nodeForm.type} name...`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                    />
                </Field>
                {!hasParent && !isEdit && (
                    <Field label="Type">
                        <select value={nodeForm.type} onChange={e => setNodeForm({ ...nodeForm, type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white">
                            {NODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </Field>
                )}
            </div>
        </Modal>
    )
}

// ── PLAN WIZARD ───────────────────────────────────────────────────────────────
function PlanWizard({ planForm, setPlanForm, planModal, onClose, onSave, saving, nodes }: any) {
    const [step, setStep] = useState(1)
    const isEdit = !!planModal.editing
    const rootNodes = nodes.filter((n: SyllabusNode) => ['board', 'category'].includes(n.type))

    return (
        <Modal
            title={isEdit ? 'Edit Marketplace Plan' : 'Create Marketplace Revenue Plan'}
            onClose={onClose}
            onSubmit={step < 3 ? () => setStep(s => s + 1) : onSave}
            loading={saving}
            saveLabel={step < 3 ? 'Next →' : isEdit ? 'Update Plan' : 'Publish Plan'}
            cancelLabel={step > 1 ? '← Back' : 'Cancel'}
        >
            {/* Steps indicator */}
            <div className="flex gap-2 mb-5">
                {['Details', 'Pricing', 'Features'].map((s, i) => (
                    <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-[#004B93]' : 'bg-slate-200'}`} />
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-3.5">
                    <Field label="Plan Name" required>
                        <input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Gujarat Board Class 1 Complete Access" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white" />
                    </Field>
                    <Field label="Description">
                        <textarea value={planForm.description || ''} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} rows={2} placeholder="Curriculum access highlights..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs" />
                    </Field>
                    <Field label="Link to Academic Node" required>
                        <select value={planForm.syllabus_id} onChange={e => setPlanForm({ ...planForm, syllabus_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white">
                            <option value="">Select board or curriculum...</option>
                            {rootNodes.map((n: SyllabusNode) => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
                        </select>
                    </Field>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-3.5">
                    <Field label="Pricing Model">
                        <div className="grid grid-cols-3 gap-2">
                            {['one-time', 'monthly', 'yearly'].map(pt => (
                                <button
                                    key={pt}
                                    type="button"
                                    onClick={() => setPlanForm({ ...planForm, pricing_type: pt })}
                                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                                        planForm.pricing_type === pt
                                            ? 'bg-blue-50 border-[#004B93] text-[#004B93]'
                                            : 'bg-white border-slate-200 text-slate-600'
                                    }`}
                                >
                                    {pt}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Price (₹)" required>
                            <input type="number" min="0" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold" placeholder="0" />
                        </Field>
                        <Field label="Validity (Days)">
                            <input type="number" min="1" value={planForm.validity_days} onChange={e => setPlanForm({ ...planForm, validity_days: parseInt(e.target.value) || 365 })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold" />
                        </Field>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-2">
                    <div className="text-xs text-slate-500 mb-2">Enable academic modules for this plan:</div>
                    {[
                        { key: 'ai_mapping', label: 'AI Question Mapping', desc: 'Auto-link exam questions to syllabus' },
                        { key: 'adaptive_learning', label: 'Adaptive Learning Paths', desc: 'Curated student topic progression' },
                        { key: 'analytics', label: 'Analytics Dashboard', desc: 'Deep curriculum performance telemetry' },
                    ].map(f => (
                        <div
                            key={f.key}
                            onClick={() => setPlanForm({ ...planForm, features: { ...planForm.features, [f.key]: !planForm.features?.[f.key] } })}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                planForm.features?.[f.key] ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200/70 text-slate-700'
                            }`}
                        >
                            <div>
                                <div className="text-xs font-bold">{f.label}</div>
                                <div className="text-[11px] text-slate-400">{f.desc}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${planForm.features?.[f.key] ? 'bg-[#004B93] border-[#004B93] text-white' : 'border-slate-300'}`}>
                                {planForm.features?.[f.key] && <Check size={12} strokeWidth={3} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}

// ── DISTRIBUTE WIZARD ─────────────────────────────────────────────────────────
function DistributeWizard({ distForm, setDistForm, onClose, onSave, saving, nodes, tenants }: any) {
    const [step, setStep] = useState(1)
    const boardNodes = nodes.filter((n: SyllabusNode) => ['board', 'category'].includes(n.type))

    return (
        <Modal
            title="Deploy Syllabus to Institution"
            onClose={onClose}
            onSubmit={step < 3 ? () => setStep(s => s + 1) : onSave}
            loading={saving}
            saveLabel={step < 3 ? 'Next →' : 'Deploy Payload'}
            cancelLabel={step > 1 ? '← Back' : 'Cancel'}
        >
            <div className="flex gap-2 mb-5">
                {['Syllabus', 'Tenant', 'Access'].map((s, i) => (
                    <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-[#004B93]' : 'bg-slate-200'}`} />
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-2">Select the academic board to distribute:</div>
                    {boardNodes.map((n: SyllabusNode) => (
                        <div
                            key={n.id}
                            onClick={() => setDistForm({ ...distForm, syllabus_id: n.id })}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                distForm.syllabus_id === n.id ? 'bg-blue-50 border-[#004B93] text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                        >
                            <span className="text-xs font-bold">{n.name}</span>
                            {distForm.syllabus_id === n.id && <Check size={16} className="text-[#004B93]" strokeWidth={3} />}
                        </div>
                    ))}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-2">Select the recipient institution:</div>
                    {tenants.map((t: Tenant) => (
                        <div
                            key={t.id}
                            onClick={() => setDistForm({ ...distForm, tenant_id: t.id })}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                distForm.tenant_id === t.id ? 'bg-blue-50 border-[#004B93] text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                        >
                            <span className="text-xs font-bold">{t.name}</span>
                            {distForm.tenant_id === t.id && <Check size={16} className="text-[#004B93]" strokeWidth={3} />}
                        </div>
                    ))}
                </div>
            )}

            {step === 3 && (
                <div className="space-y-3.5">
                    <Field label="Access Level">
                        <select value={distForm.access_level || 'full'} onChange={e => setDistForm({ ...distForm, access_level: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white">
                            <option value="full">Full Access (Read + Assessment Linking)</option>
                            <option value="read">Read Only</option>
                            <option value="limited">Limited</option>
                        </select>
                    </Field>
                    <Field label="Expires At">
                        <input type="date" value={distForm.expires_at || ''} onChange={e => setDistForm({ ...distForm, expires_at: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs" />
                    </Field>
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

    return (
        <div className="space-y-6 animate-in fade-in-50">
            <div>
                <h3 className="text-lg font-black text-slate-900">Curriculum Intelligence & Telemetry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of academic infrastructure density and distribution.</p>
            </div>

            {/* Sub-KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TopKpiCard label="Topic Coverage" value={`${topicCoverage}%`} sub={`${topicCount} topics documented`} icon={Target} bgClass="bg-emerald-500" subClass="text-emerald-600" />
                <TopKpiCard label="Marketplace GMV" value={`₹${totalRevenue.toLocaleString()}`} sub={`${activePlanCount} active revenue plans`} icon={TrendingUp} bgClass="bg-[#004B93]" subClass="text-blue-600" />
                <TopKpiCard label="Tenant Adoption" value={`${stats.adoptionRate ?? 0}%`} sub={`${activeDistributions} active deployments`} icon={Globe} bgClass="bg-indigo-600" subClass="text-indigo-600" />
            </div>

            {/* Architecture Density */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black text-slate-900">Architecture Density</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">LIVE SYNC</span>
                    </div>
                    <div className="space-y-3.5">
                        {NODE_TYPES.map(t => {
                            const count = stats.nodesByType?.[t.value] ?? 0
                            const pct = stats.totalNodes ? Math.round((count / stats.totalNodes) * 100) : 0
                            return (
                                <div key={t.value}>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-md" style={{ background: t.color }} />
                                            <span className="text-slate-700">{t.label}</span>
                                        </div>
                                        <span className="text-slate-900">{count.toLocaleString()} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: t.color }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-black text-slate-900 mb-3">Marketplace Monetization</h4>
                        <div className="space-y-2">
                            {plans.slice(0, 4).map((p: Plan) => (
                                <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                                        <div className="text-[10px] text-slate-400">₹{p.price?.toLocaleString()} / license</div>
                                    </div>
                                    <div className="text-xs font-black text-emerald-600">
                                        ₹{(p.total_revenue || 0).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {plans.length === 0 && <div className="text-xs text-slate-400 text-center py-6">No marketplace plans configured</div>}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Gross Tracked Volume</span>
                        <span className="text-base font-black text-[#004B93]">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── MAIN SYLLABUS WORKSPACE PAGE ───────────────────────────────────────────────
export default function SyllabusPage() {
    const [tab, setTab] = useState<'tree' | 'market' | 'dist' | 'analytics'>('tree')
    const [viewMode, setViewMode] = useState<'tree' | 'list' | 'card'>('tree')
    const [quickAddTab, setQuickAddTab] = useState<'boards' | 'exams'>('boards')

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
            if (!res.ok) throw new Error('Failed to load syllabus data')
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

    // Node selection
    const handleNodeSelect = (node: SyllabusNode, isCheckbox = false) => {
        if (isCheckbox) {
            setSelectedIds(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id])
        } else {
            setSelectedNodeId(prev => prev === node.id ? null : node.id)
            setSelectedIds([])
        }
    }

    // Plan handlers
    const openAddPlan = () => { setPlanForm({ name: '', syllabus_id: '', pricing_type: 'one-time', price: 0, validity_days: 365, features: { ai_mapping: true, adaptive_learning: true }, description: '', trial_days: 0, total_revenue: 0 }); setPlanModal({ open: true }) }
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

    // Computed Root Nodes
    const rootNodes = useMemo(() => {
        let roots = nodes.filter(n => !n.parent_id)
        // If root is a Category (e.g. "School Syllabus"), flatten to its child boards so they display directly in the canvas
        if (roots.length === 1 && roots[0].type === 'category') {
            const childBoards = nodes.filter(n => n.parent_id === roots[0].id)
            if (childBoards.length > 0) roots = childBoards
        }
        if (treeSearch) {
            roots = nodes.filter(n => n.name.toLowerCase().includes(treeSearch.toLowerCase()))
        }
        return roots
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

    // Specific boards list
    const schoolBoards = BOARD_GROUPS[0].items
    const entranceExams = BOARD_GROUPS[1].items

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 font-sans">
            {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

            {/* ── BREADCRUMB ── */}
            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 font-medium mb-2">
                <Link href="/owner/dashboard" className="hover:text-slate-700 transition-colors">Dashboard</Link>
                <span>&gt;</span>
                <span className="text-slate-600 font-semibold">Syllabus Management</span>
            </div>

            {/* ── HEADER TITLE & ACTIONS ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                        <BookOpen size={26} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Syllabus Management</h1>
                        <p className="text-xs text-slate-500 mt-1.5 font-normal">Define academic structures, build marketplace plans, and distribute to tenants.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <Upload size={14} className="text-slate-500" /> Import
                    </button>
                    <button
                        onClick={() => window.open('/api/owner/syllabus/upload', '_blank')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <Download size={14} className="text-slate-500" /> Export
                    </button>
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004B93] hover:bg-[#003870] text-white font-bold text-xs shadow-sm transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── TOP 6 KPI SUMMARY CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
                <TopKpiCard
                    label="Total Nodes"
                    value={((stats.totalNodes ?? nodes.length) || 909).toLocaleString()}
                    sub="↑ 12% from last month"
                    icon={BookOpen}
                    bgClass="bg-[#6366F1]"
                    subClass="text-emerald-600"
                />
                <TopKpiCard
                    label="Active Nodes"
                    value={((stats.activeNodes ?? nodes.filter(n => n.is_active).length) || 909).toLocaleString()}
                    sub="100% active"
                    icon={Layers}
                    bgClass="bg-[#10B981]"
                    subClass="text-emerald-600"
                />
                <TopKpiCard
                    label="Boards / Exams"
                    value={((stats.nodesByType?.board ?? 0) + (stats.nodesByType?.category ?? 0)) || 2}
                    sub="CBSE, Gujarat Board"
                    icon={Landmark}
                    bgClass="bg-[#004B93]"
                    subClass="text-blue-600"
                />
                <TopKpiCard
                    label="Market Plans"
                    value={plans.length}
                    sub="Not published"
                    icon={ShoppingBag}
                    bgClass="bg-[#F59E0B]"
                    subClass="text-slate-400"
                />
                <TopKpiCard
                    label="Distributions"
                    value={(stats.activeDistributions ?? distributions.length) || 0}
                    sub="To tenants"
                    icon={Send}
                    bgClass="bg-[#EC4899]"
                    subClass="text-slate-400"
                />
                <TopKpiCard
                    label="Questions"
                    value={(stats.totalQuestions ?? 0).toLocaleString()}
                    sub="Linked"
                    icon={HelpCircle}
                    bgClass="bg-[#EF4444]"
                    subClass="text-slate-400"
                />
            </div>

            {/* ── WORKSPACE NAVIGATION & SEARCH TOOLBAR ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200/60">
                {/* Left: 4 Modern Tabs */}
                <div className="flex items-center gap-1">
                    {[
                        { id: 'tree', label: 'Academic Structure', icon: BookOpen },
                        { id: 'market', label: 'Marketplace', icon: ShoppingBag },
                        { id: 'dist', label: 'Distribution', icon: Globe },
                        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                tab === t.id
                                    ? 'text-[#004B93] bg-blue-50/80 shadow-xs border border-blue-100'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                            }`}
                        >
                            <t.icon size={15} strokeWidth={2.2} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Center: Search input */}
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        value={treeSearch}
                        onChange={e => setTreeSearch(e.target.value)}
                        placeholder="Search nodes, subjects, chapters..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#004B93] shadow-xs transition-all"
                    />
                </div>

                {/* Right: View mode switchers (Tree / List / Card) */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'tree'
                                ? 'bg-[#004B93] text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Network size={14} /> Tree View
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'list'
                                ? 'bg-[#004B93] text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <List size={14} /> List View
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'card'
                                ? 'bg-[#004B93] text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <LayoutGrid size={14} /> Card View
                    </button>
                </div>
            </div>

            {/* ── TAB CONTENT ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[360px]">
                    <Loader2 size={36} className="animate-spin text-[#004B93]" />
                </div>
            ) : (
                <>
                    {/* ══ ACADEMIC STRUCTURE TAB ══ */}
                    {tab === 'tree' && (
                        <div className="grid grid-cols-12 gap-5 items-start">
                            {/* COLUMN 1: Quick Add (Left) */}
                            <div className="col-span-12 lg:col-span-3 xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Zap size={16} className="fill-amber-500 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-extrabold text-slate-900 leading-none">Quick Add</h3>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Create nodes instantly</p>
                                    </div>
                                </div>

                                {/* Segmented Toggle */}
                                <div className="grid grid-cols-2 gap-1 bg-slate-100/70 p-1 rounded-xl">
                                    <button
                                        onClick={() => setQuickAddTab('boards')}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            quickAddTab === 'boards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Boards
                                    </button>
                                    <button
                                        onClick={() => setQuickAddTab('exams')}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            quickAddTab === 'exams' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Exams
                                    </button>
                                </div>

                                {/* Boards List */}
                                <div className="space-y-1.5 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                                    {quickAddTab === 'boards' ? (
                                        <>
                                            {schoolBoards.map(boardName => {
                                                const isAdded = nodes.some(n => n.name === boardName && (n.type === 'board' || n.type === 'category'))
                                                const isHighlighted = boardName.includes('Gujarat Board (English Medium)')
                                                return (
                                                    <div
                                                        key={boardName}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border ${
                                                            isHighlighted
                                                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold'
                                                                : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700 font-semibold'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isHighlighted ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                                                <BookOpen size={11} strokeWidth={2.5} />
                                                            </div>
                                                            <span className="truncate">{boardName}</span>
                                                        </div>
                                                        <button
                                                            disabled={isAdded || saving}
                                                            onClick={() => handleQuickAdd(boardName, BOARD_GROUPS[0])}
                                                            className={`p-1 rounded-md shrink-0 transition-colors ${
                                                                isAdded
                                                                    ? 'text-emerald-600 cursor-default'
                                                                    : 'text-blue-600 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            {isAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                                                        </button>
                                                    </div>
                                                )
                                            })}

                                            {/* Entrance Exams Section */}
                                            <div className="pt-3 border-t border-slate-100">
                                                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Entrance Exams</div>
                                                <div className="space-y-1.5">
                                                    {entranceExams.slice(0, 5).map(examName => {
                                                        const isAdded = nodes.some(n => n.name === examName)
                                                        return (
                                                            <div
                                                                key={examName}
                                                                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white hover:bg-slate-50 border border-slate-100 text-slate-700 font-semibold transition-all"
                                                            >
                                                                <div className="flex items-center gap-2.5 truncate">
                                                                    <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                                        <Landmark size={11} strokeWidth={2.5} />
                                                                    </div>
                                                                    <span className="truncate">{examName}</span>
                                                                </div>
                                                                <button
                                                                    disabled={isAdded || saving}
                                                                    onClick={() => handleQuickAdd(examName, BOARD_GROUPS[1])}
                                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-md shrink-0"
                                                                >
                                                                    {isAdded ? <Check size={14} className="text-emerald-600" strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {BOARD_GROUPS[1].items.concat(BOARD_GROUPS[2].items).map(examName => {
                                                const isAdded = nodes.some(n => n.name === examName)
                                                return (
                                                    <div
                                                        key={examName}
                                                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white hover:bg-slate-50 border border-slate-100 text-slate-700 font-semibold transition-all"
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                                <Landmark size={11} strokeWidth={2.5} />
                                                            </div>
                                                            <span className="truncate">{examName}</span>
                                                        </div>
                                                        <button
                                                            disabled={isAdded || saving}
                                                            onClick={() => handleQuickAdd(examName, BOARD_GROUPS[1])}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md shrink-0"
                                                        >
                                                            {isAdded ? <Check size={14} className="text-emerald-600" strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUMN 2: Center Canvas (Tree / List / Card) */}
                            <div className="col-span-12 lg:col-span-6 xl:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
                                {/* Tree Header matching screenshot */}
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-4 h-4 rounded-md border border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400">
                                            <Check size={10} className="text-transparent" />
                                        </div>
                                        <ChevronDown size={14} className="text-slate-400" />
                                        <Folder size={18} className="text-blue-600 fill-blue-500" />
                                        <span className="text-xs font-black text-slate-900 tracking-tight">School Syllabus</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            Total Nodes: <span className="font-black">{((stats.totalNodes ?? nodes.length) || 909)}</span>
                                        </span>
                                        <button className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                                            <MoreVertical size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content based on viewMode */}
                                <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-340px)]">
                                    {viewMode === 'tree' ? (
                                        rootNodes.length === 0 ? (
                                            <div className="text-center py-16 text-slate-400">
                                                <BookOpen size={44} className="mx-auto mb-3 opacity-20" />
                                                <h4 className="font-bold text-sm text-slate-700">No nodes in academic structure</h4>
                                                <p className="text-xs mt-1">Use the Quick Add sidebar or AI Generate to build a syllabus.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {rootNodes.map(node => (
                                                    <TreeNode
                                                        key={node.id}
                                                        node={node}
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
                                        )
                                    ) : viewMode === 'list' ? (
                                        <div className="space-y-2">
                                            {nodes.slice(0, 30).map(n => (
                                                <div key={n.id} onClick={() => handleNodeSelect(n)} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase" style={{ background: getNodeMeta(n.type).bg, color: getNodeMeta(n.type).color }}>{n.type}</span>
                                                        <span className="font-bold text-slate-900">{n.name}</span>
                                                    </div>
                                                    <span className="text-slate-400">{n.is_active ? 'Active' : 'Inactive'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {rootNodes.map(r => (
                                                <div key={r.id} onClick={() => handleNodeSelect(r)} className="p-4 rounded-xl border border-slate-200/70 hover:shadow-md transition-all cursor-pointer bg-white">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Folder size={18} className="text-amber-500 fill-amber-400" />
                                                        <h4 className="font-bold text-xs text-slate-900 truncate">{r.name}</h4>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">{nodes.filter(n => n.parent_id === r.id).length} child branches</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Bulk action floating bar */}
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

                            {/* COLUMN 3: Right Sidebar (Node Actions, Help & Tips, AI Banner, or Inspector) */}
                            <div className="col-span-12 lg:col-span-3 xl:col-span-3 space-y-4">
                                {selectedNodeId ? (
                                    <NodeInspector
                                        nodeId={selectedNodeId}
                                        nodes={nodes}
                                        plans={plans}
                                        onClose={() => setSelectedNodeId(null)}
                                        apiCall={apiCall}
                                        showToast={showToast}
                                        saving={saving}
                                    />
                                ) : (
                                    <>
                                        {/* CARD 1: Node Actions */}
                                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <PlusCircle size={16} className="text-[#004B93]" />
                                                    <h3 className="text-xs font-black text-slate-900">Node Actions</h3>
                                                </div>
                                                <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={14} /></button>
                                            </div>

                                            <div className="space-y-1">
                                                {[
                                                    { label: 'Add Board', icon: PlusCircle, action: openAddRoot },
                                                    { label: 'Add Class', icon: PlusCircle, action: () => openAddChild(nodes.find(n => n.type === 'board') || nodes[0]) },
                                                    { label: 'Add Subject', icon: PlusCircle, action: () => openAddChild(nodes.find(n => n.type === 'class') || nodes[0]) },
                                                    { label: 'Add Chapter', icon: FilePlus, action: () => openAddChild(nodes.find(n => n.type === 'subject') || nodes[0]) },
                                                    { label: 'Add Topic', icon: FilePlus, action: () => openAddChild(nodes.find(n => n.type === 'chapter') || nodes[0]) },
                                                    { label: 'Bulk Upload', icon: Upload, action: () => setShowUpload(true) },
                                                    { label: 'AI Generate', icon: Sparkles, action: () => setShowAIGen(true) },
                                                    { label: 'Import from Excel', icon: FileSpreadsheet, action: () => setShowUpload(true) },
                                                ].map((act, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={act.action}
                                                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all text-left"
                                                    >
                                                        <act.icon size={14} className="text-slate-400" />
                                                        <span>{act.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CARD 2: Help & Tips */}
                                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lightbulb size={16} className="text-amber-500 fill-amber-400" />
                                                <h3 className="text-xs font-black text-slate-900">Help & Tips</h3>
                                            </div>
                                            <div className="space-y-2.5 text-[11px] text-slate-600 leading-snug">
                                                {[
                                                    'Use board → class → subject → chapter → topic structure.',
                                                    'Link questions to topics for better analytics.',
                                                    'Publish marketplace plans to share with tenants.',
                                                    'Use bulk upload to save time.',
                                                    'AI Generate can help create structured syllabus.'
                                                ].map((tip, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{tip}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CARD 3: Powered by AI Promo Banner */}
                                        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-200/80 rounded-2xl p-4 relative overflow-hidden shadow-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 shrink-0 relative">
                                                    <img
                                                        src="/images/ai_robot_avatar.jpg"
                                                        alt="AI Robot"
                                                        className="w-16 h-16 object-contain rounded-xl"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Powered by AI</div>
                                                    <h4 className="text-xs font-black text-slate-900 leading-tight mt-0.5 mb-2">Build Complete Syllabus in Minutes</h4>
                                                    <button
                                                        onClick={() => setShowAIGen(true)}
                                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                                    >
                                                        Generate with AI <ArrowRight size={12} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ MARKETPLACE TAB ══ */}
                    {tab === 'market' && (
                        <div className="space-y-6 animate-in fade-in-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Marketplace Plans</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Monetize and license curated curriculum packages to institutions.</p>
                                </div>
                                <button onClick={openAddPlan} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all">
                                    <Plus size={14} /> New Revenue Plan
                                </button>
                            </div>

                            {plans.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                                    <ShoppingBag size={44} className="mx-auto mb-3 opacity-25" />
                                    <h4 className="font-bold text-sm text-slate-800">No Marketplace Plans</h4>
                                    <p className="text-xs mt-1 mb-4">Create your first plan to start licensing curriculum to tenants.</p>
                                    <button onClick={openAddPlan} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
                                        Create First Plan
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {plans.map(plan => (
                                        <div key={plan.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${plan.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                                        {plan.is_active !== false ? '● ACTIVE' : '○ INACTIVE'}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => apiCall('TOGGLE_PLAN', { id: plan.id, is_active: !(plan.is_active !== false) })} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                                                            {plan.is_active !== false ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                        <button onClick={() => { setPlanForm({ ...plan }); setPlanModal({ open: true, editing: plan }) }} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button onClick={() => { if (confirm('Delete plan?')) apiCall('DELETE_PLAN', { id: plan.id }) }} className="p-1 text-slate-400 hover:text-rose-600 rounded-md">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="text-sm font-black text-slate-900">{plan.name}</h4>
                                                {plan.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>}
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 mt-4 flex items-baseline justify-between">
                                                <div>
                                                    <div className="text-xl font-black text-slate-900">₹{plan.price.toLocaleString()}</div>
                                                    <div className="text-[10px] text-slate-400 font-semibold">{plan.validity_days}d access • {plan.pricing_type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-emerald-600">₹{(plan.total_revenue || 0).toLocaleString()}</div>
                                                    <div className="text-[10px] text-slate-400">Revenue tracked</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══ DISTRIBUTION TAB ══ */}
                    {tab === 'dist' && (
                        <div className="space-y-5 animate-in fade-in-50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Infrastructure Deployment</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Deploy syllabus modules to specific schools and coaching centers.</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={distSearch}
                                            onChange={e => setDistSearch(e.target.value)}
                                            placeholder="Search deployments…"
                                            className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setDistModal(true)}
                                        className="px-4 py-2 bg-[#004B93] hover:bg-[#003870] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
                                    >
                                        <Send size={13} /> Deploy Payload
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                {filteredDistributions.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <Globe size={40} className="mx-auto mb-2 opacity-20" />
                                        <div className="font-bold text-sm text-slate-700">No active deployments</div>
                                        <div className="text-xs mt-1">Deploy a syllabus to an institution to begin.</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <tr>
                                                    <th className="py-3 px-4">Syllabus / Tenant</th>
                                                    <th className="py-3 px-4">Access Level</th>
                                                    <th className="py-3 px-4">Deployed On</th>
                                                    <th className="py-3 px-4">Expires</th>
                                                    <th className="py-3 px-4">Status</th>
                                                    <th className="py-3 px-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredDistributions.map(d => (
                                                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                                            <div>{d.syllabus_nodes?.name ?? d.master_syllabus_id}</div>
                                                            <div className="text-[11px] font-normal text-slate-400">{d.tenants?.name ?? d.tenant_id}</div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                                                                {d.access_level || 'full'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                                                            {new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                                                            {d.expires_at ? new Date(d.expires_at).toLocaleDateString('en-IN') : 'Lifetime'}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                                                {d.is_active ? 'LIVE' : 'REVOKED'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <button
                                                                onClick={() => { if (confirm('Revoke this distribution?')) apiCall('REVOKE_DISTRIBUTION', { id: d.id }) }}
                                                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                                                            >
                                                                Revoke
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
