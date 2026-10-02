'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  FileText, 
  BarChart3, 
  ShoppingBag, 
  HelpCircle, 
  LayoutDashboard, 
  Users, 
  CreditCard,
  Settings
} from 'lucide-react'

export function MobileBottomNav() {
  const pathname = usePathname()

  if (!pathname) return null

  // Hide on public landing & auth routes
  const isPublicOrAuth = 
    pathname === '/' || 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/about') || 
    pathname.startsWith('/pricing') || 
    pathname.startsWith('/contact') || 
    pathname.startsWith('/faq') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy')

  if (isPublicOrAuth) return null

  // Determine current role navigation configuration
  let navItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = []

  if (pathname.startsWith('/student')) {
    navItems = [
      { label: 'Home', href: '/student/dashboard', icon: Home },
      { label: 'My Exams', href: '/student/exams', icon: FileText },
      { label: 'Analytics', href: '/student/analytics', icon: BarChart3 },
      { label: 'Marketplace', href: '/student/marketplace', icon: ShoppingBag },
    ]
  } else if (pathname.startsWith('/teacher')) {
    navItems = [
      { label: 'Exams', href: '/teacher/exams', icon: FileText },
      { label: 'Questions', href: '/teacher/questions', icon: HelpCircle },
      { label: 'Main Portal', href: '/dashboard', icon: LayoutDashboard },
    ]
  } else if (pathname.startsWith('/parent')) {
    navItems = [
      { label: 'Home', href: '/parent', icon: Home },
      { label: 'Academics', href: '/parent?tab=academics', icon: Users },
      { label: 'Fee Treasury', href: '/parent?tab=fees', icon: CreditCard },
    ]
  } else if (pathname.startsWith('/dashboard')) {
    navItems = [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Exams', href: '/dashboard/exams', icon: FileText },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  } else {
    // Other authenticated routes
    return null
  }

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020B18]/95 border-t border-slate-800/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 ${
                isActive 
                  ? 'text-sky-400 font-medium' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-sky-500/15' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
