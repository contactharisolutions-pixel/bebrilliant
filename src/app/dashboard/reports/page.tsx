'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, GraduationCap, Users, UsersRound, School } from 'lucide-react'
import StudentPerformanceReport from '@/components/admin/reports/StudentPerformanceReport'
import MergedAcademicReport from '@/components/admin/reports/MergedAcademicReport'
import TeacherPerformanceReport from '@/components/admin/reports/TeacherPerformanceReport'
import SchoolPerformanceReport from '@/components/admin/reports/SchoolPerformanceReport'

const COLORS = {
    primary: '#004B93',
    background: '#F8FAFC',
    border: '#E2E8F0',
}

function ReportsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const reportType = searchParams.get('type') || 'students'

    const isTeacherReport = reportType === 'teachers' || reportType === 'teacher'
    const isSchoolReport = reportType === 'performance' || reportType === 'school' || reportType === 'results'
    const isMergedAcademicReport = ['class', 'classes', 'subject', 'subjects', 'chapter', 'chapters', 'topic', 'topics'].includes(reportType)
    const isStudentReport = !isTeacherReport && !isSchoolReport && !isMergedAcademicReport

    let initialSubView: 'class' | 'subject' | 'chapter' = 'class'
    if (['chapter', 'chapters', 'topic', 'topics'].includes(reportType)) {
        initialSubView = 'chapter'
    } else if (['subject', 'subjects'].includes(reportType)) {
        initialSubView = 'subject'
    }

    return (
        <div style={{ padding: '36px 48px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* TOP TAB NAVIGATION SWITCHER (PRINT HIDDEN) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl">
                    <button
                        onClick={() => router.push('/dashboard/reports?type=students')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            isStudentReport
                                ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Student Performance Report</span>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/reports?type=teachers')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            isTeacherReport
                                ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <UsersRound className="w-4 h-4" />
                        <span>Teacher Performance Report</span>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/reports?type=class')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            isMergedAcademicReport
                                ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Class, Subject & Chapter Analytics</span>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/reports?type=performance')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            isSchoolReport
                                ? 'bg-white text-[#004B93] shadow-md shadow-[#004B93]/5'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <School className="w-4 h-4" />
                        <span>School Performance Report</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                        Academic Year: <strong>2026–27</strong>
                    </span>
                </div>
            </div>

            {/* VIEW CONDITIONAL RENDERING */}
            {isTeacherReport ? (
                <TeacherPerformanceReport />
            ) : isSchoolReport ? (
                <SchoolPerformanceReport />
            ) : isMergedAcademicReport ? (
                <MergedAcademicReport initialSubView={initialSubView} />
            ) : (
                <StudentPerformanceReport />
            )}
        </div>
    )
}

export default function AnalyticsReports() {
    return (
        <Suspense fallback={
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
                <Loader2 size={48} color={COLORS.primary} className="animate-spin" style={{ marginBottom: 24 }} />
                <div style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.05em' }}>LOADING REPORT SYSTEM...</div>
            </div>
        }>
            <ReportsContent />
        </Suspense>
    )
}
