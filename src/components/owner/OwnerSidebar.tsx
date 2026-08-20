'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Building2,
    Users,
    TrendingUp, 
    CreditCard, 
    Share2, 
    BookOpenCheck, 
    ScrollText, 
    Globe, 
    Bot, 
    ShieldCheck, 
    BarChart4, 
    Settings2, 
    LogOut, 
    Zap, 
    School, 
    UserPlus, 
    Receipt,
    Wallet,
    MessageSquare,
    Megaphone,
    Video,
    Award,
    BarChart2
} from 'lucide-react'

const NAV_GROUPS = [
    {
        title: 'Main Dashboard',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, href: '/owner/dashboard' },
        ]
    },
    {
        title: 'Customer Lifecycle',
        items: [
            { label: 'Sales & Growth',       icon: TrendingUp,  href: '/owner/sales',       permission: 'crm.manage' },
            { label: 'CRM & Inquiries',      icon: UserPlus,    href: '/owner/crm',         permission: 'crm.manage' },
            { label: 'Demo Operations',      icon: Video,       href: '/owner/demos',       permission: 'crm.manage' },
            { label: 'Onboarding Lifecycle', icon: ShieldCheck, href: '/owner/onboarding',  permission: 'crm.manage' },
            { label: 'Training & Go-Live',   icon: Award,       href: '/owner/training',    permission: 'crm.manage' },
        ]
    },
    {
        title: 'Management Intelligence',
        items: [
            { label: 'Funnel Analytics',   icon: BarChart2, href: '/owner/analytics',  permission: 'crm.manage' },
            { label: 'Registered Tenants', icon: School,    href: '/owner/tenants',    permission: 'settings.manage' },
        ]
    },
    {
        title: 'Income & Finances',
        items: [
            { label: 'Tenant Payments', icon: Receipt, href: '/owner/payments', permission: 'payouts.manage' },
            { label: 'Tenant Balances', icon: Zap, href: '/owner/finance', permission: 'payouts.manage' },
            { label: 'Withdrawal Requests', icon: Wallet, href: '/owner/finance/payouts', permission: 'payouts.manage' },
            { label: 'Student Wallet Config', icon: CreditCard, href: '/owner/wallet-config', permission: 'payouts.manage' },
        ]
    },
    {
        title: 'Syllabus & Exams',
        items: [
            { label: 'Course Syllabus', icon: BookOpenCheck, href: '/owner/syllabus', permission: 'settings.manage' },
            { label: 'Exam Formats', icon: ScrollText, href: '/owner/exams/templates', permission: 'settings.manage' },
            { label: 'Exam Oversight', icon: ScrollText, href: '/owner/exams', permission: 'settings.manage' },
        ]
    },
    {
        title: 'Communication & Marketing',
        items: [
            { label: 'Bulk Messages',        icon: Megaphone,     href: '/owner/marketing',      permission: 'automation.manage' },
            { label: 'Message Templates',    icon: MessageSquare, href: '/owner/communications', permission: 'automation.manage' },
            { label: 'Affiliate Rewards',    icon: Users,         href: '/owner/settings/affiliate', permission: 'settings.manage' },
        ]
    },
    {
        title: 'Settings & Controls',
        items: [
            { label: 'Website Manager',       icon: Globe,         href: '/owner/cms',            permission: 'cms.manage' },
            { label: 'Commission Settings',  icon: ShieldCheck,   href: '/owner/settings/finance', permission: 'settings.manage' },
            { label: 'Subscription Plans',   icon: CreditCard,    href: '/owner/settings/plans', permission: 'settings.manage' },
            { label: 'Staff Permissions',    icon: ShieldCheck,   href: '/owner/rbac',           permission: 'settings.manage' },
            { label: 'System Settings',      icon: Settings2,     href: '/owner/settings',       permission: 'settings.manage' },
        ]
    }
]

export function OwnerSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [permissions, setPermissions] = React.useState<string[]>([])
    const [role, setRole] = React.useState<string>('owner')
    const [loading, setLoading] = React.useState<boolean>(true)

    React.useEffect(() => {
        const fetchRbac = async () => {
            try {
                const res = await fetch('/api/owner/rbac/me')
                if (res.ok) {
                    const data = await res.json()
                    setPermissions(data.permissions || [])
                    setRole(data.role || '')
                }
            } catch (err) {
                console.error('Sidebar RBAC error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchRbac()
    }, [])

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' })
            await supabase.auth.signOut()
            window.location.href = '/auth/login'
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    if (loading) {
        return (
            <aside style={{
                width: 280,
                minWidth: 280,
                height: '100vh',
                background: '#FEFEFE',
                borderRight: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>Loading navigation...</span>
            </aside>
        )
    }

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
                height: 120,
                padding: '0 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                flexShrink: 0,
                gap: 8,
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)'
            }}>
                <img 
                    src="/logo.png" 
                    alt="BeBrilliant Logo" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
                    style={{ height: 42, width: 'auto', maxWidth: '100%', objectFit: 'contain' }} 
                />
                <div style={{ 
                    fontSize: 10, 
                    fontWeight: 900, 
                    color: '#004B93', 
                    letterSpacing: '0.15em', 
                    width: '100%', 
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    {role === 'owner' ? 'Super Admin Panel' : 'Platform Staff Portal'}
                </div>
            </div>

            {/* ── NAV ITEMS ── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {NAV_GROUPS.map((group, groupIdx) => {
                    const visibleItems = group.items.filter(item => {
                        if (!item.permission) return true
                        return permissions.includes(item.permission)
                    })

                    if (visibleItems.length === 0) return null

                    return (
                        <div key={groupIdx}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px 12px', opacity: 0.8 }}>
                                {group.title}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {visibleItems.map(item => {
                                    const active = item.href === '/owner/exams' 
                                        ? pathname === '/owner/exams' 
                                        : item.href === '/owner/finance'
                                        ? (pathname === '/owner/finance' || (pathname?.startsWith('/owner/finance/') && !pathname?.startsWith('/owner/finance/payouts')))
                                        : item.href === '/owner/settings'
                                        ? pathname === '/owner/settings'
                                        : (pathname === item.href || pathname?.startsWith(item.href + '/'))
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
                    )
                })}
            </nav>

            {/* ── USER FOOTER ── */}
            <div style={{
                padding: '20px 16px',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
            }}>
                <div 
                    onClick={handleLogout}
                    className="hover-lift"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        background: '#fff',
                        border: '1px solid #F3F4F6',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                >
                    <div style={{
                        width: 40, height: 40,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #004B93 0%, #1FAC63 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 900, fontSize: 16,
                        boxShadow: '0 4px 10px rgba(0,75,147,0.1)'
                    }}>R</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Platform User</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {role === 'owner' ? 'Platform Owner' : 'Platform Staff'}
                        </div>
                    </div>
                    <LogOut size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                </div>
            </div>
        </aside>
    )
}
