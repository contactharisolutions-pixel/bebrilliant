'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, UsersRound, GraduationCap,
    Zap, ScanLine, Printer, BookOpen, Layers,
    BarChart3, PieChart, Activity,
    Wallet, CreditCard, School, Settings2,
    BellRing, Calendar, SlidersHorizontal, Edit3, ChevronRight, ChevronDown, LogOut
} from 'lucide-react'

/**
 * NAV_GROUPS — tenant admin sidebar navigation.
 *
 * Ordered as requested:
 *   1. Admin Dashboard
 *   2. Create Exams
 *   3. Exam Master
 *   4. Student Zone
 *   5. Teacher Zone
 *   6. Communication
 *   7. Revenue and Payments
 *   8. Reports & Analytics
 *   9. School/Institute Setup
 */
const NAV_GROUPS = [
    {
        title: '',
        items: [
            { label: 'Admin Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        ]
    },
    {
        title: 'Create Exams',
        items: [
            { label: 'Create Offline Exams', icon: Printer, href: '/dashboard/exams/offline' },
            { label: 'Create OMR Sheets', icon: ScanLine, href: '/dashboard/exams/omr' },
            { label: 'Create Online Exams', icon: Zap, href: '/dashboard/exams/online' },
        ]
    },
    {
        title: 'Exam Master',
        items: [
            { label: 'Exam Patterns', icon: SlidersHorizontal, href: '/dashboard/exams/templates' },
            { label: 'Course Syllabus', icon: BookOpen, href: '/dashboard/syllabus' },
        ]
    },
    {
        title: 'Student Zone',
        items: [
            { label: 'Student List', icon: Users, href: '/dashboard/students' },
            { label: 'Student Migration', icon: Calendar, href: '/dashboard/tenant/academic-year' },
        ]
    },
    {
        title: 'Teacher Zone',
        items: [
            { label: 'Teacher List', icon: UsersRound, href: '/dashboard/teachers' },
            { label: 'Notes & Homework', icon: BookOpen, href: '/dashboard/material' },
            { label: 'Grade Answer Sheets', icon: Edit3, href: '/dashboard/faculty/answer-grading' },
        ]
    },
    {
        title: 'Communication',
        items: [
            { label: 'Notice Board', icon: BellRing, href: '/dashboard/messages' },
        ]
    },
    {
        title: 'Revenue and Payments',
        items: [
            { label: 'Payments & Fees', icon: Wallet, href: '/dashboard/wallet' },
        ]
    },
    {
        title: 'Reports & Analytics',
        items: [
            { label: 'Results Analytics', icon: BarChart3, href: '/dashboard/faculty/analytics/results-360' },
            { label: 'Student Report', icon: GraduationCap, href: '/dashboard/reports?type=students' },
            { label: 'Teacher Report', icon: UsersRound, href: '/dashboard/reports?type=teachers' },
            { label: 'Class & Subject Report', icon: Layers, href: '/dashboard/reports?type=class' },
            { label: 'School Report', icon: Activity, href: '/dashboard/reports?type=performance' },
        ]
    },
    {
        title: 'School/Institute Setup',
        items: [
            { label: 'Academy Setup', icon: School, href: '/dashboard/academy' },
            { label: 'Subscription', icon: CreditCard, href: '/dashboard/subscription' },
            { label: 'Institute Settings', icon: Settings2, href: '/dashboard/settings' },
        ]
    }
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [identity, setIdentity] = React.useState<any>(null)
    const [collapsed, setCollapsed] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [expandedGroup, setExpandedGroup] = React.useState<string | null>(null)

    React.useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => setIdentity(data))
    }, [])

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setSearchQuery(window.location.search)
            const onPop = () => setSearchQuery(window.location.search)
            window.addEventListener('popstate', onPop)
            return () => window.removeEventListener('popstate', onPop)
        }
    }, [pathname])

    const logoUrl = identity?.tenant?.logo_url || '/logo.png'
    const instituteName = identity?.tenant?.name || (identity ? 'BeBrilliant Platform' : 'Synchronizing...')
    const userName = identity?.fullName || (identity ? 'Authorized Staff' : 'Verifying...')
    const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

    function isActive(href: string) {
        if (href === '/dashboard') return pathname === '/dashboard'
        const [base, query] = href.split('?')
        if (query) {
            return pathname === base && searchQuery === `?${query}`
        }
        return pathname === base || (base !== '/dashboard' && pathname?.startsWith(base + '/'))
    }

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
                {NAV_GROUPS.map((group, groupIdx) => {
                    const hasGroupTitle = Boolean(group.title && group.title.trim().length > 0)
                    const isExpanded = collapsed || !hasGroupTitle || expandedGroup === group.title

                    return (
                        <div key={groupIdx} style={{ marginBottom: hasGroupTitle ? 8 : 4 }}>
                            {!collapsed && hasGroupTitle && (
                                <button
                                    type="button"
                                    onClick={() => setExpandedGroup(expandedGroup === group.title ? null : group.title)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        background: isExpanded ? 'rgba(0, 51, 100, 0.05)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: '#003364',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginBottom: 4,
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isExpanded) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 51, 100, 0.03)'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isExpanded) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                                    }}
                                >
                                    <span style={{ color: '#003364' }}>{group.title}</span>
                                    <ChevronDown
                                        size={14}
                                        style={{
                                            color: '#003364',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s ease',
                                            flexShrink: 0
                                        }}
                                    />
                                </button>
                            )}
                            {collapsed && groupIdx > 0 && (
                                <div style={{ height: 1, background: '#F1F5F9', margin: '8px 4px 12px' }} />
                            )}
                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: (!collapsed && hasGroupTitle) ? 4 : 0 }}>
                                    {group.items.map(item => {
                                        const active = isActive(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => {
                                                    const [, q] = item.href.split('?')
                                                    setSearchQuery(q ? `?${q}` : '')
                                                }}
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
                            )}
                        </div>
                    )
                })}
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
