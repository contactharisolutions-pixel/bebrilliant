'use client'
import React, { useState, useEffect } from 'react'
import {
    Users, UserCheck, GraduationCap, ClipboardList, Wallet, DollarSign, Target,
    PlusCircle, UserPlus, Eye, AlertCircle,
    Calendar, BookOpen, BarChart3, MessagesSquare, Award, Clock, BrainCircuit, Zap,
    TrendingUp, Shield, Activity, Sparkles, ArrowUpRight, Globe, Loader2,
    UploadCloud, Bell, ChevronRight, UsersRound, Building2, Percent,
    FileText, Send, ScanLine, Printer, CheckCircle2, AlertTriangle, Info
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line
} from 'recharts'
import { useIdentity } from '@/contexts/IdentityContext'
import Link from 'next/link'
import { C, GRADIENT, getRoleAccent } from '@/lib/theme'

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
    blue: '#2563EB',            // Accent / interactive blue (official)
    blueDark: '#1E3A8A',        // Brand primary (deep navy)
    blueLight: '#EFF6FF',       // AI block / blue bg
    green: '#0CA35C',           // Official brand green
    greenLight: '#DCFCE7',      // Official success bg
    amber: '#F59E0B',           // Official warning (unchanged)
    amberLight: '#FEF3C7',      // Official warning bg
    red: '#DC2626',             // Official error
    redLight: '#FEE2E2',        // Official error bg
    purple: '#672AEA',          // Official AI purple
    purpleLight: '#F5F3FF',     // Purple bg (unchanged)
    slate900: '#111827',        // Primary text (official)
    slate700: '#374151',        // Semi-dark text
    slate500: '#6B7280',        // Secondary text (official)
    slate300: '#D1D5DB',        // Hover border
    slate100: '#F3F4F6',        // Skeleton loader
    slate50: '#F7F8FA',         // Secondary background (official)
    white: '#FFFFFF',
    border: '#E5E7EB',          // Official border
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
    shadowLg: '0 10px 24px rgba(0,0,0,0.06)',
    shadowBrand: '0 10px 15px -3px rgba(30,58,138,0.20)',
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
    if (!iso) return ''
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}
function fmt(n: number): string {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
}
function fmtCurrency(n: number): string {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
    return `₹${n.toLocaleString('en-IN')}`
}

// ── SKELETON LOADER ────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) {
    return (
        <div style={{
            width: w, height: h, borderRadius: r,
            background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
        }} />
    )
}

// ── PREMIUM KPI CARD ──────────────────────────────────────────────────────────
function MetricCard({
    label, value, icon: Icon, color, bg, trend, trendUp = true, subtitle, pulse = false
}: {
    label: string; value: string | number; icon: any;
    color: string; bg: string; trend?: string; trendUp?: boolean;
    subtitle?: string; pulse?: boolean
}) {
    return (
        <div style={{
            background: T.white, borderRadius: 20, border: `1px solid ${T.border}`,
            padding: '24px 28px', position: 'relative', overflow: 'hidden',
            boxShadow: T.shadow, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            cursor: 'default'
        }}
            className="enterprise-card"
        >
            {/* Subtle top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}00)`, borderRadius: '20px 20px 0 0' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={color} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.slate500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
                {pulse && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.green}30`, animation: 'livepin 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: '0.06em' }}>LIVE</span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div style={{ fontSize: 36, fontWeight: 800, color: T.slate900, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>
                {value}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {trend && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 100,
                        background: trendUp ? T.greenLight : T.redLight,
                        color: trendUp ? T.green : T.red,
                        fontSize: 11, fontWeight: 700
                    }}>
                        <TrendingUp size={11} style={{ transform: trendUp ? 'none' : 'rotate(180deg)' }} />
                        {trend}
                    </div>
                )}
                {subtitle && (
                    <span style={{ fontSize: 12, color: T.slate500, fontWeight: 500 }}>{subtitle}</span>
                )}
            </div>

            {/* Watermark icon */}
            <div style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.04 }}>
                <Icon size={90} color={color} />
            </div>
        </div>
    )
}

// ── SECTION HEADER ─────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, action, actionHref }: { title: string; subtitle?: string; action?: string; actionHref?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.slate900, letterSpacing: '-0.02em' }}>{title}</h2>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.slate500, fontWeight: 500 }}>{subtitle}</p>}
            </div>
            {action && actionHref && (
                <Link href={actionHref} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: T.blue, textDecoration: 'none' }}>
                    {action} <ChevronRight size={14} />
                </Link>
            )}
        </div>
    )
}

// ── ACTIVITY FEED ─────────────────────────────────────────────────────────────
function ActivityFeed({ items }: { items: any[] }) {
    const iconMap: Record<string, { icon: any; color: string; bg: string }> = {
        student: { icon: UserPlus, color: T.green, bg: T.greenLight },
        exam: { icon: ClipboardList, color: T.blue, bg: T.blueLight },
        fee: { icon: DollarSign, color: T.amber, bg: T.amberLight },
        default: { icon: Activity, color: T.purple, bg: T.purpleLight },
    }
    const fallback = [
        { type: 'exam', label: 'Mid-Term Physics Assessment created', time: new Date(Date.now() - 3600000).toISOString(), color: T.blue },
        { type: 'student', label: 'Aarav Sharma enrolled as student', time: new Date(Date.now() - 7200000).toISOString(), color: T.green },
        { type: 'exam', label: 'NEET Chemistry Mock created', time: new Date(Date.now() - 86400000).toISOString(), color: T.blue },
    ]
    const feed = items.length > 0 ? items : fallback
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {feed.map((item, i) => {
                const m = iconMap[item.type] || iconMap.default
                const ItemIcon = m.icon
                return (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 0',
                        borderBottom: i < feed.length - 1 ? `1px solid ${T.slate100}` : 'none'
                    }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ItemIcon size={16} color={m.color} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.slate700, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(item.time)}</div>
                    </div>
                )
            })}
        </div>
    )
}

// ── UPCOMING EXAMS ─────────────────────────────────────────────────────────────
function UpcomingExamCard({ exam }: { exam: any }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: T.slate50,
            borderRadius: 14, border: `1px solid ${T.border}`,
            transition: 'all 0.2s', cursor: 'default'
        }}
            className="enterprise-row"
        >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={18} color={T.blue} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.slate900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exam.title}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 3 }}>{exam.subject} • Assessment</div>
            </div>
            <div style={{
                padding: '5px 12px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                background: T.blueLight, color: T.blue, whiteSpace: 'nowrap', letterSpacing: '0.05em'
            }}>ACTIVE</div>
        </div>
    )
}

// ── QUICK ACTION CARD ──────────────────────────────────────────────────────────
function QuickAction({ title, desc, icon: Icon, href, variant = 'ghost' }: { title: string; desc: string; icon: any; href: string; variant?: 'primary' | 'dark' | 'ghost' }) {
    const styles = {
        primary: { bg: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueDark} 100%)`, color: T.white, iconBg: 'rgba(255,255,255,0.15)', border: 'none', shadow: `0 8px 24px ${T.blue}30` },
        dark: { bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: T.white, iconBg: 'rgba(255,255,255,0.1)', border: 'none', shadow: '0 8px 24px rgba(15,23,42,0.25)' },
        ghost: { bg: T.white, color: T.slate900, iconBg: T.slate100, border: `1px solid ${T.border}`, shadow: T.shadow },
    }
    const s = styles[variant]
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div style={{
                padding: '20px 22px', borderRadius: 16, background: s.bg, color: s.color,
                border: s.border, boxShadow: s.shadow,
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer'
            }}
                className="enterprise-action"
            >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={s.color} strokeWidth={2.5} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 500, marginTop: 2 }}>{desc}</div>
                </div>
            </div>
        </Link>
    )
}

// ── PROGRESS RING ─────────────────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const stroke = circ - (pct / 100) * circ
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.slate100} strokeWidth={6} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
                strokeDasharray={circ} strokeDashoffset={stroke}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
    )
}

// ── STAT RING CARD ────────────────────────────────────────────────────────────
function RingCard({ label, value, pct, color, bg, icon: Icon }: { label: string; value: string; pct: number; color: string; bg: string; icon: any }) {
    return (
        <div style={{
            background: T.white, borderRadius: 20, border: `1px solid ${T.border}`,
            padding: '24px 28px', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 20
        }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <ProgressRing pct={pct} color={color} size={68} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={color} strokeWidth={2.5} />
                </div>
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.slate900, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
                <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 100, background: T.slate100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width 1s ease' }} />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── ADMIN DASHBOARD VIEW (the enterprise redesign) ─────────────────────────────
function AdminDashboardView({ data, role, identity }: { data: any; role: string; identity: any }) {
    const [liveTime, setLiveTime] = useState(new Date())
    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date()), 60000)
        return () => clearInterval(t)
    }, [])

    const kpi = data.kpi || {}
    const charts = data.charts || {}
    const feed = data.activity_feed || []
    const upcomingExams = data.upcoming_exams || []
    const tenantName = identity?.tenant?.name || 'Your Institution'
    const adminName = identity?.fullName || 'Administrator'

    const greet = liveTime.getHours() < 12 ? 'Good morning' : liveTime.getHours() < 17 ? 'Good afternoon' : 'Good evening'
    const dateStr = liveTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const customTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', boxShadow: T.shadowMd }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.slate500 }}>{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: p.color || T.slate900 }}>
                            {typeof p.value === 'number' && p.dataKey === 'revenue' ? fmtCurrency(p.value) : p.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── HERO COMMAND BAR ─────────────────────────────────── */}
            <div style={{
                background: `linear-gradient(135deg, ${T.blueDark} 0%, ${T.blue} 60%, #0066CC 100%)`,
                borderRadius: 24, padding: '32px 40px', marginBottom: 32,
                position: 'relative', overflow: 'hidden',
                boxShadow: `0 16px 48px ${T.blue}40`
            }}>
                {/* Background pattern */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
                {/* Glow orbs */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -40, right: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em', backdropFilter: 'blur(8px)' }}>
                                ● ACADEMIC PORTAL ACTIVE
                            </div>
                            <div style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                {tenantName}
                            </div>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                            {greet}, {adminName.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            {dateStr} · School Admin Dashboard
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                        <Link href="/dashboard/students" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '12px 20px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.15)', color: '#FFF',
                                border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                backdropFilter: 'blur(8px)', transition: 'all 0.2s'
                            }}>
                                <UserPlus size={16} /> Add Student
                            </button>
                        </Link>
                        <Link href="/dashboard/exams/new" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '12px 20px', borderRadius: 14,
                                background: '#FFFFFF', color: T.blue,
                                border: 'none', fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all 0.2s'
                            }}>
                                <PlusCircle size={16} /> Create Exam
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── ROW 1: PRIMARY KPI CARDS ──────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
                <MetricCard
                    label="Total Students" value={fmt(kpi.total_students || 0)}
                    icon={GraduationCap} color={T.blue} bg={T.blueLight}
                    trend={kpi.total_students > 0 ? `${kpi.total_students} enrolled` : undefined}
                    subtitle="enrolled students"
                />
                <MetricCard
                    label="Active Today" value={fmt(kpi.active_students || 0)}
                    icon={Activity} color={T.green} bg={T.greenLight}
                    trend={kpi.total_students > 0 ? `${kpi.conversion_rate || 0}% rate` : undefined}
                    subtitle="online now" pulse
                />
                <MetricCard
                    label="Exams Created" value={kpi.exams_created || 0}
                    icon={ClipboardList} color={T.amber} bg={T.amberLight}
                    subtitle="total assessments"
                />
                <MetricCard
                    label="Fees Collected" value={fmtCurrency(kpi.revenue_earned || 0)}
                    icon={DollarSign} color={T.purple} bg={T.purpleLight}
                    trend={kpi.revenue_earned > 0 ? 'This Year' : undefined}
                    subtitle="total revenue"
                />
            </div>

            {/* ── ROW 2: SECONDARY KPI CARDS ───────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <RingCard
                    label="Teachers & Staff" value={String(kpi.teachers_count || 0)}
                    pct={Math.min(100, (kpi.teachers_count || 0) * 5)}
                    color={T.blue} bg={T.blueLight} icon={UsersRound}
                />
                <RingCard
                    label="Attendance Rate" value={`${kpi.attendance_rate || 0}%`}
                    pct={kpi.attendance_rate || 0}
                    color={kpi.attendance_rate >= 75 ? T.green : T.amber}
                    bg={kpi.attendance_rate >= 75 ? T.greenLight : T.amberLight}
                    icon={UserCheck}
                />
                <RingCard
                    label="Avg Academic Score" value={`${kpi.avg_score || 0}%`}
                    pct={kpi.avg_score || 0}
                    color={kpi.avg_score >= 70 ? T.green : kpi.avg_score >= 50 ? T.amber : T.red}
                    bg={kpi.avg_score >= 70 ? T.greenLight : kpi.avg_score >= 50 ? T.amberLight : T.redLight}
                    icon={Award}
                />
            </div>

            {/* ── CHARTS ROW ───────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 32 }}>

                {/* Enrollment Trend — Area Chart */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 32px', boxShadow: T.shadow }}>
                    <SectionHeader
                        title="Student Enrollment Trend"
                        subtitle="Monthly cumulative enrollment this academic year"
                        action="View Reports" actionHref="/dashboard/faculty/analytics/results-360"
                    />
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.student_growth || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.blue} stopOpacity={0.18} />
                                        <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.slate100} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: T.slate500, fontWeight: 600 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: T.slate500, fontWeight: 600 }} />
                                <Tooltip content={customTooltip} />
                                <Area type="monotone" dataKey="students" stroke={T.blue} strokeWidth={3}
                                    fill="url(#enrollGrad)" dot={{ r: 4, fill: T.blue, stroke: T.white, strokeWidth: 2 }}
                                    activeDot={{ r: 6, stroke: T.white, strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Bar Chart */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 32px', boxShadow: T.shadow }}>
                    <SectionHeader
                        title="Fee Collection"
                        subtitle="Quarterly revenue breakdown"
                        action="View Wallet" actionHref="/dashboard/wallet"
                    />
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.revenue_trends || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={36}>
                                <defs>
                                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.purple} stopOpacity={1} />
                                        <stop offset="100%" stopColor={T.purple} stopOpacity={0.5} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.slate100} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: T.slate500, fontWeight: 600 }} />
                                <Tooltip content={customTooltip} />
                                <Bar dataKey="revenue" fill="url(#revGrad2)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM GRID: Activity + Exams + Radar ────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32 }}>

                {/* Recent Activity */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 28px', boxShadow: T.shadow }}>
                    <SectionHeader title="Recent Activity" subtitle="Latest events across your portal" />
                    <ActivityFeed items={feed} />
                </div>

                {/* Upcoming Exams */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 28px', boxShadow: T.shadow }}>
                    <SectionHeader
                        title="Active Exams"
                        subtitle="Currently live assessments"
                        action="Manage Exams" actionHref="/dashboard/exams"
                    />
                    {upcomingExams.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {upcomingExams.map((ex: any) => (
                                <UpcomingExamCard key={ex.id} exam={ex} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: T.slate500 }}>
                            <ClipboardList size={40} color={T.slate300} style={{ display: 'block', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 13, fontWeight: 600 }}>No active exams</div>
                            <Link href="/dashboard/exams/new" style={{ fontSize: 12, color: T.blue, fontWeight: 600, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
                                Create one →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Subject Performance Radar */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 28px', boxShadow: T.shadow }}>
                    <SectionHeader title="Subject Performance" subtitle="Average mastery by subject" />
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={charts.subject_performance || []} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                                <PolarGrid stroke={T.slate100} />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: T.slate500, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="score" stroke={T.blue} fill={T.blue} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: T.blue, stroke: T.white, strokeWidth: 2 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
            <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 32px', boxShadow: T.shadow }}>
                <SectionHeader title="Quick Actions" subtitle="Jump to common admin tasks" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
                    <QuickAction title="Create Exam" desc="New assessment" icon={PlusCircle} href="/dashboard/exams/new" variant="primary" />
                    <QuickAction title="Add Student" desc="Register learner" icon={UserPlus} href="/dashboard/students" variant="dark" />
                    <QuickAction title="Grade Papers" desc="Answer sheets" icon={FileText} href="/dashboard/faculty/answer-grading" variant="ghost" />
                    <QuickAction title="Upload Notes" desc="Study material" icon={UploadCloud} href="/dashboard/material" variant="ghost" />
                    <QuickAction title="Send Notice" desc="Announcement" icon={Send} href="/dashboard/messages" variant="ghost" />
                    <QuickAction title="AI Question Gen" desc="Generate with AI" icon={BrainCircuit} href="/dashboard/ai" variant="ghost" />
                </div>
            </div>

            {/* ── STATUS FOOTER BAR ─────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 24, marginTop: 24,
                padding: '14px 24px', borderRadius: 14, background: T.slate50,
                border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 500, color: T.slate500
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />
                    <span>All systems operational</span>
                </div>
                <div style={{ width: 1, height: 16, background: T.border }} />
                <div>Last synced: just now</div>
                <div style={{ width: 1, height: 16, background: T.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={13} color={T.blue} />
                    <span style={{ color: T.blue, fontWeight: 600 }}>Tenant Admin</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={13} color={T.slate500} />
                    <span>{tenantName}</span>
                </div>
            </div>

        </div>
    )
}

// ── STUDENT DASHBOARD VIEW — ENTERPRISE GRADE ─────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
    const color = score >= 80 ? T.green : score >= 60 ? T.amber : T.red
    const bg = score >= 80 ? T.greenLight : score >= 60 ? T.amberLight : T.redLight
    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: bg, color, fontSize: 11, fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            {label}
        </div>
    )
}

function StudentDashboardView({ data, identity }: { data: any; identity: any }) {
    const kpi = data.kpi || {}
    const upcomingExams = data.upcoming_exams || []
    const performanceTrend = data.performance_trend || []
    const subjectMastery = data.subject_mastery || []
    const weakAreas = data.weak_areas || []
    const recentResults = data.recent_results || []
    const recentMaterials = data.recent_materials || []
    const student = data.student || {}

    const studentName = identity?.fullName || student.name || 'Student'
    const tenantName = identity?.tenant?.name || 'Your School'
    const badge = student.badge || 'Learner'
    const initials = studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    const liveTime = new Date()
    const greet = liveTime.getHours() < 12 ? 'Good morning' : liveTime.getHours() < 17 ? 'Good afternoon' : 'Good evening'

    const badgeColor = badge === 'Distinction' ? '#8B5CF6' : badge === 'Excellence' ? T.blue : badge === 'Merit' ? T.green : T.amber
    const badgeBg = badge === 'Distinction' ? '#F5F3FF' : badge === 'Excellence' ? T.blueLight : badge === 'Merit' ? T.greenLight : T.amberLight

    const customTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', boxShadow: T.shadowMd }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.slate500 }}>{label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: T.green }}>{payload[0]?.value}%</p>
                </div>
            )
        }
        return null
    }

    return (
        <div>
            {/* ── STUDENT HERO BAR ─────────────────────────────────── */}
            <div style={{
                background: `linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, ${T.blue} 100%)`,
                borderRadius: 24, padding: '28px 36px', marginBottom: 28,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(15,23,42,0.30)'
            }}>
                {/* Grid pattern */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs><pattern id="sgrid" width="28" height="28" patternUnits="userSpaceOnUse">
                            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern></defs>
                        <rect width="100%" height="100%" fill="url(#sgrid)" />
                    </svg>
                </div>
                {/* Orbs */}
                <div style={{ position: 'absolute', top: -50, right: 60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(0,75,147,0.4)' }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        {/* Avatar */}
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #004B93, #0066CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#FFF', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                            {initials}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>
                                    ● STUDENT PORTAL
                                </div>
                                <div style={{ padding: '3px 10px', borderRadius: 100, background: badgeBg, fontSize: 10, fontWeight: 800, color: badgeColor, letterSpacing: '0.06em' }}>
                                    🏆 {badge.toUpperCase()}
                                </div>
                            </div>
                            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                                {greet}, {studentName.split(' ')[0]}!
                            </h1>
                            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                                {tenantName} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                        <Link href="/dashboard/student/exams" style={{ textDecoration: 'none' }}>
                            <button style={{ padding: '11px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}>
                                <ClipboardList size={15} /> My Exams
                            </button>
                        </Link>
                        <Link href="/dashboard/student/analytics" style={{ textDecoration: 'none' }}>
                            <button style={{ padding: '11px 20px', borderRadius: 14, background: '#FFFFFF', color: T.blue, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}>
                                <BarChart3 size={15} /> View Analytics
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── ROW 1: 4 PRIMARY KPI CARDS ───────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 18 }}>
                <MetricCard label="Overall Score" value={`${kpi.avg_score || 0}%`} icon={Award} color={T.blue} bg={T.blueLight} trend={kpi.avg_score > 0 ? `${kpi.avg_score}% avg` : undefined} subtitle="cumulative average" />
                <MetricCard label="Tests Completed" value={kpi.completed_exams || 0} icon={UserCheck} color={T.green} bg={T.greenLight} subtitle="exams given" />
                <MetricCard label="Tests Pending" value={kpi.pending_exams || 0} icon={Clock} color={T.amber} bg={T.amberLight} subtitle="upcoming assessments" />
                <MetricCard label="Study Streak" value={`${kpi.streak_days || 0}d`} icon={Zap} color={T.purple} bg={T.purpleLight} subtitle="consecutive days" pulse={kpi.streak_days > 0} />
            </div>

            {/* ── ROW 2: 2 RING CARDS ───────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 28 }}>
                <RingCard label="Attendance Rate" value={`${kpi.attendance_rate || 0}%`} pct={kpi.attendance_rate || 0} color={kpi.attendance_rate >= 75 ? T.green : T.amber} bg={kpi.attendance_rate >= 75 ? T.greenLight : T.amberLight} icon={UserCheck} />
                <RingCard label="Wallet Credits" value={`${kpi.credits_left || 0}`} pct={Math.min(100, ((kpi.credits_left || 0) / 2000) * 100)} color={T.purple} bg={T.purpleLight} icon={Wallet} />
            </div>

            {/* ── CHARTS ROW ───────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, marginBottom: 28 }}>

                {/* Performance Trend Line Chart */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 30px', boxShadow: T.shadow }}>
                    <SectionHeader title="Performance Trend" subtitle="Score trajectory across assessments" action="Full Analytics" actionHref="/dashboard/student/analytics" />
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.green} stopOpacity={0.2} />
                                        <stop offset="100%" stopColor={T.green} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.slate100} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: T.slate500, fontWeight: 600 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: T.slate500, fontWeight: 600 }} domain={[0, 100]} />
                                <Tooltip content={customTooltip} />
                                <Line type="monotone" dataKey="score" stroke={T.green} strokeWidth={3}
                                    dot={{ r: 5, fill: T.green, stroke: T.white, strokeWidth: 2 }}
                                    activeDot={{ r: 7, stroke: T.white, strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subject Mastery Horizontal Bars */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 30px', boxShadow: T.shadow }}>
                    <SectionHeader title="Subject Mastery" subtitle="Performance by subject" />
                    {subjectMastery.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {subjectMastery.map((s: any, i: number) => {
                                const pct = s.mastery || 0
                                const c = pct >= 80 ? T.green : pct >= 60 ? T.blue : T.amber
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700 }}>{s.subject}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: c }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: 7, borderRadius: 100, background: T.slate100, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 100, transition: 'width 0.8s ease' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subj, i) => {
                                const pct = Math.max(60, (kpi.avg_score || 75) + (i % 2 === 0 ? 5 : -5))
                                const c = pct >= 75 ? T.green : T.amber
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700 }}>{subj}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: c }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: 7, borderRadius: 100, background: T.slate100, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 100 }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BOTTOM 3-COLUMN GRID ─────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 22, marginBottom: 28 }}>

                {/* Upcoming Exams — Take Test CTA */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 26px', boxShadow: T.shadow }}>
                    <SectionHeader title="Upcoming Exams" subtitle="Available assessments for you" action="View All" actionHref="/dashboard/student/exams" />
                    {upcomingExams.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {upcomingExams.slice(0, 3).map((ex: any) => (
                                <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: T.slate50, borderRadius: 14, border: `1px solid ${T.border}`, transition: 'all 0.2s' }} className="enterprise-row">
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Target size={17} color={T.blue} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.slate900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 2 }}>{ex.subject} · {ex.duration || 60} min</div>
                                    </div>
                                    <Link href={`/dashboard/student/exams/attempt/${ex.id}`} style={{ textDecoration: 'none' }}>
                                        <button style={{ padding: '8px 14px', background: `linear-gradient(135deg,${T.blue},${T.blueDark})`, color: '#FFF', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${T.blue}25` }}>
                                            Take Test
                                        </button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '28px 0' }}>
                            <ClipboardList size={36} color={T.slate300} style={{ display: 'block', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.slate500 }}>No pending exams</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 4 }}>You're all caught up! 🎉</div>
                        </div>
                    )}
                </div>

                {/* Recent Results */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 26px', boxShadow: T.shadow }}>
                    <SectionHeader title="Recent Results" subtitle="Your latest exam scores" />
                    {recentResults.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {recentResults.slice(0, 5).map((r: any, i: number) => (
                                <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < Math.min(recentResults.length, 5) - 1 ? `1px solid ${T.slate100}` : 'none' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: r.score >= 70 ? T.greenLight : T.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Award size={16} color={r.score >= 70 ? T.green : T.amber} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.exam_name}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 2 }}>{r.date}</div>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: r.score >= 70 ? T.green : r.score >= 50 ? T.amber : T.red }}>{r.score}%</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '28px 0' }}>
                            <BarChart3 size={36} color={T.slate300} style={{ display: 'block', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.slate500 }}>No results yet</div>
                        </div>
                    )}
                </div>

                {/* Weak Areas / Focus Zones */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 26px', boxShadow: T.shadow }}>
                    <SectionHeader title="Focus Areas" subtitle="Topics needing attention" />
                    {weakAreas.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {weakAreas.slice(0, 4).map((wa: any, i: number) => (
                                <div key={i} style={{ padding: '12px 14px', background: '#FEF9EE', border: `1px solid ${T.amber}25`, borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <AlertCircle size={14} color={T.amber} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wa.topic}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 2 }}>{wa.subject} · {wa.score}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '28px 0' }}>
                            <Shield size={36} color={T.green} style={{ display: 'block', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.slate900 }}>No weak areas!</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 4 }}>Performing well across all subjects 🎉</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── QUICK ACTIONS + MATERIALS ROW ────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, marginBottom: 24 }}>

                {/* Quick Access Tiles */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 30px', boxShadow: T.shadow }}>
                    <SectionHeader title="Quick Access" subtitle="Jump to your learning tools" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {[
                            { title: 'My Exams', icon: ClipboardList, href: '/dashboard/student/exams', color: T.blue, bg: T.blueLight },
                            { title: 'Practice Test', icon: BrainCircuit, href: '/dashboard/student/custom-exam', color: T.purple, bg: T.purpleLight },
                            { title: 'Study Notes', icon: BookOpen, href: '/dashboard/student/materials', color: T.green, bg: T.greenLight },
                            { title: 'My Results', icon: BarChart3, href: '/dashboard/student/analytics', color: T.amber, bg: T.amberLight },
                            { title: 'Wallet', icon: Wallet, href: '/dashboard/student/wallet', color: T.green, bg: T.greenLight },
                            { title: 'Notice Board', icon: MessagesSquare, href: '/dashboard/student/messages', color: T.blue, bg: T.blueLight },
                            { title: 'Syllabus', icon: FileText, href: '/dashboard/syllabus', color: T.purple, bg: T.purpleLight },
                            { title: 'My Profile', icon: GraduationCap, href: '/dashboard/student/profile', color: T.amber, bg: T.amberLight },
                        ].map((item, i) => (
                            <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                                <div style={{ padding: '16px 12px', borderRadius: 14, background: item.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }} className="enterprise-action">
                                    <item.icon size={22} color={item.color} strokeWidth={2} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: item.color, textAlign: 'center', lineHeight: 1.3 }}>{item.title}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Study Materials */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 26px', boxShadow: T.shadow }}>
                    <SectionHeader title="Recent Materials" subtitle="Latest notes & resources" action="View All" actionHref="/dashboard/student/materials" />
                    {recentMaterials.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {recentMaterials.map((m: any, i: number) => (
                                <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < recentMaterials.length - 1 ? `1px solid ${T.slate100}` : 'none' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: T.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={16} color={T.purple} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 2 }}>{m.type} · {m.date}</div>
                                    </div>
                                    <ChevronRight size={14} color={T.slate300} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {['Physics Master Notes', 'Chemistry Pathway', 'Math Problem Set'].map((title, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.slate100}` : 'none' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: T.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={16} color={T.purple} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.slate900 }}>{title}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: T.slate500, marginTop: 2 }}>PDF · Study Material</div>
                                    </div>
                                    <ChevronRight size={14} color={T.slate300} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── STUDENT STATUS FOOTER ────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 22px', borderRadius: 14, background: T.slate50, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 500, color: T.slate500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />
                    <span>Portal online</span>
                </div>
                <div style={{ width: 1, height: 14, background: T.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={12} color={T.amber} />
                    <span style={{ color: T.amber, fontWeight: 700 }}>{kpi.streak_days || 0} day streak</span>
                </div>
                <div style={{ width: 1, height: 14, background: T.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={12} color={badgeColor} />
                    <span style={{ color: badgeColor, fontWeight: 700 }}>{badge} student</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GraduationCap size={12} color={T.slate500} />
                    <span>{tenantName}</span>
                </div>
            </div>
        </div>
    )
}


// ── PARENT DASHBOARD VIEW ──────────────────────────────────────────────────────
function ParentDashboardView({ data }: { data: any }) {
    const { kpi, upcoming_exams, subject_mastery } = data
    return (
        <div style={{ animation: 'float 0.4s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                <MetricCard label="Average Score" value={(kpi.avg_score || 0) + '%'} icon={Award} color={T.blue} bg={T.blueLight} trend="+2.4%" />
                <MetricCard label="Exams Completed" value={kpi.completed_exams || 0} icon={UserCheck} color={T.green} bg={T.greenLight} />
                <MetricCard label="Upcoming Exams" value={kpi.pending_exams || 0} icon={Clock} color={T.amber} bg={T.amberLight} />
                <MetricCard label="Study Status" value="EXCELLENT" icon={Zap} color={T.purple} bg={T.purpleLight} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
                <div style={{ background: T.white, padding: 40, borderRadius: 36, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: T.slate900 }}>Upcoming Exam Timetable</h3>
                        <Link href="/dashboard/student/exams" style={{ fontSize: 13, fontWeight: 1000, color: T.blue, textDecoration: 'none' }}>View All →</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(upcoming_exams || []).map((ex: any) => (
                            <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24, background: T.slate50, borderRadius: 24, border: `1px solid ${T.border}` }}>
                                <div style={{ width: 56, height: 56, background: T.white, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
                                    <Calendar size={24} color={T.blue} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 1000, color: T.slate700 }}>{ex.name}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.slate500, marginTop: 4 }}>{ex.subject} • School Level</div>
                                </div>
                                <div style={{ padding: '8px 16px', background: T.blueLight, color: T.blue, borderRadius: 12, fontSize: 11, fontWeight: 1000 }}>PARENT VIEW</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ background: T.white, padding: 40, borderRadius: 36, border: `1px solid ${T.border}` }}>
                    <h3 style={{ margin: '0 0 32px', fontSize: 20, fontWeight: 1000, color: T.slate900 }}>Subject Performance</h3>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subject_mastery || []} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12, fontWeight: 900, fill: T.slate500 }} />
                                <Bar dataKey="mastery" fill={T.blue} radius={[0, 10, 10, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function PortalDashboard() {
    const [data, setData] = useState<any>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)
    const { identity: ctxIdentity } = useIdentity()

    useEffect(() => {
        const fetchDashboard = async (resolvedRole: string) => {
            const dashboardUrl = (resolvedRole === 'student' || resolvedRole === 'parent')
                ? '/api/student/dashboard'
                : '/api/admin/dashboard'
            const dbRes = await fetch(dashboardUrl, { cache: 'no-store' })
            if (!dbRes.ok) {
                let errMessage = 'Dashboard load failed'
                let reqBilling = false
                try {
                    const err = await dbRes.json()
                    errMessage = err.error || errMessage
                    reqBilling = !!err.requires_billing
                } catch {
                    errMessage = `Server error (${dbRes.status})`
                }
                throw { requiresBilling: reqBilling, message: errMessage }
            }
            return await dbRes.json()
        }
        const init = async () => {
            try {
                let resolvedRole: string
                if (ctxIdentity?.role) {
                    resolvedRole = ctxIdentity.role
                    setRole(resolvedRole)
                } else {
                    const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
                    if (!meRes.ok) {
                        if (meRes.status === 401) {
                            window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)
                            return
                        }
                        throw new Error('Identity Sync Failed')
                    }
                    const meData = await meRes.json()
                    resolvedRole = meData.role
                    setRole(resolvedRole)
                }
                const dbData = await fetchDashboard(resolvedRole)
                setData(dbData)
            } catch (err: any) {
                console.error('Dashboard Load Error:', err)
                setError(err)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [ctxIdentity])

    if (loading) return (
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.slate50 }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes shimmer { 0%,100% { background-position: 200% 0 } 50% { background-position: -200% 0 } }
                @keyframes livepin { 0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.3) } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0.1) } }
                @keyframes float { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
                .enterprise-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
                .enterprise-row:hover { background: #EEF4FF !important; border-color: #004B93 !important; }
                .enterprise-action:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
            `}</style>
            <Loader2 size={48} color={T.blue} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 24, color: T.slate900, fontWeight: 800, fontSize: 14, letterSpacing: '0.08em' }}>LOADING DASHBOARD...</p>
        </div>
    )

    if (error?.requiresBilling) {
        return (
            <div style={{ display: 'flex', height: '100vh', padding: 40, alignItems: 'center', justifyContent: 'center', background: T.slate50 }}>
                <div style={{ maxWidth: 460, width: '100%', background: T.white, borderRadius: 28, padding: 48, boxShadow: T.shadowLg, border: `1px solid ${T.red}20`, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, background: T.redLight, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <AlertCircle size={40} color={T.red} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: T.slate900, margin: '0 0 12px', letterSpacing: '-0.03em' }}>Account Suspended</h2>
                    <p style={{ color: T.slate500, marginBottom: 40, fontWeight: 500, lineHeight: 1.6 }}>{error.message}</p>
                    <Link href="/dashboard/subscription" style={{ display: 'block', width: '100%', background: T.red, color: '#fff', padding: '18px', borderRadius: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 10px 20px ${T.red}30` }}>
                        Renew Subscription
                    </Link>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ display: 'flex', height: '100vh', padding: 40, alignItems: 'center', justifyContent: 'center', background: T.slate50 }}>
                <div style={{ maxWidth: 460, width: '100%', background: T.white, borderRadius: 28, padding: 48, boxShadow: T.shadowLg, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, background: T.slate50, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <AlertCircle size={40} color={T.slate500} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: T.slate900, margin: '0 0 12px', letterSpacing: '-0.03em' }}>System Error</h2>
                    <p style={{ color: T.slate500, marginBottom: 40, fontWeight: 500, lineHeight: 1.6 }}>{error.message || 'An unexpected error occurred.'}</p>
                    <button onClick={() => window.location.reload()} style={{ width: '100%', background: `linear-gradient(135deg,${T.blue},${T.blueDark})`, color: '#fff', padding: '18px', borderRadius: 16, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (!data || !role) return null

    const isAdmin = !['student', 'parent'].includes(role)
    const isStudent = role === 'student'
    const headerTitle = role === 'parent' ? 'Parent Dashboard' : 'Admin Dashboard'
    const headerDesc = role === 'parent' ? "Monitor your child's academic progress." : 'Manage your school administration and overview.'

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes shimmer { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
                @keyframes livepin { 0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,0.3)} 50%{box-shadow:0 0 0 8px rgba(16,185,129,0.1)} }
                @keyframes float { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spin { to{transform:rotate(360deg)} }
                .enterprise-card:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
                .enterprise-row:hover { background: #EEF4FF !important; border-color: #004B93 !important; }
                .enterprise-action:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
            `}</style>
            <div style={{ padding: isAdmin ? '40px 48px' : '40px 48px', background: T.slate50, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", animation: 'float 0.4s ease-out' }}>
                {/* Non-student, non-admin: show generic header (parent) */}
                {!isAdmin && !isStudent && (
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: `${T.blue}10`, color: T.blue, borderRadius: 100, fontSize: 11, fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <Sparkles size={14} /> Academic Portal Active
                            </div>
                            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: T.slate900, letterSpacing: '-0.04em' }}>{headerTitle}</h1>
                            <p style={{ margin: '8px 0 0', fontSize: 17, color: T.slate500, fontWeight: 500 }}>{headerDesc}</p>
                        </div>
                        <button style={{ padding: '14px 28px', borderRadius: 18, background: T.white, border: `2px solid ${T.border}`, color: T.slate500, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Globe size={18} /> {role === 'tenant_admin' ? 'Admin' : role} Profile
                        </button>
                    </header>
                )}
                {role === 'parent'
                    ? <ParentDashboardView data={data} />
                    : role === 'student'
                    ? <StudentDashboardView data={data} identity={ctxIdentity} />
                    : <AdminDashboardView data={data} role={role} identity={ctxIdentity} />
                }
            </div>
        </>
    )
}
