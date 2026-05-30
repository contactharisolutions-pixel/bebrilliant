'use client'
import React, { useState, useEffect } from 'react'
import { 
    ArrowRight, Loader2, Sparkles, BookOpen, AlertCircle, Award, 
    ClipboardList, Clock, Calendar, ShoppingCart, CheckCircle2,
    Lock, Timer, CreditCard, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate, formatDateTime } from '@/lib/utils'
export default function StudentExamsPortal() {
    const [exams, setExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const fetchExams = async () => {
        try {
            const res = await fetch('/api/dashboard/exams?status=published')
            const data = await res.json()
            setExams(data.exams || [])
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchExams()
    }, [])
    const handleEnroll = async (examId: string) => {
        const res = await fetch('/api/student/exam/enroll', {
            method: 'POST',
            body: JSON.stringify({ exam_id: examId })
        })
        if (res.ok) fetchExams()
        else {
            const d = await res.json()
            alert(d.error)
        }
    }
    const handleAddToCart = async (exam: any) => {
        const res = await fetch('/api/student/cart', {
            method: 'POST',
            body: JSON.stringify({ 
                item_id: exam.id, 
                type: 'exam', 
                price: exam.price,
                tenant_id: exam.tenant_id
            })
        })
        if (res.ok) fetchExams()
    }
    if (loading) return (
        <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )
    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
                <div>
                   <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Assessments & Exams</h1>
                   <p style={{ margin: '8px 0 0', fontSize: 15, color: '#64748B', fontWeight: 600 }}>View and participate in scheduled examinations and assessments.</p>
                </div>
                 <div style={{ display: 'flex', gap: 12, padding: '10px 16px', background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    <Sparkles size={16} color="var(--color-primary)" /> Active Scholar
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 32 }}>
                {exams.map(ex => (
                    <ExamCard key={ex.id} exam={ex} onEnroll={handleEnroll} onAddToCart={handleAddToCart} />
                ))}
            </div>
            {exams.length === 0 && (
                  <div style={{ padding: '80px', background: '#FFF', borderRadius: 24, border: '1px dashed #E2E8F0', textAlign: 'center' }}>
                    <AlertCircle size={32} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>No active examinations found for your profile.</div>
                </div>
            )}
        </div>
    )
}
function ExamCard({ exam, onEnroll, onAddToCart }: { exam: any, onEnroll: any, onAddToCart: any }) {
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState('')
    const isLive = !exam.allow_anytime
    const isPaid = exam.is_paid
    const isEnrolled = exam.is_enrolled
    useEffect(() => {
        if (!isLive || !exam.start_time) return
        const timer = setInterval(() => {
            const now = new Date().getTime()
            const start = new Date(exam.start_time).getTime()
            const diff = start - now
            if (diff <= 0) {
                setTimeLeft('LIVE NOW')
                clearInterval(timer)
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [isLive, exam.start_time])
    const canStart = !isLive || (timeLeft === 'LIVE NOW' && isEnrolled)
    return (
        <div style={{ background: '#FFF', borderRadius: 28, padding: 32, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px 24px', background: isLive ? '#EF4444' : 'var(--color-primary-gradient)', color: '#FFF', fontSize: 11, fontWeight: 900, borderRadius: '0 0 0 16px', boxShadow: isLive ? '0 4px 12px rgba(239,68,68,0.2)' : 'var(--shadow-primary)' }}>
                {isLive ? 'LIVE' : 'ANYTIME'}
            </div>
             <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 56, height: 56, background: isLive ? '#FEF2F2' : 'var(--color-primary-bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLive ? <Timer size={28} color="#EF4444" /> : <ClipboardList size={28} color="var(--color-primary)" />}
                </div>
                 <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{exam.name}</h3>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>Exam Session</div>
                </div>
            </div>
            {/* METRICS */}
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                 <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Full Marks</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{exam.total_marks} Marks</div>
                </div>
                 <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Time Allocated</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{exam.duration} Minutes</div>
                </div>
            </div>
            {/* SCHEDULING DETAIL */}
            <div style={{ marginTop: 24, padding: '20px', background: '#F8FAFC', borderRadius: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                     <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Registration Period</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                            {exam.reg_start ? formatDate(exam.reg_start) : 'OPEN'} - {exam.reg_end ? formatDate(exam.reg_end) : 'N/A'}
                        </div>
                    </div>
                     <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Exam Schedule</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                            {exam.start_time ? formatDateTime(exam.start_time) : 'Flexible'}
                        </div>
                    </div>
                </div>
                     <div style={{ marginTop: 20, padding: '16px', background: timeLeft === 'LIVE NOW' ? '#ECFDF5' : '#FFF7ED', borderRadius: 16, border: '1px solid', borderColor: timeLeft === 'LIVE NOW' ? '#A7F3D0' : '#FFEDD5', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: timeLeft === 'LIVE NOW' ? '#059669' : '#C2410C', textTransform: 'uppercase', marginBottom: 6 }}>Count Down</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '0.05em' }}>
                            {timeLeft || 'LOADING...'}
                        </div>
                    </div>
                {isLive && !isEnrolled && (
                    <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                         Please register for this exam to unlock the countdown timer.
                    </div>
                )}
                 {!isLive && (
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'var(--color-primary-bg)', borderRadius: 12, border: '1px solid var(--color-primary)20' }}>
                        <Sparkles size={16} color="var(--color-primary)" />
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}>ON-DEMAND: START ANYTIME</div>
                    </div>
                )}
            </div>
            {/* PAYMENT / COMMERCE */}
            {isPaid && !isEnrolled && (
                <div style={{ marginTop: 24, padding: '16px', background: '#F0FDFA', borderRadius: 16, border: '1px solid #CCFBF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#0D9488' }}>ACCESS FEE</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>₹{exam.price}</div>
                    </div>
                    <button onClick={() => onAddToCart(exam)} style={{ padding: '10px', borderRadius: 12, border: '1px solid #14B8A6', background: exam.is_in_cart ? '#14B8A6' : 'transparent', color: exam.is_in_cart ? '#FFF' : '#14B8A6', cursor: 'pointer' }}>
                        <ShoppingCart size={20} />
                    </button>
                </div>
            )}
            {/* ACTIONS */}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                {!isEnrolled ? (
                    isPaid ? (
                        <button style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: '#0F172A', color: '#FFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                             <CreditCard size={18} /> Buy Now & Enroll
                        </button>
                    ) : (
                          <button onClick={() => onEnroll(exam.id)} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: 'var(--color-primary-gradient)', color: '#FFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-primary)' }}>
                             Enroll Now <ArrowRight size={18} />
                        </button>
                    )
                ) : (
                    <button 
                        disabled={!canStart}
                        onClick={() => router.push(`/dashboard/student/exams/attempt/${exam.id}`)}
                        style={{ 
                            width: '100%', padding: '16px', borderRadius: 16, border: 'none', 
                            background: canStart ? '#10B981' : '#F1F5F9', 
                            color: canStart ? '#FFF' : '#94A3B8', 
                            fontSize: 15, fontWeight: 900, cursor: canStart ? 'pointer' : 'not-allowed', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            boxShadow: canStart ? '0 10px 20px rgba(16,185,129,0.2)' : 'none'
                        }}
                    >
                          {isLive && timeLeft !== 'LIVE NOW' ? <><Lock size={18} /> Awaiting Start</> : <><CheckCircle2 size={18} /> Start Exam</>}
                    </button>
                )}
            </div>
        </div>
    )
}
