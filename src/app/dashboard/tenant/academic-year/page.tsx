'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
    Calendar, TrendingUp, Users, ShieldCheck, 
    ArrowRight, CheckCircle2, AlertCircle, Save, 
    Plus, Settings2, History, Rocket, BookOpen,
    GraduationCap, RefreshCcw, Filter, Edit, X, Search,
    ChevronRight, Info
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
export default function AcademicYearPortal() {
    const [loading, setLoading] = useState(true)
    const [years, setYears] = useState([])
    const [rules, setRules] = useState<any[]>([])
    const [preview, setPreview] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'years' | 'rules' | 'promote'>('years')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
    // Form States
    const [newYear, setNewYear] = useState({ name: '', start_date: '', end_date: '', make_active: false })
    const [editingYear, setEditingYear] = useState<any>(null)
    const [targetYearId, setTargetYearId] = useState('')
    const [executing, setExecuting] = useState(false)
    const [savingRules, setSavingRules] = useState(false)
    useEffect(() => {
        fetchData()
    }, [])
    const fetchData = async () => {
        try {
            const [yRes, rRes] = await Promise.all([
                fetch('/api/dashboard/tenant/academic-year'),
                fetch('/api/dashboard/tenant/promotion/rules')
            ])
            const yData = await yRes.json()
            const rData = await rRes.json()
            setYears(yData.years || [])
            setRules(rData.rules || [])
        } catch (err) {
            console.error('Fetch error', err)
        } finally {
            setLoading(false)
        }
    }
    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/tenant/academic-year', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newYear)
            })
            const data = await res.json()
            if (res.ok) {
                alert('Academic session committed successfully.')
                setNewYear({ name: '', start_date: '', end_date: '', make_active: false })
                await fetchData()
            } else {
                alert(`Commit failed: ${data.error || 'Unknown error'}`)
            }
        } catch (err) { alert('System sync failed: Communication error') }
        finally { setLoading(false) }
    }
    const handleUpdateYear = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/tenant/academic-year', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingYear)
            })
            if (res.ok) {
                setEditingYear(null)
                await fetchData()
            }
        } catch (err) { alert('Update propagation failed') }
        finally { setLoading(false) }
    }
    const handleSaveRules = async () => {
        setSavingRules(true)
        try {
            const res = await fetch('/api/dashboard/tenant/promotion/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules })
            })
            if (res.ok) alert('Promotion rules saved.')
        } catch (err) { alert('Failed to save rules') }
        finally { setSavingRules(false) }
    }
    const fetchPreview = async (yearId: string) => {
        setTargetYearId(yearId)
        setLoading(true)
        try {
            const res = await fetch(`/api/dashboard/tenant/promotion/preview?target_id=${yearId}`)
            const data = await res.json()
            const candiates = data.preview || []
            setPreview(candiates)
            // default select all promotable
            setSelectedStudents(new Set(candiates.filter((p: any) => p.can_promote).map((p: any) => p.id)))
            setActiveTab('promote')
        } catch (err) { alert('Audit synchronization failed') }
        finally { setLoading(false) }
    }
    const executePromotion = async () => {
        if (!targetYearId) return alert('Select target academic node')
        if (selectedStudents.size === 0) return alert('No students selected for migration')
        if (!confirm(`CONFIRMATION: You are about to migrate ${selectedStudents.size} students to a new academic cycle. This is irreversible. Proceed?`)) return
        setExecuting(true)
        try {
            const payload = {
                target_academic_year_id: targetYearId,
                students_to_promote: preview
                    .filter(p => selectedStudents.has(p.id))
                    .map(p => ({
                        id: p.id,
                        new_class: p.new_class,
                        new_division: p.new_division,
                        status: 'promoted'
                    }))
            }
            const res = await fetch('/api/dashboard/tenant/promotion/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success) {
                alert(`MIGRATION COMPLETE! Promoted: ${data.summary.promoted}, Graduated: ${data.summary.graduated}`)
                setPreview([])
                setSelectedStudents(new Set())
                await fetchData()
                setActiveTab('years')
            }
        } catch (err) { alert('Execution pipeline failed') }
        finally { setExecuting(false) }
    }
    const filteredPreview = useMemo(() => {
        return preview.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.old_class.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [preview, searchQuery])
    const toggleStudent = (id: string) => {
        const next = new Set(selectedStudents)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedStudents(next)
    }
    // Custom Date Input for DD/MM/YYYY format
    const InstitutionalDateInput = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
        const pickerRef = useRef<HTMLInputElement>(null)
        // Convert YYYY-MM-DD to DD/MM/YYYY for display
        const displayValue = useMemo(() => {
            if (!value) return ''
            const [y, m, d] = value.split('-')
            return `${d}/${m}/${y}`
        }, [value])
        const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let val = e.target.value.replace(/[^0-9/]/g, '')
            if (val.length === 2 && !val.includes('/')) val += '/'
            if (val.length === 5 && val.split('/').length === 2) val += '/'
            if (val.length > 10) val = val.substring(0, 10)
            if (val.length === 10) {
                const [d, m, y] = val.split('/')
                if (parseInt(m) <= 12 && parseInt(d) <= 31) {
                    onChange(`${y}-${m}-${d}`)
                }
            }
        }
        const triggerPicker = () => {
            const picker = pickerRef.current as any;
            if (picker) {
                try {
                    if ('showPicker' in picker) {
                        picker.showPicker();
                    } else {
                        picker.click();
                    }
                } catch (e) {
                    picker.click();
                }
            }
        }
        return (
            <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' }}>{label}</label>
                <div 
                    onClick={triggerPicker}
                    style={{ position: 'relative', cursor: 'pointer' }}
                >
                    <input 
                        type="text" placeholder="DD/MM/YYYY" 
                        value={displayValue}
                        onChange={onTextChange}
                        readOnly // Prevent keyboard on mobile for this field, use picker
                        style={{ 
                            width: '100%', padding: '14px 48px 14px 18px', borderRadius: 14, border: '1px solid #E2E8F0', 
                            fontSize: 14, fontWeight: 700, color: '#0F172A', outline: 'none', cursor: 'pointer'
                        }}
                    />
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <Calendar size={18} color="#94A3B8" />
                    </div>
                    {/* Hidden Native Picker */}
                    <input 
                        ref={pickerRef}
                        type="date" 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        style={{ 
                            position: 'absolute', right: 0, top: 0, width: 0, height: 0, 
                            opacity: 0, border: 'none', padding: 0
                        }}
                    />
                </div>
            </div>
        )
    }
    if (loading && !years.length) return (
        <div style={{ padding: 100, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 32px' }} />
            <p style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Synchronizing Academic Core...</p>
        </div>
    )
    return (
        <div style={{ padding: '40px 60px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                <div>
                    <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Rocket size={32} color="var(--color-primary)" /> Academic Lifecycle Portal
                    </h1>
                    <p style={{ color: '#64748B', fontSize: 16, fontWeight: 600, marginTop: 12, maxWidth: 600 }}>Manage institutional cycles, define promotion vectors, and execute mass student migrations across academic years.</p>
                </div>
                <div style={{ background: '#FFF', padding: '10px', borderRadius: 20, border: '1px solid #E2E8F0', display: 'flex', gap: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    {(['years', 'rules', 'promote'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{ 
                                padding: '12px 24px', borderRadius: 14, border: 'none', background: activeTab === tab ? 'var(--color-primary-bg)' : 'transparent',
                                color: activeTab === tab ? 'var(--color-primary)' : '#64748B', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            {tab === 'years' && <Calendar size={18} />}
                            {tab === 'rules' && <Settings2 size={18} />}
                            {tab === 'promote' && <TrendingUp size={18} />}
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
            {/* ── CONTENT ── */}
            <div style={{ position: 'relative' }}>
                {activeTab === 'years' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 48 }}>
                        {/* FORM */}
                        <div style={{ background: '#FFF', padding: 40, borderRadius: 32, border: '1px solid #E2E8F0', height: 'fit-content', position: 'sticky', top: 40, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: 48, height: 48, background: 'var(--color-primary-bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                {editingYear ? <Edit size={24} color="var(--color-primary)" /> : <Plus size={24} color="var(--color-primary)" />}
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>{editingYear ? 'Recalibrate Cycle' : 'Initialize Session'}</h3>
                            <p style={{ color: '#64748B', fontSize: 14, fontWeight: 600, marginBottom: 32 }}>Configure the operational dates for your institution's academic timeline.</p>
                            <form onSubmit={editingYear ? handleUpdateYear : handleCreateYear}>
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cycle Designation</label>
                                    <input 
                                        type="text" required placeholder="e.g. 2024-2025"
                                        value={editingYear ? editingYear.name : newYear.name} 
                                        onChange={e => editingYear ? setEditingYear({...editingYear, name: e.target.value}) : setNewYear({...newYear, name: e.target.value})}
                                        style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1px solid #E2E8F0', fontSize: 15, fontWeight: 700, color: '#0F172A', outline: 'none', transition: 'border 0.2s' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                    <InstitutionalDateInput 
                                        label="Activation"
                                        value={editingYear ? editingYear.start_date : newYear.start_date}
                                        onChange={val => editingYear ? setEditingYear({...editingYear, start_date: val}) : setNewYear({...newYear, start_date: val})}
                                    />
                                    <InstitutionalDateInput 
                                        label="Termination"
                                        value={editingYear ? editingYear.end_date : newYear.end_date}
                                        onChange={val => editingYear ? setEditingYear({...editingYear, end_date: val}) : setNewYear({...newYear, end_date: val})}
                                    />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 16, background: '#F8FAFC', cursor: 'pointer', marginBottom: 32 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={editingYear ? editingYear.is_active : newYear.make_active} 
                                        onChange={e => editingYear ? setEditingYear({...editingYear, is_active: e.target.checked}) : setNewYear({...newYear, make_active: e.target.checked})}
                                        style={{ width: 20, height: 20, accentColor: '#014B93' }}
                                    />
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Primary Active Session</span>
                                </label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {editingYear && (
                                        <button type="button" onClick={() => setEditingYear(null)} style={{ flex: 1, height: 50, borderRadius: 14, border: '1px solid #E2E8F0', background: '#FFF', color: '#64748B', fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
                                    )}
                                    <button disabled={loading} style={{ flex: 2, height: 50, borderRadius: 14, border: 'none', background: 'var(--color-primary-gradient)', color: '#FFF', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}>
                                        {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Save size={20} />} 
                                        {editingYear ? 'PATCH SOURCE' : 'COMMIT SESSION'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        {/* LIST */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {years.length === 0 && (
                                <div style={{ padding: 60, textAlign: 'center', background: '#FFF', borderRadius: 32, border: '2px dashed #E2E8F0' }}>
                                    <Calendar size={48} color="#CBD5E1" style={{ marginBottom: 20 }} />
                                    <h4 style={{ fontSize: 18, fontWeight: 900, color: '#64748B' }}>No Academic Cycles Initialized</h4>
                                    <p style={{ color: '#94A3B8', fontSize: 14 }}>Begin by designating your institution's primary operational session.</p>
                                </div>
                            )}
                            {years.map((y: any) => (
                                <div key={y.id} style={{ 
                                    background: '#FFF', padding: 32, borderRadius: 32, 
                                    border: y.is_active ? '2px solid var(--color-primary)' : '1px solid #E2E8F0', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    boxShadow: y.is_active ? '0 10px 15px -3px rgba(1,75,147,0.1)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                        <div style={{ width: 64, height: 64, background: y.is_active ? 'var(--color-primary)' : '#F1F5F9', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={32} color={y.is_active ? '#FFF' : '#94A3B8'} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {y.name}
                                                {y.is_active && <span style={{ fontSize: 11, background: '#1FAC63', color: '#FFF', padding: '4px 12px', borderRadius: 8 }}>ACTIVE SESSION</span>}
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B', display: 'flex', gap: 16, marginTop: 4 }}>
                                                <span>Starts: {formatDate(y.start_date)}</span>
                                                <span>Ends: {formatDate(y.end_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button onClick={() => setEditingYear(y)} style={{ height: 48, width: 48, borderRadius: 14, border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <Edit size={20} color="#64748B" />
                                        </button>
                                        <button 
                                            onClick={() => fetchPreview(y.id)} 
                                            style={{ 
                                                height: 48, padding: '0 24px', borderRadius: 14, border: 'none', 
                                                background: '#0F172A', color: '#FFF', fontSize: 14, fontWeight: 900, 
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10
                                            }}
                                        >
                                            RECORDS AUDIT <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'rules' && (
                    <div style={{ background: '#FFF', padding: 60, borderRadius: 40, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
                            <div>
                                <h3 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 16, margin: 0 }}>
                                    <Settings2 size={32} color="var(--color-primary)" /> Promotion Mapping Rules
                                </h3>
                                <p style={{ color: '#64748B', fontSize: 16, fontWeight: 500, marginTop: 8 }}>Establish the logical paths students follow as they transition between academic nodes.</p>
                            </div>
                            <button 
                                onClick={handleSaveRules} 
                                disabled={savingRules}
                                style={{ 
                                    background: '#0F172A', color: '#FFF', padding: '16px 36px', borderRadius: 16, border: 'none', 
                                    fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                                    opacity: savingRules ? 0.7 : 1
                                }}
                            >
                                {savingRules ? <RefreshCcw size={20} className="animate-spin" /> : <Save size={20} />} SAVE RULES
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                            {rules.length === 0 && (
                                <div style={{ gridColumn: 'span 2', padding: 80, textAlign: 'center', background: '#F8FAFC', borderRadius: 32, border: '2px dashed #E2E8F0' }}>
                                    <Settings2 size={48} color="#CBD5E1" style={{ marginBottom: 20 }} />
                                    <h4 style={{ fontSize: 18, fontWeight: 900, color: '#64748B' }}>No Rules Added</h4>
                                    <p style={{ color: '#94A3B8', fontSize: 14 }}>Initialize your first logical vector to begin defining promotion paths.</p>
                                </div>
                            )}
                            {rules.map((rule, idx) => (
                                <div key={idx} style={{ padding: 32, background: '#F8FAFC', borderRadius: 32, border: '1px solid #F1F5F9', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 40px 2.2fr', alignItems: 'center', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' }}>Current Stage</label>
                                            <input 
                                                type="text" placeholder="e.g. 5th" value={rule.from_class} 
                                                onChange={e => {
                                                    const newRules = [...rules]
                                                    newRules[idx].from_class = e.target.value
                                                    setRules(newRules)
                                                }}
                                                style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #E2E8F0', fontSize: 15, fontWeight: 800, color: '#0F172A' }}
                                            />
                                        </div>
                                        <div style={{ paddingTop: 30 }}><ArrowRight size={24} color="#CBD5E1" /></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' }}>Target Class</label>
                                                <input 
                                                    type="text" placeholder="e.g. 6th" value={rule.to_class} 
                                                    onChange={e => {
                                                        const newRules = [...rules]
                                                        newRules[idx].to_class = e.target.value
                                                        setRules(newRules)
                                                    }}
                                                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #E2E8F0', fontSize: 15, fontWeight: 900, color: '#014B93' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' }}>Target Div</label>
                                                <input 
                                                    type="text" placeholder="Same" value={rule.to_division || ''}
                                                    onChange={e => {
                                                        const newRules = [...rules]
                                                        newRules[idx].to_division = e.target.value
                                                        setRules(newRules)
                                                    }}
                                                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #E2E8F0', fontSize: 15, fontWeight: 900, color: '#1FAC63' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={rule.auto_promote} onChange={e => {
                                                const newRules = [...rules]
                                                newRules[idx].auto_promote = e.target.checked
                                                setRules(newRules)
                                            }} style={{ accentColor: '#014B93' }} /> Auto-Resolution
                                        </label>
                                        <button onClick={() => setRules(rules.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <X size={14} /> SCRAP VECTOR
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => setRules([...rules, { from_class: '', to_class: '', to_division: '', auto_promote: true }])}
                                style={{ padding: 40, borderRadius: 32, border: '2px dashed #E2E8F0', background: 'transparent', color: '#94A3B8', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s' }}
                            >
                                <Plus size={24} /> INITIALIZE MAPPING VECTOR
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'promote' && (
                    <div style={{ background: '#FFF', padding: 60, borderRadius: 40, border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, gap: 40 }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 16, margin: 0 }}>
                                    <TrendingUp size={32} color="var(--color-primary)" /> Mass Migration Audit
                                </h3>
                                <p style={{ color: '#64748B', fontSize: 16, fontWeight: 500, marginTop: 12 }}>Currently processing <span style={{ color: '#0F172A', fontWeight: 900 }}>{selectedStudents.size} candidates</span> for institutional migration.</p>
                                <div style={{ position: 'relative', marginTop: 24, maxWidth: 400 }}>
                                    <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input 
                                        type="text" placeholder="Filter by candidate or stage..." 
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Destination Academic Node</label>
                                <select 
                                    value={targetYearId} onChange={e => fetchPreview(e.target.value)}
                                    style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 15, fontWeight: 900, color: '#0F172A', outline: 'none' }}
                                >
                                    <option value="">Select Target Cycle</option>
                                    {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                                </select>
                                <button 
                                    onClick={executePromotion}
                                    disabled={executing || selectedStudents.size === 0}
                                    style={{ 
                                        width: '100%', height: 56, borderRadius: 18, border: 'none', 
                                        background: (executing || selectedStudents.size === 0) ? '#F1F5F9' : 'var(--color-primary-gradient)', 
                                        color: (executing || selectedStudents.size === 0) ? '#94A3B8' : '#FFF', 
                                        fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                                        boxShadow: (executing || selectedStudents.size === 0) ? 'none' : '0 15px 30px -5px rgba(1,75,147,0.3)'
                                    }}
                                >
                                    {executing ? <RefreshCcw size={22} className="animate-spin" /> : <Rocket size={22} />} AUTHORIZE MIGRATION
                                </button>
                            </div>
                        </div>
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 28, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ padding: '20px 32px', textAlign: 'left', width: 60 }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedStudents.size === filteredPreview.filter(p => p.can_promote).length && filteredPreview.length > 0} 
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedStudents(new Set(preview.filter(p => p.can_promote).map(p => p.id)))
                                                    else setSelectedStudents(new Set())
                                                }}
                                                style={{ width: 18, height: 18, accentColor: '#014B93' }}
                                            />
                                        </th>
                                        <th style={{ textAlign: 'left', padding: '20px', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Identity</th>
                                        <th style={{ textAlign: 'left', padding: '20px', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Source Node</th>
                                        <th style={{ textAlign: 'left', padding: '20px', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Target Node</th>
                                        <th style={{ textAlign: 'right', padding: '20px 32px', fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Audit Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPreview.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 100, textAlign: 'center' }}>
                                                <Users size={40} color="#CBD5E1" style={{ marginBottom: 16 }} />
                                                <p style={{ color: '#94A3B8', fontWeight: 700 }}>No candidates matched the current filter or target node.</p>
                                            </td>
                                        </tr>
                                    )}
                                    {filteredPreview.map((p: any) => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', background: selectedStudents.has(p.id) ? '#F8FAFF' : 'transparent', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '20px 32px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    disabled={!p.can_promote}
                                                    checked={selectedStudents.has(p.id)} 
                                                    onChange={() => toggleStudent(p.id)}
                                                    style={{ width: 18, height: 18, accentColor: '#014B93' }}
                                                />
                                            </td>
                                            <td style={{ padding: '20px', fontSize: 15, fontWeight: 800, color: '#014B93' }}>{p.name}</td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {p.old_class} <span style={{ padding: '2px 8px', background: '#F1F5F9', borderRadius: 6, fontSize: 11, fontWeight: 900 }}>{p.old_division}</span>
                                                </div>
                                            </td>
                                             <td style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: p.new_class === 'Graduated' ? '#10B981' : 'var(--color-primary)', fontSize: 15, fontWeight: 900 }}>
                                                    {p.new_class} {p.new_division && <span style={{ background: '#ECFDF5', color: '#10B981', padding: '3px 10px', borderRadius: 8, fontSize: 11 }}>DIV: {p.new_division}</span>}
                                                    {p.new_class === 'Graduated' ? <GraduationCap size={18} /> : <ArrowRight size={16} />}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                                {p.can_promote ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#10B981', padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>
                                                        <CheckCircle2 size={14} /> AUDIT PASSED
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#EF4444', padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>
                                                        <AlertCircle size={14} /> RULE MISSING
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
