'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    BookOpen, Layers, PlusCircle, CheckCircle, XCircle, Search, RefreshCw,
    Download, Upload, Eye, EyeOff, Edit3, Trash2, ChevronRight, ChevronDown,
    GraduationCap, Globe, BookMarked, ShoppingBag, Library, FileSpreadsheet,
    FileText, Check, Plus, ExternalLink, ArrowRight, Sparkles, AlertCircle
} from 'lucide-react'
import Papa from 'papaparse'

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

interface SyllabusBook {
    id: string
    board_name: string
    class_name: string
    subject_name: string
    title: string
    author?: string
    publisher: string
    edition: string
    isbn?: string
    chapters_count: number
    cover_image_url?: string
    pdf_url?: string
    price: number
    buy_url?: string
    is_prescribed: boolean
    is_active: boolean
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
    // ── STATE ─────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'tree' | 'books' | 'store' | 'bulk'>('tree')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Data
    const [nodes, setNodes] = useState<SyllabusNode[]>([])
    const [standardBoards, setStandardBoards] = useState<any[]>([])
    const [textbooks, setTextbooks] = useState<SyllabusBook[]>([])
    const [metrics, setMetrics] = useState({
        activeBoard: 'Gujarat Board (English Medium)',
        totalClasses: 8,
        totalSubjects: 35,
        totalChapters: 432,
        totalTopics: 432,
        totalBooks: 5,
        totalItems: 908
    })

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL')
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

    const [bookModal, setBookModal] = useState<{ open: boolean; mode: 'add' | 'edit'; book?: SyllabusBook }>({
        open: false,
        mode: 'add'
    })

    const [bookForm, setBookForm] = useState({
        class_name: 'Class 8',
        subject_name: 'Mathematics',
        title: '',
        author: '',
        publisher: 'Gujarat State Board of School Textbooks (GSEB)',
        edition: '2026 Revised Edition',
        isbn: '',
        chapters_count: 14,
        pdf_url: '',
        price: 120,
        buy_url: '',
        is_prescribed: true
    })

    const [boardModalOpen, setBoardModalOpen] = useState(false)
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: 'node' | 'book'; id: string; name: string }>({
        open: false,
        type: 'node',
        id: '',
        name: ''
    })

    // Bulk Upload State
    const [bulkRows, setBulkRows] = useState<any[]>([])
    const [bulkFileName, setBulkFileName] = useState('')
    const [bulkUploading, setBulkUploading] = useState(false)

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
            setStandardBoards(data.standardBoards || [])
            setTextbooks(data.textbooks || [])
            if (data.metrics) setMetrics(data.metrics)

            // Auto-expand first 2 levels (Board & Classes) for immediate rich view
            const defaultExpanded = new Set<string>()
            loadedNodes.forEach(n => {
                if (n.type === 'board' || n.type === 'class') {
                    defaultExpanded.add(n.id)
                }
            })
            setExpandedNodeIds(defaultExpanded)
        } catch (e: any) {
            console.error('[Syllabus fetch error]:', e)
            showToast(e.message || 'Error loading course syllabus', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ── EXTRACT AVAILABLE CLASSES & SUBJECTS FOR FILTERS ───────────────
    const availableClasses = useMemo(() => {
        return nodes.filter(n => n.type === 'class').sort((a, b) => a.order_index - b.order_index)
    }, [nodes])

    const availableSubjects = useMemo(() => {
        const subs = nodes.filter(n => n.type === 'subject')
        const uniqueNames = Array.from(new Set(subs.map(s => s.name)))
        return uniqueNames
    }, [nodes])

    // ── TREE EXPANSION TOGGLE ─────────────────────────────────────────
    const toggleExpand = (nodeId: string) => {
        setExpandedNodeIds(prev => {
            const next = new Set(prev)
            if (next.has(nodeId)) next.delete(nodeId)
            else next.add(nodeId)
            return next
        })
    }

    const expandAll = () => {
        const allIds = new Set<string>(nodes.map(n => n.id))
        setExpandedNodeIds(allIds)
    }

    const collapseAll = () => {
        setExpandedNodeIds(new Set())
    }

    // ── ACTION HANDLERS ───────────────────────────────────────────────
    const handleApiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Action could not be completed')

            showToast(data.message || 'Syllabus updated successfully', true)
            await fetchData()
            return data
        } catch (e: any) {
            showToast(e.message || 'Request failed', false)
            return null
        } finally {
            setSaving(false)
        }
    }

    // Save Node (Add or Edit)
    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!itemForm.name.trim()) {
            showToast('Please enter an item name', false)
            return
        }

        if (itemModal.mode === 'edit' && itemModal.node) {
            await handleApiAction('UPDATE_NODE', {
                id: itemModal.node.id,
                name: itemForm.name,
                order_index: itemForm.order_index
            })
        } else {
            await handleApiAction('CREATE_NODE', {
                parent_id: itemModal.parent?.id || null,
                name: itemForm.name,
                type: itemModal.nodeType,
                order_index: itemForm.order_index
            })
        }
        setItemModal({ open: false, mode: 'add', nodeType: 'class' })
    }

    // Toggle Node Visibility
    const handleToggleVisibility = async (node: SyllabusNode) => {
        await handleApiAction('TOGGLE_NODE', {
            id: node.id,
            is_active: !node.is_active
        })
    }

    // Confirm Delete
    const executeDelete = async () => {
        if (!deleteModal.id) return
        if (deleteModal.type === 'node') {
            await handleApiAction('DELETE_NODE', { id: deleteModal.id })
        } else {
            await handleApiAction('DELETE_TEXTBOOK', { id: deleteModal.id })
        }
        setDeleteModal({ open: false, type: 'node', id: '', name: '' })
    }

    // Save Textbook (Add or Edit)
    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bookForm.title.trim()) {
            showToast('Please enter a textbook title', false)
            return
        }

        if (bookModal.mode === 'edit' && bookModal.book) {
            await handleApiAction('UPDATE_TEXTBOOK', {
                id: bookModal.book.id,
                ...bookForm
            })
        } else {
            await handleApiAction('ADD_TEXTBOOK', {
                board_name: metrics.activeBoard,
                ...bookForm
            })
        }
        setBookModal({ open: false, mode: 'add' })
    }

    // Switch Board
    const handleSelectBoard = async (boardId: string) => {
        await handleApiAction('SELECT_BOARD', { board_id: boardId })
        setBoardModalOpen(false)
    }

    // Download Sample Template CSV
    const handleDownloadTemplate = () => {
        const sampleCsv = `Class,Subject,Chapter,Topic\nClass 9,Mathematics,Chapter 1: Number Systems,1.1 Irrational Numbers\nClass 9,Mathematics,Chapter 1: Number Systems,1.2 Real Numbers & Decimals\nClass 9,Science,Chapter 1: Matter in Our Surroundings,1.1 Physical Nature of Matter\nClass 9,Science,Chapter 1: Matter in Our Surroundings,1.2 States of Matter\nClass 10,Mathematics,Chapter 1: Real Numbers,1.1 Fundamental Theorem of Arithmetic\nClass 10,Science,Chapter 1: Chemical Reactions & Equations,1.1 Chemical Equations`
        const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'School_Syllabus_Sample_Template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Handle File Upload Parsing
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setBulkFileName(file.name)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = (results.data as any[]).filter(r => r.Class || r.class_name)
                setBulkRows(rows)
                showToast(`Parsed ${rows.length} rows from ${file.name}. Review below and click Import.`, true)
            },
            error: (err) => {
                showToast(`Failed to parse file: ${err.message}`, false)
            }
        })
    }

    // Commit Bulk Import
    const handleCommitBulkImport = async () => {
        if (!bulkRows.length) return
        setBulkUploading(true)
        const res = await handleApiAction('BULK_UPLOAD_SYLLABUS', { rows: bulkRows })
        setBulkUploading(false)
        if (res && res.success) {
            setBulkRows([])
            setBulkFileName('')
            setActiveTab('tree')
        }
    }

    // ── BUILD HIERARCHICAL TREE VIEW ──────────────────────────────────
    const renderNodeTree = (parentId: string | null, depth: number = 0) => {
        const childNodes = nodes
            .filter(n => n.parent_id === parentId)
            .sort((a, b) => a.order_index - b.order_index)

        if (childNodes.length === 0) return null

        return (
            <div className={`space-y-2.5 ${depth > 0 ? 'ml-4 sm:ml-8 pl-3 border-l-2 border-slate-200/80' : ''}`}>
                {childNodes.map(node => {
                    // Check search query matches
                    const matchesSearch = !searchQuery || 
                        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        nodes.some(child => child.parent_id === node.id && child.name.toLowerCase().includes(searchQuery.toLowerCase()))

                    // Check class filter
                    if (node.type === 'class' && selectedClassFilter !== 'ALL' && node.id !== selectedClassFilter) {
                        return null
                    }

                    if (!matchesSearch) return null

                    const meta = TYPE_META[node.type] || TYPE_META.topic
                    const isExpanded = expandedNodeIds.has(node.id)
                    const subChildren = nodes.filter(n => n.parent_id === node.id)
                    const hasChildren = subChildren.length > 0

                    // Next child type mapping
                    const nextTypeMap: Record<NodeType, NodeType> = {
                        board: 'class',
                        class: 'subject',
                        subject: 'chapter',
                        chapter: 'topic',
                        topic: 'topic'
                    }
                    const nextType = nextTypeMap[node.type]

                    return (
                        <div key={node.id} className="group rounded-2xl transition-all duration-200">
                            {/* NODE ROW CARD */}
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
                                !node.is_active ? 'opacity-60 bg-slate-50' : ''
                            } ${isExpanded ? 'border-slate-300 ring-1 ring-slate-200' : 'border-slate-200'}`}>
                                
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Expand/Collapse Chevron */}
                                    <button
                                        onClick={() => toggleExpand(node.id)}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                            hasChildren 
                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                                                : 'text-slate-300 cursor-default'
                                        }`}
                                        disabled={!hasChildren}
                                        title={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : 'No items inside'}
                                    >
                                        {hasChildren ? (
                                            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        )}
                                    </button>

                                    {/* Icon Badge */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${meta.badgeBg}`}>
                                        <meta.icon size={18} />
                                    </div>

                                    {/* Name & Type Pill */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                                                {node.name}
                                            </span>
                                            {!node.is_active && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 uppercase">
                                                    Hidden
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                            <span className="font-semibold text-slate-600">{meta.label}</span>
                                            {hasChildren && (
                                                <span className="text-slate-400">• {subChildren.length} sub-items</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    {/* Add Child Node */}
                                    {node.type !== 'topic' && (
                                        <button
                                            onClick={() => {
                                                setItemModal({
                                                    open: true,
                                                    mode: 'add',
                                                    nodeType: nextType,
                                                    parent: node
                                                })
                                                setItemForm({ name: '', order_index: subChildren.length + 1 })
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#004B93] text-xs font-bold transition-colors"
                                            title={`Add ${TYPE_META[nextType].label}`}
                                        >
                                            <Plus size={14} />
                                            <span>Add {TYPE_META[nextType].label.split('/')[0]}</span>
                                        </button>
                                    )}

                                    {/* Visibility Toggle */}
                                    <button
                                        onClick={() => handleToggleVisibility(node)}
                                        className={`p-1.5 rounded-lg border transition-colors ${
                                            node.is_active 
                                                ? 'border-slate-200 text-slate-600 hover:bg-slate-100' 
                                                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        }`}
                                        title={node.is_active ? 'Visible in Student Portal (Click to Hide)' : 'Hidden from Student Portal (Click to Show)'}
                                    >
                                        {node.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                                    </button>

                                    {/* Edit Node */}
                                    <button
                                        onClick={() => {
                                            setItemModal({
                                                open: true,
                                                mode: 'edit',
                                                nodeType: node.type,
                                                node
                                            })
                                            setItemForm({ name: node.name, order_index: node.order_index })
                                        }}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                        title="Rename / Edit"
                                    >
                                        <Edit3 size={15} />
                                    </button>

                                    {/* Delete Node */}
                                    <button
                                        onClick={() => setDeleteModal({ open: true, type: 'node', id: node.id, name: node.name })}
                                        className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                        title="Remove Item"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* RECURSIVE SUB-TREE */}
                            {isExpanded && renderNodeTree(node.id, depth + 1)}
                        </div>
                    )
                })}
            </div>
        )
    }

    // ── RENDER ────────────────────────────────────────────────────────
    if (loading && nodes.length === 0) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-sky-200 border-t-[#004B93] rounded-full animate-spin" />
                    <BookOpen className="absolute inset-0 m-auto text-[#004B93]" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800 text-lg">Loading School Curriculum...</h3>
                <p className="text-slate-500 text-sm mt-1">Calibrating academic boards, grades, chapters, and textbooks</p>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-slate-50/60 font-sans pb-24">
            {/* TOAST ALERT */}
            {toast && (
                <div className={`fixed top-6 right-8 z-[10000] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${
                    toast.ok 
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10' 
                        : 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-500/10'
                }`}>
                    {toast.ok ? <CheckCircle className="text-emerald-600" size={20} /> : <XCircle className="text-rose-600" size={20} />}
                    <span className="text-sm font-bold tracking-tight">{toast.msg}</span>
                </div>
            )}

            {/* FULL-WIDTH HERO BANNER (OPENAI ART-DIRECTED) */}
            <div className="w-full relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/images/dashboard/syllabus_banner.jpg"
                        alt="Academic Curriculum Design & Textbook Archive Studio"
                        fill
                        priority
                        className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
                </div>

                <div className="w-full px-4 sm:px-8 py-10 sm:py-14 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                <span className="text-xs font-black tracking-widest text-sky-400 uppercase">
                                    ACADEMIC CURRICULUM DESK • SCHOOL SYLLABUS & TEXTBOOKS
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                Course Syllabus & Curriculum Hub
                            </h1>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                                Manage grade-wise subjects, chapters, learning topics, and prescribed textbooks. Organized for easy school administration, faculty lesson planning, and student examination success.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1.5"><Globe size={15} className="text-indigo-400" /> Primary Board: <strong className="text-white">{metrics.activeBoard}</strong></span>
                                <span className="flex items-center gap-1.5"><Layers size={15} className="text-amber-400" /> Multi-Level Hierarchy (Class &gt; Subject &gt; Chapter &gt; Topic)</span>
                                <span className="flex items-center gap-1.5"><BookMarked size={15} className="text-emerald-400" /> Prescribed Textbooks &amp; PDF Guides</span>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <button
                                onClick={() => {
                                    setItemModal({
                                        open: true,
                                        mode: 'add',
                                        nodeType: 'class',
                                        parent: nodes.find(n => n.type === 'board')
                                    })
                                    setItemForm({ name: '', order_index: availableClasses.length + 1 })
                                }}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-600 hover:from-sky-700 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-950/40 border border-sky-300/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <PlusCircle size={18} />
                                <span>Add New Grade / Class</span>
                            </button>
                            <button
                                onClick={() => setBoardModalOpen(true)}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm backdrop-blur-md border border-slate-700 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Globe size={18} className="text-sky-400" />
                                <span>Switch Board Curriculum</span>
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                                title="Refresh data"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN FULL-WIDTH WORKSPACE */}
            <div className="w-full px-4 sm:px-8 -mt-6 relative z-20 space-y-6">

                {/* 4 EXECUTIVE KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                            <Globe size={24} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 truncate">School Curriculum</div>
                            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">{metrics.activeBoard}</div>
                            <div className="text-[11px] font-semibold text-indigo-700 mt-0.5 flex items-center gap-1">
                                <CheckCircle size={12} /> Active Academic Board
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Classes &amp; Grades</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalClasses} Grades</div>
                            <div className="text-[11px] font-semibold text-purple-700 mt-0.5 flex items-center gap-1">
                                <CheckCircle size={12} /> Grade 1 through Grade {metrics.totalClasses}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Course Subjects</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalSubjects} Subjects</div>
                            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                                <CheckCircle size={12} /> All Key Disciplines
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Instructional Chapters</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalChapters} Chapters</div>
                            <div className="text-[11px] font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                                <CheckCircle size={12} /> {metrics.totalTopics} Study Topics
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('tree')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'tree'
                                ? 'bg-[#004B93] text-white shadow-md shadow-sky-950/20'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Layers size={16} />
                        <span>Curriculum Structure</span>
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-extrabold ${
                            activeTab === 'tree' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {metrics.totalItems}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('books')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'books'
                                ? 'bg-[#004B93] text-white shadow-md shadow-sky-950/20'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <BookMarked size={16} />
                        <span>Prescribed Textbooks</span>
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-extrabold ${
                            activeTab === 'books' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {textbooks.filter(b => b.is_prescribed).length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('store')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'store'
                                ? 'bg-[#004B93] text-white shadow-md shadow-sky-950/20'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <ShoppingBag size={16} />
                        <span>Recommended Bookstore</span>
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-extrabold ${
                            activeTab === 'store' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {textbooks.filter(b => !b.is_prescribed).length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'bulk'
                                ? 'bg-[#004B93] text-white shadow-md shadow-sky-950/20'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <FileSpreadsheet size={16} />
                        <span>Excel / CSV Bulk Import</span>
                    </button>
                </div>

                {/* ── TAB 1: CURRICULUM STRUCTURE (TREE VIEW) ──────────────── */}
                {activeTab === 'tree' && (
                    <div className="space-y-6">
                        {/* SEARCH & FILTER BAR */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search subjects, chapters, or learning topics..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93] focus:border-transparent"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Grade Filter */}
                                <select
                                    value={selectedClassFilter}
                                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                                    aria-label="Filter by Grade or Class"
                                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Grades &amp; Classes</option>
                                    {availableClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                {/* Expand / Collapse */}
                                <button
                                    onClick={expandAll}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                >
                                    Expand All
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                >
                                    Collapse All
                                </button>
                            </div>
                        </div>

                        {/* HIERARCHICAL TREE CONTAINER */}
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Academic Structure &amp; Learning Hierarchy</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Click any row to view its sub-units. Use the right-hand action buttons to add chapters, topics, or edit names.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setItemModal({
                                            open: true,
                                            mode: 'add',
                                            nodeType: 'class',
                                            parent: nodes.find(n => n.type === 'board')
                                        })
                                        setItemForm({ name: '', order_index: availableClasses.length + 1 })
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                    <Plus size={15} />
                                    <span>Add Grade / Class</span>
                                </button>
                            </div>

                            {/* Render Root Nodes */}
                            <div className="pt-2">
                                {renderNodeTree(null)}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 2: PRESCRIBED SCHOOL TEXTBOOKS ─────────────────────── */}
                {activeTab === 'books' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Official Prescribed School Textbooks</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Government &amp; Board mandated curriculum textbooks prescribed for students and teachers.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setBookModal({ open: true, mode: 'add' })
                                    setBookForm({
                                        class_name: 'Class 8',
                                        subject_name: 'Mathematics',
                                        title: '',
                                        author: '',
                                        publisher: 'Gujarat State Board of School Textbooks (GSEB)',
                                        edition: '2026 Revised Edition',
                                        isbn: '',
                                        chapters_count: 14,
                                        pdf_url: '',
                                        price: 120,
                                        buy_url: '',
                                        is_prescribed: true
                                    })
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white text-xs font-bold shadow-md shadow-sky-950/20 transition-all"
                            >
                                <Plus size={16} />
                                <span>Prescribe New Textbook</span>
                            </button>
                        </div>

                        {/* TEXTBOOK CARDS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {textbooks.filter(b => b.is_prescribed).map(book => (
                                <div key={book.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                {book.class_name}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {book.subject_name}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                                                {book.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">Author: {book.author || 'Academic Council'}</p>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Publisher:</span>
                                                <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{book.publisher}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Edition:</span>
                                                <span className="font-semibold text-slate-800">{book.edition}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Chapters:</span>
                                                <span className="font-semibold text-slate-800">{book.chapters_count} Chapters</span>
                                            </div>
                                            {book.isbn && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-medium">ISBN:</span>
                                                    <span className="font-mono text-slate-800">{book.isbn}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                                        {book.pdf_url ? (
                                            <a
                                                href={book.pdf_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004B93] hover:underline"
                                            >
                                                <ExternalLink size={14} />
                                                <span>View E-Book PDF</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400">Physical Print Only</span>
                                        )}

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setBookModal({ open: true, mode: 'edit', book })
                                                    setBookForm({
                                                        class_name: book.class_name,
                                                        subject_name: book.subject_name,
                                                        title: book.title,
                                                        author: book.author || '',
                                                        publisher: book.publisher,
                                                        edition: book.edition,
                                                        isbn: book.isbn || '',
                                                        chapters_count: book.chapters_count,
                                                        pdf_url: book.pdf_url || '',
                                                        price: book.price || 0,
                                                        buy_url: book.buy_url || '',
                                                        is_prescribed: true
                                                    })
                                                }}
                                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                                                title="Edit Book Details"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ open: true, type: 'book', id: book.id, name: book.title })}
                                                className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                title="Remove Book"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TAB 3: RECOMMENDED BOOK STORE & GUIDES ─────────────────── */}
                {activeTab === 'store' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Recommended Reference Books &amp; Study Guides</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Complementary practice books, question banks (R.D. Sharma, Lakhmir Singh), and competitive exam guides.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setBookModal({ open: true, mode: 'add' })
                                    setBookForm({
                                        class_name: 'Class 8',
                                        subject_name: 'Mathematics',
                                        title: '',
                                        author: '',
                                        publisher: 'S. Chand / Dhanpat Rai',
                                        edition: 'Latest Edition',
                                        isbn: '',
                                        chapters_count: 18,
                                        pdf_url: '',
                                        price: 399,
                                        buy_url: '',
                                        is_prescribed: false
                                    })
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-950/20 transition-all"
                            >
                                <Plus size={16} />
                                <span>Add Bookstore Guide</span>
                            </button>
                        </div>

                        {/* STORE CARDS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {textbooks.filter(b => !b.is_prescribed).map(book => (
                                <div key={book.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                Reference Material
                                            </span>
                                            <span className="font-black text-slate-900 text-lg">₹{book.price}</span>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                                                {book.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">Author: {book.author || 'Renowned Faculty'}</p>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Grade / Class:</span>
                                                <span className="font-semibold text-slate-800">{book.class_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Subject:</span>
                                                <span className="font-semibold text-slate-800">{book.subject_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Publisher:</span>
                                                <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{book.publisher}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Links */}
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                                        {book.buy_url ? (
                                            <a
                                                href={book.buy_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                                            >
                                                <ShoppingBag size={14} />
                                                <span>Buy Online</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">Available at School Counter</span>
                                        )}

                                        <button
                                            onClick={() => setDeleteModal({ open: true, type: 'book', id: book.id, name: book.title })}
                                            className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TAB 4: BULK UPLOAD & EXCEL IMPORT ──────────────────────── */}
                {activeTab === 'bulk' && (
                    <div className="max-w-4xl bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Bulk Syllabus Import from Excel / CSV</h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Quickly upload complete academic structures for all grades at once. The system automatically creates Classes, Subjects, Chapters, and Topics in hierarchical order.
                            </p>
                        </div>

                        {/* 3 Step Instruction Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="w-7 h-7 rounded-lg bg-[#004B93] text-white flex items-center justify-center font-black text-xs">1</div>
                                <h4 className="font-bold text-slate-900 text-sm">Download Template</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Download our pre-formatted CSV template with standard column headers.</p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004B93] hover:underline pt-1"
                                >
                                    <Download size={14} />
                                    <span>Download .CSV Template</span>
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-black text-xs">2</div>
                                <h4 className="font-bold text-slate-900 text-sm">Prepare Your Data</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Enter your Class names, Subjects, Chapters, and optional Topics for each grade.</p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs">3</div>
                                <h4 className="font-bold text-slate-900 text-sm">Upload &amp; Verify</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Upload the file, preview the verified rows, and import them with one click.</p>
                            </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-sky-500 transition-colors bg-slate-50/50">
                            <FileSpreadsheet className="mx-auto text-slate-400 mb-3" size={40} />
                            <h4 className="font-bold text-slate-800 text-sm">Upload your Excel or CSV syllabus file</h4>
                            <p className="text-xs text-slate-500 mt-1 mb-4">Supports .CSV, .XLSX files containing Class, Subject, Chapter columns</p>
                            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                                <Upload size={16} />
                                <span>Choose File</span>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                            {bulkFileName && (
                                <p className="text-xs font-bold text-emerald-700 mt-3 flex items-center justify-center gap-1.5">
                                    <CheckCircle size={14} /> Selected: {bulkFileName} ({bulkRows.length} rows parsed)
                                </p>
                            )}
                        </div>

                        {/* Preview Table */}
                        {bulkRows.length > 0 && (
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-900 text-sm">Pre-Import Data Preview ({bulkRows.length} items)</h4>
                                    <button
                                        onClick={handleCommitBulkImport}
                                        disabled={bulkUploading}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all"
                                    >
                                        {bulkUploading ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                                        <span>Import All Items into School Syllabus</span>
                                    </button>
                                </div>

                                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs text-slate-700">
                                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
                                            <tr>
                                                <th className="p-3">Class / Grade</th>
                                                <th className="p-3">Course Subject</th>
                                                <th className="p-3">Chapter / Unit</th>
                                                <th className="p-3">Topic (Optional)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bulkRows.slice(0, 30).map((r, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="p-3 font-semibold text-slate-900">{r.Class || r.class_name}</td>
                                                    <td className="p-3">{r.Subject || r.subject_name}</td>
                                                    <td className="p-3 text-slate-600">{r.Chapter || r.chapter_name || '—'}</td>
                                                    <td className="p-3 text-slate-500">{r.Topic || r.topic_name || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {bulkRows.length > 30 && (
                                    <p className="text-[11px] text-slate-400 text-center">... and {bulkRows.length - 30} more items ready for import</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── MODAL 1: ADD / EDIT CURRICULUM ITEM ───────────────────────── */}
            {itemModal.open && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-extrabold text-slate-900 text-lg">
                                {itemModal.mode === 'edit' ? 'Edit Curriculum Item' : `Add New ${TYPE_META[itemModal.nodeType].label.split('/')[0]}`}
                            </h3>
                            <button onClick={() => setItemModal({ open: false, mode: 'add', nodeType: 'class' })} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                            {itemModal.parent && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                                    <span className="text-slate-400 font-medium">Adding under: </span>
                                    <strong className="text-slate-800">{itemModal.parent.name}</strong> ({TYPE_META[itemModal.parent.type].label})
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    {TYPE_META[itemModal.nodeType].label} Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={`e.g. ${itemModal.nodeType === 'class' ? 'Class 10' : itemModal.nodeType === 'subject' ? 'Mathematics' : itemModal.nodeType === 'chapter' ? 'Chapter 1: Real Numbers' : 'Introduction & Concepts'}`}
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Display Sequence Order
                                </label>
                                <input
                                    type="number"
                                    value={itemForm.order_index}
                                    onChange={(e) => setItemForm({ ...itemForm, order_index: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setItemModal({ open: false, mode: 'add', nodeType: 'class' })}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white text-xs font-bold shadow-md shadow-sky-950/20"
                                >
                                    {saving ? 'Saving...' : 'Save Curriculum Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: ADD / EDIT TEXTBOOK ─────────────────────────────── */}
            {bookModal.open && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="font-extrabold text-slate-900 text-lg">
                                {bookModal.mode === 'edit' ? 'Edit Textbook Information' : 'Prescribe / Add New Textbook'}
                            </h3>
                            <button onClick={() => setBookModal({ open: false, mode: 'add' })} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grade / Class *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Class 8"
                                        value={bookForm.class_name}
                                        onChange={(e) => setBookForm({ ...bookForm, class_name: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mathematics"
                                        value={bookForm.subject_name}
                                        onChange={(e) => setBookForm({ ...bookForm, subject_name: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Book Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Gujarat Board Standard Mathematics Class 8"
                                    value={bookForm.title}
                                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Publisher *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. GSEB Board / NCERT"
                                        value={bookForm.publisher}
                                        onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Author</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Editorial Board"
                                        value={bookForm.author}
                                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Edition</label>
                                    <input
                                        type="text"
                                        placeholder="2026 Edition"
                                        value={bookForm.edition}
                                        onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chapters</label>
                                    <input
                                        type="number"
                                        value={bookForm.chapters_count}
                                        onChange={(e) => setBookForm({ ...bookForm, chapters_count: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={bookForm.price}
                                        onChange={(e) => setBookForm({ ...bookForm, price: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Online PDF Link (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={bookForm.pdf_url}
                                    onChange={(e) => setBookForm({ ...bookForm, pdf_url: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setBookModal({ open: false, mode: 'add' })}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white text-xs font-bold shadow-md"
                                >
                                    {saving ? 'Saving...' : 'Save Textbook'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL 3: SWITCH BOARD CURRICULUM ─────────────────────────── */}
            {boardModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-lg">Select School Board</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Switch your school's active primary curriculum.</p>
                            </div>
                            <button onClick={() => setBoardModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            {standardBoards.map(board => (
                                <button
                                    key={board.id}
                                    onClick={() => handleSelectBoard(board.id)}
                                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                                        metrics.activeBoard === board.name 
                                            ? 'border-[#004B93] bg-sky-50/60 ring-2 ring-[#004B93]/20' 
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                            <Globe size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{board.name}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Standard Academic Curriculum</p>
                                        </div>
                                    </div>
                                    {metrics.activeBoard === board.name && (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                                            <Check size={12} /> Active
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 4: DELETE CONFIRMATION ─────────────────────────────── */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-base">Remove {deleteModal.name}?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Are you sure you want to remove this from your school syllabus? Any sub-items under this will also be removed.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setDeleteModal({ open: false, type: 'node', id: '', name: '' })}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                            >
                                Confirm Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
