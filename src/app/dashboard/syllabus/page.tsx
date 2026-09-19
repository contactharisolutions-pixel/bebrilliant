'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    BookOpen, Layers, PlusCircle, CheckCircle, XCircle, Search, RefreshCw,
    Download, Upload, Eye, EyeOff, Edit3, Trash2, ChevronRight, ChevronDown,
    GraduationCap, Globe, BookMarked, FileSpreadsheet,
    FileText, Check, Plus, ArrowRight, AlertCircle, ShieldCheck,
    HelpCircle, Sparkles, Building2, Zap, Award, Lock
} from 'lucide-react'
import Papa from 'papaparse'
import { useIdentity } from '@/contexts/IdentityContext'

// ── TYPES ─────────────────────────────────────────────────────────────
type NodeType = 'board' | 'class' | 'subject' | 'chapter' | 'topic'

interface SyllabusNode {
    id: string
    name: string
    type: NodeType
    parent_id: string | null
    tenant_id: string | null
    is_active: boolean
    order_index: number
    created_at?: string
    depth?: number
}

interface OwnerPublishedSyllabus {
    id: string
    name: string
    type: string
    classes_count: number | string
    subjects_count: number | string
    chapters_count: number | string
    topics_count: number | string
    is_active_for_tenant: boolean
    created_at?: string
}

// ── COLOR & BADGE CONFIGURATION ───────────────────────────────────────
const TYPE_META: Record<NodeType, { label: string; badgeBg: string; badgeText: string; icon: any; border: string }> = {
    board: { label: 'Board Curriculum', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badgeText: 'text-indigo-700', icon: Globe, border: 'border-l-indigo-600' },
    class: { label: 'Grade / Class', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', badgeText: 'text-purple-700', icon: GraduationCap, border: 'border-l-purple-600' },
    subject: { label: 'Course Subject', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeText: 'text-emerald-700', icon: BookOpen, border: 'border-l-emerald-600' },
    chapter: { label: 'Chapter / Unit', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200', badgeText: 'text-amber-700', icon: Layers, border: 'border-l-amber-500' },
    topic: { label: 'Lesson Topic', badgeBg: 'bg-sky-50 text-sky-700 border-sky-200', badgeText: 'text-sky-700', icon: BookMarked, border: 'border-l-sky-500' }
}

export default function SyllabusHubPage() {
    // ── IDENTITY & PERMISSIONS ─────────────────────────────────────────
    const { identity } = useIdentity()
    const [userPermissions, setUserPermissions] = useState<{
        role: string
        isTeacher: boolean
        canManageSyllabus: boolean
    }>({
        role: 'teacher',
        isTeacher: false,
        canManageSyllabus: true
    })

    const isTeacher = userPermissions.isTeacher || identity?.role === 'teacher'

    // ── STATE ─────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'structure' | 'owner_published' | 'upload'>('structure')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Data
    const [nodes, setNodes] = useState<SyllabusNode[]>([])
    const [ownerPublished, setOwnerPublished] = useState<OwnerPublishedSyllabus[]>([])
    const [metrics, setMetrics] = useState({
        activeBoard: 'Gujarat Board (English Medium)',
        activeBoardId: null as string | null,
        totalClasses: 8,
        totalSubjects: 35,
        totalChapters: 432,
        totalTopics: 432,
        totalItems: 908,
        multiBoardEnabled: false,
        subscriptionPlan: 'Standard School License'
    })

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())

    // Modals
    const [itemModal, setItemModal] = useState<{
        open: boolean
        mode: 'add' | 'edit'
        nodeType: NodeType
        parent?: SyllabusNode
        node?: SyllabusNode
    }>({ open: false, mode: 'add', nodeType: 'class' })

    const [itemForm, setItemForm] = useState({ name: '', order_index: 0 })

    const [importConfirmModal, setImportConfirmModal] = useState<{
        open: boolean
        board: OwnerPublishedSyllabus | null
    }>({ open: false, board: null })

    const [multiBoardModalOpen, setMultiBoardModalOpen] = useState(false)
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
        open: false,
        id: '',
        name: ''
    })

    // Bulk Upload State
    const [bulkRows, setBulkRows] = useState<any[]>([])
    const [bulkFileName, setBulkFileName] = useState('')
    const [bulkMode, setBulkMode] = useState<'APPEND' | 'REPLACE'>('APPEND')
    const [customBoardName, setCustomBoardName] = useState('School Custom Curriculum')
    const [bulkUploading, setBulkUploading] = useState(false)
    const [syncingAcademy, setSyncingAcademy] = useState(false)

    // ── TOAST HELPER ──────────────────────────────────────────────────
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // ── FETCH DATA ────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/syllabus')
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || 'Unable to load syllabus records')
            }
            const data = await res.json()

            const loadedNodes: SyllabusNode[] = data.nodes || []
            setNodes(loadedNodes)
            setOwnerPublished(data.ownerPublishedSyllabuses || [])
            if (data.metrics) setMetrics(data.metrics)
            if (data.user) setUserPermissions(data.user)

            // Auto-expand first 2 levels (Board & Classes)
            const initialExpanded = new Set<string>()
            loadedNodes.forEach((n) => {
                if (n.type === 'board' || n.type === 'class') {
                    initialExpanded.add(n.id)
                }
            })
            setExpandedNodeIds(initialExpanded)
        } catch (err: any) {
            showToast(err.message || 'Failed to connect to syllabus repository', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ── EXPAND / COLLAPSE ─────────────────────────────────────────────
    const toggleExpand = (id: string) => {
        setExpandedNodeIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const expandAll = () => {
        const allIds = new Set<string>()
        nodes.forEach((n) => allIds.add(n.id))
        setExpandedNodeIds(allIds)
    }

    const collapseAll = () => {
        setExpandedNodeIds(new Set())
    }

    // ── HIERARCHICAL TREE STRUCTURING ─────────────────────────────────
    const { rootNodes, childMap } = useMemo(() => {
        const cMap = new Map<string, SyllabusNode[]>()
        const roots: SyllabusNode[] = []

        nodes.forEach((n) => {
            if (!n.parent_id || n.type === 'board') {
                roots.push(n)
            } else {
                const list = cMap.get(n.parent_id) || []
                list.push(n)
                cMap.set(n.parent_id, list)
            }
        })

        return { rootNodes: roots, childMap: cMap }
    }, [nodes])

    // Distinct Classes for Filter
    const availableClasses = useMemo(() => {
        return nodes.filter((n) => n.type === 'class')
    }, [nodes])

    // Search filter
    const matchesSearch = useCallback(
        (node: SyllabusNode): boolean => {
            if (!searchQuery.trim()) return true
            const q = searchQuery.toLowerCase()
            if (node.name.toLowerCase().includes(q)) return true
            // Check if any descendant matches
            const children = childMap.get(node.id) || []
            return children.some((c) => matchesSearch(c))
        },
        [searchQuery, childMap]
    )

    // ── ITEM CRUD HANDLERS ────────────────────────────────────────────
    const handleSaveItem = async () => {
        if (isTeacher) {
            showToast('Permission Denied: Teachers cannot create or edit course syllabus.', false)
            return
        }
        if (!itemForm.name.trim()) {
            showToast('Please enter an item title', false)
            return
        }
        setSaving(true)
        try {
            if (itemModal.mode === 'add') {
                const res = await fetch('/api/dashboard/syllabus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'CREATE_NODE',
                        payload: {
                            name: itemForm.name.trim(),
                            type: itemModal.nodeType,
                            parent_id: itemModal.parent ? itemModal.parent.id : null,
                            order_index: itemForm.order_index
                        }
                    })
                })
                const d = await res.json()
                if (!res.ok) throw new Error(d.error || 'Failed to create item')
                showToast(`New ${TYPE_META[itemModal.nodeType].label} added successfully`, true)
            } else {
                const res = await fetch('/api/dashboard/syllabus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'UPDATE_NODE',
                        payload: {
                            id: itemModal.node?.id,
                            name: itemForm.name.trim(),
                            order_index: itemForm.order_index
                        }
                    })
                })
                const d = await res.json()
                if (!res.ok) throw new Error(d.error || 'Failed to update item')
                showToast('Item updated successfully', true)
            }
            setItemModal({ open: false, mode: 'add', nodeType: 'class' })
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Operation failed', false)
        } finally {
            setSaving(false)
        }
    }

    const handleToggleNode = async (node: SyllabusNode) => {
        if (isTeacher) {
            showToast('Permission Denied: Teachers cannot modify course syllabus visibility.', false)
            return
        }
        try {
            const nextStatus = !node.is_active
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'TOGGLE_NODE',
                    payload: { id: node.id, is_active: nextStatus }
                })
            })
            if (!res.ok) throw new Error('Failed to update status')
            setNodes((prev) =>
                prev.map((n) => (n.id === node.id ? { ...n, is_active: nextStatus } : n))
            )
            showToast(`Marked as ${nextStatus ? 'Visible in Student App' : 'Hidden'}`, true)
        } catch (err: any) {
            showToast(err.message, false)
        }
    }

    const handleDeleteNode = async () => {
        if (isTeacher) {
            showToast('Permission Denied: Teachers cannot delete course syllabus.', false)
            return
        }
        if (!deleteModal.id) return
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_NODE',
                    payload: { id: deleteModal.id }
                })
            })
            if (!res.ok) throw new Error('Failed to delete item')
            showToast('Item and child contents removed', true)
            setDeleteModal({ open: false, id: '', name: '' })
            fetchData()
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setSaving(false)
        }
    }

    // ── ONE-CLICK IMPORT OWNER SYLLABUS ───────────────────────────────
    const handleOneClickImport = async (board: OwnerPublishedSyllabus) => {
        if (isTeacher) {
            showToast('Permission Denied: Only school administrators can import or change curriculum boards.', false)
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'IMPORT_OWNER_SYLLABUS',
                    payload: { board_id: board.id }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to import syllabus')
            showToast(data.message || 'Syllabus imported successfully', true)
            setImportConfirmModal({ open: false, board: null })
            fetchData()
            setActiveTab('structure')
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setSaving(false)
        }
    }

    // ── SYNC SYLLABUS TO INSTITUTIONAL ACADEMY RECORDS ───────────────
    const handleSyncAcademy = async () => {
        if (isTeacher) {
            showToast('Permission Denied: Only school administrators can sync curriculum with academy records.', false)
            return
        }
        setSyncingAcademy(true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SYNC_SYLLABUS_ACADEMY',
                    payload: { board_id: metrics.activeBoardId }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to synchronize with Academy records')
            showToast(data.message || 'Classes and subjects synchronized to Academy!', true)
            fetchData()
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setSyncingAcademy(false)
        }
    }

    // ── DOWNLOAD SPREADSHEET (EXCEL / CSV) ─────────────────────────────
    const handleDownloadBoardSyllabus = async (board: OwnerPublishedSyllabus) => {
        showToast(`Preparing official Excel/CSV spreadsheet for ${board.name}...`, true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DOWNLOAD_BOARD_SYLLABUS',
                    payload: { board_id: board.id }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to prepare download')

            const rows = data.rows || []
            if (rows.length === 0) {
                showToast('No curriculum rows found for this board', false)
                return
            }

            const csv = Papa.unparse(rows)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const cleanName = board.name.replace(/[^a-zA-Z0-9_-]/g, '_')
            a.download = `${cleanName}_Official_Syllabus.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            showToast(`Downloaded ${rows.length} syllabus topics for ${board.name}`, true)
        } catch (err: any) {
            showToast(err.message, false)
        }
    }

    // Download Active Board
    const handleDownloadActiveSyllabus = () => {
        if (!metrics.activeBoardId) {
            showToast('No active board found to export', false)
            return
        }
        handleDownloadBoardSyllabus({
            id: metrics.activeBoardId,
            name: metrics.activeBoard,
            type: 'board',
            classes_count: metrics.totalClasses,
            subjects_count: metrics.totalSubjects,
            chapters_count: metrics.totalChapters,
            topics_count: metrics.totalTopics,
            is_active_for_tenant: true
        })
    }

    // ── STARTER CSV TEMPLATE GENERATOR ────────────────────────────────
    const handleDownloadStarterTemplate = () => {
        const templateData = [
            { Board: 'Custom Board', Class: 'Class 8', Subject: 'Mathematics', Chapter: 'Rational Numbers', Topic: 'Properties of Rational Numbers', OrderIndex: 1 },
            { Board: 'Custom Board', Class: 'Class 8', Subject: 'Mathematics', Chapter: 'Rational Numbers', Topic: 'Representation on Number Line', OrderIndex: 2 },
            { Board: 'Custom Board', Class: 'Class 8', Subject: 'Mathematics', Chapter: 'Linear Equations', Topic: 'Solving Linear Equations in One Variable', OrderIndex: 3 },
            { Board: 'Custom Board', Class: 'Class 8', Subject: 'Science', Chapter: 'Crop Production', Topic: 'Agricultural Practices & Sowing', OrderIndex: 1 },
            { Board: 'Custom Board', Class: 'Class 8', Subject: 'Science', Chapter: 'Crop Production', Topic: 'Irrigation & Protection from Weeds', OrderIndex: 2 },
            { Board: 'Custom Board', Class: 'Class 8', Subject: 'English', Chapter: 'The Best Christmas Present', Topic: 'Comprehension & Vocabulary', OrderIndex: 1 }
        ]
        const csv = Papa.unparse(templateData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Syllabus_Bulk_Upload_Template.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast('Starter spreadsheet template downloaded', true)
    }

    // ── FILE DROP / UPLOAD HANDLER ────────────────────────────────────
    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setBulkFileName(file.name)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    showToast('Warning: some spreadsheet rows had formatting warnings', false)
                }
                const cleanRows = (results.data as any[]).filter(
                    (r) => (r.Class || r.class_name) && (r.Subject || r.subject_name)
                )
                setBulkRows(cleanRows)
                showToast(`Parsed ${cleanRows.length} valid syllabus rows from file`, true)
            },
            error: (err) => {
                showToast(`Failed to parse CSV file: ${err.message}`, false)
            }
        })
    }

    const handleCommitBulkUpload = async () => {
        if (isTeacher) {
            showToast('Permission Denied: Teachers cannot upload new syllabus.', false)
            return
        }
        if (bulkRows.length === 0) {
            showToast('No valid rows available to import', false)
            return
        }

        setBulkUploading(true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'BULK_UPLOAD_SYLLABUS',
                    payload: {
                        rows: bulkRows,
                        mode: bulkMode,
                        board_name: customBoardName
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Bulk upload failed')

            showToast(data.message || `Imported ${data.count} curriculum items`, true)
            setBulkRows([])
            setBulkFileName('')
            fetchData()
            setActiveTab('structure')
        } catch (err: any) {
            showToast(err.message, false)
        } finally {
            setBulkUploading(false)
        }
    }

    // ── RENDER RECURSIVE NODE ─────────────────────────────────────────
    const renderNodeItem = (node: SyllabusNode, level: number = 0) => {
        if (!matchesSearch(node)) return null

        // Class Filter check
        if (selectedClassFilter !== 'ALL') {
            if (node.type === 'class' && node.id !== selectedClassFilter) return null
        }

        const isExpanded = expandedNodeIds.has(node.id)
        const children = childMap.get(node.id) || []
        const hasChildren = children.length > 0
        const meta = TYPE_META[node.type] || TYPE_META.topic
        const IconComponent = meta.icon

        // Next child type determination
        let nextChildType: NodeType | null = null
        if (node.type === 'board') nextChildType = 'class'
        else if (node.type === 'class') nextChildType = 'subject'
        else if (node.type === 'subject') nextChildType = 'chapter'
        else if (node.type === 'chapter') nextChildType = 'topic'

        return (
            <div key={node.id} className="w-full flex flex-col mb-1.5 transition-all">
                {/* Node Row Card */}
                <div
                    className={`group w-full flex items-center justify-between py-3 px-3 sm:px-4 rounded-xl border bg-white hover:bg-slate-50/80 transition-all ${
                        node.is_active ? 'border-slate-200 shadow-sm' : 'border-slate-200/60 bg-slate-50/50 opacity-75'
                    } ${meta.border} border-l-4`}
                    style={{ marginLeft: `${Math.min(level * 18, 90)}px`, width: `calc(100% - ${Math.min(level * 18, 90)}px)` }}
                >
                    {/* Left: Expand, Icon, Title, and Badges */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(node.id)}
                                className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-500 transition-colors shrink-0"
                                title={isExpanded ? 'Collapse sub-items' : 'Expand sub-items'}
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-700" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        ) : (
                            <div className="w-6 shrink-0" />
                        )}

                        <div className={`p-1.5 rounded-lg ${meta.badgeBg} shrink-0`}>
                            <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                                {node.name}
                            </span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${meta.badgeBg}`}>
                                {meta.label}
                            </span>
                        </div>

                        {/* Child count summary badge */}
                        {hasChildren && (
                            <span className="hidden md:inline-flex items-center text-xs text-slate-400 font-medium ml-2 bg-slate-100 px-2 py-0.5 rounded-md">
                                {children.length} {nextChildType ? `${nextChildType}s` : 'items'}
                            </span>
                        )}
                    </div>

                    {/* Right: Administrative Actions or Teacher Read-Only Status */}
                    {!isTeacher ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Visibility Toggle */}
                            <button
                                onClick={() => handleToggleNode(node)}
                                className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                                    node.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                                title={node.is_active ? 'Visible in Student App & Portal' : 'Hidden from Student App & Portal'}
                            >
                                {node.is_active ? (
                                    <>
                                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="hidden xl:inline text-[11px]">Visible</span>
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span className="hidden xl:inline text-[11px]">Hidden</span>
                                    </>
                                )}
                            </button>

                            {/* Add Child Level Button */}
                            {nextChildType && (
                                <button
                                    onClick={() => {
                                        setItemModal({
                                            open: true,
                                            mode: 'add',
                                            nodeType: nextChildType!,
                                            parent: node
                                        })
                                        setItemForm({ name: '', order_index: children.length + 1 })
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-medium flex items-center gap-1 transition-colors"
                                    title={`Add ${TYPE_META[nextChildType].label}`}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline text-[11px]">Add {nextChildType}</span>
                                </button>
                            )}

                            {/* Edit Item Button */}
                            <button
                                onClick={() => {
                                    setItemModal({
                                        open: true,
                                        mode: 'edit',
                                        nodeType: node.type,
                                        node: node
                                    })
                                    setItemForm({ name: node.name, order_index: node.order_index || 0 })
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                                title="Edit Item Details"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Item Button */}
                            <button
                                onClick={() => setDeleteModal({ open: true, id: node.id, name: node.name })}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                title="Delete Item & Contents"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                node.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                {node.is_active ? 'Active' : 'Hidden'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Recursive Children Container */}
                {isExpanded && hasChildren && (
                    <div className="w-full flex flex-col mt-1">
                        {children.map((child) => renderNodeItem(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/50 to-white text-slate-900 pb-24">
            {/* ── TOAST NOTIFICATION ───────────────────────────────────── */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 ${
                        toast.ok
                            ? 'bg-emerald-900 text-emerald-50 border-emerald-700/80 shadow-emerald-950/20'
                            : 'bg-rose-900 text-rose-50 border-rose-700/80 shadow-rose-950/20'
                    }`}
                >
                    {toast.ok ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            <div className="w-full px-4 sm:px-8 py-6 space-y-6">
                {/* ── 1. ART-DIRECTED EDITORIAL HEADER BANNER ──────────── */}
                <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-900">
                    <div className="relative h-56 sm:h-64 w-full">
                        <Image
                            src="/assets/images/dashboard/syllabus_banner.jpg"
                            alt="Course Syllabus & Academic Curriculum Design Studio"
                            fill
                            priority
                            className="object-cover object-center opacity-40 mix-blend-luminosity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-indigo-950/70" />

                        {/* Banner Content */}
                        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold tracking-wide flex items-center gap-2 backdrop-blur-sm">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                        School Academic Curriculum Desk
                                    </span>

                                    {/* Board Licensing Badge */}
                                    <button
                                        onClick={() => setMultiBoardModalOpen(true)}
                                        className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-sm ${
                                            metrics.multiBoardEnabled
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                                                : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                                        }`}
                                    >
                                        <Award className="w-3.5 h-3.5 text-amber-300" />
                                        <span>
                                            {metrics.multiBoardEnabled ? 'Multi-Board Enterprise Plan' : 'Single Board License'}
                                        </span>
                                        {!metrics.multiBoardEnabled && !isTeacher && (
                                            <span className="underline ml-1 text-amber-300 font-bold">Upgrade</span>
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <button
                                        onClick={fetchData}
                                        disabled={loading}
                                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 backdrop-blur-sm transition-colors"
                                        title="Refresh Curriculum Data"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>

                                    <button
                                        onClick={handleDownloadActiveSyllabus}
                                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 backdrop-blur-sm flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="w-4 h-4 text-indigo-300" />
                                        <span>Download Active Excel</span>
                                    </button>

                                    {!isTeacher && (
                                        <button
                                            onClick={handleSyncAcademy}
                                            disabled={syncingAcademy || loading}
                                            className="px-4 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/45 text-indigo-100 text-xs font-semibold border border-indigo-400/40 backdrop-blur-sm flex items-center gap-2 transition-all shadow-sm"
                                            title="Synchronize Classes and Subjects to School Academy & Faculty records"
                                        >
                                            <GraduationCap className={`w-4 h-4 text-indigo-300 ${syncingAcademy ? 'animate-bounce' : ''}`} />
                                            <span>{syncingAcademy ? 'Syncing...' : 'Sync to Academy'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="max-w-2xl">
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                        Academic Syllabus & Curriculum Management
                                    </h1>
                                    <p className="mt-2 text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                                        Structure, organize, and publish standard school curricula across classes, subjects, chapters, and topics.
                                        Import official owner-published board frameworks or upload your school's custom spreadsheet.
                                    </p>
                                </div>

                                {!isTeacher ? (
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <button
                                            onClick={() => {
                                                setItemModal({
                                                    open: true,
                                                    mode: 'add',
                                                    nodeType: 'class'
                                                })
                                                setItemForm({ name: '', order_index: metrics.totalClasses + 1 })
                                            }}
                                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            <span>+ Add Grade / Class</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <span>Teacher View Mode</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teacher Read-Only Scope Active Banner */}
                {isTeacher && (
                    <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                                    <span>Teacher Academic Curriculum View</span>
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                                    Curriculum syllabuses are centrally managed and published by School Administration. You have read-only access to browse, search, and download approved curricula.
                                </div>
                            </div>
                        </div>
                        <div className="text-[11px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center shadow-xs">
                            Read-Only Syllabus
                        </div>
                    </div>
                )}

                {/* ── 2. EXECUTIVE LIVE KPIS ───────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Active Board */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Active Curriculum Board
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 truncate max-w-[200px]" title={metrics.activeBoard}>
                                {metrics.activeBoard}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{metrics.multiBoardEnabled ? 'Multi-Board Mode' : 'Single Active Board'}</span>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Globe className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Classes & Grades */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Classes & Grades
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.totalClasses} <span className="text-base font-semibold text-slate-500">Grades</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Standard academic standards</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3: Subjects */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Course Subjects
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.totalSubjects} <span className="text-base font-semibold text-slate-500">Subjects</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Languages, STEM & Humanities</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <BookOpen className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4: Chapters & Topics */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Instructional Units
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {metrics.totalChapters} <span className="text-base font-semibold text-slate-500">Chapters</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Across {metrics.totalTopics} lesson topics</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* ── 3. THREE OPERATIONAL TABS ────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-3">
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('structure')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                activeTab === 'structure'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>Curriculum Structure</span>
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                {metrics.totalItems}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('owner_published')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                activeTab === 'owner_published'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Globe className="w-4 h-4 text-emerald-600" />
                            <span>Owner Published Syllabuses</span>
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                {ownerPublished.length}
                            </span>
                        </button>

                        {!isTeacher && (
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                    activeTab === 'upload'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                                <span>Excel / CSV Manual Upload</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMultiBoardModalOpen(true)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Multi-Board Licensing Rules</span>
                        </button>
                    </div>
                </div>

                {/* ── 4. TAB CONTENT ───────────────────────────────────── */}

                {/* ─── TAB 1: CURRICULUM STRUCTURE ──────────────────────── */}
                {activeTab === 'structure' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[220px]">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search grades, subjects, chapters, or topics..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Class Filter */}
                                <div className="w-48 shrink-0">
                                    <select
                                        value={selectedClassFilter}
                                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                    >
                                        <option value="ALL">All Grades / Classes</option>
                                        {availableClasses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Expand / Collapse Controls */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={expandAll}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Expand All
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Collapse All
                                </button>
                            </div>
                        </div>

                        {/* Hierarchy Tree Card */}
                        <div className="w-full p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 space-y-3">
                                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <p className="text-sm font-medium text-slate-500">Loading curriculum hierarchy...</p>
                                </div>
                            ) : rootNodes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="p-4 rounded-full bg-indigo-50 text-indigo-600">
                                        <Layers className="w-8 h-8" />
                                    </div>
                                    <div className="max-w-md">
                                        <h3 className="text-base font-bold text-slate-900">No Curriculum Loaded Yet</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Import an official board from the Owner Published Syllabuses tab or upload your school syllabus spreadsheet.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setActiveTab('owner_published')}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                                        >
                                            Browse Owner Syllabuses
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('upload')}
                                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                                        >
                                            Upload Excel Sheet
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col space-y-1">
                                    {rootNodes.map((root) => renderNodeItem(root, 0))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: OWNER PUBLISHED SYLLABUSES ────────────────── */}
                {activeTab === 'owner_published' && (
                    <div className="space-y-6">
                        {/* Explanatory Banner */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                    Accredited Master Syllabuses Published by Owner
                                </span>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    Standard Education Board Curricula (1-Click Import & Download)
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                                    These syllabuses are maintained and published centrally by the platform owner.
                                    You can download the full spreadsheet for offline reference or 1-click import directly into your school curriculum.
                                </p>
                            </div>

                            <div className="shrink-0 p-3 rounded-xl bg-white border border-indigo-200/80 shadow-sm text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Your Plan
                                </span>
                                <span className="text-xs font-extrabold text-indigo-700 block mt-0.5">
                                    {metrics.multiBoardEnabled ? 'Multi-Board Active' : 'Single Board Active'}
                                </span>
                            </div>
                        </div>

                        {/* Syllabuses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ownerPublished.map((board) => (
                                <div
                                    key={board.id}
                                    className={`flex flex-col justify-between p-6 rounded-2xl bg-white border shadow-sm transition-all hover:shadow-md ${
                                        board.is_active_for_tenant
                                            ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                                            : 'border-slate-200'
                                    }`}
                                >
                                    <div>
                                        {/* Card Top */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            {board.is_active_for_tenant ? (
                                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                                                    <Check className="w-3 h-3 text-emerald-700" />
                                                    Active at Your School
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                                    Official Master
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                                            {board.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Official board curriculum published and verified by platform owner.
                                        </p>

                                        {/* Metrics Pills */}
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <div className="p-2 rounded-lg bg-slate-50 text-center">
                                                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                                    Grades
                                                </span>
                                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                                    {board.classes_count}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 text-center">
                                                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                                    Subjects
                                                </span>
                                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                                    {board.subjects_count}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 text-center">
                                                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                                    Chapters
                                                </span>
                                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                                    {board.chapters_count}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100">
                                        {!isTeacher ? (
                                            <button
                                                onClick={() => setImportConfirmModal({ open: true, board })}
                                                disabled={saving}
                                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                                    board.is_active_for_tenant
                                                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                                }`}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>{board.is_active_for_tenant ? 'Re-Apply Syllabus' : 'One-Click Import'}</span>
                                            </button>
                                        ) : (
                                            <div className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Curriculum Managed by School Admin</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleDownloadBoardSyllabus(board)}
                                            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Download className="w-4 h-4 text-slate-500" />
                                            <span>Download Excel Sheet</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: MANUAL EXCEL / CSV UPLOAD ────────────────── */}
                {activeTab === 'upload' && (
                    isTeacher ? (
                        <div className="p-12 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                                <Lock className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Curriculum Upload Restricted</h3>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                Teachers do not have permission to upload new syllabus spreadsheets. School curriculum uploads and modifications are reserved exclusively for school administrators.
                            </p>
                            <button
                                onClick={() => setActiveTab('structure')}
                                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                            >
                                Return to Curriculum Structure
                            </button>
                        </div>
                    ) : (
                    <div className="space-y-6">
                        {/* Guided 3-Step Container */}
                        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Manual Excel / CSV Spreadsheet Upload
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Import your school's unique academic syllabus from a Microsoft Excel or CSV spreadsheet.
                                    No AI generation required — complete deterministic control.
                                </p>
                            </div>

                            {/* 3 Step Indicator */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                        1
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase">Download Template</h4>
                                    <p className="text-xs text-slate-500">
                                        Get our pre-formatted spreadsheet with standard columns: <code>Board, Class, Subject, Chapter, Topic</code>.
                                    </p>
                                    <button
                                        onClick={handleDownloadStarterTemplate}
                                        className="mt-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                                    >
                                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Download Template (.csv)</span>
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                        2
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase">Select or Drop File</h4>
                                    <p className="text-xs text-slate-500">
                                        Save your filled sheet as <code>.csv</code> or <code>.xlsx</code> and select it below.
                                    </p>
                                    <div className="mt-2 text-xs font-medium text-slate-600">
                                        {bulkFileName ? `Selected: ${bulkFileName}` : 'No file selected yet'}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                        3
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase">Preview & Apply</h4>
                                    <p className="text-xs text-slate-500">
                                        Review the parsed curriculum rows in the table below and commit with 1 click.
                                    </p>
                                    <div className="mt-2 text-xs font-semibold text-indigo-600">
                                        {bulkRows.length} rows ready
                                    </div>
                                </div>
                            </div>

                            {/* Dropzone */}
                            <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 sm:p-12 text-center transition-colors bg-slate-50/50">
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileSelected}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="p-4 rounded-full bg-indigo-50 text-indigo-600">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {bulkFileName ? bulkFileName : 'Drag and drop your syllabus CSV spreadsheet here'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            or click to browse from your computer (.csv format supported)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Options: Mode Selection */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-800">Upload Action Mode:</span>
                                    <div className="flex items-center gap-4 mt-1">
                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="bulk_mode"
                                                value="APPEND"
                                                checked={bulkMode === 'APPEND'}
                                                onChange={() => setBulkMode('APPEND')}
                                                className="text-indigo-600"
                                            />
                                            <span>Append / Merge to Current Active Board</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="bulk_mode"
                                                value="REPLACE"
                                                checked={bulkMode === 'REPLACE'}
                                                onChange={() => setBulkMode('REPLACE')}
                                                className="text-indigo-600"
                                            />
                                            <span>Create & Replace as New Custom Board</span>
                                        </label>
                                    </div>
                                </div>

                                {bulkMode === 'REPLACE' && (
                                    <div className="w-full sm:w-64">
                                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                                            New Board Title
                                        </label>
                                        <input
                                            type="text"
                                            value={customBoardName}
                                            onChange={(e) => setCustomBoardName(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="e.g. Modern Academy Curriculum"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Preview Table */}
                            {bulkRows.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                            Previewing First 10 Rows ({bulkRows.length} total rows)
                                        </h4>
                                        <button
                                            onClick={() => setBulkRows([])}
                                            className="text-xs text-rose-600 hover:underline font-semibold"
                                        >
                                            Clear File
                                        </button>
                                    </div>

                                    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="p-3">#</th>
                                                    <th className="p-3">Class / Grade</th>
                                                    <th className="p-3">Subject</th>
                                                    <th className="p-3">Chapter</th>
                                                    <th className="p-3">Topic</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {bulkRows.slice(0, 10).map((r, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="p-3 text-slate-400">{idx + 1}</td>
                                                        <td className="p-3 font-semibold text-purple-700">
                                                            {r.Class || r.class_name || r.Grade}
                                                        </td>
                                                        <td className="p-3 font-semibold text-emerald-700">
                                                            {r.Subject || r.subject_name}
                                                        </td>
                                                        <td className="p-3 text-slate-800">
                                                            {r.Chapter || r.chapter_name || r.Unit}
                                                        </td>
                                                        <td className="p-3 text-slate-600">
                                                            {r.Topic || r.topic_name}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Commit Action */}
                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button
                                            onClick={handleCommitBulkUpload}
                                            disabled={bulkUploading}
                                            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
                                        >
                                            {bulkUploading ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    <span>Importing Curriculum Data...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span>Upload & Apply {bulkRows.length} Items to Syllabus</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )
                )}
            </div>

            {/* ── 5. MODALS ────────────────────────────────────────────── */}

            {/* ─── MODAL 1: ADD / EDIT CURRICULUM ITEM ──────────────────── */}
            {itemModal.open && !isTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-lg ${TYPE_META[itemModal.nodeType].badgeBg}`}>
                                    {React.createElement(TYPE_META[itemModal.nodeType].icon, { className: 'w-4 h-4' })}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {itemModal.mode === 'add' ? `Add New ${TYPE_META[itemModal.nodeType].label}` : `Edit ${TYPE_META[itemModal.nodeType].label}`}
                                    </h3>
                                    {itemModal.parent && (
                                        <p className="text-xs text-slate-500">
                                            Parent: <span className="font-semibold text-slate-700">{itemModal.parent.name}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setItemModal({ open: false, mode: 'add', nodeType: 'class' })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                    Item Name / Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                    placeholder={`e.g. ${itemModal.nodeType === 'class' ? 'Class 9' : itemModal.nodeType === 'subject' ? 'Mathematics' : itemModal.nodeType === 'chapter' ? 'Quadratic Equations' : 'Solving by Factorisation'}`}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                    Display Order Number
                                </label>
                                <input
                                    type="number"
                                    value={itemForm.order_index}
                                    onChange={(e) => setItemForm({ ...itemForm, order_index: Number(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Lower order numbers appear first in the curriculum tree.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setItemModal({ open: false, mode: 'add', nodeType: 'class' })}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveItem}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                            >
                                {saving ? 'Saving...' : 'Save Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL 2: ONE-CLICK IMPORT CONFIRMATION ───────────────── */}
            {importConfirmModal.open && !isTeacher && importConfirmModal.board && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Confirm Curriculum Import
                                </h3>
                            </div>
                            <button
                                onClick={() => setImportConfirmModal({ open: false, board: null })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-xs sm:text-sm text-slate-600">
                                You are about to import the official owner-published curriculum:
                            </p>
                            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-900">
                                    {importConfirmModal.board.name}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-indigo-700 mt-1 font-medium">
                                    <span>{importConfirmModal.board.classes_count} Grades</span>
                                    <span>•</span>
                                    <span>{importConfirmModal.board.subjects_count} Subjects</span>
                                    <span>•</span>
                                    <span>{importConfirmModal.board.chapters_count} Chapters</span>
                                </div>
                            </div>

                            {/* Single Board Plan Notice */}
                            {!metrics.multiBoardEnabled && (
                                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        <span>Single Board Architecture Rule</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed">
                                        Your school is on the <strong>Single Board Plan</strong>. Importing this board will set it as your active school curriculum and replace previous board assignments.
                                    </p>
                                    <p className="text-[11px] leading-relaxed">
                                        Need to operate multiple boards concurrently (e.g. CBSE and State Board)? Upgrade to the <strong>Multi-Board Plan</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setImportConfirmModal({ open: false, board: null })}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleOneClickImport(importConfirmModal.board!)}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                            >
                                {saving ? 'Applying...' : 'Confirm & Apply Syllabus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL 3: MULTI-BOARD ARCHITECTURE UPGRADE ────────────── */}
            {multiBoardModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                    <Award className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Multi-Board Architecture Enterprise
                                    </h3>
                                    <p className="text-xs text-slate-300">
                                        Licensing Policy & Multi-Curriculum Operation
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMultiBoardModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Current Status Box */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Your Active Plan
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                                        {metrics.multiBoardEnabled ? 'Multi-Board Architecture (Active)' : 'Standard Single-Board License'}
                                    </h4>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${metrics.multiBoardEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {metrics.multiBoardEnabled ? 'Multi-Board Enabled' : '1 Active Board Allowed'}
                                </span>
                            </div>

                            {/* Architecture Details */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Why Upgrade to Multi-Board Architecture?
                                </h4>
                                <ul className="space-y-2 text-xs text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Concurrent Board Operation:</strong> Run CBSE, GSEB, ICSE, and Cambridge simultaneously under one school tenant without switching or losing data.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Separate Student Registries:</strong> Assign students and sections to different boards while keeping all administration in one unified dashboard.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Board-Specific Examination Engines:</strong> Generate question papers, blueprints, and marksheets tailored to each board's grading pattern.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* Contact Owner CTA */}
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                                <p className="text-xs text-indigo-950 font-medium">
                                    To activate the Multi-Board Architecture for your school, contact the platform owner directly.
                                </p>
                                <div className="text-xs text-indigo-700 font-bold">
                                    Platform Owner Support: support@bebrilliant.in | +91 94285 24040
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setMultiBoardModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL 4: DELETE CONFIRMATION ─────────────────────────── */}
            {deleteModal.open && !isTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
                        <div className="p-3 rounded-full bg-rose-50 text-rose-600 w-fit">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Delete Item?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?
                                All nested sub-items (subjects, chapters, or topics) will also be removed.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setDeleteModal({ open: false, id: '', name: '' })}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteNode}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                            >
                                {saving ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
