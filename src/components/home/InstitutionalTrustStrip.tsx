'use client'

import React from 'react'
import { School, Trophy, GraduationCap, Target, BrainCircuit, BookOpen } from 'lucide-react'

export function InstitutionalTrustStrip() {
    const COLLABORATORS = [
        { name: 'Vidyamandir Classes', icon: School, location: 'Pune' },
        { name: 'Zenith Academy', icon: Trophy, location: 'Surat' },
        { name: 'Nalanda Public School', icon: GraduationCap, location: 'Nashik' },
        { name: 'Concept First Academy', icon: Target, location: 'Ahmedabad' },
        { name: 'Bright Minds Coaching', icon: BrainCircuit, location: 'Kochi' },
        { name: 'EduPath Institute', icon: BookOpen, location: 'Kerala' },
        { name: 'Chaitanya Group', icon: GraduationCap, location: 'Hyderabad' },
        { name: 'FIITJEE Center', icon: Target, location: 'Pune' }
    ]

    return (
        <section
            aria-label="Institutional Deployments"
            className="w-full bg-white border-b border-slate-100 py-14 px-6 sm:px-8 lg:px-12"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 mb-8">
                    <div>
                        <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#004B93] mb-1">
                            National Assessment Trust
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-manrope">
                            Deployed across 500+ premier coaching institutes and schools.
                        </h3>
                    </div>
                    <div className="text-xs text-slate-500 font-worksans max-w-sm">
                        Powering high-stakes internal milestones, weekly tests, and mock board assessments with 99.98% grading accuracy.
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 items-center">
                    {COLLABORATORS.map((partner, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-start p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                            <partner.icon size={20} className="text-slate-400 group-hover:text-[#001D3D] transition-colors mb-2" />
                            <span className="text-xs font-bold text-slate-800 font-manrope leading-tight">
                                {partner.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {partner.location}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
