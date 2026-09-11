import React from 'react'
import { OwnerSidebar } from '@/components/owner/OwnerSidebar'
import { OwnerHeader } from '@/components/owner/OwnerHeader'

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

            <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#F7F8FA]">
                {/* GLOBAL SUPER ADMIN HEADER */}
                <OwnerHeader />

                {/* MAIN CONTENT SPLIT: SIDEBAR + CONTENT */}
                <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                    {/* SIDEBAR */}
                    <OwnerSidebar />

                    {/* MAIN SCROLL AREA */}
                    <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F7F8FA]">
                        {children}
                    </main>
                </div>
            </div>
        </>
    )
}
