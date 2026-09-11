'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    TrendingUp, 
    CreditCard, 
    BookOpenCheck, 
    ScrollText, 
    Globe, 
    ShieldCheck, 
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
    ChevronRight,
    Users
} from 'lucide-react'

interface NavItem {
    label: string
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
    href: string
    permission?: string
}

interface NavGroup {
    title: string
    items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
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
            { label: 'Registered Tenants', icon: School, href: '/owner/tenants', permission: 'settings.manage' },
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
            <aside className="w-[280px] min-w-[280px] h-full bg-gradient-to-b from-[#023E68] via-[#002D4E] to-[#001B30] border-r border-white/10 flex items-center justify-center">
                <span className="text-xs text-sky-200/60 font-semibold animate-pulse">Loading navigation...</span>
            </aside>
        )
    }

    return (
        <aside className="w-[280px] min-w-[280px] h-full bg-gradient-to-b from-[#023E68] via-[#002C4D] to-[#00182B] border-r border-white/10 flex flex-col overflow-hidden shadow-2xl relative select-none">
            {/* Ambient Background Wave / Glow Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_60%)] pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_at_bottom,rgba(13,148,136,0.18),transparent_70%)] pointer-events-none" />

            {/* ── NAV ITEMS LIST ── */}
            <nav className="relative z-10 flex-1 overflow-y-auto px-3.5 py-3.5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {NAV_GROUPS.map((group, groupIdx) => {
                    const visibleItems = group.items.filter(item => {
                        if (!item.permission) return true
                        return permissions.includes(item.permission)
                    })

                    if (visibleItems.length === 0) return null

                    return (
                        <div key={groupIdx}>
                            {groupIdx > 0 && (
                                <div className="text-[10px] font-extrabold text-sky-200/40 uppercase tracking-[0.14em] px-3 pb-2 pt-1">
                                    {group.title}
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                {visibleItems.map(item => {
                                    const active = item.href === '/owner/exams' 
                                        ? pathname === '/owner/exams' 
                                        : item.href === '/owner/finance'
                                        ? (pathname === '/owner/finance' || (pathname?.startsWith('/owner/finance/') && !pathname?.startsWith('/owner/finance/payouts')))
                                        : item.href === '/owner/settings'
                                        ? pathname === '/owner/settings'
                                        : (pathname === item.href || pathname?.startsWith(item.href + '/'))

                                    return (
                                        <Link 
                                            key={item.href} 
                                            href={item.href}
                                            className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative overflow-hidden ${
                                                active 
                                                    ? 'bg-gradient-to-r from-[#0284C7] to-[#0D9488] text-white shadow-[0_4px_16px_rgba(2,132,199,0.38)]'
                                                    : 'text-white/80 hover:text-white hover:bg-white/[0.08]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <item.icon 
                                                    size={17} 
                                                    strokeWidth={active ? 2.5 : 2}
                                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                                        active ? 'text-white' : 'text-white/70 group-hover:text-white'
                                                    }`}
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </div>

                                            {/* Submenu / Drilldown indicator */}
                                            {groupIdx > 0 && (
                                                <ChevronRight 
                                                    size={14} 
                                                    className={`shrink-0 transition-transform duration-200 ${
                                                        active 
                                                            ? 'text-white/90 translate-x-0.5' 
                                                            : 'text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5'
                                                    }`}
                                                />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {/* ── BUILDING BRIGHTER FUTURES GRAPHIC BANNER ── */}
                <div className="mt-4 rounded-2xl overflow-hidden relative shadow-lg border border-white/10 bg-[#00223D] h-[180px] shrink-0 flex flex-col justify-end p-4">
                    {/* Background Illustration */}
                    <div className="absolute inset-0">
                        <Image
                            src="/images/sidebar_graduation_art.jpg"
                            alt="Building Brighter Futures"
                            fill
                            className="object-cover object-[center_55%] opacity-90"
                            priority
                        />
                        {/* Smooth gradient blend overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001424] via-[#001424]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#001424]/90 via-transparent to-transparent" />
                    </div>

                    {/* Headline Typography */}
                    <div className="relative z-10">
                        <div className="text-white font-black text-lg leading-[1.15] tracking-tight drop-shadow-md">
                            Building<br />
                            Brighter<br />
                            Futures
                        </div>
                    </div>
                </div>
            </nav>
        </aside>
    )
}
