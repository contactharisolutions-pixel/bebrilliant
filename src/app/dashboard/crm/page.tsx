'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Users, Search, PlusCircle, UploadCloud, Target, Headset, CheckCircle,
    XCircle, Loader2, ArrowRight, Download, Inbox, UserCheck, ShieldCheck, Mail, Phone, Building
} from 'lucide-react'

// ── TYPES ─────────────────────────────────────────────────────────────
type Lead = {
    id: string
    name: string
    email: string
    phone: string
    status: string
    lead_score: number
    created_at: string
    source: string
    organization?: string
}

const STAGES = [
    { id: 'lead', title: 'New Inquiries', icon: Inbox, color: '#3B82F6', bg: '#EFF6FF', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'inquiry', title: 'Follow-ups & Counseling', icon: Headset, color: '#F59E0B', bg: '#FFFBEB', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'enrolled', title: 'Fee & Admission Ready', icon: Target, color: '#10B981', bg: '#ECFDF5', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'student', title: 'Confirmed Students', icon: ShieldCheck, color: '#1FAC63', bg: '#F5F3FF', badgeBg: 'bg-green-50 text-green-700 border-green-200' }
]

// ── MODAL COMPONENT ───────────────────────────────────────────────────
function Modal({
    title,
    onClose,
    children,
    onSubmit,
    saving,
    saveText = 'Save',
    maxWidth = 540
}: {
    title: string
    onClose: () => void
    children: React.ReactNode
    onSubmit: () => void
    saving: boolean
    saveText?: string
    maxWidth?: number
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
                style={{ maxWidth }}
            >
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500"
                        aria-label="Close modal"
                    >
                        <XCircle size={18} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">{children}</div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={saving}
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {saveText}
                    </button>
                </div>
            </div>
        </div>
    )
}

function FormInput({
    label,
    value,
    onChange,
    placeholder = '',
    type = 'text',
    required = false
}: {
    label: string
    value: string
    onChange: (val: string) => void
    placeholder?: string
    type?: string
    required?: boolean
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
        </div>
    )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function CRMBoard() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        source: 'Manual Entry'
    })
    const [csvContent, setCsvContent] = useState<string>('')

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/crm')
            const json = await res.json()
            if (res.ok) {
                setLeads(json || [])
                if (json && json.length > 0 && 'organization' in json[0]) {
                    setIsOwner(true)
                }
            }
        } catch (e: any) {
            console.error('Failed to load inquiries:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLeads()
    }, [fetchLeads])

    const apiAction = async (action: string, payload: any) => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Action failed')
            await fetchLeads()
            showToast('Inquiry updated successfully', true)
            return { success: true }
        } catch (e: any) {
            showToast(e.message || 'Action failed', false)
            return { success: false }
        } finally {
            setSaving(false)
        }
    }

    const handleCreate = async () => {
        if (!form.name || !form.email) {
            return showToast('Student name and email are required', false)
        }
        const { success } = await apiAction('CREATE_LEAD', form)
        if (success) {
            setShowAddModal(false)
            setForm({ name: '', email: '', phone: '', organization: '', source: 'Manual Entry' })
        }
    }

    const handleStatusChange = async (id: string, currentStatus: string) => {
        const currentIndex = STAGES.findIndex(s => s.id === currentStatus)
        if (currentIndex === -1 || currentIndex === STAGES.length - 1) return
        const nextStage = STAGES[currentIndex + 1]
        if (confirm(`Move this student inquiry to "${nextStage.title}"?`)) {
            apiAction('UPDATE_STATUS', { id, status: nextStage.id })
        }
    }

    const handleBulkUpload = async () => {
        if (!csvContent.trim()) {
            return showToast('Please enter or paste CSV data', false)
        }
        const lines = csvContent.trim().split('\n')
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
        if (!headers.includes('name') || !headers.includes('email')) {
            return showToast('CSV must include "name" and "email" columns', false)
        }
        const payload = lines.slice(1).map(line => {
            const vals = line.split(',')
            const row: any = {}
            headers.forEach((h, i) => {
                row[h] = vals[i]?.trim() || ''
            })
            return row
        }).filter(r => r.name && r.email)

        if (payload.length === 0) {
            return showToast('No valid student inquiry rows found in CSV', false)
        }
        const { success } = await apiAction('BULK_CREATE_LEADS', payload)
        if (success) {
            setShowBulkModal(false)
            setCsvContent('')
        }
    }

    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.toLowerCase().includes(search.toLowerCase()) ||
        (l as any).organization?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="w-full min-h-screen bg-slate-50/50 p-6 sm:p-8 lg:p-10 space-y-8">
            {/* TOAST SYSTEM */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[10000] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 ${
                    toast.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                    {toast.ok ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <XCircle size={18} className="text-rose-600 shrink-0" />}
                    <span className="text-sm font-bold">{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Admissions & Inquiries CRM
                        </h1>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                            {isOwner ? 'Multi-Branch Active' : 'School Admissions'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Track student inquiries, follow up with parents, and advance admissions from first contact to confirmed enrollment.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setCsvContent('name,email,phone,organization\nRohan Sharma,rohan.parent@example.com,9876543210,Main Branch')
                            setShowBulkModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <UploadCloud size={17} className="text-slate-500" />
                        Import CSV
                    </button>
                    <button
                        onClick={() => {
                            setForm({ name: '', email: '', phone: '', organization: '', source: 'Manual Entry' })
                            setShowAddModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-500/20 transition-all"
                    >
                        <PlusCircle size={17} />
                        Add New Inquiry
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search inquiries by student name, parent email, phone number, or branch..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
                />
            </div>

            {/* KANBAN BOARD - FULL WIDTH */}
            {loading && leads.length === 0 ? (
                <div className="py-28 flex flex-col items-center justify-center">
                    <Loader2 size={36} className="animate-spin text-emerald-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Loading student inquiries...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                    {STAGES.map(stage => {
                        const stageLeads = filteredLeads.filter(
                            l => l.status === stage.id || (stage.id === 'lead' && l.status === 'new')
                        )
                        return (
                            <div key={stage.id} className="flex flex-col bg-slate-100/60 rounded-2xl p-4 border border-slate-200/80 min-h-[500px]">
                                {/* STAGE HEADER */}
                                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: stage.bg }}
                                        >
                                            <stage.icon size={17} style={{ color: stage.color }} />
                                        </div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                            {stage.title}
                                        </h3>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                        {stageLeads.length}
                                    </span>
                                </div>

                                {/* LEADS LIST */}
                                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                                    {stageLeads.map(l => (
                                        <div
                                            key={l.id}
                                            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                                        {l.name}
                                                    </h4>
                                                    {(l as any).organization && (
                                                        <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                            {(l as any).organization}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                                    {l.lead_score || 0}% Score
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-slate-600">
                                                <div className="flex items-center gap-2 truncate">
                                                    <Mail size={13} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{l.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={13} className="text-slate-400 shrink-0" />
                                                    <span>{l.phone || 'No phone provided'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                                                <div className="text-[11px] text-slate-400">
                                                    Added {new Date(l.created_at).toLocaleDateString()}
                                                </div>

                                                {stage.id !== 'student' ? (
                                                    <button
                                                        onClick={() => handleStatusChange(l.id, l.status)}
                                                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white flex items-center justify-center transition-all border border-emerald-200 hover:border-emerald-600"
                                                        title="Advance to next stage"
                                                    >
                                                        <ArrowRight size={14} />
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                        <CheckCircle size={12} />
                                                        Confirmed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {stageLeads.length === 0 && (
                                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs font-semibold text-slate-400">
                                            No inquiries in this stage
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ADD INQUIRY MODAL */}
            {showAddModal && (
                <Modal
                    title="Add Student Inquiry"
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleCreate}
                    saving={saving}
                    saveText="Save Inquiry"
                >
                    <p className="text-xs text-slate-500 mb-4">
                        Register a new student inquiry or admission lead into your admissions pipeline.
                    </p>
                    <FormInput
                        label="Student / Parent Name"
                        value={form.name}
                        onChange={v => setForm({ ...form, name: v })}
                        placeholder="e.g. Aryan Sharma"
                        required
                    />
                    <FormInput
                        label="Parent Email Address"
                        type="email"
                        value={form.email}
                        onChange={v => setForm({ ...form, email: v })}
                        placeholder="parent@example.com"
                        required
                    />
                    <FormInput
                        label="Contact Phone Number"
                        type="tel"
                        value={form.phone}
                        onChange={v => setForm({ ...form, phone: v })}
                        placeholder="+91 98765 43210"
                    />
                    {isOwner && (
                        <FormInput
                            label="School / Branch Name"
                            value={form.organization}
                            onChange={v => setForm({ ...form, organization: v })}
                            placeholder="e.g. North Campus"
                        />
                    )}
                </Modal>
            )}

            {/* BULK CSV MODAL */}
            {showBulkModal && (
                <Modal
                    title="Import Student Inquiries from CSV"
                    onClose={() => setShowBulkModal(false)}
                    onSubmit={handleBulkUpload}
                    saving={saving}
                    saveText="Import Inquiries"
                    maxWidth={680}
                >
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                            Paste comma-separated rows. Required header row format:
                            <code className="ml-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">
                                name, email, phone, organization
                            </code>
                        </p>
                        <textarea
                            value={csvContent}
                            onChange={e => setCsvContent(e.target.value)}
                            rows={8}
                            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="name,email,phone,organization&#10;Rohan Sharma,rohan@example.com,9876543210,Main Branch"
                        />
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                            <span>Supported columns: <strong>name</strong>, <strong>email</strong>, <strong>phone</strong>, and optional <strong>organization</strong>.</span>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}