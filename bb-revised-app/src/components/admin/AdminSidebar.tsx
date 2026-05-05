'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, UsersRound, ClipboardList, BookOpen, BrainCircuit,
    Headset, Wallet, CreditCard, Share2, Globe, BellRing, BarChart2, Settings2, 
    Zap, LogOut, GraduationCap, School, Layers, Activity, Calendar, ScanLine, Printer,
    Home, ShieldCheck
} from 'lucide-react'

const NAV_GROUPS = [
    {
        title: 'Institute Overview',
        items: [
            { label: 'Admin Dashboard', icon: LayoutDashboard, href: '/u-admin/dashboard' },
            { label: 'Academic Reports', icon: Activity, href: '/u-admin/analytics' },
        ]
    },
    {
        title: 'Academy Management',
        items: [
            { label: 'Academy Setup', icon: School, href: '/u-admin/academy' },
            { label: 'Academic Lifecycle', icon: Calendar, href: '/dashboard/tenant/academic-year' },
            { label: 'Student List', icon: GraduationCap, href: '/u-admin/students' },
            { label: 'Teacher List', icon: UsersRound, href: '/u-admin/teachers' },
            { label: 'Help & Support', icon: Headset, href: '/u-admin/crm' },
        ]
    },
    {
        title: 'Study Material',
        items: [
            { label: 'Exams & Questions', icon: ClipboardList, href: '/dashboard/exams' },
            { label: 'Online Exam Portal', icon: Zap, href: '/dashboard/exams/online' },
            { label: 'OMR Scanner Hub', icon: ScanLine, href: '/dashboard/exams/omr' },
            { label: 'Offline Paper Engine', icon: Printer, href: '/dashboard/exams/offline' },
            { label: 'Master Knowledge Tree', icon: BookOpen, href: '/dashboard/syllabus' },
            { label: 'AI Study Hub', icon: BrainCircuit, href: '/u-admin/ai' },
        ]
    },
    {
        title: 'Accounts & Settings',
        items: [
            { label: 'Infrastructure', icon: Home, href: '/u-admin/dashboard' },
            { label: 'Lead Management', icon: Users, href: '/u-admin/crm' },
            { label: 'Master Syllabus', icon: Layers, href: '/u-admin/master-syllabus' },
            { label: 'Access Control', icon: ShieldCheck, href: '/u-admin/roles' },
        ]
    },
    {
        title: 'Affiliate Network',
        items: [
            { label: 'Partner Teachers', icon: Users, href: '/dashboard/affiliates/teachers' },
            { label: 'Student Referrals', icon: GraduationCap, href: '/dashboard/affiliates/students' },
        ]
    }
]

// PALETTE: #004B93 | #FEFEFE | #E8E8E8 | #F0A026 | #1FAC63
export function AdminSidebar() {
    const pathname = usePathname()
    const [identity, setIdentity] = React.useState<any>(null)

    React.useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => setIdentity(data))
    }, [])

    const logoUrl = identity?.tenant?.logo_url || "https://bfzlkdurgggzytegvvrw.supabase.co/storage/v1/object/public/bebrilliant/Logo2.jpeg"
    const instituteName = identity?.tenant?.name || (identity ? "BeBrilliant Platform" : "Synchronizing Hub...")
    const userName = identity?.fullName || (identity ? "Authorized Staff" : "Verifying Identity...")

    return (
        <aside style={{
            width: 280,
            minWidth: 280,
            height: '100vh',
            background: 'linear-gradient(180deg, #FEFEFE 0%, #F9FAFB 100%)',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}>

            {/* ── BRAND ── */}
            <div style={{
                height: 140,
                padding: '0 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                flexShrink: 0,
                gap: 12,
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)'
            }}>
                <img 
                    src={logoUrl} 
                    alt="Institute Logo" 
                    style={{ width: '100%', height: 'auto', maxHeight: 60, objectFit: 'contain' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', gap: 2 }}>
                    <div style={{ 
                        fontSize: 12, 
                        fontWeight: 900, 
                        color: '#004B93', 
                        letterSpacing: '-0.01em',
                        width: '100%', 
                        textAlign: 'right',
                        textTransform: 'none'
                    }}>
                        {instituteName}
                    </div>
                    <div style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: '#EF4444', 
                        letterSpacing: '0.05em', 
                        width: '100%', 
                        textAlign: 'right',
                        textTransform: 'uppercase'
                    }}>
                        {userName}
                    </div>
                </div>
            </div>

            {/* ── NAV ITEMS ── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {NAV_GROUPS.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px 12px', opacity: 0.8 }}>
                            {group.title}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {group.items.map(item => {
                                const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                return (
                                    <Link key={item.href} href={item.href} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        borderRadius: 14,
                                        textDecoration: 'none',
                                        background: active ? '#004B93' : 'transparent',
                                        color: active ? '#fff' : '#4B5563',
                                        fontWeight: active ? 700 : 600,
                                        fontSize: 13,
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: active ? '0 10px 20px rgba(0,75,147,0.15)' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                        className="nav-link-premium"
                                    >
                                        <item.icon size={18} color={active ? '#fff' : '#9CA3AF'} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                                        {active && (
                                            <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, background: '#F0A026', borderRadius: '0 4px 4px 0' }} />
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
                padding: '20px 16px',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
            }}>
                <Link href="/dashboard" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px',
                    borderRadius: 14,
                    textDecoration: 'none',
                    background: '#fff',
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: 10,
                        background: '#F1F2F4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748B'
                    }}><Zap size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Exit Command</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>To Launchpad</div>
                    </div>
                    <LogOut size={16} color="#9CA3AF" />
                </Link>
            </div>
        </aside>
    )
}
