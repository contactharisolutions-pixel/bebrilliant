'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    Building, School, UserCheck, GraduationCap, Target, Trophy,
    CheckCircle, ArrowRight, Users, Shield, Lock, TrendingUp, Sparkles
} from 'lucide-react'

export function EditorialRolesSection() {
    const [activeRoleIndex, setActiveRoleIndex] = useState(0)

    const ROLES = [
        {
            id: 'owner',
            number: '01',
            role: 'Institution Owner',
            category: 'C-Suite & Executive',
            icon: Building,
            headline: 'Centralized multi-branch coaching empire governance and revenue audit.',
            desc: 'Run your multi-branch coaching empire from a central executive dashboard. Monitor live revenue settlements, student enrolments, staff performance, and WhatsApp affiliate growth in real-time.',
            perks: [
                'Multi-branch central governance & tenant isolation',
                'Real-time Razorpay revenue & fee collection tracking',
                'WhatsApp affiliate growth engine & automated referral payouts',
                'Batch profitability & executive performance analytics'
            ],
            telemetry: 'EXECUTIVE CONSOLE · LIVE AUDIT ACTIVE',
            metricTag: '₹2.4L Monthly Growth',
            scope: 'Full Administrative Authority'
        },
        {
            id: 'admin',
            number: '02',
            role: 'Academic Admin',
            category: 'Operations & Logistics',
            icon: School,
            headline: 'Streamlined faculty allocation, exam schedules, and bulk question ingestion.',
            desc: 'Streamline operations, manage teacher assignments, configure online/OMR examinations, and handle academic logistics with automated result generation and fee oversight.',
            perks: [
                'Teacher & class allocation matrix with RBAC',
                'Bulk question bank import via CSV & Gemini AI',
                'Automated scorecard generation and WhatsApp circulars',
                'Comprehensive fee collection reconciliation & ledger'
            ],
            telemetry: 'ADMIN OPS · BATCH 2026 ONLINE',
            metricTag: '70% Ops Time Saved',
            scope: 'Operational Oversight'
        },
        {
            id: 'teacher',
            number: '03',
            role: 'Classroom Teacher',
            category: 'Educator Suite',
            icon: UserCheck,
            headline: 'Curriculum-aligned question generation, live proctoring, and student grading.',
            desc: 'Generate custom exam papers with Gemini AI, monitor ongoing tests live, grade offline OMR sheets automatically, and track individual student learning trajectories.',
            perks: [
                'Gemini AI question paper authoring by Bloom’s taxonomy',
                'Real-time exam supervision and tab-switch detection',
                'Per-student diagnostic performance view and weaknesses',
                'Instant automated answer keys and step-by-step solutions'
            ],
            telemetry: 'FACULTY PORTAL · REAL-TIME SUPERVISION',
            metricTag: '120 Sheets/Min OMR',
            scope: 'Curricular & Assessment'
        },
        {
            id: 'student',
            number: '04',
            role: 'Enrolled Student',
            category: 'Candidate Platform',
            icon: GraduationCap,
            headline: 'Distraction-free timed assessments, instant answer review, and AIR percentiles.',
            desc: 'Take timed exams on a clean CBT interface, review step-by-step solutions immediately, track progress trajectories, and access curated question banks tailored to current syllabus.',
            perks: [
                'Fast, reliable online examination interface on web & mobile',
                'Instant performance reports with detailed explanations',
                'Subject-wise weakness heatmaps and improvement targets',
                'All-India Rank (AIR) percentiles and batch leaderboards'
            ],
            telemetry: 'CBT ENGINE · ZERO LATENCY',
            metricTag: 'Instant Grade Delivery',
            scope: 'Self-Testing & Growth'
        },
        {
            id: 'parent',
            number: '05',
            role: 'Guardian & Parent',
            category: 'Transparent Oversight',
            icon: Target,
            headline: 'Real-time score notifications, attendance tracking, and digital fee receipts.',
            desc: 'Stay informed about your child’s academic journey with real-time score alerts delivered via WhatsApp, historical attendance logs, exam schedules, and one-click UPI fee payments.',
            perks: [
                'Automated exam scorecards sent directly via WhatsApp',
                'Historical academic trajectory across term assessments',
                'One-click fee payments with instant GST-compliant receipts',
                'Direct communication channel with batch educators'
            ],
            telemetry: 'PARENT NOTIFICATION PIPELINE · SYNCED',
            metricTag: '100% WhatsApp Delivery',
            scope: 'Read & Payment Access'
        },
        {
            id: 'affiliate',
            number: '06',
            role: 'Growth Affiliate',
            category: 'Advocacy & Referral',
            icon: Trophy,
            headline: 'Automated WhatsApp referral links, student enrollment tracking, and commissions.',
            desc: 'Empower alumni, students, and education counselors to promote your coaching courses through dedicated WhatsApp referral links with transparent commission tracking and payouts.',
            perks: [
                'Unique WhatsApp deep-links with instant student attribution',
                'Real-time conversion tracking and referral ledger',
                'Transparent payout wallet with instant bank settlement',
                'High-converting promotional marketing assets'
            ],
            telemetry: 'AFFILIATE ENGINE · INSTANT ATTRIBUTION',
            metricTag: '+35% Organic Growth',
            scope: 'Referral & Commission'
        }
    ]

    const activeRole = ROLES[activeRoleIndex]
    const RoleIcon = activeRole.icon

    return (
        <section
            aria-label="Multi-Role Architecture"
            className="w-full bg-[#001D3D] text-white py-20 lg:py-28 px-6 sm:px-8 lg:px-12 border-b border-white/10"
        >
            <div className="max-w-7xl mx-auto">
                {/* 1. Header with Architectural Authority */}
                <div className="max-w-3xl mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#38BDF8] text-xs font-bold uppercase tracking-widest mb-4">
                        <Users size={13} />
                        <span>Sovereign Multi-Role Governance</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-manrope leading-[1.15] mb-4">
                        Custom-tailored console architecture for every institutional stakeholder.
                    </h2>

                    <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed font-worksans">
                        Dedicated, role-permissioned portal experiences engineered specifically for Owners, Administrators, Teachers, Students, Parents, and Affiliates.
                    </p>
                </div>

                {/* 2. Numbered Role Navigator (Anti-card) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 border-b border-white/15 pb-px mb-12">
                    {ROLES.map((r, idx) => {
                        const isActive = activeRoleIndex === idx
                        return (
                            <button
                                key={r.id}
                                onClick={() => setActiveRoleIndex(idx)}
                                className={`text-left p-3 rounded-t-lg transition-all relative ${
                                    isActive
                                        ? 'bg-white/10 text-white font-bold'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                                    <span>{r.number}</span>
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />}
                                </div>
                                <div className="text-xs sm:text-sm font-manrope font-bold leading-tight line-clamp-1">
                                    {r.role}
                                </div>
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* 3. Asymmetric Role Console Preview (60% Specifications / 40% Telemetry Dock) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left Column (7 cols): Role Capabilities */}
                    <div className="lg:col-span-7">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#38BDF8]">
                                {activeRole.category}
                            </span>
                            <span className="text-xs font-mono text-slate-400">·</span>
                            <span className="text-xs font-mono text-slate-300">
                                Scope: {activeRole.scope}
                            </span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-manrope mb-4 leading-tight">
                            {activeRole.headline}
                        </h3>

                        <p className="text-base text-slate-300 leading-relaxed font-worksans mb-8">
                            {activeRole.desc}
                        </p>

                        {/* Perks Grid */}
                        <div className="space-y-3 mb-8">
                            {activeRole.perks.map((perk, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10"
                                >
                                    <CheckCircle size={16} className="text-[#38BDF8] shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium text-slate-200 font-worksans">
                                        {perk}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (5 cols): Institutional Console Telemetry */}
                    <div className="lg:col-span-5 bg-[#00142A] border border-white/15 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#38BDF8]">
                                    <RoleIcon size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white font-manrope">
                                        {activeRole.role}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                                        Role Workspace
                                    </div>
                                </div>
                            </div>

                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded font-bold">
                                {activeRole.metricTag}
                            </span>
                        </div>

                        <div className="text-xs font-mono text-slate-400 tracking-wider uppercase mb-2">
                            Security & Permission Profile
                        </div>
                        <div className="text-sm text-slate-200 font-medium mb-6 leading-relaxed">
                            Isolated row-level tenant boundary. Multi-factor authentication with granular audit trail logging for all administrative events.
                        </div>

                        {/* Telemetry Status Capsule */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 mb-6 font-mono text-xs text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{activeRole.telemetry}</span>
                        </div>

                        {/* Direct Action */}
                        <Link
                            href="/request-demo"
                            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl bg-white text-[#001D3D] font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg"
                        >
                            <span>Schedule {activeRole.role} Walkthrough</span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
