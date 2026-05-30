'use client'
import React, { useState, useEffect } from 'react'
import { 
    BrainCircuit, Wallet, ClipboardList, Target, 
    ArrowRight, Rocket, AlertCircle, History,
    CheckCircle2, Clock, BookOpen, Layers
} from 'lucide-react'
import Link from 'next/link'
export default function CustomExamBuilder() {
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [wallet, setWallet] = useState({ balance: 0, transactions: [] })
    const [previousExams, setPreviousExams] = useState([])
    const [creditsRequired, setCreditsRequired] = useState(0)
    // Form Stats
    const [formData, setFormData] = useState({
        subject: '',
        chapter: '',
        topic: '',
        difficulty: 'Medium',
        question_count: 10,
        question_type: 'MCQ'
    })
    const [subjects, setSubjects] = useState<any[]>([])
    const [chapters, setChapters] = useState<any[]>([])
    const [topics, setTopics] = useState<any[]>([])
    useEffect(() => {
        fetchInitialData()
    }, [])
    useEffect(() => {
        calculateCredits()
    }, [formData])
    const fetchInitialData = async () => {
        try {
            const [walletRes, examsRes, subRes] = await Promise.all([
                fetch('/api/student/wallet'),
                fetch('/api/student/custom-exam'),
                fetch('/api/student/syllabus/subjects')
            ])
            const walletData = await walletRes.json()
            const examsData = await examsRes.json()
            const subData = await subRes.json()
            if (!walletData.error) setWallet(walletData)
            if (!examsData.error) setPreviousExams(examsData.exams || [])
            setSubjects(subData.subjects || [])
        } catch (err) {
            console.error('Failed to fetch data', err)
        } finally {
            setLoading(false)
        }
    }
    const fetchNodes = async (parentId: string, type: 'chapter' | 'topic') => {
        try {
            const res = await fetch(`/api/student/syllabus/nodes?parentId=${parentId}`)
            const data = await res.json()
            if (type === 'chapter') setChapters(data.nodes || [])
            else setTopics(data.nodes || [])
        } catch (err) {
            console.error(`Failed to fetch ${type}s`, err)
        }
    }
    const handleSubjectChange = (subjectName: string) => {
        const subject = subjects.find(s => s.name === subjectName)
        setFormData({ ...formData, subject: subjectName, chapter: '', topic: '' })
        setChapters([])
        setTopics([])
        if (subject) fetchNodes(subject.id, 'chapter')
    }
    const handleChapterChange = (chapterName: string) => {
        const chapter = chapters.find(c => c.name === chapterName)
        setFormData({ ...formData, chapter: chapterName, topic: '' })
        setTopics([])
        if (chapter) fetchNodes(chapter.id, 'topic')
    }
    const calculateCredits = async () => {
        try {
            const res = await fetch('/api/student/wallet/calculate', {
                method: 'POST',
                body: JSON.stringify({
                    question_count: formData.question_count,
                    question_type: formData.question_type,
                    difficulty: formData.difficulty
                })
            })
            const data = await res.json()
            setCreditsRequired(data.total_credits)
        } catch (err) {
            console.error('Calculation failed', err)
        }
    }
    const handleCreate = async () => {
        if (!formData.subject) return alert('Please select a subject')
        if (creditsRequired > wallet.balance) return alert('Insufficient credits')
        setCreating(true)
        try {
            const res = await fetch('/api/student/custom-exam/create', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                // Success! Refresh data
                fetchInitialData()
                alert('Exam generated! You can now start the attempt.')
            } else {
                alert(data.error || 'Failed to generate exam')
            }
        } catch (err) {
            alert('Something went wrong')
        } finally {
            setCreating(false)
        }
    }
    if (loading) return (
        <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontWeight: 800, color: '#64748B' }}>INITIALIZING TEST GENERATOR...</p>
        </div>
    )
    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                 <div style={{ marginBottom: 40 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>Custom Mock Exams</h1>
                    <p style={{ color: '#64748B', fontWeight: 600, marginTop: 8 }}>Create your own practice tests based on your syllabus topics.</p>
                </div>
                 <div style={{ background: '#FFF', padding: '12px 24px', borderRadius: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 44, height: 44, background: 'var(--color-primary-bg)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Available Credits</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{wallet.balance} CR</div>
                    </div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }}>
                {/* LEFT: Builder Panel */}
                 <div style={{ background: '#FFF', padding: 40, borderRadius: 28, border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <BrainCircuit size={24} color="var(--color-primary)" /> Define Assessment Parameters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Target Subject</label>
                            <select 
                                value={formData.subject}
                                onChange={e => handleSubjectChange(e.target.value)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none' }}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Chapter / Unit</label>
                            <select 
                                value={formData.chapter}
                                onChange={e => handleChapterChange(e.target.value)}
                                disabled={!formData.subject}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', background: formData.subject ? '#F8FAFC' : '#F1F5F9', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none' }}
                            >
                                <option value="">{formData.subject ? 'Select Chapter' : 'Select Subject First'}</option>
                                {chapters.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Specific Topic (Optional)</label>
                        <select 
                            value={formData.topic}
                            onChange={e => setFormData({ ...formData, topic: e.target.value })}
                            disabled={!formData.chapter}
                            style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', background: formData.chapter ? '#F8FAFC' : '#F1F5F9', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none' }}
                        >
                            <option value="">{formData.chapter ? 'All Topics' : 'Select Chapter First'}</option>
                            {topics.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>
                     <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 16 }}>Complexity Level</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button 
                                    key={d}
                                     onClick={() => setFormData({ ...formData, difficulty: d })}
                                    style={{ 
                                        flex: 1, padding: '14px', borderRadius: 14, border: '1px solid',
                                        borderColor: formData.difficulty === d ? 'var(--color-primary)' : '#E2E8F0',
                                        background: formData.difficulty === d ? 'var(--color-primary-bg)' : '#FFF',
                                        color: formData.difficulty === d ? 'var(--color-primary)' : '#64748B',
                                        fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s'
                                    }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Question Count ({formData.question_count})</label>
                            <input 
                                 type="range" min="5" max="50" step="5"
                                 value={formData.question_count}
                                 onChange={e => setFormData({ ...formData, question_count: parseInt(e.target.value) })}
                                 style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                        </div>
                         <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Question Format</label>
                            <select 
                                value={formData.question_type}
                                onChange={e => setFormData({ ...formData, question_type: e.target.value })}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none' }}
                            >
                                <option value="MCQ">Multiple Choice Questions (MCQ)</option>
                                <option value="subjective">Subjective / Text Based</option>
                            </select>
                        </div>
                    </div>
                    {/* Credit Summary & Action */}
                    <div style={{ background: '#0F172A', padding: 32, borderRadius: 24, color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                <Target size={16} /> Credit Requirement
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 900 }}>{creditsRequired} <span style={{ color: 'var(--color-primary)', fontSize: 16 }}>Credits</span></div>
                        </div>
                        <button 
                            onClick={handleCreate}
                            disabled={creating || creditsRequired > wallet.balance}
                             style={{ 
                                padding: '16px 32px', borderRadius: 16, border: 'none',
                                background: (creating || creditsRequired > wallet.balance) ? '#1E293B' : 'var(--color-primary-gradient)',
                                color: (creating || creditsRequired > wallet.balance) ? '#475569' : '#FFF',
                                fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                                boxShadow: creditsRequired > wallet.balance ? 'none' : 'var(--shadow-primary)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {creating ? 'SYNTHESIZING...' : creditsRequired > wallet.balance ? 'INSUFFICIENT SUBSCRIPTION' : 'INITIALIZE SYNTHESIS'}
                            <Rocket size={20} />
                        </button>
                    </div>
                </div>
                {/* RIGHT: History & Tips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Wallet Stats Feed */}
                    <div style={{ background: '#FFF', padding: 32, borderRadius: 28, border: '1px solid #E2E8F0' }}>
                         <h4 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <History size={18} color="var(--color-primary)" /> Credit History
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {wallet?.transactions?.length > 0 ? wallet.transactions.map((t: any) => (
                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{t.description || 'System Credit'}</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: t.type === 'credit' ? '#10B981' : '#EF4444' }}>
                                        {t.type === 'credit' ? '+' : '-'}{t.credits}
                                    </div>
                                </div>
                            )) : (
                                <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No recent activity logged.</p>
                            )}
                        </div>
                    </div>
                    {/* Previous Custom Exams */}
                    <div style={{ background: '#FFF', padding: 32, borderRadius: 28, border: '1px solid #E2E8F0' }}>
                         <h4 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Layers size={18} color="var(--color-primary)" /> Recently Generated Tests
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {previousExams?.length > 0 ? previousExams.slice(0, 5).map((ex: any) => (
                                <div key={ex.id} style={{ padding: 16, background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{ex.subject}</div>
                                        <div style={{ 
                                            padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                            background: ex.status === 'ready' ? '#ECFDF5' : '#FEF2F2',
                                            color: ex.status === 'ready' ? '#10B981' : '#EF4444'
                                        }}>
                                            {ex.status}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748B', fontSize: 12, fontWeight: 700 }}>
                                        <span>{ex.question_count} Qs</span>
                                        <span>•</span>
                                        <span>{ex.difficulty}</span>
                                    </div>
                                    {ex.status === 'ready' && (
                                        <button 
                                             onClick={() => window.location.href = `/dashboard/student/custom-exam/attempt/${ex.id}`}
                                            style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 10, background: '#FFF', border: '1px solid #E2E8F0', color: 'var(--color-primary)', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        >
                                            START AGAIN <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            )) : (
                                 <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Create your first personalized test now.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
