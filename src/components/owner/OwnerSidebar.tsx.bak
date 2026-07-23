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
    Wallet, 
    School, 
    UserPlus, 
    Receipt,
    Printer,
    ScanLine
} from 'lucide-react'

const NAV_GROUPS = [
    {
        title: 'Platform Statistics',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, href: '/owner/dashboard' },
            { label: 'Reports & Analytics', icon: BarChart4, href: '/owner/analytics' },
        ]
    },
    {
        title: 'Institute Management',
        items: [
            { label: 'My Institutes', icon: School, href: '/owner/tenants' },
            { label: 'Inquiries (CRM)', icon: UserPlus, href: '/owner/crm' },
            { label: 'Business Growth', icon: TrendingUp, href: '/owner/sales' },
        ]
    },
    {
        title: 'Fees & Payments',
        items: [
            { label: 'Revenue Ledger', icon: Receipt, href: '/owner/payments' },
            { label: 'Institute Wallet', icon: Zap, href: '/owner/finance' },
            { label: 'Payouts', icon: Wallet, href: '/owner/finance/payouts' },
            { label: 'Wallet Credit Settings', icon: CreditCard, href: '/owner/wallet-config' },
        ]
    },
    {
        title: 'Academic Material',
        items: [
            { label: 'Master Syllabus', icon: BookOpenCheck, href: '/owner/syllabus' },
            { label: 'Paper Pattern Templates', icon: ScrollText, href: '/owner/exams/templates' },
            { label: 'Master Question Bank', icon: ScrollText, href: '/owner/exams' },
        ]
    },
    {
        title: 'Infrastructure',
        items: [
            { label: 'Website CMS',          icon: Globe,        href: '/owner/cms' },
            { label: 'Panel Automation',      icon: Bot,          href: '/owner/automation' },
            { label: 'Commission Rules',      icon: ShieldCheck,  href: '/owner/settings/finance' },
            { label: 'Price Plans',           icon: CreditCard,   href: '/owner/settings/plans' },
            { label: 'WhatsApp Templates',    icon: Share2,       href: '/owner/whatsapp-config' },
            { label: 'Affiliates',            icon: Users,        href: '/owner/settings/affiliate' },
            { label: 'Global Settings',       icon: Settings2,    href: '/owner/settings' },
        ]
    }
]

// PALETTE: #FEFEFE | #E8E8E8 | #F0A026 | #A5A2A6 | #004B93 | #1B1D21
export function OwnerSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/auth/login')
            router.refresh()
        } catch (error) {
            console.error('Logout failed:', error)
        }
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
                    src="https://bfzlkdurgggzytegvvrw.supabase.co/storage/v1/object/public/bebrilliant/Logo2.jpeg" 
                    alt="BeBrilliant Logo" 
                    style={{ height: 38, width: 'auto', maxWidth: '100%', objectFit: 'contain' }} 
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
                    Super Admin Panel
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
                                // Fix: Use exact match for '/owner/exams' to avoid collision with '/owner/exams/templates'
                                const active = item.href === '/owner/exams' 
                                    ? pathname === '/owner/exams' 
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
                ))}
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
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Super Admin</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Owner</div>
                    </div>
                    <LogOut size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                </div>
            </div>
        </aside>
    )
}
