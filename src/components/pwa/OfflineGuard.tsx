'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

export function OfflineGuard() {
  const [isOffline, setIsOffline] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine)
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setChecking(true)
    try {
      // Perform a lightweight network ping to verify actual connectivity
      const res = await fetch('/icons/icon-192x192.png?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
      if (res.ok) {
        setIsOffline(false)
      } else {
        setIsOffline(true)
      }
    } catch {
      setIsOffline(true)
    } finally {
      setChecking(false)
    }
  }

  if (!isOffline) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#020B18] border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Internet Connection Required</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            BeBrilliant strictly enforces real-time server verification for exam security, grading, and transactions. Offline data storage is disabled to protect your academic records.
          </p>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90 flex items-start gap-2.5 text-left">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>Please reconnect to Wi-Fi or cellular data. Any ongoing test timer will resume as soon as the live connection is re-established.</span>
        </div>

        <button
          onClick={handleRetry}
          disabled={checking}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking Connection…' : 'Try Reconnecting Now'}
        </button>
      </div>
    </div>
  )
}
