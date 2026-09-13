'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { School, Target, Building, Trophy, CheckCircle, ArrowRight, BookOpen, Layers } from 'lucide-react'

export function EditorialSyllabusSection() {
    const [activeTab, setActiveTab] = useState(0)

    const BOARDS = [
        {
            id: 'national',
            number: '01',
            category: 'National Boards',
            badge: 'CBSE & ICSE',
            icon: School,
            title: 'National Boards (CBSE & ICSE)',
            subtitle: 'Complete Class 1-12 NCERT-Mapped Question Banks',
            desc: 'Topic-wise assessment modules aligned directly with NCERT textbooks. Includes 10+ years of previous year board exam questions (PYQs), chapter-end quizzes, and term-end mock papers.',
            stats: [
                { label: 'Question Bank', val: '45,000+' },
                { label: 'Board PYQs', val: '10+ Years' },
                { label: 'NCERT Mapped', val: '100%' }
            ],
            tags: ['Class 1-12', 'NCERT Solutions', 'Topic-wise Tests', '10+ Yrs PYQs', 'Term Mocks'],
            subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'English'],
            coveragePct: '99.4%'
        },
        {
            id: 'competitive',
            number: '02',
            category: 'Competitive Entrance',
            badge: 'JEE Main & NEET UG',
            icon: Target,
            title: 'JEE Main, Advanced & NEET UG',
            subtitle: 'High-Yield Mock Tests & Numerical Practice Engine',
            desc: 'Built for engineering & medical aspirants with chapter-wise worksheets, line-by-line NCERT Biology assessments, physics & chemistry numerical setups, and full NTA pattern mocks.',
            stats: [
                { label: 'Question Bank', val: '60,000+' },
                { label: 'Entrance PYQs', val: '15+ Years' },
                { label: 'NTA Pattern', val: 'Full Mock' }
            ],
            tags: ['NTA Pattern', 'NTA Mock Series', 'Diagram Tests', 'Formula Drills', 'AIR Ranking'],
            subjects: ['Physics Numericals', 'Organic Chemistry', 'Calculus & Algebra', 'NCERT Biology'],
            coveragePct: '98.8%'
        },
        {
            id: 'state',
            number: '03',
            category: 'State Boards',
            badge: 'Regional Languages',
            icon: Building,
            title: 'Major State Boards',
            subtitle: 'Maharashtra, UP, Karnataka & Regional Mediums',
            desc: 'Customized content structures engineered to match State Board syllabus guidelines of Maharashtra (SSC/HSC), Uttar Pradesh (UP Board), Karnataka (SSLC/PUC), and regional mediums.',
            stats: [
                { label: 'Question Bank', val: '35,000+' },
                { label: 'State PYQs', val: '8+ Years' },
                { label: 'Mediums', val: 'Regional' }
            ],
            tags: ['Maharashtra SSC/HSC', 'UP Board', 'Karnataka SSLC', 'Regional Mediums', 'State PYQs'],
            subjects: ['State Maths', 'State Science', 'Social Studies', 'Regional Languages'],
            coveragePct: '96.5%'
        },
        {
            id: 'foundation',
            number: '04',
            category: 'Foundation & Global',
            badge: 'Olympiad & IB/IGCSE',
            icon: Trophy,
            title: 'Foundation, Olympiads & International',
            subtitle: 'Class 6-10 Foundation, NTSE, Cambridge IGCSE & IB',
            desc: 'Nurture school foundation students with Olympiad-level mock papers, NTSE prep, and mental ability testing alongside Cambridge IGCSE, AS/A-Levels, and IB Diploma Programme standards.',
            stats: [
                { label: 'Question Bank', val: '30,000+' },
                { label: 'Olympiad Mocks', val: 'NTSE Prep' },
                { label: 'Standard', val: 'Global IB' }
            ],
            tags: ['Olympiad Prep', 'NTSE Testing', 'Mental Ability', 'Cambridge IGCSE', 'IB Diploma'],
            subjects: ['Advanced Maths', 'Analytical Reasoning', 'Global Science', 'Critical Thinking'],
            coveragePct: '97.2%'
        }
    ]

    const item = BOARDS[activeTab]

    return (
        <section
            aria-label="Curricular Coverage Architecture"
            className="w-full bg-[#F8FAFC] border-b border-slate-200 py-20 lg:py-28 px-6 sm:px-8 lg:px-12"
        >
            <div className="max-w-7xl mx-auto">
                {/* 1. Header with Architectural Hierarchy */}
                <div className="max-w-3xl mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/10 border border-[#1E3A8A]/15 text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-4">
                        <BookOpen size={13} />
                        <span>Curricular Architecture & Depth</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight font-manrope leading-[1.15] mb-4">
                        Pre-loaded syllabus architecture for national boards and competitive exams.
                    </h2>

                    <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-worksans">
                        Deploy accredited curriculum blueprints, topic-level taxonomies, and decade-long previous year question banks across your coaching batches within seconds.
                    </p>
                </div>

                {/* 2. Numbered Typographic Tab Switcher (Anti-card) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-b border-slate-200 pb-px mb-12">
                    {BOARDS.map((b, idx) => {
                        const isActive = activeTab === idx
                        return (
                            <button
                                key={b.id}
                                onClick={() => setActiveTab(idx)}
                                className={`text-left pb-4 pt-2 transition-all relative ${
                                    isActive
                                        ? 'text-[#001D3D] font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-xs text-slate-400 font-semibold">{b.number}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                                        isActive ? 'bg-[#001D3D] text-white' : 'bg-slate-200/70 text-slate-600'
                                    }`}>
                                        {b.badge}
                                    </span>
                                </div>
                                <div className="text-sm sm:text-base font-manrope font-extrabold leading-snug">
                                    {b.category}
                                </div>
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#001D3D]" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* 3. Asymmetric Content Layout (60% Narrative / 40% Telemetry Dock) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left Column (7 cols): Editorial Curriculum Details */}
                    <div className="lg:col-span-7 flex flex-col justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-[#004B93] mb-2 font-mono">
                                {item.badge} Blueprint · Class 1 to 12
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-manrope mb-4 leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-base text-slate-600 leading-relaxed font-worksans mb-8">
                                {item.desc}
                            </p>
                        </div>

                        {/* Unboxed Tabular Specs Row */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-200 mb-8">
                            {item.stats.map((st, i) => (
                                <div key={i}>
                                    <div className="text-2xl sm:text-3xl font-black text-[#001D3D] font-manrope">
                                        {st.val}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1 font-worksans">
                                        {st.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Feature Tags with Clean Border Style */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {item.tags.map((tg, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                                >
                                    <CheckCircle size={13} className="text-emerald-600" />
                                    <span>{tg}</span>
                                </span>
                            ))}
                        </div>

                        {/* Subject Chips */}
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                                Core Subject Repositories
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {item.subjects.map((sb, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 rounded bg-slate-200/60 text-slate-700 text-xs font-medium"
                                    >
                                        {sb}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (5 cols): Curricular Telemetry Dock */}
                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-700 font-mono">
                                    Curricular Engine
                                </span>
                            </div>
                            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                {item.coveragePct} Aligned
                            </span>
                        </div>

                        <div className="text-lg font-extrabold text-[#0F172A] font-manrope mb-2">
                            {item.subtitle}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6 font-worksans">
                            Direct syllabus-to-exam compilation. Question stems, options, and solutions are fully verified against official NTA and NCERT errata guidelines.
                        </p>

                        {/* Alignment bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                <span>NCERT Learning Outcomes</span>
                                <span className="text-[#001D3D] font-bold">{item.coveragePct}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#001D3D] rounded-full transition-all duration-500"
                                    style={{ width: item.coveragePct }}
                                />
                            </div>
                        </div>

                        {/* Direct Action */}
                        <Link
                            href="/request-demo"
                            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[#001D3D] text-white font-bold text-sm hover:bg-[#002C5B] transition-colors"
                        >
                            <span>Explore {item.badge} Question Bank</span>
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>

                {/* 4. Architectural Taxonomy Standards Bar */}
                <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2 font-mono uppercase tracking-wider text-slate-400 font-bold">
                        <Layers size={14} />
                        <span>Standardized Coverage:</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {[
                            'CBSE Class 1-12', 'ICSE & ISC Board', 'JEE Main (NTA)',
                            'JEE Advanced', 'NEET UG', 'Maharashtra SSC/HSC',
                            'UP Board', 'Karnataka SSLC', 'NTSE & Olympiads', 'Cambridge IGCSE & IB'
                        ].map((bName, i) => (
                            <span key={i} className="text-slate-600 hover:text-slate-900 transition-colors">
                                {bName}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
