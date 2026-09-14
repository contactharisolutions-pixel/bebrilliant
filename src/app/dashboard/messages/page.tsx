'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Bell,
    BellRing,
    Pin,
    AlertCircle,
    Calendar,
    Clock,
    Download,
    Search,
    Filter,
    Plus,
    Trash2,
    CheckCircle2,
    FileText,
    Users,
    Paperclip,
    Send,
    Eye,
    X,
    Sparkles,
    RefreshCw,
    Archive,
    ShieldAlert,
    ExternalLink,
    GraduationCap,
    School,
    Building2,
    MessageSquare,
    UserCircle,
    Printer,
    Megaphone
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────
interface SchoolNotice {
    id: string
    tenant_id: string
    title: string
    category: string
    priority: 'Normal' | 'Important' | 'Urgent'
    target_audience: string
    content: string
    attachment_url?: string | null
    attachment_name?: string | null
    attachment_size?: string | null
    publish_date: string
    expiry_date?: string | null
    is_pinned: boolean
    status: 'Published' | 'Archived' | 'Draft'
    views_count: number
    created_at: string
    author_name?: string | null
    author_role?: string | null
}

interface NoticeStats {
    total_notices: number
    active_notices: number
    urgent_alerts: number
    pinned_notices: number
    audiences_covered: number
}

interface ClassItem {
    id: string
    name: string
}

interface FacultyProfile {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    metadata?: any
}

interface ChatMessage {
    id: string
    sender_id: string
    recipient_id?: string
    group_id?: string
    content: string
    created_at: string
    sender_name?: string
}

export default function NoticeBoardDashboard() {
    // ── STATE ────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'board' | 'publish' | 'broadcast' | 'archive'>('board')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedPriority, setSelectedPriority] = useState('all')
    const [selectedAudience, setSelectedAudience] = useState('all')

    const [notices, setNotices] = useState<SchoolNotice[]>([])
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [faculty, setFaculty] = useState<FacultyProfile[]>([])
    const [stats, setStats] = useState<NoticeStats>({
        total_notices: 0,
        active_notices: 0,
        urgent_alerts: 0,
        pinned_notices: 0,
        audiences_covered: 0
    })

    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null)

    // Modals
    const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null)

    // Publish Form State
    const [formData, setFormData] = useState({
        title: '',
        category: 'Academic & Exams',
        priority: 'Normal' as 'Normal' | 'Important' | 'Urgent',
        target_audience: 'All School',
        content: '',
        attachment_name: '',
        attachment_size: '1.5 MB',
        expiry_date: '',
        is_pinned: false
    })

    // Staff Broadcast Tab State
    const [selectedContact, setSelectedContact] = useState<FacultyProfile | null>(null)
    const [broadcastMsg, setBroadcastMsg] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatLoading, setChatLoading] = useState(false)

    const showToast = (msg: string, isError = false) => {
        setToast({ msg, isError })
        setTimeout(() => setToast(null), 4000)
    }

    // ── DATA FETCHING ────────────────────────────────────────────
    const fetchNotices = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (activeTab === 'archive') {
                params.append('status', 'Archived')
            } else {
                params.append('status', 'Published')
            }
            if (selectedCategory !== 'all') params.append('category', selectedCategory)
            if (selectedPriority !== 'all') params.append('priority', selectedPriority)
            if (selectedAudience !== 'all') params.append('audience', selectedAudience)
            if (searchQuery.trim()) params.append('search', searchQuery.trim())

            const res = await fetch(`/api/dashboard/messages?${params.toString()}`)
            const json = await res.json()

            if (json.success && json.data) {
                setNotices(json.data.notices || [])
                setStats(json.data.stats || {
                    total_notices: 0,
                    active_notices: 0,
                    urgent_alerts: 0,
                    pinned_notices: 0,
                    audiences_covered: 0
                })
                setClasses(json.data.classes || [])
                setFaculty(json.data.profiles || [])
                if (!selectedContact && json.data.profiles?.length > 0) {
                    setSelectedContact(json.data.profiles[0])
                }
            } else {
                throw new Error(json.error || 'Failed to load school notices')
            }
        } catch (err: any) {
            console.error('Fetch notices error:', err)
            showToast(err.message || 'Error connecting to school notice database', true)
        } finally {
            setLoading(false)
        }
    }, [activeTab, selectedCategory, selectedPriority, selectedAudience, searchQuery])

    useEffect(() => {
        fetchNotices()
    }, [fetchNotices])

    // Fetch conversation when a staff contact is selected
    const fetchConversation = useCallback(async () => {
        if (!selectedContact) return
        setChatLoading(true)
        try {
            const res = await fetch(`/api/dashboard/messages?contactId=${selectedContact.id}`)
            const data = await res.json()
            if (Array.isArray(data)) setChatMessages(data)
        } catch (e) {
            console.error('Conversation fetch error:', e)
        } finally {
            setChatLoading(false)
        }
    }, [selectedContact])

    useEffect(() => {
        if (activeTab === 'broadcast' && selectedContact) {
            fetchConversation()
        }
    }, [activeTab, selectedContact, fetchConversation])

    // ── PUBLISH NOTICE HANDLER ───────────────────────────────────
    const handlePublishNotice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title.trim() || !formData.content.trim()) {
            return showToast('Please enter both a title and circular announcement content.', true)
        }

        setActionLoading(true)
        try {
            const payload = {
                title: formData.title.trim(),
                category: formData.category,
                priority: formData.priority,
                target_audience: formData.target_audience,
                content: formData.content.trim(),
                attachment_name: formData.attachment_name.trim() || null,
                attachment_size: formData.attachment_name ? formData.attachment_size : null,
                expiry_date: formData.expiry_date || null,
                is_pinned: formData.is_pinned
            }

            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'PUBLISH_NOTICE', payload })
            })
            const json = await res.json()

            if (json.success) {
                showToast(json.message || 'Circular published successfully!')
                setFormData({
                    title: '',
                    category: 'Academic & Exams',
                    priority: 'Normal',
                    target_audience: 'All School',
                    content: '',
                    attachment_name: '',
                    attachment_size: '1.5 MB',
                    expiry_date: '',
                    is_pinned: false
                })
                setActiveTab('board')
                fetchNotices()
            } else {
                throw new Error(json.error || 'Failed to publish circular')
            }
        } catch (err: any) {
            showToast(err.message || 'Error publishing circular', true)
        } finally {
            setActionLoading(false)
        }
    }

    // ── PIN/UNPIN NOTICE ─────────────────────────────────────────
    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        setActionLoading(true)
        try {
            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOGGLE_PIN', payload: { id, is_pinned: !currentPinned } })
            })
            const json = await res.json()
            if (json.success) {
                showToast(json.message)
                fetchNotices()
            }
        } catch (e) {
            showToast('Failed to update pin status', true)
        } finally {
            setActionLoading(false)
        }
    }

    // ── ARCHIVE NOTICE ───────────────────────────────────────────
    const handleArchiveNotice = async (id: string, title: string) => {
        if (!window.confirm(`Archive "${title}"? It will be moved to past circular records.`)) return

        setActionLoading(true)
        try {
            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ARCHIVE_NOTICE', payload: { id } })
            })
            const json = await res.json()
            if (json.success) {
                showToast('Notice moved to school archive.')
                if (selectedNotice?.id === id) setSelectedNotice(null)
                fetchNotices()
            }
        } catch (e) {
            showToast('Error archiving notice', true)
        } finally {
            setActionLoading(false)
        }
    }

    // ── DELETE NOTICE ────────────────────────────────────────────
    const handleDeleteNotice = async (id: string, title: string) => {
        if (!window.confirm(`Permanently delete "${title}"? This action cannot be undone.`)) return

        setActionLoading(true)
        try {
            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_NOTICE', payload: { id } })
            })
            const json = await res.json()
            if (json.success) {
                showToast('Notice permanently deleted.')
                if (selectedNotice?.id === id) setSelectedNotice(null)
                fetchNotices()
            }
        } catch (e) {
            showToast('Error deleting notice', true)
        } finally {
            setActionLoading(false)
        }
    }

    // ── SEND STAFF BROADCAST MESSAGE ─────────────────────────────
    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!broadcastMsg.trim() || !selectedContact) return

        try {
            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SEND_MESSAGE',
                    payload: {
                        content: broadcastMsg.trim(),
                        recipient_id: selectedContact.id,
                        msg_type: 'text'
                    }
                })
            })
            if (res.ok) {
                setBroadcastMsg('')
                fetchConversation()
            }
        } catch (e) {
            showToast('Failed to send broadcast message', true)
        }
    }

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pb-24 text-slate-900">
            {/* ── FLOATING TOAST NOTIFICATION ── */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
                        toast.isError
                            ? 'bg-rose-900/90 text-white border-rose-700'
                            : 'bg-emerald-900/90 text-white border-emerald-700'
                    }`}
                >
                    {toast.isError ? <AlertCircle className="w-5 h-5 text-rose-300" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                    <span className="text-sm font-semibold">{toast.msg}</span>
                </div>
            )}

            {/* ── FULL WIDTH WORKSPACE CONTAINER ── */}
            <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-8">
                {/* ── 16:9 PHOTOGRAPHIC HERO BANNER ── */}
                <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-64 sm:h-80 w-full">
                        <Image
                            src="/assets/images/dashboard/notice_board_banner.jpg"
                            alt="School administrators and faculty reviewing official campus circulars on the institutional notice board"
                            fill
                            className="object-cover object-center"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/50 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                            <div className="max-w-2xl text-white">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
                                    <BellRing className="w-3.5 h-3.5" />
                                    Campus Communications & Circulars
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                                    School Notice Board & Official Circulars
                                </h1>
                                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                                    Broadcast official circulars, post examination timetables, announce academic events, and publish institutional alerts across your school community.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => setActiveTab('publish')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4" />
                                    Publish New Circular
                                </button>
                                <button
                                    onClick={fetchNotices}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-medium text-sm transition-all"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TOP 4 DYNAMIC KPI CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Active Circulars */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Circulars</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.active_notices}</span>
                            <span className="text-xs text-blue-600 font-medium">live notices</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Official campus announcements</p>
                    </div>

                    {/* Urgent Alerts */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Urgent & High Priority</span>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.urgent_alerts}</span>
                            <span className="text-xs text-rose-600 font-medium">critical notices</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Exams & immediate advisories</p>
                    </div>

                    {/* Pinned Circulars */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pinned to Top</span>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Pin className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.pinned_notices}</span>
                            <span className="text-xs text-amber-600 font-medium">highlighted</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Featured campus circulars</p>
                    </div>

                    {/* Audience Segments */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audience Scope</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{stats.audiences_covered || 'All'}</span>
                            <span className="text-xs text-emerald-600 font-medium">segments</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Students, parents, and faculty</p>
                    </div>
                </div>

                {/* ── TAB NAVIGATION BAR ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Tab buttons */}
                        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 gap-1 overflow-x-auto max-w-full">
                            <button
                                onClick={() => setActiveTab('board')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === 'board'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Megaphone className="w-4 h-4 text-blue-600" />
                                Active Notice Board ({stats.active_notices})
                            </button>
                            <button
                                onClick={() => setActiveTab('publish')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === 'publish'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Plus className="w-4 h-4 text-blue-600" />
                                Publish Circular
                            </button>
                            <button
                                onClick={() => setActiveTab('broadcast')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === 'broadcast'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4 text-purple-600" />
                                Staff & Department Broadcast
                            </button>
                            <button
                                onClick={() => setActiveTab('archive')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === 'archive'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Archive className="w-4 h-4 text-slate-500" />
                                Past Records Archive
                            </button>
                        </div>

                        {/* Search Input */}
                        {activeTab !== 'publish' && activeTab !== 'broadcast' && (
                            <div className="relative flex-1 max-w-lg lg:max-w-xl">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search circulars by title, circular number, category, or content..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* Secondary Filters: Category, Priority, Audience */}
                    {activeTab !== 'publish' && activeTab !== 'broadcast' && (
                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <Filter className="w-3.5 h-3.5" />
                                Filters:
                            </div>

                            {/* Category Selector */}
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="Academic & Exams">Academic & Exams</option>
                                <option value="Holiday Announcement">Holiday Announcement</option>
                                <option value="Administrative">Administrative</option>
                                <option value="Events & Sports">Events & Sports</option>
                                <option value="Emergency Alert">Emergency Alert</option>
                            </select>

                            {/* Priority Selector */}
                            <select
                                value={selectedPriority}
                                onChange={e => setSelectedPriority(e.target.value)}
                                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Priorities</option>
                                <option value="Urgent">Urgent Priority</option>
                                <option value="Important">Important</option>
                                <option value="Normal">Normal</option>
                            </select>

                            {/* Audience Selector */}
                            <select
                                value={selectedAudience}
                                onChange={e => setSelectedAudience(e.target.value)}
                                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Audiences</option>
                                <option value="All School">All School (Campus-Wide)</option>
                                <option value="All Students & Parents">All Students & Parents</option>
                                <option value="Teachers & Staff Only">Teachers & Staff Only</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>

                            {(selectedCategory !== 'all' || selectedPriority !== 'all' || selectedAudience !== 'all' || searchQuery) && (
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all')
                                        setSelectedPriority('all')
                                        setSelectedAudience('all')
                                        setSearchQuery('')
                                    }}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 underline ml-auto"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── TAB 1 & 4: ACTIVE NOTICE BOARD & ARCHIVE ── */}
                {(activeTab === 'board' || activeTab === 'archive') && (
                    <div>
                        {loading ? (
                            <div className="w-full bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-sm">
                                <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto" />
                                <h3 className="text-base font-semibold text-slate-800">Loading School Circulars...</h3>
                                <p className="text-xs text-slate-500">Connecting to PostgreSQL and fetching official announcements</p>
                            </div>
                        ) : notices.length === 0 ? (
                            <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                                    <Bell className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {activeTab === 'archive' ? 'No Archived Notices' : 'No Circulars Found'}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto">
                                    {activeTab === 'archive'
                                        ? 'No historical notices have been archived yet.'
                                        : 'No active circulars match your current search or filter criteria. Publish a new circular to get started.'}
                                </p>
                                {activeTab === 'board' && (
                                    <button
                                        onClick={() => setActiveTab('publish')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Publish New Circular
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {notices.map(notice => {
                                    const isUrgent = notice.priority === 'Urgent'
                                    const isImportant = notice.priority === 'Important'

                                    return (
                                        <div
                                            key={notice.id}
                                            className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group ${
                                                notice.is_pinned
                                                    ? 'border-blue-300 ring-1 ring-blue-200/50 bg-gradient-to-b from-blue-50/20 to-white'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div>
                                                {/* Top Row: Category + Priority + Pin */}
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {/* Category Badge */}
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                                                            {notice.category}
                                                        </span>

                                                        {/* Priority Badge */}
                                                        {isUrgent ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                <ShieldAlert className="w-3 h-3" />
                                                                Urgent
                                                            </span>
                                                        ) : isImportant ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Important
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleTogglePin(notice.id, notice.is_pinned)}
                                                            className={`p-1.5 rounded-lg transition-all ${
                                                                notice.is_pinned
                                                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                                                            }`}
                                                            title={notice.is_pinned ? 'Unpin notice' : 'Pin notice to top'}
                                                        >
                                                            <Pin className={`w-4 h-4 ${notice.is_pinned ? 'fill-current' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteNotice(notice.id, notice.title)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all"
                                                            title="Delete notice"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                                                    {notice.title}
                                                </h3>

                                                {/* Audience Pill */}
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 mb-3">
                                                    <Users className="w-3 h-3 text-slate-500" />
                                                    {notice.target_audience}
                                                </div>

                                                {/* Content Preview */}
                                                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                                                    {notice.content}
                                                </p>

                                                {/* Attachment Pill if present */}
                                                {notice.attachment_name && (
                                                    <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2 text-slate-700 font-medium truncate max-w-[200px]">
                                                            <Paperclip className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                            <span className="truncate">{notice.attachment_name}</span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-semibold flex-shrink-0">
                                                            {notice.attachment_size || 'PDF'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Row: Date & Actions */}
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {new Date(notice.publish_date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    {notice.views_count > 0 && (
                                                        <div className="text-[11px] text-slate-400">
                                                            {notice.views_count} views
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {activeTab === 'board' && (
                                                        <button
                                                            onClick={() => handleArchiveNotice(notice.id, notice.title)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Archive notice"
                                                        >
                                                            <Archive className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedNotice(notice)}
                                                        className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Read
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 2: PUBLISH SCHOOL CIRCULAR FORM ── */}
                {activeTab === 'publish' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 max-w-4xl mx-auto">
                        <div className="border-b border-slate-100 pb-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                Institutional Announcement Composer
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900">Publish Official School Circular</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Author a new administrative or academic announcement to be broadcast across campus and posted to the student and parent portal.
                            </p>
                        </div>

                        <form onSubmit={handlePublishNotice} className="space-y-6">
                            {/* Circular Title */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Circular Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Mid-Term Examination Schedule & Admit Card Distribution"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                                />
                            </div>

                            {/* Category, Priority, Target Audience */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Circular Category <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    >
                                        <option value="Academic & Exams">Academic & Exams</option>
                                        <option value="Holiday Announcement">Holiday Announcement</option>
                                        <option value="Administrative">Administrative</option>
                                        <option value="Events & Sports">Events & Sports</option>
                                        <option value="Emergency Alert">Emergency Alert</option>
                                        <option value="General">General Announcement</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Priority Level <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    >
                                        <option value="Normal">Normal Priority</option>
                                        <option value="Important">Important Announcement</option>
                                        <option value="Urgent">Urgent / Critical Action</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Target Audience <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.target_audience}
                                        onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    >
                                        <option value="All School">All School (Students, Parents & Staff)</option>
                                        <option value="All Students & Parents">All Students & Parents</option>
                                        <option value="Teachers & Staff Only">Teachers & Staff Only</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Circular Body */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Official Circular Content <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="Write the full announcement text, instructions, and regulations for the notice board..."
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                                />
                            </div>

                            {/* Expiry Date & Attachment */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Notice Expiry / Event Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Attachment Name (PDF / Timetable Sheet)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Official Examination Schedule Term 1.pdf"
                                        value={formData.attachment_name}
                                        onChange={e => setFormData({ ...formData, attachment_name: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Pin to Top Checkbox */}
                            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="pin-checkbox"
                                    checked={formData.is_pinned}
                                    onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="pin-checkbox" className="text-sm font-semibold text-slate-800 cursor-pointer">
                                    Pin this announcement to the top of the School Notice Board
                                </label>
                            </div>

                            {/* Submit and Cancel Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('board')}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2"
                                >
                                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Publish Circular to Campus
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── TAB 3: STAFF & DEPARTMENT BROADCASTS ── */}
                {activeTab === 'broadcast' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
                        {/* Contacts Sidebar */}
                        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 space-y-4 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Faculty & Department Staff</h3>
                                <p className="text-xs text-slate-500">Select a faculty member to send internal memos</p>
                            </div>

                            <div className="space-y-1.5 overflow-y-auto max-h-[500px]">
                                {faculty.map(f => {
                                    const isSelected = selectedContact?.id === f.id
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedContact(f)}
                                            className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                                            }`}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                                                }`}
                                            >
                                                {f.first_name?.[0] || 'F'}
                                            </div>
                                            <div className="truncate">
                                                <div className="text-sm font-bold truncate">
                                                    {f.first_name} {f.last_name}
                                                </div>
                                                <div
                                                    className={`text-xs capitalize truncate ${
                                                        isSelected ? 'text-blue-100' : 'text-slate-400'
                                                    }`}
                                                >
                                                    {f.role.replace('_', ' ')}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Broadcast Chat Pane */}
                        <div className="flex-1 flex flex-col justify-between p-6 bg-white">
                            {/* Pane Header */}
                            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                {selectedContact ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                                            {selectedContact.first_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900">
                                                {selectedContact.first_name} {selectedContact.last_name}
                                            </h4>
                                            <span className="text-xs text-slate-500 capitalize">
                                                {selectedContact.role.replace('_', ' ')} • Active Staff Member
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400">Select a staff contact to start messaging</span>
                                )}
                            </div>

                            {/* Message Feed */}
                            <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[400px]">
                                {chatLoading ? (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        Loading conversation...
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400 text-sm space-y-2">
                                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                                        <p>No broadcast history with this faculty member.</p>
                                        <p className="text-xs text-slate-400">Type a message below to send an administrative update.</p>
                                    </div>
                                ) : (
                                    chatMessages.map(msg => (
                                        <div key={msg.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 max-w-lg space-y-1">
                                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                <span className="font-semibold text-slate-600">{msg.sender_name || 'Staff Member'}</span>
                                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-slate-800 leading-relaxed">{msg.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Message Composer */}
                            <form onSubmit={handleSendBroadcast} className="pt-4 border-t border-slate-100 flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Type an administrative memo or faculty message..."
                                    value={broadcastMsg}
                                    onChange={e => setBroadcastMsg(e.target.value)}
                                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!broadcastMsg.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-1.5 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL: OFFICIAL SCHOOL LETTERHEAD CIRCULAR PREVIEW ── */}
            {selectedNotice && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-10 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Letterhead Header */}
                        <div className="border-b-2 border-slate-900 pb-6 text-center relative">
                            <button
                                onClick={() => setSelectedNotice(null)}
                                className="absolute top-0 right-0 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center justify-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-widest mb-1">
                                <School className="w-4 h-4" />
                                Silver Bells School • Academic Directorate
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                                Official Campus Circular
                            </h2>
                            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                                <span>Ref: CIR-{selectedNotice.id.substring(0, 8).toUpperCase()}</span>
                                <span>•</span>
                                <span>
                                    Date:{' '}
                                    {new Date(selectedNotice.publish_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-800">
                                    {selectedNotice.category}
                                </span>
                                {selectedNotice.priority === 'Urgent' ? (
                                    <span className="px-3 py-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        Urgent Priority
                                    </span>
                                ) : selectedNotice.priority === 'Important' ? (
                                    <span className="px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        Important
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
                                        Normal
                                    </span>
                                )}
                            </div>

                            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold">
                                Target: {selectedNotice.target_audience}
                            </span>
                        </div>

                        {/* Title & Body */}
                        <div className="space-y-4">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                {selectedNotice.title}
                            </h3>
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                                {selectedNotice.content}
                            </div>
                        </div>

                        {/* Attachment Download */}
                        {selectedNotice.attachment_name && (
                            <div className="p-4 rounded-2xl border border-slate-200 bg-blue-50/40 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{selectedNotice.attachment_name}</div>
                                        <div className="text-slate-500">{selectedNotice.attachment_size || 'Official Document'}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => showToast(`Downloading ${selectedNotice.attachment_name}...`)}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        )}

                        {/* Sign-off */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                <span className="block font-bold text-slate-800">
                                    {selectedNotice.author_name || 'Office of the Principal'}
                                </span>
                                <span>{selectedNotice.author_role ? selectedNotice.author_role.toUpperCase() : 'ADMINISTRATION'}</span>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print Circular
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
