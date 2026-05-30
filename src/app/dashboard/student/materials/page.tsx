'use client'
import React, { useState, useEffect } from 'react'
import { 
    BookOpen, Search, Download, Eye, 
    FileText, Video, Folder, Filter, 
    ChevronRight, Loader2, Sparkles, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
export default function StudentStudyVault() {
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeSubject, setActiveSubject] = useState('All')
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await fetch('/api/dashboard/material')
                const data = await res.json()
                setMaterials(data || [])
            } finally {
                setLoading(false)
            }
        }
        fetchMaterials()
    }, [])
    const subjects = ['All', ...new Set(materials.map(m => m.subject))]
    const filtered = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.subject.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSubject = activeSubject === 'All' || m.subject === activeSubject
        return matchesSearch && matchesSubject
    })
    if (loading) return (
        <div style={{ padding: 100, textAlign: 'center' }}>
            <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )
    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                   <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.04em' }}>Study Materials & Resources</h1>
                   <p style={{ margin: '8px 0 0', fontSize: 15, color: '#64748B', fontWeight: 600 }}>Access your class notes, assignments, and shared academic resources in one organized place.</p>
                </div>
                <div style={{ width: 400, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
                     <input 
                        type="text" 
                        placeholder="Search study materials..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', height: 48, padding: '0 16px 0 44px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#0F172A' }}
                    />
                </div>
            </div>
            {/* SUBJECT FILTER FEED */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 10 }}>
                {subjects.map(sub => (
                    <button 
                        key={sub}
                        onClick={() => setActiveSubject(sub)}
                        style={{ 
                              padding: '12px 24px', borderRadius: 14, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                            background: activeSubject === sub ? 'var(--color-primary-gradient)' : '#FFF',
                            color: activeSubject === sub ? '#FFF' : '#64748B',
                            boxShadow: activeSubject === sub ? 'var(--shadow-primary)' : '0 1px 4px rgba(0,0,0,0.02)',
                            transition: 'all 0.1s'
                        }}
                    >
                        {sub}
                    </button>
                ))}
            </div>
            {/* MATERIALS GRID */}
            {filtered.length === 0 ? (
                 <div style={{ padding: 100, textAlign: 'center', background: '#FFF', borderRadius: 32, border: '1px dashed #E2E8F0' }}>
                    <AlertCircle size={32} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
                     <div style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>No study materials found for your search.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {filtered.map(mat => (
                        <div key={mat.id} style={{ background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', padding: 32, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 52, height: 52, background: '#F0F9FF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {mat.type === 'video' ? <Video size={24} color="#0EA5E9" /> : <FileText size={24} color="#0EA5E9" />}
                                </div>
                                 <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-primary)', background: 'var(--color-primary-bg)', padding: '6px 12px', borderRadius: 8 }}>{mat.subject}</div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                 <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{mat.title}</h3>
                                  <p style={{ margin: '12px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600, lineHeight: 1.5 }}>Study material for {mat.subject} - {mat.academic_year || 'Academic Year 2026'}.</p>
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button onClick={() => window.open(mat.file_url, '_blank')} style={{ flex: 1, padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#0F172A', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Eye size={16} /> Preview
                                </button>
                                 <button onClick={() => window.open(mat.file_url, '_blank')} style={{ padding: '12px', background: 'var(--color-primary-gradient)', border: 'none', borderRadius: 12, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', boxShadow: 'var(--shadow-primary)' }}>
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
