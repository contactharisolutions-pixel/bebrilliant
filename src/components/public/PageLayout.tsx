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
    bgImage?: string
}

export const PageLayout = ({ title, subtitle, children, accentColor = P.brand, bgImage = '/indian_school_hero.png' }: PageLayoutProps) => {
    return (
        <div className="bg-[#f9f9ff] min-h-screen font-worksans overflow-x-hidden">
            <PublicHeader />
            
            <main>
                {/* ── MODERN HERO AREA WITH BACKGROUND IMAGE ── */}
                <section 
                    className="relative pt-48 pb-24 px-6 overflow-hidden bg-cover bg-center bg-no-repeat"
                    style={{ 
                        backgroundImage: `url('${bgImage}')` 
                    }}
                >
                    {/* Dark gradient overlay for text readability and premium look */}
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(4,18,42,0.58) 0%, rgba(0,75,147,0.52) 100%)'
                        }}
                    />

                    <div className="max-w-[1440px] mx-auto relative z-10 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight font-manrope" style={{ letterSpacing: '-0.02em' }}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed font-worksans">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </section>

                <div className="w-full">
                    {children}
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
