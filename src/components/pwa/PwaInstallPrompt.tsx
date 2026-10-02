'use client'

import React, { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(Boolean(standalone))

    // Check if user dismissed recently
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true'
    setDismissed(isDismissed)

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(iosDevice)

    // Android/Chrome beforeinstallprompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else if (isIos) {
      setShowIosGuide(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  // Do not show if already running as standalone app, or dismissed, or no prompt available on desktop
  if (isStandalone || dismissed || (!deferredPrompt && !isIos)) {
    return null
  }

  return (
    <>
      {/* Floating Mobile Install Bar */}
      <aside aria-label="App installation banner" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-[#020B18]/95 border border-sky-500/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">Install BeBrilliant App</div>
              <div className="text-xs text-slate-400">Faster exams, zero app store lag</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shrink-0"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss app install banner"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#020B18] border border-sky-500/30 rounded-2xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Install on iOS (iPhone / iPad)</h3>
              <button
                onClick={() => setShowIosGuide(false)}
                aria-label="Close installation guide"
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-3">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                  1
                </span>
                <span>
                  Tap the <Share className="w-4 h-4 inline-block text-sky-400 mx-1" /> <strong>Share</strong> button in Safari's bottom toolbar.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <PlusSquare className="w-4 h-4 inline-block text-sky-400 mx-1" /> <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right corner. The app icon will appear on your home screen!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
