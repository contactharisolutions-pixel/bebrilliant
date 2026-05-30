'use client'
import React, { useEffect, useState } from 'react'
import {
    TrendingUp,
    CreditCard,
    Zap,
    History,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    DollarSign,
    ExternalLink,
    Loader2,
    Activity,
    ArrowRight,
    Search,
    Filter,
    Layers,
    ShieldCheck
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
// â”€â”€ PALETTE â”” MATCHING INSTITUTIONAL SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const P = {
    bg: '#F7F8FA', card: '#FEFEFE', border: '#E8E8E8',
    brand: '#004B93', brandBg: '#004B9315',
    cta: '#F0A026', ctaBg: '#FFF4E5',
    dark: '#1B1D21', text: '#5A5A5A', muted: '#A5A2A6', hover: '#F1F2F4',
    success: '#1FAC63', successBg: '#1FAC6310',
    warning: '#F59E0B', warningBg: '#FFFBEB',
    error: '#EF4444', errorBg: '#FEF2F2',
    info: '#3B82F6', infoBg: '#EFF6FF',
}
// STATS KPI CARD COMPONENT
const StatCard = ({ label, value, icon: Icon, change, trend, color = P.brand }: any) => (
    <div className="glass-card hover-lift" style={{
        padding: '32px',
        borderRadius: 28,
        border: `1px solid ${P.border}`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `${color}08`, borderRadius: '50%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
                width: 58, height: 58,
                borderRadius: 18,
                background: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color
            }}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
            {change && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 900,
                    padding: '8px 14px', borderRadius: 12,
                    background: trend === 'up' ? P.successBg : P.errorBg,
                    color: trend === 'up' ? P.success : P.error,
                    letterSpacing: '0.02em',
                    boxShadow: `0 4px 12px ${trend === 'up' ? P.success : P.error}15`
                }}>
                    {trend === 'up' ? <ArrowUpRight size={15} strokeWidth={3} /> : <ArrowDownRight size={15} strokeWidth={3} />}
                    {change}
                </div>
            )}
        </div>
        <div>
            <div style={{ fontSize: 13, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
            <div style={{ fontSize: 36, fontWeight: 950, color: P.dark, marginTop: 8, letterSpacing: '-0.05em' }}>{value}</div>
        </div>
    </div>
)
export default function FinanceDashboard() {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        fetch('/api/owner/finance/stats')
            .then(res => res.json())
            .then(json => {
                setData(json)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Error fetching finance stats:', err)
                setIsLoading(false)
            })
    }, [])
    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: P.bg }}>
            <Loader2 size={40} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    )
    const stats = data?.stats || { totalRevenue: 0, commissionEarned: 0, activeSubscriptions: 0, pendingPayouts: 0 }
    return (
        <div style={{ padding: '40px 48px', minHeight: '100vh', background: P.bg, position: 'relative' }}>
            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: P.brandBg, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Treasury Intel</div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                        <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Master Financial Flow</div>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 950, color: P.dark, margin: 0, letterSpacing: '-0.04em' }}>Financial Overview</h1>
                    <p style={{ fontSize: 15, color: P.muted, margin: '8px 0 0', fontWeight: 600 }}>High-fidelity control for ecosystem revenue, tenant commissions, and liquid capital distribution.</p>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                    <button onClick={() => window.location.href = '/owner/finance/payouts'} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, background: P.brand, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: `0 12px 24px ${P.brand}30` }}>
                        <Wallet size={20} strokeWidth={2.5} /> Authorize Distributions
                    </button>
                </div>
            </header>
            {/* KPI GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
                marginBottom: 40
            }}>
                <StatCard label="Total Ecosystem Revenue" value={`\u20B9${stats.totalRevenue?.toLocaleString()}`} icon={DollarSign} color={P.brand} />
                <StatCard label="Subscription Revenue" value={`\u20B9${(stats.breakdown?.subscription || 0).toLocaleString()}`} icon={Layers} color={P.info} />
                <StatCard label="Exam Fee Revenue" value={`\u20B9${(stats.breakdown?.exam || 0).toLocaleString()}`} icon={Zap} color={P.warning} />
                <StatCard label="Wallet Purchases" value={`\u20B9${(stats.breakdown?.wallet || 0).toLocaleString()}`} icon={Wallet} color={P.success} />
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 24,
                marginBottom: 48
            }}>
                <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 28, border: `1px solid ${P.border}`, background: 'linear-gradient(135deg, #1FAC63 0%, #15803d 100%)', color: '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Entity Net Profit (Owner)</div>
                    <div style={{ fontSize: 44, fontWeight: 1000, marginTop: 8 }}>\u20B9{stats.netProfit?.toLocaleString()}</div>
                    <div style={{ fontSize: 12, marginTop: 16, fontWeight: 600, opacity: 0.7 }}>Derived from 100% Subscription + Commissions on Exam/Wallet</div>
                </div>
                <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 28, border: `1px solid ${P.border}`, background: '#FFF' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: P.muted }}>Total Distributed (Tenant Shares)</div>
                    <div style={{ fontSize: 44, fontWeight: 1000, marginTop: 8, color: P.dark }}>\u20B9{(stats.totalRevenue - stats.netProfit).toLocaleString()}</div>
                    <div style={{ fontSize: 12, marginTop: 16, fontWeight: 700, color: P.brand }}>{stats.pendingPayouts > 0 ? `\u20B9${stats.pendingPayouts.toLocaleString()} Currently Pending Settlement` : 'All shares settled locally'}</div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
                {/* RECENT TRANSACTIONS */}
                <div className="glass-card" style={{ border: `1px solid ${P.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                    <div style={{ padding: '28px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: P.bg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={22} color={P.brand} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>Master Transaction Log</h3>
                                <div style={{ fontSize: 12, color: P.muted, fontWeight: 650, marginTop: 2 }}>Audit ecosystem revenue flow and tenant settlements</div>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = '/owner/finance/commissions'} className="hover-lift" style={{ background: '#fff', border: `1px solid ${P.border}`, color: P.dark, fontWeight: 850, fontSize: 13, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            Treasury Controls <ArrowRight size={16} strokeWidth={2.5} color={P.brand} />
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: P.bg }}>
                                    <th style={{ padding: '16px 32px', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity Node</th>
                                    <th style={{ padding: '16px 32px', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Class</th>
                                    <th style={{ padding: '16px 32px', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Flow</th>
                                    <th style={{ padding: '16px 32px', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '16px 32px', fontSize: 11, fontWeight: 850, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.recentPayments?.map((p: any) => (
                                    <tr key={p.id} style={{ borderBottom: `1px solid ${P.bg}`, transition: 'all 0.2s' }}>
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: P.dark }}>{p.tenants?.name || 'Institutional Root'}</div>
                                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginTop: 2 }}>ID: {p.id.slice(0, 8)}</div>
                                        </td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900,
                                                background: P.brandBg, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.03em'
                                            }}>{p.type}</span>
                                        </td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: P.dark }}>\u20B9{p.amount?.toLocaleString()}</div>
                                        </td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'success' ? P.success : P.warning }} />
                                                <span style={{ fontSize: 13, fontWeight: 750, color: p.status === 'success' ? P.success : P.warning }}>
                                                    {p.status === 'success' ? 'Settled' : 'In Progress'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 32px', fontSize: 13, fontWeight: 600, color: P.muted }}>
                                            {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!data?.recentPayments || data.recentPayments.length === 0) && (
                            <div style={{ padding: '100px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 28, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${P.border}` }}>
                                    <History size={36} color={P.muted} strokeWidth={1.5} />
                                </div>
                                <div style={{ maxWidth: 320 }}>
                                    <div style={{ fontSize: 18, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>No transactions detected</div>
                                    <div style={{ fontSize: 14, color: P.muted, marginTop: 8, fontWeight: 600, lineHeight: 1.5 }}>Analytics will populate as billing cycles complete and revenue enters the master log.</div>
                                </div>
                                <button className="hover-lift" style={{ marginTop: 12, padding: '12px 24px', borderRadius: 12, background: P.brandBg, border: `1px solid ${P.brand}30`, color: P.brand, fontSize: 14, fontWeight: 850 }}>Initialize Manual Sync</button>
                            </div>
                        )}
                    </div>
                </div>
                {/* SIDE COLUMN: INVOICES & QUICK ACTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ border: `1px solid ${P.border}`, borderRadius: 24, padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: P.ctaBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={20} color={P.cta} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: P.dark }}>Recent Artifacts</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {data?.recentInvoices?.map((inv: any) => (
                                <div key={inv.id} className="hover-lift" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px', borderRadius: 16, background: P.bg, border: `1px solid ${P.border}` }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: P.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: P.muted, border: `1px solid ${P.border}`
                                    }}>
                                        <FileText size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 850, color: P.dark }}>#{inv.id.slice(-6).toUpperCase()}</div>
                                        <div style={{ fontSize: 11, fontWeight: 650, color: P.muted, marginTop: 2 }}>{inv.tenants?.name}</div>
                                    </div>
                                    <div style={{ fontWeight: 950, color: P.brand, fontSize: 14 }}>\u20B9{inv.amount}</div>
                                </div>
                            ))}
                            {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={20} color={P.muted} />
                                    </div>
                                    <div style={{ fontSize: 13, color: P.muted, fontWeight: 700, letterSpacing: '0.02em' }}>No artifacts detected</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="glass-card" style={{
                        background: `linear-gradient(135deg, ${P.brand}, ${P.dark})`,
                        borderRadius: 24, padding: '32px', color: '#fff', boxShadow: `0 20px 40px ${P.brand}25`, position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' }}>
                            <ShieldCheck size={24} color={P.cta} strokeWidth={2.5} />
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Commission Logic</h3>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 24, fontWeight: 500, position: 'relative' }}>
                            Optimize ecosystem performance by adjusting global commission rules or restructuring subscription plans.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                            <button className="hover-lift" style={{
                                width: '100%', padding: '14px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer'
                            }}>Configure Commissions</button>
                            <button className="hover-lift" style={{
                                width: '100%', padding: '14px', borderRadius: 12,
                                background: '#fff', border: 'none',
                                color: P.brand, fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                            }}>Evolve License Plans</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
