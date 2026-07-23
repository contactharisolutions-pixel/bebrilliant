'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { P } from '@/components/shared/institutional/theme'

export default function WhatsAppRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/owner/communications')
    }, [router])

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 16 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: P.muted, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Redirecting to Communications Hub...</p>
        </div>
    )
}
