'use client'

import React from 'react'
import { P } from '@/components/shared/institutional/theme'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

interface PageLayoutProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    accentColor?: string
}

export const PageLayout = ({ title, subtitle, children, accentColor = P.brand }: PageLayoutProps) => {
    return (
        <div className="bg-[#f9f9ff] min-h-screen font-inter overflow-x-hidden">
            <PublicHeader />
            
            <main>
                {/* ── MODERN HERO AREA ── */}
                <section className="relative pt-32 pb-24 px-6 bg-[#004B93] overflow-hidden">
                    <div className="max-w-[1440px] mx-auto relative z-10 text-center">
                        <h1 className="text-4xl md:text-6xl font-[950] text-white mb-6 tracking-tight leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    
                    {/* ACCENT GRADIENT / BLUR */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[120px] opacity-20 pointer-events-none"
                        style={{ background: accentColor }}
                    />
                </section>

                <div className="w-full">
                    {children}
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
