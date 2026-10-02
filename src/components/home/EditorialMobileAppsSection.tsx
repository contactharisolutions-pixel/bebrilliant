'use client'

import React from 'react'
import Link from 'next/link'
import { Smartphone, Download, UserCheck, GraduationCap, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react'

export function EditorialMobileAppsSection() {
    return (
        <section
            aria-label="Native Mobile Ecosystem"
            className="w-full bg-white py-20 lg:py-28 px-6 sm:px-8 lg:px-12 border-b border-gray-200"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column (7 cols): Architecture & Downloads */}
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-widest mb-4">
                            <Smartphone size={13} />
                            <span>Native Mobile Ecosystem</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight font-manrope leading-[1.15] mb-4">
                            BeBrilliant mobile companions for classroom faculty and candidates.
                        </h2>

                        <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed font-worksans mb-8">
                            Native Android APK companions engineered for offline exam syncing, push notifications for test schedules, live biometric attendance, and instant student scorecards on mobile devices.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            {/* Teacher App */}
                            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                                        <UserCheck size={20} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-gray-900 font-manrope mb-2">
                                        Faculty Companion
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed font-worksans mb-6">
                                        Conduct live exam supervision, take offline classroom attendance, and trigger automated paper grading directly from your smartphone.
                                    </p>
                                </div>
                                <a
                                    href="/downloads/teacher-companion.apk"
                                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold font-manrope hover:bg-blue-700 transition-colors"
                                >
                                    <Download size={14} />
                                    <span>Download Faculty APK</span>
                                </a>
                            </div>

                            {/* Student App */}
                            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center mb-4">
                                        <GraduationCap size={20} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-gray-900 font-manrope mb-2">
                                        Student Companion
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed font-worksans mb-6">
                                        Take timed tests with offline question caching, review detailed solutions, and track chapter-wise learning percentiles.
                                    </p>
                                </div>
                                <a
                                    href="/downloads/student-companion.apk"
                                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-green-600 text-white text-xs font-bold font-manrope hover:bg-green-700 transition-colors"
                                >
                                    <Download size={14} />
                                    <span>Download Student APK</span>
                                </a>
                            </div>
                        </div>

                        {/* Security assurance */}
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                            <ShieldCheck size={14} className="text-green-600" />
                            <span>Signed production builds with automated Supabase realtime synchronization.</span>
                        </div>
                    </div>

                    {/* Right Column (5 cols): Architectural Sync Preview */}
                    <div className="lg:col-span-5 bg-gray-900 text-white rounded-3xl p-8 sm:p-10 border border-gray-700 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-700 mb-6">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={16} className="text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
                                <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                                    Cross-Platform Engine
                                </span>
                            </div>
                            <span className="text-[11px] font-mono text-green-400 bg-green-900/20 border border-green-800/40 px-2 py-0.5 rounded">
                                Realtime Sync
                            </span>
                        </div>

                        <div className="text-xl font-extrabold font-manrope mb-2">
                            Continuous Web-to-Mobile Synchronization
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed font-worksans mb-8">
                            Assessments configured on the Next.js Web Console automatically propagate to candidates' native Android apps with encrypted offline caching for poor connectivity environments.
                        </p>

                        <div className="space-y-4 pt-4 border-t border-gray-700 font-mono text-xs text-gray-300">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Offline Caching:</span>
                                <span className="text-green-400 font-bold">Encrypted SQLite</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Sync Latency:</span>
                                <span className="text-white font-bold">&lt; 250ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Target Architecture:</span>
                                <span className="text-white font-bold">Android 8.0+ / ARM64</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
