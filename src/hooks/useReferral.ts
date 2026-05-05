'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const REF_KEY = 'bb_referral_code'

/**
 * useReferral — captures ?ref= from URL on mount,
 * persists to localStorage so it survives registration.
 *
 * Call trackRegistration() after the user signs up.
 * Call trackPayment(paymentId, examId?) after payment confirms.
 *
 * Usage in a page/component:
 *   const { trackRegistration, trackPayment } = useReferral()
 */
export function useReferral() {
    const searchParams = useSearchParams()
    const tracked = useRef(false)

    useEffect(() => {
        const ref = searchParams.get('ref')
        if (ref) {
            localStorage.setItem(REF_KEY, ref)
            // Log click event (fire-and-forget)
            fetch(`/api/affiliate/referral/${ref}`).catch(() => {/* ignore */})
        }
    }, [searchParams])

    const getStoredRef = (): string | null =>
        typeof window !== 'undefined' ? localStorage.getItem(REF_KEY) : null

    const trackRegistration = async () => {
        if (tracked.current) return
        const ref_code = getStoredRef()
        if (!ref_code) return

        try {
            await fetch('/api/affiliate/referral/track', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ ref_code, event_type: 'registration' }),
            })
            tracked.current = true
        } catch {/* silent */}
    }

    const trackPayment = async (payment_id: string, exam_id?: string) => {
        const ref_code = getStoredRef()
        if (!ref_code) return

        try {
            const res = await fetch('/api/affiliate/referral/track', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ ref_code, event_type: 'payment', payment_id, exam_id }),
            })
            const data = await res.json()
            // Clear stored ref after payment tracked
            if (data.tracked) localStorage.removeItem(REF_KEY)
            return data
        } catch {/* silent */}
    }

    const clearRef = () => localStorage.removeItem(REF_KEY)

    return { trackRegistration, trackPayment, clearRef, getStoredRef }
}
