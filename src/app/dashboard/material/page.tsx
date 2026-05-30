'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
    FileText, Video, Book, UploadCloud, Download, Search, 
    MoreVertical, Trash2, Plus, Filter, Loader2, Sparkles, CheckCircle,
    Database, ShieldCheck, LayoutGrid, FileSearch, Trash, 
    HardDrive, Globe, Info, Clock, ChevronDown, MonitorPlay,
    Share2, ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ── TYPES ────────────────────────────────────────────────
type Material = { 
    id: string; 
    title: string; 
    type: string; 
    subject: string; 
    class_name: string; 
    file_url?: string; 
    file_size?: string; 
    created_at: string; 
}
const COLORS = {
    primary: '#004B93',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    border: '#E2E8F0',
    bg: '#F8FAFC'
}
// ── MAIN APPLICATION ────────────────────────────────────────────
export default function InstitutionalAssetVault() {
    const [tab, setTab] = useState<'all' | 'pdf' | 'video' | 'notes' | 'assignment'>('all')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [materials, setMaterials] = useState<Material[]>([])
    const [showModal, setShowModal] = useState(false)
    const [newAsset, setNewAsset] = useState({ title: '', subject: 'General', class: 'Standard 10', type: 'pdf' })
    const [file, setFile] = useState<File | null>(null)
    const supabase = createClient()
    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
    }
    const fetchMaterials = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/dashboard/material?type=${tab}&search=${encodeURIComponent(search)}`)
            const data = await res.json()
            if (res.ok) setMaterials(data || [])
            else throw new Error(data.error)
        } catch (e: any) {
            showToast(e.message, false)
        } finally { setLoading(false) }
    }, [tab, search])
    useEffect(() => {
        fetchMaterials()
    }, [fetchMaterials])
    const handleUpload = async () => {
        if (!file || !newAsset.title) return showToast('Complete all vectors before deployment.', false)
        setUploading(true)
        try {
            // 1. Storage Upload
            const ext = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
            const { data: sData, error: sErr } = await supabase.storage
                .from('study-materials')
                .upload(fileName, file)
            if (sErr) throw sErr
            // 2. Metadata Indexing
            const payload = {
                title: newAsset.title,
                type: newAsset.type,
                subject: newAsset.subject,
                class_name: newAsset.class,
                file_url: sData.path,
                file_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
            }
            const res = await fetch('/api/dashboard/material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_ASSET', payload })
            })
            if (!res.ok) throw new Error('Database indexing failure.')
            showToast('Knowledge Vector Deployed Successfully.', true)
            setShowModal(false)
            setFile(null)
            setNewAsset({ title: '', subject: 'General', class: 'Standard 10', type: 'pdf' })
            fetchMaterials()
        } catch (e: any) {
            showToast(e.message, false)
        } finally { setUploading(false) }
    }
    const handleDelete = async (id: string) => {
        if (!confirm('Confirm decommissioning of this academic resource?')) return
        try {
            const res = await fetch('/api/dashboard/material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_ASSET', payload: { id } })
            })
            if (res.ok) {
                showToast('Asset Decommissioned.', true)
                fetchMaterials()
            } else throw new Error()
        } catch { showToast('Decommissioning Sequence Fault.', false) }
    }
    const getIcon = (type: string) => {
        if (type === 'pdf') return <FileSearch size={24} color={COLORS.danger} />
        if (type === 'video') return <MonitorPlay size={24} color={COLORS.primary} />
        if (type === 'notes') return <Book size={24} color={COLORS.warning} />
        return <Sparkles size={24} color={COLORS.success} />
    }
    const totalStorage = (materials.reduce((a, b) => a + parseFloat(b.file_size || '0'), 0)).toFixed(1)
    const storagePercent = Math.min((parseFloat(totalStorage) / 1000) * 100, 100) // Assuming 1GB soft limit
    return (
        <div style={{ padding: '40px 48px', background: COLORS.bg, minHeight: '100vh', position: 'relative', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .hover-scale { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .hover-scale:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
                .tab-item { padding: 10px 20px; border: none; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 4px 30px rgba(0,0,0,0.02); }
                .badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 6px; }
            `}</style>
            {/* TOAST SYSTEM */}
            {toast && (
                <div style={{ position: 'fixed', top: 32, right: 32, background: toast.ok ? '#064E3B' : '#7F1D1D', border: `1px solid ${toast.ok ? COLORS.success : COLORS.danger}40`, borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 10000, animation: 'scaleIn 0.3s ease-out' }}>
                    {toast.ok ? <ShieldCheck size={20} color={COLORS.success} /> : <Trash size={20} color={COLORS.danger} />}
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>{toast.msg}</span>
                </div>
            )}
            {/* DEPLOYMENT MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 8000 }}>
                    <div style={{ background: '#FFF', padding: 40, borderRadius: 32, width: 500, boxShadow: '0 40px 80px rgba(0,0,0,0.2)', animation: 'scaleIn 0.25s ease-out', border: '1px solid rgba(255,255,255,0.8)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 1000, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Deploy Resource Vector</h2>
                                <p style={{ fontSize: 14, color: COLORS.slate, margin: '6px 0 0', fontWeight: 600 }}>Initialize institutional curriculum synchronization.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} color={COLORS.slate} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Asset Identification</label>
                                <input type="text" placeholder="e.g. Advanced Calculus Lecture Notes" value={newAsset.title} onChange={e => setNewAsset({ ...newAsset, title: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: 16, border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: 15, fontWeight: 600, color: '#0F172A', background: '#F8FAFC' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Subject Vertical</label>
                                    <input type="text" placeholder="Mathematics" value={newAsset.subject} onChange={e => setNewAsset({ ...newAsset, subject: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: 16, border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: 15, fontWeight: 600, background: '#F8FAFC' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Target Grade</label>
                                    <select value={newAsset.class} onChange={e => setNewAsset({ ...newAsset, class: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: 16, border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: 15, fontWeight: 700, color: '#0F172A', background: '#F8FAFC', appearance: 'none', cursor: 'pointer' }}>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i} value={`Standard ${i + 1}`}>Grade {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Knowledge Type</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['pdf', 'video', 'notes'].map(t => (
                                        <button key={t} onClick={() => setNewAsset({...newAsset, type: t})} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${newAsset.type === t ? COLORS.primary : COLORS.border}`, background: newAsset.type === t ? `${COLORS.primary}08` : '#FFF', color: newAsset.type === t ? COLORS.primary : COLORS.slate, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', transition: '0.2s' }}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ padding: 24, border: `2px dashed ${COLORS.border}`, borderRadius: 20, textAlign: 'center', background: '#F9FAFB' }}>
                                <input 
                                    type="file" 
                                    id="file-upload" 
                                    hidden 
                                    onChange={e => setFile(e.target.files?.[0] || null)} 
                                />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                                    <UploadCloud size={32} color={COLORS.slate} style={{ marginBottom: 12 }} />
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{file ? file.name : 'Select Curriculum Physics Vector'}</div>
                                    <div style={{ fontSize: 11, color: COLORS.slate, marginTop: 4, fontWeight: 600 }}>Maximum authorized payload: 50MB</div>
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', background: '#F1F5F9', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 800, color: '#475569', cursor: 'pointer' }}>Cancel Sequence</button>
                            <button onClick={handleUpload} disabled={uploading} style={{ flex: 1.5, padding: '16px', background: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 900, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0, 75, 147, 0.15)' }}>
                                {uploading ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />} Deploy Vector
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* HEADER & ANALYTICS */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, animation: 'fadeInUp 0.5s ease-out' }}>
                <div>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#111827', color: '#FFF', borderRadius: 8, fontSize: 11, fontWeight: 900, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <Database size={12} fill="#FFF" stroke="none" /> Institutional Asset Vault
                    </div>
                    <h1 style={{ margin: 0, fontSize: 38, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.04em' }}>Curriculum Knowledge Repository</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 16, color: COLORS.slate, fontWeight: 500 }}>High-fidelity synchronization of academic resource vectors and curriculum assets.</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                     <div className="glass-card" style={{ padding: '12px 24px', borderRadius: 18, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vault Integrity</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <div style={{ width: 100, height: 6, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                                    <div style={{ width: `${storagePercent}%`, height: '100%', background: COLORS.primary }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#0F172A' }}>{totalStorage}MB Used</span>
                            </div>
                        </div>
                        <div style={{ width: 1, height: 32, background: COLORS.border }} />
                        <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #004B93 0%, #1FAC63 100%)', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 900, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0, 75, 147, 0.15)' }}>
                            <Plus size={18} /> Deploy Knowledge Vector
                        </button>
                    </div>
                </div>
            </header>
            {/* FILTER ORBIT */}
            <div className="glass-card" style={{ padding: '20px 24px', borderRadius: 24, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 32 }}>
                <div style={{ display: 'flex', gap: 6, background: '#F8FAFC', padding: 6, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                    {[
                        { id: 'all', lbl: 'Global Vault' },
                        { id: 'pdf', lbl: 'PDF Vectors' },
                        { id: 'video', lbl: 'Video Lectures' },
                        { id: 'notes', lbl: 'Curriculum Notes' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)} className="tab-item" style={{ background: tab === t.id ? '#FFF' : 'transparent', color: tab === t.id ? COLORS.primary : COLORS.slate, boxShadow: tab === t.id ? '0 4px 10px rgba(0,0,0,0.04)' : 'none' }}>{t.lbl}</button>
                    ))}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} color={COLORS.slate} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search global repository by identifier, subject vertical, or metadata..."
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 18, border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: 14, fontWeight: 600, color: '#0F172A', background: '#F8FAFC' }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '12px 16px', background: '#FFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, color: COLORS.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800 }}>
                        <Filter size={18} /> Global Catalog
                    </button>
                    <button onClick={fetchMaterials} style={{ padding: 12, borderRadius: 16, background: `${COLORS.primary}08`, border: 'none', color: COLORS.primary, cursor: 'pointer' }}>
                        <RefreshCcw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>
            {/* ASSET GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', padding: 140, textAlign: 'center' }}>
                        <Loader2 size={48} color={COLORS.primary} className="spin" style={{ margin: '0 auto' }} />
                        <div style={{ marginTop: 16, fontSize: 12, fontWeight: 900, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Parsing Institutional Assets...</div>
                    </div>
                ) : materials.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: 120, textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `1px solid ${COLORS.border}` }}>
                            <FileSearch size={32} color={COLORS.slate} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Asset Rotation Null</h3>
                        <p style={{ margin: '8px 0 0', fontSize: 15, color: COLORS.slate, fontWeight: 600 }}>Start by deploying your first knowledge vector to the institutional vault.</p>
                        <button onClick={() => setShowModal(true)} style={{ marginTop: 24, padding: '12px 28px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Initialize Deployment</button>
                    </div>
                ) : materials.map(m => (
                    <div key={m.id} className="glass-card hover-scale" style={{ padding: 28, borderRadius: 32, animation: 'fadeInUp 0.4s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.border}` }}>
                                {getIcon(m.type)}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleDelete(m.id)} style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', border: 'none', color: COLORS.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Decommission Asset">
                                    <Trash2 size={16} />
                                </button>
                                <button style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 1000, color: '#0F172A', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            <span className="badge" style={{ background: `${COLORS.primary}10`, color: COLORS.primary }}>
                                <Book size={10} /> {m.subject}
                            </span>
                            <span className="badge" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: COLORS.slate }}>
                                <Globe size={10} /> {m.class_name}
                            </span>
                        </div>
                        <div style={{ height: 1, background: `linear-gradient(90deg, ${COLORS.border}, transparent)`, marginBottom: 20 }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: COLORS.slate, fontWeight: 700 }}>
                                    <Clock size={12} /> {new Date(m.created_at).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: COLORS.slate, fontWeight: 900, marginTop: 4 }}>
                                    <HardDrive size={12} /> {m.file_size} Payload
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/study-materials/${m.file_url}`, '_blank')} style={{ padding: '10px 18px', borderRadius: 12, background: COLORS.primary, color: '#FFF', border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <MonitorPlay size={14} /> View
                                </button>
                                <button style={{ width: 40, height: 40, borderRadius: 12, background: '#F1F5F9', border: 'none', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* SYNC CONSOLE */}
            <div style={{ marginTop: 60, padding: 32, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 36, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: '100%', background: 'radial-gradient(circle at 100% 0%, rgba(0, 75, 147, 0.2) 0%, transparent 70%)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.success, boxShadow: `0 0 15px ${COLORS.success}` }} />
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Institutional Infrastructure Online</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 1000, color: '#FFF' }}>{materials.length}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 4 }}>Curriculum Vectors Indexed</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 1000, color: '#FFF' }}>{totalStorage} MB</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 4 }}>Aggregated Vault Volume</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 1000, color: '#FFF' }}>Synchronized</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 4 }}>Cloud Distribution Status</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                             <button style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#FFF', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Share2 size={16} color={COLORS.primary} /> Node Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
function RefreshCcw({ size, className }: any) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
}
