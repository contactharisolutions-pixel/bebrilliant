'use client'

import React, { useEffect, useRef, useState } from 'react'

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
    const [val, setVal] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const ran = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !ran.current) {
                ran.current = true
                const dur = 1600
                const t0 = performance.now()
                const tick = (now: number) => {
                    const p = Math.min((now - t0) / dur, 1)
                    setVal(Math.round((1 - Math.pow(1 - p, 3)) * end))
                    if (p < 1) requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
            }
        }, { threshold: 0.3 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [end])

    return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>
}

export function SovereignStatsStrip() {
    const STATS = [
        { end: 1200000, suffix: '+', label: 'Exams Delivered', status: 'Live Counter' },
        { end: 500, suffix: '+', label: 'Active Institutions', status: 'Verified' },
        { end: 4800000, suffix: '+', label: 'Students Served', status: 'Pan-India' },
        { end: 15000, suffix: '+', label: 'Syllabus Covered', status: 'NCERT & State' },
        { end: 500000, suffix: '+', label: 'Questions Banked', status: 'Curated' },
        { end: 99, suffix: '.9%', label: 'Platform Uptime', status: 'SLA Guaranteed' },
    ]

    return (
        <section
            aria-label="Institutional Scale Telemetry"
            className="w-full bg-[#00142A] border-y border-white/10 py-12 px-6 sm:px-8 lg:px-12 relative overflow-hidden"
        >
            {/* Subtle ambient gradient mesh */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(30, 58, 138, 0.35), transparent)'
                }}
            />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    {STATS.map(({ end, suffix, label, status }, idx) => (
                        <div
                            key={label}
                            className={`flex flex-col justify-between py-6 px-4 sm:px-6 transition-colors duration-200 hover:bg-white/[0.02] ${
                                idx === 0 ? 'pt-0 md:pt-6' : ''
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
                                    {status}
                                </span>
                            </div>

                            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-manrope">
                                <CountUp end={end} suffix={suffix} />
                            </div>

                            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-2 font-worksans">
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
