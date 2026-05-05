'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Award, ArrowRight, BarChart3, Clock } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const exam_id = searchParams.get('id')

    return (
        <div style={{ padding: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
            <div style={{ maxWidth: 520, width: '100%', background: '#FFF', borderRadius: 32, padding: 48, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                
                <div style={{ width: 100, height: 100, background: '#ECFDF5', borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 12px 24px rgba(16,185,129,0.15)' }}>
                    <CheckCircle2 size={52} color="#10B981" />
                </div>

                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.04em' }}>Exam Submitted Successfully</h1>
                <p style={{ margin: '12px 0 0', fontSize: 16, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>Your examination has been successfully submitted. Results will be available after evaluation.</p>

                <div style={{ marginTop: 40, padding: '24px', background: '#F8FAFC', borderRadius: 20, border: '1px solid #F1F5F9', display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                             <Award size={16} /> SUBMISSION STATUS
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>SUBMITTED</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                            <Clock size={16} /> SUBMITTED AT
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>{new Date().toLocaleTimeString()}</div>
                    </div>
                </div>

                <div style={{ marginTop: 48, display: 'grid', gap: 14 }}>
                      <Link href="/dashboard/student/analytics" style={{ textDecoration: 'none', background: 'var(--color-primary-gradient)', color: '#FFF', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-primary)' }}>
                        <BarChart3 size={18} /> View Performance
                    </Link>
                    <Link href="/dashboard" style={{ textDecoration: 'none', background: '#FFF', color: '#0F172A', border: '1px solid #E2E8F0', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        Go to Dashboard <ArrowRight size={18} />
                    </Link>
                </div>

            </div>
            <style>{`
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    )
}

export default function ExamSuccessPage() {
    return (
       <Suspense fallback={<div style={{ padding: 100, textAlign: 'center' }}>Processing submission...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
