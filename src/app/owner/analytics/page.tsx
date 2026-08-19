'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsRedirectPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/owner/dashboard')
    }, [router])

    return (
        <div style={{ padding: 100, textAlign: 'center', background: '#F7F8FA', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#004B93' }}>Redirecting to Platform Dashboard...</div>
        </div>
    )
}
