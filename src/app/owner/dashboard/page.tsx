'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    Building2, Users, GraduationCap, ClipboardCheck,
    ChevronRight, ChevronDown, Calendar,
    Headphones, MapPin, BarChart2, Crown, Activity,
    CheckCircle2, UserPlus, FileText, CreditCard,
    MessageSquare, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react'
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

export default function DashboardPage() {
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Divyesh')
    const [growthTimeframe, setGrowthTimeframe] = useState('Last 6 Months')
    const [revenueTimeframe, setRevenueTimeframe] = useState('This Year')

    // Fetch live dashboard metrics from database via API
    const loadData = useCallback(async () => {
        try {
            const [dashRes, authRes] = await Promise.allSettled([
                fetch('/api/owner/dashboard?days=30'),
                fetch('/api/auth/me')
            ])

            if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
                const json = await dashRes.value.json()
                setData(json)
            }
            if (authRes.status === 'fulfilled' && authRes.value.ok) {
                const authJson = await authRes.value.json()
                if (authJson?.fullName) {
                    const firstName = authJson.fullName.split(' ')[0]
                    setUserName(firstName || 'Divyesh')
                }
            }
        } catch (err) {
            console.error('Error fetching dashboard metrics:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Live aggregated statistics directly from DB
    const stats = data?.stats || {}
    
    // Formatted KPI numbers
    const totalSchools = Number(stats.totalTenants ?? 0).toLocaleString('en-IN')
    const totalStudents = Number(stats.totalStudents ?? 0).toLocaleString('en-IN')
    const totalFaculty = Number(stats.totalTeachers ?? 0).toLocaleString('en-IN')
    const totalExams = Number(stats.totalExams ?? 0).toLocaleString('en-IN')
    const totalRevenueDisplay = '₹ ' + Number(stats.totalRevenue ?? 0).toLocaleString('en-IN')

    // Growth subtext helpers
    const tenantGrowthText = stats.tenantGrowth !== undefined && stats.tenantGrowth !== null
        ? `${stats.tenantGrowth >= 0 ? '↑ +' : '↓ '}${Math.abs(stats.tenantGrowth)}% this month`
        : `+${stats.periodTenants || 0} this month`

    const studentGrowthText = stats.studentGrowth !== undefined && stats.studentGrowth !== null
        ? `${stats.studentGrowth >= 0 ? '↑ +' : '↓ '}${Math.abs(stats.studentGrowth)}% this month`
        : `+${stats.periodStudents || 0} this month`

    const teacherGrowthText = stats.teacherGrowth !== undefined && stats.teacherGrowth !== null
        ? `${stats.teacherGrowth >= 0 ? '↑ +' : '↓ '}${Math.abs(stats.teacherGrowth)}% this month`
        : `+${stats.periodTeachers || 0} this month`

    const examGrowthText = stats.examGrowth !== undefined && stats.examGrowth !== null
        ? `${stats.examGrowth >= 0 ? '↑ +' : '↓ '}${Math.abs(stats.examGrowth)}% this month`
        : `+${stats.periodExams || 0} this month`

    const revenueGrowthText = stats.revenueGrowth !== undefined && stats.revenueGrowth !== null
        ? `${stats.revenueGrowth >= 0 ? '↑ +' : '↓ '}${Math.abs(stats.revenueGrowth)}% this month`
        : `₹ ${Number(stats.periodRevenue || 0).toLocaleString('en-IN')} this month`

    // Dynamic Date & Academic Year
    const todayFormatted = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
    const nowYear = new Date().getFullYear()
    const nowMonth = new Date().getMonth()
    const academicYear = nowMonth >= 5 
        ? `${nowYear}-${(nowYear + 1).toString().slice(2)}` 
        : `${nowYear - 1}-${nowYear.toString().slice(2)}`

    // Dynamic Chart Datasets
    const studentGrowthData = data?.monthlyUsers && data.monthlyUsers.length > 0 
        ? data.monthlyUsers 
        : [{ name: 'Current', students: stats.totalStudents || 0 }]

    const maxStudentCount = data?.maxStudentsInMonth || stats.totalStudents || 0
    const studentGrowthPct = data?.overallStudentGrowthPct ?? stats.studentGrowth ?? 0

    const revenueChartData = data?.chartData && data.chartData.length > 0
        ? data.chartData
        : [{ name: 'Current', rev: Math.round(((stats.totalRevenue || 0) / 100000) * 10) / 10 }]

    const revenueLakhsDisplay = (stats.totalRevenue || 0) >= 100000
        ? `₹ ${((stats.totalRevenue || 0) / 100000).toFixed(1)}L`
        : `₹ ${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`

    const stateDistribution = data?.stateDistribution || []

    const examSummary = data?.examSummary || {
        total: stats.totalExams || 0,
        completed: stats.successfulAttempts || 0,
        inProgress: 0,
        pending: stats.totalExams || 0,
        completionRate: 0
    }

    const examGaugeData = [
        { name: 'Completed', value: examSummary.completionRate || 0 },
        { name: 'Remaining', value: Math.max(0, 100 - (examSummary.completionRate || 0)) }
    ]

    const subDistribution = data?.subDistribution || []

    const recentActivities = data?.recentActivities || []
    const schoolsList = data?.recentTenants || []
    const ticketsList = data?.openTickets || []

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-7 font-sans text-slate-800">
            {/* TOP BAR / HEADER */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                {/* User Greeting */}
                <div>
                    <h1 className="text-2xl md:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Welcome back, {userName}! <span className="inline-block animate-bounce">👋</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        Here&apos;s what&apos;s happening across your education network today.
                    </p>
                </div>

                {/* Date & Quote Cards */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* Live Calendar Date Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Calendar size={18} strokeWidth={2.2} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                                {todayFormatted}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                Academic Year {academicYear}
                            </div>
                        </div>
                    </div>

                    {/* Dr. Kalam Quote Card */}
                    <div className="bg-gradient-to-r from-[#E6F8F3] via-[#DEF5EF] to-[#D5F2EA] border border-[#BDE8DF] rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs max-w-md">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] md:text-xs text-slate-800 font-semibold leading-snug">
                                &ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                — Dr. A.P.J. Abdul Kalam
                            </span>
                        </div>
                        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs">
                            <Image
                                src="/images/kalam_avatar.jpg"
                                alt="Dr. A.P.J. Abdul Kalam"
                                fill
                                className="object-cover object-top"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP 5 HORIZONTAL KPI STAT CARDS (ALL NUMBERS FROM DB) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {/* 1. Total Schools */}
                <div 
                    onClick={() => router.push('/owner/tenants')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-white flex items-center justify-center shadow-xs">
                            <Building2 size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium text-slate-500">Total Schools</div>
                            <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                {totalSchools}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            {tenantGrowthText}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                    </div>
                </div>

                {/* 2. Total Students */}
                <div 
                    onClick={() => router.push('/owner/students')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#059669] to-[#34D399] text-white flex items-center justify-center shadow-xs">
                            <Users size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium text-slate-500">Total Students</div>
                            <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                {totalStudents}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            {studentGrowthText}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                    </div>
                </div>

                {/* 3. Total Faculty */}
                <div 
                    onClick={() => router.push('/owner/faculty')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center shadow-xs">
                            <GraduationCap size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium text-slate-500">Total Faculty</div>
                            <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                {totalFaculty}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            {teacherGrowthText}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                    </div>
                </div>

                {/* 4. Examinations */}
                <div 
                    onClick={() => router.push('/owner/exams')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#FB923C] text-white flex items-center justify-center shadow-xs">
                            <ClipboardCheck size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium text-slate-500">Examinations</div>
                            <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                {totalExams}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            {examGrowthText}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                    </div>
                </div>

                {/* 5. Total Revenue */}
                <div 
                    onClick={() => router.push('/owner/payments')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#FB7185] text-white flex items-center justify-center shadow-xs font-bold text-xl">
                            ₹
                        </div>
                        <div>
                            <div className="text-[11px] font-medium text-slate-500">Total Revenue</div>
                            <div className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                {totalRevenueDisplay}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            {revenueGrowthText}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD BODY (2 COLUMNS: LEFT 72%, RIGHT 28%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {/* LEFT COLUMN (COL SPAN 8) */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                    {/* ROW 1: Student Growth Trend & Schools by State */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Student Growth Trend (md:col-span-7) */}
                        <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-slate-700" />
                                    <h2 className="text-sm font-bold text-slate-900">Student Growth Trend</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                        <span>↑</span> {studentGrowthPct}%
                                    </span>
                                    <div className="relative">
                                        <select
                                            value={growthTimeframe}
                                            onChange={(e) => setGrowthTimeframe(e.target.value)}
                                            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 pl-2.5 pr-6 py-1 outline-none cursor-pointer"
                                        >
                                            <option>Last 6 Months</option>
                                            <option>Last 12 Months</option>
                                            <option>All Time</option>
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="h-56 w-full relative">
                                {/* Highlight peak pill dynamically computed from DB */}
                                <div className="absolute top-2 right-4 z-10 bg-slate-900 text-white rounded-lg px-2.5 py-1 text-center shadow-lg pointer-events-none">
                                    <div className="text-[11px] font-bold leading-none">{Number(maxStudentCount).toLocaleString('en-IN')}</div>
                                    <div className="text-[9px] text-slate-300 font-medium leading-tight">Students</div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                </div>

                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={studentGrowthData} margin={{ top: 20, right: 15, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                                            dy={5}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                                            tickFormatter={(val) => val === 0 ? '0' : (val >= 1000 ? `${Math.round(val / 1000)}K` : val)}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F172A',
                                                borderRadius: '8px',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}
                                            formatter={(value: any) => [Number(value).toLocaleString('en-IN') + ' Students', 'Enrollment']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="students"
                                            stroke="#0284C7"
                                            strokeWidth={3}
                                            fill="url(#studentGradient)"
                                            dot={{ r: 4, fill: '#0284C7', stroke: '#fff', strokeWidth: 2 }}
                                            activeDot={{ r: 6, fill: '#0284C7' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Schools by State (md:col-span-5) */}
                        <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} className="text-slate-700" />
                                    <h2 className="text-sm font-bold text-slate-900">Schools by State</h2>
                                </div>
                                <button
                                    onClick={() => router.push('/owner/tenants')}
                                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                    View Details <span>&gt;</span>
                                </button>
                            </div>

                            {/* Donut Chart & Legend */}
                            <div className="flex items-center justify-between gap-2 h-56">
                                {/* Donut Chart */}
                                <div className="relative w-40 h-40 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stateDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="count"
                                            >
                                                {stateDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`state-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-extrabold text-slate-900 leading-tight">{totalSchools}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">Schools</span>
                                    </div>
                                </div>

                                {/* State Breakdown Legend */}
                                <div className="flex-1 flex flex-col gap-1.5 pl-2 max-h-52 overflow-y-auto">
                                    {stateDistribution.map((item: any) => (
                                        <div key={item.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="font-medium text-slate-600 text-[11px] truncate">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-slate-800 text-[11px] shrink-0 ml-1">
                                                {item.count} <span className="text-slate-400 font-normal">({item.pct})</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: Revenue Overview, Examination Summary, Subscription Plan Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* 1. Revenue Overview */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <BarChart2 size={18} className="text-slate-700" />
                                    <h2 className="text-sm font-bold text-slate-900">Revenue Overview</h2>
                                </div>
                                <div className="relative">
                                    <select
                                        value={revenueTimeframe}
                                        onChange={(e) => setRevenueTimeframe(e.target.value)}
                                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 pl-2 pr-5 py-0.5 outline-none cursor-pointer"
                                    >
                                        <option>This Year</option>
                                        <option>Last Year</option>
                                    </select>
                                    <ChevronDown size={11} className="absolute right-1.5 top-1.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="h-44 w-full relative">
                                {/* Floating Badge calculated from DB */}
                                <div className="absolute top-1 right-2 z-10 bg-slate-900 text-white rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm pointer-events-none">
                                    {revenueLakhsDisplay}
                                </div>

                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueChartData} margin={{ top: 18, right: 10, left: -22, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0EA5E9" />
                                                <stop offset="100%" stopColor="#06B6D4" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                                            tickFormatter={(v) => v === 0 ? '0' : `${v}L`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F172A',
                                                borderRadius: '8px',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}
                                            formatter={(value: any, name: any, item: any) => [
                                                item?.payload?.displayRev || `₹ ${Number(value * 100000).toLocaleString('en-IN')}`,
                                                'Revenue'
                                            ]}
                                        />
                                        <Bar
                                            dataKey="rev"
                                            fill="url(#barRevGrad)"
                                            radius={[4, 4, 0, 0]}
                                            barSize={18}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Examination Summary */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={18} className="text-slate-700" />
                                <h2 className="text-sm font-bold text-slate-900">Examination Summary</h2>
                            </div>

                            <div className="flex items-center justify-between gap-2 h-44">
                                {/* Gauge / Progress Ring */}
                                <div className="relative w-28 h-28 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={examGaugeData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={48}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                            >
                                                <Cell fill="#10B981" />
                                                <Cell fill="#E2E8F0" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-lg font-extrabold text-slate-900 leading-tight">
                                            {examSummary.completionRate}%
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium">Completed</span>
                                    </div>
                                </div>

                                {/* Examination breakdown list */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0 bg-[#3B82F6]" />
                                            <span className="text-slate-600 font-medium text-[11px]">Scheduled</span>
                                        </div>
                                        <span className="font-bold text-slate-900 text-xs">
                                            {Number(examSummary.total).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0 bg-[#10B981]" />
                                            <span className="text-slate-600 font-medium text-[11px]">Completed</span>
                                        </div>
                                        <span className="font-bold text-slate-900 text-xs">
                                            {Number(examSummary.completed).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0 bg-[#06B6D4]" />
                                            <span className="text-slate-600 font-medium text-[11px]">In Progress</span>
                                        </div>
                                        <span className="font-bold text-slate-900 text-xs">
                                            {Number(examSummary.inProgress).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0 bg-[#F97316]" />
                                            <span className="text-slate-600 font-medium text-[11px]">Pending</span>
                                        </div>
                                        <span className="font-bold text-slate-900 text-xs">
                                            {Number(examSummary.pending).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Subscription Plan Distribution */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3">
                                <Crown size={18} className="text-amber-500" />
                                <h2 className="text-sm font-bold text-slate-900">Subscription Plan Distribution</h2>
                            </div>

                            <div className="flex items-center justify-between gap-2 h-44">
                                {/* Donut Ring */}
                                <div className="relative w-28 h-28 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={subDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={48}
                                                paddingAngle={2}
                                                dataKey="count"
                                            >
                                                {subDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`plan-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-base font-extrabold text-slate-900 leading-tight">{totalSchools}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">Schools</span>
                                    </div>
                                </div>

                                {/* Plan list */}
                                <div className="flex-1 flex flex-col gap-2 max-h-40 overflow-y-auto">
                                    {subDistribution.map((plan: any) => (
                                        <div key={plan.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
                                                <span className="text-slate-600 font-medium text-[11px] truncate">{plan.name}</span>
                                            </div>
                                            <span className="font-semibold text-slate-800 text-[11px] shrink-0 ml-1">
                                                {plan.count} <span className="text-slate-400 font-normal">({plan.pct})</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Recent Activities (COL SPAN 4) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">Recent Activities</h2>
                            </div>
                            <button
                                onClick={() => router.push('/owner/audit')}
                                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Activities List directly from DB */}
                        <div className="flex flex-col gap-4">
                            {recentActivities.map((act: any) => {
                                const IconComponent = act.type === 'school' 
                                    ? Building2 
                                    : act.type === 'payment' 
                                    ? CreditCard 
                                    : act.type === 'exam' 
                                    ? FileText 
                                    : ShieldCheck

                                const timeAgo = act.time ? new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recently'

                                return (
                                    <div key={act.id} className="flex items-start gap-3">
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                            style={{ backgroundColor: act.iconBg || '#EFF6FF', color: act.iconColor || '#3B82F6' }}
                                        >
                                            <IconComponent size={18} strokeWidth={2.2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-1">
                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                    {act.title}
                                                </span>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                    {timeAgo}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                {act.sub}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Real-time platform activity stream</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW (3 CARDS: Recent Schools Table, Open Support Tickets, Promotional Academic Banner) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 1. Recent Schools Table (lg:col-span-5) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                            <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">Recent Schools</h2>
                            </div>
                            <button
                                onClick={() => router.push('/owner/tenants')}
                                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Table directly from DB */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-slate-400 font-medium border-b border-slate-100 text-[11px]">
                                        <th className="pb-2 font-medium">School Name</th>
                                        <th className="pb-2 font-medium">City</th>
                                        <th className="pb-2 font-medium">Students</th>
                                        <th className="pb-2 font-medium">Plan</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 font-medium">Joined On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {schoolsList.map((school: any, idx: number) => (
                                        <tr key={school.id || idx} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                                {school.name}
                                            </td>
                                            <td className="py-2.5 text-slate-600 whitespace-nowrap">
                                                {school.city}
                                            </td>
                                            <td className="py-2.5 text-slate-700 font-medium whitespace-nowrap">
                                                {school.students}
                                            </td>
                                            <td className="py-2.5 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                                                    {school.plan}
                                                </span>
                                            </td>
                                            <td className="py-2.5 whitespace-nowrap">
                                                <span className={`text-[11px] font-bold ${
                                                    school.status === 'Active' ? 'text-emerald-600' : 'text-amber-500'
                                                }`}>
                                                    {school.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                                                {school.joinedOn}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 2. Open Inbound Inquiries Table (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                            <div className="flex items-center gap-2">
                                <Headphones size={18} className="text-slate-700" />
                                <h2 className="text-sm font-bold text-slate-900">Open Inquiries & Tickets</h2>
                            </div>
                            <button
                                onClick={() => router.push('/owner/crm')}
                                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Table directly from DB */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-slate-400 font-medium border-b border-slate-100 text-[11px]">
                                        <th className="pb-2 font-medium">#</th>
                                        <th className="pb-2 font-medium">Subject</th>
                                        <th className="pb-2 font-medium">Priority</th>
                                        <th className="pb-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {ticketsList.map((ticket: any) => (
                                        <tr key={ticket.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-2.5 font-medium text-slate-500 text-[11px]">
                                                {ticket.id}
                                            </td>
                                            <td className="py-2.5 font-semibold text-slate-800 truncate max-w-[140px]">
                                                {ticket.subject}
                                            </td>
                                            <td className="py-2.5 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    ticket.priority === 'High'
                                                        ? 'bg-rose-50 text-rose-600'
                                                        : ticket.priority === 'Medium'
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="py-2.5 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    ticket.status === 'Open'
                                                        ? 'bg-rose-50 text-rose-600'
                                                        : ticket.status === 'Resolved'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. Promotional Academic Banner (lg:col-span-3) */}
                <div className="lg:col-span-3 bg-[#EAF5FC] border border-sky-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden">
                    <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 shadow-xs border border-white/60">
                        <Image
                            src="/images/school_future_banner.jpg"
                            alt="Stronger Schools Brighter Futures"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg text-right shadow-xs">
                            <div className="text-[10px] font-bold text-slate-900 leading-tight">Stronger Schools</div>
                            <div className="text-[10px] font-bold text-sky-700 leading-tight">Brighter Futures</div>
                            <div className="text-[7px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                                Manage • Monitor • Empower
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={() => router.push('/owner/tenants?provision=true')}
                            className="w-full bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-xs py-2.5 px-4 rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <span>Grow the Nation Through Education</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
