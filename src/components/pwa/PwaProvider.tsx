'use client'

import React, { useEffect } from 'react'
import { OfflineGuard } from './OfflineGuard'
import { PwaInstallPrompt } from './PwaInstallPrompt'
import { MobileBottomNav } from '../mobile/MobileBottomNav'

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered successfully with scope:', reg.scope)
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      })
    }
  }, [])

  return (
    <>
      <OfflineGuard />
      {children}
      <MobileBottomNav />
      <PwaInstallPrompt />
    </>
  )
}
