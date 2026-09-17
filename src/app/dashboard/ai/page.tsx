'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AIDashboardRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Consolidated into Question Bank inside Offline Paper Engine
        router.replace('/dashboard/exams/offline')
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-600">
                Redirecting to Offline Paper Engine Question Bank...
            </p>
        </div>
    )
}
