'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Search,
    Sun,
    Moon,
    Bell,
    ChevronDown,
    User,
    Settings,
    LogOut,
    CheckCircle2,
    Building2,
    FileText,
    CreditCard,
    AlertCircle,
    X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NotificationItem {
    id: string
    title: string
    time: string
    read: boolean
    type: 'school' | 'billing' | 'ticket' | 'system'
}

export function OwnerHeader() {
    const router = useRouter()
    const supabase = createClient()

    // State for user data
    const [userName, setUserName] = useState<string>('Divyesh Solanki')
    const [userRole, setUserRole] = useState<string>('Super Admin')
    const [userAvatar, setUserAvatar] = useState<string>('/images/rajesh_avatar.jpg')
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false)

    // Dropdown toggles
    const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false)
    
    // Notifications state
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        { id: '1', title: 'New school registered: Bright Future School, Pune', time: '2 mins ago', read: false, type: 'school' },
        { id: '2', title: 'Subscription upgraded to Premium: Green Valley High School', time: '12 mins ago', read: false, type: 'billing' },
        { id: '3', title: 'Payment received: ₹ 50,000 from Sunrise School', time: '2 hours ago', read: false, type: 'billing' },
        { id: '4', title: 'High priority ticket opened: OMR Processing Error (#TK-1028)', time: '3 hours ago', read: false, type: 'ticket' },
        { id: '5', title: 'Quarterly Test - Std 10 OMR evaluations completed', time: '5 hours ago', read: false, type: 'system' },
    ])

    const profileRef = useRef<HTMLDivElement>(null)
    const notificationsRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLDivElement>(null)

    // Fetch dynamic user info
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch from /api/auth/me which returns authoritative fullName from DB
                const [authRes, rbacRes] = await Promise.allSettled([
                    fetch('/api/auth/me'),
                    fetch('/api/owner/rbac/me')
                ])

                if (authRes.status === 'fulfilled' && authRes.value.ok) {
                    const authData = await authRes.value.json()
                    if (authData?.fullName && authData.fullName.trim()) {
                        setUserName(authData.fullName.trim())
                    }
                    if (authData?.role) {
                        setUserRole(authData.role === 'owner' ? 'Super Admin' : 'Staff Admin')
                    }
                } else if (rbacRes.status === 'fulfilled' && rbacRes.value.ok) {
                    const rbacData = await rbacRes.value.json()
                    if (rbacData?.user?.full_name) {
                        setUserName(rbacData.user.full_name)
                    } else if (rbacData?.user?.first_name) {
                        setUserName([rbacData.user.first_name, rbacData.user.last_name].filter(Boolean).join(' '))
                    }
                    if (rbacData?.role) {
                        setUserRole(rbacData.role === 'owner' ? 'Super Admin' : 'Staff Admin')
                    }
                }
            } catch (err) {
                console.error('Failed to load user info in header:', err)
            }
        }
        fetchUserData()
    }, [])

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false)
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Logout handler
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' })
            await supabase.auth.signOut()
            window.location.href = '/auth/login'
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length

    // Quick search action
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        router.push(`/owner/tenants?q=${encodeURIComponent(searchQuery.trim())}`)
        setIsSearchFocused(false)
    }

    return (
        <header className="w-full h-16 bg-white border-b border-slate-200/90 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-xs select-none">
            {/* ── LEFT: BRAND LOGO & MOTTO ── */}
            <Link 
                href="/owner/dashboard" 
                className="flex items-center gap-3.5 group shrink-0 py-1"
            >
                <div className="relative w-11 h-9 sm:w-12 sm:h-9 flex items-center justify-center">
                    <Image
                        src="/images/edubrilliant_icon.png"
                        alt="EduBrilliant Logo"
                        width={48}
                        height={36}
                        priority
                        className="object-contain w-auto h-9 transition-transform duration-200 group-hover:scale-105"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[19px] sm:text-[20px] font-black text-[#0B2545] tracking-tight leading-tight group-hover:text-[#0284C7] transition-colors">
                        EduBrilliant
                    </span>
                    <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-0.5">
                        Empowering Education Together
                    </span>
                </div>
            </Link>

            {/* ── CENTER: SLEEK SEARCH BAR ── */}
            <div ref={searchRef} className="flex-1 max-w-xl lg:max-w-2xl mx-4 sm:mx-8 relative hidden md:block">
                <form onSubmit={handleSearchSubmit}>
                    <div className={`relative flex items-center w-full bg-white border rounded-2xl transition-all duration-200 px-4 py-2 ${
                        isSearchFocused 
                            ? 'border-sky-500 shadow-sm ring-2 ring-sky-100' 
                            : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}>
                        <Search size={17} className={`mr-2.5 shrink-0 transition-colors ${
                            isSearchFocused ? 'text-sky-600' : 'text-slate-400'
                        }`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            placeholder="Search schools, users, reports..."
                            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </form>

                {/* Quick Search Preview Dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3.5 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Search Results for &ldquo;{searchQuery}&rdquo;
                        </div>
                        <div className="flex flex-col">
                            <button
                                onClick={() => {
                                    router.push(`/owner/tenants?q=${encodeURIComponent(searchQuery)}`)
                                    setIsSearchFocused(false)
                                }}
                                className="flex items-center gap-3 px-4 py-2 text-left hover:bg-sky-50/70 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors"
                            >
                                <Building2 size={15} className="text-sky-600 shrink-0" />
                                <span>Search Schools for &ldquo;{searchQuery}&rdquo;</span>
                            </button>
                            <button
                                onClick={() => {
                                    router.push(`/owner/crm?q=${encodeURIComponent(searchQuery)}`)
                                    setIsSearchFocused(false)
                                }}
                                className="flex items-center gap-3 px-4 py-2 text-left hover:bg-sky-50/70 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors"
                            >
                                <User size={15} className="text-emerald-600 shrink-0" />
                                <span>Search Users / Leads for &ldquo;{searchQuery}&rdquo;</span>
                            </button>
                            <button
                                onClick={() => {
                                    router.push(`/owner/exams?q=${encodeURIComponent(searchQuery)}`)
                                    setIsSearchFocused(false)
                                }}
                                className="flex items-center gap-3 px-4 py-2 text-left hover:bg-sky-50/70 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors"
                            >
                                <FileText size={15} className="text-purple-600 shrink-0" />
                                <span>Search Exams & Reports for &ldquo;{searchQuery}&rdquo;</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: CONTROLS & USER PROFILE ── */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    aria-label="Toggle Theme"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                    {isDarkMode ? (
                        <Moon size={19} strokeWidth={2} />
                    ) : (
                        <Sun size={19} strokeWidth={2} />
                    )}
                </button>

                {/* Notifications Bell */}
                <div ref={notificationsRef} className="relative">
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        aria-label="Notifications"
                        title="Notifications"
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                    >
                        <Bell size={20} strokeWidth={2} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown Panel */}
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                        {unreadCount} New
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                                    }}
                                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-800"
                                >
                                    Mark all read
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                                {notifications.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                                            !item.read ? 'bg-sky-50/40' : ''
                                        }`}
                                    >
                                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                            {item.type === 'school' && <Building2 size={14} />}
                                            {item.type === 'billing' && <CreditCard size={14} />}
                                            {item.type === 'ticket' && <AlertCircle size={14} className="text-rose-500" />}
                                            {item.type === 'system' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-800 font-medium leading-snug">
                                                {item.title}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">
                                                {item.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 px-4 border-t border-slate-100 text-center">
                                <Link
                                    href="/owner/dashboard"
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                                >
                                    View Activity Stream →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-[1px] bg-slate-200 mx-0.5 hidden sm:block" />

                {/* User Profile Dropdown */}
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer group border border-transparent hover:border-slate-200"
                    >
                        {/* Avatar */}
                        <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200/80 shadow-xs">
                            <Image
                                src={userAvatar}
                                alt={userName}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        {/* Name & Role */}
                        <div className="text-left hidden sm:flex flex-col">
                            <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-sky-600 transition-colors">
                                {userName}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                                {userRole}
                            </span>
                        </div>

                        {/* Dropdown Chevron */}
                        <ChevronDown 
                            size={14} 
                            className={`text-slate-400 transition-transform duration-200 ml-0.5 ${
                                isProfileOpen ? 'rotate-180 text-slate-700' : ''
                            }`} 
                        />
                    </button>

                    {/* Profile Menu Popup */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <div className="text-xs font-bold text-slate-900">{userName}</div>
                                <div className="text-[10.5px] text-slate-500">{userRole}</div>
                            </div>

                            <div className="py-1">
                                <Link
                                    href="/owner/settings"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                                >
                                    <Settings size={15} />
                                    <span>System Settings</span>
                                </Link>
                                <Link
                                    href="/owner/rbac"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                                >
                                    <User size={15} />
                                    <span>Roles & Permissions</span>
                                </Link>
                            </div>

                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                                >
                                    <LogOut size={15} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
