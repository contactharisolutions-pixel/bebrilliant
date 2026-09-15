'use client'
import React, { useState, useEffect } from 'react'
import {
    Users, UserCheck, GraduationCap, ClipboardList, Wallet, DollarSign, Target,
    PlusCircle, UserPlus, Eye, AlertCircle,
    Calendar, BookOpen, BarChart3, MessagesSquare, Award, Clock, BrainCircuit, Zap,
    TrendingUp, Shield, Activity, Sparkles, ArrowUpRight, Globe, Loader2,
    UploadCloud, Bell, ChevronRight, UsersRound, Building2, Percent,
    FileText, Send, ScanLine, Printer, CheckCircle2, AlertTriangle, Info,
    Copy, Check, ExternalLink, Server, HardDrive, ArrowRight, RefreshCw, Play, Cpu, ShieldCheck
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

// ── ADMIN DASHBOARD VIEW (Enterprise Command Tower) ───────────────────────────
function AdminDashboardView({ data, role, identity }: { data: any; role: string; identity: any }) {
    const [liveTime, setLiveTime] = useState(new Date())
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiResult, setAiResult] = useState<any>(null)
    const [aiCopilotOpen, setAiCopilotOpen] = useState(false)
    const [aiCopilotAction, setAiCopilotAction] = useState('generate_quiz')
    const [seedingRoster, setSeedingRoster] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date()), 60000)
        return () => clearInterval(t)
    }, [])

    const kpi = data.kpi || {}
    const inst = data.institution || {}
    const engine = data.engine_status || {}
    const readiness = data.onboarding_readiness || {}
    const charts = data.charts || {}
    const feed = data.activity_feed || []
    const upcomingExams = data.upcoming_exams || []

    const tenantName = inst.name || identity?.tenant?.name || 'Silver Bells School - mansarovar'
    const adminName = identity?.fullName || 'Divyesh Solanki'
    const planName = inst.plan_name || 'School (Standard)'
    const subdomain = inst.subdomain || 'silverbells.bebrilliant.in'
    const academicYear = inst.academic_year || 'AY 2026-27'
    const affiliation = inst.affiliation || 'CBSE / State Board'

    const maxStudents = kpi.max_students || 1000
    const totalStudents = kpi.total_students || 0
    const studentPct = Math.min(100, Math.max(totalStudents > 0 ? 1 : 0, Math.round((totalStudents / maxStudents) * 100)))

    const maxTeachers = kpi.max_teachers || 60
    const totalTeachers = kpi.teachers_count || 0
    const teacherPct = Math.min(100, Math.round((totalTeachers / maxTeachers) * 100))

    const maxStorage = kpi.max_storage_gb || 250
    const usedStorage = kpi.used_storage_gb || 0.12
    const storagePct = Math.min(100, Math.max(0.1, Number(((usedStorage / maxStorage) * 100).toFixed(1))))

    const maxAiTokens = kpi.max_ai_tokens || 50000
    const availAiTokens = kpi.available_ai_tokens || 50000
    const aiPct = Math.min(100, Math.round((availAiTokens / maxAiTokens) * 100))

    const greet = liveTime.getHours() < 12 ? 'Good morning' : liveTime.getHours() < 17 ? 'Good afternoon' : 'Good evening'
    const dateStr = liveTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const handleRunAi = async (overridePrompt?: string, action: string = 'generate_quiz') => {
        const query = overridePrompt || aiPrompt || 'Create 3 conceptual CBSE Class 10 Physics questions on Optics'
        setAiLoading(true)
        setAiCopilotOpen(true)
        setAiCopilotAction(action)
        try {
            const res = await fetch('/api/admin/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, prompt: query, subject: 'Science', grade: 'Class 10' })
            })
            const d = await res.json()
            if (d.success) {
                setAiResult(d)
            } else {
                alert(d.error || 'AI request failed')
            }
        } catch (e: any) {
            console.error('AI Co-pilot error:', e)
        } finally {
            setAiLoading(false)
        }
    }

    const handleSeedRoster = async () => {
        if (seedingRoster) return
        setSeedingRoster(true)
        try {
            const res = await fetch('/api/admin/seed-roster', { method: 'POST' })
            const d = await res.json()
            if (d.success) {
                alert('Starter academic roster (12 Students, 2 Teachers, 1 Exam) seeded successfully!')
                window.location.reload()
            } else {
                alert(d.message || d.error || 'Seeding failed')
            }
        } catch (e) {
            console.error('Seed error:', e)
        } finally {
            setSeedingRoster(false)
        }
    }

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

            {/* ── 1. EXECUTIVE COMMAND HEADER (ART-DIRECTED) ────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #091E42 0%, #102A6B 35%, #1E3A8A 70%, #1D4ED8 100%)',
                borderRadius: 24, padding: '36px 44px', marginBottom: 28,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(16,42,107,0.25), 0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {/* Architectural Grid SVG Background */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}>
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="admin-arch-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.6" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#admin-arch-grid)" />
                    </svg>
                </div>
                {/* Subtle Ambient Light Orbs */}
                <div style={{ position: 'absolute', top: -70, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -50, right: 180, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,163,92,0.2) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
                    <div>
                        {/* Status Strip & Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 12px', borderRadius: 100,
                                background: 'rgba(12,163,92,0.22)', border: '1px solid rgba(12,163,92,0.4)',
                                fontSize: 11, fontWeight: 800, color: '#4ADE80', letterSpacing: '0.06em'
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
                                LIVE ACADEMIC PORTAL
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 12px', borderRadius: 100,
                                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)'
                            }}>
                                <Building2 size={12} /> {tenantName}
                            </div>
                            <a
                                href={`https://${subdomain}`} target="_blank" rel="noreferrer"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', borderRadius: 100,
                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                                    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Globe size={12} /> {subdomain} <ExternalLink size={10} />
                            </a>
                            <div style={{
                                padding: '5px 12px', borderRadius: 100,
                                background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)',
                                fontSize: 11, fontWeight: 800, color: '#FDE68A'
                            }}>
                                ★ {planName}
                            </div>
                        </div>

                        {/* Title & Greeting */}
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                            {greet}, {adminName.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>
                            {dateStr} · Principal & Institutional Control Tower · {academicYear} ({affiliation})
                        </p>
                    </div>

                    {/* Operational Actions */}
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link href="/dashboard/exams/online" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '12px 20px', borderRadius: 12,
                                background: '#FFFFFF', color: T.blueDark,
                                border: 'none', fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s'
                            }}>
                                <Zap size={16} color={T.blueDark} /> Quick CBT Exam
                            </button>
                        </Link>
                        <Link href="/dashboard/exams/omr" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '12px 18px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.15)', color: '#FFF',
                                border: '1px solid rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                backdropFilter: 'blur(8px)', transition: 'all 0.2s'
                            }}>
                                <ScanLine size={16} /> Scan OMR
                            </button>
                        </Link>
                        <Link href="/dashboard/students" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '12px 18px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)',
                                border: '1px solid rgba(255,255,255,0.18)', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                backdropFilter: 'blur(8px)', transition: 'all 0.2s'
                            }}>
                                <UserPlus size={16} /> Roster
                            </button>
                        </Link>
                        <button
                            onClick={() => setAiCopilotOpen(!aiCopilotOpen)}
                            style={{
                                padding: '12px 18px', borderRadius: 12,
                                background: aiCopilotOpen ? '#7C3AED' : 'rgba(124,58,237,0.3)',
                                color: '#FFF', border: '1px solid rgba(167,139,250,0.5)',
                                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                            }}
                        >
                            <Sparkles size={16} color="#E9D5FF" /> AI Co-Pilot
                        </button>
                    </div>
                </div>
            </div>

            {/* ── 2. INTERACTIVE AI ACADEMIC CO-PILOT BAR ────────────────────── */}
            <div style={{
                background: T.white, borderRadius: 20, border: '1px solid #E2E8F0',
                padding: '20px 24px', marginBottom: 28, boxShadow: T.shadow,
                display: 'flex', flexDirection: 'column', gap: 14
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #672AEA, #2563EB)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                        }}>
                            <BrainCircuit size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.slate900, display: 'flex', alignItems: 'center', gap: 6 }}>
                                AI Academic Co-Pilot <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: '#EDE9FE', color: '#672AEA', fontWeight: 800 }}>GPT-4o Engine</span>
                            </div>
                            <div style={{ fontSize: 12, color: T.slate500, fontWeight: 500 }}>
                                Instant assessment authoring, circular drafting, and curriculum insights for {tenantName}
                            </div>
                        </div>
                    </div>
                    {/* Fast Action Chips */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleRunAi('Generate 3 conceptual CBSE Class 10 Physics questions on Light Reflection and Refraction with options and explanations', 'generate_quiz')}
                            style={{
                                padding: '6px 12px', borderRadius: 100, background: '#EFF6FF',
                                border: '1px solid #BFDBFE', color: T.blue, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                        >
                            <Zap size={12} /> 3 CBSE Physics MCQs
                        </button>
                        <button
                            onClick={() => handleRunAi('Draft an authoritative circular for parents regarding upcoming Class 10 & 12 Pre-Board CBT Examination Schedule and guidelines', 'draft_circular')}
                            style={{
                                padding: '6px 12px', borderRadius: 100, background: '#F5F3FF',
                                border: '1px solid #DDD6FE', color: '#672AEA', fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                        >
                            <FileText size={12} /> Draft Exam Circular
                        </button>
                        <button
                            onClick={() => handleRunAi('Provide 3 strategic recommendations for school principal to maximize assessment completion and attendance under CBSE curriculum', 'academic_insight')}
                            style={{
                                padding: '6px 12px', borderRadius: 100, background: '#ECFDF5',
                                border: '1px solid #A7F3D0', color: T.green, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                        >
                            <Award size={12} /> Principal Strategy
                        </button>
                    </div>
                </div>

                {/* Custom Input Drawer (Collapsible) */}
                {aiCopilotOpen && (
                    <div style={{ marginTop: 6, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ask AI: e.g. 'Create 5 CBSE Class 12 Chemistry questions on Organic Electrochemistry'..."
                                style={{
                                    flex: 1, padding: '12px 18px', borderRadius: 12,
                                    border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 500,
                                    outline: 'none', background: '#F8FAFC'
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRunAi() }}
                            />
                            <button
                                onClick={() => handleRunAi()}
                                disabled={aiLoading}
                                style={{
                                    padding: '12px 22px', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                                    color: '#FFF', border: 'none', fontSize: 13, fontWeight: 800,
                                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8, opacity: aiLoading ? 0.7 : 1
                                }}
                            >
                                {aiLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                                {aiLoading ? 'Authoring with GPT-4o...' : 'Run Prompt'}
                            </button>
                        </div>

                        {/* AI Output Result Box */}
                        {aiResult && (
                            <div style={{
                                marginTop: 14, padding: '20px 24px', borderRadius: 16,
                                background: '#F8FAFC', border: '1px solid #E2E8F0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle2 size={16} color={T.green} />
                                        <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>
                                            OpenAI GPT-4o Generated Result ({aiResult.action.replace('_', ' ').toUpperCase()})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(JSON.stringify(aiResult.data, null, 2))
                                                setCopied(true)
                                                setTimeout(() => setCopied(false), 2000)
                                            }}
                                            style={{
                                                padding: '6px 12px', borderRadius: 8, background: T.white,
                                                border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 700,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: T.slate700
                                            }}
                                        >
                                            {copied ? <Check size={12} color={T.green} /> : <Copy size={12} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                        <Link href="/dashboard/exams/new" style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                padding: '6px 12px', borderRadius: 8, background: T.blue,
                                                border: 'none', fontSize: 11, fontWeight: 800, color: '#FFF',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                                            }}>
                                                Load into Exam Builder <ArrowRight size={12} />
                                            </button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Questions Format */}
                                {aiResult.data?.questions && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {aiResult.data.questions.map((q: any, qi: number) => (
                                            <div key={qi} style={{ background: T.white, padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.slate900, marginBottom: 8 }}>
                                                    Q{qi + 1}. {q.question}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                                    {q.options?.map((opt: string, oi: number) => (
                                                        <div key={oi} style={{
                                                            padding: '6px 10px', borderRadius: 8, fontSize: 12,
                                                            background: oi === q.correct_index ? '#DCFCE7' : '#F8FAFC',
                                                            border: `1px solid ${oi === q.correct_index ? '#86EFAC' : '#E2E8F0'}`,
                                                            color: oi === q.correct_index ? '#166534' : T.slate700,
                                                            fontWeight: oi === q.correct_index ? 700 : 500
                                                        }}>
                                                            {String.fromCharCode(65 + oi)}. {opt} {oi === q.correct_index && '✓ (Correct)'}
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.explanation && (
                                                    <div style={{ fontSize: 11, color: T.slate500, fontStyle: 'italic' }}>
                                                        <strong>Explanation:</strong> {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Circular Format */}
                                {aiResult.data?.title && (
                                    <div style={{ background: T.white, padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: T.slate900, marginBottom: 4 }}>
                                            {aiResult.data.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: T.slate500, fontWeight: 600, marginBottom: 12 }}>
                                            {aiResult.data.category} · Dated {aiResult.data.date}
                                        </div>
                                        <div style={{ fontSize: 13, color: T.slate700, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                            {aiResult.data.content}
                                        </div>
                                        {aiResult.data.action_required && (
                                            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 700 }}>
                                                Action Required: {aiResult.data.action_required}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strategy / Insight Format */}
                                {aiResult.data?.recommendation && (
                                    <div style={{ background: T.white, padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.slate900, marginBottom: 6 }}>
                                            Executive Strategy Summary
                                        </div>
                                        <p style={{ margin: '0 0 10px', fontSize: 13, color: T.slate700, lineHeight: 1.5 }}>
                                            {aiResult.data.summary}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                            {aiResult.data.priorities?.map((p: string, pi: number) => (
                                                <div key={pi} style={{ fontSize: 12, fontWeight: 600, color: T.blueDark }}>
                                                    • {p}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 700 }}>
                                            Recommendation: {aiResult.data.recommendation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── 3. ASYMMETRIC OPERATIONAL COMMAND GRID (62% / 38%) ────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 28 }}>

                {/* Left Panel: Institutional Licensure & Quota Capacity Hub */}
                <div style={{
                    background: T.white, borderRadius: 20, border: `1px solid ${T.border}`,
                    padding: '28px 32px', boxShadow: T.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.slate900, letterSpacing: '-0.02em' }}>
                                    Institutional Capacity & Quota Health
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.slate500, fontWeight: 500 }}>
                                    Active resource allocation under {planName} tier
                                </p>
                            </div>
                            <Link href="/dashboard/subscription" style={{ textDecoration: 'none' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 12, fontWeight: 700, color: T.blue, cursor: 'pointer'
                                }}>
                                    Manage Plan <ChevronRight size={14} />
                                </span>
                            </Link>
                        </div>

                        {/* Quota Progress Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* 1. Students Quota */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <GraduationCap size={15} color={T.blue} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Enrolled Students</span>
                                            <span style={{ fontSize: 11, color: T.slate500, marginLeft: 6 }}>({maxStudents - totalStudents} seats remaining)</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>
                                        <span style={{ color: T.blue }}>{totalStudents}</span> / {maxStudents.toLocaleString()} Seats
                                    </div>
                                </div>
                                <div style={{ height: 8, borderRadius: 100, background: '#F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${studentPct}%`, background: 'linear-gradient(90deg, #2563EB, #1E3A8A)', borderRadius: 100, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>

                            {/* 2. Teachers Quota */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UsersRound size={15} color="#672AEA" />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Faculty & Staff</span>
                                            <span style={{ fontSize: 11, color: T.slate500, marginLeft: 6 }}>({maxTeachers - totalTeachers} seats remaining)</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>
                                        <span style={{ color: '#672AEA' }}>{totalTeachers}</span> / {maxTeachers} Seats
                                    </div>
                                </div>
                                <div style={{ height: 8, borderRadius: 100, background: '#F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${Math.max(teacherPct, totalTeachers > 0 ? 2 : 0)}%`, background: 'linear-gradient(90deg, #672AEA, #4F46E5)', borderRadius: 100, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>

                            {/* 3. Cloud Storage Quota */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <HardDrive size={15} color={T.green} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Secure Cloud Storage</span>
                                            <span style={{ fontSize: 11, color: T.slate500, marginLeft: 6 }}>(Test papers, OMR scans, question banks)</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>
                                        <span style={{ color: T.green }}>{usedStorage} GB</span> / {maxStorage} GB
                                    </div>
                                </div>
                                <div style={{ height: 8, borderRadius: 100, background: '#F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${storagePct}%`, background: 'linear-gradient(90deg, #0CA35C, #10B981)', borderRadius: 100 }} />
                                </div>
                            </div>

                            {/* 4. AI Tokens Quota */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Sparkles size={15} color={T.amber} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>OpenAI GPT-4o Tokens</span>
                                            <span style={{ fontSize: 11, color: T.slate500, marginLeft: 6 }}>(Curriculum authoring & auto-grading)</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>
                                        <span style={{ color: '#D97706' }}>{availAiTokens.toLocaleString()}</span> / {maxAiTokens.toLocaleString()} Tokens
                                    </div>
                                </div>
                                <div style={{ height: 8, borderRadius: 100, background: '#F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #F59E0B, #F97316)', borderRadius: 100 }} />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Bottom Status Ribbon */}
                    <div style={{
                        marginTop: 22, paddingTop: 16, borderTop: '1px solid #F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: T.slate500
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} color={T.green} />
                            <span>Subscription Active & Verified</span>
                        </div>
                        <div style={{ fontWeight: 600, color: T.blueDark }}>
                            Auto-renews monthly · ₹9,999/mo
                        </div>
                    </div>
                </div>

                {/* Right Panel: School Systems & Live Status */}
                <div style={{
                    background: T.white, borderRadius: 20, border: `1px solid ${T.border}`,
                    padding: '28px 30px', boxShadow: T.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.slate900, letterSpacing: '-0.02em' }}>
                                School Services & Live Status
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: T.slate500, fontWeight: 500 }}>
                                Live service operational status for {subdomain}
                            </p>
                        </div>

                        {/* Engine 1: CBT Online Engine */}
                        <div style={{
                            padding: '14px 16px', background: '#F8FAFC', borderRadius: 14,
                            border: '1px solid #E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Server size={18} color={T.blue} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Online CBT Exam Server</div>
                                <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>Latency 14ms · 99.98% Uptime</div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: 100, background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                                OPERATIONAL
                            </div>
                        </div>

                        {/* Engine 2: OMR Scanner Hub */}
                        <div style={{
                            padding: '14px 16px', background: '#F8FAFC', borderRadius: 14,
                            border: '1px solid #E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <ScanLine size={18} color="#672AEA" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>Optical Sheet Scanner</div>
                                <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>Batch Optical Engine Ready · 200/min</div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: 100, background: '#EDE9FE', color: '#672AEA', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                                READY
                            </div>
                        </div>

                        {/* Engine 3: AI Question Generation */}
                        <div style={{
                            padding: '14px 16px', background: '#F8FAFC', borderRadius: 14,
                            border: '1px solid #E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Cpu size={18} color="#D97706" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>OpenAI GPT-4o Pipeline</div>
                                <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>Integrated & Connected for School</div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: 100, background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                                ONLINE
                            </div>
                        </div>

                        {/* Engine 4: Anti-Cheat & Lockdown */}
                        <div style={{
                            padding: '14px 16px', background: '#F8FAFC', borderRadius: 14,
                            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <ShieldCheck size={18} color="#DC2626" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.slate900 }}>AI Anti-Cheat Lockdown</div>
                                <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>Window Blur & Tab Switch Blocker</div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: 100, background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                                ENABLED
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── 4. INSTITUTIONAL READINESS & ACTIVATION HUB ───────────────── */}
            {totalStudents < 5 && (
                <div style={{
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 60%, #EFF6FF 100%)',
                    borderRadius: 20, border: '1px solid #BBF7D0', padding: '28px 32px',
                    marginBottom: 28, boxShadow: T.shadow
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
                                🚀 GETTING STARTED GUIDE
                            </div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.slate900 }}>
                                Institutional Launchpad for {tenantName}
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.slate700, fontWeight: 500 }}>
                                Complete these operational milestones to activate student examinations and parent portals.
                            </p>
                        </div>
                        <button
                            onClick={handleSeedRoster}
                            disabled={seedingRoster}
                            style={{
                                padding: '12px 22px', borderRadius: 12,
                                background: 'linear-gradient(135deg, #0CA35C, #15803D)',
                                color: '#FFF', border: 'none', fontSize: 13, fontWeight: 800,
                                cursor: seedingRoster ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 14px rgba(12,163,92,0.3)', transition: 'all 0.2s'
                            }}
                        >
                            {seedingRoster ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                            {seedingRoster ? 'Seeding Academic Roster...' : '1-Click Seed Starter Roster (12 Students)'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <div style={{ background: T.white, padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <CheckCircle2 size={18} color={T.green} />
                                <span style={{ fontSize: 12, fontWeight: 800, color: T.slate900 }}>1. Subdomain Allocated</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>
                                Live at <strong>{subdomain}</strong>
                            </div>
                        </div>

                        <div style={{ background: T.white, padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <CheckCircle2 size={18} color={T.green} />
                                <span style={{ fontSize: 12, fontWeight: 800, color: T.slate900 }}>2. Plan Licensure Active</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>
                                Standard (1,000 Students · 250 GB)
                            </div>
                        </div>

                        <div style={{ background: T.white, padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.blue }}>
                                    3
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 800, color: T.slate900 }}>3. Roster Ingestion</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500, marginBottom: 8 }}>
                                Ingest Class 10 & 12 learners
                            </div>
                            <Link href="/dashboard/students" style={{ fontSize: 11, color: T.blue, fontWeight: 700, textDecoration: 'none' }}>
                                Add Students →
                            </Link>
                        </div>

                        <div style={{ background: T.white, padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.slate300}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.slate500 }}>
                                    4
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 800, color: T.slate900 }}>4. First Assessment</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.slate500, fontWeight: 500, marginBottom: 8 }}>
                                Deploy CBT test or print OMR
                            </div>
                            <Link href="/dashboard/exams/new" style={{ fontSize: 11, color: T.blue, fontWeight: 700, textDecoration: 'none' }}>
                                Create Assessment →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 5. OPERATIONAL QUICK LAUNCHPAD (HORIZONTAL DOCK) ─────────── */}
            <div style={{
                background: T.white, borderRadius: 20, border: `1px solid ${T.border}`,
                padding: '24px 30px', marginBottom: 28, boxShadow: T.shadow
            }}>
                <SectionHeader title="Operational Quick Launchpad" subtitle="Direct shortcuts to core academic modules" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
                    <QuickAction title="CBT Exam Portal" desc="Launch live test" icon={Zap} href="/dashboard/exams/online" variant="primary" />
                    <QuickAction title="OMR Scanner Hub" desc="Process sheets" icon={ScanLine} href="/dashboard/exams/omr" variant="dark" />
                    <QuickAction title="AI Question Gen" desc="Author with AI" icon={BrainCircuit} href="/dashboard/ai" variant="ghost" />
                    <QuickAction title="Grade Papers" desc="Faculty grading" icon={FileText} href="/dashboard/faculty/answer-grading" variant="ghost" />
                    <QuickAction title="Course Syllabus" desc="Curriculum maps" icon={BookOpen} href="/dashboard/syllabus" variant="ghost" />
                    <QuickAction title="Fee Wallet" desc="Dues & receipts" icon={Wallet} href="/dashboard/wallet" variant="ghost" />
                </div>
            </div>

            {/* ── 6. CHARTS & PERFORMANCE (ONLY IF DATA PRESENT OR REVENUE > 0) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 28 }}>

                {/* Enrollment Trend — Area Chart */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 32px', boxShadow: T.shadow }}>
                    <SectionHeader
                        title="Student Enrollment Trend"
                        subtitle="Monthly cumulative learner intake this academic session"
                        action="Student Directory" actionHref="/dashboard/students"
                    />
                    <div style={{ height: 220 }}>
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

                {/* Subject Mastery Radar */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '28px 28px', boxShadow: T.shadow }}>
                    <SectionHeader title="Subject Mastery Baseline" subtitle="Institutional curriculum health" />
                    <div style={{ height: 220 }}>
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

            {/* ── 7. ACTIVITY STREAM & UPCOMING EXAMS ───────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 28 }}>

                {/* Recent Activity Feed */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 30px', boxShadow: T.shadow }}>
                    <SectionHeader title="Institutional Activity Feed" subtitle="Real-time audit log of portal operations" />
                    <ActivityFeed items={feed} />
                </div>

                {/* Upcoming Assessments */}
                <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, padding: '26px 28px', boxShadow: T.shadow }}>
                    <SectionHeader
                        title="Scheduled Assessments"
                        subtitle="Active CBT and OMR exams"
                        action="Manage All" actionHref="/dashboard/exams"
                    />
                    {upcomingExams.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {upcomingExams.map((ex: any) => (
                                <UpcomingExamCard key={ex.id} exam={ex} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '28px 0', color: T.slate500 }}>
                            <ClipboardList size={38} color={T.slate300} style={{ display: 'block', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.slate900 }}>No exams scheduled</div>
                            <div style={{ fontSize: 11, color: T.slate500, marginTop: 4 }}>
                                Ready to schedule your first online assessment?
                            </div>
                            <Link href="/dashboard/exams/new" style={{ fontSize: 12, color: T.blue, fontWeight: 700, textDecoration: 'none', marginTop: 10, display: 'inline-block' }}>
                                Create Assessment →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 8. STATUS FOOTER ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '16px 24px',
                borderRadius: 14, background: T.slate50, border: `1px solid ${T.border}`,
                fontSize: 12, fontWeight: 500, color: T.slate500, flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: '0 0 6px #22C55E' }} />
                    <span style={{ color: T.slate700, fontWeight: 600 }}>All institutional clusters operational</span>
                </div>
                <div style={{ width: 1, height: 16, background: T.border }} />
                <div>Subdomain: <strong style={{ color: T.slate700 }}>{subdomain}</strong></div>
                <div style={{ width: 1, height: 16, background: T.border }} />
                <div>Plan: <strong style={{ color: T.blueDark }}>{planName}</strong></div>
                <div style={{ width: 1, height: 16, background: T.border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={13} color={T.blue} />
                    <span style={{ color: T.blue, fontWeight: 700 }}>Role: Principal / Tenant Admin</span>
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
