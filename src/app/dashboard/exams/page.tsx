'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
export default function ExamRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/dashboard/exams/online')
    }, [router])
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
            <Loader2 size={40} className="spin" style={{ color: '#004B93', animation: 'spin 1s linear infinite' }} />
        </div>
    )
}
