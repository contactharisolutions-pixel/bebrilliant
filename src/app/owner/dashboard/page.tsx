'use client'

import React, { useState, useEffect } from 'react'
import {
    School, Users, Zap, GraduationCap, DollarSign,
    Bell, Search, LayoutGrid, TrendingUp, CreditCard,
    Clock, Activity, ChevronRight, BarChart4, UserPlus, Bot, ShieldAlert, Receipt, ArrowUpRight
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import { KpiCard } from '@/components/shared/institutional/KpiCard'

const CHART = [
    { name: 'Jan', rev: 40 }, { name: 'Feb', rev: 120 },
    { name: 'Mar', rev: 250 }, { name: 'Apr', rev: 450 },
    { name: 'May', rev: 850 }, { name: 'Jun', rev: 1200 },
]

function Card({ children, style = {}, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
    return (
        <div 
            className={`premium-card ${className}`}
            style={{
                background: P.card,
                border: `1px solid ${P.border}`,
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...style,
            }}
        >
            {children}
        </div>
    )
}

export default function OwnerDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [chartData, setChartData] = useState<any>(CHART)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/owner/dashboard')
                const json = await res.json()
                if (res.ok) {
                    setStats(json.stats)
                    setChartData(json.chartData)
                }
            } finally { setLoading(false) }
        }
        load()
    }, [])

    if (loading || !stats) {
        return (
            <div style={{ padding: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: P.bg }}>
                <div style={{ width: 64, height: 64, background: P.brand, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 40px ${P.brand}30` }}>
                    <Bot size={32} color="#fff" strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: P.dark, marginTop: 24, letterSpacing: '0.05em' }}>LOADING DASHBOARD...</div>
                <div style={{ fontSize: 12, color: P.muted, marginTop: 8 }}>Getting latest data</div>
            </div>
        )
    }

    return (
        <div style={{ background: P.bg, minHeight: '100%', padding: '32px 36px' }}>
           <style>{GLASS_STYLES + `
                .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>

            {/* TOPBAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Super Admin</div>
                  </div>
                    <h1 style={{ fontSize: 32, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.03em' }}>
                        Platform Dashboard
                    </h1>
                    <p style={{ fontSize: 14, color: P.muted, margin: '6px 0 0', fontWeight: 600 }}>
                        Manage your platform and all tenants.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input placeholder="Search platform..." style={{ padding: '12px 16px 12px 42px', borderRadius: 12, border: '1px solid ' + P.border, background: '#fff', fontSize: 13, width: 240, outline: 'none', fontWeight: 600 }} />
                    </div>
                    
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: P.brand, color: '#fff', border: 'none',
                        padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 850,
                        cursor: 'pointer', boxShadow: `0 8px 18px ${P.brand}35`,
                    }}>
                        <LayoutGrid size={18} />
                        Add Tenant
                    </button>
                </div>
            </div>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
                <KpiCard icon={School} title="Total Tenants" value={String(stats.totalTenants)} color={P.brand} trend="12" trendIsUp={true} />
                <KpiCard icon={Receipt} title="Revenue" value={stats.totalRevenue} color={P.success} trend="8.4" trendIsUp={true} />
                <KpiCard icon={BarChart4} title="Profit" value={stats.netCommission} color={P.cta} trend="5.2" trendIsUp={true} />
                <KpiCard icon={Users} title="Total Users" value={String(stats.ecosystemBase)} color={P.info} trend="24k" trendIsUp={true} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                <KpiCard icon={Activity} title="User Activity" value={stats.avgUsersPerNode} color={P.brand} trend="0.4" trendIsUp={true} />
                <KpiCard icon={GraduationCap} title="Exams Done" value={stats.avgExamsPerNode} color={P.info} trend="1.2" trendIsUp={true} />
                <KpiCard icon={UserPlus} title="CRM Leads" value={String(stats.activeLeads)} color={P.cta} trend="High" trendIsUp={true} />
                <KpiCard icon={ShieldAlert} title="System Health" value={stats.criticalAlerts > 0 ? String(stats.criticalAlerts) : 'Stable'} color={stats.criticalAlerts > 0 ? P.error : P.success} />
            </div>

            {/* MAIN ROW: CHART + SIDE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>

                {/* CHART */}
                <Card style={{ padding: '32px 32px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 950, color: P.dark, letterSpacing: '-0.025em' }}>Revenue Chart</div>
                            <div style={{ fontSize: 13, color: P.muted, marginTop: 4, fontWeight: 600 }}>Monthly revenue overview</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button style={{
                                background: P.bg, border: `1px solid ${P.border}`, borderRadius: 10,
                                padding: '8px 16px', fontSize: 12, fontWeight: 800, color: P.dark, cursor: 'pointer',
                            }}>View List</button>
                        </div>
                    </div>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={P.brand} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={P.brand} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} dy={12} />
                                <YAxis tick={{ fontSize: 12, fill: P.muted, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 16, border: `1px solid ${P.border}`, fontSize: 13, fontWeight: 900, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                                    cursor={{ stroke: P.brand, strokeWidth: 1.5 }}
                                />
                                <Area type="monotone" dataKey="rev" stroke={P.brand} strokeWidth={4} fill="url(#grad)" dot={{ r: 5, fill: P.brand, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
 
                {/* SIDE PANEL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
 
                    {/* ESCROW CARD */}
                    <Card style={{ 
                        textAlign: 'center', 
                        position: 'relative', 
                        overflow: 'hidden',
                        background: `linear-gradient(135deg, ${P.card} 0%, ${P.bg} 100%)` 
                    }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: P.cta, opacity: 0.05, filter: 'blur(30px)' }} />
                        
                        <div style={{
                            width: 60, height: 60, borderRadius: 18, background: P.ctaBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                            boxShadow: `0 12px 24px ${P.cta}20`
                        }}>
                            <CreditCard size={30} color={P.cta} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Pending Payouts</div>
                        <div style={{ fontSize: 40, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em', marginBottom: 8 }}>{stats.pendingPayout}</div>
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 700, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Clock size={14} /> {stats.pendingCount || 0} batches pending
                        </div>
                        <button style={{
                            width: '100%', background: P.dark, color: '#fff', border: 'none',
                            borderRadius: 16, padding: '16px 0', fontWeight: 900, fontSize: 14,
                            cursor: 'pointer', letterSpacing: '0.05em', boxShadow: `0 12px 30px rgba(0,0,0,0.15)`,
                            transition: 'all 0.3s'
                        }}>Pay Out Now</button>
                    </Card>
 
                    {/* QUICK ACTIONS */}
                    <Card style={{ flex: 1, padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ fontSize: 16, fontWeight: 950, color: P.dark }}>Quick Actions</div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.success }} className="pulse" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { icon: UserPlus, title: 'CRM Leads', sub: '8 leads pending', color: P.info, bg: P.infoBg },
                                { icon: Zap, title: 'Sync Status', sub: 'Systems connected', color: P.brand, bg: P.brandBg },
                                { icon: ShieldAlert, title: 'Health Audit', sub: 'Everything OK', color: P.error, bg: P.errorBg },
                            ].map(op => (
                                <button key={op.title} className="hover-lift" style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '12px 16px', borderRadius: 16, background: P.bg,
                                    border: `1px solid ${P.border}`, cursor: 'pointer',
                                    justifyContent: 'space-between', width: '100%'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: op.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <op.icon size={20} color={op.color} />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: 13, fontWeight: 850, color: P.dark }}>{op.title}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{op.sub}</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} color={P.muted} strokeWidth={3} />
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
  
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', background: P.dark, border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.success, boxShadow: `0 0 16px ${P.success}` }} className="pulse" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                        System Status: <span style={{ color: P.success, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Online</span>
                    </span>
                    <div style={{ height: 16, width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Uptime: 99.998%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ fontSize: 12, color: P.success, fontWeight: 900, textTransform: 'uppercase' }}>Lat: 18ms</div>
                </div>
            </Card>
        </div>
    )
}
