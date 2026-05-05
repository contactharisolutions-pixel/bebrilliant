import React from 'react'
import { OwnerSidebar } from '@/components/owner/OwnerSidebar'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Force global light theme override */}
            <style dangerouslySetInnerHTML={{
                __html: `
        html, body { background: #F7F8FA !important; color: #1B1D21 !important; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8E8E8; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #A5A2A6; }
      `}} />

            <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#F7F8FA' }}>
                {/* SIDEBAR */}
                <OwnerSidebar />

                {/* MAIN SCROLL AREA */}
                <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', background: '#F7F8FA' }}>
                    {children}
                </div>
            </div>
        </>
    )
}
