'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, UsersRound, ClipboardList, BookOpen, BrainCircuit,
    Headset, Wallet, CreditCard, Share2, Globe, BellRing, BarChart2, Settings2,
    Zap, LogOut, GraduationCap, School, Layers, Activity, Calendar, ScanLine, Printer,
    Home, ShieldCheck, ChevronRight, FileText, UploadCloud
} from 'lucide-react'

const NAV_GROUPS = [
    {
        title: 'Overview',
        items: [
            { label: 'Admin Dashboard', icon: LayoutDashboard, href: '/dashboard' },
            { label: 'Analytics & Reports', icon: Activity, href: '/dashboard/faculty/analytics/results-360' },
        ]
    },
    {
        title: 'Academic Operations',
        items: [
            { label: 'Academic Structure', icon: Calendar, href: '/dashboard/tenant/academic-year' },
            { label: 'Course Syllabus', icon: Layers, href: '/dashboard/syllabus' },
            { label: 'Study Materials', icon: BookOpen, href: '/dashboard/material' },
            { label: 'Notice Board', icon: BellRing, href: '/dashboard/messages' },
        ]
    },
    {
        title: 'Exam Management',
        items: [
            { label: 'All Exams', icon: ClipboardList, href: '/dashboard/exams' },
            { label: 'Online Exam Portal', icon: Zap, href: '/dashboard/exams/online' },
            { label: 'OMR Scanner Hub', icon: ScanLine, href: '/dashboard/exams/omr' },
            { label: 'Offline Paper Engine', icon: Printer, href: '/dashboard/exams/offline' },
            { label: 'Grade Answer Sheets', icon: FileText, href: '/dashboard/faculty/answer-grading' },
            { label: 'AI Question Gen', icon: BrainCircuit, href: '/dashboard/ai' },
        ]
    },
    {
        title: 'People',
        items: [
            { label: 'Student Directory', icon: GraduationCap, href: '/dashboard/students' },
            { label: 'Teacher Directory', icon: UsersRound, href: '/dashboard/teachers' },
            { label: 'Staff Directory', icon: Users, href: '/dashboard/staff' },
        ]
    },
    {
        title: 'Administration',
        items: [
            { label: 'Academy Setup', icon: School, href: '/dashboard/academy' },
            { label: 'Payments & Fees', icon: Wallet, href: '/dashboard/wallet' },
            { label: 'Subscription', icon: CreditCard, href: '/dashboard/subscription' },
            { label: 'Institute Settings', icon: Settings2, href: '/dashboard/settings' },
        ]
    }
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [identity, setIdentity] = React.useState<any>(null)
    const [collapsed, setCollapsed] = React.useState(false)

    React.useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => setIdentity(data))
    }, [])

    const logoUrl = identity?.tenant?.logo_url || '/logo.png'
    const instituteName = identity?.tenant?.name || (identity ? 'BeBrilliant Platform' : 'Synchronizing...')
    const userName = identity?.fullName || (identity ? 'Authorized Staff' : 'Verifying...')
    const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <aside style={{
            width: collapsed ? 72 : 268,
            minWidth: collapsed ? 72 : 268,
            height: '100vh',
            background: '#FFFFFF',
            borderRight: '1px solid #E8ECF0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
            position: 'relative',
            zIndex: 10
        }}>

            {/* ── BRAND HEADER ── */}
            <div style={{
                padding: collapsed ? '20px 16px' : '20px 20px',
                borderBottom: '1px solid #F1F5F9',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                background: '#FAFBFC'
            }}>
                {/* Logo + Collapse toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!collapsed && (
                        <img
                            src={logoUrl}
                            alt="Institute Logo"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
                            style={{ height: 36, width: 'auto', maxWidth: 140, objectFit: 'contain' }}
                        />
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            width: 28, height: 28, borderRadius: 8, border: '1px solid #E2E8F0',
                            background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
                            marginLeft: collapsed ? 'auto' : 0
                        }}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <ChevronRight size={14} color="#64748B" style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.25s' }} />
                    </button>
                </div>

                {/* Institute identity pill */}
                {!collapsed && (
                    <div style={{
                        padding: '10px 12px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #EEF4FF 0%, #F0F7FF 100%)',
                        border: '1px solid #D1E3FF',
                        display: 'flex', alignItems: 'center', gap: 10
                    }}>
                        {/* Avatar initials */}
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'linear-gradient(135deg, #004B93 0%, #0066CC 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: '#FFFFFF', flexShrink: 0
                        }}>
                            {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#004B93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {instituteName}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                                Tenant Admin
                            </div>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div style={{
                        width: 40, height: 40, borderRadius: 12, margin: '0 auto',
                        background: 'linear-gradient(135deg, #004B93 0%, #0066CC 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: '#FFFFFF'
                    }}>
                        {initials}
                    </div>
                )}
            </div>

            {/* ── NAV ITEMS ── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '16px 10px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {NAV_GROUPS.map((group, groupIdx) => (
                    <div key={groupIdx} style={{ marginBottom: 8 }}>
                        {!collapsed && (
                            <div style={{
                                fontSize: 10, fontWeight: 700, color: '#94A3B8',
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                padding: '6px 12px', marginBottom: 4
                            }}>
                                {group.title}
                            </div>
                        )}
                        {collapsed && groupIdx > 0 && (
                            <div style={{ height: 1, background: '#F1F5F9', margin: '8px 4px 12px' }} />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {group.items.map(item => {
                                const active = item.href === '/dashboard'
                                    ? pathname === '/dashboard'
                                    : item.href === '/dashboard/exams'
                                    ? pathname === '/dashboard/exams'
                                    : (pathname === item.href || pathname?.startsWith(item.href + '/'))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={collapsed ? item.label : undefined}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: collapsed ? 0 : 10,
                                            padding: collapsed ? '10px' : '9px 12px',
                                            borderRadius: 10,
                                            textDecoration: 'none',
                                            background: active
                                                ? 'linear-gradient(135deg, #004B93 0%, #0055AA 100%)'
                                                : 'transparent',
                                            color: active ? '#FFFFFF' : '#475569',
                                            fontWeight: active ? 700 : 500,
                                            fontSize: 13,
                                            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                                            boxShadow: active ? '0 4px 12px rgba(0,75,147,0.25)' : 'none',
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        className="admin-nav-item"
                                    >
                                        {/* Active left accent bar */}
                                        {active && !collapsed && (
                                            <div style={{
                                                position: 'absolute', left: 0, top: '15%', bottom: '15%',
                                                width: 3, background: '#F0A026', borderRadius: '0 3px 3px 0'
                                            }} />
                                        )}
                                        <item.icon
                                            size={17}
                                            color={active ? '#FFFFFF' : '#94A3B8'}
                                            strokeWidth={active ? 2.5 : 2}
                                            style={{ flexShrink: 0 }}
                                        />
                                        {!collapsed && (
                                            <span style={{ whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── FOOTER ── */}
            <div style={{
                padding: collapsed ? '12px 10px' : '12px 12px',
                borderTop: '1px solid #F1F5F9',
                background: '#FAFBFC',
                flexShrink: 0
            }}>
                <Link href="/api/auth/logout" style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? '10px' : '10px 12px',
                    borderRadius: 10, textDecoration: 'none',
                    color: '#64748B', fontSize: 13, fontWeight: 600,
                    transition: 'all 0.18s',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: 'transparent'
                }}
                    className="admin-nav-item"
                >
                    <LogOut size={17} color="#94A3B8" style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Sign Out</span>}
                </Link>
            </div>

            <style>{`
                .admin-nav-item:hover {
                    background: #F8FAFC !important;
                    color: #004B93 !important;
                }
                .admin-nav-item:hover svg { color: #004B93 !important; stroke: #004B93 !important; }
            `}</style>
        </aside>
    )
}
